import { NextResponse, type NextRequest } from "next/server";

/**
 * Permanent redirects for the German site that was removed.
 *
 * WHY THIS IS MIDDLEWARE AND NOT public/_redirects:
 * A `_redirects` file was the obvious first attempt and it did nothing. The
 * Cloudflare Pages documentation explains why: "Redirects defined in the
 * `_redirects` file are not applied to requests served by Pages Functions, even
 * if the Function route matches the URL pattern." A next-on-pages deployment is
 * a single Function serving every route, so no request ever reaches the
 * `_redirects` parser. The file was removed rather than left in place, because a
 * configuration file that silently does nothing is worse than no file at all -
 * the next person to touch this would trust it.
 *
 * Middleware runs inside the Next.js server, which is what the worker executes,
 * so this is the layer that actually gets a say in the response.
 *
 * Why redirect at all instead of letting /de/* 404: those URLs were published in
 * the sitemap with hreflang pairs and may be indexed, and a 404 throws away
 * whatever equity they hold. 301 is permanent, which is the honest signal for a
 * section that is not coming back.
 */
const GERMAN_REDIRECTS: Record<string, string> = {
  "/de": "/",
  "/de/docs": "/docs/",
  "/de/docs/gptbot-robots-txt": "/docs/allow-ai-crawlers/",
  "/de/docs/llms-txt-erstellen": "/docs/llms-txt-deployment/",
  "/de/llms-txt-studio": "/llms-txt-studio/",
  "/de/impressum": "/about/",
  // Not a marketing redirect: the withdrawal notice is an obligation towards
  // consumers in the EU and the UK, so its German URL points at the real English
  // replacement rather than at the homepage.
  "/de/widerrufsrecht": "/withdrawal/",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Guard the boundary: "/de" or "/de/...", never "/design" or "/demo".
  if (pathname !== "/de" && !pathname.startsWith("/de/")) {
    return NextResponse.next();
  }

  // trailingSlash is on, so both forms arrive. Normalise before lookup.
  const key = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  // Anything under /de/ that is not listed above goes to the homepage rather
  // than 404ing, which keeps stale links useful.
  const target = GERMAN_REDIRECTS[key] ?? "/";

  const url = request.nextUrl.clone();
  url.pathname = target;
  // Query strings are deliberately preserved: a stale /de/report/?domain=x link
  // should still carry the domain through to the English page.

  return NextResponse.redirect(url, 301);
}

export const config = {
  // Only run for the removed section. Middleware sits in front of every request
  // it matches, so matching everything would tax the whole site for a redirect
  // that concerns a handful of dead URLs.
  matcher: ["/de", "/de/:path*"],
};
