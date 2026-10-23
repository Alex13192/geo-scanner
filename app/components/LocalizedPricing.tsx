import Link from "next/link";
import BuyButton from "@/app/components/BuyButton";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pricingPath, type NonDefaultLocale } from "@/lib/i18n/config";
import { PRODUCTS, formatUsd } from "@/lib/pricing";

/**
 * The localized pricing page.
 *
 * Prices and product ids come from lib/pricing.ts, not from the dictionary: a translation is
 * allowed to change words, never numbers. The names, taglines and feature lists do come from
 * the dictionary, because they are copy rather than configuration.
 */
export default function LocalizedPricing({
  locale,
  dict,
}: {
  locale: NonDefaultLocale;
  dict: Dictionary;
}) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dict.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale={locale} dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              {dict.nav.pricing}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
              {dict.pricing.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              {dict.pricing.lead}
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-20">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
              <h2 className="text-lg font-semibold">{dict.pricing.freeTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                {dict.pricing.freeLine}
              </p>
              <Link
                href="/#scan"
                hrefLang="en"
                className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:opacity-75"
              >
                {dict.hero.primaryCta} →
              </Link>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {PRODUCTS.map((product) => {
                const copy = dict.pricing.products[product.id];
                return (
                  <section
                    key={product.id}
                    className="flex flex-col rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] p-7"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-xl font-semibold">{copy.name}</h2>
                      <p className="text-3xl font-semibold tracking-tight">
                        {formatUsd(product.priceUsd)}
                        <span className="ml-1 text-xs font-normal text-[var(--ink-3)]">
                          USD
                        </span>
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                      {copy.tagline}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-relaxed text-[var(--ink-2)]">
                      {copy.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span aria-hidden="true" className="text-[var(--ok)]">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <BuyButton productId={product.id} label={dict.pricing.buyCta} />
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="mt-8 space-y-2 text-xs leading-relaxed text-[var(--ink-3)]">
              <p>{dict.pricing.delivery}</p>
              <p>{dict.pricing.currencyNote}</p>
              <p>{dict.pricing.fallback}</p>
              <p>{dict.footer.legal}</p>
            </div>
          </div>
        </section>

        <section className="band band--alt">
          <div className="wrap py-14 md:py-20">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">{dict.faq.title}</h2>
            <dl className="mt-8 space-y-6">
              {dict.faq.items.map((item) => (
                <div key={item.q}>
                  <dt className="text-base font-semibold">{item.q}</dt>
                  <dd className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ink-2)]">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm text-[var(--ink-2)]">
              <Link
                href={pricingPath("en")}
                hrefLang="en"
                className="text-[var(--accent)] hover:opacity-75"
              >
                Pricing in English →
              </Link>
            </p>
          </div>
        </section>
      </main>

      <LocaleFooter locale={locale} dict={dict} target={pricingPath} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
