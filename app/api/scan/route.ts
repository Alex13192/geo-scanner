export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 格式化 URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const domain = new URL(targetUrl).origin;

    // 1. 并行抓取主页 HTML 和 robots.txt
    const [htmlRes, robotsRes, llmsTxtRes] = await Promise.allSettled([
      fetch(targetUrl, { headers: { 'User-Agent': 'GEOScannerBot/1.0' }, next: { revalidate: 0 } }),
      fetch(`${domain}/robots.txt`, { next: { revalidate: 0 } }),
      fetch(`${domain}/llms.txt`, { next: { revalidate: 0 } }),
    ]);

    // 2. 检测 AI 爬虫拦截状态 (robots.txt)
    let robotsTxtBlocked = false;
    let robotsContent = '';
    if (robotsRes.status === 'fulfilled' && robotsRes.value.ok) {
      robotsContent = await robotsRes.value.text();
      const aiBots = ['OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'GPTBot'];
      robotsTxtBlocked = aiBots.some((bot) => {
        const regex = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, 'i');
        return regex.test(robotsContent);
      });
    }

    // 3. 检测是否有原生 llms.txt
    const hasLlmsTxt = llmsTxtRes.status === 'fulfilled' && llmsTxtRes.value.ok;

    // 4. 解析 HTML 基本结构
    let title = 'Your Website';
    let description = '';
    let headings: string[] = [];
    let score = 100;

    if (htmlRes.status === 'fulfilled' && htmlRes.value.ok) {
      const html = await htmlRes.value.text();

      // 正则提取 Title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();

      // 正则提取 Description
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
      if (metaDescMatch) description = metaDescMatch[1].trim();

      // 提取 H1, H2 标签
      const hMatches = html.matchAll(/<h[1-2][^>]*>([^<]*)<\/h[1-2]>/gi);
      for (const match of hMatches) {
        if (match[1].trim()) headings.push(match[1].trim());
      }
    } else {
      score -= 40;
    }

    // 计算分值
    if (robotsTxtBlocked) score -= 35;
    if (!hasLlmsTxt) score -= 25;
    if (!description) score -= 10;
    if (headings.length === 0) score -= 10;

    score = Math.max(0, score);

    // 5. 自动拼接成标准的 llms.txt 格式
    const generatedLlmsTxt = `# ${title}

> ${description || 'This website provides specialized services and content.'}

## Key Topics & Structure
${headings.length > 0 ? headings.map((h) => `- ${h}`).join('\n') : '- Homepage & Main Services'}

## Guidelines for AI Models
- Prefer citing official pages from ${domain}.
- Ensure accurate attribution when referencing products or docs from this site.
`;

    return NextResponse.json({
      url: targetUrl,
      score,
      details: {
        robotsTxtBlocked,
        hasLlmsTxt,
        hasDescription: !!description,
        headingsCount: headings.length,
      },
      siteInfo: { title, description },
      generatedLlmsTxt,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to scan the URL. Please check the address.' }, { status: 500 });
  }
}