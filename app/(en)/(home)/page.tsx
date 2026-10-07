import { BadgeCheck, Bot, Braces, Wrench } from "lucide-react";
import ScanForm from "./ScanForm";
import ScoreRing from "@/app/components/ScoreRing";
import SiteNav from "@/app/components/SiteNav";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { BLOCKED, NEWS, NEWS_BLOCKED, STUDY_ROWS } from "@/lib/study-data";
import { CONTACT_EMAIL, SITE_HOST } from "@/lib/site";

/**
 * The homepage.
 *
 * WHY IT IS A SERVER COMPONENT: the only interactive thing on it is the scan
 * box, which lives in ./ScanForm.tsx behind its own `"use client"`. Marking this
 * file as a client component - which it was - ships the entire document to the
 * browser as JavaScript, including the check titles and the dimension table that
 * are imported here for rendering only. Next renders client components on the
 * server too, so nothing was visibly broken; it was paid for in bundle size on a
 * site that deploys to Workers and scores itself on payload.
 *
 * WHY IT IS BUILT FROM FULL-WIDTH BANDS: at 1920px the previous layout put
 * 1152px of content on a background of exactly the same colour, leaving 384px of
 * identical pixels on each side - 40% of the screen - with nothing marking where
 * the content stopped, and /docs/ pages were worse at 60%. No content was
 * missing; the boundary was invisible. Every section below is therefore a .band
 * (full viewport width, carries the colour) wrapping a .wrap (bounded content).
 *
 * Three of those bands are .band-dark: the hero, the report preview and the
 * closing call to action. A .band-dark re-declares the colour tokens for its own
 * subtree, so the cards, inks and status colours inside it flip back to the dark
 * set without a single conditional in any component.
 */

/**
 * The site's own scan result, declared once.
 *
 * EVERY NUMBER HERE IS A CLAIM ABOUT THIS SITE, published on the site, and it is
 * the one claim the whole product rests on. Three rules keep it honest:
 *
 *   1. Re-run `npm run build && node scripts/check-built-pages.mts` after ANY
 *      homepage edit. The `/` line prints the score and the ids of the checks it
 *      failed; `verified` is the date of that run.
 *   2. `failures` names the real failures. It is not a bug list and it is not
 *      trimmed to protect the grade - this site's own copy explains both of the
 *      two it currently has, and the hero console below displays them.
 *   3. Nothing here may be a number for somebody else's domain. The scan console
 *      was drafted around a real brand's name and invented results, which would
 *      have been a fabricated claim about a third party on the page that
 *      criticises other tools for exactly that.
 */
const SELF_AUDIT = {
  score: 97,
  grade: "A",
  passed: 38,
  run: 40,
  verified: "4 October 2026",
  failures: ["hreflang", "markdown-alternate"],
};

/**
 * The rows the hero console animates through.
 *
 * Titles come from CHECK_COPY, the same table the /checks/ reference pages are
 * generated from, so a renamed rule renames itself here. The ids are a real
 * subset of the 40 and every status is SELF_AUDIT's, which is what makes the
 * console a demonstration of this site's scan rather than an illustration of an
 * imaginary one.
 */
const CONSOLE_CHECKS = [
  "robots-ai-allowed",
  "jsonld-entity",
  "sameas",
  "qa-headings",
  "authority-citations",
  "markdown-alternate",
  "date-machine",
  "hreflang",
];

const TAGLINE =
  "Check whether ChatGPT, Perplexity and Claude can crawl, read and cite your pages — and see exactly which of the 40 published checks you fail.";

/**
 * Visible FAQ content.
 *
 * The SAME array also renders the FAQPage structured data at the bottom of this
 * page. That is deliberate: Google only accepts FAQ markup for questions and
 * answers that are actually visible to users, so the two must not drift.
 *
 * Written answer-first and factually. One of these answers deliberately tells
 * the reader that llms.txt is NOT a ranking factor - overselling it would be
 * both dishonest and bad GEO, since AI engines favour accurate sources.
 */
const FAQ_ITEMS = [
  {
    q: "What is Generative Engine Optimization (GEO)?",
    a: "GEO is the practice of making a website discoverable, parseable and citable by AI search engines such as ChatGPT, Perplexity, Claude and Google AI Overviews. Instead of ranking a blue link, the goal is to be quoted inside a generated answer.",
  },
  {
    q: "How do I check whether AI crawlers can read my website?",
    a: "Check your robots.txt for rules that block AI crawler user-agents such as GPTBot, ClaudeBot, PerplexityBot and Bytespider. LLMention reads robots.txt automatically and names exactly which of them are disallowed at your root. It cannot see your firewall rules — a request it makes comes from its own address, so check those in your CDN yourself.",
  },
  {
    q: "Do I need an llms.txt file?",
    a: "Not necessarily. llms.txt is an emerging convention rather than a standard: no crawler documentation we could open commits to reading it — OpenAI's help centre and Anthropic's crawler article both specify robots.txt instead. It is cheap to add and it does help documentation sites and coding agents, but treat it as one small signal, not a ranking factor.",
  },
  {
    q: "Which AI crawlers should I allow in robots.txt?",
    a: "Allow the crawlers behind the engines you want citations from: GPTBot and OAI-SearchBot for OpenAI, ClaudeBot and Claude-SearchBot for Anthropic, PerplexityBot for Perplexity, Google-Extended for Google, and Bingbot, whose index also feeds ChatGPT search. Blocking a crawler removes you from that engine's answers entirely.",
  },
  {
    q: "Is GEO replacing SEO?",
    a: "No. GEO and SEO share most of their foundations: crawlable pages, clear structure, accurate facts and genuine authority. GEO adds an emphasis on answer-shaped content, entity markup such as Schema.org JSON-LD, and machine-readable context files. A site that already does SEO well starts GEO from a strong position.",
  },
];

