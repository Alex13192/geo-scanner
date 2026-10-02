import type { MetadataRoute } from 'next';

/**
 * Canonical site origin.
 * Change this in ONE place if the domain ever changes.
 */
const SITE_URL = 'https://geo-scanner.ccie13192.com';

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
 * NOTE ON /report/
 * The scan result page is user-specific and thin content. It is deliberately
 * NOT listed here, and is disallowed in robots.txt.
 *
 * NOTE ON THE GUIDES
 * The four guides live at their own URLs rather than as cards on /docs/.
 * Each one targets a distinct long-tail query and is independently rankable.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
      // Declared as a pair: hreflang has to be reciprocal, and a sitemap entry
      // that names an alternate without that alternate naming it back is the
      // most common way this markup gets ignored.
      alternates: {
        languages: {
          en: `${SITE_URL}/`,
          de: `${SITE_URL}/de/`,
        },
      },
    },
    {
      url: `${SITE_URL}/de/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${SITE_URL}/`,
          de: `${SITE_URL}/de/`,
        },
      },
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
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
      url: `${SITE_URL}/llms-txt-studio/`,
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
      url: `${SITE_URL}/readiness-badge/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
