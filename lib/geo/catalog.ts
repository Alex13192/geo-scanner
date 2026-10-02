/**
 * The published scoring method.
 *
 * This file is the public contract behind /methodology. It exists as data
 * rather than prose so the documented rules and the executed rules cannot drift
 * apart, and scripts/test-analyze.mts asserts that every check the analyser can
 * emit appears here.
 *
 * If you change a rule in lib/geo/analyze.ts, change it here in the same commit.
 */

export type CatalogCheck = {
  id: string;
  /** Dimension id this check belongs to. */
  dimension: string;
  /** Points this check is worth inside its dimension. */
  points: number;
  /** The exact rule, stated so a reader can verify it themselves. */
  rule: string;
  /** What a non-pass result means. */
  onFail?: string;
};

export type CatalogDimension = {
  id: string;
  label: string;
  /** Share of the total score, in percent. Weights sum to 100. */
  weight: number;
  rationale: string;
  /** Why this weight and not another. */
  weighting: string;
};

export const DIMENSION_CATALOG: CatalogDimension[] = [
  {
    id: "ai-crawler-access",
    label: "AI Crawler Access",
    weight: 16,
    rationale:
      "If a crawler cannot read the page, nothing else on this list can matter. This is the only dimension where a failure makes the rest of the score moot.",
    weighting:
      "Highest weight of the twelve. A page that is blocked or unreadable has no path to being cited, so it dominates the total.",
  },
  {
    id: "machine-readability",
    label: "Machine Readability",
    weight: 12,
    rationale:
      "JSON-LD is how a model binds your brand name, domain and product into one entity instead of inferring three unrelated strings.",
    weighting:
      "Second highest. It is deterministic and fully in your control, and it is what makes entity disambiguation possible.",
  },
  {
    id: "content-depth",
    label: "Content Depth",
    weight: 11,
    rationale:
      "Generative engines select sources that answer a question thoroughly. Thin pages are rarely retrievable regardless of how well they are marked up.",
    weighting:
      "High, because depth is a precondition for retrieval rather than a bonus on top of it.",
  },
  {
    id: "citability",
    label: "Citability & Evidence",
    weight: 11,
    rationale:
      "Statistics, quotations and cited sources are the interventions with the largest measured effect in the published GEO research.",
    weighting:
      "High and research-driven: this is the dimension most directly tied to measured visibility gains.",
  },
  {
    id: "answer-readiness",
    label: "Answer Readiness",
    weight: 10,
    rationale:
      "Answers are extracted as spans, not pages. A question-shaped heading followed by an immediate answer is the easiest thing for a retrieval system to lift intact.",
    weighting: "Substantial, and largely mechanical to fix.",
  },
  {
    id: "trust-authority",
    label: "Trust & Authority",
    weight: 10,
    rationale:
      "E-E-A-T signals decide whether a model treats a claim as safe to repeat rather than something it should hedge.",
    weighting:
      "Weighted equally with answer readiness: attribution is what separates a quote from a rumour.",
  },
  {
    id: "semantic-structure",
    label: "Semantic Structure",
    weight: 8,
    rationale:
      "Heading hierarchy and landmark elements are how a parser locates section boundaries at all.",
    weighting: "Moderate. Mostly a one-time fix.",
  },
  {
    id: "metadata",
    label: "Metadata & Discoverability",
    weight: 7,
    rationale:
      "Title, description and canonical control what a search or answer surface can show about the page.",
    weighting: "Moderate, and cheap to satisfy.",
  },
  {
    id: "llms-txt",
    label: "AI Context Files",
    weight: 5,
    rationale:
      "A cheap and optional signal. Google has stated it does not use llms.txt in Search, and crawler support is inconsistent.",
    weighting:
      "Deliberately low. Most tools in this category weight llms.txt heavily and imply it is a ranking factor; the evidence does not support that, so neither does this score.",
  },
  {
    id: "freshness",
    label: "Freshness",
    weight: 5,
    rationale:
      "Dated content is deprioritised in generated answers, and an undated page gives an engine nothing to reason about.",
    weighting: "Low to moderate: a real but secondary signal.",
  },
  {
    id: "multilingual",
    label: "International Readiness",
    weight: 3,
    rationale:
      "Language and region markup decides which language market a page can be retrieved in at all.",
    weighting:
      "Low for a single-market site, and the first thing to fix if you serve more than one language.",
  },
  {
    id: "delivery",
    label: "Delivery & Mobile",
    weight: 2,
    rationale:
      "A slow or non-mobile-readable page is dropped before any content analysis happens.",
    weighting:
      "Lowest. The checks here are coarse on purpose; full Core Web Vitals need a real browser, which this scanner deliberately does not run.",
  },
];

