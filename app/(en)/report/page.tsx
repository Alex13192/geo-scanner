import { Suspense } from "react";
import Link from "next/link";
import PageFooter from "@/app/components/PageFooter";
import ReportWidget from "./ReportWidget";

/**
 * /report/ - the server-rendered half.
 *
 * WHY THIS FILE IS A SERVER COMPONENT: see the note in ReportWidget.tsx. The
 * short version is that this route used to be one "use client" module, so it
 * prerendered to the string "Loading..." - no headings, no text, no links - on
 * the page a visitor sees immediately after typing a domain, and the page every
 * badge links to.
 *
 * A NOTE ON WHAT IS DELIBERATELY MISSING FROM THIS FILE:
 * This route is noindex by design (see layout.tsx) and a tool output rather than
 * a document, so the copy below is written for a person waiting for a scan to
 * finish, not to satisfy the content rules the scanner applies to articles. It
 * scores below an A on its own engine, and that is the correct answer rather than
 * an oversight: a per-request report of someone else's homepage is not an
 * article, and treating it as one would be the same overclaiming this product
 * exists to point at. If we want these checks to stop applying here, the honest
 * fix is a page-type exemption in the analyser, not padding on this page.
 *
 * Two things are here anyway because they are true and useful rather than
 * decorative: the quotation about what the published research found, which is
 * where the weightings come from, and a link to the rule set.
 */
export default function ReportPage() {
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
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                Audit Overview
              </span>
              <Link
                href="/llms-txt-studio/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </Link>
              <Link
                href="/readiness-badge/"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Readiness Badge
              </Link>
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

      {/*
        The fallback is real content rather than the word "Loading", because it is
        what a visitor on a slow connection reads while the scan runs, and it is
        also what ends up in the prerendered HTML. Both audiences want a sentence
        about what is being measured, not a spinner.
      */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Edge Scan
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            GEO Audit Report
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-3xl">
            This page scores one homepage against 38 published checks across twelve weighted
            dimensions, and lists what failed with the evidence the check produced. The scan runs
            when the page loads.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-8 space-y-4">
              <p className="text-sm text-blue-400 font-mono animate-pulse">
                Reading the homepage and robots.txt…
              </p>
              <p className="text-sm text-gray-400 max-w-3xl leading-relaxed">
                The scan fetches the page the way a crawler would, then reads robots.txt, llms.txt
                and the sitemap if they exist. It takes a few seconds because it does five real
                requests rather than reading a cache.
              </p>
              <p className="text-sm text-gray-400 max-w-3xl leading-relaxed">
                Nothing about the site is stored. The result exists only in the URL you are on, and
                re-loading this page runs the scan again.
              </p>
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-2 pr-4 font-semibold text-white">What is fetched</th>
                      <th className="py-2 font-semibold text-white">Why it affects the score</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    <tr className="border-b border-gray-800/60">
                      <td className="py-2 pr-4 font-mono">the homepage</td>
                      <td className="py-2">
                        Carries the highest weight of the twelve dimensions, because a page a
                        crawler cannot read has no path to being quoted at all
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800/60">
                      <td className="py-2 pr-4 font-mono">/robots.txt</td>
                      <td className="py-2">
                        The site&apos;s stated intent about who may crawl, which is the only
                        authoritative answer available to a scanner
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800/60">
                      <td className="py-2 pr-4 font-mono">/llms.txt</td>
                      <td className="py-2">
                        Worth 5% and no more, because the evidence behind it is weak
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">/sitemap.xml</td>
                      <td className="py-2">
                        Discoverability, and whether the site bothers to publish one
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          }
        >
          <ReportWidget />
        </Suspense>

        <section className="mt-16 max-w-3xl space-y-8 text-sm leading-relaxed text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">What the score is measuring</h2>
            <p>
              Whether your pages are in a state that makes being cited possible. That is a narrower
              claim than it sounds, and a deliberate one.
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
              Those figures are why citability and evidence carry 11% of the score and answer
              readiness a further 10%, while a context file carries 5%. Every weight, every check
              and every pass condition is published on the{" "}
              <Link href="/methodology/" className="text-blue-400 hover:text-blue-300 underline">
                methodology page
              </Link>
              , and the analyser itself is open source at{" "}
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

          <div>
            <h2 className="text-xl font-bold text-white mb-3">What this report cannot tell you</h2>
            <p>
              It does not ask any AI engine about you. Nothing here measures whether ChatGPT
              currently recommends your brand, and a high score is not a promise of a citation.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                <strong>Only the homepage is analysed.</strong> Interior pages are outside a
                single-URL scan entirely.
              </li>
              <li>
                <strong>A refused request is not proof of a block.</strong> Large sites verify
                crawlers by IP, so a scanner can be turned away while real crawler traffic is served
                normally. The verdict follows robots.txt, which is stated intent.
              </li>
              <li>
                <strong>Performance checks are coarse.</strong> Real Core Web Vitals need a
                browser, and this scanner deliberately does not run one.
              </li>
            </ul>
            <p className="mt-4">
              Once you have a score, the{" "}
              <Link
                href="/readiness-badge/"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                badge generator
              </Link>{" "}
              turns it into something you can embed, and the{" "}
              <Link
                href="/llms-txt-studio/"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                llms.txt studio
              </Link>{" "}
              drafts the context file the AI Context Files dimension looks for.
            </p>
          </div>
        </section>
      </main>

      <PageFooter width="7xl" />
    </div>
  );
}
