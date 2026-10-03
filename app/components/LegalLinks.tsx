/**
 * The links that every review process looks for: a reachable privacy policy, the
 * terms, and a way to make contact. AdSense reviewers, payment providers and
 * directory reviewers all check for these before anything else, and a footer is
 * where they look.
 *
 * Kept as one component on purpose. This site renders more than ten separate
 * footers by hand, which is exactly how /privacy/ and /terms/ went missing while
 * the pricing page was already promising a refund policy: nothing forced the
 * pages and the links to agree. Adding a route now costs one array entry here.
 *
 * Two of the German entries are German-language pages (Impressum,
 * Widerrufsrecht); the rest are English-only, so each link carries its own
 * `lang` rather than the whole row being marked. Claiming hrefLang="en" on the
 * Impressum would be a false statement about a German page.
 */
type LegalLink = {
  href: string;
  label: string;
  /** Set only when the target is in a different language than the page. */
  lang?: "en";
};

type LegalLinksProps = {
  /**
   * "de" switches to the German set, which adds the two pages German law
   * requires and labels the English-only ones "(EN)".
   */
  locale?: "en" | "de";
  className?: string;
};

const LINKS: Record<"en" | "de", readonly LegalLink[]> = {
  en: [
    { href: "/privacy/", label: "Privacy policy" },
    { href: "/terms/", label: "Terms" },
    { href: "/contact/", label: "Contact" },
  ],
  de: [
    { href: "/de/impressum/", label: "Impressum" },
    { href: "/de/widerrufsrecht/", label: "Widerrufsrecht" },
    { href: "/privacy/", label: "Datenschutz (EN)", lang: "en" },
    { href: "/terms/", label: "AGB (EN)", lang: "en" },
    { href: "/contact/", label: "Kontakt (EN)", lang: "en" },
  ],
};

export default function LegalLinks({ locale = "en", className = "" }: LegalLinksProps) {
  return (
    <nav
      aria-label={locale === "de" ? "Rechtliches und Kontakt" : "Legal and contact"}
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${className}`.trim()}
    >
      {LINKS[locale].map((link) => (
        <a
          key={link.href}
          href={link.href}
          hrefLang={link.lang}
          className="hover:text-gray-300 transition-colors"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
