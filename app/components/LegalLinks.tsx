/**
 * The links that every review process looks for: a reachable privacy policy, the
 * terms, a way to make contact, and - for a site that sells to consumers in the
 * EU or the UK - the withdrawal notice they are entitled to before they are
 * bound.
 *
 * Kept as one component on purpose. This site renders more than ten separate
 * footers by hand, which is exactly how /privacy/ and /terms/ went missing while
 * the pricing page was already promising a refund policy: nothing forced the
 * pages and the links to agree. Adding a route now costs one array entry here.
 *
 * This used to carry a German set as well. The German site was removed, so the
 * `locale` prop went with it rather than being left as a parameter with one
 * valid value.
 *
 * About is in this list for a reason that is not legal: the scanner's own
 * Trust & Authority dimension scores a page as failing `about-contact` unless its
 * hrefs include BOTH an about-style path and a contact-style path. Every footer
 * built from this component had the contact half and not the about half, so the
 * site was failing a check it had written itself. If you add a route here,
 * check whether a dimension looks for it first.
 */
const LINKS = [
  { href: "/about/", label: "About" },
  { href: "/privacy/", label: "Privacy policy" },
  { href: "/terms/", label: "Terms" },
  { href: "/withdrawal/", label: "Withdrawal" },
  { href: "/contact/", label: "Contact" },
] as const;

export default function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Legal and contact"
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${className}`.trim()}
    >
      {LINKS.map((link) => (
        <a key={link.href} href={link.href} className="hover:text-gray-300 transition-colors">
          {link.label}
        </a>
      ))}
    </nav>
  );
}
