/**
 * Every number, name and rule the llms.txt generator and the page that describes
 * it have to agree on, in one module.
 *
 * WHY THIS FILE EXISTS. It began as one number. app/(en)/llms-txt-studio/page.tsx tells the
 * reader how many links the draft will contain, and the answer is whatever
 * app/api/llms-txt/route.ts caps at. A number written into prose is a second copy of
 * that cap, and the two would drift the first time somebody raised the limit - leaving a
 * page that describes the tool inaccurately, on the page whose whole argument is that it
 * says what it actually does. The page imports these constants instead.
 *
 * That reason did not stop applying when the feature grew. There are now three caps
 * (per section, total fetches, per page) and two rules that produce visible wording
 * (section names, truncation), and all five are read by the page as well as by the route.
 * Anything that appears in the generated file AND in the page's description of it belongs
 * here rather than in either of them.
 */

/**
 * Maximum links listed in one section. Overflow is reported, not silently dropped.
 *
 * WHY A CAP PER SECTION RATHER THAN ONE CAP FOR THE FILE. A single global cap spends
 * itself on whichever pages the homepage happens to link to first, which on a site whose
 * homepage carries a dimension grid means the dimension links and nothing else. A section
 * cap makes every section's omission visible in its own line, and the site owner can see
 * which part of their own site was cut.
 *
 * 8 IS A CHOICE, NOT A MEASUREMENT, and it is written down as one: it is below the 12 the
 * file used to hold in total, so no single section can reproduce the "87% of the links in
 * one group" shape that makes the competitor's own file unreadable, and above the 3 an
 * llms.txt needs to be worth serving (the scanner's own rule, see
 * lib/geo/catalog.ts). Change it in one place; the studio page follows.
 */
export const MAX_LINKS_PER_SECTION = 8;

/**
 * @deprecated The file-level cap this constant stood for no longer exists. Kept as an
 * alias for one release so a stale import fails loudly at review rather than silently
 * describing the old behaviour. Use MAX_LINKS_PER_SECTION.
 */
export const MAX_LINKS = MAX_LINKS_PER_SECTION;

/**
 * How many subpages are fetched per generated file, i.e. how many links can carry a
 * description taken from their own page.
 *
 * WHY A CAP AT ALL: the generator is a free endpoint that anyone can point at any domain,
 * so "fetch every link on the homepage" would turn one HTTP request into an unbounded
 * crawl of somebody else's server. This is the number that bounds it, and it is published
 * in the response (readPages) and in the file itself.
 */
export const MAX_FETCH_PAGES = 12;

/**
 * THE REQUEST BUDGET, stated as arithmetic rather than as an aspiration.
 *
 * The homepage gets MAX_HOME_TIMEOUT_MS (the route's own FETCH_TIMEOUT_MS). The subpage
 * phase is then given MAX_SUBPAGE_BUDGET_MS of wall clock for the whole phase, and every
 * individual page is additionally capped at MAX_SUBPAGE_TIMEOUT_MS. Both clocks are real:
 * the phase deadline is checked before a page is fetched and the per-page timeout is
 * clamped to whatever is left of it, so the phase cannot outlive its budget however slow
 * the target is.
 *
 * Worst case a caller waits: 9s + 20s = 29s, and that is the number that matters for
 * somebody holding a browser tab open. The subpages are fetched SUBPAGE_CONCURRENCY at a
 * time with a FETCH_STAGGER_MS gap between batches, so a normal site's twelve pages resolve
 * in a few seconds rather than in twelve timeouts' worth of them. Ceil(12/4) = 3 batches
 * means the worst case is 3 x 6s = 18s, inside the 20s phase budget rather than racing it.
 *
 * Nothing here is near a platform limit: the account is on Workers Paid, where CPU time and
 * subrequest count stop being the binding constraints. The constraint this design protects
 * is the one a budget cannot measure on the platform's behalf, which is the patience of the
 * person who typed the domain.
 */
export const SUBPAGE_BUDGET = {
  /** Wall clock for the whole subpage phase. */
  phaseMs: 20_000,
  /** Wall clock for one subpage. */
  perPageMs: 6_000,
  /** Pages in flight at once. */
  concurrency: 4,
  /** Gap between concurrency batches, so one host is not hit by all of them at once. */
  staggerMs: 800,
  /** Below this much remaining budget a fetch is not started at all. */
  minRemainingMs: 1_200,
} as const;

