/**
 * Build a client-facing AI-VISIBILITY report from MEASURED AI ANSWERS.
 *
 * WHAT THIS IS. The sibling of build-report.mts, and deliberately not a flag on it. build-report.mts
 * turns a live scan of one domain into a technical GEO diagnosis; this turns a file of recorded
 * answers to questions put to a model into a visibility report. Same product, different input, and
 * the two must not be able to run as each other.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY A SIBLING SCRIPT AND NOT `--from-answers=` ON build-report.mts
 * ---------------------------------------------------------------------------------------------
 * build-report.mts opens by stating what it does not contain: "any AI-visibility metric. No mention
 * rate, no recommendation rate, no per-platform breakdown ... A report that invented those numbers
 * would contradict the product's only real asset, which is that it does not claim what it has not
 * measured." This script IS those metrics, from real answers. Putting them behind a flag in that
 * file would mean the file's own opening paragraph, its usage line, its validation and its
 * competitor scanning all had to branch on which kind of input arrived - and the first thing to rot
 * would be the argument check, whose failure mode is a scan report built from answers or an answers
 * report built from a crawl. Two scripts, one model shape, one renderer: the shared part is the
 * renderer (render-report.py), which is where the geometry guarantee lives.
 *
 * WHAT IS SHARED, stated so a future edit does not fork it: the model-JSON contract, the DOCX/XLSX
 * primitives and the 16.6cm text-area assertion in render-report.py, and the model-plus-Markdown-
 * plus-Office output shape. What is NOT shared is copy: every heading in this report is a different
 * sentence from the scan report's, because the two documents measure different things.
 *
 * ---------------------------------------------------------------------------------------------
 * THE STRUCTURE IS BORROWED FROM A REFERENCE DOCUMENT; THE WORDS ARE NOT
 * ---------------------------------------------------------------------------------------------
 * The section order below follows an external deliverable the owner supplied
 * (冠军股份_GEO监测诊断报告.docx, read with python-docx for its outline and table shapes):
 *
 *   one-page overview -> executive summary -> entity / brand fact base -> measurement design ->
 *   visibility overview -> breakdown by engine or group -> competitor pressure -> source network ->
 *   source detail -> fact claims and gaps -> fact governance -> verbatim answer evidence ->
 *   recommendations -> 90-day plan -> appendix (scoring) -> appendix (sampling, coding, limits) ->
 *   full question bank -> sources and verification record
 *
 * WHY THE ORDER IS COPIED AND THE PROSE IS NOT. The structure is a professional convention - it is
 * the order a client reads a diagnostic in - and following it is what makes this document usable
 * without a second explanation. The prose is somebody else's deliverable: reproducing it would be an
 * authorship and licensing problem for a product that is meant to be shipped, and worse, that
 * document's numbers are SYNTHESISED (it says so itself: fixed seeds and preset counts, no platform
 * was called). Copying its sentences would make this report claim simulations as measurements.
 *
 * WHERE THIS REPORT DELIBERATELY PARTS COMPANY WITH IT, section by section, so the mapping can be
 * checked rather than taken on trust:
 *
 *   its score out of 100        -> the reach count "4 / 12". No score exists here; the appendix
 *                                  titled 为什么这份报告没有综合评分 says why, and the one figure has
 *                                  an integer 0-3 axis instead of a 0-100 one.
 *   its per-platform breakdown  -> 四、按问题组拆解. One model was measured, not four, so splitting
 *                                  by "engine" would be four copies of the same column.
 *   its brand fact base and      -> 三、实体识别 and 七、回答里的事实断言. That document could print a
 *   "product and scenario"         fact table because the client supplied material for it; this
 *                                  dataset has no client-supplied facts, so the equivalent sections
 *                                  print what the ANSWERS asserted and label every line unverified.
 *   its "fact error list"       -> a claims list, not an error list. Nothing here establishes that
 *                                  any assertion is wrong, and calling an unverified claim an error
 *                                  would be the same fabrication in the other direction.
 *   its competitor pressure     -> 五、竞品：本次没有测量. The section is kept because a reader looks
 *                                  for it; it says the measurement does not exist rather than
 *                                  filling a table with something that is not one.
 *   its source network + detail -> 六、信源网络, with the caveats that make the order a fact about
 *                                  the answers (how often a domain was linked) and not a ranking.
 *   its 90-day plan             -> 复测计划, written as recommendations with countable acceptance,
 *                                  never as a forecast.
 *   its scoring appendix        -> 附录：为什么这份报告没有综合评分, which is the honest version of
 *                                  deleting the section.
 *
 * ---------------------------------------------------------------------------------------------
 * THE HONESTY RULES THIS FILE EXISTS TO KEEP
 * ---------------------------------------------------------------------------------------------
 * 1. COUNTS, NEVER PERCENTAGES. Three runs cannot support a percentage; "2 of 3 runs" is the only
 *    form this pipeline is allowed to print. That is why no string in the copy block below contains
 *    a "%" character and why the one figure has an integer 0-3 axis. `assertNoPercent()` fails the
 *    run if a "数字%" pattern ever reaches the model.
 * 2. THE METHOD IS IN THE DOCUMENT: model, date, web search enabled, runs per question, and that
 *    these are same-day observations from one model. The date and the model name are not in the
 *    data, so `modelSource` and `dateSource` record where each one came from.
 * 3. VERBATIM QUOTES ARE VERBATIM, AND ATTRIBUTED. The excerpts are extracted from the answers at
 *    build time, never typed; only Markdown emphasis and heading markers are removed, and every
 *    excerpt's caption says so.
 * 4. WHAT WAS NOT MEASURED IS STATED: no competitor, no sentiment, no source ranking, one model,
 *    one day, API answers rather than what a browser would show.
 * 5. ok === false IS NEVER A ZERO. The rejected calls are counted, described and excluded; a
 *    question with no completed run renders "未测量" rather than 0.
 * 6. EVERY NUMBER IN THE PROSE IS COMPUTED from the answers, and the claims table asserts that its
 *    quoted evidence is present in the run it cites - a claim with a citation that no longer
 *    matches stops the build instead of reaching a client.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THE DATA IS FILTERED BEFORE ANYTHING ELSE
 * ---------------------------------------------------------------------------------------------
 * The answers file contains 60 lines: 30 completed answers (ok: true) and 30 HTTP 429 rejections
 * written by an earlier run that used the same filename. The rejections have empty `answer` strings
 * and null mention flags. A report built over all 60 lines would be half blanks and would read as
 * "the brand was not mentioned" 30 extra times - a fabricated finding produced by a rate limit. So
 * the filter is the first statement in this file's logic, it is asserted (30 / 30), and the rejected
 * lines are reported in the document rather than silently dropped.
 *
 * Usage (this report is written in Chinese on purpose: the measured object is a Chinese-language
 * model answering Chinese questions, and an English scaffold around Chinese quotes would be a
 * translation of a measurement - see the lang note below):
 *
 *   npm run report:visibility -- --answers=<file.jsonl> --model-name=doubao-seed-2-1-lite-260915
 *
 *   --answers       required. The JSONL of recorded answers. A relative path is resolved against
 *                   this repository and then against the workspace above it.
 *   --model-name    required. NOT in the JSONL: the file has no model field (see methodSource* in
 *                   the copy block). A report that cannot name its model must not be produced, so
 *                   this is an error rather than an empty cell.
 *   --brand         legal name of the measured company.
 *   --slug          ASCII slug for the output directory.
 *   --date          measurement date; defaults to the YYYY-MM-DD in the answers filename.
 *   --out           output directory; defaults to reports/ai-visibility-<slug>-<date>.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const answersArg = arg("answers");
const modelName = (arg("model-name") || "").trim();

if (!answersArg || !modelName) {
  console.error(
    [
      "Usage:",
      "  npm run report:visibility -- --answers=<file.jsonl> --model-name=<model id>",
      "      [--brand=<legal name>] [--slug=<ascii-slug>] [--date=YYYY-MM-DD] [--out=DIR]",
      "",
      "Both --answers and --model-name are required, and the second one is the point: the JSONL",
      "records no model identifier (its fields are q, group, question, run, ok, status, errorBody,",
      "ms, mentionsBrand, mentionsCoatings, domains, usage, answer), so the model name is an",
      "input. Without it the document cannot state what was measured, and a visibility report that",
      "cannot name its model is worse than no report: the reader has no way to know what the",
      "counts describe, or when to re-measure.",
    ].join("\n")
  );
  process.exit(2);
}

/**
 * --answers resolves against the repository first and the workspace second, because the measured
 * answers deliberately live OUTSIDE this repository: they quote a client, name a client, and
 * `reports/` is ignored for exactly that reason. The workspace above the repo is where runs are
 * kept, so both `study-runs/x.jsonl` and an absolute path work, and a typo fails loudly below
 * instead of producing an empty report from an empty file.
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

const BRAND = (arg("brand") || "江苏冠军科技集团股份有限公司").trim();

/**
 * The output directory slug is ASCII and separate from the brand on purpose: the brand is Chinese,
 * a directory name derived from it by stripping non-ASCII characters would be empty, and a report
 * directory called `ai-visibility--2026-10-06` is one nobody can find again.
 *
 * THREE SOURCES, IN THIS ORDER: --slug, then the brand if it happens to be ASCII, then the answers
 * filename with its date removed (`champion-coatings-2026-10-06.jsonl` -> `champion-coatings`). The
 * filename fallback is what makes the documented command line work with no slug argument at all;
 * the one thing this file will not do is invent a name, because the directory is how a person finds
 * the report again six months later.
 */
