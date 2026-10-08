import type { Metadata } from "next";
import ProsePage from "@/app/components/ProsePage";
import { CONTACT_EMAIL, OPERATOR_IDENTITY } from "@/lib/site";

/**
 * Refunds, and the consumer right of withdrawal.
 *
 * WHY ONE PAGE AND NOT TWO. /withdrawal/ existed as a separate URL because EU consumer sales need a
 * withdrawal notice and it was written as its own document. It is folded in here: a buyer deciding
 * whether to pay wants one page that answers "what do I get back if this goes wrong", and a second
 * page that repeats the same contract in legal register is a second thing to keep in step. The old
 * /withdrawal/ URL still 301s to the homepage - see middleware.ts, which is where that survives.
 *
 * THE LINE THE PAGE DRAWS, AND WHY IT IS THERE RATHER THAN LATER: the measurement is paid for in API
 * calls, and those calls happen the moment the client-approved question bank is frozen. So the
 * refund boundary is "before the bank is frozen", it is stated in the email that asks for approval,
 * and it is stated here before payment. A refund policy discovered after the invoice is a dispute.
 *
 * THE SELLER'S IDENTITY COMES FROM THE ENVIRONMENT, NOT FROM THIS FILE. OPERATIONS.md records the
 * constraint: an Impressum or a withdrawal notice that is addressable needs a postal address, and
 * anything committed to this repository is published whether or not a page renders it. So the value
 * lives in a deployment variable (OPERATOR_IDENTITY) and the repository keeps no address. When it is
 * not set, the page says where the identity is given instead of printing a blank line.
 */
import { og } from "@/lib/og";

const TITLE = "Refunds";

/**
 * THIS PAGE IS RENDERED PER REQUEST, AND THAT IS NOT AN OVERSIGHT - the other legal pages are
 * prerendered and this one cannot be.
 *
 * The seller's identity comes from a deployment variable (OPERATOR_IDENTITY). The first version of
 * this page was prerendered, so it read that variable during the BUILD; the build had no value for
 * it, and the fallback sentence was then written into a static file and shipped - where no later
 * change to the variable could ever reach it. Nothing failed, the page looked finished, and the
 * address was simply absent from the one page a payment reviewer opens. That is the silent-absence
 * failure this repository keeps writing warnings about, so it is fixed at the cause rather than by
 * re-running a deploy until the value happens to be present.
 *
 * Rendering per request reads the Worker's environment instead, which also means the address can be
 * corrected without a rebuild - the right property for a field that changes when a business moves.
 */
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "When a measurement report is refundable, what happens if we miss the delivery window, how a retest is billed, and the EU and UK consumer right of withdrawal.";
const UPDATED = "8 October 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/refund/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/refund/",
  }),
};

export default function RefundPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Refunds and cancellation"
      description={
        <p>
          If we have not started the measurement, you get your money back. Once the question bank is
          frozen the runs have begun and the fee is not refundable — and we tell you that before you
          pay, not after.
        </p>
      }
      meta={`Last updated ${UPDATED}`}
      action={{ href: "/pricing/", label: "Pricing" }}
    >
      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>Before the bank is frozen — full refund</h2>
        <p>
          You can cancel at any point before you approve and freeze the question bank. The refund is
          full, and you do not have to give a reason.
        </p>
        <p>
          That window is not a formality. It is the point of the intake: you are the only person who
          knows whether the bank asks the right questions, and if it does not, we would rather stop
          than measure the wrong thing.
        </p>

        <h2>After the bank is frozen — no refund</h2>
        <p>
          The sequence is: we send you the bank, you correct it, you approve it, and it is frozen.
          The measurement then begins — every question is put to a paid engine API three times. Those
          calls are the cost of the report, they are made on your behalf, and they cannot be unspent.
        </p>
        <p>
          So from the moment the bank is frozen, the fee is non-refundable. The email that asks you to
          approve the bank states this, and payment is taken after you have seen it.
        </p>
        <p>
          If you want a different question afterwards, that is a new bank and a new baseline. We will
          say so rather than editing a frozen one, because a comparison between two different question
          sets does not mean anything.
        </p>

        <h2>If we fail to deliver</h2>
        <p>
          If we cannot deliver the report within the stated window, you choose: wait for it, or take a
          full refund. A missed deadline is ours, not yours, and it is not a reason for you to lose
          money.
        </p>

        <h2>Quarterly retests</h2>
        <p>
          Retests are billed per quarter and can be cancelled any time before that quarter's
          measurement starts. If a quarter's measurement has already started, that quarter is not
          refundable — the runs are the cost, exactly as above.
        </p>
        <p>
          The extra re-measurement included in a quarter is for that quarter. It does not carry over,
          and it is not refundable if unused.
        </p>

        <h2>Your right of withdrawal (consumers in the EU and UK)</h2>
        <p>
          If you are a consumer, you normally have 14 days from the day the contract is concluded to
          withdraw from it without giving a reason.
        </p>
        <p>
          A measurement report is a service, and it begins when you ask us to begin. Before anything
          starts, we will ask you to confirm in writing that you want the bank frozen now and that you
          understand you lose the right of withdrawal once the runs begin. If you do not confirm it,
          we will not start the measurement — and you keep your full 14-day right, and a full refund
          if you use it.
        </p>
        <p>This does not affect your rights if we deliver something that does not match what was agreed.</p>

        <h2>Who you are buying from</h2>
        {OPERATOR_IDENTITY ? (
          <p>{OPERATOR_IDENTITY}</p>
        ) : (
          <p>
            The seller&rsquo;s name and postal address are given with every quote and invoice, and by
            email on request: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        )}

        <h2>How to ask</h2>
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We answer within 2 working
          days. Include the brand name and the date of the report; every run is kept, so we can find
          the exact answer you are asking about.
        </p>
      </article>
    </ProsePage>
  );
}
