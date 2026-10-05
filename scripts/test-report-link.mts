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
function check(name: string, fn: () => void) {
  try {
    fn();
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

console.log("Report-link payload tests\n");
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("  FAIL")).length;
console.log(failed ? `\n${failed} test(s) failed.` : `\nAll ${results.length} report-link tests passed.`);
