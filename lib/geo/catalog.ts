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
  /**
   * A reading of the rule that a user would not guess from the rule text alone,
   * published because leaving it out makes the methodology page misleading. The
   * missing-robots.txt case is the reason this field exists.
   *
   * TWO KINDS OF READING BELONG HERE, AND NOTHING ELSE DOES.
   *
   *   1. An intermediate outcome the analyser can award but `rule` does not
   *      describe - "1 to 4 numeric claims is a partial pass worth 2 of the 4
   *      points". This is not commentary; it is the scoring band, and a method
   *      that awards half marks without publishing them is not the method it
   *      claims to be.
   *   2. What the check actually reads, where a reader would reasonably assume
   *      more. `payload` measures the uncompressed HTML string, not images;
   *      `viewport` tests for the declaration and never looks at the value.
   *
   * A sentence that restates the rule in different words is not a note, and a
   * sentence that is true of every check is furniture. Both are how a page grows
   * without getting more honest, which is the one thing this file must not do.
   */
  note?: string;
  /**
   * True when this entry documents the other outcome of the same check rather
   * than an additional check. Alias entries never run alongside their
   * counterpart, so they are excluded from the per-scan check count.
   */
  alias?: boolean;
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
      "A cheap and optional signal: one URL that lets a site state its own context for machines. Publishing it is easy; whether any engine reads it is not something this method measures.",
    weighting:
      "Deliberately low. The check is worth 4 of this dimension's 6 points and the dimension carries 5% of the total, so the file is capped at 3.3 of the 100. It is scored because the convention is cheap to follow, not because it moves a ranking.",
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
    rule: "A request for /robots.txt returns HTTP 200 with a non-empty body. A 200 with an empty or whitespace-only body counts as not served, because it publishes no policy at all.",
    onFail: "No readable robots.txt at the domain root.",
  },
  {
    id: "robots-ai-allowed",
    dimension: "ai-crawler-access",
    points: 6,
    rule: "Parsing robots.txt into user-agent groups, none of gptbot, claudebot, perplexitybot, oai-searchbot or google-extended is disallowed from /, AND the homepage served a crawler-shaped request with HTTP 200. An exact agent group takes precedence over the * group, the longest matching pattern wins and Allow wins ties, an empty Disallow value matches nothing, and * is treated as a wildcard. When the homepage refused the request, the verdict follows a second probe of the same URL made with a browser-shaped User-Agent: if that one returns 200 the refusal is aimed at identified crawlers, and the check fails under robots-ai-blocked; if it is refused as well, the refusal is about the scanning address rather than the site, and this check scores 2 of 6 as unverified.",
    onFail: "At least one AI crawler is disallowed from the site root, or the server refuses identified crawlers outright.",
    note: "A site with no robots.txt at all passes this check only when the homepage was actually served, because with no file no crawler is disallowed by it. That is a deliberate reading: absence of robots.txt is a policy gap, not a block, and the gap is reported separately by robots-present. A refusal by the server is the stronger evidence and now overrides the file: robots.txt saying nothing is not permission if the request is rejected before it is read.",
  },
  {
    id: "robots-ai-blocked",
    dimension: "ai-crawler-access",
    points: 6,
    alias: true,
    rule: "The inverse of the check above, reported by name so the blocked agents appear in the finding. It is also reported when the server refuses identified crawlers while serving a browser-shaped request, because the effect on those crawlers is the same.",
  },
  {
    id: "robots-sitemap",
    dimension: "ai-crawler-access",
    points: 1,
    rule: "robots.txt contains a Sitemap: line.",
    note: "The presence of the line is the test, not what it points at: the URL is not fetched, so a Sitemap: line naming a file that does not exist passes here and fails sitemap-valid. The two results are reported separately rather than merged, because a declaration that exists and a file that resolves are different facts.",
  },
  {
    id: "home-200",
    dimension: "ai-crawler-access",
    points: 2,
    rule: "The homepage returns HTTP 200 to a non-browser request that identifies itself honestly.",
    onFail:
      "A non-200 homepage response. The access verdict itself is reported by robots-ai-allowed or robots-ai-blocked, which account for what the refusal was aimed at.",
  },
  {
    id: "home-noindex",
    dimension: "ai-crawler-access",
    points: 2,
    rule: "The homepage has no meta robots directive containing noindex.",
    note: "The directive is read out of the served HTML and nowhere else, and the pattern expects the name attribute to come before the content attribute: `<meta name=\"robots\" content=\"noindex\">` fails this check while `<meta content=\"noindex\" name=\"robots\">` passes it. An X-Robots-Tag: noindex response header is not read at all, because response headers are not part of the document this check is given.",
  },
  {
    id: "sitemap-valid",
    dimension: "ai-crawler-access",
    points: 3,
    rule: "/sitemap.xml returns a body containing <urlset> or <sitemapindex>.",
    onFail: "No sitemap, or a response that is not valid sitemap markup.",
    note: "The body only has to contain `<urlset` or `<sitemapindex` somewhere. The addresses inside are not read, not counted against the 50,000-entry limit and not fetched, so a sitemap listing pages that return 404 passes. A response that arrives but is not sitemap markup is a partial pass worth 1 of the 3 points.",
  },
  {
    id: "content-signal",
    dimension: "ai-crawler-access",
    points: 1,
    rule: "robots.txt contains a Content-Signal directive with a value on the same line, for example `Content-Signal: search=yes, ai-input=yes, ai-train=no`. The directive is matched case-insensitively at the start of any line.",
    onFail: "No Content-Signal directive in robots.txt.",
    note: "Weighted 1 of the 16 points in this dimension because adoption is early: the directive was proposed in 2025, and this scanner reads it as a stated position rather than as a signal any engine has committed to. It is scored because the convention is cheap to follow and a tool that recommends it should be able to show its own line, not because it moves a ranking.",
  },

  /* ---- Machine Readability ---- */
  {
    id: "jsonld-valid",
    dimension: "machine-readability",
    points: 5,
    rule: 'At least one <script type="application/ld+json"> block parses as JSON and declares at least one @-keyword (@context, @type, @graph or @id). A block containing only {} parses but declares nothing, so it does not count.',
    note: "The first twenty JSON-LD blocks in the document are the ones examined, so a page that emits a block per component is read only as far as its twentieth. A block that fails to parse does not stop the ones after it from being read, because each is parsed on its own.",
  },
  {
    id: "jsonld-entity",
    dimension: "machine-readability",
    points: 4,
    rule: "Parsed JSON-LD contains an @type of Organization, WebSite, Person or LocalBusiness.",
    note: "Types are collected from every node in every block that parsed, nested ones included, so a Person node inside an Article's author property satisfies this check on its own: a page can pass it without declaring an Organization anywhere. The evidence line names the types that matched, so the finding says what it saw rather than asserting that a brand entity exists.",
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
    note: "The count runs over everything left after tags are removed, so navigation, the footer, a cookie notice and repeated boilerplate are all included: a page can reach 800 words on chrome and very little content. That is the limit of a count which measures how much text a crawler receives rather than how much of it answers a question.",
  },
  {
    id: "sections",
    dimension: "content-depth",
    points: 3,
    rule: "The page contains at least 4 H2 elements. 2-3 is a partial pass.",
    note: "The heading text is never read, only the element and its level, so four H2s that all say \"Overview\" are four sections to this check. Nothing asks whether the sections divide the content along anything a reader would recognise.",
  },
  {
    id: "extractables",
    dimension: "content-depth",
    points: 3,
    rule: "The page contains both a <ul>/<ol> and a <table>. Having only one is a partial pass. Script and style bodies are excluded first, so markup that only appears inside a string does not count.",
    note: "Any list and any table in the response count, including the navigation menu and a table used for layout: the check asks whether the page uses the two structures a parser can lift, not whether the content is inside them.",
  },

  /* ---- Citability & Evidence ---- */
  {
    id: "statistics",
    dimension: "citability",
    points: 4,
    rule: "Body text contains at least 5 numeric claims: percentages, currency amounts, multipliers of the form 3.2x, thousands-separated figures, or raw numbers of five digits or more. A bare four-digit number is not counted, because it is a year far more often than it is a finding.",
    note: "Counting bare three-digit numbers used to make any page with a copyright line or a product ID look quantified, which is the opposite of what the check is for. The count runs over the whole response, chrome included, and each match counts separately, so five percentages satisfy it as readily as five different kinds of figure. One to four numeric claims is a partial pass worth 2 of the 4 points.",
  },
  {
    id: "quotations",
    dimension: "citability",
    points: 3,
    rule: "The page contains at least one <blockquote> element.",
    note: "The element's presence is the whole test. Nothing reads the text inside it and nothing checks that it is attributed to anybody, so a pull-quote of the page's own sentence passes. Telling a citation from a styled paragraph needs a judgement this scanner does not make.",
  },
  {
    id: "authority-citations",
    dimension: "citability",
    points: 3,
    rule: "The page links to at least 2 external hosts on the authority list: arxiv.org, doi.org, nature.com, science.org, acm.org, ieee.org, springer.com, sciencedirect.com, any .gov or .edu host, wikipedia.org, github.com, developer.mozilla.org, web.dev, nih.gov, who.int or europa.eu. Own-domain links are excluded.",
    note: "The count is of links, not of distinct hosts, so three links to the same authority domain satisfy a rule that names two sources - the evidence line prints the distinct hosts, which is how a page can pass with only one domain on it. Nothing follows the links either: whether the cited page says what this page claims is not something a single fetch can establish. Exactly one authority link is a partial pass worth 2 of the 3 points.",
  },
  {
    id: "canonical",
    dimension: "citability",
    points: 1,
    rule: "The page declares a rel=canonical link.",
    note: "The declaration is read and the address in it is not. Nothing compares the canonical with the URL that was fetched and nothing follows it, so a page pointing its canonical at a different page, or at one that returns 404, passes. Confirming the target would be a second request, which a single-URL scan does not make.",
  },

  /* ---- Answer Readiness ---- */
  {
    id: "qa-headings",
    dimension: "answer-readiness",
    points: 4,
    rule: "At least 3 H2 or H3 headings either end with a question mark or begin with how, what, why, which, when, who, where, is, are, do, does, can, should or will.",
    note: "A heading qualifies by ending in a question mark or by starting with one of those fourteen words, so \"What we do\" counts as a question-shaped heading and \"Our approach\" does not, whatever either one actually answers. One or two qualifying headings is a partial pass worth 2 of the 4 points.",
  },
  {
    id: "faq",
    dimension: "answer-readiness",
    points: 3,
    rule: "Parsed JSON-LD contains a FAQPage node. If instead the page uses <details>/<summary> markup without the schema, that is a partial pass.",
    onFail:
      "No FAQPage schema. Note that this check reads structured data, not the word \"faq\" or \"question\" appearing anywhere in the HTML.",
    note: "The node only has to be present. A FAQPage whose mainEntity list is empty, or whose questions appear nowhere in the visible text, satisfies this check, because comparing the markup against the page is a judgement the scanner does not make.",
  },
  {
    id: "answer-first",
    dimension: "answer-readiness",
    points: 3,
    rule: "Of the first 30 heading-then-paragraph pairs (H2/H3 optionally followed by wrapper elements then a <p>), at least 60% have an opening paragraph of 80 words or fewer.",
    note: "Only the first thirty pairs and the first 200 KB of the document are examined, because this is the most expensive pattern the scanner runs. A pair counts when an H2 or H3 is followed by wrapper elements and then a paragraph, so a heading followed by a list contributes nothing. Fewer than three pairs fails the check; three or more pairs with under 60% short openers is a partial pass worth 1 of the 3 points.",
  },

  /* ---- Trust & Authority ---- */
  {
    id: "https",
    dimension: "trust-authority",
    points: 2,
    rule: "The homepage was retrieved over https://, rather than only over plain http://.",
    note: "The scheme reported is the one the request completed on. https is tried first and http only when the first attempt produced no response at all, so a site that answers over http is scored on that response rather than credited with a scheme it did not serve.",
  },
  {
    id: "about-contact",
    dimension: "trust-authority",
    points: 3,
    rule: "Hrefs on the page include both an about-style path (about, company, team, who-we-are) and a contact-style path (contact, support) or a mailto: link.",
    note: "The paths are matched as substrings, so /about-us, /company/team and /who-we-are all count as about-style, a mailto: anywhere in the document counts as contact, and a link to /support counts whether or not it reaches a person. Having only one of the two is a partial pass worth 1 of the 3 points.",
  },
  {
    id: "author",
    dimension: "trust-authority",
    points: 3,
    rule: "Authorship is signalled by any of: a Person node in parsed JSON-LD, an author property with a non-empty value in parsed JSON-LD, rel=\"author\", or a visible byline matching \"by Firstname Lastname\".",
    note: "Any one of the four signals is enough and none of them is verified: a byline-shaped string anywhere in the visible text, such as \"by Jane Doe\" in a caption or a comment, satisfies the check without any person existing behind it. That is the limit of judging authorship from a single page.",
  },
  {
    id: "sameas",
    dimension: "trust-authority",
    points: 2,
    rule: "Parsed JSON-LD contains a sameAs property with a non-empty value.",
    note: "The property has to be present with a value in parsed JSON-LD; the profiles in it are not fetched, so a sameAs list of accounts that no longer exist passes. It does not have to sit on an Organization node either - a sameAs anywhere in the parsed graph counts, because what it identifies is the entity the rest of the graph refers to.",
  },

  /* ---- Semantic Structure ---- */
  {
    id: "h1-single",
    dimension: "semantic-structure",
    points: 3,
    rule: "The page contains exactly one non-empty <h1>. Zero or several is a partial or failed result.",
    note: "Zero H1s fails the check outright and scores none of the 3 points; more than one is a partial pass worth 1 of the 3. Headings with no text are dropped before they are counted, so an empty `<h1></h1>` neither satisfies the check nor breaks it.",
  },
  {
    id: "landmarks",
    dimension: "semantic-structure",
    points: 3,
    rule: "At least 3 of main, article, section, header, nav and footer appear as elements.",
    note: "The test reads element names, not ARIA roles, so a page built from `<div role=\"main\">` and `<div role=\"navigation\">` scores nothing here however it reads to assistive technology. Fewer than three of the six is a partial pass worth 1 of the 3 points, and there is no failing outcome: this check can cost a page at most two of its three points.",
  },
  {
    id: "no-js-dependency",
    dimension: "semantic-structure",
    points: 2,
    rule: "The raw server response contains at least 100 words of visible text without executing JavaScript.",
    note: "The hundred words are counted across the entire response, so navigation, the footer and cookie text are part of the total. A page whose article is assembled by JavaScript can clear the threshold on its chrome alone: the check proves the response is not empty, not that the article is in it.",
  },

  /* ---- Metadata ---- */
  {
    id: "title",
    dimension: "metadata",
    points: 3,
    rule: "<title> is between 15 and 65 characters long.",
    note: "The length is measured in characters of the title element as the HTML contains it, with entities left undecoded, so an `&amp;` counts as five characters while rendering as one. A title that exists but falls outside 15-65 characters is a partial pass worth 1 of the 3 points; only a page with no title element at all scores none of them.",
  },
  {
    id: "description",
    dimension: "metadata",
    points: 2,
    rule: "The meta description is between 50 and 160 characters long.",
    note: "The measured length is the content attribute as written, so entities count in their source form and a description can be inside the range as a reader sees it and outside it as the scanner measures it. A description that exists but falls outside 50-160 characters is a partial pass worth 1 of the 2 points.",
  },
  {
    id: "opengraph",
    dimension: "metadata",
    points: 1,
    rule: "At least one meta property beginning with og: is present.",
    note: "One property from the family is enough, and which one it is does not matter: a page carrying only og:title passes as surely as one carrying og:title, og:description, og:image and og:url. The check answers whether the page speaks Open Graph at all, not whether its tags are complete.",
  },
  {
    id: "html-lang",
    dimension: "metadata",
    points: 1,
    rule: "The <html> element carries a lang attribute.",
    note: "The attribute's presence is tested, not whether its value is a language anyone speaks, so `lang=\"english\"`, `lang=\"EN\"` and `lang=\"zz\"` all pass. Reading the value for a region subtag is the separate lang-region check, which is why the two can disagree about the same attribute.",
  },

  /* ---- AI Context Files ---- */
  {
    id: "llms-txt",
    dimension: "llms-txt",
    points: 4,
    rule: "/llms.txt returns more than 20 bytes and contains an H1, a > summary line and at least 3 markdown links. Missing any of those is a partial pass.",
    note: "Four properties are examined: more than 20 bytes, an H1, a > summary line and at least three markdown links. What the file says is not judged, so three links to pages that do not exist pass the structure test.",
  },
  {
    id: "ai-context-robots",
    dimension: "llms-txt",
    points: 1,
    rule: "robots.txt is readable, so a crawler policy is published. Readable means a body with non-whitespace content: an HTTP 200 with an empty or whitespace-only body publishes no policy and fails this check, exactly as it fails robots-present.",
    note: "This is the same file the robots-present check reads, scored a second time in a different dimension: once because crawler access is what the policy governs, and once because a machine-readable context file is published. Adding robots.txt therefore moves two checks in two dimensions, and because that makes this the second score for one file, a site that serves an empty one can no longer collect this point for it.",
  },
  {
    id: "markdown-alternate",
    dimension: "llms-txt",
    points: 1,
    rule: 'The document head contains a <link> with rel="alternate" and type="text/markdown", in either attribute order.',
    onFail: "No markdown alternate is declared on the page.",
    note: "This reads the declaration only. The scanner fetches one URL, so it does not follow the alternate to confirm that it resolves, and a page can pass this check while pointing at a link that 404s. That limitation is stated here rather than hidden; closing it means a second request in the fetcher.",
  },

  /* ---- Freshness ---- */
  {
    id: "date-machine",
    dimension: "freshness",
    points: 3,
    rule: "A machine-readable date is found in dateModified, datePublished or article:modified_time. Within 12 months is a full pass; older is a partial pass. If only the HTTP Last-Modified header carries a date, that is a partial pass.",
    note: "The first date found in source order wins: dateModified is checked before datePublished, which is checked before article:modified_time. They are not compared with each other, so a fresh datePublished beside a stale dateModified is read as stale. A date within twelve months is worth the full 3 points, a recent Last-Modified header 2, and an old or unparseable date 1.",
  },
  {
    id: "copyright-year",
    dimension: "freshness",
    points: 2,
    rule: "The current calendar year appears in the visible body text.",
    note: "The current year is looked for anywhere in the visible text, including a site-wide footer that no individual page updates: a page whose own content is from 2024 passes on a footer reading © 2026. The year does not have to sit next to the word copyright, and it is taken from the scanner's clock rather than from anything the page declares.",
  },

  /* ---- International Readiness ---- */
  {
    id: "hreflang",
    dimension: "multilingual",
    points: 2,
    rule: "At least 2 distinct hreflang language codes are declared. Repeated attributes for the same language do not count, and x-default is a default marker rather than a language, so a single-language site declaring `en` plus `x-default` does not satisfy this.",
    note: "The codes are read from the attributes and the pages they point at are not fetched, so two hreflang tags naming language versions that were never built satisfy this check. It is a declaration check, and like the markdown alternate above it, it is one this scanner cannot close from a single fetch.",
  },
  {
    id: "lang-region",
    dimension: "multilingual",
    points: 1,
    rule: "A language tag carrying a region subtag appears in <html lang>, in og:locale or in an hreflang attribute - for example en-GB, en_GB or de-AT. A bare language such as \"en\" does not satisfy this; that is what html-lang checks.",
    note: "This check previously ran the identical <html lang> regex as html-lang, so one attribute earned points in two dimensions while the rule promised a region.",
  },

  /* ---- Delivery & Mobile ---- */
  {
    id: "viewport",
    dimension: "delivery",
    points: 1,
    rule: "A meta viewport tag is present.",
    note: "This reads the declaration, not the value. A viewport tag with `content=\"width=10000\"` passes exactly as `width=device-width, initial-scale=1` does, because deciding whether a viewport configuration is usable needs a rendering engine and this scanner deliberately does not run one.",
  },
  {
    id: "payload",
    dimension: "delivery",
    points: 1,
    rule: "The uncompressed HTML response is under 500 KB.",
    note: "This measures the uncompressed HTML document and nothing else: images, fonts, CSS and JavaScript are separate requests and are not counted, so a 400 KB page with three megabytes of images passes. It is also the coarsest band in the method - 499 KB scores the point and 501 KB scores none of it, with nothing in between.",
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
    title: "GEO: Generative Engine Optimization (KDD 2024)",
    url: "https://arxiv.org/abs/2311.09735",
    note: "The paper this site's citability weighting follows. Its abstract reports visibility gains of up to 40%, and its Table 1 measures the best of the tested methods against the no-optimization baseline: 41% on position-adjusted word count and 28% on subjective impression, with quotation, statistics and citation additions among the strongest.",
  },
  {
    title: "What Generative Search Engines Like and How to Optimize Web Content Cooperatively",
    url: "https://arxiv.org/abs/2510.11438",
    note: "Introduces AutoGEO, which extracts generative-engine preference rules and rewrites content for more traction.",
  },
  {
    title: "What Gets Cited: Competitive GEO in AI Answer Engines",
    url: "https://arxiv.org/abs/2605.25517",
    note: "A controlled two-document testbed, 252,000 trials across six models: topical relevance and list position were the biggest drivers of being cited first, with explicit price information and a recent timestamp helping consistently.",
  },
  {
    title: "llms.txt standard",
    url: "https://llmstxt.org/",
    note: "The convention itself. Cited so you can read the primary source rather than our summary of it.",
  },
];
