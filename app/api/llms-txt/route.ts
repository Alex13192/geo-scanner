// app/api/llms-txt/route.ts
//
// Builds an llms.txt from what the site actually publishes.
//
// Three versions of this endpoint are worth knowing about, because each one failed in a
// different way and the current shape is the answer to both.
//
// The first was string interpolation into a hardcoded template that described an enterprise
// networking vendor, so every domain produced copy unrelated to its own business.
//
// The second fetched the homepage, read its title, description and internal links, and
// emitted one flat `## Key pages` section of at most MAX_LINKS links whose descriptions
// were the anchor text. It invented nothing, which was the right instinct, but a link
// labelled "Guides Setup instructions for robots.txt, llms.txt, schema..." is not a
// description of a page - it is the page's own navigation pasted back, truncated at 60
// characters by the anchor parser.
//
// This version fetches the pages it lists. Each link's description is the target page's own
// meta description, or failing that its own H1, or nothing: no text is generated, no model
// is called, and a page nobody read gets a link with no description and a line at the bottom
// saying how many of those there were. The whole point of the file is that a reader can
// check every sentence in it against the page it came from, and a sentence written by a
// language model about a page nobody read is the one thing that would end that.
//
// WHY THE HONESTY CONSTRAINTS ARE STRUCTURAL RATHER THAN PROMISES:
//   - descriptions are only ever assigned from a fetched page's own markup, in one function
//     (describePage), and the homepage's description is never reachable from it;
//   - the number of pages actually read is returned in the JSON and printed in the file, so
//     "we read some of these" cannot quietly become "we read them";
//   - a page that fails is counted and omitted, never listed with a description implying it
//     was read.
import { NextResponse } from "next/server";
import {
  HOME_TIMEOUT_MS,
  LANGUAGE_SEGMENT,
  MAX_FETCH_PAGES,
  MAX_LINKS_PER_SECTION,
  OTHER_SECTION,
  SECTION_NAMES,
  SECTION_ORDER,
  SOFT_404,
  SUBPAGE_BUDGET,
} from "@/lib/llms-txt";
import { fetchText, inspectTarget } from "@/lib/net/fetch-safe";
import { clientKey, takeToken } from "@/lib/net/rate-limit";
import { SITE_URL } from "@/lib/site";

// No `export const runtime = "edge"` - the edge runtime is not supported by
// @opennextjs/cloudflare. Runs on the Node.js runtime with nodejs_compat; see the longer
// note in app/api/scan/route.ts and the assertion in scripts/test-analyze.mts.
export const dynamic = "force-dynamic";

const UA = `Mozilla/5.0 (compatible; LLMentionBot/1.0; +${SITE_URL}/methodology/)`;

/** How many internal links are read from the homepage before grouping. */
const MAX_DISCOVERED_LINKS = 400;

/** Characters of a page's own description that are kept. */
const DESCRIPTION_MAX = 200;

/** Characters kept of an anchor's text, when the anchor wraps a whole card. */
const LABEL_MAX = 60;

type Lang = "en" | "de";

/**
 * Boilerplate for the generated file, in the language of the studio the reader is using.
 *
 * The German studio used to hand back an English file: German headings, German buttons, and
 * then "## Key pages" and English notes inside the document a German site owner is meant to
 * publish. The fetched content already follows Accept-Language, so the scaffolding around it
 * has to follow the same signal.
 */
type OutputLabels = {
  /**
   * The one-line statement of what the file is, kept verbatim from the previous version.
   *
   * It was briefly dropped when the sections were introduced, and putting it back is the
   * point: it is the line that tells a reader this file lists pages rather than describing a
   * business, and the change that added descriptions has no business removing it.
   */
  intro: (name: string, origin: string) => string;
  homeFallback: (origin: string) => string;
  /** Heading for a section, given the number of pages that belong to it. */
  section: (name: string, total: number, listed: number) => string;
  /** The count of pages left out of a section, printed directly under its links. */
  remainder: (count: number, total: number) => string;
  /** The count of pages whose own markup carried no description. */
  noDescription: (count: number) => string;
  /** The count of links the generator did not open at all, printed only when non-zero. */
  notRead: (count: number) => string;
  notes: string;
  /**
   * The generation date as a sentence, directly under the blockquote summary.
   *
   * Why it is not in the notes: 28.9% of the links in the competitor's published file now
   * redirect somewhere else, so the first question a reader should be able to answer about a
   * file like this is how old it is - before they read a single link, not after. A bold line
   * carrying only the date was the first attempt and it printed the date twice in three
   * lines, which is how a reader learns to skip headers.
   */
  generatedOn: (date: string) => string;
  generatedBy: (origin: string) => string;
  review: string;
  convention: string;
};

