import type { Metadata } from "next";
import { Suspense } from "react";

import ProsePage from "@/app/components/ProsePage";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import AnswerCheckWidget from "./AnswerCheckWidget";
import { QUESTION_GROUPS, questionBankText } from "@/lib/answer-check/questions";
import { RECOMMENDATION_CUES, HEDGE_CUES, EARLY_CHARS, CUE_WINDOW } from "@/lib/answer-check/rules";
import { og } from "@/lib/og";

/**
 * Score one AI answer, in the browser.
 *
 * WHY THIS TOOL EXISTS AND WHAT IT DELIBERATELY IS NOT. Every commercial product in this category
 * queries the engines and sells the result, which means the number cannot be reproduced by the
 * reader and costs money per run. This one takes the answer the reader already has and applies six
 * published rules to it. It never contacts an engine, so it can produce no visibility rate - and
 * saying that plainly is the point, because the alternative is a page that looks like a measurement
 * and is not one.
 *
 * WHAT IT IS FOR. A visitor arrives from a search or from an AI answer asking whether they show up.
 * They can leave with a verdict on the answer in front of them, the exact substring behind each
 * verdict, and the one leading indicator worth tracking - whether the sources an engine cites
 * include pages they control.
 *
 * The rules, the vocabularies and the question bank all live in lib/answer-check/ so that this page,
 * the widget and the guide cannot describe different methods.
 */

const TITLE = "Check an AI answer for your brand";
const DESCRIPTION =
  "Paste an answer you got from ChatGPT, Perplexity or Gemini and see which of six signals it contains. Runs in your browser, contacts no AI engine, and gives no score.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/answer-check/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/answer-check/", type: "website" }),
};

