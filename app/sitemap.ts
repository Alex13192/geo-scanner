import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { CHECK_CATALOG } from '@/lib/geo/catalog';

/**
 * Bump this date whenever you meaningfully change page content.
 * Do NOT use `new Date()` here - that makes every page look
 * "freshly modified" on every deploy, which search engines learn to ignore.
 */
const LAST_MODIFIED = new Date('2026-10-02');

/**
 * NOTE ON TRAILING SLASHES
 * next.config.ts sets `trailingSlash: true`, so `/docs` redirects to `/docs/`.
 * Canonical URLs therefore carry a trailing slash - keep it that way here.
 *
 * NOTE ON HREFLANG
 * There are none, and that is deliberate. This site was previously published in
 * English and German with paired alternates; the German half was removed. A
 * single-language site must not declare `languages` at all, because an alternate
 * that names a page which no longer exists tells search engines an alternate
 * exists and then fails to deliver it. /de/* now 301s to the English
 * equivalent - see middleware.ts, which is where those redirects actually live.
 * This comment used to point at public/_redirects; that file was removed once it
 * turned out not to run, and the pointer was left behind.
 *
 * NOTE ON /report/
 * The scan result page is user-specific and thin content. It is deliberately
 * NOT listed here, and is disallowed in robots.txt.
 *
 * NOTE ON /checks/
 * One page per published rule, generated from the catalogue rather than typed out,
 * so adding a check to lib/geo/catalog.ts cannot leave the sitemap behind. Priority
 * is low on purpose: these are reference pages that earn their traffic from the
 * report linking into them and from long-tail queries, not from the homepage.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/study/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/docs/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/docs/llms-txt-deployment/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/docs/allow-ai-crawlers/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/docs/qa-style-headings/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/docs/schema-org-jsonld/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/llms-txt-studio/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/readiness-badge/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/methodology/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/refund/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    /* Legal and contact.
       These pages are thin by nature, which is why they carry a low priority,
       but they are the ones an AdSense reviewer or a payment provider looks for
       first. /withdrawal/ is the notice EU and UK consumers are entitled to
       before they are bound, and it replaces the German Widerrufsbelehrung that
       this site used to carry. */
    {
      url: `${SITE_URL}/privacy/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/withdrawal/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    /* The rule reference: the hub, then one page per rule. */
    {
      url: `${SITE_URL}/checks/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...CHECK_CATALOG.filter((check) => !check.alias).map((check) => ({
      url: `${SITE_URL}/checks/${check.id}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
