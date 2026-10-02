/**
 * Local sanity check for the scoring engine, run with:
 *   node scripts/test-analyze.mts
 *
 * This exists because `next build` only proves the code compiles. A runtime
 * throw inside analyze() would return HTTP 500 for every scan, so the three
 * cases below are exercised before anything is deployed.
 */
import { analyze, parseRobots } from "../lib/geo/analyze.ts";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "../lib/geo/catalog.ts";

/** Every check id the analyser produced during this run. */
const emittedCheckIds = new Set<string>();

function show(label: string, input: Parameters<typeof analyze>[0]) {
  try {
    const r = analyze(input);
    for (const c of r.checks) emittedCheckIds.add(c.id);
    console.log(`\n=== ${label} ===`);
    console.log(`score ${r.score} (${r.grade}) — ${r.gradeLabel}`);
    console.log(`checks ${r.checksPassed}/${r.checksRun} passed, ${r.issues.length} issues`);
    for (const d of r.dimensions) {
      console.log(`  ${d.label.padEnd(24)} ${String(d.score).padStart(3)}  (weight ${d.weight}%)`);
    }
    console.log(`  legacy metrics: ${JSON.stringify(r.metrics)}`);
    if (r.issues[0]) console.log(`  top issue: [${r.issues[0].severity}] ${r.issues[0].title}`);
  } catch (e) {
    console.log(`\n=== ${label} ===`);
    console.log(`CRASHED: ${(e as Error).message}`);
    console.log((e as Error).stack);
    process.exitCode = 1;
  }
}

const base = {
  domain: "example.com",
  // The scheme the fetch layer used. The HTTPS check reads this, so it is part
  // of every fixture rather than a constant inside the analyser.
  scheme: "https" as "https" | "http",
  homeStatus: 200,
  robotsText: null as string | null,
  llmsText: null as string | null,
  sitemapText: null as string | null,
  lastModifiedHeader: null as string | null,
};

/* 1. Empty / hostile input: must not crash. */
show("empty page, nothing else", { ...base, html: "" });
show("tiny junk page", { ...base, html: "<html><body>hi</body></html>", homeStatus: 404 });

/* 2. A deliberately well-optimised page. */
const goodHtml = `<!DOCTYPE html><html lang="en"><head>
<title>How to make AI search engines cite your website</title>
<meta name="description" content="A practical guide to making your site readable and citable by ChatGPT, Claude and Perplexity, with concrete rules you can apply today.">
<meta property="og:title" content="How to make AI search engines cite your website">
<link rel="canonical" href="https://example.com/">
<link rel="alternate" hreflang="en" href="https://example.com/">
<link rel="alternate" hreflang="de" href="https://example.com/de/">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
 {"@type":"Organization","@id":"https://example.com/#org","name":"Example","sameAs":["https://x.com/example"]},
 {"@type":"WebSite","@id":"https://example.com/#site","url":"https://example.com"},
 {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is GEO?","acceptedAnswer":{"@type":"Answer","text":"GEO is..."}}]},
 {"@type":"Article","dateModified":"2026-09-01","author":{"@type":"Person","name":"Jane Doe"}}
]}
</script></head>
<body><header><nav><a href="/about">About</a><a href="/contact">Contact</a></nav></header>
<main><article>
<h1>How to make AI search engines cite your website</h1>
<h2>What is Generative Engine Optimization?</h2>
<p>GEO is the practice of making a site readable and citable by AI search engines.</p>
<h2>How do I check whether AI crawlers can read my site?</h2>
<p>Start with robots.txt and confirm the AI agents are not disallowed.</p>
<h2>Why do statistics matter?</h2>
<p>Quantified claims are quoted far more often than assertions.</p>
<h2>How do I structure an answer?</h2>
<p>State the answer in the first sentence, then add detail.</p>
<blockquote>Expert quotation goes here, attributed to a named person.</blockquote>
<ul><li>First point</li><li>Second point</li></ul>
<table><tr><td>a</td><td>b</td></tr></table>
<p>In 2025, 67% of users used an assistant as their primary source, a 3.2x increase over 40% the year before. A further 115% gain was measured for low-ranking sites.</p>
<p>See the primary sources: <a href="https://arxiv.org/abs/2311.09735">KDD 2024</a> and <a href="https://web.dev/articles/vitals">web.dev</a>.</p>
<p>${"Additional explanatory detail about the method and its limits. ".repeat(90)}</p>
</article></main>
<footer>Last updated 2026</footer></body></html>`;

show("well-optimised page", {
  ...base,
  html: goodHtml,
  robotsText:
    "User-agent: GPTBot\nAllow: /\n\nUser-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n",
  llmsText:
    "# Example\n\n> A fact-rich one-line summary of what this site does.\n\n## Docs\n- [Guide](https://example.com/a)\n- [Reference](https://example.com/b)\n- [FAQ](https://example.com/c)\n",
  sitemapText: '<?xml version="1.0"?><urlset><url><loc>https://example.com/</loc></url></urlset>',
  lastModifiedHeader: new Date().toUTCString(),
});