const OUTPUT_LABELS: Record<Lang, OutputLabels> = {
  en: {
    intro: (name, origin) =>
      `${name} is published at ${origin}. This file lists the pages an AI system should read first.`,
    homeFallback: (origin) => `- [Home](${origin}/): the site homepage.`,
    section: (name, total, listed) =>
      total === listed ? `## ${name} (${listed})` : `## ${name} (${listed} of ${total})`,
    remainder: (count, total) => `- ${count} of this section's ${total} pages are not listed here.`,
    noDescription: (count) =>
      `- ${count} listed page${count === 1 ? "" : "s"} carried neither a meta description nor an H1, so ${count === 1 ? "it is" : "they are"} linked without a description.`,
    notRead: (count) =>
      `- ${count} of the listed pages ${count === 1 ? "was" : "were"} not read at all, because this run's ${MAX_FETCH_PAGES}-page limit was spent on other sections. ${count === 1 ? "It carries" : "They carry"} no description rather than one written for ${count === 1 ? "it" : "them"}.`,
    notes: "## Notes",
    generatedOn: (date) =>
      `Generated on ${date}. Every link below was read on that date, and a link is only as current as the page it points at: regenerate this file rather than publishing a copy that has aged.`,
    generatedBy: (origin) =>
      `- Generated by LLMention from the pages it read on ${origin}. Each description is that page's own meta description, or its own H1 where there is none; no description is written by this tool.`,
    review:
      "- Review and edit before publishing: the pages are the ones the homepage links to, the descriptions are the pages' own metadata as it stood on the generation date above, and external links are not followed.",
    convention: "- Convention reference: https://llmstxt.org/",
  },
  de: {
    intro: (name, origin) =>
      `${name} ist unter ${origin} veröffentlicht. Diese Datei nennt die Seiten, die ein KI-System zuerst lesen sollte.`,
    homeFallback: (origin) => `- [Startseite](${origin}/): die Startseite der Website.`,
    section: (name, total, listed) =>
      total === listed ? `## ${name} (${listed})` : `## ${name} (${listed} von ${total})`,
    remainder: (count, total) => `- ${count} der ${total} Seiten dieses Abschnitts sind hier nicht aufgeführt.`,
    noDescription: (count) =>
      `- Bei ${count} aufgeführten Seite${count === 1 ? "" : "n"} gab es weder eine Meta-Beschreibung noch eine H1, daher ${count === 1 ? "steht sie" : "stehen sie"} ohne Beschreibung in der Liste.`,
    notRead: (count) =>
      `- ${count} der aufgeführten Seiten wurde${count === 1 ? "" : "n"} gar nicht gelesen, weil das Limit von ${MAX_FETCH_PAGES} Seiten in diesem Lauf für andere Abschnitte aufgebraucht wurde. ${count === 1 ? "Sie steht" : "Sie stehen"} ohne Beschreibung in der Liste, statt mit einer für ${count === 1 ? "sie" : "sie"} geschriebenen.`,
    notes: "## Hinweise",
    generatedOn: (date) =>
      `Erzeugt am ${date}. Alle Links unten wurden an diesem Datum gelesen, und ein Link ist nur so aktuell wie die Seite, auf die er zeigt: Diese Datei neu erzeugen, statt eine gealterte Kopie zu veröffentlichen.`,
    generatedBy: (origin) =>
      `- Erzeugt von LLMention aus den gelesenen Seiten auf ${origin}. Jede Beschreibung ist die Meta-Beschreibung der jeweiligen Seite, ersatzweise deren H1; keine Beschreibung wird von diesem Werkzeug geschrieben.`,
    review:
      "- Vor der Veröffentlichung prüfen und anpassen: Gelistet sind die Seiten, die die Startseite verlinkt, die Beschreibungen sind die Metadaten der Seiten zum oben genannten Erzeugungsdatum, und externen Links wird nicht gefolgt.",
    convention: "- Referenz zur Konvention: https://llmstxt.org/",
  },
};

