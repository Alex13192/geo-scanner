"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function cleanDomain(domain: string): string {
  if (!domain) return "163.com";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

function BadgeContent() {
  const searchParams = useSearchParams();
  const rawDomain = searchParams.get("domain") || "163.com";
  const [domain] = useState(cleanDomain(rawDomain));
  
  // 假定基础分数与 Grade
  const score = 68;
  const grade = "B+";
  const statusColor = "#3B82F6"; // 蓝色

  // Badge 样式选择
  const [badgeStyle, setBadgeStyle] = useState<"flat" | "shield" | "minimal">("flat");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // SVG 动态内容生成
  const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="20" role="img" aria-label="AIO Readiness: ${grade} (${score}/100)">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="190" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="115" height="20" fill="#555"/>
    <rect x="115" width="75" height="20" fill="${statusColor}"/>
    <rect width="190" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="585" y="140" transform="scale(.1)" fill="#fff" textLength="950">AIO Readiness</text>
    <text x="1515" y="140" transform="scale(.1)" fill="#fff" font-weight="bold" textLength="550">${grade} (${score})</text>
  </g>
</svg>`;

  // 各种格式嵌入代码
  const markdownCode = `[![AIO Readiness Grade](https://img.shields.io/badge/AIO_Readiness-${grade}_(${score}%2F100)-blue?style=flat-square&logo=openai)](https://aiopulse.pages.dev/report/?domain=${domain})`;
  const htmlCode = `<a href="https://aiopulse.pages.dev/report/?domain=${domain}"><img src="https://img.shields.io/badge/AIO_Readiness-${grade}_(${score}%2F100)-blue?style=flat-square&logo=openai" alt="AIO Readiness Grade" /></a>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      {/* 顶部导航栏 */}
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
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </button>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${domain}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium"
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

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Embeddable Asset
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">AI Readiness Badge Generator</h1>
          <p className="text-sm text-gray-400 mt-1">
            Showcase your brand&apos;s GEO & AI search optimization status on GitHub, docs, or landing pages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧：Badge 预览 */}
          <div className="lg:col-span-6 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-6">
                <h2 className="text-sm font-bold text-white tracking-wide">Live Badge Preview</h2>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Verified Entity</span>
              </div>

              {/* Badge 展现框 */}
              <div className="bg-[#070A10] border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-4 min-h-[180px]">
                <div dangerouslySetInnerHTML={{ __html: badgeSvg }} />
                <p className="text-xs text-gray-500 font-mono mt-2">Target Domain: <span className="text-gray-300">{domain}</span></p>
              </div>

              {/* 样式选择 */}
              <div className="mt-6">
                <label className="block text-xs font-medium text-gray-300 mb-2">Badge Style Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["flat", "shield", "minimal"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBadgeStyle(style)}
                      className={`text-xs py-2 rounded-lg border transition-all capitalize font-mono ${
                        badgeStyle === style
                          ? "bg-blue-600/20 border-blue-500 text-blue-400 font-bold"
                          : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl text-xs text-gray-400 space-y-1">
              <p className="font-bold text-purple-300">💡 Why embed this badge?</p>
              <p>Embedding badges signals to AI web scrapers and partners that your technical architecture is GEO-compliant, boosting brand trust.</p>
            </div>
          </div>

          {/* 右侧：代码复制 */}
          <div className="lg:col-span-6 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
              <h2 className="text-sm font-bold text-white tracking-wide">Embed Snippets</h2>
              <span className="text-xs font-mono text-gray-500">Copy & Paste</span>
            </div>

            {/* Markdown Snippet */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-gray-300">Markdown (for GitHub README)</label>
                <button
                  onClick={() => copyToClipboard(markdownCode, "markdown")}
                  className="text-[11px] bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded transition-all"
                >
                  {copiedType === "markdown" ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                value={markdownCode}
                className="w-full bg-[#070A10] border border-gray-800 rounded-xl p-3 text-xs text-blue-400 font-mono resize-none focus:outline-none"
              />
            </div>

            {/* HTML Snippet */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-gray-300">HTML (for Website Footers)</label>
                <button
                  onClick={() => copyToClipboard(htmlCode, "html")}
                  className="text-[11px] bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded transition-all"
                >
                  {copiedType === "html" ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                value={htmlCode}
                className="w-full bg-[#070A10] border border-gray-800 rounded-xl p-3 text-xs text-purple-400 font-mono resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReadinessBadgePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">Loading Badge Generator...</div>}>
      <BadgeContent />
    </Suspense>
  );
}