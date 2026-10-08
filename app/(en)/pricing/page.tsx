import type { Metadata } from "next";
import ProsePage from "@/app/components/ProsePage";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Pricing.
 *
 * THIS PAGE WAS DELETED ONCE AND THE REASON IT WAS DELETED IS THE REASON IT IS BACK. OPERATIONS.md
 * records the withdrawal: the site sold one thing - a one-time manual audit - and when that was
 * withdrawn, /pricing/, /refund/ and /withdrawal/ were deleted in the same change, because a page
 * that describes a process you do not run is worse than a page that says nothing. What exists now
 * is a service that is actually run: the measurement pipeline in scripts/report/, delivered as a
 * report and a data workbook. So the price is published again, and every row below is a thing that
 * can be bought today.
 *
 * WHAT IS DELIBERATELY NOT ON THIS PAGE:
 *  - No subscription tier. There is no account system, no plan column in the database and no
 *    merchant of record yet, so a "Pro $29/month" row would be a price for something nobody can
 *    pay for. It goes here when it can be bought.
 *  - No buy button. Orders are confirmed by email and paid by transfer or a payment link, which is
 *    how a service is actually sold - and it means a visitor cannot reach a broken checkout.
 *  - No guarantee of a score, a ranking or a citation. The whole method is built against that
 *    promise; see /methodology/.
 */
import { og } from "@/lib/og";

const TITLE = "Pricing";
const DESCRIPTION =
  "The scanner is free and stays free. What costs money is measurement work we run on your behalf: a report built from answers the engines actually gave, and the retest that shows what changed.";
const UPDATED = "8 October 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/pricing/",
  }),
};

export default function PricingPage() {
  return (
    <ProsePage
      eyebrow="Pricing"
      title="What costs money, and what does not"
      description={
        <p>
          The scanner is free and stays free. What you can buy is the part that takes work: one
          measured report, and the retest that shows what changed.
        </p>
      }
      meta={`Last updated ${UPDATED}`}
      action={{ href: "/report/", label: "Run a free scan" }}
    >
      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>Free — $0</h2>
        <p>Everything the scanner does, with no account and no email.</p>
        <ul>
          <li>Unlimited scans of any domain: the same 40 checks, all 12 dimensions, every failure named.</li>
          <li>The /llms.txt studio and the readiness badge.</li>
          <li>The weekly report for one domain: the same 40 checks re-run every Monday, emailed as a diff.</li>
          <li>The methodology, all 40 rule pages and the study data.</li>
        </ul>

        <h2>Measurement report — $299</h2>
        <p>
          One report. It answers two questions: what do the engines say about you, and what are they
          getting wrong.
        </p>
        <ul>
          <li>
            <strong>An intake from you</strong> — your names and aliases, the words your buyers use,
            the questions they actually ask, and the competitors you want measured. Industry terms
            come from you, not from a category list we invented.
          </li>
          <li>
            <strong>A question bank of 25–30 questions, sent to you to correct and approve.</strong>{" "}
            Nothing is measured until you approve it. Once approved, the bank is frozen and its
            fingerprint is printed in both the report and the data workbook.
          </li>
          <li>
            <strong>Each question asked three times</strong>, with web search on, against the engine
            you selected. Every answer is kept.
          </li>
          <li>
            <strong>A report and a data workbook.</strong> The workbook carries one row per run: the
            answer text, the domains cited, and whether your names appeared. The report carries
            per-question counts, who was recommended instead of you, the cited domains by frequency,
            the facts the answers asserted that we did not verify, and a short list of actions read
            off the counts.
          </li>
          <li>
            <strong>Every count written as “3 of 12”, never as a percentage</strong>, because three
            runs per question cannot support a percentage.
          </li>
          <li>
            <strong>Delivery within 5–10 working days</strong> of the bank being frozen.
          </li>
        </ul>

        <h2>Quarterly retest — $499 per quarter</h2>
        <p>The same frozen bank, run again, with the comparison between the two runs.</p>
        <ul>
          <li>
            The same questions, so the counts are comparable. The bank fingerprint in both reports is
            how you can check that.
          </li>
          <li>
            <strong>What changed, per question</strong> — 0 of 3 to 2 of 3 — and which cited domains
            appeared or disappeared.
          </li>
          <li>
            <strong>One extra re-measurement within the quarter</strong> if you shipped changes and
            want to see the result without waiting.
          </li>
        </ul>

        <h2>Agencies and multi-brand work — contact us</h2>
        <p>
          Several brands, white-label delivery, or a shape of work that is not listed here: email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and describe it. Scope and price are
          confirmed in writing before anything starts.
        </p>

        <h2>How an order works</h2>
        <ol>
          <li>You email {CONTACT_EMAIL} with the brand and the domain.</li>
          <li>We confirm scope, price and dates in writing.</li>
          <li>Payment instructions follow. There is no checkout on this site yet, and no card is taken anywhere on it.</li>
          <li>You fill the intake form and approve the question bank. The bank is frozen at that point.</li>
          <li>The measurement runs. You receive the report and the workbook.</li>
        </ol>

        <h2>What this is not</h2>
        <ul>
          <li>
            <strong>Not a score.</strong> There is no number out of 100, because three runs per
            question cannot support one. A score would be the first number quoted and the least
            defensible.
          </li>
          <li>
            <strong>Not a ranking.</strong> We do not measure position, and nothing here predicts what
            an engine will say next month.
          </li>
          <li>
            <strong>No guarantee.</strong> We do not promise that an engine will mention you, cite
            you, or describe you the way you would like. We measure what it said, on a date, and we
            publish the method.
          </li>
          <li>
            <strong>Measured through engine APIs</strong>, which can differ from what a person sees
            in a chat window. Every report says so in its method appendix rather than leaving it out.
          </li>
          <li>
            <strong>Failures are excluded, not scored.</strong> Rate limits and timeouts are dropped
            from the counts and listed with their error codes. A question with no completed run reads
            “not measured”, never 0.
          </li>
        </ul>

        <h2>Free stays free</h2>
        <p>
          The scanner, the 40 published checks, the methodology and the study data are free today and
          will stay free. The weekly report for one domain is free too. You are paying for measurement
          work we run on your behalf, not for access to the scanner. Refund terms are on the{" "}
          <a href="/refund/">refunds page</a>.
        </p>
      </article>
    </ProsePage>
  );
}
