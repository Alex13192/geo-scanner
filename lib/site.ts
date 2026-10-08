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

/**
 * The hostname this site answered on before it had a domain of its own.
 *
 * Kept as a value rather than as prose because it is still load-bearing, and the
 * reasons are all traffic that arrives without asking this repository first:
 *
 *   - pages under it are indexed, and the sitemap that named them was published
 *   - the readiness badge snippets embed the origin, and those snippets are in other
 *     people's repositories and footers, where they cannot be updated
 *   - both API routes carry it inside a user-agent string, so a host that stops
 *     resolving sends real crawlers to a domain that is not there and makes the scanner
 *     look like it is lying about who it is
 *
 * middleware.ts redirects it here permanently rather than leaving two hostnames serving
 * the same pages forever. It can be deleted when nothing is left pointing at it, which
 * is not a date anybody can set: the badge long tail is not in this repository.
 */
export const LEGACY_HOST = "geo-scanner.ccie13192.com";

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
export const CONTACT_EMAIL = "services@llmention-geo.com";

/**
 * The seller's name and postal address, for the pages a buyer and a payment reviewer both read.
 *
 * WHY THIS IS READ FROM THE ENVIRONMENT RATHER THAN WRITTEN HERE: OPERATIONS.md records the
 * constraint - an Impressum, or a withdrawal notice that is actually addressable, needs a postal
 * address, and anything committed to this repository is published whether or not a page renders it.
 * The value is set as a deployment variable named OPERATOR_IDENTITY, so the repository keeps no
 * address and the published page still prints one. It is empty when unconfigured, and /refund/ then
 * says where the identity is given rather than printing a blank line.
 */
export const OPERATOR_IDENTITY = (process.env.OPERATOR_IDENTITY ?? "").trim();