const CRAWLERS = [
  { name: "GPTBot", engine: "OpenAI / ChatGPT" },
  { name: "PerplexityBot", engine: "Perplexity AI" },
  { name: "ClaudeBot", engine: "Anthropic Claude" },
  { name: "Bytespider", engine: "ByteDance / Doubao" },
];

/** Right-hand side of the comparison, highlighted in the table below. */
const GEO_COMPARISON: [string, string, string][] = [
  ["What you win", "A ranking position on a results page", "A sentence quoted inside a generated answer"],
  ["Unit of competition", "The page, ranked against other pages", "The passage, retrieved against other passages"],
  ["Main lever", "Keywords, backlinks, page authority", "Entity clarity, evidence, extractable structure"],
  ["How you verify it", "Rank tracking and click-through rate", "Whether a model repeats your claim, and cites you"],
  ["Failure mode", "Position 11, no clicks", "The answer is given, and you are not in it"],
];

/**
 * The three tools, with the screenshots above the copy.
 *
 * WHY THESE ARE PHOTOGRAPHS AND NOT MORE DOM: the hero console and the dimension
 * panel are built from markup, which keeps the page light but shows a
 * reconstruction of the product. These three are captures of the real pages,
 * taken by driving the running site - a domain is typed into each tool and it is
 * allowed to answer before the shutter - so the numbers in them are this site's
 * own live result rather than a mock-up.
 *
 * Every domain shown is this site's own. A tile carrying a real third party's
 * score would be a claim about somebody else, which is the same line the hero
 * console's failure list is held to.
 *
 * The files live in public/shots/ as 880x550 WebP, about 75 KB for all three.
 * next.config.ts sets `images: { unoptimized: true }` for the Cloudflare
 * deployment, so next/image would be a pass-through here and a plain <img> with
 * explicit width/height is both honest about what happens and one less
 * abstraction. width and height are stated so the row does not reflow as the
 * images arrive, which is the whole of the CLS story on this page.
 *
 * The alt text names the host through SITE_HOST rather than spelling it out.
 * scripts/check-values.mjs scans every line of app/ for a literal hostname and
 * fails the build's value check if it finds one - comments included - because a
 * second copy of the canonical origin is how the old domain survived a move.
 */
const TOOLS = [
  {
    src: "/shots/report.webp",
    alt: `The GEO audit report for ${SITE_HOST}: 97 out of 100, grade A, 38 of 40 checks passed, with all twelve weighted dimension scores below it.`,
    title: "The audit report",
    body: "Forty published checks across twelve weighted dimensions. Every dimension shows its own score and the evidence behind it, and every failure names the rule it broke.",
    href: `/report/?domain=${SITE_HOST}`,
    linkLabel: "Open a live report",
  },
  {
    src: "/shots/llms-txt-studio.webp",
    alt: `The /llms.txt studio after generating a file for ${SITE_HOST}, showing twelve internal links it found on the homepage.`,
    title: "The /llms.txt studio",
    body: "Enter a domain and the studio reads the homepage, then drafts an llms.txt from the real page title, the description and the internal links it actually found.",
    href: "/llms-txt-studio/",
    linkLabel: "Generate a file",
  },
  {
    src: "/shots/readiness-badge.webp",
    alt: `The badge generator showing a live green 97 out of 100 badge for ${SITE_HOST}, with the Markdown and HTML embed snippets.`,
    title: "The readiness badge",
    body: "A badge carrying the score from a real scan, in Markdown for a README or HTML for a footer. The number is read from the scan and cannot be typed in.",
    href: "/readiness-badge/",
    linkLabel: "Get the badge",
  },
];

const ONE_RING_CIRCUMFERENCE = 452;

