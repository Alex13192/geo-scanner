import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import AuthorLine from "@/app/components/AuthorLine";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { social } from "@/lib/og";

/**
 * The conceptual comparison: citable versus cited.
 *
 * WHY THIS PAGE EXISTS: it is the explanation the two product pages need and neither
 * can carry. /compare/llm-mentions-api/ is about two specific products; this is about
 * the two questions any of them answer, and why "my score is high" and "I am being
 * mentioned" are not the same sentence. It is also the page a reader should land on
 * before deciding to buy either kind of measurement.
 *
 * WHY IT USES NO THIRD-PARTY CLAIMS: the distinction is a logical one - an input is
 * not an outcome - and it does not depend on what any vendor says. The only external
 * evidence needed is the GEO research, which is already the site's standing citation
 * for the citability weighting. Inventing a competitor's position would make the
 * page weaker, not stronger.
 */
const TITLE = "Can AI cite you? Readiness vs mention tracking";
const DESCRIPTION =
  "Readiness and mention tracking answer different questions: can AI cite your pages, and is it already doing so? Why the order matters, and how to use both.";

/**
 * The two weights named below are read from the catalogue rather than typed, for
 * the reason the other comparison pages state: a number in prose is a second copy of
 * a number the scanner computes, and the copy drifts first.
 */
const dimensionWeight = (id: string) =>
  DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;

const REVIEWED = "2026-10-23";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/compare/readiness-vs-mention-tracking/" },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/compare/readiness-vs-mention-tracking/",
  }),
};