const SECTION_NAMES_DE: Record<string, string> = {
  docs: "Dokumentation",
  checks: "Prüfregeln",
  dimensions: "Bewertungsdimensionen",
  methodology: "Methodik",
  study: "Messung",
  about: "Unternehmen",
  contact: "Unternehmen",
  privacy: "Rechtliches",
  terms: "Rechtliches",
  "llms-txt-studio": "Werkzeuge",
  "readiness-badge": "Werkzeuge",
  "answer-check": "Werkzeuge",
};

const SECTION_ORDER_DE = [
  "Dokumentation",
  "Prüfregeln",
  "Bewertungsdimensionen",
  "Methodik",
  "Messung",
  "Werkzeuge",
  "Unternehmen",
  "Rechtliches",
];

function sectionNames(lang: Lang): Record<string, string> {
  return lang === "de" ? SECTION_NAMES_DE : SECTION_NAMES;
}

function cleanDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;/gi, "-")
    .replace(/&ndash;/gi, "-")
    .replace(/&hellip;/gi, "...")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max - 1).replace(/[\s,;:.-]+$/, "") + "\u2026";
}

/**
 * Read a page's own title, description and H1.
 *
 * The description regex accepts the attribute in either order, which is not defensive
 * programming for its own sake: the previous version required `name` before `content` and
 * silently produced no description at all on any site that writes them the other way round.
 * The same mistake at the page level would silently strip a description from every link.
 */
type PageMeta = {
  title: string;
  description: string;
  h1: string;
  /** The description's provenance, so the response can prove where it came from. */
  source: "meta" | "h1" | "none";
};

function pageMeta(html: string): PageMeta {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const desc =
    html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["']/i) ??
    html.match(/<meta[^>]+content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']description["']/i);

  const metaDescription = desc ? truncate(stripTags(desc[1]), DESCRIPTION_MAX) : "";
  const heading = h1 ? truncate(stripTags(h1[1]), DESCRIPTION_MAX) : "";

  const rawTitle = title ? stripTags(title[1]) : "";

  return {
    title: rawTitle,
    description: metaDescription || heading,
    h1: heading,
    source: metaDescription ? "meta" : heading ? "h1" : "none",
  };
}

/**
 * THE ONE PLACE A DESCRIPTION IS ASSIGNED.
 *
 * A link's description comes from the metadata of the page that link points at, or from
 * nothing. The homepage's own description is not a parameter of this function and no caller
 * passes one, which is what makes "never reuse the homepage's description for a subpage" a
 * property of the code rather than a rule somebody has to remember.
 *
 * The soft-404 guard is here because a 200 response is not evidence that a page exists: a
 * "Page not found" H1 would otherwise be printed as the description of the page it failed
 * to find, which is the exact shape of claim this file exists not to make.
 */
type PageDescription =
  | { read: true; text: string; source: "meta" | "h1" | "none" }
  | { read: false };

function describePage(html: string, status: number): PageDescription {
  if (status < 200 || status >= 300 || !html.trim()) return { read: false };

  const meta = pageMeta(html);
  const haystack = `${meta.title} ${meta.h1}`;
  if (!meta.title.trim() && !meta.h1.trim()) return { read: false };
  if (SOFT_404.test(haystack)) return { read: false };

  return { read: true, text: meta.description, source: meta.source };
}

/** Paths that are navigation or plumbing rather than content. */
const IGNORED_PATH =
  /\/(login|signin|sign-in|signup|sign-up|register|cart|checkout|account|search|tag|tags|category|categories|page\/\d+)(\/|$)/i;

/** A bare language prefix such as /nl or /en-gb is a switcher, not a page. */
const LOCALE_ONLY = /^\/[a-z]{2}(-[a-z]{2})?$/i;

/** If the last segment looks like a file, it must not get a trailing slash. */
const FILE_LIKE = /\.[a-z0-9]{2,5}$/i;

