import type { Metadata } from "next";
import Link from "next/link";
import PageFooter from "@/app/components/PageFooter";
import SiteNav from "@/app/components/SiteNav";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { INSIGHTS, formatDate, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const TITLE = "Blog — notes from measuring AI search";
const DESCRIPTION =
  "Notes from measuring AI search: what the 30-site study found, how the rules fail in practice, and what this method refuses to claim. Updated regularly.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/blog/",
    languages: {
      en: "/blog/",
      "zh-Hans": "/zh/blog/",
      ja: "/ja/blog/",
      "x-default": "/blog/",
    },
    /* Feed readers and browsers discover the RSS feed without a visible link. */
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/blog/",
  }),
};

/**
 * The writing index.
 *
 * WHY THIS EXISTS AS A ROUTE AND NOT AS A LIST ON THE HOMEPAGE: the homepage's job is to
 * get a reader to run one scan. An archive's job is the opposite - to let a reader decide
 * whether the people behind the scan know what they are talking about, before they trust
 * a number. Those are different pages, and putting six links under the scan form would
 * have made the front door worse at both.
 *
 * WHAT EVERY CARD CARRIES: the one number the piece turns on, because that is the reason
 * to click rather than the title. All six figures are drawn from the study or the rule
 * set, so the card cannot advertise a claim the article does not support.
 *
 * The page is a server component. There is no filtering widget and no category state: six
 * items do not need one, and a client component here would cost the page its prerendered
 * HTML for a feature that makes the list longer to scan, not shorter.
 */
