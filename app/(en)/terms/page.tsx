import type { Metadata } from "next";
import ProsePage from "@/app/components/ProsePage";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Terms of service.
 *
 * This page exists for the same reason /privacy/ does: AdSense review checks
 * that a site states its terms somewhere reachable.
 *
 * It used to open by explaining that "the paid product is sold through this
 * site, and both AdSense review and the payment providers check that a site
 * asking for money states its terms". The money went away for a while, and those
 * sections went with it in the same change that deleted /pricing/, /refund/ and
 * /withdrawal/ - terms that govern a purchase nobody can make are the same failure
 * as a process page for a process nobody runs (see OPERATIONS.md).
 *
 * THE PURCHASE CAME BACK ON 2026-10-08 AND THESE SECTIONS CAME BACK WITH IT. The site sells a
 * measurement report and a quarterly retest, so this page now states what is sold, how an order and
 * a refund work, and the consumer right of withdrawal. /pricing/ and /refund/ carry the detail; this
 * is where the contract lives, and the two must not drift apart - if a price or a refund boundary
 * changes there, it changes here in the same commit.
 *
 * WHY A GOVERNING-LAW CLAUSE IS HERE NOW AND WAS DELIBERATELY ABSENT BEFORE: the earlier version
 * refused to name a country, because the operator's jurisdiction was recorded nowhere on the site
 * and a guessed choice of law is a claim that can be wrong. The postal address was published on
 * /refund/ in the same change, so the place of business is a fact rather than a guess. The clause
 * therefore also says what /refund/ says about consumer protection: choosing Chinese law does not
 * remove the mandatory rules of the consumer's own country.
 *
 * One deliberate omission remains, because inventing it would be worse than leaving it out:
 *  - No "we may use your content however we like" licence over submitted material. Nothing in the
 *    product needs it, and the intake contains a client's own vocabulary and competitors.
 *
 * NOT LEGAL ADVICE, AND THIS IS THE FIRST VERSION THAT GOVERNS A PAID CONTRACT. Have it reviewed
 * before the first overseas invoice is issued - that is the one deadline this file cannot miss.
 */
import { og } from "@/lib/og";

const TITLE = "Terms of service";
const DESCRIPTION =
  "The rules for the free LLMention scanner and for the measurement reports sold through it: what is promised, what is not, what you may scan, and how an order, a refund and the right of withdrawal work.";
