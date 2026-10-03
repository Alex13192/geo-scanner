import Link from "next/link";
import type { ReactNode } from "react";
import LegalLinks from "@/app/components/LegalLinks";

/**
 * German equivalent of the English ArticleShell.
 *
 * The chrome labels differ per language, so this is a deliberate duplicate for
 * the pilot rather than a parameterised shared component. Two articles do not
 * justify the refactor; if a third locale appears, the shared version should
 * take a labels prop and this file should go.
 */
type ArticleShellProps = {
  category: string;
  title: string;
  description: string;
  readTime: string;
  updated: string;
  children: ReactNode;
};

export default function ArticleShell({
  category,
  title,
  description,
  readTime,
  updated,
  children,
}: ArticleShellProps) {
  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/de/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              LLMention-Leitf&auml;den
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/de/docs/"
              className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
            >
              &larr; Alle Leitf&auml;den
            </Link>
          </div>
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
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">{description}</p>
          <p className="text-xs text-gray-500 font-mono">
            {readTime} &middot; Zuletzt aktualisiert: {updated}
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">{children}</article>

        <div className="mt-16 pt-8 border-t border-gray-800/60 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/de/" className="text-xs text-blue-400 hover:text-blue-300">
            Kostenlose GEO-Analyse starten &rarr;
          </Link>
          <Link href="/methodology/" hrefLang="en" className="text-xs text-gray-500 hover:text-gray-300">
            Bewertungsmethodik (EN)
          </Link>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        <LegalLinks locale="de" className="mb-3" />
        &copy; 2026 LLMention. Brand Generative Engine Optimization Intelligence.
      </footer>
    </div>
  );
}
