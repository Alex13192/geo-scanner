/**
 * The suite for the report-link payload, and for the thing that makes it safe to forward.
 *
 * WHY THIS EXISTS AT ALL: /monitor/report/<token>/ is the first page in this project that is
 * addressed by a secret rather than by a domain, and the rules around it are the kind that fail
 * silently - a token that resolves for a subscription that ended, a "failing since" date that
 * resets every week and makes a six-week-old problem look new, a payload that leaks the email
 * address into a page somebody forwards to a school. None of those produce an error anywhere. They
 * produce a page that looks correct.
 *
 * Run: npm run test:report-link
 */
import assert from "node:assert/strict";

import { buildReportPayload, historySince, HISTORY_DAYS, type ScanRow } from "../lib/monitor/report.ts";
import { confirmSubscription } from "../lib/subscribe/landing.ts";
import { reportUrl } from "../lib/subscribe/flow.ts";
import { confirmationEmail, reportEmail } from "../lib/email/messages.ts";
import { CONTACT_EMAIL, SITE_URL } from "../lib/site.ts";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 5, 12, 0, 0); // 5 October 2026
const SITE = "https://example.test";

/** A row as the runner writes one. `failed` is the stored JSON text, not an array. */
function row(weeksAgo: number, failed: string[], score: number): ScanRow {
  return {
    at: NOW - weeksAgo * 7 * DAY,
    score,
    grade: score >= 90 ? "A" : score >= 70 ? "C" : "F",
    checks_passed: 40 - failed.length,
    checks_run: 40,
    failed_check_ids: JSON.stringify(failed),
  };
}

const copy = new Map([
  ["hreflang", { title: "Alternate language versions are declared", fix: "Declare hreflang." }],
  ["markdown-alternate", { title: "A markdown alternate is declared", fix: "Publish a markdown version." }],
]);

const results: string[] = [];
/*
 * `fn` may be async, and it has to be: the confirmation flow is a database read followed by a
 * database write, so a synchronous check would pass before its assertions ran and report a green
 * suite for a redirect that never happened. That is not a hypothetical - the first version of this
 * section asserted the redirect outside the harness entirely and printed nothing at all.
 */
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push(`  PASS  ${name}`);
  } catch (err) {
    results.push(`  FAIL  ${name}\n        ${(err as Error).message.split("\n")[0]}`);
    process.exitCode = 1;
  }
}

check("the payload is built from the rows and invents nothing", () => {
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(1, ["hreflang"], 96), row(0, ["hreflang", "markdown-alternate"], 97)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.equal(p.domain, "example.test");
  assert.equal(p.latest?.score, 97);
  assert.equal(p.runs, 2);
  assert.equal(p.history.length, 2);
  // Newest first, whatever order the query returned them in.
  assert.equal(p.history[0].score, 97);
  assert.equal(p.history[1].score, 96);
});

check("history is sorted newest-first even when the rows arrive oldest-first", () => {
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(3, [], 80), row(0, [], 90), row(1, [], 85)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.deepEqual(
    p.history.map((h) => h.score),
    [90, 85, 80]
  );
  assert.equal(p.windowFrom, new Date(NOW - 3 * 7 * DAY).toISOString());
  assert.equal(p.windowTo, new Date(NOW).toISOString());
});

check("a check failing in every run reports the OLDEST failing date, not the latest", () => {
  // This is the whole point of the page. A "failing since" that reset each week would make a
  // six-week-old problem read as new, which is the opposite of what a monitoring report is for.
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(6, ["hreflang"], 90), row(3, ["hreflang"], 92), row(0, ["hreflang"], 97)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  const hreflang = p.failing.find((f) => f.id === "hreflang");
  assert.ok(hreflang, "hreflang should be reported as failing");
  assert.equal(hreflang.failingSince, new Date(NOW - 6 * 7 * DAY).toISOString());
  assert.equal(hreflang.failedRuns, 3);
});

check("a check that failed, was fixed and broke again reports the most recent break", () => {
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(4, ["hreflang"], 90), row(3, [], 95), row(1, ["hreflang"], 96)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  const hreflang = p.failing.find((f) => f.id === "hreflang");
  assert.ok(hreflang);
  // The window is bounded, so this is the honest reading: the current run of failures starts at
  // the most recent break, not at a failure that was repaired in between.
  assert.equal(hreflang.failingSince, new Date(NOW - 1 * 7 * DAY).toISOString());
  assert.equal(hreflang.failedRuns, 2);
});

