/**
 * The site scan's own suite, run with:
 *   node scripts/test-site-scan.mts
 *
 * WHY THIS EXISTS. `?scope=site` is the one addition to the public scan route that can
 * change what a caller receives, and every way it can go wrong is quiet:
 *
 *   - the homepage could be counted twice in the average, making a site score that
 *     describes one page and claims to describe four;
 *   - a sitemap is a list of everything a crawler may read, so an image or a PDF
 *     scored as a page would produce a real-looking number for a question nobody asked;
 *   - five budget slots spent on five posts under /blog/ would report the blog and call
 *     it the site;
 *   - and the frequency list is the site block's headline claim ("this problem is not a
 *     page problem"), so counting a page's own issue twice, or keeping the ones seen
 *     once, would inflate exactly the number it exists to be trusted for.
 *
 * None of those raise an error anywhere. They produce a plausible report, which is the
 * class of failure this repository's other suites exist to catch too.
 *
 * THE FETCH IS STUBBED, and the stub asserts on URLs rather than on call counts: the
 * thing worth pinning is WHICH pages a site scan decides to read, not how many times it
 * asked. Nothing here reaches the network.
 */
import {
  SITE_SCAN_MAX_PAGES,
  SITE_SCAN_PAGES_CEILING,
  isSitemapIndex,
  parseSiteScope,
  runScan,
  runSiteScan,
  sitemapLocs,
  sitemapPagePaths,
  type ScanOutcome,
} from "../lib/geo/scan.ts";

let failures = 0;
let passes = 0;
function check(ok: boolean, pass: string, fail: string) {
  if (ok) {
    passes++;
    console.log(`  PASS  ${pass}`);
  } else {
    failures++;
    console.log(`  FAIL  ${fail}`);
  }
}

/* ------------------------------------------------------------------ */
/* A stubbed network                                                   */
/* ------------------------------------------------------------------ */

type Route = { status?: number; body?: string };

const realFetch = globalThis.fetch;
let requests: string[] = [];

function stub(routes: Record<string, Route>) {
  requests = [];
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    requests.push(url);
    const hit = routes[url];
    if (!hit) return new Response("not found", { status: 404 });
    return new Response(hit.body ?? "", {
      status: hit.status ?? 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }) as typeof fetch;
}

function restore() {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = realFetch;
}

