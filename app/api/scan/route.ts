// app/api/scan/route.ts
//
// Thin controller: fetch the four resources a GEO audit needs, then hand them
// to the analyser in lib/geo/analyze.ts. All scoring rules live there.
//
// Every outbound request goes through lib/net/fetch-safe.ts, which is the single
// place allowed to call fetch with a hostname supplied by the caller. Read that
// file before adding another one here.
import { NextResponse } from "next/server";
import { analyze } from "@/lib/geo/analyze";
import { fetchText, inspectTarget, type SafeFetchResult } from "@/lib/net/fetch-safe";
import { clientKey, takeToken } from "@/lib/net/rate-limit";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge"; // 必须在 Cloudflare Edge 上运行
export const dynamic = "force-dynamic"; // 强制声明为动态接口，防止静态编译拦截

/**
 * We identify ourselves honestly rather than impersonating GPTBot.
 *
 * Impersonating a crawler is why the previous version produced false positives
 * on cisco.com and 163.com: those sites verify crawlers by IP address, so a
 * spoofed GPTBot user-agent from our infrastructure is refused as a spoofer
 * even when real GPTBot traffic is perfectly welcome. Whether a site blocks AI
 * crawlers is answered authoritatively by robots.txt, not by guessing.
 */
const CRAWLER_UA = `Mozilla/5.0 (compatible; LLMentionBot/1.0; +${SITE_URL}/methodology/)`;

/**
 * Sent only as a second probe, and only when the first request was refused.
 *
 * WHY A SCANNER MAY DO THIS AT ALL: the refusal has two completely different
 * meanings and nothing else separates them. If a browser-shaped request is served
 * while a crawler-shaped one is refused, the site is running a rule aimed at
 * identified bots - and GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot all
 * present as bots, so the rule blocks the engines the audit is about. If both are
 * refused, the block is about the address the scan came from and says nothing
 * about the site. Reporting the first case as "not a GEO problem", which is what
 * the old copy did, was backwards.
 *
 * This is a diagnostic, not a disguise: its result is used only for the access
 * verdict, never to score page content, and it is disclosed in the published rule
 * for robots-ai-allowed. Impersonating GPTBot - the thing the comment above
 * rejects - would be different in kind, because that claims to be a specific
 * crawler whose access rules the site set deliberately.
 */
const BROWSER_PROBE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 9000;

function cleanDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();
}

const emptyMetrics = {
  crawlability: 0,
  understandability: 0,
  answerReadiness: 0,
  citability: 0,
  trustAuthority: 0,
  contentDepth: 0,
};

export async function GET(request: Request) {
  // Before any parsing or fetching. See lib/net/rate-limit.ts for what this
  // does and does not enforce.
  const limit = takeToken(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many scans from this address. Please wait a moment and try again.",
        retryAfter: limit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = cleanDomain(searchParams.get("domain") || "");

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  // Reject targets that point at a network rather than a website, and say why,
  // instead of letting them fail as an unreachable domain.
  const target = inspectTarget(`https://${domain}`);
  if (!target.ok) {
    return NextResponse.json({ error: target.reason }, { status: 400 });
  }

  const options = {
    userAgent: CRAWLER_UA,
    acceptLanguage: "en;q=0.9,*;q=0.5",
    timeoutMs: FETCH_TIMEOUT_MS,
  };

  // 1. Homepage, over https first and http as a fallback. Remember which scheme
  //    worked: it decides the HTTPS check, and the support files have to be
  //    requested over the same scheme. Fetching robots.txt, llms.txt and
  //    sitemap.xml over https:// for an http-only site invented three failures.
  let scheme: "https" | "http" = "https";
  let home: SafeFetchResult | null = await fetchText(`${scheme}://${domain}`, options);

  if (!home && inspectTarget(`http://${domain}`).ok) {
    scheme = "http";
    home = await fetchText(`${scheme}://${domain}`, options);
  }

  // 1b. One extra request, and only when the first was refused: ask the same URL
  //     again as a browser. This is what tells "your WAF refuses identified bots"
  //     apart from "our address is blocked", which the score should not conflate.
  let browserStatus: number | null = null;
  if (home && home.status !== 200) {
    const probe = await fetchText(`${scheme}://${domain}`, {
      ...options,
      userAgent: BROWSER_PROBE_UA,
    });
    browserStatus = probe ? probe.status : null;
  }

  // No HTTP response at all on either scheme: the domain really is unreachable.
  if (!home) {
    return NextResponse.json({
      reachable: false,
      score: 0,
      issues: [],
      metrics: emptyMetrics,
    });
  }

  // 2. The three support files, fetched in parallel. A failure here is itself
  //    a finding, so each returns null rather than throwing.
  const [robots, llms, sitemap] = await Promise.all([
    fetchText(`${scheme}://${domain}/robots.txt`, options),
    fetchText(`${scheme}://${domain}/llms.txt`, options),
    fetchText(`${scheme}://${domain}/sitemap.xml`, options),
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
  });

  // `brief=1` returns the headline numbers without the twelve dimension objects
  // or the issue list, so a caller collecting many sites at once does not have
  // to pull roughly 8 KB per domain. It is also how the published study over a
  // set of well-known sites is gathered, which is why it exists.
  if (searchParams.get("brief") === "1") {
    return NextResponse.json({
      domain,
      status: home.status,
      browserStatus,
      scoreBasis: home.status === 200 ? "homepage" : `${home.status} error response`,
      truncated: home.truncated,
      score: result.score,
      grade: result.grade,
      checksRun: result.checksRun,
      checksPassed: result.checksPassed,
      // The handful of booleans a study actually cites, so the raw data does
      // not depend on re-deriving them from the issue list downstream.
      aiCrawlersBlocked: result.issues.some((i) => i.id === "robots-ai-blocked"),
      hasJsonLdEntity: !result.issues.some((i) => i.id === "jsonld-entity"),
      hasSameAs: !result.issues.some((i) => i.id === "sameas"),
      hasRobotsTxt: !result.issues.some((i) => i.id === "robots-present"),
      topIssue: result.issues[0]?.id ?? null,
    });
  }

  // Note: a non-200 homepage is NOT treated as unreachable. The analyser scores
  // it accordingly, and the access verdict now combines robots.txt with what the
  // server did to a crawler-shaped request and to a browser-shaped one, so a
  // refusal aimed at identified crawlers is reported as a block instead of as a
  // neutral access note. The caller still has to be able to tell that the score
  // describes an error response rather than a page, so the basis is stated
  // explicitly instead of leaving twelve dimension scores to imply that a real
  // page was read.
  return NextResponse.json({
    reachable: true,
    status: home.status,
    scheme,
    browserStatus,
    // Phrased to read correctly inside "This score describes ...": a leading
    // "HTTP" would make the banner say "describes a HTTP 403 response".
    scoreBasis: home.status === 200 ? "homepage" : `${home.status} error response`,
    truncated: home.truncated,
    score: result.score,
    grade: result.grade,
    gradeLabel: result.gradeLabel,
    dimensions: result.dimensions,
    checksRun: result.checksRun,
    checksPassed: result.checksPassed,
    issues: result.issues,
    metrics: result.metrics,
  });
}
