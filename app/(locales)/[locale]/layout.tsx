import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { ADSENSE_SCRIPT_SRC } from "@/lib/ads";
import { HTML_LANG, PREFIXED_LOCALES, isPrefixedLocale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";

/**
 * The root layout for the five prefixed locales.
 *
 * WHY A SEPARATE ROOT LAYOUT RATHER THAN ONE `[locale]` LAYOUT UNDER A SINGLE ROOT: the whole
 * site was already a root layout inside the `(en)` route group, and Next renders `<html>`
 * there. Adding a language that must set `<html lang>` therefore needs its own root layout -
 * two route groups, each owning its document. The `[locale]` segment keeps that to three
 * files instead of fifteen.
 *
 * WHY `dynamicParams = false`: only the five declared locales are valid. Without it, `/xx/`
 * would render a page with `lang="xx"` and a dictionary lookup that cannot succeed, which is
 * a 200 response for a URL that should be a 404 - the class of bug that gets a site indexed
 * under URL permutations nobody wrote.
 */
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LLMention GEO Scanner",
    template: "%s | LLMention",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const lang = isPrefixedLocale(locale) ? HTML_LANG[locale] : "en";

  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <script async src={ADSENSE_SCRIPT_SRC} crossOrigin="anonymous" />
        {children}
      </body>
    </html>
  );
}
