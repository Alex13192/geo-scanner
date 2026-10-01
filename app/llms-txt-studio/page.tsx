"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function cleanDomain(domain: string): string {
  if (!domain) return "example.com";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

function StudioContent() {
  const searchParams = useSearchParams();
  const rawDomain = searchParams.get("domain") || "cisco.com";
  const rootDomain = cleanDomain(rawDomain);

  const [domain, setDomain] = useState(rootDomain);
  const [llmsTextContent, setLlmsTextContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDomain(rootDomain);
    setLlmsTextContent(
      `# ${rootDomain}

> Enterprise Networking & Security Documentation for AI Agents.

## Core Documentation
- [Product Overview](https://${rootDomain}/docs/overview): Comprehensive guide to enterprise solutions.
- [API Reference](https://${rootDomain}/docs/api): REST and GraphQL endpoints for automated integrations.

## Policy & Compliance
- [Privacy Policy](https://${rootDomain}/privacy): Data protection standards and AI crawler usage limits.`
    );
  }, [rootDomain]);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(llmsTextContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([llmsTextContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "llms.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      {/* 顶部导航 Header */}
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigateTo("/")}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                A
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">AIO Pulse</span>
            </button>
            <nav className="hidden md:flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs">
              <button
                onClick={() => navigateTo(`/report/?domain=${domain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Audit Overview
              </button>
              <button
                onClick={() => navigateTo(`/llms-txt-studio/?domain=${domain}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm"
              >
                /llms.txt Studio
              </button>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${domain}&score=68`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Readiness Badge
              </button>
            </nav>
          </div>
          <div>
            <button
              onClick={() => navigateTo(`/report/?domain=${domain}`)}
              className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-3.5 py-2 rounded-lg transition-all"
            >
              ← Back to Report
            </button>
          </div>
        </div>
      </header>

      {/* 主体构建器 */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Markdown Studio
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            /llms.txt Generator for <span className="text-blue-400">{domain}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate and customize standard Markdown structure optimized for AI crawlers and agents.
          </p>
        </div>

        <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-gray-800/80 pb-4">
            <span className="text-xs font-mono text-gray-400">Preview: /llms.txt</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 px-3 py-1.5 rounded-lg font-medium transition-all"
              >
                {copied ? "✓ Copied" : "Copy Raw"}
              </button>
              <button
                onClick={handleDownload}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              >
                Download .txt
              </button>
            </div>
          </div>

          <textarea
            value={llmsTextContent}
            onChange={(e) => setLlmsTextContent(e.target.value)}
            className="w-full h-96 bg-[#070A10] border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
          />
        </div>
      </main>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}