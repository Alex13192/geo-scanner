"use client";

import Link from "next/link";
import { useState } from "react";
import PageFooter from "@/app/components/PageFooter";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";

/**
 * The guides hub.
 *
 * Laid out in the same full-width bands as the articles it links to: a
 * .band--alt hero carrying the colour, then the grid. The grid itself was
 * max-w-6xl (1152px) on a background of the same colour; at .wrap it is 1280px,
 * and the hero band above it is what actually removes the "dead gutter" reading
 * - see the note in _components/ArticleShell.tsx for the measurement.
 *
 * The prose under the grid stays at max-w-3xl. A table and a Q&A block are read
 * the same way paragraphs are, and 1280px of body text is not more readable than
 * 768px of it.
 */

interface Guide {
  id: string;
  category: "Setup" | "Content" | "Technical" | "Schema";
  title: string;
  description: string;
  readTime: string;
  codeSnippet?: string;
}

const guides: Guide[] = [
  {
    id: "llms-txt-deployment",
    category: "Setup",
    title: "How to Generate and Deploy /llms.txt File",
    description: "Learn how to format, structure, and host a standardized /llms.txt file at your domain root so AI crawlers can digest your content cleanly.",
    readTime: "3 min read",
    // Neutral example. This previously used a real company's domain paired with
    // invented copy about its business, which is a poor thing to put in a
    // documentation example and teaches the format less clearly than a
    // placeholder does.
    codeSnippet: `# your-domain.com\n> One factual sentence on what the company does.\n\n## Core business\nA short description an AI system can quote directly.`,
  },
  {
    id: "qa-style-headings",
    category: "Content",
    title: "Optimizing Headings for Direct AI Citation (Q&A Style)",
    description: "Transform generic H2/H3 headings into natural interrogative prompts that match real-world AI search engine user queries.",
    readTime: "4 min read",
    codeSnippet: `<!-- Poor -->\n<h2>Features</h2>\n\n<!-- Optimized for GEO -->\n<h2>How Does Your Company Measure Brand AI Visibility?</h2>`,
  },
  {
    id: "schema-org-jsonld",
    category: "Schema",
    title: "Implementing Schema.org JSON-LD for AI Entity Disambiguation",
    description: "How to declare Organization, WebSite and sameAs markup so a model has what it needs to resolve your brand as one entity, and how to validate it.",
    readTime: "5 min read",
    codeSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand Name",\n  "url": "https://your-domain.com"\n}\n</script>`,
  },
  {
    id: "allow-ai-crawlers",
    category: "Technical",
    title: "Configuring Robots.txt and WAF for GPTBot & PerplexityBot",
    description: "How to check robots.txt for rules that turn AI crawlers away, and where in your WAF or CDN the rest of the answer lives.",
    readTime: "4 min read",
    codeSnippet: `# robots.txt\nUser-agent: GPTBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /`,
  },
];

export default function DocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredGuides = selectedCategory === "All"
    ? guides
    : guides.filter(g => g.category === selectedCategory);

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
            href="/"
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-1.5 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← Back to Scanner
          </Link>
        </div>
      </header>

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                LLMention Knowledge Hub
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                Generative Engine Optimization Guides
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                Step-by-step technical blueprints to help engineering and SEO teams optimize brand
                presence in ChatGPT, Perplexity, and Claude.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-4 text-xs">
              {["All", "Setup", "Content", "Schema", "Technical"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`cursor-pointer rounded-xl px-4 py-2 font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink-1)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/docs/${guide.id}/`}
                  className="flex flex-col justify-between gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 transition-all hover:border-blue-500/50 hover:shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono font-semibold text-[var(--accent)]">
                        {guide.category}
                      </span>
                      <span className="font-mono text-[var(--ink-3)]">{guide.readTime}</span>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug tracking-tight">
                      {guide.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                      {guide.description}
                    </p>
                  </div>

                  {guide.codeSnippet && (
                    <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-0)] p-3 font-mono text-[11px] text-[var(--accent)]">
                      {guide.codeSnippet}
                    </pre>
                  )}

                  <span className="text-sm font-medium text-[var(--accent)]">Read guide →</span>
                </Link>
              ))}
            </div>

            {/* Prose, table and Q&A: all bounded to the same readable measure. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-6 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                The guides
              </h2>
              <p>
                Four technical guides. Together they cover the checks the scanner most often fails
                on a site that is otherwise well built.
              </p>
              <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[var(--surface-1)] text-[var(--ink-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Guide</th>
                      <th className="px-4 py-3 text-left font-semibold">Topic</th>
                      <th className="px-4 py-3 text-left font-semibold">Read time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">
                        How to generate and deploy an llms.txt file
                      </td>
                      <td className="px-4 py-3 align-top">Setup</td>
                      <td className="px-4 py-3 align-top">3 min read</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">
                        Configuring robots.txt and WAF for GPTBot and PerplexityBot
                      </td>
                      <td className="px-4 py-3 align-top">Technical</td>
                      <td className="px-4 py-3 align-top">4 min read</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">
                        Optimizing headings for direct AI citation
                      </td>
                      <td className="px-4 py-3 align-top">Content</td>
                      <td className="px-4 py-3 align-top">4 min read</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">
                        Implementing Schema.org JSON-LD for entity disambiguation
                      </td>
                      <td className="px-4 py-3 align-top">Schema</td>
                      <td className="px-4 py-3 align-top">5 min read</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="Questions about these guides"
                items={[
                  {
                    q: "Where should I start?",
                    a: "With the llms.txt deployment guide if you have not published a context file, and with the robots.txt guide if AI crawlers might be turned away at your firewall before robots.txt is even read.",
                  },
                  {
                    q: "Are the guides specific to one AI engine?",
                    a: "No. They cover the crawler user-agents and markup conventions the major engines have in common, and they say plainly where support is inconsistent.",
                  },
                  {
                    q: "Do the guides replace the scan?",
                    a: "No, they are complements. A guide explains what a rule wants; the scan tells you whether your page satisfies it, and the scanner applies the same rules these guides describe.",
                  },
                ]}
              />
              <Evidence
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="The weightings on this site follow that measurement rather than taste, and the parts of the picture a single-URL scan cannot see are stated rather than left out."
              />
            </div>
          </div>
        </section>
      </main>

      <PageFooter width="7xl" brand="LLMention Knowledge Base" />
    </div>
  );
}
