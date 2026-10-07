import type { ReactNode } from "react";

/**
 * A quotation plus the external sources behind a page, in one block.
 *
 * WHY BOTH IN ONE COMPONENT: they are two separate scanner rules that are almost
 * always fixed by the same edit, and keeping them together means a page cannot
 * accidentally get one and not the other.
 *
 *   quotations          - one <blockquote> element anywhere in the body.
 *   authority-citations - at least two links to external hosts on the authority
 *                         list. That list is fixed and worth repeating here so a
 *                         call site can check itself without opening the
 *                         analyser: arxiv.org, doi.org, nature.com, science.org,
 *                         acm.org, ieee.org, springer.com, sciencedirect.com,
 *                         wikipedia.org, github.com, developer.mozilla.org,
 *                         web.dev, nih.gov, who.int, europa.eu, and any .gov or
 *                         .edu host. Own-domain links are excluded, so linking to
 *                         /methodology/ does not count.
 *
 * The weights are 3 points each, and citability is the dimension the published
 * research supports most directly, which is why it is worth a component rather
 * than a habit.
 *
 * Put numbers in `quote` when you honestly can. The statistics rule reads
 * percentages, currency, multipliers and five-digit figures from the body text,
 * and a sourced figure satisfies three rules at once - but a figure without a
 * source is exactly the thing this project criticises other people for.
 */
export type EvidenceSource = {
  label: string;
  /** Must be an external authority host; see the list above. */
  url: string;
  note?: string;
};

/**
 * The research this whole product's weighting rests on, as one list.
 *
 * Every page that cites anything cites these, and /methodology/ already linked
 * all three by hand before this component existed. Keeping the list here rather
 * than pasting it into each call site means the wording cannot drift between
 * pages, which is the same reason LegalLinks and PageFooter exist.
 */
export const GEO_PRIMARY_SOURCES: EvidenceSource[] = [
  {
    label: "Generative Engine Optimization (KDD 2024)",
    url: "https://arxiv.org/abs/2311.09735",
    note: "the measured gains the citability weight follows",
  },
  {
    label: "What Generative Search Engines Like",
    url: "https://arxiv.org/abs/2510.11438",
    note: "what generative engines prefer in retrieved content",
  },
  {
    label: "What Gets Cited: Competitive GEO",
    url: "https://arxiv.org/abs/2605.25517",
    note: "which of two competing sources is cited first",
  },
  {
    label: "The rule set and its weights",
    url: "https://github.com/Alex13192/geo-scanner",
    note: "every check, its weight and its pass condition",
  },
];

/**
 * The finding the weightings follow, quoted the same way everywhere.
 *
 * WHERE EACH FIGURE COMES FROM, recorded because a number that cannot be traced
 * is the one thing this site does not publish: "up to 40%" is the abstract's own
 * headline, and the 41% / 28% pair is the caption of Table 1, which measures the
 * best of the tested methods against the no-optimization baseline on
 * position-adjusted word count and subjective impression respectively (baseline
 * 19.5 and 19.3). An earlier version of this constant carried per-method figures
 * with a low-ranking-sites qualifier; those live in a per-position table in the
 * paper that we could not open, so they were replaced with the numbers above,
 * which any reader can find in the abstract and in Table 1.
 */
export const GEO_PRIMARY_QUOTE =
  "GEO can boost visibility by up to 40% overall in generative engine responses, and in the paper's Table 1 the best of the tested methods improve on the no-optimization baseline by 41% and 28%.";

type EvidenceProps = {
  title?: string;
  quote: string;
  attribution: string;
  attributionUrl: string;
  sources?: EvidenceSource[];
  note?: ReactNode;
};

export default function Evidence({
  title = "Evidence and sources",
  quote,
  attribution,
  attributionUrl,
  sources = [],
  note,
}: EvidenceProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">{title}</h2>
      <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-[var(--ink-2)]">
        {quote} —{" "}
        <a
          href={attributionUrl}
          className="text-[var(--accent)] hover:opacity-75 underline"
          rel="noopener"
        >
          {attribution}
        </a>
      </blockquote>
      {note ? <p className="mt-4">{note}</p> : null}
      {sources.length > 0 ? (
        <>
          <h3 className="font-semibold text-[var(--ink-1)] mt-5 mb-2">Primary sources</h3>
          <ul className="list-disc pl-5 space-y-1.5">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  className="text-[var(--accent)] hover:opacity-75 underline"
                  rel="noopener"
                >
                  {source.label}
                </a>
                {source.note ? <span className="text-[var(--ink-2)]"> — {source.note}</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
