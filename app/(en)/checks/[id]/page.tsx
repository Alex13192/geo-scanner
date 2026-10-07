import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { checkPageDescription, checkPageTitle } from "@/lib/geo/check-meta";
import { guidePathForCheck } from "@/lib/geo/check-links";
import ProsePage from "@/app/components/ProsePage";
import Faq from "@/app/components/Faq";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import { og } from "@/lib/og";

/**
 * The readable name of a fix branch, used as the step's name in the HowTo below.
 *
 * Every string it builds on comes from lib/geo/check-copy.ts, which is generated from the
 * analyser by scripts/generate-check-copy.mts: `fail` is the branch's own value, and the
 * rest of the sentence is the branch's own fix text. Nothing about the fix is restated
 * here, so the steps and the rules they lead to cannot describe different things.
 */
function stepName(when: string, text: string): string {
  if (when === "fail") return text;
  return `If the check is ${when === "partial" ? "partially passed" : when}: ${text}`;
}

/**
 * A dimension's weighting sentence as it reads on a page that shows one dimension.
 *
 * The catalogue writes each weighting as if the reader can see all twelve at once - "Second
 * highest.", "Lowest weight of the twelve." - and /methodology/ does show all twelve, so the
 * phrasing is right there. On a single rule page it is not: a reader told that something is
 * "second highest" has nothing to rank it against. The comparative sentence is therefore
 * dropped and the reasoning that follows it is kept verbatim, which is the part that answers
 * the question. Nothing is reworded; only a sentence that does not survive the move is left
 * behind. Eleven of the twelve weightings survive it.
 *
 * The second return value is false when what remains is not an answer on its own, so the
 * caller can leave the question out instead of publishing a fragment.
 */
function weightingAlone(weighting: string): { text: string; usable: boolean } {
  const sentences = weighting.split(/(?<=\.)\s+/);
  const comparative =
    /^(highest|second highest|lowest|low to moderate|moderate|substantial|sub-)/i.test(sentences[0]);
  const kept = (comparative ? sentences.slice(1) : sentences).join(" ").trim();
  return { text: kept, usable: kept.length > 0 };
}

/**
 * /checks/<id>/ - one page per published rule.
 *
 * WHY THESE PAGES EXIST: the methodology page publishes every rule, weight and pass
 * condition in one document, which is the right shape for somebody checking the
 * method and the wrong shape for somebody who has just been told that one check
 * failed. This is the page that failure links to.
 *
 * WHAT IS ON THE PAGE COMES FROM TWO SOURCES, AND NEITHER IS WRITTEN HERE:
 *   lib/geo/catalog.ts     the rule, what a failure means, the note, the points,
 *                          and the dimension it belongs to with its weighting
 *   lib/geo/check-copy.ts  the title and the fix text, generated from the analyser
 *                          by scripts/generate-check-copy.mts
 * Nothing about a check's behaviour is restated in this file, so a rule cannot be
 * described one way here and executed another way in the scanner. The tests assert
 * that the generated copy covers every catalogued check.
 *
 * Static by construction: generateStaticParams below enumerates every non-alias
 * catalogue entry, so all of these are prerendered at build time and the CI gate
 * scores them along with everything else.
 *
 * THE ONE SCANNER RULE THESE PAGES STILL DO NOT FULLY PASS is word-count, and the number
 * is recorded here so the next person does not read it as an oversight. A rule page renders
 * the rule, what a failure means, the note if the catalogue carries one, the fix sequence,
 * the weighting arithmetic, the sibling rules, the dimension it belongs to, its FAQ and the
 * evidence block - between 599 and 1,121 words of visible text, measured on the built site,
 * depending on how much the catalogue has to say about the rule. Thirty-five of the forty
 * land in the 300-799 band, which the published rule scores as a partial pass worth 3 of the
 * 5 points, so they score 96 rather than 98.
 *
 * WHAT WAS DONE ABOUT IT, AND WHAT WAS REFUSED. The proposal was to tier the word-count
 * threshold by rule type, so that a rule whose published content is one sentence is not held
 * to a content page's length. It was refused, because every basis the tier could be derived
 * from is either the catalogue prose the page is generated from - in which case the threshold
 * is a function of the quantity it measures and no page in the family can fail it - or a
 * property unrelated to how much there is to say, in which case it inverts the two ends of the
 * catalogue. Both are the same thing: the measuring stick chosen by measuring the thing it has
 * to pass. What was done instead is that every check now publishes the reading and the scoring
 * band it was missing, in lib/geo/catalog.ts, and the pages that are still short are short
 * because their rule genuinely contains one sentence. See the notes on `note` in that file.
 *
 * check-built-pages.mts sets their floor below an A and says why.
 */
