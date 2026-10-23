import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import AuthorLine from "@/app/components/AuthorLine";
import { type EvidenceSource } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { social } from "@/lib/og";

/**
 * The head-to-head page for the two products whose names get merged.
 *
 * WHY THIS PAGE EXISTS: the site's own audit found that "LLMention" is read as
 * DataForSEO's "LLM Mentions API" - two products with similar vocabulary and
 * nothing else in common. A denial buried on /about/ does not reach a reader who is
 * comparing tools, and comparison pages are the format an AI answer quotes most
 * readily. So the page states the difference where the confusion happens.
 *
 * WHAT IS ALLOWED ON THIS PAGE, AND WHY THE RULES ARE THIS TIGHT:
 *   - Every claim about DataForSEO is something their own public pages say, and the
 *     two pages that were read are listed as sources with the date.
 *   - No price and no ranking claimed by either side is reproduced. A number that
 *     comes from a pricing table changes without a code diff; a number in a
 *     comparison table outlives the page that made it true.
 *   - No comparison of quality. The two measure different things; saying one is
 *     "better" would be a category error, and the page is more useful without it.
 */
const TITLE = "LLMention vs DataForSEO's LLM Mentions API";
/**
 * The H1 carries the full product name because the whole point of the page is to
 * separate two strings; the metadata title drops "GEO Scanner" so the rendered
 * <title> (the layout appends " | LLMention") stays inside the 15-65 character range
 * this site publishes and scores other pages against.
 */
const HEADING = "LLMention GEO Scanner vs DataForSEO's LLM Mentions API";
const DESCRIPTION =
  "Similar names, different measurements: this site scores whether your pages can be cited; DataForSEO's LLM Mentions API tracks brand mentions in AI answers.";

/** The catalog's own numbers, imported rather than retyped - see /tools/ for why. */
const CHECK_COUNT = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;
const dimensionWeight = (id: string) =>
  DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;

/**
 * One sentence, quoted exactly, from DataForSEO's own overview page. The page is
 * described in their words rather than ours because a comparison written entirely
 * in the competitor's paraphrase is the thing readers have no way to check.
 */
const DATAFORSEO_QUOTE =
  "LLM Mentions API provides data on keyword, brand and website mentions in LLMs, including metrics like LLM chat mentions, sources and AI search volume.";

const DATAFORSEO_DOCS =
  "https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/overview/";
const DATAFORSEO_PRODUCT = "https://dataforseo.com/apis/ai-optimization-api/llm-mentions-api";

/**
 * Sources for the DataForSEO description, plus the two sources behind the readiness
 * method. The authority links are not decoration: the page makes a claim about a
 * third party, and the reader should be able to read that party's own words rather
 * than take ours for it.
 *
 * WHY THIS IS A PLAIN LIST RATHER THAN THE EVIDENCE COMPONENT the other two
 * comparison pages use: that component exists to render the site's standing GEO
 * quotation as one blockquote. This page's central quotation is the competitor's own
 * definition, which is already quoted in full where it is described; rendering it a
 * second time in a sources block would read as two quotations of the same sentence.
 */
const SOURCES: EvidenceSource[] = [
  {
    label: "DataForSEO, LLM Mentions API overview",
    url: DATAFORSEO_DOCS,
    note: "read 23 October 2026; the quotation above is from this page",
  },
  {
    label: "DataForSEO, LLM Mentions API product page",
    url: DATAFORSEO_PRODUCT,
    note: "read 23 October 2026; the endpoint list and data sources below are condensed from it",
  },
  {
    label: "DataForSEO, AI visibility trend tracker",
    url: "https://llm.dataforseo.com/",
    note: "read 23 October 2026; their free category tracker, separate from the API",
  },
  {
    label: "Generative Engine Optimization (KDD 2024)",
    url: "https://arxiv.org/abs/2311.09735",
    note: "the measurement the readiness weighting follows",
  },
  {
    label: "The rule set and its weights",
    url: "https://github.com/Alex13192/geo-scanner",
    note: "every check, its weight and its pass condition",
  },
];

