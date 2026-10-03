import type { NextConfig } from "next";

/**
 * Security response headers.
 *
 * WHY THIS FILE AND NOT public/_headers:
 * public/_headers is the Cloudflare Pages native mechanism, and it is the wrong
 * one here for the same reason public/_redirects was. middleware.ts already
 * documents that trap: a next-on-pages deployment is a single Function serving
 * every route, so no request ever reaches the _redirects parser, and a config file
 * that silently does nothing is worse than no file at all. Next's own headers()
 * runs inside the request handler the Worker executes, which is the layer that
 * actually gets a say in the response.
 *
 * VERIFIED, NOT ASSUMED: these were confirmed against a real server response
 * rather than trusted to the config, because "the header is in the config" and
 * "the header is on the response" are different claims.
 *
 * ON THE CONTENT SECURITY POLICY:
 * Everything above it is enforced. The CSP is Report-Only, deliberately. This site
 * carries advertising, and an enforcing policy written without reading a single
 * violation report would be a guess that can silently break the ads that fund the
 * free tier - the kind of change that looks like diligence and costs revenue.
 * Report-Only cannot break anything and starts producing the evidence needed to
 * enforce it. To finish the job: read the reports, tighten the sources to what the
 * site actually loads, then rename the header to Content-Security-Policy. Until
 * that happens this line is documentation of intent, and it is labelled as such
 * rather than presented as protection.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // Next injects its hydration payload as inline script.
      "script-src 'self' 'unsafe-inline' https:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // The badge generator links to shields.io but does not load from it; images
      // in a copied snippet are fetched by whoever embeds the badge, not by us.
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // 必须移除 output: 'export'，否则动态 API 无法在 Cloudflare 上编译
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Every route, including the API and the per-request /report/ page.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
