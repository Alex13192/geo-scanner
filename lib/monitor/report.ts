/**
 * What a forwarded report link shows, as a pure function.
 *
 * WHY THIS IS SEPARATE FROM THE ROUTE, AND WHY IT IS PURE. Everything about the answer - which
 * numbers appear, what "failing since" means, what happens when the history is one row long - is
 * decided here, where it can be tested without a database, a token or a running Worker. The route
 * below it does three things only: find the subscriber, read the rows, hand them to this function.
 * scripts/test-report-link.mts is the suite, and it exists because the alternative is a page whose
 * behaviour nobody can check without deploying it.
 *
 * WHAT IT DELIBERATELY DOES NOT SHOW, and this is the important constraint rather than a gap.
 * The scans table stores a score, a grade, the check counts, and the IDS of the checks that failed.
 * It does not store the earned/possible figures per dimension, the per-scan evidence, or the
 * per-scan fix text. So:
 *
 *   - Per-dimension scores are NOT computed here. They are derivable only by assuming every check
 *     applied to every page, and a check that was excluded for the page type would then silently
 *     cost points it never cost. A number that is right on the homepage and wrong on a legal page
 *     is worse than no number.
 *   - Points-at-stake is NOT computed, for the same reason: it multiplies a dimension weight by a
 *     share of that dimension's applicable weight.
 *   - The evidence a check produced ("No hreflang attribute found") is NOT reproduced: it is
 *     per-scan text that was never stored, and inventing a plausible sentence where a measurement
 *     used to be is exactly what this product exists to criticise.
 *
 * WHAT IT DOES SHOW INSTEAD. Each failing check links to its own published rule page, and carries
 * that rule's own fix text - both read from lib/geo/check-copy.ts, which is generated out of the
 * analyser so the /checks/<id>/ pages and this report cannot drift apart. Using the `fail` branch is
 * not a guess: the weekly runner stores `status === "fail"` ids and nothing else, so the branch that
 * applies is known rather than assumed.
 *
 * The label for those rows is the rule as published ("Alternate language versions are declared")
 * rather than the failure phrasing the engine puts in the email ("No alternate language versions").
 * The engine's phrasing exists only inline in the analyser and is not recoverable from a stored id,
 * and a rule-stated row beside a date reads correctly for a list of what is failing.
 *
 * What is left is what the rows actually contain: the score and grade as they were reported, the
 * check counts, the week-by-week history, and which checks are failing - each with the date it
 * started failing, because "this has been broken for six weeks" is the sentence a monitoring report
 * exists to produce and it is computable from the rows alone.
 */

export type ScanRow = {
  at: number;
  score: number;
  grade: string;
  checks_passed: number;
  checks_run: number;
  failed_check_ids: string;
};

export type HistoryPoint = {
  /** ISO date, so a chart and a table agree about what a row is. */
  at: string;
  score: number;
  grade: string;
  checksPassed: number;
  checksRun: number;
  failed: number;
};

export type FailingCheck = {
  id: string;
  /** The rule as published, from lib/geo/check-copy.ts. */
  title: string;
  /** That rule's own fix, for the `fail` branch. Empty when the check publishes no fail branch. */
  fix: string;
  /** The published rule page for this check. */
  ruleUrl: string;
  /** ISO date of the earliest run in the window where this id was failing. */
  failingSince: string;
  /** How many runs in the window failed it, so a flapping check is visible. */
  failedRuns: number;
};

export type ReportPayload = {
  domain: string;
  /** The most recent run. Null only if the rows list was empty, which the caller treats as "no reports yet". */
  latest: HistoryPoint | null;
  /** Newest first. Bounded by the caller's query, not here. */
  history: HistoryPoint[];
  failing: FailingCheck[];
  /** How many runs this window covers, so a one-row history cannot be read as a flat trend. */
  runs: number;
  /** ISO date used to label the window. */
  windowFrom: string;
  windowTo: string;
};

const DAY = 86_400_000;

function iso(at: number): string {
  return new Date(at).toISOString();
}

/** Ids are stored as JSON text; a row written by an older version could be malformed. */
function parseFailed(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function buildReportPayload(
  input: {
    domain: string;
    scans: ScanRow[];
    /** Id -> published copy, from lib/geo/check-copy.ts. */
    checkCopy: Map<string, { title: string; fix: string }>;
    siteUrl: string;
  }
): ReportPayload {
  // Newest first, whatever order the caller's query returned them in.
  const rows = [...input.scans].sort((a, b) => b.at - a.at);

  const history: HistoryPoint[] = rows.map((r) => ({
    at: iso(r.at),
    score: r.score,
    grade: r.grade,
    checksPassed: r.checks_passed,
    checksRun: r.checks_run,
    failed: parseFailed(r.failed_check_ids).length,
  }));

  /*
   * Two different questions, and conflating them is how a monitoring report lies:
   *
   *   WHAT IS FAILING NOW is what the most recent run failed. A check that failed in week one and
   *   has passed ever since is not a current problem, and listing it as one - which the first
   *   version of this function did - contradicts the page it feeds, whose heading says "failing now".
   *
   *   HOW LONG HAS IT BEEN FAILING is the length of the unbroken run that ends at that latest row.
   *   Walking backwards from the newest row and stopping at the first row that passes the check
   *   means a check that failed, was fixed and broke again reads as the recent break rather than as
   *   the older failure - which is what a reader assumes, and what the first version got wrong in
   *   the other direction by reporting the oldest sighting in the window.
   *
   * `failedRuns` counts every run in the window that failed it, which is deliberately a third
   * number: a check that flaps reads as "2 of 9 scans" beside a short current run, and that is
   * exactly the pattern worth seeing.
   */
  const failedRuns = new Map<string, number>();
  for (const row of rows) {
    for (const id of parseFailed(row.failed_check_ids)) {
      failedRuns.set(id, (failedRuns.get(id) ?? 0) + 1);
    }
  }

  const failingNow = rows.length ? parseFailed(rows[0].failed_check_ids) : [];
  const failing: FailingCheck[] = [];
  for (const id of failingNow) {
    let since = rows[0].at;
    for (const row of rows) {
      if (!parseFailed(row.failed_check_ids).includes(id)) break;
      since = row.at;
    }
    const copy = input.checkCopy.get(id);
    failing.push({
      id,
      title: copy?.title ?? id,
      fix: copy?.fix ?? "",
      ruleUrl: `${input.siteUrl}/checks/${id}/`,
      failingSince: iso(since),
      failedRuns: failedRuns.get(id) ?? 1,
    });
  }
  // Most-failed first, then alphabetically, so the order is stable between runs and reviewable.
  failing.sort((a, b) => b.failedRuns - a.failedRuns || a.id.localeCompare(b.id));

  return {
    domain: input.domain,
    latest: history[0] ?? null,
    history,
    failing,
    runs: rows.length,
    windowFrom: rows.length ? iso(rows[rows.length - 1].at) : "",
    windowTo: rows.length ? iso(rows[0].at) : "",
  };
}

/**
 * How far back a report link reads, in days.
 *
 * Twelve weeks: long enough that "failing since" says something a reader can act on, short enough
 * that the query stays a single indexed range and the page stays one screen of table. Exported so
 * the route and the test cannot disagree about the window.
 */
export const HISTORY_DAYS = 84;

/** The cutoff a query should pass to `listScans`, as a millisecond timestamp. */
export function historySince(now: number): number {
  return now - HISTORY_DAYS * DAY;
}
