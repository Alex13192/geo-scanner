// app/(en)/blog/rss.xml/route.ts
//
// The blog feed. Hand-built XML rather than a dependency: it is a channel, a list and four
// fields per item, and a package that generates that would be a dependency to keep updated for
// eighty lines of output.
//
// WHY THE FEED IS ENGLISH: it indexes the English articles, which are the source every
// translation follows. The localized archives link to this one feed rather than publishing three
// parallel feeds nobody subscribes to separately.
import { INSIGHTS, insightPath } from "@/lib/insights";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toUTCString();
}

export function GET() {
  const latest = INSIGHTS.reduce(
    (newest, insight) => {
      const date = insight.updated ?? insight.published;
      return date > newest ? date : newest;
    },
    INSIGHTS[0]?.updated ?? INSIGHTS[0]?.published ?? "2026-01-01"
  );

  const items = INSIGHTS.map((insight) => {
    const url = `${SITE_URL}${insightPath(insight.slug)}`;
    return `    <item>
      <title>${escapeXml(insight.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${rfc822(insight.published)}</pubDate>
      <category>${escapeXml(insight.category)}</category>
      <description>${escapeXml(insight.description)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LLMention — notes from measuring AI search</title>
    <link>${SITE_URL}/blog/</link>
    <description>Study results, rule explanations and stated limits from the GEO scanner behind this site.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
