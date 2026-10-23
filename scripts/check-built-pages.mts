/**
 * Score the built site with the scanner's own engine.
 *
 * WHY THIS EXISTS: the scanner publishes 38 rules and then had no way to notice
 * when its own pages broke them. That happened twice - the /llms-txt-studio/ and
 * /readiness-badge/ routes prerendered to a Suspense fallback and shipped two
 * words of HTML each - and neither `next build` nor `next start` says anything
 * about it, because both of them are perfectly happy serving an empty page.
 *
 * The scanner only analyses a homepage, so it can never see this class of
 * problem on its own site: every page except the homepage is outside its field
 * of view. This script closes that hole by running the real analyser, the same
 * one the API route calls, over the HTML that `next build` actually wrote.
 *
 * It also holds the homepage's PUBLISHED self-measurement to the built page.
 * lib/self-audit.json is written by scripts/self-audit.mts from this same analyser and is what
 * lib/home-content.ts prints as the site's own score, date and failure list. A build does not
 * run that script, so a page edit that changes the score could otherwise ship a record measured
 * against an older version of the page - the stale self-praise the generated record replaced.
 * A record that no longer matches the build fails this run.
 *
 * Run it after a build:
 *   npm run build && node scripts/check-built-pages.mts
 *
 * Options:
 *   --threshold=<n>   minimum score for indexable routes (default 90, i.e. an A)
 *   --warn-only       report but never exit non-zero
 *
 * The route list below mirrors app/sitemap.ts. Routes that are deliberately
 * noindex are marked so they are reported without failing the run - /report/ is
 * a per-request tool output and is disallowed in robots.txt on purpose, so its
 * score is information rather than a standard the site has to meet.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SITE_HOST } from "../lib/site.ts";
import { analyze } from "../lib/geo/analyze.ts";
import { INSIGHTS, insightPath } from "../lib/insights.ts";

const APP_DIR = join(process.cwd(), ".next", "server", "app");
const PUBLIC_DIR = join(process.cwd(), "public");

type Route = { route: string; file: string; indexable: boolean; min?: number };

const ROUTES: Route[] = [
  { route: "/", file: "index.html", indexable: true },
  /* The index of everything else. Scored like any other page rather than exempted: it is a
     hub that links fifty-odd URLs, and a hub is exactly the page whose own headings, links
     and prose are worth gating - a link list that has lost its explanations is the failure
     this page is most likely to suffer. */
  { route: "/tools/", file: "tools.html", indexable: true },
  { route: "/llms-txt-studio/", file: "llms-txt-studio.html", indexable: true },
  { route: "/readiness-badge/", file: "readiness-badge.html", indexable: true },
  /* One per scoring dimension. Listed individually because this script reads the built tree by
     filename, so a generated route it does not name is a route it cannot score - which is the
     hole that let two thin pages ship with every check green. */
  { route: "/dimensions/ai-crawler-access/", file: "dimensions/ai-crawler-access.html", indexable: true },
  { route: "/dimensions/machine-readability/", file: "dimensions/machine-readability.html", indexable: true },
  { route: "/dimensions/content-depth/", file: "dimensions/content-depth.html", indexable: true },
  { route: "/dimensions/citability/", file: "dimensions/citability.html", indexable: true },
  { route: "/dimensions/answer-readiness/", file: "dimensions/answer-readiness.html", indexable: true },
  { route: "/dimensions/trust-authority/", file: "dimensions/trust-authority.html", indexable: true },
  { route: "/dimensions/semantic-structure/", file: "dimensions/semantic-structure.html", indexable: true },
  { route: "/dimensions/metadata/", file: "dimensions/metadata.html", indexable: true },
  { route: "/dimensions/llms-txt/", file: "dimensions/llms-txt.html", indexable: true },
  { route: "/dimensions/freshness/", file: "dimensions/freshness.html", indexable: true },
  { route: "/dimensions/multilingual/", file: "dimensions/multilingual.html", indexable: true },
  { route: "/dimensions/delivery/", file: "dimensions/delivery.html", indexable: true },
  // The weekly-report signup. Scored like any other page: it is mostly prose and a form,
  // and a form is not a reason to let a page fall below the floor the rest of the site holds.
  { route: "/monitor/", file: "monitor.html", indexable: true },
  { route: "/methodology/", file: "methodology.html", indexable: true },
  { route: "/study/", file: "study.html", indexable: true },
  /* The site's own measurement. Added with the page itself, for this script's opening reason: a
     page that is new must not skip the gate by being new. It carries no custom floor because a
     dated record with a table, a FAQ and a method section is the easiest page type on the site to
     score well - if it falls below 90 it has lost content rather than been written short. The
     page reads lib/self-audit.json, which this run already compares with the built homepage
     below, so scoring it also proves the published record is readable on the page it describes. */
  { route: "/self-audit/", file: "self-audit.html", indexable: true },
  /* The comparisons. Added in the same change as the routes, for the reason this file's
     opening comment gives: a page that is new must not skip the gate by being new. They
     carry no custom floor because a comparison page is prose with a table and a FAQ, which
     is the easiest page type on the site to score well - if one falls below 90 it has lost
     content rather than been written short. */
  { route: "/compare/", file: "compare.html", indexable: true },
  { route: "/compare/llm-mentions-api/", file: "compare/llm-mentions-api.html", indexable: true },
  {
    route: "/compare/readiness-vs-mention-tracking/",
    file: "compare/readiness-vs-mention-tracking.html",
    indexable: true,
  },
  { route: "/about/", file: "about.html", indexable: true },
  { route: "/contact/", file: "contact.html", indexable: true },
  { route: "/docs/", file: "docs.html", indexable: true },
  { route: "/docs/llms-txt-deployment/", file: "docs/llms-txt-deployment.html", indexable: true },
  { route: "/docs/allow-ai-crawlers/", file: "docs/allow-ai-crawlers.html", indexable: true },
  { route: "/docs/qa-style-headings/", file: "docs/qa-style-headings.html", indexable: true },
  { route: "/docs/schema-org-jsonld/", file: "docs/schema-org-jsonld.html", indexable: true },
  { route: "/docs/ai-visibility-self-check/", file: "docs/ai-visibility-self-check.html", indexable: true },
  /* The API reference. A page a developer lands on from a search result, and the one that
     documents the endpoint the study itself was collected through. */
  { route: "/api-docs/", file: "api-docs.html", indexable: true },
  /*
   * THE WRITING. Added with /insights/ on 2026-10-18, for the reason this file exists: a page
   * that is new must not skip the gate by being new. The articles are generated from the same
   * registry the sitemap reads, so one that is published and missing from this list would have
   * to be missing from the sitemap too.
   *
   * No custom floor. A piece is long-form prose with a table, a FAQ and sources, which is the
   * easiest page type on the site to score well - if one falls below 90 it has lost content
   * rather than been written short, and that is exactly what should fail.
   */
  { route: "/insights/", file: "insights.html", indexable: true },
  ...INSIGHTS.map((insight) => ({
    route: insightPath(insight.slug),
    file: `insights/${insight.slug}.html`,
    indexable: true,
  })),
  /* The author page. Scored like any other page: it is the page a reader follows from a byline,
     and "about the author" is not a licence to ship three paragraphs. */
  { route: "/author/", file: "author.html", indexable: true },
  { route: "/answer-check/", file: "answer-check.html", indexable: true },
  { route: "/privacy/", file: "privacy.html", indexable: true },
  { route: "/terms/", file: "terms.html", indexable: true },
  /*
   * THE TWO PAGES THE MONEY DEPENDS ON WERE MISSING FROM THIS LIST, which is exactly the gap the
   * script's own comment warns about one level up: a page that is new must not be allowed to skip the
   * gate by being new. Both were added in the change that restored the paid measurement and neither
   * was added here, so they were the only content pages on the site that no check scored - while
   * being the two a payment reviewer opens.
   */
  /*
   * THEIR FLOOR IS 80, NOT 90, AND THE REASON IS RECORDED RATHER THAN IMPLIED - the same treatment
   * the check pages get. BOTH PAGES ARE NOW RENDERED PER REQUEST, because both read the deployment's
   * OPERATOR_IDENTITY so the seller's identity is not baked into a build: /refund/ always did, and
   * /pricing/ joined it on 2026-10-23 when it gained a "Who you are buying from" section. Neither is
   * therefore in the static build and neither is scored here; the live measurements the floor was set
   * against were /pricing/ 84 and /refund/ 89.
   *
   * WHAT HOLDS THEM THERE HAS CHANGED AND IS NAMED RATHER THAN IMPLIED. hreflang no longer costs a
   * single-language page anything: a page that declares no hreflang is marked not applicable rather
   * than failed, because one fetched page cannot distinguish a single-language site from a
   * multilingual one that has not declared its versions. markdown twins exist for the homepage and
   * the rule pages, but not for /pricing/ or /refund/ - that is the markdown-alternate failure still
   * in the list below, and it is the same single finding that now holds /privacy/ at 99 and /terms/
   * at 98 (terms also carries a meta description outside the published range). The other two -
   * quotations and authority-citations - ask a price list and a refund policy for external citations
   * they do not have and should not invent.
   *
   * WHAT WAS GENUINELY MISSING AND WAS ADDED ON 2026-10-23: an FAQ block on /pricing/ (the analyser's
   * `faq` and `qa-headings`), which is worth having for readers rather than for the score. /refund/
   * still needs a list or table (`extractables`). If either page ever becomes prerendered and drops
   * BELOW 80, that is a regression rather than a page type, and this floor will fail the build.
   */
  { route: "/pricing/", file: "pricing.html", indexable: true, min: 80 },
  { route: "/refund/", file: "refund.html", indexable: true, min: 80 },
  // Tool output, generated per request and disallowed in robots.txt.
  { route: "/report/", file: "report.html", indexable: false },
  // Where Creem sends a buyer after payment. It is noindex and absent from the sitemap, so it is
  // listed here only so that no page goes unaccounted for - and deliberately without a content
  // floor, because a page nobody should reach by searching has no reason to satisfy one.
  { route: "/thanks/", file: "thanks.html", indexable: false },
];

