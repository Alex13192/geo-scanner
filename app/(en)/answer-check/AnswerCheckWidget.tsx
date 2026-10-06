"use client";

import { useState } from "react";

import { checkAnswer, type AnswerReport } from "@/lib/answer-check/rules";
import { questionBankText } from "@/lib/answer-check/questions";

/**
 * The interactive half of /answer-check/.
 *
 * WHY THE ANALYSIS RUNS HERE AND NOT ON A SERVER. It is pure string work over text the visitor
 * already has, so a round trip would buy nothing and cost something: a Worker invocation, a place
 * for the text to be logged, and a reason to write a privacy sentence. Running it in the browser
 * means the answer never leaves the page, and the page can say that as a fact rather than as a
 * promise. The rules module is imported directly, which is why it contains no Node APIs.
 *
 * WHY THERE IS NO SCORE. The report says how many of six signals were found, and refuses to turn
 * that into a mark out of ten. A tool that grades an answer invites the reader to optimise the
 * grade; what they should be reading is which signals are missing and what the evidence was.
 */

const STATUS_STYLE: Record<string, string> = {
  yes: "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]",
  partly: "border-[var(--warn)] bg-[var(--warn-bg)] text-[var(--warn)]",
  no: "border-[var(--line)] bg-[var(--surface-1)] text-[var(--ink-3)]",
};

const STATUS_WORD: Record<string, string> = { yes: "found", partly: "partly", no: "not found" };

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function AnswerCheckWidget() {
  const [brand, setBrand] = useState("");
  const [aliases, setAliases] = useState("");
  const [domain, setDomain] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<AnswerReport | null>(null);
  const [copied, setCopied] = useState(false);

  const canRun = brand.trim().length > 0 && answer.trim().length > 0;

  function run() {
    if (!canRun) return;
    setReport(
      checkAnswer({
        answer,
        brand,
        aliases: splitList(aliases),
        domain,
        competitors: splitList(competitors),
      })
    );
  }

  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(questionBankText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be refused; the bank is on the guide page either way, so this is not
      // worth an error state.
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">Your brand name</span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Novacorp"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">
              Other names it answers to <span className="text-[var(--ink-3)]">(optional)</span>
            </span>
            <input
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="comma separated"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">
              Your domain <span className="text-[var(--ink-3)]">(optional)</span>
            </span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. novacorp.com"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">
              Competitors to compare <span className="text-[var(--ink-3)]">(optional)</span>
            </span>
            <input
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="comma separated"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-[var(--ink-1)]">
            Paste the answer you received
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ink-3)]">
            Ask your question in ChatGPT, Perplexity, Gemini, Doubao or any other engine, then copy
            the answer here. It is analysed in your browser and is not sent anywhere.
          </span>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={9}
            placeholder="Paste the whole answer, including any links it cites."
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canRun}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Check this answer
          </button>
          <button
            type="button"
            onClick={copyQuestions}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            {copied ? "Copied" : "Copy the 20 questions"}
          </button>
        </div>
      </form>

      {report ? (
        <section aria-live="polite" className="space-y-6">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-3)]">
              {report.brand}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-1)]">
              {report.present} of {report.total} signals
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
              This is a count, not a score, and it is about the one answer you pasted. It says nothing
              about what any engine would answer next time.
            </p>
          </div>

          <ul className="space-y-3">
            {report.signals.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-0)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--ink-1)]">{s.label}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-xs ${STATUS_STYLE[s.status]}`}
                  >
                    {STATUS_WORD[s.status]}
                  </span>
                </div>
                {s.evidence ? (
                  <p className="mt-2 break-words font-mono text-xs leading-relaxed text-[var(--ink-2)]">
                    {s.evidence}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {report.competitors.length > 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
              <h3 className="text-sm font-semibold text-[var(--ink-1)]">Position against others</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ink-2)]">
                {report.competitors.map((c) => (
                  <li key={c.name}>
                    <span className="font-medium text-[var(--ink-1)]">{c.name}</span> —{" "}
                    {!c.mentioned
                      ? "not mentioned in this answer"
                      : c.brandFirst
                        ? "mentioned, after your brand"
                        : "mentioned, before your brand"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.citations.domains.length > 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
              <h3 className="text-sm font-semibold text-[var(--ink-1)]">
                Sources this answer cites
                {report.citations.ownDomainCited === true
                  ? " — including yours"
                  : report.citations.ownDomainCited === false
                    ? " — none of them yours"
                    : ""}
              </h3>
              <p className="mt-2 break-words font-mono text-xs leading-relaxed text-[var(--ink-2)]">
                {report.citations.domains.join(", ")}
              </p>
              {report.citations.ownDomainCited === false ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                  The engine is describing you from sources you do not control. That is the part of an
                  AI answer a site owner can change, and it is why this is the signal worth watching
                  month to month.
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-[var(--ink-3)]">
            Rules, vocabularies and worked examples are published on this page and in the{" "}
            <a href="/docs/ai-visibility-self-check/" className="underline">
              self-check guide
            </a>
            . If a verdict looks wrong, the substring above is what produced it — and a brand whose
            name is also an ordinary word will occasionally match the word rather than the company.
          </p>
        </section>
      ) : null}
    </div>
  );
}
