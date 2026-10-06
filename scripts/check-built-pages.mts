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

const APP_DIR = join(process.cwd(), ".next", "server", "app");
const PUBLIC_DIR = join(process.cwd(), "public");

type Route = { route: string; file: string; indexable: boolean; min?: number };

const ROUTES: Route[] = [
  { route: "/", file: "index.html", indexable: true },
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
  { route: "/about/", file: "about.html", indexable: true },
  { route: "/contact/", file: "contact.html", indexable: true },
  { route: "/docs/", file: "docs.html", indexable: true },
  { route: "/docs/llms-txt-deployment/", file: "docs/llms-txt-deployment.html", indexable: true },
  { route: "/docs/allow-ai-crawlers/", file: "docs/allow-ai-crawlers.html", indexable: true },
  { route: "/docs/qa-style-headings/", file: "docs/qa-style-headings.html", indexable: true },
  { route: "/docs/schema-org-jsonld/", file: "docs/schema-org-jsonld.html", indexable: true },
  { route: "/docs/ai-visibility-self-check/", file: "docs/ai-visibility-self-check.html", indexable: true },
  { route: "/answer-check/", file: "answer-check.html", indexable: true },
  { route: "/privacy/", file: "privacy.html", indexable: true },
  { route: "/terms/", file: "terms.html", indexable: true },
  // Tool output, generated per request and disallowed in robots.txt.
  { route: "/report/", file: "report.html", indexable: false },
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
 * The scan's own content-depth checks are doing their job by scoring these in the
 * mid-80s. What is not acceptable is one of them dropping into the 70s, which would
 * mean the page had lost its content rather than never having had much.
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
} else {
  console.log(`\n${defaulted} indexable route(s) are at or above ${threshold}.`);
  for (const group of custom) {
    console.log(`  plus ${group.route} and its siblings, measured against a floor of ${group.min}.`);
    break;
  }
}
