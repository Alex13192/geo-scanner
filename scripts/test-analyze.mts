/**
 * Local sanity check for the scoring engine, run with:
 *   node scripts/test-analyze.mts
 *
 * This exists because `next build` only proves the code compiles. A runtime
 * throw inside analyze() would return HTTP 500 for every scan, so the three
 * cases below are exercised before anything is deployed.
 */
import { analyze, parseRobots, detectPageType, NA_BY_PAGE_TYPE } from "../lib/geo/analyze.ts";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { CHECK_COPY } from "../lib/geo/check-copy.ts";
import {
  renderedTitle,
  renderedDescription,
  TITLE_RANGE,
  DESCRIPTION_RANGE,
} from "../lib/geo/check-meta.ts";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "../lib/geo/catalog.ts";
import { inspectTarget } from "../lib/net/fetch-safe.ts";

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

/* 4b. Page-type exemptions.
      A typo in NA_BY_PAGE_TYPE would be a silent no-op - the check would simply
      keep applying and nothing would say so - so the table is verified against the
      catalogue rather than trusted. */
console.log("\n=== page-type exemptions ===");
{
  const VALID_PAGE_TYPES = ["homepage", "docs", "article", "legal", "contact", "general"];
  const catalogIds = new Set(CHECK_CATALOG.map((c) => c.id));

  const problems: string[] = [];
  for (const [id, types] of Object.entries(NA_BY_PAGE_TYPE)) {
    if (!catalogIds.has(id)) {
      problems.push(`NA_BY_PAGE_TYPE names "${id}", which is not a check in the catalogue`);
    }
    for (const t of types) {
      if (!VALID_PAGE_TYPES.includes(t)) {
        problems.push(`NA_BY_PAGE_TYPE["${id}"] has an unknown page type "${t}"`);
      }
    }
    if (types.includes("homepage")) {
      problems.push(
        `NA_BY_PAGE_TYPE excludes "${id}" from homepages, which would move live scores`
      );
    }
  }
  if (problems.length === 0) {
    console.log(
      `  PASS  ${Object.keys(NA_BY_PAGE_TYPE).length} exemption(s), every one naming a real check`
    );
  } else {
    for (const p of problems) console.log(`  FAIL  ${p}`);
    process.exitCode = 1;
  }

  const probes: Array<[string, string, string]> = [
    ["/", "", "homepage"],
    ["", "", "homepage"],
    ["/privacy/", "", "legal"],
    ["/terms-of-service", "", "legal"],
    ["/contact/", "", "contact"],
    ["/docs/allow-ai-crawlers/", "", "docs"],
    ["/blog/hello", '"@type": "BlogPosting"', "article"],
    ["/somewhere/else", "", "general"],
  ];
  for (const [path, html, expected] of probes) {
    const got = detectPageType(path, html);
    const ok = got === expected;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${path || "(no path)"} -> ${got}`);
    if (!ok) process.exitCode = 1;
  }

  // The regression guard that matters: a root request must be scored exactly as it
  // was before page types existed.
  const noPath = analyze({ ...base, html: goodHtml });
  const rootPath = analyze({ ...base, html: goodHtml, path: "/" });
  const unchanged = noPath.score === rootPath.score && rootPath.checksNotApplicable === 0;
  console.log(
    `  ${unchanged ? "PASS" : "FAIL"}  a root path leaves the score untouched ` +
      `(${noPath.score} vs ${rootPath.score}, ${rootPath.checksNotApplicable} excluded)`
  );
  if (!unchanged) process.exitCode = 1;

  // And a page the exemptions do cover must drop those checks from the fraction
  // and never list them as issues.
  const expectedNa = Object.keys(NA_BY_PAGE_TYPE).filter(
    (id) => emittedCheckIds.has(id) && NA_BY_PAGE_TYPE[id].includes("legal")
  ).length;
  const legal = analyze({ ...base, html: goodHtml, path: "/privacy/" });
  const leaked = legal.issues.filter((i) => NA_BY_PAGE_TYPE[i.id]?.includes("legal"));
  const legalOk = legal.checksNotApplicable === expectedNa && leaked.length === 0;
  console.log(
    `  ${legalOk ? "PASS" : "FAIL"}  a legal page excludes ${legal.checksNotApplicable}/${expectedNa} ` +
      `and reports ${leaked.length} of them as issues`
  );
  if (!legalOk) process.exitCode = 1;
}

/* 4c. Generated check copy.
      /checks/<id>/ renders its title and fix from lib/geo/check-copy.ts, which is
      generated from the analyser rather than written by hand. This asserts the
      generated file keeps up with the catalogue: without it, a new check would
      produce a page with no heading and no fix, and nothing would say so. */
console.log("\n=== generated check copy ===");
{
  const runnable = CHECK_CATALOG.filter((c) => !c.alias);
  const noTitle = runnable.filter((c) => !CHECK_COPY[c.id]?.title);
  const noFix = runnable.filter((c) => (CHECK_COPY[c.id]?.fixes.length ?? 0) === 0);

  if (noTitle.length === 0) {
    console.log(`  PASS  all ${runnable.length} catalogued checks have a generated title`);
  } else {
    console.log(`  FAIL  ${noTitle.length} check(s) have no generated title:`);
    for (const c of noTitle) console.log(`        - ${c.id}`);
    console.log("        run: npm run generate:copy");
    process.exitCode = 1;
  }

  if (noFix.length === 0) {
    console.log("  PASS  every one of them also has fix text");
  } else {
    console.log(
      `  FAIL  ${noFix.length} check(s) have no fix text, so /checks/<id>/ would be half a page:`
    );
    for (const c of noFix) console.log(`        - ${c.id}`);
    console.log(
      "        if a check genuinely cannot fail, relax this guard deliberately rather than"
    );
    console.log("        shipping the page without one");
    process.exitCode = 1;
  }
}


/* 4d. The check pages must satisfy the ranges this site publishes.
      This is the self-consistency rule the project is built on: the scanner scores
      other people's titles at 15-65 characters and descriptions at 50-160, so the
      38 pages it generates for itself have to land in the same windows. The first
      version did not, and the two reasons are both invisible in the source - a
      layout suffix and HTML escaping - which is why the assertion measures what is
      rendered rather than what was written. */
console.log("\n=== check page meta ranges ===");
{
  const runnable = CHECK_CATALOG.filter((c) => !c.alias);
  const violations: string[] = [];
  let minTitle = Infinity;
  let maxTitle = 0;
  let minDesc = Infinity;
  let maxDesc = 0;

  for (const check of runnable) {
    const title = renderedTitle(check.id);
    const desc = renderedDescription(check.id);
    minTitle = Math.min(minTitle, title.length);
    maxTitle = Math.max(maxTitle, title.length);
    minDesc = Math.min(minDesc, desc.length);
    maxDesc = Math.max(maxDesc, desc.length);

    if (title.length < TITLE_RANGE.min || title.length > TITLE_RANGE.max) {
      violations.push(`title ${title.length} for ${check.id} (want ${TITLE_RANGE.min}-${TITLE_RANGE.max})`);
    }
    if (desc.length < DESCRIPTION_RANGE.min || desc.length > DESCRIPTION_RANGE.max) {
      violations.push(`description ${desc.length} for ${check.id} (want ${DESCRIPTION_RANGE.min}-${DESCRIPTION_RANGE.max})`);
    }
  }

  if (violations.length === 0) {
    console.log(
      `  PASS  all ${runnable.length} rendered titles in ${TITLE_RANGE.min}-${TITLE_RANGE.max} (${minTitle}-${maxTitle}) ` +
        `and descriptions in ${DESCRIPTION_RANGE.min}-${DESCRIPTION_RANGE.max} (${minDesc}-${maxDesc})`
    );
  } else {
    console.log(`  FAIL  ${violations.length} check page(s) outside the published ranges:`);
    for (const v of violations) console.log(`        - ${v}`);
    process.exitCode = 1;
  }

  // Near-duplicate descriptions across a generated page family are the tell that the
  // family was produced without anything to say, so they are counted rather than
  // assumed away.
  const descriptions = runnable.map((c) => renderedDescription(c.id));
  const unique = new Set(descriptions).size;
  if (unique === descriptions.length) {
    console.log(`  PASS  all ${unique} descriptions are distinct`);
  } else {
    console.log(`  FAIL  only ${unique}/${descriptions.length} descriptions are distinct`);
    process.exitCode = 1;
  }
}

/* 4e. Every count the site states about itself must match the catalogue.
      Adding two checks changed a number this site asserts in a dozen places, and a
      search for it used a pattern too narrow to find them - so the prose kept saying 38
      while the method said 40. That is the exact drift this project exists to catch in
      other people's tools, and it is cheap to make impossible here: read the source,
      find every "N checks", and require N to be the catalogue's own count. */
console.log("\n=== published check count stated in the source ===");
{
  const runnable = CHECK_CATALOG.filter((c) => !c.alias).length;

  /*
   * The study was collected under the 38-check model, and its prose describes that run
   * rather than the current scanner, so it is the one place a different number is
   * correct. Listed explicitly rather than skipped by a pattern, so a second exception
   * cannot hide behind it. (The raw JSON snapshot on the same page says
   * "checksRun":38, which this pattern cannot match because the word precedes the
   * number - it is historical data and should stay as it is.)
   */
  const HISTORICAL = ["38 documented checks were run over the result."];

  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
    }
  };
  walk(join(process.cwd(), "app"));

  const wrong: string[] = [];
  let found = 0;
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const match of line.matchAll(/\b(\d+)\s+(?:published\s+|documented\s+|runnable\s+)?checks\b/g)) {
        if (HISTORICAL.some((h) => line.includes(h))) continue;
        found += 1;
        if (Number(match[1]) !== runnable) {
          wrong.push(
            `${relative(process.cwd(), file)}:${index + 1} says ${match[1]} checks, the catalogue has ${runnable}`
          );
        }
      }
    }
  }

  // A guard that finds nothing is not a passing guard, it is a broken regex.
  if (found < 5) {
    console.log(`  FAIL  only ${found} stated counts found; the pattern is probably wrong`);
    process.exitCode = 1;
  } else if (wrong.length === 0) {
    console.log(`  PASS  all ${found} stated counts agree with the catalogue (${runnable})`);
  } else {
    console.log(`  FAIL  ${wrong.length} stated count(s) disagree with the catalogue:`);
    for (const w of wrong) console.log(`        - ${w}`);
    process.exitCode = 1;
  }
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

/* 6. Measurement guards. Each of these pins a check that used to award points
      for input which did not satisfy the published rule. They are the specific
      errors an adversarial read of the engine turned up, and without a test
      each one would come back the next time somebody "simplified" a regex. */
console.log("\n=== measurement guards ===");

const guards: Array<[string, string, string, "pass" | "fail", Record<string, unknown>?]> = [
  [
    "an empty JSON-LD object ({}) is not valid markup",
    `<html lang="en"><head><script type="application/ld+json">{}</script></head><body><h1>x</h1></body></html>`,
    "jsonld-valid",
    "fail",
  ],
  [
    "<table> inside a script string does not satisfy extractables",
    `<html lang="en"><body><h1>x</h1><script>var s = "<table><tr><td>";</script></body></html>`,
    "extractables",
    "fail",
  ],
  [
    "a bare four-digit year is not a quantified claim",
    `<html lang="en"><body><h1>x</h1><p>Copyright 2026. Model 2024. Reference 2025.</p></body></html>`,
    "statistics",
    "fail",
  ],
  [
    "an empty robots.txt is not a served robots.txt",
    `<html lang="en"><body><h1>x</h1></body></html>`,
    "robots-present",
    "fail",
    { robotsText: "   \n  " },
  ],
  [
    "an empty author value does not satisfy the author check",
    `<html lang="en"><head><script type="application/ld+json">{"@context":"https://schema.org","author":""}</script></head><body><h1>x</h1></body></html>`,
    "author",
    "fail",
  ],
  [
    "a bare lang without a region does not satisfy lang-region",
    `<html lang="en"><body><h1>x</h1></body></html>`,
    "lang-region",
    "fail",
  ],
  [
    "og:locale with a region does satisfy lang-region",
    `<html lang="en"><head><meta property="og:locale" content="en_GB"></head><body><h1>x</h1></body></html>`,
    "lang-region",
    "pass",
  ],
];

for (const [label, html, id, expected, extra] of guards) {
  let got = "crashed";
  try {
    const result = analyze({ ...base, html, ...(extra ?? {}) } as Parameters<typeof analyze>[0]);
    got = result.checks.find((c) => c.id === id)?.status ?? "not-run";
  } catch (e) {
    console.log(`  FAIL  ${label} threw: ${(e as Error).message}`);
    process.exitCode = 1;
    continue;
  }
  const ok = got === expected;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} (expected ${expected}, got ${got})`);
  if (!ok) process.exitCode = 1;
}

