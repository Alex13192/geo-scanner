#!/usr/bin/env node
/**
 * Ask the fixed monthly question bank of four AI engines, and write what came back.
 *
 * ================================================================================================
 * WHAT THIS IS
 * ================================================================================================
 * A monitoring run: the same twenty-five questions (lib/monitoring/questions.ts), asked of ChatGPT,
 * Claude, Gemini and Perplexity, once each, once a month, recording for every answer whether the brand
 * is mentioned and where, which competitors are named, and which URLs the engine cited. The run file
 * is JSONL in monitoring/runs/<YYYY-MM-DD>.jsonl, one header line, one line per question/engine pair,
 * one footer line. monitoring/README.md is the reader's guide; this comment is the maintainer's.
 *
 * WHAT IT IS NOT. It is not a ranking and it is not a visibility rate. One sample per question per
 * engine per month is a reading of a non-deterministic process, so the file records observations and
 * the reader draws the direction. The header repeats that note because the file travels without the
 * README.
 *
 * ================================================================================================
 * WHY NO KEY MEANS A DRY RUN RATHER THAN A FAILURE
 * ================================================================================================
 * There are four keys and no reason for a checkout to have any of them. A tool whose default command
 * fails on a fresh clone teaches people to pass a force flag and stop reading the output. So:
 *
 *   - no key set, nothing asked: dry run. It prints the bank and which providers are configured, writes
 *     no file, and exits 0. The dry run is also the proof the bank and the CLI still work.
 *   - `--dry-run` passed explicitly: dry run whatever the keys are.
 *   - at least one key set: real run, asking only the engines whose keys are present. The other engines
 *     are recorded as skipped, with the variable name that was missing, in the header and footer.
 *   - `--provider=X` names the only engine to ask. If X has no key and this is not a dry run, that is an
 *     error: the caller asked for a specific measurement, and silently measuring nothing is worse than
 *     stopping.
 *
 * ================================================================================================
 * WHY THE RECORD IS NULLABLE RATHER THAN ZERO
 * ================================================================================================
 * A failed call, an unreadable response shape, and an answer that genuinely does not mention the brand
 * are three different facts, and only the last one is a measurement. `brandMentioned: false` means the
 * answer was read and the brand is absent. `brandMentioned: null` means there was no answer to read,
 * and `error` / `answerMissingReason` says why. The same distinction applies to `citedUrls`: `[]` is
 * "the engine cited nothing", `null` is "this response had no citation field to read". Collapsing null
 * into false would turn a broken month into a quiet one - the exact failure this repository writes
 * gates against.
 *
 * ================================================================================================
 * WHY THE FILE IS WRITTEN AS THE RUN GOES
 * ================================================================================================
 * 100 calls with web search is real money and several minutes. A crash at call 80 keeps the 80 answers
 * that were paid for. The header is written before the first call, each record is appended after its
 * call, and a missing footer is how a reader tells a complete run from an interrupted one.
 */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BANK_VERSION,
  QUESTION_BANK,
  QUESTION_COUNT,
  QUESTION_GROUPS,
  questionBankText,
} from "../../lib/monitoring/questions.ts";
import type { MonitorQuestion } from "../../lib/monitoring/questions.ts";
import { DEFAULT_COMPETITORS, analyseAnswer } from "../../lib/monitoring/mention.ts";
import type { CompetitorMention } from "../../lib/monitoring/mention.ts";
import {
  DEFAULT_TIMEOUT_MS,
  ENGINES,
  ENGINE_CONFIG,
  callEngine,
  resolveEngineKey,
  resolveModel,
} from "../../lib/monitoring/providers.ts";
import type { Engine, EngineCall } from "../../lib/monitoring/providers.ts";
import { BRAND, BRAND_FULL } from "../../lib/site.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_REL = "scripts/monitor/run.mts";
const RUNS_DIR = join(REPO, "monitoring", "runs");

/** Bumped by hand when the shape of a record changes. The header carries it so an old file is readable. */
const SCHEMA = 1;

/**
 * The spellings a mention may take. Read from lib/site.ts rather than written here: the site's own
 * name is declared once, and the monitoring run has to agree with the page it measures.
 */
const BRAND_NAMES = [BRAND, BRAND_FULL];

/* ------------------------------------------------------------------ */
/* Arguments                                                           */
/* ------------------------------------------------------------------ */

const VALUE_FLAGS = new Set(["provider", "competitors", "date", "timeout-ms"]);
const BOOLEAN_FLAGS = new Set(["dry-run", "force", "help"]);

