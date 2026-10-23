import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import AuthorLine from "@/app/components/AuthorLine";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { og } from "@/lib/og";
/**
 * The comparison hub.
 *
 * WHY THIS PAGE EXISTS: the scanner answers one question and readers arrive with
 * several, all phrased as "AI visibility". A page that lists the four measurements
 * side by side is the difference between a visitor who buys the wrong one and a
 * visitor who knows which question they actually have - and comparison pages are
 * the format generative answers quote most often, so the hub is also the entry
 * point the two detail pages need.
 *
 * WHY THE TABLE IS THE CENTRE OF THE PAGE RATHER THAN THE PROSE: the four
 * measurements are consistently confused, not because any of them is obscure, but
 * because their descriptions share nouns. A table forces the rows into the same
 * three questions - what data it needs, what it answers, what it cannot see - and
 * the last column is the one that decides the choice.
 */
const TITLE = "Which measurement do you need?";
const DESCRIPTION =
  "Readiness audits, brand-mention tracking, rank tracking and crawler analytics answer different questions. A table for choosing between them.";

/**
 * The counts are imported rather than typed, for the reason /tools/ states: a
 * number written into prose is a second copy of that number, and the two drift the
 * first time a check is added. The page publishes these values in the FAQ, so they
 * have to be the catalogue's own.
 */
const CHECK_COUNT = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;
/**
 * A dimension's share of the score, read from the catalogue. The two weights this
 * page names in prose are imported for the usual reason: a percentage typed into a
 * sentence is a second copy of a number, and it survives the next re-weighting.
 */
const dimensionWeight = (id: string) =>
  DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;

/**
 * The page's review date, not the date any measurement was taken. There is no
 * measurement on this page - it describes four methods - so the byline says when
 * the description was last checked against them.
 */
const REVIEWED = "2026-10-23";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/compare/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/compare/",
  }),
};

