/**
 * GENERATED FILE - do not edit by hand.
 *
 * The title and fix wording for every check, read out of lib/geo/analyze.ts by
 * scripts/generate-check-copy.mts so that /checks/<id>/ can render them without a
 * second hand-maintained copy that would drift.
 *
 * Regenerate with:  node scripts/generate-check-copy.mts
 * The tests assert that this file covers every catalogued check, so adding a check
 * without regenerating fails the suite rather than shipping a blank page.
 *
 * 41 checks.
 */
export type CheckCopy = {
  title: string;
  /** One entry per branch that can produce a failure, in source order. */
  fixes: { when: string; text: string }[];
};

export const CHECK_COPY: Record<string, CheckCopy> = {
  "about-contact": {
    title: "About and contact paths are linked",
    fixes: [
      { when: "partial", text: "Models weigh who is responsible for a claim. Link both." },
      { when: "fail", text: "Link an about page and a contact route so the publisher is identifiable." },
    ],
  },
  "ai-context-robots": {
    title: "A crawler policy is published",
    fixes: [
      { when: "fail", text: "Publish robots.txt stating which crawlers are welcome." },
    ],
  },
  "answer-first": {
    title: "Headings are followed by a direct answer",
    fixes: [
      { when: "partial", text: "Put the answer in the first sentence under each heading; long openers are rarely extracted intact." },
      { when: "fail", text: "Structure sections as heading, then an immediate one-sentence answer, then detail." },
    ],
  },
  "author": {
    title: "Authorship is attributed",
    fixes: [
      { when: "fail", text: "Attribute content to a named person or organisation." },
    ],
  },
  "authority-citations": {
    title: "External authoritative sources are cited",
    fixes: [
      { when: "partial", text: "Citing several independent authoritative sources is strongly associated with being cited in turn." },
      { when: "fail", text: "Cite the primary sources behind your claims and link to them." },
    ],
  },
  "canonical": {
    title: "Canonical URL is declared",
    fixes: [
      { when: "fail", text: "Declare a canonical URL so duplicates do not split the signal." },
    ],
  },
  "content-signal": {
    title: "robots.txt states a content policy",
    fixes: [
      { when: "fail", text: "Add a line such as: Content-Signal: search=yes, ai-input=yes, ai-train=no. Early adoption and weighted low, but it states your position in the one file every crawler already reads." },
    ],
  },
  "copyright-year": {
    title: "A current year appears in the content",
    fixes: [
      { when: "fail", text: "Update the site so a current year is visible; stale date signals suppress generated-answer selection." },
    ],
  },
  "date-machine": {
    title: "A machine-readable date is present and recent",
    fixes: [
      { when: "partial", text: "Refresh date-sensitive pages and update the date when you do." },
      { when: "partial", text: "Use ISO 8601 dates (YYYY-MM-DD) in schema and meta tags." },
      { when: "partial", text: "Also declare dateModified in structured data; headers are not shown to readers." },
      { when: "partial", text: "Declare dateModified in structured data and keep it current." },
      { when: "fail", text: "Publish a machine-readable modification date." },
    ],
  },
  "description": {
    title: "Meta description length is in range",
    fixes: [
      { when: "partial", text: "Aim for 50-160 characters." },
      { when: "fail", text: "Write a description that states what the page answers." },
    ],
  },
  "extractables": {
    title: "Lists and tables are present",
    fixes: [
      { when: "partial", text: "Lists and tables are the formats engines extract most reliably. Add both where they fit." },
      { when: "fail", text: "Convert comparisons and steps into lists or tables." },
    ],
  },
  "faq": {
    title: "FAQPage schema is present",
    fixes: [
      { when: "partial", text: "Add FAQPage schema that matches the questions already visible on the page." },
      { when: "fail", text: "Add 5-10 question/answer pairs and mark them up as FAQPage." },
    ],
  },
  "h1-single": {
    title: "Exactly one H1",
    fixes: [
      { when: "fail", text: "Add a single H1 that states what the page is about." },
      { when: "partial", text: "Keep one H1 per page; demote the rest to H2." },
    ],
  },
  "home-200": {
    title: "Homepage returns HTTP 200",
    fixes: [
      { when: "fail", text: "Ensure the homepage returns 200 for crawler user-agents rather than a challenge or an error." },
    ],
  },
  "home-noindex": {
    title: "Homepage is marked noindex",
    fixes: [
      { when: "fail", text: "Remove noindex from the homepage so it can be retrieved." },
    ],
  },
  "hreflang": {
    title: "Alternate language versions are declared",
    fixes: [
      { when: "fail", text: "Declare hreflang for each language version you actually serve, so every version can be retrieved in its own market." },
    ],
  },
  "html-lang": {
    title: "Document language is declared",
    fixes: [
      { when: "fail", text: "Declare the language so the page can be retrieved in the right market." },
    ],
  },
  "https": {
    title: "Served over HTTPS",
    fixes: [
      { when: "fail", text: "Serve the site over HTTPS. Browsers mark plain HTTP as not secure, and crawlers increasingly decline to fetch it." },
    ],
  },
  "jsonld-content": {
    title: "Content-type schema is present",
    fixes: [
      { when: "fail", text: "Mark up the page type so engines know what the page is." },
    ],
  },
  "jsonld-entity": {
    title: "An entity node is declared",
    fixes: [
      { when: "fail", text: "Declare an Organization node with a stable @id and a sameAs list." },
    ],
  },
  "jsonld-valid": {
    title: "Valid JSON-LD is present",
    fixes: [
      { when: "fail", text: "Add a JSON-LD @graph with Organization and WebSite nodes." },
    ],
  },
  "landmarks": {
    title: "Semantic landmarks are used",
    fixes: [
      { when: "partial", text: "Use main, article, section, header, nav and footer so parsers can find section boundaries." },
    ],
  },
  "lang-region": {
    title: "A region-specific locale is declared",
    fixes: [
      { when: "fail", text: "Declare a region where it matters, for example lang=\"en-GB\", og:locale=\"en_GB\" or hreflang=\"de-AT\"." },
    ],
  },
  "llms-txt": {
    title: "/llms.txt is present and structured",
    fixes: [
      { when: "partial", text: "Follow the convention: one H1, a > summary line, then H2 sections of annotated links." },
      { when: "fail", text: "Optional, and weighted low here for that reason - but cheap to add. See the llms.txt guide." },
    ],
  },
  "markdown-alternate": {
    title: "A markdown alternate is declared",
    fixes: [
      { when: "fail", text: "Publish a markdown version of the page and point at it with <link rel=\"alternate\" type=\"text/markdown\" href=\"...\">, so an agent can fetch the content without the chrome around it." },
    ],
  },
  "no-js-dependency": {
    title: "Main content is in the HTML",
    fixes: [
      { when: "fail", text: "Crawlers do not execute JavaScript. Server-render the content you want cited." },
    ],
  },
  "opengraph": {
    title: "Open Graph tags are present",
    fixes: [
      { when: "fail", text: "Add Open Graph tags so shared links render properly." },
    ],
  },
  "payload": {
    title: "HTML payload is reasonable",
    fixes: [
      { when: "partial", text: "Trim the markup; parse budget is finite on both crawlers and devices." },
    ],
  },
  "qa-headings": {
    title: "Headings are phrased as real questions",
    fixes: [
      { when: "partial", text: "Rewrite headings as the question a customer would ask, keeping the keyword inside the sentence." },
      { when: "fail", text: "Engines retrieve spans that match a question. Label-style headings give them nothing to match." },
    ],
  },
  "quotations": {
    title: "Direct quotations are present",
    fixes: [
      { when: "fail", text: "Quoting a named expert is one of the highest-yield additions in the published research." },
    ],
  },
  "robots-ai-allowed": {
    title: "No AI crawler is blocked",
    fixes: [
      { when: "partial", text: "Check in your CDN or WAF whether identified AI crawlers are admitted, and from which networks. This scan cannot settle that from here." },
    ],
  },
  "robots-ai-blocked": {
    title: "AI crawlers are blocked in robots.txt",
    fixes: [
      { when: "fail", text: "Remove the Disallow rule for the crawlers behind the engines you want citations from." },
      { when: "fail", text: "Admit identified AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) from outside your network. A rule that refuses anything presenting as a bot refuses every one of them." },
    ],
  },
  "robots-present": {
    title: "robots.txt is served",
    fixes: [
      { when: "fail", text: "Publish robots.txt. With no robots.txt every crawler is permitted by default, so this is a policy gap rather than a block." },
    ],
  },
  "robots-sitemap": {
    title: "robots.txt declares a sitemap",
    fixes: [
      { when: "fail", text: "Add a Sitemap: line pointing at your sitemap.xml." },
      { when: "fail", text: "Publish robots.txt with a Sitemap: line pointing at your sitemap." },
    ],
  },
  "sameas": {
    title: "Entity is cross-referenced",
    fixes: [
      { when: "fail", text: "Add a sameAs list of profiles so the brand resolves to one entity." },
    ],
  },
  "sections": {
    title: "Content is divided into sections",
    fixes: [
      { when: "partial", text: "Split the content into question-shaped sections so each can be retrieved independently." },
      { when: "fail", text: "Add H2 sections that each answer one question." },
    ],
  },
  "sitemap-valid": {
    title: "sitemap.xml is present and well-formed",
    fixes: [
      { when: "partial", text: "Serve a standard sitemap at /sitemap.xml." },
      { when: "fail", text: "Publish a sitemap so crawlers can discover pages without guessing." },
    ],
  },
  "statistics": {
    title: "Quantified claims are present",
    fixes: [
      { when: "partial", text: "Add specific figures. Published GEO research reports the largest visibility gains from statistics and citations." },
      { when: "fail", text: "Add concrete numbers to your claims; unsupported assertions are rarely quoted." },
    ],
  },
  "title": {
    title: "Title length is in range",
    fixes: [
      { when: "partial", text: "Aim for 15-65 characters so the title is not truncated in results." },
      { when: "fail", text: "Add a descriptive title." },
    ],
  },
  "viewport": {
    title: "Viewport meta tag is present",
    fixes: [
      { when: "fail", text: "Add a viewport meta tag so the page renders on mobile." },
    ],
  },
  "word-count": {
    title: "Substantial body text",
    fixes: [
      { when: "partial", text: "Generative engines favour sources that cover a topic fully. Aim for 800+ words on pages you want cited." },
      { when: "fail", text: "Expand to at least 800 words of specific, non-repetitive content." },
    ],
  },
};
