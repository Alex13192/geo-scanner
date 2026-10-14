/**
 * One GEO scan, from a domain to an analysis.
 *
 * WHY THIS EXISTS AS ITS OWN MODULE. It was the body of app/api/scan/route.ts, and the weekly
 * report needs the same thing. The consumer cannot call that endpoint instead: it is rate
 * limited to 20 requests a minute per client, so a run over a hundred subscribers would be
 * refused by its own site a fifth of the way in. Copying the fetch policy into the cron was
 * the other option and a worse one - two places that decide which four files a GEO audit
 * reads, and eventually two answers to the same question.
 *
 * WHAT STAYED IN THE ROUTE: everything about being an HTTP endpoint. Rate limiting, parameter
 * parsing, the shape of the response, and the `brief` form. What moved here is the part that
 * is true of a scan whoever asked for it.
 *
 * The weekly report's own page promises that "nothing in the weekly run is scored differently
 * from a manual scan". This module is what makes that sentence structural rather than a claim.
 */
/*
 * Explicit .ts extensions, which is the convention inside lib/geo - see the imports in
 * check-meta.ts. It is what lets the scripts/ suites run these files with plain `node` rather
 * than through a bundler, and it is how this file was verified end to end before being
 * committed. allowImportingTsExtensions is on, and both Next and the cron worker's esbuild
 * resolve them.
 *
 * The `@/` alias is deliberately not used for lib/site: this module is bundled into a second
 * wrangler config, and path-alias resolution there is not something to depend on.
 */
import { analyze, type AnalyzeResult, type Issue, type PageType } from "./analyze.ts";
import {
  fetchText,
  inspectTarget,
  type FetchOptions,
  type SafeFetchResult,
} from "../net/fetch-safe.ts";
import { SITE_URL } from "../site.ts";

/**
 * We identify ourselves honestly rather than impersonating GPTBot.
 *
 * Impersonating a crawler is why the previous version produced false positives on cisco.com
 * and 163.com: those sites verify crawlers by IP address, so a spoofed GPTBot user-agent from
 * our infrastructure is refused as a spoofer even when real GPTBot traffic is perfectly
 * welcome. Whether a site blocks AI crawlers is answered authoritatively by robots.txt, not by
 * guessing.
 *
 * The origin comes from SITE_URL rather than being written out: scripts/check-values.mjs
 * refuses a second copy of it anywhere under lib/, and it caught this line when the address
 * was a literal - which is the check doing its job.
 */
export const CRAWLER_UA = `Mozilla/5.0 (compatible; LLMentionBot/1.0; +${SITE_URL}/methodology/)`;

/**
 * Sent only as a second probe, and only when the first request was refused.
 *
 * WHY A SCANNER MAY DO THIS AT ALL: the refusal has two completely different meanings and
 * nothing else separates them. If a browser-shaped request is served while a crawler-shaped
 * one is refused, the site is running a rule aimed at identified bots - and GPTBot, ClaudeBot,
 * PerplexityBot and OAI-SearchBot all present as bots, so the rule blocks the engines the
 * audit is about. If both are refused, the block is about the address the scan came from and
 * says nothing about the site. Reporting the first case as "not a GEO problem", which is what
 * the old copy did, was backwards.
 *
 * This is a diagnostic, not a disguise: its result is used only for the access verdict, never
 * to score page content, and it is disclosed in the published rule for robots-ai-allowed.
 */
export const BROWSER_PROBE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const FETCH_TIMEOUT_MS = 9000;

/**
 * The three support files a scan reads, alongside the page itself.
 *
 * Carried as a unit because "which files a GEO audit reads" is one decision that two
 * callers now need: runScan reads them for the page it was asked about, and
 * runSiteScan reads them for every further page it adds. Fetching them twice would be
 * two answers to that one question, which is the duplication this module's header
 * already exists to prevent.
 */
export type SupportFiles = {
  robotsText: string | null;
  llmsText: string | null;
  sitemapText: string | null;
};

