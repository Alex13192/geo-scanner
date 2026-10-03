/**
 * Generate lib/geo/check-copy.ts from the analyser.
 *
 * Run with:  node scripts/generate-check-copy.mts
 *
 * WHY THIS EXISTS: /checks/<id>/ needs a human-readable title and the fix text for
 * each check. lib/geo/catalog.ts has the rule, the failure reading, the note and the
 * point value, but it deliberately does not carry a title or a fix - those live in
 * the analyser, on the pass/fail/partial branches that produce them.
 *
 * Rather than copy them by hand into the catalogue, where they would drift, the
 * titles and fixes are READ OUT OF THE ANALYSER SOURCE and written to a generated
 * file. scripts/test-analyze.mts then asserts that the generated file covers every
 * catalogued check, so a new check without copy fails the tests rather than
 * silently producing a blank page.
 *
 * This is not a parser for TypeScript. It understands exactly the four constructor
 * calls this file's own author writes - pass/fail/partial/notApplicable - and
 * refuses to guess: any call whose title it cannot read as a plain string literal
 * is reported and the script exits non-zero.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHECK_CATALOG } from "../lib/geo/catalog.ts";

const SOURCE = join(process.cwd(), "lib", "geo", "analyze.ts");
const TARGET = join(process.cwd(), "lib", "geo", "check-copy.ts");

/** Argument positions differ per constructor, so the title index does too. */
const SHAPES: Record<string, { title: number; fix: number | null }> = {
  pass: { title: 2, fix: null },
  fail: { title: 2, fix: 4 },
  partial: { title: 3, fix: 5 },
  notApplicable: { title: 2, fix: null },
};

/** Split the argument list of a call whose "(" sits at openIndex. */
function splitArgs(src: string, openIndex: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = openIndex + 1;
  let quote: string | null = null;

  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
    } else if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (depth === 0) {
        args.push(src.slice(start, i).trim());
        return args;
      }
      depth--;
    } else if (ch === "," && depth === 0) {
      args.push(src.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args;
}

/**
 * A plain string literal, or null when the argument is an expression.
 *
 * All three quote styles are accepted. The first version handled only `"` and
 * backticks, so the single-quoted fix on lang-region - the one call in the file
 * written that way - was reported as unreadable and stopped the run. It was worth
 * stopping for: the alternative is silently generating a page with no fix on it.
 * A template literal is only accepted when it contains no interpolation, because
 * `${...}` cannot be resolved without running the code.
 */
function literal(arg: string | undefined): string | null {
  if (!arg) return null;
  const m =
    arg.match(/^"([^"\\]*(?:\\.[^"\\]*)*)"$/s) ??
    arg.match(/^'([^'\\]*(?:\\.[^'\\]*)*)'$/s) ??
    arg.match(/^`([^`$\\]*)`$/s);
  if (!m) return null;
  return m[1]
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const src = readFileSync(SOURCE, "utf8");
const callPattern = /(?<![A-Za-z.])(pass|fail|partial|notApplicable)\(/g;

type Copy = { title: string; fixes: { when: string; text: string }[] };
const copy = new Map<string, Copy>();
const problems: string[] = [];

let match: RegExpExecArray | null;
while ((match = callPattern.exec(src)) !== null) {
  const kind = match[1];
  const openIndex = match.index + match[0].length - 1;
  const args = splitArgs(src, openIndex);
  const shape = SHAPES[kind];

  const id = literal(args[0]);
  if (!id || !/^[a-z0-9-]+$/.test(id)) continue; // not one of our check constructors

  const title = literal(args[shape.title]);
  if (!title) {
    problems.push(`${kind}("${id}") title is not a plain string literal`);
    continue;
  }

  const existing: Copy = copy.get(id) ?? { title, fixes: [] };
  existing.title = existing.title || title;

  if (shape.fix !== null) {
    const fix = literal(args[shape.fix]);
    if (fix && !existing.fixes.some((f) => f.text === fix)) {
      existing.fixes.push({ when: kind, text: fix });
    } else if (!fix) {
      problems.push(`${kind}("${id}") fix is not a plain string literal (kept the title)`);
    }
  }

  copy.set(id, existing);
}

/* Every catalogue entry must have copy, or a check page would render blank. */
const catalogIds = new Set(CHECK_CATALOG.filter((c) => !c.alias).map((c) => c.id));
const missing = [...catalogIds].filter((id) => !copy.has(id));
const extra = [...copy.keys()].filter((id) => !catalogIds.has(id) && !CHECK_CATALOG.some((c) => c.id === id));

if (missing.length > 0) problems.push(`no copy extracted for: ${missing.join(", ")}`);
if (extra.length > 0) problems.push(`copy extracted for checks not in the catalogue: ${extra.join(", ")}`);

if (problems.length > 0) {
  console.log("Extraction problems:");
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}

const entries = [...copy.entries()].sort(([a], [b]) => a.localeCompare(b));
const body = entries
  .map(([id, c]) => {
    const fixes =
      c.fixes.length === 0
        ? "[]"
        : `[\n${c.fixes.map((f) => `      { when: ${JSON.stringify(f.when)}, text: ${JSON.stringify(f.text)} },`).join("\n")}\n    ]`;
    return `  ${JSON.stringify(id)}: {\n    title: ${JSON.stringify(c.title)},\n    fixes: ${fixes},\n  },`;
  })
  .join("\n");

const file = `/**
 * GENERATED FILE - do not edit by hand.
 *
 * The title and fix wording for every check, read out of lib/geo/analyze.ts by
 * scripts/generate-check-copy.mts so that /checks/<id>/ can render them without a
 * second hand-maintained copy that would drift.
 *
 * Regenerate with:  node scripts/generate-check-copy.mts
 * The tests assert that this file covers every catalogued check, so adding a check
 * without regenerating fails the suite rather than shipping a blank page.
 *
 * ${entries.length} checks.
 */
export type CheckCopy = {
  title: string;
  /** One entry per branch that can produce a failure, in source order. */
  fixes: { when: string; text: string }[];
};

export const CHECK_COPY: Record<string, CheckCopy> = {
${body}
};
`;

writeFileSync(TARGET, file, "utf8");
const withFix = entries.filter(([, c]) => c.fixes.length > 0).length;
console.log(
  `wrote ${TARGET.replace(process.cwd(), ".")} - ${entries.length} checks, ${withFix} with fix text`
);
