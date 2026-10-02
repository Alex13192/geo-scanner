"use client";

import Link from "next/link";
import { useState } from "react";

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
    codeSnippet: `# adidas.com\n> Generative Engine Optimization (GEO) Context File\n\n## Core Business\nEnterprise athletic apparel and digital commerce solutions.`,
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
    description: "Ensure ChatGPT and Claude accurately identify your brand name, products, and documentation via structured entity markup.",
    readTime: "5 min read",
    codeSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand Name",\n  "url": "https://your-domain.com"\n}\n</script>`,
  },
  {
    id: "allow-ai-crawlers",
    category: "Technical",
    title: "Configuring Robots.txt and WAF for GPTBot & PerplexityBot",
    description: "Prevent accidental 403 blocks on AI crawler user-agents without compromising your enterprise security firewall.",
    readTime: "3 min read",
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
            <div
              key={guide.id}
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
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 mt-20 pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500">
        © LLMention Knowledge Base. Brand Generative Engine Optimization Intelligence.
      </footer>
    </div>
  );
}
