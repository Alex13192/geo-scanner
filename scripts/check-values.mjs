#!/usr/bin/env node
/**
 * Guards the values that are supposed to be declared exactly once, in lib/site.ts:
 * the canonical origin and the public contact address.
 *
 * WHY THIS IS A SCRIPT AND NOT A COMMENT: the "change the domain in ONE place"
 * claim was already written in a comment once, and it was false - the origin was
 * in three layouts, two API user-agent strings, a badge snippet and two static
 * files. Comments do not fail a build. This does. The contact address then
 * repeated the same story in six files, and a second address (hello@) was still
 * sitting in public/llms.txt after the first one had been consolidated.
 *
 * It checks the three failure modes that actually happen:
 *
 *   1. Nothing under app/ or lib/ may hardcode either value. Everything is
 *      supposed to import SITE_URL, SITE_HOST or CONTACT_EMAIL, so a literal
 *      here means a second source of truth has started.
 *
 *   2. public/robots.txt and public/llms.txt must agree with lib/site.ts. Those
 *      two cannot import anything, so they are what a change silently leaves
 *      behind - and a robots.txt `Sitemap:` line pointing at a domain you no
 *      longer own, or an llms.txt advertising a dead contact address, is worse
 *      than the line being absent, because both are instructions to a machine or
 *      a reader that will be followed.
 *
 *   3. public/ads.txt must name the same publisher as lib/ads.ts, for the same
 *      reason as 2 and with a sharper consequence. An ads.txt naming a publisher
 *      you no longer use is not a missing file, it is a false statement of who is
 *      authorised to sell your inventory, and ad systems act on it.
 *
 * Run: npm run check:values
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_MODULE = join("lib", "site.ts");

const read = (relPath) => readFileSync(join(ROOT, relPath), "utf8");

const siteSource = read(SITE_MODULE);
const declaredUrl = siteSource.match(/export const SITE_URL\s*=\s*"([^"]+)"/);
const declaredEmail = siteSource.match(/export const CONTACT_EMAIL\s*=\s*"([^"]+)"/);

if (!declaredUrl || !declaredEmail) {
  console.error(`Could not read SITE_URL and CONTACT_EMAIL from ${SITE_MODULE}.`);
  process.exit(2);
}

const canonical = declaredUrl[1];
const host = new URL(canonical).host;
const email = declaredEmail[1];

const problems = [];

/* ---- 1. nothing under app/ or lib/ may hardcode the declared values ------ */

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", ".vercel", "public"]);
const CODE_EXT = /\.(ts|tsx|mjs|mts|js|jsx)$/;

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, visit);
    } else {
      visit(full);
    }
  }
}

for (const start of ["app", "lib"]) {
  const startDir = join(ROOT, start);
  try {
    statSync(startDir);
  } catch {
    continue;
  }
  walk(startDir, (full) => {
    const rel = relative(ROOT, full);
    if (!CODE_EXT.test(rel) || rel === SITE_MODULE) return;
    readFileSync(full, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (line.includes(host)) {
          problems.push(
            `${rel}:${i + 1} hardcodes ${host}. Import SITE_URL or SITE_HOST from @/lib/site.`
          );
        }
        if (line.includes(email)) {
          problems.push(
            `${rel}:${i + 1} hardcodes ${email}. Import CONTACT_EMAIL from @/lib/site.`
          );
        }
      });
  });
}

/* ---- 2. the static files must agree with lib/site.ts --------------------- */

for (const rel of ["public/robots.txt", "public/llms.txt"]) {
  let text;
  try {
    text = read(rel);
  } catch {
    problems.push(`${rel} is missing.`);
    continue;
  }

  text.split(/\r?\n/).forEach((line, i) => {
    for (const match of line.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) {
      if (match[1].toLowerCase() !== host.toLowerCase()) {
        problems.push(`${rel}:${i + 1} points at ${match[1]}, but the canonical host is ${host}.`);
      }
    }
    for (const match of line.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
      if (match[0].toLowerCase() !== email.toLowerCase()) {
        problems.push(
          `${rel}:${i + 1} advertises ${match[0]}, but the contact address is ${email}.`
        );
      }
    }
  });
}

if (!read("public/llms.txt").includes(email)) {
  problems.push(`public/llms.txt never mentions ${email}, so it was not updated with lib/site.ts.`);
}

/* ---- 3. ads.txt must name the publisher declared in lib/ads.ts ----------- */

const ADS_MODULE = join("lib", "ads.ts");

let declaredClient = null;
try {
  declaredClient = read(ADS_MODULE).match(/export const ADSENSE_CLIENT\s*=\s*"([^"]+)"/);
} catch {
  // reported below as unreadable, alongside a missing ads.txt
}

let adsTxt = null;
try {
  adsTxt = read("public/ads.txt");
} catch {
  problems.push(
    "public/ads.txt is missing. Every site that serves AdSense needs one at its root."
  );
}

if (!declaredClient) {
  problems.push(`Could not read ADSENSE_CLIENT from ${ADS_MODULE}.`);
} else if (adsTxt !== null) {
  // ads.txt names the publisher bare ("pub-..."), where the tag uses "ca-pub-...".
  const publisher = declaredClient[1].replace(/^ca-/, "");
  if (!adsTxt.includes(publisher)) {
    problems.push(
      `public/ads.txt does not name ${publisher}, so it was not updated with ${ADS_MODULE}.`
    );
  }
  if (!/^\s*google\.com\s*,\s*\S+\s*,\s*(DIRECT|RESELLER)\s*,\s*\S+\s*$/m.test(adsTxt)) {
    problems.push(
      "public/ads.txt has no line in the specification's `domain, publisher-id, relationship, cert-authority` form."
    );
  }
}

/* ---- result ------------------------------------------------------------- */

if (problems.length > 0) {
  console.error(`Value check failed (origin: ${host}, contact: ${email}):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}

console.log(
  `Value check passed: ${host} and ${email} are each declared once, and every static URL and address agrees.`
);