/*
 * The /checks/ reference pages are DISCOVERED rather than listed.
 *
 * There are 38 of them plus a hub, and a hand-written list would quietly stop
 * covering a rule the next time one is added - which is the exact failure mode this
 * script exists to catch, one level up. Anything the build wrote under checks/ is
 * scored, so a new rule page cannot escape the gate by being new.
 *
 * Their floor is set below an A and the reason is recorded rather than implied:
 * a single-rule reference page is short by nature, and padding it with an invented
 * statistic or a questionnaire would raise the number while making the page worse.
 * Measured on this build they score 96 or 98, and the two checks that hold them off
 * 100 are both deliberate: hreflang, because this site serves one language and
 * publishes that it does, and word-count, on the rules whose entire published
 * content is one sentence. What is not acceptable is one of them dropping into the
 * 70s, which would mean the page had lost its content rather than never having had
 * much.
 */
const CHECKS_FLOOR = 80;

const checksDir = join(APP_DIR, "checks");
if (existsSync(checksDir)) {
  if (existsSync(join(APP_DIR, "checks.html"))) {
    ROUTES.push({ route: "/checks/", file: "checks.html", indexable: true });
  }
  const files = readdirSync(checksDir)
    .filter((name) => name.endsWith(".html"))
    .sort();
  for (const file of files) {
    ROUTES.push({
      route: `/checks/${file.replace(/\.html$/, "")}/`,
      file: `checks/${file}`,
      indexable: true,
      min: CHECKS_FLOOR,
    });
  }
}