const UPDATED = "8 October 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/terms/",
  }),
};

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title={TITLE}
      description={<p>{DESCRIPTION}</p>}
      meta={`Last updated ${UPDATED}`}
      action={{ href: "/about/", label: "← About" }}
    >
        <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
          <h2>Agreement</h2>
          <p>
            By using this site you agree to these terms. If you do not agree with them, do not use
            the site. They apply to the free scanner, the /llms.txt generator, and the guides.
          </p>

          <h2>What the service is</h2>
          <p>
            LLMention audits whether AI search engines and LLM crawlers can reach, parse and cite a
            website, and generates <code>llms.txt</code> context files. The scanner, the generator
            and all documentation are free and need no account.
          </p>
          <p>
            The readiness score is an <strong>automated opinion</strong> produced by applying
            published rules to what a page returns. The complete method — every check, its weight
            and its rule — is published at <a href="/methodology/">methodology</a>, so the basis of
            any score can be inspected and disputed rather than taken on trust.
          </p>

          <h2>What is sold</h2>
          <p>
            Two services, and they are services rather than licences. A{" "}
            <strong>measurement report</strong> at $299: we take an intake from you, generate a
            25–30 question bank out of your own vocabulary, send it back for you to correct and
            approve, freeze it, put each question to the engine you selected three times with web
            search on, and deliver a report and a data workbook within 5–10 working days of the bank
            being frozen. A <strong>quarterly retest</strong> at $499: the same frozen bank, run
            again, with the comparison between the two runs. Multi-brand and agency work is quoted in
            writing.
          </p>
          <p>
            Prices, what each includes and what neither includes are stated on the{" "}
            <a href="/pricing/">pricing page</a>, and that page is part of these terms. Every count in
            a report is written as a count — “3 of 12”, never a percentage — and the raw answers ship
            with it, so anyone reading a number can check it against the answer it came from.
          </p>

          <h2>Orders, payment and delivery</h2>
          <p>
            An order starts as an email to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We
            confirm scope, price and dates in writing before anything is charged. There is no checkout
            on this site, and no card details are taken anywhere on it; payment instructions follow
            that confirmation.
          </p>
          <p>
            What we need from you is the intake form and an approval of the question bank. Nothing is
            measured until you approve it, and the bank is frozen at that point so that a retest
            measures the same questions. If we cannot deliver within the window stated in the
            confirmation, you choose between waiting and a full refund.
          </p>

          <h2>Refunds and the right of withdrawal</h2>
          <p>
            Before you approve and freeze the question bank you can cancel, for a full refund and
            without giving a reason. Once the bank is frozen the measurement has begun: every question
            is put to a paid engine API three times, those calls cannot be unspent, and the fee is
            therefore non-refundable from that moment. The email that asks you to approve the bank
            says so, and payment is taken after you have seen it.
          </p>
          <p>
            If you are a consumer in the EU or the UK you normally have 14 days to withdraw from a
            distance contract. This contract begins when you ask us to begin, so we ask you to confirm
            in writing that you want the bank frozen now and that you understand the right of
            withdrawal ends when the runs start. Without that confirmation we do not start, and you
            keep the full 14 days. Nothing in this section removes a right you have that cannot be
            excluded by agreement — including your rights if what we deliver does not match what was
            agreed.
          </p>
          <p>
            The <a href="/refund/">refunds page</a> states the same commitment in more detail, and it
            is the page to read before paying rather than after.
          </p>

          <h2>Who you are buying from, and which law applies</h2>
          <p>
            LLMention is an independent project operated from Shanghai, China. The seller&apos;s name
            and postal address are published on the <a href="/refund/">refunds page</a>. These terms
            are governed by the laws of the People&apos;s Republic of China, and disputes fall to the
            courts of the place of business. If you are a consumer, that choice of law does not deprive
            you of the protection of the mandatory rules of the country in which you live.
          </p>

          <h2>Scanning other people&apos;s sites</h2>
          <p>You may use the scanner on a domain if you own it or have permission to test it.</p>
          <ul>
            <li>
              A scan makes ordinary GET requests for publicly available files, from our servers.
              It does not authenticate, does not submit forms, and does not attempt to find
              vulnerabilities.
            </li>
            <li>
              Do not use the scanner to overload, probe or attack a third party. Rate limits apply,
              and circumventing them — by rotating addresses, scripting parallel requests or
              otherwise — is a breach of these terms.
            </li>
            <li>
              We may rate-limit, block or withdraw the free service at any time, including for a
              domain that generates complaints from its owner.
            </li>
          </ul>
          <p>
            If you own a site that has been scanned and you want a scan result page taken down,
            write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Scan result pages are
            excluded from search indexing already; see <a href="/robots.txt">robots.txt</a>.
          </p>

          <h2>What is not promised</h2>
          <p>
            <strong>
              No score or fix can guarantee that an AI engine will crawl, cite or recommend you.
            </strong>{" "}
            The engines change their behaviour without notice, and a score describes the properties
            of a page at a moment in time, not a future outcome. The methodology page is explicit
            about what the score cannot see, including firewall rules and anything behind a login.
            Anyone promising a citation outcome is guessing.
          </p>

          <h2>Intellectual property</h2>
          <p>
            The site, its text, its scoring method and its code are the property of LLMention, except
            for third-party material credited on the page where it appears. You are welcome to quote
            or cite this site with attribution and a link; wholesale republication is not permitted.
            You keep all rights in anything you submit to us.
          </p>
          <p>
            The readiness badge may be embedded for the domain it was issued to, and its score is
            verified server-side. Editing a badge to display a score that was not issued is not
            permitted, and it defeats the purpose of having one.
          </p>

          <h2>Availability and changes</h2>
          <p>
            The service is provided as it is and as it is available. Features may be added, changed
            or withdrawn, and free tools may gain or lose checks as the method is revised — the
            methodology page records what changed and why. Third-party links, including the
            published research this project relies on, are outside our control.
          </p>

          <h2>Advertising</h2>
          <p>
            This site is free to use and is supported by advertising served by Google. Ads are
            selected by Google, not by us, and their content is not an endorsement. How advertising
            cookies are handled is described in the <a href="/privacy/">privacy policy</a>.
          </p>

          <h2>Limits of liability</h2>
          <p>
            To the extent the law allows, we are not liable for indirect or consequential losses, lost
            profits, lost rankings or lost traffic. For a paid measurement, total liability is limited
            to the fee you paid for it. The free tools carry no monetary liability, because nothing is
            charged for them. Nothing in these terms excludes liability for fraud, or for anything else
            that cannot lawfully be excluded — including the consumer rights described above.
          </p>

          <h2>If these terms change</h2>
          <p>
            The date at the top changes when they do, and the change applies from that date.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms go to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or through the{" "}
            <a href="/contact/">contact page</a>.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-wrap gap-x-6 gap-y-2">
          <a href="/privacy/" className="text-xs text-[var(--accent)] hover:opacity-75">
            Privacy policy →
          </a>
          <a href="/" className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-1)]">
            Run a free scan
          </a>
        </div>
        <div className="mt-16 space-y-6 text-sm leading-relaxed text-[var(--ink-2)]">
          <h2 className="text-xl font-bold text-[var(--ink-1)]">What these terms commit us to</h2>
          <p>The free tools, and the one thing you can buy, stated here so they are easy to find.</p>
          <div className="overflow-x-auto">
          <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
            <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
              <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Subject</th>
              <th className="text-left px-4 py-2.5 font-semibold">Position</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">What is promised</td>
              <td className="px-4 py-2.5 align-top">The scanner runs the published checks and reports what it observed</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">What is not promised</td>
              <td className="px-4 py-2.5 align-top">Any citation, ranking or recommendation by an AI engine</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">What you may scan</td>
              <td className="px-4 py-2.5 align-top">Sites you own or have permission to test</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">What you may not scan</td>
              <td className="px-4 py-2.5 align-top">Targets designed to overload the service or probe private networks</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">What is sold</td>
              <td className="px-4 py-2.5 align-top">A measurement report at $299 and a quarterly retest at $499, ordered by email</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">What a paid report gives you</td>
              <td className="px-4 py-2.5 align-top">Per-question counts, the raw answers behind them, and the method — never a score out of 100, never a predicted citation</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-4 py-2.5 align-top">When a paid order is refundable</td>
              <td className="px-4 py-2.5 align-top">Until the question bank is frozen; after that the engine calls are already spent</td>
            </tr>
            </tbody>
          </table>
          </div>
        </div>

    </ProsePage>
  );
}