export const CHECK_CATALOG: CatalogCheck[] = [
  /* ---- AI Crawler Access ---- */
  {
    id: "robots-present",
    dimension: "ai-crawler-access",
    points: 2,
    rule: "A request for /robots.txt returns HTTP 200 with a readable body.",
    onFail: "No readable robots.txt at the domain root.",
  },
  {
    id: "robots-ai-allowed",
    dimension: "ai-crawler-access",
    points: 6,
    rule: "Parsing robots.txt into user-agent groups, none of gptbot, claudebot, perplexitybot, oai-searchbot or google-extended is disallowed from /. An exact agent group takes precedence over the * group, and the last matching rule wins.",
    onFail: "At least one AI crawler is disallowed from the site root.",
  },
  {
    id: "robots-ai-blocked",
    dimension: "ai-crawler-access",
    points: 6,
    rule: "The inverse of the check above, reported by name so the blocked agents appear in the finding.",
  },
  {
    id: "robots-sitemap",
    dimension: "ai-crawler-access",
    points: 1,
    rule: "robots.txt contains a Sitemap: line.",
  },
  {
    id: "home-200",
    dimension: "ai-crawler-access",
    points: 2,
    rule: "The homepage returns HTTP 200 to a non-browser request that identifies itself honestly.",
    onFail:
      "A non-200 homepage response. This is reported as its own finding and is not by itself proof that AI crawlers are blocked.",
  },
  {
    id: "home-noindex",
    dimension: "ai-crawler-access",
    points: 2,
    rule: "The homepage has no meta robots directive containing noindex.",
  },
  {
    id: "sitemap-valid",
    dimension: "ai-crawler-access",
    points: 3,
    rule: "/sitemap.xml returns a body containing <urlset> or <sitemapindex>.",
    onFail: "No sitemap, or a response that is not valid sitemap markup.",
  },

  /* ---- Machine Readability ---- */
  {
    id: "jsonld-valid",
    dimension: "machine-readability",
    points: 5,
    rule: "At least one <script type=\"application/ld+json\"> block parses as JSON. Which blocks failed to parse is reported.",
  },
  {
    id: "jsonld-entity",
    dimension: "machine-readability",
    points: 4,
    rule: "Parsed JSON-LD contains an @type of Organization, WebSite, Person or LocalBusiness.",
  },
  {
    id: "jsonld-content",
    dimension: "machine-readability",
    points: 3,
    rule: "Parsed JSON-LD contains an @type of FAQPage, Article, BlogPosting, HowTo, Product, SoftwareApplication or BreadcrumbList.",
  },

  /* ---- Content Depth ---- */
  {
    id: "word-count",
    dimension: "content-depth",
    points: 5,
    rule: "Visible text, after removing script, style and comment content, contains at least 800 word tokens. 300-799 is a partial pass.",
  },
  {
    id: "sections",
    dimension: "content-depth",
    points: 3,
    rule: "The page contains at least 4 H2 elements. 2-3 is a partial pass.",
  },
  {
    id: "extractables",
    dimension: "content-depth",
    points: 3,
    rule: "The page contains both a <ul>/<ol> and a <table>. Having only one is a partial pass.",
  },

  /* ---- Citability & Evidence ---- */
  {
    id: "statistics",
    dimension: "citability",
    points: 4,
    rule: "Body text contains at least 5 numeric claims: percentages, currency amounts, multipliers of the form 3.2x, or bare numbers of three digits or more.",
  },
  {
    id: "quotations",
    dimension: "citability",
    points: 3,
    rule: "The page contains at least one <blockquote> element.",
  },
  {
    id: "authority-citations",
    dimension: "citability",
    points: 3,
    rule: "The page links to at least 2 external hosts on the authority list: arxiv.org, doi.org, nature.com, science.org, acm.org, ieee.org, springer.com, sciencedirect.com, any .gov or .edu host, wikipedia.org, github.com, developer.mozilla.org, web.dev, nih.gov, who.int or europa.eu. Own-domain links are excluded.",
  },
  {
    id: "canonical",
    dimension: "citability",
    points: 1,
    rule: "The page declares a rel=canonical link.",
  },

  /* ---- Answer Readiness ---- */
  {
    id: "qa-headings",
    dimension: "answer-readiness",
    points: 4,
    rule: "At least 3 H2 or H3 headings either end with a question mark or begin with how, what, why, which, when, who, where, is, are, do, does, can, should or will.",
  },
  {
    id: "faq",
    dimension: "answer-readiness",
    points: 3,
    rule: "Parsed JSON-LD contains a FAQPage node. If instead the page uses <details>/<summary> markup without the schema, that is a partial pass.",
    onFail:
      "No FAQPage schema. Note that this check reads structured data, not the word \"faq\" or \"question\" appearing anywhere in the HTML.",
  },
  {
    id: "answer-first",
    dimension: "answer-readiness",
    points: 3,
    rule: "Of the first 30 heading-then-paragraph pairs (H2/H3 optionally followed by wrapper elements then a <p>), at least 60% have an opening paragraph of 80 words or fewer.",
  },

  /* ---- Trust & Authority ---- */
  {
    id: "https",
    dimension: "trust-authority",
    points: 2,
    rule: "The homepage was retrieved over https://.",
  },
  {
    id: "about-contact",
    dimension: "trust-authority",
    points: 3,
    rule: "Hrefs on the page include both an about-style path (about, company, team, who-we-are) and a contact-style path (contact, support) or a mailto: link.",
  },
  {
    id: "author",
    dimension: "trust-authority",
    points: 3,
    rule: "Authorship is signalled by any of: a Person node in JSON-LD, an author property, rel=\"author\", or a visible byline matching \"by Firstname Lastname\".",
  },
  {
    id: "sameas",
    dimension: "trust-authority",
    points: 2,
    rule: "JSON-LD contains a sameAs property.",
  },

  /* ---- Semantic Structure ---- */
  {
    id: "h1-single",
    dimension: "semantic-structure",
    points: 3,
    rule: "The page contains exactly one non-empty <h1>. Zero or several is a partial or failed result.",
  },
  {
    id: "landmarks",
    dimension: "semantic-structure",
    points: 3,
    rule: "At least 3 of main, article, section, header, nav and footer appear as elements.",
  },
  {
    id: "no-js-dependency",
    dimension: "semantic-structure",
    points: 2,
    rule: "The raw server response contains at least 100 words of visible text without executing JavaScript.",
  },

  /* ---- Metadata ---- */
  {
    id: "title",
    dimension: "metadata",
    points: 3,
    rule: "<title> is between 15 and 65 characters long.",
  },
  {
    id: "description",
    dimension: "metadata",
    points: 2,
    rule: "The meta description is between 50 and 160 characters long.",
  },
  {
    id: "opengraph",
    dimension: "metadata",
    points: 1,
    rule: "At least one meta property beginning with og: is present.",
  },
  {
    id: "html-lang",
    dimension: "metadata",
    points: 1,
    rule: "The <html> element carries a lang attribute.",
  },

  /* ---- AI Context Files ---- */
  {
    id: "llms-txt",
    dimension: "llms-txt",
    points: 4,
    rule: "/llms.txt returns more than 20 bytes and contains an H1, a > summary line and at least 3 markdown links. Missing any of those is a partial pass.",
  },
  {
    id: "ai-context-robots",
    dimension: "llms-txt",
    points: 1,
    rule: "robots.txt is readable, so a crawler policy is published.",
  },

  /* ---- Freshness ---- */
  {
    id: "date-machine",
    dimension: "freshness",
    points: 3,
    rule: "A machine-readable date is found in dateModified, datePublished or article:modified_time. Within 12 months is a full pass; older is a partial pass. If only the HTTP Last-Modified header carries a date, that is a partial pass.",
  },
  {
    id: "copyright-year",
    dimension: "freshness",
    points: 2,
    rule: "The current calendar year appears in the visible body text.",
  },

  /* ---- International Readiness ---- */
  {
    id: "hreflang",
    dimension: "multilingual",
    points: 2,
    rule: "At least 2 hreflang attributes are present.",
  },
  {
    id: "lang-region",
    dimension: "multilingual",
    points: 1,
    rule: "An hreflang-style language tag is declared on the document.",
  },

  /* ---- Delivery & Mobile ---- */
  {
    id: "viewport",
    dimension: "delivery",
    points: 1,
    rule: "A meta viewport tag is present.",
  },
  {
    id: "payload",
    dimension: "delivery",
    points: 1,
    rule: "The uncompressed HTML response is under 500 KB.",
  },
];

