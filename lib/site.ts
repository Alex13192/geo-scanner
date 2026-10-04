/**
 * Single source of truth for the canonical origin, the brand name and the
 * contact address.
 *
 * WHY THIS FILE EXISTS: the audit that preceded the domain decision said the
 * domain should be changeable "in ONE place". It was in more than one:
 *
 *   - the origin was repeated in three layouts and the sitemap
 *   - both API routes carried it inside a user-agent string, where a stale host
 *     points real crawlers and site owners at a domain that no longer exists
 *   - the readiness badge embedded it in every snippet a user copies, so a stale
 *     host sends other people's badge traffic to the wrong place
 *   - two pages hardcoded it inside a `?domain=` query parameter
 *
 * Moving to an independent domain is therefore:
 *   1. edit SITE_URL below
 *   2. run `npm run check:values` - it names every file still carrying the old
 *      host, including the two static files that cannot import this module
 *      (public/robots.txt and public/llms.txt). A `Sitemap:` line in robots.txt
 *      that points at the old domain is worse than having no line at all.
 */
export const SITE_URL = "https://llmention-geo.com";

/** Host only, for the `?domain=` links that re-audit this site. */
export const SITE_HOST = new URL(SITE_URL).host;

export const BRAND = "LLMention";

/**
 * One address for the whole site. It is declared here because it appeared as a
 * local constant in six files, which is how a contact address silently diverges
 * between a pricing page and a refund policy.
 *
 * It has to be an address someone actually reads: it is the destination for
 * audit requests, data requests and withdrawal notices, and a contact address
 * nobody monitors is worse than no contact address, because it looks like a
 * working channel and is not.
 */
export const CONTACT_EMAIL = "alex.xu@ccie13192.com";
