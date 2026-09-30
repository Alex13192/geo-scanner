import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scoreParam = searchParams.get('score') || '85';
  const score = parseInt(scoreParam, 10);

  // 根据分数动态改变徽章右侧颜色
  let color = '#10b981'; // 绿 (>=80)
  if (score < 50) {
    color = '#f43f5e'; // 红 (<50)
  } else if (score < 80) {
    color = '#f59e0b'; // 黄 (50-79)
  }

  // 生成 SVG 矢量徽章图像
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="168" height="20" role="img" aria-label="GEO Readiness: ${score}/100">
    <title>GEO Readiness: ${score}/100</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="168" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="105" height="20" fill="#0f172a"/>
      <rect x="105" width="63" height="20" fill="${color}"/>
      <rect width="168" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
      <text x="535" y="140" transform="scale(.1)" fill="#fff" textLength="850">GEO Readiness</text>
      <text x="1355" y="140" transform="scale(.1)" fill="#fff" font-weight="bold" textLength="430">${score}/100</text>
    </g>
  </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}