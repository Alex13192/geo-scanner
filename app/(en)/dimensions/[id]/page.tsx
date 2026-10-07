import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import Faq from "@/app/components/Faq";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";

import { og } from "@/lib/og";

/**
 * A dimension's weighting sentence with the comparison to other dimensions removed.
 *
 * DIMENSION_CATALOG writes each weighting as a ranking argument, because /methodology/
 * shows all twelve side by side and that is where the ranking means something: "Highest
 * weight of the twelve", "Second highest", "Lowest". Repeated verbatim on the page for one
 * dimension it reads as a fragment, so the comparative opening sentence is dropped and the
 * reasoning behind the number is kept word for word. Nothing is rewritten - the sentence
 * that does not survive the move is the only thing that goes.
 */
function weightingAlone(weighting: string): string {
  const sentences = weighting.split(/(?<=\.)\s+/);
  const comparative =
    /^(highest|second highest|lowest|low to moderate|moderate|substantial|sub-)/i.test(sentences[0]);
  return (comparative ? sentences.slice(1) : sentences).join(" ").trim();
}

/**
 * One sentence, for a list of them.
 *
 * Used for the per-rule answers below: a rule's text is written to be exact rather than
 * short, and several of them run to three or four sentences. The first sentence is the part
 * that states what the check tests, and the full wording is one link away on the rule page.
 * A string with no full stop before a space (an abbreviation, or a rule written as one
 * clause) is returned whole rather than cut at the wrong place.
 */
function firstSentence(text: string): string {
  const match = text.match(/^[\s\S]*?\.(?=\s|$)/);
  return (match ? match[0] : text).trim();
}

