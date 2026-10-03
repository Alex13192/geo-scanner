/**
 * LLMention scoring engine.
 *
 * Design rules, in priority order:
 *
 * 1. Every check is a rule that can be stated in one sentence and verified by
 *    looking at the page source. No vibes, no keyword grepping.
 * 2. Every check returns the evidence it saw, so the report can show WHY a
 *    score is what it is. A score without evidence is not trustworthy.
 * 3. No score floors. A site that does nothing scores near zero, because a
 *    floor destroys the only thing a score is for - telling sites apart.
 * 4. Dimensions are weighted, not averaged. Crawler access matters far more
 *    than a missing viewport tag.
 * 5. Dimensions and weights are published at /methodology, so the rules here
 *    must stay defensible enough to be read by the people being scored.
 *
 * Parsing is deliberately regex-and-string based rather than using a DOM
 * library: this runs in a Cloudflare Worker where CPU time is the scarcest
 * resource, and a full HTML parser is not worth the budget.
 */

/**
 * "na" exists because a check can be inapplicable rather than failed.
 *
 * WHY THIS IS NOT THE SCORE FLOOR THIS FILE REFUSES TO ADD: a floor lifts a page
 * that failed a check. This removes a check that was never a fair question for the
 * page in front of it, and renormalises the weights around what is left. A privacy
 * policy is not a worse page for containing no expert quotations - the question
 * does not apply, and scoring it as a failure punished an entire class of page for
 * being the kind of page it is.
 *
 * It is also why the default is "every check applies to every page". Nothing
 * changes unless a check is explicitly listed in NA_BY_PAGE_TYPE, so the change
 * that introduced this could not move any existing score.
 */
export type CheckStatus = "pass" | "warn" | "fail" | "na";

export type Check = {
  id: string;
  status: CheckStatus;
  /** Points this check is worth inside its dimension. */
  weight: number;
  /** Points actually earned (0 for a fail). */
  earned: number;
  title: string;
  /** What we actually observed. Shown to the user; never invented. */
  evidence: string;
  /** How to fix it. Present for warn/fail only. */
  fix?: string;
};

export type Dimension = {
  id: string;
  label: string;
  /** Share of the total score, in percent. Weights sum to 100. */
  weight: number;
  score: number;
  /** Sum of earned/possible across this dimension's applicable checks. */
  earned: number;
  possible: number;
  /**
   * The weight actually used in the total, which is 0 when every check in the
   * dimension turned out not to apply. The remaining weights are renormalised
   * against their sum, so the total still reads as a percentage of what could be
   * assessed rather than of a fixed 100.
   */
  applicableWeight: number;
  rationale: string;
};

export type Issue = {
  id: string;
  category: string;
  title: string;
  severity: "high" | "medium" | "low";
  summary: string;
  recommendation: string;
  evidence: string;
};

export type AnalyzeInput = {
  domain: string;
  /**
   * The scheme the homepage was actually retrieved over.
   *
   * This has to be passed in rather than assumed. The HTTPS check below used to
   * be an unconditional pass, so a site reachable only over plain HTTP was told
   * it was "served over HTTPS" and collected the points for saying so.
   */
  scheme: "https" | "http";
  homeStatus: number;
  /**
   * The status the same URL returned to a browser-shaped request, or null when
   * no such probe was made or it could not be completed.
   *
   * WHY THIS EXISTS: a non-200 homepage was scored as an access note while
   * robots.txt alone decided whether AI crawlers were blocked. That let a site
   * which refused an identified crawler outright still collect half marks on the
   * dimension that exists to measure exactly that - roofscasa.com scored 50/100
   * on AI Crawler Access while returning 403 to the crawler, because it happened
   * to have no robots.txt, so "nothing is disallowed" was read as a pass.
   *
   * The probe separates the two reasons a refusal happens: a rule aimed at
   * identified bots, which also catches GPTBot, ClaudeBot and PerplexityBot, from
   * our own address being blocked, which says nothing about the site. It is used
   * only for the access verdict, never to score page content.
   */
  browserStatus?: number | null;
  html: string;
  robotsText: string | null;
  llmsText: string | null;
  sitemapText: string | null;
  lastModifiedHeader: string | null;
  /**
   * The path the page was actually served from, used only to decide which checks
   * apply to this kind of page. See detectPageType below.
   *
   * Optional, and deliberately so: when it is absent every check applies, so any
   * caller that has not been updated - including the fixture tests - keeps the
   * behaviour it had before page types existed.
   */
  path?: string;
};

export type AnalyzeResult = {
  score: number;
  grade: string;
  gradeLabel: string;
  dimensions: Dimension[];
  /** Legacy six-key view so the existing report UI keeps working. */
  metrics: Record<string, number>;
  issues: Issue[];
  /** Every check that ran, including the ones that passed. */
  checks: { id: string; dimension: string; status: CheckStatus; weight: number; title: string }[];
  checksRun: number;
  checksPassed: number;
  /**
   * How many checks were excluded because they do not apply to this page type.
   * Reported rather than hidden, so "37 of 38" can be read correctly when three of
   * them were never questions in the first place.
   */
  checksNotApplicable: number;
  /** What kind of page this was judged to be, and so which rules were applied. */
  pageType: PageType;
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const pass = (id: string, weight: number, title: string, evidence: string): Check => ({
  id,
  status: "pass",
  weight,
  earned: weight,
  title,
  evidence,
});

const fail = (id: string, weight: number, title: string, evidence: string, fix: string): Check => ({
  id,
  status: "fail",
  weight,
  earned: 0,
  title,
  evidence,
  fix,
});

const partial = (
  id: string,
  weight: number,
  earned: number,
  title: string,
  evidence: string,
  fix: string
): Check => ({
  id,
  status: "warn",
  weight,
  earned: Math.max(0, Math.min(weight, earned)),
  title,
  evidence,
  fix,
});

/**
 * A check that does not apply to this kind of page.
 *
 * It keeps its weight on the Check record - that is what the check is worth when
 * it does apply - but earned stays 0 and the aggregation excludes it from both
 * earned and possible, so it can neither add nor subtract. The evidence string
 * says why, because "not scored" and "not checked" are different claims and the
 * report has to be able to tell them apart.
 */
const notApplicable = (id: string, weight: number, title: string, why: string): Check => ({
  id,
  status: "na",
  weight,
  earned: 0,
  title,
  evidence: why,
});

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  const m = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return m ? m.length : 0;
}

function getTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function getMetaContent(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["']${name}["'][^>]*>`,
    "i"
  );
  const tag = html.match(re);
  if (!tag) return "";
  const content = tag[0].match(/content\s*=\s*["']([\s\S]*?)["']/i);
  return content ? content[1].trim() : "";
}

function getHeadings(html: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[2]);
    if (text) out.push({ level: Number(m[1]), text });
    if (out.length > 400) break;
  }
  return out;
}

/** A property only counts if it actually carries something. */
function isMeaningfulValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length > 0;
  return true;
}

