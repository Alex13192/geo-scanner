import { AUTHOR } from "@/lib/author";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { FAQ_ITEMS, SELF_AUDIT, TAGLINE } from "@/lib/home-content";
import { INSIGHTS } from "@/lib/insights";
import { BRAND, CONTACT_EMAIL, SITE_HOST, SITE_URL } from "@/lib/site";
import {
  AVERAGE,
  BLOCKED,
  NEWS,
  NEWS_BLOCKED,
  SCAN_DATE,
  STUDY_DATA_PATH,
  STUDY_ROWS,
} from "@/lib/study-data";

/**
 * /markdown/ - the markdown twin of the homepage.
 *
 * WHY THIS IS GENERATED AND NOT A FILE IN public/: a hand-written .md next to a page is a
 * second copy of its content, and the second copy drifts the first time somebody edits one
 * of them. Everything below is derived from the same modules the HTML page renders -
 * lib/home-content.ts for the H1's supporting copy and the FAQ, lib/geo/catalog.ts for the
 * method, lib/study-data.ts for the study, lib/author.ts and lib/site.ts for who publishes
 * it. That is the same reasoning as the rule-page twins at /checks/<id>/markdown/, and the
 * only reason a twin is worth publishing: it cannot say something the page does not.
 *
 * WHY A ROUTE AND NOT A `<name>.md` FILE NAME: the App Router has no segment syntax that maps
 * a static markdown file name onto this page, and putting the file in public/ would make it a
 * hand-written copy by another route. The URL shape is not part of the convention - the
 * declaration in ./layout.tsx is - so /markdown/ is served here and the rel="alternate" link
 * points at it.
 *
 * WHY THIS IS DYNAMIC AND NOT PRERENDERED: @opennextjs/cloudflare does not support the edge
 * runtime, and a route handler that runs on Node cannot be a static asset. Nothing here needs
 * generating ahead of time anyway - every input is a module already in the worker bundle, so
 * a dynamic handler does no I/O. This mirrors the rule-page twin exactly; see the longer note
 * in app/(en)/checks/[id]/markdown/route.ts and the runtime history in app/api/scan/route.ts.
 */
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Numbers derived from the modules that publish them                  */
/* ------------------------------------------------------------------ */

/*
 * NOTHING BELOW IS TYPED IN. Each value is computed from the catalogue or the study data the
 * HTML page also derives its figures from, so adding a rule, a dimension or a study row
 * cannot leave this twin quoting an old count - the failure lib/home-content.ts argues against
 * at length for the page's own words.
 */
const CHECKS_PUBLISHED = CHECK_CATALOG.filter((check) => !check.alias).length;
const WEIGHT_TOTAL = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);
const SITES_MEASURED = STUDY_ROWS.length;
const SITES_BLOCKED = BLOCKED.length;
const SITES_WITHOUT_ENTITY = STUDY_ROWS.filter((row) => !row.entity).length;
const SITES_WITH_SAMEAS = STUDY_ROWS.filter((row) => row.sameAs).length;
const SITES_GRADED_A = STUDY_ROWS.filter((row) => row.grade === "A").length;

/**
 * The page's H1, verbatim.
 *
 * It is the one sentence in this file that cannot be imported: page.tsx writes it in JSX and
 * lib/home-content.ts does not export it. It is repeated knowingly rather than paraphrased,
 * because a twin whose H1 disagreed with the page would be a second version of the page - the
 * exact thing this route exists to avoid. If the page's H1 changes, this line changes with it.
 */
const HOME_H1 = "Is your site built to be cited by AI search engines?";