const args = process.argv.slice(2);
const warnOnly = args.includes("--warn-only");
const thresholdArg = args.find((a) => a.startsWith("--threshold="));
const threshold = thresholdArg ? Number(thresholdArg.split("=")[1]) : 90;

function readIfPresent(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

if (!existsSync(APP_DIR)) {
  console.error(`No build found at ${APP_DIR}. Run \`npm run build\` first.`);
  process.exit(1);
}

// The support files are site-wide, so they are read once. Reading them means the
// score here matches what a real scan of the deployed site would produce, rather
// than scoring every page as if robots.txt, llms.txt and the sitemap were missing.
//
// Getting this wrong is not a small error: the first version of this script
// passed sitemapText: null, so every route was reported as failing sitemap-valid
// and the whole site looked four points worse than it is. A self-check that
// invents failures is worse than no self-check, because it trains you to ignore it.
const robotsText = readIfPresent(join(PUBLIC_DIR, "robots.txt"));
const llmsText = readIfPresent(join(PUBLIC_DIR, "llms.txt"));
// next build writes route handlers to a .body file rather than an .html one.
const sitemapText = readIfPresent(join(APP_DIR, "sitemap.xml.body"));

if (!sitemapText) {
  console.warn(
    "warning: sitemap.xml.body not found in the build, so sitemap-valid will fail for every route.\n"
  );
}

console.log("Scoring built HTML with the scanner's own analyser");
console.log(`threshold for indexable routes: ${threshold} (grade A)\n`);

const failures: string[] = [];
const skipped: string[] = [];
/** The homepage's result, kept so it can be compared with the published self-audit record. */
let homeResult: ReturnType<typeof analyze> | null = null;

for (const { route, file, indexable, min } of ROUTES) {
  const path = join(APP_DIR, file);
  if (!existsSync(path)) {
    skipped.push(`${route} (no ${file} in the build)`);
    continue;
  }

  const html = readFileSync(path, "utf8");
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
    /*
     * The route decides which checks apply. Without it every page is treated as a
     * homepage and the legal pages get marked down for having no expert quotations,
     * which is the false positive the page-type exemption exists to remove.
     */
    path: route,
  });

  if (route === "/") homeResult = result;

  const floor = min ?? threshold;
  const flag = indexable ? " " : "~";
  const status = result.score >= floor ? "ok  " : "LOW ";
  const excluded =
    result.checksNotApplicable > 0
      ? `  ${result.checksNotApplicable} n/a (${result.pageType})`
      : "";
  console.log(
    `${flag}${status}${String(result.score).padStart(3)} ${result.grade}  ` +
      `${route.padEnd(32)} ${result.checksPassed}/${result.checksRun} checks${excluded}`
  );

  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      console.log(`         [${issue.severity}] ${issue.id} — ${issue.title}`);
    }
  }

  if (indexable && result.score < floor) {
    failures.push(`${route} scored ${result.score} (${result.grade}), floor ${floor}`);
  }
}