/** The three support files, fetched in parallel. A failure is itself a finding, so each returns null. */
async function fetchSupportFiles(
  scheme: "https" | "http",
  domain: string,
  fetchOptions: FetchOptions
): Promise<SupportFiles> {
  const [robots, llms, sitemap] = await Promise.all([
    fetchText(`${scheme}://${domain}/robots.txt`, fetchOptions),
    fetchText(`${scheme}://${domain}/llms.txt`, fetchOptions),
    fetchText(`${scheme}://${domain}/sitemap.xml`, fetchOptions),
  ]);

  return {
    robotsText: robots && robots.status === 200 ? robots.body : null,
    llmsText: llms && llms.status === 200 ? llms.body : null,
    sitemapText: sitemap && sitemap.status === 200 ? sitemap.body : null,
  };
}

export type ScanOutcome =
  | { reachable: false }
  | {
      reachable: true;
      domain: string;
      scheme: "https" | "http";
      homeStatus: number;
      browserStatus: number | null;
      finalUrl: string;
      /** The body was cut at the fetcher's size cap, which changes what was scored. */
      truncated: boolean;
      result: AnalyzeResult;
      /**
       * The support files this scan already fetched.
       *
       * NOT part of the HTTP response - the route picks the fields it publishes, and
       * every other caller reads `result`. Carried so runSiteScan can score further
       * pages against the same robots.txt, llms.txt and sitemap.xml rather than
       * fetching them a second time.
       */
      support: SupportFiles;
    };

export async function runScan(
  domain: string,
  options: { timeoutMs?: number } = {}
): Promise<ScanOutcome> {
  const fetchOptions = {
    userAgent: CRAWLER_UA,
    acceptLanguage: "en;q=0.9,*;q=0.5",
    timeoutMs: options.timeoutMs ?? FETCH_TIMEOUT_MS,
  };

  /*
   * Homepage, over https first and http as a fallback. Remember which scheme worked: it
   * decides the HTTPS check, and the support files have to be requested over the same scheme.
   * Fetching robots.txt, llms.txt and sitemap.xml over https:// for an http-only site
   * invented three failures.
   */
  let scheme: "https" | "http" = "https";
  let home: SafeFetchResult | null = await fetchText(`${scheme}://${domain}`, fetchOptions);

  if (!home && inspectTarget(`http://${domain}`).ok) {
    scheme = "http";
    home = await fetchText(`${scheme}://${domain}`, fetchOptions);
  }

  /*
   * One extra request, and only when the first was refused: ask the same URL again as a
   * browser. This is what tells "your WAF refuses identified bots" apart from "our address is
   * blocked", which the score should not conflate. The access verdict still honours robots.txt
   * first: a site can refuse us *and* publish a disallow, and the disallow is the certain fact
   * of the two.
   */
  let browserStatus: number | null = null;
  if (home && home.status !== 200) {
    const probe = await fetchText(`${scheme}://${domain}`, {
      ...fetchOptions,
      userAgent: BROWSER_PROBE_UA,
    });
    browserStatus = probe ? probe.status : null;
  }

  // No HTTP response at all on either scheme: the domain really is unreachable.
  if (!home) return { reachable: false };

  // The three support files, fetched once for the site. A failure here is itself a finding,
  // so each comes back as null rather than throwing.
  const support = await fetchSupportFiles(scheme, domain, fetchOptions);

  const result = analyze({
    domain,
    scheme,
    homeStatus: home.status,
    browserStatus,
    html: home.body,
    robotsText: support.robotsText,
    llmsText: support.llmsText,
    sitemapText: support.sitemapText,
    lastModifiedHeader: home.lastModified,
    /*
     * The path the page was finally served from, which is what decides whether checks like
     * `quotations` or `about-contact` are fair questions for this page at all. Taken from the
     * final URL rather than the requested domain, so a redirect to /privacy/ is classified as
     * the page that was actually read.
     */
    path: (() => {
      try {
        return new URL(home.finalUrl).pathname;
      } catch {
        return undefined;
      }
    })(),
  });

  return {
    reachable: true,
    domain,
    scheme,
    homeStatus: home.status,
    browserStatus,
    finalUrl: home.finalUrl,
    truncated: home.truncated,
    result,
    support,
  };
}