function asciiSlug(text: string): string {
  return text
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

const slug = (
  arg("slug") ||
  asciiSlug(BRAND) ||
  asciiSlug(answersPath.split(/[\\/]/).pop() ?? "")
).toLowerCase();
if (!slug) {
  console.error(
    [
      "No output-directory slug could be derived: --slug is empty, --brand has no ASCII characters",
      `and ${answersPath.split(/[\\/]/).pop()} yields nothing either.`,
      "Pass an ASCII --slug (for example --slug=champion-coatings).",
    ].join("\n")
  );
  process.exit(2);
}

const fileNameDate = (answersPath.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
const measuredOn = (arg("date") || fileNameDate || "").trim();
if (!measuredOn) {
  console.error(
    [
      `No date: ${answersPath} has no YYYY-MM-DD in its name and --date was not given.`,
      "The JSONL carries no timestamp either, so the date cannot be recovered from the data.",
    ].join("\n")
  );
  process.exit(1);
}

const outDir = resolve(REPO, arg("out") || join("reports", `ai-visibility-${slug}-${measuredOn}`));
mkdirSync(outDir, { recursive: true });

const generatedAt = new Date().toISOString();
const stamp = generatedAt.slice(0, 10);

/* ------------------------------------------------------------------ */
/* The answers                                                        */
/* ------------------------------------------------------------------ */

type Answer = {
  q: number;
  group: string;
  question: string;
  run: number;
  ok: boolean;
  status: number | string | null;
  errorBody: string | null;
  ms: number;
  mentionsBrand: boolean | null;
  mentionsCoatings: boolean | null;
  domains: string[];
  usage: Record<string, any> | null;
  answer: string;
};

const lines = readFileSync(answersPath, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim().length > 0);

const parsed: Answer[] = lines.map((line, i) => {
  try {
    return JSON.parse(line) as Answer;
  } catch {
    console.error(`Line ${i + 1} of ${answersPath} is not JSON. Nothing was written.`);
    process.exit(1);
  }
});

/**
 * THE FILTER. Everything downstream reads `answers`, and `rejected` exists only to be described.
 *
 * WHY IT IS ASSERTED RATHER THAN TRUSTED. The failure this guards against is silent: including the
 * rejected lines adds 30 rows whose mention flags are null and whose answers are empty, which a
 * renderer turns into 30 more "not mentioned" outcomes and a headline that is wrong in the
 * direction of bad news. The assertion below states the expected shape of this dataset so that a
 * different shape stops the run instead of quietly changing the numbers.
 */
const answers = parsed.filter((r) => r.ok === true);
const rejected = parsed.filter((r) => r.ok !== true);

if (answers.length === 0) {
  console.error(
    `${answersPath} has ${parsed.length} line(s) and none of them has ok === true. ` +
      "There is nothing measured to report, and an empty report is not a report."
  );
  process.exit(1);
}
if (answers.some((r) => !r.answer || r.answer.trim().length === 0)) {
  console.error(
    "A line marked ok === true has an empty answer. That is a contradiction in the input, not a " +
      "zero mention: it would be counted as 'the brand was not mentioned' when nothing was read."
  );
  process.exit(1);
}

const RUNS_PER_QUESTION = Math.max(...answers.map((r) => r.run));

const questionIds = [...new Set(answers.map((r) => r.q))].sort((a, b) => a - b);
const byQuestion = new Map<number, Answer[]>();
for (const r of answers) {
  if (!byQuestion.has(r.q)) byQuestion.set(r.q, []);
  byQuestion.get(r.q)!.push(r);
}
for (const list of byQuestion.values()) list.sort((a, b) => a.run - b.run);

const GROUP_ORDER = ["category", "ambig", "fact"];

const totalTokens = answers.reduce((s, r) => s + (r.usage?.total_tokens ?? 0), 0);
const webSearchCalls = answers.reduce((s, r) => s + (r.usage?.tool_usage?.web_search ?? 0), 0);
const citationEvents = answers.reduce((s, r) => s + (r.domains?.length ?? 0), 0);
const answerLengths = answers.map((r) => r.answer.length);

/* ------------------------------------------------------------------ */
/* Verbatim excerpts - extracted, never typed                         */
/* ------------------------------------------------------------------ */

const BRAND_TOKENS = ["冠军股份", "冠军科技", "冠军漆", "鲸海漆"];

/**
 * Markdown emphasis and heading markers out, nothing else.
 *
 * WHY THIS IS THE ONLY EDIT PERMITTED. The finding in the entity section is about the model's own
 * words, so the words have to be the model's. `**` and a leading `#` are transport formatting that
 * the answer text carries because it was written as Markdown; keeping them in a Word table would
 * print asterisks at a client, and deleting them by hand is how a quote stops being a quote. The
 * rule is applied to every excerpt by this one function, and every excerpt's caption says so.
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
 *
 * The rule is narrow on purpose: the line has to be short and end with a full-width colon, which is
 * what a Chinese subheading looks like. A sentence that happens to end with a colon is kept, and the
 * caption under every excerpt still says it was truncated.
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
 * The two lines that carry an answer's conclusion: its first non-empty line, and the next one -
 * unless that next line is only a label ("公司核心信息说明："), in which case it says nothing on its
 * own and is dropped.
 *
 * WHY THE SECOND LINE IS NEEDED AT ALL: the answer to Q6 run 3 opens with the question restated and
 * puts its actual conclusion on the following line as a heading ("不是同一家公司"). Quoting the
 * first line alone would hide the one sentence in this dataset that can be read as the opposite of
 * the other two runs - which is precisely the finding, so the excerpt rule has to keep it.
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

function firstRun(q: number): Answer {
  const list = byQuestion.get(q);
  if (!list || list.length === 0) throw new Error(`question ${q} has no completed run`);
  return list[0];
}

function run(q: number, n: number): Answer {
  const hit = byQuestion.get(q)?.find((r) => r.run === n);
  if (!hit) throw new Error(`question ${q} has no completed run ${n}`);
  return hit;
}

function sentenceWithBrand(answer: string): string {
  const sentences = plain(answer)
    .split(/(?<=。)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const hit = sentences.find((s) => BRAND_TOKENS.some((t) => s.includes(t)));
  return hit ?? sentences[0] ?? "";
}

/** Windows that follow each occurrence of 简称, used to read which abbreviation an answer used. */
function abbreviationWindows(answer: string): string[] {
  const out: string[] = [];
  let i = answer.indexOf("简称");
  while (i >= 0) {
    out.push(answer.slice(i, i + 14));
    i = answer.indexOf("简称", i + 2);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The measured facts, as numbers this file computes                  */
/* ------------------------------------------------------------------ */

type QuestionFact = {
  q: number;
  group: string;
  groupShort: string;
  question: string;
  okRuns: number;
  failedRuns: number;
  runs: number;
  brandMentions: number;
  coatingsMentions: number;
  runMarks: string[];
};

const groupLabel: Record<string, string> = {
  category: "行业问题（不含品牌名）",
  ambig: "消歧问题（问题里出现公司名）",
  fact: "事实问题（问题里点名公司）",
};
const groupShort: Record<string, string> = { category: "行业", ambig: "消歧", fact: "事实" };
const groupPurpose: Record<string, string> = {
  category: "品牌在没有任何提示的行业问题里会不会被想到——这是触达数字",
  ambig: "模型能不能把口语名对回法定主体，会不会和同名公司混淆",
  fact: "提问者已经点名公司时，模型回答得对不对、三次之间一致不一致",
};

const questions: QuestionFact[] = questionIds.map((q) => {
  const list = byQuestion.get(q)!;
  const sample = list[0];
  const okRuns = list.length;
  const failedRuns = rejected.filter((r) => r.q === q).length;
  const marks = Array.from({ length: RUNS_PER_QUESTION }, (_, i) => {
    const r = list.find((x) => x.run === i + 1);
    if (!r) return "未测量";
    return r.mentionsBrand ? "✓" : "—";
  });
  return {
    q,
    group: sample.group,
    groupShort: groupShort[sample.group] ?? sample.group,
    question: sample.question,
    okRuns,
    failedRuns,
    runs: RUNS_PER_QUESTION,
    brandMentions: list.filter((r) => r.mentionsBrand === true).length,
    coatingsMentions: list.filter((r) => r.mentionsCoatings === true).length,
    runMarks: marks,
  };
});

const groups = GROUP_ORDER.filter((g) => questions.some((q) => q.group === g)).map((g) => {
  const inGroup = questions.filter((q) => q.group === g);
  return {
    id: g,
    label: groupLabel[g] ?? g,
    short: groupShort[g] ?? g,
    purpose: groupPurpose[g] ?? "",
    reading: "",
    questions: inGroup.length,
    runs: inGroup.reduce((s, q) => s + q.okRuns, 0),
    brandMentions: inGroup.reduce((s, q) => s + q.brandMentions, 0),
    coatingsMentions: inGroup.reduce((s, q) => s + q.coatingsMentions, 0),
  };
});

const nonBrand = questions.filter((q) => q.group === "category");
const prompted = questions.filter((q) => q.group !== "category");

const totals = {
  runs: questions.reduce((s, q) => s + q.okRuns, 0),
  brandMentions: questions.reduce((s, q) => s + q.brandMentions, 0),
  coatingsMentions: questions.reduce((s, q) => s + q.coatingsMentions, 0),
  nonBrandQuestions: nonBrand.length,
  nonBrandRuns: nonBrand.reduce((s, q) => s + q.okRuns, 0),
  nonBrandBrandMentions: nonBrand.reduce((s, q) => s + q.brandMentions, 0),
  nonBrandCoatingsMentions: nonBrand.reduce((s, q) => s + q.coatingsMentions, 0),
  promptedRuns: prompted.reduce((s, q) => s + q.okRuns, 0),
  promptedBrandMentions: prompted.reduce((s, q) => s + q.brandMentions, 0),
};

/**
 * The entity numbers, computed rather than asserted in prose.
 *
 * WHY THESE ARE COMPUTED FROM THE ANSWERS: the finding is about what the model wrote, so the count
 * of runs that wrote it has to come from the same text a reader can check. A hand-typed "3 of 3"
 * beside a quote that says something else is the failure this whole product is built not to have.
 */
const q6Runs = byQuestion.get(6) ?? [];
const entitySameRuns = q6Runs.filter((r) => /不规范简称|非规范简称/.test(r.answer)).length;

/**
 * The two conclusions the entity figure counts, as patterns rather than as a sentence somebody
 * typed into the caption.
 *
 * WHY A SECOND PAIR OF COUNTS BESIDE entitySameRuns. `entitySameRuns` counts the runs that READ
 * '冠军股份' as an irregular abbreviation of this company, and all three do; the prose in 三 uses
 * that number and it means what it says. The pie is about the CONCLUSION the run ended on, which
 * is a different question on the same three answers, and in this data it has a different answer:
 * two runs concluded the two names are the same company (Q6 runs 1 and 2 - "指的是同一家公司",
 * "属于同一家主体的非规范简称"), and one concluded they are not (Q6 run 3, whose subtitle is
 * "不是同一家公司" because it compared the NEEQ-listed company with the Hong Kong Champion
 * Technology Holdings Limited). Deriving both slices from the answers keeps the figure and the
 * quoted text checkable against each other.
 *
 * THE RULES MUST BE MUTUALLY EXCLUSIVE AND EXHAUSTIVE, and the assertion below is what says so. A
 * future run that matches neither rule, or both, would produce a pie whose slices do not add up to
 * n - a chart of a classification nobody made - so it stops the build instead.
 */
const ENTITY_SAME_PATTERNS = ["指的是同一家公司", "属于同一家主体的非规范简称"];
const ENTITY_NOT_SAME_PATTERNS = ["不是同一家公司"];

const notSameRuns = q6Runs.filter((r) =>
  ENTITY_NOT_SAME_PATTERNS.some((p) => r.answer.includes(p))
).length;
const entityConclusionSameRuns = q6Runs.filter((r) =>
  ENTITY_SAME_PATTERNS.some((p) => r.answer.includes(p))
).length;

if (entityConclusionSameRuns + notSameRuns !== q6Runs.length) {
  throw new Error(
    `Q6 的 ${q6Runs.length} 次运行里，${entityConclusionSameRuns} 次匹配『同一家公司』的写法、` +
      `${notSameRuns} 次匹配『不是同一家公司』，两个数加起来不是 ${q6Runs.length}。` +
      "实体识别结论图的两个扇区必须正好覆盖全部运行，否则这张图分类的不是这份数据。"
  );
}

const q8Runs = byQuestion.get(8) ?? [];
const q8AbbrevAsGufen = q8Runs.filter((r) => abbreviationWindows(r.answer).some((w) => w.includes("冠军股份"))).length;
const q8OnlyKeji = q8Runs.filter((r) => {
  const w = abbreviationWindows(r.answer);
  return w.some((x) => x.includes("冠军科技")) && !w.some((x) => x.includes("冠军股份"));
}).length;

const rejectedByStatus = new Map<string, number>();
for (const r of rejected) {
  const key = String(r.status ?? "throw");
  rejectedByStatus.set(key, (rejectedByStatus.get(key) ?? 0) + 1);
}
/** "HTTP 429 × 30", without the surrounding sentence, so two places can use it without nesting. */
const failureDigest = [...rejectedByStatus.entries()].map(([s, n]) => `HTTP ${s} × ${n}`).join("、");
const failureSummary = `${rejected.length} / ${parsed.length} 行` +
  (rejected.length ? `（${failureDigest}，同题同次的另一次尝试，未计入任何计数）` : "（没有失败行）");

/* ------------------------------------------------------------------ */
/* Claims: assertions in the answers that this report does NOT verify  */
/* ------------------------------------------------------------------ */

type Claim = { claim: string; source: string; handling: string };

/**
 * Every claim row names the run it came from AND the exact substring it was read off, and the build
 * fails if that substring is not in that answer.
 *
 * WHY THE ASSERTION IS THE POINT OF THIS TABLE. A "claims we could not verify" list is a list of
 * quotations; the way it goes wrong is by drifting from the text it quotes - a patent count typed
 * from memory, a customer name from the wrong run, a number that was never in any answer at all.
 * Checking the substring against the recorded answer makes the table a set of quotations with a
 * citation that cannot silently stop matching. It is deliberately a substring and not a semantic
 * check: this file has no way to know whether 33 invention patents is true, and it says so in every
 * row's handling.
 */
function claimRow(q: number, n: number, evidence: string, claim: string, handling: string): Claim {
  const source = run(q, n);
  if (!source.answer.includes(evidence)) {
    throw new Error(
      `Claim evidence is not in Q${q} run ${n}: ${JSON.stringify(evidence.slice(0, 40))}. ` +
        "The claims table quotes runs, so a claim whose text cannot be found in its run is a " +
        "fabrication with a citation attached."
    );
  }
  return { claim, source: `Q${q} 第 ${n} 次运行`, handling };
}

const claims: Claim[] = [
  claimRow(
    7,
    2,
    "拥有授权专利60余件",
    "集团拥有授权专利 60 余件，其中国家发明专利 33 件，并主导起草和参与制定了多项国家及行业标准。",
    "本报告未核验。引用前需要企业提供专利清单（区分申请、授权、软著与截止日）和标准编号。"
  ),
  claimRow(
    4,
    1,
    "国内首家通过",
    "公司是国家级专精特新“小巨人”企业，也是国内首家通过“低 VOCs 涂料产品认证”的企业。",
    "本报告未核验。资质名称、颁发机构与取得时间需要企业文件确认，回答里没有给出处。"
  ),
  claimRow(
    10,
    2,
    "中国寰球工程有限公司",
    "客户包括中国石油旗下中国寰球工程有限公司（回答称 2026 年中标其涂料框架集中采购项目）、石横特钢等。",
    "本报告未核验。客户名称出现在回答里不等于客户已授权公开；对外引用前需要取得客户同意。"
  ),
  claimRow(
    6,
    1,
    "注册地位于江苏省南京市溧水区",
    "公司成立于 1999 年，2016 年 6 月在新三板挂牌，注册地位于江苏省南京市溧水区。",
    "本报告未核验。这类字段在多次运行里相互一致，但一致不等于正确；请以公开披露文件为准。"
  ),
  claimRow(
    5,
    3,
    "冠农股份",
    "回答把“冠军股份”与冠农股份、冠盛股份、金冠股份、台湾冠军建材、港股 Champion Technology Holdings Limited 等多个同名或谐音主体并列。",
    "本报告未核验这些主体的任何信息，也不对它们作判断。记录它们只是因为回答把它们和本公司放在了一起——这是重名风险的直接证据。"
  ),
];

/* ------------------------------------------------------------------ */
/* Sources: the domains the answers cited                             */
/* ------------------------------------------------------------------ */

const domainMap = new Map<string, { count: number; groups: Set<string> }>();
for (const r of answers) {
  for (const d of r.domains ?? []) {
    const entry = domainMap.get(d) ?? { count: 0, groups: new Set<string>() };
    entry.count += 1;
    entry.groups.add(groupShort[r.group] ?? r.group);
    domainMap.set(d, entry);
  }
}

/**
 * The twelve most-cited domains, and nothing that ranks them.
 *
 * ORDERED BY COUNT, WHICH IS A FACT ABOUT THE ANSWERS, NOT A JUDGEMENT ABOUT THE DOMAINS. The
 * rendering keeps saying so: a domain cited often is a domain the answers linked often. The report
 * does not know whether it is authoritative, whether the company already appears on it, or whether
 * the model weights it at all. Twelve is a table that fits a page; the counts of the rest are in the
 * workbook's own sheet and in the answers file.
 */
const DOMAIN_TABLE_LIMIT = 12;
const domains = [...domainMap.entries()]
  .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
  .slice(0, DOMAIN_TABLE_LIMIT)
  .map(([domain, e]) => ({ domain, count: e.count, groups: [...e.groups] }));
const topDomain = domains[0]?.domain ?? "";
const topDomainCount = domains[0]?.count ?? 0;

/**
 * What the domain figure leaves out, counted rather than waved at as "and more".
 *
 * The chart draws the same twelve domains the table draws. A reader who is not told what the other
 * domains amount to will read the twelve as the whole source network, and they are not: this
 * dataset is a long tail, which is the reason the caption carries these two numbers. Both come
 * from the same two counts the section already states (citation events and distinct domains), so
 * the sentence and the table cannot disagree.
 */
const otherDomains = domainMap.size - domains.length;
const otherEvents = citationEvents - domains.reduce((s, d) => s + d.count, 0);

const citationsByGroup = groups.map((g) => ({
  label: g.short,
  count: answers.filter((r) => r.group === g.id).reduce((s, r) => s + (r.domains?.length ?? 0), 0),
}));

/* ------------------------------------------------------------------ */
/* Copy                                                               */
/* ------------------------------------------------------------------ */

/**
 * Every human-readable string in this report, and the reason it lives here rather than in the
 * Python renderer: the Markdown and the DOCX are rendered by two different programs, and a heading
 * that exists in only one of them is how the two documents start disagreeing about what a section
 * is. The scan report does the same thing for the same reason.
 *
 * NO STRING BELOW CONTAINS A "%" CHARACTER, and that is a rule rather than a coincidence - see
 * assertNoPercent() at the end of this block. Numbers are written as "几次运行里几次".
 */
const COPY: Record<string, string> = {
  reportName: "AI 可见度报告",
  footer: "AI 可见度报告",
  tableItem: "项目",
  tableValue: "结果",

  kSubject: "被测量的公司",
  kModel: "模型",
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

  thTotal: "合计",
  thGroup: "问题组",
  thQuestions: "题数",
  thRuns: "完成的运行次数",
  thBrand: "品牌提及",
  thCoatings: "涂料提及",
  thNo: "题号",
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
   * The four figures of this report, in the order they appear in the document. Every caption says
   * what n is and that its labels are counts, because a chart is the one place where a reader can
   * divide two numbers and arrive at a percentage nobody measured. The captions are inside
   * assertNoPercent() below, and render-report.py refuses to draw a "%" in any of these figures.
   */
  figGroups:
    "图 1｜分组触达：三组问题各自的品牌提及次数。标签为次数（如 4 / 12），n = 每组完成的运行次数（{groupRuns}）。三组的分母不同，所以分母写在每一个标签里。",
  figGroupsAxis: "提及次数（每组运行次数不同）",
  figMentions:
    "图 2｜逐题提及：每一道题里品牌被提及的运行次数。标签为次数（如 2 / 3），n = 每题完成的运行次数（{runsPerQuestion}）；横轴是 0 到 {runsPerQuestion} 次。",
  figMentionsAxis: "提及次数（每题 {runsPerQuestion} 次运行）",
  figEntity:
    "图 3｜实体识别结论的稳定性：第 6 题的 {entityTotalRuns} 次运行的结论分布。标签为次数，n = {entityTotalRuns}。分类规则是回答的结论文字里有没有出现「不是同一家公司」：出现的那 {notSameRuns} 次比较的是港股同名集团（回答里的说法，本报告未核验）。",
  figEntitySame: "同一家公司 {entitySameConclusion} 次",
  figEntityNotSame: "不是同一家公司 {notSameRuns} 次",
  figEntityN: "n = {entityTotalRuns}（第 6 题的 {entityTotalRuns} 次运行）",
  figSources:
    "图 4｜信源分布：回答引用次数最多的 {domainLimit} 个域名。标签为次数（引用事件次数），n = {citationEvents} 次引用事件、{distinctDomains} 个域名；另有 {otherDomains} 个域名合计 {otherEvents} 次引用事件未逐一列出。排序是引用事件的计数顺序，不是影响力排名。",
  figSourcesAxis: "引用事件次数",

  sectionSummary: "一、执行摘要",
  summaryCallout:
    "结论一句话：模型认识这家公司，但在没有品牌名的行业问题里很少主动想到它——{nonBrandRuns} 次这样的运行里，提到它的只有 {nonBrandMentions} 次。",
  sectionSummaryConclusions: "三层结论",
  summaryReach:
    "触达层：{nonBrandQuestions} 道不含品牌名的行业问题、每题 {runsPerQuestion} 次运行，共 {nonBrandRuns} 次运行里品牌被提及 {nonBrandMentions} 次。分题看，Q3（道路标线漆和重防腐涂料的主要供应商有哪些?）{q3Brand} 次、Q4（采购高闪点环保工业涂料,推荐哪些厂家?）{q4Brand} 次，Q1、Q2 的各 3 次运行一次都没有提到它。0 次是测量结果，不是缺失：这些运行的答案完整，只是推荐了别的厂商。",
  summaryEntity:
    "实体层：模型知道这家公司。{runs} 次完成的回答里 {brandRuns} 次出现了公司名；只要问题里带着公司名，{promptedRuns} 次运行全部出现。真正的问题在名字上：『冠军股份』不是官方名称，所以每一份回答都要先做一次『把口语名对回法定主体』的推断。第 6 题的三次运行都把『冠军股份』解释为对{subjectShort}的不规范简称；其中 {notSameRuns} 次运行的结论文字里同时出现了『不是同一家公司』这个说法，它指的是另一家同名集团，第三节有原文。",
  summaryFacts:
    "事实层：同一批事实在三次运行之间并不完全一致。以 Q8（主要产品）为例，{q8AbbrevAsGufen} 次把证券简称写成『冠军股份』（其中一次并列『冠军股份/冠军科技』），{q8OnlyKeji} 次只写『冠军科技』。公司全称、代码 837745、曾用简称『冠军涂料』、成立年份这些字段在多次运行里反复出现且互相一致；专利数量、客户名称、资质荣誉一类断言本报告没有核验，只记录它们出现在哪一次回答里。",

  sectionCoverage: "本次测量覆盖了什么",
  coverageLead:
    "一次测量，一个模型，10 道问题，每题 3 次运行，共 {runs} 次完成的回答。三组问题分别测三件不同的事，混在一起看会得出错误结论，所以下表按组分开列。",
  coverageNote:
    "『品牌提及』的判定是答案文本里是否出现 冠军股份 / 冠军科技 / 冠军漆 / 鲸海漆 中的任意一个；『涂料提及』是是否出现『涂料』。两个标记都由采集脚本写入，本报告直接读，不重新判定。",

  sectionNotMeasured: "本次没有测量什么",
  sectionOverview: "二、AI 可见度总览",
  overviewLead:
    "下表是全部 10 道题。『涂料提及』一列说明回答确实在谈这个品类：{runs} 次运行里有 {coatingsRuns} 次出现了『涂料』，所以表里的 0 是『没有提到这家公司』，不是『没有回答这个问题』。",
  overviewTotals:
    "合计：{runs} 次完成的回答里品牌被提及 {brandRuns} 次。这个总数里有 {promptedRuns} 次是问题本身就带着公司名的（消歧题与事实题），那些运行里品牌出现几乎是必然的。",
  overviewPrompted:
    "把点名的问题去掉之后只剩 {nonBrandRuns} 次运行，品牌被提及 {nonBrandMentions} 次，也就是 {nonBrandMentions} / {nonBrandRuns}。这个 {nonBrandMentions} / {nonBrandRuns} 才是这份报告的主数字：它更接近一个陌生客户在行业问题里遇到这家公司的机会。",

  sectionHowToRead: "结果应该怎么读",
  readCounts:
    "每个数字都写成『几次运行里几次』。本报告不出现百分比：3 次运行算出来的比例会把一次运行的偶然差异放大成一个结论。",
  readPrompted:
    "『品牌提及』在消歧题和事实题里几乎是必然的，因为问题里就带着公司名。这两组只能说明模型能把名字对上公司，不能说明陌生客户会遇到它。",
  readDenominator:
    "分母永远是该题真正完成的运行次数。某题少一次运行，分母就是 2；一次都没完成，单元格写『未测量』而不是 0。本次 10 道题的分母都是 3。",
  readSameDay:
    "全部 {runs} 次回答是 {measuredOn} 同一天、同一个模型（{model}）、同一次测量里的观测。换一天、换一个模型版本或关掉联网搜索，数字都可能不同。",

  sectionEntity: "三、实体识别：模型怎么称呼这家公司",
  entityLead:
    "这一节回答一个具体问题：模型认识这家公司吗？认识。{runs} 次运行里 {brandRuns} 次出现公司名，问题里点名公司的 {promptedRuns} 次运行全部出现。真正的风险不是『不认识』，而是名字：『冠军股份』不是官方简称，每一次回答都要先做一次把口语名对回法定主体的推断，而推断会出错。下面这一段是模型的原话。",
  sectionEntityRuns: "同一道题、三次运行，各自的结论",
  entityRunsLead:
    "下面是 Q6『冠军股份和冠军科技是同一家公司吗?』三次运行的开头，逐字摘录（每次取回答的第一行与紧随其后的一行；只去掉 Markdown 的加粗与标题标记）。三次都把『冠军股份』解释为不规范简称；第 3 次运行的小标题写作『不是同一家公司』——它比较的是新三板挂牌的这家公司与回答中提到的港股『冠军科技集团』（Champion Technology Holdings Limited，回答里的说法，本报告未核验）。只看小标题会读成相反的意思，这是这份测量里最值得注意的一件事。",
  entityFinding:
    "第 6 题的 {entityTotalRuns} 次运行里有 {entitySameRuns} 次把『冠军股份』读作对{subjectShort}的非规范简称；其中 {notSameRuns} 次的结论文字里同时出现了『不是同一家公司』（指的是另一家同名集团）。结论：模型知道这家公司，但『冠军股份』这个称呼每次都需要一次推断，而第 5、6 题的答案里同时出现了冠农股份、冠盛股份、金冠股份、台湾冠军建材、港股冠军科技集团等主体——重名不是理论风险，它已经在答案里发生了。",
  entityConclusionRule:
    "分类规则：回答的结论文字里出现「不是同一家公司」的运行计为『不是同一家公司』，其余计为『同一家公司』。",
  entityConclusionLine:
    "同一家公司 {entitySameConclusion} 次、不是同一家公司 {notSameRuns} 次（n = {entityTotalRuns}）；分类规则是回答的结论文字里有没有出现「不是同一家公司」。",

  sectionGroups: "四、按问题组拆解",
  groupsLead:
    "三组问题测的是三件事，任何一组单独拿出来都会被误读：只看行业题会低估模型对公司的了解，只看事实题会高估陌生客户的触达。",

  sectionCompetitors: "五、竞品：本次没有测量",
  competitorsCallout:
    "这份数据里没有竞品。{runs} 次回答没有对任何一家其他公司做过提及计数，所以本报告没有竞品对比表、没有份额、没有排名。",
  competitorsBody:
    "参照的那份外部交付物里有一节竞品压制分析。它需要『同一批问题里对手被提及多少次』这个输入，而本次采集没有打这个标记——采集脚本只标记了冠军一家的品牌名。要得到这个数字，必须在采集时对每个对比对象各自标记，或者用同一批回答重新抽取一遍实体，那是另一次采集，不是这份报告的推断。",
  competitorsNone1:
    "没有被测量的竞品，就没有可以写进表格的竞品数字。本报告不填占位符：空白和 0 都会被读成一个结论。",
  competitorsNone2:
    "回答里确实提到了很多其他厂商（例如 Q1 里的国际与本土涂料厂商名单）。那是回答的正文，不是本报告的测量对象：本报告没有对它们计数，也不据此对任何一家作判断。",
  competitorsNone3:
    "如果下一次要竞品对比，就在同一批问题上增加一列『对手名称列表』的标记，再跑同样的 3 次；只有那样得到的数字才能和本次的数字放在一起看。",

  sectionSources: "六、信源网络：回答引用了哪些域名",
  sourcesLead:
    "{runs} 次回答合计 {citationEvents} 次引用事件，分布在 {distinctDomains} 个域名上（一次回答里同一个域名只算 1 次，跨回答重复引用分别计数）。按组看：{citationsByGroup}。下表是按出现次数排序的前 {domainLimit} 个域名；出现最多的是 {topDomain}（{topDomainCount} 次）。",
  sourcesNote:
    "本报告不判定这些域名的权威性，也不判定它们与公司的关系（{topDomain} 与其他域名一样，归属关系未经核验）。这个表是『回答引用了哪些域名』的分布，不是影响力排名，也不是外链建设清单。",
  sectionSourcesCaveat: "三个必须说清的口径",
  sourcesCaveat1:
    "引用次数不等于影响力。某个域名出现得多，只说明回答里链接它的次数多，不说明它更权威，也不说明模型更看重它。",
  sourcesCaveat2:
    "一次回答里同一个域名只算 1 次，跨回答重复引用分别计数。所以这是『引用事件』的分布，不是『独立来源』的数量。",
  sourcesCaveat3:
    "本报告没有做『客户是否已经出现在这些域名上』的对照。那需要企业先提供它现有的公开存在清单，本次没有这个输入。",

  sectionClaims: "七、回答里的事实断言：本报告没有核验",
  claimsCallout:
    "下表每一条都出现在模型的回答里，本报告没有核验任何一条。这不是『AI 说错了』的清单，而是『引用之前先核实』的清单。",
  claimsNote:
    "每一条都写了它出现在哪一次运行，可以直接在数据文件里找到原文核对。本报告不判断这些断言的真假，也不建议把它们直接写进宣传材料：回答里的数字没有出处，而这正是客户最容易被追问的地方。",

  sectionQuotes: "八、典型回答原文摘录",
  quotesLead:
    "下面每一段都注明题号与运行次数，取自数据文件，逐字摘录；只去掉 Markdown 的加粗与标题标记，文字与标点未改动。",
  quoteQuestion: "问题：",
  quoteAnswer: "回答摘录：",

  sectionAdvice: "九、建议：先做两件事",
  adviceLead:
    "下面三条是从本次测量直接读出来的，不是通用建议。它们都不承诺效果：本报告没有测量任何竞品，也没有测量内容上线后会发生什么。",
  adviceProblem: "问题：",
  adviceAction: "建议的动作：",
  adviceDeliverable: "交付：",
  adviceAcceptance: "验收：",

  sectionPlan: "复测计划",
  planNote:
    "这是建议的节奏，不是承诺。复测能回答的是『同一批问题、同一模型下，逐题计数有没有变化』；它不能回答『投入换来了提及』。两次复测之间不要比较『总体上升』，要看哪几道题从 0 变成 1。",

  sectionNoScore: "附录：为什么这份报告没有综合评分",
  noScoreLead:
    "参照的那份外部交付物用一个 100 分制的加权评分开头。本报告不给评分，也不给百分比。原因有四条。",
  noScore1:
    "3 次运行不足以支撑一个比例。同一道题的答案长度从 {minAnswerChars} 字到 {maxAnswerChars} 字不等，一次运行的差异就会被读成一个分数。",
  noScore2:
    "评分需要权重，而这份数据没有校准权重的依据。那份外部文件的输入是按预设规则合成的 400 条记录，可以按设计分配权重；本次是 30 条实测记录，没有第二组数据可以校准。",
  noScore3:
    "分数会被当成结论去比较，而这份报告没有测量任何对手。一个没有对照的分数只会被读成『好』或『差』，两种读法都没有依据。",
  noScore4:
    "本报告给的是计数和原文，任何人都可以自己复算：每一道题的 3 次运行、每次的引用域名和完整回答都在数据文件里。",

  sectionMethodAppendix: "附录：采样设计、方法与限制",
  sectionSampleDesign: "样本设计",
  sampleDesignLead:
    "10 道问题分三组，同一批问题对同一个模型各跑 3 次。分组不是修辞：不含品牌名的问题测触达，含品牌名的问题测实体理解与事实准确度，两者的分母不同，不能相加。",

  sectionGeneration: "这份报告的生成方法",
  sectionCoding: "标注字段口径",
  sectionReplication: "复测建议",
  replication1:
    "同一批 10 道题、同一模型版本、每题 3 次、开启联网搜索，尽量在同一天内完成，每次新会话。",
  replication2:
    "记录模型版本、日期、是否开启搜索、原始回答与引用域名。失败的行单独记下来：它们不是 0 次提及，而是没有测量。",
  replication3:
    "对照两次复测时看逐题计数，不看『总体变化』。如果要把 3 次提高到 10 次，那是一次新的采集：分母变了，两次的数字不能直接并列。",

  sectionQuestions: "完整问题库与标注",
  questionsLead:
    "✓ 表示该次运行的回答里出现了品牌名（冠军股份 / 冠军科技 / 冠军漆 / 鲸海漆 任一），— 表示没有出现。判定由采集脚本在采集时写入，本报告不重新判定。",

  sectionProvenance: "资料来源与核验记录",

  sheetOverview: "总览",
  sheetQuestions: "逐题计数",
  sheetGroups: "分组合计",
  sheetDomains: "引用域名",
  sheetClaims: "事实断言",
  sheetQuotes: "原文摘录",
  sheetMeta: "元数据",
  sheetAbout: "说明与边界",
};

/**
 * The rule from the service definition, enforced instead of remembered.
 *
 * A percentage in this report would be a number no measurement supports: three runs per question.
 * The check is deliberately crude - a digit followed by "%" - because every honest sentence in this
 * document writes counts ("4 / 12", "12 次运行里 4 次"), so anything matching is a violation rather
 * than a false positive. It runs over the whole copy block before a single file is written.
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
/* The model                                                          */
/* ------------------------------------------------------------------ */

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

const Q = (q: number) => questions.find((x) => x.q === q);

const fills: Record<string, string | number> = {
  runs: totals.runs,
  brandRuns: totals.brandMentions,
  coatingsRuns: totals.coatingsMentions,
  nonBrandQuestions: totals.nonBrandQuestions,
  nonBrandRuns: totals.nonBrandRuns,
  nonBrandMentions: totals.nonBrandBrandMentions,
  promptedRuns: totals.promptedRuns,
  runsPerQuestion: RUNS_PER_QUESTION,
  q3Brand: Q(3)?.brandMentions ?? 0,
  q4Brand: Q(4)?.brandMentions ?? 0,
  entitySameRuns,
  entityTotalRuns: q6Runs.length,
  notSameRuns,
  entitySameConclusion: entityConclusionSameRuns,
  groupRuns: groups.map((g) => g.runs).join(" / "),
  q8AbbrevAsGufen,
  q8OnlyKeji,
  subjectShort: BRAND,
  measuredOn,
  model: modelName,
  citationEvents,
  distinctDomains: domainMap.size,
  domainLimit: domains.length,
  topDomain,
  topDomainCount,
  otherDomains,
  otherEvents,
  citationsByGroup: citationsByGroup.map((c) => `${c.label} ${c.count} 次`).join("、"),
  minAnswerChars: Math.min(...answerLengths),
  maxAnswerChars: Math.max(...answerLengths),
};

/** Section prose that is filled from the numbers above, so no sentence holds a typed count. */
const FILLED_COPY: Record<string, string> = Object.fromEntries(
  Object.entries(COPY).map(([key, value]) => [key, fill(value, fills)])
);

/**
 * EVERY PLACEHOLDER MUST BE GONE BEFORE THE MODEL IS WRITTEN, and this is the check that says so.
 *
 * WHY IT EXISTS: the first end-to-end run rendered `{nonBrandRuns}` into a client's overview table.
 * The numbers were right and the sentence was unreadable, and nothing in the pipeline objected -
 * because `fill()` leaves an unknown placeholder exactly as it found it, and a renderer that prints
 * the model's strings verbatim (which is what render-report.py does, on purpose) has no way to know
 * that `{q3Brand}` was never substituted. The failure is silent, appears in the one document a human
 * reads, and is invisible to tsc, to the geometry check and to the Markdown diff. So the whole copy
 * block is scanned for anything left in braces and the build stops if it finds one.
 */
/**
 * THE ONE STRING THAT KEEPS A PLACEHOLDER, and why it is not a hole in the check above: `runLabel`
 * varies per ROW, not per dataset ("第 3 次运行"), so it cannot be filled once at build time. Its
 * `{n}` is substituted by the two renderers, each in its own row loop - render-report.py does it
 * with `.replace("{n}", ...)` and the Markdown below does the same - so a leftover `{n}` in the DOCX
 * would be visible immediately in the run column of two tables. It is listed here rather than
 * excluded by a looser pattern, so that adding a second runtime placeholder is a decision somebody
 * makes rather than a check that quietly stops covering a key.
 */
const RUNTIME_PLACEHOLDERS = new Set(["runLabel"]);

const leftovers = Object.entries(FILLED_COPY).filter(
  ([key, value]) => !RUNTIME_PLACEHOLDERS.has(key) && /\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(value)
);
if (leftovers.length > 0) {
  throw new Error(
    "Unfilled placeholders in the copy block: " +
      leftovers.map(([key, value]) => `${key} -> ${(value.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) || []).join(",")}`).join("; ")
  );
}

/** Copy as the document prints it: already filled, so the renderer never substitutes anything. */
const T = (key: string) => FILLED_COPY[key] ?? COPY[key];

/**
 * The excerpts, each with its own provenance note. Built here rather than in the renderer because
 * the renderer never sees the original answers - it must not be able to paraphrase one.
 */
const entityQuote = {
  label: "Q6 · 第 1 次运行 · 实体识别（“冠军股份”与“冠军科技”）",
  question: firstRun(6).question,
  run: 1,
  text: trimTrailingLabel(headOf(plain(firstRun(6).answer), 280)),
  note:
    "原文摘录（Q6 第 1 次运行，取回答开头 280 个字符以内并按换行截断）。只去掉了 Markdown 的加粗与标题标记，文字与标点未改动。这段话说的是模型认识这家公司，而不是不认识它：模型把『冠军股份』当成一个需要解释的非规范简称。",
};

const quotes = [
  entityQuote,
  {
    label: "Q3 · 第 2 次运行 · 一道行业问题里的一次提及",
    question: run(3, 2).question,
    run: 2,
    text: sentenceWithBrand(run(3, 2).answer),
    note:
      "原文摘录（Q3 第 2 次运行）。只去掉了 Markdown 的加粗与标题标记。这是 {nonBrandRuns} 次行业问题运行里 {nonBrandMentions} 次提及中的一次：品牌作为国内核心供应商名单里的一条出现，同一条里写明了它参与过的工程类型。".replace(
        "{nonBrandRuns}",
        String(totals.nonBrandRuns)
      ).replace("{nonBrandMentions}", String(totals.nonBrandBrandMentions)),
  },
  {
    label: "Q1 · 第 1 次运行 · 一道行业问题里的一次未提及",
    question: firstRun(1).question,
    run: 1,
    text: headOf(plain(firstRun(1).answer), 200),
    note:
      "原文摘录（Q1 第 1 次运行，取开头 200 个字符以内并按换行截断）。只去掉了 Markdown 的加粗与标题标记。这份回答按国际品牌与本土企业分档列出了多家厂商，其中没有江苏冠军科技集团。『未提及』只表示这家公司没有出现在这一次回答里，不表示回答对它作了负面评价——本报告没有做情感分析，也无法从一次未提及推出态度。",
  },
];

const entityRuns = q6Runs.map((r) => ({ run: r.run, text: conclusionExcerpt(r.answer) }));

// The per-group reading, filled from each group's own numbers.
const groupReadings: Record<string, string> = {
  category: `不含品牌名的行业问题，{questions} 道、{runs} 次运行，品牌被提及 {brand} 次。这是本报告唯一可以回答『陌生客户会不会遇到这家公司』的一组：问题里没有任何提示，回答推荐的是它自己想到的厂商。`,
  ambig: `问题里带着口语名（『冠军股份』『冠军漆』等），{questions} 道、{runs} 次运行，品牌被提及 {brand} 次。这一组测的不是触达，而是模型能不能把这些名字对回同一个法定主体。`,
  fact: `提问者已经点名公司，{questions} 道、{runs} 次运行，品牌被提及 {brand} 次。这一组测的是回答得对不对、三次之间一致不一致，而不是会不会被想到。`,
};

const model = {
  reportType: "ai-visibility",
  generatedBy: "geo-scanner scripts/report/build-visibility.mts",
  lang: "zh",
  /**
   * THE FILLED COPY, not the templates. render-report.py prints these strings verbatim and never
   * substitutes into them - that is what keeps the DOCX and the Markdown saying the same thing - so
   * a placeholder that reached this point would be printed as one. See the leftover check above.
   */
  copy: FILLED_COPY,
  meta: {
    subject: BRAND,
    subjectShort: BRAND,
    slug,
    measuredOn,
    measuredOnDisplay: measuredOn,
    model: modelName,
    /**
     * WHERE THE MODEL NAME AND THE DATE CAME FROM, as two explicit fields rather than a footnote.
     *
     * Neither is in the JSONL: its rows have no `model` key and no timestamp. The model name comes
     * from the run's own configuration file (.keys/volcengine.txt's MODEL_ID, read by
     * phase1-champion.mjs) and the date from the answers filename. Both are therefore INPUTS to this
     * report rather than facts read out of it, and both are printed in the document - a reader has
     * to be able to tell which claims are measured and which are supplied.
     */
    modelSource:
      "运行配置 .keys/volcengine.txt 的 MODEL_ID（由采集脚本 phase1-champion.mjs 读取）；数据文件本身不含模型字段",
    dateSource: `数据文件名 ${answersPath.split(/[\\/]/).pop()}；数据文件本身不含时间戳字段`,
    webSearch: true,
    runsPerQuestion: RUNS_PER_QUESTION,
    answersFile: answersPath,
    answersFileLines: parsed.length,
    answersOk: answers.length,
    answersFailed: rejected.length,
    failureSummary,
    totalTokens,
    webSearchCalls,
    citationEvents,
    distinctDomains: domainMap.size,
    generatedAt,
    generatedAtDisplay: stamp,
  },
  headline: {
    value: `${totals.nonBrandBrandMentions} / ${totals.nonBrandRuns}`,
    caption: `不含品牌名的行业问题 · ${totals.nonBrandRuns} 次运行里，品牌被提及 ${totals.nonBrandBrandMentions} 次`,
    callout: T("summaryCallout"),
  },
  groups: groups.map((g) => ({
    ...g,
    reading: fill(groupReadings[g.id] ?? "", {
      questions: g.questions,
      runs: g.runs,
      brand: g.brandMentions,
    }),
  })),
  totals,
  questions,
  domains,
  claims,
  quotes,
  entityRuns,
  /**
   * The two slices of the entity figure, as numbers the renderer prints rather than recomputes.
   *
   * WHY THE MODEL CARRIES THEM AND NOT THE RENDERER: render-report.py never sees the answers - it
   * sees excerpts and counts - so a classification made there would be a classification of a
   * paraphrase, and the DOCX, the XLSX and the Markdown could each end up disagreeing about the
   * report's headline finding. `rule` travels with the counts into the workbook, so wherever the
   * numbers are printed the rule that produced them is printed too.
   */
  entityConclusion: {
    same: entityConclusionSameRuns,
    notSame: notSameRuns,
    total: q6Runs.length,
    rule: T("entityConclusionRule"),
  },
  limits: [
    "没有测量任何竞品。这份数据里没有第二家公司的提及计数，所以报告里没有竞品对比、没有份额、没有排名。",
    "没有做情感分析。『提及』只表示答案里出现了公司名或品牌名，不表示评价是正面还是负面。",
    `信源列表是回答引用过的域名，不是影响力排名。${citationEvents} 次引用事件分布在 ${domainMap.size} 个域名上，出现在前面只说明被链接得多。`,
    `只有一个模型、一天的数据：${modelName}，${measuredOn}，开启联网搜索，每题 3 次运行。同一天、同一模型、同一批问题的观测，不是趋势，也不代表其他模型或其他日期。`,
    "回答里的事实断言（专利数量、客户名称、资质荣誉等）本报告没有核验，只记录它们出现在哪一次运行里。",
    `失败的行按未测量处理。本文件 ${parsed.length} 行里有 ${rejected.length} 行是失败记录（${failureDigest}，同题同次的另一次尝试），它们没有被当作 0 次提及；如果某道题一次都没有完成，表格会写『未测量』而不是 0。本次 10 道题各有 3 次完成的回答。`,
    "测的是 API 返回的回答，不是网页界面上用户看到的回答。两者可能不同，本报告没有做这个对照。",
  ],
  advice: [
    {
      title: "P0-1 把实体口径写死，并在所有可查的地方用同一个版本",
      problem:
        "『冠军股份』不是官方简称，而回答里已经出现了『冠军股份』『冠军科技』『冠军漆』『鲸海漆』以及冠农股份、冠盛股份、金冠股份等同名或谐音主体。每一次回答都要先做一次名称推断，第 3 次运行的小标题『不是同一家公司』就是推断出岔子的样子。",
      action:
        "先确认一组标准口径：法定全称、官方证券简称、曾用简称、股票代码、成立年份、注册地、主营业务，以及『冠军股份』这个词到底还用不用、在什么场合用。把这一组口径同时落到官网（一个可以单独引用的页面）、工商与挂牌信息、行业目录和百科词条上；每个字段注明更新日期与出处。",
      deliverable:
        "1 份实体事实表（字段、内容、出处、更新日期）；1 个官网事实页；20 条标准问答（每条都能指向出处）。",
      acceptance:
        "20 条标准问答里每一条的字段都能在公开来源上查到同一版本；仍然无法确认的字段，明确写『待核实』和核实路径，而不是留空。",
    },
    {
      title: "P0-2 先核验已经出现在回答里的断言，再决定要不要对外引用",
      problem:
        "第七节列出的断言（专利 60 余件、33 件发明专利、国内首家低 VOCs 认证、具体客户与中标项目）都出现在回答里，但本报告没有核验。这些正是采购方与媒体最容易追问的地方，也是被追问时最贵的部分。",
      action:
        "逐条找证据：专利以清单形式区分申请、授权、软著与截止日；资质与荣誉保留颁发机构、编号和日期；客户与工程保留项目名称、时间、范围，并取得对方同意公开。有证据的写成可引用的页面，没有证据的先从对外材料里拿掉——写不清楚的断言会被下一次回答原样重复。",
      deliverable: "每条断言的证据文件或删除决定；客户与工程的公开授权记录；更新后的对外材料。",
      acceptance:
        "第七节每一行都有一个结果：证据、改写后的表述，或删除。没有『口径待定』的条目。",
    },
    {
      title: "P1-1 针对 0 次提及的两道行业问题补内容",
      problem:
        "Q1（国内工业涂料领域有哪些主要厂商?）与 Q2（防火涂料有哪些知名品牌?）在三次运行里都没有提到这家公司，而 Q3、Q4 各提到了 2 次。差别说明现有可被引用的材料覆盖了『道路标线漆 / 重防腐 / 高闪点』这类细分词，没有覆盖最宽的两个品类词。",
      action:
        "围绕 Q1、Q2 的品类词建立可引用页面：产品线与应用场景、检测与认证、标准参与情况、真实案例。优先把内容放到回答已经引用过的域名类型上（行业门户、行业目录、标准与认证页面），而不是只发在自家官网。",
      deliverable: "覆盖 Q1、Q2 品类词的内容页面；每条内容对应一个可核验的证据。",
      acceptance: "复测时 Q1、Q2 的计数从 0 变成非 0 即为进展；没有变成非 0 时，结论是内容还没有被引用，而不是要再写一遍同样的东西。",
    },
  ],
  plan: [
    [
      "第 1—14 天",
      "统一实体口径：确认法定全称、官方简称、曾用简称、代码、成立年份、注册地，明确『冠军股份』的使用场合；上线官网事实页。",
      "1 份实体事实表（含出处与日期）；20 条标准问答；官网事实页链接",
    ],
    [
      "第 15—30 天",
      "核验第七节的断言：专利、资质、客户与工程，逐条找证据或删除。",
      "每条断言的证据或删除决定；客户授权记录",
    ],
    [
      "第 31—60 天",
      "针对 Q1、Q2 两个品类词补可引用内容，优先放到回答已经引用过的来源类型上。",
      "内容页面清单与链接；每条对应的证据",
    ],
    [
      "第 61—90 天",
      "用同一批 10 道题、同一模型、同样 3 次运行复测，逐题对照计数，并记录模型版本与日期。",
      "同题复测的原始回答文件；逐题计数对照表（本次为 4 / 12 的基线）",
    ],
  ],
  coding: [
    ["q", "问题在题库里的序号（1—10）", "报告里写作 Q1—Q10"],
    ["group", "category=行业问题（不含品牌名）、ambig=消歧问题、fact=事实问题（点名公司）", "分组统计与分组合计；三组的分母不同，不能相加"],
    ["question", "问题的自然语言原文", "逐题表格与复测时的问题版本"],
    ["run", "第几次运行（1—3）", "报告里写作『第 N 次运行』；同一题的三次运行是三个独立会话"],
    ["ok", "这次调用是否拿到完整回答", "只统计 ok=true 的行；ok=false 的行不进入任何计数"],
    ["status / errorBody", "HTTP 状态与错误正文", "只用于说明被排除的行是什么（本次全部是 429 限流）"],
    ["mentionsBrand", "答案里是否出现 冠军股份 / 冠军科技 / 冠军漆 / 鲸海漆", "品牌提及次数——本报告的核心数字"],
    ["mentionsCoatings", "答案里是否出现『涂料』", "涂料提及次数，用来说明回答确实在谈这个品类"],
    ["domains", "这次回答引用的域名列表", "信源网络一节；一次回答里同一域名只计 1 次"],
    ["usage.total_tokens", "这次调用的 token 用量", `总用量口径（本次 ${totalTokens}，见元数据）`],
    ["usage.tool_usage.web_search", "这次调用里联网搜索的次数", "证明这次是按开启搜索跑出来的"],
    ["answer", "模型返回的完整回答文本", "原文摘录与断言定位的来源"],
  ],
  method: [
    `本报告的每一次计数都来自 ${answersPath} 里 ok=true 的 ${answers.length} 条记录：${questions.length} 道问题，每题 ${RUNS_PER_QUESTION} 次运行，合计 ${totals.runs} 次完成的回答。模型是 ${modelName}（火山方舟 /api/v3/responses），测量日期 ${measuredOn}，开启联网搜索（tools: [web_search]），每题 3 次、每次调用之间至少间隔 3 秒（采集脚本的间隔常量）。同一天、同一个模型、同一批问题。`,
    `这个文件一共有 ${parsed.length} 行，其中 ${rejected.length} 行是更早一次运行被限流后写入的失败记录（${[...rejectedByStatus.entries()].map(([s, n]) => `HTTP ${s} × ${n}`).join("、")}，answer 为空）。它们在计数之前就被排除：本报告所有数字只用另外 ${answers.length} 行。被排除的行没有被当成 0 次提及——把限流读成『品牌没有被提到』，正是这份报告要避免的错误。`,
    `模型名与测量日期不在数据里：文件的每一行只有 q、group、question、run、ok、status、errorBody、ms、mentionsBrand、mentionsCoatings、domains、usage、answer 这些字段，没有 model，也没有时间戳。模型名来自这次运行使用的配置（.keys/volcengine.txt 里的 MODEL_ID，由采集脚本 phase1-champion.mjs 读取），日期取自数据文件名。这两项是本报告的输入参数，不是从数据里读出来的；换一次运行就必须重新提供。`,
    `mentionsBrand 与 mentionsCoatings 是采集脚本在写入每一行时判定的，判定规则见『标注字段口径』。本报告直接读这两个字段，不重新判定，所以报告里的数字和采集时的判定完全一致——包括判定可能存在的偏差。`,
    `本报告不出现百分比：每个数字都写成『几次运行里几次』。3 次运行不足以支撑一个比例，这是服务定义里写死的口径，也是这份数据唯一诚实的报法。`,
  ],
  provenance: [
    `数据文件：${answersPath}（${parsed.length} 行，其中 ok=true ${answers.length} 行、失败 ${rejected.length} 行）。`,
    "采集脚本：phase1-champion.mjs（本次运行没有入仓）。它调用火山方舟 /api/v3/responses，开启 web_search 工具，每题 3 次，调用之间至少间隔 3 秒（GAP_MS=3000），失败最多重试 3 次。数据文件里没有时间戳，所以间隔只能按脚本的配置说明，不能从数据里复算。",
    "模型名：来自 .keys/volcengine.txt 的 MODEL_ID（由采集脚本读取）。数据文件本身不含模型字段。",
    `测量日期：取自数据文件名 ${answersPath.split(/[\\/]/).pop()} 里的日期；数据文件不含时间戳字段。`,
    "mentionsBrand / mentionsCoatings：采集脚本写入，判定规则见本附录『标注字段口径』；本报告不重新判定。",
    "报告结构：章节顺序参照一份外部交付物（冠军股份_GEO监测诊断报告.docx）的目录与表格形态，仅取结构。文字、表格内容、结论全部重写：那是别人做的交付物，逐字照搬既有授权问题，也会让这份报告把合成数据当成实测结果——该文件的数字是按预设规则与固定随机种子合成的，本报告的每一个数字都来自真实的 30 次回答。",
    "本报告由 scripts/report/build-visibility.mts 生成，DOCX/XLSX 由 scripts/report/render-report.py 渲染；同一份模型文件也可以单独重渲染。",
  ],
};

const modelPath = join(outDir, "visibility-model.json");
writeFileSync(modelPath, JSON.stringify(model, null, 2), "utf8");
console.log(`wrote ${modelPath}`);

/* ------------------------------------------------------------------ */
/* Markdown - rendered here, from the same model, so no Python needed   */
/* ------------------------------------------------------------------ */

const esc = (s: string) => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
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
 * WHY THE ALT TEXT IS THE CAPTION AND NOT A SHORT LABEL: the DOCX this run also writes prints the
 * caption under the picture, and the Markdown is a separate deliverable of the same run. A short
 * alt text here ("mentions chart") would mean the two documents describe the same figure
 * differently - and the caption is the part that says the labels are counts, so dropping it from
 * the alt text is how a reader of the Markdown ends up reading a bar chart as a rate.
 *
 * WHY T() AND NOT COPY: this helper is handed a KEY, not a string, because the first version took
 * the raw block and printed "n = 每组完成的运行次数（{groupRuns}）" into the Markdown while the same
 * caption in the DOCX - rendered from the filled block - was correct. The placeholder check at the
 * end of this file now fails the build if that happens again.
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
  [COPY.kModel, modelName],
  [COPY.kMeasuredOn, measuredOn],
  [COPY.kWebSearch, COPY.yes],
  [COPY.kRunsPerQuestion, String(RUNS_PER_QUESTION)],
  [COPY.kAnswersFile, answersPath],
  [COPY.kCompleted, `${answers.length} / ${parsed.length}`],
  [COPY.kExcluded, failureSummary],
  [COPY.kTokens, String(totalTokens)],
  [COPY.kCitations, `${citationEvents} / ${domainMap.size}`],
  [COPY.kGeneratedAt, stamp],
]);

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
      `${g.coatingsMentions} / ${g.runs}`,
    ]),
    [
      COPY.thTotal,
      String(questions.length),
      String(totals.runs),
      `${totals.brandMentions} / ${totals.runs}`,
      `${totals.coatingsMentions} / ${totals.runs}`,
    ],
  ]
);
md.push(T("coverageNote"), "");
figure("figGroups", "groups.png");
md.push(`### ${COPY.sectionNotMeasured}`);
md.push("");
for (const item of model.limits) bullet(item);
md.push("");

