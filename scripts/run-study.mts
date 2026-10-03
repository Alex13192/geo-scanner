#!/usr/bin/env node
/**
 * Re-run the published study over the same 30 homepages, against the live API, and
 * print the rows in a shape that can be pasted straight into app/(en)/study/page.tsx.
 *
 *   npm run study:run              # all 30
 *   npm run study:run -- --limit=3 # smoke-test the plumbing without the 2-minute run
 *
 * WHY THIS IS IN THE REPOSITORY:
 * the study page invites the reader to reproduce every row, and the rows cannot be
 * reproduced from this repository without the script that produced them. They were
 * collected with a throwaway file outside the tree, so re-running the study meant
 * rewriting the collection step from memory each time - which is how a published
 * dataset quietly stops matching its own method.
 *
 * WHY IT HAD TO BE RE-RUN AT LEAST ONCE:
 * the `blocked` column changed meaning. It used to be "robots.txt disallows an AI
 * agent"; it now also fires when the server refuses a crawler-shaped request while
 * serving a browser-shaped one. Rows computed under the old definition no longer
 * reproduce, which is the one thing a page like this cannot afford.
 *
 * PACING IS PART OF THE METHOD, NOT POLITENESS:
 * roughly 4s between requests. lib/net/rate-limit.ts allows 20 per 60s per isolate,
 * and staying well under it keeps a 429 from being recorded as a finding about the
 * site - which would corrupt the data rather than merely slow it down.
 *
 * The origin comes from lib/site.ts rather than being written out here, because
 * scripts/check-values.mjs requires the origin to be declared in exactly one place and
 * rejects a second copy wherever it appears.
 */
import { SITE_URL } from "../lib/site.ts";

const BASE = `${SITE_URL}/api/scan?brief=1&domain=`;
const GAP_MS = 4000;

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

