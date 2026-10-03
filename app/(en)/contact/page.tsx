import type { Metadata } from "next";
import LegalLinks from "@/app/components/LegalLinks";

/**
 * Contact page.
 *
 * Why a separate route rather than just the mailto in the About page: the
 * reviewers who decide whether this site may show ads or take payments look for
 * a contact route in the footer, and "it is mentioned somewhere in the body of
 * the about page" is not a route. The address itself was already real and
 * consistent across the site; this page makes it findable and says what to send.
 *
 * There is deliberately no contact form. A form would mean storing messages on
 * a server that otherwise holds nothing about visitors, which would contradict
 * the privacy policy for no benefit.
 */
const TITLE = "Contact";
const DESCRIPTION =
  "How to reach LLMention: corrections to a score, audit requests, privacy requests and press. A real address, answered by the person who maintains the tool.";
const CONTACT_EMAIL = "hello@ccie13192.com";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/contact/", type: "article" },
};

const ROUTES = [
  {
    subject: "A score you believe is wrong",
    detail:
      "The most useful message you can send. Say which check and which URL; the full method is public so a disagreement can be specific, and a wrong check gets fixed rather than argued about.",
    mailto: `mailto:${CONTACT_EMAIL}?subject=Wrong%20score%20report`,
    action: "Report a wrong score",
  },
  {
    subject: "A manual audit",
    detail:
      "Send the pages you care about. You get a reply within one business day with a scope note, and no payment is taken before you agree to it. The scope and price are on the pricing page.",
    mailto: `mailto:${CONTACT_EMAIL}?subject=Manual%20GEO%20audit%20—%20request`,
    action: "Request an audit",
  },
  {
    subject: "A data request",
    detail:
      "Access, correction, deletion or an objection under the GDPR, or a scan result page you want taken down. No form is needed and you do not have to give a reason.",
    mailto: `mailto:${CONTACT_EMAIL}?subject=Data%20request`,
    action: "Make a data request",
  },
  {
    subject: "Anything else",
    detail:
      "Press, corrections to a guide, or a question about the method. If a claim on this site cannot be sourced, that is worth knowing and worth reporting.",
    mailto: `mailto:${CONTACT_EMAIL}?subject=Question`,
    action: "Send a question",
  },
];

export default function ContactPage() {
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
            href="/about/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            ← About
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Contact
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {TITLE}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">{DESCRIPTION}</p>
        </div>

        <div className="bg-gradient-to-r from-blue-950/20 via-gray-900/60 to-purple-950/20 border border-gray-800 rounded-2xl p-8 space-y-3">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">Email</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-lg md:text-2xl font-bold text-blue-400 hover:text-blue-300 underline break-all"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs text-gray-400 leading-relaxed">
            One address for everything, read by the person who maintains the tool. Audit requests
            get a reply within one business day; everything else as fast as it can be answered
            properly.
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed mt-10">
          <h2>What to write about</h2>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROUTES.map((route) => (
            <div
              key={route.subject}
              className="bg-[#0b1018] border border-gray-800/80 rounded-2xl p-6 space-y-3 flex flex-col"
            >
              <h3 className="text-sm font-bold text-white">{route.subject}</h3>
              <p className="text-xs text-gray-400 leading-relaxed flex-1">{route.detail}</p>
              <a
                href={route.mailto}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                {route.action} →
              </a>
            </div>
          ))}
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed mt-4">
          <h2>There is no contact form</h2>
          <p>
            Deliberately. A form would mean storing your message on a server that otherwise keeps
            nothing about visitors, which would contradict the{" "}
            <a href="/privacy/">privacy policy</a> for no real benefit. Email also means you get a
            copy of what you sent and a reply you can keep.
          </p>

          <h2>Who you are writing to</h2>
          <p>
            LLMention is an independent project, not a company with a support desk. Who maintains
            it, what it deliberately does not do, and where the source lives are all on the{" "}
            <a href="/about/">about page</a>. If a claim on this site cannot be traced to a source,
            or a check produces a result you believe is wrong, that is the message worth sending.
          </p>

          <h2>What not to send</h2>
          <p>
            Please do not send credentials, API keys, personal data about other people, or anything
            confidential. Nothing in the product needs it, and email is not a secure channel for it.
          </p>

          <h2>Other pages that may answer it faster</h2>
          <ul>
            <li>
              <a href="/methodology/">Methodology</a> — every check, its weight and its exact rule,
              including what the score cannot see.
            </li>
            <li>
              <a href="/pricing/">Pricing</a> and the <a href="/refund/">refund policy</a> — what the
              paid audit covers and when it is refunded.
            </li>
            <li>
              <a href="/docs/">Guides</a> — how to allow AI crawlers, deploy an llms.txt file, and
              add the structured data.
            </li>
          </ul>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/privacy/" className="text-xs text-blue-400 hover:text-blue-300">
            Privacy policy →
          </a>
          <a href="/terms/" className="text-xs text-blue-400 hover:text-blue-300">
            Terms of service →
          </a>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
            Run a free scan
          </a>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        <LegalLinks className="mb-3" />
        <div>© 2026 LLMention. Brand Generative Engine Optimization Intelligence.</div>
      </footer>
    </div>
  );
}