check("a check that passed in the newest scan is not listed as failing now", () => {
  /*
   * The heading on the page says "failing now", so a check that failed in week one and has passed
   * since must not appear under it. The first version of the payload collected any id that failed
   * anywhere in the window and would have contradicted its own heading.
   */
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(2, ["hreflang"], 90), row(0, [], 97)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.deepEqual(p.failing, []);
});

check("an unbroken run of failures is reported from its first week", () => {
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(6, ["hreflang"], 90), row(3, ["hreflang"], 92), row(0, ["hreflang"], 97)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  const hreflang = p.failing.find((f) => f.id === "hreflang");
  assert.ok(hreflang);
  assert.equal(hreflang.failingSince, new Date(NOW - 6 * 7 * DAY).toISOString());
});

check("every failing check carries its published title, its fix and its rule URL", () => {
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(0, ["hreflang", "markdown-alternate"], 90)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  for (const f of p.failing) {
    assert.notEqual(f.title, f.id, `${f.id} has no published title`);
    assert.ok(f.fix.length > 0, `${f.id} has no fix text`);
    assert.equal(f.ruleUrl, `${SITE}/checks/${f.id}/`);
  }
});

check("an unknown check id still renders, as its own id, rather than disappearing", () => {
  // A check removed from the catalogue is still in somebody's history. Dropping the row would make
  // the failure count on the page disagree with the count stored in the row it came from.
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(0, ["a-check-that-was-removed"], 88)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.equal(p.failing.length, 1);
  assert.equal(p.failing[0].title, "a-check-that-was-removed");
  assert.equal(p.failing[0].fix, "");
  assert.equal(p.failing[0].ruleUrl, `${SITE}/checks/a-check-that-was-removed/`);
});

