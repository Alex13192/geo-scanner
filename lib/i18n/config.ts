/**
 * The site's locales, declared once.
 *
 * WHY THIS FILE EXISTS: `app/(en)/` was the only locale, and the site's hreflang check was
 * marked not-applicable because of it. Adding languages means four things must agree in
 * every place: the URL prefix, the `<html lang>`, the hreflang matrix, and the sitemap.
 * Declaring them here means a locale cannot be added to one and forgotten in another - and
 * `scripts/check-i18n.mts` fails the build when a locale has no page or a language map is
 * incomplete.
 *
 * WHY THE DEFAULT LOCALE HAS NO PREFIX: English stays at `/`, `/pricing/`, and so on. The
 * other five live under `/<code>/`. That is the same subdirectory decision the site already
 * made for the language switcher: a subdomain would be a separate site for ranking purposes,
 * while a subdirectory keeps the authority on one origin.
 */

export const LOCALES = ["en", "zh", "ja", "es", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export type NonDefaultLocale = Exclude<Locale, "en">;

/** Locales served under a prefix. English is the unprefixed default. */
export const PREFIXED_LOCALES: NonDefaultLocale[] = ["zh", "ja", "es", "de", "fr"];

/**
 * The name of each locale in its own language, which is what a switcher should show.
 * Not "Chinese"/"Japanese" - a reader looking for their language scans for 中文, not for
 * the English word for it.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

/** `<html lang>` values. `zh-Hans` is the honest tag for the simplified Chinese copy. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
  ja: "ja",
  es: "es",
  de: "de",
  fr: "fr",
};

export function isPrefixedLocale(value: string): value is NonDefaultLocale {
  return (PREFIXED_LOCALES as string[]).includes(value);
}

/** The homepage for a locale. Used by hreflang, the switcher and the sitemap. */
export function homePath(locale: Locale): string {
  return locale === "en" ? "/" : `/${locale}/`;
}

/** The pricing page for a locale. Only pages with a real translation may claim hreflang. */
export function pricingPath(locale: Locale): string {
  return locale === "en" ? "/pricing/" : `/${locale}/pricing/`;
}

/**
 * The `alternates.languages` map for a page that IS translated in every locale.
 *
 * `x-default` points at English: a crawler that cannot pick a locale should land on the
 * source language, which is also the only complete version of the deep documentation.
 */
export function languageAlternates(
  page: (locale: Locale) => string
): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((locale) => [HTML_LANG[locale], page(locale)])),
    "x-default": page("en"),
  };
}
