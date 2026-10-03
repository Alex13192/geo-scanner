import type { Metadata } from "next";
import PageFooter from "@/app/components/PageFooter";
import { LEGAL_NAME_LATIN } from "@/lib/legal-entity";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Withdrawal notice, in English, for consumers in the EU and the UK.
 *
 * WHY THIS PAGE EXISTS AFTER THE GERMAN SITE WAS REMOVED: the German
 * Widerrufsbelehrung was deleted along with the German half of the site, but the
 * right it described was never a German-market artefact. A consumer in the EU or
 * the UK has a statutory right to withdraw from a distance contract whoever the
 * trader is and whatever language the site is published in, and the notice has
 * to be given BEFORE the consumer is bound. Removing the page would have removed
 * the notice without removing the right, which is the one thing deletion cannot
 * do. The German text was therefore replaced rather than dropped.
 *
 * Wording is deliberately jurisdiction-neutral: the operator is established in
 * China, so the governing consumer protection is the buyer's own. Where the
 * German implementation is the stricter and better known one, it is named in
 * brackets rather than asserted as the only law that applies.
 *
 * WHAT IS DELIBERATELY ABSENT: the operator's postal address. It was published
 * while the German Impressum existed, because section 5 DDG requires a
 * serviceable address; the German pages are gone and the address is out of the
 * source. A withdrawal can be declared by email, and naming the operator plus an
 * email address is enough for a consumer to act on. If a market is later added
 * that requires an address in writing, see the note in lib/legal-entity.ts -
 * make the repository private before that address goes back into a file.
 *
 * NOT LEGAL ADVICE. Have it reviewed before selling to consumers in the EU.
 */
import { og } from "@/lib/og";

const TITLE = "Right of withdrawal";
const DESCRIPTION =
  "How a consumer in the EU or the UK withdraws from a manual GEO audit contract within 14 days, what that means for the refund, and the model withdrawal form.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/withdrawal/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/withdrawal/",
  }),
};

export default function WithdrawalPage() {
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
            href="/refund/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            ← Refund policy
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
          <p className="text-xs text-gray-500 font-mono">
            For consumers in the EU and the UK
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>Who this applies to</h2>
          <p>
            This page is for consumers: a natural person acting for purposes outside their trade,
            business, craft or profession. It applies to the paid manual audit. The scanner and the
            llms.txt generator are free, so there is nothing to withdraw from.
          </p>

          <h2>Your right of withdrawal</h2>
          <p>
            You have the right to withdraw from the contract within <strong>fourteen days</strong>{" "}
            without giving any reason. The period runs from the day the contract was concluded.
          </p>
          <p>
            To withdraw, send us an unambiguous statement of your decision — email is enough. Write
            to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or use the model form at the
            bottom of this page, which you are not obliged to use. Sending the statement before the
            period expires is sufficient; you do not have to wait for a reply.
          </p>

          <h2>What happens if you withdraw</h2>
          <p>
            We refund every payment we received from you without undue delay and at the latest
            within fourteen days of the day your withdrawal reaches us. We use the same means of
            payment you used for the original transaction unless we expressly agree otherwise, and
            you are not charged any fee for the refund.
          </p>
          <p>
            If you asked us to begin work during the fourteen days, you owe a proportionate amount
            for the part of the service already performed when you told us you were withdrawing,
            measured against the full scope of the contract.
          </p>

          <h2>When the right lapses early</h2>
          <p>
            For a service, the right of withdrawal does not simply expire on its own after fourteen
            days. It lapses early only if we fully performed the service <em>and</em> we began with
            your express consent <em>and</em> you confirmed at the same time that you understood you
            would lose the right by letting us begin (this is the position in Germany, section
            356(4) BGB; other member states implement the same idea in their own wording).
          </p>
          <p>
            <strong>
              Until you have given that consent, your right of withdrawal survives even after work
              has started.
            </strong>{" "}
            We will ask you explicitly before we begin, and we keep your answer on file.
          </p>

          <h2>How this works before you pay</h2>
          <p>
            The order flow is built so that you cannot lose the right without noticing:
          </p>
          <ul>
            <li>
              You send the pages you want reviewed. Before any payment you receive a short scope
              note with the extent of the work, the price and the delivery time.
            </li>
            <li>
              That message contains this notice and the model withdrawal form, so they are in your
              hands in text form before the contract is concluded.
            </li>
            <li>
              Only then do you receive the payment link. Nothing is charged until you have agreed to
              the scope.
            </li>
            <li>
              If you want delivery inside the fourteen days, we ask you beforehand whether we may
              begin before the period ends, and you confirm that you understand you lose the right
              by doing so. Without that confirmation we either wait, or you remain free to withdraw.
            </li>
          </ul>

          <h2>Our voluntary promise, which goes further</h2>
          <p>
            Independently of the statutory right: if the audit does not identify anything actionable
            on the pages you submitted, the full price is refunded. That is a voluntary commitment
            beyond what the law requires, set out in full in the{" "}
            <a href="/refund/">refund policy</a>. It does not narrow your right of withdrawal.
          </p>

          <h2>Model withdrawal form</h2>
          <p className="text-gray-400">
            (Complete and return this form only if you wish to withdraw from the contract.)
          </p>
          <p>
            To:
            <br />
            {LEGAL_NAME_LATIN}
            <br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the
            provision of the following service (*):
            <br />
            _______________________________________________
          </p>
          <p>Ordered on (*) / received on (*): _______________________________________________</p>
          <p>Name of consumer(s): _______________________________________________</p>
          <p>Address of consumer(s): _______________________________________________</p>
          <p>
            Signature of consumer(s) (only if this form is notified on paper):
            <br />
            _______________________________________________
          </p>
          <p>Date: _______________________________________________</p>
          <p className="text-gray-400">(*) Delete as appropriate.</p>

          <h2>Other pages that go with this one</h2>
          <p>
            The <a href="/terms/">terms of service</a> state what is and is not promised, the{" "}
            <a href="/refund/">refund policy</a> is the voluntary commitment described above, and the{" "}
            <a href="/privacy/">privacy policy</a> covers what is processed when you contact us.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/refund/" className="text-xs text-blue-400 hover:text-blue-300">
            Refund policy →
          </a>
          <a href="/contact/" className="text-xs text-blue-400 hover:text-blue-300">
            Contact →
          </a>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
            Run a free scan
          </a>
        </div>
        <div className="mt-16 space-y-6 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-white">The withdrawal period in practice</h2>
          <p>Consumers in the EU and the UK have fourteen days. This is what each part of that window means.</p>
          <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Point in time</th>
              <th className="text-left px-4 py-2.5 font-semibold">What it means</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Day 0</td>
              <td className="px-4 py-2.5 align-top">The contract is concluded, and the fourteen days begin</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Within day 14</td>
              <td className="px-4 py-2.5 align-top">Send an unambiguous statement by email; no form and no reason required</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">If you asked us to start early</td>
              <td className="px-4 py-2.5 align-top">You owe a proportionate amount for work already done, and the rest is refunded</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">After a completed delivery you consented to</td>
              <td className="px-4 py-2.5 align-top">The right lapses only if you expressly agreed to begin and understood that it would</td>
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