/** Same categories as the published page, so the diff stays about the numbers. */
const SAMPLE: [string, string][] = [
  ["salesforce.com", "Enterprise software"],
  ["siemens.com", "Industry"],
  ["vercel.com", "Developer platform"],
  ["cloudflare.com", "Infrastructure"],
  ["stripe.com", "Payments"],
  ["shopify.com", "Commerce"],
  ["apple.com", "Consumer hardware"],
  ["developer.mozilla.org", "Documentation"],
  ["bbc.com", "News"],
  ["anthropic.com", "AI lab"],
  ["notion.so", "Software"],
  ["figma.com", "Design software"],
  ["nvidia.com", "Semiconductors"],
  ["github.com", "Developer platform"],
  ["spiegel.de", "News"],
  ["openai.com", "AI lab"],
  ["telekom.com", "Telecoms"],
  ["bahn.de", "Transport"],
  ["theguardian.com", "News"],
  ["microsoft.com", "Enterprise software"],
  ["wikipedia.org", "Reference"],
  ["sap.com", "Enterprise software"],
  ["google.com", "Search"],
  ["zeit.de", "News"],
  ["perplexity.ai", "AI search"],
  ["stackoverflow.com", "Developer Q&A"],
  ["amazon.com", "Commerce"],
  ["nytimes.com", "News"],
  ["reuters.com", "News"],
  ["bmw.com", "Automotive"],
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Row = {
  domain: string;
  category: string;
  failed?: boolean;
  httpStatus?: number;
  status?: number;
  browserStatus?: number | null;
  score?: number;
  grade?: string;
  blocked?: boolean;
  entity?: boolean;
  sameAs?: boolean;
  topIssue?: string | null;
};

async function scan(domain: string, attempt = 1): Promise<{ httpStatus: number; body: any }> {
  const res = await fetch(BASE + encodeURIComponent(domain), {
    headers: { "User-Agent": "study-rescan/1.0" },
  });
  const body = await res.json().catch(() => null);

  // The API's own token bucket answers 429 with {error, retryAfter}. Retrying is the
  // correct response: recording it would report our pacing as a site finding.
  if (res.status === 429 && attempt <= 3) {
    const wait = ((body && body.retryAfter) || 20) * 1000;
    process.stdout.write(`  ${domain}: 429, waiting ${wait / 1000}s\n`);
    await sleep(wait);
    return scan(domain, attempt + 1);
  }
  return { httpStatus: res.status, body };
}

const out: Row[] = [];

for (const [domain, category] of SAMPLE.slice(0, LIMIT === Infinity ? undefined : LIMIT)) {
  const { httpStatus, body } = await scan(domain);
  if (!body || typeof body.score !== "number") {
    process.stdout.write(
      `${domain.padEnd(24)} FAILED http=${httpStatus} body=${JSON.stringify(body)}\n`
    );
    out.push({ domain, category, failed: true, httpStatus });
  } else {
    const row: Row = {
      domain,
      category,
      status: body.status,
      browserStatus: body.browserStatus ?? null,
      score: body.score,
      grade: body.grade,
      blocked: body.aiCrawlersBlocked === true,
      entity: body.hasJsonLdEntity === true,
      sameAs: body.hasSameAs === true,
      topIssue: body.topIssue ?? null,
    };
    out.push(row);
    process.stdout.write(
      `${domain.padEnd(24)} ${String(row.status).padEnd(4)} browser=${String(row.browserStatus).padEnd(5)} ${String(row.score).padStart(3)} ${row.grade}  blocked=${row.blocked ? "Y" : "n"} entity=${row.entity ? "Y" : "n"} sameAs=${row.sameAs ? "Y" : "n"}\n`
    );
  }
  await sleep(GAP_MS);
}

/* ---------- summary + paste-ready output ---------- */

const ok = out.filter((r) => !r.failed);
const answered = ok.filter((r) => r.status === 200);
const blockedRows = ok.filter((r) => r.blocked);
// The sub-case the browser probe exists to identify: refused to a crawler, served to
// a browser. This is evidence about AI access, unlike a refusal of both shapes.
const refusedRows = ok.filter((r) => r.status !== 200 && r.browserStatus === 200);
const news = ok.filter((r) => r.category === "News");
const average = answered.length
  ? Math.round(answered.reduce((s, r) => s + (r.score ?? 0), 0) / answered.length)
  : 0;

console.log("\n================ SUMMARY ================");
if (LIMIT !== Infinity) {
  console.log(`NOTE: --limit=${LIMIT} was given, so this is a plumbing check and NOT a study.`);
  console.log("      Do not paste these rows into the study page.");
}
console.log(`scanned            : ${out.length}`);
console.log(`answered 200       : ${answered.length}`);
console.log(`average (of those) : ${average}`);
console.log(
  `grade counts       : A=${ok.filter((r) => r.grade === "A").length} B=${ok.filter((r) => r.grade === "B").length} C=${ok.filter((r) => r.grade === "C").length} D=${ok.filter((r) => r.grade === "D").length} F=${ok.filter((r) => r.grade === "F").length}`
);
console.log(
  `blocked (any means): ${blockedRows.length} -> ${blockedRows.map((r) => r.domain).join(", ")}`
);
console.log(
  `refused to crawler,\n served to browser: ${refusedRows.length} -> ${refusedRows.map((r) => r.domain).join(", ")}`
);
console.log(`news blocked       : ${news.filter((r) => r.blocked).length} of ${news.length}`);
console.log(`no entity markup   : ${ok.filter((r) => !r.entity).length} of ${ok.length}`);

console.log("\n================ PASTE-READY ROWS (sorted by score) ================");
for (const r of [...ok].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))) {
  console.log(
    `  { domain: "${r.domain}", status: ${r.status}, browserStatus: ${r.browserStatus === null ? "null" : r.browserStatus}, score: ${r.score}, grade: "${r.grade}", aborted: ${r.status !== 200}, blocked: ${r.blocked}, refused: ${r.status !== 200 && r.browserStatus === 200}, entity: ${r.entity}, sameAs: ${r.sameAs}, category: "${r.category}" },`
  );
}

console.log("\n================ RAW JSON ================");
console.log(JSON.stringify(out, null, 1));