if (skipped.length > 0) {
  console.log("\nNot in this build:");
  for (const s of skipped) console.log(`  - ${s}`);
}

console.log("\n~ = deliberately noindex, reported but not gated");
console.log("Reports are generated per request and are never prerendered,");
console.log("so a low score there is expected rather than a regression.");

/*
 * THE PUBLISHED SELF-AUDIT RECORD, CHECKED AGAINST THE PAGE THAT WAS JUST SCORED.
 *
 * WHY THIS IS A GATE AND NOT A WARNING: lib/self-audit.json is not an internal note. The
 * homepage prints its score, its grade, its verification date and its failure list as a claim
 * about itself, and lib/home-content.ts reads the file at build time. `npm run build` does not
 * run scripts/self-audit.mts, so without this comparison a page edit that changes the score
 * would ship a record measured against an older page - the exact failure the generated record
 * exists to remove. Failing the run is what makes "the number is measured, not typed" true.
 *
 * measuredAt is deliberately not compared: it records the day of the measurement, so it would
 * differ from any later build even when the page is unchanged. The measurable fields are the
 * ones that describe the page.
 */
const SELF_AUDIT_PATH = join(process.cwd(), "lib", "self-audit.json");
let recordStale = false;

if (!homeResult) {
  console.log("\nThe homepage is not in this build, so lib/self-audit.json could not be compared.");
} else {
  type SelfAuditRecord = {
    score?: number;
    grade?: string;
    checksRun?: number;
    checksPassed?: number;
    notApplicable?: string[];
    failures?: string[];
  };

  let record: SelfAuditRecord | null = null;
  try {
    record = JSON.parse(readFileSync(SELF_AUDIT_PATH, "utf8")) as SelfAuditRecord;
  } catch {
    record = null;
  }

  if (!record) {
    console.log("\nself-audit record is stale — run npm run self-audit and rebuild");
    console.log("  lib/self-audit.json is missing or unreadable, so the homepage's");
    console.log("  published score cannot be verified against the built page.");
    recordStale = true;
  } else {
    /*
     * Sorted on both sides. The n/a and failure lists are sets of ids, and the order they
     * happen to be emitted in is not a claim the record makes - comparing the rendered order
     * would report drift when a check is merely moved in the catalogue.
     */
    const sameIds = (a: string[] | undefined, b: string[] | undefined) =>
      JSON.stringify([...(a ?? [])].sort()) === JSON.stringify([...(b ?? [])].sort());
    const measuredNotApplicable = homeResult.checks
      .filter((check) => check.status === "na")
      .map((check) => check.id);
    const measuredFailures = homeResult.checks
      .filter((check) => check.status === "fail")
      .map((check) => check.id);

    const differences: string[] = [];
    if (record.score !== homeResult.score) {
      differences.push(`score: record ${record.score}, built homepage ${homeResult.score}`);
    }
    if (record.grade !== homeResult.grade) {
      differences.push(`grade: record ${record.grade}, built homepage ${homeResult.grade}`);
    }
    if (record.checksRun !== homeResult.checksRun) {
      differences.push(`checksRun: record ${record.checksRun}, built homepage ${homeResult.checksRun}`);
    }
    if (record.checksPassed !== homeResult.checksPassed) {
      differences.push(
        `checksPassed: record ${record.checksPassed}, built homepage ${homeResult.checksPassed}`
      );
    }
    if (!sameIds(record.notApplicable, measuredNotApplicable)) {
      differences.push(
        `notApplicable: record ${JSON.stringify(record.notApplicable ?? [])}, built homepage ${JSON.stringify(measuredNotApplicable)}`
      );
    }
    if (!sameIds(record.failures, measuredFailures)) {
      differences.push(
        `failures: record ${JSON.stringify(record.failures ?? [])}, built homepage ${JSON.stringify(measuredFailures)}`
      );
    }

    if (differences.length > 0) {
      console.log("\nself-audit record is stale — run npm run self-audit and rebuild");
      console.log("  lib/self-audit.json does not match the built homepage:");
      for (const difference of differences) console.log(`    ${difference}`);
      console.log("  The homepage publishes these values, so they are a gate rather than a notice.");
      recordStale = true;
    } else {
      console.log(
        `\nself-audit record matches the built homepage: ${homeResult.score}/100 grade ${homeResult.grade}, ${homeResult.checksPassed}/${homeResult.checksRun} checks.`
      );
    }
  }
}