export default function InsightsIndexPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] selection:bg-blue-500 selection:text-white font-sans">
      <SiteNav />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                Blog
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                Notes from measuring AI search
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                Six pieces from the run behind the scanner: the distribution nobody quotes, the
                nine homepages that never answered, the markup gap in most of the sample, and the
                two rules this site will not pretend to be stronger than they are.
              </p>
              <p className="font-mono text-xs">
                <a href="/blog/rss.xml" className="text-[var(--accent)] hover:opacity-75">
                  RSS feed →
                </a>
              </p>
              <p className="font-mono text-xs text-[var(--ink-3)]">
                Published 18 October 2026 · by{" "}
                <Link href="/author/" className="text-[var(--accent)] hover:opacity-75">
                  Alex
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {INSIGHTS.map((insight) => (
                <Link
                  key={insight.slug}
                  href={insightPath(insight.slug)}
                  className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 transition-colors hover:border-blue-500/50"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono font-semibold text-[var(--accent)]">
                      {insight.category}
                    </span>
                    <span className="font-mono text-[var(--ink-3)]">
                      {formatDate(insight.published)}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug tracking-tight">
                    {insight.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-[var(--ink-2)]">{insight.dek}</p>
                  <div className="mt-auto flex items-end justify-between border-t border-[var(--line)] pt-4">
                    <span className="font-mono text-2xl font-semibold text-[var(--ink-1)]">
                      {insight.figure}
                    </span>
                    <span className="text-right text-xs leading-tight text-[var(--ink-3)]">
                      {insight.figureLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Prose under the grid, bounded to the same measure as the articles themselves. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-6 text-[16px] leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                What is published here?
              </h2>
              <p>
                First-party writing: measurements from the 30-site study, explanations of rules
                that fail in ways worth explaining, and a record of where this method is weaker
                than it looks. Nothing here is a press release, nothing is sponsored, and no
                piece is written to fill a calendar.
              </p>
              <p>
                The standard is one sentence long: <strong>delete the piece and ask what the
                reader lost</strong>. If the answer is a number they could not get elsewhere, or
                a step they can run themselves, it stays. If the answer is nothing, it does not
                get published — which is why there are six pieces and not thirty.
              </p>
              <p>
                The figures the archive turns on are all from one run over 30 homepages:{" "}
                <strong>53%</strong> graded F, <strong>7%</strong> reached a B,{" "}
                <strong>30%</strong> never answered the crawler at all, <strong>27%</strong>{" "}
                declared an entity and <strong>63%</strong> have neither an entity nor a
                <code>sameAs</code> list. Each piece below links to the rows it came from, and the
                rows can be re-scanned.
              </p>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                How was each piece made?
              </h2>
              <p>
                Every article rests on data that can be re-run. The study rows come from the
                scanner itself, the rule weights come from the published catalogue, and the
                limits come from the notes attached to each rule.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-xl border border-[var(--line)] text-sm">
                  <thead className="bg-[var(--surface-1)] text-[var(--ink-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Piece</th>
                      <th className="px-4 py-3 text-left font-semibold">Data it rests on</th>
                      <th className="px-4 py-3 text-left font-semibold">Rule it reads</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">The distribution of 30 scores</td>
                      <td className="px-4 py-3 align-top">The published study rows</td>
                      <td className="px-4 py-3 align-top">All 40, grouped by dimension</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">The news publishers</td>
                      <td className="px-4 py-3 align-top">Six rows, their status codes and robots</td>
                      <td className="px-4 py-3 align-top">Crawler passability</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">The nine that never answered</td>
                      <td className="px-4 py-3 align-top">Status and browser-status pairs</td>
                      <td className="px-4 py-3 align-top">The measurement guards</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">The entity gap</td>
                      <td className="px-4 py-3 align-top">Two boolean fields across the sample</td>
                      <td className="px-4 py-3 align-top">Entity and sameAs</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">llms.txt and the evidence</td>
                      <td className="px-4 py-3 align-top">The weighting arithmetic</td>
                      <td className="px-4 py-3 align-top">Context files</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">Reading a failed check</td>
                      <td className="px-4 py-3 align-top">The rule pages and their notes</td>
                      <td className="px-4 py-3 align-top">The published limits</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                What will not appear here?
              </h2>
              <ul>
                <li>
                  <strong>Sponsored posts.</strong> There are no paid placements, and a vendor
                  cannot buy a mention by buying a report.
                </li>
                <li>
                  <strong>Numbers without a source.</strong> A figure that cannot be traced to the
                  study or a re-runnable scan does not go in, however plausible it sounds.
                </li>
                <li>
                  <strong>Predictions dressed as measurements.</strong> The scanner does not query
                  a model about your brand, so neither do the articles about it.
                </li>
                <li>
                  <strong>Volume for its own sake.</strong> A posting schedule is a promise to
                  publish, and a site that keeps it by lowering the bar has published less than it
                  appears to.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                How do I read a piece I disagree with?
              </h2>
              <p>
                Send the check, the URL and what the scan reported. A disagreement that names a
                rule is the most useful message this project receives, and the method is public
                specifically so a disagreement can be specific.
              </p>
              <p>
                How the writing is produced, corrected and funded is described on{" "}
                <Link href="/author/">the author page</Link>. The full rule set is at{" "}
                <Link href="/checks/">the check reference</Link>, and the arithmetic is on the{" "}
                <Link href="/methodology/">methodology page</Link>.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="Questions about the writing"
                items={[
                  {
                    q: "Is this a blog?",
                    a: "It is a blog of first-party notes: study results, rule explanations and stated limits. The plan is a new note every few days, and each one still has to sit on a measurement — no news feed, no sponsored posts.",
                  },
                  {
                    q: "Can I quote a piece?",
                    a: "Yes, with attribution and a link. Quoting a figure without the sample it came from is the failure this archive is written to make harder, so please take the sentence that carries the number and its source.",
                  },
                  {
                    q: "Are the pieces peer reviewed?",
                    a: "No, and calling them that would be false. They are checked against the published data and the rule catalogue, and each one states where its own method is weaker than it looks.",
                  },
                ]}
              />
              <Evidence
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="The weightings this archive argues about follow published research rather than taste; the study rows behind each figure are published and re-runnable."
              />
            </div>
          </div>
        </section>
      </main>

      <PageFooter width="7xl" brand="LLMention Writing" />
    </div>
  );
}
