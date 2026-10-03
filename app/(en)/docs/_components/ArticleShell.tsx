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
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              LLMention Docs
            </span>
          </Link>
          <Link
            href="/docs/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
          >
            ← All guides
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            {category}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            {description}
          </p>
          <p className="text-xs text-gray-500 font-mono">
            {readTime} · Updated {updated}
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          {children}
        </article>

        <div className="mt-16 space-y-10 text-sm leading-relaxed text-gray-300">
          {faq ? <Faq title={faq.title} items={faq.items} level="h3" /> : null}
          <Evidence
            quote={GEO_PRIMARY_QUOTE}
            attribution="Generative Engine Optimization, KDD 2024"
            attributionUrl="https://arxiv.org/abs/2311.09735"
            sources={sources}
            note="The weighting this site uses follows that measurement, which is why citability and evidence carry 11% while the AI context file dimension carries 5%. The full weighting, and the parts of the picture a single-URL scan cannot see, are on the methodology page."
          />
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800/60">
          <Link href="/" className="text-xs text-blue-400 hover:text-blue-300">
            Run a free GEO audit on your own site →
          </Link>
        </div>
      </main>

      <PageFooter width="3xl" brand="LLMention Knowledge Base" />
    </div>
  );
}