const USAGE = [
  "Usage:",
  "  npm run monitor                        dry run when no key is set, a real run when one is",
  "  npm run monitor -- --dry-run           print the bank and provider availability; no calls",
  "  npm run monitor -- --provider=openai   ask only ChatGPT (openai|anthropic|gemini|perplexity)",
  "  npm run monitor -- --force             replace an existing run file for the same date",
  "  npm run monitor -- --date=2026-10-01   name the run file for a specific day",
  "  npm run monitor -- --timeout-ms=180000 cap each call (default 120000)",
  '  npm run monitor -- --competitors="Profound,Otterly"   override the default competitor list',
  "",
  "Keys, all optional: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY or GEMINI_API_KEY,",
  "PERPLEXITY_API_KEY. Model overrides: OPENAI_MODEL, ANTHROPIC_MODEL, GEMINI_MODEL,",
  "PERPLEXITY_MODEL. An engine is asked only when its key is set; the rest are recorded as skipped.",
  "Run files land in monitoring/runs/<date>.jsonl. Without a key, nothing is asked and nothing is written.",
].join("\n");

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

/*
 * UNKNOWN ARGUMENTS ARE ERRORS, not ignored. A workflow step that mistypes `--provder=openai` would
 * otherwise run all four engines and produce a file that looks exactly like the intended one; a wrong
 * flag in CI is discovered a month later, when the file is the only evidence of what happened.
 */
for (const token of process.argv.slice(2)) {
  if (!token.startsWith("--")) {
    console.error(`Unexpected argument ${JSON.stringify(token)}.\n\n${USAGE}`);
    process.exit(2);
  }
  const name = token.slice(2).split("=")[0];
  const hasValue = token.includes("=");
  if (VALUE_FLAGS.has(name)) {
    if (!hasValue) {
      console.error(`--${name} needs a value, for example --${name}=...\n\n${USAGE}`);
      process.exit(2);
    }
    continue;
  }
  if (BOOLEAN_FLAGS.has(name)) {
    if (hasValue) {
      console.error(`--${name} is a flag and takes no value.\n\n${USAGE}`);
      process.exit(2);
    }
    continue;
  }
  console.error(`Unknown argument ${JSON.stringify(token)}.\n\n${USAGE}`);
  process.exit(2);
}

if (flag("help")) {
  console.log(USAGE);
  process.exit(0);
}

function num(name: string, fallback: number): number {
  const raw = arg(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`--${name} must be a positive number; got ${JSON.stringify(raw)}.`);
    process.exit(2);
  }
  return Math.floor(value);
}

const timeoutMs = num("timeout-ms", DEFAULT_TIMEOUT_MS);

/**
 * The run date, in UTC, and therefore also the file name. UTC rather than local time because the
 * monthly workflow runs on a UTC cron and a file must not be named by the runner's timezone.
 */
const date = (arg("date") ?? new Date().toISOString().slice(0, 10)).trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
  console.error(`--date must be a real YYYY-MM-DD date; got ${JSON.stringify(date)}.`);
  process.exit(2);
}

const competitorArg = arg("competitors");
const competitors =
  competitorArg === undefined
    ? DEFAULT_COMPETITORS
    : competitorArg
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
if (competitorArg !== undefined && competitors.length === 0) {
  console.error(
    "--competitors= was empty. Pass at least one name, or omit the flag to use the default list."
  );
  process.exit(2);
}
const seenCompetitors = new Set<string>();
for (const name of competitors) {
  const key = name.toLowerCase();
  if (seenCompetitors.has(key)) {
    console.error(`--competitors lists ${JSON.stringify(name)} twice; a duplicate would count it twice.`);
    process.exit(2);
  }
  seenCompetitors.add(key);
}

const requestedRaw = (arg("provider") ?? "").trim();
let requested: Engine | null = null;
if (requestedRaw) {
  const found = ENGINES.find((engine) => engine === requestedRaw);
  if (!found) {
    console.error(
      `--provider=${requestedRaw} is not one of ${ENGINES.join(", ")}. Nothing was written.`
    );
    process.exit(2);
  }
  requested = found;
}
const runEngines: Engine[] = requested ? [requested] : [...ENGINES];

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

const keys = {} as Record<Engine, { apiKey: string | null; envName: string | null }>;
const models = {} as Record<Engine, string>;
for (const engine of ENGINES) {
  keys[engine] = resolveEngineKey(engine, process.env);
  models[engine] = resolveModel(engine, process.env);
}

