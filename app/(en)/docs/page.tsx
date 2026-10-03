"use client";

import Link from "next/link";
import { useState } from "react";
import PageFooter from "@/app/components/PageFooter";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";

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
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention Docs</span>
          </Link>
          <Link
            href="/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
          >
            ← Back to Scanner
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            LLMention Knowledge Hub
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Generative Engine Optimization Guides
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Step-by-step technical blueprints to help engineering and SEO teams optimize brand presence in ChatGPT, Perplexity, and Claude.
          </p>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-800 pb-4 text-xs">
          {["All", "Setup", "Content", "Schema", "Technical"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => (
            <Link
              key={guide.id}
              href={`/docs/${guide.id}/`}
              className="bg-gray-900/60 border border-gray-800/80 hover:border-blue-500/50 p-6 rounded-2xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    {guide.category}
                  </span>
                  <span className="text-gray-500 font-mono">{guide.readTime}</span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{guide.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{guide.description}</p>
              </div>

              {guide.codeSnippet && (
                <pre className="bg-[#070A10] border border-gray-800/80 p-3 rounded-xl text-[11px] text-blue-200 font-mono overflow-x-auto">
                  {guide.codeSnippet}
                </pre>
              )}

              <span className="text-xs text-blue-400 font-medium">Read guide →</span>
            </Link>
          ))}
        </div>
                <div className="mt-16 space-y-6 text-sm leading-relaxed text-gray-300">
          <h2 className="text-xl font-bold text-white">The guides</h2>
          <p>Four technical guides. Together they cover the checks the scanner most often fails on a site that is otherwise well built.</p>
          <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
            <thead className="bg-gray-900/60 text-gray-400">
              <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Guide</th>
              <th className="text-left px-4 py-2.5 font-semibold">Topic</th>
              <th className="text-left px-4 py-2.5 font-semibold">Read time</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">How to generate and deploy an llms.txt file</td>
              <td className="px-4 py-2.5 align-top">Setup</td>
              <td className="px-4 py-2.5 align-top">3 min read</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Configuring robots.txt and WAF for GPTBot and PerplexityBot</td>
              <td className="px-4 py-2.5 align-top">Technical</td>
              <td className="px-4 py-2.5 align-top">4 min read</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Optimizing headings for direct AI citation</td>
              <td className="px-4 py-2.5 align-top">Content</td>
              <td className="px-4 py-2.5 align-top">4 min read</td>
            </tr>
            <tr className="border-t border-gray-800/80">
              <td className="px-4 py-2.5 align-top">Implementing Schema.org JSON-LD for entity disambiguation</td>
              <td className="px-4 py-2.5 align-top">Schema</td>
              <td className="px-4 py-2.5 align-top">5 min read</td>
            </tr>
            </tbody>
          </table>
          </div>
        </div>

<div className="mt-16 space-y-10 text-sm leading-relaxed text-gray-300">
          <Faq
            title="Questions about these guides"
            items={[
            { q: "Where should I start?", a: "With the llms.txt deployment guide if you have not published a context file, and with the robots.txt guide if AI crawlers might be turned away at your firewall before robots.txt is even read." },
            { q: "Are the guides specific to one AI engine?", a: "No. They cover the crawler user-agents and markup conventions the major engines have in common, and they say plainly where support is inconsistent." },
            { q: "Do the guides replace the scan?", a: "No, they are complements. A guide explains what a rule wants; the scan tells you whether your page satisfies it, and the scanner applies the same rules these guides describe." },
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

      </main>

      <PageFooter width="6xl" brand="LLMention Knowledge Base" />
    </div>
  );
}
