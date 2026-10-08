#!/usr/bin/env node
/**
 * Build a client-facing AI-VISIBILITY report from MEASURED AI ANSWERS.
 *
 * WHAT THIS IS. The sibling of build-report.mts, and deliberately not a flag on it. build-report.mts
 * turns a live scan of one domain into a technical GEO diagnosis; this turns a file of recorded
 * answers to questions put to a model into a visibility report. Same product, different input, and
 * the two must not be able to run as each other.
 *
 * ---------------------------------------------------------------------------------------------
 * WHAT CHANGED, AND WHY (the hardcoded-client defect this report used to have)
 * ---------------------------------------------------------------------------------------------
 * The first version of this file was written against ONE dataset: the answers a throwaway probe
 * collected by asking ten literal questions about one coatings company. The brand's spellings
 * (["冠军股份","冠军科技","冠军漆","鲸海漆"]), the group names (category/ambig/fact), the entity
 * analysis (which patterns in which answer meant the model had guessed the wrong company), the quote
 * excerpts and the claims table were all literals in this file, and the model name had to be handed in
 * again on the command line because the answers file recorded none of it.
 *
 * Every one of those was a property of that ONE client, and the failure mode was not a crash: run it
 * for a second client and the report would still print 冠军股份, still say 涂料, still call a question
 * "Q6" and still claim the model had confused the brand with a Hong Kong listed company. A report that
 * describes the wrong company is worse than no report, and nothing in the pipeline objected - which is
 * the same failure the question-bank generator was written to prevent, one step earlier.
 *
 * So the client-specific layer is now DATA, written by scripts/report/run-bank.mts into the first line
 * of the run file:
 *
 *   run-header       the bank path, its fingerprint, its questions and their archetypes, WHO approved
 *                    the bank and WHEN, the brand's name and every alias with the intake field each
 *                    came from, the model, the date, the runs per question and whether web search was
 *                    on. This file reads all of that from the header, so --model-name is no longer a
 *                    hand-passed flag for anything but a headerless legacy file.
 *   answer lines     one per (question, run), carrying the bank's own `id` and `group`, the mention
 *                    flags the collector computed, the domains, the token usage and the answer text.
 *
 * A headerless file still works (the old run files exist and are evidence), but then the identity has
 * to be supplied by hand - --brand, --model-name and --web-search - and the report says the provenance
 * is missing rather than inventing it.
 *
 * ---------------------------------------------------------------------------------------------
 * THE FIRST SECTION IS THE QUESTION BANK PAGE, NOT A CONCLUSION
 * ---------------------------------------------------------------------------------------------
 * intake/README.md's three-step process says the client approves the bank before anything is measured,
 * and that "the report's first section says who approved it". A reader has to be able to see WHAT WAS
 * ASKED before seeing what was found: a reach count is uninterpretable until you know which questions
 * produced it, and the frozen-bank rule (no question may be added, removed, reworded or reordered after
 * approval) is what makes two measurements comparable at all. So section one prints the bank's
 * fingerprint, its generator, the intake it came from, the approval record, and every question grouped
 * by the bank's own archetype.
 *
 * ---------------------------------------------------------------------------------------------
 * THE STRUCTURE IS BORROWED FROM A REFERENCE DOCUMENT; THE WORDS ARE NOT
 * ---------------------------------------------------------------------------------------------
 * The section order below follows an external deliverable the owner supplied (read with python-docx
 * for its outline and table shapes):
 *
 *   one-page overview -> executive summary -> entity / brand fact base -> measurement design ->
 *   visibility overview -> breakdown by engine or group -> competitor pressure -> source network ->
 *   source detail -> fact claims and gaps -> fact governance -> verbatim answer evidence ->
 *   recommendations -> 90-day plan -> appendix (scoring) -> appendix (sampling, coding, limits) ->
 *   full question bank -> sources and verification record
 *
 * WHY THE ORDER IS COPIED AND THE PROSE IS NOT. The structure is a professional convention - it is the
 * order a client reads a diagnostic in - and following it is what makes this document usable without a
 * second explanation. The prose is somebody else's deliverable: reproducing it would be an authorship
 * and licensing problem for a product that is meant to be shipped, and worse, that document's numbers
 * are SYNTHESISED (it says so itself: fixed seeds and preset counts, no platform was called). Copying
 * its sentences would make this report claim simulations as measurements.
 *
 * WHERE THIS REPORT DELIBERATELY PARTS COMPANY WITH IT, section by section, so the mapping can be
 * checked rather than taken on trust:
 *
 *   its score out of 100        -> the reach count. No score exists here; the appendix titled 为什么
 *                                 这份报告没有综合评分 says why, and the one figure has an integer
 *                                 0-N axis instead of a 0-100 one.
 *   its per-platform breakdown  -> the breakdown by the BANK'S archetypes. One model was measured, not
 *                                  four, so splitting by "engine" would be four copies of one column.
 *   its brand fact base and      -> the entity section and the claims list. That document could print
 *   "product and scenario"         a fact table because the client supplied material for it; this
 *                                  dataset has no client-supplied facts, so the equivalent sections
 *                                  print what the ANSWERS asserted and label every line unverified.
 *   its "fact error list"       -> a claims list, not an error list. Nothing here establishes that any
 *                                  assertion is wrong, and calling an unverified claim an error would
 *                                  be the same fabrication in the other direction.
 *   its competitor pressure     -> 竞品：本次没有测量. The section is kept because a reader looks for
 *                                  it; it says the measurement does not exist rather than filling a
 *                                  table with something that is not one.
 *   its source network + detail -> the source section, with the caveats that make the order a fact
 *                                  about the answers (how often a domain was linked) and not a ranking.
 *   its 90-day plan             -> 复测计划, written as recommendations with countable acceptance,
 *                                  never as a forecast.
 *   its scoring appendix        -> 附录：为什么这份报告没有综合评分, the honest version of deleting it.
 *
 * ---------------------------------------------------------------------------------------------
 * THE HONESTY RULES THIS FILE EXISTS TO KEEP
 * ---------------------------------------------------------------------------------------------
 * 1. COUNTS, NEVER PERCENTAGES. Three runs cannot support a percentage; "2 of 3 runs" is the only form
 *    this pipeline is allowed to print. That is why no string in the copy block below contains a "%"
 *    character and why the figures have integer run axes. `assertNoPercent()` fails the run if a
 *    "数字%" pattern ever reaches the model.
 * 2. THE METHOD IS IN THE DOCUMENT: model, date, web search enabled, runs per question, and that these
 *    are same-day observations from one model. All four now come from the run header, and `modelSource`
 *    / `dateSource` record that they came from the collector's own record rather than from a flag
 *    somebody typed at build time.
 * 3. VERBATIM QUOTES ARE VERBATIM, AND ATTRIBUTED. The excerpts are extracted from the answers at build
 *    time, never typed; only Markdown emphasis and heading markers are removed, and every excerpt's
 *    caption says so.
 * 4. WHAT WAS NOT MEASURED IS STATED: no competitor, no sentiment, no source ranking, one model, one
 *    day, API answers rather than what a browser would show.
 * 5. ok === false IS NEVER A ZERO. The rejected calls are counted, described and excluded; a question
 *    with no completed run renders "未测量" rather than 0.
 * 6. EVERY NUMBER IN THE PROSE IS COMPUTED from the answers, and the claims list asserts that its
 *    quoted evidence is present in the run it cites - a claim with a citation that no longer matches
 *    stops the build instead of reaching a client.
 * 7. A MISSING INPUT DEGRADES LOUDLY. No aliases in the intake means the entity section says the
 *    question was never asked, not that the model named the company correctly. No claims with numbers
 *    means the claims section says so rather than printing a table of nothing. No category vocabulary
 *    means the 品类词 column is 未测量 rather than a row of zeros.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THE DATA IS FILTERED BEFORE ANYTHING ELSE
 * ---------------------------------------------------------------------------------------------
 * A run file can contain failed calls: HTTP rejections with an empty `answer` and null mention flags.
 * A report built over them would count "the brand was not mentioned" for every rejection - a fabricated
 * finding produced by a rate limit. So the filter is the first statement in this file's logic, and the
 * rejected lines are reported in the document rather than silently dropped.
 *
 * Usage:
 *
 *   npm run report:visibility -- --answers=..\clients\runs\acme-2026-10-07.jsonl
 *
 *   --answers       required (--run is accepted as an alias). The JSONL written by
 *                   scripts/report/run-bank.mts: a run-header line, one line per answer, an optional
 *                   run-footer line. A relative path is resolved against this repository and then
 *                   against the workspace above it.
 *   --model-name    the model id, for a file with NO run-header. With a header this is checked against
 *                   the header when given, and never required.
 *   --brand         the measured company's name, for a file with NO run-header (whose aliases it must
 *                   also carry, via --alias).
 *   --alias         one alias per flag, for a file with NO run-header.
 *   --web-search    yes|no, for a file with NO run-header (the header carries it otherwise).
 *   --slug          ASCII slug for the output directory.
 *   --date          measurement date; defaults to the header's, then to the filename's YYYY-MM-DD.
 *   --out           output directory; defaults to reports/ai-visibility-<slug>-<date>.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findMention } from "../../lib/answer-check/rules.ts";
import { COPY_EN } from "./report-copy-en.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const WORKSPACE = resolve(REPO, "..");

/* ------------------------------------------------------------------ */
/* Arguments                                                          */
/* ------------------------------------------------------------------ */

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const argsOf = (name: string): string[] =>
  process.argv.filter((a) => a.startsWith(`--${name}=`)).map((a) => a.slice(name.length + 3));

const answersArg = arg("answers") || arg("run");

if (!answersArg) {
  console.error(
    [
      "Usage:",
      "  npm run report:visibility -- --answers=<run file.jsonl> [--slug=<ascii-slug>] [--out=DIR]",
      "",
      "  --answers   the JSONL written by scripts/report/run-bank.mts (--run is an alias). It starts",
      "              with a `kind: run-header` line that carries the model, the date, the runs per",
      "              question, the web-search state and the question bank - so none of those has to be",
      "              passed in by hand, and the report's first section can print what was asked.",
      "",
      "              A file WITHOUT a header (the old probe's output) still renders, but then the",
      "              identity has to come from the command line: --model-name, --brand, --alias,",
      "              --web-search. The report says the provenance is missing rather than inventing it.",
    ].join("\n")
  );
  process.exit(2);
}

/**
 * --answers resolves against the repository first and the workspace second, because run files
 * deliberately live OUTSIDE this repository: they quote a client, name a client, and `reports/` is
 * ignored for exactly that reason. The workspace above the repo is where runs are kept, so both
 * `clients/runs/x.jsonl` and an absolute path work, and a typo fails loudly below instead of producing
 * an empty report from an empty file.
 */
function resolveInput(p: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(p) || p.startsWith("/")) return p;
  const inRepo = resolve(REPO, p);
  if (existsSync(inRepo)) return inRepo;
  return resolve(WORKSPACE, p);
}