const configured = runEngines.filter((engine) => keys[engine].apiKey !== null);
const skipped = runEngines
  .filter((engine) => keys[engine].apiKey === null)
  .map((engine) => ({
    engine,
    label: ENGINE_CONFIG[engine].label,
    reason: `no key set (${ENGINE_CONFIG[engine].apiKeyEnv.join(" / ")})`,
  }));
/**
 * Engines that were never in this run because `--provider` narrowed it. Recorded in the header: a file
 * whose `engines` list has one entry and no explanation reads like a one-engine measurement, when it is
 * actually a one-engine slice of a four-engine method.
 */
const notRequested =
  requested === null
    ? []
    : ENGINES.filter((engine) => engine !== requested).map((engine) => ({
        engine,
        label: ENGINE_CONFIG[engine].label,
        reason: `not requested (--provider=${requested})`,
      }));

const explicitDryRun = flag("dry-run");
const force = flag("force");

/*
 * A requested provider with no key is a request this run cannot honour. Failing is the honest answer:
 * a dry run that quietly ignores `--provider` would spend no money but would also not say that the
 * only thing asked for is unavailable. `--dry-run` is the explicit way to inspect instead.
 */
if (requested && keys[requested].apiKey === null && !explicitDryRun) {
  console.error(
    [
      `--provider=${requested} was requested, but ${ENGINE_CONFIG[requested].apiKeyEnv.join(" / ")} is not set.`,
      "",
      "Nothing was asked and nothing was written. Either set that key for this shell, drop --provider to",
      "run whichever engines are configured, or pass --dry-run to print the bank without calling anything.",
    ].join("\n")
  );
  process.exit(2);
}

const mode: "dry-run" | "real" =
  explicitDryRun || configured.length === 0 ? "dry-run" : "real";
const autoDryRun = !explicitDryRun && mode === "dry-run";

const bankSha256 = createHash("sha256")
  .update(
    JSON.stringify(
      QUESTION_BANK.map((q) => ({ id: q.id, group: q.group, question: q.question, intent: q.intent }))
    )
  )
  .digest("hex");

/* ------------------------------------------------------------------ */
/* The dry run                                                         */
/* ------------------------------------------------------------------ */

function printDryRun(): void {
  console.log("LLMention monthly monitoring - DRY RUN\n");
  console.log(
    `Bank: ${BANK_VERSION}, ${QUESTION_COUNT} questions in ${QUESTION_GROUPS.length} groups (sha256 ${bankSha256.slice(0, 12)}...)`
  );
  console.log("");
  console.log(questionBankText());
  console.log("");
  console.log("Providers (a real run asks only the ones whose key is set):");
  for (const engine of ENGINES) {
    const config = ENGINE_CONFIG[engine];
    const status =
      requested !== null && requested !== engine
        ? "not requested"
        : keys[engine].apiKey !== null
          ? `key present (${keys[engine].envName})`
          : `skipped - no key (${config.apiKeyEnv.join(" / ")})`;
    console.log(`  ${engine.padEnd(11)} ${config.label.padEnd(20)} ${status}`);
    console.log(
      `              model: ${models[engine]}${process.env[config.modelEnv] ? "" : ` (default; override with ${config.modelEnv})`}`
    );
  }
  console.log("");
  console.log(
    autoDryRun
      ? "Mode: DRY RUN, because no provider key is set. Nothing was asked and no run file was written."
      : "Mode: DRY RUN, because --dry-run was passed. Nothing was asked and no run file was written."
  );
  console.log(
    `A real run would ask ${QUESTION_COUNT} questions of ${configured.length} engine(s) and write monitoring/runs/${date}.jsonl (${QUESTION_COUNT * configured.length} records).`
  );
  if (configured.length === 0) {
    console.log(
      "No engine is configured, so a real run would stop for the same reason. Set one key for this shell only:"
    );
    console.log('  $env:OPENAI_API_KEY = "<key>"    # PowerShell; then: npm run monitor');
  } else {
    console.log(`Set a key and run without --dry-run to measure: ${configured.map((e) => ENGINE_CONFIG[e].label).join(", ")}.`);
  }
  console.log("");
  console.log(
    "The monthly record is directional, not statistical: one sample per question per engine, and the answer"
  );
  console.log("is non-deterministic. See monitoring/README.md.");
}

/* ------------------------------------------------------------------ */
/* The record                                                          */
/* ------------------------------------------------------------------ */