/** Turn "/customer-stories" into "Customer stories" for anchors with no text. */
function pathLabel(path: string): string {
  if (path === "/") return "Home";
  const segment = path.split("/").filter(Boolean).pop() || "";
  const words = segment.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The text a reader would call the link.
 *
 * When a whole card is wrapped in one anchor, the raw text is the entire card - emoji,
 * heading and paragraph together - which fills the file with truncated 80-character labels.
 * The heading or bold run inside the anchor is what the link is actually called, so it wins
 * when present.
 */
function anchorLabel(inner: string): string {
  const heading = inner.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  if (heading) return truncate(stripTags(heading), LABEL_MAX);
  const bold = inner.match(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/i)?.[2];
  if (bold) return truncate(stripTags(bold), LABEL_MAX);
  return truncate(stripTags(inner), LABEL_MAX);
}

type PageEntry = {
  path: string;
  url: string;
  /** The anchor text, or a humanised path when the anchor carried none. */
  label: string;
  description: string;
  /** How the description was obtained, for the response payload. */
  source: "meta" | "h1" | "none";
  /** True when the page was fetched and its own metadata parsed. */
  read: boolean;
};

function extractLinks(html: string, origin: string, host: string): PageEntry[] {
  const seen = new Set<string>();
  const out: PageEntry[] = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (out.length >= MAX_DISCOVERED_LINKS) break;

    const rawHref = match[1].trim();
    if (!rawHref || rawHref.startsWith("#")) continue;
    if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) continue;

    let url: URL;
    try {
      url = new URL(rawHref, origin);
    } catch {
      continue;
    }
    if (url.hostname.replace(/^www\./, "") !== host) continue;
    if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|css|js)$/i.test(url.pathname)) continue;
    if (IGNORED_PATH.test(url.pathname)) continue;

    const path = url.pathname.replace(/\/+$/, "") || "/";
    /*
     * The homepage is the page this file is generated from and is already named in the H1,
     * so a link back to it is not a page to list. The previous version listed it, and because
     * it appended a trailing slash to a path that was already "/", the emitted URL ended in a
     * doubled slash. Mentioning the host here is not possible: scripts/check-values.mjs
     * refuses a second copy of the origin anywhere under app/, comments included, and it is
     * right to - this comment would otherwise survive a domain move and be wrong.
     */
    if (path === "/") continue;
    if (seen.has(path)) continue;

    // Anchors that wrap only an image carry no text. Falling back to a humanised path beats
    // emitting a raw "/nl/products" as a label, and beats dropping a page that may well be
    // worth listing.
    const rawLabel = anchorLabel(match[2]);

    // A bare language prefix with no link text is a language switcher rather than a
    // destination. With text - "Deutsch", "Nederlands" - it points at a real localised page,
    // and dropping those would omit exactly the pages a multilingual site most wants listed.
    if (LOCALE_ONLY.test(path) && !rawLabel) continue;

    seen.add(path);
    const label = rawLabel || pathLabel(path);

    // Only directories get a trailing slash. Appending one to /llms.txt turns a valid file
    // URL into a 404, which is the exact failure this file is meant to help people avoid.
    const suffix = FILE_LIKE.test(path) ? "" : "/";
    out.push({
      path,
      url: `${origin}${path}${suffix}`,
      label,
      description: "",
      source: "none",
      read: false,
    });
  }
  return out;
}

/**
 * Which section a page belongs to, and what that section is called.
 *
 * THE RULE, which the generated file states in its own words: the section is named after the
 * FIRST SEGMENT of the path, and the table in lib/llms-txt.ts gives the readable name. The
 * one exception is a language prefix (`/en/docs/x`), which is skipped because `en` is not a
 * section - a file whose every heading is a language code is worse than a file with one
 * heading.
 *
 * A first segment the table does not name still becomes a section of its own, so what is not
 * in the table is visible in the output rather than silently merged into everything else.
 */
function sectionFor(path: string, lang: Lang): { key: string; name: string } {
  const names = sectionNames(lang);
  const segments = path.split("/").filter(Boolean);

  for (const segment of segments) {
    if (LANGUAGE_SEGMENT.test(segment)) continue;
    const name = names[segment] ?? SECTION_NAMES[segment];
    if (name) return { key: name, name };
  }

  const fallback = OTHER_SECTION[lang];
  const count = segments.length > 0 ? segments.length : 1;
  return { key: fallback, name: `${fallback} (${count} segment${count === 1 ? "" : "s"})` };
}

/** The order a section appears in: the declared order, then order of first discovery. */
function sectionRank(name: string, lang: Lang): number {
  const order = lang === "de" ? SECTION_ORDER_DE : SECTION_ORDER;
  const index = order.indexOf(name);
  return index === -1 ? order.length : index;
}

type Section = { name: string; pages: PageEntry[] };