const answersPath = resolveInput(answersArg);
if (!existsSync(answersPath)) {
  console.error(`--answers points at ${answersPath}, which does not exist.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* The run file: header, answers, footer                              */
/* ------------------------------------------------------------------ */

type RunLine = {
  kind?: string;
  id?: string;
  q: number;
  group: string;
  question: string;
  run: number;
  ok: boolean;
  status: number | string | null;
  errorBody: string | null;
  ms: number;
  attempts?: number;
  questionAttempts?: number;
  truncated?: boolean;
  mentionsBrand: boolean | null;
  mentionsPrimary?: boolean | null;
  mentionsCoatings: boolean | null;
  /** Which of the intake's named competitors this answer recommends. Absent on files written before
   *  the collector marked them; null when the answer was not usable. */
  mentionsCompetitors?: string[] | null;
  domains: string[];
  usage: Record<string, any> | null;
  answer: string;
};

type RunHeader = {
  kind: "run-header";
  schema?: number;
  collector?: { script?: string; version?: number; script_sha256?: string; started_at?: string };
  /**
   * The intake's named competitors, as the collector recorded them. Declared here rather than read
   * through a cast so the shape is in one place: the collector writes either bare strings or
   * {value} objects depending on where it read them from, and the report accepts both.
   */
  competitors?: (string | { value?: string })[] | null;
  run?: {
    mode?: string;
    model?: string | null;
    model_source?: string;
    date?: string;
    runs_per_question?: number;
    web_search?: boolean;
    language?: string;
    out_file?: string;
    endpoint?: string | null;
    api_key_env?: string | null;
    timeout_ms?: number;
    attempts_per_run?: number;
    gap_ms?: number;
    backoff_ms?: number;
    answers_source?: string;
  };
  bank?: {
    kind?: string;
    path?: string;
    sha256?: string;
    version?: number | string | null;
    generated_at?: string | null;
    generated_on?: string | null;
    fingerprint?: string | null;
    fingerprint_rule?: string | null;
    fingerprint_verified?: boolean | null;
    fingerprint_recomputed?: string | null;
    generator?: { script?: string; version?: number; script_sha256?: string; git_commit?: string | null } | null;
    approval?: {
      approved_by?: string;
      approved_on?: string;
      frozen_note?: string;
      expected_approver_from_intake?: string;
    } | null;
    totals?: Record<string, any> | null;
    archetypes?: {
      id: string;
      label: string;
      short: string;
      measures: string;
      target: number;
      generated: number;
      status: string;
    }[];
    questions?: { q: number; id: string; group: string; text: string }[];
    name_questions?: { q: number; id: string; group: string; text: string; slot: string; value: string }[];
  };
  intake?: {
    requested_path?: string;
    resolved_path?: string | null;
    sha256_expected?: string | null;
    sha256_actual?: string | null;
    sha256_matches?: boolean | null;
    client?: string;
    note?: string;
  };
  brand?: {
    name?: string;
    tokens?: { value: string; field: string }[];
    tokens_source?: string;
    bank_tokens_not_in_intake?: { value: string; field: string }[];
  };
  category_tokens?: { value: string; field: string }[];
};

type RunFooter = {
  kind: "run-footer";
  finished_at?: string;
  calls?: {
    attempted?: number;
    completed?: number;
    failed?: number;
    timeouts?: number;
    truncated?: number;
    replay_missing?: number;
    note?: string;
  };
  tokens_total?: number;
  lines?: number;
};

const rawLines = readFileSync(answersPath, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim().length > 0);

const parsedAll: RunLine[] = rawLines.map((line, i) => {
  try {
    return JSON.parse(line) as RunLine;
  } catch {
    console.error(`Line ${i + 1} of ${answersPath} is not JSON. Nothing was written.`);
    process.exit(1);
  }
});

const header: RunHeader | null = (parsedAll.find((l) => l.kind === "run-header") as RunHeader) ?? null;
const footer: RunFooter | null = (parsedAll.find((l) => l.kind === "run-footer") as RunFooter) ?? null;
const parsed = parsedAll.filter((l) => l.kind === undefined || l.kind === "");
const parsedLines = parsed.length;

/**
 * THE FILTER. Everything downstream reads `answers`, and `rejected` exists only to be described.
 *
 * WHY IT IS THE FIRST STATEMENT. Including a rejected line adds a row whose mention flags are null and
 * whose answer is empty, which a renderer turns into another "not mentioned" outcome and a headline
 * that is wrong in the direction of bad news.
 */
const answers = parsed.filter((r) => r.ok === true);
const rejected = parsed.filter((r) => r.ok !== true);

if (answers.length === 0) {
  console.error(
    `${answersPath} has ${parsedLines} answer line(s) and none of them has ok === true. ` +
      "There is nothing measured to report, and an empty report is not a report."
  );
  process.exit(1);
}
if (answers.some((r) => !r.answer || r.answer.trim().length === 0)) {
  console.error(
    "A line marked ok === true has an empty answer. That is a contradiction in the input, not a zero " +
      "mention: it would be counted as 'the brand was not mentioned' when nothing was read."
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Identity: the brand, its aliases, the model, the date              */
/* ------------------------------------------------------------------ */

/**
 * THE BRAND COMES FROM THE RUN HEADER, which got it from the intake the bank records. This is the point
 * of the whole pipeline: the previous version of this file carried one company's four spellings as a
 * literal, so it could only ever describe that company.
 */
const headerBrandTokens = (header?.brand?.tokens ?? [])
  .filter((t) => typeof t?.value === "string" && t.value.trim().length > 0)
  .map((t) => ({ value: t.value.trim(), field: String(t.field ?? "") }));

const brandArg = (arg("brand") || "").trim();
const aliasArgs = argsOf("alias").map((a) => a.trim()).filter(Boolean);

if (!header && !brandArg) {
  console.error(
    [
      `${answersPath.split(/[\\/]/).pop()} has no run-header, so the measured brand cannot be read from it.`,
      "",
      "Pass --brand=<legal name> (and --alias=<name> for each other spelling the intake lists, plus",
      "--model-name and --web-search). Mention detection is defined as 'the answer contains the brand",
      "or one of its aliases': with no names every count would be zero for a reason that is not about",
      "the model.",
    ].join("\n")
  );
  process.exit(2);
}

const brandTokens: { value: string; field: string }[] = header
  ? headerBrandTokens
  : [{ value: brandArg, field: "--brand" }, ...aliasArgs.map((a) => ({ value: a, field: "--alias" }))];

if (brandTokens.length === 0) {
  console.error(
    `${answersPath} has a run-header but it records no brand spellings, so nothing can be matched. ` +
      "Re-run the measurement with scripts/report/run-bank.mts, which takes them from the intake."
  );
  process.exit(1);
}
const BRAND = header?.brand?.name?.trim() || brandArg || brandTokens[0].value;

/**
 * THE CATEGORY VOCABULARY, from the run header (which took it from the intake's
 * industry.category_terms). It is what the 品类词 column counts, and it is declared here - before the
 * per-question facts are built - because "was this column measurable at all" decides whether that column
 * carries a count or 未测量. See coatingsOrNull().
 */
const categoryTokensForReport = (header?.category_tokens ?? []).filter(
  (t) => typeof t?.value === "string" && t.value.trim().length > 0
);
/** False when the intake lists no category terms: the 品类词 column is then NOT MEASURED, not zero. */
const hasCategoryTokens = categoryTokensForReport.length > 0;

const modelName = (arg("model-name") || "").trim();
const headerModel = (header?.run?.model ?? "").toString().trim();
if (modelName && headerModel && modelName !== headerModel) {
  console.error(
    [
      `--model-name=${modelName} contradicts the run header, which records ${headerModel}.`,
      "",
      "The header is the collector's own record of what was called; a flag passed to this script is not",
      "evidence about the measurement. Refusing rather than picking one: a report that names the wrong",
      "model describes a measurement nobody made.",
    ].join("\n")
  );
  process.exit(2);
}

/**
 * THE MODEL, AS THE DOCUMENT PRINTS IT. A headerless file needs --model-name. A dry run has no model at
 * all and says so in those words - naming one would be the fabrication this whole section exists to
 * prevent.
 */
const runMode = header?.run?.mode ?? "unknown";
const modelDisplay = headerModel
  ? headerModel
  : runMode === "dry-run"
    ? "未调用模型（dry-run 合成回答）"
    : runMode === "replay"
      ? "未调用模型（本次为回放上一次运行的记录）"
      : modelName || "";
if (!modelDisplay) {
  console.error(
    [
      `${answersPath.split(/[\\/]/).pop()} has no run-header and --model-name was not given.`,
      "",
      "The document cannot state what was measured without it, and a visibility report that cannot name",
      "its model is worse than no report: the reader has no way to know what the counts describe.",
    ].join("\n")
  );
  process.exit(2);
}

const modelSource = headerModel
  ? `运行文件 run-header 的 run.model（由采集脚本 ${header?.collector?.script ?? "scripts/report/run-bank.mts"} 写入）`
  : runMode === "dry-run" || runMode === "replay"
    ? `运行文件 run-header 的 run.mode=${runMode}：本次没有调用模型`
    : "--model-name（运行文件没有 run-header）";

const fileNameDate = (answersPath.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
const measuredOn = (arg("date") || header?.run?.date || fileNameDate || "").trim();
if (!measuredOn) {
  console.error(
    [
      `No date: ${answersPath} has no YYYY-MM-DD in its name, its header carries none and --date was not given.`,
      "The measurement date is part of the method paragraph; an undated report cannot be compared with a",
      "re-test.",
    ].join("\n")
  );
  process.exit(1);
}
const dateSource = arg("date")
  ? "--date on the command line"
  : header?.run?.date
    ? "运行文件 run-header 的 run.date（由采集脚本写入）"
    : `数据文件名 ${answersPath.split(/[\\/]/).pop()}`;

const webSearch = header
  ? header.run?.web_search === true
  : (() => {
      const raw = (arg("web-search") || "").trim().toLowerCase();
      if (raw === "yes" || raw === "no") return raw === "yes";
      console.error(
        [
          `${answersPath.split(/[\\/]/).pop()} has no run-header, so whether web search was enabled cannot be read from it.`,
          "",
          "Pass --web-search=yes or --web-search=no. This is a claim about how the answers were produced,",
          "and the report prints it as fact; guessing it (the previous version assumed 'yes') is how a",
          "method section starts describing a run configuration nobody used.",
        ].join("\n")
      );
      process.exit(2);
    })();

/**
 * The output directory slug is ASCII and separate from the brand on purpose: the brand is often Chinese,
 * a directory name derived from it by stripping non-ASCII characters would be empty, and a report
 * directory called `ai-visibility--2026-10-06` is one nobody can find again.
 *
 * SOURCES, IN THIS ORDER: --slug, then the brand if it happens to be ASCII, then the run filename with
 * its date removed. The run filename fallback is what makes the documented command line work with no slug
 * argument at all.
 */
function asciiSlug(text: string): string {
  return text
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

const slug = (arg("slug") || asciiSlug(BRAND) || asciiSlug(answersPath.split(/[\\/]/).pop() ?? "")).toLowerCase();
if (!slug) {
  console.error(
    [
      "No output-directory slug could be derived: --slug is empty, --brand has no ASCII characters and",
      `${answersPath.split(/[\\/]/).pop()} yields nothing either.`,
      "Pass an ASCII --slug.",
    ].join("\n")
  );
  process.exit(2);
}

const outDir = resolve(REPO, arg("out") || join("reports", `ai-visibility-${slug}-${measuredOn}`));
mkdirSync(outDir, { recursive: true });

const generatedAt = new Date().toISOString();
const stamp = generatedAt.slice(0, 10);

/* ------------------------------------------------------------------ */
/* The taxonomy: the bank's archetypes, not this file's own strings   */
/* ------------------------------------------------------------------ */

/**
 * The groups come from the run header, which copied them from the bank. A headerless file is grouped by
 * the `group` values its lines carry, with the group id as its own label: no fallback to a
 * ["category","ambig","fact"] constant, because that constant is one client's three groups and printing
 * "行业问题（不含品牌名）" over somebody else's questions is exactly the defect this rewrite removes.
 */
const headerArchetypes = header?.bank?.archetypes ?? [];
const observedGroups: string[] = [];
for (const r of answers) if (!observedGroups.includes(r.group)) observedGroups.push(r.group);

const groupOrder = observedGroups.length > 0 ? observedGroups : headerArchetypes.map((a) => a.id);

type GroupMeta = { id: string; label: string; short: string; measures: string; target: number; generated: number; status: string };
const groupMeta: GroupMeta[] = groupOrder.map((id) => {
  const fromHeader = headerArchetypes.find((a) => a.id === id);
  return {
    id,
    label: fromHeader?.label ?? id,
    short: fromHeader?.short ?? id,
    measures: fromHeader?.measures ?? "",
    target: Number(fromHeader?.target ?? 0),
    generated: Number(fromHeader?.generated ?? 0),
    status: String(fromHeader?.status ?? ""),
  };
});

/* ------------------------------------------------------------------ */
/* The bank page: what was asked, and who approved it                 */
/* ------------------------------------------------------------------ */

const bankQuestions = (
  header?.bank?.questions ??
  answers.map((r) => ({ q: r.q, id: r.id ?? `Q${r.q}`, group: r.group, text: r.question }))
).map((q) => ({
  q: Number(q.q),
  id: String(q.id),
  group: String(q.group),
  text: String(q.text),
  namesBrand: brandTokens.some((t) => findMention(String(q.text).toLowerCase(), t.value) !== -1),
}));

const nameQuestions = header?.bank?.name_questions ?? [];

/**
 * The bank's provenance, as rows, so the two renderers print the same labels and the same numbers. The
 * DOCX and the Markdown are two renderings of one model; composing these sentences in Python would give
 * the same fact two authors.
 */
const bankApprovedBy = (header?.bank?.approval?.approved_by ?? "").trim();
const bankApprovedOn = (header?.bank?.approval?.approved_on ?? "").trim();
const intakeExpectedApprover = (header?.bank?.approval?.expected_approver_from_intake ?? "").trim();
const frozenNote = (header?.bank?.approval?.frozen_note ?? "").trim();
const bankFingerprint = (header?.bank?.fingerprint ?? "").trim();
const bankGenerator = header?.bank?.generator
  ? `${header.bank.generator.script ?? "?"} · v${header.bank.generator.version ?? "?"}` +
    (header.bank.generator.script_sha256 ? ` · script sha256 ${String(header.bank.generator.script_sha256).slice(0, 12)}` : "")
  : "";
const intakeDrift =
  header?.intake?.sha256_matches === false
    ? `注意：intake 在题库生成之后被改过（题库记录 ${header.intake.sha256_expected}，文件现在是 ${header.intake.sha256_actual}）。` +
      "本次提问用的仍是题库里的原题面（题面按指纹冻结），但品牌名与别名的判定用的是文件当前内容：" +
      `题库里还在问、而 intake 已经不再列出的写法是 ${(header.brand?.bank_tokens_not_in_intake ?? []).map((t) => t.value).join("、") || "（没有）"}。` +
      "两次测量的判定口径不同时，数字不能直接并列。"
    : "";

/**
 * The tail of a path, for anything a client reads.
 *
 * A paid report must not print the operator's home directory. `C:\Users\<name>\...` leaks the
 * machine, the OS account and the directory layout, and none of it helps the reader: the last two
 * segments are enough to find the file, and the sha256 next to it is what proves identity.
 */
function displayPath(p: string | null | undefined): string {
  if (!p) return "";
  const parts = String(p).split(/[\\/]/).filter(Boolean);
  return parts.slice(-2).join("/");
}

const bankPageRows: [string, string][] = header
  ? [
      ["题库文件", displayPath(header.bank?.path)],
      [
        "题库指纹（sha256，题面清单）",
        `${bankFingerprint || "（题库没有记录指纹）"}` +
          (header.bank?.fingerprint_verified === true
            ? "　✓ 采集脚本按 bank.fingerprint_rule 重算并核对通过"
            : header.bank?.fingerprint_verified === false
              ? "　✗ 与重算结果不一致"
              : "　（未核对：bank.fingerprint_rule 不是本采集脚本实现的规则）"),
      ],
      ["指纹规则", header.bank?.fingerprint_rule ?? "（未记录）"],
      ["题库生成器", bankGenerator || "（未记录）"],
      ["题库生成日期", String(header.bank?.generated_on ?? header.bank?.generated_at ?? "（未记录）")],
      [
        "来源 intake",
        `${displayPath(header.intake?.resolved_path) || "（未记录）"}` +
          (header.intake?.sha256_actual ? `　sha256 ${header.intake.sha256_actual}` : "") +
          (header.intake?.sha256_matches === true
            ? "　✓ 与题库记录一致"
            : header.intake?.sha256_matches === false
              ? "　✗ 与题库记录不一致（题库生成后被改过）"
              : "　（题库未记录 intake 哈希）"),
      ],
      ["批准人 / 批准日期", bankApprovedBy ? `${bankApprovedBy}　${bankApprovedOn || "（未写日期）"}` : "（空：题库还没有人签字）"],
      ["intake 里填写的确认人", intakeExpectedApprover || "（intake 未填）"],
      ["本次运行的语言 / 题数", `${header.run?.language ?? "?"}　${bankQuestions.length} 题`],
      [
        "本次运行的文件",
        `${displayPath(answersPath)}　（第 1 行是采集脚本写入的 provenance 头，共 ${parsedLines} 条回答记录${rejected.length > 0 ? `、${rejected.length} 条失败记录` : ""}）`,
      ],
    ]
  : [
      ["题库文件", "（这份运行文件没有 run-header，所以没有题库路径）"],
      ["题库指纹", "（未记录：本次运行由没有 provenance 头的采集脚本写入）"],
      ["批准人 / 批准日期", "（未记录）"],
      ["来源 intake", "（未记录）"],
      ["题目来源", `按每行 answer 的 group 字段分组；共 ${bankQuestions.length} 题`],
      ["本次运行的文件", `${displayPath(answersPath)}　（共 ${parsedLines} 条回答记录${rejected.length > 0 ? `、${rejected.length} 条失败记录` : ""}）`],
    ];

/* ------------------------------------------------------------------ */
/* The answers                                                        */
/* ------------------------------------------------------------------ */

const runsPerQuestion = Math.max(
  Number(header?.run?.runs_per_question ?? 0) || 0,
  Math.max(...answers.map((r) => r.run))
);

const questionIds = [...new Set(answers.map((r) => r.q))].sort((a, b) => a - b);
const byQuestion = new Map<number, RunLine[]>();
for (const r of answers) {
  if (!byQuestion.has(r.q)) byQuestion.set(r.q, []);
  byQuestion.get(r.q)!.push(r);
}
for (const list of byQuestion.values()) list.sort((a, b) => a.run - b.run);

const totalTokens = answers.reduce((s, r) => s + (r.usage?.total_tokens ?? 0), 0);
const webSearchCalls = answers.reduce((s, r) => s + (r.usage?.tool_usage?.web_search ?? 0), 0);
const citationEvents = answers.reduce((s, r) => s + (r.domains?.length ?? 0), 0);
const answerLengths = answers.map((r) => r.answer.length);

const attemptsFromLines =
  answers.reduce((s, r) => s + Number(r.attempts ?? 0), 0) + rejected.reduce((s, r) => s + Number(r.attempts ?? 0), 0);
const attemptsTotal = footer?.calls?.attempted ?? attemptsFromLines;
const timeoutsTotal = footer?.calls?.timeouts ?? [...answers, ...rejected].filter((r) => r.status === "timeout").length;
const truncatedTotal = footer?.calls?.truncated ?? [...answers, ...rejected].filter((r) => r.truncated === true).length;

/* ------------------------------------------------------------------ */
/* The measured facts, as numbers this file computes                  */
/* ------------------------------------------------------------------ */

type QuestionFact = {
  q: number;
  id: string;
  group: string;
  groupShort: string;
  question: string;
  namesBrand: boolean;
  okRuns: number;
  failedRuns: number;
  runs: number;
  brandMentions: number;
  /** null when the run recorded no category vocabulary: NOT MEASURED, never 0. See coatingsOrNull(). */
  coatingsMentions: number | null;
  primaryMentions: number;
  runMarks: string[];
};

/** How many per-run columns the report prints. Three is what the DOCX table's geometry has room for. */
const RUN_COLUMNS = 3;

/**
 * WHICH LANGUAGE THE REPORT IS WRITTEN IN - AND IT IS RESOLVED BEFORE ANYTHING THAT READS IT.
 *
 * This switch has now been moved twice, both times because a line above it read `lang` and node
 * refused at run time with "Cannot access 'lang' before initialization". The first move put it above
 * the copy dictionary and left the group metadata below it; the second put it above the group
 * metadata and left two legend words below it. TypeScript caught the second and not the first, and
 * the first was worse than an error: the report never rendered while the comparison against a
 * missing file reported zero differences, so a broken build looked like a passing check.
 *
 * The lesson is positional, not stylistic: this constant belongs above EVERY use, so it sits here,
 * before the model source, the legend words, the group metadata and the copy dictionary - and any
 * new language-dependent value must be added below this line rather than above it.
 *
 * Default comes from the run header, so an English bank produces an English report with no flag.
 */
type ReportLang = "zh" | "en";
const langFlag = (arg("lang") || "").trim().toLowerCase();
const headerLang = (header?.run?.language ?? "").trim().toLowerCase();
const lang: ReportLang =
  langFlag === "zh" || langFlag === "en"
    ? langFlag
    : headerLang === "en" || headerLang === "zh"
      ? headerLang
      : "zh";

// These two are interpolated into the per-run legend, so hardcoding them in Chinese put Chinese in
// an English sentence.
const COPY_NOT_MEASURED = lang === "en" ? "not measured" : "未测量";
const COPY_NOT_RUN = lang === "en" ? "not run" : "未运行";

/**
 * A COLUMN THAT WAS NOT MEASURED IS null, NOT 0, and this is the one place where that decision is made.
 *
 * WHY IT MATTERS: the 品类词 mention count answers "was this answer demonstrably about the client's
 * industry". When the intake lists no category terms there is nothing to match, and printing "0 / 3" per
 * question would read as "the model never talked about this industry" - a finding produced by a missing
 * input. null travels into the model, the DOCX, the workbook and the Markdown as 未测量.
 */
const coatingsOrNull = (count: number): number | null => (hasCategoryTokens ? count : null);

const questions: QuestionFact[] = questionIds.map((q) => {
  const list = byQuestion.get(q)!;
  const sample = list[0];
  const bankRecord = bankQuestions.find((b) => b.q === q);
  const group = sample.group;
  const meta = groupMeta.find((g) => g.id === group);
  const marks = Array.from({ length: RUN_COLUMNS }, (_, i) => {
    const runNo = i + 1;
    if (runNo > runsPerQuestion) return COPY_NOT_RUN;
    const r = list.find((x) => x.run === runNo);
    if (!r) return COPY_NOT_MEASURED;
    return r.mentionsBrand ? "✓" : "—";
  });
  return {
    q,
    id: bankRecord?.id ?? sample.id ?? `Q${q}`,
    group,
    groupShort: meta?.short ?? group,
    question: sample.question,
    namesBrand: bankRecord?.namesBrand ?? brandTokens.some((t) => findMention(sample.question.toLowerCase(), t.value) !== -1),
    okRuns: list.length,
    failedRuns: rejected.filter((r) => r.q === q).length,
    runs: runsPerQuestion,
    brandMentions: list.filter((r) => r.mentionsBrand === true).length,
    coatingsMentions: coatingsOrNull(list.filter((r) => r.mentionsCoatings === true).length),
    primaryMentions: list.filter((r) => primaryMentionOf(r) === true).length,
    runMarks: marks,
  };
});

/** A question "names the brand" when its own text carries one of the brand's spellings. */
const nonBrandQuestions = questions.filter((q) => !q.namesBrand);
const promptedQuestions = questions.filter((q) => q.namesBrand);

/*
 * THE GROUP SHORT LABELS ARE CHINESE IN BOTH BANKS, AND THAT IS NOT A TRANSLATION PROBLEM.
 * run-bank.mts writes `short` from a hardcoded table (ARCHETYPE_SHORT), so an English bank still
 * records "品类" and the report prints it in the group rows, the source breakdown and the by-group
 * counts - which is why several translated paragraphs kept failing the language check. The four
 * archetype ids are fixed and known, so the English label is looked up here rather than re-collected:
 * every run file already on disk carries the Chinese one, and re-running the measurement to fix a
 * label would be the wrong price for it.
 */
const ARCHETYPE_SHORT_EN: Record<string, string> = {
  category: "Category",
  scenario: "Scenario",
  comparison: "Comparison",
  fact: "Fact",
};

const groups = groupOrder
  .map((id) => {
    const inGroup = questions.filter((q) => q.group === id);
    const meta = groupMeta.find((g) => g.id === id)!;
    return {
      id,
      label: meta.label,
      short: lang === "en" ? (ARCHETYPE_SHORT_EN[meta.id] ?? meta.short) : meta.short,
      purpose: meta.measures,
      questions: inGroup.length,
      runs: inGroup.reduce((s, q) => s + q.okRuns, 0),
      brandMentions: inGroup.reduce((s, q) => s + q.brandMentions, 0),
      coatingsMentions: coatingsOrNull(inGroup.reduce((s, q) => s + (q.coatingsMentions ?? 0), 0)),
      namesBrand: inGroup.some((q) => q.namesBrand),
    };
  })
  .filter((g) => g.questions > 0);

const totals = {
  runs: questions.reduce((s, q) => s + q.okRuns, 0),
  brandMentions: questions.reduce((s, q) => s + q.brandMentions, 0),
  coatingsMentions: coatingsOrNull(questions.reduce((s, q) => s + (q.coatingsMentions ?? 0), 0)),
  primaryMentions: questions.reduce((s, q) => s + q.primaryMentions, 0),
  nonBrandQuestions: nonBrandQuestions.length,
  nonBrandRuns: nonBrandQuestions.reduce((s, q) => s + q.okRuns, 0),
  nonBrandBrandMentions: nonBrandQuestions.reduce((s, q) => s + q.brandMentions, 0),
  nonBrandCoatingsMentions: coatingsOrNull(nonBrandQuestions.reduce((s, q) => s + (q.coatingsMentions ?? 0), 0)),
  promptedQuestions: promptedQuestions.length,
  promptedRuns: promptedQuestions.reduce((s, q) => s + q.okRuns, 0),
  promptedBrandMentions: promptedQuestions.reduce((s, q) => s + q.brandMentions, 0),
};

/** The questions in the no-brand groups that were never mentioned - the reach findings. */
const zeroMentionNonBrand = nonBrandQuestions.filter((q) => q.brandMentions === 0);
const mentionedNonBrand = nonBrandQuestions.filter((q) => q.brandMentions > 0);

/**
 * THE 品类词 CELL, in one function for both the Markdown tables and the model: "3 / 3" when the column was
 * measured, 未测量 when the run recorded no category vocabulary. A cell that prints "0 / 3" for a column
 * nobody could measure is the fabricated finding this whole pipeline is built to avoid, and one function is
 * how the two renderers cannot format it differently.
 */
const coatingsCell = (mentions: number | null, runs: number): string =>
  mentions === null ? COPY_NOT_MEASURED : `${mentions} / ${runs}`;

/* ------------------------------------------------------------------ */
/* Verbatim excerpts - extracted, never typed                         */
/* ------------------------------------------------------------------ */

/**
 * Markdown emphasis and heading markers out, nothing else.
 *
 * WHY THIS IS THE ONLY EDIT PERMITTED. The finding is about the model's own words, so the words have to be
 * the model's. `**` and a leading `#` are transport formatting that the answer text carries because it was
 * written as Markdown; keeping them in a Word table would print asterisks at a client, and deleting them
 * by hand is how a quote stops being a quote. The rule is applied to every excerpt by this one function,
 * and every excerpt's caption says so.
 */
function plain(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The opening of an answer, cut at the last line break before `limit` characters. */
function headOf(text: string, limit: number): string {
  if (text.length <= limit) return text.trim();
  const cut = text.slice(0, limit);
  const at = cut.lastIndexOf("\n");
  return (at > 0 ? cut.slice(0, at) : cut).trim();
}

/**
 * A cut excerpt that ends on a section label ("补充信息：") loses that label, because the material it
 * labels is exactly what the cut removed - the words end up promising content that is not there.
 */
function trimTrailingLabel(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 1) {
    const last = lines[lines.length - 1].trim();
    if (last && last.length <= 16 && last.endsWith("：")) {
      lines.pop();
      while (lines.length > 1 && !lines[lines.length - 1].trim()) lines.pop();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

/**
 * The two lines that carry an answer's conclusion: its first non-empty line, and the next one - unless
 * that next line is only a label, in which case it says nothing on its own and is dropped. An answer that
 * restates the question and puts its conclusion on the following line as a heading would lose the
 * conclusion if only the first line were quoted.
 */
function conclusionExcerpt(answer: string): string {
  const lines = answer
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const head = lines[0] ?? "";
  const second = lines[1] ?? "";
  const secondIsOnlyALabel = second.endsWith("：") && second.length <= 16;
  return plain(!second || secondIsOnlyALabel ? head : `${head}\n${second}`);
}

function firstRun(q: number): RunLine {
  const list = byQuestion.get(q);
  if (!list || list.length === 0) throw new Error(`question ${q} has no completed run`);
  return list[0];
}

function runOf(q: number, n: number): RunLine {
  const hit = byQuestion.get(q)?.find((r) => r.run === n);
  if (!hit) throw new Error(`question ${q} has no completed run ${n}`);
  return hit;
}

/* ------------------------------------------------------------------ */
/* Copy                                                               */
/* ------------------------------------------------------------------ */

/**
 * Every human-readable string in this report, and the reason it lives here rather than in the Python
 * renderer: the Markdown and the DOCX are rendered by two different programs, and a heading that exists in
 * only one of them is how the two documents start disagreeing about what a section is.
 *
 * NO STRING BELOW CONTAINS A "%" CHARACTER, which is a rule rather than a coincidence - see
 * assertNoPercent() at the end of this block. Numbers are written as "几次运行里几次".
 *
 * NOTHING BELOW NAMES A CLIENT, A BRAND, A QUESTION ID OR AN INDUSTRY WORD. Everything that varies per
 * client arrives through {placeholders} filled from the run header, or through the data-derived blocks
 * built above (quotes, claims, advice). That is the property this file lost once already.
 */
const COPY_ZH: Record<string, string> = {
  reportName: "AI 可见度报告",
  footer: "AI 可见度报告",
  tableItem: "项目",
  tableValue: "结果",

  kSubject: "被测量的公司",
  kModel: "模型",
  kRunMode: "采集模式",
  kMeasuredOn: "测量日期",
  kWebSearch: "联网搜索",
  kRunsPerQuestion: "每题运行次数",
  kAnswersFile: "数据文件",
  kCompleted: "完成的回答 / 文件总行数",
  kExcluded: "被排除的行",
  kTokens: "总 token 用量",
  kSearchCalls: "联网搜索调用次数",
  kCitations: "引用事件 / 出现过的域名",
  kGeneratedAt: "本报告生成日期",
  kHeadline: "标题数字",
  yes: "是",
  no: "否",
  notMeasured: "未测量",
  notRun: "未运行",

  thTotal: "合计",
  thGroup: "问法原型",
  thQuestions: "题数",
  thRuns: "完成的运行次数",
  thBrand: "品牌提及",
  thCoatings: "品类词提及",
  thNo: "题号",
  thId: "题库 id",
  thText: "问题原文",
  thQuestion: "问题",
  thRun: "运行",
  thExcerpt: "该次回答的开头（原文摘录）",
  thDomain: "域名",
  thCount: "引用事件次数",
  thWhere: "出现在哪些组",
  thClaim: "回答里的断言",
  thSource: "出现在",
  thHandling: "本报告的处理",
  thField: "字段",
  thMeaning: "含义",
  thUsage: "本报告如何使用",
  thStage: "阶段",
  thWork: "建议的工作",
  thOutput: "可验收的成果",
  thRun1: "第 1 次",
  thRun2: "第 2 次",
  thRun3: "第 3 次",
  thPurpose: "这一组在测什么",
  runLabel: "第 {n} 次运行",

  /**
   * Section 一. THE BANK PAGE, FIRST, BEFORE ANY CONCLUSION.
   *
   * WHY THIS SECTION LEADS. intake/README.md's step 2 says the client approves the bank, and the
   * frozen-bank rule is what makes two measurements comparable; a reader who sees a reach count before
   * seeing the questions has no way to know what was measured. The bank's own frozen sentence
   * (bank.frozen_note, written by build-question-bank.mts) is printed verbatim rather than paraphrased
   * here, because the wording the client signed is the wording that binds.
   */
  sectionBank: "一、本次问的是什么：题库与批准记录",
  bankLead:
    "报告里的每一个数字都从下面这些问题来，所以先看问的是什么。本次运行使用的是 {bankLanguage} 题库，" +
    "共 {bankQuestions} 题，按题库自己的问法原型分 {bankGroups} 组；题面清单的 sha256 指纹是 {bankFingerprint}。" +
    "指纹相同 = 问的是同一批问题；指纹不同 = 两次测量的数字不能直接并列。",
  bankFrozen: "{bankFrozenSentence}",
  bankApprovalLine: "{bankApprovalSentence}",
  bankIntakeDrift: "{bankDriftSentence}",
  bankQuestionsTitle: "题库原文：{bankQuestions} 题，按问法原型分组",

  sectionSummary: "二、执行摘要",
  summaryCallout:
    "结论一句话：{nonBrandRuns} 次不含品牌名的问题运行里，{BRAND} 被提及 {nonBrandMentions} 次。",
  sectionSummaryConclusions: "三层结论",
  summaryReach: "{summaryReachBody}",
  summaryEntity: "{summaryEntityBody}",
  summaryFacts: "{summaryFactsBody}",

  sectionCoverage: "本次测量覆盖了什么",
  coverageLead:
    "一次测量，一个模型，{questionCount} 道问题，每题 {runsPerQuestion} 次运行，共 {runs} 次完成的回答。" +
    "分组不是修辞：不含品牌名的问题测触达，含品牌名的问题测实体理解与事实准确度，两者的分母不同，不能相加，所以下表按组分列。",
  coverageNote: "{coverageNoteBody}",

  sectionNotMeasured: "本次没有测量什么",
  sectionOverview: "三、AI 可见度总览",
  overviewLead: "{overviewLeadBody}",
  overviewTotals:
    "合计：{runs} 次完成的回答里品牌被提及 {brandRuns} 次。这个总数里有 {promptedRuns} 次是问题本身就带着品牌名的，那些运行里品牌出现几乎是必然的。",
  overviewPrompted:
    "把点名的问题去掉之后只剩 {nonBrandRuns} 次运行，品牌被提及 {nonBrandMentions} 次，也就是 {nonBrandMentions} / {nonBrandRuns}。" +
    "这个 {nonBrandMentions} / {nonBrandRuns} 才是这份报告的主数字：它更接近一个陌生客户在行业问题里遇到这家公司的机会。",

  sectionHowToRead: "结果应该怎么读",
  readCounts:
    "每个数字都写成『几次运行里几次』。本报告不出现百分比：{runsPerQuestion} 次运行算出来的比例会把一次运行的偶然差异放大成一个结论。",
  readPrompted:
    "『品牌提及』在点名品牌的那几组里几乎是必然的，因为问题里就带着品牌名。那几组只能说明模型能把名字对上公司，不能说明陌生客户会遇到它。",
  readDenominator:
    "分母永远是该题真正完成的运行次数。某题少一次运行，分母就少 1；一次都没完成，单元格写『未测量』而不是 0。本次 {questionCount} 道题的目标分母是每题 {runsPerQuestion} 次。",
  readSameDay:
    "全部 {runs} 次回答是 {measuredOn} 同一天、同一次测量里的观测；本次的模型是 {model}。换一天、换一个模型版本或关掉联网搜索，数字都可能不同。",

  sectionEntity: "四、实体识别：回答怎么称呼这家公司",
  entityLead: "{entityLeadBody}",
  sectionEntityRuns: "同一道题、各次运行的结论",
  entityRunsLead: "{entityRunsLeadBody}",
  entityFinding: "{entityFindingBody}",
  entityConclusionRule: "{entityConclusionRuleBody}",
  entityConclusionLine: "{entityConclusionLineBody}",

  sectionGroups: "五、按问法原型拆解",
  groupsLead:
    "{groupCount} 组问题测的是不同的事，任何一组单独拿出来都会被误读：只看不含品牌名的组会低估模型对公司的了解，只看点名品牌的组会高估陌生客户的触达。",

  sectionCompetitors: "六、竞品：谁在被推荐",
  competitorsCallout:
    "在 {nonBrandRuns} 次不含品牌名的运行里，{BRAND} 被提及 {nonBrandMentions} 次；被推荐最多的是 {compTopName}（{compTopCount} 次）。",
  competitorsLead:
    "下表按客户在 intake 里点名的竞品逐家计数，写法同样是『几次运行里几次』。第一列是不含品牌名的问题里的次数——那一列才是份额，因为那些问题里没有任何提示；第二列是全部问题里的次数。",
  competitorsBody:
    "判定规则：答案文本里出现该竞品名字即计 1 次，匹配方式与品牌名相同（拉丁名字按词边界、CJK 名字按子串，规则在 lib/answer-check/rules.ts）。名字用的是客户在 intake 里自己写的写法——写成一个没人这么叫的官方全称，就会记成 0 次，那 0 是写法的效果，不是这家竞品没有被推荐。",
  competitorsNote:
    "本表只统计客户点名的 {compCount} 家。回答里还会提到别的厂商，本报告没有对它们计数，也不据此对任何一家作判断。",
  competitorsNone1: "没有被测量的竞品，就没有可以写进表格的竞品数字。本报告不填占位符：空白和 0 都会被读成一个结论。",
  competitorsNone2: "回答里确实提到了很多其他厂商。那是回答的正文，不是本报告的测量对象：本报告没有对它们计数，也不据此对任何一家作判断。",
  competitorsNone3:
    "如果下一次要竞品对比，就在 intake 的 competitors.names 里写出 3–5 个对手名，再用同一份题库跑同样的 {runsPerQuestion} 次；只有那样得到的数字才能和本次的数字放在一起看。",
  thCompName: "竞品",
  thCompNonBrand: "不含品牌名的问题里",
  thCompAll: "全部问题里",
  thCompGroups: "分组分布",
  sheetCompetitors: "竞品提及",

  sectionSources: "七、信源网络：回答引用了哪些域名",
  sourcesLead:
    "{runs} 次回答合计 {citationEvents} 次引用事件，分布在 {distinctDomains} 个域名上（一次回答里同一个域名只算 1 次，跨回答重复引用分别计数）。" +
    "按组看：{citationsByGroup}。下表是按出现次数排序的前 {domainLimit} 个域名；出现最多的是 {topDomain}（{topDomainCount} 次）。",
  sourcesNote:
    "本报告不判定这些域名的权威性，也不判定它们与公司的关系（{topDomain} 与其他域名一样，归属关系未经核验）。这个表是『回答引用了哪些域名』的分布，不是影响力排名，也不是外链建设清单。",
  sectionSourcesCaveat: "三个必须说清的口径",
  sourcesCaveat1: "引用次数不等于影响力。某个域名出现得多，只说明回答里链接它的次数多，不说明它更权威，也不说明模型更看重它。",
  sourcesCaveat2: "一次回答里同一个域名只算 1 次，跨回答重复引用分别计数。所以这是『引用事件』的分布，不是『独立来源』的数量。",
  sourcesCaveat3: "本报告没有做『客户是否已经出现在这些域名上』的对照。那需要企业先提供它现有的公开存在清单，本次没有这个输入。",

  sectionClaims: "八、回答里的事实断言：本报告没有核验",
  claimsCallout:
    "下表每一条都出现在模型的回答里，本报告没有核验任何一条。这不是『AI 说错了』的清单，而是『引用之前先核实』的清单。",
  claimsNote: "{claimsNoteBody}",

  sectionQuotes: "九、典型回答原文摘录",
  quotesLead:
    "下面每一段都注明题库 id、运行次数与所属问法原型，取自数据文件，逐字摘录；只去掉 Markdown 的加粗与标题标记，文字与标点未改动。",
  quoteQuestion: "问题：",
  quoteAnswer: "回答摘录：",

  sectionAdvice: "十、建议",
  adviceLead:
    "下面几条是从本次测量直接读出来的，不是通用建议。它们都不承诺效果：本报告没有测量任何竞品，也没有测量内容上线后会发生什么。",
  adviceProblem: "问题：",
  adviceAction: "建议的动作：",
  adviceDeliverable: "交付：",
  adviceAcceptance: "验收：",

  sectionPlan: "复测计划",
  planNote:
    "这是建议的节奏，不是承诺。复测能回答的是『同一批问题、同一模型下，逐题计数有没有变化』；它不能回答『投入换来了提及』。" +
    "两次复测之间不要比较『总体上升』，要看哪几道题从 0 变成 1。复测必须使用同一份题库（指纹 {bankFingerprint}），否则数字不可比。",

  sectionNoScore: "附录：为什么这份报告没有综合评分",
  noScoreLead: "参照的那份外部交付物用一个百分制加权评分开头。本报告不给评分，也不给百分比。原因有四条。",
  noScore1:
    "{runsPerQuestion} 次运行不足以支撑一个比例。同一道题的答案长度从 {minAnswerChars} 字到 {maxAnswerChars} 字不等，一次运行的差异就会被读成一个分数。",
  noScore2:
    "评分需要权重，而这份数据没有校准权重的依据。那份外部文件的输入是按预设规则合成的 400 条记录，可以按设计分配权重；本次是 {runs} 条记录（采集模式 {runModeLabel}），没有第二组数据可以校准。",
  noScore3: "分数会被当成结论去比较，而这份报告没有测量任何对手。一个没有对照的分数只会被读成『好』或『差』，两种读法都没有依据。",
  noScore4: "本报告给的是计数和原文，任何人都可以自己复算：每一道题的每一次运行、每次的引用域名和完整回答都在数据文件里。",

  sectionMethodAppendix: "附录：采样设计、方法与限制",
  sectionSampleDesign: "样本设计",
  sampleDesignLead:
    "{questionCount} 道问题分 {groupCount} 组，同一批问题对同一个模型各跑 {runsPerQuestion} 次。题库指纹 {bankFingerprint}；分组是题库自己的问法原型，不是报告事后划的。",

  sectionGeneration: "这份报告的生成方法",
  sectionCoding: "标注字段口径",
  sectionReplication: "复测建议",
  replication1:
    "同一批 {questionCount} 道题、同一模型版本、每题 {runsPerQuestion} 次、{webSearchSentence}，尽量在同一天内完成，每次新会话。",
  replication2: "记录模型版本、日期、是否开启搜索、原始回答与引用域名。失败的行单独记下来：它们不是 0 次提及，而是没有测量。",
  replication3: "对照两次复测时看逐题计数，不看『总体变化』。如果要把次数提高，那是一次新的采集：分母变了，两次的数字不能直接并列。",

  sectionQuestions: "附录：完整题库与逐次标注",
  questionsLead: "{questionsLeadBody}",

  sectionProvenance: "资料来源与核验记录",

  sheetOverview: "总览",
  sheetQuestions: "逐题计数",
  sheetGroups: "分组合计",
  sheetBank: "题库与批准",
  sheetDomains: "引用域名",
  sheetClaims: "事实断言",
  sheetQuotes: "原文摘录",
  sheetMeta: "元数据",
  sheetAbout: "说明与边界",

  /**
   * The figures. Every caption says what n is and that its labels are counts, because a chart is the one
   * place where a reader can divide two numbers and arrive at a percentage nobody measured. The captions
   * are inside assertNoPercent() below, and render-report.py refuses to draw a "%" in any of these figures.
   */
  figGroups:
    "图 1｜分组建模：{groupCount} 组问题各自的品牌提及次数。标签为次数，n = 每组完成的运行次数（{groupRuns}）。各组的分母不同，所以分母写在每一个标签里。",
  figGroupsAxis: "提及次数（每组运行次数不同）",
  figMentions:
    "图 2｜逐题提及：每一道题里品牌被提及的运行次数。标签为次数，n = 每题完成的运行次数（{runsPerQuestion}）；横轴是 0 到 {runsPerQuestion} 次。",
  figMentionsAxis: "提及次数（每题 {runsPerQuestion} 次运行）",
  figEntity:
    "图 3｜名字与主体：点名了简称/别名/曾用名的 {entityQuestions} 道题、共 {entityTotalRuns} 次运行里，回答有没有引用到客户自己的域名（{BRAND}）。标签为次数，n = {entityTotalRuns}。分类规则写在图下方与正文里，逐条都能在原文里核对。",
  figEntitySame: "引用到客户自己的域名 {entitySameConclusion} 次",
  figEntityNotSame: "没有引用到客户自己的域名 {notSameRuns} 次",
  figEntityN: "n = {entityTotalRuns}（{entityQuestions} 道名字题的各次运行）",
  figSources:
    "图 4｜信源分布：回答引用次数最多的 {domainLimit} 个域名。标签为次数（引用事件次数），n = {citationEvents} 次引用事件、{distinctDomains} 个域名；另有 {otherDomains} 个域名合计 {otherEvents} 次引用事件未逐一列出。排序是引用事件的计数顺序，不是影响力排名。",
  figSourcesAxis: "引用事件次数",
};

/**
 * THE COPY THE REPORT ACTUALLY PRINTS: English merged over Chinese when the report is English.
 *
 * A key missing from COPY_EN silently falls back to the Chinese string, and that is deliberate - it
 * is the failure mode the authored-prose check below exists to catch, and catching it there turns a
 * forgotten key into a failed build rather than a document with two languages in it.
 */
const COPY: Record<string, string> = lang === "en" ? { ...COPY_ZH, ...COPY_EN } : COPY_ZH;

/**
 * The rule from the service definition, enforced instead of remembered.
 *
 * A percentage in this report would be a number no measurement supports. The check is deliberately crude -
 * a digit followed by "%" - because every honest sentence in this document writes counts ("4 / 12",
 * "12 次运行里 4 次"), so anything matching is a violation rather than a false positive. It runs over the
 * whole copy block before a single file is written.
 */
function assertNoPercent(copy: Record<string, string>): void {
  for (const [key, value] of Object.entries(copy)) {
    if (/\d\s*%/.test(value)) {
      throw new Error(`Copy key "${key}" contains a percentage, which this report may not print: ${value}`);
    }
  }
}
assertNoPercent(COPY);

/* ------------------------------------------------------------------ */
/* The entity section: was the name connected to the legal entity?    */
/* ------------------------------------------------------------------ */

/**
 * WHAT THIS SECTION MEASURES, GENERICALLY. The bank asks a few questions about the brand's short name, its
 * aliases and its former names ("『X』是哪家公司？") whenever the intake listed them. Those are the
 * questions where a model has to resolve a name to a legal entity, and the failure is visible in the
 * answer text: does the answer connect the asked name to the LEGAL name at all?
 *
 * THE CLASSIFICATION IS ONE DETERMINISTIC RULE, printed wherever its counts are printed: a run counts as
 * "connected to the legal entity" when its answer contains the intake's brand.name, and as "not connected"
 * when it does not. It is checkable by eye in the quoted runs, and the slices are asserted to cover every
 * completed run of those questions (a pie whose slices do not add up to n is a chart of a classification
 * nobody made).
 *
 * WHY THIS REPLACED THE OLD VERSION. The old section was about one company's four spellings and one
 * specific confusion with a Hong Kong listed company, with the patterns that decided the classification
 * typed into this file. That is a finding, not a rule; it could only ever describe that company.
 */
function primaryMentionOf(r: RunLine): boolean | null {
  if (typeof r.mentionsPrimary === "boolean") return r.mentionsPrimary;
  // A file written before that field existed: derive it from the answer text with the same matcher.
  return r.answer ? findMention(r.answer.toLowerCase(), BRAND) !== -1 : null;
}

const nameQuestionIds = new Set(nameQuestions.map((n) => n.id));
const nameQuestionFacts = questions.filter((q) => nameQuestionIds.has(q.id));
const entityRunsTotal = nameQuestionFacts.reduce((s, q) => s + q.okRuns, 0);

/**
 * WHAT "CONNECTED TO THE ENTITY" MEANS, AND WHY IT IS NOT "THE LEGAL NAME APPEARED".
 *
 * The first version of this section counted a run as connected when the answer CONTAINED the legal
 * name. On the first real measurement that produced 6 of 6 — while four of those six answers said in
 * their own words that they could not find the company at all, and one attributed the name to a
 * different company entirely. A count that reads as "the model knows you" while the model is saying
 * "no such company" is worse than no count: it is the one number in this report a client would quote.
 *
 * So the test is EVIDENCE OF FINDING THE ENTITY, not evidence of the string:
 *
 *   connected = the answer CITES a domain belonging to the client.
 *
 * Nothing here reads tone or meaning. It reads the citation domains the collector recorded, and the
 * rule is printed in the report so a reader can check it against the excerpts printed beside it.
 *
 * WHY A STEM AND NOT THE DOMAIN FROM THE INTAKE: the run header carries the brand's spellings but not
 * its domain, and a report that needed the intake file to still exist could not be re-rendered from
 * the run file alone. When the brand has no ASCII letters (a Chinese-only name) there is no stem to
 * look for, so the rule is reported as NOT APPLICABLE rather than guessed, and every run falls into
 * the "no evidence of finding it" bucket.
 */
const brandStem = (() => {
  /**
   * THE FIRST WORD OF A SPELLING, never the whole spelling. Stripping the spaces out of
   * "LLMention scanner" produces "llmentionscanner", which is a string that can never appear in a
   * domain — the first attempt did exactly that and silently classified every run as "no evidence".
   * The first word is the part a domain is built from.
   */
  const stemFrom = (value: string): string =>
    String(value)
      .toLowerCase()
      .split(/[\s,，、/]+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ""))
      .find((w) => w.length >= 4) ?? "";
  const fromName = brandTokens.find((t) => t.field === "brand.name")?.value ?? BRAND;
  return stemFrom(fromName) || brandTokens.map((t) => stemFrom(t.value)).find(Boolean) || "";
})();

function citesOwnDomain(r: RunLine): boolean {
  if (!brandStem) return false;
  return (r.domains ?? []).some((d) =>
    String(d).toLowerCase().replace(/[^a-z0-9]/g, "").includes(brandStem)
  );
}

/**
 * Phrases a model uses when it could not identify the entity. PUBLISHED in the rule text, because a
 * reader has to be able to check the classification, and because the count of these is printed next
 * to the count of runs that cited the client's own domain. Containment is the whole test.
 */
const NOT_FOUND_SIGNALS = [
  "no exact match",
  "didn't surface",
  "did not surface",
  "no direct results",
  "didn't return direct",
  "did not return direct",
  "does not appear to refer",
  "doesn't appear to refer",
  "not appear to refer to a well-defined",
  "unable to find",
  "could not find",
  "couldn't find",
  "no specific company",
  "not a well-defined",
  "未找到",
  "没有找到",
  "没有检索到",
  "没有一家",
  "无法确认",
  "无法确定",
  "查无",
];

function saysNotFound(r: RunLine): boolean {
  const text = String(r.answer ?? "").toLowerCase().replace(/\s+/g, " ");
  return NOT_FOUND_SIGNALS.some((s) => text.includes(s));
}

const entityScoredRuns = nameQuestionFacts.flatMap((q) => (byQuestion.get(q.q) ?? []).filter((r) => r.ok));
const entityConnected = entityScoredRuns.filter(citesOwnDomain).length;
const entityNotFound = entityScoredRuns.filter((r) => !citesOwnDomain(r) && saysNotFound(r)).length;
const entityNotConnected = entityRunsTotal - entityConnected;

if (entityRunsTotal > 0 && entityConnected + entityNotConnected !== entityRunsTotal) {
  throw new Error(
    `名字题的 ${entityRunsTotal} 次已完成运行里，${entityConnected} 次回答了法定名称、` +
      `${entityNotConnected} 次没有，两个数加起来不是 ${entityRunsTotal}。` +
      "实体识别图的两个扇区必须正好覆盖全部运行，否则这张图分类的不是这份数据。"
  );
}

const entityConclusionRuleText =
  lang === "en"
    ? `How the runs are classified: for every completed run of a name question (${nameQuestionFacts.length} questions ask about a short form, an alias or a former name; ids ` +
      `${nameQuestionFacts.map((q) => q.id).join(", ") || "(none)"}), a cited domain containing the client's own domain stem "${brandStem || "(the brand name has no usable ASCII stem, so this rule does not apply)"}" counts as citing the client's own domain, and anything else counts as not citing it; ` +
      `among those that do not cite it, an answer whose text contains any of these phrases is counted separately as saying outright that it cannot find the company: ${NOT_FOUND_SIGNALS.join(", ")}. ` +
      "This rule reads only the cited domains the collector recorded and the answer text, and makes no semantic judgement; the verbatim extract of every run is in this section, so each one can be checked."
    : `分类规则：名字题（题库里问简称/别名/曾用名的 ${nameQuestionFacts.length} 道题，id ` +
  `${nameQuestionFacts.map((q) => q.id).join("、") || "（没有）"}）的每一次已完成运行，` +
  `回答引用的域名里出现客户自己域名的主干「${brandStem || "（品牌名里没有可用的 ASCII 主干，本规则不适用）"}」计为『引用到客户自己的域名』，其余计为『没有引用到』；` +
  `『没有引用到』的那些里，回答文本含有下列任一表述的另计一类『明确说找不到』：${NOT_FOUND_SIGNALS.join("、")}。` +
  "这条规则只读采集脚本记录的引用域名与回答文本，不做语义判断；本节附有各次运行的原文，可以逐条核对。";

const entityFirstQuestion = nameQuestionFacts[0];
const entityRuns = entityFirstQuestion
  ? (byQuestion.get(entityFirstQuestion.q) ?? []).map((r) => ({ run: r.run, text: conclusionExcerpt(r.answer) }))
  : [];

const entityQuote = entityFirstQuestion
  ? {
      label:
        lang === "en"
          ? `${entityFirstQuestion.id} · run ${firstRun(entityFirstQuestion.q).run} · entity identification`
          : `${entityFirstQuestion.id} · 第 ${firstRun(entityFirstQuestion.q).run} 次运行 · 实体识别`,
      question: firstRun(entityFirstQuestion.q).question,
      run: firstRun(entityFirstQuestion.q).run,
      text: trimTrailingLabel(headOf(plain(firstRun(entityFirstQuestion.q).answer), 280)),
      note:
        `原文摘录（${entityFirstQuestion.id} 第 1 次运行，取回答开头 280 个字符以内并按换行截断）。` +
        "只去掉了 Markdown 的加粗与标题标记，文字与标点未改动。这一题问的是客户自己的简称/别名/曾用名，所以它测的是模型能不能把这个名字对回法定主体。",
    }
  : null;

const entityLeadBody = entityFirstQuestion
  ? lang === "en"
    ? `This section answers one specific question: does the model understand the name this company goes by? The bank asks about a short form, an alias or a former name in {nameQuestions} questions` +
      ` (${nameQuestions.map((n) => `${n.id} "${n.value}"`).join(", ")}), across {nameRuns} completed runs. The decision reads no tone and no concluding sentence; it reads evidence - whether the answer cited the client's own domain.` +
      ` In this run {nameConnected} runs cite it and {nameNotConnected} do not, and among those that do not, {notFoundRuns} say outright that they cannot find the company. That a model knows the company behind a name, and that it can reliably tie a spoken name back to the legal entity, are two different things. What follows is what the model actually said.`
    : `这一节回答一个具体问题：模型看得懂这家公司的名字吗？题库里有 {nameQuestions} 道题问的是简称、别名或曾用名` +
      `（${nameQuestions.map((n) => `${n.id}「${n.value}」`).join("、")}），共 {nameRuns} 次完成的运行。判定不看语气、不看结论句，只看证据：回答有没有引用到客户自己的域名。` +
      `本次 {nameConnected} 次引用到了，{nameNotConnected} 次没有；没有引用到的那些里，{notFoundRuns} 次的原文明确说找不到这家公司。模型知道这个名字背后的公司，与模型能把一个口语名稳定地对回法定主体，是两件事。下面这一段是模型的原话。`
  : lang === "en"
    ? `The bank asks no question about a short form, an alias or a former name: brand.short_name, brand.aliases and brand.former_names in the intake hold no usable value, so the bank generator produced none of that kind.` +
      " This run therefore did not measure whether the name ties back to the legal entity, and that is a gap rather than a conclusion - the report does not write 'not asked' as 'no problem'."
    : `题库里没有问简称、别名或曾用名的题：intake 的 brand.short_name / brand.aliases / brand.former_names 里没有可用的值，题库生成器因此没有出这一类题。` +
      "所以本次没有测量『名字能不能对回法定主体』，这是一个缺口，不是一个结论——报告不会把『没问』写成『没问题』。";

const summaryEntityBody = entityFirstQuestion
  ? lang === "en"
    ? `Entity layer: across {runs} completed answers the brand name appears in {brandRuns}; among the {promptedRuns} runs whose question names the brand, it appears in {promptedMentions}.` +
      ` The name layer: {nameQuestions} questions ask about a short form, an alias or a former name, and across {nameRuns} runs {nameConnected} cite the client's own domain ({BRAND}), {nameNotConnected} do not, and {notFoundRuns} of those say outright that they cannot find the company.`
    : `实体层：{runs} 次完成的回答里 {brandRuns} 次出现了品牌名；问题里点名品牌的 {promptedRuns} 次运行里 {promptedMentions} 次出现。` +
      `名字这一层：{nameQuestions} 道题问的是简称/别名/曾用名，共 {nameRuns} 次运行里 {nameConnected} 次引用了客户自己的域名（{BRAND}），{nameNotConnected} 次没有引用到，其中 {notFoundRuns} 次明确说找不到这家公司。`
  : lang === "en"
    ? "Entity layer: the bank asks no question about a short form, an alias or a former name (the intake left those fields empty), so this run did not measure how the name maps to the legal entity; that is a gap in this measurement, not a conclusion."
    : "实体层：题库里没有问简称、别名或曾用名的题（intake 没有填这些字段），所以本次没有测量名字与法定主体之间的对应关系；这是这次测量的一个缺口，不是结论。";

/* ------------------------------------------------------------------ */
/* Claims: assertions in the answers that this report does NOT verify  */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Competitors: who gets recommended when nobody names the client      */
/* ------------------------------------------------------------------ */

/**
 * THE COLUMN THE FIRST VERSION OF THIS REPORT COULD NOT PRODUCE. A reader meets "0 of 45" and asks
 * the only question that follows: then who was named instead? That needs a per-competitor mark on
 * every answer, which the collector writes (mentionsCompetitors) from the names in the intake.
 *
 * The test is containment in the answer text with the same matcher the brand name uses, on the
 * client's own spellings. That has one consequence worth printing rather than hiding: a competitor
 * written as a marketing name nobody says out loud scores 0, and that 0 is a property of the
 * spelling, not of the competitor's visibility.
 */
type CompetitorRow = { name: string; nonBrand: number; all: number; byGroup: string };
const competitorNames: string[] = (header?.competitors ?? [])
  .map((c) => (typeof c === "string" ? c : String(c?.value ?? "")))
  .filter((name) => name.length > 0);
const competitorsMeasured =
  competitorNames.length > 0 && answers.some((r) => Array.isArray(r.mentionsCompetitors));
const nonBrandIds = new Set(nonBrandQuestions.map((q) => q.id));
const competitorRows: CompetitorRow[] = competitorsMeasured
  ? competitorNames
      .map((name) => {
        const hits = answers.filter((r) => (r.mentionsCompetitors ?? []).includes(name));
        return {
          name,
          nonBrand: hits.filter((r) => r.id !== undefined && nonBrandIds.has(r.id)).length,
          all: hits.length,
          byGroup: groups.map((g) => `${g.short}:${hits.filter((r) => r.group === g.id).length}`).join("、"),
        };
      })
      .sort((a, b) => b.nonBrand - a.nonBrand || b.all - a.all)
  : [];
const competitorTop = competitorRows[0] ?? null;

type Claim = { claim: string; source: string; handling: string };

/**
 * EVERY CLAIM ROW NAMES THE RUN IT CAME FROM AND THE EXACT SUBSTRING IT WAS READ OFF, and the build fails
 * if that substring is not in that answer.
 *
 * WHY THE ASSERTION IS THE POINT OF THIS TABLE. A "claims we could not verify" list is a list of
 * quotations; the way it goes wrong is by drifting from the text it quotes. Checking the substring against
 * the recorded answer makes the table a set of quotations with a citation that cannot silently stop
 * matching. It is deliberately a substring and not a semantic check: this file has no way to know whether a
 * patent count is true, and it says so in every row's handling.
 *
 * HOW THE ROWS ARE CHOSEN NOW. The old version had five hand-picked rows with hand-picked evidence
 * substrings, which is a property of one dataset. The claim this section is about is "the answer asserted
 * something checkable", so the rule is: the first sentence of an answer that contains a digit, one row per
 * question, capped, with the counts printed so the cap is visible rather than silent.
 */
const NUMBER_SENTENCE = /\d/;
const CLAIM_ROWS_LIMIT = 8;
/** Long enough to carry the assertion, short enough for a table cell. */
const CLAIM_CHARS = 160;

type Candidate = { q: number; id: string; run: number; raw: string };
const claimCandidates: Candidate[] = [];
let claimSentencesFound = 0;

for (const q of questions) {
  const list = byQuestion.get(q.q) ?? [];
  for (const r of list) {
    /**
     * THE SENTENCE IS TAKEN FROM THE RAW ANSWER, NOT FROM plain()'d TEXT, and that is load-bearing: the
     * claims table asserts that its evidence is a substring of the run it cites, and plain() removes `**`
     * and `#` - so a sentence extracted after that cleaning can fail its own assertion (a legacy run with
     * Markdown headings did exactly that). Markdown table rows are skipped as claim material: a table row
     * is a row of somebody else's data, not the answer's own assertion.
     */
    const rawSentences = r.answer
      .split(/\r?\n/)
      .filter((line) => !/^\s*\|/.test(line))
      .join("\n")
      .split(/(?<=[。！？!?；;])\s*|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const hit = rawSentences.find((s) => NUMBER_SENTENCE.test(s) && s.length >= 8);
    if (!hit) continue;
    claimSentencesFound += 1;
    if (claimCandidates.some((c) => c.q === q.q)) continue;
    claimCandidates.push({ q: q.q, id: q.id, run: r.run, raw: hit.length > CLAIM_CHARS ? `${hit.slice(0, CLAIM_CHARS)}…` : hit });
  }
}

function claimRow(candidate: Candidate): Claim {
  const source =
    lang === "en"
      ? `${candidate.id} run ${candidate.run}`
      : `${candidate.id} 第 ${candidate.run} 次运行`;
  const answer = runOf(candidate.q, candidate.run).answer;
  const evidence = candidate.raw.replace(/…$/, "");
  if (!answer.includes(evidence)) {
    throw new Error(
      `Claim evidence is not in ${candidate.id} run ${candidate.run}: ${JSON.stringify(evidence.slice(0, 40))}. ` +
        "The claims table quotes runs, so a claim whose text cannot be found in its run is a fabrication with a citation attached."
    );
  }
  return {
    claim: plain(candidate.raw),
    source,
    // One template, eight rows: every row's handling sentence comes from here, which is why
    // translating it clears eight entries of the language check at once.
    handling:
      lang === "en"
        ? "Not verified by this report. The sentence is a number-bearing assertion taken from an answer, so repeating it needs evidence from the company: a list, a number, a date, a source. " +
          "A number inside an answer has no source behind it, and that is exactly where a client is most likely to be questioned."
        : "本报告未核验。这一句是回答里带数字的断言；引用前需要企业提供对应证据（清单、编号、日期、出处）。" +
          "回答里的数字没有出处，而这正是客户最容易被追问的地方。",
  };
}

const claims: Claim[] = claimCandidates.slice(0, CLAIM_ROWS_LIMIT).map(claimRow);

/* ------------------------------------------------------------------ */
/* Quotes: one representative run per archetype                       */
/* ------------------------------------------------------------------ */

/**
 * WHICH RUNS GET QUOTED, AND WHY IT IS A RULE RATHER THAN A LIST. The old version quoted the three runs of
 * one question and one industry answer, all typed in. A quote section that only works for one dataset is a
 * quote section that will describe the wrong company the next time. The rule now:
 *
 *   per archetype -> the question with the FEWEST brand mentions (ties: lowest q, so the output is
 *   reproducible), run 1 of it -> the opening of that answer, verbatim.
 *
 * The question with the fewest mentions is the least favourable evidence in that group, which is the one
 * worth quoting: a report that only shows its best run is marketing. The note under every excerpt carries
 * that group's own counts, so the excerpt cannot be read out of context.
 */
const quotes = groups
  .map((g) => {
    const candidates = questions.filter((q) => q.group === g.id && q.okRuns > 0);
    if (candidates.length === 0) return null;
    const pick = [...candidates].sort((a, b) => a.brandMentions - b.brandMentions || a.q - b.q)[0];
    const r = firstRun(pick.q);
    return {
      label: `${pick.id} · 第 ${r.run} 次运行 · ${g.label}`,
      question: pick.question,
      run: r.run,
      text: trimTrailingLabel(headOf(plain(r.answer), 240)),
      note:
        `原文摘录（${pick.id} 第 ${r.run} 次运行，取回答开头 240 个字符以内并按换行截断）。只去掉了 Markdown 的加粗与标题标记。` +
        `选它的规则是：这一组里品牌被提及次数最少的一道题${pick.brandMentions === 0 ? "（本题一次都没有提到它）" : ""}，` +
        `同组各题的计数是 ${candidates.map((c) => `${c.id} ${c.brandMentions}/${c.okRuns}`).join("、")}。`,
    };
  })
  .filter((q): q is NonNullable<typeof q> => q !== null);

/* ------------------------------------------------------------------ */
/* Sources: the domains the answers cited                             */
/* ------------------------------------------------------------------ */

const domainMap = new Map<string, { count: number; groups: Set<string> }>();
for (const r of answers) {
  for (const d of r.domains ?? []) {
    const entry = domainMap.get(d) ?? { count: 0, groups: new Set<string>() };
    entry.count += 1;
    const short = questions.find((q) => q.q === r.q)?.groupShort ?? r.group;
    entry.groups.add(short);
    domainMap.set(d, entry);
  }
}

/**
 * The most-cited domains, and nothing that ranks them.
 *
 * ORDERED BY COUNT, WHICH IS A FACT ABOUT THE ANSWERS, NOT A JUDGEMENT ABOUT THE DOMAINS. The rendering
 * keeps saying so: a domain cited often is a domain the answers linked often. Twelve is a table that fits a
 * page; the counts of the rest are in the workbook and in the run file.
 */
const DOMAIN_TABLE_LIMIT = 12;
const domains = [...domainMap.entries()]
  .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
  .slice(0, DOMAIN_TABLE_LIMIT)
  .map(([domain, e]) => ({ domain, count: e.count, groups: [...e.groups] }));
const topDomain = domains[0]?.domain ?? "（没有引用任何域名）";
const topDomainCount = domains[0]?.count ?? 0;
const otherDomains = domainMap.size - domains.length;
const otherEvents = citationEvents - domains.reduce((s, d) => s + d.count, 0);

const citationsByGroup = groups.map((g) => ({
  label: g.short,
  count: answers
    .filter((r) => questions.find((q) => q.q === r.q)?.group === g.id)
    .reduce((s, r) => s + (r.domains?.length ?? 0), 0),
}));

/* ------------------------------------------------------------------ */
/* Rejected lines, described rather than dropped                      */
/* ------------------------------------------------------------------ */

const rejectedByStatus = new Map<string, number>();
for (const r of rejected) {
  const key = String(r.status ?? "throw");
  rejectedByStatus.set(key, (rejectedByStatus.get(key) ?? 0) + 1);
}
/** "HTTP 429 × 30", without the surrounding sentence, so two places can use it without nesting. */
const failureDigest = [...rejectedByStatus.entries()]
  .map(([s, n]) => `${/^\d+$/.test(s) ? `HTTP ${s}` : s} × ${n}`)
  .join("、");
const failureSummary =
  `${rejected.length} / ${parsedLines} 行` +
  (rejected.length
    ? `（${failureDigest}${
        timeoutsTotal > 0 ? `，其中 ${timeoutsTotal} 次是超时（超时上限 ${header?.run?.timeout_ms ?? "?"}ms，记录在每一行的 status 里）` : ""
      }，未计入任何计数）`
    : "（没有失败行）");

/* ------------------------------------------------------------------ */
/* The model                                                          */
/* ------------------------------------------------------------------ */

/**
 * FILLING IS ITERATIVE, WHICH IS A CORRECTION RATHER THAN A CONVENIENCE.
 *
 * Several copy values are placeholders for a SENTENCE this file builds (summaryEntity ->
 * {summaryEntityBody}), and that sentence carries placeholders of its own ({runs}, {BRAND}). A single-pass
 * fill leaves those in place, and the leftover check below then stops the build with a message naming the
 * copy key rather than the sentence - which is the right outcome, but the wrong cause. Looping resolves the
 * chain; the loop is bounded and stops as soon as nothing changes, so an unknown placeholder (runLabel's
 * {n}, substituted per row by the two renderers) survives untouched.
 */
function fill(template: string, vars: Record<string, string | number>): string {
  let text = template;
  for (let pass = 0; pass < 6; pass += 1) {
    const next = text.replace(/\{(\w+)\}/g, (whole, k: string) => (k in vars ? String(vars[k]) : whole));
    if (next === text) return text;
    text = next;
  }
  return text;
}

const Q = (q: number) => questions.find((x) => x.q === q);

/**
 * The sentences that depend on which shape the data has, built once here rather than branched inside the
 * copy block: a sentence that has to choose between two truths is easier to read as two sentences.
 */
const summaryReachBodyZh =
  `${totals.nonBrandQuestions} 道不含品牌名的问题、每题 ${runsPerQuestion} 次运行，共 ${totals.nonBrandRuns} 次运行里品牌被提及 ${totals.nonBrandBrandMentions} 次。` +
  (zeroMentionNonBrand.length > 0
    ? `其中 ${zeroMentionNonBrand.map((q) => q.id).join("、")}（共 ${zeroMentionNonBrand.length} 道）一次都没有提到它；` +
      (mentionedNonBrand.length > 0
        ? `${mentionedNonBrand.map((q) => `${q.id} ${q.brandMentions}/${q.okRuns}`).join("、")} 提到过。`
        : "没有一道提到过。") +
      "0 次是测量结果，不是缺失：这些运行的答案完整，只是推荐了别的厂商。"
    : `每一道不含品牌名的问题都至少被提到过一次（${mentionedNonBrand
        .map((q) => `${q.id} ${q.brandMentions}/${q.okRuns}`)
        .join("、")}）。`) +
  "逐题原文与计数见第三节，问题原文见第一节。";

const summaryReachBodyEn =
  `${totals.nonBrandQuestions} questions without the brand name, ${runsPerQuestion} runs each: across ${totals.nonBrandRuns} runs the brand is mentioned ${totals.nonBrandBrandMentions} times.` +
  (zeroMentionNonBrand.length > 0
    ? ` ${zeroMentionNonBrand.map((q) => q.id).join(", ")} (${zeroMentionNonBrand.length} questions) do not mention it at all; ` +
      (mentionedNonBrand.length > 0
        ? `${mentionedNonBrand.map((q) => `${q.id} ${q.brandMentions}/${q.okRuns}`).join(", ")} do.`
        : "none of them does.") +
      " A zero is a measurement result, not a gap: those answers are complete, they simply recommend other vendors."
    : ` Every question without the brand name mentions it at least once (${mentionedNonBrand
        .map((q) => `${q.id} ${q.brandMentions}/${q.okRuns}`)
        .join(", ")}).`) +
  " Per-question extracts and counts are in section 3, and the questions themselves are in section 1.";

const summaryReachBody = lang === "en" ? summaryReachBodyEn : summaryReachBodyZh;

const summaryFactsBodyZh =
  `事实层：${promptedQuestions.length} 道点名品牌的问题、${totals.promptedRuns} 次运行里品牌被提及 ${totals.promptedBrandMentions} 次。` +
  (claims.length > 0
    ? `带数字的断言出现在 ${claimSentencesFound} 次回答里、涉及 ${claimCandidates.length} 道题，本报告按题各取一条列出（共 ${claims.length} 条，见第八节），没有核验任何一条。`
    : "本次回答里没有找到带数字的断言，所以第八节没有可核对的清单。") +
  "逐题计数在第三节，原文在各节摘录里，任何人都可以自己复算。";

const summaryFactsBodyEn =
  `Facts: ${promptedQuestions.length} questions that name the brand, and across ${totals.promptedRuns} runs the brand is mentioned ${totals.promptedBrandMentions} times.` +
  (claims.length > 0
    ? ` Assertions carrying numbers appear in ${claimSentencesFound} answers across ${claimCandidates.length} questions; this report lists one per question (${claims.length} in total, section 8) and verified none of them.`
    : " No assertion carrying a number was found in these answers, so section 8 has no list to check.") +
  " Per-question counts are in section 3 and the extracts are in each section, so anyone can recompute them.";

const summaryFactsBody = lang === "en" ? summaryFactsBodyEn : summaryFactsBodyZh;

const coverageNoteBodyZh =
  `『品牌提及』的判定是答案文本里是否出现 ${brandTokens.map((t) => t.value).join(" / ")} 中的任意一个` +
  `（${
    header?.brand?.tokens_source === "intake" ? "来自 intake 的品牌名与别名" : "来自运行文件记录的品牌写法"
  }；CJK 名字按子串匹配，拉丁名字按词边界匹配，规则在 lib/answer-check/rules.ts）；` +
  (hasCategoryTokens
    ? `『品类词提及』是是否出现客户自己的品类词 ${categoryTokensForReport.map((t) => t.value).join(" / ")}。`
    : "『品类词提及』本次无法判定：intake 的 industry.category_terms 是空的，所以这一列没有数字。") +
  "两个标记都由采集脚本写入，本报告直接读，不重新判定。";

const coverageNoteBodyEn =
  `A brand mention is marked when the answer text contains any of ${brandTokens.map((t) => t.value).join(" / ")}` +
  ` (${
    header?.brand?.tokens_source === "intake"
      ? "the names and aliases from the intake"
      : "the spellings recorded in the run file"
  }; CJK names match as substrings and Latin names on word boundaries, so see lib/answer-check/rules.ts); ` +
  (hasCategoryTokens
    ? `a category mention is marked when the answer contains one of the client's own category terms: ${categoryTokensForReport.map((t) => t.value).join(" / ")}.`
    : "a category mention could not be decided in this run: the intake's industry.category_terms is empty, so that column carries no number.") +
  " Both marks are written by the collector; this report reads them and does not decide them again.";

const coverageNoteBody = lang === "en" ? coverageNoteBodyEn : coverageNoteBodyZh;

const claimsNoteBodyZh =
  claims.length > 0
    ? `每一条都写了它出现在哪一次运行，可以直接在数据文件里找到原文核对。带数字的断言一共出现在 ${claimSentencesFound} 次回答里、涉及 ${claimCandidates.length} 道题，` +
      `本节按题各取一条、共列 ${claims.length} 条（筛选规则：『该次回答里第一句带数字的话』${
        claimCandidates.length > claims.length ? "；超过上限的题不再单列" : ""
      }）。` +
      "本报告不判断这些断言的真假，也不建议把它们直接写进宣传材料：回答里的数字没有出处。"
    : `本次 ${totals.runs} 次回答里没有找到带数字的断言，所以这一节没有表。这不是『回答都对』，而是『没有可核对的数字』；` +
      "核对清单为空与核对通过是两件事。";

const claimsNoteBodyEn =
  claims.length > 0
    ? `Each row records which run it came from, so the wording can be found in the data file and checked. Number-bearing assertions appear in ${claimSentencesFound} answers across ${claimCandidates.length} questions, ` +
      `and this section lists one per question - ${claims.length} in total (the rule: 'the first sentence in that answer that contains a number'${
        claimCandidates.length > claims.length ? "; questions beyond the cap are not listed separately" : ""
      }). ` +
      "This report does not decide whether these assertions are true, and does not suggest repeating them in marketing material: a number inside an answer has no source behind it."
    : `No number-bearing assertion was found in the ${totals.runs} answers of this run, so this section has no table. That is not 'the answers are correct' but 'there are no numbers to check'; ` +
      "an empty checklist and a passed check are two different things.";

const claimsNoteBody = lang === "en" ? claimsNoteBodyEn : claimsNoteBodyZh;

const questionsLeadBodyZh =
  `✓ 表示该次运行的回答里出现了品牌名（${brandTokens.map((t) => t.value).join(" / ")} 任一），— 表示没有出现，` +
  `『${COPY_NOT_MEASURED}』表示这一次运行没有拿到完整回答` +
  (runsPerQuestion < RUN_COLUMNS
    ? `，『${COPY_NOT_RUN}』表示这次测量每题只跑 ${runsPerQuestion} 次（表里多出来的列没有这一次运行）。`
    : "。") +
  (runsPerQuestion > RUN_COLUMNS
    ? `本表只画前 ${RUN_COLUMNS} 次运行的标记（表中放不下更多列），第 ${RUN_COLUMNS + 1} 到 ${runsPerQuestion} 次的逐题计数在右侧的『品牌提及』列里，逐行明细在数据文件里。`
    : "判定由采集脚本在采集时写入，本报告不重新判定。");

const questionsLeadBodyEn =
  `A check mark means that run's answer contained the brand name (any of ${brandTokens.map((t) => t.value).join(" / ")}), a dash means it did not, ` +
  `and '${COPY_NOT_MEASURED}' means that run produced no complete answer` +
  (runsPerQuestion < RUN_COLUMNS
    ? `, while '${COPY_NOT_RUN}' means this measurement ran only ${runsPerQuestion} times per question (the extra columns have no run behind them).`
    : ".") +
  (runsPerQuestion > RUN_COLUMNS
    ? ` This table marks only the first ${RUN_COLUMNS} runs, because the table cannot hold more columns; the per-question counts for runs ${RUN_COLUMNS + 1} to ${runsPerQuestion} are in the 'brand mentions' column to the right, and the per-line detail is in the data file.`
    : " The marks are written by the collector during collection; this report does not decide them again.");

const questionsLeadBody = lang === "en" ? questionsLeadBodyEn : questionsLeadBodyZh;

const entityRunsLeadBodyZh = entityFirstQuestion
  ? `下面是 ${entityFirstQuestion.id}「${entityFirstQuestion.question}」各次运行的开头，逐字摘录（每次取回答的第一行与紧随其后的一行；只去掉 Markdown 的加粗与标题标记）。` +
    `这一题问的是${
      nameQuestions.find((n) => n.id === entityFirstQuestion.id)?.value
        ? `「${nameQuestions.find((n) => n.id === entityFirstQuestion.id)!.value}」`
        : "客户自己的一个名字写法"
    }，所以每一份回答都要先把它对回法定主体；各次运行的结论是否一致，读下面这几行就知道。`
  : "";

const entityRunsLeadBodyEn = entityFirstQuestion
  ? `Below are the openings of each run of ${entityFirstQuestion.id} "${entityFirstQuestion.question}", quoted verbatim (the first line of each answer and the line after it; only Markdown bold and heading marks were removed). ` +
    `This question asks about ${
      nameQuestions.find((n) => n.id === entityFirstQuestion.id)?.value
        ? `"${nameQuestions.find((n) => n.id === entityFirstQuestion.id)!.value}"`
        : "one of the client's own name spellings"
    }, so every answer has to tie it back to the legal entity first; reading the lines below shows whether the runs agree.`
  : "";

const entityRunsLeadBody = lang === "en" ? entityRunsLeadBodyEn : entityRunsLeadBodyZh;

const entityFindingBodyZh = entityFirstQuestion
  ? `名字题的 ${entityRunsTotal} 次运行里，${entityConnected} 次的回答引用了客户自己的域名，${entityNotConnected} 次没有引用到；没有引用到的那些里，${entityNotFound} 次明确说找不到这家公司。` +
    (entityNotFound > 0
      ? `这是本次测量里最值得注意的一件事：名字被反复提到，却没有一次把回答指向这家公司自己的页面——『提到名字』和『认得这家公司』是两件事，本节的计数只算后者。`
      : entityConnected > 0
        ? "本次有运行把回答指向了客户自己的域名；这不表示名字没有问题，只表示在这批运行里模型找到了这家公司。"
        : "本次没有任何一次把回答指向客户自己的域名；本节附有各次运行的原文，可以逐条核对。")
  : "";

const entityFindingBodyEn = entityFirstQuestion
  ? `Across the ${entityRunsTotal} runs of the name question, ${entityConnected} answers cited the client's own domain and ${entityNotConnected} did not; among those that did not, ${entityNotFound} said outright that they could not find the company.` +
    (entityNotFound > 0
      ? ` That is the single most notable result in this measurement: the name is mentioned repeatedly, and not once do the answers point at the company's own pages. "The name appears" and "the company is recognised" are two different things, and this section counts only the second.`
      : entityConnected > 0
        ? " Some runs did point at the client's own domain; that does not mean the name is trouble-free, only that the model found the company in these runs."
        : " No run pointed at the client's own domain; this section carries the verbatim extract of every run, so each one can be checked.")
  : "";

const entityFindingBody = lang === "en" ? entityFindingBodyEn : entityFindingBodyZh;

/**
 * THE COVERAGE SENTENCE DEPENDS ON WHETHER THE COLUMN EXISTS AT ALL. With category terms from the intake,
 * the 品类词 column shows how often an answer was demonstrably about this industry; with none, there is no
 * such column and the report says NOT MEASURED rather than printing a row of zeros that a reader would take
 * for "the answers were not about the industry".
 */
const overviewLeadBodyZh =
  `下表是全部 ${questions.length} 道题。` +
  (hasCategoryTokens
    ? `『品类词提及』一列说明回答确实在谈这个客户所在的品类：${totals.runs} 次运行里有 ${totals.coatingsMentions} 次出现了客户自己的品类词，` +
      "所以表里的 0 是『没有提到这家公司』，不是『没有回答这个问题』。"
    : "本次没有『品类词提及』数字：intake 的 industry.category_terms 是空的，采集脚本没有可判定的品类词，" +
      "所以这一列写『未测量』而不是 0——0 会被读成『回答没谈这个品类』，而那是没有依据的。");

const overviewLeadBodyEn =
  `The table below covers all ${questions.length} questions.` +
  (hasCategoryTokens
    ? ` The 'category mentions' column shows that the answers really were about the category this client is in: ${totals.coatingsMentions} of ${totals.runs} runs contained one of the client's own category terms, ` +
      "so a 0 in that column means 'this company was not mentioned', not 'the question was not answered'."
    : " There are no 'category mentions' figures in this run: the intake's industry.category_terms is empty, so the collector had no category terms to decide against, " +
      "and that column reads 'not measured' rather than 0 - a 0 would be read as 'the answers were not about this category', which nothing supports.");

const overviewLeadBody = lang === "en" ? overviewLeadBodyEn : overviewLeadBodyZh;

/**
 * HOW THE ANSWERS WERE PRODUCED, in one phrase, printed on the cover, in the limits and in the method. It
 * exists because "web search: yes" is a configuration record for a dry run, and only the mode says whether
 * any call happened at all.
 */
const runModeLabelText =
  runMode === "api"
    ? "api（真实调用）"
    : runMode === "dry-run"
      ? "dry-run（本地合成回答，没有发出任何调用）"
      : runMode === "replay"
        ? "replay（回放上一次运行的记录，没有发出任何调用）"
        : `（运行文件记录的 mode 是 ${runMode}）`;

const fills: Record<string, string | number> = {
  BRAND,
  questionCount: questions.length,
  groupCount: groups.length,
  runs: totals.runs,
  brandRuns: totals.brandMentions,
  coatingsRuns: totals.coatingsMentions === null ? COPY_NOT_MEASURED : totals.coatingsMentions,
  nonBrandQuestions: totals.nonBrandQuestions,
  nonBrandRuns: totals.nonBrandRuns,
  compTopName: competitorTop?.name ?? "（没有竞品被点名）",
  compTopCount: competitorTop?.nonBrand ?? 0,
  compCount: competitorRows.length,
  nonBrandMentions: totals.nonBrandBrandMentions,
  promptedRuns: totals.promptedRuns,
  promptedMentions: totals.promptedBrandMentions,
  runsPerQuestion,
  groupRuns: groups.map((g) => g.runs).join(" / "),
  measuredOn,
  model: modelDisplay,
  // Hardcoded Chinese in a value that an English sentence interpolates: replication1 reads "..., web
  // search on (tools: [web_search]), on one day if possible", and the whole paragraph failed the
  // language check because of this one phrase rather than because of the sentence.
  webSearchSentence:
    lang === "en"
      ? webSearch
        ? "web search on (tools: [web_search])"
        : "web search off"
      : webSearch
        ? "开启联网搜索"
        : "关闭联网搜索",
  citationEvents,
  distinctDomains: domainMap.size,
  domainLimit: domains.length,
  topDomain,
  topDomainCount,
  otherDomains,
  otherEvents,
  // Same class of bug as the question-id list: " 次" and "、" are both Chinese, and this value is
  // interpolated into an English sentence, so a translated paragraph would still fail the check.
  citationsByGroup: citationsByGroup
    .map((c) => (lang === "en" ? `${c.label} ${c.count}` : `${c.label} ${c.count} 次`))
    .join(lang === "en" ? ", " : "、"),
  minAnswerChars: Math.min(...answerLengths),
  maxAnswerChars: Math.max(...answerLengths),
  bankLanguage: header?.run?.language ?? "（未记录）",
  bankQuestions: bankQuestions.length,
  bankGroups: groups.length,
  bankFingerprint: bankFingerprint || "（题库没有记录指纹）",
  bankFrozenSentence:
    (frozenNote ? `${frozenNote}　` : "") +
    (bankFingerprint
      ? `本次测量使用的就是这份题库：题面清单的 sha256 指纹是 ${bankFingerprint}，` +
        (header?.bank?.fingerprint_verified === true
          ? "采集脚本在开跑前按 bank.fingerprint_rule 重算过一遍并核对通过，说明没人在批准之后改过题目。"
          : "采集脚本无法核对这个指纹（题库记录的规则不是它实现的规则）。")
      : "这份运行文件没有记录题库指纹，所以『用的是哪一版题库』没有依据。"),
  bankApprovalSentence: bankApprovedBy
    ? `批准：${bankApprovedBy}${bankApprovedOn ? `，${bankApprovedOn}` : "（未写日期）"}。` +
      (intakeExpectedApprover && intakeExpectedApprover !== bankApprovedBy
        ? `intake 里填写的确认人是 ${intakeExpectedApprover}，与批准人不一致，请确认以谁为准。`
        : "")
    : `题库的 approved_by 是空的：这份题库生成后没有人在批准页上签字${
        intakeExpectedApprover ? `（intake 里填写的确认人是 ${intakeExpectedApprover}）` : ""
      }。` +
      "正式交付前必须补上签字并把批准日期写回题库文件；否则『客户批准过的题库』这句话没有依据，而这份报告的第一节就是它的位置。",
  bankDriftSentence: intakeDrift,
  overviewLeadBody,
  // The mode label is a Chinese phrase by default, and it is interpolated into English sentences
  // (noScore2 among them), so it is chosen by language here rather than at each sentence.
  runModeLabel:
    lang === "en"
      ? ({ api: "live API collection", "dry-run": "dry run", replay: "replay" }[runMode] ?? runMode)
      : runModeLabelText,
  summaryReachBody,
  summaryEntityBody,
  summaryFactsBody,
  coverageNoteBody,
  claimsNoteBody,
  questionsLeadBody,
  entityLeadBody,
  entityRunsLeadBody,
  entityFindingBody,
  nameQuestions: nameQuestionFacts.length,
  nameRuns: entityRunsTotal,
  nameConnected: entityConnected,
  nameNotConnected: entityNotConnected,
  notFoundRuns: entityNotFound,
  entityConclusionRuleBody: entityConclusionRuleText,
  entityConclusionLineBody: entityFirstQuestion
    ? `引用到客户自己的域名 ${entityConnected} 次、没有引用到 ${entityNotConnected} 次（n = ${entityRunsTotal}），其中 ${entityNotFound} 次明确说找不到这家公司。判定规则：回答引用的域名里出现客户自己域名的主干「${brandStem || "（品牌名没有可用的 ASCII 主干，本规则不适用）"}」计为『引用到』；『明确说找不到』按一张固定的表述清单判定，清单全文在工作簿的元数据页（entity_conclusion_rule）。`
    : "本次没有名字题，因此没有这条测量。",
  entityQuestions: nameQuestionFacts.length,
  entityTotalRuns: entityRunsTotal,
  entitySameConclusion: entityConnected,
  notSameRuns: entityNotConnected,
};

/**
 * EVERY PLACEHOLDER MUST BE GONE BEFORE THE MODEL IS WRITTEN, and this is the check that says so.
 *
 * WHY IT EXISTS: an earlier end-to-end run rendered `{nonBrandRuns}` into a client's overview table. The
 * numbers were right and the sentence was unreadable, and nothing in the pipeline objected, because fill()
 * leaves an unknown placeholder exactly as it found it and render-report.py prints these strings verbatim.
 * The failure is silent and appears in the one document a human reads, so the whole copy block is scanned
 * for anything left in braces and the build stops if it finds one.
 */
const RUNTIME_PLACEHOLDERS = new Set(["runLabel"]);

const FILLED_COPY: Record<string, string> = Object.fromEntries(
  Object.entries(COPY).map(([key, value]) => [key, fill(value, fills)])
);

const leftovers = Object.entries(FILLED_COPY).filter(
  ([key, value]) => !RUNTIME_PLACEHOLDERS.has(key) && /\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(value)
);
if (leftovers.length > 0) {
  throw new Error(
    "Unfilled placeholders in the copy block: " +
      leftovers.map(([key, value]) => `${key} -> ${(value.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) || []).join(",")}`).join("; ")
  );
}

/**
 * WHEN NOTHING WAS MARKED, THE SECTION SAYS SO INSTEAD OF PRINTING A TABLE OF ZEROS. Run files written
 * before the collector marked competitors (and any intake with no competitors.names) carry no
 * per-answer marks at all, and a table of zeros would be read as "no competitor was recommended" -
 * a different claim from "nobody counted".
 */
if (!competitorsMeasured) {
  const unmeasured: Record<string, string> = {
    sectionCompetitors: "六、竞品：本次没有测量",
    competitorsCallout:
      `这份数据里没有竞品。${totals.nonBrandRuns + totals.promptedRuns} 次回答没有对任何一家其他公司做过提及计数，所以本报告没有竞品对比表、没有份额、没有排名。`,
    competitorsLead: "",
    competitorsBody:
      "参照的那份外部交付物里有一节竞品压制分析。它需要『同一批问题里对手被提及多少次』这个输入，而这份运行文件没有记录竞品的标记。" +
      "要得到这个数字，必须在 intake 的 competitors.names 里写出对手名，并在采集时对每个对手各自标记。",
    competitorsNote: "",
  };
  for (const [key, value] of Object.entries(unmeasured)) FILLED_COPY[key] = value;
} else {
  /** The advice lead promises "no competitor was measured" - true until it was. */
  FILLED_COPY.adviceLead =
  lang === "en"
    ? "The items below are read directly out of this measurement rather than from a template. None of them promises an outcome: this report measured no competitor, and it did not measure what happens after content goes live."
    : "下面几条是从本次测量直接读出来的，不是通用建议。它们都不承诺效果：本报告没有测量内容上线后会发生什么。";
}

/** Copy as the document prints it: already filled, so the renderer never substitutes anything. */
const T = (key: string) => FILLED_COPY[key] ?? COPY[key];

/* ------------------------------------------------------------------ */
/* Advice and plan - read out of this measurement, not from a template */
/* ------------------------------------------------------------------ */

/*
 * ONE SEPARATOR, TWO LANGUAGES - AND IT IS NOT COSMETIC HERE. `、` is CJK punctuation, so an English
 * sentence that interpolates this list still contains a CJK character, and the language check
 * correctly refuses to print it. That is why translating a whole advice block moved the count by one
 * instead of five: the title carried no list, and every other field carried this one. The check was
 * right and the separator was wrong.
 */
const zeroIds = zeroMentionNonBrand.map((q) => q.id).join(lang === "en" ? ", " : "、");

const advice: { title: string; problem: string; action: string; deliverable: string; acceptance: string }[] = [];

if (entityFirstQuestion && entityNotConnected > 0) {
  advice.push({
    title: "P0-1 把实体口径写死，并在所有可查的地方用同一个版本",
    problem:
      `题库里 ${nameQuestionFacts.length} 道题问的是客户自己的名字写法（${nameQuestions
        .map((n) => `${n.id}「${n.value}」`)
        .join("、")}），` +
      `其中 ${entityNotConnected} 次运行的回答里没有出现法定名称「${BRAND}」。每一次回答都要先做一次名称推断，而推断会出错——这就是名字层面的风险。`,
    action:
      "先确认一组标准口径：法定全称、官方简称、曾用名、成立年份、注册地、主营业务，以及每个口语名在什么场合使用。" +
      "把这一组口径同时落到官网（一个可以单独引用的页面）、工商与备案信息、行业目录和百科词条上；每个字段注明更新日期与出处。",
    deliverable: "1 份实体事实表（字段、内容、出处、更新日期）；1 个官网事实页；一批标准问答（每条都能指向出处）。",
    acceptance: "同一批名字题复测时，回答里出现法定名称的运行次数不再下降；无法确认的字段写『待核实』而不是留空。",
  });
}

if (claims.length > 0) {
  advice.push({
    title: "P0-2 先核验已经出现在回答里的断言，再决定要不要对外引用",
    problem:
      `第八节列出的 ${claims.length} 条带数字的断言（文件里共出现在 ${claimSentencesFound} 次回答里）都出现在回答里，但本报告没有核验。` +
      "这些正是采购方与媒体最容易追问的地方，也是被追问时最贵的部分。",
    action:
      "逐条找证据：数字以清单形式给出并区分口径与截止日；资质与荣誉保留颁发机构、编号和日期；客户与工程保留项目名称、时间、范围，并取得对方同意公开。" +
      "有证据的写成可引用的页面，没有证据的先从对外材料里拿掉——写不清楚的断言会被下一次回答原样重复。",
    deliverable: "每条断言的证据文件或删除决定；客户与工程的公开授权记录；更新后的对外材料。",
    acceptance: "第八节每一类断言都有一个结果：证据、改写后的表述，或删除。没有『口径待定』的条目。",
  });
}

/*
 * LANGUAGE, CHOSEN FIELD BY FIELD RATHER THAN THROUGH THE DICTIONARY. Every field here interleaves
 * counts with a sentence, so a per-language template would put the same expression in two places and
 * the two would drift. One ternary per field keeps the arithmetic in one place and the sentence in
 * two - which is the shape of the problem.
 */
advice.push(
  zeroMentionNonBrand.length > 0
    ? {
        title:
          lang === "en"
            ? "P1-1 Publish citable content for the questions that never mention the brand"
            : "P1-1 针对 0 次提及的问题补可引用内容",
        problem:
          lang === "en"
            ? `Across the ${totals.nonBrandQuestions} questions without the brand name and their ${totals.nonBrandRuns} runs, the brand is mentioned ${totals.nonBrandBrandMentions} times; ` +
              `${zeroIds} is mentioned in none of ${zeroMentionNonBrand[0]?.okRuns ?? runsPerQuestion} runs.` +
              (mentionedNonBrand.length > 0
                ? ` ${mentionedNonBrand.map((q) => q.id).join(", ")} were mentioned, which shows the citable material already covers some phrasings and not others.`
                : "")
            : `不含品牌名的 ${totals.nonBrandQuestions} 道题、共 ${totals.nonBrandRuns} 次运行里，品牌被提及 ${totals.nonBrandBrandMentions} 次；` +
              `其中 ${zeroIds} 在 ${zeroMentionNonBrand[0]?.okRuns ?? runsPerQuestion} 次运行里一次都没有被提到。` +
              (mentionedNonBrand.length > 0
                ? `而 ${mentionedNonBrand.map((q) => q.id).join("、")} 提到过——差别说明现有可被引用的材料覆盖了一部分问法，没有覆盖另外一部分。`
                : ""),
        action:
          lang === "en"
            ? `Build citable pages around the vocabulary of ${zeroIds}: what the product is and where it applies, testing and certification, participation in standards, real cases. ` +
              "Put that content where the answers already cite from - industry portals and directories, standards and certification pages - rather than only on the company's own site."
            : `围绕 ${zeroIds} 的用词建立可引用页面：产品与适用场景、检测与认证、标准参与情况、真实案例。` +
              "优先把内容放到回答已经引用过的域名类型上（行业门户、行业目录、标准与认证页面），而不是只发在自家官网。",
        deliverable:
          lang === "en"
            ? `Content pages covering the vocabulary of ${zeroIds}, each one backed by evidence that can be checked.`
            : `覆盖 ${zeroIds} 用词的内容页面；每条内容对应一个可核验的证据。`,
        acceptance:
          lang === "en"
            ? `On the retest, ${zeroIds} moving from 0 to a non-zero count is progress; if it stays at 0, the conclusion is that the content has not been cited yet, not that the same pages should be written again.`
            : `复测时 ${zeroIds} 的计数从 0 变成非 0 即为进展；没有变成非 0 时，结论是内容还没有被引用，而不是要再写一遍同样的东西。`,
      }
    : {
        title:
          lang === "en"
            ? "P1-1 Hold: every question without the brand name mentions it at least once"
            : "P1-1 保持：不含品牌名的问题全部至少被提到过一次",
        problem:
          lang === "en"
            ? `Across the ${totals.nonBrandQuestions} questions without the brand name and their ${totals.nonBrandRuns} runs, the brand is mentioned ${totals.nonBrandBrandMentions} times, with no question at zero. ` +
              "That is a baseline, not a conclusion: it says these questions were thought of in this one measurement."
            : `不含品牌名的 ${totals.nonBrandQuestions} 道题、共 ${totals.nonBrandRuns} 次运行里，品牌被提及 ${totals.nonBrandBrandMentions} 次，没有 0 次提及的题。` +
              "这是一个基线，不是结论：它只说这几道题在这一次测量里被想到了。",
        action:
          lang === "en"
            ? "List the domains the answers cited and the phrasings that appeared in them, say which pages are carrying that result, compare question by question at the next retest, and record the bank fingerprint and the model version alongside it."
            : "把本次被引用的域名与出现在回答里的表述整理成清单，明确哪些页面在支撑这个结果，下一次复测时逐题对照，并把这份题库的指纹与模型版本一起记录下来。",
        deliverable:
          lang === "en"
            ? "A list of the domains and phrasings the answers cited in this measurement, each tied to the questions it supported."
            : "本次测量里回答引用过的域名与表述清单；每条对应它支撑的题目。",
        acceptance:
          lang === "en"
            ? `On the retest, per-question counts are no lower than this run's (${questions
                .map((q) => `${q.id} ${q.brandMentions}/${q.okRuns}`)
                .join(", ")}); a question that drops must be traceable to a specific change.`
            : `复测时逐题计数不低于本次（${questions
                .map((q) => `${q.id} ${q.brandMentions}/${q.okRuns}`)
                .join("、")}）；下降的题要能指出是哪一次变化的。`,
      }
);

/**
 * THE PLAN IS A SCHEDULE, NOT A FORECAST, and every row names the same bank fingerprint the whole document
 * names: a re-test on a different bank is a different measurement.
 */
const planZh: string[][] = [
  [
    "第 1—14 天",
    entityFirstQuestion
      ? `统一实体口径：确认法定全称、官方简称、曾用名与各口语名的使用场合，上线官网事实页（针对 ${nameQuestionFacts
          .map((q) => q.id)
          .join("、")} 这几道题）。`
      : "补齐 intake 的别名与曾用名字段，让题库下一次能出名字题（本次没有测到这一层）。",
    "1 份实体事实表（含出处与日期）；官网事实页链接；标准问答",
  ],
  [
    "第 15—30 天",
    claims.length > 0
      ? `核验第八节的 ${claims.length} 类带数字断言，逐条找证据或删除。`
      : "把回答里出现过的事实表述整理成清单，注明出处。",
    "每条断言的证据或删除决定；客户与工程授权记录",
  ],
  [
    "第 31—60 天",
    zeroMentionNonBrand.length > 0
      ? `针对 ${zeroIds} 补可引用内容，优先放到回答已经引用过的来源类型上。`
      : "把本次被引用的来源类型整理出来，作为后续内容的投放位置参考。",
    "内容页面清单与链接；每条对应的证据",
  ],
  [
    "第 61—90 天",
    `用同一份题库（指纹 ${bankFingerprint || "见第一节"}）、同一模型、同样 ${runsPerQuestion} 次运行复测，逐题对照计数，并记录模型版本与日期。`,
    `同题复测的原始回答文件；逐题计数对照表（本次基线 ${totals.nonBrandBrandMentions} / ${totals.nonBrandRuns}）`,
  ],
];

const planEn: string[][] = [
  [
    "Days 1-14",
    entityFirstQuestion
      ? `Settle the entity: agree the legal name, the official short form, former names and where each one is used, and publish a facts page on the site (for questions ${nameQuestionFacts
          .map((q) => q.id)
          .join(", ")}).`
      : "Fill in the intake's alias and former-name fields, so the next bank can produce a name question (this run never measured that layer).",
    "One entity facts sheet (with sources and dates); a link to the site's facts page; standard answers",
  ],
  [
    "Days 15-30",
    claims.length > 0
      ? `Verify the ${claims.length} kinds of number-bearing assertion listed in section 8 - find evidence for each, or remove it.`
      : "Turn the factual statements that appeared in the answers into a list, with sources.",
    "Evidence, or a decision to remove, for every assertion; a record of who authorised it",
  ],
  [
    "Days 31-60",
    zeroMentionNonBrand.length > 0
      ? `Publish citable content for ${zeroIds}, prioritised on the kinds of source the answers already cite.`
      : "List the kinds of source this run cited, as placement targets for later content.",
    "A list of content pages and their links; the evidence behind each one",
  ],
  [
    "Days 61-90",
    `Re-run the same bank (fingerprint ${bankFingerprint || "see section 1"}), the same model and the same ${runsPerQuestion} runs, compare the counts question by question, and record the model version and the date.`,
    `The raw answer files from the re-run; a per-question count comparison (this baseline ${totals.nonBrandBrandMentions} / ${totals.nonBrandRuns})`,
  ],
];

const plan: string[][] = lang === "en" ? planEn : planZh;

const limitsZh: string[] = [
  competitorsMeasured
    ? `竞品只统计客户在 intake 里点名的 ${competitorRows.length} 家。回答里提到的其他厂商没有被计数，本报告也不据此对任何一家作判断。`
    : "没有测量任何竞品。这份数据里没有第二家公司的提及计数，所以报告里没有竞品对比、没有份额、没有排名。",
  "没有做情感分析。『提及』只表示答案里出现了品牌名或品牌名的一个写法，不表示评价是正面还是负面。",
  `信源列表是回答引用过的域名，不是影响力排名。${citationEvents} 次引用事件分布在 ${domainMap.size} 个域名上，出现在前面只说明被链接得多。`,
  `只有一个模型、一天的数据：${modelDisplay}，${measuredOn}，${webSearch ? "开启联网搜索" : "关闭联网搜索"}，每题 ${runsPerQuestion} 次运行。` +
    "同一天、同一模型、同一批问题的观测，不是趋势，也不代表其他模型或其他日期。",
  "回答里的事实断言（数量、客户名称、资质荣誉等）本报告没有核验，只记录它们出现在哪一次运行里。",
  `失败的行按未测量处理。本文件 ${parsedLines} 行里有 ${rejected.length} 行是失败记录（${failureDigest || "无"}），它们没有被当作 0 次提及；` +
    `如果某道题一次都没有完成，表格会写『未测量』而不是 0。本次 ${questions.length} 道题各有 ${runsPerQuestion} 次目标运行。`,
  truncatedTotal > 0
    ? `有 ${truncatedTotal} 次调用被截断（超时或流中断），截断的回答仍然计费，所以它们既不出现在计数里，也不被当成 0 次提及；每一行的 status 与 usage 都保留了。`
    : "本次没有出现被截断（超时或流中断）的调用。",
  runMode === "api"
    ? "测的是 API 返回的回答，不是网页界面上用户看到的回答。两者可能不同，本报告没有做这个对照。"
    : runMode === "replay"
      ? "本次的采集模式是 replay：答案来自一次真实 API 调用的记录，本次只按当前规则重新计算了提及标注（例如新加的竞品标注），没有发出任何新的调用；token 用量与失败行都沿用那次记录。"
      : `本次的采集模式是 ${runModeLabelText}：文件里的回答不是模型输出，这份报告只能用来验证「题库 → 运行文件 → 报告」这条链路，不能作为任何对外结论。`,
];

const limitsEn: string[] = [
  competitorsMeasured
    ? `Competitors are counted only for the ${competitorRows.length} names the client listed in the intake. Other vendors the answers mention are not counted, and this report draws no conclusion about any of them.`
    : "No competitor was measured. This data holds no mention counts for a second company, so the report has no competitor comparison, no share of voice and no ranking.",
  "No sentiment analysis. 'Mentioned' means the brand name or one of its spellings appears in the answer text; it says nothing about whether the mention is positive or negative.",
  `The source list is the domains the answers cited, not an authority ranking. ${citationEvents} citation events fall across ${domainMap.size} domains, and appearing near the top means only that the domain was linked more often.`,
  `One model, one day: ${modelDisplay}, ${measuredOn}, ${webSearch ? "web search on" : "web search off"}, ${runsPerQuestion} runs per question.` +
    " Observations on one day, of one model, over one set of questions are not a trend, and they do not stand for another model or another date.",
  "Assertions inside the answers (numbers, customer names, credentials) were not verified by this report; it records only which run each appeared in.",
  `Failed lines are treated as not measured. Of the ${parsedLines} lines in this file, ${rejected.length} are failure records (${failureDigest || "none"}); they are not counted as zero mentions, and a question with no completed run reads 'not measured' rather than 0. This run's target was ${runsPerQuestion} runs for each of ${questions.length} questions.`,
  truncatedTotal > 0
    ? `${truncatedTotal} calls were truncated (timeout or interrupted stream). A truncated answer is still billed, so it enters no count and is not treated as zero mentions; the status and usage of every line are kept.`
    : "No call in this run was truncated (timeout or interrupted stream).",
  runMode === "api"
    ? "This measures the answers an API returned, not what a person sees in a chat window. The two can differ, and this report did not compare them."
    : runMode === "replay"
      ? "The collection mode for this report is replay: the answers come from a recorded real API call, and only the mention marks were recomputed under the current rules - for example the competitor marks added later. No new call was made, and token usage and failed lines are carried over from that recording."
      : `The collection mode for this run is ${runModeLabelText}: the answers in the file are not model output, so this report can only verify the chain from bank to run file to report, and it is not evidence for any claim about the outside world.`,
];

const limits: string[] = lang === "en" ? limitsEn : limitsZh;

if (!header) {
  limits.push(
    lang === "en"
      ? "This run file has no provenance header: the model name, the date, the web-search state and the bank fingerprint were taken by this report from the command line or from the filename, not recorded at collection time. For a checkable source, re-run npm run measure."
      : "这份运行文件没有 provenance 头（run-header）：模型名、日期、联网搜索状态与题库指纹都是本报告从命令行或文件名里取的，不是采集时的记录。要拿到可核对的来源，请用 npm run measure 重新采集。"
  );
}
if (header?.intake?.sha256_matches === false) {
  limits.push(
    lang === "en"
      ? "The intake was edited after the bank was generated: this report decides brand and alias mentions from the file's current content, while the questions are still the bank's frozen wording. The two are different in scope, so these numbers cannot be placed beside a baseline."
      : "intake 在题库生成之后被改过：本次的品牌名与别名判定用的是文件当前内容，而题面仍是题库里的原题面，两者口径不同，数字不能直接与基线并列。"
  );
}

const codingZh: string[][] = [
  ["id", "题库里的题号（如 C1、F4），由 build-question-bank.mts 生成", "报告里逐题引用；复测时用它对齐同一道题"],
  ["q", "本次运行里的序号（1 到题数），按题库顺序", "报告里写作 Q1…；与 id 一一对应"],
  [
    "group",
    `题库自己的问法原型 id（本次：${groups.map((g) => g.id).join(" / ")}）`,
    "分组统计与分组合计；各组的分母不同，不能相加",
  ],
  ["question", "问题原文", "逐题表格与复测时的问题版本"],
  ["run", `第几次运行（1 到 ${runsPerQuestion}）`, "报告里写作『第 N 次运行』；同题的多次运行是多个独立会话"],
  ["ok", "这次调用是否拿到完整回答", "只统计 ok=true 的行；ok=false 的行不进入任何计数"],
  [
    "status / errorBody",
    "HTTP 状态与错误正文；超时记为 timeout，重放缺失记为 replay-missing",
    `只用于说明被排除的行是什么（本次：${failureDigest || "无失败行"}）`,
  ],
  ["attempts", "这一次运行用掉了几次调用（失败会重试）", "成本口径：重试与被截断的调用都已经计费"],
  ["truncated", "这次调用是否被截断（超时或流中断）", "截断的回答不计入计数，但它的 token 用量已经发生"],
  [
    "mentionsBrand",
    `答案里是否出现品牌名或它的别名：${brandTokens.map((t) => t.value).join(" / ")}`,
    "品牌提及次数——本报告的核心数字",
  ],
  ["mentionsPrimary", `答案里是否出现法定名称：${BRAND}`, "实体识别一节的判定字段"],
  [
    "mentionsCoatings",
    hasCategoryTokens
      ? `答案里是否出现客户自己的品类词：${categoryTokensForReport.map((t) => t.value).join(" / ")}`
      : "本次无法判定（intake 没有填 industry.category_terms）",
    "『品类词提及』一列，用来说明回答确实在谈这个品类",
  ],
  ["domains", "这次回答引用的域名列表", "信源网络一节；一次回答里同一域名只计 1 次"],
  ["usage.total_tokens", "这次调用的 token 用量", `总用量口径（本次 ${totalTokens}，见元数据）`],
  ["usage.tool_usage.web_search", "这次调用里联网搜索的次数", "证明这次是按 header 记录的搜索设置跑出来的"],
  ["answer", "模型返回的完整回答文本", "原文摘录与断言定位的来源"],
];

const codingEn: string[][] = [
  ["id", "the question's id in the bank (C1, F4, ...), written by build-question-bank.mts", "cited per question throughout the report; a retest uses it to line up the same question"],
  ["q", "this run's index (1 to the number of questions), in bank order", "printed as Q1... in the report; one-to-one with id"],
  [
    "group",
    `the bank's own archetype id (this run: ${groups.map((g) => g.id).join(" / ")})`,
    "group statistics and totals; the denominators differ by group and cannot be added together",
  ],
  ["question", "the question text", "the per-question tables, and the wording a retest has to reuse"],
  ["run", `which run this was (1 to ${runsPerQuestion})`, "printed as 'run N'; several runs of one question are separate sessions"],
  ["ok", "whether this call produced a complete answer", "only ok=true lines are counted; an ok=false line enters no count at all"],
  [
    "status / errorBody",
    "HTTP status and error body; a timeout is recorded as timeout, a missing replay line as replay-missing",
    `used only to say what the excluded lines are (this run: ${failureDigest || "no failed lines"})`,
  ],
  ["attempts", "how many calls this run consumed (failures are retried)", "the cost basis: retried and truncated calls were both billed"],
  ["truncated", "whether this call was cut off (timeout or interrupted stream)", "a truncated answer enters no count, but its tokens were already spent"],
  [
    "mentionsBrand",
    `whether the answer contains the brand name or one of its aliases: ${brandTokens.map((t) => t.value).join(" / ")}`,
    "the brand-mention count - this report's headline figure",
  ],
  ["mentionsPrimary", `whether the answer contains the legal name: ${BRAND}`, "the field the entity section classifies"],
  [
    "mentionsCoatings",
    hasCategoryTokens
      ? `whether the answer contains one of the client's own category terms: ${categoryTokensForReport.map((t) => t.value).join(" / ")}`
      : "could not be decided in this run (the intake has no industry.category_terms)",
    "the 'category mentions' column, which shows the answer really was about this category",
  ],
  ["domains", "the domains this answer cited", "the source-network section; a domain cited twice inside one answer counts once"],
  ["usage.total_tokens", "the token usage of this call", `the total-usage figure (this run ${totalTokens}, see the metadata sheet)`],
  ["usage.tool_usage.web_search", "how many web searches this call made", "evidence that this run used the search setting the header records"],
  ["answer", "the complete answer text the model returned", "the source for the extracts and for locating assertions"],
];

const coding: string[][] = lang === "en" ? codingEn : codingZh;

/**
 * THE METHOD SENTENCES. The four facts verification cares about - model, date, runs per question and whether
 * web search was on - are read from the run header and printed here as the collector's own record. What the
 * answers actually ARE is a fifth fact, and it is the one a reader must not have to infer: a dry run and a
 * replay call no model, so "web search on" is a configuration record rather than something that happened,
 * and the sentence says so.
 */
const searchSentenceZh =
  runMode === "api"
    ? webSearch
      ? "开启联网搜索（tools: [web_search]）"
      : "没有开启联网搜索"
    : runMode === "dry-run"
      ? `采集配置记录的是${webSearch ? "开启" : "关闭"}联网搜索，但本次是 dry-run，没有发出任何调用`
      : runMode === "replay"
        ? `搜索设置取自被回放的那次运行（${webSearch ? "开启" : "关闭"}），本次没有发出任何调用`
        : `${webSearch ? "开启" : "关闭"}联网搜索`;

const searchSentenceEn =
  runMode === "api"
    ? webSearch
      ? "web search on (tools: [web_search])"
      : "web search off"
    : runMode === "dry-run"
      ? `the collection config records web search ${webSearch ? "on" : "off"}, but this run was a dry run and made no call at all`
      : runMode === "replay"
        ? `the search setting is taken from the run that was replayed (${webSearch ? "on" : "off"}), and this run made no call at all`
        : `web search ${webSearch ? "on" : "off"}`;

const searchSentence = lang === "en" ? searchSentenceEn : searchSentenceZh;

const methodZh: string[] = [
  `本报告的每一次计数都来自 ${displayPath(answersPath)} 里 ok=true 的 ${answers.length} 条记录：${questions.length} 道问题（题库指纹 ${bankFingerprint || "未记录"}），` +
    `每题 ${runsPerQuestion} 次运行，合计 ${totals.runs} 次完成的回答。模型是 ${modelDisplay}，测量日期 ${measuredOn}，` +
    `${searchSentence}，采集模式 ${runMode}` +
    `${header?.run?.endpoint ? `（${header.run.endpoint}）` : ""}` +
    `${header?.run?.gap_ms !== undefined ? `，每次调用之间至少间隔 ${header.run.gap_ms}ms` : ""}` +
    `${header?.run?.timeout_ms !== undefined ? `，每次调用上限 ${header.run.timeout_ms}ms（超时会记在该行的 status 里）` : ""}。` +
    "这四项（模型、日期、每题次数、是否联网）都取自运行文件第一行的 provenance 头，不是本报告的命令行参数。",
  rejected.length > 0
    ? `这个文件一共 ${parsedLines} 条回答记录，其中 ${rejected.length} 条是失败记录（${failureDigest}），它们在计数之前就被排除：` +
      `本报告所有数字只用另外 ${answers.length} 条。被排除的行没有被当成 0 次提及——把限流或超时读成『品牌没有被提到』，正是这份报告要避免的错误。`
    : `这个文件一共 ${parsedLines} 条回答记录，没有失败记录：${questions.length} 道题各有 ${runsPerQuestion} 次完整回答。` +
      "如果有调用被拒绝或超时，它们会被单独记下来并在计数之前排除——把限流读成『品牌没有被提到』，正是这份报告要避免的错误。",
  runMode === "api"
    ? `调用次数：这次采集一共发起了 ${attemptsTotal} 次调用（含重试）${truncatedTotal > 0 ? `，其中 ${truncatedTotal} 次被截断` : ""}` +
      `${timeoutsTotal > 0 ? `，${timeoutsTotal} 次触发超时` : ""}。截断与超时的调用同样计费，所以每一行都记了 attempts 和 questionAttempts（累计到该题）；` +
      "把重试次数藏起来会让成本口径对不上，这是上一次采集留下的教训。"
    : `调用次数：0。本次是 ${runMode}，没有向任何模型发起调用，所以 token 用量是 0、attempts 是 0；` +
      "这两处的 0 是事实，不是缺失。真实采集时每一行都会记 attempts（含重试），因为被截断的调用同样计费。",
  `模型名与测量日期来自运行文件的 provenance 头（${modelSource}；日期来源：${dateSource}）。` +
    (header
      ? "采集脚本 scripts/report/run-bank.mts 在开跑前把这些字段写进第一行，所以它们与回答是同一个文件、同一时刻的记录。"
      : "这份文件没有 provenance 头，两项都是本报告的输入参数。"),
  "mentionsBrand 与 mentionsCoatings 是采集脚本在写入每一行时判定的，判定规则见『标注字段口径』。本报告直接读这两个字段，不重新判定，所以报告里的数字和采集时的判定完全一致——包括判定可能存在的偏差。",
  `本报告不出现百分比：每个数字都写成『几次运行里几次』。${runsPerQuestion} 次运行不足以支撑一个比例，这是服务定义里写死的口径，也是这份数据唯一诚实的报法。`,
];

const methodEn: string[] = [
  `Every count in this report comes from the ${answers.length} ok=true records in ${displayPath(answersPath)}: ${questions.length} questions (bank fingerprint ${bankFingerprint || "not recorded"}), ` +
    `${runsPerQuestion} runs each, ${totals.runs} completed answers in total. The model was ${modelDisplay}, measured on ${measuredOn}, ` +
    `${searchSentence}, collection mode ${runMode}` +
    `${header?.run?.endpoint ? ` (${header.run.endpoint})` : ""}` +
    `${header?.run?.gap_ms !== undefined ? `, at least ${header.run.gap_ms}ms between calls` : ""}` +
    `${header?.run?.timeout_ms !== undefined ? `, ${header.run.timeout_ms}ms per call (a timeout is recorded in that line's status)` : ""}. ` +
    "All four - model, date, runs per question and web search - come from the provenance header on the first line of the run file, not from this report's command-line arguments.",
  rejected.length > 0
    ? `The file holds ${parsedLines} answer records, of which ${rejected.length} are failure records (${failureDigest}); they are excluded before anything is counted, and every figure in this report uses the other ${answers.length}. ` +
      `The excluded lines are not treated as zero mentions - reading a rate limit or a timeout as "the brand was not mentioned" is the exact error this report exists to avoid.`
    : `The file holds ${parsedLines} answer records and no failure records: each of the ${questions.length} questions has ${runsPerQuestion} complete answers. ` +
      "A refused or timed-out call would be recorded separately and excluded before counting - reading a rate limit as \"the brand was not mentioned\" is the exact error this report exists to avoid.",
  runMode === "api"
    ? `Calls: this collection made ${attemptsTotal} calls in total (retries included)${truncatedTotal > 0 ? `, ${truncatedTotal} of them truncated` : ""}` +
      `${timeoutsTotal > 0 ? `, ${timeoutsTotal} of them hitting a timeout` : ""}. Truncated and timed-out calls are billed the same, so every line records attempts and questionAttempts (cumulative for its question); ` +
      "hiding the retries would leave the cost figures unreconcilable, which is the lesson the previous collection left behind."
    : `Calls: 0. This run is a ${runMode}, so no call was made to any model and both token usage and attempts are 0; ` +
      "those two zeros are facts, not gaps. In a real collection every line records attempts (retries included), because a truncated call is billed the same.",
  `The model name and the measurement date come from the run file's provenance header (model: ${header ? "recorded by the collector" : "supplied on the command line"}; date: ${header ? "recorded by the collector" : "passed to this report"}). ` +
    (header
      ? "The collector scripts/report/run-bank.mts writes those fields into the first line before the run starts, so they sit in the same file, recorded at the same moment as the answers."
      : "This file has no provenance header, so both are inputs this report was given."),
  "mentionsBrand and mentionsCoatings are decided by the collector as it writes each line, and the rules are printed under 'how each marked field is decided'. This report reads those two fields instead of deciding again, so its numbers match the collection exactly - including whatever bias the decision carried.",
  `There are no percentages in this report: every number is written as a count. ${runsPerQuestion} runs cannot support a ratio - that is fixed in the service definition, and it is the only honest way to report this data.`,
];

const method: string[] = lang === "en" ? methodEn : methodZh;

function isBlank(text: string): boolean {
  return !text || text.trim().length === 0;
}

const provenanceZh: string[] = [
  `题库：${displayPath(header?.bank?.path) || "（运行文件没有记录题库路径）"}`,
  `题库指纹：${bankFingerprint || "（未记录）"}${
    header?.bank?.fingerprint_verified === true ? "（采集脚本重算核对通过）" : ""
  }；来源 intake：${displayPath(header?.intake?.resolved_path) || "（未记录）"}`,
  `批准：${bankApprovedBy ? `${bankApprovedBy}　${bankApprovedOn || "（未写日期）"}` : "（空：题库还没有批准人签字）"}`,
  `数据文件：${displayPath(answersPath)}（${parsedLines} 条回答记录，其中 ok=true ${answers.length} 条、失败 ${rejected.length} 条）。`,
  `采集脚本：${header?.collector?.script ?? "（运行文件没有记录采集脚本）"}` +
    (header?.collector?.version !== undefined ? ` v${header.collector.version}` : "") +
    (header?.collector?.script_sha256 ? `，script sha256 ${String(header.collector.script_sha256).slice(0, 16)}…` : "") +
    `；模式 ${runMode}${header?.run?.answers_source ? `（${header.run.answers_source}）` : ""}。`,
  `模型名：${modelDisplay}（${modelSource}）。`,
  `测量日期：${measuredOn}（${dateSource}）。`,
  `联网搜索：${webSearch ? "开启" : "关闭"}（记录在运行文件的 provenance 头里）。`,
  `品牌提及判定使用的写法：${brandTokens.map((t) => `${t.value}（${t.field}）`).join("、")}` +
    `；来源：${
      header?.brand?.tokens_source === "intake"
        ? "intake"
        : header
          ? "题库题面记录的槽位（intake 不可用，是子集）"
          : "命令行 --brand / --alias"
    }。`,
  `品类词：${
    hasCategoryTokens
      ? categoryTokensForReport.map((t) => t.value).join("、")
      : "（intake 未填 industry.category_terms，本次没有品类词提及数字）"
  }`,
  isBlank(intakeDrift) ? "intake 与题库记录一致。" : intakeDrift,
  "报告结构：章节顺序参照一份外部交付物的目录与表格形态，仅取结构。文字、表格内容、结论全部重写：那是别人做的交付物，逐字照搬既有授权问题，也会让这份报告把合成数据当成实测结果——该文件的数字是按预设规则与固定随机种子合成的，本报告的每一个数字都来自真实记录。",
  "本报告由 scripts/report/build-visibility.mts 生成，DOCX/XLSX 由 scripts/report/render-report.py 渲染；同一份模型文件也可以单独重渲染。",
];

const provenanceEn: string[] = [
  `Bank: ${displayPath(header?.bank?.path) || "(the run file records no bank path)"}`,
  `Bank fingerprint: ${bankFingerprint || "(not recorded)"}${
    header?.bank?.fingerprint_verified === true ? " (recomputed and verified by the collector)" : ""
  }; intake source: ${displayPath(header?.intake?.resolved_path) || "(not recorded)"}`,
  `Approval: ${bankApprovedBy ? `${bankApprovedBy} ${bankApprovedOn || "(no date written)"}` : "(empty: the bank carries no signed approval)"}`,
  `Data file: ${displayPath(answersPath)} (${parsedLines} answer records: ${answers.length} ok=true, ${rejected.length} failed).`,
  `Collector: ${header?.collector?.script ?? "(the run file records no collector)"}` +
    (header?.collector?.version !== undefined ? ` v${header.collector.version}` : "") +
    (header?.collector?.script_sha256 ? `, script sha256 ${String(header.collector.script_sha256).slice(0, 16)}...` : "") +
    `; mode ${runMode}${header?.run?.answers_source ? ` (${header.run.answers_source})` : ""}.`,
  `Model name: ${modelDisplay} (${header ? "recorded by the collector" : "supplied on the command line"}).`,
  `Date measured: ${measuredOn} (${header ? "recorded by the collector" : "passed to this report"}).`,
  `Web search: ${webSearch ? "on" : "off"} (recorded in the run file's provenance header).`,
  `Spellings used to decide a brand mention: ${brandTokens.map((t) => `${t.value} (${t.field})`).join(", ")}` +
    `; source: ${
      header?.brand?.tokens_source === "intake"
        ? "the intake"
        : header
          ? "the slots recorded in the bank (the intake was unavailable, so this is a subset)"
          : "the --brand / --alias command-line arguments"
    }.`,
  `Category terms: ${
    hasCategoryTokens
      ? categoryTokensForReport.map((t) => t.value).join(", ")
      : "(the intake left industry.category_terms empty, so this run has no category-mention figures)"
  }`,
  isBlank(intakeDrift) ? "The intake agrees with the bank's record." : intakeDrift,
  "Structure: the order of sections follows the contents and table shapes of an external deliverable, and follows nothing else. The wording, the tables and the conclusions were all written again: that document belongs to someone else, copying it verbatim would raise a licensing question, and it would also let this report pass synthesised data off as a measurement - its figures were generated from a preset rule and a fixed random seed, while every number here comes from a real record.",
  "This report is generated by scripts/report/build-visibility.mts and the DOCX/XLSX are rendered by scripts/report/render-report.py; the same model file can also be re-rendered on its own.",
];

const provenance: string[] = lang === "en" ? provenanceEn : provenanceZh;

/**
 * THE CHECK THAT REFUSES A HALF-TRANSLATED REPORT.
 *
 * The report's text comes from two places: the COPY dictionaries, which have an English half, and
 * prose built inline in this file (limits, method, provenance, the coding table, the plan, the advice
 * scaffolding). A language switch over the dictionaries alone would produce an English document with
 * Chinese appendices, which is worse than a document that is uniformly one language - so this scans
 * every string WE author and fails the build on any CJK character in an English report.
 *
 * WHY A CHARACTER SCAN AND NOT A KEY-PARITY CHECK: parity proves the two dictionaries match and says
 * nothing about the inline prose. This catches both, and it counts what is left rather than naming a
 * missing key somewhere in a 2600-line file.
 *
 * WHAT IT DELIBERATELY DOES NOT SCAN: anything quoted from the client or from a model's answer -
 * question text, brand spellings, answer excerpts, domain names. Those are verbatim and may contain
 * any script; an English report of a Chinese brand is still an English report.
 */

/** CJK ideographs plus the fullwidth/CJK punctuation block: what makes a Chinese sentence Chinese. */
const HAS_CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

/** Every string this pipeline authors for the reader, gathered so the check cannot miss a block. */
function authoredProse(): [string, string][] {
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(FILLED_COPY)) out.push([`copy.${key}`, value]);
  limits.forEach((v, i) => out.push([`limits[${i}]`, v]));
  method.forEach((v, i) => out.push([`method[${i}]`, v]));
  provenance.forEach((v, i) => out.push([`provenance[${i}]`, v]));
  plan.forEach((row, i) => row.forEach((cell, c) => out.push([`plan[${i}][${c}]`, cell])));
  coding.forEach((row, i) => row.forEach((cell, c) => out.push([`coding[${i}][${c}]`, cell])));
  for (const item of advice) {
    out.push([`advice.${item.title}`, item.title]);
    out.push([`advice.problem`, item.problem]);
    out.push([`advice.action`, item.action]);
    out.push([`advice.deliverable`, item.deliverable]);
    out.push([`advice.acceptance`, item.acceptance]);
  }
  for (const g of groups) out.push([`groups.${g.id}.purpose`, g.purpose]);
  for (const q of quotes) out.push([`quotes.note:${q.label}`, q.note]);
  for (const c of claims) out.push([`claims.handling:${c.source}`, c.handling]);
  if (entityQuote) out.push(["entityQuote.note", entityQuote.note]);
  return out;
}

if (lang === "en") {
  const chinese = authoredProse().filter(([, value]) => HAS_CJK.test(value));
  if (chinese.length > 0) {
    throw new Error(
      [
        `报告语言是 en,但还有 ${chinese.length} 处本文案是中文 —— 现在停下,而不是印出一份中英混排的报告。`,
        `全部 ${chinese.length} 处:${chinese.map(([k]) => k).join("\n")}`,
        "把这几块改成按 lang 取值(zh/en 两条文案),这道检查就会放行。",
      ].join("\n")
    );
  }
}

const model = {
  reportType: "ai-visibility",
  generatedBy: "geo-scanner scripts/report/build-visibility.mts",
  lang,
  /**
   * THE FILLED COPY, not the templates. render-report.py prints these strings verbatim and never substitutes
   * into them - that is what keeps the DOCX and the Markdown saying the same thing - so a placeholder that
   * reached this point would be printed as one. See the leftover check above.
   */
  copy: FILLED_COPY,
  /** Whether this run file carried per-answer competitor marks at all. The renderer branches on it. */
  competitorsMeasured,
  competitors: competitorRows,
  bank: {
    headerPresent: Boolean(header),
    path: header?.bank?.path ?? null,
    sha256: header?.bank?.sha256 ?? null,
    fingerprint: bankFingerprint || null,
    fingerprintRule: header?.bank?.fingerprint_rule ?? null,
    fingerprintVerified: header?.bank?.fingerprint_verified ?? null,
    generator: bankGenerator || null,
    generatedOn: header?.bank?.generated_on ?? null,
    approvedBy: bankApprovedBy,
    approvedOn: bankApprovedOn,
    frozenNote,
    language: header?.run?.language ?? null,
    rows: bankPageRows.map(([label, value]) => ({ label, value })),
    archetypes: groups.map((g) => {
      const meta = groupMeta.find((m) => m.id === g.id);
      return {
        id: g.id,
        label: g.label,
        short: g.short,
        /**
         * The per-archetype heading is composed HERE rather than in either renderer, for the reason the whole
         * copy block lives in this file: the DOCX and the Markdown must not be able to print two different
         * descriptions of the same group. One string, one author.
         */
        heading:
          `${g.label} · ${g.questions} 题` +
          (meta?.target ? `（目标 ${meta.target}${meta.status ? `，状态 ${meta.status}` : ""}）` : ""),
        measures: g.purpose,
        target: meta?.target ?? 0,
        generated: meta?.generated ?? g.questions,
        status: meta?.status ?? "",
        questions: g.questions,
      };
    }),
    questions: bankQuestions
      .slice()
      .sort((a, b) => a.q - b.q)
      .map((q) => ({ q: q.q, id: q.id, group: q.group, text: q.text })),
    nameQuestions: nameQuestions.map((n) => ({
      q: n.q,
      id: n.id,
      group: n.group,
      text: n.text,
      slot: n.slot,
      value: n.value,
    })),
    totalQuestions: bankQuestions.length,
  },
  meta: {
    subject: BRAND,
    subjectShort: BRAND,
    slug,
    measuredOn,
    measuredOnDisplay: measuredOn,
    model: modelDisplay,
    /**
     * WHERE THE MODEL NAME AND THE DATE CAME FROM, as two explicit fields rather than a footnote. They come
     * from the run file's own header now, which is the collector's record of what was called and when - not
     * from a flag somebody passed to this script after the fact.
     */
    modelSource,
    dateSource,
    webSearch,
    runsPerQuestion,
    answersFile: displayPath(answersPath),
    answersFileLines: parsedLines,
    answersOk: answers.length,
    answersFailed: rejected.length,
    failureSummary,
    totalTokens,
    webSearchCalls,
    citationEvents,
    distinctDomains: domainMap.size,
    runMode,
    // The mode label is a Chinese phrase by default, and it is interpolated into English sentences
  // (noScore2 among them), so it is chosen by language here rather than at each sentence.
  runModeLabel:
    lang === "en"
      ? ({ api: "live API collection", "dry-run": "dry run", replay: "replay" }[runMode] ?? runMode)
      : runModeLabelText,
    runSchema: header?.schema ?? null,
    attemptsTotal,
    timeoutsTotal,
    truncatedTotal,
    bankPath: displayPath(header?.bank?.path),
    bankFingerprint,
    bankApprovedBy,
    bankApprovedOn,
    bankLanguage: header?.run?.language ?? "",
    brandTokens: brandTokens.map((t) => t.value),
    generatedAt,
    generatedAtDisplay: stamp,
  },
  headline: {
    value: `${totals.nonBrandBrandMentions} / ${totals.nonBrandRuns}`,
    caption:
      lang === "en"
        ? `Questions without the brand name · the brand is mentioned in ${totals.nonBrandBrandMentions} of ${totals.nonBrandRuns} runs`
        : `不含品牌名的问题 · ${totals.nonBrandRuns} 次运行里，品牌被提及 ${totals.nonBrandBrandMentions} 次`,
    callout: T("summaryCallout"),
  },
  groups: groups.map((g) => ({
    id: g.id,
    label: g.label,
    short: g.short,
    purpose: g.purpose,
    reading: g.namesBrand
      ? `点名品牌的问题：${g.questions} 道、${g.runs} 次运行，品牌被提及 ${g.brandMentions} 次（${g.brandMentions} / ${g.runs}）。` +
        "问题里带着品牌名，所以这一组测的不是触达，而是回答得对不对、多次运行之间一致不一致。"
      : `不含品牌名的问题：${g.questions} 道、${g.runs} 次运行，品牌被提及 ${g.brandMentions} 次（${g.brandMentions} / ${g.runs}）。` +
        "问题里没有任何提示，回答里出现的是它自己想到的厂商——这是本报告里唯一能回答『陌生客户会不会遇到这家公司』的问法之一" +
        `（本次这样的组共 ${groups.filter((x) => !x.namesBrand).length} 个）。`,
    questions: g.questions,
    runs: g.runs,
    brandMentions: g.brandMentions,
    coatingsMentions: g.coatingsMentions,
  })),
  totals,
  questions,
  domains,
  claims,
  quotes,
  entityQuote,
  entityRuns,
  entityConclusion: {
    same: entityConnected,
    notSame: entityNotConnected,
    total: entityRunsTotal,
    rule: T("entityConclusionRule"),
  },
  limits,
  advice,
  plan,
  coding,
  method,
  provenance,
};

const modelPath = join(outDir, "visibility-model.json");
writeFileSync(modelPath, JSON.stringify(model, null, 2), "utf8");
console.log(`wrote ${modelPath}`);

/* ------------------------------------------------------------------ */
/* Markdown - rendered here, from the same model, so no Python needed  */
/* ------------------------------------------------------------------ */

const esc = (s: string) => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
/*
 * THE SECOND HALF OF THE LANGUAGE CHECK, AND WHY THERE ARE TWO. The group readings and the headline
 * are built inside the model above, because they interpolate counts that only exist there; every
 * other authored string is checked before the model is assembled. Between the two, no sentence this
 * pipeline writes for the reader goes unchecked in an English report.
 */
if (lang === "en") {
  const modelProse: [string, string][] = [
    ...model.groups.map((g) => [`groups.${g.id}.reading`, g.reading] as [string, string]),
    ["headline.caption", model.headline.caption],
    ["headline.callout", model.headline.callout],
  ];
  const chinese = modelProse.filter(([, value]) => HAS_CJK.test(value));
  if (chinese.length > 0) {
    throw new Error(
      `报告语言是 en,但还有 ${chinese.length} 处文案是中文:${chinese.map(([k]) => k).join("、")} —— 现在停下,而不是印出一份中英混排的报告。`
    );
  }
}

const md: string[] = [];
const table = (headers: string[], rows: string[][]) => {
  md.push(`| ${headers.map(esc).join(" | ")} |`);
  md.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) md.push(`| ${row.map(esc).join(" | ")} |`);
  md.push("");
};
const bullet = (s: string) => md.push(`- ${esc(s)}`);

/**
 * A figure in Markdown: the image, then its caption.
 *
 * WHY THE ALT TEXT IS THE CAPTION AND NOT A SHORT LABEL: the DOCX prints the caption under the picture, and
 * the Markdown is a separate deliverable of the same run. A short alt text here would mean the two documents
 * describe the same figure differently - and the caption is the part that says the labels are counts, so
 * dropping it is how a reader of the Markdown ends up reading a bar chart as a rate.
 */
const figure = (key: string, file: string) => {
  md.push(`![${T(key)}](charts/${file})`);
  md.push("");
  md.push(`*${T(key)}*`);
  md.push("");
};

md.push(`# ${BRAND} ${COPY.reportName}`);
md.push("");
md.push(`**${model.headline.value}** — ${model.headline.caption}`);
md.push("");
md.push(`> ${model.headline.callout}`);
md.push("");

table([COPY.tableItem, COPY.tableValue], [
  [COPY.kSubject, BRAND],
  [COPY.kModel, modelDisplay],
  [COPY.kRunMode, runModeLabelText],
  [COPY.kMeasuredOn, measuredOn],
  [COPY.kWebSearch, webSearch ? COPY.yes : COPY.no],
  [COPY.kRunsPerQuestion, String(runsPerQuestion)],
  [COPY.kAnswersFile, displayPath(answersPath)],
  [COPY.kCompleted, `${answers.length} / ${parsedLines}`],
  [COPY.kExcluded, failureSummary],
  [COPY.kTokens, String(totalTokens)],
  [COPY.kSearchCalls, String(webSearchCalls)],
  [COPY.kCitations, `${citationEvents} / ${domainMap.size}`],
  [COPY.kGeneratedAt, stamp],
]);

/* --- 一、题库 ------------------------------------------------------- */

md.push(`## ${COPY.sectionBank}`);
md.push("");
md.push(T("bankLead"), "");
table(
  [COPY.tableItem, COPY.tableValue],
  model.bank.rows.map((r) => [r.label, r.value])
);
if (T("bankFrozen")) {
  md.push(`> ${T("bankFrozen")}`);
  md.push("");
}
md.push(T("bankApprovalLine"), "");
if (T("bankIntakeDrift")) md.push(T("bankIntakeDrift"), "");
md.push(`### ${T("bankQuestionsTitle")}`);
md.push("");
for (const a of model.bank.archetypes) {
  const inGroup = model.bank.questions.filter((q) => q.group === a.id);
  if (inGroup.length === 0) continue;
  md.push(`#### ${a.heading}`);
  md.push("");
  if (a.measures) md.push(a.measures, "");
  table([COPY.thId, COPY.thText], inGroup.map((q) => [q.id, q.text]));
}

/* --- 二、执行摘要 --------------------------------------------------- */

md.push(`## ${COPY.sectionSummary}`);
md.push("");
md.push(`> ${T("summaryCallout")}`);
md.push("");
md.push(`### ${COPY.sectionSummaryConclusions}`);
md.push("");
for (const key of ["summaryReach", "summaryEntity", "summaryFacts"]) md.push(T(key), "");
md.push(`### ${COPY.sectionCoverage}`);
md.push("");
md.push(T("coverageLead"), "");
table(
  [COPY.thGroup, COPY.thQuestions, COPY.thRuns, COPY.thBrand, COPY.thCoatings],
  [
    ...groups.map((g) => [
      g.label,
      String(g.questions),
      String(g.runs),
      `${g.brandMentions} / ${g.runs}`,
      coatingsCell(g.coatingsMentions, g.runs),
    ]),
    [
      COPY.thTotal,
      String(questions.length),
      String(totals.runs),
      `${totals.brandMentions} / ${totals.runs}`,
      coatingsCell(totals.coatingsMentions, totals.runs),
    ],
  ]
);
md.push(T("coverageNote"), "");
figure("figGroups", "groups.png");
md.push(`### ${COPY.sectionNotMeasured}`);
md.push("");
for (const item of limits) bullet(item);
md.push("");

/* --- 三、总览 ------------------------------------------------------- */

md.push(`## ${COPY.sectionOverview}`);
md.push("");
md.push(T("overviewLead"), "");
table(
  [COPY.thNo, COPY.thId, COPY.thQuestion, COPY.thGroup, COPY.thBrand, COPY.thCoatings],
  questions.map((q) => [
    `Q${q.q}`,
    q.id,
    q.question,
    q.groupShort,
    `${q.brandMentions} / ${q.okRuns}`,
    coatingsCell(q.coatingsMentions, q.okRuns),
  ])
);
md.push(T("overviewTotals"), "");
md.push(T("overviewPrompted"), "");
figure("figMentions", "mentions.png");
md.push(`### ${COPY.sectionHowToRead}`);
md.push("");
for (const key of ["readCounts", "readPrompted", "readDenominator", "readSameDay"]) bullet(T(key));
md.push("");

/* --- 四、实体识别 --------------------------------------------------- */

md.push(`## ${COPY.sectionEntity}`);
md.push("");
md.push(T("entityLead"), "");
if (entityQuote) {
  md.push(`> ${entityQuote.text.replace(/\n/g, " ")}`);
  md.push("");
  md.push(`*${entityQuote.note}*`);
  md.push("");
  md.push(`### ${COPY.sectionEntityRuns}`);
  md.push("");
  md.push(T("entityRunsLead"), "");
  table(
    [COPY.thRun, COPY.thExcerpt],
    entityRuns.map((r) => [COPY.runLabel.replace("{n}", String(r.run)), r.text])
  );
  md.push(T("entityFinding"), "");
  figure("figEntity", "entity-conclusion.png");
  md.push(`*${T("entityConclusionLine")}*`);
  md.push("");
}

/* --- 五、按问法原型拆解 --------------------------------------------- */

md.push(`## ${COPY.sectionGroups}`);
md.push("");
md.push(T("groupsLead"), "");
for (const g of model.groups) {
  md.push(`### ${g.label}`);
  md.push("");
  md.push(g.reading, "");
  table(
    [COPY.thId, COPY.thQuestion, COPY.thBrand, COPY.thCoatings],
    questions
      .filter((q) => q.group === g.id)
      .map((q) => [q.id, q.question, `${q.brandMentions} / ${q.okRuns}`, coatingsCell(q.coatingsMentions, q.okRuns)])
  );
}

/* --- 六、竞品 ------------------------------------------------------- */

md.push(`## ${T("sectionCompetitors")}`);
md.push("");
md.push(`> ${T("competitorsCallout")}`);
md.push("");
if (competitorsMeasured) {
  md.push(T("competitorsLead"), "");
  md.push(`| ${T("thCompName")} | ${T("thCompNonBrand")} | ${T("thCompAll")} | ${T("thCompGroups")} |`);
  md.push("| --- | --- | --- | --- |");
  for (const row of competitorRows) md.push(`| ${row.name} | ${row.nonBrand} | ${row.all} | ${row.byGroup} |`);
  md.push("");
  md.push(T("competitorsNote"), "");
} else {
  md.push(T("competitorsBody"), "");
  for (const key of ["competitorsNone1", "competitorsNone2", "competitorsNone3"]) bullet(T(key));
}
md.push("");

/* --- 七、信源 ------------------------------------------------------- */

md.push(`## ${COPY.sectionSources}`);
md.push("");
md.push(T("sourcesLead"), "");
table(
  [COPY.thDomain, COPY.thCount, COPY.thWhere],
  domains.map((d) => [d.domain, String(d.count), d.groups.join("、")])
);
md.push(T("sourcesNote"), "");
figure("figSources", "sources.png");
md.push(`### ${COPY.sectionSourcesCaveat}`);
md.push("");
for (const key of ["sourcesCaveat1", "sourcesCaveat2", "sourcesCaveat3"]) bullet(T(key));
md.push("");

/* --- 八、断言 ------------------------------------------------------- */

md.push(`## ${COPY.sectionClaims}`);
md.push("");
md.push(`> ${T("claimsCallout")}`);
md.push("");
if (claims.length > 0) {
  table(
    [COPY.thClaim, COPY.thSource, COPY.thHandling],
    claims.map((c) => [c.claim, c.source, c.handling])
  );
}
md.push(T("claimsNote"), "");

/* --- 九、摘录 ------------------------------------------------------- */

md.push(`## ${COPY.sectionQuotes}`);
md.push("");
md.push(T("quotesLead"), "");
for (const q of quotes) {
  md.push(`### ${q.label}`);
  md.push("");
  md.push(`**${COPY.quoteQuestion}** ${q.question}`);
  md.push("");
  md.push(`**${COPY.quoteAnswer}** ${q.text.replace(/\n/g, " ")}`);
  md.push("");
  md.push(`*${q.note}*`);
  md.push("");
}

/* --- 十、建议 ------------------------------------------------------- */

md.push(`## ${COPY.sectionAdvice}`);
md.push("");
md.push(T("adviceLead"), "");
for (const item of advice) {
  md.push(`### ${item.title}`);
  md.push("");
  md.push(`**${COPY.adviceProblem}** ${item.problem}`);
  md.push("");
  md.push(`**${COPY.adviceAction}** ${item.action}`);
  md.push("");
  md.push(`**${COPY.adviceDeliverable}** ${item.deliverable}`);
  md.push("");
  md.push(`**${COPY.adviceAcceptance}** ${item.acceptance}`);
  md.push("");
}

md.push(`## ${COPY.sectionPlan}`);
md.push("");
table([COPY.thStage, COPY.thWork, COPY.thOutput], plan);
md.push(T("planNote"), "");

md.push(`## ${COPY.sectionNoScore}`);
md.push("");
md.push(T("noScoreLead"), "");
for (const key of ["noScore1", "noScore2", "noScore3", "noScore4"]) bullet(T(key));
md.push("");

md.push(`## ${COPY.sectionMethodAppendix}`);
md.push("");
md.push(`### ${COPY.sectionSampleDesign}`);
md.push("");
md.push(T("sampleDesignLead"), "");
table(
  [COPY.thGroup, COPY.thPurpose, COPY.thQuestions, COPY.thRuns],
  groups.map((g) => [g.label, g.purpose, String(g.questions), String(g.runs)])
);
md.push(`### ${COPY.sectionGeneration}`);
md.push("");
for (const text of method) md.push(text, "");
md.push(`### ${COPY.sectionCoding}`);
md.push("");
table([COPY.thField, COPY.thMeaning, COPY.thUsage], coding);
md.push(`### ${COPY.sectionReplication}`);
md.push("");
for (const key of ["replication1", "replication2", "replication3"]) bullet(T(key));
md.push("");

md.push(`## ${COPY.sectionQuestions}`);
md.push("");
md.push(`*${T("questionsLead")}*`);
md.push("");
table(
  [COPY.thNo, COPY.thId, COPY.thQuestion, COPY.thRun1, COPY.thRun2, COPY.thRun3, COPY.thBrand, COPY.thCoatings],
  questions.map((q) => [
    `Q${q.q}`,
    q.id,
    q.question,
    ...q.runMarks,
    `${q.brandMentions} / ${q.okRuns}`,
    coatingsCell(q.coatingsMentions, q.okRuns),
  ])
);

md.push(`## ${COPY.sectionProvenance}`);
md.push("");
for (const item of provenance) bullet(item);
md.push("");

const mdPath = join(outDir, "report.md");

/**
 * NO PLACEHOLDER MAY REACH THE MARKDOWN, and this is the check that says so after the fact.
 *
 * The DOCX is rendered from FILLED_COPY, which the leftover check above already covers. The Markdown is
 * assembled here and can reach for either block: `COPY` is the template and `T()` is the filled one, and
 * taking the wrong one is silent - the sentence reads correctly right up to the point where "{groupRuns}" is
 * printed at a client. One scan of the finished text is what turns that class of mistake into a failed build
 * instead of a document.
 */
const mdText = md.join("\n");
const mdPlaceholders = [...new Set(mdText.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) ?? [])];
if (mdPlaceholders.length > 0) {
  throw new Error(
    `Markdown placeholders survived into ${mdPath}: ${mdPlaceholders.join(", ")}. ` +
      "Copy strings must be read through T(), which returns the filled block."
  );
}
writeFileSync(mdPath, mdText, "utf8");
console.log(
  `wrote ${mdPath}  (${model.headline.value}, ${totals.brandMentions} brand mentions in ${totals.runs} runs)`
);

/* ------------------------------------------------------------------ */
/* Office formats, via the shared Python renderer                     */
/* ------------------------------------------------------------------ */

/**
 * The same interpreter probe build-report.mts uses, and the same rule about stdio: the probe is spawnSync
 * with stdio "ignore" and no shell, because with `shell: true` on Windows the nested quotes reach cmd.exe
 * rewritten and the import test reports "no Python" even when REPORT_PYTHON points straight at one.
 *
 * THE MODEL AND THE MARKDOWN ARE ALREADY WRITTEN when this probe fails, and they are complete documents on
 * their own - the Markdown is the whole report. But the DOCX is a deliverable of this product, so a missing
 * interpreter is reported loudly rather than passed over.
 */
const candidates = [...(process.env.REPORT_PYTHON ? [process.env.REPORT_PYTHON] : []), "python3", "python"];
const usable = candidates.find(
  (cmd) => spawnSync(cmd, ["-c", "import docx, openpyxl, PIL"], { stdio: "ignore" }).status === 0
);

if (!usable) {
  console.warn(
    [
      "",
      "SKIPPED .docx/.xlsx: no Python found with python-docx, openpyxl and Pillow.",
      "The model and the Markdown were still written. To finish, point REPORT_PYTHON at an",
      "interpreter that has them:",
      "",
      "  REPORT_PYTHON=/path/to/python npm run report:visibility -- --answers=" + answersArg,
      "",
    ].join("\n")
  );
  process.exit(0);
}

const renderer = join(HERE, "render-report.py");
const rendered = spawnSync(usable, [renderer, `--model=${modelPath}`, `--out=${outDir}`], {
  stdio: "inherit",
});

if (rendered.status !== 0) {
  console.error(
    `\nThe Python renderer exited with ${rendered.status}. The model and the Markdown are still usable.`
  );
  process.exit(rendered.status ?? 1);
}

console.log(`\nReport written to ${outDir}`);
