import type { Metadata } from "next";
import Link from "next/link";
import PageFooter from "@/app/components/PageFooter";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { CONTACT_EMAIL } from "@/lib/site";

import { og } from "@/lib/og";

const TITLE = "Pricing — Free GEO Scanner and Manual Audits";
const DESCRIPTION =
  "The scanner and llms.txt generator are free and need no account. For teams that want a human-reviewed fix list, a one-time manual GEO audit.";

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

const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </Link>
          <Link
            href="/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
          >
            ← Back to Scanner
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-14">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Free to check. Paid only if you want a human to fix it.
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            The scanner, the /llms.txt generator and every guide on this site are free and
            need no account. The paid option is a one-time audit written by a person, for
            teams that want the fix list handed to them with the code already drafted.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-14">
          {/* Free */}
          <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-7 flex flex-col">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Free</h2>
            <div className="pt-4 pb-6">
              <span className="text-4xl font-black">$0</span>
              <span className="text-gray-500 text-sm font-mono pl-1">forever</span>
            </div>
            <ul className="doc-article text-xs text-gray-400 space-y-2 flex-1 list-none pl-0">
              <li>Unlimited AI crawler scans</li>
              <li>/llms.txt generation and validation</li>
              <li>Embeddable GEO readiness badge</li>
              <li>Schema.org and FAQ checks</li>
              <li>All documentation and guides</li>
              <li>No account required</li>
            </ul>
            <Link
              href="/"
              className="mt-7 text-center text-xs font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-3 rounded-xl transition-all"
            >
              Run a free scan
            </Link>
          </div>

          {/* Manual audit */}
          <div className="bg-gradient-to-b from-blue-950/40 to-gray-900/60 border border-blue-500/40 rounded-2xl p-7 flex flex-col relative">
            <span className="absolute -top-3 left-7 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-600 text-white">
              One-time
            </span>
            <h2 className="text-sm font-bold text-blue-300 uppercase tracking-wider pt-2">
              Manual GEO Audit
            </h2>
            <div className="pt-4 pb-6">
              <span className="text-4xl font-black">$199</span>
              <span className="text-gray-500 text-sm font-mono pl-1">once, no subscription</span>
            </div>
            <ul className="doc-article text-xs text-gray-300 space-y-2 flex-1 list-none pl-0">
              <li>Everything in Free</li>
              <li>Human review of up to 5 key pages</li>
              <li>Prioritised fix list, highest impact first</li>
              <li>Drafted <code>robots.txt</code>, <code>llms.txt</code> and JSON-LD, ready to paste</li>
              <li>Written explanation of what each fix changes</li>
              <li>Delivered within 48 hours, as a PDF</li>
            </ul>
            <a
              href={mailto("Manual GEO Audit — request")}
              className="mt-7 text-center text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl transition-all"
            >
              Request an audit →
            </a>
            <p className="text-[10px] text-gray-500 text-center pt-3 leading-relaxed">
              Send the pages you care about. You get a reply before any payment is taken.
            </p>
          </div>

          {/* Monitoring */}
          <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-7 flex flex-col">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
              Monitoring
            </h2>
            <div className="pt-4 pb-6">
              <span className="text-2xl font-black text-gray-400">Coming soon</span>
            </div>
            <ul className="doc-article text-xs text-gray-400 space-y-2 flex-1 list-none pl-0">
              <li>Weekly re-scan of your key pages</li>
              <li>Email alert when a change breaks AI access</li>
              <li>Score history, so you can see what a fix actually moved</li>
              <li>robots.txt and schema change detection</li>
            </ul>
            <a
              href={mailto("Monitoring — notify me when it launches")}
              className="mt-7 text-center text-xs font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-3 rounded-xl transition-all"
            >
              Tell me when it launches →
            </a>
          </div>
        </div>

        <div className="doc-article text-sm text-gray-400 max-w-3xl mx-auto pt-16">
          <h2>Why is the scanner free?</h2>
          <p>
            Because a one-shot scan is cheap to run and cheap to copy. Charging for it would
            put us in the same bucket as every other tool that hides the PDF behind a paywall.
            The scan tells you <em>what</em> is wrong; the audit is for teams that want
            somebody else to work out <em>what to do about it</em>.
          </p>

          <h2>What happens after I send the request?</h2>
          <p>
            You get a reply within one business day. If the audit is a fit, you receive a short
            scope note and a payment link; if it is not — for example, if your problem is not
            something GEO can fix — you will be told that instead. No payment is taken before
            you agree to the scope.
          </p>

          <h2>Do you offer refunds?</h2>
          <p>
            Yes, and without a form to fill in. If the audit does not identify anything actionable
            on the pages you submitted, reply to the delivery email within 14 days and it is
            refunded in full to the original payment method. The terms are set out on the{" "}
            <a href="/refund/" className="text-blue-400 hover:text-blue-300 underline">
              refund policy
            </a>{" "}
            page.
          </p>
        </div>
                <div className="mt-16 space-y-6 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-white">Free scan or paid audit</h2>
          <p>Both use the same published method. The difference is who does the interpreting.</p>
          <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
              <th className="text-left px-4 py-2.5 font-semibold"></th>
              <th className="text-left px-4 py-2.5 font-semibold">Free scan</th>
              <th className="text-left px-4 py-2.5 font-semibold">Manual audit</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Cost</td>
              <td className="px-4 py-2.5 align-top">$0, no account</td>
              <td className="px-4 py-2.5 align-top">$199 once, no subscription</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Scope</td>
              <td className="px-4 py-2.5 align-top">One homepage, per request</td>
              <td className="px-4 py-2.5 align-top">Up to five pages you choose</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Output</td>
              <td className="px-4 py-2.5 align-top">A score, twelve dimension scores and the failed checks with the evidence each produced</td>
              <td className="px-4 py-2.5 align-top">The same, plus a prioritised fix list with robots.txt, llms.txt and JSON-LD already drafted</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Turnaround</td>
              <td className="px-4 py-2.5 align-top">Seconds</td>
              <td className="px-4 py-2.5 align-top">48 hours from payment</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Refund</td>
              <td className="px-4 py-2.5 align-top">Not applicable</td>
              <td className="px-4 py-2.5 align-top">Full refund if the audit finds nothing actionable</td>
            </tr>
            </tbody>
          </table>
          </div>
        </div>

<div className="mt-16 space-y-10 text-sm leading-relaxed text-gray-300">
          <Faq
            title="Questions about pricing"
            items={[
            { q: "Why is the scanner free?", a: "Because a one-shot scan is cheap to run and cheap to copy. Charging for it would put this in the same bucket as every tool that hides the result behind a paywall." },
            { q: "What does the audit buy that the free scan does not?", a: "A person reading up to five of your pages and handing back the fix list with the code already drafted, rather than a score and a list of failed checks you still have to interpret." },
            { q: "Is the audit a subscription?", a: "No. It is one payment for one delivery, and nothing recurring is charged." },
            { q: "What happens if the audit finds nothing to fix?", a: "It is refunded in full. Reply to the delivery email within 14 days and the refund goes back to the original payment method." },
            ]}
          />
          <Evidence
            quote={GEO_PRIMARY_QUOTE}
            attribution="Generative Engine Optimization, KDD 2024"
            attributionUrl="https://arxiv.org/abs/2311.09735"
            sources={GEO_PRIMARY_SOURCES}
            note="The weightings on this site follow that measurement rather than taste, and the parts of the picture a single-URL scan cannot see are stated rather than left out."
          />
        </div>

      </main>

      <PageFooter width="5xl" />
    </div>
  );
}
