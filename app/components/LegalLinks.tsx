/**
 * The three links that every review process looks for: a reachable privacy
 * policy, the terms, and a way to make contact. AdSense reviewers, payment
 * providers and directory reviewers all check for these before anything else,
 * and a footer is where they look.
 *
 * Kept as one component on purpose. This site renders eleven separate footers
 * by hand, which is exactly how /privacy/ and /terms/ went missing while the
 * pricing page was already promising a refund policy: nothing forced the pages
 * and the links to agree. Adding a route now costs one array entry here.
 *
 * The legal pages are English-only. The German pages therefore label the links
 * "(EN)" and mark them hrefLang="en", the same convention the German homepage
 * already uses for the English-only guides.
 */
type LegalLinksProps = {
  /**
   * "de" switches the labels to the German page's "(EN)" convention and marks
   * the links as pointing at English content. Defaults to the English labels.
   */
  locale?: "en" | "de";
  className?: string;
};

const LINKS = {
  en: [
    { href: "/privacy/", label: "Privacy policy" },
    { href: "/terms/", label: "Terms" },
    { href: "/contact/", label: "Contact" },
  ],
  de: [
    { href: "/privacy/", label: "Datenschutz (EN)" },
    { href: "/terms/", label: "AGB (EN)" },
    { href: "/contact/", label: "Kontakt (EN)" },
  ],
} as const;

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
          hrefLang={locale === "de" ? "en" : undefined}
          className="hover:text-gray-300 transition-colors"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