export default function CompareHubPage() {
  return (
    <ProsePage
      eyebrow="Comparison"
      title={TITLE}
      description={
        <p>
          Four different measurements get called &ldquo;AI visibility&rdquo;. They use different data,
          they can disagree with each other, and no one of them replaces the rest. This page is the
          map: what each one answers, what it needs, and where it stops.
        </p>
      }
      action={{ href: "/", label: "← Back to the scanner" }}
      width="4xl"
    >
      <div className="space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
        <AuthorLine date={REVIEWED} label="Last reviewed" />

        <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
          <p>
            The question is usually stated as &ldquo;how visible am I in AI search?&rdquo;, and that
            phrasing hides the choice. A site can be perfectly readable to a crawler and never
            mentioned; it can be named in answers while the cited page belongs to somebody else;
            it can rank first in conventional search and be absent from the assistant panel above
            it. Each of those is a different measurement, and measuring the wrong one is how a
            team spends a quarter improving a number that does not describe the problem.
          </p>
          <p>
            This page puts the four measurements side by side. The two that are most often confused
            with each other have their own pages, linked in the table and again at the end.
          </p>

          <h2>What are the four measurements?</h2>
          <p>
            Each row is something a reader might buy, build or run by hand. The column that settles
            most arguments is the last one.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Measurement</th>
                  <th>The question it answers</th>
                  <th>The data it needs</th>
                  <th>What it cannot tell you</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <Link href="/report/">Readiness audit</Link>{" "}
                    <span className="text-[var(--ink-3)]">(this site)</span>
                  </td>
                  <td>Can a crawler reach this page, parse it, and find what an answer would need?</td>
                  <td>
                    Your URLs fetched once, plus robots.txt, llms.txt and the sitemap; the page
                    response is scored against published rules.
                  </td>
                  <td>Whether any engine actually mentions or cites you. It measures readiness, not answers.</td>
                </tr>
                <tr>
                  <td>
                    <Link href="/compare/llm-mentions-api/">Brand-mention tracking</Link>
                  </td>
                  <td>Is my brand named in AI answers, how often, and in what context?</td>
                  <td>
                    A question set and access to model responses, a brand name and its aliases, and
                    a way to count appearances over time.
                  </td>
                  <td>
                    Whether the pages being cited are yours, or why a mention appeared. A mention
                    is not a citation.
                  </td>
                </tr>
                <tr>
                  <td>Rank tracking</td>
                  <td>Where do my pages appear in conventional search results for a keyword set?</td>
                  <td>
                    Search result pages for the keywords, country and language you care about,
                    collected on a schedule.
                  </td>
                  <td>
                    Whether an assistant quotes or recommends you. A rank position and an answer
                    are different surfaces, and the answer can cite nobody.
                  </td>
                </tr>
                <tr>
                  <td>Crawler and server-log analytics</td>
                  <td>Which AI crawlers fetch my pages, when, and what did they receive?</td>
                  <td>
                    Your own server or CDN logs: user agent, path, status code and timestamp. This
                    is the only one of the four measured on infrastructure you control.
                  </td>
                  <td>
                    Whether a crawl became a citation. Crawlers fetch far more pages than any engine
                    quotes, and a 200 in a log is not a mention.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Which measurement should I start with?</h2>
          <p>
            Start with the one whose failures you can fix yourself. That is usually the readiness
            audit, because it reads pages you control and every failed check names an edit.
          </p>
          <ol>
            <li>
              <strong>If crawler access is unknown, audit first.</strong> It is free here, it reads
              one URL, and every rule it applies is published with its points on the{" "}
              <Link href="/methodology/">methodology page</Link>. A blocked crawl makes the other
              three measurements describe a page no engine can read.
            </li>
            <li>
              <strong>If the pages are readable and the question is presence,</strong> you need
              brand-mention tracking. It answers a different question from a different data source,
              and the{" "}
              <Link href="/compare/llm-mentions-api/">comparison with DataForSEO&rsquo;s product</Link>{" "}
              sets out where the boundary is.
            </li>
            <li>
              <strong>If search traffic still pays the bills,</strong> rank tracking remains a real
              measurement of the surface your customers still click on. It simply is not a
              measurement of assistant answers.
            </li>
            <li>
              <strong>If you suspect a crawler is turned away at the edge,</strong> read the logs.
              Your CDN is the only place a 403 aimed at a bot is visible, which is why the{" "}
              <Link href="/study/">study</Link> uses a browser-shaped second request to tell a
              policy block from a network block.
            </li>
          </ol>

          <h2>Can one measurement stand in for another?</h2>
          <p>
            No. The four sit at different points in the same pipeline, and each one is blind
            exactly where the next one starts. A readiness score cannot see an answer. A mention
            count cannot see the page that was cited. A rank position cannot see a recommendation.
            A crawl log cannot see a citation.
          </p>
          <p>
            That is why the useful comparison content here is about choosing between them rather
            than about declaring a winner. The scanner runs {CHECK_COUNT} checks across{" "}
            {DIMENSION_COUNT} weighted dimensions, and AI crawler access alone is{" "}
            {dimensionWeight("ai-crawler-access")}% of the score because a page that cannot be
            fetched cannot be read. The AI context file, by contrast, carries{" "}
            {dimensionWeight("llms-txt")}% of the score - a real signal, deliberately small. Those
            weights describe readiness; they say nothing about whether an engine will pick you.
          </p>

          <h2>Where do these pages go next?</h2>
          <ul>
            <li>
              <Link href="/compare/llm-mentions-api/">
                LLMention GEO Scanner vs DataForSEO&rsquo;s LLM Mentions API
              </Link>{" "}
              — the two products whose names are most often confused, compared on data source, unit
              of result and blind spots.
            </li>
            <li>
              <Link href="/compare/readiness-vs-mention-tracking/">
                Can AI cite you, or is it already doing so?
              </Link>{" "}
              — the conceptual version: why readiness is upstream of mentions, and how to use both
              in the right order.
            </li>
            <li>
              <Link href="/methodology/">The methodology</Link> — every rule, its weight and its
              pass condition, from the same catalogue the scanner runs.
            </li>
            <li>
              <Link href="/report/">Run the audit</Link> — the free measurement this site provides,
              with the failed checks listed against the evidence each one saw.
            </li>
          </ul>
        </article>

        <Faq
          title="Questions about choosing a measurement"
          items={[
            {
              q: "Is a readiness score the same as AI visibility?",
              a: "No. A readiness score is a statement about your pages: whether a crawler can reach them and whether they carry what an answer needs. AI visibility is a statement about answers: whether an engine named you. A page can be ready and unmentioned, and a mention can happen without the cited page being yours.",
            },
            {
              q: "Do I need all four measurements?",
              a: "Almost certainly not. Start with the readiness audit, because it is free and its failures are fixable on your own pages. Add mention tracking when you have pages worth citing, rank tracking if search traffic still matters, and log analytics only if you suspect a crawler is being turned away.",
            },
            {
              q: "Which of the four does this site run?",
              a: `The readiness audit: ${CHECK_COUNT} checks over ${DIMENSION_COUNT} weighted dimensions, run against one URL at a time. It does not query an engine, count mentions or read your server logs, so three of the four rows above describe measurements this site deliberately does not sell.`,
            },
          ]}
        />

        <Evidence
          quote={GEO_PRIMARY_QUOTE}
          attribution="Generative Engine Optimization, KDD 2024"
          attributionUrl="https://arxiv.org/abs/2311.09735"
          sources={GEO_PRIMARY_SOURCES}
          note="The readiness weights follow that measurement, not taste. What the score cannot see is stated on the methodology page rather than implied by the number."
        />
      </div>
    </ProsePage>
  );
}