/* 7. Fetch guard. Both endpoints take a hostname straight from the query string
      and fetch it, which makes them an open fetch proxy. These are the targets
      that must never reach fetch, and the ordinary domains that still must. */
console.log("\n=== fetch guard ===");

const guardCases: Array<[string, boolean]> = [
  ["https://example.com", true],
  ["https://www.example.com/path?q=1", true],
  ["https://sub.domain.co.uk", true],
  ["http://example.com", true],
  // Wildcard-DNS services turn the hostname itself into an address.
  ["https://127.0.0.1.nip.io", false],
  ["https://10-0-0-1.sslip.io", false],
  ["https://192.168.1.1.xip.io", false],
  // Names that point inside a network.
  ["https://localhost", false],
  ["https://printer.local", false],
  ["https://intranet", false],
  // Addresses, including the cloud metadata endpoint.
  ["https://127.0.0.1", false],
  ["https://169.254.169.254", false],
  ["https://[::1]", false],
  // Schemes and strings that are not a website.
  ["ftp://example.com", false],
  ["file:///etc/passwd", false],
  ["not a url", false],
];

for (const [url, expected] of guardCases) {
  const got = inspectTarget(url).ok;
  const ok = got === expected;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${expected ? "accepts" : "refuses"}  ${url}`);
  if (!ok) process.exitCode = 1;
}