/** A bare page, so the analyser has real findings rather than an empty document. */
function page(title: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<meta name="description" content="${title} description"></head>
<body><h1>${title}</h1><p>${title} body copy, long enough to be counted as words by the analyser.</p></body></html>`;
}

const ROBOTS = "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml";

/** A sitemap of the given same-site paths, plus whatever extra locs a case needs. */
function urlset(paths: string[], extra: string[] = []): string {
  const locs = [...paths.map((p) => `https://example.com${p}`), ...extra]
    .map((loc) => `  <url><loc>${loc}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs}\n</urlset>`;
}

/** Every fetch a homepage-only scan makes, for a site that serves `robots` and `sitemap`. */
function baseRoutes(sitemap: string): Record<string, Route> {
  return {
    "https://example.com/": { body: page("Home") },
    "https://example.com/robots.txt": { body: ROBOTS },
    "https://example.com/llms.txt": { status: 404 },
    "https://example.com/sitemap.xml": { body: sitemap },
  };
}

async function site(sitemap: string, subPages: string[], maxPages?: number) {
  const routes = baseRoutes(sitemap);
  for (const p of subPages) routes[`https://example.com${p}`] = { body: page(p) };
  stub(routes);
  try {
    const home = await runScan("example.com");
    if (!home.reachable) throw new Error("stub did not produce a reachable homepage");
    return await runSiteScan("example.com", home as Extract<ScanOutcome, { reachable: true }>, {
      maxPages,
    });
  } finally {
    restore();
  }
}

/* ------------------------------------------------------------------ */
/* Sitemap reading                                                     */
/* ------------------------------------------------------------------ */

console.log("=== sitemap reading ===");

{
  const locs = sitemapLocs(
    `<urlset><url><loc>  https://example.com/a  </loc></url>` +
      `<url><loc>https://example.com/b?x=1&amp;y=2</loc></url></urlset>`,
  );
  check(
    locs.length === 2 && locs[0] === "https://example.com/a",
    "loc values are trimmed",
    `expected two trimmed locs, got ${JSON.stringify(locs)}`,
  );
  // &amp; in a query string is the common case, and an un-unescaped one makes the URL
  // parse into a path that does not exist.
  check(
    locs[1] === "https://example.com/b?x=1&y=2",
    "&amp; is unescaped",
    `expected "&" in the query string, got ${locs[1]}`,
  );
}

check(
  isSitemapIndex(`<sitemapindex><sitemap><loc>https://example.com/s.xml</loc></sitemap></sitemapindex>`),
  "a sitemap index is recognised",
  "a sitemapindex was not recognised as an index",
);
check(
  !isSitemapIndex(urlset(["/a"])),
  "a urlset is not an index",
  "a plain urlset was mistaken for a sitemap index",
);

/* ------------------------------------------------------------------ */
/* Page selection                                                      */
/* ------------------------------------------------------------------ */

console.log("\n=== page selection ===");

{
  const { paths, considered } = sitemapPagePaths(
    urlset(["/a", "/b"], ["https://elsewhere.example.org/foreign", "https://example.com/"]),
    "example.com",
    5,
  );
  check(
    paths.join(",") === "/a,/b",
    "off-site URLs and the homepage are dropped",
    `expected only /a and /b, got ${JSON.stringify(paths)}`,
  );
  check(
    considered === 2,
    "the considered count excludes off-site and homepage entries",
    `expected considered=2, got ${considered}`,
  );
}

{
  // A sitemap is a list of everything a crawler may read. Scoring a PDF as a page
  // produces a real number for a question nobody asked.
  const { paths } = sitemapPagePaths(
    urlset(["/guide.pdf", "/logo.png", "/feed.xml", "/app.js", "/real-page"]),
    "example.com",
    5,
  );
  check(
    paths.join(",") === "/real-page",
    "non-page assets are excluded",
    `expected only /real-page, got ${JSON.stringify(paths)}`,
  );
}

{
  const { paths } = sitemapPagePaths(urlset(["/about", "/about/"]), "example.com", 5);
  check(
    paths.length === 1,
    "a trailing slash does not make a second page",
    `expected /about once, got ${JSON.stringify(paths)}`,
  );
}

{
  // The rule under test: one page per top-level section first. Five budget slots spent
  // on five posts under /blog/ would report a site's blog and call it the site.
  const { paths } = sitemapPagePaths(
    urlset(["/blog/a", "/blog/b", "/blog/c", "/docs/x", "/pricing"]),
    "example.com",
    3,
  );
  check(
    paths.join(",") === "/blog/a,/docs/x,/pricing",
    "the first page of each section is taken before a second page of any section",
    `expected /blog/a,/docs/x,/pricing, got ${JSON.stringify(paths)}`,
  );
}

{
  const { paths } = sitemapPagePaths(urlset(["/blog/a", "/blog/b"]), "example.com", 3);
  check(
    paths.join(",") === "/blog/a,/blog/b",
    "a spare slot goes to the next page the sitemap names",
    `expected /blog/a,/blog/b, got ${JSON.stringify(paths)}`,
  );
}

{
  const { paths } = sitemapPagePaths(urlset(["/a", "/b", "/c"]), "example.com", 2);
  check(
    paths.length === 2,
    "the limit is respected",
    `expected 2 paths, got ${JSON.stringify(paths)}`,
  );
}

{
  // Determinism is the property a comparison between two scans of one site rests on.
  const xml = urlset(["/blog/a", "/blog/b", "/docs/x", "/pricing", "/about"]);
  const first = sitemapPagePaths(xml, "example.com", 4).paths.join(",");
  const second = sitemapPagePaths(xml, "example.com", 4).paths.join(",");
  check(
    first === second,
    "the same sitemap always selects the same pages",
    `selection is not deterministic: ${first} then ${second}`,
  );
}

/* ------------------------------------------------------------------ */
/* Reading the request off the query string                             */
/* ------------------------------------------------------------------ */

console.log("\n=== parseSiteScope ===");

{
  // THE REGRESSION. `Number(null)` is 0, and 0 reached the clamp as "one page", so a
  // bare `?scope=site` scored the homepage plus one page instead of the default five -
  // a well-formed response describing the wrong sample. Absent must mean "default".
  const bare = parseSiteScope("site", null);
  check(
    bare.wanted === true && bare.maxPages === undefined,
    "a bare scope=site leaves the budget to the default",
    `expected wanted=true and maxPages=undefined, got ${JSON.stringify(bare)}`,
  );
  // The other half of the same bug: an empty parameter is a caller asking for the
  // default, not for zero.
  const empty = parseSiteScope("site", "");
  check(
    empty.maxPages === undefined,
    "an empty pages= is not zero pages",
    `expected maxPages=undefined, got ${JSON.stringify(empty)}`,
  );
  check(
    parseSiteScope("site", "   ").maxPages === undefined,
    "a whitespace pages= is not zero pages",
    "a whitespace page count was read as a number",
  );
}

check(
  parseSiteScope(null, "3").wanted === true && parseSiteScope(null, "3").maxPages === 3,
  "pages=N alone asks for a site scan",
  "pages=3 did not request a site scan",
);
check(
  parseSiteScope(null, null).wanted === false,
  "no parameters means no site scan",
  "an unparameterised request asked for a site scan",
);
check(
  parseSiteScope("SITE", null).wanted === true,
  "the scope value is case-insensitive",
  "SCOPE=SITE was not recognised",
);
// A budget of zero is not a request for a site scan; `wanted` would otherwise be true
// with a clamp of one page, which is the bug above wearing a different hat.
check(
  parseSiteScope(null, "0").wanted === false,
  "pages=0 does not request a site scan",
  "pages=0 was treated as a site scan request",
);
check(
  parseSiteScope(null, "abc").wanted === false,
  "a non-numeric pages= does not request a site scan",
  "pages=abc was treated as a site scan request",
);

/* ------------------------------------------------------------------ */
/* runSiteScan                                                         */
/* ------------------------------------------------------------------ */

console.log("\n=== runSiteScan ===");

{
  const site_ = await site(urlset(["/alpha", "/bravo", "/charlie"]), ["/alpha", "/bravo", "/charlie"]);
  check(
    site_.pagesScanned === 4,
    "the homepage plus three sitemap pages are scored",
    `expected 4 pages, got ${site_.pagesScanned}`,
  );
  check(
    site_.pages.length === site_.pagesScanned,
    "pagesScanned agrees with the pages array",
    `pagesScanned=${site_.pagesScanned} but pages.length=${site_.pages.length}`,
  );
  check(
    site_.pages[0].path === "/",
    "the homepage is the first page",
    `expected the homepage first, got ${site_.pages[0].path}`,
  );
  check(
    new Set(site_.pages.map((p) => p.url)).size === site_.pages.length,
    "no page is scored twice",
    "the same URL appears more than once in the pages array",
  );

  // THE ONE THAT MATTERS FOR THE HEADLINE NUMBER. The homepage is in the list once, so
  // it is in the average once; a site score that silently weighed the homepage twice
  // would describe one page and claim to describe four.
  const mean = Math.round(
    site_.pages.reduce((sum, p) => sum + p.score, 0) / site_.pages.length,
  );
  check(
    site_.siteScore === mean,
    `siteScore is the mean of every scored page (${site_.siteScore})`,
    `siteScore=${site_.siteScore} but the mean of the pages is ${mean}`,
  );

  check(
    site_.weakestPage !== null &&
      site_.strongestPage !== null &&
      site_.weakestPage.score <= site_.strongestPage.score,
    "weakest and strongest bracket the scored pages",
    "weakest/strongest are missing or inverted",
  );

  // The filter is the site block's whole claim: a problem on one page is already in that
  // page's own issue list, and re-listing it here would pad the payload with what the
  // caller has.
  check(
    site_.issueFrequency.every((entry) => entry.pagesAffected > 1),
    "only issues seen on more than one page are listed",
    `a single-page issue survived the filter: ${JSON.stringify(
      site_.issueFrequency.filter((e) => e.pagesAffected <= 1),
    )}`,
  );
  check(
    site_.issueFrequency.every((entry) => entry.pagesAffected <= site_.pagesScanned),
    "no issue claims more pages than were scanned",
    "an issue claims to affect more pages than were scanned",
  );
  check(
    site_.issueFrequency.every(
      (entry, i) =>
        i === 0 || site_.issueFrequency[i - 1].pagesAffected >= entry.pagesAffected,
    ),
    "the frequency list is most widespread first",
    "the frequency list is not sorted by pagesAffected",
  );
  // Not vacuous: every page in this fixture is served the identical document, so a
  // filter that kept nothing would mean the filter is wrong, not that the site is clean.
  check(
    site_.issueFrequency.length > 0,
    `repeated issues are actually reported (${site_.issueFrequency.length})`,
    "identical pages produced no repeated issues - the frequency rule is dropping everything",
  );
  check(
    site_.note === null,
    "a full site scan carries no note",
    `expected note=null, got ${JSON.stringify(site_.note)}`,
  );
  // A caller acting on a site-wide problem cannot look the fix up: the per-page issue
  // lists are not in this response, and a page that had the issue may not be the
  // homepage. The fix travels with the frequency entry for that reason.
  check(
    site_.issueFrequency.every((entry) => typeof entry.recommendation === "string"),
    "every repeated issue carries its fix",
    "a repeated issue was reported without a recommendation",
  );
  check(
    site_.issueFrequency.some((entry) => entry.recommendation.length > 0),
    "the fixes are the analyser's own text, not empty strings",
    "every recommendation came back empty",
  );
}

{
  // No sitemap at all: one page was read and the response has to say why rather than
  // report a site score as though it described a site.
  const routes = {
    "https://example.com/": { body: page("Home") },
    "https://example.com/robots.txt": { body: "User-agent: *\nAllow: /\n" },
    "https://example.com/llms.txt": { status: 404 },
    "https://example.com/sitemap.xml": { status: 404 },
  };
  stub(routes);
  let site_;
  try {
    const home = await runScan("example.com");
    site_ = await runSiteScan("example.com", home as Extract<ScanOutcome, { reachable: true }>);
  } finally {
    restore();
  }
  check(
    site_.pagesScanned === 1 && site_.pagesConsidered === 0,
    "without a sitemap only the homepage is scored",
    `expected 1 page and 0 considered, got ${site_.pagesScanned} and ${site_.pagesConsidered}`,
  );
  check(
    typeof site_.note === "string" && site_.note.length > 0,
    "the missing sitemap is explained",
    "a homepage-only site scan carried no note explaining why",
  );
  check(
    site_.issueFrequency.length === 0,
    "one page cannot produce a repeated issue",
    "a single-page scan reported cross-page frequencies",
  );
  check(
    site_.siteScore === site_.pages[0].score,
    "the site score falls back to the homepage score",
    `expected the homepage score, got ${site_.siteScore}`,
  );
  check(
    site_.weakestPage === null && site_.strongestPage === null,
    "weakest and strongest are absent when there is nothing to compare",
    "a single-page scan named a weakest or strongest page",
  );
}

{
  // A sitemap index is what a large site publishes, and following it is the difference
  // between scoring one extra page and scoring none.
  const routes: Record<string, Route> = {
    "https://example.com/": { body: page("Home") },
    "https://example.com/robots.txt": { body: ROBOTS },
    "https://example.com/llms.txt": { status: 404 },
    "https://example.com/sitemap.xml": {
      body:
        `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
        `<sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>` +
        `</sitemapindex>`,
    },
    "https://example.com/sitemap-pages.xml": { body: urlset(["/deep-one", "/deep-two"]) },
    "https://example.com/deep-one": { body: page("Deep one") },
    "https://example.com/deep-two": { body: page("Deep two") },
  };
  stub(routes);
  let site_;
  try {
    const home = await runScan("example.com");
    site_ = await runSiteScan("example.com", home as Extract<ScanOutcome, { reachable: true }>);
  } finally {
    restore();
  }
  check(
    site_.pagesScanned === 3,
    "a sitemap index is followed one level",
    `expected the homepage plus two pages from the child sitemap, got ${site_.pagesScanned}`,
  );
  check(
    requests.includes("https://example.com/sitemap-pages.xml"),
    "the child sitemap is the one that was fetched",
    "the child sitemap named in the index was never requested",
  );
}

{
  const site_ = await site(urlset(["/one", "/two"]), ["/one", "/two"], 1);
  check(
    site_.maxPages === 1 && site_.pagesScanned === 2,
    "an explicit page count is honoured",
    `expected maxPages=1 and 2 pages scored, got ${site_.maxPages} and ${site_.pagesScanned}`,
  );
}

{
  // The caller is a stranger on a public endpoint. A crawl is a different product.
  const site_ = await site(urlset(["/one", "/two"]), ["/one", "/two"], 999);
  check(
    site_.maxPages === SITE_SCAN_PAGES_CEILING,
    `an absurd page count is clamped to the ceiling (${SITE_SCAN_PAGES_CEILING})`,
    `expected maxPages=${SITE_SCAN_PAGES_CEILING}, got ${site_.maxPages}`,
  );
}

{
  // NaN is what `Number(null)` and an empty `?pages=` both produce, and letting it reach
  // the cap turns "score pages" into "score nothing".
  const site_ = await site(urlset(["/one"]), ["/one"], Number.NaN);
  check(
    site_.maxPages === SITE_SCAN_MAX_PAGES && site_.pagesScanned === 2,
    "a non-numeric page count falls back to the default",
    `expected maxPages=${SITE_SCAN_MAX_PAGES} and 2 pages, got ${site_.maxPages} and ${site_.pagesScanned}`,
  );
}

{
  // A sub-page that 404s is a real finding about that URL, not a reason to lose the rest.
  const routes = baseRoutes(urlset(["/good", "/gone"]));
  routes["https://example.com/good"] = { body: page("Good") };
  routes["https://example.com/gone"] = { status: 500 };
  stub(routes);
  let site_;
  try {
    const home = await runScan("example.com");
    site_ = await runSiteScan("example.com", home as Extract<ScanOutcome, { reachable: true }>);
  } finally {
    restore();
  }
  check(
    site_.pagesScanned === 3,
    "an error page is still scored rather than dropped",
    `expected the homepage plus both pages, got ${site_.pagesScanned}`,
  );
  const gone = site_.pages.find((p) => p.path === "/gone");
  check(
    gone !== undefined && gone.status === 500,
    "the error page reports its own status",
    `expected /gone at status 500, got ${JSON.stringify(gone)}`,
  );
}

restore();
console.log(`\n${failures === 0 ? "OK" : "FAILED"} — ${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
