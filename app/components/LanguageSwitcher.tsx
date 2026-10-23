import Link from "next/link";
import { HTML_LANG, LOCALE_LABELS, LOCALES, homePath, type Locale } from "@/lib/i18n/config";

/**
 * The language switcher.
 *
 * CSS-only (`details`/`summary`), like the navigation: the site ships no client JavaScript
 * for chrome, and a language switch is a navigation, not a state change.
 *
 * `target` decides which page the reader lands on in the chosen language. On the homepage it
 * is the homepage; on the pricing page it is that locale's pricing page, because sending
 * somebody who was reading prices back to a hero is a downgrade they did not ask for.
 */
export default function LanguageSwitcher({
  current,
  label,
  target = homePath,
}: {
  current: Locale;
  label: string;
  target?: (locale: Locale) => string;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]">
        <span className="opacity-70">{label}</span>
        <span>{LOCALE_LABELS[current]}</span>
        <span aria-hidden="true" className="text-[10px] opacity-60">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-1.5 shadow-2xl">
        {LOCALES.map((locale) => (
          <Link
            key={locale}
            href={target(locale)}
            hrefLang={HTML_LANG[locale]}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-2)] ${
              locale === current ? "font-semibold text-[var(--ink-1)]" : "text-[var(--ink-2)]"
            }`}
          >
            {LOCALE_LABELS[locale]}
          </Link>
        ))}
      </div>
    </details>
  );
}
