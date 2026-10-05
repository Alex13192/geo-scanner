/**
 * Everything that touches the subscribers table.
 *
 * The API routes and the weekly cron both go through this file, so the SQL exists once.
 * That matters more here than usual: two of these statements carry the `status` filter that
 * decides who may be emailed, and a second hand-written copy of that filter is exactly how
 * an unsubscribed address gets mailed anyway.
 *
 * Every function takes `db` rather than reaching for a global. The binding lives in the
 * request context, and a module-level import of it would work in the Worker and fail in
 * every test.
 */

export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed" | "bounced";

export type Subscriber = {
  id: string;
  domain: string;
  email: string;
  status: SubscriberStatus;
  created_at: number;
  confirmed_at: number | null;
  last_scan_at: number | null;
  last_score: number | null;
  last_grade: string | null;
  /**
   * Selected so the weekly report can carry a working unsubscribe link.
   *
   * Optional because most callers have no use for it - the confirmation route and the producer
   * would only be handed a secret they do not need. The consumer is the one place that must
   * have it, and an `undefined` there produces an unsubscribe URL that silently does nothing,
   * which is the worst possible failure for this particular link.
   */
  unsub_token?: string;
};

export type CreateOutcome =
  | { ok: true; subscriber: Subscriber; created: boolean }
  | { ok: false; reason: "already_subscribed" };

/*
 * unsub_token is in this list because the weekly report has to carry a working unsubscribe
 * link, and an undefined token there would produce a URL that silently does nothing - the
 * worst possible failure for that particular link. Every other caller ignores the column.
 */
const COLUMNS =
  "id, domain, email, status, created_at, confirmed_at, last_scan_at, last_score, last_grade, unsub_token";

/**
 * Write a pending row, or report that the address is already confirmed.
 *
 * WHY THIS IS AN UPSERT RATHER THAN AN INSERT THAT MAY FAIL: an address that signed up,
 * never clicked, and signed up again is the common case, and the unique index excludes only
 * unsubscribed rows - so a plain INSERT would collide on the second attempt and report a
 * failure for something that should quietly re-send the confirmation. A re-signup that has
 * already confirmed is returned as `already_subscribed` instead of being written again, so
 * the endpoint can answer the same way whether or not the caller is the owner of the
 * address. That is the only response that does not turn this endpoint into a way to test
 * whether a given address is subscribed.
 */
export async function createPending(
  db: D1DatabaseLike,
  input: { domain: string; email: string; id: string; confirmToken: string; unsubToken: string; now: number }
): Promise<CreateOutcome> {
  const existing = await findByEmailAndDomain(db, input.email, input.domain);

  if (existing?.status === "confirmed") {
    return { ok: false, reason: "already_subscribed" };
  }

  if (existing) {
    // pending, unsubscribed or bounced: reuse the row, refresh both tokens, and reset the
    // status to pending so the confirmation has to happen again for a new address.
    await db
      .prepare(
        `UPDATE subscribers
            SET status = 'pending', confirm_token = ?1, unsub_token = ?2, created_at = ?3,
                confirmed_at = NULL
          WHERE id = ?4`
      )
      .bind(input.confirmToken, input.unsubToken, input.now, existing.id)
      .run();

    return {
      ok: true,
      created: false,
      subscriber: {
        ...existing,
        status: "pending",
        confirmed_at: null,
        created_at: input.now,
      },
    };
  }

  await db
    .prepare(
      `INSERT INTO subscribers (id, domain, email, status, confirm_token, unsub_token, created_at)
       VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6)`
    )
    .bind(input.id, input.domain, input.email, input.confirmToken, input.unsubToken, input.now)
    .run();

  return {
    ok: true,
    created: true,
    subscriber: {
      id: input.id,
      domain: input.domain,
      email: input.email,
      status: "pending",
      created_at: input.now,
      confirmed_at: null,
      last_scan_at: null,
      last_score: null,
      last_grade: null,
    },
  };
}

