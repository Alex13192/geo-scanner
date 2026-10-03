import type { Metadata } from "next";
import LegalLinks from "@/app/components/LegalLinks";

/**
 * Refund policy.
 *
 * This page exists because /pricing/ promised "See the refund policy for
 * details" while no such page existed - a dead reference standing behind a
 * request for money, which is the worst place on a site to be vague.
 *
 * The terms below are the plain-language version, and they match what the
 * pricing page already said. They are not legal advice, and they do not
 * discharge the separate obligations that selling to consumers in the EU
 * creates (an Impressum and a withdrawal notice among them).
 */
const TITLE = "Refund policy";
const DESCRIPTION =
  "When a manual GEO audit is refunded, how to ask for it, and how long it takes. The plain-language terms, without a form to fill in.";
const CONTACT_EMAIL = "hello@ccie13192.com";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/refund/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/refund/", type: "article" },
};

export default function RefundPage() {
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
            Terms
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {TITLE}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">{DESCRIPTION}</p>
          <p className="text-xs text-gray-500 font-mono">Applies to the manual GEO audit</p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>What is covered</h2>
          <p>
            The paid product is a single manual GEO audit, priced at $199 as a one-time payment.
            It is not a subscription, and nothing recurring is charged. The free scanner and the
            llms.txt generator are free and are not part of this policy, because there is nothing
            to refund.
          </p>

          <h2>When a refund is due</h2>
          <p>
            <strong>If the audit does not identify anything actionable on the pages you
            submitted, it is refunded in full.</strong> That is the commitment the pricing page
            makes, and it is the one that applies. In practice this covers the case where a site
            is already in good shape and the honest answer is that there is nothing worth paying
            to fix.
          </p>

          <h2>How to ask for one</h2>
          <p>
            There is no form. Reply to the email that delivered your audit, within 14 days of
            receiving it, and say that you would like a refund. You do not have to give a reason.
            If you would rather start a new message, write to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            with the domain you ordered for.
          </p>

          <h2>How long it takes</h2>
          <p>
            Refunds are issued to the original payment method within 5 business days of the
            request. Your bank or card issuer may take a few further days to show it. You will get
            a confirmation from us when the refund has been issued, so there is no need to chase
            it.
          </p>

          <h2>What is not covered</h2>
          <ul>
            <li>
              Work already delivered and acted on. If the audit told you what to fix and you want
              a refund for a reason unrelated to its content, write to us anyway and we will
              consider it.
            </li>
            <li>
              A disagreement with the score itself. The free scanner produces the same score, and
              it can be run before paying. If you believe a specific check is wrong, tell us which
              one — that is a bug report, and we would rather fix the check than take the money.
            </li>
            <li>
              Results. No audit can promise that an AI engine will cite you. Any service claiming
              otherwise is guessing.
            </li>
          </ul>

          <h2>Not legal advice</h2>
          <p>
            This page states the terms in plain language so that they can be read in a minute. It
            is not a substitute for the notices that consumer law in some jurisdictions requires
            a seller to provide, and it does not replace them.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/pricing/" className="text-xs text-blue-400 hover:text-blue-300">
            ← Back to pricing
          </a>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
            Run a free scan
          </a>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        <LegalLinks className="mb-3" />
        © 2026 LLMention. Brand Generative Engine Optimization Intelligence.
      </footer>
    </div>
  );
}
