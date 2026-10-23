import { BRAND } from "./site";

/**
 * The social card, declared once and imported by everything that needs it.
 *
 * WHY THIS EXISTS: the site shipped with no og:image anywhere - there was not a
 * single image file under public/ - so every share of every page unfurled as a
 * bare text card, and the metadata dimension's own og:image signal was absent
 * from the site that scores other people on it.
 *
 * It lives here rather than inline in the root layout because two places need
 * it: the root layout's own openGraph block, and the `og()` helper below, which
 * every route calls. A second literal would drift the moment the card is
 * redrawn.
 *
 * width and height are stated rather than left for the crawler to discover: a
 * card whose dimensions are unknown is sized at fetch time, and several clients
 * then letterbox it or drop it entirely. `alt` is stated for the same class of
 * reason - a card that cannot be described is a card that cannot be quoted.
 *
 * The path is site-relative on purpose. `metadataBase` in app/(en)/layout.tsx
 * resolves it to an absolute URL, so the canonical host stays declared exactly
 * once, in lib/site.ts, where scripts/check-values.mjs can prove it.
 */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${BRAND} - GEO scanner for AI search visibility`,
};

/**
 * The openGraph block for a page, built in one place.
 *
 * WHY THIS EXISTS - one root cause behind two failing checks:
 *
 * Only the root layout set `openGraph`, and it set `siteName` and `locale` with
 * it. Fourteen routes then declared their own `openGraph` to override the title
 * and description for that page. Next.js REPLACES the whole openGraph object when
 * a route declares one rather than deep-merging it with the parent, so every one
 * of those fourteen silently lost `siteName` and `locale` - and with them two
 * checks this site publishes and scores other people against:
 *
 *   og:site_name   the homepage emitted "LLMention"; /pricing/ emitted nothing,
 *                  so a crawler reading that page could not tell whose it was -
 *                  exactly the "entity is not cross-referenced" failure the Trust
 *                  dimension marks down. (That page was deleted with the paid audit
 *                  and restored on 2026-10-08; the diagnosis stands either way, and
 *                  routing every page's openGraph through this helper is what made
 *                  the site pass the check again.)
 *   og:locale      only the homepage carried a locale with a region, so
 *                  /lang-region failed on the other sixteen routes while passing
 *                  on the homepage. The evidence for the diagnosis was the shape
 *                  of the failure: it tracked "declares its own openGraph"
 *                  precisely, with no exceptions.
 *
 * Building the block here means a page cannot forget either field, and the same
 * fix applies to the next page somebody adds.
 *
 * `type` defaults to "website" rather than being copied from what was there
 * before. Several pages declared `type: "article"`, which is a claim that the page
 * is an article with a publication date and an author - true of a /docs/ guide,
 * not of a privacy policy or a price list.
 */
export function og({
  title,
  description,
  url,
  type = "website",
}: {
  title: string;
  description: string;
  /** Site-relative; metadataBase in the root layout resolves it to an absolute URL. */
  url: string;
  type?: "website" | "article";
}) {
  return {
    title,
    description,
    url,
    siteName: BRAND,
    locale: "en_US",
    type,
    images: [OG_IMAGE],
  };
}

/**
 * The whole social block for a page: openGraph plus the Twitter card.
 *
 * WHY THIS EXISTS, AND IT IS A BUG REPORT RATHER THAN A CONVENIENCE. Next's metadata
 * inheritance is per field, and `twitter` was declared only in the root layout. Every page
 * that declared its own `openGraph` therefore kept the ROOT twitter card: the audit that
 * prompted this checked four pages and found each one sharing the homepage's
 * twitter:title and twitter:description, so a link to /study/ unfurled as the homepage
 * with the homepage's promise on it. `openGraph` was fixed by routing it through og(); the
 * Twitter half was simply never given the same treatment, which is the kind of asymmetry a
 * reader never sees and a crawler always does.
 *
 * Returning both blocks from one function means a page cannot fix one and forget the other,
 * and it is why the call sites spread this object instead of writing `openGraph:` and
 * `twitter:` separately.
 */
export function social({
  title,
  description,
  url,
  type = "website",
}: {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
}) {
  return {
    openGraph: og({ title, description, url, type }),
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
