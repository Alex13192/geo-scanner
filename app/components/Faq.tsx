import type { ReactNode } from "react";

/**
 * A question-and-answer block that satisfies three of the scanner's own rules at
 * once, which is the point of having it as a component rather than writing the
 * markup again on each page.
 *
 * WHAT ITEM SATISFIES, AND WHY EACH PART IS THERE:
 *   faq            - the FAQPage node in the JSON-LD. Without it, <details> markup
 *                    is only a partial pass, so the schema is not decoration.
 *   qa-headings    - three or more question-shaped headings. The questions are
 *                    rendered as real heading elements rather than bold text,
 *                    because the check reads the heading hierarchy, not the
 *                    punctuation.
 *   answer-first   - each heading is followed immediately by a <p>, and the call
 *                    sites keep those answers under 80 words. Do not wrap an
 *                    answer in another div, and do not put the answer in a
 *                    <details>: both break the heading-then-paragraph pair the
 *                    check looks for, and <details> content also reads as hidden
 *                    to a parser that does not click.
 *
 * The JSON-LD is emitted per instance. Duplicate FAQPage nodes across a single
 * page would be wrong, so render this component once per page.
 */
export type FaqItem = {
  q: string;
  a: string;
};

type FaqProps = {
  /** Heading for the whole block. Not a question itself; the items carry those. */
  title: string;
  items: FaqItem[];
  /** Heading level for each question. h3 by default, h2 on short pages. */
  level?: "h2" | "h3";
  /** Optional trailing prose, e.g. a link to the methodology page. */
  footer?: ReactNode;
};

export default function Faq({ title, items, level = "h3", footer }: FaqProps) {
  const Heading = level;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">{title}</h2>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {items.map((item, i) => (
        <div key={item.q} className={i === 0 ? "mt-4" : "mt-5"}>
          <Heading className="font-semibold text-[var(--ink-1)] mb-1">{item.q}</Heading>
          <p>{item.a}</p>
        </div>
      ))}
      {footer ? <div className="mt-4 text-[var(--ink-2)]">{footer}</div> : null}
    </div>
  );
}