export async function GET() {
  const lines: string[] = [];

  lines.push(
    `# ${HOME_H1}`,
    "",
    TAGLINE,
    "",
    `${BRAND} audits a site against ${CHECKS_PUBLISHED} published checks in ${DIMENSION_CATALOG.length} weighted dimensions, worth ${WEIGHT_TOTAL} points in total. This page is the markdown representation of ${SITE_URL}/ and is generated from the same modules the HTML page renders, so the two cannot drift apart.`,
    ""
  );

  /*
   * The scope statement sits near the top on purpose, the way the page's own first screen
   * states it: a reader or a crawler that stops after the introduction still learns that this
   * is a readiness audit and not a mention tracker.
   */
  lines.push(
    "## What this audit does not measure",
    "",
    `It does not measure mention share: it never queries an AI engine about your brand, so it cannot say how often your name appears in an answer, or where. Mention share - the fraction of generated answers that name you - is a different measurement, and nothing here should be read as one. What it measures is whether your pages can be crawled, parsed and cited at all. The full scope is published at ${SITE_URL}/about/.`,
    ""
  );

  /* ---- The method: dimensions, weights and the checks inside them ---- */
  lines.push(
    `## The ${DIMENSION_CATALOG.length} dimensions and the ${CHECKS_PUBLISHED} checks`,
    "",
    `Each dimension carries a published share of the total score, and the weights add up to ${WEIGHT_TOTAL}. The rule behind every check, and how to fix a failure, are published on the check's own page.`,
    ""
  );

  for (const dimension of DIMENSION_CATALOG) {
    const checks = CHECK_CATALOG.filter(
      (check) => check.dimension === dimension.id && !check.alias
    );
    lines.push(`### ${dimension.label} — ${dimension.weight}% of the total score`, "");
    for (const check of checks) {
      const title = CHECK_COPY[check.id]?.title ?? check.id;
      lines.push(
        `- [${title}](${SITE_URL}/checks/${check.id}/) — \`${check.id}\`, ${check.points} ${check.points === 1 ? "point" : "points"}`
      );
    }
    lines.push("");
  }

  lines.push(
    `The full method, the reasoning behind each weight and an account of what the score cannot tell you are at ${SITE_URL}/methodology/. Every rule is listed at ${SITE_URL}/checks/.`,
    ""
  );

  /* ---- The study behind the weights ---- */
  lines.push(
    "## The study behind the weights",
    "",
    `The site's own published study scanned ${SITES_MEASURED} sites on ${SCAN_DATE}. Across the sites that answered, the average score was ${AVERAGE}, and ${SITES_GRADED_A} of ${SITES_MEASURED} graded an A. ${SITES_BLOCKED} of ${SITES_MEASURED} disallowed at least one tracked AI crawler; ${NEWS_BLOCKED.length} of the ${NEWS.length} news publishers did. ${SITES_WITHOUT_ENTITY} of ${SITES_MEASURED} declared no Organization or WebSite entity, and ${SITES_WITH_SAMEAS} declared sameAs.`,
    "",
    `The rows, the status codes and the caveats are published at ${SITE_URL}/study/, and the same data is downloadable at ${SITE_URL}${STUDY_DATA_PATH}.`,
    ""
  );

  /* ---- This site's own measurement, from the generated record ---- */
  const notApplicable =
    SELF_AUDIT.notApplicable.length > 0
      ? `${SELF_AUDIT.notApplicable.length} not applicable (${SELF_AUDIT.notApplicable.join(", ")})`
      : "no check marked not applicable";
  const failures =
    SELF_AUDIT.failures.length > 0
      ? `failures: ${SELF_AUDIT.failures.join(", ")}`
      : "no check failed";

  lines.push(
    "## This site, measured the same way",
    "",
    `The same analyser scores this homepage: ${SELF_AUDIT.score} / 100, grade ${SELF_AUDIT.grade}, ${SELF_AUDIT.passed} of ${SELF_AUDIT.applicable} applicable checks passing, ${notApplicable}, ${failures}. Measured on ${SELF_AUDIT.verified}. The figure is a generated record rather than a typed number, it is re-measured weekly, and the date is the last measurement rather than the last edit. The site's own report is at ${SITE_URL}/report/?domain=${SITE_HOST}.`,
    ""
  );

  /* ---- The free tools ---- */
  lines.push(
    "## The free tools",
    "",
    `- Audit report for any domain: ${SITE_URL}/report/?domain=${SITE_HOST}`,
    `- /llms.txt studio: ${SITE_URL}/llms-txt-studio/`,
    `- Readiness badge for a README or a footer: ${SITE_URL}/readiness-badge/`,
    ""
  );

  /* ---- FAQ: the same array the page renders, so the answers cannot differ ---- */
  lines.push("## FAQ", "");
  for (const item of FAQ_ITEMS) {
    lines.push(`### ${item.q}`, "", item.a, "");
  }

  /* ---- Who is accountable, and where to check the work ---- */
  lines.push(
    "## Who is accountable for this measurement",
    "",
    `${AUTHOR.name} (${AUTHOR.role}) writes and maintains ${BRAND}. The byline, the bio and the public account the work is published under are at ${SITE_URL}${AUTHOR.path}. The source is at ${AUTHOR.githubRepo}.`,
    "",
    `Contact: ${CONTACT_EMAIL}. Writing on the method and the study: ${SITE_URL}/insights/ (${INSIGHTS.length} pieces).`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // The HTML page is the canonical version; this is a representation of it.
      "x-markdown-twin-of": "/",
    },
  });
}
