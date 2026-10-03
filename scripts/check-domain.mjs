#!/usr/bin/env node
/**
 * Guards the "change the domain in ONE place" claim made in lib/site.ts.
 *
 * WHY THIS IS A SCRIPT AND NOT A COMMENT: that claim was already written in a
 * comment once, and it was false - the origin was in three layouts, two API
 * user-agent strings, a badge snippet and two static files. Comments do not
 * fail a build. This does.
 *
 * It checks the two things that actually break when a domain moves:
 *
 *   1. Nothing under app/ or lib/ may hardcode the canonical host. Everything
 *      is supposed to import SITE_URL or SITE_HOST, so a literal host here means
 *      somebody has started a second source of truth.
 *
 *   2. Every absolute URL in public/robots.txt and public/llms.txt must be on
 *      the canonical host. Those two files cannot import anything, so they are
 *      the ones a domain change silently leaves behind - and a robots.txt
 *      `Sitemap:` line pointing at a domain you no longer own is worse than
 *      having no line at all, because it tells crawlers to fetch a 404.
 *
 * Run: npm run check:domain
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_MODULE = join("lib", "site.ts");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

const siteSource = read(SITE_MODULE);
const declared = siteSource.match(/export const SITE_URL\s*=\s*"([^"]+)"/);
if (!declared) {
  console.error(`Could not read SITE_URL from ${SITE_MODULE}.`);
  process.exit(2);
}
const canonical = declared[1];
const host = new URL(canonical).host;

const problems = [];

/* ---- 1. no hardcoded host in app/ or lib/ ------------------------------- */

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
    if (!CODE_EXT.test(rel)) return;
    if (rel === SITE_MODULE) return;
    readFileSync(full, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (line.includes(host)) {
          problems.push(
            `${rel}:${i + 1} hardcodes ${host}. Import SITE_URL or SITE_HOST from @/lib/site instead.`
          );
        }
      });
  });
}

/* ---- 2. static files must agree with lib/site.ts ------------------------ */

for (const rel of ["public/robots.txt", "public/llms.txt"]) {
  let text;
  try {
    text = read(rel);
  } catch {
    problems.push(`${rel} is missing.`);
    continue;
  }
  if (!text.includes(host)) {
    problems.push(
      `${rel} does not mention ${host} at all, so it was not updated with lib/site.ts.`
    );
  }
  text.split(/\r?\n/).forEach((line, i) => {
    for (const match of line.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) {
      if (match[1].toLowerCase() !== host.toLowerCase()) {
        problems.push(
          `${rel}:${i + 1} points at ${match[1]}, but the canonical host is ${host}.`
        );
      }
    }
  });
}

/* ---- result ------------------------------------------------------------- */

if (problems.length > 0) {
  console.error(`Domain check failed (canonical host: ${host}):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}

console.log(`Domain check passed: ${host} is declared once and every static URL agrees.`);
