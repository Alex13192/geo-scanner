import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import ChineseInsightsIndexPage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseInsightsIndexPage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/<locale>/blog/` - the writing archive, in Chinese and Japanese.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a URL pattern can only be written once.
 * Turning this file into a Japanese archive would have deleted the Chinese one, which is
 * already linked from the sitemap and from every Chinese article; shipping only Chinese would
 * leave the Japanese archive the sitemap claims pointing at a 404. So the route stays a
 * dispatcher and each language's body lives beside it, in `zh.tsx` and `ja.tsx`.
 *
 * WHY IT DISPATCHES INSTEAD OF RENDERING BOTH. Both bodies render their own LocaleHeader /
 * LocaleFooter and their own `<main>`; rendering one inside the other would nest two page
 * chrome layers. `dynamicParams = false` plus `notFound()` means the only renderable URLs are
 * the two below - `/es/...` and `/fr/...` stay 404s rather than becoming half-translated
 * copies of the archive.
 *
 * METADATA READS THE SAME STRINGS THE BODY PRINTS. The title and description pairs are
 * exported by the body modules and imported here, so a canonical can never describe a page
 * whose visible heading says something else. The Chinese pair is the pair this route shipped
 * before the split, unchanged.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  /* Both languages, because one route serves both. Returning only one would 404 the other. */
  return [{ locale: "zh" }, { locale: "ja" }];
}

/**
 * hreflang, shared by both returned metadata objects.
 *
 * Every translation is declared on every page, including the one being rendered: an hreflang
 * pair has to be reciprocal. `x-default` points at English because it is the source version
 * and the only complete one.
 */
const LANGUAGES: Record<string, string> = {
  en: "/blog/",
  "zh-Hans": "/zh/blog/",
  ja: "/ja/blog/",
  "x-default": "/blog/",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/blog/",
        languages: LANGUAGES,
        types: { "application/rss+xml": "/blog/rss.xml" },
      },
      /* No `type: "article"`: an archive is a list, not a dated piece. The English index omits
         it for the same reason. */
      ...social({ title: ZH_TITLE, description: ZH_DESCRIPTION, url: "/zh/blog/" }),
    };
  }

  if (locale === "ja") {
    return {
      title: JA_TITLE,
      description: JA_DESCRIPTION,
      alternates: {
        canonical: "/ja/blog/",
        languages: LANGUAGES,
        types: { "application/rss+xml": "/blog/rss.xml" },
      },
      ...social({ title: JA_TITLE, description: JA_DESCRIPTION, url: "/ja/blog/" }),
    };
  }

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function InsightsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseInsightsIndexPage />;
  if (locale === "ja") return <JapaneseInsightsIndexPage />;

  notFound();
}
