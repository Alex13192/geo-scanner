/**
 * The homepage's own words and its self-measurement, declared once.
 *
 * WHY THIS MODULE EXISTS: two things render this copy - the page at
 * `app/(en)/(home)/page.tsx` and its markdown twin at `app/(en)/(home)/markdown/route.ts`.
 * The FAQ is rendered a third time, as FAQPage structured data on the page. A sentence
 * written twice is a sentence free to disagree with itself, which is the drift this
 * repository already refuses at the level of the origin, the check catalogue and the
 * article registry. The twin is only worth publishing if it says what the page says.
 *
 * WHAT THE SELF-AUDIT RECORD IS, AND WHY IT IS A FILE RATHER THAN A LITERAL:
 * the figure used to be four constants typed into this page, including a verification date
 * that was true on the day it was typed and remained printed for weeks afterwards. A date
 * nobody updates is worse than no date, because it dresses a stale claim as a current one.
 * `lib/self-audit.json` is now written by `scripts/self-audit.mts` from the same analyser
 * the scanner runs, and `scripts/check-built-pages.mts` fails the build when the record and
 * the built homepage disagree - so the number on the page cannot be a memory of a number
 * the site once scored.
 *
 * THE FOUR RULES THAT KEEP THE FIGURE HONEST live with the writer now, not here: it is
 * measured rather than asserted, it names the failures rather than trimming them, it is
 * re-measured weekly, and nothing in it may be a number for somebody else's domain.
 */
import selfAuditData from "./self-audit.json";
import { formatDate } from "./insights";

type SelfAuditRecord = {
  /** ISO date on which the analyser last scored the built homepage. */
  measuredAt: string;
  score: number;
  grade: string;
  checksRun: number;
  /** Checks that passed. A check marked n/a is neither a pass nor a failure. */
  checksPassed: number;
  /** Checks excluded because the rule cannot judge this page. Named, not hidden. */
  notApplicable: string[];
  /** Check ids that actually failed. Displayed in the hero console as "fix". */
  failures: string[];
};

const record = selfAuditData as SelfAuditRecord;

/**
 * The figure the page publishes, in the shape the page renders it.
 *
 * `applicable` is checksRun minus the exclusions, because "39 of 40 checks passing" is a
 * false reading when one of the 40 was never a question: it makes a perfect applicable
 * result look like one loss. The console and the panel print the applicable denominators.
 */
export const SELF_AUDIT = {
  score: record.score,
  grade: record.grade,
  passed: record.checksPassed,
  run: record.checksRun,
  applicable: record.checksRun - record.notApplicable.length,
  verified: formatDate(record.measuredAt),
  measuredAt: record.measuredAt,
  failures: record.failures,
  notApplicable: record.notApplicable,
} as const;

/**
 * The sentence under the scan box, and the meta description's cousin.
 *
 * It names the three engines a reader is most likely to care about and the exact promise
 * the product keeps: a published list of checks, not a rank. The audit that prompted the
 * rewrite found the old announcement strip promising to show where a site ranks in AI
 * search - a thing this scanner cannot measure - so the copy here and in SiteNav now
 * describe the same, narrower, true capability.
 */
export const TAGLINE =
  "Check whether ChatGPT, Perplexity and Claude can crawl, read and cite your pages — and see exactly which of the 40 published checks you fail.";

/**
 * Visible FAQ content.
 *
 * The SAME array renders the FAQPage structured data on the page and the FAQ section of the
 * markdown twin. That is deliberate: Google only accepts FAQ markup for questions and
 * answers that are actually visible, and a twin that answered differently would be a second
 * version of the page rather than a representation of it.
 *
 * Written answer-first and factually. One answer deliberately tells the reader that
 * llms.txt is NOT a ranking factor, and one says plainly that this is not a mention
 * tracker - overselling either would be dishonest and bad GEO, because AI engines favour
 * accurate sources.
 */
export const FAQ_ITEMS = [
  {
    q: "What is Generative Engine Optimization (GEO)?",
    a: "GEO is the practice of making a website discoverable, parseable and citable by AI search engines such as ChatGPT, Perplexity, Claude and Google AI Overviews. Instead of ranking a blue link, the goal is to be quoted inside a generated answer.",
  },
  {
    q: "How do I check whether AI crawlers can read my website?",
    a: "Check your robots.txt for rules that block AI crawler user-agents such as GPTBot, ClaudeBot, PerplexityBot and Bytespider. LLMention reads robots.txt automatically and names exactly which of them are disallowed at your root. It cannot see your firewall rules — a request it makes comes from its own address, so check those in your CDN yourself.",
  },
  {
    q: "Does LLMention tell me whether ChatGPT mentions my brand?",
    a: "No. It measures whether your pages are in a state that makes being cited possible — crawler access, structure, markup, evidence — and it does not query an AI engine about your brand. Mention tracking is a different measurement, offered by tools such as DataForSEO's LLM Mentions API; LLMention is an independent project and is not affiliated with it.",
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
