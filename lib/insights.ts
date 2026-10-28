/**
 * The writing on this site, as data.
 *
 * WHY THE ARTICLES ARE REGISTERED HERE RATHER THAN DISCOVERED BY READING THE FILE TREE:
 * the index page and the sitemap both need the same list, and both need it in the same
 * order. A hand-written list in each place is two lists that agree until the day one is
 * edited - which is the failure this repository has a check for at the level of the
 * origin, and there is no reason to reintroduce it one level down. `app/sitemap.ts` maps
 * over this array, the index maps over it, and each article imports its own entry to get
 * its metadata, so a slug, a title and a publication date cannot disagree with each other.
 *
 * WHAT IS NOT HERE: the body. Articles are JSX in `app/(en)/blog/<slug>/page.tsx`
 * because the case for hand-written markup is the same as it is for /docs/: long-form
 * prose needs lists, tables, code and links in specific places, and a markdown file plus
 * a renderer would add a build step to get back what JSX already does.
 *
 * DATES ARE TRUE. These six pieces were written for the launch of this section on
 * 18 October 2026 and every one of them is dated that day. A backdated publication date
 * would make the archive look more established than it is, which is the cheapest kind of
 * lie a content site tells, and one an AdSense reviewer is not the only reader of.
 */

export type InsightCategory = "Study" | "Method" | "Explainer";

/**
 * Everything a page header needs, and nothing an archive card needs.
 *
 * The split exists because /author/ renders through the same shell as the articles: it is a
 * dated, bylined page with sources, but it is not an entry in the archive, so it has no card
 * figure and must not appear in the index or the sitemap as a piece. Typing the shell against
 * this rather than against `Insight` keeps that distinction in the type system instead of in a
 * comment.
 */
export type PostMeta = {
  /** URL segment. Stable - changing it breaks links and the sitemap. */
  slug: string;
  /** Rendered as the <title> with " | LLMention" appended, so keep this under 54 chars. */
  title: string;
  /** Meta description: 50-160 characters, the range this site's own rules publish. */
  description: string;
  /** One sentence on the card, longer than the description and different from it. */
  dek: string;
  category: InsightCategory;
  /** ISO date. All six were published on the launch day of this section. */
  published: string;
  /**
   * ISO date of the last substantive page revision. Absent on pages that have not been revised;
   * when present it is shown as "Updated" and used as BlogPosting dateModified, so the field
   * cannot claim freshness the content does not have.
   */
  updated?: string;
  /**
   * Which languages this piece exists in. Absent means all three (the six launch pieces were
   * translated); an English-first daily post is `["en"]` until its translations land. The blog
   * archive, sitemap and hreflang all read this, so a missing translation cannot be advertised
   * as an existing page.
   */
  languages?: readonly ("en" | "zh" | "ja")[];
  readTime: string;
};

export type Insight = PostMeta & {
  /**
   * The single number the piece turns on, for the index card. Not decoration.
   */
  figure: string;
  figureLabel: string;
};

