import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import ChineseLlmsTxtEvidencePage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseLlmsTxtEvidencePage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/zh/insights/llms-txt-what-the-evidence-supports/` and
 * `/ja/insights/llms-txt-what-the-evidence-supports/` - the llms.txt explainer, in two
 * languages.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a route can only be written once. Turning
 * this file into a Japanese page would have deleted the Chinese explainer that already exists
 * for this URL, and shipping only Chinese would leave the Japanese URL in the sitemap pointing
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
 * visible heading says something else. The Chinese pair is the one the page shipped with, so
 * `/zh/...` is unchanged.
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
  en: "/insights/llms-txt-what-the-evidence-supports/",
  "zh-Hans": "/zh/insights/llms-txt-what-the-evidence-supports/",
  ja: "/ja/insights/llms-txt-what-the-evidence-supports/",
  "x-default": "/insights/llms-txt-what-the-evidence-supports/",
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
        canonical: "/ja/insights/llms-txt-what-the-evidence-supports/",
        languages: LANGUAGES,
      },
      ...social({
        title: JA_TITLE,
        description: JA_DESCRIPTION,
        url: "/ja/insights/llms-txt-what-the-evidence-supports/",
        type: "article",
      }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/insights/llms-txt-what-the-evidence-supports/",
        languages: LANGUAGES,
      },
      ...social({
        title: ZH_TITLE,
        description: ZH_DESCRIPTION,
        url: "/zh/insights/llms-txt-what-the-evidence-supports/",
        type: "article",
      }),
    };
  }

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function LlmsTxtEvidencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseLlmsTxtEvidencePage />;
  if (locale === "ja") return <JapaneseLlmsTxtEvidencePage />;

  notFound();
}