/* 3. A site that actually disallows an AI crawler: exercises the blocked path. */
show("site that disallows GPTBot", {
  ...base,
  html: "<html><body><h1>Hello</h1><p>Some visible content that a crawler would like to read.</p></body></html>",
  robotsText: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n",
});

/* 4. robots.txt parser edge cases: the false positives we set out to fix. */
const parserCases: [string, string, boolean][] = [
  [
    "GPTBot mentioned but a DIFFERENT agent disallowed",
    "User-agent: SomeScraper\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /\n",
    false,
  ],
  ["GPTBot explicitly disallowed", "User-agent: GPTBot\nDisallow: /\n", true],
  ["wildcard disallow with no GPTBot group", "User-agent: *\nDisallow: /\n", true],
  // Google resolves conflicting rules of equal length in favour of the least
  // restrictive one, so an Allow of the same length as a Disallow is not a
  // block. The previous expectation here encoded "the last rule wins", which is
  // not the published spec - the parser and the catalog now both follow the
  // spec instead.
  ["equal-length Allow beats Disallow (least restrictive wins)", "User-agent: GPTBot\nAllow: /\nDisallow: /\n", false],
  ["comment mentioning GPTBot only", "# GPTBot is welcome\nUser-agent: *\nAllow: /\n", false],
  ["partial path disallow does not block root", "User-agent: GPTBot\nDisallow: /private/\n", false],
  // The two cases the parser used to get backwards. An empty Disallow is the
  // standard "allow everything" idiom and must not be read as a block; /* is a
  // full block and must not be missed.
  ["empty Disallow value means allow, not block", "User-agent: *\nDisallow:\n", false],
  ["wildcard /* disallow IS a full block", "User-agent: *\nDisallow: /*\n", true],
  ["explicit Allow outranks a same-length Disallow", "User-agent: GPTBot\nDisallow: /\nAllow: /\n", false],
];

console.log("\n=== robots.txt parser ===");
for (const [label, text, expected] of parserCases) {
  const got = parseRobots(text).blocked.includes("gptbot");
  const ok = got === expected;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} (expected ${expected}, got ${got})`);
  if (!ok) process.exitCode = 1;
}

/* 4. Drift guard: the published method at /methodology must describe the rules
      the analyser actually runs. This is the whole reason the catalog is data
      rather than prose. */
console.log("\n=== methodology catalog coverage ===");

const documented = new Set(CHECK_CATALOG.map((c) => c.id));
const undocumented = [...emittedCheckIds].filter((id) => !documented.has(id));
if (undocumented.length === 0) {
  console.log(
    `  PASS  all ${emittedCheckIds.size} emitted checks are documented in lib/geo/catalog.ts`
  );
} else {
  console.log(`  FAIL  ${undocumented.length} emitted check(s) missing from the catalog:`);
  for (const id of undocumented) console.log(`        - ${id}`);
  process.exitCode = 1;
}

const dimensionIds = new Set(DIMENSION_CATALOG.map((d) => d.id));
const orphans = CHECK_CATALOG.filter((c) => !dimensionIds.has(c.dimension));
if (orphans.length === 0) {
  console.log(`  PASS  all ${CHECK_CATALOG.length} catalog checks map to a known dimension`);
} else {
  console.log("  FAIL  catalog checks referencing an unknown dimension:");
  for (const c of orphans) console.log(`        - ${c.id} -> ${c.dimension}`);
  process.exitCode = 1;
}

const totalWeight = DIMENSION_CATALOG.reduce((s, d) => s + d.weight, 0);
if (totalWeight === 100) {
  console.log("  PASS  published dimension weights sum to 100");
} else {
  console.log(`  FAIL  published dimension weights sum to ${totalWeight}, expected 100`);
  process.exitCode = 1;
}

const unexercised = CHECK_CATALOG.filter((c) => !emittedCheckIds.has(c.id));
if (unexercised.length === 0) {
  console.log(`  PASS  the fixtures exercised all ${CHECK_CATALOG.length} catalog checks`);
} else {
  console.log(
    `  FAIL  only ${emittedCheckIds.size}/${CHECK_CATALOG.length} catalog checks were exercised:`
  );
  for (const c of unexercised) console.log(`        - ${c.id}`);
  process.exitCode = 1;
}

/* 5. A single-language site must not pass the multilingual check just because it
      declares a default. This is the measurement error the project exists to
      avoid, so it is pinned down explicitly. */
console.log("\n=== single-language hreflang guard ===");
{
  const single = analyze({
    ...base,
    html: `<html lang="en"><head><link rel="alternate" hreflang="en" href="https://example.com/"><link rel="alternate" hreflang="x-default" href="https://example.com/"></head><body><h1>Only English here</h1></body></html>`,
  });
  const status = single.checks.find((c) => c.id === "hreflang")?.status;
  const ok = status === "fail";
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  en + x-default alone does NOT satisfy the hreflang check (got "${status}")`
  );
  if (!ok) process.exitCode = 1;
}