function getJsonLdTypes(html: string): {
  types: string[];
  valid: number;
  invalid: number;
  /** Property names found inside blocks that actually parsed. */
  keys: string[];
} {
  const blocks = html.match(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  const types: string[] = [];
  const keys: string[] = [];
  let valid = 0;
  let invalid = 0;
  if (!blocks) return { types, valid, invalid, keys };

  for (const block of blocks.slice(0, 20)) {
    const inner = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      const parsed: unknown = JSON.parse(inner.trim());

      // An empty object parses, and used to be counted as valid JSON-LD, which
      // handed out the full 5 points for markup that declares nothing at all.
      const objectKeys = Array.isArray(parsed)
        ? []
        : parsed !== null && typeof parsed === "object"
          ? Object.keys(parsed as Record<string, unknown>)
          : [];
      const meaningful = Array.isArray(parsed)
        ? parsed.length > 0
        : objectKeys.some((k) => k.startsWith("@"));
      if (!meaningful) {
        invalid += 1;
        continue;
      }

      valid += 1;
      const visit = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          node.forEach(visit);
          return;
        }
        const obj = node as Record<string, unknown>;
        const t = obj["@type"];
        if (typeof t === "string") types.push(t);
        else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.push(x));

        // Record property names with values, so authorship and sameAs are
        // judged on parsed structured data rather than on a substring match
        // anywhere in the raw HTML.
        for (const [k, v] of Object.entries(obj)) {
          if (k.startsWith("@")) {
            visit(v);
            continue;
          }
          if (isMeaningfulValue(v)) keys.push(k);
          visit(v);
        }
      };
      visit(parsed);
    } catch {
      invalid += 1;
    }
  }
  return { types: [...new Set(types)], valid, invalid, keys: [...new Set(keys)] };
}

function getHrefs(html: string): string[] {
  const out: string[] = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1]);
    if (out.length > 2000) break;
  }
  return out;
}

function isQuestionHeading(text: string): boolean {
  const t = text.trim();
  if (t.endsWith("?")) return true;
  return /^(how|what|why|which|when|who|where|is|are|do|does|can|should|will)\b/i.test(t);
}

/**
 * Counts numeric claims: percentages, money, multipliers, thousands-separated
 * figures, and raw numbers of five digits or more.
 *
 * The bare `\b\d{3,}\b` alternative is deliberately gone. It counted years,
 * product IDs, phone fragments and copyright lines as evidence, so any page
 * with a footer could claim "quantified claims are present" - which is the
 * opposite of what the check is for.
 */
function countStatistics(text: string): number {
  const re =
    /(\d+(?:[.,]\d+)?\s?%|\$\s?\d[\d,.]*|£\s?\d[\d,.]*|€\s?\d[\d,.]*|\d+(?:\.\d+)?\s?x\b|\b\d{1,3}(?:[.,]\d{3})+\b|\b\d{5,}\b)/gi;
  const found = text.match(re);
  return found ? found.length : 0;
}

const AUTHORITY_HOSTS = [
  "arxiv.org",
  "doi.org",
  "nature.com",
  "science.org",
  "acm.org",
  "ieee.org",
  "springer.com",
  "sciencedirect.com",
  "nih.gov",
  "who.int",
  "europa.eu",
  ".gov",
  ".edu",
  "wikipedia.org",
  "github.com",
  "developer.mozilla.org",
  "web.dev",
];

function countAuthorityLinks(html: string, domain: string): { count: number; samples: string[] } {
  const hosts: string[] = [];
  for (const href of getHrefs(html)) {
    if (!/^https?:\/\//i.test(href)) continue;
    let host = "";
    try {
      host = new URL(href).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      continue;
    }
    if (host === domain.toLowerCase() || host.endsWith("." + domain.toLowerCase())) continue;
    if (AUTHORITY_HOSTS.some((a) => host === a || host.endsWith(a))) hosts.push(host);
  }
  const unique = [...new Set(hosts)];
  return { count: hosts.length, samples: unique.slice(0, 3) };
}

/* ------------------------------------------------------------------ */
/* Dimensions                                                          */
/* ------------------------------------------------------------------ */

type ParsedRobots = { blocked: string[]; sitemaps: string[]; raw: string };

/**
 * Parse robots.txt into groups and report which of the tracked agents are
 * blocked from the site root. An exact agent match beats the wildcard group,
 * and the last matching rule wins - the parts of the spec crawlers implement.
 */
export function parseRobots(text: string): ParsedRobots {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  const sitemaps: string[] = [];
  let current: { agents: string[]; rules: { allow: boolean; path: string }[] } | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const field = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      if (current) current.rules.push({ allow: field === "allow", path: value });
      lastWasAgent = false;
    } else {
      if (field === "sitemap" && value) sitemaps.push(value);
      lastWasAgent = false;
    }
  }

  const blocked: string[] = [];

  /**
   * Does a robots pattern disallow the site root?
   *
   * The previous version compared the pattern to "/" or "" exactly, and got
   * both directions wrong. `Disallow:` with an empty value is the standard
   * "allow everything" idiom and was read as a block, so a site that blocks
   * nothing was told it blocks AI crawlers. `Disallow: /*` - one of the most
   * common full blocks there is - matched neither form and was missed, so a
   * site that blocks everything was reported clean. A checker that accuses the
   * innocent and clears the guilty is worse than no checker.
   */
  function blocksRoot(pattern: string): boolean {
    const p = pattern.trim();
    // An empty value matches nothing; it is how a site says "allow everything".
    if (p === "") return false;
    const escaped = p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    try {
      return new RegExp(`^${escaped}`).test("/");
    } catch {
      return false;
    }
  }

  for (const agent of ["gptbot", "claudebot", "perplexitybot", "oai-searchbot", "google-extended"]) {
    const exact = groups.filter((g) => g.agents.includes(agent));
    const chosen = exact.length ? exact : groups.filter((g) => g.agents.includes("*"));

    // Longest matching pattern wins, and Allow wins ties. That is the
    // precedence the published rule states, so the parser implements it rather
    // than only honouring rules written as exactly "/".
    let isBlocked = false;
    let best = -1;
    for (const g of chosen) {
      for (const r of g.rules) {
        if (!blocksRoot(r.path)) continue;
        const len = r.path.trim().length;
        if (len > best || (len === best && r.allow)) {
          best = len;
          isBlocked = !r.allow;
        }
      }
    }
    if (isBlocked) blocked.push(agent);
  }
  return { blocked, sitemaps, raw: text };
}

/* ------------------------------------------------------------------ */
/* Page types                                                          */
/* ------------------------------------------------------------------ */

/**
 * What kind of page is being scored.
 *
 * WHY THIS EXISTS: the scanner used to apply every check to whatever it was given,
 * which was defensible only because it only ever scored homepages. The moment a
 * caller passes a path - and the API now does - that assumption breaks in a
 * specific and unfair way: a privacy policy has no expert quotations and no
 * Organization node of its own, and it is not a worse page for it. Treating an
 * inapplicable check as a failure taught the score to punish a whole class of page
 * for being the kind of page it is. Both products in this category handle this;
 * the first version of this scanner did not, and the failure it printed looked
 * like a real finding.
 */
export type PageType = "homepage" | "docs" | "article" | "legal" | "contact" | "general";