type MonitorRecord = {
  kind: "monitor-record";
  questionId: string;
  group: string;
  question: string;
  engine: Engine;
  engineLabel: string;
  model: string;
  timestamp: string;
  /** True only when the engine produced an answer. A citation gap is not a failed call. */
  ok: boolean;
  status: EngineCall["status"];
  httpStatus: number | null;
  ms: number;
  error: string | null;
  errorBody: string | null;
  answer: string | null;
  answerMissingReason: string | null;
  /** Null, not false, when there was no answer to read. */
  brandMentioned: boolean | null;
  brandPosition: number | null;
  brandMatchedName: string | null;
  brandEvidence: string | null;
  /** Null when there was no answer; otherwise every configured competitor, present or not. */
  competitorMentions: CompetitorMention[] | null;
  citedUrls: string[] | null;
  citationsMissingReason: string | null;
  rawAnnotations: unknown;
};

function buildRecord(call: EngineCall, question: MonitorQuestion): MonitorRecord {
  /*
   * NO ANSWER MEANS NO VERDICT. The analysis is skipped rather than run on "", because detectBrandMention
   * on an empty answer would return a perfectly well-formed "not mentioned" and the record would read as
   * a measurement of the engine rather than of a failed call.
   */
  const analysis =
    call.answer === null
      ? null
      : analyseAnswer(call.answer, { brandNames: BRAND_NAMES, competitors });

  return {
    kind: "monitor-record",
    questionId: question.id,
    group: question.group,
    question: question.question,
    engine: call.engine,
    engineLabel: ENGINE_CONFIG[call.engine].label,
    model: call.model,
    timestamp: new Date().toISOString(),
    ok: call.status === "ok",
    status: call.status,
    httpStatus: call.httpStatus,
    ms: call.ms,
    error: call.error,
    errorBody: call.errorBody,
    answer: call.answer,
    answerMissingReason: call.answerMissingReason,
    brandMentioned: analysis === null ? null : analysis.brand.mentioned,
    brandPosition: analysis === null ? null : analysis.brand.position,
    brandMatchedName: analysis === null ? null : analysis.brand.matchedName,
    brandEvidence: analysis === null ? null : analysis.brand.evidence,
    competitorMentions: analysis === null ? null : analysis.competitors,
    citedUrls: call.citedUrls,
    citationsMissingReason: call.citationsMissingReason,
    rawAnnotations: call.rawAnnotations,
  };
}

/** One stdout line per call, without the answer text: a console is a log, not the record. */
function progressLine(index: number, total: number, record: MonitorRecord): string {
  const position = `[${String(index).padStart(String(total).length, " ")}/${total}]`;
  const head = `${position} ${record.questionId.padEnd(15)} ${record.engine.padEnd(11)}`;
  const seconds = `${(record.ms / 1000).toFixed(1)}s`;
  if (!record.ok) {
    return `${head} FAILED ${record.status}${record.error ? ` (${record.error})` : ""} ${seconds}`;
  }
  const mention =
    record.brandMentioned === null
      ? "mention ?"
      : record.brandMentioned
        ? `mention yes @${record.brandPosition}`
        : "mention no";
  const citations =
    record.citedUrls === null ? "citations unreadable" : `citations ${record.citedUrls.length}`;
  return `${head} ok   ${mention}, ${citations} ${seconds}`;
}

/* ------------------------------------------------------------------ */
/* The run                                                             */
/* ------------------------------------------------------------------ */

function printSkipped(): void {
  for (const entry of skipped) {
    console.log(`Skipped: ${entry.label} - ${entry.reason}`);
  }
}

