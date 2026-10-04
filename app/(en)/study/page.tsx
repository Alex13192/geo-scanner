import type { Metadata } from "next";
import PageFooter from "@/app/components/PageFooter";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { SITE_URL } from "@/lib/site";

/**
 * First-party data study.
 *
 * WHY THIS PAGE EXISTS: a new domain with no inbound links has no reason to be
 * crawled eagerly, and no amount of additional "guide" content fixes that. Data
 * does. This is the one asset only this product can produce, it is the thing
 * journalists and other site owners cite, and it is the thing an AI engine
 * quotes back with attribution.
 *
 * HONESTY RULES THAT APPLY TO THIS PAGE:
 *  - Every number below came from the same /api/scan the product ships, on the
 *    date stated, over the homepages listed. No result is hand-adjusted.
 *  - "Not admitted" has two mechanisms and the table separates them. robots.txt
 *    disallowing an AI agent is a published policy any crawler will obey. The
 *    server refusing a crawler-shaped request while serving a browser-shaped one is
 *    a different fact: it happens before robots.txt is consulted, and it catches
 *    every engine, because they all present as bots.
 *  - A refusal of BOTH request shapes is not counted against the site. It says the
 *    request was turned away from the network this scan runs on, which is evidence
 *    about the scanner rather than about AI access. Those rows read blocked: false.
 *  - The sample is 30 homepages chosen by hand, not a random sample. Saying
 *    "of the 30 largest" would be a lie; the page says how they were chosen.
 *  - The limits are stated on the page rather than left for a reader to find,
 *    including the one the re-run exposed: a bot-management response can differ
 *    between two requests made seconds apart, so a "refused" mark is one
 *    observation rather than a property of the site.
 */
import { og } from "@/lib/og";
// The rows, the aggregates and the scan date live in one module so the page, the
// machine-readable endpoint at /study/data/ and the tests all read the same array.
import {
  ANSWERED,
  AVERAGE,
  BLOCKED,
  NEWS,
  NEWS_BLOCKED,
  REFUSED,
  SCAN_DATE,
  STUDY_DATA_PATH,
  STUDY_ROWS,
  gradeCount,
} from "@/lib/study-data";

const TITLE = "We scanned 30 major sites for AI visibility";
const DESCRIPTION =
  "None of the 30 homepages scored an A; the average was 62. Every news publisher disallows AI crawlers. Per-domain results, reproducible from the public API.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/study/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/study/",
  }),
};

