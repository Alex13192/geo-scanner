import type { Metadata } from "next";
import LegalLinks from "@/app/components/LegalLinks";
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
const TITLE = "We scanned the homepages of 30 major websites for AI visibility";
const DESCRIPTION =
  "None of the 30 scored an A and the average was 62. Every news publisher in the sample disallows AI crawlers, and one site refuses them at the server. Full per-domain results, reproducible against the public API.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/study/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/study/", type: "article" },
};

const SCAN_DATE = "3 October 2026";

type Row = {
  domain: string;
  status: number;
  /**
   * What a browser-shaped request to the same URL returned, or null when the
   * homepage answered 200 and no second request was needed.
   */
  browserStatus: number | null;
  score: number;
  grade: string;
  /** A non-200 answer, so the score describes that response rather than a page. */
  aborted: boolean;
  /**
   * AI crawlers are not admitted: robots.txt disallows one of the five tracked
   * agents at root, or the server refuses a crawler-shaped request. The two
   * mechanisms are separated by `refused` below.
   */
  blocked: boolean;
  /**
   * Refused to a crawler-shaped request while the same URL served a browser-shaped
   * one. This is the case a robots.txt line cannot express: the block happens
   * before robots.txt is read, and because GPTBot, ClaudeBot, PerplexityBot and
   * OAI-SearchBot all present as bots, a rule like that turns every one of them away.
   */
  refused: boolean;
  entity: boolean;
  sameAs: boolean;
  category: string;
};

/**
 * Raw results, transcribed from /api/scan?brief=1, re-run on 3 October 2026.
 *
 * Ordered by score so the table reads as a ranking, which is how a reader will
 * look for their own site.
 */
