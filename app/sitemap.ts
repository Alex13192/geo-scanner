import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { CHECK_CATALOG, DIMENSION_CATALOG } from '@/lib/geo/catalog';

/**
 * Bump this date whenever you meaningfully change page content.
 * Do NOT use `new Date()` here - that makes every page look
 * "freshly modified" on every deploy, which search engines learn to ignore.
 *
 * THIS CONSTANT WENT STALE AND THE DESIGN WAS NOT THE PROBLEM. It sat at 2026-10-02
 * through a week of real content changes - the tools index, the clause skeleton on
 * every rule page, the homepage facts band, the citation corrections - and by the time
 * anyone looked, Search Console was reporting 27 rule pages as "Discovered - currently
 * not indexed" while the sitemap told Google nothing on the site had changed since the
 * 2nd. A uniform, never-moving lastmod is worse than no lastmod: an engine that learns
 * the field is fiction stops reading it, and the field then costs the site the one
 * signal it was added to send. The rule for a date nobody can forget to bump is a test
 * that fails when content has moved and this has not - until that exists, the discipline
 * is manual, so: any commit that changes `app/` or `lib/` content is a commit that
 * changes this line.
 */
const LAST_MODIFIED = new Date('2026-10-07');

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
      /* The index of everything else: the four tools, the rule reference, the dimensions, the
         method and the guides, grouped by the question a reader arrives with. High priority
         because it is an entry point to the other fifty-odd URLs rather than a destination in
         its own right - and because a site with this many indexable pages needs one hub that
         lists them. */
      url: `${SITE_URL}/tools/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
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
      /* The self-check method. Priority matches the other guides rather than leading, because it is
         long-tail content: it earns its place by answering a question people type into a search box
         or an AI assistant, not by being linked from the homepage. */
      url: `${SITE_URL}/docs/ai-visibility-self-check/`,
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
      /* The answer checker. Same priority as the studio: a page people arrive on directly, and the
         one that shows what the guide is describing. */
      url: `${SITE_URL}/answer-check/`,
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
      /* The weekly-report signup. Listed rather than hidden: it is a page people arrive on
         from a newsletter or a link, and the one page on the site whose job is conversion
         rather than explanation. */
      url: `${SITE_URL}/monitor/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/methodology/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    /* Legal and contact.
       These pages are thin by nature, which is why they carry a low priority,
       but they are the ones an AdSense reviewer looks for first.
       /pricing/, /refund/ and /withdrawal/ were listed here until the paid audit
       was withdrawn. They are deleted rather than listed, and they 301 to "/" from
       middleware.ts, because they were published and may be indexed. */
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
    /* One page per scoring dimension, generated from the same catalog the scanner scores
       against - so a dimension cannot exist in the engine without a page explaining it. */
        ...DIMENSION_CATALOG.map((dimension) => ({
      /*
       * Delegates to a template literal rather than being written out, so the origin comes from
       * lib/site.ts and the id comes from the catalog. Both are single sources of truth and
       * scripts/check-values.mjs refuses a second copy of the origin anywhere under app/.
       */
      url: SITE_URL + '/dimensions/' + dimension.id + '/',
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),    /* The rule reference: the hub, then one page per rule. */
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
