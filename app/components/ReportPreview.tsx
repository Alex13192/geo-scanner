import Link from "next/link";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * A locked preview of the paid measurement report.
 *
 * WHY THIS EXISTS: the free scan answers "is my page in a state where being cited is possible",
 * and the paid report answers a different question - what the engines actually said when asked
 * your buyers' questions. A number alone does not communicate that second thing, so this shows
 * the shape of the deliverable: the question bank, the per-question counts, the cited domains,
 * and an excerpt of a raw answer. The reader can see the product before paying for it.
 *
 * WHY THE RECORD IS FICTIONAL AND SAID SO: putting a real brand's counts on this site would be
 * publishing a measurement claim about somebody else, and inventing plausible-looking numbers
 * for a real company is exactly the kind of unsourced assertion the site spends its copy
 * arguing against. The sample names a fictional brand, the label above it says so, and no
 * figure here is presented as a fact about anyone.
 *
 * WHY IT SCROLLS IN PLACE: the report is long and the page is already long. A fixed-height,
 * internally scrollable window gives the feeling of a real document without pushing the rest
 * of the page down, and the gradient plus the lock row make it obvious where the preview ends
 * rather than pretending the sample is the whole thing.
 */
export default function ReportPreview() {
  const fromPrice = formatUsd(Math.min(...PRODUCTS.map((product) => product.priceUsd)));

  return (
    <section className="mt-16 max-w-3xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-1)]">What a paid report looks like</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">
            The scan above reads your pages. The report asks an AI engine your buyers&apos;
            questions and records what it said. This is the shape of that document.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
          Illustrative sample
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-1)]">
        <div className="border-b border-[var(--line)] px-5 py-3">
          <p className="text-sm font-semibold text-[var(--ink-1)]">
            AI visibility measurement — sample report
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-3)]">
            Sample brand “Northwind Labs” (fictional) · 29 questions × 3 runs · 1 engine ·
            illustrative figures, not a measurement of anyone
          </p>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-[var(--ink-2)]">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            Question bank (excerpt)
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>What tools help a small team track AI search visibility?</li>
            <li>Is Northwind Labs worth paying for compared with a spreadsheet?</li>
            <li>How do I measure whether ChatGPT mentions my brand?</li>
          </ol>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            Per-question counts
          </h3>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[var(--ink-3)]">
                <th className="py-1.5 pr-3 font-medium">Question</th>
                <th className="py-1.5 pr-3 font-medium">Mentioned Northwind</th>
                <th className="py-1.5 font-medium">Named instead</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--line)]">
                <td className="py-1.5 pr-3">Q1</td>
                <td className="py-1.5 pr-3 font-mono">2 of 3</td>
                <td className="py-1.5">G2, Reddit, a competitor blog</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-1.5 pr-3">Q2</td>
                <td className="py-1.5 pr-3 font-mono">0 of 3</td>
                <td className="py-1.5">Two named competitors</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-1.5 pr-3">Q3</td>
                <td className="py-1.5 pr-3 font-mono">1 of 3</td>
                <td className="py-1.5">Capterra, YouTube</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-1.5 pr-3">Q4</td>
                <td className="py-1.5 pr-3 font-mono">3 of 3</td>
                <td className="py-1.5">—</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3 text-[var(--ink-3)]">… 25 more questions</td>
                <td className="py-1.5 pr-3 text-[var(--ink-3)]">…</td>
                <td className="py-1.5 text-[var(--ink-3)]">…</td>
              </tr>
            </tbody>
          </table>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            Raw answer (excerpt)
          </h3>
          <blockquote className="mt-2 border-l-2 border-blue-500 pl-4 text-[13px] italic">
            “…for a small team, the practical options are a spreadsheet with a fixed question
            set, or a tool that runs the questions for you. Northwind Labs is one of the tools
            that does this; it is not the cheapest, and for a single brand the spreadsheet is
            usually enough to start…”
          </blockquote>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            Cited domains by frequency
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
            <li>g2.com — 14 citations</li>
            <li>reddit.com — 9 citations</li>
            <li>a competitor&rsquo;s comparison page — 7 citations</li>
            <li>your own domain — 3 citations</li>
          </ul>

          <p className="mt-6 text-[13px] text-[var(--ink-3)]">
            The full report adds every answer verbatim, the facts the answers asserted, and an
            action list read off the counts. The data workbook carries one row per run so any
            number can be traced back to the answer it came from.
          </p>
        </div>

        {/* The gradient is the visual end of the preview; the row below it is the actual paywall. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[64px] h-24 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
        <div className="relative flex flex-col items-start gap-3 border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-[var(--ink-2)]">
            This is a sample. Your report uses your brand, your questions and your engines.
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/pricing/"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--on-accent)] transition-transform hover:scale-[1.03]"
            >
              See pricing — from {fromPrice}
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-xs text-[var(--ink-2)] underline hover:text-[var(--ink-1)]">
              Ask a question
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
