#!/usr/bin/env node
/**
 * Build a CLIENT-SPECIFIC measurement question bank from a FILLED intake form.
 *
 * ================================================================================================
 * WHERE THIS SITS IN THE PRODUCT
 * ================================================================================================
 * Step 2 of the three steps in intake/README.md:
 *
 *   1. the client fills intake/_template.yaml  ->  clients/<client>.yaml   (never in this repo)
 *   2. this script emits 25-30 questions       ->  clients/banks/<client>-<date>.{yaml,md}
 *   3. the client approves the .md, the bank is FROZEN, and only then does the measurement run.
 *
 * Step 2 is the step that cannot be skipped: the bank is the skeleton of the report, and a bank that
 * asks about the wrong industry produces a report whose numbers are about something nobody asked
 * about. intake/README.md records that this has already happened once.
 *
 * ================================================================================================
 * WHY A GENERATOR, AND WHY THE SKELETONS ARE OURS BUT EVERY WORD IN A QUESTION IS THE CLIENT'S
 * ================================================================================================
 * Three layers, from intake/README.md, and only the first two are ours:
 *
 *   archetype  (4, fixed, never varies)   category discovery / scenario / comparison / fact
 *   skeleton   (~34, ours, basically fixed)  a sentence with slots: "which companies offer {category}?"
 *   instance   (unlimited, free)          the client's own words in the slots
 *
 * So the industry does not change our workload, and it does not change our code either. What changes
 * per client is which slot values exist. That is the whole design, and it fails in exactly one way:
 * a slot value that we invented, guessed, or padded with a generic word. "Your industry is the
 * industry" would produce a bank that fits every client and measures nothing, so it is not merely
 * discouraged here - assertNoGenericPhrase() fails the build over the emitted bank, and every
 * skeleton is asserted to contain at least one slot (a skeleton made only of our wording is a
 * question about us, not about the client).
 *
 * WHY lib/answer-check/questions.ts IS NOT THE CONTENT. That file is ONE INSTANTIATION: it asks
 * about youth sports because that is who it was written for, and it is deliberately bracket-shaped
 * because its reader has to fill the brackets themselves. Reusing its sentences as the bank would be
 * reusing one client's industry for another's - the exact failure this script exists to prevent. It
 * is read as a shape reference only: the four archetypes, their order, and the one-line reason each
 * group exists. Its label/why wording is not copied either; the group text below is a different
 * sentence, because a measurement bank's group headings have to say what the group measures for a
 * client who is approving it, not what a copyable template's heading says.
 *
 * ================================================================================================
 * REJECTED ALTERNATIVES, so a future edit does not re-litigate them
 * ================================================================================================
 * 1. MACHINE-TRANSLATING THE QUESTIONS INTO THE OTHER market language. Rejected: a translation is
 *    OUR wording, not the client's. The rule from intake/README.md is that the long tail of
 *    vocabulary is the client's responsibility, and a translated category term is precisely the
 *    guess that rule forbids. So a language group is built from the values the client wrote in that
 *    language, and a language whose values are missing is reported as thin with that reason. The
 *    escape hatch is the client's own: put the English terms in the same list
 *    (category_terms: [跨境收款, cross-border collection]) and both groups fill from their own words.
 * 2. A `--questions=N` flag. Rejected: the count is a property of the archetype design (a fixed
 *    distribution), not of the client's taste; and letting the count vary per client is how two
 *    measurement runs stop being comparable. The counts are TARGET_QUESTIONS and are asserted.
 * 3. Falling back to a generic category term when industry.category_terms is empty. Rejected on the
 *    same grounds as (1), plus: the template calls category_terms the ONLY authoritative source, and
 *    silently substituting a word of ours would hide that the client has not confirmed any terms yet
 *    - which is the one input this bank is not allowed to invent.
 * 4. Emitting the bank into the repository. Rejected: the bank names the client and their
 *    competitors, and this repository is public (intake/README.md says so). The default output
 *    directory is outside the repo, and inside-repo output needs the explicit --allow-in-repo, so
 *    the dangerous case cannot happen by accident.
 * 5. Reading industry.term_candidates (the LLM's 15-30 proposals). Rejected: intake/_template.yaml
 *    says that block is a PROCESS RECORD, not a conclusion, and that only the ticks copied into
 *    category_terms count. assertSourcesAreAllowed() fails the build if a future skeleton starts
 *    reading it - or reading industry.sector (a routing hint), or the restricted/forbidden lists.
 *
 * ================================================================================================
 * THE RULES THAT ARE ASSERTIONS RATHER THAN HABITS (each one is a function at the end of this file)
 * ================================================================================================
 *  1. competitors.never_mention appears in NO question.        assertNoNeverMention()
 *     A never_mention entry that occurs inside a client field VALUE is a contradiction (their own
 *     prohibition versus their own vocabulary) and stops the build - only the client can decide which
 *     side to give up. What is left for the assertion is the case a value check cannot see: a phrase
 *     assembled across the boundary between a client value and our fixed wording, and a phrase sitting
 *     in our wording itself. It has exactly ONE mechanism: an earlier version skipped the skeleton and
 *     dropped candidates before the assertion ran, which meant the rule could never trip and the bank
 *     silently lost questions.
 *  2. compliance.restrictions / goals.forbidden_topics are not asked about.
 *                                                              assertNoRestricted() + hardFailure check
 *     A restricted phrase inside a client-supplied slot value is a CONTRADICTION in the intake (the
 *     client's own category word is a red line). That is a hard failure, not a silent drop: dropping
 *     an authoritative category term would shrink the confirmed category set behind the client's
 *     back, and emitting the question would make the report unpublishable. A restricted phrase in
 *     OUR fixed wording is different - the skeleton is skipped and the skip is reported.
 *  3. An empty slot degrades; it is never filled.               assertProvenanceResolves()
 *                                                              assertNoUnfilledSlot()
 *     Every emitted question must (a) trace every slot value back to an intake field path that
 *     re-reads to exactly that value, and (b) contain no "{...}". The intake template teaches people
 *     to write {品类词}, so a brace that survives in a value is indistinguishable from a slot we
 *     failed to fill - the build stops and names the field.
 *  4. The bank is frozen and attributable.                      the bank block of both outputs
 *     Source intake path, sha256 of its bytes, generation date, generator version + sha256 of this
 *     script's own source + best-effort git commit, a sha256 fingerprint of the question list, and a
 *     BLANK approved_by for the client signature. A later measurement must be able to prove which
 *     bank it used - that is the reproducibility claim the product makes.
 *  5. One language per question; the bank is grouped by language. assertLanguagePurity()
 *     Free-text slots must be written in the question's language (CJK for 中文, no CJK for English).
 *     Names - brand, competitor, product, alias, former name - are exempt, because a name is quoted,
 *     not translated; country and city names are NOT exempt, because "China" is not a quotation of
 *     "中国". A language group that ends up empty is reported empty WITH the reason, never padded.
 *
 * ================================================================================================
 * USAGE
 * ================================================================================================
 *   npm run bank:build -- --intake=..\clients\acme.yaml --out=..\clients\banks
 *
 *   --intake=PATH     required. The filled form. A relative path resolves against this repository
 *                     first and the workspace above it second (that is where clients/ lives).
 *   --out=DIR         output directory. Defaults to <workspace>/clients/banks, i.e. OUTSIDE this
 *                     repository. A directory inside the repo is refused unless --allow-in-repo is
 *                     also passed, because these two files name a client and their competitors.
 *   --date=YYYY-MM-DD generation date used in the filenames; defaults to today.
 *   --print           echo the generated questions to stdout. Off by default: a console is a log,
 *                     and a log of client questions is the same leak as committing them.
 *   --allow-in-repo   permit writing into the repository. Explicit, and printed loudly.
 *
 * Two files are written per client:
 *   <out>/<client>-<date>.yaml  machine-readable, consumed by the measurement run
 *   <out>/<client>-<date>.md    what the client reads, ticks and signs
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const WORKSPACE = resolve(REPO, "..");
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_REL = "scripts/report/build-question-bank.mts";

/**
 * Bumped by hand when a skeleton or a rule changes. The question-list fingerprint below catches any
 * change mechanically, so the version is not the safety net - it is the human-readable answer to
 * "is this the same generator that produced the bank we compared against last quarter?".
 */
const GENERATOR_VERSION = 1;

/** The distribution. Sums to 29, inside the 25-30 target; the window is asserted, not assumed. */
const TARGET: Record<ArchetypeId, number> = { category: 8, scenario: 8, comparison: 6, fact: 7 };
const MIN_QUESTIONS = 25;
const MAX_QUESTIONS = 30;

/* ------------------------------------------------------------------ */
/* Arguments                                                          */
/* ------------------------------------------------------------------ */

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

const intakeArg = arg("intake");
const allowInRepo = flag("allow-in-repo");
const shouldPrint = flag("print");

if (!intakeArg) {
  console.error(
    [
      "Usage:",
      "  npm run bank:build -- --intake=<filled intake.yaml> [--out=DIR] [--date=YYYY-MM-DD] [--print]",
      "",
      "  --intake          the filled intake form (required). Relative paths resolve against this",
      "                    repository first and the workspace above it second, so both",
      "                    intake/examples/finance.yaml and ..\\clients\\acme.yaml work.",
      "  --out             where the two bank files go. Defaults to <workspace>/clients/banks, which",
      "                    is deliberately outside this repository: the bank names the client and",
      "                    their competitors. A directory inside the repo is refused unless",
      "                    --allow-in-repo is passed as well.",
      "  --date            generation date for the filenames; defaults to today.",
      "  --print           echo the questions to stdout. Off by default - a console is a log.",
      "",
      "Nothing is written unless every assertion in this file passes.",
    ].join("\n")
  );
  process.exit(2);
}

/**
 * Repository first, workspace second - the same order build-visibility.mts uses for the same reason:
 * filled intakes deliberately live OUTSIDE this repository (they contain client names, competitors
 * and forbidden topics), while the two synthetic examples live inside it, and both have to work.
 */
function resolveInput(p: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(p) || p.startsWith("/")) return p;
  const inRepo = resolve(REPO, p);
  if (existsSync(inRepo)) return inRepo;
  return resolve(WORKSPACE, p);
}

const intakePath = resolveInput(intakeArg);
if (!existsSync(intakePath)) {
  console.error(`--intake points at ${intakePath}, which does not exist.`);
  process.exit(1);
}

/** True when `child` is `parent` itself or lives under it. */
function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith(`..${sep}`) && !/^[a-zA-Z]:/.test(rel));
}

const outDir = resolve(REPO, arg("out") || join(WORKSPACE, "clients", "banks"));
if (isInside(REPO, outDir) && !allowInRepo) {
  console.error(
    [
      `Refusing to write into the repository: ${outDir}`,
      "",
      "The bank contains the client's name, their competitors and the words they were told not to",
      "mention. This repository is public, so a bank written here is published whether or not a page",
      "renders it - the same reason intake/README.md keeps the filled form in clients/.",
      "",
      `Pass an --out outside the repository (for example --out=${join(WORKSPACE, "clients", "banks")}),`,
      "or pass --allow-in-repo if you really mean it.",
    ].join("\n")
  );
  process.exit(2);
}

