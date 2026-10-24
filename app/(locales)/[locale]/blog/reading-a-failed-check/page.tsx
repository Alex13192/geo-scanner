import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import ChineseReadingAFailedCheckPage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseReadingAFailedCheckPage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/<locale>/blog/reading-a-failed-check/` - "How to read a failed check", in Chinese
 * and Japanese.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a route can only be written once. Writing
 * the Japanese essay into this file would have deleted the Chinese essay that already ranks
 * for this URL; shipping only Chinese would leave the Japanese entry in the sitemap and in
 * the hreflang pair pointing at a 404. So the route stays a dispatcher and each language's
 * body lives beside it, in `zh.tsx` and `ja.tsx`.
 *
 * WHY IT DISPATCHES INSTEAD OF RENDERING BOTH. Both bodies render their own LocaleHeader /
 * LocaleFooter and their own `<main>`; rendering one inside the other would nest two page
 * chrome layers. `dynamicParams = false` plus `notFound()` means the only renderable URLs are
 * the two below - `/es/blog/reading-a-failed-check/` and its siblings stay 404s rather
 * than becoming half-translated copies of the essay.
 *
 * METADATA READS THE SAME STRINGS THE BODY PRINTS. Both title/description pairs are exported
 * by the body modules and imported here, so the canonical can never describe a page whose
 * visible heading says something else - and the Chinese pair is the exact pair the page
 * printed before it moved into `zh.tsx`.
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
 * and the only complete one. This is the same three-language set the English essay and the
 * sitemap declare.
 */
const LANGUAGES: Record<string, string> = {
  en: "/blog/reading-a-failed-check/",
  "zh-Hans": "/zh/blog/reading-a-failed-check/",
  ja: "/ja/blog/reading-a-failed-check/",
  "x-default": "/blog/reading-a-failed-check/",
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
        canonical: "/ja/blog/reading-a-failed-check/",
        languages: LANGUAGES,
      },
      /* A dated, bylined essay rather than an index or a tool page. */
      ...social({
        title: JA_TITLE,
        description: JA_DESCRIPTION,
        url: "/ja/blog/reading-a-failed-check/",
        type: "article",
      }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/blog/reading-a-failed-check/",
        languages: LANGUAGES,
      },
      ...social({
        title: ZH_TITLE,
        description: ZH_DESCRIPTION,
        url: "/zh/blog/reading-a-failed-check/",
        type: "article",
      }),
    };
  }

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function ReadingAFailedCheckPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseReadingAFailedCheckPage />;
  if (locale === "ja") return <JapaneseReadingAFailedCheckPage />;

  notFound();
}