async function realRun(): Promise<void> {
  const startedAt = new Date().toISOString();
  mkdirSync(RUNS_DIR, { recursive: true });
  const runPath = join(RUNS_DIR, `${date}.jsonl`);
  const displayPath = relative(REPO, runPath);

  if (existsSync(runPath) && !force) {
    console.error(
      [
        `Refusing to write over an existing run file: ${displayPath}`,
        "",
        "A second run appended to the first would double every denominator in a month that is already",
        "full: 200 records from one day looks exactly like a 50-question month. Pass --force to replace",
        "it, or --date=YYYY-MM-DD to write a separate file.",
      ].join("\n")
    );
    process.exit(2);
  }

  const scriptSha256 = createHash("sha256").update(readFileSync(SCRIPT_PATH)).digest("hex");
  const header = {
    kind: "monitor-run-header",
    schema: SCHEMA,
    collector: {
      script: SCRIPT_REL,
      script_sha256: scriptSha256,
      started_at: startedAt,
    },
    bank: {
      version: BANK_VERSION,
      questions: QUESTION_COUNT,
      groups: QUESTION_GROUPS.map((group) => group.id),
      sha256: bankSha256,
      note: "Changing any question changes this sha256 and the time series; see lib/monitoring/questions.ts.",
    },
    run: {
      date,
      mode,
      started_at: startedAt,
      timezone: "UTC",
      timeout_ms: timeoutMs,
      /** One sample per pair is the design, not a setting: two would be a different measurement. */
      answers_per_question: 1,
    },
    brand: { names: BRAND_NAMES },
    competitors,
    engines: configured.map((engine) => ({
      engine,
      label: ENGINE_CONFIG[engine].label,
      model: models[engine],
      key_env: keys[engine].envName,
    })),
    skipped,
    not_requested: notRequested,
    limit:
      "One sample per question per engine per month is directional, not statistical, and answers are non-deterministic. Read the direction across months, not a percentage within one.",
  };
  writeFileSync(runPath, `${JSON.stringify(header)}\n`);

  const total = QUESTION_COUNT * configured.length;
  console.log("LLMention monthly monitoring - REAL RUN\n");
  console.log(`Bank: ${BANK_VERSION}, ${QUESTION_COUNT} questions (sha256 ${bankSha256.slice(0, 12)}...)`);
  console.log(`Asking: ${configured.map((engine) => ENGINE_CONFIG[engine].label).join(", ")}`);
  printSkipped();
  console.log(`Writing: ${displayPath}\n`);

  let written = 0;
  let ok = 0;
  let failed = 0;
  const byEngine = new Map<
    Engine,
    { records: number; ok: number; failed: number; mentioned: number | null }
  >();
  for (const engine of configured) {
    byEngine.set(engine, { records: 0, ok: 0, failed: 0, mentioned: null });
  }

  /*
   * ENGINE OUTER, QUESTION INNER. A file is read one engine's block at a time ("what did ChatGPT say
   * this month"), which is the question a reader actually has when the file is fresh; and a provider
   * that starts failing halfway leaves a contiguous block of failures rather than a pattern spread
   * across all four.
   */
  for (const engine of configured) {
    const apiKey = keys[engine].apiKey;
    if (apiKey === null) continue; // unreachable: configured implies a key; kept for the type.
    const model = models[engine];
    for (const question of QUESTION_BANK) {
      const call = await callEngine(engine, question.question, {
        apiKey,
        model,
        timeoutMs,
      });
      const record = buildRecord(call, question);
      appendFileSync(runPath, `${JSON.stringify(record)}\n`);
      written += 1;
      if (record.ok) ok += 1;
      else failed += 1;

      const totals = byEngine.get(engine);
      if (totals) {
        totals.records += 1;
        if (record.ok) {
          totals.ok += 1;
          if (record.brandMentioned !== null) {
            totals.mentioned = (totals.mentioned ?? 0) + (record.brandMentioned ? 1 : 0);
          }
        } else {
          totals.failed += 1;
        }
      }

      console.log(progressLine(written, total, record));
    }
  }

  const footer = {
    kind: "monitor-run-footer",
    schema: SCHEMA,
    finished_at: new Date().toISOString(),
    records: written,
    ok,
    failed,
    by_engine: [...byEngine.entries()].map(([engine, totals]) => ({
      engine,
      label: ENGINE_CONFIG[engine].label,
      ...totals,
    })),
    skipped,
  };
  appendFileSync(runPath, `${JSON.stringify(footer)}\n`);

  console.log("");
  console.log(
    `Done: ${written} record(s), ${ok} answered, ${failed} failed. Run file: ${displayPath}`
  );
  const mentionSummary = [...byEngine.entries()]
    .map(([engine, totals]) => {
      const label = ENGINE_CONFIG[engine].label;
      return totals.mentioned === null
        ? `${label}: no usable answer`
        : `${label}: mentioned in ${totals.mentioned}/${totals.ok}`;
    })
    .join("; ");
  if (ok > 0) console.log(`Brand mentions (used answers only): ${mentionSummary}`);
  if (failed > 0) {
    console.log("");
    console.log(
      "Exit code 1 because at least one call failed. The failures are in the file with their status and"
    );
    console.log("error body; this run is a partial measurement, not a complete one.");
    process.exitCode = 1;
  }
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

if (mode === "dry-run") {
  printDryRun();
} else {
  await realRun();
}
