import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedHome from "@/app/components/LocalizedHome";
import {
  PREFIXED_LOCALES,
  homePath,
  isPrefixedLocale,
  languageAlternates,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";
import { BRAND_FULL } from "@/lib/site";

/**
 * `/<locale>/` - the localized homepage.
 *
 * Only home and pricing claim hreflang at this phase; the deep documentation is still
 * English, and pointing hreflang at a page that is not actually translated would be the
 * half-built translation the site has already withdrawn once.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    alternates: {
      canonical: homePath(locale),
      languages: languageAlternates(homePath),
    },
    ...social({
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
      url: homePath(locale),
    }),
  };
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", name: BRAND_FULL },
  };

  return (
    <>
      <LocalizedHome locale={locale} dict={dict} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
