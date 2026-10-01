export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') || '85';
  const label = searchParams.get('label') || 'GEO Score';

  const numericScore = parseInt(score, 10);
  let color = '#10b981'; // 绿 (>=85)
  if (numericScore < 60) {
    color = '#f43f5e'; // 红 (<60)
  } else if (numericScore < 85) {
    color = '#f59e0b'; // 黄 (60-84)
  }

  // 动态生成 SVG 徽章
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="130" height="20" role="img" aria-label="${label}: ${score}/100">
      <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <clipPath id="r">
        <rect width="130" height="20" rx="3" fill="#fff"/>
      </clipPath>
      <g clip-path="url(#r)">
        <rect width="75" height="20" fill="#1e293b"/>
        <rect x="75" width="55" height="20" fill="${color}"/>
        <rect width="130" height="20" fill="url(#s)"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <text x="385" y="140" transform="scale(.1)" fill="#fff" textLength="650">${label}</text>
        <text x="1015" y="140" transform="scale(.1)" fill="#fff" textLength="450">${score}/100</text>
      </g>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}