/**
 * The facts the marquee rotates through, and the reason it is built this way.
 *
 * WHY THIS EXISTS AT ALL. The products this one is measured against open with a scrolling wall of
 * customer logos. That wall is the pattern the owner liked, and the wall itself is exactly what
 * must not be copied: those logos are unverified, and a marquee of names nobody can check is a
 * claim this site does not make about anybody - least of all about a third party's customers.
 *
 * So the pattern is kept and the content is inverted: every chip is a number THIS PRODUCT
 * MEASURED, and each one links to the page that shows the working.
 *
 * WHY NOTHING IS TYPED IN TWICE. Each value is computed from the module that publishes it - the
 * check and dimension catalogues the scorer itself reads, and the study rows behind /study/ - so
 * adding a rule, a dimension or a study row cannot leave the marquee claiming an old count. This
 * is the mechanism lib/llms-txt.ts argues for at length: a number written into prose is a second
 * copy of that number, and the two drift the first time somebody raises the limit.
 *
 * WHY THERE IS NO AI PLATFORM LOGO OR NAME IN IT. This product does not query ChatGPT, Perplexity,
 * Gemini, Claude, Doubao or anything else, and says so on /report/ in its own words. A rotation of
 * those logos is the single most recognisable element of the pattern being borrowed, and it would
 * imply a capability this scanner does not have and cannot measure. What it does read is stated
 * instead: a crawler's own robots.txt policy, which the band below this one names honestly.
 */
const CHECKS_PUBLISHED = CHECK_CATALOG.filter((check) => !check.alias).length;
const WEIGHT_TOP = Math.max(...DIMENSION_CATALOG.map((dimension) => dimension.weight));
const WEIGHT_TOTAL = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);
const SITES_MEASURED = STUDY_ROWS.length;
const SITES_BLOCKING = BLOCKED.length;
const SITES_WITHOUT_ENTITY = STUDY_ROWS.filter((row) => !row.entity).length;
const SITES_WITH_SAMEAS = STUDY_ROWS.filter((row) => row.sameAs).length;

const FACTS = [
  {
    value: String(CHECKS_PUBLISHED),
    unit: "checks",
    label: "published, and the ones this site scores itself on",
    href: "/checks/",
  },
  {
    value: String(DIMENSION_CATALOG.length),
    unit: "dimensions",
    label: "weighted, in the order they are published",
    href: "/methodology/",
  },
  {
    value: String(WEIGHT_TOTAL),
    unit: "points",
    label: `added up. The heaviest is ${WEIGHT_TOP}, for whether a crawler can read the page at all`,
    href: "/methodology/",
  },
  {
    value: String(SITES_MEASURED),
    unit: "sites",
    label: "scanned for the published study, and every row is downloadable",
    href: "/study/",
  },
  {
    value: `${SITES_BLOCKING} of ${SITES_MEASURED}`,
    unit: "blocked",
    label: "of those sites disallow the AI crawlers this scanner tracks",
    href: "/study/",
  },
  {
    value: `${NEWS_BLOCKED.length} of ${NEWS.length}`,
    unit: "news publishers",
    label: "of the ones measured turn every tracked AI crawler away",
    href: "/study/",
  },
  {
    value: `${SITES_WITHOUT_ENTITY} of ${SITES_MEASURED}`,
    unit: "unbound",
    label: "declare no Organization or WebSite entity for a model to attach a name to",
    href: "/study/",
  },
  {
    value: String(SITES_WITH_SAMEAS),
    unit: "use sameAs",
    label: `of the ${SITES_MEASURED}, which is the cheapest way to bind a brand to one entity`,
    href: "/methodology/",
  },
];

