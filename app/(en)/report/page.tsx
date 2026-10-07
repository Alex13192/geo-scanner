import { Suspense } from "react";
import Link from "next/link";
import PageFooter from "@/app/components/PageFooter";
import ReportMailForm from "./ReportMailForm";
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
 *
 * WHY IT TAKES searchParams AND HANDS THEM TO A CHILD. The offer of a weekly report at the bottom
 * of this page has to post the domain that was scanned, and that domain is in the query string.
 * Reading it here would be the obvious thing and would make the whole route dynamic; the whole
 * route is exactly what has to stay prerenderable, because for a scanner or a reader without
 * JavaScript the prerendered HTML is the only content there is - that was the bug that split this
 * page into a server half and a client half in the first place. So the page stays a server
 * component, the query string is read once, and only the small form below is dynamic.
 */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string | string[] }>;
}) {
  /*
   * Normalised here rather than inside the form, so the value posted onward is the same shape the
   * scanner was given. Empty input means no domain was asked about at all, and then there is
   * nothing to offer a report for - see the `!rootDomain` branch in ReportWidget, which says so
   * rather than inventing one.
   */
  const params = await searchParams;
  const rawDomain = typeof params.domain === "string" ? params.domain : "";
  const domain = rawDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] font-sans pb-20">
      <header className="border-b border-[var(--line)] bg-[var(--surface-0)]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                L
              </span>
              <span className="font-extrabold text-base tracking-tight text-[var(--ink-1)]">LLMention</span>
            </Link>
            <nav
              aria-label="Sections"
              className="hidden md:flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--line)] text-xs"
            >
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                Audit Overview
              </span>
              <Link
                href="/llms-txt-studio/"
                className="px-3 py-1.5 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink-1)] transition-all"
              >
                /llms.txt Studio
              </Link>
              <Link
                href="/readiness-badge/"
                className="px-3 py-1.5 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink-1)] transition-all"
              >
                Readiness Badge
              </Link>
              <Link
                href="/methodology/"
                className="px-3 py-1.5 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink-1)] transition-all"
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
          <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-[var(--accent)] border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Edge Scan
          </span>
          <h1 className="text-3xl font-extrabold text-[var(--ink-1)] mt-3 tracking-tight">
            GEO Audit Report
          </h1>
          <p className="text-sm text-[var(--ink-2)] mt-2 max-w-3xl">
            This page scores one homepage against 40 published checks across twelve weighted
            dimensions, and lists what failed with the evidence the check produced. The scan runs
            when the page loads.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-8 space-y-4">
              <p className="text-sm text-[var(--accent)] font-mono animate-pulse">
                Reading the homepage and robots.txt…
              </p>
              <p className="text-sm text-[var(--ink-2)] max-w-3xl leading-relaxed">
                The scan fetches the page the way a crawler would, then reads robots.txt, llms.txt
                and the sitemap if they exist. It takes a few seconds because it does five real
                requests rather than reading a cache.
              </p>
              <p className="text-sm text-[var(--ink-2)] max-w-3xl leading-relaxed">
                Nothing about the site is stored. The result exists only in the URL you are on, and
                re-loading this page runs the scan again.
              </p>
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)]">
                      <th className="py-2 pr-4 font-semibold text-[var(--ink-1)]">What is fetched</th>
                      <th className="py-2 font-semibold text-[var(--ink-1)]">Why it affects the score</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-2)]">
                    <tr className="border-b border-[var(--line)]">
                      <td className="py-2 pr-4 font-mono">the homepage</td>
                      <td className="py-2">
                        Carries the highest weight of the twelve dimensions, because a page a
                        crawler cannot read has no path to being quoted at all
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--line)]">
                      <td className="py-2 pr-4 font-mono">/robots.txt</td>
                      <td className="py-2">
                        The site&apos;s stated intent about who may crawl, which is the only
                        authoritative answer available to a scanner
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--line)]">
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

        {/*
          THE OFFER COMES AFTER THE RESULT, AND THE ORDER IS THE POINT.

          Everything above this line - the score, the twelve dimension bars, every failing check,
          the research the weights come from - is delivered without asking for anything, and the
          scan is complete before this form is ever seen. That is deliberate and it is the one thing
          about this page that must not be "optimised": the pattern being borrowed locks a
          zero-cost computation behind an identity and depends on an automatically fired sign-in
          picker to make that tolerable. Gating the score, or asking before it is shown, would trade
          this site's strongest asset - that anybody can check the numbers without becoming a user -
          for a worse version of somebody else's funnel.

          WHAT IT OFFERS IS THE WEEKLY REPORT, NOT THIS SCAN. The scan is live and nothing about it
          is stored, so there is no "this report" to mail; a button implying otherwise would be the
          small dishonesty this site spends its copy arguing against. The form says what arrives.

          NO PROMPT, NO MODAL, NO POPUP, and nothing is collected anywhere on this page beyond the
          one field the visitor chooses to fill in - below the result they already have.
        */}
        {domain ? (
          <section className="mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 sm:p-7">
            <h2 className="text-xl font-bold mb-2 text-[var(--ink-1)]">
              Get this checked every week
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--ink-2)]">
              The audit above is finished, and nothing about it was withheld. If you want the same
              checks run on a schedule, leave an address and the weekly report arrives with what
              changed: a score, the grade, and the checks that newly fail. One message a week, and
              one click stops it.
            </p>
            <ReportMailForm domain={domain} />
          </section>
        ) : null}

        <section className="mt-16 max-w-3xl space-y-8 text-sm leading-relaxed text-[var(--ink-2)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">What the score is measuring</h2>
            <p>
              Whether your pages are in a state that makes being cited possible. That is a narrower
              claim than it sounds, and a deliberate one.
            </p>
            <blockquote className="border-l-2 border-blue-500 pl-4 mt-4 text-[var(--ink-2)]">
              GEO can boost visibility by up to 40% overall in generative engine responses, and in
              the paper&rsquo;s Table 1 the best of the tested methods improve on the
              no-optimization baseline by 41% and 28%. &mdash;{" "}
              <a
                href="https://arxiv.org/abs/2311.09735"
                className="text-[var(--accent)] hover:opacity-75 underline"
                rel="noopener"
              >
                Generative Engine Optimization, KDD 2024
              </a>
            </blockquote>
            <p className="mt-4">
              Those figures are why citability and evidence carry 11% of the score and answer
              readiness a further 10%, while a context file carries 5%. Every weight, every check
              and every pass condition is published on the{" "}
              <Link href="/methodology/" className="text-[var(--accent)] hover:opacity-75 underline">
                methodology page
              </Link>
              , and the analyser itself is open source at{" "}
              <a
                href="https://github.com/Alex13192/geo-scanner"
                className="text-[var(--accent)] hover:opacity-75 underline"
                rel="noopener"
              >
                github.com/Alex13192/geo-scanner
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--ink-1)] mb-3">What this report cannot tell you</h2>
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
                className="text-[var(--accent)] hover:opacity-75 underline"
              >
                badge generator
              </Link>{" "}
              turns it into something you can embed, and the{" "}
              <Link
                href="/llms-txt-studio/"
                className="text-[var(--accent)] hover:opacity-75 underline"
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
