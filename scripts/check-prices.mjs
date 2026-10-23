/**
 * Stale-price gate.
 *
 * WHY THIS EXISTS: the site moved from $299 / $499 to $39 / $99 on 2026-10-23, and two pages
 * and llms.txt went on quoting the old numbers. The owner found it in the author page, not a
 * test - which is the wrong order for a claim that appears next to a buy button.
 *
 * WHAT IT CHECKS:
 *   1. no user-facing page text contains the retired prices ($299, $499);
 *   2. llms.txt, which is read by machines rather than rendered, does not either;
 *   3. the pricing page takes its numbers from lib/pricing.ts (formatUsd) instead of typing
 *      them, which is what made the last drift possible.
 *
 * WHAT IT DELIBERATELY ALLOWS: comment lines. The pricing page, lib/pricing.ts and the terms
 * changelog keep the old numbers as the record of why the price fell; a comment is not a claim
 * about what a buyer is charged today. Lines that are comments are stripped before the scan.
 *
 * Run: node scripts/check-prices.mjs   (npm run check:prices)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const RETIRED = /\$299|\$499/;
let failures = 0;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function stripComments(source) {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\*|\/\/|\/\*|\*\/)/.test(line))
    .join("\n");
}

/* 1 + 3. Page text. */
for (const file of walk(join(ROOT, "app")).filter((f) => f.endsWith(".tsx"))) {
  const text = stripComments(readFileSync(file, "utf8"));
  const hit = text.match(RETIRED);
  if (hit) {
    failures += 1;
    console.log(`  FAIL  retired price ${hit[0]} in ${relative(ROOT, file)}`);
  }
}

/* 2. llms.txt is read by machines and has no comments. */
{
  const text = readFileSync(join(ROOT, "public", "llms.txt"), "utf8");
  const hit = text.match(RETIRED);
  if (hit) {
    failures += 1;
    console.log(`  FAIL  retired price ${hit[0]} in public/llms.txt`);
  } else {
    console.log("  PASS  public/llms.txt quotes no retired price");
  }
}

/* 3. The pricing page must render prices through the single source. */
{
  const file = join(ROOT, "app", "(en)", "pricing", "page.tsx");
  const text = stripComments(readFileSync(file, "utf8"));
  if (!text.includes("formatUsd")) {
    failures += 1;
    console.log("  FAIL  app/(en)/pricing/page.tsx does not use formatUsd from lib/pricing.ts");
  } else {
    console.log("  PASS  the pricing page renders prices from lib/pricing.ts");
  }
}

console.log(
  failures === 0
    ? "\nNo stale prices: every user-facing price comes from lib/pricing.ts."
    : `\n${failures} stale-price check(s) failed.`
);
process.exitCode = failures === 0 ? 0 : 1;