check("malformed failed_check_ids does not throw and does not invent failures", () => {
  const broken: ScanRow = { ...row(0, [], 90), failed_check_ids: "{not json" };
  const p = buildReportPayload({
    domain: "example.test",
    scans: [broken],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.equal(p.failing.length, 0);
  assert.equal(p.history[0].failed, 0);
});

check("no rows at all yields a null latest rather than a zero score", () => {
  // A subscriber whose first scan has not run yet. "0/100" would be a measurement claim about a
  // site nobody measured, and the page says something else instead.
  const p = buildReportPayload({ domain: "example.test", scans: [], checkCopy: copy, siteUrl: SITE });
  assert.equal(p.latest, null);
  assert.equal(p.runs, 0);
  assert.deepEqual(p.history, []);
  assert.equal(p.windowFrom, "");
});

check("failing checks are ordered by how many runs failed them, then by id", () => {
  /*
   * The fixture is built so the two orderings disagree: alphabetically "hreflang" comes first, and
   * it has FEWER failing runs. A first version of this test used a fixture where both orderings
   * agreed, which would have passed whichever way the sort was written.
   */
  const p = buildReportPayload({
    domain: "example.test",
    scans: [
      row(2, ["markdown-alternate", "hreflang"], 90),
      row(1, ["markdown-alternate"], 92),
      row(0, ["markdown-alternate", "hreflang"], 95),
    ],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.deepEqual(
    p.failing.map((f) => `${f.id}:${f.failedRuns}`),
    ["markdown-alternate:3", "hreflang:2"]
  );
});

check("two checks with the same number of failing runs fall back to id order", () => {
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(1, ["markdown-alternate", "hreflang"], 90), row(0, ["markdown-alternate", "hreflang"], 91)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  assert.deepEqual(
    p.failing.map((f) => f.id),
    ["hreflang", "markdown-alternate"]
  );
});

check("the window is 12 weeks and the cutoff is what the route queries with", () => {
  assert.equal(HISTORY_DAYS, 84);
  assert.equal(historySince(NOW), NOW - 84 * DAY);
});

check("the payload carries no email address and no token", () => {
  /*
   * The one assertion here that is about privacy rather than correctness. This object is serialised
   * to whoever holds the link, and the link is built to be forwarded - so the address behind the
   * subscription must not be reachable from it. The check is over the serialised form on purpose:
   * a field added later with a different name still has to pass.
   */
  const p = buildReportPayload({
    domain: "example.test",
    scans: [row(0, ["hreflang"], 90)],
    checkCopy: copy,
    siteUrl: SITE,
  });
  const json = JSON.stringify(p);
  assert.ok(!json.includes("@"), "the payload contains something that looks like an address");
  assert.ok(!/token/i.test(json), "the payload mentions a token");
});

/*
 * ============================================================================
 * THE CONFIRMATION FLOW
 *
 * Everything below exists because of one claim the product now makes in an email: confirming a
 * subscription hands the reader their own report. That is a link in a message that nobody can
 * click in a test, so the decision behind it lives in lib/subscribe/landing.ts as a function of a
 * token and a database, and this suite drives it against a fake database shaped like D1.
 *
 * The fake is deliberately narrow: it answers exactly the three statements confirmByToken issues
 * (the SELECT by token, the UPDATE that flips the status, and the SELECT that reads a row back by
 * report token) and it THROWS on anything else. A fake that answered everything would let a
 * rewritten query pass silently, which is the failure this suite exists to catch; the shape of
 * these three statements is asserted separately by scripts/test-analyze-style string checks in the
 * real route, and lib/db/subscribers.ts is the only module that writes them.
 * ============================================================================
 */

type Row = {
  id: string;
  domain: string;
  email: string;
  status: string;
  confirm_token: string;
  unsub_token: string;
  report_token: string | null;
  created_at: number;
  confirmed_at: number | null;
};

/**
 * A D1-shaped double over one row.
 *
 * `failOnUpdate` exists because the failure mode that matters here is not a missing row - it is a
 * row that was read and then could not be written, which leaves the reader holding a confirmation
 * link that confirmed nothing. The route has to say so rather than claim the link is unknown.
 */
function fakeDb(seed: Partial<Row>, options: { failOnUpdate?: boolean } = {}) {
  const state: { row: Row | null } = {
    row: {
      id: "sub_1",
      domain: "example.test",
      email: "reader@example.test",
      status: "pending",
      confirm_token: "confirm-abc",
      unsub_token: "unsub-abc",
      report_token: "report-xyz",
      created_at: NOW - DAY,
      confirmed_at: null,
      ...seed,
    },
  };

  const db = {
    prepare(sql: string) {
      const statement = {
        _args: [] as unknown[],
        bind(...args: unknown[]) {
          statement._args = args;
          return statement;
        },
        async first<T>() {
          if (/FROM subscribers\s+WHERE confirm_token/.test(sql)) {
            const token = statement._args[0];
            return (state.row && state.row.confirm_token === token ? state.row : null) as T | null;
          }
          if (/FROM subscribers\s+WHERE report_token/.test(sql)) {
            const token = statement._args[0];
            return (state.row && state.row.report_token === token && state.row.status === "confirmed"
              ? state.row
              : null) as T | null;
          }
          throw new Error(`unexpected read: ${sql}`);
        },
        async run() {
          if (/UPDATE subscribers SET status = 'confirmed'/.test(sql)) {
            if (options.failOnUpdate) throw new Error("D1 write refused");
            state.row = { ...state.row!, status: "confirmed", confirmed_at: statement._args[0] as number };
            return { success: true, meta: { changes: 1 } };
          }
          throw new Error(`unexpected write: ${sql}`);
        },
      };
      return statement;
    },
  };

  return { db: db as unknown as D1DatabaseLike, state };
}

/** The row as the report endpoint reads it, which is the only reader that matters for the claim. */
async function reportRow(db: D1DatabaseLike, token: string) {
  return db
    .prepare(`SELECT * FROM subscribers WHERE report_token = ?1 AND status = 'confirmed' LIMIT 1`)
    .bind(token)
    .first<Row>();
}

const DB_TYPE_ONLY: D1DatabaseLike | null = null;
void DB_TYPE_ONLY;

/*
 * NOT `console.log("...")` AND A BARE BLOCK. Every case below goes through `check`, so a failure
 * lands in `results`, prints with the others and sets the exit code. The first version of this
 * section ran its assertions in bare blocks and produced a suite that printed "All 14 tests passed"
 * while six of them were not tests at all.
 */
await check("confirming links to that subscription's report page, and not to anything else", async () => {
  const { db } = fakeDb({});
  const outcome = await confirmSubscription(db, "confirm-abc", NOW);
  assert.equal(outcome.ok, true, "a pending row with a valid token must confirm");
  if (!outcome.ok) return;

  const html = await outcome.response.text();
  /*
   * THE ASSERTION THIS WHOLE SECTION EXISTS FOR. The confirmation page must carry the report URL,
   * built from the REPORT token rather than the confirmation token - mixing those two up is one
   * line and it either publishes the token that confirms subscriptions or produces a link the
   * report endpoint refuses.
   */
  assert.ok(
    html.includes(reportUrl("report-xyz")),
    "the confirmation page does not link to the token report"
  );
  assert.ok(
    !html.includes("confirm-abc"),
    "the confirmation page leaked the confirmation token into a linkable page"
  );
  assert.equal(outcome.response.status, 200);
  // A page carrying a secret has no business in an index.
  assert.match(outcome.response.headers.get("x-robots-tag") ?? "", /noindex/);
  assert.equal(outcome.response.headers.get("cache-control"), "no-store");
});

await check("the row is confirmed by the time the report endpoint reads it", async () => {
  /*
   * THE ORDER OF OPERATIONS, ASSERTED RATHER THAN ASSUMED. The link is only useful if the row is
   * CONFIRMED when the report endpoint reads it - that endpoint filters on status = 'confirmed', so
   * a page built before the flip would hand the reader a URL that 404s. This drives the real
   * confirmByToken and then the real read the endpoint performs.
   */
  const { db } = fakeDb({});
  await confirmSubscription(db, "confirm-abc", NOW);
  const row = await reportRow(db, "report-xyz");
  assert.ok(row, "the report token does not resolve after confirmation; the redirect target is dead");
  assert.equal(row.status, "confirmed");
  assert.equal(row.confirmed_at, NOW);
});

await check("confirming twice shows the same page rather than an error", async () => {
  // The ordinary case, not an edge case: mail clients and link scanners fetch these URLs before a
  // person ever sees them.
  const { db } = fakeDb({});
  const first = await confirmSubscription(db, "confirm-abc", NOW);
  const second = await confirmSubscription(db, "confirm-abc", NOW + 1000);
  assert.equal(first.ok && second.ok, true, "the second visit to a confirmation link must not fail");
  if (second.ok) {
    assert.ok((await second.response.text()).includes(reportUrl("report-xyz")));
  }
});

await check("an unsubscribed address is never handed a working report link", async () => {
  const { db } = fakeDb({ status: "unsubscribed" });
  const outcome = await confirmSubscription(db, "confirm-abc", NOW);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "unsubscribed");
});

await check("a token nobody issued is reported as unknown, not as a broken link", async () => {
  const { db } = fakeDb({});
  const outcome = await confirmSubscription(db, "a-token-nobody-issued", NOW);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "not_found");
});

await check("a row with no report token still confirms, and builds no dead link", async () => {
  // Schema drift rather than an expected state. It must fall back to a page, never to a link the
  // report endpoint would refuse.
  const { db } = fakeDb({ report_token: null });
  const outcome = await confirmSubscription(db, "confirm-abc", NOW);
  assert.equal(outcome.ok, true, "a missing report token must not fail the confirmation itself");
  if (outcome.ok) {
    const html = await outcome.response.text();
    assert.ok(!html.includes("/monitor/report/"), "a report link was built without a token");
    assert.match(html, /You are subscribed/);
  }
});

await check("a refused write is reported as ours and recoverable, not as an unknown link", async () => {
  /*
   * Telling somebody their valid link is not recognised sends them to sign up again, which writes a
   * second pending row and replaces the token in the message they are still holding. The link is
   * valid and the row is still pending, so the instruction has to be to try again.
   */
  const { db } = fakeDb({}, { failOnUpdate: true });
  const outcome = await confirmSubscription(db, "confirm-abc", NOW);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "database");
});

await check("both emails carry the report link in their footer, not only in the body", async () => {
  /*
   * The footer is where "this page was built to be forwarded" pays off: the body of the weekly email
   * explains the link, and the footer carries it in the same place in every message the product
   * sends. Both messages are checked, because the confirmation is the one a reader receives at the
   * moment they have just given something and are most likely to want what they asked for.
   */
  const weekly = reportEmail({
    domain: "example.test",
    score: 97,
    grade: "A",
    checksPassed: 38,
    checksRun: 40,
    fixed: [],
    newFailures: [],
    unchangedFailures: 2,
    firstRun: false,
    homepageUrl: "https://example.test/",
    historyUrl: reportUrl("report-xyz"),
    unsubUrl: `${SITE_URL}/api/subscribe/unsubscribe/?t=unsub-abc`,
  });

  const confirm = confirmationEmail(
    "example.test",
    `${SITE_URL}/api/subscribe/confirm/?t=confirm-abc`,
    `${SITE_URL}/api/subscribe/unsubscribe/?t=unsub-abc`,
    reportUrl("report-xyz")
  );

  for (const [name, message] of [
    ["the weekly report", weekly],
    ["the confirmation", confirm],
  ] as const) {
    const link = reportUrl("report-xyz");
    /*
     * `html` IS OPTIONAL ON EmailMessage, and that is correct rather than inconvenient: a message
     * that is only its plain-text half is a message the sender can still deliver. Both templates
     * build one, which is what the assertion below establishes before anything reads it - a test
     * that assumed the field existed would not be testing the template at all.
     */
    const html = message.html;
    assert.ok(html, `${name} email has no HTML part at all`);
    assert.ok(html.includes(link), `${name} email does not carry the report link in HTML`);
    assert.ok(message.text.includes(link), `${name} email does not carry the report link in plain text`);

    /*
     * THE FOOTER SPECIFICALLY, NOT MERELY SOMEWHERE IN THE MESSAGE.
     *
     * The shared footer line is the address paragraph that ends the document, and it contains the
     * contact address exactly once. So the last occurrence of the report link has to come after the
     * last occurrence of the contact address. Written this way rather than as `includes`, a template
     * change that moves the link back up into the body fails here instead of passing on "it is in
     * the HTML somewhere" - which is exactly the requirement this case exists to hold.
     */
    const footerStart = html.lastIndexOf(CONTACT_EMAIL);
    const linkAt = html.lastIndexOf(link);
    assert.notEqual(footerStart, -1, `${name} email has no footer address to anchor on`);
    assert.ok(
      linkAt > footerStart,
      `${name} email carries the report link in the body but not in the footer`
    );
    assert.ok(
      html.indexOf("</p>", linkAt) > linkAt,
      `${name} email footer link is not inside the closing footer paragraph`
    );
  }

  // The plain-text half has to name the link rather than trailing a bare URL after the signature,
  // which is where a footer written by hand drifts to.
  assert.match(confirm.text, /Your report page: /);
  assert.match(weekly.text, /forward - it needs no domain typed:/);
});

await check("a message with no report token has no report link at all", async () => {
  /*
   * The optional parameter exists so that a send never depends on an extra link being buildable. A
   * weekly report for a row whose token is missing has to go out without the link rather than not go
   * out - and a template that printed the URL anyway would print "undefined" into somebody's inbox.
   */
  const withoutToken = reportEmail({
    domain: "example.test",
    score: 97,
    grade: "A",
    checksPassed: 38,
    checksRun: 40,
    fixed: [],
    newFailures: [],
    unchangedFailures: 2,
    firstRun: false,
    homepageUrl: "https://example.test/",
    unsubUrl: `${SITE_URL}/api/subscribe/unsubscribe/?t=unsub-abc`,
  });
  assert.ok(!withoutToken.html?.includes("/monitor/report/"));
  assert.ok(!withoutToken.text.includes("/monitor/report/"));

  const plainConfirm = confirmationEmail(
    "example.test",
    `${SITE_URL}/api/subscribe/confirm/?t=confirm-abc`,
    `${SITE_URL}/api/subscribe/unsubscribe/?t=unsub-abc`
  );
  assert.ok(!plainConfirm.html?.includes("/monitor/report/"), "a report link appeared without a token");
  assert.ok(!/undefined/.test(plainConfirm.html ?? ""), "a missing optional link printed as undefined");
});

console.log("Report-link payload tests\n");
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("  FAIL")).length;
console.log(failed ? `\n${failed} test(s) failed.` : `\nAll ${results.length} report-link tests passed.`);
