import Link from "next/link";
import type { ReactNode } from "react";
import PageFooter from "@/app/components/PageFooter";
import Evidence, {
  type EvidenceSource,
  GEO_PRIMARY_QUOTE,
  GEO_PRIMARY_SOURCES,
} from "@/app/components/Evidence";
import Faq, { type FaqItem } from "@/app/components/Faq";

/**
 * Shared chrome for the long-form /docs/<slug> articles.
 *
 * This folder starts with an underscore, so Next.js treats it as private and
 * does not create a route for it.
 *
 * Body typography lives in app/globals.css under `.doc-article`, because
 * @tailwindcss/typography is not installed in this project.
 *
 * WHY THE TITLE IS IN ITS OWN FULL-WIDTH BAND: the article used to start with
 * its title inside the same 768px column as the prose, on a background of
 * exactly the same colour. Measured at 1920px that left 576px of identical
 * pixels on each side - 60% of the screen - and because nothing marked where the
 * column stopped, the eye read it as dead space rather than as a margin. It was
 * the widest expanse of nothing on the site, on four routes at once.
 *
 * The fix is not a wider prose column. 768px is already at the top of the
 * comfortable measure for 17px body text; making the lines longer would trade
 * one readability problem for another. What changes is that the title block now
 * sits in a `.band--alt` band spanning the viewport, so the colour steps at the
 * boundary and the remaining margin reads as deliberate. The sticky header
 * widened from max-w-3xl to .wrap for the same reason, and now carries the same
 * geometry as the homepage's SiteNav.
 *
 * NOTE THAT FOUR ARTICLES RENDER THROUGH THIS SHELL, so one edit here moves four
 * routes at once. That cuts both ways: it is the cheapest way to fix a rule, and
 * the easiest way to make four pages say the same thing. The evidence block below
 * is shared deliberately - every guide here rests on the same published research,
 * and the list lives in app/components/Evidence.tsx so it cannot drift from the
 * five top-level pages that cite the same four sources. `sources` and `faq` remain
 * props so an article can and should replace the defaults with something specific
 * to itself. `faq` is left undefined by default rather than filled with generic
 * questions, because four pages carrying the same Q&A is the definition of thin
 * content, which is the rule this is trying to satisfy in the first place.
 */

type ArticleShellProps = {
  category: string;
  title: string;
  description: string;
  readTime: string;
  updated: string;
  /** Replace with article-specific sources where you have them. */
  sources?: EvidenceSource[];
  /** Optional per-article Q&A. Omitted rather than filled with boilerplate. */
  faq?: { title: string; items: FaqItem[] };
  children: ReactNode;
};

export default function ArticleShell({
  category,
  title,
  description,
  readTime,
  updated,
  sources = GEO_PRIMARY_SOURCES,
  faq,
  children,
}: ArticleShellProps) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] selection:bg-blue-500 selection:text-white font-sans">
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--nav-bg)] backdrop-blur-xl backdrop-saturate-150">
        <div className="wrap flex h-[52px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-[7px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-[11px] font-black text-white"
            >
              L
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-[var(--ink-1)]">
              LLMention Docs
            </span>
          </Link>
          <Link
            href="/docs/"
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-1.5 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← All guides
          </Link>
        </div>
      </header>

      <main>
        {/* Full-bleed title band: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                {category}
              </span>
              {/*
                font-semibold rather than the font-black this used to carry, and
                a tighter tracking: a 900-weight headline with a per-sentence
                gradient was the loudest "generated" signal on the site, and
                Apple's own type never goes past 600.
              */}
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {title}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {description}
              </p>
              <p className="font-mono text-xs text-[var(--ink-3)]">
                {readTime} · Updated {updated}
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              17px body copy, up from the text-sm (14px) this used to set. At a
              768px measure 14px is around 95 characters per line, which is
              roughly a third past the point where a reader starts losing their
              place on the return sweep.
            */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              {children}
            </article>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              {faq ? <Faq title={faq.title} items={faq.items} level="h3" /> : null}
              <Evidence
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={sources}
                note="The weighting this site uses follows that measurement, which is why citability and evidence carry 11% while the AI context file dimension carries 5%. The full weighting, and the parts of the picture a single-URL scan cannot see, are on the methodology page."
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link href="/" className="text-sm text-[var(--accent)] hover:opacity-75">
                Run a free GEO audit on your own site →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PageFooter width="3xl" brand="LLMention Knowledge Base" />
    </div>
  );
}
