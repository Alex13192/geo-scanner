import type { Metadata } from "next";
import PageFooter from "@/app/components/PageFooter";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Terms of service.
 *
 * This page exists for the same reason /refund/ does: the paid product is sold
 * through this site, and both AdSense review and the payment providers check
 * that a site asking for money states its terms somewhere reachable.
 *
 * Two deliberate omissions, because inventing either would be worse than
 * leaving it out:
 *  - No governing-law clause naming a country. The operator's jurisdiction is
 *    not recorded anywhere on this site, and a guessed choice of law is a claim
 *    that can be wrong. The consumer-rights paragraph below covers the part
 *    that actually matters to a buyer.
 *  - No "we may use your content however we like" licence over submitted
 *    material. Nothing in the product needs it.
 *
 * Not legal advice. Have it reviewed before selling to consumers in the EU.
 */
import { og } from "@/lib/og";

const TITLE = "Terms of service";
const DESCRIPTION =
  "The rules for using the free LLMention scanner and buying a manual GEO audit: what is promised, what is not, and what you may and may not scan.";
const UPDATED = "2 October 2026";

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
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </a>
          <a
            href="/pricing/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            ← Pricing
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Legal
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {TITLE}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">{DESCRIPTION}</p>
          <p className="text-xs text-gray-500 font-mono">Last updated {UPDATED}</p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>Agreement</h2>
          <p>
            By using this site you agree to these terms. If you do not agree with them, do not use
            the site. They apply to the free scanner, the /llms.txt generator, the guides, and the
            paid manual audit.
          </p>

          <h2>What the service is</h2>
          <p>
            LLMention audits whether AI search engines and LLM crawlers can reach, parse and cite a
            website, and generates <code>llms.txt</code> context files. The scanner, the generator
            and all documentation are free and need no account. The paid option is a one-time manual
            audit, described on the <a href="/pricing/">pricing page</a>.
          </p>
          <p>
            The readiness score is an <strong>automated opinion</strong> produced by applying
            published rules to what a page returns. The complete method — every check, its weight
            and its rule — is published at <a href="/methodology/">methodology</a>, so the basis of
            any score can be inspected and disputed rather than taken on trust.
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

          <h2>The paid audit</h2>
          <p>
            The audit is a one-time purchase, not a subscription, and nothing recurring is charged.
            It covers a human review of up to five pages you nominate, a prioritised fix list, and
            drafted <code>robots.txt</code>, <code>llms.txt</code> and JSON-LD, delivered as a PDF
            within 48 hours. No payment is taken before the scope is agreed. The commitment that
            applies to refunds is set out in full on the{" "}
            <a href="/refund/">refund policy</a> page, which forms part of these terms.
          </p>

          <h2>What is not promised</h2>
          <p>
            <strong>
              No audit, score or fix can guarantee that an AI engine will crawl, cite or recommend
              you.
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
            To the extent the law allows, we are not liable for indirect or consequential losses,
            lost profits, lost rankings or lost traffic. Our total liability for any claim connected
            to the paid audit is limited to the amount you paid for it; for the free tools, no
            payment was made, so no monetary liability arises. Nothing in these terms excludes
            liability for fraud, for anything else that cannot lawfully be excluded, or any right
            you have as a consumer that cannot be waived.
          </p>

          <h2>Consumers in the EU, the UK and elsewhere</h2>
          <p>
            If you buy as a consumer, you keep the mandatory protections of the law of your country
            of residence, and nothing here overrides them. That includes the statutory right to
            withdraw from a distance contract within 14 days. The{" "}
            <a href="/withdrawal/">right of withdrawal</a> page carries the full notice and the
            model withdrawal form you are entitled to before the contract is concluded. The
            practical effect is stated on the <a href="/refund/">refund policy</a>: if the audit
            does not identify anything actionable on the pages you submitted, it is refunded in
            full, which is a more generous commitment than the statutory minimum in that situation.
            Some jurisdictions also require a seller to provide notices that are not published here;
            where that applies, the notices are given separately at the point of sale.
          </p>

          <h2>If these terms change</h2>
          <p>
            The date at the top changes when they do. A purchase is governed by the terms in force
            on the day it was made.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms go to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or through the{" "}
            <a href="/contact/">contact page</a>.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/privacy/" className="text-xs text-blue-400 hover:text-blue-300">
            Privacy policy →
          </a>
          <a href="/refund/" className="text-xs text-blue-400 hover:text-blue-300">
            Refund policy →
          </a>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
            Run a free scan
          </a>
        </div>
        <div className="mt-16 space-y-6 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-white">What these terms commit us to</h2>
          <p>Three promises and one limit, stated here so they are easy to find.</p>
          <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Subject</th>
              <th className="text-left px-4 py-2.5 font-semibold">Position</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">What is promised</td>
              <td className="px-4 py-2.5 align-top">The scanner runs the published checks and reports what it observed</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">What is not promised</td>
              <td className="px-4 py-2.5 align-top">Any citation, ranking or recommendation by an AI engine</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">What you may scan</td>
              <td className="px-4 py-2.5 align-top">Sites you own or have permission to test</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">What you may not scan</td>
              <td className="px-4 py-2.5 align-top">Targets designed to overload the service or probe private networks</td>
            </tr>
            </tbody>
          </table>
          </div>
        </div>

      </main>

      <PageFooter width="3xl" />
    </div>
  );
}
