#!/usr/bin/env node
/**
 * Measure a FROZEN question bank against a model, and write a run file the visibility report can
 * read.
 *
 * ================================================================================================
 * WHAT THIS IS, AND THE GAP IT CLOSES
 * ================================================================================================
 * Step 3 of the three steps in intake/README.md:
 *
 *   1. the client fills intake/_template.yaml   ->  clients/<client>.yaml
 *   2. build-question-bank.mts emits the bank   ->  clients/banks/<client>-<date>.{yaml,md}
 *   3. THE CLIENT APPROVES THE BANK, and only then a measurement run happens  <- this script
 *
 * Before this file existed, step 3 was a throwaway probe (phase1-champion.mjs, still in the workspace
 * but not in this repository) with two literals in it: ten questions, and the brand names
 * ["冠军股份","冠军科技","冠军漆","鲸海漆"]. Both are properties of ONE client. A probe like that
 * cannot measure a second client at all - running it for somebody else measures the first client's
 * brand, and the mistake is invisible because the output still looks like a report. That is the exact
 * failure the bank generator was written to prevent, one step earlier.
 *
 * So: the questions come from the bank, and the brand and its aliases come from the intake the bank
 * was generated from. Neither is a constant in this file, and there is no code path here that can
 * fall back to one.
 *
 * ================================================================================================
 * WHY THE MENTION RULE IS IMPORTED RATHER THAN RE-INVENTED
 * ================================================================================================
 * `mentionsBrand` has to mean the same thing here and on the answer-check page, or the product tells
 * two different stories about one answer. lib/answer-check/rules.ts documents why there are two
 * matching strategies and not one: a CJK name has no word boundaries (matching "冠军" as a whole word
 * is a pattern that matches nothing at all), a Latin name does (matching "Ramp" inside "ramp-up" is a
 * false positive worth avoiding), and a hyphen counts as part of the word. findMention() is that
 * rule, so this file imports it. A second copy of that regex is how the collector and the report
 * start disagreeing about what a mention is.
 *
 * ================================================================================================
 * PROVENANCE TRAVELS IN A HEADER LINE, NOT IN A SIDECAR FILE
 * ================================================================================================
 * The run file is JSONL: one `{"kind":"run-header", ...}` line first, then one line per answer, then
 * an optional `{"kind":"run-footer", ...}` line with the post-run totals.
 *
 * WHY A HEADER LINE RATHER THAN `<run>.meta.json`. A sidecar is a second file that can be copied
 * without its data, renamed, or left behind - and the run file on its own is the thing that gets
 * mailed around. The bank's identity, the model, the date, the runs per question and the
 * web-search state are all facts ABOUT the answers that follow; putting them in the same stream
 * means the file cannot arrive without them, and `head -1` is the whole provenance record. The
 * footer exists for the same reason in the other direction: attempts, billed calls and timeouts are
 * only known after the run, and a reader has to be able to tell 87 completed answers from 87
 * completed answers plus 12 rate-limited attempts.
 *
 * WHY THE ANSWER LINES KEEP THE OLD FIELD SHAPE. build-visibility.mts (and any earlier run file)
 * reads: q, group, question, run, ok, status, errorBody, ms, mentionsBrand, mentionsCoatings,
 * domains, usage, answer. Those stay, and they mean what they meant. What is added is `id` (the
 * bank's own question id, e.g. "F4") and `attempts` / `questionAttempts` / `truncated` /
 * `mentionsPrimary`. `group` is now the bank's ARCHETYPE id, so the report groups by the bank's
 * taxonomy rather than by whatever string somebody typed into a probe - which is what makes
 * "4 of 12 in the category group" a statement about a frozen, approved set of questions.
 *
 * WHY THE FOOTER CARRIES NO QUESTION TEXT. The header carries the questions because the report's
 * first section has to print them. The per-answer progress this script writes to STDOUT carries no
 * question text at all: a console is a log, and a log of a client's questions is the same leak as
 * committing them (the bank generator's own `--print` rule). `--print` echoes them when a human
 * needs to see them on purpose.
 *
 * ================================================================================================
 * THE THREE MODES, AND WHY TWO OF THEM EXIST
 * ================================================================================================
 *   --dry-run          synthesise an answer for every question, from the question text alone. No
 *                      network. Proves the whole chain (bank -> run file -> report) offline. The
 *                      answers are labelled as synthetic in the file, in the header and in the
 *                      report, and `calls.attempted` is 0 - a dry run made no call.
 *   --replay=<file>    reuse the answers recorded in an earlier run file, matched by (id, run).
 *                      Mention flags are RE-DERIVED from the recorded answer text with this run's
 *                      token list, which is what makes it possible to re-render or re-judge an
 *                      existing measurement without paying for the calls again. A bank question
 *                      whose text no longer matches the recording stops the run: reusing an answer
 *                      to a different question is not a measurement.
 *   (neither)          the live path: 火山方舟 /api/v3/responses with the web_search tool, streamed,
 *                      with a per-call timeout, retries with backoff, the HTTP status and the error
 *                      body of every rejection, and per-call token usage.
 *
 * ================================================================================================
 * OPERATIONAL BEHAVIOUR THAT WAS LEARNED THE HARD WAY AND IS KEPT HERE
 * ================================================================================================
 * 1. THE ERROR BODY IS KEPT. The first probe discarded it, and six calls rejected in under 400ms
 *    left nothing to diagnose but a number.
 * 2. A TIMEOUT IS RECORDED WHERE IT TRIPS. `status: "timeout"` and the ms it died at, not a generic
 *    failure. A partial answer is KEPT and flagged `truncated`: a truncated call is still billed, and
 *    throwing the tokens away would make the cost accounting wrong in the direction nobody checks.
 * 3. ATTEMPTS ARE COUNTED PER QUESTION, not only in aggregate. `attempts` on a line is what that run
 *    cost; `questionAttempts` is the running total for that question; the footer totals them.
 * 4. CALLS ARE PACED. `--gap-ms` (default 3000) between runs, and on a failure a backoff that starts
 *    at `--backoff-ms` (default 3000) and doubles, and is longer for a fast rejection (<3s), because
 *    a burst of 30 calls was almost certainly rate limited.
 * 5. THE FILE IS WRITTEN AS THE RUN GOES. A crash at question 20 keeps 20 questions of paid work.
 *
 * ================================================================================================
 * USAGE
 * ================================================================================================
 *   npm run measure -- --bank=..\clients\banks\acme-2026-10-07.yaml --out=..\clients\runs
 *
 *   --bank=PATH        required. The frozen bank. A relative path resolves against this repository
 *                      first and the workspace above it second (that is where clients/ lives).
 *   --out=DIR          output directory. Defaults to <workspace>/clients/runs, i.e. OUTSIDE this
 *                      repository. A directory inside the repo is refused unless --allow-in-repo is
 *                      also passed: a run file names a client, quotes their questions and carries the
 *                      model's answers about them.
 *   --runs=N           runs per question. Default 3. This is recorded in the header and in the report
 *                      because a re-test at a different N is a different measurement.
 *   --language=CODE    which language group of the bank to run (zh | en). Defaults to the bank's
 *                      first declared language. One run file is one language: the report is written
 *                      in one language, and mixing two into one file makes every count a count over a
 *                      mixture.
 *   --intake=PATH      where to read the brand and its aliases from. Defaults to the intake the bank
 *                      records. Verifying this is the difference between "the bank's questions" and
 *                      "the bank's questions plus a stale name list".
 *   --model=ID         the model id, for a live run. Required unless --dry-run/--replay.
 *   --endpoint=URL     defaults to the 火山方舟 responses endpoint.
 *   --api-key-env=NAME environment variable holding the key. Defaults to ARK_API_KEY. THE KEY IS
 *                      NEVER READ FROM A FILE AND NEVER PRINTED - and this script never runs without
 *                      one, so a missing variable is a failure rather than a run of empty answers.
 *   --timeout-ms=N     per-call cap. Default 100000.
 *   --attempts=N       attempts per run before the run is recorded as failed. Default 3.
 *   --gap-ms=N         pause between runs. Default 3000.
 *   --backoff-ms=N     first retry pause; doubles per attempt. Default 3000.
 *   --date=YYYY-MM-DD  the measurement date in the header and the filename. Defaults to today.
 *   --label=NAME       filename suffix, for a second run of the same bank on the same day.
 *   --force            overwrite an existing run file. Refused by default: appending a second run to
 *                      the first one's file silently doubles every denominator.
 *   --dry-run          synthesise answers, no network.
 *   --replay=FILE      reuse the answers of an earlier run file, no network.
 *   --no-web-search    run with the web_search tool switched off (recorded in the header).
 *   --print            echo the questions of this run to stdout. Off by default.
 *   --allow-in-repo    permit writing into the repository. Explicit, and printed loudly.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { findMention } from "../../lib/answer-check/rules.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const WORKSPACE = resolve(REPO, "..");
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_REL = "scripts/report/run-bank.mts";

/**
 * Bumped by hand when the shape of a run file changes. The report reads the header's own
 * `schema`/`collector` fields, so a file written by an older collector can still be told apart from
 * one written by this version.
 */
