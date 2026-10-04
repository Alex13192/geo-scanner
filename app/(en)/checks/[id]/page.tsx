import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { checkPageDescription, checkPageTitle } from "@/lib/geo/check-meta";
import ProsePage from "@/app/components/ProsePage";
import { og } from "@/lib/og";

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
          </div>

          {check.onFail ? (
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">What does a failure mean?</h2>
              <p>{check.onFail}</p>
              {check.note ? (
                <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-[var(--ink-2)]">
                  {check.note}
                </blockquote>
              ) : null}
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">How do I fix it?</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {copy.fixes.map((fix) => (
                <li key={fix.text}>
                  {fix.when !== "fail" ? (
                    <span className="text-[var(--ink-3)]">
                      {fix.when === "partial" ? "Partial pass: " : `${fix.when}: `}
                    </span>
                  ) : null}
                  {fix.text}
                </li>
              ))}
            </ul>
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
              parts of the picture a single-URL scan cannot see, is on the{" "}
              <Link href="/methodology/" className="text-[var(--accent)] hover:opacity-75 underline">
                methodology page
              </Link>
              .
            </p>
          </div>
        </div>
    </ProsePage>
  );
}
