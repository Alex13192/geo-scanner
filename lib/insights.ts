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