/**
 * One page per scoring dimension.
 *
 * WHY THIS EXISTS. The homepage's twelve cards said "16% of the score" and nothing else, under a
 * heading arguing that "a score you cannot interrogate is a score you cannot act on". They linked
 * to an anchor on /methodology/, which was an improvement on being inert - but the anchor lands in
 * the middle of a long page, and the reader still has to find the rules that produce the number.
 *
 * WHY IT IS ONE FILE AND NOT TWELVE. Everything a dimension page needs was already written and
 * already in one place: the label, the weight, the rationale for the dimension, the reasoning
 * behind the weighting, and the rules themselves. Twelve hand-written pages would have been twelve
 * copies of the same layout, twelve chances to fall behind the catalog, and twelve places to fix a
 * typo. This generates all of them from DIMENSION_CATALOG, so adding a dimension to the catalog
 * adds its page and cannot leave one behind.
 *
 * The rule list is filtered from the same CHECK_CATALOG that the scanner scores against, which is
 * the property that matters: a page describing the rules cannot describe rules the engine does not
 * apply.
 */

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return DIMENSION_CATALOG.map((dimension) => ({ id: dimension.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const dimension = DIMENSION_CATALOG.find((d) => d.id === id);
  if (!dimension) return {};

  const title = `${dimension.label}: ${dimension.weight}% of the GEO score`;
  const description = dimension.rationale;

  return {
    title,
    description,
    alternates: { canonical: `/dimensions/${dimension.id}/` },
    openGraph: og({ title, description, url: `/dimensions/${dimension.id}/` }),
  };
}

export default async function DimensionPage({ params }: Params) {
  const { id } = await params;
  const dimension = DIMENSION_CATALOG.find((d) => d.id === id);

  /*
   * A dimension id that is not in the catalog is a 404 rather than an empty page. The list is
   * generated from the same catalog, so this only fires for a hand-typed URL - and an empty page
   * at a real-looking address is worse than a missing one.
   */
  if (!dimension) notFound();

  const checks = CHECK_CATALOG.filter((check) => check.dimension === dimension.id && !check.alias);

  /*
   * `points` is a check's share WITHIN its dimension, not of the total, so it cannot be printed
   * with a percent sign - 12 points of a 100-point dimension is not 12% of a 97 score. The number
   * a reader wants is what failing this one rule costs overall: the check's share of its dimension
   * multiplied by the dimension's weight.
   *
   * Alias entries are excluded above and so do not inflate the denominator. They document the other
   * outcome of the same check rather than an extra one, so counting them would make every real rule
   * look cheaper than it is.
   */
  const dimensionPoints = checks.reduce((sum, check) => sum + check.points, 0) || 1;
  const shareOfTotal = (points: number) => ((points / dimensionPoints) * dimension.weight).toFixed(1);

  /*
   * QUESTIONS BUILT FROM THIS DIMENSION, NOT COPIED ACROSS TWELVE PAGES.
   *
   * The same questions on every dimension page would be the definition of thin content -
   * which is the rule these pages are scored against in the first place. The shape of this project
   * makes the honest version cheap: the rationale, the weighting, the rule text and the point
   * values are already written per dimension and per rule, so the answers are what those fields
   * say rather than new prose that would drift away from them.
   *
   * WHERE EACH ANSWER COMES FROM, one field per question:
   *   what a rule tests         check.rule, first sentence only (lib/geo/catalog.ts)
   *   what the dimension is     dimension.rationale, verbatim
   *   why this weight           dimension.weighting, comparison removed (weightingAlone)
   *   what a failure costs      the points printed beside each rule on this page, stated as
   *                             arithmetic on two catalogue numbers
   *
   * THE LAST ANSWER IS THE ONE OTHER TOOLS CANNOT GIVE. Every rule carries a point value that
   * comes from the same catalogue the analyser reads, so the cost of failing it can be printed
   * next to the rule instead of asserted. Nothing in these answers is a measurement of the
   * reader's site - that is what the scan is for, and the answer says so.
   *
   * A rule's text is written to be exact rather than short, so only its first sentence is used
   * and the full wording is one link away. An answer that would still run past the 80-word
   * opener this site's own answer-first rule reads is left out rather than truncated: the
   * question goes with it, because a question whose answer is missing is worse than no question.
   */
  const withinAnswerLength = (text: string) => text.split(/\s+/).length <= 80;
  const heaviest = checks.slice().sort((a, b) => b.points - a.points)[0];

  const faqItems = [
    ...checks.slice(0, 6).map((check) => ({
      q: `${CHECK_COPY[check.id]?.title ?? check.id} — what does it test?`,
      a: firstSentence(check.rule),
    })),
    { q: `What does the ${dimension.label} dimension measure?`, a: dimension.rationale },
    {
      q: `Why is ${dimension.label} worth ${dimension.weight}% of the score?`,
      a: weightingAlone(dimension.weighting),
    },
    {
      q: `What does failing ${dimension.label} cost?`,
      a: `Each rule carries a share of the ${dimension.weight}% this dimension is worth, and the share is printed beside every rule above. The most one failure can cost is ${shareOfTotal(
        heaviest.points
      )}% of the total score, for ${CHECK_COPY[heaviest.id]?.title ?? heaviest.id}. A scan of your own page reports which of these rules it currently fails.`,
    },
  ].filter((item) => withinAnswerLength(item.a));

  const index = DIMENSION_CATALOG.findIndex((d) => d.id === dimension.id);
  const next = DIMENSION_CATALOG[(index + 1) % DIMENSION_CATALOG.length];

  /*
   * THE "HOW TO IMPROVE IT" SEQUENCE, BUILT THE SAME WAY THE RULE PAGES BUILD THEIRS.
   *
   * One step per rule, in points order, and the step's name IS the rule text from
   * lib/geo/catalog.ts: the catalogue already states each condition in the imperative -
   * "Parsing robots.txt into user-agent groups, none of gptbot ... is disallowed from /" -
   * so a second, shorter wording would be a paraphrase of a published rule on the page
   * whose job is to publish it exactly. The two fields the step carries are both from the
   * catalogue and neither is reworded: `name` is the rule, and `text` adds what a non-pass
   * means where the catalogue states one.
   *
   * The HowTo is serialised into the JSON-LD and rendered as the <ol> beneath it from the
   * same array, so the structured data and the visible prose cannot say different things.
   * The order is by points rather than by the catalogue's grouping order, because on a page
   * about one dimension the useful order is the one that puts the expensive rules first.
   */
  const orderedChecks = checks.slice().sort((a, b) => b.points - a.points);
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to improve ${dimension.label}`,
    /* The dimension's own rationale, verbatim from DIMENSION_CATALOG. */
    description: dimension.rationale,
    step: orderedChecks.map((check, position) => ({
      "@type": "HowToStep",
      position: position + 1,
      name: check.rule,
      text: check.onFail ? `${check.onFail} Worth ${shareOfTotal(check.points)}% of the total score.` : `Worth ${shareOfTotal(check.points)}% of the total score.`,
    })),
  };

  return (
    <ProsePage
      eyebrow={`Dimension ${String(index + 1).padStart(2, "0")} of ${DIMENSION_CATALOG.length}`}
      title={dimension.label}
      description={
        <p>
          {dimension.weight}% of the total score, decided by the {checks.length} published{" "}
          {checks.length === 1 ? "rule" : "rules"} listed below.
        </p>
      }
      meta={`${checks.length} rules · ${dimension.weight}% of the score`}
      action={{ href: "/methodology/", label: "← Full methodology" }}
    >
      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>Why this dimension exists</h2>
        <p>{dimension.rationale}</p>

        <h2>Why it carries {dimension.weight}%</h2>
        {/*
          The comparison to the other eleven is removed here and only here: the sentence that
          carries it belongs on /methodology/, where all twelve are visible. The reasoning
          behind the number is kept word for word - see weightingAlone above.
        */}
        <p>{weightingAlone(dimension.weighting)}</p>

        <h2>How to improve it</h2>
        {/*
          The HowTo, in the same order as the JSON-LD above it. Each step is the rule's own
          text, so a reader can compare the numbered advice against the rule list directly
          below and see that they are the same sentences.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
        />
        <ol>
          {orderedChecks.map((check) => (
            <li key={check.id}>
              {check.rule}
              {check.onFail ? <em> {check.onFail}</em> : null}{" "}
              <span className="font-mono text-xs text-[var(--ink-3)]">
                {shareOfTotal(check.points)}% of the total score
              </span>
            </li>
          ))}
        </ol>

        <h2>The rules it is scored by</h2>
        <p>
          Each rule is a single question the scanner asks about a page. Passing one adds its share of
          this dimension; failing it takes that share away. Every rule links to what it looks for and
          what evidence passes it.
        </p>

        <ul className="not-prose mt-6 space-y-2.5">
          {checks.map((check) => (
            <li key={check.id}>
              <Link
                href={`/checks/${check.id}/`}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[15px] transition-colors hover:border-[var(--ink-3)]"
              >
                <span className="text-[var(--ink-1)]">{check.rule}</span>
                <span className="shrink-0 font-mono text-xs text-[var(--ink-3)]">
                  {shareOfTotal(check.points)}%
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h2>What this dimension cannot tell you</h2>
        <p>
          A single-URL scan reads one page. It cannot see the rest of the site, it cannot see how a
          model behaves over time, and it cannot see whether the page is actually cited for the
          queries that matter. Those are the parts of the picture a score of this kind is blind to,
          and they are listed in full on the{" "}
          <a href="/methodology/">methodology page</a> rather than implied here.
        </p>
      </article>

      <div className="mt-16 space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
        <Faq title={`Questions about ${dimension.label}`} items={faqItems} level="h3" />
        <Evidence
          quote={GEO_PRIMARY_QUOTE}
          attribution="Generative Engine Optimization, KDD 2024"
          attributionUrl="https://arxiv.org/abs/2311.09735"
          sources={GEO_PRIMARY_SOURCES}
          note={`The weighting behind this dimension follows that measurement. A failure here is reported as a rule rather than a score, so it can be checked against the page instead of taken on trust.`}
        />
      </div>

      <nav
        aria-label="Dimensions"
        className="mt-14 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-6 text-[15px]"
      >
        <Link href="/methodology/" className="text-[var(--accent)] hover:opacity-75">
          ← All twelve dimensions
        </Link>
        <Link href={`/dimensions/${next.id}/`} className="text-[var(--accent)] hover:opacity-75">
          {next.label} →
        </Link>
      </nav>
    </ProsePage>
  );
}

