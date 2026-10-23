import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedPricing from "@/app/components/LocalizedPricing";
import {
  PREFIXED_LOCALES,
  isPrefixedLocale,
  languageAlternates,
  pricingPath,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/<locale>/pricing/` - the localized pricing page.
 *
 * This page is the second half of the pair that claims hreflang. The prices themselves come
 * from lib/pricing.ts so a translated page cannot quote a different number than the English
 * one, and the buy button posts to the same checkout endpoint with the same product ids.
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
    title: dict.meta.pricingTitle,
    description: dict.meta.pricingDescription,
    alternates: {
      canonical: pricingPath(locale),
      languages: languageAlternates(pricingPath),
    },
    ...social({
      title: dict.meta.pricingTitle,
      description: dict.meta.pricingDescription,
      url: pricingPath(locale),
    }),
  };
}

export default async function LocalizedPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return <LocalizedPricing locale={locale} dict={dict} />;
}