/**
 * Checks that do not apply to a page type, keyed by check id.
 *
 * THIS IS THE SINGLE SOURCE. It is exported so /methodology can render the
 * exclusions from the same object the analyser applies, which is the only way the
 * published rule and the executed rule can be guaranteed to agree - the same
 * reason the check catalogue drives that page rather than a hand-written list.
 *
 * scripts/test-analyze.mts asserts that every key here is a real check id and
 * every value a real page type. Without that guard a typo would be a silent
 * no-op: the check would simply keep applying and nothing would report it.
 *
 * Every check not listed here applies to every page, which is why adding page
 * types could not move any existing score.
 */
export const NA_BY_PAGE_TYPE: Record<string, PageType[]> = {
  /*
   * `legal` and `contact` are grouped because the reason is the same: both are
   * utility pages that state something rather than argue for it. An evidence check
   * asks such a page to support a case it was never making, and a length target
   * applies to content, not to a licence or a phone number.
   */
  quotations: ["legal", "contact"],
  statistics: ["legal", "contact"],
  "authority-citations": ["legal", "contact"],
  "word-count": ["legal", "contact"],
  // A policy page is a reference, not an answer surface. A contact page usually is
  // one, which is why `faq` stays applicable there - see /contact/.
  faq: ["legal"],
  // An article body does not carry the site's About or Contact chrome; that lives
  // in the layout around it, which a single-page fetch never sees.
  "about-contact": ["article"],
};

/** Where each type is decided from. Paths first, markup second. */
/**
 * The term has to be followed by a separator or the end of the path, never by
 * another letter - otherwise `legal` would match `/legals` and `refund` would
 * match `/refunds`. The separators are `-`, `_`, `.` and `/`, because real sites
 * write all four: /terms-of-service, /terms_of_service, /terms.html, /terms/.
 * The first version of this omitted `-` and classified /terms-of-service as a
 * general page, which the probe list in scripts/test-analyze.mts caught.
 */
const LEGAL_PATH =
  /\/(privacy|terms|tos|legal|imprint|impressum|withdrawal|widerruf|refund|cookies|gdpr|dpa|subprocessors|disclaimer)([-_./]|$)/i;
const DOCS_PATH = /(^|\/)(docs?|documentation|guide|guides|reference|manual|handbook)([-_./]|$)/i;
const CONTACT_PATH = /(^|\/)(contact|contact-us|support|help|get-in-touch)([-_./]|$)/i;
const ARTICLE_JSONLD =
  /"@type"\s*:\s*"(BlogPosting|NewsArticle|Article|TechArticle|ScholarlyArticle)"/i;

/**
 * Classify a page from its path, falling back to what its structured data claims.
 *
 * The path comes first because it is what the site itself decided to call the
 * page; the markup second, because a CMS emitting BlogPosting is telling us
 * something the URL may not. Deliberately no content heuristics - guessing "this
 * reads like an article" would make the score depend on a judgement the reader
 * cannot check, and the entire reason the rules are published is that they can be.
 *
 * An absent path means "homepage", and no check is excluded from a homepage, so a
 * caller that passes no path gets exactly the behaviour it had before.
 */
export function detectPageType(path: string | undefined, html: string): PageType {
  const clean = (path || "").split("?")[0].split("#")[0];
  if (clean === "" || clean === "/") return "homepage";
  if (LEGAL_PATH.test(clean)) return "legal";
  if (CONTACT_PATH.test(clean)) return "contact";
  if (DOCS_PATH.test(clean)) return "docs";
  if (ARTICLE_JSONLD.test(html)) return "article";
  return "general";
}