/** When the competitor pages were read. Stated on the page, not only in a commit. */
const ACCESSED = "23 October 2026";
const REVIEWED = "2026-10-23";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/compare/llm-mentions-api/",
    /* Translated into Chinese on 2026-10-23; the pair is claimed on both pages. */
    languages: {
      en: "/compare/llm-mentions-api/",
      "zh-Hans": "/zh/compare/llm-mentions-api/",
      "x-default": "/compare/llm-mentions-api/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/compare/llm-mentions-api/",
  }),
};

export default function LlmMentionsApiComparisonPage() {
  return (
    <ProsePage
      eyebrow="Comparison"
      title={HEADING}
      description={
        <p>
          Two products with almost the same vocabulary measure different things. One reads your
          pages and scores whether they can be cited; the other reports brand mentions in LLM
          responses. Neither replaces the other.
        </p>
      }
      action={{ href: "/compare/", label: "← All comparisons" }}
      width="4xl"
    >
      <div className="space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
        <AuthorLine date={REVIEWED} label="Last reviewed" />

        <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
          <p>
            The confusion is understandable: &ldquo;LLM mentions&rdquo; and &ldquo;LLMention&rdquo;
            share the words, and both products publish a number that looks like visibility. But
            they measure opposite ends of the same pipeline: this site measures whether a page{" "}
            <em>can</em> be cited, and DataForSEO measures whether a brand <em>is</em> mentioned.
          </p>
          <p>
            The two are unaffiliated. This site is not a partner, reseller or front end for
            DataForSEO, and there is no data relationship or shared operator between them. Similar
            vocabulary in two product names is not a partnership, and neither product replaces the
            other.
          </p>

          <h2>What does DataForSEO&rsquo;s LLM Mentions API do?</h2>
          <p>
            As described on their site, accessed {ACCESSED}, it provides data on keyword, brand and
            website mentions in LLMs, and it is positioned for tracking brand visibility in AI
            answers. The quotation is theirs, reproduced exactly:
          </p>
          <blockquote>
            &ldquo;{DATAFORSEO_QUOTE}&rdquo; —{" "}
            <a href={DATAFORSEO_DOCS} rel="noopener">
              DataForSEO, LLM Mentions API overview
            </a>
          </blockquote>
          <p>
            Their product page lists what that breaks into: Search Mentions for how and in what
            context a keyword or domain appears in LLM responses; Target Metrics that aggregate
            mention counts by location, language, LLM and domain; a multi-target variant for
            comparing brands side by side; Top Mentioned Domains, Pages and Brands; and historical
            timeseries, including new and lost mentions, across Google&rsquo;s AI Overviews and
            ChatGPT with data going back to 2025. Lite endpoints return the same counts and AI
            search volume without the heavier breakdowns. Their public pages also include a free
            visibility trend tracker at{" "}
            <a href="https://llm.dataforseo.com/" rel="noopener">
              llm.dataforseo.com
            </a>
            , separate from the API.
          </p>

          <h2>What does LLMention measure instead?</h2>
          <p>
            This scanner fetches one URL the way a crawler would and scores the response against{" "}
            {CHECK_COUNT} published checks across {DIMENSION_COUNT} weighted dimensions. It reads
            robots.txt, llms.txt and the sitemap; it parses the HTML for entity markup, heading
            structure and extractable facts; and it reports every failed check with the evidence
            that produced it. It never queries a model.
          </p>
          <p>
            The weights describe what makes a page citable. AI crawler access is{" "}
            {dimensionWeight("ai-crawler-access")}% of the score because a page that cannot be
            fetched cannot be read at all. Content depth is {dimensionWeight("content-depth")}% and
            citability is {dimensionWeight("citability")}%, the dimension the published research
            supports most directly. The AI context file is {dimensionWeight("llms-txt")}%, and
            delivery is the smallest dimension at {dimensionWeight("delivery")}%: a real check,
            deliberately minor. None of those percentages says anything about whether an engine
            will name you.
          </p>

          <h2>What is different between the two?</h2>
          <p>
            The table states the five differences that decide which one a reader needs: the
            question, the data source, the unit of result, the blind spot, and the moment each is
            the right tool.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>LLMention GEO Scanner</th>
                  <th>DataForSEO&rsquo;s LLM Mentions API</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>The question each answers</td>
                  <td>Can a crawler reach this page, parse it, and find what an answer would need to quote?</td>
                  <td>Is this brand named in AI answers, how often, and in what context?</td>
                </tr>
                <tr>
                  <td>Data source</td>
                  <td>
                    Your pages, fetched once, plus robots.txt, llms.txt and the sitemap. The
                    response is scored against published rules.
                  </td>
                  <td>
                    A database of LLM prompts and responses, as their site describes it, queried by
                    keyword, domain or brand.
                  </td>
                </tr>
                <tr>
                  <td>Unit of result</td>
                  <td>A score out of 100, a grade, and the list of failed checks with the evidence each one saw.</td>
                  <td>
                    Mention counts and AI search volume, grouped by location, language, LLM and
                    domain, with historical series.
                  </td>
                </tr>
                <tr>
                  <td>What each cannot see</td>
                  <td>Whether any engine mentions or cites you. It measures readiness, not answers.</td>
                  <td>
                    Whether the cited page is yours, why a mention appeared, or whether pages that
                    are never cited were crawled at all.
                  </td>
                </tr>
                <tr>
                  <td>When each is the right tool</td>
                  <td>
                    When you control the pages, have no evidence of citations yet, and want a list
                    of edits rather than a trend line.
                  </td>
                  <td>
                    When the question is your presence in answers, a competitor comparison, or how
                    that presence moved over time.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>When is each the right tool?</h2>
          <p>
            The choice follows from which end of the pipeline you are looking at, and it is
            possible to need both.
          </p>
          <ul>
            <li>
              <strong>Choose the readiness audit</strong> when the page is yours and you do not yet
              know whether a crawler can read it. Its output is a list of edits, and its rules are
              published so a result can be argued with.
            </li>
            <li>
              <strong>Choose mention tracking</strong> when you need to know whether your brand
              appears in AI answers, how that compares with a competitor&rsquo;s, or whether it is
              rising or falling. No amount of page markup answers that.
            </li>
            <li>
              <strong>Choose both when what changed is the question.</strong> The audit tells you
              whether a change to the page was worth making; mention data tells you whether the
              change was followed by anything.
            </li>
            <li>
              <strong>Choose neither for conventional rankings.</strong> Rank tracking and
              server-log analytics measure different surfaces; the{" "}
              <Link href="/compare/">comparison hub</Link> puts all four side by side.
            </li>
          </ul>

          <h2>Can one of these replace the other?</h2>
          <p>
            No, and the reason is structural rather than commercial. Readiness is an input to being
            cited, not a measurement of it. A mention can occur without any crawl of your page: an
            answer can name a brand it read from a review site, a news article or a
            competitor&rsquo;s comparison.
          </p>
          <p>
            They are not substitutes, so this page does not rank them. A winner would be an
            artefact of the question rather than a fact about the products.
          </p>

          <h2>Where does the description of DataForSEO come from?</h2>
          <p>
            Every claim about their product is condensed from the sources below, read on{" "}
            {ACCESSED}, and the quotation above is their own sentence. No price, and no ranking
            claimed by either side, is reproduced: those change without a code diff. The numbers
            about this site&rsquo;s method are imported from <code>lib/geo/catalog.ts</code> rather
            than typed, so they cannot drift from the rules the scanner runs.
          </p>
          <ul>
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noopener">
                  {source.label}
                </a>
                {source.note ? <span> — {source.note}</span> : null}
              </li>
            ))}
          </ul>
        </article>

        <Faq
          title="Questions about the two products"
          items={[
            {
              q: "Is LLMention affiliated with DataForSEO?",
              a: "No. They are separate products operated by separate people, and there is no partnership, resale, data relationship or shared operator between them. The names are similar, and that similarity is exactly what confuses the two, but it is not evidence of a relationship.",
            },
            {
              q: "Which one tells me whether ChatGPT recommends my brand?",
              a: "Of the two, only DataForSEO's, as described on their site: it reports brand mentions in LLM responses, including mention counts and AI search volume. This scanner can never answer that question, because it does not query an engine. It tells you whether the page an engine would need is in a state to be cited.",
            },
            {
              q: "Do I need both?",
              a: "Only if both questions matter and you expect to act on the answers. Start with readiness: it is the cheaper question to settle, and its failures are on your own pages. Add mention tracking when you have content worth being mentioned for.",
            },
          ]}
        />
      </div>
    </ProsePage>
  );
}