const generatedAt = new Date().toISOString();
const date = (arg("date") || generatedAt.slice(0, 10)).trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD; got ${JSON.stringify(date)}.`);
  process.exit(2);
}

/* ------------------------------------------------------------------ */
/* Reading the intake                                                 */
/* ------------------------------------------------------------------ */

const intakeText = readFileSync(intakePath, "utf8");
const intakeSha256 = createHash("sha256").update(intakeText).digest("hex");

let intake: unknown;
try {
  intake = parse(intakeText);
} catch (err) {
  console.error(`${intakePath} is not valid YAML: ${(err as Error).message}`);
  process.exit(1);
}
if (typeof intake !== "object" || intake === null) {
  console.error(`${intakePath} parses to ${typeof intake}, not a mapping. Nothing was written.`);
  process.exit(1);
}

function rawAt(doc: unknown, path: string): unknown {
  let cur: unknown = doc;
  for (const key of path.split(".")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

type SlotValue = {
  value: string;
  field: string;
  /**
   * Set only on values this generator DERIVED for one specific language (today: the audience.type
   * mapping). Such a value belongs to that language group and must not be reported as an
   * "excluded from the Chinese bank because it is English" degradation - it is our own translation of
   * a closed enum, not a client value that failed a rule.
   */
  lang?: Lang;
};

/** One trimmed string, or nothing. A blank string is empty, never a value. */
function scalarAt(doc: unknown, path: string): SlotValue[] {
  const v = rawAt(doc, path);
  if (typeof v === "number" && Number.isFinite(v)) return [{ value: String(v), field: path }];
  if (typeof v !== "string") return [];
  const text = v.trim();
  return text.length > 0 ? [{ value: text, field: path }] : [];
}

/** Every non-blank element of an array, each with the index it came from (that is the provenance). */
function listAt(doc: unknown, path: string): SlotValue[] {
  const v = rawAt(doc, path);
  if (!Array.isArray(v)) return [];
  const out: SlotValue[] = [];
  v.forEach((item, i) => {
    const text = (typeof item === "number" ? String(item) : typeof item === "string" ? item : "").trim();
    if (text.length > 0) out.push({ value: text, field: `${path}[${i}]` });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Slots: what the skeletons can ask about, and where each comes from  */
/* ------------------------------------------------------------------ */

const SLOT_NAMES = [
  "brand",
  "short_name",
  "alias",
  "former_name",
  "product",
  "founded_year",
  "website",
  "category",
  "subcategory",
  "jargon",
  "audience",
  "audience_type",
  "situation",
  "most_asked",
  "answered_badly",
  "concern",
  "competitor",
  "peer",
  "market",
] as const;
type SlotName = (typeof SLOT_NAMES)[number];

/**
 * `shape` is how the slot is read, `paths` is where it is read from, and the two are declared
 * together on purpose: the prose this script prints when a slot is empty names the intake field, and
 * a hand-maintained second list of paths is exactly how that message starts naming the wrong field.
 *
 * `properNoun` decides whether the language rule below applies. Names are exempt from it; prose is
 * not. The distinction is not cosmetic - see assertLanguagePurity().
 */
type SlotSpec = {
  paths: string[];
  shape: "list" | "scalar" | "mapped";
  properNoun: boolean;
  /** What this slot is, for the degradation notes a client may read. */
  from: string;
};

const SLOT_SPECS: Record<SlotName, SlotSpec> = {
  brand: {
    paths: ["brand.name"],
    shape: "scalar",
    properNoun: true,
    from: "品牌全称（客户自己的写法，不翻译）",
  },
  short_name: { paths: ["brand.short_name"], shape: "scalar", properNoun: true, from: "品牌口语简称" },
  alias: { paths: ["brand.aliases"], shape: "list", properNoun: true, from: "其他叫法 / 俗称 / 错写" },
  former_name: { paths: ["brand.former_names"], shape: "list", properNoun: true, from: "曾用名" },
  product: { paths: ["brand.products"], shape: "list", properNoun: true, from: "产品名" },
  founded_year: { paths: ["brand.founded_year"], shape: "scalar", properNoun: true, from: "成立年份" },
  website: { paths: ["brand.website"], shape: "scalar", properNoun: true, from: "官网" },
  category: { paths: ["industry.category_terms"], shape: "list", properNoun: false, from: "客户确认过的品类词（唯一权威）" },
  subcategory: { paths: ["industry.subcategory"], shape: "scalar", properNoun: false, from: "客户自己的子品类说法" },
  jargon: { paths: ["industry.jargon"], shape: "list", properNoun: false, from: "行业黑话与俗称" },
  audience: { paths: ["audience.description"], shape: "scalar", properNoun: false, from: "目标客户是谁" },
  audience_type: { paths: ["audience.type"], shape: "mapped", properNoun: false, from: "客群类型（封闭选项）" },
  situation: { paths: ["audience.situations"], shape: "list", properNoun: false, from: "客户在什么处境下需要" },
  most_asked: { paths: ["audience.most_asked"], shape: "list", properNoun: false, from: "客户最常问的问题" },
  answered_badly: { paths: ["audience.answered_badly"], shape: "list", properNoun: false, from: "最常被问到但答不好的问题" },
  concern: { paths: ["audience.concerns"], shape: "list", properNoun: false, from: "购买时的顾虑" },
  competitor: { paths: ["competitors.names"], shape: "list", properNoun: true, from: "客户点名的竞品" },
  peer: { paths: ["competitors.desired_peers"], shape: "list", properNoun: true, from: "客户希望被并列的公司" },
  market: {
    paths: ["markets.cities", "markets.countries"],
    shape: "list",
    properNoun: false,
    from: "客户填的市场（城市优先，越具体的问题越有意义）",
  },
};

/**
 * audience.type is a CLOSED enum in the intake (B2C | B2B | 两者都有). The mapped phrase is a
 * determined translation of the value the client chose, not a guess, and an unrecognised non-empty
 * value stops the build: a closed enum with an unexpected value means the intake is malformed, and
 * dropping it would leave the audience_type skeletons silently missing from every future bank.
 */
const AUDIENCE_TYPE: Record<string, { zh: string; en: string }> = {
  B2C: { zh: "个人消费者", en: "individual consumers" },
  B2B: { zh: "企业客户", en: "businesses" },
  两者都有: { zh: "个人消费者和企业客户", en: "both consumers and businesses" },
};

function mappedValues(doc: unknown, slot: SlotName, path: string): SlotValue[] {
  if (slot !== "audience_type") throw new Error(`mappedValues() called for ${slot}`);
  const raw = scalarAt(doc, path);
  if (raw.length === 0) return [];
  const hit = AUDIENCE_TYPE[raw[0].value];
  if (!hit) {
    console.error(
      [
        `audience.type 的值是 ${JSON.stringify(raw[0].value)}，不在 intake 模板给的取值里：`,
        `${Object.keys(AUDIENCE_TYPE).join(" | ")}。`,
        "这是一个封闭选项，出现别的值只说明表填错了、或者表改了而生成器没跟着改。",
        "这里直接报错而不是丢掉它：丢掉等于以后每一份题库都悄悄少掉 {audience_type} 那几道题。",
      ].join("\n")
    );
    process.exit(1);
  }
  return (["zh", "en"] as const).map((lang) => ({ value: hit[lang], field: path, lang }));
}

function slotValues(doc: unknown, slot: SlotName): SlotValue[] {
  const spec = SLOT_SPECS[slot];
  if (spec.shape === "list") return spec.paths.flatMap((p) => listAt(doc, p));
  if (spec.shape === "scalar") return scalarAt(doc, spec.paths[0]);
  return mappedValues(doc, slot, spec.paths[0]);
}

/* ------------------------------------------------------------------ */
/* The four archetypes - ours, fixed, never varying                    */
/* ------------------------------------------------------------------ */

type ArchetypeId = "category" | "scenario" | "comparison" | "fact";
type Lang = "zh" | "en";
const LANGS: Lang[] = ["zh", "en"];

const ARCHETYPES: {
  id: ArchetypeId;
  label: Record<Lang, string>;
  measures: Record<Lang, string>;
}[] = [
  {
    id: "category",
    label: { zh: "品类发现", en: "Category discovery" },
    measures: {
      zh: "问题里不出现品牌名。这一组测的是触达：一个还不知道这家公司存在的人，问品类的时候会不会被推荐到它。",
      en: "No brand name in the question. This measures reach: whether somebody who does not know the brand exists gets recommended it when they ask about the category.",
    },
  },
  {
    id: "scenario",
    label: { zh: "场景需求", en: "Scenario / need" },
    measures: {
      zh: "一个处境或一个需求，问题里同样不出现品牌名。测的是推荐会不会从「需要」推出来，而不是从品类清单里挑。",
      en: "A situation or a need, again with no brand name. It tests whether a recommendation follows from the need rather than from a category list.",
    },
  },
  {
    id: "comparison",
    label: { zh: "对比选型", en: "Comparison" },
    measures: {
      zh: "把品牌和客户点名的对手放在一起比。测的是能不能进入候选名单——也是模型最容易答「看情况」的一组。",
      en: "The brand against an alternative the client named. It shows whether the brand can enter a shortlist at all, and these are the questions most often answered with \"it depends\".",
    },
  },
  {
    id: "fact",
    label: { zh: "事实核验", en: "Fact check" },
    measures: {
      zh: "问题里点名品牌，核的是可验证的细节。测的是准确度而不是触达；这一组答错的代价最高。",
      en: "The brand by name, against verifiable detail. It measures accuracy rather than reach, and this is where an error is expensive.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* The skeletons - with slots, in every language we can write          */
/* ------------------------------------------------------------------ */

type Skeleton = {
  id: string;
  archetype: ArchetypeId;
  /** Every slot that must resolve to a non-empty value before this skeleton can be used. */
  needs: SlotName[];
  /** The slot iterated to produce several questions from one skeleton. Must be in `needs`. */
  vary: SlotName;
  /**
   * Slots this question is CHECKED AGAINST but which must not appear in its wording - the answer key.
   * "{brand}是哪一年成立的？" verifies brand.founded_year; putting the year in the question would
   * hand the model the answer and measure nothing.
   *
   * WHY THIS IS A SEPARATE LIST FROM `needs` RATHER THAN AN EXCEPTION. A slot in `needs` is wording:
   * if it is empty the skeleton cannot be written, and the build skips it. A slot in `verifies` is
   * the expected answer: if it is empty the question is still a valid question (it still measures
   * whether repeated runs agree with each other), so the question is kept and the missing key is
   * recorded in both outputs. Collapsing the two would either invent wording or silently delete a
   * fact question the client can still use.
   */
  verifies?: SlotName[];
  text: Record<Lang, string>;
};

/**
 * WHY THESE SENTENCES ARE SHORT AND PLAIN. They are the user's side of a search or a chat prompt, not
 * a brief. A question a buyer would never type measures the model's patience, not the brand's
 * visibility.
 *
 * WHY EVERY TEMPLATE ENDS IN THE LANGUAGE'S QUESTION MARK. Punctuation is part of the measurement:
 * a prompt without a question mark is a different prompt.
 */
const SKELETONS: Skeleton[] = [
  /* --- category discovery: no brand name may appear ------------------- */
  {
    id: "C1",
    archetype: "category",
    needs: ["category"],
    vary: "category",
    text: {
      zh: "有哪些公司在做{category}？",
      en: "Which companies offer {category}?",
    },
  },
  {
    id: "C2",
    archetype: "category",
    needs: ["category", "market"],
    vary: "category",
    /**
     * NOUN-NEUTRAL ON PURPOSE. "供应商" / "服务商" / "providers" assumes the client sells something to
     * a business. A restaurant chain has no suppliers of 川味火锅, so a skeleton carrying that
     * assumption produces a question a buyer would never type - and the fault would be ours, in fixed
     * wording that nobody reviews per client. "公司" / "companies" carries no such assumption.
     */
    text: {
      zh: "{market}有哪些做{category}的公司？",
      en: "Which companies offer {category} in {market}?",
    },
  },
  {
    id: "C3",
    archetype: "category",
    needs: ["category", "audience"],
    vary: "category",
    text: {
      zh: "面向{audience}做{category}的公司有哪些？",
      en: "Which companies offer {category} to {audience}?",
    },
  },
  {
    id: "C4",
    archetype: "category",
    needs: ["category", "audience_type"],
    vary: "category",
    text: {
      zh: "给{audience_type}提供{category}的公司，哪几家比较常见？",
      en: "Which companies are commonly used for {category} by {audience_type}?",
    },
  },
  {
    id: "C5",
    archetype: "category",
    needs: ["subcategory"],
    vary: "subcategory",
    text: {
      zh: "{subcategory}这个细分领域里，主要的公司有哪些？",
      en: "Who are the main companies in {subcategory}?",
    },
  },
  {
    id: "C6",
    archetype: "category",
    needs: ["category", "jargon"],
    vary: "jargon",
    text: {
      zh: "想解决{category}里的{jargon}问题，有哪些公司能做？",
      en: "To deal with {jargon} in {category}, which companies can help?",
    },
  },
  {
    id: "C7",
    archetype: "category",
    needs: ["category", "concern"],
    vary: "concern",
    text: {
      zh: "找{category}的时候，{concern}这个问题通常怎么处理？",
      en: "When looking for {category}, how is this normally handled: {concern}?",
    },
  },
  {
    id: "C8",
    archetype: "category",
    needs: ["category"],
    vary: "category",
    text: {
      zh: "做{category}时间比较久的公司是哪几家？",
      en: "Which companies have the longest track record in {category}?",
    },
  },
  {
    id: "C9",
    archetype: "category",
    needs: ["subcategory", "market"],
    vary: "subcategory",
    text: {
      zh: "在{market}做{subcategory}的，一般是哪些公司？",
      en: "Which companies do {subcategory} in {market}?",
    },
  },
  {
    id: "C10",
    archetype: "category",
    needs: ["category", "audience"],
    vary: "audience",
    text: {
      zh: "{audience}需要{category}，有哪些公司可以对接？",
      en: "{audience} needs {category} - which companies can help?",
    },
  },

  /* --- scenario / need: no brand name may appear ---------------------- */
  {
    id: "S1",
    archetype: "scenario",
    needs: ["situation"],
    vary: "situation",
    text: {
      zh: "{situation}，这种情况该找哪类公司？",
      en: "Here is my situation: {situation}. Who should I talk to?",
    },
  },
  {
    id: "S2",
    archetype: "scenario",
    needs: ["most_asked"],
    vary: "most_asked",
    /**
     * audience.most_asked is already a question ("你们支持哪些平台的收款？"), so it is quoted rather
     * than reworded. WHY IT IS STILL WRAPPED: the intake records what a buyer asks the CLIENT, in the
     * second person. Putting it to a model unchanged measures how the model reacts to being addressed
     * as a vendor, not whether the industry's vendors get found. The frame keeps the value verbatim
     * and turns the addressee into the field as a whole.
     */
    text: {
      zh: "客户经常问「{most_asked}」，这类需求一般有哪些公司能满足？",
      en: "Customers often ask: \"{most_asked}\" - which companies can meet that need?",
    },
  },
  {
    id: "S3",
    archetype: "scenario",
    needs: ["answered_badly"],
    vary: "answered_badly",
    /** Same reasoning as S2, and this field is the strongest evidence of how buyers actually ask. */
    text: {
      zh: "经常被问到「{answered_badly}」，这个问题行业里一般怎么解决？",
      en: "Customers keep asking: \"{answered_badly}\" - how is that normally solved in this field?",
    },
  },
  {
    id: "S4",
    archetype: "scenario",
    needs: ["situation", "category"],
    vary: "situation",
    text: {
      zh: "{situation}的时候，{category}这块应该怎么解决？",
      en: "When {situation}, how should {category} be handled?",
    },
  },
  {
    id: "S5",
    archetype: "scenario",
    needs: ["concern", "category"],
    vary: "concern",
    text: {
      zh: "担心{concern}，找{category}的时候怎么规避？",
      en: "If {concern} is the worry, how is it avoided when looking for {category}?",
    },
  },
  {
    id: "S6",
    archetype: "scenario",
    needs: ["situation", "audience"],
    vary: "situation",
    text: {
      zh: "{audience}遇到{situation}，一般怎么处理？",
      en: "How do {audience} usually deal with this: {situation}?",
    },
  },
  {
    id: "S7",
    archetype: "scenario",
    needs: ["most_asked", "market"],
    vary: "most_asked",
    text: {
      zh: "「{most_asked}」这类需求，在{market}一般找谁？",
      en: "\"{most_asked}\" - who is normally used for that in {market}?",
    },
  },
  {
    id: "S8",
    archetype: "scenario",
    needs: ["situation", "concern"],
    vary: "situation",
    text: {
      zh: "{situation}，又担心{concern}，有什么办法？",
      en: "If {situation}, and {concern} is a concern, what are the options?",
    },
  },
  {
    id: "S9",
    archetype: "scenario",
    needs: ["answered_badly", "category"],
    vary: "answered_badly",
    text: {
      zh: "「{answered_badly}」这类问题，做{category}的公司一般怎么解决？",
      en: "\"{answered_badly}\" - how do companies in {category} usually handle that?",
    },
  },
  {
    id: "S10",
    archetype: "scenario",
    needs: ["audience", "category", "situation"],
    vary: "audience",
    text: {
      zh: "{audience}在做{category}时，遇到{situation}该找谁？",
      en: "{audience} working on {category} hit this: {situation}. Who should they approach?",
    },
  },

  /* --- comparison: the brand against a name the client gave us -------- */
  {
    id: "X1",
    archetype: "comparison",
    needs: ["brand", "competitor", "category"],
    vary: "competitor",
    text: {
      zh: "{brand}和{competitor}，做{category}选哪个更合适？",
      en: "{brand} vs {competitor} for {category} - which is the better fit?",
    },
  },
  {
    id: "X2",
    archetype: "comparison",
    needs: ["brand", "competitor"],
    vary: "competitor",
    text: {
      zh: "{brand}与{competitor}相比，优势和劣势分别是什么？",
      en: "Compared with {competitor}, what are {brand}'s strengths and weaknesses?",
    },
  },
  {
    id: "X3",
    archetype: "comparison",
    needs: ["short_name", "competitor"],
    vary: "competitor",
    text: {
      zh: "{short_name}和{competitor}是同一类公司吗？",
      en: "Are {short_name} and {competitor} the same kind of company?",
    },
  },
  {
    id: "X4",
    archetype: "comparison",
    needs: ["brand", "peer"],
    vary: "peer",
    text: {
      zh: "在{peer}这一档公司里，{brand}处在什么位置？",
      en: "Alongside {peer}, where does {brand} sit?",
    },
  },
  {
    id: "X5",
    archetype: "comparison",
    needs: ["short_name", "competitor", "category"],
    vary: "competitor",
    text: {
      zh: "做{category}的话，{short_name}和{competitor}哪个更省事？",
      en: "For {category}, which is easier to work with, {short_name} or {competitor}?",
    },
  },
  {
    id: "X6",
    archetype: "comparison",
    needs: ["brand", "competitor"],
    vary: "competitor",
    text: {
      zh: "{competitor}的客户为什么会考虑换成{brand}？",
      en: "Why would a {competitor} customer consider switching to {brand}?",
    },
  },
  {
    id: "X7",
    archetype: "comparison",
    needs: ["brand", "competitor", "market"],
    vary: "competitor",
    text: {
      zh: "在{market}，{brand}和{competitor}谁的服务覆盖更广？",
      en: "In {market}, which has better coverage, {brand} or {competitor}?",
    },
  },
  {
    id: "X8",
    archetype: "comparison",
    needs: ["brand", "peer"],
    vary: "peer",
    text: {
      zh: "{brand}和{peer}可以放在一起比较吗？差别在哪？",
      en: "Can {brand} and {peer} be compared? Where do they differ?",
    },
  },

  /* --- fact check: the brand by name, against verifiable detail ------- */
  {
    id: "F1",
    archetype: "fact",
    needs: ["brand"],
    vary: "brand",
    text: { zh: "{brand}是一家做什么的公司？", en: "What does {brand} do?" },
  },
  {
    id: "F2",
    archetype: "fact",
    needs: ["brand"],
    vary: "brand",
    verifies: ["founded_year"],
    text: { zh: "{brand}是哪一年成立的？", en: "In which year was {brand} founded?" },
  },
  {
    id: "F3",
    archetype: "fact",
    needs: ["short_name"],
    vary: "short_name",
    text: { zh: "“{short_name}”指的是哪家公司？", en: "Which company does \"{short_name}\" refer to?" },
  },
  {
    id: "F4",
    archetype: "fact",
    needs: ["alias"],
    vary: "alias",
    text: { zh: "“{alias}”是哪家公司？", en: "\"{alias}\" - which company is that?" },
  },
  {
    id: "F5",
    archetype: "fact",
    needs: ["brand", "former_name"],
    vary: "former_name",
    text: {
      zh: "{brand}以前叫“{former_name}”，是同一家公司吗？",
      en: "{brand} used to be called \"{former_name}\" - is that the same company?",
    },
  },
  {
    id: "F6",
    archetype: "fact",
    needs: ["brand", "category"],
    vary: "category",
    text: { zh: "{brand}做{category}吗？", en: "Does {brand} do {category}?" },
  },
  {
    id: "F7",
    archetype: "fact",
    needs: ["brand", "product"],
    vary: "product",
    text: { zh: "{brand}的{product}是做什么用的？", en: "What is {brand}'s {product} for?" },
  },
  {
    id: "F8",
    archetype: "fact",
    needs: ["brand", "market"],
    vary: "market",
    text: { zh: "{brand}在{market}有业务吗？", en: "Does {brand} operate in {market}?" },
  },
  {
    id: "F9",
    archetype: "fact",
    needs: ["brand", "short_name"],
    vary: "brand",
    text: {
      zh: "{brand}和“{short_name}”是同一家公司吗？",
      en: "Are {brand} and \"{short_name}\" the same company?",
    },
  },
  {
    id: "F10",
    archetype: "fact",
    needs: ["brand", "website"],
    vary: "brand",
    text: { zh: "{brand}的官网是不是{website}？", en: "Is {website} the official website of {brand}?" },
  },
];

/* ------------------------------------------------------------------ */
/* Matching helpers, shared by every filter and every assertion        */
/* ------------------------------------------------------------------ */

const norm = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * WHY TOKENS SHORTER THAN TWO CHARACTERS ARE IGNORED. A one-character brand short name or
 * never_mention entry occurs inside unrelated words, so a substring check would fire on nearly every
 * question and the only way to make the build pass would be to weaken the check. Ignoring them is
 * recorded as a degradation instead, so the weakness is visible rather than silent.
 */
function matches(haystack: string, needles: string[]): string[] {
  const hay = norm(haystack);
  return needles.filter((n) => n.trim().length >= 2 && hay.includes(norm(n)));
}

/** Either string contains the other. Used for the never_mention-vs-brand contradiction. */
const overlaps = (a: string, b: string): boolean => matches(a, [b]).length > 0 || matches(b, [a]).length > 0;

/* ------------------------------------------------------------------ */
/* Filtering the intake into per-language usable slot values           */
/* ------------------------------------------------------------------ */

type Note = { code: string; detail: string };

type IntakeFacts = {
  client: string;
  filledBy: string;
  filledOn: string;
  approvedBy: string;
  neverMention: string[];
  restricted: string[];
  /** Brand spellings used for the "may not appear in a no-brand question" rule. */
  brandTokens: string[];
  languages: Lang[];
  languageNotes: Note[];
  complianceSensitive: string;
  /** slot -> usable values, per language. */
  usable: Record<Lang, Map<SlotName, SlotValue[]>>;
  notes: Note[];
};

function readIntakeFacts(doc: unknown): IntakeFacts {
  const notes: Note[] = [];
  const languageNotes: Note[] = [];

  const client = scalarAt(doc, "meta.client")[0]?.value ?? "";
  if (!client) {
    console.error(
      [
        "meta.client 是空的。批准页上的收件人和输出文件名都来自这一项，",
        "没有它就等于做了一份不知道给谁、事后也找不到的题库。",
        "请在 intake 里填上 meta.client（它不会出现在生成的报告里）。",
      ].join("\n")
    );
    process.exit(1);
  }

  const neverMention = listAt(doc, "competitors.never_mention").map((v) => v.value);
  const restricted = [
    ...listAt(doc, "compliance.restrictions"),
    ...listAt(doc, "goals.forbidden_topics"),
  ].map((v) => v.value);

  const brandTokens = [
    ...scalarAt(doc, "brand.name"),
    ...scalarAt(doc, "brand.short_name"),
    ...listAt(doc, "brand.aliases"),
    ...listAt(doc, "brand.former_names"),
    ...scalarAt(doc, "brand.english_name"),
  ]
    .map((v) => v.value)
    .filter((v, i, all) => v.trim().length >= 2 && all.indexOf(v) === i);

  for (const t of [
    ...scalarAt(doc, "brand.name"),
    ...scalarAt(doc, "brand.short_name"),
    ...listAt(doc, "brand.aliases"),
    ...listAt(doc, "brand.former_names"),
  ].map((v) => v.value)) {
    if (t.trim().length < 2) {
      notes.push({
        code: "short-brand-token",
        detail: `品牌名「${t}」不足两个字，品牌泄漏检查会忽略它（一个字的名字会出现在无关的词里）。`,
      });
    }
  }

  /**
   * A never_mention entry that is also how the brand spells itself makes the bank impossible: the
   * fact questions MUST contain the brand name, and rule 1 says the never_mention name may appear in
   * no question. Rather than let one rule quietly win, the intake is rejected.
   */
  for (const nm of neverMention) {
    const hit = brandTokens.filter((b) => overlaps(b, nm));
    if (hit.length > 0) {
      console.error(
        [
          `competitors.never_mention 里的「${nm}」同时出现在品牌自己的名字/别名里（${[...new Set(hit)].join("、")}）。`,
          "",
          "两条规则不可能同时成立：每一条事实题都必须点名品牌，而规则 1 说 never_mention 里的名字",
          "不得出现在任何一条问题里。请修 intake —— 要么把这一项从 never_mention 里去掉，",
          "要么不再用这个写法做品牌名。",
        ].join("\n")
      );
      process.exit(1);
    }
  }

  /* --- languages ---------------------------------------------------- */

  const declared = listAt(doc, "markets.languages").map((v) => v.value);
  const langs: Lang[] = [];
  for (const raw of declared) {
    const code = languageCode(raw);
    if (!code) {
      console.error(
        [
          `markets.languages contains ${JSON.stringify(raw)}, which this generator cannot write in.`,
          `Supported: ${Object.entries(LANG_ALIASES).map(([k, v]) => `${k}->${v}`).join(", ")}.`,
          "",
          "Failing here rather than falling back to English: a language group is built from the",
          "client's own words in that language, and English skeletons around translated-or-Chinese",
          "slots would be a bank that was never approved in either language.",
        ].join("\n")
      );
      process.exit(1);
    }
    if (!langs.includes(code)) langs.push(code);
  }
  if (langs.length === 0) {
    /**
     * intake/README.md: no markets means single-market, single-language, and the report says so. The
     * language is read off the intake's own prose rather than assumed to be Chinese, so an English
     * form does not silently become a Chinese bank.
     */
    const prose = [
      ...listAt(doc, "industry.category_terms"),
      ...scalarAt(doc, "industry.subcategory"),
      ...listAt(doc, "audience.situations"),
      ...scalarAt(doc, "audience.description"),
    ]
      .map((v) => v.value)
      .join(" ");
    const inferred: Lang = hasCJK(prose) ? "zh" : "en";
    langs.push(inferred);
    languageNotes.push({
      code: "languages-defaulted",
      detail: `markets.languages 是空的，按 intake 正文的文字判断为「${LANG_LABEL[inferred]}」（intake/README.md：无 markets 时默认单市场、单语言）。要在另一种语言里提问，请在 intake 里写明。`,
    });
  }

  /* --- the restricted-phrase contradiction, checked before any drop --- */

  for (const slot of SLOT_NAMES) {
    for (const sv of slotValues(doc, slot)) {
      const hit = matches(sv.value, restricted);
      if (hit.length > 0) {
        console.error(
          [
            `intake 自相矛盾：${sv.field} 的值是`,
            `  ${JSON.stringify(sv.value)}`,
            `而 compliance.restrictions / goals.forbidden_topics 里有 ${JSON.stringify(hit[0])}。`,
            "",
            "用这个值生成的题会问到客户划为红线的话题，报告就不能发了。这里不静默丢掉它：",
            "对 industry.category_terms 来说，丢掉等于在客户不知情的情况下缩小了已确认的品类词集合，",
            "题库会悄悄不再问客户确认过的那个品类。",
            "",
            "请修 intake：要么把这个说法从 restrictions / forbidden_topics 里去掉，要么别在这个字段里用它。",
          ].join("\n")
        );
        process.exit(1);
      }
    }
  }

  /* --- never_mention may not collide with a value the bank is built from --- */

  /**
   * WHY THIS IS A HARD FAILURE AND NOT A SILENT DROP.
   *
   * The tempting implementation is to drop the offending value and note it: never_mention is a
   * prohibition, so removing "鼎沸里" from the competitor list satisfies rule 1 and the bank still
   * builds. It is the wrong behaviour for two reasons.
   *
   * First, it changes the client's input without their decision. If the name they do not want
   * mentioned is also one of their competitors, then either the comparison set loses a company or the
   * prohibition is not really absolute - and only the client can say which. A bank that quietly asks
   * about three competitors when the intake named four is a bank whose numbers describe a measurement
   * nobody agreed to.
   *
   * Second, the drop is unbounded. never_mention is a free-text list, and a phrase in it ("收款的公司",
   * "银行") can occur inside a category term, a situation or an audience description. Dropping those
   * would shrink the vocabulary the client confirmed, which is the one input this generator is not
   * allowed to edit.
   *
   * So the contradiction stops the build, names every field it found, and leaves the choice to the
   * person who filled the form. assertNoNeverMention() still runs over the produced bank afterwards,
   * because a value check cannot see a name assembled across the boundary between a value and our own
   * fixed wording ("跨{category}" + "的公司") - that is what the assertion is for.
   */
  const neverMentionCollisions: string[] = [];
  for (const slot of SLOT_NAMES) {
    for (const sv of slotValues(doc, slot)) {
      const hit = matches(sv.value, neverMention);
      if (hit.length > 0) {
        neverMentionCollisions.push(
          `  - ${sv.field} = ${JSON.stringify(sv.value)} 命中 never_mention ${JSON.stringify(hit[0])}`
        );
      }
    }
  }
  if (neverMentionCollisions.length > 0) {
    console.error(
      [
        "competitors.never_mention 与 intake 自己的字段值冲突：",
        ...neverMentionCollisions,
        "",
        "规则 1 是「never_mention 里的名字不得出现在任何一条问题里」，而上面这些值正是题库的用词。",
        "两条都得满足，只有填表的人能决定怎么办：",
        "  · 从 never_mention 里去掉这个名字（题库里就会出现它），或者",
        "  · 把带这个名字的字段值改掉 / 删掉（题库里就不会出现它）。",
        "生成器不替你选：静默丢掉一个竞品或一个品类词，会让批准页上的对比对象和品类词和客户以为的不一样。",
      ].join("\n")
    );
    process.exit(1);
  }

  /**
   * The remaining filters run in two stages, and the order matters for the report rather than for the
   * result:
   *
   *   1. language-independent (a competitor that is really the brand) - once, so the reason appears
   *      once. Running it inside the language loop printed the same sentence twice for a
   *      two-language intake.
   *   2. the language rule - ONLY for the languages the intake actually declares. Evaluating both
   *      languages unconditionally filled a Chinese-only bank's degradation list with 30 notes about
   *      an English question bank that was never going to exist, which is noise that hides the real
   *      degradations.
   */
  const usable = { zh: new Map<SlotName, SlotValue[]>(), en: new Map<SlotName, SlotValue[]>() };
  for (const slot of SLOT_NAMES) {
    const afterBlocking: SlotValue[] = [];
    const seenValues = new Set<string>();
    for (const sv of slotValues(doc, slot)) {
      if (slot === "competitor" && matches(sv.value, brandTokens).length > 0) {
        notes.push({
          code: "value-excluded-brand",
          detail: `${sv.field}「${sv.value}」被排除：它是品牌自己的名字，不是竞品。`,
        });
        continue;
      }
      if (seenValues.has(sv.value)) continue;
      seenValues.add(sv.value);
      afterBlocking.push(sv);
    }

    for (const lang of LANGS) {
      if (!langs.includes(lang)) {
        usable[lang].set(slot, []);
        continue;
      }
      const kept = afterBlocking.filter(
        (sv) =>
          (sv.lang === undefined || sv.lang === lang) &&
          (SLOT_SPECS[slot].properNoun || fitsLanguage(sv.value, lang))
      );
      for (const sv of afterBlocking.filter((x) => x.lang === undefined && !kept.includes(x))) {
        notes.push({
          code: "value-excluded-language",
          detail:
            `${sv.field}「${sv.value}」不用于${LANG_LABEL[lang]}题库：` +
            (lang === "en"
              ? "它含有中文字符，英文问题里夹中文就是两种语言混在一题里。"
              : "它是用拉丁字母写的词，中文问题里夹一个英文词就是两种语言混在一题里" +
                "（全大写的缩写例外，例如 AI、ERP）。要让它出现在中文题库里，请在同一个列表里给出中文写法。"),
        });
      }
      usable[lang].set(slot, kept);
    }
  }

  /** intake/README.md: sensitive=是 with an empty restrictions list is "do not start". */
  const sensitive = scalarAt(doc, "compliance.sensitive")[0]?.value ?? "";
  if (sensitive === "是" && restricted.length === 0) {
    notes.push({
      code: "restrictions-empty",
      detail:
        "compliance.sensitive=是 但 restrictions 与 forbidden_topics 都是空的 —— intake/README.md 的口径是" +
        "「这一栏空着而 sensitive=是，不建议开跑」。题库照样出，但批准页需要客户确认一遍红线。",
    });
  }

  return {
    client,
    filledBy: scalarAt(doc, "meta.filled_by")[0]?.value ?? "",
    filledOn: scalarAt(doc, "meta.filled_on")[0]?.value ?? "",
    approvedBy: scalarAt(doc, "meta.bank_approved_by")[0]?.value ?? "",
    neverMention,
    restricted,
    brandTokens,
    languages: langs,
    languageNotes,
    complianceSensitive: sensitive,
    usable,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Language detection and the one-language-per-question rule           */
/* ------------------------------------------------------------------ */

const LANG_LABEL: Record<Lang, string> = { zh: "中文", en: "English" };
const LANG_ALIASES: Record<string, Lang> = {
  中文: "zh",
  简体中文: "zh",
  汉语: "zh",
  普通话: "zh",
  zh: "zh",
  "zh-cn": "zh",
  chinese: "zh",
  英文: "en",
  英语: "en",
  en: "en",
  english: "en",
};

function languageCode(raw: string): Lang | undefined {
  const key = norm(raw)
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[\s_]+/g, "-")
    .trim();
  return LANG_ALIASES[key] ?? LANG_ALIASES[key.replace(/-/g, "")] ?? LANG_ALIASES[norm(raw)];
}

/** Ideographs only: CJK punctuation and full-width forms are not a language signal. */
const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const hasCJK = (s: string): boolean => CJK_RE.test(s);

/**
 * What Chinese text can legitimately contain without becoming two languages in one question: an
 * acronym. Uppercase letters and digits only - "AI", "ERP", "ISO9001", "4S".
 *
 * WHY NOT "any single Latin word". The first version allowed any token with no whitespace, which
 * admitted "Singapore" and "SaaS" into Chinese questions. A real intake caught it: with markets
 * declared as [新加坡, Singapore] for a two-language bank, a Chinese question came out as
 * "在Singapore一般找谁？" - a Chinese sentence with an unspaced English word in the middle, which is
 * exactly the mixing rule 5 forbids. "Singapore" is a word with an ordinary Chinese equivalent, so it
 * is not a quotation; "AI" is an acronym that Chinese writes as-is.
 */
const ACRONYM_RE = /^[A-Z0-9][A-Z0-9+.#/&_-]*$/;

function fitsLanguage(text: string, lang: Lang): boolean {
  // English: any CJK character makes the question two languages at once.
  if (lang === "en") return !hasCJK(text);
  // Chinese: CJK, or an acronym Chinese writes as-is.
  return hasCJK(text) || ACRONYM_RE.test(text);
}

/**
 * Trailing sentence punctuation is removed from an embedded value, and nothing else is touched.
 *
 * WHY: audience.most_asked holds whole questions ("能不能支持多币种结算？"). Embedded mid-sentence
 * that would print "……结算？，这类需求……". Removing the terminal mark is transport, like removing
 * Markdown emphasis in build-visibility.mts; rewording the value would not be.
 */
function stripTrailingPunctuation(text: string): string {
  return text.replace(/[？?。.！!，,；;：:、\s]+$/u, "").trim();
}

/* ------------------------------------------------------------------ */
/* Composing the bank                                                  */
/* ------------------------------------------------------------------ */

type Binding = { slot: SlotName; value: string; field: string };
type Entry = {
  language: Lang;
  id: string;
  archetype: ArchetypeId;
  text: string;
  skeleton: string;
  bindings: Binding[];
  /** The answer key, when the intake has one: what the model's answer will be checked against. */
  expected: Binding[];
};

type Composition = {
  entries: Entry[];
  notes: Note[];
  skippedSkeletons: { skeleton: string; language: Lang; reason: string }[];
};

function bindingsFor(sk: Skeleton, lang: Lang, usable: Map<SlotName, SlotValue[]>, rotation: number): Binding[] | null {
  const out: Binding[] = [];
  for (const slot of sk.needs) {
    const values = usable.get(slot) ?? [];
    if (values.length === 0) return null;
    const pick = values[rotation % values.length];
    out.push({ slot, value: pick.value, field: pick.field });
  }
  return out;
}

function compose(sk: Skeleton, lang: Lang, bindings: Binding[]): string {
  let text = sk.text[lang];
  for (const b of bindings) {
    text = text.split(`{${b.slot}}`).join(stripTrailingPunctuation(b.value));
  }
  return text;
}

function buildBank(facts: IntakeFacts): Composition {
  const entries: Entry[] = [];
  const notes: Note[] = [];
  const skipped: { skeleton: string; language: Lang; reason: string }[] = [];
  /**
   * Dedup has to run against everything accepted so far, not against the final list: the entries array
   * is only assembled at the end, so checking it during composition would compare each candidate with
   * an empty list and let two skeletons emit the same sentence (two identical prompts in one bank are
   * the same measurement counted twice).
   */
  const seenText = new Map<string, string>();
  const perLanguage: Record<Lang, Record<ArchetypeId, Entry[]>> = {
    zh: { category: [], scenario: [], comparison: [], fact: [] },
    en: { category: [], scenario: [], comparison: [], fact: [] },
  };

  for (const lang of facts.languages) {
    const usable = facts.usable[lang];
    for (const arch of ARCHETYPES) {
      const skeletons = SKELETONS.filter((s) => s.archetype === arch.id);
      const candidatesBySkeleton: Entry[][] = [];

      skeletons.forEach((sk, skIndex) => {
        /**
         * A restricted phrase inside OUR fixed wording is a different case from one inside a client
         * value (that one is a hard failure, above): the skeleton is skipped and the skip is
         * reported. Skipping is right here - "how much does X cost?" is a question we can simply not
         * ask - whereas dropping a client's category term would change their input.
         */
        const restrictedInWording = matches(sk.text[lang], facts.restricted);
        if (restrictedInWording.length > 0) {
          skipped.push({
            skeleton: sk.id,
            language: lang,
            reason: `骨架措辞命中禁问话题「${restrictedInWording[0]}」`,
          });
          return;
        }
        /**
         * never_mention is NOT handled here. It has exactly one mechanism: the post-hoc assertion
         * below. An earlier version skipped the skeleton here AND dropped candidates later, which made
         * the assertion unreachable - the rule looked asserted while nothing could trip it, and the
         * bank silently lost questions. One rule, one mechanism.
         */

        const varyValues = usable.get(sk.vary) ?? [];
        if (varyValues.length === 0) {
          const empty = sk.needs.filter((n) => (usable.get(n) ?? []).length === 0);
          skipped.push({
            skeleton: sk.id,
            language: lang,
            reason: `槽位为空：${empty.map((n) => `${n}（${SLOT_SPECS[n].paths.join(" / ")}）`).join("、")}`,
          });
          return;
        }

        const list: Entry[] = [];
        for (let instance = 0; instance < varyValues.length; instance += 1) {
          /**
           * The rotation spreads the client's values across skeletons instead of spending all of
           * category_terms[0] on the first ten questions: with N values and M skeletons, skeleton i
           * instance j takes value (i + j) % N, so the first pass touches N different terms.
           */
          const bindings = bindingsFor(sk, lang, usable, skIndex + instance);
          if (!bindings) return;
          const text = compose(sk, lang, bindings);

          const restrictedHit = matches(text, facts.restricted);
          if (restrictedHit.length > 0) {
            notes.push({
              code: "candidate-excluded-restricted",
              detail: `${sk.id}/${lang} 的这一组合被排除：成句后命中禁问话题「${restrictedHit[0]}」。`,
            });
            continue;
          }
          /**
           * never_mention is NOT filtered per candidate here. See assertNoNeverMention(): rule 1 is
           * checked once over the finished bank, so that "no question contains it" is a property of
           * what is written rather than of a filter that might stop covering a path.
           */
          if ((sk.archetype === "category" || sk.archetype === "scenario") && matches(text, facts.brandTokens).length > 0) {
            notes.push({
              code: "candidate-excluded-brand-in-nobrand-question",
              detail:
                `${sk.id}/${lang} 的这一组合被排除：${arch.label[lang]}问题里出现了品牌名` +
                `（命中「${matches(text, facts.brandTokens)[0]}」，来自 intake 自己的文字）。`,
            });
            continue;
          }
          const duplicateKey = `${lang}\u0000${norm(text)}`;
          const duplicateOf = seenText.get(duplicateKey);
          if (duplicateOf) {
            notes.push({
              code: "candidate-excluded-duplicate",
              detail: `${sk.id}/${lang} 与 ${duplicateOf} 的成句完全相同，只保留一条。`,
            });
            continue;
          }
          seenText.set(duplicateKey, `${sk.id}/${lang}`);

          /**
           * The answer key. A missing one does NOT remove the question: "{brand}是哪一年成立的？" still
           * measures whether repeated runs agree with each other, which is worth knowing even when the
           * intake has no year to check against. What it must not do is pretend to have a key, so the
           * absence is recorded here and printed in the YAML as expected: null.
           */
          const expected: Binding[] = [];
          for (const slot of sk.verifies ?? []) {
            const values = usable.get(slot) ?? [];
            if (values.length === 0) {
              notes.push({
                code: "answer-key-missing",
                detail:
                  `${sk.id}/${lang}（${LANG_LABEL[lang]}）没有答案键：intake 字段 ` +
                  `${SLOT_SPECS[slot].paths.join(" / ")} 为空，这道题只能看多次回答彼此是否一致，` +
                  "不能核准确度。",
              });
              continue;
            }
            expected.push({ slot, value: values[0].value, field: values[0].field });
          }

          list.push({
            language: lang,
            id: "",
            archetype: sk.archetype,
            text,
            skeleton: sk.id,
            bindings,
            expected,
          });
        }
        if (list.length > 0) candidatesBySkeleton.push(list);
      });

      /**
       * Round robin over skeletons, then over instances: every skeleton gets its first question in
       * before any skeleton gets its second. That is what spreads the client's vocabulary across the
       * group instead of spending the whole group on one skeleton's variations.
       */
      const chosen: Entry[] = [];
      for (let instance = 0; chosen.length < TARGET[arch.id]; instance += 1) {
        let placed = false;
        for (const list of candidatesBySkeleton) {
          if (chosen.length >= TARGET[arch.id]) break;
          const candidate = list[instance];
          if (!candidate) continue;
          chosen.push(candidate);
          placed = true;
        }
        if (!placed) break;
      }

      const prefix: Record<ArchetypeId, string> = { category: "C", scenario: "S", comparison: "X", fact: "F" };
      chosen.forEach((entry, i) => {
        entry.id = `${prefix[arch.id]}${i + 1}`;
      });
      perLanguage[lang][arch.id] = chosen;
    }
  }

  for (const lang of facts.languages) {
    for (const arch of ARCHETYPES) entries.push(...perLanguage[lang][arch.id]);
  }

  return { entries, notes, skippedSkeletons: skipped };
}

/* ------------------------------------------------------------------ */
/* The assertions                                                      */
/* ------------------------------------------------------------------ */

type Assertion = { name: string; why: string; run: () => void };

/** The phrases that would make a bank fit any industry, which is the failure this script exists for. */
const GENERIC_PHRASES = [
  "你的行业",
  "贵行业",
  "该行业",
  "相关行业",
  "本行业",
  "your industry",
  "your sector",
  "the industry",
  "相关领域",
  "your business area",
];

/**
 * Slot values must come from the intake fields the intake template actually declares as inputs.
 * industry.term_candidates is a process record (LLM proposals, before the client ticked them);
 * industry.sector is a routing hint, not a taxonomy; the restricted/forbidden lists are prohibitions,
 * not question material. Reading any of them would turn a declaration into a source of truth.
 */
const FORBIDDEN_SOURCES = [
  "industry.term_candidates",
  "industry.sector",
  "compliance.restrictions",
  "compliance.claim_rules",
  "goals.forbidden_topics",
];

function assertions(facts: IntakeFacts, bank: Composition, archetypeSummary: ArchetypeSummary[]): Assertion[] {
  const restricted = facts.restricted;
  const neverMention = facts.neverMention;

  return [
    {
      name: "assertSkeletonsAreWellFormed",
      why: "每个骨架至少要有一个槽位，槽位名必须存在于槽位表且写在 needs 里，两种语言都要有。",
      run: () => {
        const seen = new Set<string>();
        for (const sk of SKELETONS) {
          if (seen.has(sk.id)) throw new Error(`骨架 id 重复：${sk.id}`);
          seen.add(sk.id);
          if (!sk.needs.includes(sk.vary)) {
            throw new Error(`骨架 ${sk.id} 的 vary=${sk.vary} 不在 needs 里。`);
          }
          for (const lang of LANGS) {
            const text = sk.text[lang];
            const found = [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
            if (found.length === 0) {
              throw new Error(
                `骨架 ${sk.id}（${lang}）没有任何槽位。只用我们的措辞构成的问题不是客户特定的问题，` +
                  "它会同时适用于所有行业——这正是这份题库要避免的失败。"
              );
            }
            for (const name of found) {
              if (!(SLOT_NAMES as readonly string[]).includes(name)) {
                throw new Error(`骨架 ${sk.id}（${lang}）用了未定义的槽位 {${name}}。`);
              }
              if (!sk.needs.includes(name as SlotName)) {
                throw new Error(`骨架 ${sk.id}（${lang}）用了 {${name}} 但没写在 needs 里，槽位会留空。`);
              }
            }
            for (const need of sk.needs) {
              if (!text.includes(`{${need}}`)) {
                throw new Error(`骨架 ${sk.id}（${lang}）声明了 ${need} 却没用到，声明和模板对不上。`);
              }
            }
            for (const key of sk.verifies ?? []) {
              if (!(SLOT_NAMES as readonly string[]).includes(key)) {
                throw new Error(`骨架 ${sk.id} 的 verifies 里有未定义的槽位 ${key}。`);
              }
              if (sk.needs.includes(key)) {
                throw new Error(`骨架 ${sk.id} 的 ${key} 同时在 needs 和 verifies 里：答案键不能出现在题面里。`);
              }
              if (text.includes(`{${key}}`)) {
                throw new Error(
                  `骨架 ${sk.id}（${lang}）把答案键 {${key}} 写进了题面：等于把答案交给模型，` +
                    "事实题就核不出东西了。"
                );
              }
            }
            for (const phrase of GENERIC_PHRASES) {
              if (norm(text).includes(norm(phrase))) {
                throw new Error(`骨架 ${sk.id}（${lang}）含有泛化措辞「${phrase}」，它不属于任何客户。`);
              }
            }
          }
        }
      },
    },
    {
      name: "assertSourcesAreAllowed",
      why: "每个槽位只从 intake 声明的输入字段取值，不读过程记录（term_candidates）、路由提示（sector）或禁令列表。",
      run: () => {
        for (const slot of SLOT_NAMES) {
          for (const path of SLOT_SPECS[slot].paths) {
            for (const forbidden of FORBIDDEN_SOURCES) {
              if (path === forbidden || path.startsWith(`${forbidden}.`) || path.startsWith(`${forbidden}[`)) {
                throw new Error(
                  `槽位 ${slot} 从 ${path} 取值，而 ${forbidden} 不是题库的输入：` +
                    (forbidden === "industry.term_candidates"
                      ? "它是术语采集的过程记录，只有客户勾选后抄进 category_terms 的词才算数。"
                      : "它是禁令或路由提示，不是提问素材。")
                );
              }
            }
          }
        }
      },
    },
    {
      name: "assertBankNotEmpty",
      why: "一份零题的题库不是题库：多半是 intake 没填，或者语言对不上。",
      run: () => {
        if (bank.entries.length === 0) {
          throw new Error(
            "没有生成任何问题。检查 intake 是否填了 industry.category_terms / audience.*，" +
              "以及 markets.languages 与这些文字是不是同一种语言。"
          );
        }
      },
    },
    {
      name: "assertNoUnfilledSlot",
      why: "任何一条成句里都不许残留 {槽位}；残留说明某个 intake 值本身就是模板占位符。",
      run: () => {
        const leftovers: string[] = [];
        for (const e of bank.entries) {
          const found = [...e.text.matchAll(/\{[^}]{0,40}\}/g)].map((m) => m[0]);
          if (found.length > 0) {
            const braces = e.bindings.filter((b) => /[{}]/.test(b.value));
            leftovers.push(
              `${e.language}/${e.id}（骨架 ${e.skeleton}）里残留 ${found.join("、")}` +
                (braces.length > 0
                  ? `；来自 ${braces.map((b) => `${b.field}=${JSON.stringify(b.value)}`).join("、")}`
                  : "；没有找到带花括号的槽位值，说明是骨架模板本身有问题")
            );
          }
        }
        if (leftovers.length > 0) {
          throw new Error(
            [
              "生成的题库里有未填的槽位：",
              ...leftovers.map((l) => `  - ${l}`),
              "",
              "intake 模板教人写 {品类词} 这类占位符，所以一个残留的花括号和「我们没填上」在成句里长得一样。",
              "把该字段里的花括号去掉再生成，不要手工改题库。",
            ].join("\n")
          );
        }
      },
    },
    {
      name: "assertProvenanceResolves",
      why: "每一条成句的每个槽位值都要能按记录的字段路径重新读回同一个值：路径写错就会在这里断掉。",
      run: () => {
        // Re-parsed from the file text, so the check does not depend on the in-memory document.
        const fresh = parse(intakeText) as unknown;
        const resolved = new Set<string>();
        for (const slot of SLOT_NAMES) {
          for (const sv of slotValues(fresh, slot)) resolved.add(`${slot}\u0000${sv.field}\u0000${sv.value}`);
        }
        for (const e of bank.entries) {
          if (e.bindings.length === 0) {
            throw new Error(`${e.language}/${e.id} 没有任何槽位值，它不是客户特定的问题。`);
          }
          for (const b of [...e.bindings, ...e.expected]) {
            if (!resolved.has(`${b.slot}\u0000${b.field}\u0000${b.value}`)) {
              throw new Error(
                `${e.language}/${e.id} 记录 ${b.slot} 来自 ${b.field}=${JSON.stringify(b.value)}，` +
                  "但按这个路径重新读 intake 读不到同一个值。出处记录错了，题库就无法被追溯。"
              );
            }
            for (const forbidden of FORBIDDEN_SOURCES) {
              if (b.field === forbidden || b.field.startsWith(`${forbidden}.`) || b.field.startsWith(`${forbidden}[`)) {
                throw new Error(`${e.language}/${e.id} 从 ${b.field} 取值，而它不该出现在问题里。`);
              }
            }
          }
        }
      },
    },
    {
      name: "assertNoGenericPhrase",
      why: "成句里不许出现「你的行业」这类可以套在任何客户身上的措辞。",
      run: () => {
        for (const e of bank.entries) {
          for (const phrase of GENERIC_PHRASES) {
            if (norm(e.text).includes(norm(phrase))) {
              throw new Error(`${e.language}/${e.id} 含有泛化措辞「${phrase}」：${e.text}`);
            }
          }
        }
      },
    },
    {
      name: "assertNoNeverMention",
      why: "competitors.never_mention 里的名字不得出现在任何一条问题里。",
      run: () => {
        if (neverMention.length === 0) return;
        const hits = bank.entries
          .map((e) => ({ e, hit: matches(e.text, neverMention) }))
          .filter((x) => x.hit.length > 0);
        if (hits.length > 0) {
          throw new Error(
            [
              `never_mention（${neverMention.join("、")}）出现在生成的问题里：`,
              ...hits.map((h) => {
                /**
                 * WHERE THE HIT CAME FROM, because the two cases are fixed by different people. If the
                 * skeleton text alone contains it, the phrase is in our fixed wording and the entry is
                 * probably not a name. Otherwise it was assembled from the client's own field values,
                 * and the values are listed so the intake can be corrected without guessing.
                 */
                const sk = SKELETONS.find((s) => s.id === h.e.skeleton)!;
                const fromWording = matches(sk.text[h.e.language], neverMention).length > 0;
                return (
                  `  - ${h.e.language}/${h.e.id}：${JSON.stringify(h.hit[0])} → ${h.e.text}` +
                  (fromWording
                    ? `\n      来自问法骨架的固定措辞（骨架 ${sk.id}），不是字段值。never_mention 应该填名字，` +
                      "不填短语；如果客户真的要避开这个说法，就换一个骨架或改这一项的定位。"
                    : `\n      由字段值拼出来的：${h.e.bindings
                        .map((b) => `${b.field}=${JSON.stringify(b.value)}`)
                        .join("、")}。改这些字段值，或把这一项从 never_mention 里去掉。`)
                );
              }),
              "",
              "这个问题不能交给客户：报告一旦提到这个名字，客户就不会批准它。",
            ].join("\n")
          );
        }
      },
    },
    {
      name: "assertNoRestrictedTopic",
      why: "compliance.restrictions 与 goals.forbidden_topics 里的说法不得出现在任何一条问题里。",
      run: () => {
        if (restricted.length === 0) return;
        const hits = bank.entries
          .map((e) => ({ e, hit: matches(e.text, restricted) }))
          .filter((x) => x.hit.length > 0);
        if (hits.length > 0) {
          throw new Error(
            [
              `禁问话题（${restricted.join("、")}）出现在生成的问题里：`,
              ...hits.map((h) => `  - ${h.e.language}/${h.e.id}：${JSON.stringify(h.hit[0])} → ${h.e.text}`),
              "",
              "问到了红线，报告就不能发了。修 intake 或修骨架，不要手工删题。",
            ].join("\n")
          );
        }
      },
    },
    {
      name: "assertNoBrandInNoBrandQuestions",
      why: "品类发现与场景需求两组的问题里不许出现品牌名：出现就没有测量触达。",
      run: () => {
        for (const e of bank.entries) {
          if (e.archetype !== "category" && e.archetype !== "scenario") continue;
          const hit = matches(e.text, facts.brandTokens);
          if (hit.length > 0) {
            throw new Error(
              `${e.language}/${e.id} 是${e.archetype}题却出现了品牌名「${hit[0]}」：${e.text}。` +
                "这两组测的是「不知道这家公司的人能不能找到它」，题目里带名字就测不到了。"
            );
          }
        }
      },
    },
    {
      name: "assertBrandIsNamedWhereItMustBe",
      why: "对比选型与事实核验两组必须点名品牌——这是这两组的定义。",
      run: () => {
        for (const e of bank.entries) {
          if (e.archetype !== "comparison" && e.archetype !== "fact") continue;
          if (matches(e.text, facts.brandTokens).length === 0) {
            throw new Error(
              `${e.language}/${e.id} 是${e.archetype}题却没有出现品牌名：${e.text}。` +
                "对比题要有品牌才能比，事实题要有品牌才能核。"
            );
          }
        }
      },
    },
    {
      name: "assertLanguagePurity",
      why: "一条问题只用一种语言：散文槽位必须与题目语言一致，专有名词可以保持原样。",
      run: () => {
        for (const e of bank.entries) {
          for (const b of e.bindings) {
            if (SLOT_SPECS[b.slot].properNoun) continue;
            if (!fitsLanguage(b.value, e.language)) {
              throw new Error(
                `${e.language}/${e.id} 的槽位 ${b.slot}（${b.field}）是「${b.value}」，与题目语言不一致：` +
                  `${e.text}。一条问题里混两种语言，回答就没法归因到是哪一种问法。`
              );
            }
          }
        }
      },
    },
    {
      name: "assertUniqueQuestions",
      why: "同一条问题在一个语言组里只出现一次：重复题会把同一句话算两遍。",
      run: () => {
        const seen = new Map<string, string>();
        for (const e of bank.entries) {
          const key = `${e.language}\u0000${norm(e.text)}`;
          const prev = seen.get(key);
          if (prev) throw new Error(`${e.language}/${e.id} 与 ${prev} 是同一句话：${e.text}`);
          seen.set(key, `${e.language}/${e.id}`);
        }
      },
    },
    {
      name: "assertIdsAreUnique",
      why: "(语言, 题号) 是测量运行时引用一道题的键，重复就会串题。",
      run: () => {
        const seen = new Set<string>();
        for (const e of bank.entries) {
          const key = `${e.language}\u0000${e.id}`;
          if (seen.has(key)) throw new Error(`题号重复：${e.language}/${e.id}`);
          seen.add(key);
        }
      },
    },
    {
      name: "assertQuestionCountWindow",
      why:
        `每个语言组的题数在 ${MIN_QUESTIONS}–${MAX_QUESTIONS} 之间。窗口按语言算而不是按文件算：` +
        "测量是一次语言跑一次，两种语言各 29 题的文件里，每一组都是 29 题。降级（某一组偏薄）时可以少，但要写清楚为什么。",
      run: () => {
        for (const lang of facts.languages) {
          const total = bank.entries.filter((e) => e.language === lang).length;
          if (total > MAX_QUESTIONS) {
            throw new Error(
              `${LANG_LABEL[lang]}题库生成了 ${total} 题，超过上限 ${MAX_QUESTIONS}：` +
                "题太多会让每题 3 次的成本失控。"
            );
          }
          const thin = archetypeSummary.filter(
            (a) => a.byLanguage.find((g) => g.lang === lang)!.status !== "ok"
          );
          if (thin.length === 0 && total < MIN_QUESTIONS) {
            throw new Error(
              `${LANG_LABEL[lang]}题库生成了 ${total} 题，低于下限 ${MIN_QUESTIONS}，` +
                "而四组都不算薄——这说明骨架池或目标分布被改坏了。"
            );
          }
        }
      },
    },
    {
      name: "assertEveryQuestionIsClientSpecific",
      why: "每条问题至少要用到一个客户自己填的槽位值：否则它可以套在任何行业上。",
      run: () => {
        for (const e of bank.entries) {
          if (e.bindings.length === 0 || e.bindings.every((b) => b.value.trim().length === 0)) {
            throw new Error(`${e.language}/${e.id} 没有用到任何 intake 的值：${e.text}`);
          }
        }
      },
    },
    {
      name: "assertEveryGroupExplained",
      why: "四组各自生成了多少、为什么薄，必须写在文件里——降级不能是静默的。",
      run: () => {
        for (const a of archetypeSummary) {
          if (a.status !== "ok" && a.reasons.length === 0) {
            throw new Error(`第 ${a.id} 组状态是 ${a.status} 却没有写原因，降级必须是可见的。`);
          }
        }
        const total = archetypeSummary.reduce((s, a) => s + a.generated, 0);
        if (total !== bank.entries.length) {
          throw new Error(
            `分组题数合计 ${total} 与题库总数 ${bank.entries.length} 不一致：批准页的分布表会说谎。`
          );
        }
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Summary, fingerprint, provenance                                    */
/* ------------------------------------------------------------------ */

type GroupStatus = "ok" | "thin" | "absent";

type ArchetypeSummary = {
  id: ArchetypeId;
  label: Record<Lang, string>;
  target: number;
  generated: number;
  /** The worst status across languages: a group that is full in Chinese and empty in English is NOT ok. */
  status: GroupStatus;
  reasons: string[];
  usedFields: string[];
  /** Per language, so the approval page can say which language is thin rather than only which group. */
  byLanguage: { lang: Lang; generated: number; status: GroupStatus; reasons: string[] }[];
};

function statusOf(generated: number, target: number): GroupStatus {
  return generated >= target ? "ok" : generated > 0 ? "thin" : "absent";
}

const WORST: Record<GroupStatus, number> = { ok: 0, thin: 1, absent: 2 };

function summarise(facts: IntakeFacts, bank: Composition): ArchetypeSummary[] {
  return ARCHETYPES.map((arch) => {
    const inGroup = bank.entries.filter((e) => e.archetype === arch.id);
    const generated = inGroup.length;

    const byLanguage = facts.languages.map((lang) => {
      const count = inGroup.filter((e) => e.language === lang).length;
      const status = statusOf(count, TARGET[arch.id]);
      const reasons: string[] = [];
      if (status !== "ok") {
        /**
         * WHY THE REASON IS DERIVED FROM THE EMPTY SLOTS AND THE SKIP LOG rather than written by hand:
         * the degradation note has to name the intake field that was empty. A hand-written sentence
         * would keep saying "competitors.names is empty" after the skeleton pool changed, and the
         * reader would have no way to notice.
         */
        const missing = new Map<SlotName, string[]>();
        for (const sk of SKELETONS.filter((s) => s.archetype === arch.id)) {
          const skipped = bank.skippedSkeletons.find((s) => s.skeleton === sk.id && s.language === lang);
          if (!skipped) continue;
          for (const need of sk.needs) {
            if ((facts.usable[lang].get(need) ?? []).length === 0) {
              missing.set(need, [...(missing.get(need) ?? []), sk.id]);
            }
          }
        }
        const mentioned = new Set<string>();
        for (const [slot, ids] of missing) {
          reasons.push(
            `槽位 ${slot} 为空（intake 字段 ${SLOT_SPECS[slot].paths.join(" / ")}：${SLOT_SPECS[slot].from}）` +
              `→ 跳过骨架 ${ids.join("、")}`
          );
          ids.forEach((id) => mentioned.add(id));
        }
        for (const s of bank.skippedSkeletons) {
          if (s.language !== lang || mentioned.has(s.skeleton)) continue;
          if (!skeletonInGroup(s.skeleton, arch.id)) continue;
          reasons.push(`骨架 ${s.skeleton} 被跳过：${s.reason}`);
        }
        if (reasons.length === 0) {
          reasons.push(
            `有效候选不足 ${TARGET[arch.id]} 条（生成 ${count} 条）：这一组可用的字段值不够，` +
              "或部分取值被 never_mention / 语言规则排除。"
          );
        }
      }
      return { lang, generated: count, status, reasons };
    });

    const status = byLanguage.reduce<GroupStatus>(
      (worst, g) => (WORST[g.status] > WORST[worst] ? g.status : worst),
      "ok"
    );
    const reasons = byLanguage
      .filter((g) => g.status !== "ok")
      .map((g) => `${LANG_LABEL[g.lang]}：生成 ${g.generated} / 目标 ${TARGET[arch.id]}。${g.reasons.join("；")}`);

    const usedFields = [
      ...new Set(inGroup.flatMap((e) => e.bindings.map((b) => b.field.replace(/\[\d+\]$/, "")))),
    ].sort();
    return {
      id: arch.id,
      label: arch.label,
      target: TARGET[arch.id],
      generated,
      status,
      reasons,
      usedFields,
      byLanguage,
    };
  });
}

function skeletonInGroup(skeletonId: string, archetype: ArchetypeId): boolean {
  return SKELETONS.some((s) => s.id === skeletonId && s.archetype === archetype);
}

/** sha256 of the question list only - the bank's identity without the self-reference of a whole file. */
function fingerprintOf(entries: Entry[]): string {
  const canonical = entries.map((e) => ({
    language: e.language,
    id: e.id,
    archetype: e.archetype,
    text: e.text,
  }));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/** Best-effort git identification of the generator, plus its source hash, which always works. */
function gitInfo(): { commit: string | null; dirty: boolean | null; note: string } {
  try {
    const rev = spawnSync("git", ["-C", REPO, "rev-parse", "HEAD"], { encoding: "utf8" });
    const status = spawnSync("git", ["-C", REPO, "status", "--porcelain", "--", SCRIPT_REL], {
      encoding: "utf8",
    });
    if (rev.status !== 0 || typeof rev.stdout !== "string") {
      return {
        commit: null,
        dirty: null,
        note: `git rev-parse 失败（${rev.error ? String(rev.error) : `exit ${rev.status}`}）；见 generator.script_sha256。`,
      };
    }
    const dirty = typeof status.stdout === "string" ? status.stdout.trim().length > 0 : null;
    return {
      commit: rev.stdout.trim(),
      dirty,
      note: dirty
        ? "生成器脚本本身在工作区里被改过（未提交），所以 git commit 并不能唯一标识它；以 script_sha256 为准。"
        : "git commit 与 script_sha256 同时记录；脚本未改动时两者指向同一份代码。",
    };
  } catch (err) {
    return {
      commit: null,
      dirty: null,
      note: `git 不可用（${(err as Error).message}）；见 generator.script_sha256。`,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Output: the machine-readable bank                                   */
/* ------------------------------------------------------------------ */

function asciiSlug(text: string): string {
  return text
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

const facts = readIntakeFacts(intake);
const bank = buildBank(facts);
const archetypeSummary = summarise(facts, bank);
const fingerprint = fingerprintOf(bank.entries);

/* Every assertion runs before a single byte is written. */
const failed: string[] = [];
const list = assertions(facts, bank, archetypeSummary);
for (const a of list) {
  try {
    a.run();
  } catch (err) {
    failed.push(`${a.name}: ${(err as Error).message}`);
  }
}
if (failed.length > 0) {
  console.error(
    [
      `题库构建失败：${failed.length} 项断言没通过，没有写任何文件。`,
      "",
      ...failed.map((f) => `✗ ${f}`),
      "",
      "每一次失败都对应一条硬规则；修 intake 或修骨架，不要手工改生成的题库。",
    ].join("\n")
  );
  process.exit(1);
}

const slug = asciiSlug(facts.client) || asciiSlug(intakePath.split(/[\\/]/).pop() ?? "");
if (!slug) {
  console.error(
    [
      `无法从 meta.client「${facts.client}」或文件名生成输出文件名：两者都没有 ASCII 字符。`,
      "目录名全中文时在命令行里没法引用，所以需要至少一个能转成 slug 的字符。",
    ].join("\n")
  );
  process.exit(2);
}

const baseName = `${slug}-${date}`;
const git = gitInfo();
const scriptSha256 = createHash("sha256").update(readFileSync(SCRIPT_PATH)).digest("hex");

const notes: Note[] = [...facts.languageNotes, ...facts.notes, ...bank.notes];

const yamlDoc = {
  bank: {
    kind: "geo-question-bank",
    version: GENERATOR_VERSION,
    generated_at: generatedAt,
    generated_on: date,
    /**
     * The bank's identity: sha256 over (language, id, archetype, text) of every question. Two banks
     * with the same fingerprint ask exactly the same questions; two with different fingerprints are
     * not comparable, whatever their file names say.
     */
    fingerprint,
    fingerprint_rule: "sha256 of [{language,id,archetype,text}] in bank order",
    source_intake: {
      path: intakePath,
      sha256: intakeSha256,
      client: facts.client,
      filled_by: facts.filledBy,
      filled_on: facts.filledOn,
    },
    generator: {
      script: SCRIPT_REL,
      version: GENERATOR_VERSION,
      script_sha256: scriptSha256,
      git_commit: git.commit,
      git_dirty: git.dirty,
      note: git.note,
    },
    approval: {
      /**
       * BLANK ON PURPOSE. The bank is frozen when a human signs the .md; the value is written back
       * into this field by hand (or by the measurement run once it reads the signed page). A
       * generator that pre-filled it would make the bank look approved when nobody read it.
       */
      approved_by: "",
      approved_on: "",
      frozen_note:
        "题库一经批准即冻结：批准后不得增删、改写或重排任何一题；复测必须使用同一份题库，否则两次测量的数字不可比。",
      /*
       * THE SAME SENTENCE IN ENGLISH, BECAUSE THE ENGLISH BANK NEEDS IT TOO. An English bank used to
       * carry only the Chinese note, and the English report - correctly refusing to print Chinese -
       * omitted the sentence altogether rather than mangle it: a missing sentence, not a wrong one.
       * Written as a second field rather than a per-language choice because the bank is frozen once
       * approved, and an already-frozen bank must not be regenerated to gain a translation.
       */
      frozen_note_en:
        "A bank is frozen once approved: no question may be added, removed, rewritten or reordered afterwards, and a retest must use the same bank - otherwise the two measurements cannot be compared.",
      expected_approver_from_intake: facts.approvedBy,
    },
    compliance_sensitive: facts.complianceSensitive,
    totals: {
      questions: bank.entries.length,
      by_language: Object.fromEntries(facts.languages.map((l) => [l, bank.entries.filter((e) => e.language === l).length])),
      by_archetype: Object.fromEntries(ARCHETYPES.map((a) => [a.id, bank.entries.filter((e) => e.archetype === a.id).length])),
    },
    archetypes: archetypeSummary.map((a) => ({
      id: a.id,
      label: a.label.zh,
      label_en: a.label.en,
      measures: ARCHETYPES.find((x) => x.id === a.id)!.measures,
      target: a.target,
      generated: a.generated,
      status: a.status,
      reasons: a.reasons,
      used_fields: a.usedFields,
      by_language: Object.fromEntries(
        a.byLanguage.map((g) => [
          g.lang,
          { generated: g.generated, status: g.status, reasons: g.reasons },
        ])
      ),
    })),
    degradations: notes.map((n) => ({ code: n.code, detail: n.detail })),
    skipped_skeletons: bank.skippedSkeletons.map((s) => ({ skeleton: s.skeleton, language: s.language, reason: s.reason })),
  },
  languages: facts.languages.map((lang) => ({
    code: lang,
    label: LANG_LABEL[lang],
    questions: bank.entries
      .filter((e) => e.language === lang)
      .map((e) => ({
        id: e.id,
        archetype: e.archetype,
        text: e.text,
        skeleton: e.skeleton,
        slots: Object.fromEntries(e.bindings.map((b) => [b.slot, { value: b.value, field: b.field }])),
        /**
         * The answer key for a fact question, or null. A measurement run can check the model's answer
         * against this; null means there was nothing in the intake to check against, and the run must
         * say "no key" rather than compute an accuracy figure against nothing.
         */
        expected:
          e.expected.length > 0
            ? Object.fromEntries(e.expected.map((b) => [b.slot, { value: b.value, field: b.field }]))
            : null,
      })),
    archetypes: archetypeSummary.map((a) => {
      const g = a.byLanguage.find((x) => x.lang === lang)!;
      return {
        id: a.id,
        label: a.label[lang],
        measures: ARCHETYPES.find((x) => x.id === a.id)!.measures[lang],
        target: a.target,
        generated: g.generated,
        status: g.status,
        reasons: g.reasons,
      };
    }),
  })),
};

/* ------------------------------------------------------------------ */
/* Output: the page the client reads, ticks and signs                  */
/* ------------------------------------------------------------------ */

type DocCopy = {
  title: (client: string) => string;
  intro: string;
  frozen: string;
  provenanceTitle: string;
  thItem: string;
  thValue: string;
  kGeneratedFrom: string;
  kIntakeHash: string;
  kFingerprint: string;
  kFilledBy: string;
  kGeneratedOn: string;
  kGenerator: string;
  kGit: string;
  kLanguages: string;
  kQuestions: string;
  groupQuestions: (n: number) => string;
  measureLabel: string;
  fieldsLabel: string;
  thinTitle: string;
  thinNone: string;
  kEmptySlots: string;
  thinStatus: Record<"ok" | "thin" | "absent", string>;
  notesTitle: string;
  approvalTitle: string;
  approvalLead: string;
  approvalAll: (n: number) => string;
  approvalNoTopics: string;
  approvalSigner: string;
  approvalDate: string;
  approvalExpected: (name: string) => string;
  tickMeans: string;
};

const DOC: Record<Lang, DocCopy> = {
  zh: {
    title: (client) => `${client} · AI 可见度测量题库`,
    intro:
      "这是本次测量要问模型的全部问题。请你逐题看一遍：这些问题问的是不是你希望被问到的方向。" +
      "报告里的每一个数字都从这些问题来，所以这里改一道题，报告的含义就变一次。",
    frozen:
      "**题库一经批准即冻结。** 批准之后不得增删、改写或重排任何一题；复测必须使用同一份题库，否则两次测量的数字不可比。",
    provenanceTitle: "这份题库从哪里来",
    thItem: "项目",
    thValue: "内容",
    kGeneratedFrom: "来源 intake",
    kIntakeHash: "intake 内容哈希（sha256）",
    kFingerprint: "题库指纹（sha256，题面清单）",
    kFilledBy: "填表人 / 填表日期",
    kGeneratedOn: "生成日期",
    kGenerator: "生成器",
    kGit: "生成器版本标识",
    kLanguages: "语言",
    kQuestions: "题数",
    groupQuestions: (n) => `${n} 题`,
    measureLabel: "这一组在测什么：",
    fieldsLabel: "本组用到的 intake 字段：",
    thinTitle: "题库薄在哪里（降级说明）",
    thinNone: "四组都达到了目标题数，没有降级。",
    kEmptySlots: "intake 里为空的槽位（没填，或填了但没有任何取值能用于本次题库的语言）：",
    thinStatus: { ok: "达标", thin: "偏薄", absent: "没有出题" },
    notesTitle: "取值与排除记录",
    approvalTitle: "批准",
    approvalLead:
      "在每一题前的方框里打勾表示同意该题进入测量。不同意任何一题，请在该题后面写明原因；" +
      "改完重新生成题库会得到一个新的指纹，旧指纹作废。",
    approvalAll: (n) => `我已逐题阅读以上 ${n} 个问题，同意用于本次测量`,
    approvalNoTopics: "我确认题库中没有出现禁问话题，也没有出现不想被提及的名字",
    approvalSigner: "客户批准人（签字）：",
    approvalDate: "日期：",
    approvalExpected: (name) => `（intake 里填写的确认人是 ${name}）`,
    tickMeans: "打勾 = 同意这一题",
  },
  en: {
    title: (client) => `${client} - AI visibility question bank`,
    intro:
      "These are all the questions this measurement will put to a model. Please read every one of them: " +
      "they decide what the report is about. Every number in the report comes from these questions, so " +
      "changing one here changes what the report means.",
    frozen:
      "**This bank is frozen once approved.** After approval no question may be added, removed, reworded or " +
      "reordered; a re-test must use the same bank, otherwise the two measurements are not comparable.",
    provenanceTitle: "Where this bank comes from",
    thItem: "Item",
    thValue: "Value",
    kGeneratedFrom: "Source intake",
    kIntakeHash: "Intake content hash (sha256)",
    kFingerprint: "Bank fingerprint (sha256 of the question list)",
    kFilledBy: "Filled by / on",
    kGeneratedOn: "Generated on",
    kGenerator: "Generator",
    kGit: "Generator revision",
    kLanguages: "Languages",
    kQuestions: "Questions",
    groupQuestions: (n) => `${n} questions`,
    measureLabel: "What this group measures:",
    fieldsLabel: "Intake fields used by this group:",
    thinTitle: "Where this bank is thin (degradation)",
    thinNone: "All four groups reached their target count; nothing degraded.",
    kEmptySlots: "Intake fields that came back empty (unfilled, or no value usable in this bank's languages):",
    thinStatus: { ok: "on target", thin: "thin", absent: "no questions" },
    notesTitle: "Values used and excluded",
    approvalTitle: "Approval",
    approvalLead:
      "Tick a box to approve that question for the measurement. If you disagree with any question, write the " +
      "reason next to it; regenerating the bank produces a new fingerprint and retires the old one.",
    approvalAll: (n) => `I have read all ${n} questions above and approve them for this measurement`,
    approvalNoTopics: "I confirm no forbidden topic and no never-mention name appears in this bank",
    approvalSigner: "Approved by (signature):",
    approvalDate: "Date:",
    approvalExpected: (name) => `(the intake names ${name} as the approver)`,
    tickMeans: "tick = approve this question",
  },
};

function renderMarkdown(): string {
  /**
   * The scaffolding (headings, group explanations, the approval page) is written in the FIRST language
   * of markets.languages, while the questions are in each of their own languages. WHY NOT TWO
   * DOCUMENTS: the approval page is a signature on one artifact with one fingerprint; two pages would
   * drift the moment one of them was edited, and the client would sign a bank that is not the one the
   * measurement uses. WHY NOT BILINGUAL PROSE: a heading written twice is a heading that says two
   * different things eventually. The compromise is stated here and in the document's own field list.
   */
  const primary = facts.languages[0];
  const d = DOC[primary];
  const md: string[] = [];
  const esc = (s: string) => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const table = (headers: string[], rows: string[][]) => {
    md.push(`| ${headers.map(esc).join(" | ")} |`);
    md.push(`| ${headers.map(() => "---").join(" | ")} |`);
    for (const row of rows) md.push(`| ${row.map(esc).join(" | ")} |`);
    md.push("");
  };

  md.push(`# ${d.title(facts.client)}`);
  md.push("");
  md.push(d.intro);
  md.push("");
  md.push(`> ${d.frozen}`);
  md.push("");

  md.push(`## ${d.provenanceTitle}`);
  md.push("");
  table(
    [d.thItem, d.thValue],
    [
      [d.kGeneratedFrom, intakePath],
      [d.kIntakeHash, intakeSha256],
      [d.kFingerprint, fingerprint],
      [d.kFilledBy, [facts.filledBy, facts.filledOn].filter(Boolean).join(" / ") || "-"],
      [d.kGeneratedOn, generatedAt],
      [d.kGenerator, `${SCRIPT_REL} · v${GENERATOR_VERSION}`],
      [
        d.kGit,
        git.commit
          ? `${git.commit}${git.dirty ? " (dirty)" : ""} · script sha256 ${scriptSha256.slice(0, 12)}`
          : `script sha256 ${scriptSha256.slice(0, 12)}`,
      ],
      [d.kLanguages, facts.languages.map((l) => LANG_LABEL[l]).join(" / ")],
      [
        d.kQuestions,
        facts.languages.length === 1
          ? String(bank.entries.length)
          : `${facts.languages.map((l) => `${LANG_LABEL[l]} ${bank.entries.filter((e) => e.language === l).length}`).join(" / ")}（合计 ${bank.entries.length}）`,
      ],
    ]
  );
  if (git.dirty) {
    md.push(`*${git.note}*`);
    md.push("");
  }

  for (const lang of facts.languages) {
    const dl = DOC[lang];
    const langEntries = bank.entries.filter((e) => e.language === lang);
    if (facts.languages.length > 1) {
      md.push(`## ${LANG_LABEL[lang]}`);
      md.push("");
    }
    if (langEntries.length === 0) {
      md.push(
        lang === "zh"
          ? "_这一语言没有生成任何问题：intake 里没有用这种语言写的可用字段值。_"
          : "_No questions were generated in this language: the intake has no usable values written in it._"
      );
      md.push("");
    }
    for (const arch of ARCHETYPES) {
      const inGroup = langEntries.filter((e) => e.archetype === arch.id);
      md.push(`### ${arch.label[lang]} · ${dl.groupQuestions(inGroup.length)}`);
      md.push("");
      md.push(`${dl.measureLabel} ${arch.measures[lang]}`);
      md.push("");
      if (inGroup.length === 0) {
        md.push(
          lang === "zh"
            ? `_这一组没有出题。原因见下面的「题库薄在哪里」。_`
            : `_No questions in this group. The reason is in "Where this bank is thin" below._`
        );
        md.push("");
        continue;
      }
      const fields = [...new Set(inGroup.flatMap((e) => e.bindings.map((b) => b.field.replace(/\[\d+\]$/, ""))))].sort();
      md.push(`*${dl.fieldsLabel} ${fields.map((f) => `\`${f}\``).join("、")}*`);
      md.push("");
      for (const e of inGroup) {
        md.push(`- [ ] **${e.id}** ${e.text}`);
      }
      md.push("");
    }
  }

  md.push(`## ${d.thinTitle}`);
  md.push("");
  if (archetypeSummary.every((a) => a.status === "ok")) {
    md.push(d.thinNone);
    md.push("");
  } else {
    table(
      [d.thItem, d.thValue],
      archetypeSummary
        .filter((a) => a.status !== "ok")
        .map((a) => [
          `${a.label[primary]}（${d.thinStatus[a.status]}）`,
          `${a.generated} / ${a.target} · ${a.reasons.join(" · ")}`,
        ])
    );
  }
  /**
   * The empty slots are listed as a fact about the intake, independently of whether a group ended up
   * thin: a field nobody filled is the client's next action, and "which of my fields went unused" is
   * a question they ask about the output.
   */
  const emptySlots = SLOT_NAMES.filter(
    (slot) => facts.languages.every((lang) => (facts.usable[lang].get(slot) ?? []).length === 0)
  ).map((slot) =>
    primary === "zh"
      ? `${SLOT_SPECS[slot].from}（\`${SLOT_SPECS[slot].paths.join(" / ")}\`）`
      : `\`${SLOT_SPECS[slot].paths.join(" / ")}\``
  );
  if (emptySlots.length > 0) {
    md.push(`${d.kEmptySlots} ${emptySlots.join("；")}`);
    md.push("");
  }

  if (notes.length > 0) {
    md.push(`## ${d.notesTitle}`);
    md.push("");
    for (const n of notes) md.push(`- ${n.detail}`);
    md.push("");
  }

  md.push("---");
  md.push("");
  md.push(`## ${d.approvalTitle}`);
  md.push("");
  md.push(d.approvalLead);
  md.push("");
  md.push(`- [ ] ${d.approvalAll(bank.entries.length)}`);
  md.push(`- [ ] ${d.approvalNoTopics}`);
  md.push("");
  md.push(`${d.approvalSigner} ______________________________`);
  md.push("");
  md.push(`${d.approvalDate} ______________________________`);
  md.push("");
  if (facts.approvedBy) {
    md.push(d.approvalExpected(facts.approvedBy));
    md.push("");
  }
  md.push(`<!-- ${d.tickMeans}; ${d.kFingerprint}: ${fingerprint} -->`);
  return md.join("\n");
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

mkdirSync(outDir, { recursive: true });
const yamlPath = join(outDir, `${baseName}.yaml`);
const mdPath = join(outDir, `${baseName}.md`);

/**
 * The yaml package's stringify writes the bank; lineWidth 0 keeps a long question on one line, so a
 * diff of two banks shows a changed question and not a rewrapped block. aliasDuplicateObjects is off
 * because the shared empty arrays (reasons: []) otherwise come out as YAML anchors (`reasons: &a1 []`),
 * which is valid but reads like a mistake to the human who has to approve the file.
 */
writeFileSync(yamlPath, stringify(yamlDoc, { lineWidth: 0, aliasDuplicateObjects: false }), "utf8");
writeFileSync(mdPath, renderMarkdown(), "utf8");

const byLanguage = facts.languages.map((l) => `${LANG_LABEL[l]} ${bank.entries.filter((e) => e.language === l).length}`).join(" / ");
console.log(`intake   ${intakePath}`);
console.log(`sha256   ${intakeSha256}`);
console.log(`fingerprint ${fingerprint}`);
console.log(
  `questions ${bank.entries.length}  (${archetypeSummary.map((a) => `${a.label.zh} ${a.generated}/${a.target}`).join(", ")})`
);
console.log(`languages ${byLanguage}`);
for (const a of archetypeSummary) {
  if (a.status !== "ok") console.warn(`THIN     ${a.label.zh}: ${a.generated}/${a.target} - ${a.reasons.join(" / ")}`);
}
for (const n of notes.filter((x) => x.code === "restrictions-empty")) console.warn(`WARNING  ${n.detail}`);
console.log(`assertions ${list.length} passed`);
console.log(`wrote    ${yamlPath}`);
console.log(`wrote    ${mdPath}`);
if (isInside(REPO, outDir)) {
  console.warn(
    "\nWARNING: --allow-in-repo was used. These files name the client and their competitors, and this\n" +
      "repository is public. Do not commit them."
  );
}

/**
 * --print exists because a console is a log: the questions name the client and (in the comparison
 * group) their competitors, so echoing them by default would put client-confidential text into
 * whatever keeps stdout. It is a flag a human types on purpose.
 */
if (shouldPrint) {
  for (const lang of facts.languages) {
    console.log(`\n=== ${LANG_LABEL[lang]} ===`);
    for (const arch of ARCHETYPES) {
      const inGroup = bank.entries.filter((e) => e.language === lang && e.archetype === arch.id);
      if (inGroup.length === 0) continue;
      console.log(`\n-- ${arch.label[lang]} (${inGroup.length}) --`);
      for (const e of inGroup) console.log(`${e.id}\t${e.text}`);
    }
  }
}
