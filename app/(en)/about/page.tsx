import type { Metadata } from "next";
import Link from "next/link";
import PageFooter from "@/app/components/PageFooter";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { CONTACT_EMAIL } from "@/lib/site";

import { og } from "@/lib/og";

const TITLE = "About LLMention";
const DESCRIPTION =
  "What LLMention is, why it publishes its scoring method in full, who maintains it, and what the scanner deliberately does not do.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/about/",
  }),
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            About
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            About LLMention
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            A free scanner that tells you whether AI search engines can read, parse and cite your
            pages, and publishes the rules it uses to decide.
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>Why this exists</h2>
          <p>
            People increasingly get answers from an assistant instead of clicking a link. When
            that happens, a page that ranks well but is never quoted has lost the visitor
            entirely, and the usual analytics will not tell you why. LLMention exists to make
            that failure mode visible before it costs you traffic.
          </p>
          <p>
            The category has a credibility problem in the other direction too. Tools describe
            mysterious &ldquo;AI visibility scores&rdquo; without saying how they are computed,
            and some make claims about files and markup that the evidence does not support. This
            project takes the opposite approach.
          </p>

          <h2>What makes it different</h2>
          <ul>
            <li>
              <strong>The method is published in full.</strong> All twelve dimensions, every
              check, its exact rule and its point value are on the{" "}
              <Link href="/methodology/">methodology page</Link>, generated from the same data the
              scanner executes, so the documentation cannot drift from the behaviour.
            </li>
            <li>
              <strong>No score floors.</strong> A page that satisfies nothing scores near zero
              rather than being lifted to a respectable-looking minimum.
            </li>
            <li>
              <strong>Low-value signals are weighted low.</strong> <code>llms.txt</code> is one
              of the three least-weighted dimensions here, because Google has said it does not
              use it in Search and crawler support is inconsistent. Several tools in this
              category imply otherwise.
            </li>
            <li>
              <strong>Limits are stated up front.</strong> The scanner does not query ChatGPT
              about your brand. It measures whether your pages are in a state that makes being
              cited possible, which is a narrower and more honest claim.
            </li>
          </ul>

          <h2>Who runs it</h2>
          <p>
            LLMention is maintained by the LLMention team as an independent project. It is not
            affiliated with OpenAI, Anthropic, Google or Perplexity, and it holds no data
            relationship with them. The scanner is free, it requires no account, and there is
            nothing on this site to buy.
          </p>
          <p>
            Written and maintained by the LLMention team. The scoring method is published in
            full on the <Link href="/methodology/">methodology page</Link>, and the source is
            public at{" "}
            <a
              href="https://github.com/Alex13192/geo-scanner"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/Alex13192/geo-scanner
            </a>
            , so a disagreement with a result can be specific: say which check and which URL.
          </p>

          <h2>Contact</h2>
          <p>
            Questions and corrections both go to the same place:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If the scanner reports
            something about your site that you believe is wrong, that is the most useful message
            you can send, and the method is public specifically so a disagreement can be
            specific.
          </p>

          <h2>Primary sources</h2>
          <p>
            Where this project makes a judgement about what generative engines favour, it follows
            published research rather than folklore:
          </p>
          <ul>
            <li>
              <a href="https://arxiv.org/abs/2311.09735" target="_blank" rel="noopener noreferrer">
                Generative Engine Optimization: How to Dominate AI Search
              </a>{" "}
              — KDD 2024, Princeton and Georgia Tech.
            </li>
            <li>
              <a href="https://arxiv.org/abs/2510.11438" target="_blank" rel="noopener noreferrer">
                What Generative Search Engines Like
              </a>
            </li>
            <li>
              <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">
                The llms.txt convention
              </a>
            </li>
          </ul>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60">
          <Link href="/" className="text-xs text-blue-400 hover:text-blue-300">
            Run a free GEO audit on your own site →
          </Link>
        </div>
                <div className="mt-16 space-y-6 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-white">What the scanner does and does not do</h2>
          <p>In the published study over 30 homepages, 2 of them (7%) reached a B or above and none reached an A. That result is easier to read with the scope stated plainly.</p>
          <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
              <th className="text-left px-4 py-2.5 font-semibold">It does</th>
              <th className="text-left px-4 py-2.5 font-semibold">It does not</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Fetch your homepage the way a crawler would</td>
              <td className="px-4 py-2.5 align-top">Execute JavaScript, so a client-rendered page is judged as a crawler sees it</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Read robots.txt, llms.txt and the sitemap when they exist</td>
              <td className="px-4 py-2.5 align-top">Sign in, submit a form, or reach anything behind a paywall</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Report each failed check with the evidence that produced it</td>
              <td className="px-4 py-2.5 align-top">Ask any AI engine whether your brand is mentioned, recommended or cited</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Publish every rule, its weight and its pass condition</td>
              <td className="px-4 py-2.5 align-top">Predict a citation, or promise a ranking</td>
            </tr>
            </tbody>
          </table>
          </div>
        </div>

<div className="mt-16 space-y-10 text-sm leading-relaxed text-gray-300">
          <Faq
            title="Questions about the project"
            items={[
            { q: "Who runs LLMention?", a: "An independent project, maintained by the team named on the contact page. It is not affiliated with OpenAI, Anthropic, Google or Perplexity, and holds no data relationship with any of them." },
            { q: "Why publish the scoring method in full?", a: "Because the category has a credibility problem in the other direction: tools describe mysterious AI visibility scores without saying how they are computed. A method you cannot inspect is not evidence." },
            { q: "Does the scanner query ChatGPT about my brand?", a: "No. It measures whether your pages are in a state that makes being cited possible, which is a narrower claim than whether you are being cited, and a more defensible one." },
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

      <PageFooter width="3xl" />
    </div>
  );
}
