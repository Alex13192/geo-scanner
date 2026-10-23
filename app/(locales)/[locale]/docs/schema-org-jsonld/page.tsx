import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { social } from "@/lib/og";
import ChineseSchemaOrgJsonLdPage, {
  DESCRIPTION as ZH_DESCRIPTION,
  TITLE as ZH_TITLE,
} from "./zh";
import JapaneseSchemaOrgJsonLdPage, {
  DESCRIPTION as JA_DESCRIPTION,
  TITLE as JA_TITLE,
} from "./ja";

/**
 * `/<locale>/docs/schema-org-jsonld/` - the entity-markup guide, in Chinese and Japanese.
 *
 * WHY ONE ROUTE AND TWO BODIES. `/zh/...` and `/ja/...` are the same route file: there is one
 * `page.tsx` under `app/(locales)/[locale]/`, and a route can only be written once. Turning this
 * file into a Japanese page would have deleted the Chinese guide that already ranks for this URL,
 * and shipping only Chinese would leave the Japanese guide in the sitemap pointing at a 404. So
 * the route stays a dispatcher and each language's body lives beside it, in `zh.tsx` (the Chinese
 * page, moved without editing) and `ja.tsx` (the Japanese translation of the English article).
 *
 * WHY IT DISPATCHES INSTEAD OF RENDERING BOTH. Both bodies render their own LocaleHeader /
 * LocaleFooter and their own `<main>`; rendering one inside the other would nest two page chrome
 * layers. `dynamicParams = false` plus `notFound()` means the only renderable URLs are the two
 * below - `/es/...` and `/fr/...` stay 404s rather than becoming half-translated copies of an
 * English article.
 *
 * WHY `generateMetadata` AND NOT `export const metadata`: the title, description, canonical and
 * hreflang set all depend on the `[locale]` param, and a static object cannot see it. A route
 * segment may export one or the other, never both.
 *
 * METADATA READS THE SAME STRINGS THE BODY PRINTS. Both title/description pairs are exported by
 * the body modules and imported here, so the canonical can never describe a page whose visible
 * heading says something else - and the Chinese strings are the ones this route already
 * published, not retyped copies of them.
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
 * and the only complete one. The English page already claims `ja` for this slug.
 */
const LANGUAGES: Record<string, string> = {
  en: "/docs/schema-org-jsonld/",
  "zh-Hans": "/zh/docs/schema-org-jsonld/",
  ja: "/ja/docs/schema-org-jsonld/",
  "x-default": "/docs/schema-org-jsonld/",
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
        canonical: "/ja/docs/schema-org-jsonld/",
        languages: LANGUAGES,
      },
      ...social({
        title: JA_TITLE,
        description: JA_DESCRIPTION,
        url: "/ja/docs/schema-org-jsonld/",
        type: "article",
      }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/docs/schema-org-jsonld/",
        languages: LANGUAGES,
      },
      ...social({
        title: ZH_TITLE,
        description: ZH_DESCRIPTION,
        url: "/zh/docs/schema-org-jsonld/",
        type: "article",
      }),
    };
  }

  /* Unreachable while dynamicParams is false; stated so the fallback is not a silent 200. */
  return {};
}

export default async function SchemaOrgJsonLdPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "zh") return <ChineseSchemaOrgJsonLdPage />;
  if (locale === "ja") return <JapaneseSchemaOrgJsonLdPage />;

  notFound();
}