/** Homepage fetch timeout. Same value the route used before this change. */
export const HOME_TIMEOUT_MS = 9_000;

/**
 * Section names, keyed by the first path segment, and the order they appear in.
 *
 * THE GROUPING RULE, stated as a rule rather than as taste: a page belongs to the section
 * named after the FIRST SEGMENT OF ITS PATH (`/docs/llms-txt-deployment/` -> `docs`), and
 * the label shown for that group comes from this table. A segment the table does not name
 * still becomes its own section - it simply shows its own segment as its name - which is
 * what keeps this from being a second, invisible exclusion list: an unmapped section is
 * visible in the output, so the next person can see it and name it.
 *
 * SECTION ORDER is this table's order, then any unnamed segment in the order the homepage
 * first links to it. That means the order is fully determined by the path and by the
 * homepage, not by link counts - a count-based order would move the headings every time
 * the site owner added a page.
 *
 * The first three are this project's own vocabulary, which is why they are named rather
 * than left as `docs` and `checks`.
 */
export const SECTION_NAMES: Record<string, string> = {
  docs: "Documentation",
  checks: "The check reference",
  dimensions: "Scoring dimensions",
  methodology: "Methodology",
  study: "Measurement",
  about: "Company",
  contact: "Company",
  privacy: "Legal",
  terms: "Legal",
  "llms-txt-studio": "Tools",
  "readiness-badge": "Tools",
  "answer-check": "Tools",
};

/** Sections that share a name are merged, and this is the order they appear in. */
export const SECTION_ORDER = [
  "Documentation",
  "The check reference",
  "Scoring dimensions",
  "Methodology",
  "Measurement",
  "Tools",
  "Company",
  "Legal",
];

/**
 * The fallback section's name, in each language the generator writes in.
 *
 * A page whose path has no named first segment goes here rather than into a section called
 * by a bare path fragment, because a heading made of a URL segment is not a heading. The
 * route appends the segment count to it: `More pages (2 segments)`.
 */
export const OTHER_SECTION = { en: "More pages", de: "Weitere Seiten" } as const;

/**
 * The German half of the same tables.
 *
 * WHY THIS IS NOT A TRANSLATION OF THE ENGLISH NAMES IN CODE: a site in German should get a
 * file whose headings are German, and the previous version of this generator already learned
 * that lesson the hard way - it emitted English scaffolding around German content. Names
 * fall back to the English section when a German one is not declared, which is a visible
 * compromise rather than a silent one.
 */
const SECTION_NAMES_DE: Record<string, string> = {
  docs: "Dokumentation",
  checks: "Prüfregeln",
  dimensions: "Bewertungsdimensionen",
  methodology: "Methodik",
  study: "Messung",
  about: "Unternehmen",
  contact: "Unternehmen",
  privacy: "Rechtliches",
  terms: "Rechtliches",
  "llms-txt-studio": "Werkzeuge",
  "readiness-badge": "Werkzeuge",
  "answer-check": "Werkzeuge",
};

const SECTION_ORDER_DE = [
  "Dokumentation",
  "Prüfregeln",
  "Bewertungsdimensionen",
  "Methodik",
  "Messung",
  "Werkzeuge",
  "Unternehmen",
  "Rechtliches",
];

/**
 * A first segment that is a language tag, such as `en` or `en-gb`.
 *
 * The two tables above share their English segment keys by design: the path is the path in
 * either language and only the printed label changes, so `/docs/x` is Documentation in
 * English and Dokumentation in German. A language prefix is the one first segment that
 * cannot be a section name, so it is skipped when a section is being named.
 */
export const LANGUAGE_SEGMENT = /^[a-z]{2}(-[a-z]{2})?$/i;

/**
 * Paths in the sitemap sense of "not a page": what a soft 404 looks like.
 *
 * A URL can answer 200 with a "Page not found" heading, and this generator must not print
 * that heading as though it described a page. A page that trips this rule is treated
 * exactly like a 404: omitted, and counted in the response - never described.
 */
export const SOFT_404 = /(^|\b)(404|410|not found|page not found|does not exist|no longer available|seite nicht gefunden|nicht gefunden)(\b|$)/i;
