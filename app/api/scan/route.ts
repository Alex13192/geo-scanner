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

  // 1. 服务端真实抓取首页
  try {
    const homeRes = await fetch(`https://${domain}`, {
      headers: { "User-Agent": userAgent },
      next: { revalidate: 0 },
    });
    if (homeRes.ok) {
      siteReachable = true;
      homeHtml = await homeRes.text();
    }
  } catch (e) {
    try {
      const homeRes = await fetch(`http://${domain}`, {
        headers: { "User-Agent": userAgent },
      });
      if (homeRes.ok) {
        siteReachable = true;
        homeHtml = await homeRes.text();
      }
    } catch (err) {
      siteReachable = false;
    }
  }

  if (!siteReachable) {
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