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
import { analyze, type AnalyzeResult } from "./analyze.ts";
import { fetchText, inspectTarget, type SafeFetchResult } from "../net/fetch-safe.ts";
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

  // The three support files, fetched in parallel. A failure here is itself a finding, so each
  // returns null rather than throwing.
  const [robots, llms, sitemap] = await Promise.all([
    fetchText(`${scheme}://${domain}/robots.txt`, fetchOptions),
    fetchText(`${scheme}://${domain}/llms.txt`, fetchOptions),
    fetchText(`${scheme}://${domain}/sitemap.xml`, fetchOptions),
  ]);

  const result = analyze({
    domain,
    scheme,
    homeStatus: home.status,
    browserStatus,
    html: home.body,
    robotsText: robots && robots.status === 200 ? robots.body : null,
    llmsText: llms && llms.status === 200 ? llms.body : null,
    sitemapText: sitemap && sitemap.status === 200 ? sitemap.body : null,
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
  };
}