/** Newest first. The index and the sitemap both read this order. */
export const INSIGHTS: Insight[] = [
  {
    slug: "markdown-alternates-llm-readable",
    title: "Markdown alternates: serving LLM-readable content",
    description:
      "A rel=alternate text/markdown link is cheap and unscoped easily. Separate URLs versus content negotiation, the drift failure, and how to test a twin.",
    dek: "The declaration is one point and never followed. The twin behind it is the work: generated from the same source, scoped to the pages that exist, and tested against the page.",
    category: "Method",
    published: "2026-10-28",
    readTime: "9 min read",
    figure: "1",
    figureLabel: "point for a text/markdown alternate",
    languages: ["en"],
  },
  {
    slug: "hreflang-for-machine-translated-sites",
    title: "Hreflang for a site that machine-translates",
    description:
      "A cluster is a reciprocal declaration, not a quality signal. What machine translation adds to the failure list, what partial translation should declare, and what the scanner cannot fetch.",
    dek: "Cheap translation and a loop-generated cluster look complete. The failure is a declaration that names pages which do not exist, and a single fetch cannot catch it.",
    category: "Method",
    published: "2026-10-28",
    readTime: "10 min read",
    figure: "2",
    figureLabel: "points for two distinct language codes",
    languages: ["en"],
  },
  {
    slug: "sitemap-lastmod-false-freshness",
    title: "Sitemap lastmod: why false freshness is worse than none",
    description:
      "Computed, frozen and future dates, the incident that made this site test its lastmod, and why comparing against git beats file mtimes.",
    dek: "A lastmod is a promise that something changed. A field that always claims freshness teaches the crawler to ignore it, and the loss is quiet.",
    category: "Method",
    published: "2026-10-28",
    readTime: "10 min read",
    figure: "27",
    figureLabel: "rule pages hit by a stale lastmod",
    languages: ["en"],
  },
  {
    slug: "canonical-urls-split-citations",
    title: "Canonical URLs: the mistakes that split citations",
    description:
      "A canonical is a hint, not a redirect, and the scanner only checks that the tag exists. The nine address mistakes that split signals, and how to audit the four signals together.",
    dek: "The interesting failures are not in the tag but in the address it names. A canonical that points at a redirect, a 404 or another language is worse than none.",
    category: "Method",
    published: "2026-10-27",
    readTime: "10 min read",
    figure: "1",
    figureLabel: "point for a rel=canonical tag",
    languages: ["en"],
  },
  {
    slug: "heading-hierarchy-for-extraction",
    title: "Heading hierarchy for extraction, not just SEO",
    description:
      "Headings are the boundaries a parser uses to cut a page into passages and the labels it gives them. The outline failures that pass every counter, and the scanner rules that count them.",
    dek: "One H1, real H2 sections, landmarks — but the reason is extraction, not a checklist. What a heading does for a passage, and what it does not.",
    category: "Explainer",
    published: "2026-10-27",
    readTime: "9 min read",
    figure: "1",
    figureLabel: "H1 the outline rule wants",
    languages: ["en"],
  },
  {
    slug: "quotations-attribution-trust-signals",
    title: "Quotations, attribution and trust signals",
    description:
      "A blockquote is typography; a citation is a source. The two rules that check both are presence checks, and what makes a quote checkable.",
    dek: "The scanner passes any blockquote and any byline-shaped string. Neither is evidence. What a quotation needs, and the trust signals around it.",
    category: "Method",
    published: "2026-10-27",
    readTime: "9 min read",
    figure: "3",
    figureLabel: "points for any blockquote",
    languages: ["en"],
  },
  {
    slug: "statistics-without-sources-citation-trap",
    title: "Statistics without sources: the citation trap",
    description:
      "The scanner counts numbers and counts authority links; it never checks one against the other. Seven shapes of the trap, six questions a citable figure must answer, and how to audit a page.",
    dek: "A number is the most quotable thing on a page and the easiest to fake. Both rules that touch statistics are presence checks, and the rule pages say so.",
    category: "Method",
    published: "2026-10-27",
    readTime: "10 min read",
    figure: "0",
    figureLabel: "numbers the scan verifies against a source",
    languages: ["en"],
  },
  {
    slug: "tables-lists-and-prose-only-facts",
    title: "Tables, lists and the cost of prose-only facts",
    description:
      "Structure makes a fact liftable, and every structure also makes a claim about its content. When a table or list helps, when it lies, and what the scanner's two rules actually verify.",
    dek: "A paragraph can hold five facts and be cited for none of them cleanly. A list item is one claim; a table row is a tuple. The trade is real in both directions.",
    category: "Method",
    published: "2026-10-27",
    readTime: "10 min read",
    figure: "3",
    figureLabel: "points for a list and a table",
    languages: ["en"],
  },
  {
    slug: "answer-first-writing-measured-positions",
    title: "Answer-first writing: measured positions",
    description:
      "A scoped measurement of 16 articles and 101 heading-paragraph pairs: how often the answer arrives in the first 80 words, and what the number does not prove.",
    dek: "Answer-first is a claim about position, so it can be measured. This is the measurement taken here — 101 pairs, 90% short openers — and the limits of a sample written to the rule.",
    category: "Method",
    published: "2026-10-26",
    readTime: "8 min read",
    figure: "91/101",
    figureLabel: "openers under 80 words",
    languages: ["en"],
  },
  {
    slug: "how-answer-engines-pick-the-span-they-quote",
    title: "How answer engines pick the span they quote",
    description:
      "The unit of competition is the passage, not the page. Headings, opening sentences and liftable structures, plus the scanner rules that measure them and what those rules admit.",
    dek: "An engine quotes a sentence or a paragraph, not a URL. The author's half of that decision is making the passage findable, self-contained and checkable.",
    category: "Explainer",
    published: "2026-10-26",
    readTime: "11 min read",
    figure: "60",
    figureLabel: "percent short openers for a full pass",
    languages: ["en"],
  },
  {
    slug: "datepublished-datemodified-ai-freshness",
    title: "datePublished, dateModified and AI freshness",
    description:
      "The three dates a page claims, the precedence the scanner uses, and the build-timestamp habit that makes freshness mean nothing.",
    dek: "A page's dates are claims about its own history. The easiest way to make them worthless is to move one on every deploy.",
    category: "Explainer",
    published: "2026-10-26",
    readTime: "10 min read",
    figure: "12",
    figureLabel: "months for a full freshness pass",
    languages: ["en"],
  },
  {
    slug: "faqpage-schema-after-rich-results",
    title: "FAQPage schema after the rich-result changes",
    description:
      "The rich result was restricted in 2023; the markup still has a job. What a FAQPage is good for now, how to write one honestly, and what the scanner does not compare.",
    dek: "Most sites kept their FAQPage markup after the rich result went away without asking what it still does. The answer is smaller and more useful than the old one.",
    category: "Explainer",
    published: "2026-10-26",
    readTime: "9 min read",
    figure: "3",
    figureLabel: "points for a FAQPage node",
    languages: ["en"],
  },
  {
    slug: "sameas-which-profiles-help-entity-resolution",
    title: "sameAs: which profiles actually help an entity resolve",
    description:
      "A hierarchy from registries to noise, the self-reference and dead-link mistakes that make the list worthless, and how to audit every URL you claim.",
    dek: "sameAs is a list of claims, not a link dump. What counts as corroboration, what counts as padding, and why the scanner's two-point check does not fetch a single profile.",
    category: "Explainer",
    published: "2026-10-26",
    readTime: "10 min read",
    figure: "2",
    figureLabel: "points for a non-empty sameAs",
    languages: ["en"],
  },
  {
    slug: "entity-graph-organization-website-softwareapplication",
    title: "The entity graph: Organization vs WebSite vs SoftwareApplication",
    description:
      "Three nodes that answer three different questions, the @id relations that make them a graph, and the mistakes that pass validation while saying nothing.",
    dek: "Most entity markup is three disconnected blocks. The part that makes it a graph is the identifiers and relations — and the part most sites skip is deciding what the product is.",
    category: "Explainer",
    published: "2026-10-25",
    readTime: "10 min read",
    figure: "3",
    figureLabel: "nodes most product sites need",
    languages: ["en"],
  },
  {
    slug: "llms-full-txt-and-context-budgets",
    title: "llms-full.txt and context budgets",
    description:
      "The optional corpus half of the llms.txt proposal: token arithmetic, what belongs in the file, three ways to stay inside a budget, and when not to publish one.",
    dek: "A full corpus is offered as the generous version of llms.txt. It is also the version that pays a context bill on every request — and most sites never do the arithmetic.",
    category: "Explainer",
    published: "2026-10-25",
    readTime: "9 min read",
    figure: "~25k",
    figureLabel: "tokens in a 100 KB corpus",
    languages: ["en"],
  },
  {
    slug: "llms-txt-what-it-changes",
    title: "llms.txt: what it changes and what it does not",
    description:
      "The convention, the four properties the scanner checks, the 3.3-point ceiling, and the five mistakes that make a context file worse than none.",
    dek: "llms.txt is cheap to publish and easy to over-claim. This is what it can do, what it cannot, and how to tell whether yours is worth the bytes.",
    category: "Explainer",
    published: "2026-10-25",
    readTime: "10 min read",
    figure: "3.3",
    figureLabel: "points of 100 at most",
    languages: ["en"],
  },
  {
    slug: "what-a-crawler-sees-without-javascript",
    title: "What a crawler sees when your page needs JavaScript",
    description:
      "The browser and a non-rendering crawler receive different documents. Three curl checks and a no-JS reload show which one your article is in.",
    dek: "A page that looks complete in a browser can be a shell in the fetch a crawler makes. The gap is cheap to measure and easy to miss, because every manual test runs JavaScript.",
    category: "Explainer",
    published: "2026-10-25",
    readTime: "9 min read",
    figure: "100",
    figureLabel: "words the rule looks for",
    languages: ["en"],
  },
  {
    slug: "cloudflare-waf-ai-crawlers-403-meaning",
    title: "Cloudflare WAF and AI crawlers: what a 403 actually means",
    description:
      "A 403 can be a WAF rule, bot management, a rate limit or the origin. Two requests with different User-Agents separate a crawler-targeted refusal from a broad one.",
    dek: "Most accidental AI-crawler blocks are a 403 that was never about robots.txt. The two-probe test tells you which layer refused the request before you edit anything.",
    category: "Method",
    published: "2026-10-25",
    readTime: "10 min read",
    figure: "403",
    figureLabel: "the status this article is about",
    languages: ["en"],
  },
  {
    slug: "robots-txt-lines-that-block-ai-crawlers",
    title: "Which robots.txt lines actually block AI crawlers",
    description:
      "Five crawler tokens, the rule shapes that block them by accident, and a five-command test that separates a robots.txt block from a server-side refusal.",
    dek: "Most sites that block an AI crawler did not mean to. This is the difference between a deliberate policy line, a wildcard that catches more than intended, and a 403 that has nothing to do with robots.txt.",
    category: "Method",
    published: "2026-10-24",
    readTime: "11 min read",
    figure: "5",
    figureLabel: "crawler tokens the scanner tests",
    languages: ["en"],
  },
  {
    slug: "thirty-homepages-none-graded-a",
    title: "We scanned 30 homepages and none graded an A",
    description:
      "The full distribution from our 30-site study: the average score, the ceiling, and why the top of the range is a B rather than an A.",
    dek: "The study has one number everyone quotes and four it rarely does. This is the distribution behind them, including the nine rows that never produced a page at all.",
    category: "Study",
    published: "2026-10-18",
    updated: "2026-10-24",
    readTime: "9 min read",
    figure: "0 of 30",
    figureLabel: "scored an A",
  },
  {
    slug: "six-news-publishers-blocking-ai-crawlers",
    title: "Six news publishers, six blocking AI crawlers",
    description:
      "All six news sites in our study disallow at least one AI crawler. The measured scores, the robots.txt lines, and the trade they are making.",
    dek: "Every news publisher in the sample turns away at least one of the crawlers behind ChatGPT, Claude, Perplexity and Doubao. That is a policy choice with a measurable cost, and it is not obviously the wrong one.",
    category: "Study",
    published: "2026-10-18",
    updated: "2026-10-24",
    readTime: "8 min read",
    figure: "6 of 6",
    figureLabel: "news sites block a crawler",
  },
  {
    slug: "nine-homepages-never-answered",
    title: "Nine homepages never answered the crawler",
    description:
      "Nine of thirty homepages answered a crawler-shaped request with an error. What those status codes mean, and why they are excluded from the average.",
    dek: "A 403 is not a page. Nine rows in the study describe an error response rather than a site, and counting them as zero would have produced a more dramatic and less true number.",
    category: "Method",
    published: "2026-10-18",
    updated: "2026-10-24",
    readTime: "7 min read",
    figure: "9 of 30",
    figureLabel: "answered with an error",
  },
  {
    slug: "entity-markup-gap",
    title: "22 of 30 sites leave AI guessing who they are",
    description:
      "Only eight homepages in our study declare an Organization or WebSite entity. What that costs a model resolving a brand, and the markup that fixes it.",
    dek: "A model that cannot bind a name to a domain has to guess, and a guess is not a citation. The markup that fixes it is four lines of JSON, and most of the sample does not have it.",
    category: "Study",
    published: "2026-10-18",
    updated: "2026-10-24",
    readTime: "9 min read",
    figure: "22 of 30",
    figureLabel: "declare no entity",
  },
  {
    slug: "llms-txt-what-the-evidence-supports",
    title: "llms.txt: what the evidence actually supports",
    description:
      "The llms.txt convention, the claims made for it, and the measurement behind our decision to weight it 3.3 of 100 points rather than treat it as a ranking factor.",
    dek: "The file is easy to add and hard to justify as a lever. This is the case for publishing one anyway, and the case against pretending it is more than it is.",
    category: "Explainer",
    published: "2026-10-18",
    updated: "2026-10-24",
    readTime: "8 min read",
    figure: "3.3 / 100",
    figureLabel: "maximum points at stake",
  },
  {
    slug: "reading-a-failed-check",
    title: "How to read a failed check and fix the right thing",
    description:
      "A failed check is a claim about your page, not a verdict. Three questions to ask before you rewrite anything, with real examples from the scanner.",
    dek: "Most bad fixes come from reading a failure as an instruction. The rule pages publish what each check does not test for exactly this reason; this is how to use that.",
    category: "Method",
    published: "2026-10-18",
    updated: "2026-10-24",
    readTime: "7 min read",
    figure: "3 questions",
    figureLabel: "before you rewrite anything",
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Formats an ISO date without Intl.
 *
 * `toLocaleDateString` would be shorter and is wrong here: the same source renders as
 * "18 October 2026" in London, "October 18, 2026" in New York and "2026/10/18" elsewhere,
 * so the server's build output and a reader's hydrated page could disagree. A fixed
 * format is also what a `<time dateTime="...">` attribute expects next to it.
 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export const INSIGHT_BASE = "/blog/";

/** The languages a piece exists in. Absent means the three languages the site publishes. */
export function insightLanguages(insight: Insight): readonly ("en" | "zh" | "ja")[] {
  return insight.languages ?? (["en", "zh", "ja"] as const);
}

/** The pieces published in one language, for the localized archive and the sitemap. */
export function insightsForLocale(locale: "en" | "zh" | "ja"): Insight[] {
  return INSIGHTS.filter((insight) => insightLanguages(insight).includes(locale));
}

export function insightPath(slug: string): string {
  return `${INSIGHT_BASE}${slug}/`;
}

/**
 * The registry entry for one article.
 *
 * Why a lookup rather than an index: `INSIGHTS[0]` is a reference to position, so
 * reordering the archive silently repoints an article's metadata at a different piece.
 * A slug is the identity the URL already uses, and a missing entry throws at build time
 * rather than shipping a page whose title belongs to somebody else.
 */
export function getInsight(slug: string): Insight {
  const found = INSIGHTS.find((insight) => insight.slug === slug);
  if (!found) {
    throw new Error(
      `No article is registered under "${slug}". Add it to INSIGHTS in lib/insights.ts.`
    );
  }
  return found;
}
