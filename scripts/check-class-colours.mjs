#!/usr/bin/env node
/**
 * Guards one rule the light theme introduced: a surface ink must not sit on a
 * saturated fill.
 *
 * WHY THIS EXISTS: before the theme change every text colour was a literal, and
 * `text-white` was the safe default - the site was dark, so white text was
 * correct almost everywhere. After it, the two roles are opposite and both are
 * spelled the same way in a diff:
 *
 *   text-white              correct ONLY on a filled button or a gradient
 *   text-[var(--ink-1)]     correct ONLY on a surface
 *
 * Swapping one for the other on a blue button produces dark ink on a dark fill.
 * Nothing fails to render, no type error is raised, and `check-built-pages` says
 * nothing either, because the analyser reads the markup rather than the pixels.
 * The migration that introduced this rule made exactly that mistake in seven
 * places - two selected-state buttons and five ::selection rules - and nothing in
 * this repository would have caught it. A check that has to be remembered is not
 * a check, which is the sentence scripts/check-values.mjs opens with.
 *
 * THE RULE
 *   flag a className value that contains BOTH
 *
 *     a saturated fill   bg-<hue>-<shade>, shade >= 400 and either no opacity
 *                        modifier or one at 60% or above, or any bg-gradient-to-*
 *     and a surface ink  text-[var(--ink-1)] / -2 / -3
 *
 * THREE DELIBERATE LIMITS, stated here rather than discovered later:
 *
 *   1. A low-opacity background is a tint, not a fill. `bg-blue-500/10` with
 *      --ink-1 on it is a chip sitting on the page surface, and that is correct;
 *      treating it as a fill would flag most of the site's eyebrows. Hence the
 *      60% floor.
 *
 *   2. A variant-prefixed fill is not treated as a fill. `selection:bg-blue-500`
 *      sits on the same element as a correct `selection:text-white` AND a correct
 *      body `text-[var(--ink-1)]`, and no reading of that one string can tell
 *      which ink belongs to which background. Treating it as a fill would fail
 *      five page shells that are right. The cost is a false negative for
 *      `hover:bg-blue-600` next to a surface ink; that combination is worth
 *      checking by hand.
 *
 *   3. It reads className string literals only - `className="..."`,
 *      `className={`...`}` and `className={"..."}`. A class list assembled at
 *      runtime, or one held in a module like PageFooter's WIDTH_CLASS, is
 *      invisible to it. Nothing in app/ does this with a colour today.
 *
 * It is not a general contrast checker. It catches the one swap that the theme
 * change made easy and that nothing else would catch.
 *
 * Run: npm run check:colours
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", ".open-next"]);

/** className="..." | className={`...`} | className={"..."} */
const CLASSNAME = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g;

const HUES =
  "blue|indigo|purple|violet|green|emerald|teal|cyan|sky|red|rose|amber|yellow|orange|pink|fuchsia";

/**
 * A saturated fill. The boundary class includes the quote and backtick
 * characters on purpose: `? "bg-blue-600 text-white"` has a quote before `bg-`,
 * which is one of the two ways the migration's own first attempt at this test
 * went wrong.
 *
 * The trailing `(?![0-9/])` is what makes the opacity exemption work, and it is
 * not decoration. Written as an optional group alone - `(?:/(?:[6-9]\d|100))?` -
 * `bg-purple-950/20` matches the base alternative and stops before the `/20`, so
 * a 20% tint is treated as a fill and every translucent panel in the site is a
 * false positive. The lookahead refuses the match outright when a slash or
 * another digit follows.
 */
const FILL = new RegExp(
  `(?:^|[\\s"'\`])(?:bg-(?:${HUES})-[4-9]\\d\\d(?:/(?:[6-9]\\d|100))?(?![0-9/])|bg-gradient-to-)`
);

const INK = /text-\[var\(--ink-[123]\)\]/;

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, visit);
    else visit(full);
  }
}

const problems = [];
let scanned = 0;

walk(join(ROOT, "app"), (full) => {
  if (!full.endsWith(".tsx") && !full.endsWith(".ts")) return;
  scanned++;
  const rel = relative(ROOT, full).split("\\").join("/");
  const text = readFileSync(full, "utf8");
  const lines = text.split(/\r?\n/);

  /*
   * Matched over the whole file, not line by line: a className written as
   * `className={`... ${cond ? "a" : "b"}`}` spans several lines, and a per-line
   * scan never sees the opening and closing backtick together. That is how the
   * exact mistake this file exists to catch - a ternary branch inside a template
   * literal - was invisible to the first version of it.
   */
  for (const match of text.matchAll(CLASSNAME)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";

    /*
     * Then tested per string literal, not per className. A ternary puts a filled
     * variant and a surfaced variant in the same value -
     *   ? "bg-blue-600 text-white"
     *   : "border ... text-[var(--ink-2)] hover:text-[var(--ink-1)]"
     * - and the two branches legitimately carry different inks, because only one
     * of them is on a fill. Testing the whole value flags that correct code;
     * testing each literal separately asks the question that actually has an
     * answer. The second segment is the value with its quoted branches blanked
     * out, which is what covers a plain single-literal className.
     */
    const segments = [...value.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    segments.push(value.replace(/"[^"]*"/g, " "));

    if (segments.some((segment) => FILL.test(segment) && INK.test(segment))) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      problems.push({ rel, line, text: (lines[line - 1] ?? "").trim() });
    }
  }
});

if (problems.length > 0) {
  console.error(
    `Ink-on-fill check failed: ${problems.length} className value(s) put a surface ink on a saturated fill.\n`
  );
  for (const p of problems) {
    console.error(`  ${p.rel}:${p.line}`);
    console.error(`    ${p.text.slice(0, 180)}`);
  }
  console.error(
    `\nOn a filled background the text colour is text-white or text-[var(--on-accent)],\n` +
      `not an --ink token: the ink tokens follow the theme, and the theme is light.\n`
  );
  process.exit(1);
}

console.log(
  `Ink-on-fill check passed: no surface ink sits on a saturated fill across ${scanned} file(s).`
);
