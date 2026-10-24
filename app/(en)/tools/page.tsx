import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import Faq from "@/app/components/Faq";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { guidePathForCheck } from "@/lib/geo/check-links";
import { INSIGHTS, insightPath } from "@/lib/insights";
import { MAX_FETCH_PAGES, MAX_LINKS_PER_SECTION } from "@/lib/llms-txt";
import { social } from "@/lib/og";

/**
 * /tools/ - every entry point on the site, grouped by what the reader is trying to do.
 *
 * WHY THIS EXISTS. The site published roughly sixty useful destinations - five tools, one
 * page per rule, one page per dimension, the guides, the method - and had no page listing
 * any of them. Navigation named three, the footer named a few more, and a reader who wanted
 * "the page about llms.txt" had to know that /checks/llms-txt/ was the address. The sites
 * this one is measured against solve that with an index of their tools; this is that index,
 * with the difference that most of what it indexes is the published measurement rather than
 * a free tool.
 *
 * WHY IT IS GROUPED BY PURPOSE RATHER THAN BY URL. /checks/, /dimensions/ and /docs/ are the
 * same shape of address and answer completely different questions: what the scanner tests,
 * how the score is weighted, and how to carry out a fix. Sorting by address would put those
 * three next to each other and call it a list. The six groups below are the six questions
 * a reader actually arrives with:
 *
 *   Run a scan                  I want a number for my own site.
 *   Rule reference              I was told a rule failed; what does it test?
 *   Scoring dimensions          Where does the number come from, and what is it worth?
 *   Method and the evidence     What is this built on, and what can it not see?
 *   Guides                      Something is broken; how do I fix it?
 *   Comparisons                 Which measurement do I actually need?
 *
 * WHERE EVERY STRING ON THIS PAGE COMES FROM. Nothing here is new marketing copy, and the
 * comment on each source below records where the sentence was read from, so the index can
 * be checked against the page it points at:
 *
 *   - tool labels and descriptions  the destination page's own heading and opening sentence
 *   - rule names and descriptions   CHECK_COPY[id].title and checkPageDescription(id), the
 *                                   same two strings the check page renders in its <title>
 *                                   and meta description
 *   - dimension names and reasons   DIMENSION_CATALOG's label and rationale
 *   - the counts in the table       the lengths of the arrays themselves
 *
 * The comparison entries are the exception and are listed by hand: they are three
 * pages written together, and the sentence on each is the one its own page opens
 * with. Keeping them here rather than in a registry is deliberate - three links do
 * not need a module, and a registry for them would be a fourth copy of the routes.
 *
 * The two numbers the LLM studio copy carries are imported from lib/llms-txt.ts rather than
 * typed here, for the reason that file states at length: a number written into prose is a
 * second copy of that number and the two drift the first time somebody changes the limit.
 */

const TITLE = "Free GEO tools, rule reference and measurement method";
const DESCRIPTION =
  "Every free tool, every published rule, the twelve weighted dimensions and the measurement method behind the score, grouped by the question you arrived with.";
const CANONICAL = "/tools/";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL,
    /* Translated into Chinese on 2026-10-23; the pair is claimed on both pages. */
    languages: {
      en: "/tools/",
      "zh-Hans": "/zh/tools/",
      "x-default": "/tools/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: CANONICAL }),
};

/** A destination in the index. `note` is the honest qualifier, where one is needed. */
type Entry = {
  href: string;
  label: string;
  description: string;
  note?: string;
};

type Group = {
  /** Anchor id, so the table above can link into the section. */
  id: string;
  /** The purpose, stated as the question the reader has. */
  purpose: string;
  /** One line on what the whole group is, shown in the lookup table. */
  what: string;
  entries: Entry[];
};