/**
 * Group pages into sections, in output order.
 *
 * Sections are keyed by their printed name rather than by path segment, so /about and
 * /contact land in one Company section instead of two sections that happen to print the
 * same heading twice.
 */
function groupPages(pages: PageEntry[], lang: Lang): Section[] {
  const byName = new Map<string, Section>();
  const ranks = new Map<string, number>();
  let discovered = 0;

  for (const page of pages) {
    const { key, name } = sectionFor(page.path, lang);
    let section = byName.get(key);
    if (!section) {
      section = { name, pages: [] };
      byName.set(key, section);
      // A declared section keeps its declared rank; an undeclared one is ordered by where
      // it first appeared on the homepage.
      ranks.set(key, sectionRank(name, lang) * 1000 + discovered++);
    }
    section.pages.push(page);
  }

  return [...byName.entries()]
    .sort((a, b) => (ranks.get(a[0]) ?? 0) - (ranks.get(b[0]) ?? 0))
    .map(([, section]) => section);
}

/**
 * Choose which pages to fetch.
 *
 * WHY ROUND ROBIN AND NOT THE FIRST N. The pages are grouped by section and each section has
 * its own cap, so spending the whole fetch budget in homepage order would leave every
 * section after the first with link text where it could have had a real description - and
 * on a site whose homepage opens with a grid, the sections that lose are exactly the ones
 * whose pages say the most. One page per section per round spends the budget evenly, and any
 * section with fewer pages than its share hands the remainder to the next round.
 */
