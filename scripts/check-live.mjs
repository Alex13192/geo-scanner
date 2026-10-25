/**
 * Check a RUNNING deployment, not a build directory.
 *
 *   node scripts/check-live.mjs                        # the canonical origin, from lib/site.ts
 *   node scripts/check-live.mjs http://localhost:3000  # somewhere else, e.g. a local server
 *
 * WHY THIS EXISTS, given there are already five gates:
 * every one of them inspects local build output. `check:built` reads .next/server/app,
 * `test:*` run in-process, `tsc` never leaves the repo. Nothing verified what a real
 * response actually carries - and this repository has already been bitten by exactly
 * that gap: proxy.ts documents that public/_redirects silently does nothing under
 * next-on-pages, because a next-on-pages deployment is a single Function serving every
 * route, so no request ever reaches the _redirects parser. A config file that is correct
 * on disk and inert in production is invisible to all five gates.
 *
 * So this is the sixth: it asks the origin that is actually answering.
 *
 * Every assertion here is one this project has claimed at some point and could not
 * otherwise prove:
 *   - the security headers in next.config.ts, which the config alone cannot confirm
 *   - the markdown twins, which the scanner's markdown-alternate check deliberately
 *     does NOT follow - its catalogue note says so, so somebody has to
 *   - /report/ not claiming to be the homepage, which was a real bug
 *   - robots.txt stating a Content-Signal, and /llms.txt being served at all
 *   - /ads.txt being served as plain text that names Google. It cannot be verified from
 *     the repository at all: the file can be present and correct and still never reach a
 *     browser, which is exactly what the other hostname in this zone does.
 *   - the old hostname still redirecting here. One of the two redirect mechanisms this
 *     repository has tried was inert in production, and a hostname redirect that stops
 *     happening looks like nothing at all: the old host keeps answering, with the right
 *     content, and only the canonical signal is missing.
 *
 * Run it after a deploy. It exits non-zero, so it can be wired into a post-deploy step
 * whenever you want one.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The origin to check, where no argument means the site itself.
 *
 * WHY THE DEFAULT IS THE REAL SITE AND NOT localhost: it used to be localhost, which meant
 * the smoke job had to pass the hostname on its command line - and that put a second copy of
 * the canonical origin inside .github/workflows/deploy.yml, where check:values could not see
 * it and where it would have gone stale the next time the site moved, silently, in the one
 * job whose whole purpose is to notice that kind of thing. Reading the default here means CI
 * names no hostname at all.
 *
 * Read with a regex rather than imported because this is a .mjs file and lib/site.ts is
 * TypeScript - the same reason check:values reads it that way.
 */
function canonicalOrigin() {
  const match = readFileSync(join(ROOT, "lib", "site.ts"), "utf8").match(
    /export const SITE_URL\s*=\s*"([^"]+)"/
  );
  if (!match) {
    console.error("Could not read SITE_URL from lib/site.ts, and no origin was given.");
    process.exit(2);
  }
  return match[1];
}

const base = (process.argv[2] || canonicalOrigin()).replace(/\/+$/, "");

/** The five headers next.config.ts declares as enforced. */
const REQUIRED_HEADERS = [
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
];

let failures = 0;
const ok = (label, detail = "") => console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
const bad = (label, detail = "") => {
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  failures += 1;
};

console.log(`Checking ${base}\n`);

/** Fetch without throwing, so one dead route does not hide the others. */
async function get(path) {
  try {
    const res = await fetch(`${base}${path}`, { redirect: "manual" });
    return { res, body: await res.text() };
  } catch (error) {
    return { error: error.message };
  }
}

/* ---- Security headers on the homepage ---- */
console.log("=== security headers on / ===");
{
  const { res, error } = await get("/");
  if (error) {
    bad("could not reach the origin", error);
  } else {
    const missing = REQUIRED_HEADERS.filter((h) => !res.headers.get(h));
    if (missing.length === 0) ok(`all ${REQUIRED_HEADERS.length} enforced headers present`);
    else bad("headers missing", missing.join(", "));

    // Report-Only is the intended state, so its presence is noted rather than required.
    const csp = res.headers.get("content-security-policy-report-only");
    const enforced = res.headers.get("content-security-policy");
    if (enforced) ok("a CSP is being enforced", "if that was not deliberate, check it");
    else if (csp) ok("CSP is Report-Only", "as designed; see next.config.ts for why");
    else bad("no CSP at all, not even Report-Only");
  }
}