/* --- the tools, described in the words their own pages open with --- */
const TOOL_ENTRIES: Entry[] = [
  {
    href: "/report/",
    label: "GEO audit report",
    description:
      "Scores one homepage against the published checks and lists what failed with the evidence each check produced.",
    note: "Free. No account. No email. Nothing about the site is stored, and the result exists only in the URL you are on.",
  },
  {
    href: "/answer-check/",
    label: "Answer checker",
    description:
      "Six published rules, applied to an answer you paste from ChatGPT, Perplexity or Gemini: does it mention you, mention you early, list you, recommend you, and cite your domain.",
    note: "Free, and no AI engine is contacted - the rules run against the text you paste, in your browser - and there is nothing to sign up for.",
  },
  {
    href: "/llms-txt-studio/",
    label: "/llms.txt studio",
    description: `Drafts an llms.txt from the site's own markup: the real page title, the homepage description, and up to ${MAX_LINKS_PER_SECTION} links per section, each described with that linked page's own meta description or H1 where it was read.`,
    note: `No description in the file is written by the tool. It reads the homepage and up to ${MAX_FETCH_PAGES} of the pages it links to, then says in the file how it was produced and what it could not read.`,
  },
  {
    href: "/readiness-badge/",
    label: "GEO readiness badge",
    description:
      "Embeds a badge carrying the score from a real scan, as Markdown for a README or HTML for a footer. The number is read from the scan and cannot be typed in.",
    note: "No account, no email, and nothing to install.",
  },
  {
    href: "/monitor/",
    label: "Weekly GEO report",
    description:
      "Emails you when a site's score changes: the same checks run once a week, naming the checks that newly fail, with the evidence the failing ones saw.",
    note: "No account. The email address is the whole subscription - confirming it starts the report and the unsubscribe link ends it.",
  },
  {
    /*
     * The API is a tool for the reader who wants the number rather than the page. It sits
     * last because it is the specialist entry point, not the one a first-time visitor needs.
     */
    href: "/api-docs/",
    label: "Scan API",
    description:
      "One public JSON endpoint: the same analyser the report page runs, with no key and no account, documented field by field.",
    note: "Unversioned and rate-limited; the parameters, status codes and what it cannot see are stated on its page rather than discovered in a call.",
  },
];

/**
 * The first sentence of a rule, which is the part that states the condition.
 *
 * WHY NOT checkPageDescription(), WHICH IS THE OBVIOUS CHOICE: that function builds the
 * page's meta description, and it is deliberately a template - "How the X check works, what
 * a failure means, and how to fix it in the Y dimension." Forty of those in one list would
 * be forty sentences saying the same thing with a different noun, which is the opposite of
 * what an index is for. The rule's own first sentence says what the check actually tests,
 * so a reader can recognise the one they need without opening all forty.
 */
function firstSentence(text: string): string {
  const match = text.match(/^[\s\S]*?\.(?=\s|$)/);
  const sentence = (match ? match[0] : text).trim();
  return sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence;
}

const guidesList: { href: string; label: string }[] = [
  {
    href: "/docs/ai-visibility-self-check/",
    label: "How to check whether AI engines mention your brand",
  },
  { href: "/docs/llms-txt-deployment/", label: "How to generate and deploy an llms.txt file" },
  { href: "/docs/qa-style-headings/", label: "Optimizing headings for direct AI citation" },
  {
    href: "/docs/schema-org-jsonld/",
    label: "Implementing Schema.org JSON-LD for entity disambiguation",
  },
  { href: "/docs/allow-ai-crawlers/", label: "Configuring robots.txt and WAF for AI crawlers" },
];

/*
 * The writing, built from the registry rather than listed by hand.
 *
 * The descriptions come from lib/insights.ts, which is also what the archive index and the
 * sitemap read, so a piece cannot exist in one of those three places and be missing from the
 * others. The author page is the last entry rather than a fourth group: it answers the same
 * question - can I check who is saying this - and separating it would make a two-item section.
 */
const WRITING_ENTRIES: Entry[] = [
  {
    href: "/blog/",
    label: "All writing",
    description:
      "Study results, rule explanations and stated limits, in one archive with the data behind each piece.",
  },
  ...INSIGHTS.map((insight) => ({
    href: insightPath(insight.slug),
    label: insight.title,
    description: insight.dek,
  })),
  {
    href: "/author/",
    label: "Who writes this site",
    description:
      "The person accountable for the measurements, how the writing is produced and corrected, and how the site is funded.",
  },
];

/*
 * The comparisons. Written as an array because the table above counts it: the
 * number of destinations in this group is used by the description, and "3" typed
 * into both places is the drift /tools/ exists to prevent one level up.
 */
const COMPARE_ENTRIES: Entry[] = [
  {
    href: "/compare/",
    label: "Which measurement do you need?",
    description:
      "Readiness audits, brand-mention tracking, rank tracking and crawler-log analytics side by side: what each answers, the data it needs, and what it cannot see.",
  },
  {
    href: "/compare/llm-mentions-api/",
    label: "LLMention vs DataForSEO's LLM Mentions API",
    description:
      "Two similarly named products that measure different things, compared on data source, unit of result and blind spot - with DataForSEO's own description and the date it was read.",
  },
  {
    href: "/compare/readiness-vs-mention-tracking/",
    label: "Can AI cite you, or is it already doing so?",
    description:
      "Why readiness is upstream of mentions, why a page can be ready and still go unmentioned, and how to audit first and monitor second.",
  },
];

