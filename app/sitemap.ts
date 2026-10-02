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
 * The canonical URL therefore has a trailing slash - keep it that way here.
 *
 * NOTE ON /report/
 * The scan result page is user-specific and thin content. It is deliberately
 * NOT listed here, and is disallowed in robots.txt.
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
      url: `${SITE_URL}/docs/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
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
  ];
}
