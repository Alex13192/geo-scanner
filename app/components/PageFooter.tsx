import LegalLinks from "@/app/components/LegalLinks";

/**
 * The footer every page should use.
 *
 * WHY THIS EXISTS: the footer was written out by hand fourteen times, and the two
 * ways that went wrong are both visible in the old copies.
 *
 * First, four of them had no year at all - /methodology/, /docs/, /docs/<slug>/
 * via ArticleShell, and /pricing/ - so the scanner's own copyright-year check
 * failed on exactly those four routes and passed on the rest. The rule looks for
 * the current calendar year in the visible text, which is a rule this site
 * publishes and scores other people against. /pricing/ went with the paid audit
 * (see OPERATIONS.md), so three of the four remain.
 *
 * Second, the ten that did carry a year had `2026` typed in as a literal. That is
 * not a bug today and it becomes ten bugs on 1 January 2027, silently, on pages
 * nobody will think to check - which is the same failure mode LegalLinks was
 * created to stop ("this site renders more than ten separate footers by hand,
 * which is exactly how /privacy/ and /terms/ went missing").
 *
 * The year is read at build time. That is the correct behaviour here and it is
 * not the same case as dateModified in the root layout: there, a fresh date on
 * every deploy would teach a consumer that the date means nothing. Here the year
 * genuinely is the year the site was published, and a rebuild refreshes it.
 *
 * Width stays a prop because the pages are genuinely different widths - a
 * /docs/ article is narrow, the scanner shell is wide - and a prop with five
 * allowed values is cheaper than five components. The classes are spelled out in
 * full because Tailwind cannot see a constructed name like `max-w-${width}`.
 */
type Width = "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

const WIDTH_CLASS: Record<Width, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

type PageFooterProps = {
  width?: Width;
  /** "LLMention" on the site, "LLMention Knowledge Base" under /docs/. */
  brand?: string;
  align?: "center" | "start";
};

export default function PageFooter({
  width = "3xl",
  brand = "LLMention",
  align = "center",
}: PageFooterProps) {
  return (
    <footer
      className={`${WIDTH_CLASS[width]} mx-auto px-6 mt-20 pt-6 border-t border-[var(--line)] text-xs text-[var(--ink-3)] ${
        align === "center" ? "text-center" : ""
      }`}
    >
      <LegalLinks className={align === "center" ? "mb-3" : "mb-3 justify-start"} />
      <p>
        © {new Date().getFullYear()} {brand}. Brand Generative Engine Optimization Intelligence.
      </p>
      {/*
        The AI Agents Directory badge. It is here because their free listing tier requires it:
        the paid tiers ($19-$499) skip it, and paying for a listing to avoid an outbound link
        would be paying to buy a link, which is the thing search engines discount. The trade is
        explicit and small - one badge in the footer, one followed link back - and it is placed
        here rather than anywhere prominent because it is a condition of a free listing, not
        something this site wants to say about itself.

        A plain <img>, not next/image: the asset is an external SVG, next/image does not optimise
        SVG, and pointing it at a third-party host would additionally require that host in
        next.config.ts remotePatterns. Their snippet is used as given, including rel="noopener"
        and a followed link, because an unfollowed one does not satisfy the requirement.
      */}
      <a
        href="https://aiagentsdirectory.com/agent/llmention"
        target="_blank"
        rel="noopener"
        title="Discover LLMention on AI Agents Directory"
        className="inline-block mt-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://aiagentsdirectory.com/featured-badge.svg?v=2024"
          alt="LLMention - Featured on AI Agents Directory"
          width={200}
          height={50}
          loading="lazy"
          decoding="async"
        />
      </a>
    </footer>
  );
}