const RESULTS: Row[] = [
  { domain: "salesforce.com", status: 200, browserStatus: null, score: 83, grade: "B", aborted: false, blocked: false, refused: false, entity: true, sameAs: false, category: "Enterprise software" },
  { domain: "siemens.com", status: 200, browserStatus: null, score: 80, grade: "B", aborted: false, blocked: false, refused: false, entity: true, sameAs: false, category: "Industry" },
  { domain: "vercel.com", status: 200, browserStatus: null, score: 79, grade: "C", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Developer platform" },
  { domain: "cloudflare.com", status: 200, browserStatus: null, score: 77, grade: "C", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Infrastructure" },
  { domain: "stripe.com", status: 200, browserStatus: null, score: 75, grade: "C", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Payments" },
  { domain: "shopify.com", status: 200, browserStatus: null, score: 72, grade: "C", aborted: false, blocked: false, refused: false, entity: false, sameAs: true, category: "Commerce" },
  { domain: "apple.com", status: 200, browserStatus: null, score: 69, grade: "D", aborted: false, blocked: false, refused: false, entity: true, sameAs: true, category: "Consumer hardware" },
  { domain: "developer.mozilla.org", status: 200, browserStatus: null, score: 64, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Documentation" },
  { domain: "anthropic.com", status: 200, browserStatus: null, score: 62, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "AI lab" },
  { domain: "notion.so", status: 200, browserStatus: null, score: 62, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Software" },
  { domain: "figma.com", status: 200, browserStatus: null, score: 62, grade: "D", aborted: false, blocked: true, refused: false, entity: true, sameAs: true, category: "Design software" },
  { domain: "bbc.com", status: 200, browserStatus: null, score: 61, grade: "D", aborted: false, blocked: true, refused: false, entity: false, sameAs: true, category: "News" },
  { domain: "nvidia.com", status: 200, browserStatus: null, score: 61, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: true, category: "Semiconductors" },
  { domain: "github.com", status: 200, browserStatus: null, score: 60, grade: "D", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Developer platform" },
  { domain: "spiegel.de", status: 200, browserStatus: null, score: 56, grade: "F", aborted: false, blocked: true, refused: false, entity: true, sameAs: true, category: "News" },
  { domain: "telekom.com", status: 200, browserStatus: null, score: 54, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Telecoms" },
  { domain: "bahn.de", status: 200, browserStatus: null, score: 52, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Transport" },
  { domain: "microsoft.com", status: 200, browserStatus: null, score: 48, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Enterprise software" },
  { domain: "theguardian.com", status: 200, browserStatus: null, score: 47, grade: "F", aborted: false, blocked: true, refused: false, entity: false, sameAs: false, category: "News" },
  { domain: "wikipedia.org", status: 200, browserStatus: null, score: 47, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Reference" },
  { domain: "sap.com", status: 200, browserStatus: null, score: 41, grade: "F", aborted: false, blocked: false, refused: false, entity: false, sameAs: false, category: "Enterprise software" },
  { domain: "zeit.de", status: 403, browserStatus: 200, score: 26, grade: "F", aborted: true, blocked: true, refused: true, entity: false, sameAs: false, category: "News" },
  { domain: "google.com", status: 429, browserStatus: 429, score: 26, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "Search" },
  { domain: "perplexity.ai", status: 403, browserStatus: 403, score: 19, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "AI search" },
  { domain: "amazon.com", status: 202, browserStatus: 202, score: 14, grade: "F", aborted: true, blocked: true, refused: false, entity: false, sameAs: false, category: "Commerce" },
  { domain: "openai.com", status: 403, browserStatus: 200, score: 13, grade: "F", aborted: true, blocked: true, refused: true, entity: false, sameAs: false, category: "AI lab" },
  { domain: "stackoverflow.com", status: 403, browserStatus: 403, score: 12, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "Developer Q&A" },
  { domain: "nytimes.com", status: 403, browserStatus: 403, score: 12, grade: "F", aborted: true, blocked: true, refused: false, entity: false, sameAs: false, category: "News" },
  { domain: "reuters.com", status: 401, browserStatus: 401, score: 12, grade: "F", aborted: true, blocked: true, refused: false, entity: false, sameAs: false, category: "News" },
  { domain: "bmw.com", status: 520, browserStatus: 520, score: 8, grade: "F", aborted: true, blocked: false, refused: false, entity: false, sameAs: false, category: "Automotive" },
];

const answered = RESULTS.filter((r) => !r.aborted);
const blocked = RESULTS.filter((r) => r.blocked);
const refused = RESULTS.filter((r) => r.refused);
const news = RESULTS.filter((r) => r.category === "News");
const newsBlocked = news.filter((r) => r.blocked);
const average = Math.round(answered.reduce((sum, r) => sum + r.score, 0) / answered.length);
const gradeCount = (g: string) => RESULTS.filter((r) => r.grade === g).length;

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
            <div className="text-3xl font-black text-white font-mono">{average}</div>
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
              {blocked.length}
              <span className="text-lg text-gray-500">/{RESULTS.length}</span>
            </div>
            <div className="text-[11px] text-gray-400 pt-1 leading-snug">
              do not admit AI crawlers, by policy or by refusal
            </div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5">
            <div className="text-3xl font-black text-gray-300 font-mono">
              {RESULTS.length - answered.length}
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
            {RESULTS[0].domain} at {RESULTS[0].score}, and only {gradeCount("B")} sites reached a B.
            Of the {answered.length} that answered with a normal page, the average was{" "}
            {average} out of 100 — a D on this scale.
          </p>
          <p>
            The second finding is sharper. <strong>{blocked.length} of the 30 domains do not admit
            at least one of GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot or Google-Extended at
            their site root</strong> — {blocked.length - refused.length} of them say so in
            robots.txt, and {refused.length} refuse the request at the server before robots.txt is
            even read. Every news publisher in the sample is in that group:{" "}
            {newsBlocked.length} of {news.length}. The publishing industry has not drifted into
            blocking AI crawlers by accident — it has chosen to.
          </p>
          <p>
            The third finding is about the companies selling AI. <strong>OpenAI's own homepage
            scores {RESULTS.find((r) => r.domain === "openai.com")?.score} and Anthropic's{" "}
            {RESULTS.find((r) => r.domain === "anthropic.com")?.score}</strong>, both below the
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
            domain belongs to. On {RESULTS.filter((r) => !r.entity).length} of the 30, a model
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
            away every engine this page is about. {refused.length} domains in this table are that
            case.
          </p>
          <p>
            A refusal of <em>both</em> request shapes is a third thing and is not counted as a
            block. It says the request was turned away from the network this scan runs on, which is
            evidence about the scanner rather than about AI access.{" "}
            {RESULTS.filter((r) => r.aborted && !r.blocked).length} domains are in that position,
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
              {RESULTS.map((row) => (
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
      </main>

      <footer className="max-w-4xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        <LegalLinks className="mb-3" />
        © 2026 LLMention. Brand Generative Engine Optimization Intelligence.
      </footer>
    </div>
  );
}
