// app/api/scan/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge"; // 必须在 Cloudflare Edge 上运行
export const dynamic = "force-dynamic"; // 强制声明为动态接口，防止静态编译拦截

function cleanDomain(domain: string): string {
  if (!domain) return "example.com";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get("domain") || "";
  const domain = cleanDomain(rawDomain);

  if (!domain) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const userAgent = "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)";

  let crawlabilityScore = 0;
  let understandabilityScore = 0;
  let answerReadinessScore = 0;
  let citabilityScore = 0;
  let trustAuthorityScore = 0;
  let contentDepthScore = 0;

  const issues: any[] = [];
  let homeHtml = "";
  let siteReachable = false;

  // 1. Fetch the homepage the way an AI crawler would.
  //
  // IMPORTANT: a non-2xx response does NOT mean the domain is unreachable.
  // A 403/429/503 usually means bot protection (Cloudflare Bot Fight Mode, WAF
  // rules, rate limiting) is refusing the crawler - which is exactly the finding
  // this product exists to surface. Only a thrown fetch (DNS failure, refused
  // connection, TLS error) means the domain genuinely could not be reached.
  //
  // The previous version treated every non-2xx as "unreachable", so a site that
  // was actively blocking AI crawlers was reported as a non-existent domain.
  const probe = async (url: string) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml,*/*" },
        redirect: "follow",
        cache: "no-store",
      });
      let body = "";
      try {
        body = await res.text();
      } catch {
        body = "";
      }
      return { gotResponse: true, status: res.status, body };
    } catch {
      return { gotResponse: false, status: 0, body: "" };
    }
  };

  let attempt = await probe(`https://${domain}`);
  if (!attempt.gotResponse) {
    attempt = await probe(`http://${domain}`);
  }

  // No HTTP response on either scheme => genuinely unreachable.
  if (!attempt.gotResponse) {
    return NextResponse.json({
      reachable: false,
      score: 0,
      issues: [],
      metrics: {
        crawlability: 0,
        understandability: 0,
        answerReadiness: 0,
        citability: 0,
        trustAuthority: 0,
        contentDepth: 0,
      },
    });
  }

  // We got an HTTP response, so the domain is live.
  siteReachable = true;
  const homeStatus = attempt.status;
  homeHtml = attempt.body;

  // The homepage answered with an error status. Report that as the headline
  // finding instead of inventing downstream issues from an error page.
  if (homeStatus >= 400) {
    const likelyBotBlocked = [401, 403, 406, 429, 451, 503].includes(homeStatus);

    issues.push({
      id: "homepage-non-200",
      category: "AI Agent Access",
      title: `Homepage returned HTTP ${homeStatus} to an AI crawler`,
      severity: "high",
      summary: likelyBotBlocked
        ? `Requesting https://${domain} with the GPTBot user-agent returned HTTP ${homeStatus}. Bot protection, a WAF rule or a rate limit is refusing AI crawlers before they can read the page.`
        : `Requesting https://${domain} returned HTTP ${homeStatus}, so there is no content available for AI engines to read or cite.`,
      recommendation: likelyBotBlocked
        ? "Allow verified AI crawlers (GPTBot, ClaudeBot, PerplexityBot) in your bot-management and firewall settings, then re-scan."
        : "Make sure your homepage returns HTTP 200 for crawler user-agents. An entry point that returns an error cannot be cited by any AI engine.",
    });

    return NextResponse.json({
      reachable: true,
      blocked: likelyBotBlocked,
      status: homeStatus,
      score: 5,
      issues,
      metrics: {
        crawlability: 0,
        understandability: 0,
        answerReadiness: 0,
        citability: 0,
        trustAuthority: 0,
        contentDepth: 0,
      },
    });
  }

  // 2. 真实扫描 /llms.txt
  try {
    const llmsRes = await fetch(`https://${domain}/llms.txt`, {
      headers: { "User-Agent": userAgent },
    });
    if (llmsRes.ok) {
      const text = await llmsRes.text();
      if (text.length > 20) {
        crawlabilityScore += 40;
      } else {
        issues.push({
          id: "llms-empty",
          category: "AI Agent Access",
          title: "/llms.txt file is too brief or empty",
          severity: "medium",
          summary: "/llms.txt was found but lacks structural documentation for LLMs.",
          recommendation: "Provide comprehensive site maps and core links in /llms.txt.",
        });
      }
    } else {
      issues.push({
        id: "llms-missing",
        category: "AI Agent Access",
        title: "Missing /llms.txt Standard File",
        severity: "high",
        summary: `AI Search Engine crawlers could not find https://${domain}/llms.txt.`,
        recommendation: "Use our /llms.txt Studio to quickly generate and deploy one.",
      });
    }
  } catch (e) {
    // missing
  }

  // 3. 真实扫描 /robots.txt
  try {
    const robotsRes = await fetch(`https://${domain}/robots.txt`, {
      headers: { "User-Agent": userAgent },
    });
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text();
      if (/Disallow:\s*\/\s*$/m.test(robotsText) && /GPTBot|PerplexityBot|ClaudeBot/i.test(robotsText)) {
        issues.push({
          id: "robots-blocked",
          category: "Crawler Directives",
          title: "AI Bots Explicitly Blocked in robots.txt",
          severity: "high",
          summary: "Your robots.txt blocks major AI crawlers (GPTBot/PerplexityBot).",
          recommendation: "Allow trusted AI User-Agents in robots.txt for AI indexation.",
        });
      } else {
        crawlabilityScore += 40;
      }
    } else {
      crawlabilityScore += 20;
    }
  } catch (e) {
    crawlabilityScore += 20;
  }

  // 4. 分析 HTML 内容
  if (homeHtml) {
    if (homeHtml.includes("application/ld+json")) {
      understandabilityScore += 50;
      trustAuthorityScore += 30;
    } else {
      issues.push({
        id: "schema-missing",
        category: "Schema Metadata",
        title: "Missing JSON-LD Structured Data",
        severity: "high",
        summary: "Search engines cannot easily parse entity graphs without Schema.",
        recommendation: "Implement JSON-LD Organization/WebSite schemas in your header.",
      });
    }

    if (/<(main|article|section|header|nav|footer)/i.test(homeHtml)) {
      understandabilityScore += 40;
    } else {
      issues.push({
        id: "semantic-missing",
        category: "Content Structure",
        title: "Low HTML5 Semantic Density",
        severity: "medium",
        summary: "Heavy usage of generic <div> tags hinders content chunking.",
        recommendation: "Wrap major section blocks in <main>, <article>, and <section> tags.",
      });
    }

    if (/FAQPage|faq|question|answer/i.test(homeHtml)) {
      answerReadinessScore += 60;
    } else {
      issues.push({
        id: "faq-missing",
        category: "Answer Readiness",
        title: "No FAQ Structured Content Detected",
        severity: "high",
        summary: "Direct-answer capability is low without explicit Q&A formats.",
        recommendation: "Add 5-10 direct question/answer pairs on core landing pages.",
      });
    }

    if (homeHtml.includes("https://") || homeHtml.includes("rel=\"canonical\"")) {
      citabilityScore += 50;
    }

    const textOnly = homeHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (textOnly.length > 2000) {
      contentDepthScore += 70;
    } else {
      contentDepthScore += 30;
      issues.push({
        id: "content-thin",
        category: "Content Depth",
        title: "Thin Page Content Detected",
        severity: "medium",
        summary: "Word count is relatively low for comprehensive AI extraction.",
        recommendation: "Expand key sections to 800+ words of rich contextual text.",
      });
    }
  }

  crawlabilityScore = Math.min(100, Math.max(30, crawlabilityScore));
  understandabilityScore = Math.min(100, Math.max(20, understandabilityScore));
  answerReadinessScore = Math.min(100, Math.max(15, answerReadinessScore));
  citabilityScore = Math.min(100, Math.max(25, citabilityScore));
  trustAuthorityScore = Math.min(100, Math.max(30, trustAuthorityScore));
  contentDepthScore = Math.min(100, Math.max(20, contentDepthScore));

  const totalScore = Math.round(
    (crawlabilityScore + understandabilityScore + answerReadinessScore + citabilityScore + trustAuthorityScore + contentDepthScore) / 6
  );

  return NextResponse.json({
    reachable: true,
    score: totalScore,
    issues,
    metrics: {
      crawlability: crawlabilityScore,
      understandability: understandabilityScore,
      answerReadiness: answerReadinessScore,
      citability: citabilityScore,
      trustAuthority: trustAuthorityScore,
      contentDepth: contentDepthScore,
    },
  });
}