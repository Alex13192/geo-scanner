export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    let targetDomain = url.trim().toLowerCase();
    targetDomain = targetDomain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

    if (!targetDomain) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // 1. 检查 robots.txt
    let robotsScore = 100;
    const blockedBots: string[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const robotsRes = await fetch(`https://${targetDomain}/robots.txt`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GEOScanner/1.0',
        },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (robotsRes && robotsRes.ok) {
        const text = await robotsRes.text().catch(() => '');
        const aiBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'Google-Extended'];
        aiBots.forEach((bot) => {
          if (text.includes(bot) && (text.includes('Disallow: /') || text.includes('Disallow:/'))) {
            blockedBots.push(bot);
            robotsScore -= 20;
          }
        });
      }
    } catch {
      robotsScore = 80;
    }

    // 2. 检查 /llms.txt
    let llmsTxtScore = 0;
    let hasLlmsTxt = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const llmsRes = await fetch(`https://${targetDomain}/llms.txt`, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GEOScanner/1.0' },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (llmsRes && llmsRes.ok) {
        hasLlmsTxt = true;
        llmsTxtScore = 100;
      }
    } catch {
      hasLlmsTxt = false;
    }

    // 3. 抓取 HTML 首页实测 JSON-LD 与文本代码密度
    let schemaScore = 50;
    let hasJsonLd = false;
    let extractabilityScore = 60;
    let textToCodeRatioStr = '20%';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const htmlRes = await fetch(`https://${targetDomain}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GEOScanner/1.0',
          'Accept': 'text/html',
        },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (htmlRes && htmlRes.ok) {
        const html = await htmlRes.text().catch(() => '');
        
        // 检查 JSON-LD
        if (html.includes('application/ld+json')) {
          hasJsonLd = true;
          schemaScore = 95;
        } else if (html.includes('og:') || html.includes('twitter:')) {
          schemaScore = 75;
        }

        // 计算纯文本与 HTML 结构代码密度
        const plainText = html.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
                              .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
                              .replace(/<[^>]+>/g, '')
                              .replace(/\s+/g, ' ')
                              .trim();
        
        if (html.length > 0) {
          const ratio = Math.min(Math.round((plainText.length / html.length) * 100), 100);
          textToCodeRatioStr = `${ratio}%`;
          extractabilityScore = Math.min(Math.max(ratio * 2.5, 50), 98);
        }
      }
    } catch {
      schemaScore = 70;
      extractabilityScore = 65;
    }

    robotsScore = Math.max(robotsScore, 40);

    // 计算综合得分
    const overallScore = Math.round(
      robotsScore * 0.35 + llmsTxtScore * 0.25 + schemaScore * 0.2 + extractabilityScore * 0.2
    );

    return NextResponse.json({
      domain: targetDomain,
      overallScore,
      breakdown: {
        crawlerPassability: { score: robotsScore, blockedBots },
        llmsCompliance: { score: llmsTxtScore, hasLlmsTxt },
        schemaMetadata: { score: schemaScore, hasJsonLd },
        aiExtractability: { score: Math.round(extractabilityScore), textToCodeRatio: textToCodeRatioStr },
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process domain scan request' },
      { status: 500 }
    );
  }
}