/* ------------------------------------------------------------------ */
/* Site-level scan (opt-in)                                            */
/* ------------------------------------------------------------------ */

/*
 * WHY A SINGLE PAGE IS NOT A SITE.
 *
 * Every scan above reads one page - the homepage - and scores it. That is the right
 * unit for the free endpoint, and it is also its ceiling: a homepage scoring 16 can
 * belong to a site whose documentation scores 80, and a homepage scoring 90 can
 * belong to a site whose pricing page is invisible to every crawler. The number is
 * real; the claim a reader hears from it is not.
 *
 * Nothing below changes that. The site scan is opt-in, the free endpoint's default
 * path is byte-for-byte what it was, and every page it adds is scored by the same
 * analyze() with the same robots.txt, llms.txt and sitemap.xml - so a per-page score
 * means exactly what a homepage score has always meant.
 */

/**
 * How many pages beyond the homepage a site scan reads by default.
 *
 * Five is a budget, not a sample size. Every page is a full fetch plus a full
 * analyze() pass, and the whole thing has to finish inside one HTTP request whose
 * caller is waiting. The number is echoed back in the response, so a reader can tell
 * "we read five" from "the site has five".
 */
export const SITE_SCAN_MAX_PAGES = 5;

/**
 * Ceiling for an explicitly requested page count.
 *
 * Above the default, because a caller who asks for eight pages knows its own site; not
 * unbounded, because the caller is a stranger and this endpoint is public. A crawl is
 * a different product from a scan.
 */
export const SITE_SCAN_PAGES_CEILING = 10;

/**
 * How many child sitemaps of a sitemap index are read.
 *
 * A sitemap index is what a site with more than 50,000 URLs must publish, and plenty of
 * smaller sites publish one anyway. One level is followed and no more: a deeper walk is
 * a crawl, and the budget here is a handful of pages rather than a mirror of the site.
 */
const MAX_SITEMAP_CHILDREN = 3;

/**
 * Extensions a sitemap lists that are not pages a GEO audit can score.
 *
 * A sitemap is a list of everything a crawler may read, which includes images, PDFs and
 * feeds. Scoring an image as a page would produce a real-looking number for a question
 * nobody asked.
 */
const NON_PAGE_EXTENSION =
  /\.(pdf|jpe?g|png|gif|svg|webp|avif|ico|bmp|tiff?|mp4|m4v|webm|mov|avi|mp3|wav|ogg|flac|zip|gz|tgz|tar|rar|7z|dmg|exe|apk|docx?|xlsx?|pptx?|csv|tsv|txt|json|xml|rss|atom|css|js|mjs|cjs|map|woff2?|ttf|otf|eot|wasm)$/i;

/** `<loc>` values are XML-escaped, and `&amp;` inside a query string is the common case. */
function unescapeXml(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos);/gi, (whole, entity: string) => {
    switch (entity.toLowerCase()) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
        return "'";
      default:
        return whole;
    }
  });
}

/** Every `<loc>` in a sitemap or sitemap index, in document order. */
export function sitemapLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) out.push(unescapeXml(match[1]));
  return out;
}

/** True for a sitemap of pages, false for a sitemap of sitemaps. */
export function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml);
}

/**
 * Which of a sitemap's pages to score, and how many it offered.
 *
 * DELIBERATELY DETERMINISTIC, and deliberately sectioned. Deterministic because the
 * same input must always yield the same pages: a comparison between two scans of one
 * site has to be a comparison of the site rather than of a shuffle. Sectioned because
 * five budget slots spent on five posts under /blog/ would report a site's blog and
 * call it the site - so the first page of each top-level section is taken first, in
 * the order the sitemap introduced the sections, and only then is any remaining budget
 * spent on the next pages the sitemap named.
 */
