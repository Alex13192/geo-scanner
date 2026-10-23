import type { Metadata } from "next";
import ProsePage from "@/app/components/ProsePage";
import Faq from "@/app/components/Faq";
import SellerIdentity from "@/app/components/SellerIdentity";
import BuyButton from "@/app/components/BuyButton";
import { social } from "@/lib/og";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { languageAlternates, pricingPath } from "@/lib/i18n/config";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Pricing.
 *
 * WHAT CHANGED ON 2026-10-23, AND WHY THE PRICE FELL. This page sold a $299 report and a
 * $499 quarterly retest. Both were priced like a consultancy, and neither ever had a
 * checkout: the only way to buy was to email. The audit was blunt about the result - the
 * funnel had no entrance - and the owner's own read was that $299 would sell to almost
 * nobody at this stage.
 *
 * The ladder is now $39 for a Signal report and $99 for a Pro report: one-time digital
 * products (report + workbook), in the range an indie founder or a small agency can approve
 * without a purchase order. The price can move up after there are ten real buyers; it cannot
 * move back down from a price nobody paid.
 *
 * WHY THE PAGE IS STILL PER-REQUEST: SellerIdentity reads OPERATOR_IDENTITY from the
 * deployment. A prerendered page would freeze the empty fallback into a static file that no
 * later deploy could correct - the bug /refund/ documents at length.
 */
export const dynamic = "force-dynamic";

const TITLE = "Pricing";
const DESCRIPTION =
  "The scanner is free. Paid are one-time AI visibility measurements: 15 questions for $39, 30 questions and two engines for $99.";
const UPDATED = "23 October 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/pricing/",
    languages: languageAlternates(pricingPath),
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/pricing/",
  }),
};

export default function PricingPage() {
  return (
    <ProsePage
      eyebrow="Pricing"
      title="Free scanner. Paid measurement."
      description={
        <p>
          The scan is free and needs no account. What costs money is measurement work: the
          questions your buyers ask, put to the AI engines, with the answers recorded.
        </p>
      }
      meta={`Last updated ${UPDATED}`}
      action={{ href: "/report/", label: "Run a free scan" }}
    >
      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>Free — $0, forever</h2>
        <p>Everything the scanner does, with no account and no email.</p>
        <ul>
          <li>Unlimited scans: the same 40 checks, all 12 dimensions, every failure named.</li>
          <li>The /llms.txt studio and the readiness badge.</li>
          <li>The weekly report for one domain, emailed as a diff every Monday.</li>
          <li>The methodology, all 40 rule pages and the study data.</li>
        </ul>

        <h2>What a paid report is</h2>
        <p>
          A one-time measurement, delivered as a written report and a data workbook. It asks
          an AI engine the questions your buyers actually ask, records each answer verbatim,
          and counts how often your brand - and your competitors - appeared.
        </p>
        <ul>
          <li>
            <strong>A question bank built from your vocabulary</strong> and sent to you to
            correct and approve. Nothing is measured until you approve it; the approved bank
            is frozen and its fingerprint is printed in both the report and the workbook.
          </li>
          <li>
            <strong>Three runs per question, each in a fresh session</strong>, with web search
            on. Every answer is kept.
          </li>
          <li>
            <strong>Counts written as “2 of 3”, never as a percentage</strong>, because three
            runs per question cannot support a percentage.
          </li>
          <li>
            <strong>Delivery within 5–10 working days</strong> of the bank being frozen.
          </li>
        </ul>

        <div className="not-prose mt-8 grid gap-5 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <section
              key={product.id}
              className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--ink-1)]">{product.name}</h3>
                <p className="text-3xl font-semibold tracking-tight text-[var(--ink-1)]">
                  {formatUsd(product.priceUsd)}
                  <span className="ml-1 text-xs font-normal text-[var(--ink-3)]">USD</span>
                </p>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm leading-relaxed text-[var(--ink-2)]">
                <li>25–30 questions built from your vocabulary</li>
                <li>3 runs per question, each in a fresh session</li>
                <li>
                  {product.engines} AI {product.engines === 1 ? "engine" : "engines"} of your
                  choice
                </li>
                <li>Report and data workbook by email</li>
                {product.id === "pro" ? (
                  <li>Action list, plus one retest within 90 days</li>
                ) : null}
              </ul>
              <div className="mt-6">
                <BuyButton productId={product.id} label={`Buy the ${product.name}`} />
              </div>
            </section>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--ink-3)]">
          Charged in USD. Sales tax and VAT are handled by the merchant of record. Card
          checkout is being connected; until it is live, the button opens a prefilled order
          email.
        </p>

        <h2>Agencies and multi-brand work</h2>
        <p>
          Several brands, white-label delivery, or a shape of work that is not listed here:
          email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and describe it. Scope,
          price and dates are confirmed in writing before anything starts.
        </p>

        <h2>How an order works</h2>
        <ol>
          <li>You pay for a report, or email us if you want a scope that is not listed.</li>
          <li>The order reference in the payment receipt is what the intake email quotes.</li>
          <li>
            Within one working day you receive the intake form: legal name, aliases,
            competitors, and the questions your buyers ask.
          </li>
          <li>We send the question bank for your correction. You approve it, and it is frozen.</li>
          <li>The measurement runs. The report and the workbook follow within 5–10 working days.</li>
        </ol>

        <h2>Who you are buying from</h2>
        <SellerIdentity />

        <h2>What this is not</h2>
        <ul>
          <li>
            <strong>Not a score.</strong> There is no number out of 100, because three runs
            per question cannot support one.
          </li>
          <li>
            <strong>Not a ranking.</strong> We do not measure position, and nothing here
            predicts what an engine will say next month.
          </li>
          <li>
            <strong>No guarantee.</strong> We do not promise that an engine will mention you,
            cite you, or describe you the way you would like. We measure what it said, on a
            date, and we publish the method.
          </li>
        </ul>

        <h2>Refunds</h2>
        <p>
          A full refund until you approve and freeze the question bank: after that the
          measurement runs have already been paid for. The full policy, including how to ask,
          is on the <a href="/refund/">refund page</a>.
        </p>
      </article>

      <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
        <Faq
          title="Questions about buying a report"
          items={[
            {
              q: "How is this different from the free scan?",
              a: "The free scan reads your pages and scores whether an engine could crawl, parse and cite them. The paid report asks the engines your buyers' questions and records the answers: what was said, which names appeared, and which domains were cited.",
            },
            {
              q: "Is there a checkout on this site?",
              a: "The card checkout is being connected through a merchant of record. Until it is live, the buy button opens a prefilled order email with a reference, and payment is by bank transfer or a payment link we send back. No card is entered on this site.",
            },
            {
              q: "When does the report stop being refundable?",
              a: "Once you approve and freeze the question bank. The measurement runs are the cost of the report and cannot be unspent. Before that point the refund is full and needs no reason.",
            },
          ]}
        />
      </div>
    </ProsePage>
  );
}
