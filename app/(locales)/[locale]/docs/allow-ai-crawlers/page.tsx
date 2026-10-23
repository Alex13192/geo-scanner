import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import ChineseAllowAiCrawlersPage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseAllowAiCrawlersPage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/<locale>/docs/allow-ai-crawlers/` - the crawler-access guide, in Chinese and Japanese.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a route can only be written once. Turning
 * this file into a Japanese page would have deleted the Chinese guide that already ranks for
 * this URL, and shipping only Chinese would leave the Japanese guide in the sitemap pointing
 * at a 404. So the route stays a dispatcher and each language's body lives beside it, in
 * `zh.tsx` and `ja.tsx`.
 *
 * WHY IT DISPATCHES INSTEAD OF RENDERING BOTH. Both bodies render their own LocaleHeader /
 * LocaleFooter and their own `<main>`; rendering one inside the other would nest two page
 * chrome layers. `dynamicParams = false` plus `notFound()` means the only renderable URLs are
 * the two below - `/es/...` and `/fr/...` stay 404s rather than becoming half-translated
 * copies of an English article.
 *
 * METADATA READS THE SAME STRINGS THE BODY PRINTS. Both title/description pairs are exported
 * by the body modules and imported here, so the canonical can never describe a page whose
 * visible heading says something else.
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
 * pair has to be reciprocal, and x-default points at English because it is the source version
 * and the only complete one.
 */
const LANGUAGES: Record<string, string> = {
  en: "/docs/allow-ai-crawlers/",
  "zh-Hans": "/zh/docs/allow-ai-crawlers/",
  ja: "/ja/docs/allow-ai-crawlers/",
  "x-default": "/docs/allow-ai-crawlers/",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "ja") {
    return {
      title: JA_TITLE,
      description: JA_DESCRIPTION,
      alternates: {
        canonical: "/ja/docs/allow-ai-crawlers/",
        languages: LANGUAGES,
      },
      ...social({
        title: JA_TITLE,
        description: JA_DESCRIPTION,
        url: "/ja/docs/allow-ai-crawlers/",
        type: "article",
      }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/docs/allow-ai-crawlers/",
        languages: LANGUAGES,
      },
      ...social({
        title: ZH_TITLE,
        description: ZH_DESCRIPTION,
        url: "/zh/docs/allow-ai-crawlers/",
        type: "article",
      }),
    };
  }

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function AllowAiCrawlersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseAllowAiCrawlersPage />;
  if (locale === "ja") return <JapaneseAllowAiCrawlersPage />;

  notFound();
}