export function sitemapPagePaths(
  xml: string,
  domain: string,
  limit: number
): { paths: string[]; considered: number } {
  const host = domain.toLowerCase().replace(/^www\./, "");
  const seen = new Set<string>();
  const firstOfSection = new Map<string, string>();
  let considered = 0;

  for (const raw of sitemapLocs(xml)) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== host) continue;
    // Trailing slashes stripped, so /about and /about/ are one page and not two.
    const path = url.pathname.replace(/\/+$/, "") || "/";
    // The homepage is the scan the caller already has. Adding it again would count
    // its score twice in the site average.
    if (path === "/") continue;
    if (NON_PAGE_EXTENSION.test(path)) continue;
    considered += 1;
    if (seen.has(path)) continue;
    seen.add(path);
    const section = path.split("/")[1] ?? "";
    if (!firstOfSection.has(section)) firstOfSection.set(section, path);
  }

  const paths = [...firstOfSection.values()].slice(0, limit);
  if (paths.length < limit) {
    // Fewer sections than slots: spend the rest on the next pages the sitemap named.
    for (const path of seen) {
      if (paths.length >= limit) break;
      if (!paths.includes(path)) paths.push(path);
    }
  }

  return { paths, considered };
}

/**
 * The sitemap bodies to read pages from - the sitemap itself, or the child sitemaps a
 * sitemap index points at. Returns an empty list when there is nothing usable, which
 * the caller reports as a note rather than as a zero.
 */
async function gatherSitemapXml(
  domain: string,
  support: SupportFiles,
  fetchOptions: FetchOptions
): Promise<string[]> {
  const first = support.sitemapText;
  // The same test analyze() uses for sitemap-valid, so "we could not read it" and
  // "there is nothing in it" cannot disagree between the two.
  if (!first || !/<urlset|<sitemapindex/i.test(first)) return [];
  if (!isSitemapIndex(first)) return [first];

  const host = domain.toLowerCase().replace(/^www\./, "");
  const children = sitemapLocs(first)
    .filter((loc) => {
      try {
        return new URL(loc).hostname.toLowerCase().replace(/^www\./, "") === host;
      } catch {
        return false;
      }
    })
    .slice(0, MAX_SITEMAP_CHILDREN);

  const bodies = await Promise.all(
    children.map(async (child) => {
      const res = await fetchText(child, fetchOptions);
      return res && res.status === 200 && /<urlset/i.test(res.body) ? res.body : null;
    })
  );

  return bodies.filter((body): body is string => body !== null);
}

/** The per-page line of a site scan: enough to compare pages without shipping each page's full report. */
export type SitePage = {
  url: string;
  path: string;
  status: number;
  score: number;
  grade: string;
  gradeLabel: string;
  checksRun: number;
  checksPassed: number;
  issueCount: number;
  pageType: PageType;
};

/** An issue seen on more than one page of the site, which is what "site-wide" means here. */
export type SiteIssueFrequency = {
  id: string;
  title: string;
  severity: Issue["severity"];
  /** The dimension label the analyser filed this issue under. */
  dimension: string;
  pagesAffected: number;
  /**
   * The fix, carried because an issue that recurs across pages is the most actionable
   * thing a scan finds - and because a caller cannot look it up: the per-page issue
   * lists may not include a page that had it. Identical wherever the id appears, so one
   * copy serves every page it was seen on.
   */
  recommendation: string;
};

export type SiteScanOutcome = {
  /** Pages actually scored, the homepage included. */
  pagesScanned: number;
  /** Same-site candidate pages the sitemap offered, before the cap was applied. */
  pagesConsidered: number;
  /** The cap that was applied, echoed so a capped run is not mistaken for a small site. */
  maxPages: number;
  /** Mean of the scored pages' scores, rounded. */
  siteScore: number;
  /** How the pages were chosen, in words, because the rule above is a judgement call. */
  selection: string;
  pages: SitePage[];
  /** Lowest and highest scoring page, or null when only the homepage could be read. */
  weakestPage: SitePage | null;
  strongestPage: SitePage | null;
  /** Issues present on two or more scored pages, most widespread first. */
  issueFrequency: SiteIssueFrequency[];
  /** Why there are no further pages, when there are none. Null on a full site scan. */
  note: string | null;
};