/* ---- Which deployment is actually answering ---- */
console.log("\n=== deployment identity ===");
{
  /*
   * THIS CHECK EXISTS BECAUSE ITS ABSENCE WAS A REAL BLIND SPOT.
   *
   * During the move from next-on-pages to OpenNext, check:live reported a clean pass
   * against the production domain while that domain was still served by the old Pages
   * deployment. Every content assertion it made was genuinely true of both deployments -
   * the security headers, the Content-Signal, the canonical and the markdown twins had all
   * been shipped to Pages in earlier commits - so nothing here could tell the two apart,
   * and a cutover that had not happened looked like one that had.
   *
   * The adapters identify themselves in response headers, so the distinction is decidable:
   *   OpenNext Worker   x-opennext: 1, and x-nextjs-cache
   *   next-on-pages     x-next-cache-tags and x-matched-path, no x-opennext
   *
   * A plain `next start` sets neither, and that is a legitimate target to point this
   * script at, so it is reported rather than failed.
   */
  const { res, error } = await get("/");
  if (error) {
    bad("could not read the deployment identity", error);
  } else {
    const opennext = res.headers.get("x-opennext");
    const pagesTags = res.headers.get("x-next-cache-tags");
    const matchedPath = res.headers.get("x-matched-path");

    if (opennext) {
      ok("served by the OpenNext Worker", `x-opennext: ${opennext}`);
    } else if (pagesTags || matchedPath) {
      bad(
        "still served by the next-on-pages Pages deployment",
        `${pagesTags ? "x-next-cache-tags" : "x-matched-path"} present, x-opennext absent`
      );
    } else {
      ok("not identifiable as either adapter", "expected for a plain next start; not a failure");
    }
  }
}

/* ---- robots.txt ---- */
console.log("\n=== robots.txt ===");
{
  const { res, body, error } = await get("/robots.txt");
  if (error) bad("could not fetch robots.txt", error);
  else if (res.status !== 200) bad("robots.txt did not return 200", `HTTP ${res.status}`);
  else {
    if (/^\s*content-signal\s*:/im.test(body)) ok("declares a Content-Signal");
    else bad("no Content-Signal directive");
    if (/^\s*sitemap\s*:/im.test(body)) ok("declares a Sitemap");
    else bad("no Sitemap line");
  }
}

/* ---- llms.txt ---- */
console.log("\n=== llms.txt ===");
{
  const { res, body, error } = await get("/llms.txt");
  if (error) bad("could not fetch llms.txt", error);
  else if (res.status !== 200 || body.trim().length < 20) {
    bad("llms.txt is not served usefully", `HTTP ${res.status}, ${body.trim().length} bytes`);
  } else {
    ok("served", `${body.length} bytes`);
    /*
     * A FRESHNESS MARKER, BECAUSE THIS FILE IS THE ONE THING THE EDGE REALLY CACHES.
     * public/ assets are served from Cloudflare's cache (cf-cache-status: HIT), so a
     * deployment that changes llms.txt can still leave the old file being served until the
     * cache is purged or revalidated. The audit that prompted this check read a pre-deploy
     * llms.txt and concluded the new pages were unreachable; the routes below are the ones
     * that arrived in the 2026-10-23 changes. If they are missing from a live response, the
     * file is stale, and the remedy is a purge rather than an edit.
     */
    const requiredRoutes = ["/self-audit/", "/compare/", "/answer-check/", "/api-docs/"];
    const missing = requiredRoutes.filter((route) => !body.includes(route));
    if (missing.length === 0) ok("carries the current route set", requiredRoutes.join(", "));
    else bad("llms.txt looks stale", `missing ${missing.join(", ")} — purge the edge cache`);
  }
}