export function generateStaticParams() {
  return CHECK_CATALOG.filter((check) => !check.alias).map((check) => ({ id: check.id }));
}

function findCheck(id: string) {
  return CHECK_CATALOG.find((check) => check.id === id && !check.alias) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const check = findCheck(id);
  if (!check) return {};

  // Built in lib/geo/check-meta.ts so the tests can assert that every one of the 40
  // lands inside the 15-65 / 50-160 ranges this site publishes and scores against.
  const title = checkPageTitle(id);
  const description = checkPageDescription(id);

  return {
    title,
    description,
    alternates: {
      canonical: `/checks/${check.id}/`,
      /*
       * Rendered by Next as <link rel="alternate" type="text/markdown" href="...">.
       * Using the metadata API rather than writing the link by hand keeps the
       * declaration and the route that serves it described in one place, and the
       * route renders from the same catalogue this page does - so the twin cannot
       * disagree with the page it mirrors.
       */
      types: { "text/markdown": `/checks/${check.id}/markdown/` },
    },
    openGraph: og({ title, description, url: `/checks/${check.id}/`, type: "article" }),
  };
}

export default async function CheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = findCheck(id);
  const copy = CHECK_COPY[id];
  if (!check || !copy) notFound();

  const dimension = DIMENSION_CATALOG.find((d) => d.id === check.dimension);
  const siblings = CHECK_CATALOG.filter(
    (c) => c.dimension === check.dimension && !c.alias && c.id !== check.id
  );
  const dimensionPoints = CHECK_CATALOG.filter((c) => c.dimension === check.dimension).reduce(
    (sum, c) => sum + c.points,
    0
  );
  /*
   * What this one check is worth out of 100. It is arithmetic on two published
   * numbers - the points this check carries and the share its dimension carries -
   * not a figure invented for the page. Kept to one decimal because rounding it to
   * a whole percent would show several different checks as the same number.
   */
  const shareOfTotal =
    dimension && dimensionPoints > 0
      ? ((check.points / dimensionPoints) * dimension.weight).toFixed(1)
      : null;

  /*
   * THE "HOW TO FIX THIS" SEQUENCE, AND WHY IT IS BUILT RATHER THAN WRITTEN.
   *
   * The steps are lib/geo/check-copy.ts's fix branches, in the order the analyser emits
   * them - one step per branch, so a rule that can fail in two different ways has two
   * steps and a rule that can only fail has one. The same array is rendered as the
   * visible <ol> below and serialised into the HowTo in the JSON-LD, so the structured
   * data and the prose cannot say different things.
   *
   * A branch whose `when` is not "fail" is a partial pass rather than a failure, and the
   * conditional is kept in the step name instead of being dropped: without it, "Publish
   * robots.txt" would be shown to a reader whose robots.txt is present but thin.
   */
  const steps = copy.fixes.map((fix) => ({
    name: stepName(fix.when, fix.text),
    text: fix.text,
    when: fix.when,
  }));

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to fix: ${copy.title}`,
    /*
     * The rule itself, from lib/geo/catalog.ts. Nothing here is a new description of the
     * check: `rule` is the exact condition the analyser tests, and `onFail` is what a
     * non-pass means, both as published on /methodology/.
     */
    description: check.onFail ? `${check.rule} ${check.onFail}` : check.rule,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  /*
   * QUESTIONS WHOSE ANSWERS ARE THE CATALOGUE'S OWN SENTENCES.
   *
   * A question is only asked when a field in lib/geo/catalog.ts already answers it, and
   * the answer is that field verbatim rather than a paraphrase of it:
   *
   *   - what it measures / what a failure means   check.rule, check.onFail
   *   - what else to look at first                the onFail text of the sibling rules in
   *                                               this dimension, asked in points order
   *   - why this dimension is weighted as it is  dimension.weighting, with the comparative
   *                                               sentence removed (see weightingAlone above)
   *
   * A rule with no onFail, no siblings that carry one, or no weighting sentence that
   * survives the move gets a shorter FAQ rather than an invented question. The Faq
   * component renders whatever is in the array, so a page with one question is a page with
   * one question and not a page with two empty ones.
   */
  const failNotes = siblings
    .slice()
    .sort((a, b) => b.points - a.points)
    .map((sibling) =>
      sibling.onFail ? `${CHECK_COPY[sibling.id]?.title ?? sibling.id}: ${sibling.onFail}` : null
    )
    .filter((line): line is string => Boolean(line));

  /*
   * Faq renders each answer as a plain <p> immediately after its heading, and the
   * answer-first rule on this site asks an opening paragraph to stay within 80 words.
   * /dimensions/ accepts any length because it renders the same block at h3; here the
   * answers are the catalogue's own sentences, and an answer that is too long to be one
   * is dropped rather than truncated mid-sentence.
   */
  const withinAnswerLength = (text: string) => text.split(/\s+/).length <= 80;
  const weighting = dimension ? weightingAlone(dimension.weighting) : null;

  const faqItems = [
    { q: `What does this check look at?`, a: check.rule },
    ...(check.onFail && withinAnswerLength(check.onFail)
      ? [{ q: `What does failing it mean?`, a: check.onFail }]
      : []),
    ...(failNotes.length > 0 && siblings.length > 0 && withinAnswerLength(failNotes.join(" "))
      ? [
          {
            q: `What else in this dimension should I check first?`,
            a: failNotes.join(" "),
          },
        ]
      : []),
    ...(dimension && weighting && weighting.usable && withinAnswerLength(weighting.text)
      ? [
          {
            q: `Why does this dimension carry ${dimension.weight}% of the score?`,
            a: weighting.text,
          },
        ]
      : []),
  ];

  const guidePath = guidePathForCheck(check.id);

  /*
   * THE CATALOGUE'S READING OF THE RULE, RENDERED WHEREVER IT BELONGS.
   *
   * `note` is the field lib/geo/catalog.ts uses for the two things `rule` cannot carry: the
   * scoring band an intermediate outcome is worth, and what the check actually reads where a
   * reader would reasonably assume more. It used to be rendered inside the failure section
   * only, so a check with no failure branch - landmarks and payload today, whose outcomes are
   * pass and partial by construction - had its note on /methodology/ and not on its own page.
   * The two pages are supposed to be the same source read twice; this is where they differed.
   */
  const noteBlock = check.note ? (
    <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-[var(--ink-2)]">
      {check.note}
    </blockquote>
  ) : null;

  return (
    <ProsePage
      eyebrow={dimension?.label ?? check.dimension}
      title={copy.title}
      description={
        <p>
          One of {CHECK_CATALOG.filter((c) => !c.alias).length} checks the scanner runs. This one
          is worth {check.points} {check.points === 1 ? "point" : "points"} inside the{" "}
          {dimension?.label ?? check.dimension} dimension, which carries {dimension?.weight ?? 0}%
          of the total score.
        </p>
      }
      action={{
        href: "/checks/",
        label: `← All ${CHECK_CATALOG.filter((c) => !c.alias).length} checks`,
      }}
    >
        <div className="space-y-8 text-[15px] leading-relaxed text-[var(--ink-2)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">What does this check look at?</h2>
            <p>{check.rule}</p>
            {check.onFail ? null : noteBlock}
          </div>

          {check.onFail ? (
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">What does a failure mean?</h2>
              <p>{check.onFail}</p>
              {noteBlock}
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">How do I fix it?</h2>
            {/*
              The HowTo, emitted as structured data and rendered as the <ol> beneath it from
              the same `steps` array. It is a JSON-LD block rather than a component because
              the only other structured-data component on this site, Faq, carries a FAQPage
              and a page must not declare two of those.
            */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
            />
            <ol className="list-decimal pl-5 space-y-1.5">
              {steps.map((step) => (
                <li key={step.name}>
                  {step.when !== "fail" ? (
                    <span className="text-[var(--ink-3)]">
                      {step.when === "partial" ? "Partial pass: " : `If the check is ${step.when}: `}
                    </span>
                  ) : null}
                  {step.text}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">
              Why is it worth {check.points} {check.points === 1 ? "point" : "points"}?
            </h2>
            <p>
              Points are relative weights inside a dimension, and a dimension&apos;s weight decides
              how much of the total it can move. The reasoning for this dimension&apos;s weight is
              published rather than asserted:
            </p>
            <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden mt-4">
              <tbody>
                <tr className="border-t border-[var(--line)]">
                  <td className="px-4 py-2.5 align-top text-[var(--ink-3)]">Dimension</td>
                  <td className="px-4 py-2.5 align-top">
                    {dimension?.label ?? check.dimension}
                    {dimension ? ` — ${dimension.weight}% of the total score` : ""}
                  </td>
                </tr>
                <tr className="border-t border-[var(--line)]">
                  <td className="px-4 py-2.5 align-top text-[var(--ink-3)]">Points for this check</td>
                  <td className="px-4 py-2.5 align-top">
                    {check.points} of {dimensionPoints} in this dimension
                  </td>
                </tr>
                {shareOfTotal ? (
                  <tr className="border-t border-[var(--line)]">
                    <td className="px-4 py-2.5 align-top text-[var(--ink-3)]">Worth at most</td>
                    <td className="px-4 py-2.5 align-top">{shareOfTotal} of the 100 points</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {dimension ? <p className="mt-4 text-[var(--ink-2)]">{dimension.weighting}</p> : null}
          </div>

          {dimension ? (
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">
                Which dimension does this belong to?
              </h2>
              <p>
                <Link
                  href={`/dimensions/${dimension.id}/`}
                  className="text-[var(--accent)] hover:opacity-75 underline"
                >
                  {dimension.label}
                </Link>{" "}
                — {dimension.weight}% of the total score, decided by{" "}
                {CHECK_CATALOG.filter((c) => c.dimension === dimension.id && !c.alias).length}{" "}
                published rules.
              </p>
              <p className="mt-2">{dimension.rationale}</p>
              <p className="mt-2 text-[var(--ink-2)]">
                {guidePath ? (
                  <>
                    The fix for this rule is walked through step by step in the{" "}
                    <Link
                      href={guidePath}
                      className="text-[var(--accent)] hover:opacity-75 underline"
                    >
                      {guidePath.replace("/docs/", "").replace(/\/$/, "").replace(/-/g, " ")} guide
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    None of the five{" "}
                    <Link href="/docs/" className="text-[var(--accent)] hover:opacity-75 underline">
                      guides
                    </Link>{" "}
                    covers this rule, which is why this page shows the fix in full rather than
                    pointing at one.
                  </>
                )}
              </p>
            </div>
          ) : null}

          {siblings.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">
                What else is measured in this dimension?
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/checks/${sibling.id}/`}
                      className="text-[var(--accent)] hover:opacity-75 underline"
                    >
                      {CHECK_COPY[sibling.id]?.title ?? sibling.id}
                    </Link>
                    <span className="text-[var(--ink-3)]">
                      {" "}
                      — {sibling.points} {sibling.points === 1 ? "point" : "points"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">How do I see my own result?</h2>
            <p>
              Run a scan on your own domain. The report lists every failed check with the evidence
              that produced it, so you can tell a real failure from a check that does not apply.
            </p>
            <p className="mt-3">
              <Link href="/" className="text-[var(--accent)] hover:opacity-75 underline">
                Run a free GEO audit on your own site →
              </Link>
            </p>
            <p className="mt-3 text-[var(--ink-2)]">
              The full method, including the dimensions that are deliberately weighted low and the
              parts of a picture a single-URL scan cannot see, is on the{" "}
              <Link href="/methodology/" className="text-[var(--accent)] hover:opacity-75 underline">
                methodology page
              </Link>
              .
            </p>
          </div>

          {/*
            Faq renders the FAQPage JSON-LD for this page and the visible questions beneath
            it. It is rendered once, here, because two FAQPage nodes on one page would be
            two claims about the same thing.
          */}
          <Faq title="Questions about this rule" items={faqItems} level="h3" />

          {/*
            The same Evidence block the twelve dimension pages and the guides carry, from the
            same component constants rather than retyped here. It is on this page for the
            reason the page exists at all: the citability dimension's weight follows the
            research quoted in it, and a site that tells other people to cite their sources
            cannot make an exception of its own reference pages. The note is the only
            check-specific sentence, and it states what is already true of the page.
          */}
          <Evidence
            quote={GEO_PRIMARY_QUOTE}
            attribution="Generative Engine Optimization, KDD 2024"
            attributionUrl="https://arxiv.org/abs/2311.09735"
            sources={GEO_PRIMARY_SOURCES}
            note="This rule is applied by the scanner and published in the rule set it is read from, so the condition on this page is the condition the scan tests rather than a summary of it."
          />
        </div>
    </ProsePage>
  );
}