/** A page's summary line plus the issues behind it, which the frequency count needs. */
type PageScan = { page: SitePage; issues: Issue[] };

function pageSummary(url: string, status: number, result: AnalyzeResult): SitePage {
  let path = "/";
  try {
    path = new URL(url).pathname;
  } catch {
    /* A URL the fetcher returned and the URL parser refuses cannot happen; "/" is the honest default. */
  }
  return {
    url,
    path,
    status,
    score: result.score,
    grade: result.grade,
    gradeLabel: result.gradeLabel,
    checksRun: result.checksRun,
    checksPassed: result.checksPassed,
    issueCount: result.issues.length,
    pageType: result.pageType,
  };
}

/**
 * Score one already-chosen page, against support files fetched once for the site.
 *
 * Deliberately NOT routed through runScan. runScan also does the https-to-http
 * fallback and the refusal probe, and both answer questions about a site's entry point
 * rather than about each of its pages. A sub-page scored over a different scheme, or
 * carrying its own browser probe, would make the per-page numbers mean different
 * things - which is the opposite of why the site scan exists.
 */
async function scanPage(
  path: string,
  scheme: "https" | "http",
  domain: string,
  support: SupportFiles,
  fetchOptions: FetchOptions
): Promise<PageScan | null> {
  const page = await fetchText(`${scheme}://${domain}${path}`, fetchOptions);
  if (!page) return null;

  let finalPath = path;
  try {
    finalPath = new URL(page.finalUrl).pathname;
  } catch {
    /* Keep the requested path; a redirect target the parser refuses is not worth failing over. */
  }

  const result = analyze({
    domain,
    scheme,
    homeStatus: page.status,
    // The refusal probe is an entry-point question and is deliberately not asked per
    // page. Passing null is the analyser's "no probe was made", not a claim about this
    // page's access.
    browserStatus: null,
    html: page.body,
    robotsText: support.robotsText,
    llmsText: support.llmsText,
    sitemapText: support.sitemapText,
    lastModifiedHeader: page.lastModified,
    path: finalPath,
  });

  return { page: pageSummary(page.finalUrl, page.status, result), issues: result.issues };
}

const SEVERITY_ORDER: Record<Issue["severity"], number> = { high: 0, medium: 1, low: 2 };

/**
 * Issue ids seen on more than one page.
 *
 * Only the repeated ones: a problem on the homepage is already in the homepage's own
 * issue list, and re-listing it here would pad the payload with what the caller has.
 * The site block's unique claim is "this one is not a page problem, it is a site
 * problem", and that is what surviving across pages demonstrates.
 */
function issueFrequency(scanned: PageScan[]): SiteIssueFrequency[] {
  const byId = new Map<string, SiteIssueFrequency>();

  for (const { issues } of scanned) {
    // A page reports an id once, but a duplicate would otherwise count it twice and
    // inflate exactly the number this list exists to be trusted for.
    for (const id of new Set(issues.map((issue) => issue.id))) {
      const issue = issues.find((candidate) => candidate.id === id);
      if (!issue) continue;
      const existing = byId.get(id);
      if (existing) {
        existing.pagesAffected += 1;
      } else {
        byId.set(id, {
          id,
          title: issue.title,
          severity: issue.severity,
          dimension: issue.category,
          pagesAffected: 1,
          recommendation: issue.recommendation,
        });
      }
    }
  }

  return [...byId.values()]
    .filter((entry) => entry.pagesAffected > 1)
    .sort(
      (a, b) =>
        b.pagesAffected - a.pagesAffected ||
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        a.id.localeCompare(b.id)
    );
}

/**
 * Read the site-scope request out of two raw query-string values.
 *
 * WHY THIS IS ITS OWN EXPORTED FUNCTION. The route's first version read
 * `Number(searchParams.get("pages"))`, which is 0 when the parameter is absent - and 0
 * reaches the clamp above as "one page", so a bare `?scope=site` quietly scored the
 * homepage plus one page instead of the default five. Nothing failed: the response was
 * well-formed and the site score was a real mean of the wrong sample. A route is not
 * reachable from this repository's test runner, so the rule lives here, where it can be
 * given a regression test that actually fails.
 *
 * `null`, `""` and whitespace all mean "not asked", because a caller that wrote
 * `?scope=site&pages=` is asking for the default, not for zero.
 */
