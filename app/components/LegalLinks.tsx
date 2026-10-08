/**
 * The links that every review process looks for: a reachable privacy policy, the
 * terms, and a way to make contact.
 *
 * A fourth belonged here and went away with the paid audit: the withdrawal notice
 * a site owes consumers in the EU and the UK before they are bound. It came back
 * on 2026-10-08 with the measurement report, which put something on sale again -
 * as /refund/, where the notice is one section rather than a separate document,
 * because the person deciding whether to pay should not have to find a second page
 * reading the same contract. /withdrawal/ itself stays deleted and still redirects
 * from middleware.ts.
 *
 * PRICING IS IN THIS LIST FOR A REASON THAT IS NOT LEGAL EITHER: a price a visitor
 * cannot reach is not a price, and this array is the only footer that every page
 * renders. The page was an orphan for exactly one build after it was restored -
 * reachable from the sitemap and from /refund/, and from nowhere a person clicks.
 *
 * Kept as one component on purpose. This site renders more than ten separate
 * footers by hand, which is exactly how /privacy/ and /terms/ once went missing
 * while another page was already promising a policy that had no page behind it:
 * nothing forced the pages and the links to agree. Adding a route now costs one
 * array entry here.
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
  { href: "/pricing/", label: "Pricing" },
  { href: "/privacy/", label: "Privacy policy" },
  { href: "/terms/", label: "Terms" },
  { href: "/refund/", label: "Refunds" },
  { href: "/contact/", label: "Contact" },
] as const;

export default function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Legal and contact"
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${className}`.trim()}
    >
      {LINKS.map((link) => (
        <a key={link.href} href={link.href} className="hover:text-[var(--ink-1)] transition-colors">
          {link.label}
        </a>
      ))}
    </nav>
  );
}
