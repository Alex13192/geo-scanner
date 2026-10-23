import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import JaDocsPage from "./ja";
import ZhDocsPage from "./zh";

/**
 * `/<locale>/docs/` - the guides hub, dispatched by locale.
 *
 * WHY THIS IS A DISPATCHER AND NOT A PAGE: `/zh/docs/` and `/ja/docs/` are one route file. A
 * Japanese page written directly here would have replaced the Chinese index rather than joined
 * it, because there is exactly one `page.tsx` per route segment. The two bodies therefore live
 * in sibling modules (`zh.tsx`, `ja.tsx`) that are not routes - Next only treats `page`, `layout`,
 * `route` and the other named conventions as segments - and this file keeps the pieces that
 * cannot live inside either body: the static params, the per-locale canonical and hreflang, and
 * the locale guard.
 *
 * WHY THE METADATA MOVED HERE: `generateMetadata` and a `metadata` export are mutually exclusive
 * in one segment, and the Chinese page used the static export. One function now returns either
 * locale's block, so the Chinese title and description are kept byte for byte while the Japanese
 * pair is added beside them.
 *
 * WHY `languages` LISTS ALL THREE: the docs hub exists in English, Chinese and Japanese. Listing
 * only the current locale's pair would tell a crawler the other translations do not exist, and
 * that is the half-built hreflang this site already withdrew once. Guides that are still
 * English-only are not claimed here - this is the index, and its own translation is complete.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "ja" }];
}

/* The Chinese pair is unchanged from the static metadata this route shipped before the split. */
const ZH_TITLE = "GEO 指南：llms.txt、JSON-LD 与 AI 爬虫访问";
const ZH_DESCRIPTION =
  "部署 /llms.txt、为 AI 引用撰写问答式标题、添加 Schema.org JSON-LD，以及解除 AI 爬虫访问限制的分步指南。";

const JA_TITLE = "GEO ガイド：llms.txt、JSON-LD、AI クローラーアクセス";
const JA_DESCRIPTION =
  "llms.txt の配置、AI 引用に向けた Q&A 形式の見出し、Schema.org JSON-LD の追加、AI クローラー制限の解除を手順ごとに解説します。";

/** The docs hub's hreflang matrix: three translations plus x-default pointing at the source. */
const DOCS_LANGUAGES = {
  en: "/docs/",
  "zh-Hans": "/zh/docs/",
  ja: "/ja/docs/",
  "x-default": "/docs/",
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
        canonical: "/zh/docs/",
        languages: DOCS_LANGUAGES,
      },
      ...social({ title: ZH_TITLE, description: ZH_DESCRIPTION, url: "/zh/docs/" }),
    };
  }

  if (locale === "ja") {
    return {
      title: JA_TITLE,
      description: JA_DESCRIPTION,
      alternates: {
        canonical: "/ja/docs/",
        languages: DOCS_LANGUAGES,
      },
      ...social({ title: JA_TITLE, description: JA_DESCRIPTION, url: "/ja/docs/" }),
    };
  }

  /* Unreachable through generateStaticParams; returning {} keeps this a pure function of params. */
  return {};
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ZhDocsPage />;
  if (locale === "ja") return <JaDocsPage />;

  notFound();
}
