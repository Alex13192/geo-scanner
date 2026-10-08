import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_HOST, SITE_URL } from "@/lib/site";

/**
 * Two redirects, and they live in the same file because they are the same kind of
 * decision: a request that should not be answered where it arrived.
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
 * so this is the layer that actually gets a say in the response. The alternative for
 * the hostname move below was a Cloudflare Redirect Rule, which would work and would
 * be faster, and was rejected for the reason the paragraph above gives: a redirect that
 * exists only in a dashboard cannot be read, reviewed or run against a local server by
 * anyone reading this repository.
 *
 * Why redirect at all instead of letting these 404: every URL below was published in
 * the sitemap and may be indexed, and a 404 throws away whatever equity it holds. 301
 * is permanent, which is the honest signal for a section that is not coming back.
 */

/** Dead paths on this site: where a path used to be -> where it goes now. */
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
   * The withdrawal notice: the one page of the three that is still gone. /pricing/ and /refund/ came
   * back on 2026-10-08 with the measurement report (see OPERATIONS.md) - the site sells something
   * again, so a price and a refund policy are things a page can honestly describe. The separate
   * /withdrawal/ URL did not come back: the consumer withdrawal notice is folded into /refund/,
   * where a buyer deciding whether to pay will actually read it. It was published and may be
   * indexed, so it redirects rather than 404ing.
   */
  "/withdrawal": "/",
};

export function middleware(request: NextRequest) {
  /*
   * 1. The old hostname moves to the site's own domain.
   *
   * Checked before the path table, and that order is deliberate: this applies to every
   * path, including paths that do not exist and paths that are themselves withdrawn. A
   * request to a hostname being retired should reach the new one whatever it asked for;
   * answering it with a 404, or with a second redirect chain, are both worse than
   * sending it where the site now lives.
   *
   * Path AND query string are carried over. Dropping the query would break
   * /report/?domain=... links, which is the one URL here whose entire meaning is in its
   * query string.
   */
  if ((request.headers.get("host") ?? "") === LEGACY_HOST) {
    return NextResponse.redirect(
      new URL(request.nextUrl.pathname + request.nextUrl.search, SITE_URL),
      301
    );
  }

  /* 2. Dead paths on the current hostname. */

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
   * THIS MATCHER IS BROAD, AND IT HAS TO BE - which reverses what used to be written
   * here. It listed five dead paths and said that matching everything "would tax the
   * whole site for redirects that concern a handful of dead URLs". That was correct
   * while those five paths were the only job.
   *
   * A hostname redirect cannot be scoped by path: every URL on the old host has to reach
   * this function for the decision to be possible at all. A narrow matcher would mean the
   * move worked for the paths somebody listed and silently not for the rest - and the
   * paths it missed would be exactly the ones nobody thought of.
   *
   * WHAT IT COSTS: one function invocation per request, on both hostnames, for a string
   * comparison.
   * WHAT WOULD LET IT NARROW AGAIN: the old hostname having no inbound links left. The
   * readiness badge snippets are the long tail and they sit in other people's
   * repositories, so that is a when-rather-than-if that nobody here can date.
   *
   * _next/static and _next/image are excluded because they need no decision: a request
   * for a content-hashed asset is for the same asset on either hostname.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};