/* ---- ads.txt ---- */
console.log("\n=== ads.txt ===");
{
  /*
   * WHY THIS IS ASSERTED RATHER THAN ASSUMED: the file lives in public/, and whether a
   * public/ file reaches a browser under this route depends on the asset routing rather
   * than on the file existing. public/robots.txt is evidence that it works, not evidence
   * that it keeps working, and the other hostname in this zone already serves a 200 with
   * an HTML body at /ads.txt. That failure is invisible from inside the repository: the
   * file is present, correct, and never served.
   *
   * The content type is checked because it is the half that was wrong elsewhere - a 200
   * does not mean the file was served, it means something was.
   */
  const { res, body, error } = await get("/ads.txt");
  if (error) bad("could not fetch ads.txt", error);
  else if (res.status !== 200) bad("ads.txt did not return 200", `HTTP ${res.status}`);
  else {
    const type = res.headers.get("content-type") || "";
    if (type.includes("text/plain")) ok("served as text/plain", type);
    else bad("ads.txt is not served as plain text", type || "(no content-type)");

    if (/^\s*google\.com\s*,\s*pub-\d+\s*,\s*(DIRECT|RESELLER)\s*,/im.test(body)) {
      ok("authorises Google as a seller", body.trim().split(/\r?\n/)[0]);
    } else {
      bad("ads.txt carries no google.com seller line", body.trim().slice(0, 80) || "(empty)");
    }
  }
}

/* ---- the withdrawn pages ---- */
console.log("\n=== withdrawn pages ===");
{
  /*
   * WHY THIS IS ASSERTED RATHER THAN ASSUMED: these redirects live in proxy.ts, and
   * this repository has already been bitten once by a redirect mechanism that was correct
   * on disk and inert in production - proxy.ts documents public/_redirects doing
   * exactly that under next-on-pages. A matcher array is configuration of the same kind:
   * a path missing from it does not redirect, it 404s, and nothing in the repository says
   * so. The pages were listed in the sitemap, so a 404 is a real loss rather than a
   * cosmetic one.
   *
   * The target is checked as well as the status, because a 301 to the wrong place is worse
   * than a 404 - it is followed, and whatever it lands on is credited with the link.
   */
  /*
   * ONE REDIRECT AND TWO PAGES, WHICH IS WHAT THE SITE NOW HAS. /withdrawal/ stayed gone - the
   * consumer notice is folded into /refund/ - so it must still 301 to the homepage. /pricing/ and
   * /refund/ came back on 2026-10-08 with the measurement report, so asserting a redirect on them
   * would now be asserting that a page a visitor can buy from is unreachable.
   */
  for (const path of ["/withdrawal/"]) {
    const { res, error } = await get(path);
    if (error) bad(`could not fetch ${path}`, error);
    else if (res.status !== 301) bad(`${path} does not redirect permanently`, `HTTP ${res.status}`);
    else {
      const target = (res.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, "");
      if (target === "/") ok(`${path} redirects to /`, "HTTP 301");
      else bad(`${path} redirects somewhere unexpected`, `301 -> ${target || "(no location)"}`);
    }
  }

  for (const path of ["/pricing/", "/refund/"]) {
    const { res, error } = await get(path);
    if (error) bad(`could not fetch ${path}`, error);
    else if (res.status !== 200) bad(`${path} is not served`, `HTTP ${res.status}`);
    else ok(`${path} is served`, "HTTP 200");
  }

  /*
   * This one used to point at the English withdrawal notice. That page is gone with the
   * paid audit, so the redirect was repointed at /refund/ on 2026-10-23: the consumer
   * withdrawal notice lives there, and that is the page a buyer asking about cancellation
   * actually needs. A chain through a URL that itself redirects would be a slower 301 with
   * an extra hop for every crawler to record.
   *
   * THE TRAILING SLASH IS PART OF THE ASSERTION, not a detail. next.config.ts sets
   * `trailingSlash`, so a bare path is normalised by Next with a 308 BEFORE middleware
   * runs and only the slashed form reaches the redirect map. Asserting the bare path
   * therefore tests the normaliser rather than this map, and fails for a reason that has
   * nothing to do with what is being checked - which is exactly what the first version of
   * this section did, reporting a failure against a redirect that works.
   */
  /*
   * The writing moved from /insights/ to /blog/ on 2026-10-24. These URLs were published and
   * linked, so the redirect is part of the contract: a 404 would throw away the inbound links
   * and the indexed history. Both the bare archive and an article are checked, plus a
   * localized prefix, because the redirect pattern handles three prefixes.
   */
  for (const [from, to] of [
    ["/insights/", "/blog/"],
    ["/insights/thirty-homepages-none-graded-a/", "/blog/thirty-homepages-none-graded-a/"],
    ["/zh/insights/", "/zh/blog/"],
  ]) {
    const moved = await get(from);
    if (moved.error) bad(`could not fetch ${from}`, moved.error);
    else if (moved.res.status !== 301) bad(`${from} does not redirect`, `HTTP ${moved.res.status}`);
    else {
      const target = (moved.res.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, "");
      if (target === to) ok(`${from} -> ${to}`, "HTTP 301");
      else bad(`${from} redirects somewhere unexpected`, `301 -> ${target || "(no location)"}`);
    }
  }

  /*
   * Legal pages exist in English only, and the localized storefronts say so by labelling the
   * footer link "(EN)". A localized legal URL was never published, but it gets typed: a reviewer
   * checking whether a German buyer can read the terms is the exact reader who will try one. A
   * 404 there reads as "no policy", so proxy.ts maps fifteen of them to the English document and
   * this asserts one per locale plus both other page names on one locale.
   */
  for (const [from, to] of [
    ["/zh/terms/", "/terms/"],
    ["/zh/refund/", "/refund/"],
    ["/ja/privacy/", "/privacy/"],
    ["/de/terms/", "/terms/"],
    ["/fr/refund/", "/refund/"],
  ]) {
    const moved = await get(from);
    if (moved.error) bad(`could not fetch ${from}`, moved.error);
    else if (moved.res.status !== 301) bad(`${from} does not redirect`, `HTTP ${moved.res.status}`);
    else {
      const target = (moved.res.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, "");
      if (target === to) ok(`${from} -> ${to}`, "HTTP 301");
      else bad(`${from} redirects somewhere unexpected`, `301 -> ${target || "(no location)"}`);
    }
  }

  const { res, error } = await get("/de/widerrufsrecht/");
  if (error) bad("could not fetch /de/widerrufsrecht/", error);
  else {
    const target = (res.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, "");
    if (target === "/refund/") ok("/de/widerrufsrecht/ resolves in one hop to /refund/");
    else bad("/de/widerrufsrecht/ does not resolve to /refund/", `HTTP ${res.status} -> ${target || "(no location)"}`);
  }
}

