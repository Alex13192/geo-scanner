import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";
import ChineseNineHomepagesPage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseNineHomepagesPage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/<locale>/blog/nine-homepages-never-answered/` - the nine-homepages essay, in Chinese
 * and Japanese.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a route can only be written once. Turning
 * this file into a Japanese page would have deleted the Chinese essay that already ranks for
 * this URL, and shipping only Chinese would leave the Japanese essay in the sitemap pointing
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
 * visible heading says something else. `en`, `zh-Hans` and `ja` are declared on both, with
 * `x-default` at English because it is the source version and the only complete one.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  /* Both languages, because one route serves both. Returning only one would 404 the other. */
  return [{ locale: "zh" }, { locale: "ja" }];
}

const insight = getInsight("nine-homepages-never-answered");

/** Built from the slug, because a second literal would drift from the registry one day. */
const EN_PATH = insightPath(insight.slug);
const ZH_PATH = `/zh${EN_PATH}`;
const JA_PATH = `/ja${EN_PATH}`;

/**
 * hreflang, shared by both returned metadata objects.
 *
 * Every translation is declared on every page, including the one being rendered: an hreflang
 * pair has to be reciprocal. This is the same map the English article already publishes.
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

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function NineHomepagesNeverAnsweredPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseNineHomepagesPage />;
  if (locale === "ja") return <JapaneseNineHomepagesPage />;

  notFound();
}