export async function findByEmailAndDomain(
  db: D1DatabaseLike,
  email: string,
  domain: string
): Promise<Subscriber | null> {
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM subscribers
        WHERE email = ?1 AND domain = ?2 AND status != 'unsubscribed'
        LIMIT 1`
    )
    .bind(email, domain)
    .first<Subscriber>();
}

/**
 * Exchange a confirmation token, and report whether it did anything.
 *
 * Idempotent on purpose: mail clients and link scanners fetch a URL more than once, and a
 * second visit to a confirmation link should show the same success page rather than an
 * error about a token that has already been used.
 */
export async function confirmByToken(
  db: D1DatabaseLike,
  token: string,
  now: number
): Promise<Subscriber | null> {
  const row = await db
    .prepare(`SELECT ${COLUMNS} FROM subscribers WHERE confirm_token = ?1 LIMIT 1`)
    .bind(token)
    .first<Subscriber>();

  if (!row) return null;
  if (row.status === "confirmed") return row;
  if (row.status === "unsubscribed") return row;

  await db
    .prepare(`UPDATE subscribers SET status = 'confirmed', confirmed_at = ?1 WHERE id = ?2`)
    .bind(now, row.id)
    .run();

  return { ...row, status: "confirmed", confirmed_at: now };
}

/**
 * Unsubscribe, and never report whether the token was real.
 *
 * ADDRESS-WIDE, NOT ROW-WIDE, and this was wrong in the first version. It updated the one
 * row the token belonged to, while the confirmation email promised that the link would
 * "stop any future message to this address permanently". An address subscribed to two
 * domains therefore kept receiving one of them after asking not to, which is the single
 * fastest way for a new sending domain to be reported as spam - and the promise in the
 * message is the contract, so the behaviour moves rather than the wording.
 *
 * The cost, stated rather than discovered: somebody genuinely monitoring two domains who
 * unsubscribes from one stops both. At this stage that is the right way round - the schema
 * allows one address per domain, and nothing else in the product lets a reader choose which
 * of their subscriptions to end.
 *
 * Rows are marked, never deleted. The withdrawal has to survive for the same reason the
 * unsubscribe route cannot answer "was this token real": a record of when somebody asked to
 * stop is what a privacy request is answered from.
 */
export async function unsubscribeByToken(db: D1DatabaseLike, token: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT email FROM subscribers WHERE unsub_token = ?1 LIMIT 1`)
    .bind(token)
    .first<{ email: string }>();

  if (!row) return false;

  await db
    .prepare(`UPDATE subscribers SET status = 'unsubscribed' WHERE email = ?1`)
    .bind(row.email)
    .run();

  return true;
}

/** What the weekly cron starts from. Confirmed only - the filter is the point of this file. */
export async function listConfirmed(db: D1DatabaseLike, limit: number): Promise<Subscriber[]> {
  const result = await db
    .prepare(
      `SELECT ${COLUMNS} FROM subscribers
        WHERE status = 'confirmed'
        ORDER BY COALESCE(last_scan_at, 0) ASC
        LIMIT ?1`
    )
    .bind(limit)
    .all<Subscriber>();

  return result.results ?? [];
}

/**
 * Re-read one subscriber at the moment of the scan.
 *
 * The queue message carries an id rather than a row, so this is what the consumer calls
 * instead of trusting a snapshot taken when the batch was built. Between those two moments a
 * reader can unsubscribe, and emailing them anyway is the one mistake this product cannot
 * afford to make twice.
 */
export async function getById(db: D1DatabaseLike, id: string): Promise<Subscriber | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM subscribers WHERE id = ?1 LIMIT 1`)
    .bind(id)
    .first<Subscriber>();
}

export type ScanRecord = {
  id: string;
  subscriber_id: string;
  at: number;
  score: number;
  grade: string;
  checks_passed: number;
  checks_run: number;
  /** JSON array of check ids, as stored. */
  failed_check_ids: string;
};

/** The previous run, which is the only reason the scans table exists. */
export async function latestScan(db: D1DatabaseLike, subscriberId: string): Promise<ScanRecord | null> {
  return db
    .prepare(`SELECT * FROM scans WHERE subscriber_id = ?1 ORDER BY at DESC LIMIT 1`)
    .bind(subscriberId)
    .first<ScanRecord>();
}

/**
 * Write the run and update the denormalised columns in one batch.
 *
 * Both statements or neither. A scan row without the subscriber's last_score would make next
 * week's report compare against a score the subscriber was never shown, and the reverse would
 * lose the history the comparison needs. D1's batch is one transaction, which is what makes
 * that guarantee available for the price of a single call.
 */
export async function recordScan(
  db: D1DatabaseLike,
  input: {
    id: string;
    subscriberId: string;
    at: number;
    score: number;
    grade: string;
    checksPassed: number;
    checksRun: number;
    failedCheckIds: string[];
  }
): Promise<void> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO scans (id, subscriber_id, at, score, grade, checks_passed, checks_run, failed_check_ids)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        input.id,
        input.subscriberId,
        input.at,
        input.score,
        input.grade,
        input.checksPassed,
        input.checksRun,
        JSON.stringify(input.failedCheckIds)
      ),
    db
      .prepare(`UPDATE subscribers SET last_scan_at = ?1, last_score = ?2, last_grade = ?3 WHERE id = ?4`)
      .bind(input.at, input.score, input.grade, input.subscriberId),
  ]);
}

/**
 * Mark an address the provider refused permanently.
 *
 * Distinct from unsubscribed on purpose - see the note at the top of the migration. A bounce
 * is an address that stopped existing; it has to stop the sending without recording that
 * somebody asked to stop.
 */
export async function markBounced(db: D1DatabaseLike, id: string): Promise<void> {
  await db.prepare(`UPDATE subscribers SET status = 'bounced' WHERE id = ?1`).bind(id).run();
}
