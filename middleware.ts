import { NextResponse, type NextRequest } from "next/server";

/**
 * Permanent redirects for paths that were published and are not coming back.
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
 * Why redirect at all instead of letting these 404: every URL below was
 * published in the sitemap and may be indexed, and a 404 throws away whatever
 * equity it holds. 301 is permanent, which is the honest signal for a section
 * that is not coming back.
 */
const GONE: Record<string, string> = {
  // The German half of the site, removed before the English-only decision.
  "/de": "/",
  "/de/docs": "/docs/",
  "/de/docs/gptbot-robots-txt": "/docs/allow-ai-crawlers/",
  "/de/docs/llms-txt-erstellen": "/docs/llms-txt-deployment/",
  "/de/llms-txt-studio": "/llms-txt-studio/",
  "/de/impressum": "/about/",
  /*
   * The German withdrawal notice used to point at the English one. Both are gone
   * with the paid audit, so this resolves in one hop to the homepage rather than
   * chaining through a URL that itself redirects.
   */
  "/de/widerrufsrecht": "/",

  /*
   * The paid audit and the two policies that went with it. See OPERATIONS.md:
   * nothing on this site is sold, so there is no price, no refund commitment and
   * no consumer right of withdrawal to describe.
   */
  "/pricing": "/",
  "/refund": "/",
  "/withdrawal": "/",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // trailingSlash is on, so both forms arrive. Normalise before lookup.
  const key = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  /*
   * Anything under /de/ that is not listed above goes to the homepage rather than
   * 404ing, which keeps stale links from a section that was once fully published
   * useful.
   *
   * The withdrawn pages get no such fallback, and the difference is deliberate: a
   * path under a removed section has a defensible target, while an arbitrary path
   * that was never published should 404 rather than quietly becoming the
   * homepage. Returning null is what makes that distinction enforceable here
   * instead of depending on the matcher being right.
   */
  const target = GONE[key] ?? (key === "/de" || key.startsWith("/de/") ? "/" : null);
  if (target === null) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = target;
  // Query strings are deliberately preserved: a stale /de/report/?domain=x link
  // should still carry the domain through to the English page.

  return NextResponse.redirect(url, 301);
}

export const config = {
  /*
   * Only the removed paths. Middleware sits in front of every request it matches,
   * so matching everything would tax the whole site for redirects that concern a
   * handful of dead URLs. The withdrawn pages are listed without a trailing slash
   * because the normalisation above strips it before the lookup.
   */
  matcher: ["/de", "/de/:path*", "/pricing", "/refund", "/withdrawal"],
};
