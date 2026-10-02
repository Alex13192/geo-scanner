// app/api/scan/route.ts
//
// Thin controller: fetch the four resources a GEO audit needs, then hand them
// to the analyser in lib/geo/analyze.ts. All scoring rules live there.
import { NextResponse } from "next/server";
import { analyze } from "@/lib/geo/analyze";

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
const CRAWLER_UA =
  "Mozilla/5.0 (compatible; LLMentionBot/1.0; +https://geo-scanner.ccie13192.com/methodology/)";

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

type Fetched = {
  status: number;
  body: string;
  lastModified: string | null;
};

async function get(url: string): Promise<Fetched | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": CRAWLER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
        "Accept-Language": "en;q=0.9,*;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }
    return { status: res.status, body, lastModified: res.headers.get("last-modified") };
  } catch {
    return null;
  }
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
  const { searchParams } = new URL(request.url);
  const domain = cleanDomain(searchParams.get("domain") || "");

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  // 1. Homepage, over https first and http as a fallback. Remember which scheme
  //    worked: it decides the HTTPS check, and the support files have to be
  //    requested over the same scheme. Fetching robots.txt, llms.txt and
  //    sitemap.xml over https:// for an http-only site invented three failures.
  let scheme: "https" | "http" = "https";
  let home = await get(`${scheme}://${domain}`);
  if (!home) {
    scheme = "http";
    home = await get(`${scheme}://${domain}`);
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
    get(`${scheme}://${domain}/robots.txt`),
    get(`${scheme}://${domain}/llms.txt`),
    get(`${scheme}://${domain}/sitemap.xml`),
  ]);

  const result = analyze({
    domain,
    scheme,
    homeStatus: home.status,
    html: home.body,
    robotsText: robots && robots.status === 200 ? robots.body : null,
    llmsText: llms && llms.status === 200 ? llms.body : null,
    sitemapText: sitemap && sitemap.status === 200 ? sitemap.body : null,
    lastModifiedHeader: home.lastModified,
  });

  // Note: a non-200 homepage is NOT treated as unreachable. The analyser scores
  // it accordingly, and robots.txt - not the homepage response - decides whether
  // AI crawlers are actually blocked.
  return NextResponse.json({
    reachable: true,
    status: home.status,
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
