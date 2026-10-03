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
 * NOTE ON HREFLANG
 * Alternates are declared in pairs. A sitemap entry that names an alternate
 * without that alternate naming it back is the most common reason hreflang is
 * ignored, so both directions are always written together below.
 *
 * NOTE ON /report/
 * The scan result page is user-specific and thin content. It is deliberately
 * NOT listed here, and is disallowed in robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    /* ---- English ---- */
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          en: `${SITE_URL}/`,
          de: `${SITE_URL}/de/`,
        },
      },
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
      alternates: {
        languages: {
          en: `${SITE_URL}/docs/`,
          de: `${SITE_URL}/de/docs/`,
        },
      },
    },
    {
      url: `${SITE_URL}/docs/llms-txt-deployment/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${SITE_URL}/docs/llms-txt-deployment/`,
          de: `${SITE_URL}/de/docs/llms-txt-erstellen/`,
        },
      },
    },
    {
      url: `${SITE_URL}/docs/allow-ai-crawlers/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${SITE_URL}/docs/allow-ai-crawlers/`,
          de: `${SITE_URL}/de/docs/gptbot-robots-txt/`,
        },
      },
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
      alternates: {
        languages: {
          en: `${SITE_URL}/llms-txt-studio/`,
          de: `${SITE_URL}/de/llms-txt-studio/`,
        },
      },
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
       first. English only: no `de` alternate is declared, because a hreflang
       entry pointing at a page that does not exist is worse than none. */
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
      url: `${SITE_URL}/contact/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },

    /* ---- German ---- */
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
      url: `${SITE_URL}/de/docs/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${SITE_URL}/docs/`,
          de: `${SITE_URL}/de/docs/`,
        },
      },
    },
    {
      url: `${SITE_URL}/de/docs/gptbot-robots-txt/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          en: `${SITE_URL}/docs/allow-ai-crawlers/`,
          de: `${SITE_URL}/de/docs/gptbot-robots-txt/`,
        },
      },
    },
    {
      url: `${SITE_URL}/de/docs/llms-txt-erstellen/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          en: `${SITE_URL}/docs/llms-txt-deployment/`,
          de: `${SITE_URL}/de/docs/llms-txt-erstellen/`,
        },
      },
    },
    {
      url: `${SITE_URL}/de/llms-txt-studio/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${SITE_URL}/llms-txt-studio/`,
          de: `${SITE_URL}/de/llms-txt-studio/`,
        },
      },
    },
  ];
}