/*
 * The success line names the floors separately, because a route group that carries
 * its own floor is not covered by a claim about the default one. An earlier version
 * printed "All indexable routes are at or above 90" while the 40 check pages were
 * being measured against 80 - true of the default, misleading about the run.
 */
const defaulted = ROUTES.filter((r) => r.indexable && r.min === undefined).length;
const custom = ROUTES.filter((r) => r.indexable && r.min !== undefined);

if (failures.length > 0) {
  console.log(`\n${failures.length} indexable route(s) below their floor:`);
  for (const f of failures) console.log(`  - ${f}`);
  if (warnOnly) {
    console.log("\n--warn-only given, exiting 0.");
  } else {
    console.log(
      "\nThis is the gate working. Either fix the page or lower --threshold, but"
    );
    console.log("do not lower it silently: the number is published on /methodology/.");
    process.exitCode = 1;
  }
} else if (!recordStale) {
  console.log(`\n${defaulted} indexable route(s) are at or above ${threshold}.`);
  for (const group of custom) {
    console.log(`  plus ${group.route} and its siblings, measured against a floor of ${group.min}.`);
    break;
  }
}

if (recordStale) {
  if (warnOnly) {
    console.log("\n--warn-only given, exiting 0 despite the stale self-audit record.");
  } else {
    process.exitCode = 1;
  }
}
