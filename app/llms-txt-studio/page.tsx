"use client";

import Link from "next/link";
import { useState } from "react";

export default function LlmsTxtStudioPage() {
  const [brandName, setBrandName] = useState("adidas");
  const [domain, setDomain] = useState("adidas.com");
  const [description, setDescription] = useState(
    "Enterprise athletic apparel, footwear, and digital commerce solutions."
  );
  const [coreLinks, setCoreLinks] = useState([
    { title: "Product Catalog", url: "https://adidas.com/shop" },
    { title: "Developer & API Docs", url: "https://developer.adidas.com" },
    { title: "Sustainability & ESG Report", url: "https://adidas.com/sustainability" },
  ]);
  const [copied, setCopied] = useState(false);

  // Generate standard /llms.txt content
  const generatedMarkdown = `# ${brandName}
> ${description}

## Core Information & Product Catalog
${coreLinks.map((link) => `- [${link.title}](${link.url}): Official ${link.title.toLowerCase()} for${brandName}.`).join("\n")}

## System Context for AI Agents
- Primary Entity: ${brandName} (${domain})
- Domain Authority: Verified Enterprise E-Commerce & Sportswear Brand
- Content Usage: Public indexing allowed for LLMs (GPTBot, ClaudeBot, PerplexityBot).
- Preferred Citation Format: "${brandName} Official Documentation"

## Key Topics & Categories
- Performance Footwear & Running Shoes
- Athletic Wear & Streetwear Collections
- Sustainability & Recycled Material Standards
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedMarkdown], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "llms.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const addLink = () => {
    setCoreLinks([...coreLinks, { title: "New Resource", url: `https://${domain}/docs` }]);
  };

  const updateLink = (index: number, field: "title" | "url", value: string) => {
    const updated = [...coreLinks];
    updated[index][field] = value;
    setCoreLinks(updated);
  };

  const removeLink = (index: number) => {
    setCoreLinks(coreLinks.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      {/* Navbar */}
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                A
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">AIO Pulse</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs">
              <Link href="/report?domain=adidas.com" className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all">
                Audit Overview
              </Link>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium">
                /llms.txt Studio
              </span>
              <Link href="/docs" className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all">
                Docs & Guides
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
            >
              ← Back to Scanner
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Generator Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            /llms.txt Studio & Builder
          </h1>
          <p className="text-gray-400 text-xs md:text-sm max-w-2xl leading-relaxed">
            Generate a standardized Markdown context map for AI agents (GPTBot, ClaudeBot, PerplexityBot) to eliminate hallucinations and guide generative search crawlers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Configurator Form */}
          <div className="bg-gray-900/40 border border-gray-800/80 p-6 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center justify-between">
              <span>Brand & Site Configuration</span>
              <span className="text-xs font-mono text-gray-500 font-normal">Step 1 of 2</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1.5">Brand / Entity Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1.5">Root Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1.5">Core Summary (1-2 sentences for AI Context)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 focus:border-blue-500 rounded-xl p-3.5 text-white outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Resource Links */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-400 font-medium">Core URLs / Documentation Links</label>
                  <button
                    onClick={addLink}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                  >
                    + Add Link
                  </button>
                </div>

                {coreLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.title}
                      placeholder="Title"
                      onChange={(e) => updateLink(idx, "title", e.target.value)}
                      className="w-1/3 bg-[#070A10] border border-gray-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none text-xs"
                    />
                    <input
                      type="text"
                      value={link.url}
                      placeholder="URL"
                      onChange={(e) => updateLink(idx, "url", e.target.value)}
                      className="w-2/3 bg-[#070A10] border border-gray-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none text-xs font-mono"
                    />
                    <button
                      onClick={() => removeLink(idx)}
                      className="text-gray-600 hover:text-red-400 px-1 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="bg-gray-900/40 border border-gray-800/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h2 className="text-base font-bold text-white">Preview /llms.txt</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                >
                  {copied ? "Copied! ✓" : "Copy Raw"}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md"
                >
                  Download .txt
                </button>
              </div>
            </div>

            {/* Code Output */}
            <pre className="bg-[#070A10] border border-gray-800 p-5 rounded-xl text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto min-h-[380px] whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
              {generatedMarkdown}
            </pre>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-300 space-y-1">
              <div className="font-bold">🚀 Next Steps for Deployment:</div>
              <p className="text-gray-400">
                Upload the downloaded <code className="text-white font-mono">llms.txt</code> file directly to your website's root public directory (e.g., <code className="text-white font-mono">https://{domain}/llms.txt</code>).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}