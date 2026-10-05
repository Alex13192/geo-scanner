import type { ReactNode } from "react";
import PageFooter from "@/app/components/PageFooter";
import SiteNav from "@/app/components/SiteNav";

/**
 * The shell for the site's prose routes.
 *
 * WHY THIS EXISTS: eight files carried the same chrome written out by hand -
 * about, methodology, privacy, terms, contact, study, the check index and the
 * per-check template behind forty routes. They were the same down to the class
 * strings: the same `min-h-screen ... pb-20` wrapper, the same sticky header
 * with a `max-w-3xl` inner, the same `main.max-w-3xl.mx-auto.px-6.pt-12`, the
 * same eyebrow-chip / h1 / description stack. That is the failure this codebase
 * already names twice - PageFooter says "the footer was written out by hand
 * fourteen times", LegalLinks says "this site renders more than ten separate
 * footers by hand" - and the eight copies had drifted exactly as predicted: two
 * different intro spacings, three different h1 sizes, one page with a purple
 * chip and the rest blue.
 *
 * WHAT IT FIXES BEYOND THE DUPLICATION:
 *
 *   The title used to sit inside the prose column on a background of the same
 *   colour. At 1920px that left 576px of identical pixels on each side - 60% of
 *   the screen - with nothing marking where the column stopped, so the margin
 *   read as dead space. The title now lives in its own .band--alt band that
 *   spans the viewport, which is what makes the remaining margin legible as a
 *   margin. See ArticleShell for the same change on /docs/<slug>/.
 *
 *   The sticky header widened from max-w-3xl to .wrap and picked up the
 *   --nav-bg token, so its geometry matches the homepage's SiteNav and the
 *   docs header.
 *
 * The prose column does NOT get wider. 768px at 16-17px is around 70
 * characters, already at the top of the comfortable measure; widening it would
 * trade a perceived emptiness for a real reading problem.
 */
type ProsePageProps = {
  /**
   * Small chip above the title. Optional because the check index has no
   * category - it is the index of all of them.
   */
  eyebrow?: ReactNode;
  title: ReactNode;
  /**
   * Intro copy under the title, as nodes rather than a string: several callers
   * need two paragraphs or inline markup here. The wrapper carries the type
   * scale and inter-paragraph spacing, so the caller passes plain <p> elements.
   */
  description?: ReactNode;
  /** A dated or otherwise small meta line, e.g. "Last updated October 2026". */
  meta?: ReactNode;
  /** The single action on the right of the header. */
  action: { href: string; label: string };
  /**
   * "4xl" is for the pages whose body is mostly wide tables rather than
   * running text - /study/ and nothing else today.
   */
  width?: "3xl" | "4xl";
  /** Forwarded to PageFooter, which has to stay in step with the column. */
  footerWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  footerBrand?: string;
  children: ReactNode;
};

const PROSE_WIDTH = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
} as const;

export default function ProsePage({
  eyebrow,
  title,
  description,
  meta,
  action,
  width = "3xl",
  footerWidth,
  footerBrand,
  children,
}: ProsePageProps) {
  const column = PROSE_WIDTH[width];

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] selection:bg-blue-500 selection:text-white font-sans">
      <SiteNav />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className={`mx-auto ${column} space-y-4`}>
              {/* The page's own back-link, moved here from the header this shell used to
                  carry by hand. It is page-specific - "back to the scanner", "all guides" - so
                  it belongs with the page rather than in navigation shared by 47 routes. */}
              <a
                href={action.href}
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                {action.label}
              </a>
              {eyebrow ? (
                <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                  {eyebrow}
                </span>
              ) : null}
              {/*
                font-semibold, not the font-black these carried: three of the
                eight had also drifted to a different size, and the 900 weight
                was the loudest "generated" signal on the site.
              */}
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {title}
              </h1>
              {description ? (
                <div className="space-y-3 text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                  {description}
                </div>
              ) : null}
              {meta ? <p className="font-mono text-xs text-[var(--ink-3)]">{meta}</p> : null}
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              `reveal-stagger` is a no-op in three cases and that is deliberate: JavaScript is
              disabled, the browser has no scroll-driven animations, or the reader asked for
              reduced motion. In all three the children render normally - see the note on the rule
              in globals.css, where the failure mode is stated as the reason for the two guards.
            */}
            <div className={`reveal-stagger mx-auto ${column}`}>{children}</div>
          </div>
        </section>
      </main>

      <PageFooter width={footerWidth ?? width} brand={footerBrand} />
    </div>
  );
}