/** Grade bands applied to the weighted total. */
export const GRADE_BANDS = [
  { grade: "A", min: 90, label: "Excellent - highly likely to be cited" },
  { grade: "B", min: 80, label: "Good - likely to be cited" },
  { grade: "C", min: 70, label: "Average - several dimensions need work" },
  { grade: "D", min: 60, label: "Poor - significant GEO gaps" },
  { grade: "F", min: 0, label: "Critical - rarely cited by AI engines" },
];

/** Primary literature the weighting decisions lean on. */
export const REFERENCES = [
  {
    title: "Generative Engine Optimization: How to Dominate AI Search",
    url: "https://arxiv.org/abs/2311.09735",
    note: "The Princeton and Georgia Tech study behind the visibility figures most often quoted in this category, including the gains attributed to quotations, statistics and source citations.",
  },
  {
    title: "What Generative Search Engines Like",
    url: "https://arxiv.org/abs/2510.11438",
    note: "Examines which page characteristics generative engines actually surface.",
  },
  {
    title: "What Gets Cited: Competitive GEO",
    url: "https://arxiv.org/abs/2605.25517",
    note: "Finds that earned media is favoured over brand-owned content, which is why third-party citations are scored here.",
  },
  {
    title: "llms.txt standard",
    url: "https://llmstxt.org/",
    note: "The convention itself. Cited so you can read the primary source rather than our summary of it.",
  },
];
