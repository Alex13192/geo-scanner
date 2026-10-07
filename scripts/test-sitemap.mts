/**
 * Local check for the sitemap's lastmod, run with:
 *   node scripts/test-sitemap.mts
 *
 * WHY THIS EXISTS. `app/sitemap.ts` carries a hand-maintained date, and that is a
 * deliberate choice with a correct reason written next to it: a lastmod that moves on
 * every deploy teaches a search engine to ignore the field, so `new Date()` is refused.
 * The failure mode of a hand-maintained date is not that the reasoning is wrong, it is
 * that nobody remembers to move it. That happened here: it sat at 2026-10-02 through a
 * week of real content changes, and Search Console ended up reporting 27 rule pages as
 * "Discovered - currently not indexed" while the sitemap told Google nothing had changed.
 *
 * A uniform, never-moving lastmod is worse than no lastmod. This file makes the stale
 * case fail instead of waiting for someone to notice a graph.
 *
 * The date is compared against GIT, not against file mtimes: a fresh clone stamps every
 * file with the checkout time, which would make this test fail on every CI run and teach
 * everyone to ignore it - the same disease it is meant to cure.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "app/sitemap.ts"), "utf8");

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

console.log("=== sitemap lastmod ===");

// 1. The constant exists, parses, and is a plain literal - not a computed date.
const literal = source.match(/const LAST_MODIFIED = new Date\((\s*'([^']+)'\s*)\)/);
check(
  literal !== null,
  `LAST_MODIFIED is a string literal: ${literal?.[2]}`,
  "LAST_MODIFIED is not a `new Date('<date>')` literal - if it was changed to a computed date, " +
    "read the comment above it before keeping that: the hand-maintained date is deliberate.",
);

const declared = literal ? new Date(literal[2]) : null;
check(
  declared !== null && !Number.isNaN(declared.getTime()),
  "the declared date parses",
  "the declared date does not parse",
);

// 2. The one thing automation must not creep back in. A bare `new Date()` anywhere in
//    this file makes every URL look freshly modified on every deploy.
//
//    Comments are stripped first, and that is not tidiness: the comment above the constant
//    says "Do NOT use `new Date()` here" in those exact characters, so the first version of
//    this check matched the sentence forbidding the thing and reported a rule that was not
//    being broken. A check that fires on the comment explaining the rule is worse than no
//    check, because it teaches the reader to ignore a red line.
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");
const bareCalls = (code.match(/new Date\(\s*\)/g) ?? []).length;
check(
  bareCalls === 0,
  "no bare `new Date()` in the sitemap",
  `found ${bareCalls} bare \`new Date()\` call(s) - that makes every page look freshly modified ` +
    "on every deploy, which is the thing the comment in this file refuses.",
);

// 3. The date is not in the future. A lastmod ahead of today is simply wrong, and it is
//    the one direction in which being wrong is not explainable as being conservative.
if (declared) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  check(
    declared.getTime() <= today.getTime(),
    "the declared date is not in the future",
    `the declared date (${literal?.[2]}) is in the future`,
  );
}

// 4. THE ONE THAT MATTERS: content has not moved since the date was last bumped.
let newestContentCommit: string | null = null;
try {
  const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", "app", "lib"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  newestContentCommit = out.trim() || null;
} catch {
  newestContentCommit = null;
}

if (!newestContentCommit) {
  // No git, no history (a tarball, a shallow export). Skipping is the honest outcome:
  // failing here would report a problem this check cannot actually see.
  console.log("  SKIP  git history is unavailable, so the comparison cannot be made");
} else if (declared) {
  const committed = new Date(`${newestContentCommit}T12:00:00Z`);
  check(
    declared.getTime() >= committed.getTime() - 12 * 60 * 60 * 1000,
    `content last changed ${newestContentCommit} and LAST_MODIFIED is ${literal?.[2]}`,
    `content under app/ or lib/ changed on ${newestContentCommit}, but LAST_MODIFIED still says ` +
      `${literal?.[2]}. Bump it in app/sitemap.ts - a lastmod that does not move when the content ` +
      "does is worse than no lastmod, because the engine stops reading the field.",
  );
} else {
  failures++;
  console.log("  FAIL  cannot compare: the declared date did not parse");
}

console.log(`\n${failures === 0 ? "OK" : "FAILED"} — ${passes} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
