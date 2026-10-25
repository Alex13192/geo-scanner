import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_HOST, SITE_HOST, SITE_URL } from "@/lib/site";

/**
 * Two redirects, and they live in the same file because they are the same kind of
 * decision: a request that should not be answered where it arrived.
 *
 * WHY THIS FILE IS NOW CALLED proxy.ts: Next 16 renamed the `middleware` file convention to
 * `proxy` and deprecated the old name; this was middleware.ts until the migration on
 * 2026-10-23, and the body did not change with the name. The runtime is Node.js and is not
 * configurable under the new convention, which is fine for what this does - two string
 * comparisons and a redirect.
 *
 * WHY THIS IS A PROXY AND NOT public/_redirects:
 * A `_redirects` file was the obvious first attempt and it did nothing. The
 * Cloudflare Pages documentation explains why: "Redirects defined in the
 * `_redirects` file are not applied to requests served by Pages Functions, even
 * if the Function route matches the URL pattern." A next-on-pages deployment is
 * a single Function serving every route, so no request ever reaches the
 * `_redirects` parser. The file was removed rather than left in place, because a
 * configuration file that silently does nothing is worse than no file at all -
 * the next person to touch this would trust it.
 *
 * The proxy runs inside the Next.js server, which is what the worker executes,
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
  /*
   * LEGAL PAGES EXIST IN ENGLISH ONLY, BUT THE LOCALIZED STOREFRONTS EXIST IN FIVE LANGUAGES.
   * Their footers link the English /terms/, /privacy/ and /refund/ and label them "(EN)", and the
   * page says English prevails - so a localized legal URL was never published. It still gets typed:
   * by a reviewer checking whether a German buyer can read the terms, by a translator, or by a stale
   * link. A 404 on a legal page is the one 404 that reads as "there is no policy", which is why
   * these resolve to the English document instead. Generated from one list so a sixth locale cannot
   * half-exist; /de/impressum and /de/widerrufsrecht below predate the localized site and still
   * point at the closest English page.
   */
  ...Object.fromEntries(
    ["/zh", "/ja", "/es", "/de", "/fr"].flatMap((locale) =>
      [
        ["terms", "/terms/"],
        ["privacy", "/privacy/"],
        ["refund", "/refund/"],
      ].map(([page, target]) => [`${locale}/${page}`, target])
    )
  ),

  /*
   * The German half of the site was removed before the English-only decision and returned on
   * 2026-10-23 as one of five localized locales. `/de/` itself is therefore NOT in this table:
   * redirecting it to `/` would now break a real page. The old German deep paths that have no
   * localized equivalent still resolve to the English documentation rather than 404ing.
   */
  "/de/docs": "/docs/",
  "/de/docs/gptbot-robots-txt": "/docs/allow-ai-crawlers/",
  "/de/docs/llms-txt-erstellen": "/docs/llms-txt-deployment/",
  "/de/llms-txt-studio": "/llms-txt-studio/",
  "/de/impressum": "/about/",
  "/de/widerrufsrecht": "/refund/",

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

export function proxy(request: NextRequest) {
  /*
   * 0. Plain HTTP from the edge moves to HTTPS here, not only in the zone setting.
   *
   * WHY THIS EXISTS: measured on 2026-10-23, http://llmention-geo.com/ answered 200. HSTS
   * protects a browser that has already visited over HTTPS; a first-time visitor and a
   * crawler get the plaintext version, and the audit was right that this is a P0 for a site
   * that publishes a security section. The zone-level "Always Use HTTPS" setting is still
   * the better place for it (it answers before the Worker runs), but the token in this
   * account cannot change zone settings, and a redirect that lives in code is one this
   * repository can verify.
   */
  if (request.nextUrl.protocol === "http:") {
    const secure = request.nextUrl.clone();
    secure.protocol = "https:";
    return NextResponse.redirect(secure, 301);
  }

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

  /*
   * 1b. www moves to the apex.
   *
   * The www hostname had no DNS record on 2026-10-23, so it answered 502 rather than
   * reaching this function - a dashboard change (a proxied www record plus this redirect)
   * cannot be made from this repository. The branch is here so that the day the record
   * exists, www does not become a second copy of the site for search engines, which is the
   * usual outcome of adding the record and stopping there.
   */
  if ((request.headers.get("host") ?? "").toLowerCase() === `www.${SITE_HOST}`) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, SITE_URL);
    return NextResponse.redirect(target, 301);
  }

  /* 2. Dead paths on the current hostname. */

  const { pathname } = request.nextUrl;

  /*
   * A locale prefix that appears twice is one bad link away from being a 404 again. The Chinese
   * study and self-audit pages linked to /zh/zh/report/ for a while (Ahrefs found 33 of them),
   * and even after the pages were fixed the old URLs are still in crawl history and in whatever
   * someone copied. Redirect the doubled form to the single-prefix one instead of letting it
   * 404: the target exists, and a 301 is the honest answer to a path that was published by
   * mistake.
   */
  const doubledLocale = pathname.match(/^\/(zh|ja|es|de|fr|en)\/\1(?=\/|$)/);
  if (doubledLocale) {
    const locale = doubledLocale[1];
    const moved = request.nextUrl.clone();
    moved.pathname = pathname.replace(new RegExp(`^/${locale}/${locale}`), `/${locale}`);
    return NextResponse.redirect(moved, 301);
  }

  /*
   * THE WRITING MOVED FROM /insights/ TO /blog/ ON 2026-10-24. The archive was always a blog;
   * the path now says so. Old URLs are redirected rather than 404'd because they were published,
   * linked from the homepage and the study, and some of them have been crawled - a 301 keeps the
   * inbound links and the indexed history pointing at one canonical address per article.
   * The locale prefixes move with it: /zh/insights/... -> /zh/blog/..., /ja/... likewise.
   */
  const legacyBlog = pathname.match(/^\/(zh\/|ja\/)?insights(\/.*)?$/);
  if (legacyBlog) {
    const locale = legacyBlog[1] ?? "";
    const rest = legacyBlog[2] ?? "/";
    const moved = request.nextUrl.clone();
    moved.pathname = `/${locale}blog${rest === "/" ? "/" : rest}`;
    return NextResponse.redirect(moved, 301);
  }

  // trailingSlash is on, so both forms arrive. Normalise before lookup.
  const key = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  /*
   * Anything under /de/ that is not listed above passes through: since 2026-10-23 that is a
   * real localized site, not a removed section, so it must not fall back to the homepage.
   * A path under a removed section has a defensible target, while an arbitrary path that was
   * never published should 404 rather than quietly becoming the homepage.
   */
  const target = GONE[key] ?? null;
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
