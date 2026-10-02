// app/api/scan/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge"; // 必须在 Cloudflare Edge 上运行
export const dynamic = "force-dynamic"; // 强制声明为动态接口，防止静态编译拦截

function cleanDomain(domain: string): string {
  if (!domain) return "example.com";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

/**
 * Does this robots.txt block `agent` from the site root?
 *
 * This parses real user-agent groups rather than searching the file for
 * "Disallow: /" and an agent name independently. That distinction matters:
 * a file that mentions GPTBot in one group and disallows "/" for a completely
 * different agent is NOT blocking GPTBot, and reporting it as such is a false
 * positive that destroys trust in the report.
 *
 * Matching follows the parts of the spec crawlers actually implement:
 * an exact agent match wins over the "*" group, and the last matching rule wins.
 */
function robotsBlocksAgent(robotsText: string, agent: string): boolean {
  const target = agent.toLowerCase();
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let current: { agents: string[]; rules: { allow: boolean; path: string }[] } | null = null;
  let previousLineWasAgent = false;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!current || !previousLineWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      previousLineWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      if (current) current.rules.push({ allow: field === "allow", path: value });
      previousLineWasAgent = false;
    } else {
      previousLineWasAgent = false;
    }
  }

  const exactGroups = groups.filter((g) => g.agents.includes(target));
  const chosenGroups = exactGroups.length ? exactGroups : groups.filter((g) => g.agents.includes("*"));
  if (!chosenGroups.length) return false;

  let blockedFromRoot = false;
  for (const group of chosenGroups) {
    for (const rule of group.rules) {
      if (rule.path === "/" || rule.path === "") {
        blockedFromRoot = !rule.allow;
      }
    }
  }
  return blockedFromRoot;
}

/** Crawler user-agents this scanner checks for explicit robots.txt blocks. */
const TRACKED_AI_AGENTS = ["gptbot", "claudebot", "perplexitybot"];

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

  // The homepage answered with an error status.
  //
  // Before concluding anything, cross-check robots.txt. It is a static file and
  // is almost never behind the same bot protection, so it tells us what the site
  // INTENDS to do with AI crawlers - whereas a 403 only reports what happened to
  // this one request. Large sites verify crawlers by IP address, so a request
  // carrying a spoofed GPTBot user-agent from our infrastructure is routinely
  // refused even when real GPTBot traffic is welcome. Reporting that as "you
  // block AI crawlers" would be a false positive on exactly the domains users
  // test first, which is the fastest way to lose their trust.
  if (homeStatus >= 400) {
    const likelyBotBlocked = [401, 403, 406, 429, 451, 503].includes(homeStatus);

    const robotsBlockedAgents: string[] = [];
    try {
      const robotsRes = await fetch(`https://${domain}/robots.txt`, {
        headers: { "User-Agent": userAgent },
        cache: "no-store",
      });
      if (robotsRes.ok) {
        const robotsText = await robotsRes.text();
        for (const agent of TRACKED_AI_AGENTS) {
          if (robotsBlocksAgent(robotsText, agent)) robotsBlockedAgents.push(agent);
        }
      }
    } catch {
      // Cannot cross-check. Fall through to the deliberately inconclusive wording.
    }

    const explicitlyBlocked = robotsBlockedAgents.length > 0;

    issues.push({
      id: explicitlyBlocked ? "ai-crawler-blocked" : "crawler-request-refused",
      category: "AI Agent Access",
      title: explicitlyBlocked
        ? "AI crawlers are explicitly blocked in robots.txt"
        : `A crawler-shaped request was refused with HTTP ${homeStatus}`,
      severity: explicitlyBlocked ? "high" : "medium",
      summary: explicitlyBlocked
        ? `robots.txt disallows the site root for: ${robotsBlockedAgents.join(", ")}. Those engines cannot read or cite ${domain}. The homepage also returned HTTP ${homeStatus} to our request.`
        : likelyBotBlocked
          ? `Requesting https://${domain} with the GPTBot user-agent returned HTTP ${homeStatus}, but robots.txt does not block AI crawlers. This normally means the site verifies crawlers by IP address rather than user-agent alone - standard anti-spoofing that does NOT by itself mean real GPTBot traffic is blocked.`
          : `Requesting https://${domain} returned HTTP ${homeStatus}, so there is no content available for AI engines to read or cite.`,
      recommendation: explicitlyBlocked
        ? "Remove the Disallow rule for the AI crawlers you want citations from, then re-scan."
        : likelyBotBlocked
          ? "Treat this result as inconclusive. Check your CDN or WAF logs for requests from OpenAI, Anthropic and Perplexity address ranges to see whether real AI crawlers are being served."
          : "Make sure your homepage returns HTTP 200 for crawler user-agents. An entry point that returns an error cannot be cited by any AI engine.",
    });

    return NextResponse.json({
      reachable: true,
      blocked: explicitlyBlocked,
      status: homeStatus,
      score: explicitlyBlocked ? 5 : 25,
      issues,
      metrics: {
        crawlability: explicitlyBlocked ? 0 : 20,
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
      cache: "no-store",
    });
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text();

      // Parse actual user-agent groups. The previous version tested for
      // "Disallow: /" and an agent name independently across the whole file, so a
      // site that merely MENTIONED GPTBot while disallowing some unrelated agent
      // was reported as blocking AI crawlers.
      const blockedAgents: string[] = [];
      for (const agent of TRACKED_AI_AGENTS) {
        if (robotsBlocksAgent(robotsText, agent)) blockedAgents.push(agent);
      }

      if (blockedAgents.length > 0) {
        issues.push({
          id: "robots-blocked",
          category: "Crawler Directives",
          title: "AI crawlers are explicitly blocked in robots.txt",
          severity: "high",
          summary: `robots.txt disallows the site root for: ${blockedAgents.join(", ")}. Those engines cannot read or cite this site.`,
          recommendation: "Remove the Disallow rule for the AI crawlers you want citations from, then re-scan.",
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