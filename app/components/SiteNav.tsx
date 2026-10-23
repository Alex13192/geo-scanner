import { BRAND } from "@/lib/site";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import {
  BadgeCheck,
  BarChart3,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Code,
  FileText,
  GitCompareArrows,
  Info,
  LayoutGrid,
  Library,
  ListChecks,
  Mail,
  MessageCircle,
  MessageSquareText,
  PenLine,
  SearchCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/**
 * The site's top navigation.
 *
 * WHY THIS IS NEW: the site had no navigation at all. Every route carried a one-line header with
 * a brand mark and a single back link, so a reader who landed on the homepage could not reach
 * /methodology/, /llms-txt-studio/ or the guides without scrolling to the footer - and the pages
 * that publish the scoring method, which are the pages that make the score believable, were the
 * hardest ones to find.
 *
 * WHY THE PANELS ARE CSS-ONLY. There is no `use client` here and no state: the panel opens on
 * `group-hover` and on `group-focus-within`, so it does exactly what a menu should do and costs
 * no JavaScript. `group-focus-within` is not a nicety - it is the whole keyboard story. Tabbing
 * to the trigger puts focus inside the group, the panel appears, and tabbing onward walks its
 * links; a hover-only menu is invisible to anyone not using a mouse.
 *
 * WHY THE ITEMS CARRY DESCRIPTIONS. Five bare words in a row ask a visitor to already know what
 * /study/ is. A line under each one answers that before they click, which is the difference
 * between a menu and a list of filenames - and it is the model the sites this one is measured
 * against use.
 *
 * TYPE SIZES WENT UP HERE, deliberately and further than the old values. 13px links in a 52px bar
 * read as a utility strip; the bar is 64px now, links are 15px, and the panel copy is 14px with
 * 15px headings. Small type is the cheapest way to look unfinished, and it was reported as exactly
 * that.
 */

type Item = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type Group = {
  key: string;
  label: string;
  /** Optional plain link, for the one entry in a group that is also a destination. */
  href?: string;
  items: Item[];
};

const GROUPS: Group[] = [
  {
    key: "tools",
    label: "Tools",
    items: [
      {
        href: "/tools/",
        label: "All tools and references",
        description: "Every free tool, every rule page and the method, grouped by what you need.",
        icon: LayoutGrid,
      },
      {
        /*
         * Second rather than last: this is the one tool that works on an answer a visitor
         * already has, so it is reachable to somebody who has not decided to scan a site
         * yet - which is most of the traffic that arrives asking whether AI mentions them.
         */
        href: "/answer-check/",
        label: "Answer checker",
        description: "Paste an AI answer and see whether it names, recommends and cites you.",
        icon: MessageSquareText,
      },
      {
        href: "/monitor/",
        label: "Weekly report",
        description: "The same 40 checks, re-run every Monday, emailed as a diff.",
        icon: Mail,
      },
      {
        href: "/llms-txt-studio/",
        label: "llms.txt studio",
        description: "Build an llms.txt file and preview exactly what an AI engine reads.",
        icon: FileText,
      },
      {
        href: "/readiness-badge/",
        label: "Readiness badge",
        description: "An embeddable badge showing a site's current GEO score.",
        icon: BadgeCheck,
      },
      {
        /*
         * The API has been public since launch and documented nowhere on the site; an
         * external audit named that as a developer-facing gap. It belongs with the tools
         * rather than with the method pages because it is the same product in JSON form.
         */
        href: "/api-docs/",
        label: "Scan API",
        description: "The free JSON endpoint behind every scan: parameters, limits, examples.",
        icon: Code,
      },
    ],
  },
  {
    key: "learn",
    label: "Learn",
    items: [
      {
        href: "/methodology/",
        label: "Methodology",
        description: "Every rule, its weight, and why the score is what it is.",
        icon: BookOpen,
      },
      {
        href: "/docs/",
        label: "Guides",
        description: "Setup instructions for robots.txt, llms.txt, schema and headings.",
        icon: Library,
      },
      {
        href: "/study/",
        label: "Study",
        description: "What the checks measured across a set of well-known sites.",
        icon: BarChart3,
      },
      {
        /*
         * The page that answers "why should I believe the score" with this site's own
         * result rather than a claim about it. It sits beside Study because both are
         * evidence rather than method, and it is reachable here rather than only from
         * the homepage panel so a reader comparing tools can find it.
         */
        href: "/self-audit/",
        label: "Self-audit",
        description: "This site scored by its own scanner, with the evidence behind every check.",
        icon: SearchCheck,
      },
      {
        /*
         * Comparison sits in Learn rather than beside the tools because it is not a
         * product: a reader arrives deciding which measurement they need, the same
         * question /methodology/ answers about the score. It is also the page the
         * DataForSEO confusion sends people to, so it has to be reachable from the
         * top navigation rather than only from a footer link.
         */
        href: "/compare/",
        label: "Compare",
        description: "Which measurement you need, and how readiness differs from mention tracking.",
        icon: GitCompareArrows,
      },
      {
        /*
         * Writing was added with /insights/ on 2026-10-18. It is in Learn rather than beside
         * the tools because the archive is not a product: a reader arrives there to decide
         * whether to trust the measurement, not to run one.
         */
        href: "/insights/",
        label: "Writing",
        description: "What the study found, and where the method is weaker than it looks.",
        icon: PenLine,
      },
      {
        href: "/checks/",
        label: "All 40 checks",
        description: "The reference: what each rule looks for and what passes it.",
        icon: ListChecks,
      },
    ],
  },
  {
    /*
     * Company holds the pages about WHO is behind the site - accountability and the contact
     * route - and deliberately not Pricing. Pricing is a top-level link (below) because it is
     * the paid offer and has to be reachable without opening a menu; keeping a copy inside
     * this group made the same two links appear twice in one row, which is what a reader
     * notices first and what the "duplicate About and Pricing" fix removed.
     */
    key: "company",
    label: "Company",
    items: [
      {
        href: "/about/",
        label: "About",
        description: "Who runs LLMention, how it is funded, and what it deliberately does not do.",
        icon: Info,
      },
      {
        href: "/author/",
        label: "Author",
        description: "The person accountable for the measurements and the writing.",
        icon: UserRound,
      },
      {
        href: "/contact/",
        label: "Contact",
        description: "One monitored address for corrections, data requests and quotes.",
        icon: MessageCircle,
      },
    ],
  },
];

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--nav-bg)] backdrop-blur-xl backdrop-saturate-150">
      {/*
        The announcement strip. It sits inside the sticky header rather than above it so the two
        travel together, and it carries the one sentence a first-time visitor needs before they
        know what GEO is.

        WHAT THE STRIP SAYS IS THE PRODUCT'S ACTUAL PROMISE, NOT THE ONE THAT SOUNDS BIGGER. It
        used to read "See where you rank in AI search", which this scanner cannot do: it never
        ranks or tracks mentions, it fetches a page the way a crawler would and reports whether
        that page can be crawled, parsed and cited. A first visitor meets this line before any
        explanation, so an overstatement here is both the easiest claim to disprove and the one
        that makes everything below it look like the same kind of marketing.
      */}
      <div className="bg-[var(--accent)] text-[var(--on-accent)]">
        <div className="wrap flex h-10 items-center justify-center gap-2.5 text-[13.5px]">
          <span className="opacity-90">Check whether AI can crawl, read and cite your site</span>
          <a href="/#scan" className="group inline-flex items-center gap-1 font-semibold">
            Get a free report
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      <div className="wrap flex h-[64px] items-center gap-9">
        <a href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-[8px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-[12px] font-black text-white"
          >
            L
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-[var(--ink-1)]">
            {BRAND}
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {GROUPS.map((group) => (
            /*
             * `group` on the wrapper is what makes the panel work without JavaScript:
             * group-hover covers the pointer and group-focus-within covers the keyboard, and
             * both are on the same element so either one opens it.
             */
            <div key={group.key} className="group relative">
              <a
                href={group.items[0].href}
                aria-haspopup="true"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)] group-focus-within:text-[var(--ink-1)] group-hover:text-[var(--ink-1)]"
              >
                {group.label}
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
                  aria-hidden="true"
                />
              </a>

              {/*
                `pt-2` rather than a margin: a gap between the trigger and the panel breaks the
                hover before the pointer reaches the panel, which is the classic way a CSS menu
                feels broken.
              */}
              <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-[26rem] rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-2.5 shadow-2xl">
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-start gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)]"
                      >
                        <item.icon className="h-[18px] w-[18px] text-[var(--ink-2)]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium text-[var(--ink-1)]">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[14px] leading-snug text-[var(--ink-3)]">
                          {item.description}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/*
            ABOUT IS NOT REPEATED HERE. It lives in the Company group with Author and Contact,
            which is where a reader looking for "who runs this" already goes. The top-level row
            used to carry both About and Pricing while the Company panel carried copies of both,
            so the same two words appeared twice in one row - the duplication this row now
            avoids. Pricing stays top-level: it is the paid offer and must not need a menu.
          */}
          <a
            href="/pricing/"
            className="rounded-full px-3.5 py-2 text-[15px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            Pricing
          </a>
        </nav>

        {/*
          Two calls to action, secondary first. One button asks a visitor to decide between acting
          and leaving; two let them pick which action, which is what every site this is measured
          against does. The filled one keeps the accent; the outline one is a real destination
          rather than decoration, so it is not hidden.
        */}
        <div className="ml-auto flex shrink-0 items-center gap-2.5 lg:ml-0">
          {/*
            The language switcher points at the localized home from any English page. That is
            the honest behaviour while the deep pages are English: switching from /study/ to
            中文 lands on a page that is actually fully translated, rather than on an
            untranslated mirror that would make the switcher a lie.
          */}
          <LanguageSwitcher current="en" label="Language" />
          <a
            href="/monitor/"
            className="hidden rounded-full border border-[var(--line)] px-4 py-2.5 text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--ink-3)] hover:text-[var(--ink-1)] sm:inline-block"
          >
            Weekly report
          </a>
          {/*
            scale rather than opacity, because a button that fades reads as disabled and a button
            that grows reads as ready. The active state is slightly smaller than rest, so a click
            feels like a press.
          */}
          <a
            href="/#scan"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--on-accent)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Run a free scan
          </a>
        </div>
      </div>
    </header>
  );
}