const COLLECTOR_VERSION = 1;
const SCHEMA = 1;

const DEFAULT_RUNS = 3;
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 100_000;
const DEFAULT_GAP_MS = 3_000;
const DEFAULT_BACKOFF_MS = 3_000;
const DEFAULT_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/responses";
const DEFAULT_API_KEY_ENV = "ARK_API_KEY";
/** A rejection faster than this is a rejection, not a slow model: it gets the longer pause. */
const FAST_REJECT_MS = 3_000;
const FAST_REJECT_PAUSE_MS = 8_000;

/* ------------------------------------------------------------------ */
/* Arguments                                                          */
/* ------------------------------------------------------------------ */

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

function num(name: string, fallback: number): number {
  const raw = arg(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    console.error(`--${name} must be a non-negative number; got ${JSON.stringify(raw)}.`);
    process.exit(2);
  }
  return Math.floor(value);
}

const bankArg = arg("bank");
const dryRun = flag("dry-run");
const replayArg = arg("replay");
const allowInRepo = flag("allow-in-repo");
const shouldPrint = flag("print");
const force = flag("force");

if (!bankArg) {
  console.error(
    [
      "Usage:",
      "  npm run measure -- --bank=<frozen bank.yaml> [--out=DIR] [--runs=3] [--language=zh]",
      "      [--model=<model id>] [--intake=<filled intake.yaml>] [--endpoint=URL]",
      "      [--api-key-env=ARK_API_KEY] [--timeout-ms=100000] [--attempts=3] [--gap-ms=3000]",
      "      [--date=YYYY-MM-DD] [--label=NAME] [--force] [--print] [--allow-in-repo]",
      "      [--dry-run] [--replay=<recorded run file>] [--no-web-search]",
      "",
      "  --bank            the frozen bank emitted by scripts/report/build-question-bank.mts",
      "                    (required). Relative paths resolve against this repository first and the",
      "                    workspace above it second, so ..\\clients\\banks\\acme-2026-10-07.yaml",
      "                    works from the repository root.",
      "  --out             where the run file goes. Defaults to <workspace>/clients/runs, which is",
      "                    deliberately outside this repository: a run file names a client, carries",
      "                    their questions and the model's answers about them. Inside the repo is",
      "                    refused unless --allow-in-repo is passed as well.",
      "  --dry-run         no network: synthesise one answer per question from the question text, so",
      "                    the chain bank -> run file -> report can be proven offline.",
      "  --replay=FILE     no network: reuse the answers of an earlier run file, matched by (id, run).",
      "",
      "The questions come from the bank and the brand and its aliases come from the intake it records.",
      "Neither is a constant in this script, which is the point of it.",
    ].join("\n")
  );
  process.exit(2);
}

if (dryRun && replayArg) {
  console.error("--dry-run and --replay are mutually exclusive: one synthesises answers, the other reuses recorded ones.");
  process.exit(2);
}
if (replayArg && !existsSync(resolveInputPath(replayArg))) {
  console.error(`--replay points at ${resolveInputPath(replayArg)}, which does not exist.`);
  process.exit(1);
}

/**
 * Repository first, workspace second - the same order build-question-bank.mts uses, and for the same
 * reason: filled intakes and banks deliberately live OUTSIDE this repository while the synthetic
 * examples live inside it, and both have to work.
 */
function resolveInputPath(p: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(p) || p.startsWith("/")) return p;
  const inRepo = resolve(REPO, p);
  if (existsSync(inRepo)) return inRepo;
  return resolve(WORKSPACE, p);
}

/** True when `child` is `parent` itself or lives under it. */
function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith(`..${sep}`) && !/^[a-zA-Z]:/.test(rel));
}

const bankPath = resolveInputPath(bankArg);
if (!existsSync(bankPath)) {
  console.error(`--bank points at ${bankPath}, which does not exist.`);
  process.exit(1);
}

const outDir = resolve(REPO, arg("out") || join(WORKSPACE, "clients", "runs"));
if (isInside(REPO, outDir) && !allowInRepo) {
  console.error(
    [
      `Refusing to write into the repository: ${outDir}`,
      "",
      "A run file names the client, quotes the questions they approved, and contains the model's",
      "answers about them, including the domains those answers cited. This repository is public,",
      "so a run written here is published whether or not a page renders it - the same reason",
      "intake/README.md keeps the filled form, and the bank generator keeps the bank, in clients/.",
      "",
      `Pass an --out outside the repository (for example --out=${join(WORKSPACE, "clients", "runs")}),`,
      "or pass --allow-in-repo if you really mean it.",
    ].join("\n")
  );
  process.exit(2);
}

const runsPerQuestion = num("runs", DEFAULT_RUNS);
if (runsPerQuestion < 1) {
  console.error("--runs must be at least 1: a question with no run is not measured, it is missing.");
  process.exit(2);
}
const maxAttempts = Math.max(1, num("attempts", DEFAULT_ATTEMPTS));
const timeoutMs = Math.max(1, num("timeout-ms", DEFAULT_TIMEOUT_MS));
const gapMs = num("gap-ms", DEFAULT_GAP_MS);
const backoffMs = num("backoff-ms", DEFAULT_BACKOFF_MS);
const webSearch = !flag("no-web-search");

