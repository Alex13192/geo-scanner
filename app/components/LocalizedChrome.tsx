import Link from "next/link";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pricingPath, type NonDefaultLocale } from "@/lib/i18n/config";
import { AUTHOR } from "@/lib/author";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Header and footer for the localized pages.
 *
 * WHY NOT SiteNav: the navigation groups are English strings that would need translating
 * before a Chinese reader could use them, and the deep pages they link to are English in this
 * phase. A localized reader gets a small, fully translated header that goes where it says -
 * and the footer states plainly that the documentation is English, instead of letting them
 * find out one click later.
 */
export function LocaleHeader({
  locale,
  dict,
}: {
  locale: NonDefaultLocale;
  dict: Dictionary;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--nav-bg)] backdrop-blur-xl backdrop-saturate-150">
      <div className="bg-[var(--accent)] text-[var(--on-accent)]">
        <div className="wrap flex h-9 items-center justify-center text-center text-[12.5px] opacity-95">
          {dict.hero.eyebrow}
        </div>
      </div>
      <div className="wrap flex h-[62px] items-center gap-6">
        <Link href={`/${locale}/`} className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-[8px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-[12px] font-black text-white"
          >
            L
          </span>
          <span className="text-[16px] font-semibold tracking-tight text-[var(--ink-1)]">
            LLMention
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          <Link
            href={`/${locale}/`}
            className="rounded-full px-3 py-2 text-[14.5px] text-[var(--ink-2)] hover:text-[var(--ink-1)]"
          >
            {dict.nav.home}
          </Link>
          <Link
            href={pricingPath(locale)}
            className="rounded-full px-3 py-2 text-[14.5px] text-[var(--ink-2)] hover:text-[var(--ink-1)]"
          >
            {dict.nav.pricing}
          </Link>
          <Link
            href="/docs/"
            hrefLang="en"
            className="rounded-full px-3 py-2 text-[14.5px] text-[var(--ink-2)] hover:text-[var(--ink-1)]"
          >
            {dict.nav.docs}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <LanguageSwitcher current={locale} label={dict.nav.language} />
          <Link
            href="/#scan"
            hrefLang="en"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-[13.5px] font-medium text-[var(--on-accent)] transition-transform hover:scale-[1.03]"
          >
            {dict.nav.scan}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LocaleFooter({
  locale,
  dict,
  target,
}: {
  locale: NonDefaultLocale;
  dict: Dictionary;
  target: (locale: import("@/lib/i18n/config").Locale) => string;
}) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-1)]">
      <div className="wrap flex flex-col gap-6 py-10 text-[13px] text-[var(--ink-3)] md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2">
          <p className="font-semibold text-[var(--ink-2)]">LLMention GEO Scanner</p>
          <p>{dict.footer.docsNote}</p>
          <p>{dict.footer.legal}</p>
          <p>
            © {new Date().getFullYear()} LLMention · {dict.footer.author}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <LanguageSwitcher current={locale} label={dict.nav.language} target={target} />
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--ink-1)]">
            {CONTACT_EMAIL}
          </a>
          <a href={AUTHOR.path} hrefLang="en" className="hover:text-[var(--ink-1)]">
            {AUTHOR.name}
          </a>
          <div className="flex gap-4">
            <a href="/pricing/" hrefLang="en" className="hover:text-[var(--ink-1)]">
              Pricing (EN)
            </a>
            <a href="/terms/" hrefLang="en" className="hover:text-[var(--ink-1)]">
              Terms (EN)
            </a>
            <a href="/privacy/" hrefLang="en" className="hover:text-[var(--ink-1)]">
              Privacy (EN)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
