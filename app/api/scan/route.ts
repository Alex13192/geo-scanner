// app/api/scan/route.ts
//
// Thin controller: fetch the four resources a GEO audit needs, then hand them
// to the analyser in lib/geo/analyze.ts. All scoring rules live there.
//
// Every outbound request goes through lib/net/fetch-safe.ts, which is the single
// place allowed to call fetch with a hostname supplied by the caller. Read that
// file before adding another one here.
import { NextResponse } from "next/server";
import { runScan } from "@/lib/geo/scan";
import { inspectTarget } from "@/lib/net/fetch-safe";
import { clientKey, takeToken } from "@/lib/net/rate-limit";

/*
 * THERE IS DELIBERATELY NO `export const runtime = "edge"` HERE ANY MORE.
 *
 * It was required under next-on-pages and it is forbidden under OpenNext, whose
 * documentation says plainly: "The edge runtime is not supported yet with
 * @opennextjs/cloudflare." The route now runs on the Node.js runtime, inside the Worker,
 * with nodejs_compat - see wrangler.jsonc. The two adapters' peer ranges do not overlap
 * (next-on-pages stops at next 15.5.2, OpenNext starts at 15.5.27), so this line could
 * not be made optional: it is the thing that had to change for the security patches from
 * 15.5.24 onwards to be reachable at all.
 *
 * scripts/test-analyze.mts asserts the absence of this declaration across app/, so
 * re-adding it fails the test suite rather than the next deployment.
 *
 * `dynamic` is unrelated to the runtime and stays.
 */
export const dynamic = "force-dynamic"; // 强制声明为动态接口，防止静态编译拦截

/*
 * The scanner's user agents, its timeout, and the whole fetch-and-analyse sequence moved to
 * lib/geo/scan.ts, which the weekly report runner also calls. They are policy about what a
 * GEO scan is, not about being an HTTP endpoint, and they were only here because this route
 * was the first thing that needed them.
 *
 * The comments explaining the two user agents went with them. Read that file before changing
 * either, and note that the published rule for robots-ai-allowed discloses the second probe.
 */

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

  /*
   * Everything from here to the response is one call. The sequence - https with an http
   * fallback, the browser probe when the first request was refused, and the three support
   * files in parallel - lives in lib/geo/scan.ts, because the weekly report runner needs the
   * same sequence and cannot come through this endpoint to get it: the rate limit above would
   * refuse a run over a hundred subscribers a fifth of the way in.
   */
  const scan = await runScan(domain);

  // No HTTP response at all on either scheme: the domain really is unreachable.
  if (!scan.reachable) {
    return NextResponse.json({
      reachable: false,
      score: 0,
      issues: [],
      metrics: emptyMetrics,
    });
  }

  const { result, homeStatus, scheme, browserStatus, truncated } = scan;

  // `brief=1` returns the headline numbers without the twelve dimension objects
  // or the issue list, so a caller collecting many sites at once does not have
  // to pull roughly 8 KB per domain. It is also how the published study over a
  // set of well-known sites is gathered, which is why it exists.
  if (searchParams.get("brief") === "1") {
    return NextResponse.json({
      domain,
      status: homeStatus,
      browserStatus,
      scoreBasis: homeStatus === 200 ? "homepage" : `${homeStatus} error response`,
      truncated,
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
      // Reported even in the brief form, because "30 of 38" means something
      // different when four of them were never questions for this page.
      pageType: result.pageType,
      checksNotApplicable: result.checksNotApplicable,
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
    status: homeStatus,
    scheme,
    browserStatus,
    // Phrased to read correctly inside "This score describes ...": a leading
    // "HTTP" would make the banner say "describes a HTTP 403 response".
    scoreBasis: homeStatus === 200 ? "homepage" : `${homeStatus} error response`,
    truncated,
    score: result.score,
    grade: result.grade,
    gradeLabel: result.gradeLabel,
    dimensions: result.dimensions,
    checksRun: result.checksRun,
    checksPassed: result.checksPassed,
    pageType: result.pageType,
    checksNotApplicable: result.checksNotApplicable,
    issues: result.issues,
    metrics: result.metrics,
  });
}