/* ---- the old hostname ---- */
console.log("\n=== the old hostname ===");
{
  /*
   * The old hostname is READ OUT OF lib/site.ts, the same way check:values reads SITE_URL,
   * because this file cannot import a TypeScript module. Reading it rather than repeating it
   * is the whole point: a second copy is what check:values exists to prevent, and a test that
   * hardcodes the thing it tests proves only that the test was written.
   */
  const legacy = readFileSync(join(ROOT, "lib", "site.ts"), "utf8").match(
    /export const LEGACY_HOST\s*=\s*"([^"]+)"/
  )?.[1];

  if (!legacy) {
    bad("could not read LEGACY_HOST from lib/site.ts");
  } else if (["localhost", "127.0.0.1"].includes(new URL(base).hostname)) {
    /*
     * The redirect is decided from the Host header, and fetch will not let this script set
     * one. Skipped and said out loud rather than faked, so a local run cannot be mistaken
     * for evidence that the redirect works.
     */
    console.log(`  skip  ${legacy} — needs a run against a deployed origin`);
  } else {
    for (const path of ["/", "/methodology/", "/report/?domain=example.com"]) {
      const res = await fetch(`https://${legacy}${path}`, { redirect: "manual" });
      const location = res.headers.get("location") || "";
      if (res.status !== 301) {
        bad(`${legacy}${path} does not redirect permanently`, `HTTP ${res.status}`);
      } else if (!location.startsWith(`${base}/`)) {
        bad(`${legacy}${path} redirects somewhere other than this site`, location);
      } else {
        // Path AND query have to survive. /report/ carries its entire meaning in its query,
        // so a redirect that drops it turns a working link into the homepage's error page.
        const arrived = location.slice(base.length);
        if (arrived === path) ok(`${legacy}${path} → ${arrived}`);
        else bad(`${legacy}${path} arrived changed`, `${arrived} (expected ${path})`);
      }
    }
  }
}