export function parseSiteScope(
  scope: string | null,
  pages: string | null
): { wanted: boolean; maxPages: number | undefined } {
  const trimmed = pages === null ? "" : pages.trim();
  const numeric = trimmed === "" ? undefined : Number(trimmed);
  const requested = numeric !== undefined && Number.isFinite(numeric) && numeric > 0;
  return {
    wanted: (scope || "").trim().toLowerCase() === "site" || requested,
    maxPages: numeric,
  };
}

/**
 * Score a site rather than a page.
 *
 * Takes the homepage scan rather than repeating it: the caller has already paid for
 * that fetch, and the support files it read are the ones every further page is scored
 * against.
 */
export async function runSiteScan(
  domain: string,
  home: Extract<ScanOutcome, { reachable: true }>,
  options: { maxPages?: number } = {}
): Promise<SiteScanOutcome> {
  // A caller-supplied count is a string off a query string as often as it is a number, so
  // it is normalised here rather than trusted: NaN falls back to the default instead of
  // propagating into the cap and turning it into "score nothing".
  const requested = Number(options.maxPages);
  const maxPages = Math.min(
    SITE_SCAN_PAGES_CEILING,
    Math.max(1, Number.isFinite(requested) ? Math.round(requested) : SITE_SCAN_MAX_PAGES)
  );
  const fetchOptions = {
    userAgent: CRAWLER_UA,
    acceptLanguage: "en;q=0.9,*;q=0.5",
    timeoutMs: FETCH_TIMEOUT_MS,
  };

  const homeScan: PageScan = {
    page: pageSummary(home.finalUrl, home.homeStatus, home.result),
    issues: home.result.issues,
  };

  const bodies = await gatherSitemapXml(domain, home.support, fetchOptions);
  if (bodies.length === 0) {
    return {
      pagesScanned: 1,
      pagesConsidered: 0,
      maxPages,
      siteScore: homeScan.page.score,
      selection: "homepage only",
      pages: [homeScan.page],
      weakestPage: null,
      strongestPage: null,
      issueFrequency: [],
      note: home.support.sitemapText
        ? "sitemap.xml is present but lists no further page this audit can score, so only the homepage was read."
        : "No sitemap.xml was found, so pages beyond the homepage could not be discovered.",
    };
  }

  const { paths, considered } = sitemapPagePaths(bodies.join("\n"), domain, maxPages);
  if (paths.length === 0) {
    return {
      pagesScanned: 1,
      pagesConsidered: considered,
      maxPages,
      siteScore: homeScan.page.score,
      selection: "homepage only",
      pages: [homeScan.page],
      weakestPage: null,
      strongestPage: null,
      issueFrequency: [],
      note: `sitemap.xml lists ${considered} page(s) this audit can score, and none of them is a second page of this site.`,
    };
  }

  const scanned = (
    await Promise.all(
      paths.map((path) => scanPage(path, home.scheme, domain, home.support, fetchOptions))
    )
  ).filter((entry): entry is PageScan => entry !== null);

  const all = [homeScan, ...scanned];
  const scores = all.map((entry) => entry.page.score);
  const siteScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  // Sorted copy, so weakest and strongest do not depend on the order pages happened to finish in.
  const ranked = [...all].sort((a, b) => a.page.score - b.page.score);
  const comparable = all.length > 1;

  return {
    pagesScanned: all.length,
    pagesConsidered: considered,
    maxPages,
    siteScore,
    selection: `${paths.length} page(s) beyond the homepage: the first page of each top-level section the sitemap lists, then the next pages it names, capped at ${maxPages}`,
    pages: all.map((entry) => entry.page),
    weakestPage: comparable ? ranked[0].page : null,
    strongestPage: comparable ? ranked[ranked.length - 1].page : null,
    issueFrequency: issueFrequency(all),
    note: null,
  };
}