const startedAt = new Date().toISOString();
const date = (arg("date") || startedAt.slice(0, 10)).trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD; got ${JSON.stringify(date)}.`);
  process.exit(2);
}

/* ------------------------------------------------------------------ */
/* Reading and validating the bank                                    */
/* ------------------------------------------------------------------ */

const bankText = readFileSync(bankPath, "utf8");
const bankSha256 = createHash("sha256").update(bankText).digest("hex");

let bankDoc: any;
try {
  bankDoc = parse(bankText);
} catch (err) {
  console.error(`${bankPath} is not valid YAML: ${(err as Error).message}`);
  process.exit(1);
}
if (typeof bankDoc !== "object" || bankDoc === null) {
  console.error(`${bankPath} parses to ${typeof bankDoc}, not a mapping. Nothing was written.`);
  process.exit(1);
}

const bankMeta = bankDoc.bank;
if (typeof bankMeta !== "object" || bankMeta === null) {
  console.error(
    `${bankPath} has no \`bank:\` block, so it is not a question bank (bank.kind would be absent). ` +
      "Nothing was written."
  );
  process.exit(1);
}
if (bankMeta.kind !== "geo-question-bank") {
  console.error(
    `${bankPath} has bank.kind = ${JSON.stringify(bankMeta.kind)}; this script runs banks emitted by ` +
      "scripts/report/build-question-bank.mts (bank.kind: geo-question-bank). Nothing was written."
  );
  process.exit(1);
}

const languages: any[] = Array.isArray(bankDoc.languages) ? bankDoc.languages : [];
if (languages.length === 0) {
  console.error(
    [
      `${bankPath} has no \`languages:\` list, so there are no questions in it.`,
      "A bank with no questions is not a measurement with no results - it is a file that cannot be",
      "run at all, and a report built from it would have an empty first section. Nothing was written.",
    ].join("\n")
  );
  process.exit(1);
}

const requestedLanguage = (arg("language") || "").trim();
const languageEntry =
  requestedLanguage === ""
    ? languages[0]
    : languages.find((l) => String(l?.code ?? "").trim() === requestedLanguage);
if (!languageEntry) {
  console.error(
    `--language=${requestedLanguage} is not in ${bankPath}; it has ` +
      `${languages.map((l) => JSON.stringify(l?.code)).join(", ")}. Nothing was written.`
  );
  process.exit(1);
}
const language = String(languageEntry.code ?? "").trim();

const rawQuestions: any[] = Array.isArray(languageEntry.questions) ? languageEntry.questions : [];
if (rawQuestions.length === 0) {
  console.error(
    [
      `${bankPath} declares language ${JSON.stringify(language)} but has no questions in it.`,
      "The bank generator reports an empty language group as empty WITH the reason; a measurement",
      "run may not turn that into an empty run file. Nothing was written.",
    ].join("\n")
  );
  process.exit(1);
}

type BankQuestion = { q: number; id: string; group: string; text: string; slots: Record<string, { value: string; field: string }> };

const questions: BankQuestion[] = [];
const seenIds = new Set<string>();
rawQuestions.forEach((raw, i) => {
  const id = typeof raw?.id === "string" ? raw.id.trim() : "";
  const text = typeof raw?.text === "string" ? raw.text.trim() : "";
  const group = typeof raw?.archetype === "string" ? raw.archetype.trim() : "";
  if (!id) {
    console.error(
      [
        `${bankPath}: question ${i + 1} of language ${language} has no \`id\`.`,
        `  text: ${JSON.stringify(text).slice(0, 120)}`,
        "",
        "The id is how a measurement line, a report row and a re-test refer to one question. A",
        "question without one cannot be reported per question, and a bank with a missing id is a",
        "broken bank rather than a bank with a small gap. Nothing was written.",
      ].join("\n")
    );
    process.exit(1);
  }
  if (!text) {
    console.error(
      `${bankPath}: question ${id} of language ${language} has no \`text\`. A question with no words ` +
        "cannot be asked. Nothing was written."
    );
    process.exit(1);
  }
  if (!group) {
    console.error(
      `${bankPath}: question ${id} has no \`archetype\`. The report groups by the bank's own taxonomy; ` +
        "without it the numbers would be grouped by a string this script invented. Nothing was written."
    );
    process.exit(1);
  }
  if (seenIds.has(id)) {
    console.error(`${bankPath}: question id ${JSON.stringify(id)} appears twice in language ${language}. Nothing was written.`);
    process.exit(1);
  }
  seenIds.add(id);
  questions.push({
    q: i + 1,
    id,
    group,
    text,
    slots: typeof raw?.slots === "object" && raw.slots !== null ? raw.slots : {},
  });
});

/**
 * THE FINGERPRINT IS RE-COMPUTED, NOT TRUSTED.
 *
 * The bank carries sha256 over [{language,id,archetype,text}] in bank order, which is the bank's
 * identity: two banks with the same fingerprint ask exactly the same questions. A run that does not
 * check it can measure a bank whose questions were edited after the client approved it, and the
 * report would still print the approved fingerprint printed in the bank file - a provenance claim
 * that is false. So the rule in the bank is applied to the bank's own questions here, and a
 * mismatch stops the run.
 *
 * A bank written with a DIFFERENT rule cannot be checked by this code, and that is recorded in the
 * header as `fingerprint_verified: false` rather than silently skipped.
 */
const FINGERPRINT_RULE = "sha256 of [{language,id,archetype,text}] in bank order";
const recordedFingerprint = typeof bankMeta.fingerprint === "string" ? bankMeta.fingerprint : "";
const ruleMatches = bankMeta.fingerprint_rule === FINGERPRINT_RULE;
let computedFingerprint: string | null = null;
if (ruleMatches) {
  const canonical = languages.flatMap((l) =>
    (Array.isArray(l?.questions) ? l.questions : []).map((q: any) => ({
      language: String(l?.code ?? ""),
      id: String(q?.id ?? ""),
      archetype: String(q?.archetype ?? ""),
      text: String(q?.text ?? ""),
    }))
  );
  computedFingerprint = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  if (!recordedFingerprint) {
    console.error(`${bankPath} has bank.fingerprint_rule but no bank.fingerprint. Nothing was written.`);
    process.exit(1);
  }
  if (computedFingerprint !== recordedFingerprint) {
    console.error(
      [
        `${bankPath} does not match its own fingerprint:`,
        `  recorded  ${recordedFingerprint}`,
        `  recomputed ${computedFingerprint}`,
        "",
        "The fingerprint is the bank's identity, and the questions in this file no longer hash to it:",
        "somebody edited the bank after it was generated. A bank that was edited after approval is not",
        "the bank the client approved, so this run stops. Regenerate the bank and have it re-approved.",
      ].join("\n")
    );
    process.exit(1);
  }
} else if (recordedFingerprint) {
  console.warn(
    `WARNING: ${bankPath} records fingerprint_rule ${JSON.stringify(bankMeta.fingerprint_rule)}, which this ` +
      `script does not implement. The fingerprint cannot be verified and the header says so.`
  );
}

