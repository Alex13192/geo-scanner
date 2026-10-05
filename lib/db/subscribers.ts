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
};

export type CreateOutcome =
  | { ok: true; subscriber: Subscriber; created: boolean }
  | { ok: false; reason: "already_subscribed" };

const COLUMNS =
  "id, domain, email, status, created_at, confirmed_at, last_scan_at, last_score, last_grade";

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
