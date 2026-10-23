import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { homePath, pricingPath, type NonDefaultLocale } from "@/lib/i18n/config";

/**
 * The localized homepage.
 *
 * WHY IT IS A COMPONENT AND NOT FIVE PAGE FILES: the five localized homepages say the same
 * six things in five languages. Duplicating the markup five times would mean five places to
 * fix a broken link - the drift this repository has a check for at the origin already.
 *
 * WHY IT IS SHORTER THAN THE ENGLISH HOMEPAGE: the English page carries the animated scan
 * console, the tool screenshots and the full FAQ. Those depend on English screenshot assets
 * and on copy that is still English-only; this page carries the promise, the method, the
 * study and the way to buy - which is what a reader in another language needs first, with a
 * clear link to the English documentation for depth.
 */
export default function LocalizedHome({
  locale,
  dict,
}: {
  locale: NonDefaultLocale;
  dict: Dictionary;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale={locale} dict={dict} />

      <main>
        <section className="band band-dark ambient">
          <div className="wrap py-20 text-center md:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              {dict.hero.eyebrow}
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              {dict.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {dict.hero.lead}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/#scan"
                hrefLang="en"
                className="rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--on-accent)] transition-transform hover:scale-[1.03]"
              >
                {dict.hero.primaryCta}
              </Link>
              <Link
                href={pricingPath(locale)}
                className="rounded-full border border-[var(--line)] px-7 py-3.5 text-sm font-semibold text-[var(--ink-1)] transition-colors hover:border-[var(--ink-3)]"
              >
                {dict.hero.secondaryCta}
              </Link>
            </div>
            <p className="mt-4 text-xs text-[var(--ink-3)]">{dict.pricing.freeLine}</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-16 md:py-20">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
              {dict.checks.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-2)]">
              {dict.checks.lead}
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {dict.checks.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-5 text-sm leading-relaxed text-[var(--ink-2)]"
                >
                  {bullet}
                </li>
              ))}
            </ul>
            {locale === "zh" ? (
              <p className="mt-6 text-sm">
                <Link
                  href="/zh/methodology/"
                  className="font-medium text-[var(--accent)] hover:opacity-75"
                >
                  方法论:GEO 分数是怎么算出来的 →
                </Link>
              </p>
            ) : null}
          </div>
        </section>

        <section className="band band--alt">
          <div className="wrap py-16 md:py-20">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
              {dict.evidence.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-2)]">
              {dict.evidence.lead}
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {dict.evidence.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6 text-center"
                >
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-3)]">
                    {stat.label}
                  </dt>
                  <dd className="mt-2 text-4xl font-semibold tracking-tight text-[var(--ink-1)]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/study/"
              hrefLang="en"
              className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:opacity-75"
            >
              {dict.footer.docsNote ? "Study (EN) →" : "→"}
            </Link>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-16 md:py-20">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-1)] p-8 md:p-12">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                {dict.scope.title}
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-2)]">
                {dict.scope.lead}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={pricingPath(locale)}
                  className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] transition-transform hover:scale-[1.03]"
                >
                  {dict.hero.secondaryCta}
                </Link>
                <Link
                  href={homePath("en")}
                  hrefLang="en"
                  className="text-sm font-medium text-[var(--accent)] hover:opacity-75"
                >
                  LLMention GEO Scanner (EN) →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale={locale} dict={dict} target={homePath} />
    </div>
  );
}