function gradeClass(grade: string): string {
  if (grade === "B") return "text-emerald-400";
  if (grade === "C") return "text-blue-400";
  if (grade === "D") return "text-amber-400";
  return "text-red-400";
}

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </a>
          <a
            href="/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            Scan your own site →
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
            Research
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {TITLE}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Every result below came from the same scanner this site ships, run against the
            homepages of 30 large websites on {SCAN_DATE}. Nothing was adjusted by hand, and
            every figure can be reproduced from the public API.
          </p>
        </div>

        {/* Headline numbers */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5">
            <div className="text-3xl font-black text-white font-mono">{AVERAGE}</div>
            <div className="text-[11px] text-gray-400 pt-1 leading-snug">
              average score, out of 100
            </div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5">
            <div className="text-3xl font-black text-red-400 font-mono">{gradeCount("A")}</div>
            <div className="text-[11px] text-gray-400 pt-1 leading-snug">
              sites graded A
            </div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5">
            <div className="text-3xl font-black text-amber-400 font-mono">
              {BLOCKED.length}
              <span className="text-lg text-gray-500">/{STUDY_ROWS.length}</span>
            </div>
            <div className="text-[11px] text-gray-400 pt-1 leading-snug">
              do not admit AI crawlers, by policy or by refusal
            </div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5">
            <div className="text-3xl font-black text-gray-300 font-mono">
              {STUDY_ROWS.length - ANSWERED.length}
            </div>
            <div className="text-[11px] text-gray-400 pt-1 leading-snug">
              did not return a normal 200
            </div>
          </div>
        </section>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>What we found</h2>
          <p>
            <strong>Not one of the 30 homepages scored an A.</strong> The highest was{" "}
            {STUDY_ROWS[0].domain} at {STUDY_ROWS[0].score}, and only {gradeCount("B")} sites reached a B.
            Of the {ANSWERED.length} that answered with a normal page, the average was{" "}
            {AVERAGE} out of 100 — a D on this scale.
          </p>
          <p>
            The second finding is sharper. <strong>{BLOCKED.length} of the 30 domains do not admit
            at least one of GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot or Google-Extended at
            their site root</strong> — {BLOCKED.length - REFUSED.length} of them say so in
            robots.txt, and {REFUSED.length} refuse the request at the server before robots.txt is
            even read. Every news publisher in the sample is in that group:{" "}
            {NEWS_BLOCKED.length} of {NEWS.length}. The publishing industry has not drifted into
            blocking AI crawlers by accident — it has chosen to.
          </p>
          <p>
            The third finding is about the companies selling AI. <strong>OpenAI's own homepage
            scores {STUDY_ROWS.find((r) => r.domain === "openai.com")?.score} and Anthropic's{" "}
            {STUDY_ROWS.find((r) => r.domain === "anthropic.com")?.score}</strong>, both below the
            average of the sample, and OpenAI's is the sharper case: a crawler-shaped request to
            openai.com was refused with HTTP 403 in the same run that served a browser-shaped
            request to the same URL normally. Neither declares an Organization entity. The sites
            that score best are the ones selling infrastructure to developers, not the ones selling
            the answers.
          </p>

          <h2>Why the low scores matter more than they look</h2>
          <p>
            These are homepages, not articles, and homepages are the hardest page on any site to
            score well on: they are short, they are navigational, and they carry little of the
            evidence a generated answer needs. A low score here does not mean a site is invisible
            in AI answers — their articles may be in far better shape.
          </p>
          <p>
            What it does mean is that <strong>the page an AI system lands on first gives it
            almost nothing to quote</strong>. No statistics, no quotation, usually no
            question-shaped heading and often no entity markup that says which organisation the
            domain belongs to. On {STUDY_ROWS.filter((r) => !r.entity).length} of the 30, a model
            reading the homepage has no structured statement of who owns the site.
          </p>

          <h2>Three different things can stop a crawler</h2>
          <p>
            They are easy to confuse, so the table separates them. <strong>Disallowed</strong>{" "}
            means robots.txt disallows an AI agent at the root — a published, deliberate policy that
            any crawler will obey. <strong>Refused</strong> means the server answered a
            crawler-shaped request with an error while serving a browser-shaped request to the same
            URL normally: the block happens before robots.txt is consulted, and because GPTBot,
            ClaudeBot, PerplexityBot and OAI-SearchBot all present as bots, a rule like that turns
            away every engine this page is about. {REFUSED.length} domains in this table are that
            case.
          </p>
          <p>
            A refusal of <em>both</em> request shapes is a third thing and is not counted as a
            block. It says the request was turned away from the network this scan runs on, which is
            evidence about the scanner rather than about AI access.{" "}
            {STUDY_ROWS.filter((r) => r.aborted && !r.blocked).length} domains are in that position,
            and the table records them as neither disallowed nor refused.
          </p>

          <h2>The results</h2>
        </article>

        <div className="overflow-x-auto pt-4 pb-10">
          <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
            <thead className="bg-gray-900/80 text-gray-400">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold">Domain</th>
                <th className="text-left px-3 py-2.5 font-semibold">Score</th>
                <th className="text-left px-3 py-2.5 font-semibold">HTTP crawler / browser</th>
                <th className="text-left px-3 py-2.5 font-semibold">AI crawlers</th>
                <th className="text-left px-3 py-2.5 font-semibold">Entity</th>
                <th className="text-left px-3 py-2.5 font-semibold">sameAs</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {STUDY_ROWS.map((row) => (
                <tr key={row.domain} className="border-t border-gray-800/60">
                  <td className="px-3 py-2 font-mono text-gray-200">
                    <a
                      href={`/report/?domain=${row.domain}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {row.domain}
                    </a>
                  </td>
                  <td className={`px-3 py-2 font-mono font-bold ${gradeClass(row.grade)}`}>
                    {row.score} {row.grade}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-500">
                    {row.status}
                    {row.browserStatus !== null && (
                      <span className="text-gray-600"> / {row.browserStatus}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.refused ? (
                      <span className="text-red-400">refused</span>
                    ) : row.blocked ? (
                      <span className="text-red-400">disallowed</span>
                    ) : (
                      <span className="text-gray-500">admitted</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.entity ? "yes" : <span className="text-gray-600">no</span>}</td>
                  <td className="px-3 py-2">{row.sameAs ? "yes" : <span className="text-gray-600">no</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-500 pt-3 leading-relaxed">
            Click a domain to run the scan yourself and see the current result. Scores in this
            table are a snapshot taken on {SCAN_DATE} and will have moved since.
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>How this was done</h2>
          <ol>
            <li>
              The 30 domains were chosen by hand to cover search, AI labs, enterprise software,
              infrastructure, developer platforms, news and German industry. This is a{" "}
              <strong>convenience sample, not a random one</strong>, and it is not a ranking of
              the largest sites on the internet.
            </li>
            <li>
              Each homepage was fetched by the LLMention crawler from its own infrastructure,
              identifying itself honestly as a bot. It did not impersonate an AI crawler and it was
              not sent from an AI crawler&rsquo;s address. Where that request was refused, the same
              URL was asked once more with a browser-shaped User-Agent, so that a rule aimed at
              identified bots could be told apart from an address being blocked. That second request
              never scores page content; it decides one check, and the rule behind it is published
              on the <a href="/methodology/">methodology page</a>.
            </li>
            <li>
              robots.txt, llms.txt and sitemap.xml were requested from the same origin, and the
              38 documented checks were run over the result.
            </li>
            <li>
              No AI engine was queried. Nothing on this page is a measurement of what ChatGPT,
              Claude or Perplexity actually say — that is a different experiment and this tool
              does not run it.
            </li>
          </ol>

          <h2>Limits of this study</h2>
          <ul>
            <li>
              <strong>Homepages only.</strong> A site&rsquo;s articles are usually in better shape
              than its homepage, so these scores understate most of the sites listed.
            </li>
            <li>
              <strong>One moment in time.</strong> robots.txt and markup change constantly; the
              table is a snapshot, and every row can be re-run.
            </li>
            <li>
              <strong>Geo-dependence.</strong> Sites that redirect by visitor location returned a
              regional version, and the regional version differs. stripe.com returned its
              Netherlands edition during one run and its Singapore edition during another.
            </li>
            <li>
              <strong>A refusal of both request shapes proves nothing about AI access.</strong>{" "}
              When the scanner is turned away as a bot and as a browser alike, the block is about
              the network it came from, and the row says so rather than blaming the site. What a
              refusal <em>can</em> show is the opposite case — a browser served, a bot refused —
              and that is a rule aimed at exactly the crawlers this page measures.
            </li>
            <li>
              <strong>A refusal can vary between requests.</strong> During this re-run, one site
              answered the browser-shaped request with 200 and, minutes later, with the same error
              it gave the crawler. A &ldquo;refused&rdquo; mark is therefore one observation at one
              moment, not a stable property of the site, and the row may look different on re-run.
            </li>
            <li>
              <strong>Not a prediction.</strong> These are readiness checks, not a measurement of
              citations. A site can score 12 and still be quoted tomorrow.
            </li>
          </ul>

          <h2>Reproduce it</h2>
          <p>
            The whole table is published as data, so its arithmetic can be checked without
            scraping this page:{" "}
            <a href={STUDY_DATA_PATH} className="text-blue-400 hover:text-blue-300 underline">
              <code>{STUDY_DATA_PATH}</code>
            </a>{" "}
            returns JSON with the rows, the counts, the average and the grade distribution, and{" "}
            <a
              href={`${STUDY_DATA_PATH}?format=csv`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              <code>?format=csv</code>
            </a>{" "}
            returns the same rows as a spreadsheet. Both are generated from the array this page
            renders, so they cannot disagree with it.
          </p>
          <p>
            Every row above comes from one public endpoint, and{" "}
            <code>brief=1</code> returns just the headline numbers:
          </p>
          <pre>{`curl "${SITE_URL}/api/scan?domain=github.com&brief=1"

{"domain":"github.com","status":200,"browserStatus":null,
 "scoreBasis":"homepage","score":60,"grade":"D",
 "checksRun":38,"checksPassed":22,"aiCrawlersBlocked":false,
 "hasJsonLdEntity":false,"hasSameAs":false,"hasRobotsTxt":true,
 "topIssue":"robots-sitemap"}`}</pre>
          <p>
            The rules behind every number are published on the{" "}
            <a href="/methodology/">methodology page</a>, including the parts of the picture the
            score cannot see. If a result here looks wrong, that is a bug report and it is
            welcome — the check will be fixed rather than the number.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/" className="text-xs text-blue-400 hover:text-blue-300">
            Run this on your own site →
          </a>
          <a href="/methodology/" className="text-xs text-gray-500 hover:text-gray-300">
            Methodology
          </a>
        </div>
        <div className="mt-16 space-y-10 text-sm leading-relaxed text-gray-300">
          <Faq
            title="Questions about this study"
            items={[
            { q: "How were the 30 sites chosen?", a: "They are a convenience sample of large, well-known homepages, not a random one. That is enough to show a pattern and not enough to generalise from, which is why the sample is described rather than implied." },
            { q: "Why do so many large sites score badly?", a: "A homepage is the hardest page on any site to score well on: it is short, it is navigational, and it carries little of the evidence a generated answer needs. Their article pages may be in far better shape." },
            { q: "Was any figure adjusted by hand?", a: "No. Every number in the table came from the same scanner on one date, and each row links to a report that can be re-run against the public API." },
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

      <PageFooter width="4xl" />
    </div>
  );
}