/* ---- the www hostname ---- */
console.log("\n=== the www hostname ===");
{
  /*
   * WHY THIS IS TESTED LIKE THE OLD HOSTNAME: www was the one hostname that did NOT answer.
   * The apex had a Workers custom domain and www had no DNS record at all, so a browser got
   * NXDOMAIN before the redirect branch in proxy.ts could run. The fix is a second custom
   * domain in wrangler.jsonc (Cloudflare creates the record) plus the redirect that already
   * existed. This assertion is what distinguishes "the record exists" from "the redirect
   * works": a record that resolves but serves the site on both hosts is the duplicate-content
   * outcome the redirect exists to prevent.
   */
  const host = new URL(base).hostname;
  const www = `www.${host}`;

  if (["localhost", "127.0.0.1"].includes(host)) {
    console.log(`  skip  ${www} — needs a run against a deployed origin`);
  } else {
    for (const path of ["/", "/pricing/", "/report/?domain=example.com"]) {
      const res = await fetch(`https://${www}${path}`, { redirect: "manual" });
      const location = res.headers.get("location") || "";
      if (res.status !== 301) {
        bad(`${www}${path} does not redirect permanently`, `HTTP ${res.status}`);
      } else if (!location.startsWith(`${base}/`)) {
        bad(`${www}${path} redirects somewhere other than this site`, location);
      } else {
        const arrived = location.slice(base.length);
        if (arrived === path) ok(`${www}${path} → ${arrived}`);
        else bad(`${www}${path} arrived changed`, `${arrived} (expected ${path})`);
      }
    }
  }
}

/* ---- /report/ must not claim to be the homepage ---- */
console.log("\n=== /report/ canonical ===");
{
  const { res, body, error } = await get("/report/");
  if (error) bad("could not fetch /report/", error);
  else {
    const canonical = body.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    if (!canonical) ok("no canonical at all", "acceptable: the page is noindex");
    else if (canonical.replace(/\/+$/, "") === base) {
      bad("canonical points at the site root", "this is the bug the fix was for");
    } else ok("canonical is self-referencing", canonical);
    if (/name="robots"[^>]*noindex/i.test(body)) ok("noindex is present");
    else bad("noindex is missing on a thin, user-specific page");
  }
}

/* ---- Markdown twins: declared AND resolvable ---- */
console.log("\n=== markdown twins ===");
{
  /*
   * Follow one page's declared markdown alternate and assert that it resolves as markdown.
   *
   * WHY THIS IS A HELPER RATHER THAN A LOOP OVER PATHS: the homepage and the rule pages are
   * declared by different mechanisms - a layout's metadata for the homepage, the check page's
   * own metadata for a rule - and both have to be followed the same way. The scanner's
   * markdown-alternate rule reads the DECLARATION only and never fetches the target; its
   * catalogue note says so. Without this script the twin could be declared and 404 forever.
   *
   * WHY THE DECLARED HREF IS REBUILT AGAINST `base` RATHER THAN FETCHED AS WRITTEN: metadataBase
   * makes the href absolute, which is correct for the convention, so it cannot be concatenated
   * onto `base` - and the deployment under test can differ from the origin the page names. Taking
   * the pathname and re-attaching it to the origin under test is what makes this script check the
   * deployment it was pointed at. The first version did `twin.replace(base, "")`, which matched
   * nothing against a local origin and produced "http://localhost:3111https://...".
   */
  const followTwin = async (label, path) => {
    const page = await get(path);
    if (page.error) {
      bad(`could not fetch ${label}`, page.error);
      return;
    }

    const twin = page.body.match(
      /<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*href="([^"]+)"/i
    )?.[1];
    if (!twin) {
      bad(`${label} does not declare a markdown alternate`);
      return;
    }
    ok(`${label} declares a twin`, twin);

    let twinPath = twin;
    try {
      twinPath = new URL(twin, base).pathname;
    } catch {
      /* not a URL; use it as a path */
    }

    const { res, body, error } = await get(twinPath);
    if (error) bad(`${label}'s declared twin is unreachable`, error);
    else if (res.status !== 200) {
      bad(`${label}'s declared twin did not return 200`, `HTTP ${res.status}`);
    } else if (!(res.headers.get("content-type") || "").includes("text/markdown")) {
      bad(`${label}'s twin is not served as markdown`, res.headers.get("content-type") || "(none)");
    } else if (!/^#\s+\S/m.test(body)) {
      bad(`${label}'s twin has no markdown heading`, "body may be HTML");
    } else {
      ok(`${label}'s twin resolves as markdown`, `${body.length} bytes`);
    }
  };

  /*
   * THE HOMEPAGE IS THE ONE THAT WAS MISSING. The scanner's own homepage failed the
   * markdown-alternate rule it applies to everybody else, so it is followed here as well as a
   * rule page - a declaration nobody follows is how that failure stayed invisible.
   */
  await followTwin("the rule page", "/checks/answer-first/");
  await followTwin("the homepage", "/");
}

