/**
 * Measure the built homepage with the scanner's own analyser and write the self-audit record.
 *
 * WHY THIS SCRIPT EXISTS: the homepage used to publish its own score as a typed constant with
 * a verification date that was true on the day it was typed and stayed printed for weeks
 * afterwards. A number nobody re-measures is a memory of a number, and a date that is never
 * refreshed dresses that memory as a current claim. This replaces both with a measurement of
 * the HTML `next build` actually wrote, taken by the same engine the scanner runs over a
 * customer's site, and written to lib/self-audit.json where lib/home-content.ts reads it.
 *
 * THE RECORD CANNOT GO STALE SILENTLY: scripts/check-built-pages.mts scores the same homepage
 * and compares its result against this file, so a page edit that changes the score without a
 * re-measurement fails the gate rather than shipping a sentence the site no longer earns.
 *
 * Run:
 *   npm run self-audit            measure and write lib/self-audit.json
 *   npm run self-audit -- --check compare the file with the build, exit 1 on drift
 *
 * The build has to exist first: `npm run build`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_HOST } from "../lib/site.ts";
import { analyze } from "../lib/geo/analyze.ts";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, ".next", "server", "app");
const PUBLIC_DIR = join(ROOT, "public");
const RECORD_PATH = join(ROOT, "lib", "self-audit.json");

const HOMEPAGE_PATH = join(APP_DIR, "index.html");
const ROBOTS_PATH = join(PUBLIC_DIR, "robots.txt");
const LLMS_PATH = join(PUBLIC_DIR, "llms.txt");
// next build writes route handlers to a .body file rather than an .html one.
const SITEMAP_PATH = join(APP_DIR, "sitemap.xml.body");

/**
 * The record, with the keys frozen by lib/home-content.ts's SelfAuditRecord type.
 *
 * `measuredAt` is a plain ISO date rather than a timestamp: lib/insights.ts's formatDate()
 * splits it on "-" to print "23 October 2026" on the page, so a time of day would render as
 * garbage. It is UTC's date, because a weekly CI run in another time zone must not write a
 * date that reads as yesterday or tomorrow to a reader.
 */
type SelfAuditRecord = {
  measuredAt: string;
  score: number;
  grade: string;
  checksRun: number;
  checksPassed: number;
  /** Ids whose status is exactly "na". The count alone is not enough - the page names them. */
  notApplicable: string[];
  /** Ids whose status is exactly "fail". */
  failures: string[];
};

function readIfPresent(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

if (!existsSync(HOMEPAGE_PATH)) {
  console.error(
    `No built homepage at ${HOMEPAGE_PATH}.\n` +
      "The record is measured from the build, not from the source, so run `npm run build` first."
  );
  process.exit(1);
}

const html = readFileSync(HOMEPAGE_PATH, "utf8");
const robotsText = readIfPresent(ROBOTS_PATH);
const llmsText = readIfPresent(LLMS_PATH);
const sitemapText = readIfPresent(SITEMAP_PATH);

if (!sitemapText) {
  console.warn(
    "warning: sitemap.xml.body not found in the build, so sitemap-valid will fail and the recorded score will be lower than a real scan's.\n"
  );
}

/*
 * THE INPUT IS THE ONE check-built-pages.mts BUILDS FOR "/", DELIBERATELY AND TO THE FIELD.
 * The two scripts score the same page and their numbers are compared, so any difference in
 * what they pass - the scheme, a null browserStatus, a null Last-Modified header - would be a
 * difference in the score, and the gate would report the record as stale for a reason that has
 * nothing to do with the page.
 */
const result = analyze({
  domain: SITE_HOST,
  scheme: "https",
  homeStatus: 200,
  browserStatus: null,
  html,
  robotsText,
  llmsText,
  sitemapText,
  lastModifiedHeader: null,
  path: "/",
});

const record: SelfAuditRecord = {
  measuredAt: new Date().toISOString().slice(0, 10),
  score: result.score,
  grade: result.grade,
  checksRun: result.checksRun,
  checksPassed: result.checksPassed,
  notApplicable: result.checks.filter((check) => check.status === "na").map((check) => check.id),
  failures: result.checks.filter((check) => check.status === "fail").map((check) => check.id),
};

const summaries: string[] = [];
if (record.notApplicable.length > 0) {
  summaries.push(`${record.notApplicable.length} not applicable (${record.notApplicable.join(", ")})`);
}
summaries.push(
  record.failures.length > 0
    ? `${record.failures.length} failure${record.failures.length === 1 ? "" : "s"} (${record.failures.join(", ")})`
    : "no failures"
);

const summary = `${record.score}/100 grade ${record.grade} — ${record.checksPassed} of ${record.checksRun} checks passing, ${summaries.join(", ")}`;

/* ------------------------------------------------------------------ */
/* --check: compare the record with the build, do not write it         */
/* ------------------------------------------------------------------ */

if (process.argv.includes("--check")) {
  if (!existsSync(RECORD_PATH)) {
    console.error(
      `self-audit --check: ${RECORD_PATH} is missing. Run \`npm run self-audit\` to create it.`
    );
    process.exit(1);
  }

  const current = JSON.parse(readFileSync(RECORD_PATH, "utf8")) as Partial<SelfAuditRecord>;

  /*
   * measuredAt is NOT compared, and that is not a loophole: the file records the day the last
   * measurement was taken, so comparing it would report drift every day the page is unchanged.
   * What has to match the build is the measurement, not the calendar.
   */
  const differences: string[] = [];
  const compare = (field: keyof Omit<SelfAuditRecord, "measuredAt">, actual: unknown, expected: unknown) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      differences.push(`  ${field}: record ${JSON.stringify(expected)}, built homepage ${JSON.stringify(actual)}`);
    }
  };

  // Sorted on both sides: the ids are a set, not a rendered order, so a reordered catalogue
  // must not read as drift.
  const sortedIds = (ids: string[]) => [...ids].sort();

  compare("score", result.score, current.score);
  compare("grade", result.grade, current.grade);
  compare("checksRun", result.checksRun, current.checksRun);
  compare("checksPassed", result.checksPassed, current.checksPassed);
  compare("notApplicable", sortedIds(record.notApplicable), sortedIds(current.notApplicable ?? []));
  compare("failures", sortedIds(record.failures), sortedIds(current.failures ?? []));

  if (differences.length > 0) {
    console.error(`self-audit --check: lib/self-audit.json does not match the built homepage.`);
    for (const difference of differences) console.error(difference);
    console.error("Run `npm run self-audit` to refresh the record, then rebuild.");
    process.exit(1);
  }

  console.log(`self-audit --check: lib/self-audit.json matches the built homepage — ${summary}.`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* Default: write the record                                            */
/* ------------------------------------------------------------------ */

/*
 * IF THE RECORD CHANGED, THE HTML THAT WAS JUST MEASURED STILL EMBEDS THE OLD VALUES. The page
 * reads lib/self-audit.json when it is built, so refreshing the file is not the same as
 * publishing the refresh - the next build is what puts the new score and date on the page, and a
 * deploy that skipped it would ship the previous number under a fresh file. The summary says so
 * rather than leaving it to be discovered in a diff.
 */
const previousText = existsSync(RECORD_PATH) ? readFileSync(RECORD_PATH, "utf8") : null;
const recordText = JSON.stringify(record, null, 2) + "\n";
writeFileSync(RECORD_PATH, recordText);
console.log(
  `self-audit: ${summary} — wrote lib/self-audit.json (${record.measuredAt})` +
    (previousText === recordText
      ? "."
      : ". Rebuild before deploying: the built page still embeds the previous record.")
);