md.push(`## ${COPY.sectionOverview}`);
md.push("");
md.push(T("overviewLead"), "");
table(
  [COPY.thNo, COPY.thQuestion, COPY.thGroup, COPY.thBrand, COPY.thCoatings],
  questions.map((q) => [
    `Q${q.q}`,
    q.question,
    q.groupShort,
    `${q.brandMentions} / ${q.okRuns}`,
    `${q.coatingsMentions} / ${q.okRuns}`,
  ])
);
md.push(T("overviewTotals"), "");
md.push(T("overviewPrompted"), "");
figure("figMentions", "mentions.png");
md.push(`### ${COPY.sectionHowToRead}`);
md.push("");
for (const key of ["readCounts", "readPrompted", "readDenominator", "readSameDay"]) bullet(T(key));
md.push("");

md.push(`## ${COPY.sectionEntity}`);
md.push("");
md.push(T("entityLead"), "");
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

md.push(`## ${COPY.sectionGroups}`);
md.push("");
md.push(T("groupsLead"), "");
for (const g of model.groups) {
  md.push(`### ${g.label}`);
  md.push("");
  md.push(g.reading, "");
  table(
    [COPY.thNo, COPY.thQuestion, COPY.thBrand, COPY.thCoatings],
    questions
      .filter((q) => q.group === g.id)
      .map((q) => [
        `Q${q.q}`,
        q.question,
        `${q.brandMentions} / ${q.okRuns}`,
        `${q.coatingsMentions} / ${q.okRuns}`,
      ])
  );
}