/* ---- The new section is actually deployed ---- */
console.log("\n=== the rule section ===");
{
  const { res, body, error } = await get("/checks/");
  if (error) bad("could not fetch /checks/", error);
  else if (res.status !== 200) bad("/checks/ did not return 200", `HTTP ${res.status}`);
  else {
    const links = (body.match(/href="\/checks\/[a-z0-9-]+\/"/g) || []).length;
    if (links >= 20) ok("the hub links to the rules", `${links} links`);
    else bad("the hub looks empty", `${links} links`);
  }
  const { body: sitemap, error: sitemapError } = await get("/sitemap.xml");
  if (sitemapError) bad("could not fetch the sitemap", sitemapError);
  else if (!sitemap.includes("/checks/")) bad("the sitemap does not mention /checks/");
  else if (!sitemap.includes("/self-audit/") || !sitemap.includes("/api-docs/")) {
    /* Same stale-cache class as llms.txt: sitemap.xml is a public asset, so an old copy can
       outlive a deploy and hide the new pages from the crawler that reads it first. */
    bad("the sitemap is stale", "missing /self-audit/ or /api-docs/ — purge the edge cache");
  } else ok("the sitemap lists the rule pages, the self-audit page and the API reference");
}

/* ---- localized pages ---- */
console.log("\n=== localized pages ===");
{
  /*
   * WHY THIS IS ASSERTED: the locale routes are new, and the failure mode is specific - a
   * page that renders in the right language but is served with `<html lang="en">`, or a
   * page with the right lang and no hreflang matrix, looks correct in a browser and is
   * useless to a search engine. The matrix must contain every locale plus x-default, so six
   * hreflang links is the floor for a page that claims all of them.
   */
  const locales = [
    ["zh", "zh-Hans"],
    ["ja", "ja"],
    ["es", "es"],
    ["de", "de"],
    ["fr", "fr"],
  ];
  for (const [code, lang] of locales) {
    const home = await get(`/${code}/`);
    const pricing = await get(`/${code}/pricing/`);
    if (home.error || pricing.error) {
      bad(`${code} pages unreachable`, home.error || pricing.error);
      continue;
    }
    const hreflangs = (home.body.match(/hreflang="/gi) || []).length;
    const correctLang = new RegExp(`<html[^>]+lang="${lang}"`, "i").test(home.body);
    if (home.res.status !== 200 || pricing.res.status !== 200) {
      bad(`${code} pages do not return 200`, `home ${home.res.status}, pricing ${pricing.res.status}`);
    } else if (!correctLang) {
      bad(`${code} homepage has the wrong <html lang>`, `expected lang="${lang}"`);
    } else if (hreflangs < 6) {
      bad(`${code} homepage has an incomplete hreflang matrix`, `${hreflangs} hreflang link(s), expected 6+`);
    } else {
      ok(`${code} home and pricing`, `lang ${lang}, ${hreflangs} hreflang links`);
    }
  }
}

/* ---- plain HTTP must move to HTTPS ---- */
console.log("\n=== plain HTTP ===");
{
  /*
   * WHY THIS IS ASSERTED: measured on 2026-10-23, the production origin answered 200 over
   * plain HTTP. HSTS only protects a browser that has already visited over HTTPS, so a
   * first-time visitor and a crawler were served plaintext. The redirect now lives in
   * proxy.ts because the deployment token cannot change the zone's "Always Use HTTPS"
   * setting - which is still the better place for it, but a code-level redirect is one this
   * repository can verify and keep.
   */
  const httpBase = base.replace(/^https:/, "http:");
  try {
    const res = await fetch(`${httpBase}/`, { redirect: "manual" });
    const location = res.headers.get("location") || "";
    if (res.status === 301 && location.startsWith("https://")) {
      ok("http:// moves to https://", `301 -> ${location}`);
    } else {
      bad("http:// does not redirect to https://", `HTTP ${res.status} -> ${location || "(no location)"}`);
    }
  } catch (error) {
    bad("http:// could not be fetched", String(error));
  }
}

/* ---- the blog feed ---- */
console.log("\n=== blog feed ===");
{
  /*
   * WHY THIS IS ASSERTED: a feed that silently starts returning HTML (a redirect to the archive,
   * a middleware rewrite) is invisible to readers until their reader app says "not a feed".
   * The content-type and the <rss element are the two things a reader checks.
   */
  const { res, body, error } = await get("/blog/rss.xml");
  if (error) bad("could not fetch /blog/rss.xml", error);
  else if (res.status !== 200) bad("/blog/rss.xml is not served", `HTTP ${res.status}`);
  else if (!(res.headers.get("content-type") || "").includes("rss+xml")) {
    bad("/blog/rss.xml has the wrong content type", res.headers.get("content-type") || "(none)");
  } else if (!body.includes("<rss") || !body.includes("/blog/")) {
    bad("/blog/rss.xml is not a feed", "missing <rss or article links");
  } else {
    ok("/blog/rss.xml is a feed", `${(body.match(/<item>/g) || []).length} items`);
  }
}

/* ---- HTML must not be cacheable past a deploy ---- */
console.log("\n=== html cache headers ===");
{
  /*
   * WHY THIS IS ASSERTED RATHER THAN LEFT TO THE CONFIG: on 2026-10-23 an external audit
   * fetched the site after a deploy and reported the pre-deploy homepage — old banner, old
   * footer, no links to the pages that had just shipped — while the origin was serving the
   * new version. The cause was a cache lifetime that outlived the deploy
   * (s-maxage=86400 with stale-while-revalidate=604800). The failure is invisible from the
   * origin, because the origin is always right; this is the assertion that notices when the
   * headers regress, and it is also the sentence to quote at any intermediary that insists
   * the site did not change.
   */
  const paths = ["/", "/study/", "/tools/", "/self-audit/", "/about/", "/compare/"];
  for (const path of paths) {
    const { res, error } = await get(path);
    if (error) {
      bad(`${path} unreachable`, error);
      continue;
    }
    const cc = (res.headers.get("cache-control") || "").toLowerCase();
    if (!cc.includes("must-revalidate") || !/max-age=0\b/.test(cc)) {
      bad(`${path} may be cached past a deploy`, `cache-control: ${cc || "(none)"}`);
    } else if (cc.includes("stale-while-revalidate")) {
      bad(`${path} may serve stale after a deploy`, `cache-control: ${cc}`);
    } else {
      ok(`${path} revalidates`, cc);
    }
  }
}

/* ---- Edge caching: a measurement, deliberately NOT an assertion ---- */
console.log("\n=== edge caching (informational, not gated) ===");
{
  /*
   * This section reports rather than asserts, and the distinction is the point. Whether
   * Cloudflare caches a Pages Function response on the strength of its Cache-Control
   * header is the open question next.config.ts documents; failing the run here would mean
   * asserting something nobody has verified yet. When the answer is known, this becomes a
   * real check with a real expected value.
   *
   * Each path is requested twice, because the first response for an uncached URL is
   * expected to be a MISS and only a second request can demonstrate a HIT.
   */
  for (const path of ["/", "/methodology/", "/checks/robots-present/"]) {
    const first = await get(path);
    if (first.error) {
      console.log(`  ${path}  unreachable: ${first.error}`);
      continue;
    }
    const second = await get(path);
    console.log(`  ${path}`);
    console.log(`    cache-control:   ${first.res.headers.get("cache-control") || "(none)"}`);
    console.log(
      `    cf-cache-status: 1st ${first.res.headers.get("cf-cache-status") || "-"}, ` +
        `2nd ${second.res.headers.get("cf-cache-status") || "-"}`
    );
  }
  console.log("    HIT or REVALIDATED on the second request means the edge is caching.");
  console.log("    DYNAMIC on both means the header alone is not enough - a Cloudflare");
  console.log("    Cache Rule for these paths, or OpenNext's incremental cache, would be.");
}

console.log(
  failures === 0
    ? `\n${base} answered every check.`
    : `\n${failures} check(s) failed against ${base}.`
);
process.exitCode = failures === 0 ? 0 : 1;