function chooseForFetch(sections: Section[], budget: number): PageEntry[] {
  const chosen: PageEntry[] = [];
  const cursors = sections.map(() => 0);
  let exhausted = false;

  while (chosen.length < budget && !exhausted) {
    exhausted = true;
    for (let i = 0; i < sections.length && chosen.length < budget; i++) {
      const pages = sections[i].pages;
      if (cursors[i] >= pages.length) continue;
      exhausted = false;
      chosen.push(pages[cursors[i]++]);
    }
  }

  return chosen;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch the chosen pages, inside the budget, and attach each page's own description.
 *
 * THE BUDGET IS ENFORCED TWICE, deliberately. `deadline` stops the phase from starting
 * another fetch once the wall clock is spent, and each fetch's own timeout is clamped to
 * whatever is left of that deadline, so a page that hangs cannot hold the phase open past
 * its budget. A fetch that is never started counts as unread, which is a different outcome
 * from a fetch that returned 404 but produces the same output: no description, and a count.
 *
 * The stagger is what keeps this polite. Concurrency alone would send four requests to the
 * same host in the same millisecond and the next four the moment the first of them
 * returned; a fixed gap between batches makes the load on the target predictable, which
 * matters because this endpoint fetches somebody else's site on a stranger's request.
 *
 * A page that could not be read never reaches the output as though it had been. The count
 * of each failure kind comes back so the caller can be told, and the file says how many of
 * its links carry no description rather than implying they were all read.
 */
type FetchOutcome = {
  read: number;
  /** The fetch was aborted at its timeout. */
  timedOut: number;
  /** A response arrived, but it was not a 2xx HTML page: a 404 among them. */
  badStatus: number;
  /** The fetch was never started: the guard refused it, or the budget was spent. */
  notStarted: number;
};

async function readPages(
  chosen: PageEntry[],
  acceptLanguage: string
): Promise<FetchOutcome> {
  const deadline = Date.now() + SUBPAGE_BUDGET.phaseMs;
  const outcome: FetchOutcome = { read: 0, timedOut: 0, badStatus: 0, notStarted: 0 };

  const tasks = chosen.map((page, index) => async () => {
    // The guard runs on every URL. It is applied again rather than inherited from the
    // homepage: a link that resolves to another host, or to an address the guard refuses,
    // is skipped as unread instead of being fetched because the homepage was allowed.
    if (!inspectTarget(page.url).ok) {
      outcome.notStarted++;
      return;
    }

    const batch = Math.floor(index / SUBPAGE_BUDGET.concurrency);
    const waitMs = Date.now() + batch * SUBPAGE_BUDGET.staggerMs - Date.now();
    if (waitMs > 0) await wait(waitMs);

    const remaining = deadline - Date.now();
    if (remaining < SUBPAGE_BUDGET.minRemainingMs) {
      outcome.notStarted++;
      return;
    }

    const perPageTimeout = Math.min(SUBPAGE_BUDGET.perPageMs, remaining);

    let result: Awaited<ReturnType<typeof fetchText>>;
    try {
      result = await fetchText(page.url, {
        userAgent: UA,
        accept: "text/html,application/xhtml+xml,*/*",
        acceptLanguage,
        timeoutMs: perPageTimeout,
      });
    } catch {
      /*
       * fetchText catches its own failures, so reaching this means something below it threw
       * rather than returned - a malformed header, a platform error. Counted and omitted,
       * because the one thing this must not do is fall through to a link that carries a
       * description for a page nobody read.
       */
      outcome.notStarted++;
      return;
    }

    if (!result) {
      // fetchText returns null both when the abort fired and when the connection failed
      // outright, so this is "no response at all" rather than a claim about which.
      outcome.timedOut++;
      return;
    }

    const described = describePage(result.body, result.status);
    if (!described.read) {
      outcome.badStatus++;
      return;
    }

    page.read = true;
    page.description = described.text;
    // A page that was read but whose markup has neither a meta description nor an H1 is left
    // with no description. The anchor text is NOT used here, and that is the honesty rule of
    // this endpoint: link text is a label somebody wrote for a link, not a statement about
    // the page, and the files this one is measured against fill that gap with a generated
    // sentence about a page nobody opened.
    page.source = described.text ? described.source : "none";
    outcome.read++;
  });

  // Batched rather than all at once so the stagger above is a real gap between waves and not
  // twelve timers racing each other into the same instant.
  for (let i = 0; i < tasks.length; i += SUBPAGE_BUDGET.concurrency) {
    await Promise.all(tasks.slice(i, i + SUBPAGE_BUDGET.concurrency).map((task) => task()));
  }

  return outcome;
}

export async function GET(request: Request) {
  // Before any parsing or fetching. See lib/net/rate-limit.ts for what this does and does
  // not enforce. Note that one token now buys up to MAX_FETCH_PAGES + 1 outbound requests
  // rather than one, which is why the fetch budget below is capped rather than dynamic.
  const limit = takeToken(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests from this address. Please wait a moment and try again.",
        retryAfter: limit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = cleanDomain(searchParams.get("domain") || "");

  /**
   * Content is requested in the language of the page the user is on.
   *
   * Without this the edge worker's own location decides: requesting stripe.com from a
   * Netherlands-based edge node returned Stripe's Dutch homepage, so the generated file
   * described the site in a language its owner may not publish in. Sending Accept-Language
   * makes the result predictable and lets the German studio produce German copy for German
   * sites.
   */
  const langParam = (searchParams.get("lang") || "en").toLowerCase();
  const lang: Lang = langParam === "de" ? "de" : "en";
  const acceptLanguage = lang === "en" ? "en-US,en;q=0.9" : `${lang},en;q=0.5`;

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  // Reject targets that point at a network rather than a website, and say why.
  const target = inspectTarget(`https://${domain}`);
  if (!target.ok) {
    return NextResponse.json({ reachable: false, error: target.reason }, { status: 400 });
  }

  const origin = `https://${domain}`;
  const fetched = await fetchText(origin, {
    userAgent: UA,
    accept: "text/html,application/xhtml+xml,*/*",
    acceptLanguage,
    timeoutMs: HOME_TIMEOUT_MS,
  });

  const status = fetched?.status ?? 0;
  const html = fetched && fetched.status >= 200 && fetched.status < 300 ? fetched.body : "";

  if (!html) {
    return NextResponse.json(
      {
        error:
          status === 0
            ? "The homepage could not be reached."
            : `The homepage returned HTTP ${status}.`,
        reachable: false,
        status,
      },
      { status: 200 }
    );
  }

  const home = pageMeta(html);

  // Titles commonly carry a tagline after a separator; the part before it is the site name
  // far more often than not.
  const siteName =
    truncate(home.title.split(/\s+[|\u2013\u2014\u00b7-]\s+/)[0] || "", 70) ||
    truncate(home.h1, 70) ||
    domain;

  // The homepage's description is the file's blockquote. It is read here and passed
  // nowhere else, which is the mechanism behind "a subpage never inherits it".
  const description = home.description;

  const pages = extractLinks(html, origin, domain);
  const sections = groupPages(pages, lang);
  const chosen = chooseForFetch(sections, MAX_FETCH_PAGES);
  const outcome = await readPages(chosen, acceptLanguage);

  const listed = sections.map((section) => ({
    ...section,
    listedPages: section.pages.slice(0, MAX_LINKS_PER_SECTION),
  }));

  const listedCount = listed.reduce((sum, section) => sum + section.listedPages.length, 0);
  const listedPages = listed.flatMap((section) => section.listedPages);
  const undescribed = listedPages.filter((page) => !page.description).length;
  const unread = listedPages.filter((page) => !page.read).length;
  /** Read, but its markup carried neither a meta description nor an H1. */
  const readWithoutDescription = listedPages.filter(
    (page) => page.read && !page.description
  ).length;
  const omitted = pages.length - listedCount;
  const today = new Date().toISOString().slice(0, 10);
  const L = OUTPUT_LABELS[lang];

  const lines: string[] = [];
  lines.push(`# ${siteName}`);
  lines.push("");
  if (description) {
    lines.push(`> ${description}`);
    lines.push("");
  }
  // The date sits above the sections rather than in the notes at the bottom. The
  // competitor's own published file has 28.9% of its links pointing somewhere else now, and
  // the first thing a reader needs in order to judge a file like this is how old it is.
  lines.push(L.generatedOn(today));
  lines.push("");
  lines.push(L.intro(siteName, origin));
  lines.push("");

  if (listed.length === 0) {
    lines.push(L.homeFallback(origin));
    lines.push("");
  } else {
    for (const section of listed) {
      lines.push(L.section(section.name, section.pages.length, section.listedPages.length));
      lines.push("");
      for (const page of section.listedPages) {
        const suffix = page.description ? `: ${page.description}` : "";
        lines.push(`- [${page.label}](${page.url})${suffix}`);
      }
      const hidden = section.pages.length - section.listedPages.length;
      if (hidden > 0) {
        lines.push("");
        lines.push(L.remainder(hidden, section.pages.length));
      }
      lines.push("");
    }
  }

  if (undescribed > 0) {
    lines.push(L.noDescription(undescribed));
    lines.push("");
  }
  /*
   * The two counts answer different questions and the file states both, because "no
   * description" alone reads as a defect in the pages when it is usually a limit on how many
   * pages this run was willing to open. Only printed when it is non-zero: a line saying zero
   * pages were unread is noise, and noise is what makes a reader stop reading the notes.
   */
  if (unread > 0) {
    lines.push(L.notRead(unread));
    lines.push("");
  }

  lines.push(L.notes);
  lines.push("");
  lines.push(L.generatedBy(origin));
  lines.push(L.review);
  lines.push(L.convention);

  return NextResponse.json({
    reachable: true,
    status,
    domain,
    siteName,
    description,
    generatedOn: today,
    linkCount: listedCount,
    sectionCount: listed.length,
    /** Internal links found on the homepage, before any cap. */
    pagesFound: pages.length,
    /** Pages whose own markup was fetched and parsed. */
    pagesRead: outcome.read,
    /** Listed pages with no description, for any reason. */
    pagesWithoutDescription: undescribed,
    /** Of those, the ones that were read and simply had no meta description or H1. */
    readWithoutDescription,
    /** Listed pages the generator did not read. */
    pagesNotRead: unread,
    /** Pages beyond a section cap, reported in the file rather than listed. */
    pagesOmitted: omitted,
    /** Fetches that failed: no response at all, or a non-2xx status. */
    pagesFailed: outcome.timedOut + outcome.badStatus + outcome.notStarted,
    /** Of those, how the failure broke down. */
    failures: {
      timedOut: outcome.timedOut,
      badStatus: outcome.badStatus,
      notStarted: outcome.notStarted,
    },
    limits: {
      maxLinksPerSection: MAX_LINKS_PER_SECTION,
      maxFetchPages: MAX_FETCH_PAGES,
      phaseBudgetMs: SUBPAGE_BUDGET.phaseMs,
    },
    sections: listed.map((section) => ({
      name: section.name,
      total: section.pages.length,
      listed: section.listedPages.length,
      pages: section.listedPages.map((page) => ({
        url: page.url,
        title: page.label,
        description: page.description,
        /** meta | h1 | none */
        descriptionSource: page.source,
        read: page.read,
      })),
    })),
    content: lines.join("\n") + "\n",
  });
}