export default function Page() {
  return (
    <ProsePage
      eyebrow="Self-check"
      title={TITLE}
      description="Six published rules, applied to the answer you paste. No AI engine is contacted, and there is nothing to sign up for."
      meta="Runs entirely in your browser"
      action={{ href: "/docs/ai-visibility-self-check/", label: "How to run this properly" }}
    >
      <section className="space-y-4">
        <p>
          <strong>Paste an answer, get the six signals it contains, and see the exact text behind
          each verdict.</strong> Ask your question in whichever engine your buyers use, copy the
          answer, and put it in the box below. Nothing is uploaded: the analysis is string matching
          that runs on this page.
        </p>
        <p className="text-[var(--ink-2)]">
          This is <strong>not</strong> a visibility measurement, and it is important to be clear about
          why. A measurement means asking an engine — repeatedly, on a schedule, across platforms —
          and that costs money per run. LLMention does not do it, and this tool does not pretend to:
          it scores the text <em>you</em> provide. That is a weaker claim than the vendors in this
          category make, and it is the only one that can be checked by the person reading it.
        </p>
      </section>

      <section className="mt-8">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm text-[var(--ink-2)]">
              Loading the checker…
            </div>
          }
        >
          <AnswerCheckWidget />
        </Suspense>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink-1)]">What are the six signals?</h2>
        <p>
          Each one is mechanical, and each is reported with the substring that produced it, so you can
          disagree with the rule rather than with the tool:
        </p>
        <ol className="space-y-3 text-[var(--ink-2)]">
          <li>
            <strong className="text-[var(--ink-1)]">Mentioned</strong> — the brand name, or an alias
            you supplied, appears anywhere in the answer. Latin names are matched on word boundaries,
            so &ldquo;Ramp&rdquo; is not found inside &ldquo;ramp-up&rdquo;; names containing
            non-Latin characters are matched as substrings, because word boundaries do not exist in
            those scripts and a boundary pattern would match nothing at all.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">Mentioned early</strong> — the first mention
            lands within {EARLY_CHARS} characters, roughly two sentences. An answer that names you in
            its closing paragraph is not an answer that surfaces you.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">In a list of options</strong> — the mention sits
            on a bulleted or numbered line, which is where a reader actually makes a choice.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">Carries a recommending word</strong> — within{" "}
            {CUE_WINDOW} characters of the mention there is a word from this published list:{" "}
            <span className="font-mono text-xs">{RECOMMENDATION_CUES.join(", ")}</span>. A mention
            without one of these is a name, not a suggestion.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">Sources cited</strong> — the domains the answer
            links to. If your own domain is not among them, the engine is describing you from
            somewhere you do not control.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">States what it cannot confirm</strong> — detected
            from this published list:{" "}
            <span className="font-mono text-xs">{HEDGE_CUES.join(", ")}</span>. On a factual question
            this is a pass rather than a failure: a blank is recoverable, a confident wrong number
            that a customer quotes back is not.
          </li>
        </ol>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink-1)]">Which questions should I ask?</h2>
        <p>
          Twenty to start with, in four groups that measure different things. Replace the bracketed
          parts with your own words — and use the language your buyers use, because the same question
          in English and in Chinese are two different measurements.
        </p>
        {QUESTION_GROUPS.map((group) => (
          <div key={group.id}>
            <h3 className="text-base font-semibold text-[var(--ink-1)]">{group.label}</h3>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{group.why}</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-2)]">
              {group.questions.map((q) => (
                <li key={q} className="font-mono text-xs leading-relaxed">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <details className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--ink-1)]">
            The whole bank as text, for pasting into a notes file
          </summary>
          <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-[var(--ink-2)]">
            {questionBankText()}
          </pre>
        </details>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink-1)]">
          What this tool cannot tell you
        </h2>
        <ul className="space-y-3 text-[var(--ink-2)]">
          <li>
            <strong className="text-[var(--ink-1)]">It cannot produce a rate.</strong> It scores one
            answer at a time. Twenty questions asked three times is sixty samples — enough to notice a
            change, nowhere near enough for a percentage that describes your market.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">
              It does not know what any engine would answer.
            </strong>{" "}
            It has never spoken to one. If you want that automated, it costs money per query and you
            should buy it from somebody who is explicit about that.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">
              A brand whose name is an ordinary word will sometimes match the word.
            </strong>{" "}
            &ldquo;we ramp up quickly&rdquo; contains the standalone token &ldquo;ramp&rdquo;, and no
            string rule can tell it from the company. Every verdict shows the substring so you can see
            it, and a more specific alias fixes most cases.
          </li>
          <li>
            <strong className="text-[var(--ink-1)]">One answer is an anecdote.</strong> Engines
            change between sessions, versions and regions. Record the date, the model and three runs
            per question, or the second measurement will not be comparable to the first.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <Evidence
          quote={GEO_PRIMARY_QUOTE}
          attribution="Generative Engine Optimization, KDD 2024"
          attributionUrl="https://arxiv.org/abs/2311.09735"
          sources={GEO_PRIMARY_SOURCES}
          note="The published GEO research is why the fifth signal is the one to watch: adding quotations and cited sources produced a larger measured gain than any other single change tested."
        />
      </section>

      <section className="mt-10">
        <Faq
          title="Questions about the checker"
          items={[
            {
              q: "Is my pasted text stored or sent anywhere?",
              a: "No. The rules run in your browser and the text never leaves the page. There is no request to a server, no log, and no account — which is also why the tool works with your network disconnected after the page has loaded.",
            },
            {
              q: "Why is there no score out of 100?",
              a: "Because a mark invites you to optimise the mark. A count of six signals, each with the substring that produced it, tells you what is missing and lets you check the verdict. A number would be easier to quote and easier to game.",
            },
            {
              q: "Can I use this for a client report?",
              a: "You can quote the six signals and their evidence for any answer you paste. What you must not do is present a count from one answer as a visibility rate — that is the claim this tool deliberately refuses to make, and the guide explains how to record results properly instead.",
            },
          ]}
        />
      </section>
    </ProsePage>
  );
}