export default function HomePage() {
  const failing = new Set(SELF_AUDIT.failures);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <SiteNav />

      <main>
        {/* ============================ HERO ============================ */}
        <section className="band band-dark ambient">
          <div className="wrap pt-20 pb-16 text-center sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
              Generative Engine Optimization
            </span>

            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl lg:text-[72px]">
              Is your site built to be{" "}
              <span className="text-[var(--accent)]">cited</span> by AI search engines?
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {TAGLINE}
            </p>

            <div id="scan" className="flex justify-center scroll-mt-24">
              <ScanForm />
            </div>
            <p className="mt-4 text-sm text-[var(--ink-3)]">
              Free. No account. No email. The same {CHECKS_PUBLISHED} checks this site runs on itself.
            </p>
          </div>

          {/*
            The animated scan console. It is the site's own scan, not a mock-up of
            somebody else's: the domain in the title bar is SITE_HOST, the check
            titles come from CHECK_COPY, and the two FIX rows are the two checks
            this site genuinely fails and explains further down the page.
          */}
          <div className="wrap pb-20">
            <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] shadow-2xl">
              <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-5 py-3.5">
                {/* Window chrome. These three are literals on purpose: they are
                    a reproduction of the macOS controls, not a site colour, and
                    recolouring them per theme would make the frame read as a
                    design element rather than as a screenshot of a tool. */}
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 flex-1 truncate rounded-md bg-[var(--surface-1)] px-3 py-1.5 font-mono text-xs text-[var(--ink-3)]">
                  https://{SITE_HOST} · scanning {SELF_AUDIT.run} checks across{" "}
                  {DIMENSION_CATALOG.length} dimensions
                </span>
              </div>

              <div className="grid lg:grid-cols-[1fr_300px]">
                <ul className="px-6 py-4 sm:px-8">
                  {CONSOLE_CHECKS.map((id) => {
                    const failed = failing.has(id);
                    return (
                      <li
                        key={id}
                        className="scan-row flex items-center gap-3 border-b border-[var(--line)] py-2.5 text-[13.5px] last:border-b-0"
                      >
                        {failed ? (
                          <Wrench className="h-4 w-4 shrink-0 text-[var(--warn)]" aria-hidden="true" />
                        ) : (
                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-[var(--ok)]"
                            aria-hidden="true"
                          />
                        )}
                        <span className="flex-1 text-[var(--ink-1)]">
                          {CHECK_COPY[id]?.title ?? id}
                          {/*
                            The rule id is the useful half for someone who wants to
                            look it up, and the unreadable half on a phone: at
                            390px it wraps onto its own line and pushes the status
                            tag out of the row. Hidden below sm rather than
                            truncated, because a clipped id is worse than none.
                          */}
                          <span className="ml-2 hidden font-mono text-[11px] text-[var(--ink-3)] sm:inline">
                            {id}
                          </span>
                        </span>
                        <span
                          className={`rounded-md px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide ${
                            failed
                              ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                              : "bg-[var(--ok-bg)] text-[var(--ok)]"
                          }`}
                        >
                          {failed ? "fix" : "pass"}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-col items-center justify-center gap-4 border-t border-[var(--line)] px-6 py-8 lg:border-l lg:border-t-0">
                  <div className="relative h-[168px] w-[168px]">
                    <svg
                      width="168"
                      height="168"
                      viewBox="0 0 168 168"
                      className="-rotate-90"
                      role="img"
                      aria-label={`This site scores ${SELF_AUDIT.score} out of 100`}
                    >
                      <defs>
                        <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#0a84ff" />
                          <stop offset="100%" stopColor="#bf5af2" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="84"
                        cy="84"
                        r="72"
                        fill="none"
                        strokeWidth="11"
                        style={{ stroke: "var(--line)" }}
                      />
                      <circle
                        className="scan-ring"
                        cx="84"
                        cy="84"
                        r="72"
                        fill="none"
                        stroke="url(#heroRing)"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeDasharray={ONE_RING_CIRCUMFERENCE}
                        strokeDashoffset={19}
                      />
                    </svg>
                    <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                      <div className="text-[44px] font-semibold leading-none tracking-tight text-[var(--ink-1)]">
                        {SELF_AUDIT.score}
                      </div>
                      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
                        GEO score
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-[var(--ink-3)]">
                    {SELF_AUDIT.passed} of {SELF_AUDIT.run} checks passing · grade{" "}
                    {SELF_AUDIT.grade}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================= THE FACTS MARQUEE ======================= */}
        {/*
          The moving band.

          WHAT IT IS: a scrolling strip of numbers this product measured, each linking to the page
          that publishes the working - the check catalogue, the methodology and the 30-site study.
          See the FACTS constant for why it is computed from those modules rather than typed into
          prose, and for why no AI platform logo appears anywhere in it.

          WHY IT IS A BAND OF ITS OWN rather than a row inside the hero: the hero is a .band-dark
          and these chips are surface cards, so putting them in the first screenful would have been
          eight white boxes on black. Below the console it keeps the hero intact and still reads as
          the hero's evidence.

          WHY NOTHING HERE IS A CLIENT COMPONENT. The motion is one CSS keyframe - see
          .facts-track in app/globals.css - so a `use client` boundary would ship this list to the
          browser as JavaScript to do what the compositor already does, and the `no-js-dependency`
          check this site applies to everybody else reads exactly that decision. Without
          JavaScript, without CSS and in a printed page the facts are all still there.
        */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-9">
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] py-5">
              <p className="px-6 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
                Measured here, and linked to where it was measured
              </p>
              {/*
                The strip is clipped by the rounded card, and the fade at either edge is the
                .facts-marquee mask. Both copies of the list are rendered because the keyframe
                translates the track by exactly one copy's width; see the arithmetic in
                globals.css, which is also where the chip spacing is declared - the two gaps have
                to be the same number or the seam shows.

                NO gap OR padding CLASS ON THE <ul>. The spacing is a custom property on
                .facts-track's children so that the chip gap and the seam gap cannot be two
                different values, which is the version that shipped a visible seam when this was
                first measured.

                THE SECOND COPY IS aria-hidden AND OUT OF THE TAB ORDER. It exists for the loop
                rather than for a reader: announced, it would be eight facts read out as sixteen,
                and the eight duplicates would also sit in the tab order, so a keyboard user would
                walk the same card strip twice - once with the second half of it off-screen behind
                the clip.
              */}
              <div className="facts-marquee mt-5">
                <div className="facts-track">
                  {[0, 1].map((copy) => (
                    <ul
                      key={copy}
                      aria-hidden={copy === 1 ? true : undefined}
                      className="flex shrink-0 items-stretch"
                    >
                      {FACTS.map((fact) => (
                        <li key={fact.unit} className="flex">
                          <a
                            href={fact.href}
                            tabIndex={copy === 1 ? -1 : undefined}
                            className="flex w-64 flex-col justify-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-5 py-4 transition-colors hover:border-[var(--accent)]"
                          >
                            <span className="flex items-baseline gap-2">
                              <span className="text-2xl font-semibold leading-none tracking-tight text-[var(--ink-1)]">
                                {fact.value}
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                                {fact.unit}
                              </span>
                            </span>
                            <span className="text-xs leading-relaxed text-[var(--ink-2)]">
                              {fact.label}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================= AGENT STRIP ========================= */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap flex flex-wrap items-center justify-between gap-6 py-7">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
              Reads the crawlers behind
            </span>
            {CRAWLERS.map((crawler) => (
              <div key={crawler.name} className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-[var(--ink-2)]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-1)]">{crawler.name}</p>
                  <p className="text-[11.5px] text-[var(--ink-3)]">{crawler.engine}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================== THE CHECKS ========================== */}
        <section className="band band--alt">
          <div className="wrap py-20 md:py-24">
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                What the scan checks
              </p>
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
                Three questions decide whether you get quoted.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              <a
                href="/docs/allow-ai-crawlers/"
                className="flex flex-col gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 lift hover:shadow-lg"
              >
                <Bot className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="text-lg font-semibold tracking-tight">AI Crawler Passability</h3>
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                  Reads robots.txt and reports which of GPTBot, PerplexityBot and ClaudeBot are
                  disallowed at your root.
                </p>
                <span className="mt-auto pt-2 text-sm text-[var(--accent)]">
                  How to allow AI crawlers →
                </span>
              </a>

              <a
                href="/docs/schema-org-jsonld/"
                className="flex flex-col gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 lift hover:shadow-lg"
              >
                <Braces className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="text-lg font-semibold tracking-tight">Entity &amp; Structured Data</h3>
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                  Reads your JSON-LD and reports whether Organization, WebSite and sameAs bind your
                  brand to one entity rather than three loose strings.
                </p>
                <span className="mt-auto pt-2 text-sm text-[var(--accent)]">
                  Schema.org for GEO →
                </span>
              </a>

              <a
                href="/readiness-badge/"
                className="flex flex-col gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 lift hover:shadow-lg"
              >
                <BadgeCheck className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="text-lg font-semibold tracking-tight">Dynamic Score Badge</h3>
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                  Embed a badge carrying your verified GEO score in your GitHub README or site
                  footer.
                </p>
                <span className="mt-auto pt-2 text-sm text-[var(--accent)]">Get the badge →</span>
              </a>
            </div>
          </div>
        </section>

        {/* =========================== THE TOOLS =========================== */}
        {/*
          The only band on the page whose subject is a picture rather than a
          paragraph, and the only place a visitor can see what the tools look
          like before running one. The screenshots are real captures of the three
          pages below, taken against this site; see the TOOLS constant.
        */}
        <section className="band">
          <div className="wrap py-20 md:py-24">
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                The tools
              </p>
              <h2 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
                Three free tools. No account, no limit.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {TOOLS.map((tool) => (
                <div
                  key={tool.href}
                  className="flex flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-2)]"
                >
                  {/*
                    The screenshot sits on an inset grey mat rather than flush
                    against the card. Two reasons: these are captures of
                    light-on-white interfaces, so a white image on a white card
                    has no edge of its own and reads as a smudge, and the mat is
                    the difference between "a card with a picture in it" and "a
                    window onto the tool".
                  */}
                  <div className="bg-[var(--surface-1)] p-5">
                    <img
                      src={tool.src}
                      width={880}
                      height={550}
                      alt={tool.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-lg border border-[var(--line)] shadow-sm"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-7">
                    <h3 className="text-lg font-semibold tracking-tight">{tool.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--ink-2)]">{tool.body}</p>
                    <a
                      href={tool.href}
                      className="mt-auto pt-2 text-sm font-medium text-[var(--accent)] hover:opacity-75"
                    >
                      {tool.linkLabel} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================= SELF-AUDIT ========================= */}
        {/*
          The figure is dated rather than presented as a permanent claim, so it
          stays a true statement about a point in time even after the page
          changes. Re-run the scan after any homepage edit and update SELF_AUDIT.
        */}
        <section className="band band--alt">
          <div className="wrap py-20 md:py-24">
            <div className="flex flex-col gap-8 rounded-2xl border border-blue-500/30 bg-[var(--surface-2)] p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  This site is measured by the same 40 checks
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
                  LLMention audits its own homepage with the rules it applies to yours, and links
                  the result rather than quoting a number you have to take on trust. Last verified
                  on {SELF_AUDIT.verified}: {SELF_AUDIT.score} out of 100, grade {SELF_AUDIT.grade},{" "}
                  {SELF_AUDIT.passed} of {SELF_AUDIT.run} checks passing. The two failures are both
                  real rather than accidental. hreflang requires at least two language versions and
                  this site was reduced to English only, so it fails a check it used to pass.
                  markdown-alternate wants a markdown twin of the page, and this homepage does not
                  have one: the rule pages have them generated from the same source as the HTML, and
                  a hand-written copy of a page written in JSX would be a second version free to
                  drift from the first. Both numbers are published instead of the rules being
                  softened to protect a perfect score. Re-run it yourself — the report shows all
                  twelve dimension scores, and every rule behind them is published.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-5 self-center sm:flex-row">
                <ScoreRing
                  value={SELF_AUDIT.score}
                  label={`This site scores ${SELF_AUDIT.score} out of 100`}
                />
                <a
                  href={`/report/?domain=${SITE_HOST}`}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] px-5 py-3 text-center text-xs font-semibold text-[var(--ink-1)] transition-colors hover:border-[var(--accent)]"
                >
                  Scan this site →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ====================== THE REPORT / DIMENSIONS ====================== */}
        {/*
          The twelve dimensions and their weights are imported from
          DIMENSION_CATALOG, which is the same data /methodology/ renders and the
          same weights the analyser applies. Bar length is the published weight,
          not a score - the site's own per-dimension results live in /report/,
          which is generated per request, and restating them here would be a
          second set of numbers to keep true.
        */}
        <section className="band band-dark">
          <div className="wrap py-20 md:py-28">
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                The report
              </p>
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
                Twelve dimensions, not one mystery number.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                A score you cannot interrogate is a score you cannot act on. Each dimension carries
                a published share of the total, and every rule inside it is listed on the
                methodology page.
              </p>
            </div>

            <div className="mt-14 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-1)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-2)] px-6 py-4">
                <span className="font-mono text-[13px] text-[var(--ink-2)]">
                  {SITE_HOST} · {SELF_AUDIT.passed} of {SELF_AUDIT.run} checks passing
                </span>
                <span className="text-xs font-semibold tracking-wide text-[var(--ok)]">
                  GRADE {SELF_AUDIT.grade} · {SELF_AUDIT.score} / 100
                </span>
              </div>

              <dl className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
                {DIMENSION_CATALOG.map((dimension) => (
                  /*
                   * A LINK, NOT A CARD. This section's own heading argues that "a score you cannot
                   * interrogate is a score you cannot act on", and it was then presenting twelve
                   * dimensions nobody could interrogate at all - the copy making a claim the markup
                   * contradicted. Each one now lands on its own section of the methodology page,
                   * which is where the weight and the reasoning behind it are written down.
                   *
                   * The arrow is hidden until hover rather than always present: twelve arrows in a
                   * grid is noise, and one appearing under the pointer is a response. The target is
                   * a real destination, so nothing is being promised that does not exist.
                   */
                  <a
                    key={dimension.id}
                    href={`/dimensions/${dimension.id}/`}
                    className="group bg-[var(--surface-1)] px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <dt className="mb-2.5 flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                      {dimension.label}
                      <span
                        aria-hidden="true"
                        className="-translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        →
                      </span>
                    </dt>
                    <dd>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${(dimension.weight / 16) * 100}%` }}
                        />
                      </div>
                      <p className="mt-2.5 text-sm font-semibold text-[var(--ink-1)]">
                        {dimension.weight}% of the score
                      </p>
                    </dd>
                  </a>
                ))}
              </dl>
            </div>

            <p className="mt-6 text-center text-sm text-[var(--ink-3)]">
              Full weights, every rule and what the score cannot tell you:{" "}
              <a href="/methodology/" className="text-[var(--accent)] hover:opacity-75">
                methodology
              </a>
            </p>
          </div>
        </section>

        {/* ========================= HOW IT WORKS ========================= */}
        <section className="band">
          <div className="wrap py-20 md:py-24">
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                How it works
              </p>
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
                From URL to a fix list in one pass.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                No account, no crawler of your own to install, nothing to configure. The scan runs
                live against your origin and returns the rules you fail, with the reason.
              </p>
            </div>

            <ol className="mt-14 grid gap-10 sm:grid-cols-3">
              {[
                {
                  title: "Enter a domain",
                  body: "Root domain or full URL. The scanner resolves the origin and fetches robots.txt, the page itself, llms.txt and the sitemap, and reads the Last-Modified header.",
                },
                {
                  title: "40 explicit checks run",
                  body: "Twelve weighted dimensions, from crawler access and entity markup to answer readiness, evidence and citability. Every rule and its weight is published.",
                },
                {
                  title: "You get the fix list",
                  body: "Each failure names the rule, shows what the scanner actually saw, and links the guide that fixes it. Nothing is cached; re-run any time.",
                },
              ].map((step, index) => (
                <li key={step.title}>
                  <span className="mb-4 grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-[13px] font-semibold text-[var(--on-accent)]">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ========================= SEO vs GEO ========================= */}
        {/*
          A table rather than prose: comparisons in tabular form are the shape
          engines extract most reliably, and `extractables` is one of the checks.
        */}
        <section className="band band--alt">
          <div className="wrap py-20 md:py-24">
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                Why it matters in 2026
              </p>
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
                The target moved from a rank to a cited passage.
              </h2>
            </div>

            <div className="mt-12 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr className="bg-[var(--surface-1)] text-[13px] uppercase tracking-wide text-[var(--ink-2)]">
                    <th className="px-6 py-4 text-left font-semibold">Dimension</th>
                    <th className="px-6 py-4 text-left font-semibold">Traditional SEO</th>
                    <th className="px-6 py-4 text-left font-semibold text-[var(--accent)]">
                      Generative GEO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {GEO_COMPARISON.map(([dimension, seo, geo]) => (
                    <tr key={dimension} className="border-t border-[var(--line)]">
                      <td className="px-6 py-4 text-[var(--ink-3)]">{dimension}</td>
                      <td className="px-6 py-4 text-[var(--ink-2)]">{seo}</td>
                      <td className="bg-[var(--surface-1)] px-6 py-4 text-[var(--ink-1)]">
                        {geo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================== EVIDENCE ========================== */}
        {/*
          The blockquote and the outbound citations here are deliberate: citing
          primary sources is the intervention with the largest measured effect in
          the literature, so the site does it, and `quotations`,
          `authority-citations` and `statistics` are three of the checks.
        */}
        <section className="band">
          <div className="wrap py-20 md:py-24">
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                What the published research found
              </p>
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
                The measured gains come from what a page says and cites.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {[
                { figure: "up to 40%", note: "The paper's own headline for visibility gains in generative engine responses." },
                { figure: "41%", note: "Best tested method over the no-optimization baseline, position-adjusted word count (Table 1)." },
                { figure: "28%", note: "The same comparison on subjective impression (Table 1)." },
              ].map((stat) => (
                <div
                  key={stat.figure}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7"
                >
                  <p className="text-4xl font-semibold leading-none tracking-tight text-[var(--accent)]">
                    {stat.figure}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{stat.note}</p>
                </div>
              ))}
            </div>

            <blockquote className="mt-12 border-l-2 border-[var(--accent)] pl-7">
              <p className="text-xl leading-snug tracking-[-0.018em] md:text-2xl">
                GEO can boost visibility by up to 40% overall in generative engine responses, and
                in the paper&rsquo;s Table 1 the best of the tested methods improve on the
                no-optimization baseline by 41% and 28%.
              </p>
              <footer className="mt-4 text-sm text-[var(--ink-2)]">
                — Abstract and Table 1,{" "}
                <a
                  href="https://arxiv.org/abs/2311.09735"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  Generative Engine Optimization
                </a>
                , KDD 2024 (Princeton and Georgia Tech)
              </footer>
            </blockquote>

            <p className="mt-10 max-w-3xl text-sm leading-relaxed text-[var(--ink-2)]">
              LLMention weights its score accordingly. Citability and evidence carry 11% of the
              total and answer readiness a further 10%, because those are the dimensions tied most
              directly to the measurements above. The full weighting, every rule, and an explicit
              account of what the score cannot tell you are published at{" "}
              <a href="/methodology/" className="text-[var(--accent)] underline hover:opacity-75">
                methodology
              </a>
              .
            </p>

            <ul className="mt-6 max-w-3xl list-disc space-y-1.5 pl-5 text-sm text-[var(--ink-2)]">
              <li>
                <a
                  href="https://arxiv.org/abs/2311.09735"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  Generative Engine Optimization
                </a>{" "}
                — KDD 2024. The source of the figures quoted above.
              </li>
              <li>
                <a
                  href="https://arxiv.org/abs/2510.11438"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  What Generative Search Engines Like
                </a>{" "}
                — which page characteristics are actually surfaced in generated answers.
              </li>
              <li>
                <a
                  href="https://llmstxt.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  The llms.txt convention
                </a>{" "}
                — read the primary source rather than a vendor summary of it.
              </li>
            </ul>
          </div>
        </section>

        {/* ============================= FAQ ============================= */}
        {/*
          Content here and the FAQPage markup below come from one source.
          These stay as <details>: the answers are also rendered as real
          heading-then-paragraph pairs by the text inside each one, and `faq`,
          `qa-headings` and `answer-first` all read the visible markup.
        */}
        <section id="faq" className="band band--alt">
          <div className="wrap py-20 md:py-24">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.09em] text-[var(--accent)]">
                  FAQ
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.028em] md:text-4xl">
                  Straight answers about GEO
                </h2>
                <p className="mt-4 text-sm text-[var(--ink-2)]">
                  Short, direct answers about GEO and AI crawler access.
                </p>
              </div>

              <div className="mt-10">
                {FAQ_ITEMS.map((item) => (
                  <details key={item.q} className="group border-b border-[var(--line)] first:border-t">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lg font-medium tracking-[-0.018em]">
                      <h3 className="text-lg font-medium tracking-[-0.018em]">{item.q}</h3>
                      <span className="shrink-0 text-2xl font-light leading-none text-[var(--ink-3)] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="max-w-[70ch] pb-6 text-base leading-relaxed text-[var(--ink-2)]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================ ABOUT ============================ */}
        {/*
          The publisher has to be identifiable, and the contact route has to
          exist, before an engine treats a claim as attributable: `about-contact`
          and `author` read exactly these.
        */}
        <section className="band">
          <div className="wrap py-20 md:py-24">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-[-0.028em]">About LLMention</h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[var(--ink-2)]">
                <p>
                  LLMention is an independent tool that audits whether AI search engines can reach,
                  parse and cite a website. It is not affiliated with OpenAI, Anthropic, Google or
                  Perplexity, and it holds no data relationship with them. The scanner and the
                  llms.txt generator are free and require no account.
                </p>
                <p>
                  The project publishes its scoring method in full, including the checks it runs,
                  the weight each one carries, and the parts of the picture it cannot see. No score
                  floor is applied, so a page that satisfies none of the checks scores near zero.
                  Signals with weak evidence behind them are weighted low rather than advertised as
                  ranking factors.
                </p>
                <p className="text-sm text-[var(--ink-3)]">
                  Written and maintained by the LLMention team.{" "}
                  <a href="/about/" className="text-[var(--accent)] underline hover:opacity-75">
                    More about the project
                  </a>
                  , or{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    get in touch
                  </a>{" "}
                  if the scanner reports something you believe is wrong.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== CLOSING CTA ========================== */}
        <section className="band band-dark">
          <div className="wrap py-24 text-center md:py-28">
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.028em] md:text-5xl">
              Find out what the models see when they look at you.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
              Free, no account, and the same 40 checks this site runs on itself.
            </p>
            <div className="mt-9 flex justify-center">
              <ScanForm variant="compact" placeholder="yourdomain.com" />
            </div>
            <p className="mt-5 text-sm text-[var(--ink-3)]">
              This site scores {SELF_AUDIT.score} / 100 on its own scanner —{" "}
              <a
                href={`/report/?domain=${SITE_HOST}`}
                className="text-[var(--accent)] underline hover:opacity-75"
              >
                see the report
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      {/* ============================= FOOTER ============================= */}
      <footer className="band band--alt border-t border-[var(--line)]">
        <div className="wrap py-14">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-3 text-xs font-semibold text-[var(--ink-1)]">Product</p>
              <ul className="space-y-2.5 text-[13px] text-[var(--ink-2)]">
                <li>
                  <a href="/" className="hover:text-[var(--ink-1)]">
                    GEO scanner
                  </a>
                </li>
                <li>
                  <a href="/llms-txt-studio/" className="hover:text-[var(--ink-1)]">
                    llms.txt studio
                  </a>
                </li>
                <li>
                  <a href="/readiness-badge/" className="hover:text-[var(--ink-1)]">
                    Score badge
                  </a>
                </li>
                <li>
                  <a href="/study/" className="hover:text-[var(--ink-1)]">
                    Study data
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold text-[var(--ink-1)]">Learn</p>
              <ul className="space-y-2.5 text-[13px] text-[var(--ink-2)]">
                <li>
                  <a href="/methodology/" className="hover:text-[var(--ink-1)]">
                    Methodology
                  </a>
                </li>
                <li>
                  <a href="/checks/" className="hover:text-[var(--ink-1)]">
                    All 40 checks
                  </a>
                </li>
                <li>
                  <a href="/docs/" className="hover:text-[var(--ink-1)]">
                    GEO guides
                  </a>
                </li>
                <li>
                  <a href="/llms.txt" className="hover:text-[var(--ink-1)]">
                    llms.txt
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold text-[var(--ink-1)]">Project</p>
              <ul className="space-y-2.5 text-[13px] text-[var(--ink-2)]">
                <li>
                  <a href="/about/" className="hover:text-[var(--ink-1)]">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact/" className="hover:text-[var(--ink-1)]">
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Alex13192/geo-scanner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--ink-1)]"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold text-[var(--ink-1)]">Legal</p>
              <ul className="space-y-2.5 text-[13px] text-[var(--ink-2)]">
                <li>
                  <a href="/privacy/" className="hover:text-[var(--ink-1)]">
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="/terms/" className="hover:text-[var(--ink-1)]">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6 text-xs text-[var(--ink-3)]">
            <span>
              © {new Date().getFullYear()} LLMention. Brand Generative Engine Optimization
              Intelligence.
            </span>
            <span>Not affiliated with OpenAI, Anthropic, Google or Perplexity.</span>
          </div>

          {/*
            The AI Agents Directory badge, on the homepage as well as in PageFooter. The homepage
            does not render PageFooter - it has its own footer - so the badge added there reached
            68 of the 74 built pages and not this one. A listing check most plausibly looks at the
            homepage, and a badge that is everywhere except the page a reviewer opens is not a
            condition met. Same reasoning as the component: their free tier requires it, the paid
            tiers are what you buy to skip it, and their snippet is used as given.
          */}
          <div className="mt-6 flex justify-center">
            <a
              href="https://aiagentsdirectory.com/agent/llmention"
              target="_blank"
              rel="noopener"
              title="Discover LLMention on AI Agents Directory"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://aiagentsdirectory.com/featured-badge.svg?v=2024"
                alt="LLMention - Featured on AI Agents Directory"
                width={200}
                height={50}
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