/** The taxonomy, as the bank declares it. Used for the header and therefore for the report. */
const ARCHETYPE_SHORT: Record<string, string> = {
  category: "品类",
  scenario: "场景",
  comparison: "对比",
  fact: "事实",
};
type ArchetypeRow = {
  id: string;
  label: string;
  short: string;
  measures: string;
  target: number;
  generated: number;
  status: string;
};
const archetypes: ArchetypeRow[] = (
  Array.isArray(languageEntry.archetypes) && languageEntry.archetypes.length > 0
    ? languageEntry.archetypes
    : Array.isArray(bankMeta.archetypes)
      ? bankMeta.archetypes
      : []
).map((a: any) => {
  const id = String(a?.id ?? "").trim();
  const fallback = (bankMeta.archetypes ?? []).find((x: any) => String(x?.id ?? "") === id);
  const measures = typeof a?.measures === "string" ? a.measures : typeof fallback?.measures === "object" && fallback?.measures !== null
    ? String(fallback.measures[language] ?? fallback.measures.zh ?? "")
    : "";
  return {
    id,
    label: String(a?.label ?? fallback?.label ?? id),
    short: ARCHETYPE_SHORT[id] ?? id,
    measures,
    target: Number(a?.target ?? fallback?.target ?? 0),
    generated: Number(a?.generated ?? fallback?.generated ?? 0),
    status: String(a?.status ?? fallback?.status ?? ""),
  };
});
if (archetypes.length === 0) {
  console.error(
    `${bankPath} records no archetypes for language ${language}, so the report cannot group these ` +
      "questions by the bank's own taxonomy. Nothing was written."
  );
  process.exit(1);
}
for (const q of questions) {
  if (!archetypes.some((a) => a.id === q.group)) {
    console.error(
      `${bankPath}: question ${q.id} has archetype ${JSON.stringify(q.group)}, which is not in the bank's ` +
        `archetype list (${archetypes.map((a) => a.id).join(", ")}). Nothing was written.`
    );
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/* The brand and its aliases: from the intake the bank records         */
/* ------------------------------------------------------------------ */

type Token = { value: string; field: string };

function rawAt(doc: unknown, path: string): unknown {
  let cur: unknown = doc;
  for (const key of path.split(".")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
function scalarAt(doc: unknown, path: string): Token[] {
  const v = rawAt(doc, path);
  if (typeof v === "number" && Number.isFinite(v)) return [{ value: String(v), field: path }];
  if (typeof v !== "string") return [];
  const text = v.trim();
  return text.length > 0 ? [{ value: text, field: path }] : [];
}
function listAt(doc: unknown, path: string): Token[] {
  const v = rawAt(doc, path);
  if (!Array.isArray(v)) return [];
  const out: Token[] = [];
  v.forEach((item, i) => {
    const text = (typeof item === "number" ? String(item) : typeof item === "string" ? item : "").trim();
    if (text.length > 0) out.push({ value: text, field: `${path}[${i}]` });
  });
  return out;
}

/**
 * The brand's spellings, FROM THE INTAKE. brand.name is the legal name the client wrote; short_name,
 * aliases, former_names and english_name are the other spellings a model may use. A mention is any of
 * them - the old probe's list was four names for one client, and this is the same information for
 * whichever client is being measured.
 */
const BRAND_SLOT_PATHS = [
  "brand.name",
  "brand.short_name",
  "brand.aliases",
  "brand.former_names",
  "brand.english_name",
] as const;

function dedupe(tokens: Token[]): Token[] {
  const out: Token[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const key = t.value.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ value: t.value.trim(), field: t.field });
  }
  return out;
}

const intakeOverride = arg("intake");
const recordedIntakePath = typeof bankMeta.source_intake?.path === "string" ? bankMeta.source_intake.path : "";
const intakePath = intakeOverride ? resolveInputPath(intakeOverride) : recordedIntakePath;

type IntakeRead = {
  requested_path: string;
  resolved_path: string | null;
  sha256_expected: string | null;
  sha256_actual: string | null;
  sha256_matches: boolean | null;
  client: string;
  note: string;
};

let brandTokens: Token[] = [];
let brandTokensSource = "";
let categoryTokens: Token[] = [];
/**
 * The client's named competitors, from the intake. Marked per answer so the report can say which
 * names were recommended in the runs where nobody named the client — the share-of-voice column the
 * first measurement could not produce, and the one a client asks for before anything else.
 */
let competitorTokens: Token[] = [];
let intakeClient = "";
let intakeRead: IntakeRead = {
  requested_path: intakePath,
  resolved_path: null,
  sha256_expected: typeof bankMeta.source_intake?.sha256 === "string" ? bankMeta.source_intake.sha256 : null,
  sha256_actual: null,
  sha256_matches: null,
  client: "",
  note: "",
};

if (intakePath && existsSync(intakePath)) {
  const intakeText = readFileSync(intakePath, "utf8");
  const actual = createHash("sha256").update(intakeText).digest("hex");
  let intakeDoc: unknown = null;
  try {
    intakeDoc = parse(intakeText);
  } catch (err) {
    console.error(
      [
        `${intakePath} is not valid YAML: ${(err as Error).message}`,
        "",
        "The brand and its aliases come from this file. Without them this run cannot tell a mention",
        "from a non-mention, and a report full of zeros would look like a finding. Nothing was written.",
      ].join("\n")
    );
    process.exit(1);
  }
  brandTokens = dedupe(BRAND_SLOT_PATHS.flatMap((p) => (p === "brand.aliases" || p === "brand.former_names" ? listAt(intakeDoc, p) : scalarAt(intakeDoc, p))));
  brandTokensSource = "intake";
  categoryTokens = dedupe([...listAt(intakeDoc, "industry.category_terms"), ...scalarAt(intakeDoc, "industry.subcategory")]);
  competitorTokens = dedupe(listAt(intakeDoc, "competitors.names"));
  intakeClient = scalarAt(intakeDoc, "meta.client")[0]?.value ?? "";
  const matches = intakeRead.sha256_expected === null ? null : intakeRead.sha256_expected === actual;
  intakeRead = {
    ...intakeRead,
    resolved_path: intakePath,
    sha256_actual: actual,
    sha256_matches: matches,
    client: intakeClient,
    note:
      matches === true
        ? "The intake still hashes to the value recorded in the bank."
        : matches === false
          ? "THE INTAKE HAS CHANGED since the bank was generated. The questions in the bank are frozen and are used as they are; the brand and alias list below is the CURRENT intake's, and `bank_tokens_not_in_intake` names the spellings this bank still asks about that the intake no longer lists."
          : "The bank records no intake sha256, so the intake could not be checked against it.",
  };
  if (matches === false) {
    console.warn(
      [
        "",
        `WARNING: ${intakePath} no longer hashes to the value recorded in the bank.`,
        `  bank records ${intakeRead.sha256_expected}`,
        `  file has     ${actual}`,
        "The bank's questions are frozen and are used unchanged. The brand/alias list used for mention",
        "detection is the file's CURRENT one, and the run header records the mismatch. The report says",
        "so as well - a re-test that measures a different string than the baseline is not comparable",
        "with it, and that has to be visible in the report rather than in this console only.",
        "",
      ].join("\n")
    );
  }
  if (brandTokens.length === 0) {
    console.error(
      [
        `${intakePath} has no brand name (brand.name, brand.short_name, brand.aliases, brand.former_names,`,
        "brand.english_name are all empty).",
        "",
        "Mention detection is defined as 'the answer contains the brand or one of its aliases'. With no",
        "names it would count zero mentions in every answer - a number that reads as 'nobody recommends",
        "them' when in fact nothing was matched. Nothing was written.",
      ].join("\n")
    );
    process.exit(1);
  }
} else {
  /**
   * NO INTAKE, BUT THE BANK KNOWS WHICH SPELLINGS IT ASKS ABOUT. Every comparison and fact question
   * records its `brand` / `short_name` / `alias` / `former_name` slot values with the intake field
   * they came from, because the bank generator traces every question back to a field. That is a
   * smaller list than the intake's (it only contains spellings some question actually used) and it
   * cannot contain brand.english_name, which is never a slot - so the header names this as the
   * source and the report prints it. It is deliberately NOT a fallback to a constant: if the bank
   * has no such slots either, the run stops.
   */
  const NAME_SLOTS = new Set(["brand", "short_name", "alias", "former_name"]);
  brandTokens = dedupe(
    questions.flatMap((q) =>
      Object.entries(q.slots)
        .filter(([slot, v]) => NAME_SLOTS.has(slot) && typeof v?.value === "string" && v.value.trim().length > 0)
        .map(([, v]) => ({ value: String(v.value).trim(), field: `${q.id}.slots.${v.field}` }))
    )
  );
  brandTokensSource = "bank-slots";
  intakeRead = {
    ...intakeRead,
    note: intakePath
      ? `The intake recorded by the bank (${intakePath}) does not exist on this machine, and --intake was not given. The brand spellings were taken from the bank's own question slots instead, which is a SUBSET: it contains only the spellings some question used.`
      : "The bank records no source intake, and --intake was not given. The brand spellings were taken from the bank's own question slots instead, which is a SUBSET: it contains only the spellings some question used.",
  };
  if (brandTokens.length === 0) {
    console.error(
      [
        intakePath
          ? `The intake recorded by the bank does not exist on this machine: ${intakePath}`
          : "The bank records no source intake path.",
        "and the bank's questions record no brand / short_name / alias / former_name slots either.",
        "",
        "So there is no way to tell a mention from a non-mention, and every count would be zero for a",
        "reason that is not about the model. Pass --intake=<the filled form> (it is what the brand and",
        "its aliases come from), or regenerate the bank. Nothing was written.",
      ].join("\n")
    );
    process.exit(1);
  }
  console.warn(
    `WARNING: brand spellings come from the bank's question slots, not from the intake (${intakeRead.note})`
  );
}

/**
 * WHAT THE BANK STILL ASKS ABOUT THAT THE INTAKE NO LONGER NAMES. Differences between the two lists
 * are the visible half of an edited intake: the questions are frozen, so a brand that was renamed
 * after the bank was approved is still asked for by its old name while mention detection looks for
 * the new one. Rather than hide that in a warning, it is a field in the header and a line in the
 * report's method section.
 */
const bankNameTokens = dedupe(
  questions.flatMap((q) =>
    Object.entries(q.slots)
      .filter(([slot, v]) => ["brand", "short_name", "alias", "former_name"].includes(slot) && typeof v?.value === "string")
      .map(([, v]) => ({ value: String(v.value).trim(), field: `${q.id}.slots.${v.field}` }))
  )
);
const intakeKeys = new Set(brandTokens.map((t) => t.value.toLowerCase()));
const bankTokensNotInIntake = bankNameTokens.filter((t) => !intakeKeys.has(t.value.toLowerCase()));

const brandName = brandTokens[0]?.value ?? "";

/* ------------------------------------------------------------------ */
/* Mode, model, key                                                    */
/* ------------------------------------------------------------------ */

type Mode = "api" | "dry-run" | "replay";
const mode: Mode = dryRun ? "dry-run" : replayArg ? "replay" : "api";

const endpoint = (arg("endpoint") || DEFAULT_ENDPOINT).trim();
const apiKeyEnv = (arg("api-key-env") || DEFAULT_API_KEY_ENV).trim();
const modelId = (arg("model") || "").trim();

let apiKey: string | null = null;
let replayPath: string | null = null;
let replayModel: string | null = null;
let replayHeader: any = null;

if (mode === "replay") {
  replayPath = resolveInputPath(replayArg!);
  const replayLines = readFileSync(replayPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const parsedLines: any[] = replayLines.map((line, i) => {
    try {
      return JSON.parse(line);
    } catch {
      console.error(`Line ${i + 1} of ${replayPath} is not JSON. Nothing was written.`);
      process.exit(1);
    }
  });
  replayHeader = parsedLines.find((l) => l?.kind === "run-header") ?? null;
  replayModel = typeof replayHeader?.run?.model === "string" ? replayHeader.run.model : null;
} else if (mode === "api") {
  if (!modelId) {
    console.error(
      [
        "A live run needs --model=<model id>.",
        "",
        "The model name travels into the run header and from there into the report's method section.",
        "A measurement that cannot name what it measured is not a measurement, so this is an error",
        "rather than an empty field. For an offline proof of the chain use --dry-run or --replay.",
      ].join("\n")
    );
    process.exit(2);
  }
  apiKey = process.env[apiKeyEnv] ?? null;
  if (!apiKey) {
    console.error(
      [
        `A live run needs the API key in the environment variable ${apiKeyEnv}, which is not set.`,
        "",
        "THIS SCRIPT NEVER READS A KEY FROM A FILE, and never prints one. Set it for the single",
        "command that needs it, for example:",
        "",
        `  $env:${apiKeyEnv} = "<key>"   # this shell only`,
      ].join("\n")
    );
    process.exit(2);
  }
}

/** The model the header names: for a replay it is the recorded run's, for a dry run there is none. */
const effectiveModel = mode === "api" ? modelId : mode === "replay" ? replayModel : null;

/* ------------------------------------------------------------------ */
/* Mention detection                                                   */
/* ------------------------------------------------------------------ */

/**
 * The two flags a report is built on. Both use findMention() from lib/answer-check/rules.ts, so the
 * collector and the answer-check page agree on what a mention is - CJK as a substring, Latin on word
 * boundaries with hyphens inside the word.
 *
 * `mentionsCoatings` is the old field name, kept because build-visibility.mts reads it: its meaning is
 * "the answer mentions the client's own category vocabulary", which is what tells a reader that a
 * question WAS answered about this industry and the brand was simply not named. For the champion run
 * that vocabulary was the single word 涂料; here it is industry.category_terms from the intake, and
 * the header records the exact list so the report can print it instead of naming somebody else's
 * product word.
 */
function mentionsAny(answerLower: string, tokens: Token[]): boolean | null {
  if (tokens.length === 0) return null;
  return tokens.some((t) => findMention(answerLower, t.value) !== -1);
}

/* ------------------------------------------------------------------ */
/* The live call                                                       */
/* ------------------------------------------------------------------ */

const NOISE_URL = /volcsearch-sign|byteimg\.com|~tplv-obj/;

type CallResult = {
  ok: boolean;
  status: number | string;
  errorBody: string | null;
  ms: number;
  answer: string;
  domains: string[];
  usage: Record<string, unknown> | null;
  searchEvents: number;
  truncated: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const digestBody = (text: string) => text.replace(/\s+/g, " ").slice(0, 300);

/**
 * One call, streamed, with the per-call cap applied twice: on the request (AbortSignal.timeout, which
 * stops a body that never arrives) and on the read loop (a wall-clock deadline, which stops a stream
 * that keeps trickling). Both leave a partial answer behind on purpose - a truncated call is still
 * billed, so its tokens are recorded even though the answer is not usable.
 */
async function callOnce(question: string): Promise<CallResult> {
  const t0 = Date.now();
  const domains = new Set<string>();
  let answer = "";
  let usage: Record<string, unknown> | null = null;
  let searchEvents = 0;
  let completed = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const partial = (status: number | string, errorBody: string | null, truncated: boolean): CallResult => ({
    ok: false,
    status,
    errorBody,
    ms: Date.now() - t0,
    answer,
    domains: [...domains].sort(),
    usage,
    searchEvents,
    truncated,
  });

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: effectiveModel,
        input: [{ role: "user", content: [{ type: "input_text", text: question }] }],
        ...(webSearch ? { tools: [{ type: "web_search" }] } : {}),
        stream: true,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.status !== 200) {
      // The first probe discarded this and could only guess at the cause of six fast rejections.
      const body = await res.text().catch(() => "");
      return { ...partial(res.status, digestBody(body) || "(empty error body)", false), ms: Date.now() - t0 };
    }
    if (!res.body) {
      return partial("throw", "HTTP 200 without a response body", false);
    }

    reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const deadline = Date.now() + timeoutMs;

    outer: while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let event: any;
        try {
          event = JSON.parse(payload);
        } catch {
          continue;
        }
        const type = String(event?.type ?? "");
        if (type.startsWith("response.web_search_call")) searchEvents += 1;
        if (type === "response.output_text.delta" && typeof event.delta === "string") answer += event.delta;
        for (const m of JSON.stringify(event).matchAll(/https?:\/\/[^\s"'\\]+/g)) {
          if (NOISE_URL.test(m[0])) continue;
          try {
            domains.add(new URL(m[0]).hostname.replace(/^www\./, ""));
          } catch {
            /* a malformed URL inside a stream event is not worth failing the run over */
          }
        }
        const u = event?.response?.usage ?? event?.usage;
        if (u) usage = u;
        if (type === "response.completed") {
          completed = true;
          break outer;
        }
      }
    }

    await reader.cancel().catch(() => {});
    reader = null;

    if (completed && answer.length > 0) {
      return {
        ok: true,
        status: 200,
        errorBody: null,
        ms: Date.now() - t0,
        answer,
        domains: [...domains].sort(),
        usage,
        searchEvents,
        truncated: false,
      };
    }
    /**
     * The stream ended without a completed response, or completed with no text. The partial answer is
     * kept and the line is NOT ok: the report excludes it from every count, and the footer counts it.
     */
    return partial(
      Date.now() >= deadline ? "timeout" : "incomplete",
      completed
        ? "response.completed arrived with no output text"
        : `the stream ended after ${Date.now() - t0}ms without response.completed (the call was billed)`,
      answer.length > 0
    );
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const aborted = /abort/i.test(message) || (err instanceof Error && err.name === "TimeoutError");
    await reader?.cancel().catch(() => {});
    return partial(
      aborted ? "timeout" : "throw",
      aborted
        ? `per-call timeout after ${timeoutMs}ms (${message}); the call was billed`
        : message,
      answer.length > 0
    );
  }
}

/* ------------------------------------------------------------------ */
/* The replay source                                                   */
/* ------------------------------------------------------------------ */

type RecordedLine = {
  id?: string;
  q?: number;
  question?: string;
  run?: number;
  ok?: boolean;
  status?: number | string | null;
  errorBody?: string | null;
  ms?: number;
  domains?: string[] | null;
  usage?: Record<string, unknown> | null;
  answer?: string;
  attempts?: number;
  truncated?: boolean;
};

const replayIndex = new Map<string, RecordedLine>();
if (mode === "replay" && replayPath) {
  const lines = readFileSync(replayPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as RecordedLine);
  for (const line of lines) {
    if ((line as any).kind) continue;
    const key = `${String(line.id ?? line.q ?? "")}#${String(line.run ?? "")}`;
    replayIndex.set(key, line);
  }

  /**
   * THE WHOLE RECORDING IS CHECKED AGAINST THE BANK BEFORE ANYTHING IS WRITTEN.
   *
   * WHY HERE AND NOT IN THE LOOP THAT READS IT. A recorded answer only means something against the
   * question it answered. Discovering that at question 12 leaves a file containing a header and eleven
   * answers - partial output that a later run then refuses to overwrite and somebody has to reason about.
   * Checking every (id, run) up front makes the mismatch a refusal that writes nothing, which is the same
   * rule the bank generator follows: no file until every assertion passes.
   */
  for (const q of questions) {
    for (let r = 1; r <= runsPerQuestion; r += 1) {
      const hit = replayIndex.get(`${q.id}#${r}`) ?? replayIndex.get(`${q.q}#${r}`);
      if (!hit || hit.question === undefined || hit.question === q.text) continue;
      console.error(
        [
          `The replay file ${replayPath} answers a different question for id=${q.id} run=${r}:`,
          `  recorded: ${JSON.stringify(hit.question)}`,
          `  bank now: ${JSON.stringify(q.text)}`,
          "",
          "A recorded answer may only be replayed against the question it answered, so nothing was",
          "written. Regenerate the bank and re-measure, or replay the run file that belongs to this bank.",
        ].join("\n")
      );
      process.exit(1);
    }
  }
}

/* ------------------------------------------------------------------ */
/* The dry-run answer                                                  */
/* ------------------------------------------------------------------ */

/**
 * A synthetic answer, a pure function of the question text and the intake's category words.
 *
 * WHY IT ECHOES THE QUESTION. So that a brand-named question's synthetic answer contains the brand
 * name (the question does) and a category question's does not - which is what makes the offline chain
 * produce a reach number that is 0 for the no-brand groups, exactly as a real run often does. And
 * because the answer is built from the QUESTION rather than from the token list, running the same
 * bank with an edited intake visibly changes the mention counts: those counts depend on the intake,
 * not on the question.
 *
 * WHAT IT IS NOT. It is not a model answer, it is labelled as synthetic in the file and in the
 * report, and every line written from it carries `mode: "dry-run"` provenance through the header.
 */
function syntheticAnswer(text: string): string {
  const categories = categoryTokens.map((t) => t.value).join("、") || "（intake 未提供品类词）";
  return [
    "【dry-run 合成回答 · 未调用任何模型】",
    `问题原文：${text}`,
    `相关品类：${categories}`,
    "说明：这份回答由 scripts/report/run-bank.mts 在 --dry-run 模式下生成，只用于验证「题库 → 运行文件 → 报告」链路。它不是模型输出，不得用于任何对外结论。",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* The run                                                             */
/* ------------------------------------------------------------------ */

const bankBase = (bankPath.split(/[\\/]/).pop() ?? "bank").replace(/\.[a-z0-9]+$/i, "");
const languageSuffix = languages.length > 1 ? `-${language}` : "";
const labelArg = (arg("label") || "").trim();
const labelSuffix = labelArg ? `-${labelArg.replace(/[^a-zA-Z0-9._-]+/g, "-")}` : "";
const runFileName = `${bankBase}${languageSuffix}${labelSuffix}.jsonl`;
mkdirSync(outDir, { recursive: true });
const runPath = join(outDir, runFileName);
if (existsSync(runPath) && !force) {
  console.error(
    [
      `Refusing to write over an existing run file: ${runPath}`,
      "",
      "Appending a second measurement to the first one's file silently doubles every denominator:",
      "the report reads lines, and 174 lines of a 3-run measurement is indistinguishable from 87",
      "lines of a 6-run one. Pass --label=<name> to keep both runs side by side, or --force to",
      "replace this one.",
    ].join("\n")
  );
  process.exit(2);
}

const scriptSha256 = createHash("sha256").update(readFileSync(SCRIPT_PATH)).digest("hex");

const header = {
  kind: "run-header",
  schema: SCHEMA,
  collector: {
    script: SCRIPT_REL,
    version: COLLECTOR_VERSION,
    script_sha256: scriptSha256,
    started_at: startedAt,
  },
  run: {
    mode,
    /** null in a dry run: nothing was called, and naming a model would be a false claim. */
    model: effectiveModel,
    model_source:
      mode === "api"
        ? "--model on the command line"
        : mode === "replay"
          ? `the run header of the replay source ${replayPath}`
          : "not applicable: --dry-run called no model",
    date,
    runs_per_question: runsPerQuestion,
    web_search: webSearch,
    language,
    out_file: runPath,
    endpoint: mode === "api" ? endpoint : null,
    api_key_env: mode === "api" ? apiKeyEnv : null,
    timeout_ms: timeoutMs,
    attempts_per_run: maxAttempts,
    gap_ms: gapMs,
    backoff_ms: backoffMs,
    /** Where the answers came from, in one word, so no reader has to infer it. */
    answers_source:
      mode === "api"
        ? "live API calls"
        : mode === "replay"
          ? `replayed from ${replayPath}`
          : "synthesised locally from the question text (dry run)",
  },
  bank: {
    kind: String(bankMeta.kind),
    path: bankPath,
    sha256: bankSha256,
    version: bankMeta.version ?? null,
    generated_at: bankMeta.generated_at ?? null,
    generated_on: bankMeta.generated_on ?? null,
    fingerprint: recordedFingerprint || null,
    fingerprint_rule: bankMeta.fingerprint_rule ?? null,
    /** true only when this script re-computed the fingerprint from the bank's own questions. */
    fingerprint_verified: ruleMatches && computedFingerprint === recordedFingerprint,
    fingerprint_recomputed: computedFingerprint,
    generator: bankMeta.generator ?? null,
    approval: {
      approved_by: String(bankMeta.approval?.approved_by ?? ""),
      approved_on: String(bankMeta.approval?.approved_on ?? ""),
      frozen_note: String(bankMeta.approval?.frozen_note ?? ""),
      expected_approver_from_intake: String(bankMeta.approval?.expected_approver_from_intake ?? ""),
    },
    totals: bankMeta.totals ?? null,
    archetypes,
    questions: questions.map((q) => ({ q: q.q, id: q.id, group: q.group, text: q.text })),
    /**
     * WHICH QUESTIONS ASK ABOUT THE BRAND'S OWN NAME SPELLINGS, and which spelling each one asks about.
     * The bank records its slot bindings with the intake field they came from, so this is read rather
     * than guessed: the report's entity section is about exactly these questions, and when the intake
     * lists no short name, alias or former name, that list is empty and the report says the question
     * was never asked instead of pretending the model got it right.
     *
     * WHY THE `fact` GROUP AND NOT EVERY QUESTION THAT MENTIONS A SHORT NAME. "X 和 Y 哪个更省事？" also
     * contains the short name, but it tests a preference between two companies, not whether the name
     * resolves to a legal entity - and counting it as an identity question would put a comparison's
     * answer into the "did the name connect to the entity" pie. The fallback exists so a bank whose
     * archetype ids changed does not silently lose the whole section.
     */
    name_questions: (() => {
      const NAME_SLOTS = ["short_name", "alias", "former_name"];
      const withNameSlots = questions.flatMap((q) =>
        Object.entries(q.slots)
          .filter(
            ([slot, v]) =>
              NAME_SLOTS.includes(slot) && typeof v?.value === "string" && v.value.trim().length > 0
          )
          .map(([slot, v]) => ({
            q: q.q,
            id: q.id,
            group: q.group,
            text: q.text,
            slot,
            value: String(v.value).trim(),
          }))
      );
      const identity = withNameSlots.filter((n) => n.group === "fact");
      return identity.length > 0 ? identity : withNameSlots;
    })(),
  },
  intake: { ...intakeRead, client: intakeClient },
  brand: {
    name: brandName,
    /** Every spelling a mention may match, with the intake field each came from. */
    tokens: brandTokens,
    tokens_source: brandTokensSource,
    /** Spellings this bank asks about that the intake no longer lists (an edited intake). */
    bank_tokens_not_in_intake: bankTokensNotInIntake,
  },
  category_tokens: categoryTokens,
  competitors: competitorTokens,
  mentions: {
    brand_rule:
      "the answer contains the brand name or one of its aliases: CJK names as substrings (no word boundaries exist), Latin names on word boundaries with hyphens inside the word (lib/answer-check/rules.ts findMention)",
    category_rule:
      "the answer contains any of category_tokens (the intake's industry.category_terms plus subcategory); null when the intake has none",
    competitor_rule:
      "per line, mentionsCompetitors lists the names from the intake's competitors.names that this answer contains, matched with the same rule as the brand name; null when the intake named none. It is a list, not a boolean, because which competitor was recommended is the finding",
  },
};

writeFileSync(runPath, `${JSON.stringify(header)}\n`, "utf8");

console.log(`bank        ${bankPath}`);
console.log(`fingerprint ${recordedFingerprint || "(none)"}${ruleMatches ? (computedFingerprint === recordedFingerprint ? "  verified" : "  MISMATCH") : "  rule not implemented, not verified"}`);
console.log(`intake      ${intakeRead.resolved_path ?? "(not available)"}${intakeRead.sha256_matches === false ? "  CHANGED since the bank was generated" : ""}`);
console.log(`brand       ${brandName}  (${brandTokens.length} spelling(s) from ${brandTokensSource})`);
console.log(`questions   ${questions.length}  (${archetypes.map((a) => `${a.label} ${questions.filter((q) => q.group === a.id).length}`).join(", ")})`);
console.log(`runs        ${runsPerQuestion} per question = ${questions.length * runsPerQuestion} runs`);
console.log(`mode        ${mode}${mode === "api" ? `  model ${effectiveModel}  web_search ${webSearch}` : ""}`);

if (shouldPrint) {
  for (const q of questions) console.log(`${q.id}\t${q.text}`);
}

const footer = {
  calls: { attempted: 0, completed: 0, failed: 0, timeouts: 0, truncated: 0, replay_missing: 0, note: "" },
  tokens_total: 0,
  lines: 0,
};

function backoffFor(attempt: number, ms: number): number {
  const base = ms < FAST_REJECT_MS ? FAST_REJECT_PAUSE_MS : backoffMs;
  return Math.min(base * 2 ** attempt, 30_000);
}

let replayMatches = 0;
let replayMisses = 0;

for (const question of questions) {
  const answerLowerOf = (text: string) => text.toLowerCase();
  let questionAttempts = 0;

  const record = (
    run: number,
    ok: boolean,
    status: number | string | null,
    errorBody: string | null,
    ms: number,
    answer: string,
    domains: string[],
    usage: Record<string, unknown> | null,
    attempts: number,
    truncated: boolean
  ) => {
    const line = {
      /** The bank's own question id: what the request, the report row and a re-test refer to. */
      id: question.id,
      q: question.q,
      /** The bank's archetype id, not a string typed into a probe. */
      group: question.group,
      question: question.text,
      run,
      ok,
      status,
      errorBody,
      ms,
      attempts,
      questionAttempts,
      truncated,
      mentionsBrand: ok ? mentionsAny(answerLowerOf(answer), brandTokens) : null,
      /** Whether the answer names the LEGAL name, or only a short form / alias. See the entity section. */
      mentionsPrimary: ok ? (brandName ? findMention(answerLowerOf(answer), brandName) !== -1 : null) : null,
      mentionsCoatings: ok ? mentionsAny(answerLowerOf(answer), categoryTokens) : null,
      /**
       * WHICH competitors this answer recommends, not merely whether it recommends any of them. A
       * boolean would answer "some competitor was named"; the client needs the names, because that
       * is what a share-of-voice table is. Matched with findMention, the same rule the brand uses.
       */
      mentionsCompetitors: ok
        ? competitorTokens.filter((t) => findMention(answerLowerOf(answer), t.value) !== -1).map((t) => t.value)
        : null,
      domains: domains ?? [],
      usage: usage ?? null,
      answer,
    };
    footer.lines += 1;
    const tokens = Number((usage as any)?.total_tokens ?? 0);
    if (Number.isFinite(tokens)) footer.tokens_total += tokens;
    appendFileSync(runPath, `${JSON.stringify(line)}\n`, "utf8");
    process.stdout.write(
      `${question.id.padEnd(6)} r${run} ${ok ? "ok    " : "FAIL  "} ${String(ms).padStart(7)}ms ` +
        `attempts=${attempts} brand=${line.mentionsBrand === null ? "?" : line.mentionsBrand ? "YES" : "no "} ` +
        `cat=${line.mentionsCoatings === null ? "?" : line.mentionsCoatings ? "yes" : "no "} ` +
        `src=${String((domains ?? []).length).padStart(2)} comp=${line.mentionsCompetitors === null ? "?" : line.mentionsCompetitors.length} tok=${tokens}` +
        `${truncated ? " TRUNCATED" : ""}${ok ? "" : ` status=${String(status)}`}\n`
    );
    if (!ok && errorBody) process.stdout.write(`         body: ${errorBody.slice(0, 200)}\n`);
  };

  for (let run = 1; run <= runsPerQuestion; run += 1) {
    if (mode === "dry-run") {
      const answer = syntheticAnswer(question.text);
      record(run, true, 200, null, 0, answer, ["dry-run.invalid"], {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        note: "dry run: no call was made, so no tokens were billed",
      }, 0, false);
      continue;
    }

    if (mode === "replay") {
      const hit = replayIndex.get(`${question.id}#${run}`) ?? replayIndex.get(`${question.q}#${run}`);
      if (!hit) {
        replayMisses += 1;
        footer.calls.replay_missing += 1;
        record(
          run,
          false,
          "replay-missing",
          `the replay file has no record for id=${question.id} q=${question.q} run=${run}`,
          0,
          "",
          [],
          null,
          0,
          false
        );
        continue;
      }
      /**
       * THE RECORDED QUESTION TEXT MUST MATCH. A recorded answer to a DIFFERENT question is the case a
       * replay must refuse: the bank was regenerated or edited, the recording describes the old
       * question, and reusing it would attach an answer to a question it never answered.
       */
      if (hit.question !== undefined && hit.question !== question.text) {
        console.error(
          [
            `The replay file ${replayPath} answers a different question for id=${question.id} run=${run}:`,
            `  recorded: ${JSON.stringify(hit.question)}`,
            `  bank now: ${JSON.stringify(question.text)}`,
            "",
            "A recorded answer may only be replayed against the question it answered. Regenerate the",
            "bank and re-measure, or replay the run file that belongs to this bank.",
          ].join("\n")
        );
        process.exit(1);
      }
      replayMatches += 1;
      const attempts = Number.isFinite(Number(hit.attempts)) ? Number(hit.attempts) : 0;
      questionAttempts += attempts;
      record(
        run,
        hit.ok === true && typeof hit.answer === "string" && hit.answer.length > 0,
        hit.status ?? (hit.ok === true ? 200 : null),
        hit.errorBody ?? null,
        Number(hit.ms ?? 0),
        typeof hit.answer === "string" ? hit.answer : "",
        Array.isArray(hit.domains) ? hit.domains : [],
        hit.usage ?? null,
        attempts,
        hit.truncated === true
      );
      continue;
    }

    /* --- the live path ------------------------------------------------- */
    const t0 = Date.now();
    let result: CallResult | null = null;
    let used = 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      used = attempt;
      questionAttempts += 1;
      footer.calls.attempted += 1;
      result = await callOnce(question.text);
      if (result.ok) {
        footer.calls.completed += 1;
        break;
      }
      footer.calls.failed += 1;
      if (result.status === "timeout") footer.calls.timeouts += 1;
      if (result.truncated) footer.calls.truncated += 1;
      console.warn(
        `      attempt ${attempt}/${maxAttempts} failed in ${result.ms}ms status=${result.status}` +
          `${(result.ms ?? 0) < FAST_REJECT_MS ? " (fast reject)" : " (slow/timeout)"}`
      );
      if (attempt < maxAttempts) await sleep(backoffFor(attempt - 1, result.ms));
    }
    record(
      run,
      Boolean(result?.ok),
      result?.status ?? null,
      result?.errorBody ?? null,
      result?.ms ?? Date.now() - t0,
      result?.answer ?? "",
      result?.domains ?? [],
      result?.usage ?? null,
      used,
      result?.truncated ?? false
    );
    if (gapMs > 0 && !(question.q === questions.length && run === runsPerQuestion)) await sleep(gapMs);
  }
}

if (mode === "replay" && replayMatches === 0) {
  console.error(
    `\nThe replay file ${replayPath} matched none of the bank's ${questions.length} questions. ` +
      "Nothing usable was written; delete the file or replay the recording that belongs to this bank."
  );
  process.exit(1);
}

footer.calls.note =
  mode === "api"
    ? "attempted counts every HTTP call, including retries; a truncated call is billed and is counted in truncated as well as failed"
    : mode === "replay"
      ? "replayed lines cost nothing; attempted counts the attempts the ORIGINAL run recorded"
      : "a dry run makes no calls, so every count here is 0 and every answer line is synthetic";

appendFileSync(runPath, `${JSON.stringify({ kind: "run-footer", finished_at: new Date().toISOString(), ...footer })}\n`, "utf8");

console.log(
  `\nlines ${footer.lines}  tokens ${footer.tokens_total}` +
    (mode === "api" ? `  calls attempted ${footer.calls.attempted} completed ${footer.calls.completed} failed ${footer.calls.failed} timeouts ${footer.calls.timeouts}` : "") +
    (mode === "replay" ? `  replayed ${replayMatches}  missing ${replayMisses}` : "")
);
console.log(`wrote ${runPath}`);
if (isInside(REPO, outDir)) {
  console.warn(
    "\nWARNING: --allow-in-repo was used. This file names the client, quotes their questions and carries\n" +
      "the model's answers about them. Do not commit it."
  );
}
console.log(
  `\nnext: npm run report:visibility -- --answers=${runPath}` +
    (mode === "api" && effectiveModel ? "" : "   (the header already names the model, the date, the runs and the web-search state)")
);
