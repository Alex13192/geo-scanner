/**
 * Check a RUNNING deployment, not a build directory.
 *
 *   node scripts/check-live.mjs                       # http://localhost:3000
 *   node scripts/check-live.mjs https://example.com   # the deployed site
 *
 * WHY THIS EXISTS, given there are already five gates:
 * every one of them inspects local build output. `check:built` reads .next/server/app,
 * `test:*` run in-process, `tsc` never leaves the repo. Nothing verified what a real
 * response actually carries - and this repository has already been bitten by exactly
 * that gap: middleware.ts documents that public/_redirects silently does nothing under
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

const base = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");

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
  } else ok("served", `${body.length} bytes`);
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
   * WHY THIS IS ASSERTED RATHER THAN ASSUMED: these redirects live in middleware.ts, and
   * this repository has already been bitten once by a redirect mechanism that was correct
   * on disk and inert in production - middleware.ts documents public/_redirects doing
   * exactly that under next-on-pages. A matcher array is configuration of the same kind:
   * a path missing from it does not redirect, it 404s, and nothing in the repository says
   * so. The pages were listed in the sitemap, so a 404 is a real loss rather than a
   * cosmetic one.
   *
   * The target is checked as well as the status, because a 301 to the wrong place is worse
   * than a 404 - it is followed, and whatever it lands on is credited with the link.
   */
  for (const path of ["/pricing/", "/refund/", "/withdrawal/"]) {
    const { res, error } = await get(path);
    if (error) bad(`could not fetch ${path}`, error);
    else if (res.status !== 301) bad(`${path} does not redirect permanently`, `HTTP ${res.status}`);
    else {
      const target = (res.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, "");
      if (target === "/") ok(`${path} redirects to /`, "HTTP 301");
      else bad(`${path} redirects somewhere unexpected`, `301 -> ${target || "(no location)"}`);
    }
  }

  /*
   * This one used to point at the English withdrawal notice. That page is gone with the
   * paid audit, so the redirect was repointed at the homepage: a chain through a URL that
   * itself redirects is a slower 301 with an extra hop for every crawler to record.
   *
   * THE TRAILING SLASH IS PART OF THE ASSERTION, not a detail. next.config.ts sets
   * `trailingSlash`, so a bare path is normalised by Next with a 308 BEFORE middleware
   * runs and only the slashed form reaches the redirect map. Asserting the bare path
   * therefore tests the normaliser rather than this map, and fails for a reason that has
   * nothing to do with what is being checked - which is exactly what the first version of
   * this section did, reporting a failure against a redirect that works.
   */
  const { res, error } = await get("/de/widerrufsrecht/");
  if (error) bad("could not fetch /de/widerrufsrecht/", error);
  else {
    const target = (res.headers.get("location") || "").replace(/^https?:\/\/[^/]+/, "");
    if (target === "/") ok("/de/widerrufsrecht/ resolves in one hop to /");
    else bad("/de/widerrufsrecht/ does not resolve to /", `HTTP ${res.status} -> ${target || "(no location)"}`);
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
  const page = await get("/checks/answer-first/");
  if (page.error) bad("could not fetch a rule page", page.error);
  else {
    const twin = page.body.match(
      /<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*href="([^"]+)"/i
    )?.[1];
    if (!twin) bad("the rule page does not declare a markdown alternate");
    else {
      ok("declared", twin);
      /*
       * The declared href is absolute, because metadataBase makes it so - which is
       * correct for the convention and means it cannot be concatenated onto `base`.
       * Taking the pathname and re-attaching it to the origin under test is what makes
       * this script check the deployment it was pointed at rather than whichever one
       * the page happens to name. The first version did `twin.replace(base, "")`, which
       * matched nothing against a local origin and produced
       * "http://localhost:3111https://...".
       */
      let path = twin;
      try {
        path = new URL(twin, base).pathname;
      } catch {
        /* not a URL; use it as a path */
      }
      const { res, body, error } = await get(path);
      if (error) bad("the declared twin is unreachable", error);
      else if (res.status !== 200) bad("the declared twin did not return 200", `HTTP ${res.status}`);
      else if (!(res.headers.get("content-type") || "").includes("text/markdown")) {
        bad("the twin is not served as markdown", res.headers.get("content-type") || "(none)");
      } else if (!/^#\s+\S/m.test(body)) bad("the twin has no markdown heading", "body may be HTML");
      else ok("the twin resolves as markdown", `${body.length} bytes`);
    }
  }
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
  else if (sitemap.includes("/checks/")) ok("the sitemap lists the rule pages");
  else bad("the sitemap does not mention /checks/");
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
