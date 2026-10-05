import { BRAND } from "@/lib/site";

/**
 * The site's top navigation.
 *
 * WHY THIS IS NEW: the site had no navigation at all. Every route carried a
 * one-line header with a brand mark and a single back link, so a reader who
 * landed on the homepage could not reach /methodology/, /llms-txt-studio/ or the
 * guides without scrolling to the footer - and the pages that publish the
 * scoring method, which are the pages that make the score believable, were the
 * hardest ones to find.
 *
 * The translucent sticky surface is the one place on this site that needs a
 * partly transparent colour, which is why --nav-bg exists as a token rather than
 * being written as `bg-white/80` here: an opacity modifier cannot be applied to
 * a var() colour in Tailwind, so a token is the only way to keep it themeable.
 *
 * It is used by the homepage. The other routes still carry their own single-line
 * headers, and that is a deliberate stopping point rather than an oversight:
 * those headers are inside twenty different layout shells, and replacing them is
 * a separate change from the theme and the homepage.
 */
const LINKS = [
  /*
   * First, because it is the only entry here with a job beyond explaining something. The weekly
   * report is where a visitor who has read enough becomes a subscriber, so it belongs ahead of
   * the four links that answer questions rather than ask for anything.
   *
   * It arrives in the same change as the cron worker that makes the page true. Before that, this
   * link would have pointed at a promise nothing kept - see the note in app/(en)/monitor/page.tsx.
   */
  { href: "/monitor/", label: "Weekly report" },
  { href: "/llms-txt-studio/", label: "llms.txt studio" },
  { href: "/methodology/", label: "Methodology" },
  { href: "/docs/", label: "Guides" },
  { href: "/study/", label: "Study" },
  { href: "/checks/", label: "All 40 checks" },
];

export default function SiteNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--nav-bg)] backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="wrap flex h-[52px] items-center gap-8">
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <span
            aria-hidden="true"
            className="grid h-6 w-6 place-items-center rounded-[7px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-[11px] font-black text-white"
          >
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--ink-1)]">
            {BRAND}
          </span>
        </a>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#scan"
          className="ml-auto shrink-0 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-85 lg:ml-0"
        >
          Run a free scan
        </a>
      </div>
    </header>
  );
}
