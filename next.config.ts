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

/**
 * Edge caching, opt-IN per route group.
 *
 * WHY OPT-IN AND NOT "EVERYTHING EXCEPT...": /report/ is generated per request from a
 * visitor's own domain and /api/* must never be cached. `source` is a path-to-regexp
 * pattern, which has no negative lookahead, so "everything except those" cannot be
 * written. Listing what MAY be cached leaves the default untouched, which means a route
 * added later stays uncached until somebody decides otherwise. That is the safe direction
 * to fail, and it is why /report/ and /api/ appear nowhere below.
 *
 * WHAT WAS MEASURED BEFORE THIS CHANGE, on the deployed site:
 *   /  /methodology/  /checks/<id>/   cache-control: public, max-age=0, must-revalidate
 *                                     cf-cache-status: DYNAMIC
 *   /_next/static/*                   cache-control: public, max-age=31536000, immutable
 * So every HTML view started a Worker while the static assets were already handled.
 *
 * WHAT IS NOT YET KNOWN, STATED HERE RATHER THAN DISCOVERED LATER:
 * next.config headers() demonstrably reaches the client - the security headers in the
 * same file were confirmed on a live response - but that is not the same question as
 * whether Cloudflare will CACHE a Pages Function response on the strength of its
 * Cache-Control header. Cloudflare's documentation says Worker responses are not cached
 * automatically, and if that applies to Pages Functions here, these values are correct
 * and inert. The alternatives that certainly work are a Cache Rule in the Cloudflare
 * dashboard for these paths, or the OpenNext migration, which brings a real incremental
 * cache.
 *
 * `npm run check:live` therefore reports cf-cache-status for these paths. The answer is
 * meant to come from the deployment, not from this comment, and the values below are the
 * ones to change if it comes back DYNAMIC.
 */
const CACHE_LONG = [
  { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800" },
];

const CACHE_SHORT = [
  { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=3600" },
];

/** Paths whose content is fixed at build time and only changes on deploy. */
const CACHEABLE = [
  "/checks/:path*",
  "/docs/:path*",
  "/methodology/",
  "/study/",
  "/about/",
  "/pricing/",
  "/contact/",
  "/llms-txt-studio/",
  "/readiness-badge/",
  "/privacy/",
  "/terms/",
  "/withdrawal/",
  "/refund/",
];

/**
 * Paths that must never be cached by anything, stated explicitly.
 *
 * WHY THIS IS NOT REDUNDANT WITH THE OPT-IN LIST ABOVE. Not being in CACHEABLE means
 * "this file adds no cache header", not "this response carries no cache header" - Next
 * supplies its own. A statically prerendered page is served with
 * `s-maxage=31536000` by default, and /report/ is statically prerendered, so the
 * per-request result page was one platform behaviour away from being cached for a year.
 * On the deployed site that default is currently replaced by
 * `public, max-age=0, must-revalidate`, which is why nothing has gone wrong yet - but
 * "the CDN happens to overwrite it" is not a policy, it is a coincidence.
 *
 * /api/* was emitting no Cache-Control at all, which is worse rather than better: a
 * shared cache is permitted to reuse a 200 response heuristically when no directive
 * forbids it, and these endpoints answer about somebody else's live site.
 *
 * Both are now explicit, so the intent survives a change of platform behaviour or of
 * Next's defaults.
 */
const CACHE_NEVER = [{ key: "Cache-Control", value: "no-store, must-revalidate" }];

/** Match both the bare path and anything under it, with and without the trailing slash. */
const NEVER_CACHEABLE = ["/report", "/report/", "/report/:path*", "/api", "/api/:path*"];

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
      {
        // The homepage carries the dated self-report panel, so it is the one page whose
        // staleness a reader can actually see. Ten minutes is long enough to absorb a
        // traffic spike and short enough that the figure is never a day old.
        source: "/",
        headers: CACHE_SHORT,
      },
      ...CACHEABLE.map((source) => ({ source, headers: CACHE_LONG })),
      ...NEVER_CACHEABLE.map((source) => ({ source, headers: CACHE_NEVER })),
    ];
  },
};

export default nextConfig;
