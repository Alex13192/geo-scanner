import { Suspense } from "react";
import Link from "next/link";
import LegalLinks from "@/app/components/LegalLinks";
import BadgeWidget from "./BadgeWidget";

/**
 * /readiness-badge/ - the server-rendered half.
 *
 * WHY THIS FILE IS A SERVER COMPONENT:
 * It used to be a single "use client" module, and the route prerendered to the
 * string "Loading Badge Generator..." - twelve words of HTML and not one <a
 * href>. The cause was useSearchParams(), which opts its subtree out of
 * prerendering, so `next build` wrote the Suspense fallback instead of the page.
 *
 * The irony was specific: a site whose product is scoring other people's markup
 * shipped its own badge page as an empty document, and its own scanner could not
 * see it because the scanner only analyses homepages. Building the site and
 * scoring the output caught it - see scripts/check-built-pages.mts.
 *
 * So the copy below is deliberately here. The interactive widget is the only
 * client-rendered part and it lives in BadgeWidget.tsx.
 */
export default function ReadinessBadgePage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                L
              </span>
              <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
            </Link>
            <nav
              aria-label="Sections"
              className="hidden md:flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs"
            >
              <Link
                href="/report/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Audit Overview
              </Link>
              <Link
                href="/llms-txt-studio/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </Link>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                Readiness Badge
              </span>
              <Link
                href="/methodology/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Embeddable Widget
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            GEO Readiness Badge Generator
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Embeds a badge carrying the score from a real scan. The number is read from the scan
            and cannot be edited, so the badge means something to whoever sees it.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-6 text-gray-500 text-sm">
              Loading the badge generator…
            </div>
          }
        >
          <BadgeWidget />
        </Suspense>

        <section className="mt-16 max-w-3xl space-y-10 text-sm leading-relaxed text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">What the badge is</h2>
            <p>
              It is a shields.io image, generated from a scan of your homepage, that carries your
              score out of 100 and links back to the report it came from. Two formats are offered:
              Markdown for a GitHub README, and HTML for a site footer.
            </p>
            <p className="mt-3">
              The colour is not decorative. It is chosen from the score: green at 80 and above,
              amber from 60 to 79, red below 60. A reader can tell roughly where you stand without
              clicking anything.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              Why the number cannot be typed in
            </h2>
            <p>
              It is worth being explicit, because most badge generators let you set your own score.
            </p>
            <blockquote className="border-l-2 border-purple-500 pl-4 mt-4 text-gray-400">
              A badge whose number the bearer chooses is not evidence of anything. — the design
              note this page was built from
            </blockquote>
            <p className="mt-4">
              So the field is read-only. If the scan fails, or if your homepage answers with a block
              page or an error document rather than the page itself, no embed code is produced at
              all. Saying nothing is better than handing somebody a number they cannot defend when
              asked where it came from.
            </p>
            <p className="mt-3">
              The same rule applies to the badge as to a score: it is a claim about whether your
              pages are in a state that makes being cited possible. It is not a claim that any
              engine currently cites you.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How do I embed it?</h2>
            <p>Four steps, and the third one is the one people skip.</p>
            <ol className="list-decimal pl-5 mt-3 space-y-1.5">
              <li>Enter your domain and check the score. Nothing is generated until a scan succeeds.</li>
              <li>Pick a preview style. All three embed the same flat shields.io image.</li>
              <li>
                Copy the snippet and paste it, then <strong>click the badge once</strong> to confirm
                it resolves. A badge that 404s is worse than no badge.
              </li>
              <li>
                Re-scan and replace the snippet whenever your site changes, because the number is
                baked into the image at copy time and will not move by itself.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              What does the badge actually prove?
            </h2>
            <p>
              It proves that on the date of the scan, the homepage satisfied a specific, published
              set of checks. Nothing more. The scanner runs 40 checks across 12 weighted dimensions,
              and every rule and its point value is on the{" "}
              <Link href="/methodology/" className="text-blue-400 hover:text-blue-300 underline">
                methodology page
              </Link>
              .
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-2 pr-4 font-semibold text-white">The badge shows</th>
                    <th className="py-2 font-semibold text-white">The badge does not show</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800/60">
                    <td className="py-2 pr-4">
                      Whether crawlers can reach the page, from robots.txt and the response
                    </td>
                    <td className="py-2">
                      Whether any AI engine currently mentions, recommends or cites you
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800/60">
                    <td className="py-2 pr-4">
                      Whether the markup gives a model something extractable: entity data,
                      structure, evidence
                    </td>
                    <td className="py-2">
                      Whether a citation is likely. Readiness is a precondition, not a prediction
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      The homepage only, on the date stamped in the report
                    </td>
                    <td className="py-2">
                      Anything about your interior pages, which a one-URL scan never reads
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-gray-400">
              The dimension carrying the most weight is crawler access at 16%, because a page that
              cannot be read has no path to being quoted at all. The dimensions carrying the least
              are delivery and international readiness, and the reasoning for every weight is
              published rather than asserted.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              Questions about embedding the badge
            </h2>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "Does the badge update automatically?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No. The score is baked into the image URL when you copy the snippet, so it stays at that number until you replace the snippet. The page used to be advertised as a real-time badge, which was wrong.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Can I set the score myself?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No, deliberately. A badge whose number the bearer chooses is not evidence of anything, so the score field is read-only and is filled only from a successful scan.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What happens if my site blocks the scan?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No embed code is generated. If the homepage answers with an error or a block page rather than the page itself, there is no honest score to display, and the page says so instead of showing a number.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Should I remove the badge if my score drops?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "That is your call, but a badge that disagrees with the report it links to is worse than no badge. Re-scan, and either fix the page or take the badge down.",
                      },
                    },
                  ],
                }),
              }}
            />
            <h3 className="font-semibold text-white mt-4 mb-1">
              Does the badge update automatically?
            </h3>
            <p>
              No. The score is baked into the image URL when you copy the snippet, so it stays at
              that number until you replace the snippet.
            </p>

            <h3 className="font-semibold text-white mt-5 mb-1">
              Can I set the score myself?
            </h3>
            <p>
              No, deliberately. The score field is read-only and is filled only from a successful
              scan.
            </p>

            <h3 className="font-semibold text-white mt-5 mb-1">
              What happens if my site blocks the scan?
            </h3>
            <p>
              No embed code is generated. There is no honest score to display, so the page says so
              rather than showing a number.
            </p>

            <h3 className="font-semibold text-white mt-5 mb-1">
              Should I remove the badge if my score drops?
            </h3>
            <p>
              That is your call, but a badge that disagrees with the report it links to is worse
              than no badge.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              What the badge will not do for you
            </h2>
            <p>
              The badge is a small artefact, and it is fair to say what it is not, because the
              evidence for what actually moves visibility points elsewhere.
            </p>
            <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-gray-400">
              Adding source citations produced the largest measured visibility gain for
              low-ranking sites, at +115%, ahead of the addition of expert quotations at +41% and
              statistics at +30-40%, across the strategies tested on generative engines. —{" "}
              <a
                href="https://arxiv.org/abs/2311.09735"
                className="text-blue-400 hover:text-blue-300 underline"
                rel="noopener"
              >
                Generative Engine Optimization, KDD 2024
              </a>
            </blockquote>
            <p className="mt-4">
              A score of 91 and a badge in your README is a statement about your markup. It is not
              a citation, and no badge generator can produce one for you. What the badge is
              genuinely good for is the same thing a public score is good for anywhere: it makes
              the state of the page visible, and visible problems get fixed.
            </p>
            <p className="mt-3">
              The scanner is open source, so a disagreement with any of the above can be specific.
              The code, including the rule set this badge is scored against, is at{" "}
              <a
                href="https://github.com/Alex13192/geo-scanner"
                className="text-blue-400 hover:text-blue-300 underline"
                rel="noopener"
              >
                github.com/Alex13192/geo-scanner
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800/80 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
          <Link href="/about/" className="hover:text-gray-300 transition-colors">
            About
          </Link>
          <Link href="/study/" className="hover:text-gray-300 transition-colors">
            Study
          </Link>
          <Link href="/methodology/" className="hover:text-gray-300 transition-colors">
            Methodology
          </Link>
        </div>
        <LegalLinks className="justify-start" />
        <p className="mt-6">
          © {new Date().getFullYear()} LLMention. Brand Generative Engine Optimization
          Intelligence.
        </p>
      </footer>
    </div>
  );
}