export default function ReadinessVsMentionsPage() {
  return (
    <ProsePage
      eyebrow="Comparison"
      title={TITLE}
      description={
        <p>
          &ldquo;Can I be cited?&rdquo; and &ldquo;am I being cited?&rdquo; are two questions, not
          one. Readiness is upstream of mentions, which is why a page can be ready and still go
          unmentioned, and why auditing first and monitoring second works better than the reverse.
        </p>
      }
      action={{ href: "/compare/", label: "← All comparisons" }}
      width="4xl"
    >
      <div className="space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
        <AuthorLine date={REVIEWED} label="Last reviewed" />

        <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
          <p>
            Two questions get asked as if they were one: can AI engines cite my pages, and are
            they already doing so? The first is a property of your site, and you can inspect it
            today. The second is an observation about answers you do not control, on a question
            set you did not choose, at a moment that has already passed. Treating either as a
            proxy for the other is where most bad AI-visibility dashboards start.
          </p>

          <h2>What is the difference between being citable and being cited?</h2>
          <p>
            Citable is a state your page is in: a crawler can reach it, a parser can read it, and
            it contains something an answer could lift - a fact, a quotation, a direct answer to a
            question someone asks. Cited is an event: a specific engine, answering a specific
            question, used your page.
          </p>
          <p>
            The first can be checked before any answer exists. The second cannot be checked at all
            until the engine answers, and even then the answer is one sample from a system that may
            answer differently tomorrow. That asymmetry is the whole reason the two measurements
            are separate products.
          </p>

          <h2>Why is readiness upstream of mentions?</h2>
          <p>
            A generative answer is assembled in stages, and a page can drop out at any of them. The
            scanner measures only the first two; a mention measurement observes only the last.
          </p>
          <ol>
            <li>
              <strong>Retrieval.</strong> The engine or its crawler fetches pages it considers
              candidates. A robots.txt disallow, a firewall rule or a noindex directive ends the
              chain here.
            </li>
            <li>
              <strong>Parsing and selection.</strong> The engine reads what it got and decides which
              passages answer the question. Entity markup, heading structure, answer-first
              paragraphs and extractable facts are what make that decision possible.
            </li>
            <li>
              <strong>Generation.</strong> The chosen sources are used to write the answer. This is
              where a mention or a citation can happen.
            </li>
            <li>
              <strong>Attribution.</strong> The engine may name the brand, link the page, or do
              neither. A mention without a citation is common, and it is why mention tracking and
              readiness cannot be read off one another.
            </li>
          </ol>
          <p>
            Readiness is upstream because it removes the reasons not to cite you. It does not create
            demand, authority, or a question your page answers better than somebody else&rsquo;s.
          </p>

          <h2>Can a page be ready and still go unmentioned?</h2>
          <p>
            Yes, routinely. A page can pass every check this scanner runs and still never appear in
            an answer, for reasons that have nothing to do with its markup.
          </p>
          <ul>
            <li>
              <strong>Competition.</strong> Another page may answer the question better, or be more
              recent, or be the source the engine retrieves first.
            </li>
            <li>
              <strong>Query demand.</strong> If nobody asks the question your page answers, there is
              no answer for it to appear in. Readiness cannot create a market.
            </li>
            <li>
              <strong>Index lag.</strong> Crawling, indexing and retrieval are not instant, and a
              page published last week may simply not be in the pool yet.
            </li>
            <li>
              <strong>Third-party sourcing.</strong> An answer can name your brand from a review
              site, a forum thread or a news article. Your own page being absent is not necessarily
              your brand being absent.
            </li>
            <li>
              <strong>Unattributed use.</strong> An engine can reuse your facts without naming the
              domain. A mention tracker may miss a use that readiness made possible.
            </li>
          </ul>

          <h2>Can a page be mentioned without being ready?</h2>
          <p>
            Also yes, and the two failure modes should not be confused. The mentions that arrive
            without a citable page are usually brand mentions from third parties - a review, a
            comparison, a directory listing. They are evidence that the brand exists in the
            conversation, not evidence that the site is ready to be the source.
          </p>
          <p>
            That gap is common and it is not a paradox: the engine is naming what it learned about
            you elsewhere, while the page that could support the claim is blocked, thin or
            unparseable. Fixing the page is the only way to move the second kind of mention.
          </p>

          <h2>How do I use both together?</h2>
          <p>
            Audit first, monitor second. The order is not arbitrary: an audit produces edits, and a
            monitor produces a number that cannot be acted on until the pages behind it are fixed.
          </p>
          <ol>
            <li>
              <strong>Fix access first.</strong> Unblock the crawlers before measuring anything. A
              site that fails its own crawl checks is measuring the block, not the content.
            </li>
            <li>
              <strong>Then fix what a parser reads.</strong> Entity markup, question-shaped
              headings, short opening answers, numerals and quotations. The{" "}
              <Link href="/methodology/">methodology page</Link> publishes the weights so the order
              of the work is visible rather than guessed.
            </li>
            <li>
              <strong>Record a baseline.</strong> Ask a fixed set of questions by hand, save the
              answers with the date, and keep the question set unchanged. The{" "}
              <Link href="/docs/ai-visibility-self-check/">self-check guide</Link> is the
              do-it-yourself version of this step.
            </li>
            <li>
              <strong>Then monitor.</strong> Repeat the same questions on a schedule. A mention
              count is only meaningful against a baseline you defined before you started changing
              the page.
            </li>
            <li>
              <strong>When a mention appears, find the cited URL.</strong> Audit that page rather
              than the homepage. The page an engine chose is the one worth making stronger.
            </li>
          </ol>

          <h2>What does each measurement actually measure?</h2>
          <p>
            The parallel is easiest to hold in one table. The last two rows are the ones the two
            measurements disagree about, and the disagreement is the point.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Readiness audit</th>
                  <th>Mention tracking</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>What it measures</td>
                  <td>The state of your pages: access, structure, and whether an answer could lift a claim from them.</td>
                  <td>The presence of a brand in AI answers, counted over a set of prompts and a period of time.</td>
                </tr>
                <tr>
                  <td>What it needs</td>
                  <td>One URL per page, fetched the way a crawler would. No account for this site's audit.</td>
                  <td>A question set, access to model responses, and a brand definition that includes aliases and misspellings.</td>
                </tr>
                <tr>
                  <td>What it cannot tell you</td>
                  <td>Whether an engine will actually name or cite you.</td>
                  <td>Whether the cited page is yours, or whether a page that is never cited could even be crawled.</td>
                </tr>
                <tr>
                  <td>When it is the right tool</td>
                  <td>Before there is any evidence of citations, and whenever a page changes.</td>
                  <td>After there is content worth mentioning, to see whether it is surfacing.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>What can this site tell me, and what can it not?</h2>
          <p>
            This site runs the readiness audit: {DIMENSION_CATALOG.length} weighted dimensions, in
            which AI crawler access is {dimensionWeight("ai-crawler-access")}% of the score and the
            AI context file is {dimensionWeight("llms-txt")}% - a deliberately small weight for a
            file whose effect no engine has committed to. It reports a score, a grade and the list
            of failed checks with the evidence each check saw.
          </p>
          <p>
            It does not query an engine, so it cannot tell you whether you are mentioned, cited or
            recommended. That boundary is stated in the scanner&rsquo;s own{" "}
            <Link href="/about/">about page</Link> and demonstrated in the{" "}
            <Link href="/study/">30-homepage study</Link>, where no AI engine was queried and no
            row is a measurement of what ChatGPT, Claude or Perplexity actually say.
          </p>

          <h2>Where should I start?</h2>
          <p>
            Run the free audit on the page you most want cited. Fix what it reports, and note which
            failures were real rather than page-type artefacts -{" "}
            <Link href="/insights/reading-a-failed-check/">reading a failed check</Link> is the
            guide for that judgement. Then, if you have content worth mentioning, set up a mention
            measurement against the fixed baseline.
          </p>
          <p>
            The product comparison is on the{" "}
            <Link href="/compare/llm-mentions-api/">
              LLMention vs DataForSEO&rsquo;s LLM Mentions API
            </Link>{" "}
            page. The four-measurement map, including rank tracking and crawler logs, is on the{" "}
            <Link href="/compare/">comparison hub</Link>.
          </p>
        </article>

        <Faq
          title="Questions about readiness and mentions"
          items={[
            {
              q: "Does a high readiness score guarantee I will be cited?",
              a: "No. The score says the page is in a state that makes citation possible; it does not say the engine retrieved it, preferred it, or had a question to answer with it. A ready page that answers a question nobody asks will go unmentioned, and the audit cannot see that.",
            },
            {
              q: "If I already see mentions, do I still need an audit?",
              a: "Usually yes, but for a different reason. Existing mentions often come from third-party sources rather than your own pages. An audit shows whether your page is in a state to be the source, which is the part you control and the part that compounds when the third-party coverage stops.",
            },
            {
              q: "Which should I do first?",
              a: "Audit first, monitor second. The audit's output is a list of edits on your own pages; a monitor's output is a number you cannot act on until those pages are fixed. Monitoring before the audit often measures a crawler block and calls it a content problem.",
            },
          ]}
        />

        <Evidence
          quote={GEO_PRIMARY_QUOTE}
          attribution="Generative Engine Optimization, KDD 2024"
          attributionUrl="https://arxiv.org/abs/2311.09735"
          sources={GEO_PRIMARY_SOURCES}
          note="Readiness scoring follows that measurement rather than taste. What it cannot see - whether an engine actually names you - is stated on this page and on the methodology page rather than left out of the number."
        />
      </div>
    </ProsePage>
  );
}
