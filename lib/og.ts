import { BRAND } from "./site";

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
 *   og:site_name   the homepage emitted "LLMention"; /pricing/ (since removed
 *                  with the paid audit) emitted nothing, so a crawler reading
 *                  that page could not tell whose it was.
 *                  That is exactly the "entity is not cross-referenced" failure
 *                  the Trust dimension marks down.
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
  };
}
