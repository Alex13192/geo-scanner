// app/api/llms-txt/route.ts
//
// Builds an llms.txt from what the site actually publishes.
//
// The previous "generator" was string interpolation into a hardcoded template
// that described an enterprise networking vendor, so every domain produced copy
// unrelated to its own business. This fetches the homepage, reads the title,
// description and internal links, and emits a file that reflects the real site.
//
// It is deliberately conservative: it only claims what it can see on one page,
// and it says so in the generated file.
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (compatible; LLMentionBot/1.0; +https://geo-scanner.ccie13192.com/methodology/)";

const FETCH_TIMEOUT_MS = 9000;
const MAX_LINKS = 12;

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

/** Paths that are navigation or plumbing rather than content. */
const IGNORED_PATH = /\/(login|signin|sign-in|signup|sign-up|register|cart|checkout|account|search|tag|tags|category|categories|page\/\d+)(\/|$)/i;

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

type LinkEntry = { path: string; url: string; label: string };

function extractLinks(html: string, origin: string, host: string): LinkEntry[] {
  const seen = new Set<string>();
  const out: LinkEntry[] = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (out.length >= 400) break;

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
    if (LOCALE_ONLY.test(path)) continue;
    if (seen.has(path)) continue;
    seen.add(path);

    // Anchors that wrap only an image carry no text. Falling back to a
    // humanised path beats emitting a raw "/nl/products" as a label, and beats
    // dropping a page that may well be worth listing.
    const label = truncate(stripTags(match[2]), 80) || pathLabel(path);

    // Only directories get a trailing slash. Appending one to /llms.txt turns a
    // valid file URL into a 404, which is the exact failure this file is meant
    // to help people avoid.
    const suffix = path === "/" ? "" : FILE_LIKE.test(path) ? "" : "/";
    out.push({ path, url: `${origin}${path}${suffix}`, label });
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = cleanDomain(searchParams.get("domain") || "");

  /**
   * Content is requested in the language of the page the user is on.
   *
   * Without this the edge worker's own location decides: requesting stripe.com
   * from a Netherlands-based edge node returned Stripe's Dutch homepage, so the
   * generated file described the site in a language its owner may not publish
   * in. Sending Accept-Language makes the result predictable and lets the
   * German studio produce German copy for German sites.
   */
  const langParam = (searchParams.get("lang") || "en").toLowerCase();
  const lang = /^[a-z]{2}$/.test(langParam) ? langParam : "en";
  const acceptLanguage = lang === "en" ? "en-US,en;q=0.9" : `${lang},en;q=0.5`;

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const origin = `https://${domain}`;
  let html = "";
  let status = 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(origin, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": acceptLanguage,
      },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    status = res.status;
    if (res.ok) html = await res.text();
  } catch {
    status = 0;
  }

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

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Tag = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const descTag = html.match(
    /<meta[^>]+name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["']/i
  );

  // Titles commonly carry a tagline after a separator; the part before it is the
  // site name far more often than not.
  const rawTitle = titleTag ? stripTags(titleTag[1]) : "";
  const siteName =
    truncate(rawTitle.split(/\s+[|\u2013\u2014\u00b7-]\s+/)[0] || "", 70) ||
    (h1Tag ? truncate(stripTags(h1Tag[1]), 70) : "") ||
    domain;

  const description = descTag
    ? truncate(stripTags(descTag[1]), 200)
    : h1Tag
      ? truncate(stripTags(h1Tag[1]), 200)
      : "";

  const links = extractLinks(html, origin, domain).slice(0, MAX_LINKS);
  const today = new Date().toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push(`# ${siteName}`);
  lines.push("");
  if (description) {
    lines.push(`> ${description}`);
    lines.push("");
  }
  lines.push(
    `${siteName} is published at ${origin}. This file lists the pages an AI system should read first.`
  );
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  if (links.length === 0) {
    lines.push(`- [Home](${origin}/): the site homepage.`);
  } else {
    for (const link of links) {
      const label = link.label || link.path;
      lines.push(`- [${label}](${link.url})`);
    }
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push(
    `- Generated by LLMention on ${today} from the links found on ${origin}/.`
  );
  lines.push(
    "- Review and edit before publishing: these are only the pages reachable from the homepage, and the descriptions are the link texts as written."
  );
  lines.push("- Convention reference: https://llmstxt.org/");

  return NextResponse.json({
    reachable: true,
    status,
    domain,
    siteName,
    description,
    linkCount: links.length,
    content: lines.join("\n") + "\n",
  });
}
