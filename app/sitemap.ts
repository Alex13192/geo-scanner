import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { CHECK_CATALOG, DIMENSION_CATALOG } from '@/lib/geo/catalog';
import { INSIGHTS, insightPath } from '@/lib/insights';
import { LOCALES, PREFIXED_LOCALES, homePath, pricingPath } from '@/lib/i18n/config';

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
const LAST_MODIFIED = new Date('2026-10-23');

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
 * equivalent - see proxy.ts, which is where those redirects actually live.
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
  /*
   * The hreflang matrix for a page that is translated in every locale, as ABSOLUTE URLs.
   * Next's metadata accepts site-relative paths, but sitemap alternates must be absolute, so
   * this is built separately from lib/i18n/config's helper rather than reusing it with a
   * metadataBase assumption.
   */
  const alternatesFor = (page: (locale: (typeof LOCALES)[number]) => string) => ({
    languages: Object.fromEntries(
      LOCALES.map((locale) => [locale === 'zh' ? 'zh-Hans' : locale, SITE_URL + page(locale)])
    ),
  });

  /*
   * The guides are translated into English and Chinese only so far. A six-language map here
   * would point at pages that do not exist - the half-built hreflang this site already
   * withdrew once - so the pair is built explicitly rather than reusing alternatesFor.
   */
  const docsAlternates = (slug: string) => ({
    languages: {
      en: `${SITE_URL}/docs${slug}/`,
      'zh-Hans': `${SITE_URL}/zh/docs${slug}/`,
      'x-default': `${SITE_URL}/docs${slug}/`,
    },
  });

  /* The writing is translated into English and Chinese only; same two-language map. */
  const insightsAlternates = (slug: string) => ({
    languages: {
      en: `${SITE_URL}/insights${slug}/`,
      'zh-Hans': `${SITE_URL}/zh/insights${slug}/`,
      'x-default': `${SITE_URL}/insights${slug}/`,
    },
  });

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: alternatesFor(homePath),
    },
    {
      url: `${SITE_URL}/study/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    /* Comparisons. Listed individually rather than as a hub-only entry because each one answers
       a different question and each is the kind of page a generative answer cites: "X vs Y" and
       "should I use X or Y" are asked directly. The hub is the entry point; the two detail pages
       are destinations. */
    {
      url: `${SITE_URL}/compare/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/compare/llm-mentions-api/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/compare/readiness-vs-mention-tracking/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      /* The index of everything else: the tools, the rule reference, the dimensions, the
         method and the guides, grouped by the question a reader arrives with. High priority
         because it is an entry point to the other fifty-odd URLs rather than a destination in
         its own right - and because a site with this many indexable pages needs one hub that
         lists them. The count used to read "the four tools" and stopped being true when the
         index grew; the comment now names the groups rather than a number nobody maintains. */
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
      alternates: docsAlternates(""),
    },
    ...["llms-txt-deployment", "allow-ai-crawlers", "qa-style-headings", "schema-org-jsonld", "ai-visibility-self-check"].map(
      (slug) => ({
        url: `${SITE_URL}/docs/${slug}/`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly' as const,
        priority: slug === "llms-txt-deployment" || slug === "allow-ai-crawlers" ? 0.8 : 0.7,
        alternates: docsAlternates(`/${slug}`),
      })
    ),
    {
      url: `${SITE_URL}/zh/docs/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: docsAlternates(""),
    },
    ...["llms-txt-deployment", "allow-ai-crawlers", "qa-style-headings", "schema-org-jsonld", "ai-visibility-self-check"].map(
      (slug) => ({
        url: `${SITE_URL}/zh/docs/${slug}/`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly' as const,
        priority: slug === "llms-txt-deployment" || slug === "allow-ai-crawlers" ? 0.7 : 0.6,
        alternates: docsAlternates(`/${slug}`),
      })
    ),
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
      /* The API reference. It is developer documentation rather than a landing page, so the
         priority matches the guides; it exists so the endpoint is discoverable by search and
         by the crawler that reads this sitemap, not only by someone who saw the README. */
      url: `${SITE_URL}/api-docs/`,
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
      /* The site's own measurement, published at a URL a crawler may read.
         The homepage already presents its score as evidence, but links the detail at
         /report/, which is noindex and disallowed in robots.txt because it is a
         user-specific, per-request tool output - so the evidence itself was invisible
         to the engines it is aimed at. This page is the indexable statement of the
         recorded measurement; the record behind it is re-measured by the self-audit
         workflow, which is why the page is worth listing as fresh content. Priority
         matches the other trust pages rather than leading: it is evidence, not an
         entry point. */
      url: `${SITE_URL}/self-audit/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    /* The writing. Listed individually rather than as an index-only entry because each piece
       is a standalone answer to a question nobody else has measured, and the archive page is
       the entry point to them rather than a destination in its own right. Generated from
       lib/insights.ts, so a piece that is published but missing here would have to be missing
       from the archive index too - the two read the same array. */
    {
      url: `${SITE_URL}/insights/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: insightsAlternates(''),
    },
    ...INSIGHTS.map((insight) => ({
      url: SITE_URL + insightPath(insight.slug),
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: insightsAlternates(`/${insight.slug}`),
    })),
    {
      url: `${SITE_URL}/zh/insights/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: insightsAlternates(''),
    },
    ...INSIGHTS.map((insight) => ({
      url: `${SITE_URL}/zh/insights/${insight.slug}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: insightsAlternates(`/${insight.slug}`),
    })),
    /* The author page. Priority low because it is not what anyone searches for, listed because
       it is the page a reader follows from a byline to decide whether to trust the writing -
       and an unreachable accountability page is the shape of one that does not exist. */
    {
      url: `${SITE_URL}/author/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/about/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    /* Legal and contact.
       These pages are thin by nature, which is why they carry a low priority,
       but they are the ones an AdSense reviewer looks for first - and /pricing/ and
       /refund/ are the two a payment reviewer opens.
       THEY CAME BACK ON 2026-10-08 with the measurement report: the site sells
       something again, so a price and a refund policy now describe work that is
       actually run. Both were 301s to "/" from proxy.ts while nothing was for
       sale, and they are listed here again rather than left as redirects - an
       indexed redirect to the homepage is not an answer to "how much does this
       cost". /withdrawal/ stayed deleted: the consumer withdrawal notice is folded
       into /refund/, and its URL still redirects. */
    {
      url: `${SITE_URL}/pricing/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: alternatesFor(pricingPath),
    },
    {
      url: `${SITE_URL}/refund/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
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
    /* One Chinese page per rule, paired with its English page. Only these two languages are
       translated, so the alternates map stays two languages rather than the six the home and
       pricing pages claim. */
    ...CHECK_CATALOG.filter((check) => !check.alias).map((check) => ({
      url: `${SITE_URL}/zh/checks/${check.id}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
      alternates: {
        languages: {
          en: `${SITE_URL}/checks/${check.id}/`,
          'zh-Hans': `${SITE_URL}/zh/checks/${check.id}/`,
          'x-default': `${SITE_URL}/checks/${check.id}/`,
        },
      },
    })),
    ...CHECK_CATALOG.filter((check) => !check.alias).map((check) => ({
      url: `${SITE_URL}/checks/${check.id}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: {
        languages: {
          en: `${SITE_URL}/checks/${check.id}/`,
          'zh-Hans': `${SITE_URL}/zh/checks/${check.id}/`,
          'x-default': `${SITE_URL}/checks/${check.id}/`,
        },
      },
    })),
    /*
     * The first deep page with a real translation. Only English and Chinese are declared,
     * because the other four locales do not have this page yet; a full six-language map
     * would be the half-built translation the site already withdrew once.
     */
    {
      url: `${SITE_URL}/zh/methodology/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: {
        languages: {
          en: `${SITE_URL}/methodology/`,
          'zh-Hans': `${SITE_URL}/zh/methodology/`,
          'x-default': `${SITE_URL}/methodology/`,
        },
      },
    },
    {
      url: `${SITE_URL}/zh/checks/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: {
        languages: {
          en: `${SITE_URL}/checks/`,
          'zh-Hans': `${SITE_URL}/zh/checks/`,
          'x-default': `${SITE_URL}/checks/`,
        },
      },
    },
    /*
     * The localized home and pricing pages, one entry per locale. They are the only pages with
     * a real translation in this phase, so they are the only ones whose sitemap entries carry
     * alternates. English is the x-default; every entry points at the same matrix, which is
     * what reciprocal hreflang requires.
     */
    ...PREFIXED_LOCALES.flatMap((locale) => [
      {
        url: SITE_URL + homePath(locale),
        lastModified: LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: alternatesFor(homePath),
      },
      {
        url: SITE_URL + pricingPath(locale),
        lastModified: LAST_MODIFIED,
        changeFrequency: 'yearly' as const,
        priority: 0.5,
        alternates: alternatesFor(pricingPath),
      },
    ]),
  ];
}
