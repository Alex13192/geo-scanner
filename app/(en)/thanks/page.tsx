import type { Metadata } from "next";
import ProsePage from "@/app/components/ProsePage";
import { CONTACT_EMAIL } from "@/lib/site";
import { og } from "@/lib/og";

/**
 * Where a buyer lands after Creem takes the payment.
 *
 * WHY THIS PAGE EXISTS AT ALL. Without a return URL, Creem shows its own confirmation page: correct,
 * but unbranded and written for a checkout rather than for this service. What a buyer needs to know
 * at the moment they have paid is not "payment successful" - it is what happens next, in what order,
 * and how long it takes. That is the same sentence the product's private note carries, and the two
 * must not drift: this page is the long version, the note is the short one.
 *
 * WHY IT IS noindex. It is reached after a purchase and describes nothing anyone should find by
 * searching; a search result reading "Your order is received" is a page nobody can use. It is
 * deliberately NOT in app/sitemap.ts for the same reason.
 *
 * WHY IT DOES NOT CLAIM A PAYMENT WAS MADE. Anyone can open this URL, so the page describes where
 * Creem sends people rather than asserting anything about the visitor. The receipt is the email
 * Creem sends, and the page says so.
 */
const TITLE = "What happens next";
const DESCRIPTION =
  "After a measurement report is paid for: the intake form, the question bank you approve, the frozen bank, and when the report arrives.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/thanks/" },
  // Reached after a purchase, useful to nobody who finds it by searching.
  robots: { index: false, follow: false },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/thanks/",
  }),
};

export default function ThanksPage() {
  return (
    <ProsePage
      eyebrow="After payment"
      title={TITLE}
      description={<p>{DESCRIPTION}</p>}
      meta="Creem sends buyers here once a payment completes"
      action={{ href: "/pricing/", label: "← Pricing" }}
    >
        <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
          <h2>If you have just paid</h2>
          <p>
            Your receipt is the email Creem sends to the address you paid with — this page is not a
            receipt, and it cannot confirm a payment on its own. What it does is tell you the order of
            what happens next, so nothing here is a surprise.
          </p>
          <p>
            The first email comes from <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and
            carries the intake form. It should arrive within one working day of the payment.
          </p>

          <h2>What happens next, in order</h2>
          <ol>
            <li>
              <strong>You receive the intake form</strong> — within one working day, at the address you
              paid with.
            </li>
            <li>
              <strong>You fill it in and send it back.</strong> It asks for your legal name, the aliases
              and former names you want recognised, your industry, and the competitors you want
              counted. A short form with real answers beats a long one with guesses.
            </li>
            <li>
              <strong>We send you the question bank for approval.</strong> 25–30 questions built from
              your own vocabulary, grouped by what each group measures. You correct anything that reads
              wrong. Nothing is measured until you approve it.
            </li>
            <li>
              <strong>You approve, and the bank is frozen.</strong> Freezing is what makes two
              measurements comparable, and it is also the moment the fee stops being refundable — the
              model calls begin and they cannot be unspent. The email that asks you to approve says so.
            </li>
            <li>
              <strong>The measurement runs.</strong> Each question is put to the model three times, with
              web search on and every run in a fresh session. Every run is kept, including the ones that
              fail: they are recorded as not measured rather than as zero mentions.
            </li>
            <li>
              <strong>You receive the report and the data workbook</strong> — 5 to 10 working days after
              the bank is frozen.
            </li>
          </ol>

          <h2>What arrives</h2>
          <p>
            A written report and a workbook. The report counts, per question, how many of the runs
            mentioned your brand, and it gives the raw answers behind every number, the domains the
            answers cited, and the factual assertions that appear in them. It contains no score and no
            percentage, because a ratio built from three runs would turn one run&apos;s randomness into
            a conclusion.
          </p>

          <h2>If something is wrong</h2>
          <p>
            If the first email has not arrived after one working day, check the spam folder, then write
            to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the brand name and the date
            of the payment. If a deadline is missed, the choice is yours: wait, or take a full refund.
            The refund boundary and the delivery promise are stated on the{" "}
            <a href="/refund/">refunds page</a>, and the terms that govern the purchase are on the{" "}
            <a href="/terms/">terms page</a>.
          </p>
        </article>
    </ProsePage>
  );
}
