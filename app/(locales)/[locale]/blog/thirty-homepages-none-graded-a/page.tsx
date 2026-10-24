import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";
import ChineseThirtyHomepagesPage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseThirtyHomepagesPage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/blog/thirty-homepages-none-graded-a/` - the 30-homepage study, in Chinese and Japanese.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a URL pattern can only be written once.
 * Turning this file into a Japanese article would have deleted the Chinese write-up that is
 * already published, linked from the Chinese archive and claimed by the sitemap; shipping only
 * Chinese would leave the Japanese alternate pointing at a 404. So the route stays a dispatcher
 * and each language's body lives beside it, in `zh.tsx` and `ja.tsx`.
 *
 * WHY IT DISPATCHES INSTEAD OF RENDERING BOTH. Both bodies render their own LocaleHeader /
 * LocaleFooter, their own `<main>`, their own title band, byline, FAQ, sources, author card and
 * related links; rendering one inside the other would nest two page chrome layers.
 * `dynamicParams = false` plus `notFound()` means the only renderable URLs are the two below -
 * `/es/...`, `/de/...` and `/fr/...` stay 404s rather than becoming half-translated copies.
 *
 * METADATA READS THE SAME STRINGS THE BODY PRINTS. Both title/description pairs are exported by
 * the body modules and imported here, so the canonical, the hreflang matrix and the visible
 * heading cannot describe different pages. The Chinese pair is the pair this route shipped
 * before the split, unchanged; the date and the reading time still come from the registry.
 *
 * WHY THE CHINESE CANONICAL IS BUILT FROM THE REGISTRY SLUG: a second literal path would drift
 * from `lib/insights.ts` the day the slug changed, and a canonical pointing at a 404 is the one
 * metadata mistake that takes the page out of the index.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  /* Both languages, because one route serves both. Returning only one would 404 the other. */
  return [{ locale: "zh" }, { locale: "ja" }];
}

const insight = getInsight("thirty-homepages-none-graded-a");

/** Built from the slug, because a second literal would drift from the registry one day. */
const EN_PATH = insightPath(insight.slug);
const ZH_PATH = `/zh${EN_PATH}`;
const JA_PATH = `/ja${EN_PATH}`;

/**
 * hreflang, shared by both returned metadata objects.
 *
 * Every translation is declared on every page, including the one being rendered: an hreflang
 * pair has to be reciprocal. `x-default` points at English because it is the source version and
 * the only complete one.
 */
const LANGUAGES: Record<string, string> = {
  en: EN_PATH,
  "zh-Hans": ZH_PATH,
  ja: JA_PATH,
  "x-default": EN_PATH,
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
        canonical: ZH_PATH,
        languages: LANGUAGES,
      },
      ...social({
        title: ZH_TITLE,
        description: ZH_DESCRIPTION,
        url: ZH_PATH,
        type: "article",
      }),
    };
  }

  if (locale === "ja") {
    return {
      title: JA_TITLE,
      description: JA_DESCRIPTION,
      alternates: {
        canonical: JA_PATH,
        languages: LANGUAGES,
      },
      ...social({
        title: JA_TITLE,
        description: JA_DESCRIPTION,
        url: JA_PATH,
        type: "article",
      }),
    };
  }

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function ThirtyHomepagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseThirtyHomepagesPage />;
  if (locale === "ja") return <JapaneseThirtyHomepagesPage />;

  notFound();
}
