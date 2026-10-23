import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/*
 * Makes the bindings in wrangler.jsonc available to `next dev`.
 *
 * WHY THIS IS NEEDED AT ALL: `next dev` runs the app in Node, where there is no D1 and no
 * assets binding, so `getCloudflareContext()` throws and every route that touches the
 * database fails locally while working in production - the least useful way round. This
 * call starts a wrangler platform proxy in the dev server and hands the same bindings to
 * it, reading them from wrangler.jsonc, so there is one description of the environment
 * rather than a second one maintained for local work.
 *
 * It is called unconditionally, which is what the adapter's documentation shows: during a
 * production build the call is inert, and the Worker that OpenNext produces gets its
 * bindings from the platform rather than from here.
 */
initOpenNextCloudflareForDev();

/**
 * Security response headers.
 *
 * WHY THIS FILE AND NOT public/_headers:
 * public/_headers is the Cloudflare Pages native mechanism, and it is the wrong
 * one here for the same reason public/_redirects was. proxy.ts already
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
 *
 * WHAT CAME BACK, AND WHERE THE REST OF THE FIX IS. Not HIT and not DYNAMIC but absent
 * altogether, on a Free-plan Worker whose 10 ms CPU budget a cold Next.js runtime exceeds -
 * which surfaced as intermittent 1102s, because every page view boots the runtime and
 * nothing is cached. OPERATIONS.md records what that means: the paid plan is the certain
 * fix, and the Cache Rule named above is worth adding but could not be confirmed from
 * outside, because this Worker's responses carry no cf-cache-status to read. The headers
 * below are still inert either way.
 *
 * THIS SETTING CAUSED A REAL FALSE NEGATIVE ON 2026-10-23, SO IT CHANGED THAT DAY. An
 * external audit read the site after a deploy and reported the pre-deploy homepage: the
 * old banner, 97/100, the old footer, and no links to the newly shipped pages. The origin
 * was serving the new version (verified from two colos with cache-busting requests), so the
 * stale copy was held by an intermediary honouring these headers. The old values were
 * `s-maxage=86400` for content pages and 600 for the homepage, with
 * `stale-while-revalidate=604800` - which is precisely permission to keep serving a stale
 * copy for up to a week after a deploy. For a site whose whole claim is "the published
 * version is the running version", that is the wrong trade: a page that is 24 hours stale
 * is worse than a Worker invocation.
 *
 * HTML therefore now says `public, max-age=0, must-revalidate`: caches may store it but
 * must check with the origin every time, and the ETag makes that check a 304 rather than a
 * full response. `stale-while-revalidate` is gone from HTML entirely. Static assets are
 * untouched - Next still emits `immutable` for /_next/static, which is correct because the
 * filenames are content-hashed.
 */
const CACHE_HTML = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];

/**
 * Paths whose HTML is a content page. Listed explicitly so no route inherits Next's
 * one-year `s-maxage=31536000` default for prerendered pages - that default is what
 * /tools/ and /self-audit/ carried before this change, and a shared cache may keep a page
 * for a year on the strength of it. Adding a page means adding it here; an omission is
 * caught by the `cache-control` assertion in scripts/check-live.mjs.
 */
const CACHEABLE = [
  "/checks/:path*",
  "/docs/:path*",
  "/dimensions/:path*",
  "/methodology/",
  "/study/",
  "/about/",
  "/contact/",
  "/tools/",
  "/answer-check/",
  "/author/",
  "/insights/:path*",
  "/compare/:path*",
  "/self-audit/",
  "/monitor/",
  "/llms-txt-studio/",
  "/readiness-badge/",
  "/privacy/",
  "/terms/",
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
  /*
   * NO `eslint` KEY. Next 16 removed the built-in lint step, and with it the
   * `eslint.ignoreDuringBuilds` escape hatch this file used to set. Linting is now a
   * script a person or CI runs (`npm run lint`), not something `next build` does - which
   * is the correct direction: a build that silently skips lint looks the same as one that
   * passed it, and this repository's gates are explicit for that reason.
   */
  async headers() {
    return [
      {
        // Every route, including the API and the per-request /report/ page.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // The homepage carries the dated self-report panel, so it is the page whose
        // staleness a reader can actually see. It was given ten minutes; after the
        // 2026-10-23 false-negative it revalidates like every other HTML page, because an
        // intermediary holding a "fresh" homepage is exactly how a deploy looks like a
        // non-deploy.
        source: "/",
        headers: CACHE_HTML,
      },
      ...CACHEABLE.map((source) => ({ source, headers: CACHE_HTML })),
      ...NEVER_CACHEABLE.map((source) => ({ source, headers: CACHE_NEVER })),
    ];
  },
};

export default nextConfig;
