import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import ChineseLlmsTxtDeploymentPage, { ZH_DESCRIPTION, ZH_TITLE } from "./zh";
import JapaneseLlmsTxtDeploymentPage, { JA_DESCRIPTION, JA_TITLE } from "./ja";

/**
 * `/<locale>/docs/llms-txt-deployment/` - "How to Generate and Deploy an llms.txt File", in
 * Chinese and in Japanese.
 *
 * WHY ONE ROUTE FILE AND TWO BODIES. A `[locale]` segment has exactly one `page.tsx`, so
 * `/zh/docs/llms-txt-deployment/` and `/ja/docs/llms-txt-deployment/` are the same route and the
 * language has to be chosen inside it. Writing a Japanese page here would therefore delete the
 * Chinese guide rather than sit next to it. The two bodies live in `./zh.tsx` (the existing Chinese
 * page, moved verbatim) and `./ja.tsx` (the Japanese translation of the English page); this file
 * owns the metadata for both and picks one. `zh` and `ja` are the only locales `generateStaticParams`
 * returns and anything else calls `notFound()`, so no renderable URL is added beyond the two.
 *
 * WHY `generateMetadata` AND NOT `export const metadata`: the title, description, canonical and
 * hreflang pair all depend on the `[locale]` param, and a static object cannot see it. A route
 * segment may export one or the other, never both.
 *
 * WHY THE CHINESE TITLE AND DESCRIPTION ARE IMPORTED RATHER THAN RETYPED. `zh.tsx` renders the same
 * two strings as its `<h1>` and lead paragraph. Copying them here would let the `<title>` and the
 * page drift apart on the next edit - and the Chinese text is the one thing this change must leave
 * exactly as it was, which is easier to verify when it exists once.
 *
 * THE HREFLANG MATRIX IS MUTUAL. Both pages declare en, zh-Hans, ja and an English x-default, which
 * is what the English page already claims for this pair. The Japanese page also claims `ja`, so the
 * three-language set has to agree on every one of the three pages.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  /* 中国語版は既存のまま残す。日本語版だけを返すと `/zh/docs/llms-txt-deployment/` が 404 になる。 */
  return [{ locale: "zh" }, { locale: "ja" }];
}

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
        canonical: "/ja/docs/llms-txt-deployment/",
        /* 3 言語すべてを宣言する。x-default は英語（唯一の完全版）を指す。 */
        languages: {
          en: "/docs/llms-txt-deployment/",
          "zh-Hans": "/zh/docs/llms-txt-deployment/",
          ja: "/ja/docs/llms-txt-deployment/",
          "x-default": "/docs/llms-txt-deployment/",
        },
      },
      ...social({
        title: JA_TITLE,
        description: JA_DESCRIPTION,
        url: "/ja/docs/llms-txt-deployment/",
        type: "article",
      }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/docs/llms-txt-deployment/",
        /* ja を足すのは、日本語版がこのページを ja として宣言しているためである。
           hreflang は相互でなければ片側だけの宣言になる。 */
        languages: {
          en: "/docs/llms-txt-deployment/",
          "zh-Hans": "/zh/docs/llms-txt-deployment/",
          ja: "/ja/docs/llms-txt-deployment/",
          "x-default": "/docs/llms-txt-deployment/",
        },
      },
      ...social({
        title: ZH_TITLE,
        description: ZH_DESCRIPTION,
        url: "/zh/docs/llms-txt-deployment/",
        type: "article",
      }),
    };
  }

  return {};
}

export default async function LlmsTxtDeploymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale === "zh") return <ChineseLlmsTxtDeploymentPage />;
  if (locale === "ja") return <JapaneseLlmsTxtDeploymentPage />;
  notFound();
}
