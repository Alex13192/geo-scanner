import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { checkPageDescription, checkPageTitle } from "@/lib/geo/check-meta";
import PageFooter from "@/app/components/PageFooter";
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

  // Built in lib/geo/check-meta.ts so the tests can assert that every one of the 38
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
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </span>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </Link>
          <Link
            href="/checks/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
          >
            ← All {CHECK_CATALOG.filter((c) => !c.alias).length} checks
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            {dimension?.label ?? check.dimension}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            {copy.title}
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            One of {CHECK_CATALOG.filter((c) => !c.alias).length} checks the scanner runs. This one
            is worth {check.points} {check.points === 1 ? "point" : "points"} inside the{" "}
            {dimension?.label ?? check.dimension} dimension, which carries {dimension?.weight ?? 0}%
            of the total score.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">What does this check look at?</h2>
            <p>{check.rule}</p>
          </div>

          {check.onFail ? (
            <div>
              <h2 className="text-xl font-bold text-white mb-3">What does a failure mean?</h2>
              <p>{check.onFail}</p>
              {check.note ? (
                <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-gray-400">
                  {check.note}
                </blockquote>
              ) : null}
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How do I fix it?</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {copy.fixes.map((fix) => (
                <li key={fix.text}>
                  {fix.when !== "fail" ? (
                    <span className="text-gray-500">
                      {fix.when === "partial" ? "Partial pass: " : `${fix.when}: `}
                    </span>
                  ) : null}
                  {fix.text}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              Why is it worth {check.points} {check.points === 1 ? "point" : "points"}?
            </h2>
            <p>
              Points are relative weights inside a dimension, and a dimension&apos;s weight decides
              how much of the total it can move. The reasoning for this dimension&apos;s weight is
              published rather than asserted:
            </p>
            <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden mt-4">
              <tbody>
                <tr className="border-t border-gray-800/80">
                  <td className="px-4 py-2.5 align-top text-gray-500">Dimension</td>
                  <td className="px-4 py-2.5 align-top">
                    {dimension?.label ?? check.dimension}
                    {dimension ? ` — ${dimension.weight}% of the total score` : ""}
                  </td>
                </tr>
                <tr className="border-t border-gray-800/80">
                  <td className="px-4 py-2.5 align-top text-gray-500">Points for this check</td>
                  <td className="px-4 py-2.5 align-top">
                    {check.points} of {dimensionPoints} in this dimension
                  </td>
                </tr>
                {shareOfTotal ? (
                  <tr className="border-t border-gray-800/80">
                    <td className="px-4 py-2.5 align-top text-gray-500">Worth at most</td>
                    <td className="px-4 py-2.5 align-top">{shareOfTotal} of the 100 points</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {dimension ? <p className="mt-4 text-gray-400">{dimension.weighting}</p> : null}
          </div>

          {siblings.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold text-white mb-3">
                What else is measured in this dimension?
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/checks/${sibling.id}/`}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {CHECK_COPY[sibling.id]?.title ?? sibling.id}
                    </Link>
                    <span className="text-gray-500">
                      {" "}
                      — {sibling.points} {sibling.points === 1 ? "point" : "points"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How do I see my own result?</h2>
            <p>
              Run a scan on your own domain. The report lists every failed check with the evidence
              that produced it, so you can tell a real failure from a check that does not apply.
            </p>
            <p className="mt-3">
              <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
                Run a free GEO audit on your own site →
              </Link>
            </p>
            <p className="mt-3 text-gray-400">
              The full method, including the dimensions that are deliberately weighted low and the
              parts of the picture a single-URL scan cannot see, is on the{" "}
              <Link href="/methodology/" className="text-blue-400 hover:text-blue-300 underline">
                methodology page
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <PageFooter width="3xl" />
    </div>
  );
}
