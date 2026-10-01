"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function StudioContent() {
  const searchParams = useSearchParams();
  const urlDomain = searchParams.get("domain") || "cisco.com";

  // 根据传入的域名动态初始化
  const [brandName, setBrandName] = useState(urlDomain.split(".")[0] || "cisco");
  const [rootDomain, setRootDomain] = useState(urlDomain);
  const [coreSummary, setCoreSummary] = useState(
    `Official digital platform and web services for ${urlDomain}.`
  );

  const previewMarkdown = `# ${brandName}
> ${coreSummary}

## Core Information & Product Catalog
- [Main Portal](https://${rootDomain}/): Official homepage and core services for ${brandName}.
- [API & Developer Docs](https://developer.${rootDomain}): Official developer documentation.
- [Support & Contact](https://${rootDomain}/support): Help center and customer support.

## System Context for AI Agents
- Primary Entity: ${brandName} (${rootDomain})
- Domain Authority: Verified Official Web Domain
- Content Usage: Public indexing allowed for LLMs (GPTBot, ClaudeBot, PerplexityBot).
- Preferred Citation Format: "${brandName} Official Documentation"

## Key Topics & Categories
- Core Services & Products
- Documentation & Guides
- Enterprise Solutions`;

  // 原生强制跳转，防止 Cloudflare Pages 静态路由 404
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      {/* 顶部导航 */}
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
                onClick={() => navigateTo(`/report/?domain=${rootDomain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Audit Overview
              </button>
              <button
                onClick={() => navigateTo(`/llms-txt-studio/?domain=${rootDomain}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium"
              >
                /llms.txt Studio
              </button>
              <button className="px-3 py-1.5 rounded-lg text-gray-500 cursor-not-allowed">
                Readiness Badge (Coming Soon)
              </button>
            </nav>
          </div>
          <div>
            <button
              onClick={() => navigateTo(`/report/?domain=${rootDomain}`)}
              className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-3.5 py-2 rounded-lg transition-all"
            >
              ← Back to Report
            </button>
          </div>
        </div>
      </header>

      {/* 主体区域 */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Generator Tool
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">/llms.txt Studio & Builder</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate a standardized Markdown context map for AI agents (GPTBot, ClaudeBot, PerplexityBot) to eliminate hallucinations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧配置栏 */}
          <div className="lg:col-span-6 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
              <h2 className="text-sm font-bold text-white tracking-wide">Brand & Site Configuration</h2>
              <span className="text-xs font-mono text-gray-500">Step 1 of 2</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Brand / Entity Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Root Domain</label>
                <input
                  type="text"
                  value={rootDomain}
                  onChange={(e) => setRootDomain(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Core Summary (1-2 sentences for AI Context)</label>
                <textarea
                  rows={3}
                  value={coreSummary}
                  onChange={(e) => setCoreSummary(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono resize-none"
                />
              </div>
            </div>
          </div>

          {/* 右侧预览区 */}
          <div className="lg:col-span-6 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h2 className="text-sm font-bold text-white tracking-wide">Preview /llms.txt</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(previewMarkdown)}
                    className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-all font-medium"
                  >
                    Copy Raw
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([previewMarkdown], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "llms.txt";
                      a.click();
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg transition-all font-medium"
                  >
                    Download .txt
                  </button>
                </div>
              </div>

              <div className="bg-[#070A10] border border-gray-800/80 p-4 rounded-xl font-mono text-xs text-emerald-400 whitespace-pre-wrap overflow-x-auto max-h-[380px] leading-relaxed">
                {previewMarkdown}
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-xl mt-6 space-y-1">
              <p className="text-xs font-bold text-blue-300">🚀 Next Steps for Deployment:</p>
              <p className="text-xs text-gray-400">
                Upload the downloaded <code className="text-blue-400 font-mono">llms.txt</code> file directly to your website&apos;s root public directory (e.g., <span className="text-gray-300 font-mono">https://{rootDomain}/llms.txt</span>).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LlmsTxtStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}