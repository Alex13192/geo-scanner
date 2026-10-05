import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";

import { og } from "@/lib/og";

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
  const index = DIMENSION_CATALOG.findIndex((d) => d.id === dimension.id);
  const next = DIMENSION_CATALOG[(index + 1) % DIMENSION_CATALOG.length];

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
        <p>{dimension.weighting}</p>

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

