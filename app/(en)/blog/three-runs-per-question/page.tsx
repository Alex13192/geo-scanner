import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("three-runs-per-question");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English-first series; translations add their own hreflang keys when they ship. */
    languages: {
      en: `/blog/${insight.slug}/`,
      "x-default": `/blog/${insight.slug}/`,
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: insightPath(insight.slug),
    type: "article",
  }),
};

export default function Page() {
  return (
    <PostShell
      insight={insight}
      faq={{
        title: "Questions about run counts",
        items: [
          {
            q: "Why three runs and not one?",
            a: "Because a generative answer varies. One run is an anecdote: it cannot distinguish a stable mention from a coin flip. Three is the smallest number that can show a majority and a split at the same time, and it is a cost the buyer can approve.",
          },
          {
            q: "Why not report 67% instead of 2 of 3?",
            a: "Because 67% hides the denominator. It reads like a rate from a large sample, and a reader will compare it with rates from samples of hundreds. '2 of 3' carries the same information and makes the sample size impossible to forget. The percentage is only honest when the denominator is large enough to support it.",
          },
          {
            q: "Can I compare two brands from their counts?",
            a: "Only carefully. Two of three versus one of three is one run of difference on a question; it is a lead, not a result. The comparison is more useful across a whole question bank with the same prompts and runs, and it still describes that bank on that date, not the market.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("statistics-without-sources-citation-trap"),
          label: "Statistics without sources: the citation trap",
          note: "The larger version of the same problem: a number that hides its denominator.",
        },
        {
          href: insightPath("answer-first-writing-measured-positions"),
          label: "Answer-first writing: measured positions",
          note: "A measurement small enough to describe its own sample size, which is the point here too.",
        },
        {
          href: "/methodology/",
          label: "The method",
          note: "How the scan and the paid measurement differ, and what each can claim.",
        },
      ]}
    >
      <p>
        A percentage is a compression. It takes a count and a denominator and produces a single
        number that reads as a rate. That is useful when the denominator is large and the estimate is
        stable; it is misleading when the denominator is three. A report that says &quot;67% of
        answers mention you&quot; from two of three runs borrows the authority of a survey while
        carrying three observations.
      </p>
      <p>
        This article is about why the paid measurement runs every question three times, and why the
        result is written as &quot;2 of 3&quot; rather than as a percentage. It is a small design
        decision with a large honesty consequence.
      </p>

      <h2>Why three runs</h2>
      <p>
        Generative answers vary between runs even with the same prompt, the same model and the same
        day. The variation is the phenomenon, not noise to be averaged away: an engine that mentions
        a brand in two of three runs is in a different state from one that mentions it three times,
        and both are different from one that never does.
      </p>
      <ul>
        <li>
          <strong>One run</strong> cannot distinguish a stable mention from a coincidence, and a
          single failed call is indistinguishable from a real absence.
        </li>
        <li>
          <strong>Two runs</strong> can disagree, but a 1–1 split has no majority and no way to
          break the tie.
        </li>
        <li>
          <strong>Three runs</strong> are the smallest set with a majority and a visible split: 3 of
          3 is stable, 2 of 3 is a majority with noise, 1 of 3 is a minority, 0 of 3 is absent.
        </li>
      </ul>
      <p>
        The cost is the reason it stops there. Every run is a model call with a real price, and the
        value of the fourth and fifth run is smaller than the value of asking another question. Three
        is a floor chosen for interpretability, not a claim that three is enough for statistical
        precision.
      </p>

      <h2>Why the count is the result</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Reported as</th>
              <th>What the reader sees</th>
              <th>What it hides</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2 of 3</td>
              <td>The count, the denominator and the sample size in one glance.</td>
              <td>Nothing relevant; the reader can compute the ratio if they want it.</td>
            </tr>
            <tr>
              <td>67%</td>
              <td>A rate that looks comparable with surveys.</td>
              <td>The denominator: three runs, one date, one model, one prompt.</td>
            </tr>
            <tr>
              <td>&quot;Often mentioned&quot;</td>
              <td>A qualitative impression.</td>
              <td>Everything: no count, no denominator, no way to compare.</td>
            </tr>
            <tr>
              <td>A score out of 100</td>
              <td>A single number that looks like a ranking.</td>
              <td>The questions, the runs, the failures and the fact that it is not a ranking.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The count is also the only form that survives aggregation honestly. If question A is 2 of 3
        and question B is 1 of 3, the group is 3 of 6. Averaging the percentages (67% and 33%) gives
        50%, which happens to equal 3/6 here but stops doing so as denominators vary. A report that
        stores counts can always reconstruct the totals; a report that stores percentages cannot.
      </p>

      <h2>What three runs can and cannot say</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Supported?</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&quot;Mentioned in 2 of 3 runs on 12 March, on this model, for this prompt&quot;</td>
              <td>Yes</td>
              <td>It describes exactly what was observed, with the conditions attached.</td>
            </tr>
            <tr>
              <td>&quot;67% of users see your brand&quot;</td>
              <td>No</td>
              <td>Three runs are not a sample of users; they are three calls.</td>
            </tr>
            <tr>
              <td>&quot;Your visibility improved from 1 of 3 to 2 of 3&quot;</td>
              <td>Weakly</td>
              <td>One run of difference on one question; it becomes a trend across a bank and a repeat.</td>
            </tr>
            <tr>
              <td>&quot;You rank third behind two competitors&quot;</td>
              <td>No</td>
              <td>The method counts mentions, not positions; no ranking is measured.</td>
            </tr>
            <tr>
              <td>&quot;This question is unstable&quot;</td>
              <td>Yes, as a signal</td>
              <td>A split across runs is evidence of variability; the count is what shows it.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Failed runs are part of the count</h2>
      <p>
        A run can fail: a 429, a timeout, a refusal, a response that is not an answer. The honest
        report does not turn a failure into a zero and does not silently drop it. It records the
        failure, reports the completed denominator, and says which runs were excluded and why. A
        question with 2 completed runs is not the same as 2 of 3, and a question with 0 completed
        runs has no finding at all.
      </p>
      <p>
        This is why the workbook matters as much as the prose. A row per run, with the raw answer and
        the failure code where there is one, is what lets a reader recompute the count. A summary
        that only shows 2 of 3 without the runs behind it is a number with no audit trail.
      </p>

      <h2>What this site does</h2>
      <p>
        The free scan reads a page; it does not measure mentions, and it does not claim to. The paid
        measurement is the part that runs a question bank: 25–30 questions, three runs each in a
        fresh session, answers recorded verbatim, counts written as x of n and never as a
        percentage. The deliverable spec says the same thing in one line: every number in the report
        has to be traceable to the rows in the workbook that produced it.
      </p>
      <p>
        There is no score out of 100 for that measurement, on purpose. Three runs per question
        cannot support one, and a score would invite exactly the comparison the data cannot carry.
      </p>

      <h2>How to keep a count honest</h2>
      <pre>{`# The shape of a run log: one row per run, never one row per question
question_id, run, mentioned, cited_url, error_code, answer_excerpt
Q1, 1, yes, example.com, , "..."
Q1, 2, yes, , , "..."
Q1, 3, no, , 429, ""

# The count is a group-by, not a stored percentage
SELECT question_id,
       SUM(CASE WHEN mentioned = 'yes' THEN 1 ELSE 0 END) AS mentioned,
       COUNT(CASE WHEN error_code = '' THEN 1 END) AS completed
FROM runs
GROUP BY question_id;`}</pre>
      <p>
        Two rules make the table trustworthy. Keep the raw answer next to the label, so a disputed
        count can be checked against the text. And keep the failure code, so a denominator never
        silently shrinks.
      </p>

      <h2>What the count buys</h2>
      <p>
        It buys a claim that can be checked: the reader can see the denominator, the date, the model
        and the prompt, and can decide how much weight to put on it. It also buys the ability to
        combine questions without inventing a statistic. What it does not buy is precision, a
        ranking, or a prediction — three runs describe three runs.
      </p>
      <p>
        The standard is the same as everywhere else in this series: publish the count, keep the
        denominator visible, and say what the measurement does not cover.
      </p>
    </PostShell>
  );
}