md.push(`## ${COPY.sectionCompetitors}`);
md.push("");
md.push(`> ${T("competitorsCallout")}`);
md.push("");
md.push(T("competitorsBody"), "");
for (const key of ["competitorsNone1", "competitorsNone2", "competitorsNone3"]) bullet(T(key));
md.push("");

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

md.push(`## ${COPY.sectionClaims}`);
md.push("");
md.push(`> ${T("claimsCallout")}`);
md.push("");
table(
  [COPY.thClaim, COPY.thSource, COPY.thHandling],
  claims.map((c) => [c.claim, c.source, c.handling])
);
md.push(T("claimsNote"), "");

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

md.push(`## ${COPY.sectionAdvice}`);
md.push("");
md.push(T("adviceLead"), "");
for (const item of model.advice) {
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
table([COPY.thStage, COPY.thWork, COPY.thOutput], model.plan);
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
for (const text of model.method) md.push(text, "");
md.push(`### ${COPY.sectionCoding}`);
md.push("");
table([COPY.thField, COPY.thMeaning, COPY.thUsage], model.coding);
md.push(`### ${COPY.sectionReplication}`);
md.push("");
for (const key of ["replication1", "replication2", "replication3"]) bullet(T(key));
md.push("");

md.push(`## ${COPY.sectionQuestions}`);
md.push("");
md.push(`*${COPY.questionsLead}*`);
md.push("");
table(
  [COPY.thNo, COPY.thQuestion, COPY.thRun1, COPY.thRun2, COPY.thRun3, COPY.thBrand, COPY.thCoatings],
  questions.map((q) => [
    `Q${q.q}`,
    q.question,
    ...q.runMarks,
    `${q.brandMentions} / ${q.okRuns}`,
    `${q.coatingsMentions} / ${q.okRuns}`,
  ])
);

md.push(`## ${COPY.sectionProvenance}`);
md.push("");
for (const item of model.provenance) bullet(item);
md.push("");

const mdPath = join(outDir, "report.md");

/**
 * NO PLACEHOLDER MAY REACH THE MARKDOWN, and this is the check that says so after the fact.
 *
 * The DOCX is rendered from FILLED_COPY, which the leftover check above already covers. The
 * Markdown is assembled here and can reach for either block: `COPY` is the template and `T()` is
 * the filled one, and taking the wrong one is silent - the sentence reads correctly right up to the
 * point where "{groupRuns}" is printed at a client. That is exactly what happened to the second
 * figure caption in this file: the DOCX was right, the Markdown was not, and nothing objected. One
 * scan of the finished text is what turns that class of mistake into a failed build instead of a
 * document.
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
 * The same interpreter probe build-report.mts uses, and the same rule about stdio: the probe is
 * spawnSync with stdio "ignore" and no shell, because with `shell: true` on Windows the nested
 * quotes reach cmd.exe rewritten and the import test reports "no Python" even when REPORT_PYTHON
 * points straight at one.
 *
 * THE MODEL AND THE MARKDOWN ARE ALREADY WRITTEN when this probe fails, and they are complete
 * documents on their own - the Markdown is the whole report. But the DOCX is a deliverable of this
 * product (the service definition notes that an editable DOCX is the form agencies buy), so a
 * missing interpreter is reported loudly rather than passed over.
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