export default function ToolsIndexPage() {
  const runnableChecks = CHECK_CATALOG.filter((check) => !check.alias);
  const totalWeight = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);
  const totalEntries =
    TOOL_ENTRIES.length +
    runnableChecks.length +
    DIMENSION_CATALOG.length +
    guidesList.length +
    WRITING_ENTRIES.length +
    COMPARE_ENTRIES.length +
    1;
  const guidedChecks = runnableChecks.filter((check) => guidePathForCheck(check.id)).length;

  const groups: Group[] = [
    {
      id: "tools",
      purpose: "I want a number for my own site",
      what: "The tools themselves",
      entries: TOOL_ENTRIES,
    },
    {
      id: "rules",
      purpose: "I was told a rule failed",
      what: "The published rule reference",
      entries: [
        {
          href: "/checks/",
          label: `All ${runnableChecks.length} checks`,
          description:
            "Every rule the scanner runs, grouped by the dimension it belongs to, each with its exact pass condition and its point value.",
        },
        ...runnableChecks.map((check) => ({
          href: `/checks/${check.id}/`,
          label: CHECK_COPY[check.id]?.title ?? check.id,
          description: firstSentence(check.rule),
        })),
      ],
    },
    {
      id: "dimensions",
      purpose: "I want to know where the number comes from",
      what: "The twelve weighted dimensions",
      entries: DIMENSION_CATALOG.map((dimension) => ({
        href: `/dimensions/${dimension.id}/`,
        label: `${dimension.label} — ${dimension.weight}% of the score`,
        description: dimension.rationale,
      })),
    },
    {
      id: "method",
      purpose: "I want to check the method rather than trust it",
      what: "The method and the evidence behind it",
      entries: [
        {
          href: "/methodology/",
          label: "How the GEO score is calculated",
          description:
            "The formula, the A–F bands, every rule with its onFail text and its points, and the parts of the picture a single-URL scan cannot see.",
        },
      ],
    },
    {
      id: "compare",
      purpose: "I am choosing between two different measurements",
      what: "The comparisons",
      entries: COMPARE_ENTRIES,
    },
    {
      id: "guides",
      purpose: "Something failed and I need to fix it",
      what: "The guides",
      entries: guidesList.map((guide) => ({ ...guide, description: "" })),
    },
    {
      id: "writing",
      purpose: "I want to check the claims rather than take the score on trust",
      what: "The writing and the author",
      entries: WRITING_ENTRIES,
    },
  ];

  return (
    <ProsePage
      width="4xl"
      eyebrow="Index"
      title="Everything on this site, and what each thing answers"
      description={
        <>
          <p>
            {totalEntries} destinations: {TOOL_ENTRIES.length} tools you can run yourself,{" "}
            {runnableChecks.length} pages describing the individual rules,{" "}
            {DIMENSION_CATALOG.length} describing the dimensions those rules are scored in,{" "}
            {guidesList.length} guides for the fixes that recur, {WRITING_ENTRIES.length} writing
            and author destinations, {COMPARE_ENTRIES.length} comparisons between measurements, and
            the method they all rest on.
          </p>
          <p>
            The tools are free and need no account. The reference pages are free too, which is the
            unusual half: the rules, their points and their pass conditions are published rather
            than described, so a score can be argued with instead of taken on trust.
          </p>
        </>
      }
      action={{ href: "/", label: "← Back to the scanner" }}
    >
      <div className="space-y-16">
        {/* The lookup table. Six rows, so a reader can find the right section before
            scrolling, with each row linking to its own section anchor. */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[var(--line)] rounded-xl overflow-hidden">
            <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">If you are asking</th>
                <th className="text-left px-4 py-2.5 font-semibold">Go to</th>
                <th className="text-left px-4 py-2.5 font-semibold">Destinations</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-2.5 align-top text-[var(--ink-1)]">{group.purpose}</td>
                  <td className="px-4 py-2.5 align-top">
                    <a href={`#${group.id}`} className="text-[var(--accent)] hover:opacity-75">
                      {group.what}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 align-top font-mono text-xs text-[var(--ink-3)]">
                    {group.entries.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {groups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-24">
            <div className="border-b border-[var(--line)] pb-3 mb-6">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                {group.what}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-3)]">
                {group.purpose} · {group.entries.length}{" "}
                {group.entries.length === 1 ? "destination" : "destinations"}
              </p>
            </div>

            {/* The guides carry their own titles and nothing else: a one-line summary of a
                guide is a second description of it, and the five on /docs/ are already the
                shortest true version of themselves. */}
            {group.id === "guides" ? (
              <ul className="space-y-2.5">
                {group.entries.map((entry) => (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      className="text-[var(--accent)] hover:opacity-75 underline text-[15px]"
                    >
                      {entry.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2 text-sm text-[var(--ink-3)]">
                  {guidedChecks} of the {runnableChecks.length} rule pages name the guide that
                  covers their fix. The rest show the fix in full on the rule page itself, because
                  no guide covers them and pointing at one that half applies would be worse than
                  saying nothing.
                </li>
              </ul>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.entries.map((entry) => (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-5 py-4 transition-colors hover:border-[var(--ink-3)]"
                    >
                      <span className="text-[15px] font-medium text-[var(--ink-1)]">
                        {entry.label}
                      </span>
                      {entry.description ? (
                        <span className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">
                          {entry.description}
                        </span>
                      ) : null}
                      {entry.note ? (
                        <span className="mt-2 text-xs leading-relaxed text-[var(--ink-3)]">
                          {entry.note}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* What the index is not. A page listing sixty destinations is the one place a
            reader is most likely to assume the list is complete in some stronger sense, so
            the boundary is stated where the list ends rather than left to be inferred. */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-6 py-6 text-[15px] leading-relaxed text-[var(--ink-2)]">
          <h2 className="text-xl font-bold text-[var(--ink-1)]">What this index leaves out</h2>
          <p className="mt-3">
            The scanner reads one page. It does not query ChatGPT, Perplexity, Gemini or any other
            engine, so there is no tool here for asking what an engine answers - the{" "}
            <Link
              href="/docs/ai-visibility-self-check/"
              className="text-[var(--accent)] hover:opacity-75 underline"
            >
              self-check guide
            </Link>{" "}
            is the honest version of that, done by hand.
          </p>
          <p className="mt-3">
            The scan result page is not listed either, because it is generated per request from the
            domain you type rather than published. Every rule above links into that report, so the
            fastest way to see which of these {runnableChecks.length} rules a page currently fails
            is to run one against your own domain. The scoring weights across the{" "}
            {DIMENSION_CATALOG.length} dimensions add up to {totalWeight}.
          </p>
        </section>

        {/*
          The questions this index is asked, answered from what is on it rather than from new
          copy. Each answer is assembled from a value the page has already computed - the four
          tool entries and their notes, the guide coverage, the catalogue lengths - so an answer
          cannot go on describing a tool that changed.
        */}
        <section className="space-y-10">
          <Faq
            title="Questions about these tools and references"
            items={[
              {
                q: "Do I need an account for any of this?",
                a: `No. The ${TOOL_ENTRIES.length} tools are free and work on a page you own or an answer you already have, and the ${runnableChecks.length} rule pages, the ${DIMENSION_CATALOG.length} dimension pages and the method are published documents. The one thing that takes an address is the weekly report, and confirming that address is the whole subscription.`,
              },
              {
                q: "Where do I start if I only have five minutes?",
                a: "Run the audit report on your own domain. It returns a score out of 100, the twelve dimension scores behind it and the list of what failed, and every failed rule links to its own page here. Reading this index first is for when you know which question you have.",
              },
              {
                q: `Why do only ${guidedChecks} of the rule pages link to a guide?`,
                a: `The ${guidesList.length} guides cover the fixes that recur across sites: crawler access, schema, headings, llms.txt and how to check citations by hand. The other ${runnableChecks.length - guidedChecks} rules have no guide, so their pages carry the full fix rather than a link to one that only half applies.`,
              },
              {
                q: "Is there an API?",
                a: "Yes. The scan endpoint is documented at /api-docs/: parameters, response shapes, the rate limit and what it does not guarantee. It is still rate-limited per isolate and unversioned - the page says so in those words - so treat it as a published interface rather than a stable product API. The method is published alongside it, so a score can also be recomputed rather than trusted.",
              },
            ]}
          />
          <Evidence
            quote={GEO_PRIMARY_QUOTE}
            attribution="Generative Engine Optimization, KDD 2024"
            attributionUrl="https://arxiv.org/abs/2311.09735"
            sources={GEO_PRIMARY_SOURCES}
            note={`The weighting across the ${DIMENSION_CATALOG.length} dimensions follows that measurement rather than taste, and the rule set is published in full so a score can be recomputed by hand rather than taken on trust.`}
          />
        </section>
      </div>
    </ProsePage>
  );
}