const DIMENSIONS = [
  {
    id: "ai-crawler-access",
    label: "AI Crawler Access",
    weight: 16,
    rationale:
      "If the crawler cannot read the page, nothing else on this list can matter. Weighted highest for that reason.",
  },
  {
    id: "machine-readability",
    label: "Machine Readability",
    weight: 12,
    rationale:
      "JSON-LD is how a model binds your brand name, domain and product into one entity instead of guessing.",
  },
  {
    id: "content-depth",
    label: "Content Depth",
    weight: 11,
    rationale:
      "Generative engines select sources that answer a question thoroughly. Thin pages are rarely retrievable.",
  },
  {
    id: "citability",
    label: "Citability & Evidence",
    weight: 11,
    rationale:
      "Statistics, quotations and cited sources are the highest-leverage additions in the published GEO research.",
  },
  {
    id: "answer-readiness",
    label: "Answer Readiness",
    weight: 10,
    rationale:
      "Answers are extracted as spans. Question-shaped headings with an immediate answer are the easiest to lift.",
  },
  {
    id: "trust-authority",
    label: "Trust & Authority",
    weight: 10,
    rationale:
      "E-E-A-T signals decide whether a model treats a claim as safe to repeat.",
  },
  {
    id: "semantic-structure",
    label: "Semantic Structure",
    weight: 8,
    rationale:
      "Heading hierarchy and landmark elements are how a parser finds section boundaries at all.",
  },
  {
    id: "metadata",
    label: "Metadata & Discoverability",
    weight: 7,
    rationale:
      "Title, description and canonical control what a search or answer surface shows about the page.",
  },
  {
    id: "llms-txt",
    label: "AI Context Files",
    weight: 5,
    rationale:
      "A cheap, optional signal. Deliberately weighted low because the evidence for it is weak.",
  },
  {
    id: "freshness",
    label: "Freshness",
    weight: 5,
    rationale:
      "Dated content is deprioritised in generated answers, and an unlabelled page has no date at all.",
  },
  {
    id: "multilingual",
    label: "International Readiness",
    weight: 3,
    rationale:
      "Language and region markup decides which language market a page can be retrieved in.",
  },
  {
    id: "delivery",
    label: "Delivery & Mobile",
    weight: 2,
    rationale:
      "A slow or non-mobile-readable page is dropped before any content analysis happens.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Analyser                                                            */
/* ------------------------------------------------------------------ */

export function analyze(input: AnalyzeInput): AnalyzeResult {
  const { html, domain } = input;
  const text = stripTags(html);
  const words = countWords(text);
  const headings = getHeadings(html);
  const h1s = headings.filter((h) => h.level === 1);
  const h2s = headings.filter((h) => h.level === 2);
  const jsonLd = getJsonLdTypes(html);
  const robotsText =
    input.robotsText && input.robotsText.trim().length > 0 ? input.robotsText : null;
  // A 200 response with an empty body publishes no policy at all, so it is
  // treated as no robots.txt. It used to pass both "robots.txt is served" and
  // "a crawler policy is published" while containing nothing.
  const robots = robotsText ? parseRobots(robotsText) : null;
  const authority = countAuthorityLinks(html, domain);
  const statistics = countStatistics(text);

  const checks: Record<string, Check[]> = {};

  /* ---- AI Crawler Access (16) ---- */
  {
    const c: Check[] = [];

    /**
     * Whether AI crawlers are actually admitted, which robots.txt alone cannot
     * answer. The verdict combines the policy file with what the server did.
     */
    const crawlerAccessVerdict = (): Check => {
      const blockedInRobots = robots !== null && robots.blocked.length > 0;

      /**
       * A published disallow is decisive on its own, and has to be checked before
       * anything about the homepage response. It is knowable whether or not the page
       * was served, and it is the mechanism a crawler will actually obey.
       *
       * This ordering is a fix, not a preference. When the robots branch sat inside
       * the homepage-served branch, a site that disallowed AI agents AND refused our
       * request came out as merely "could not be verified" - losing the one fact
       * about it that was certain. nytimes.com and reuters.com both hit that: their
       * robots.txt disallows AI agents, and being refused made it vanish.
       */
      if (blockedInRobots) {
        return fail(
          "robots-ai-blocked",
          6,
          "AI crawlers are blocked in robots.txt",
          `Disallowed at the site root for: ${robots!.blocked.join(", ")}.${
            input.homeStatus === 200
              ? ""
              : ` The homepage also returned HTTP ${input.homeStatus} to a crawler-shaped request.`
          }`,
          "Remove the Disallow rule for the crawlers behind the engines you want citations from."
        );
      }

      if (input.homeStatus === 200) {
        return pass(
          "robots-ai-allowed",
          6,
          "No AI crawler is blocked",
          robots
            ? "gptbot, claudebot, perplexitybot, oai-searchbot and google-extended are all permitted at the site root."
            : "No robots.txt is served, so nothing disallows gptbot, claudebot, perplexitybot, oai-searchbot or google-extended."
        );
      }

      // The homepage refused our request. If a browser-shaped request to the same
      // URL was served normally, the rule is aimed at identified crawlers - which
      // is exactly what the engines that do the citing send.
      if (input.browserStatus === 200) {
        return fail(
          "robots-ai-blocked",
          6,
          "The server refuses identified crawlers",
          `A crawler-shaped request received HTTP ${input.homeStatus}, while the same URL served a browser-shaped request with HTTP 200. ${
            blockedInRobots
              ? `robots.txt also disallows: ${robots!.blocked.join(", ")}.`
              : "robots.txt does not disallow them, so the refusal happens before robots.txt is read."
          }`,
          "Admit identified AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) from outside your network. A rule that refuses anything presenting as a bot refuses every one of them."
        );
      }

      // Both request shapes were refused, so the refusal is about the address the
      // scan came from rather than about crawler policy. That is not the site's
      // fault and is not scored as one, but it cannot be scored as a pass either.
      const probeNote =
        input.browserStatus == null
          ? "No browser-shaped request could be completed for comparison."
          : `A browser-shaped request was refused as well (HTTP ${input.browserStatus}).`;
      return partial(
        "robots-ai-allowed",
        6,
        2,
        "Crawler access could not be verified",
        `The homepage returned HTTP ${input.homeStatus} to a crawler-shaped request. ${probeNote} The refusal therefore points at the scanning address rather than at your configuration, so this check is scored partially rather than passed or failed.`,
        "Check in your CDN or WAF whether identified AI crawlers are admitted, and from which networks. This scan cannot settle that from here."
      );
    };

    if (robots) {
      c.push(pass("robots-present", 2, "robots.txt is served", `Fetched ${robotsText!.length} bytes.`));
      c.push(crawlerAccessVerdict());
      if (robots.sitemaps.length > 0) {
        c.push(pass("robots-sitemap", 1, "robots.txt declares a sitemap", robots.sitemaps[0]));
      } else {
        c.push(fail("robots-sitemap", 1, "robots.txt declares no sitemap", "No Sitemap: line found.", "Add a Sitemap: line pointing at your sitemap.xml."));
      }
    } else {
      // Absence of robots.txt is a policy gap, NOT a block: with no file, no
      // crawler is disallowed by it. The previous version collapsed this branch
      // into a single 9-point failure, which both punished a site whose AI
      // crawlers are in fact unblocked and made the number of checks vary
      // between scans. Emitting the same checks in both branches keeps the count
      // stable and the reading honest - but only when the page was actually
      // served, which is why the verdict below is no longer decided here.
      c.push(
        fail(
          "robots-present",
          2,
          "robots.txt is not served",
          "The request for /robots.txt did not return a readable response.",
          "Publish robots.txt. With no robots.txt every crawler is permitted by default, so this is a policy gap rather than a block."
        )
      );
      c.push(crawlerAccessVerdict());
      c.push(
        fail(
          "robots-sitemap",
          1,
          "No sitemap declared in robots.txt",
          "robots.txt is unavailable, so it cannot declare a sitemap.",
          "Publish robots.txt with a Sitemap: line pointing at your sitemap."
        )
      );
    }

    if (input.homeStatus === 200) {
      c.push(pass("home-200", 2, "Homepage returns HTTP 200", "A crawler-shaped request received 200."));
    } else {
      c.push(
        fail("home-200", 2, "Homepage does not return HTTP 200", `A crawler-shaped request received HTTP ${input.homeStatus}.`, "Ensure the homepage returns 200 for crawler user-agents rather than a challenge or an error.")
      );
    }

    const noindex = /<meta[^>]+name\s*=\s*["']robots["'][^>]*content\s*=\s*["'][^"']*noindex/i.test(html);
    if (noindex) {
      c.push(fail("home-noindex", 2, "Homepage is marked noindex", "meta robots contains noindex.", "Remove noindex from the homepage so it can be retrieved."));
    } else {
      c.push(pass("home-noindex", 2, "Homepage is indexable", "No noindex directive in meta robots."));
    }

    if (input.sitemapText && /<urlset|<sitemapindex/i.test(input.sitemapText)) {
      c.push(pass("sitemap-valid", 3, "sitemap.xml is present and well-formed", "Response contains <urlset> or <sitemapindex>."));
    } else if (input.sitemapText) {
      c.push(partial("sitemap-valid", 3, 1, "sitemap.xml is not valid XML sitemap markup", "A response was returned but it contains neither <urlset> nor <sitemapindex>.", "Serve a standard sitemap at /sitemap.xml."));
    } else {
      c.push(fail("sitemap-valid", 3, "sitemap.xml not found", "The request for /sitemap.xml returned nothing usable.", "Publish a sitemap so crawlers can discover pages without guessing."));
    }
    /*
     * Content-Signal is a 2025 proposal for stating content policy inside robots.txt,
     * so a crawler reads permissions and preferences from the file it already
     * fetches. Adoption is early and no major engine has committed to honouring it,
     * which is exactly why it is worth 1 point out of 16 in this dimension rather
     * than being sold as a ranking factor. Scoring it at all is the honest position:
     * it is cheap, it is where the convention is heading, and a tool that recommends
     * it should be able to show its own line.
     */
    const contentSignal = (input.robotsText || "").match(
      /^\s*content-signal\s*:\s*(\S[^\r\n]*)/im
    );
    c.push(
      contentSignal
        ? pass("content-signal", 1, "robots.txt states a content policy", `Content-Signal: ${contentSignal[1].trim()}`)
        : fail(
            "content-signal",
            1,
            "No content policy in robots.txt",
            "robots.txt has no Content-Signal directive.",
            "Add a line such as: Content-Signal: search=yes, ai-input=yes, ai-train=no. Early adoption and weighted low, but it states your position in the one file every crawler already reads."
          )
    );

    checks["ai-crawler-access"] = c;
  }

  /* ---- Machine Readability (12) ---- */
  {
    const c: Check[] = [];
    if (jsonLd.valid > 0) {
      c.push(pass("jsonld-valid", 5, "Valid JSON-LD is present", `${jsonLd.valid} valid block(s), ${jsonLd.invalid} invalid.`));
    } else {
      c.push(
        fail("jsonld-valid", 5, "No valid JSON-LD found", jsonLd.invalid > 0 ? `${jsonLd.invalid} JSON-LD block(s) present but none parsed.` : "No application/ld+json script found.", "Add a JSON-LD @graph with Organization and WebSite nodes.")
      );
    }

    const entityTypes = ["Organization", "WebSite", "Person", "LocalBusiness"];
    const hasEntity = jsonLd.types.some((t) => entityTypes.includes(t));
    c.push(
      hasEntity
        ? pass("jsonld-entity", 4, "An entity node is declared", `Detected: ${jsonLd.types.filter((t) => entityTypes.includes(t)).join(", ")}.`)
        : fail("jsonld-entity", 4, "No Organization or WebSite node", jsonLd.types.length ? `Detected types: ${jsonLd.types.slice(0, 6).join(", ")}.` : "No schema types detected.", "Declare an Organization node with a stable @id and a sameAs list.")
    );

    const contentTypes = ["FAQPage", "Article", "BlogPosting", "HowTo", "Product", "SoftwareApplication", "BreadcrumbList"];
    const matched = jsonLd.types.filter((t) => contentTypes.includes(t));
    c.push(
      matched.length > 0
        ? pass("jsonld-content", 3, "Content-type schema is present", `Detected: ${matched.join(", ")}.`)
        : fail("jsonld-content", 3, "No content-type schema", "None of FAQPage, Article, HowTo, Product, SoftwareApplication or BreadcrumbList were found.", "Mark up the page type so engines know what the page is.")
    );
    checks["machine-readability"] = c;
  }

  /* ---- Content Depth (11) ---- */
  {
    const c: Check[] = [];
    if (words >= 800) c.push(pass("word-count", 5, "Substantial body text", `${words} words of visible text.`));
    else if (words >= 300) c.push(partial("word-count", 5, 3, "Moderate body text", `${words} words of visible text.`, "Generative engines favour sources that cover a topic fully. Aim for 800+ words on pages you want cited."));
    else c.push(fail("word-count", 5, "Thin body text", `Only ${words} words of visible text.`, "Expand to at least 800 words of specific, non-repetitive content."));

    const sections = h2s.length;
    if (sections >= 4) c.push(pass("sections", 3, "Content is divided into sections", `${sections} H2 sections.`));
    else if (sections >= 2) c.push(partial("sections", 3, 2, "Few sections", `${sections} H2 sections.`, "Split the content into question-shaped sections so each can be retrieved independently."));
    else c.push(fail("sections", 3, "Content is not sectioned", `${sections} H2 sections found.`, "Add H2 sections that each answer one question."));

    // Strip script and style bodies first. A JSON-LD string containing "<table"
    // satisfied the table test without a table existing anywhere on the page.
    const structural = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    const hasList = /<(ul|ol)\b/i.test(structural);
    const hasTable = /<table\b/i.test(structural);
    if (hasList && hasTable) c.push(pass("extractables", 3, "Lists and tables are present", "Both <ul>/<ol> and <table> markup found."));
    else if (hasList || hasTable) c.push(partial("extractables", 3, 2, "Only one extractable format", hasList ? "Lists found, no tables." : "Tables found, no lists.", "Lists and tables are the formats engines extract most reliably. Add both where they fit."));
    else c.push(fail("extractables", 3, "No lists or tables", "Neither list nor table markup found.", "Convert comparisons and steps into lists or tables."));
    checks["content-depth"] = c;
  }

  /* ---- Citability & Evidence (11) ---- */
  {
    const c: Check[] = [];
    if (statistics >= 5) c.push(pass("statistics", 4, "Quantified claims are present", `${statistics} numeric claims detected (percentages, currency, multipliers or large figures).`));
    else if (statistics >= 1) c.push(partial("statistics", 4, 2, "Few quantified claims", `${statistics} numeric claim(s) detected.`, "Add specific figures. Published GEO research reports the largest visibility gains from statistics and citations."));
    else c.push(fail("statistics", 4, "No quantified claims", "No percentages, currency amounts or multipliers found in the body text.", "Add concrete numbers to your claims; unsupported assertions are rarely quoted."));

    const quotes = (html.match(/<blockquote\b/gi) || []).length;
    if (quotes >= 1) c.push(pass("quotations", 3, "Direct quotations are present", `${quotes} <blockquote> element(s) found.`));
    else c.push(fail("quotations", 3, "No quotations", "No <blockquote> element found.", "Quoting a named expert is one of the highest-yield additions in the published research."));

    if (authority.count >= 2) c.push(pass("authority-citations", 3, "External authoritative sources are cited", `${authority.count} link(s) to research, government, academic or documentation domains, e.g. ${authority.samples.join(", ")}.`));
    else if (authority.count === 1) c.push(partial("authority-citations", 3, 2, "Only one authoritative citation", `Cited: ${authority.samples.join(", ")}.`, "Citing several independent authoritative sources is strongly associated with being cited in turn."));
    else c.push(fail("authority-citations", 3, "No authoritative external citations", "No links to academic, government or established documentation domains were found.", "Cite the primary sources behind your claims and link to them."));

    const canonical = /<link[^>]+rel\s*=\s*["']canonical["']/i.test(html);
    c.push(
      canonical
        ? pass("canonical", 1, "Canonical URL is declared", "A rel=canonical link is present.")
        : fail("canonical", 1, "No canonical URL", "No rel=canonical link found.", "Declare a canonical URL so duplicates do not split the signal.")
    );
    checks["citability"] = c;
  }

  /* ---- Answer Readiness (10) ---- */
  {
    const c: Check[] = [];
    const questionHeadings = headings.filter((h) => h.level >= 2 && h.level <= 3 && isQuestionHeading(h.text));
    const ratio = h2s.length ? questionHeadings.length / h2s.length : 0;
    if (questionHeadings.length >= 3) {
      c.push(pass("qa-headings", 4, "Headings are phrased as real questions", `${questionHeadings.length} question-shaped H2/H3 headings, e.g. "${questionHeadings[0].text.slice(0, 70)}".`));
    } else if (questionHeadings.length >= 1) {
      c.push(partial("qa-headings", 4, 2, "Few question-shaped headings", `${questionHeadings.length} found out of ${h2s.length} H2 sections.`, "Rewrite headings as the question a customer would ask, keeping the keyword inside the sentence."));
    } else {
      c.push(fail("qa-headings", 4, "No question-shaped headings", `None of the ${h2s.length} H2 headings read as a question.`, "Engines retrieve spans that match a question. Label-style headings give them nothing to match."));
    }

    const hasFaqSchema = jsonLd.types.includes("FAQPage");
    const faqMarkup = /<details\b|<summary\b/i.test(html);
    if (hasFaqSchema) {
      c.push(pass("faq", 3, "FAQPage schema is present", "A FAQPage node was parsed from JSON-LD."));
    } else if (faqMarkup) {
      c.push(partial("faq", 3, 2, "Q&A content without FAQPage schema", "<details>/<summary> markup found but no FAQPage node.", "Add FAQPage schema that matches the questions already visible on the page."));
    } else {
      c.push(fail("faq", 3, "No explicit question-and-answer block", "Neither FAQPage schema nor disclosure-based Q&A was found.", "Add 5-10 question/answer pairs and mark them up as FAQPage."));
    }

    // Does a paragraph follow each heading closely enough to be quotable?
    // Bounded slice: this is the most expensive regex we run and Workers bill
    // CPU time. The first 200 KB contains far more headings than we need.
    const headingRegion = html.slice(0, 200_000);
    const pairs =
      headingRegion.match(
        /<h[23][^>]*>[\s\S]*?<\/h[23]>\s*(?:<[^>]+>\s*)*<p[^>]*>([\s\S]*?)<\/p>/gi
      ) || [];
    let shortAnswers = 0;
    for (const pair of pairs.slice(0, 30)) {
      const p = pair.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (!p) continue;
      if (countWords(stripTags(p[1])) <= 80) shortAnswers += 1;
    }
    const answerRatio = pairs.length ? shortAnswers / Math.min(pairs.length, 30) : 0;
    if (pairs.length >= 3 && answerRatio >= 0.6) {
      c.push(pass("answer-first", 3, "Headings are followed by a direct answer", `${shortAnswers} of ${Math.min(pairs.length, 30)} heading/paragraph pairs open with a paragraph of 80 words or fewer.`));
    } else if (pairs.length >= 3) {
      c.push(partial("answer-first", 3, 1, "Headings are followed by long paragraphs", `${shortAnswers} of ${Math.min(pairs.length, 30)} pairs open with a short paragraph.`, "Put the answer in the first sentence under each heading; long openers are rarely extracted intact."));
    } else {
      c.push(fail("answer-first", 3, "No heading is followed by a paragraph", "Fewer than three heading/paragraph pairs were found.", "Structure sections as heading, then an immediate one-sentence answer, then detail."));
    }
    checks["answer-readiness"] = c;
  }

  /* ---- Trust & Authority (10) ---- */
  {
    const c: Check[] = [];
    // HTTPS is decided by the scheme the fetch layer actually used. This was an
    // unconditional pass, which meant the rule could not fail and a site served
    // only over http:// was congratulated for serving over https://.
    c.push(
      input.scheme === "https"
        ? pass("https", 2, "Served over HTTPS", "The homepage was retrieved over https://.")
        : fail(
            "https",
            2,
            "Only reachable over plain HTTP",
            "The homepage was retrieved over http://.",
            "Serve the site over HTTPS. Browsers mark plain HTTP as not secure, and crawlers increasingly decline to fetch it."
          )
    );

    const hrefs = getHrefs(html);
    const hasAbout = hrefs.some((h) => /(^|\/)(about|company|team|who-we-are)/i.test(h));
    const hasContact = hrefs.some((h) => /(^|\/)(contact|support)/i.test(h)) || /mailto:/i.test(html);
    if (hasAbout && hasContact) c.push(pass("about-contact", 3, "About and contact paths are linked", "Links to both an about-style and a contact-style page were found."));
    else if (hasAbout || hasContact) c.push(partial("about-contact", 3, 1, "Only one of About or Contact is linked", hasAbout ? "An about page is linked; no contact path found." : "A contact path is linked; no about page found.", "Models weigh who is responsible for a claim. Link both."));
    else c.push(fail("about-contact", 3, "No About or Contact path", "Neither an about-style nor a contact-style link was found.", "Link an about page and a contact route so the publisher is identifiable."));

    // Authorship is judged on parsed structured data, on an explicit rel=author,
    // or on a visible byline. It used to substring-match `"author":` anywhere in
    // the raw HTML, so `"author": ""` in an unrelated script earned the points.
    const hasAuthor =
      jsonLd.types.includes("Person") ||
      jsonLd.keys.includes("author") ||
      /rel\s*=\s*["']author["']/i.test(html) ||
      /\bby\s+[A-Z][a-z]+\s+[A-Z][a-z]+/m.test(text);
    c.push(
      hasAuthor
        ? pass("author", 3, "Authorship is attributed", "An author was found via schema, rel=author or a visible byline.")
        : fail("author", 3, "No authorship signal", "No Person node, author property, rel=author or visible byline found.", "Attribute content to a named person or organisation.")
    );

    const hasSameAs = jsonLd.keys.includes("sameAs");
    c.push(
      hasSameAs
        ? pass("sameas", 2, "Entity is cross-referenced", "A sameAs list is present in structured data.")
        : fail("sameas", 2, "Entity is not cross-referenced", "No sameAs list found in JSON-LD.", "Add a sameAs list of profiles so the brand resolves to one entity.")
    );
    checks["trust-authority"] = c;
  }

  /* ---- Semantic Structure (8) ---- */
  {
    const c: Check[] = [];
    if (h1s.length === 1) c.push(pass("h1-single", 3, "Exactly one H1", `H1: "${h1s[0].text.slice(0, 70)}".`));
    else if (h1s.length === 0) c.push(fail("h1-single", 3, "No H1 on the page", "No <h1> element found.", "Add a single H1 that states what the page is about."));
    else c.push(partial("h1-single", 3, 1, "Several H1 elements", `${h1s.length} H1 elements found.`, "Keep one H1 per page; demote the rest to H2."));

    const landmarks = ["main", "article", "section", "header", "nav", "footer"].filter((t) =>
      new RegExp(`<${t}\\b`, "i").test(html)
    );
    c.push(
      landmarks.length >= 3
        ? pass("landmarks", 3, "Semantic landmarks are used", `Found: ${landmarks.join(", ")}.`)
        : partial("landmarks", 3, 1, "Few semantic landmarks", `Found: ${landmarks.length ? landmarks.join(", ") : "none"}.`, "Use main, article, section, header, nav and footer so parsers can find section boundaries.")
    );

    const bodyOk = words >= 100;
    c.push(
      bodyOk
        ? pass("no-js-dependency", 2, "Main content is in the HTML", `${words} words are present in the server response without executing JavaScript.`)
        : fail("no-js-dependency", 2, "Main content is not in the HTML", `Only ${words} words in the raw response.`, "Crawlers do not execute JavaScript. Server-render the content you want cited.")
    );
    checks["semantic-structure"] = c;
  }

  /* ---- Metadata (7) ---- */
  {
    const c: Check[] = [];
    const title = getTitle(html);
    if (title.length >= 15 && title.length <= 65) c.push(pass("title", 3, "Title length is in range", `${title.length} characters: "${title.slice(0, 70)}".`));
    else if (title.length > 0) c.push(partial("title", 3, 1, "Title length is outside the useful range", `${title.length} characters: "${title.slice(0, 70)}".`, "Aim for 15-65 characters so the title is not truncated in results."));
    else c.push(fail("title", 3, "No title element", "No <title> found.", "Add a descriptive title."));

    const desc = getMetaContent(html, "description");
    if (desc.length >= 50 && desc.length <= 160) c.push(pass("description", 2, "Meta description length is in range", `${desc.length} characters.`));
    else if (desc.length > 0) c.push(partial("description", 2, 1, "Meta description length is outside the useful range", `${desc.length} characters.`, "Aim for 50-160 characters."));
    else c.push(fail("description", 2, "No meta description", "No meta description found.", "Write a description that states what the page answers."));

    const og = /<meta[^>]+property\s*=\s*["']og:/i.test(html);
    c.push(
      og
        ? pass("opengraph", 1, "Open Graph tags are present", "At least one og: property found.")
        : fail("opengraph", 1, "No Open Graph tags", "No og: properties found.", "Add Open Graph tags so shared links render properly.")
    );

    const lang = html.match(/<html[^>]+lang\s*=\s*["']([^"']+)["']/i);
    c.push(
      lang
        ? pass("html-lang", 1, "Document language is declared", `lang="${lang[1]}".`)
        : fail("html-lang", 1, "No document language", "No lang attribute on <html>.", "Declare the language so the page can be retrieved in the right market.")
    );
    checks["metadata"] = c;
  }

  /* ---- AI Context Files (5) ---- */
  {
    const c: Check[] = [];
    const raw = input.llmsText;
    if (raw && raw.trim().length > 20) {
      const hasHeading = /^#\s+/m.test(raw);
      const hasSummary = /^>\s+/m.test(raw);
      const links = (raw.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
      const structural = hasHeading && hasSummary && links >= 3;
      c.push(
        structural
          ? pass("llms-txt", 4, "/llms.txt is present and structured", `${raw.length} bytes, with a heading, a summary line and ${links} links.`)
          : partial("llms-txt", 4, 2, "/llms.txt is present but loosely structured", `${raw.length} bytes; heading: ${hasHeading ? "yes" : "no"}, summary blockquote: ${hasSummary ? "yes" : "no"}, links: ${links}.`, "Follow the convention: one H1, a > summary line, then H2 sections of annotated links.")
      );
    } else {
      c.push(
        fail("llms-txt", 4, "No /llms.txt found", raw ? `The file returned only ${raw.trim().length} bytes.` : "The request for /llms.txt returned nothing usable.", "Optional, and weighted low here for that reason - but cheap to add. See the llms.txt guide.")
      );
    }

    const hasRobots = input.robotsText !== null;
    c.push(
      hasRobots
        ? pass("ai-context-robots", 1, "A crawler policy is published", "robots.txt is readable.")
        : fail("ai-context-robots", 1, "No crawler policy published", "robots.txt could not be read.", "Publish robots.txt stating which crawlers are welcome.")
    );
    /*
     * A markdown alternate is the llms.txt idea applied per page: hand the machine a
     * version of this page with the navigation and the scripts stripped out.
     *
     * The check reads the DECLARATION only, and the limitation is stated rather than
     * hidden: the scanner fetches one URL, so following the alternate to confirm it
     * resolves would be a second request it does not make. A page can therefore pass
     * this check with a link that 404s. That is a real weakness, it is written into
     * the published rule, and closing it is a separate change to the fetcher.
     */
    const mdAlternate =
      /<link[^>]+rel\s*=\s*["']alternate["'][^>]*type\s*=\s*["']text\/markdown["']/i.test(input.html) ||
      /<link[^>]+type\s*=\s*["']text\/markdown["'][^>]*rel\s*=\s*["']alternate["']/i.test(input.html);
    c.push(
      mdAlternate
        ? pass("markdown-alternate", 1, "A markdown alternate is declared", "The page declares a text/markdown alternate.")
        : fail(
            "markdown-alternate",
            1,
            "No markdown alternate",
            'No <link rel="alternate" type="text/markdown"> in the document head.',
            'Publish a markdown version of the page and point at it with <link rel="alternate" type="text/markdown" href="...">, so an agent can fetch the content without the chrome around it.'
          )
    );

    checks["llms-txt"] = c;
  }

  /* ---- Freshness (5) ---- */
  {
    const c: Check[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    const dateMatch =
      html.match(/"dateModified"\s*:\s*"([^"]+)"/i) ||
      html.match(/"datePublished"\s*:\s*"([^"]+)"/i) ||
      html.match(/<meta[^>]+property\s*=\s*["']article:modified_time["'][^>]*content\s*=\s*["']([^"']+)["']/i);

    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        const months = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (months <= 12) c.push(pass("date-machine", 3, "A machine-readable date is present and recent", `${dateMatch[1]} (${Math.round(months)} months old).`));
        else c.push(partial("date-machine", 3, 1, "A machine-readable date is present but old", `${dateMatch[1]} (${Math.round(months)} months old).`, "Refresh date-sensitive pages and update the date when you do."));
      } else {
        c.push(partial("date-machine", 3, 1, "A date is present but not machine-readable", `Found "${dateMatch[1]}".`, "Use ISO 8601 dates (YYYY-MM-DD) in schema and meta tags."));
      }
    } else if (input.lastModifiedHeader) {
      const parsed = new Date(input.lastModifiedHeader);
      const months = isNaN(parsed.getTime()) ? null : (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 30);
      c.push(
        months !== null && months <= 12
          ? partial("date-machine", 3, 2, "Only the HTTP header carries a date", `Last-Modified: ${input.lastModifiedHeader}.`, "Also declare dateModified in structured data; headers are not shown to readers.")
          : partial("date-machine", 3, 1, "Only an old HTTP header date is available", `Last-Modified: ${input.lastModifiedHeader}.`, "Declare dateModified in structured data and keep it current.")
      );
    } else {
      c.push(fail("date-machine", 3, "No date is published", "No dateModified, datePublished or Last-Modified header found.", "Publish a machine-readable modification date."));
    }

    const visibleDate = text.match(/\b(19|20)\d{2}\b/g);
    const hasCurrentYear = visibleDate ? visibleDate.some((y) => Number(y) === currentYear) : false;
    c.push(
      hasCurrentYear
        ? pass("copyright-year", 2, "A current year appears in the content", `${currentYear} is referenced on the page.`)
        : fail("copyright-year", 2, "No current year on the page", `The year ${currentYear} does not appear in the visible text.`, "Update the site so a current year is visible; stale date signals suppress generated-answer selection.")
    );
    checks["freshness"] = c;
  }

  /* ---- International Readiness (3) ---- */
  {
    const c: Check[] = [];

    // Count DISTINCT language codes, not hreflang attributes.
    //
    // `en` plus `x-default` is a single-language site declaring its default -
    // it is not a multilingual site. Counting raw attributes let exactly that
    // pass a check about serving more than one language, which is the sort of
    // measurement error this project exists to avoid.
    const hreflangCodes = new Set(
      Array.from(html.matchAll(/hreflang\s*=\s*["']([^"']+)["']/gi))
        .map((m) => m[1].trim().toLowerCase())
        .filter((code) => code.length > 0 && code !== "x-default")
    );
    const codes = Array.from(hreflangCodes);

    c.push(
      codes.length >= 2
        ? pass(
            "hreflang",
            2,
            "Alternate language versions are declared",
            `${codes.length} distinct language codes: ${codes.join(", ")}.`
          )
        : fail(
            "hreflang",
            2,
            "No alternate language versions",
            codes.length === 1
              ? `Only one language is declared (${codes[0]}); x-default does not count as a language.`
              : "No hreflang attributes found.",
            "Declare hreflang for each language version you actually serve, so every version can be retrieved in its own market."
          )
    );
    // A region subtag is what makes a language market-specific: de-DE is not the
    // same target as de. This check used to run the identical <html lang> regex
    // as html-lang, so a single attribute earned points in two different
    // dimensions while the id promised a region that was never required.
    const htmlLang = html.match(/<html[^>]+lang\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    const ogLocale =
      html.match(/<meta\b[^>]*property\s*=\s*["']og:locale["'][^>]*>/i)?.[0].match(
        /content\s*=\s*["']([^"']+)["']/i
      )?.[1] ?? "";
    const hreflangValues = Array.from(
      html.matchAll(/hreflang\s*=\s*["']([^"']+)["']/gi)
    ).map((m) => m[1]);
    const regionTag = [htmlLang, ogLocale, ...hreflangValues]
      .map((t) => t.trim())
      .find((t) => /^[a-z]{2,3}[-_][a-z0-9]{2,4}$/i.test(t));

    c.push(
      regionTag
        ? pass("lang-region", 1, "A region-specific locale is declared", `Region subtag found: "${regionTag}".`)
        : fail(
            "lang-region",
            1,
            "No region-specific locale",
            "No language tag carrying a region subtag was found in <html lang>, og:locale or hreflang.",
            'Declare a region where it matters, for example lang="en-GB", og:locale="en_GB" or hreflang="de-AT".'
          )
    );
    checks["multilingual"] = c;
  }

  /* ---- Delivery & Mobile (2) ---- */
  {
    const c: Check[] = [];
    const viewport = /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html);
    c.push(
      viewport
        ? pass("viewport", 1, "Viewport meta tag is present", "A viewport declaration was found.")
        : fail("viewport", 1, "No viewport meta tag", "No viewport declaration found.", "Add a viewport meta tag so the page renders on mobile.")
    );
    const bytes = html.length;
    c.push(
      bytes < 500_000
        ? pass("payload", 1, "HTML payload is reasonable", `${Math.round(bytes / 1024)} KB of HTML before compression.`)
        : partial("payload", 1, 0, "HTML payload is large", `${Math.round(bytes / 1024)} KB of HTML before compression.`, "Trim the markup; parse budget is finite on both crawlers and devices.")
    );
    checks["delivery"] = c;
  }

  /* ---- Applicability ---- */
  /*
   * Applied here rather than inside each check, so that a check author cannot
   * forget it and so the whole exception list stays in one reviewable place.
   * Anything not named in NA_BY_PAGE_TYPE is untouched, which is what makes this
   * change score-neutral for every page type it does not mention.
   */
  const pageType = detectPageType(input.path, input.html);
  let checksNotApplicable = 0;
  for (const [checkId, types] of Object.entries(NA_BY_PAGE_TYPE)) {
    if (!types.includes(pageType)) continue;
    for (const dimensionId of Object.keys(checks)) {
      const list = checks[dimensionId];
      const index = list.findIndex((c) => c.id === checkId);
      if (index < 0) continue;
      const existing = list[index];
      list[index] = notApplicable(
        checkId,
        existing.weight,
        existing.title,
        `Not applicable to a ${pageType} page, so it is excluded from the score rather than counted as a failure.`
      );
      checksNotApplicable += 1;
    }
  }

  /* ---- Aggregate ---- */
  const dimensions: Dimension[] = [];
  const issues: Issue[] = [];
  const allChecks: { id: string; dimension: string; status: CheckStatus; weight: number; title: string }[] = [];
  let checksRun = 0;
  let checksPassed = 0;

  for (const meta of DIMENSIONS) {
    const list = checks[meta.id] || [];
    // An inapplicable check leaves both sides of the fraction, so it can neither
    // add points nor cost them.
    const applicable = list.filter((c) => c.status !== "na");
    const possible = applicable.reduce((s, c) => s + c.weight, 0);
    const earned = applicable.reduce((s, c) => s + c.earned, 0);
    const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;

    dimensions.push({
      id: meta.id,
      label: meta.label,
      weight: meta.weight,
      score,
      earned,
      possible,
      // A dimension with nothing applicable contributes no weight of its own; the
      // remaining dimensions are renormalised against their sum below.
      applicableWeight: possible > 0 ? meta.weight : 0,
      rationale: meta.rationale,
    });

    for (const check of list) {
      checksRun += 1;
      if (check.status === "pass") checksPassed += 1;
      allChecks.push({
        id: check.id,
        dimension: meta.id,
        status: check.status,
        weight: check.weight,
        title: check.title,
      });
      // An excluded check is not an issue, and listing it as one is precisely the
      // problem this change exists to remove.
      if (check.status === "pass" || check.status === "na") continue;
      issues.push({
        id: check.id,
        category: meta.label,
        title: check.title,
        severity: check.status === "fail" ? "high" : "medium",
        summary: check.evidence,
        recommendation: check.fix || "Review this item.",
        evidence: check.evidence,
      });
    }
  }

  /*
   * Renormalised total. With nothing excluded the applicable weights sum to 100
   * and this is arithmetically identical to the previous formula - the property
   * the fixture tests exist to keep.
   */
  const totalWeight = dimensions.reduce((s, d) => s + d.applicableWeight, 0);
  const score =
    totalWeight > 0
      ? Math.round(dimensions.reduce((s, d) => s + d.score * d.applicableWeight, 0) / totalWeight)
      : 0;

  const grade =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const gradeLabel =
    score >= 90
      ? "Excellent - highly likely to be cited"
      : score >= 80
        ? "Good - likely to be cited"
        : score >= 70
          ? "Average - several dimensions need work"
          : score >= 60
            ? "Poor - significant GEO gaps"
            : "Critical - rarely cited by AI engines";

  // Severity first, then the dimension that carries the most weight. Ordering by
  // applicableWeight rather than the nominal weight keeps a dimension that was
  // entirely excluded from outranking the ones that actually applied.
  const weightOf = new Map(dimensions.map((d) => [d.label, d.applicableWeight]));
  issues.sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
    return (weightOf.get(b.category) || 0) - (weightOf.get(a.category) || 0);
  });

  const metric = (id: string) => dimensions.find((d) => d.id === id)?.score ?? 0;

  return {
    score,
    grade,
    gradeLabel,
    dimensions,
    metrics: {
      crawlability: metric("ai-crawler-access"),
      understandability: metric("semantic-structure"),
      answerReadiness: metric("answer-readiness"),
      citability: metric("citability"),
      trustAuthority: metric("trust-authority"),
      contentDepth: metric("content-depth"),
    },
    issues,
    checks: allChecks,
    checksRun,
    checksPassed,
    checksNotApplicable,
    pageType,
  };
}
