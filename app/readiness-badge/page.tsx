"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function cleanDomain(domain: string): string {
  if (!domain) return "example.com";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

function ReadinessBadgeContent() {
  const searchParams = useSearchParams();
  const rawDomain = searchParams.get("domain") || "cisco.com";
  const initialScore = Number(searchParams.get("score")) || 68;

  const [domain, setDomain] = useState(cleanDomain(rawDomain));
  const [score, setScore] = useState(initialScore);
  const [badgeStyle, setBadgeStyle] = useState<"flat" | "cyber" | "minimal">("flat");
  const [copiedType, setCopiedType] = useState<"md" | "html" | null>(null);

  useEffect(() => {
    setDomain(cleanDomain(rawDomain));
    setScore(Number(searchParams.get("score")) || 68);
  }, [rawDomain, searchParams]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { bg: "#10B981", text: "Optimal" };
    if (s >= 60) return { bg: "#F59E0B", text: "Moderate" };
    return { bg: "#EF4444", text: "Critical" };
  };

  const colorInfo = getScoreColor(score);
  const reportUrl = `https://aiopulse.com/report/?domain=${domain}`;

  const markdownSnippet = `[![GEO Readiness](https://img.shields.io/badge/GEO%20Readiness-${score}%2F100-${colorInfo.bg.replace("#", "")}?style=flat-square)](${reportUrl})`;
  const htmlSnippet = `<a href="${reportUrl}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/GEO%20Readiness-${score}%2F100-${colorInfo.bg.replace("#", "")}?style=flat-square" alt="GEO Readiness Score" />
</a>`;

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleCopy = (text: string, type: "md" | "html") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
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
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </button>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${domain}&score=${score}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm"
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
            Embeddable Widget
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">GEO Readiness Badge Generator</h1>
          <p className="text-sm text-gray-400 mt-1">
            Display your AI Agent readiness score on your website, docs, or GitHub README to showcase trust and AI compatibility.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl space-y-6">
            <h2 className="text-sm font-bold text-white tracking-wide border-b border-gray-800/80 pb-4">
              Badge Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Target Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">GEO Readiness Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Badge Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["flat", "cyber", "minimal"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBadgeStyle(style)}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all capitalize ${
                        badgeStyle === style
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-[#070A10] border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide border-b border-gray-800/80 pb-4">
                Live Preview
              </h2>

              <div className="my-8 flex items-center justify-center p-8 bg-[#070A10] rounded-xl border border-gray-800/80">
                {badgeStyle === "flat" && (
                  <div className="inline-flex items-center text-xs font-mono rounded-md overflow-hidden shadow-lg border border-gray-800">
                    <span className="bg-gray-800 text-gray-300 px-3 py-1.5 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                      GEO Readiness
                    </span>
                    <span
                      style={{ backgroundColor: colorInfo.bg }}
                      className="text-white px-3 py-1.5 font-extrabold"
                    >
                      {score} / 100
                    </span>
                  </div>
                )}

                {badgeStyle === "cyber" && (
                  <div className="inline-flex items-center text-xs font-mono rounded-lg overflow-hidden border border-purple-500/30 bg-purple-950/20 p-1 shadow-md gap-2">
                    <span className="text-purple-300 font-bold px-2 py-1 bg-purple-900/40 rounded">
                      ⚡ AI READY
                    </span>
                    <span className="text-white font-extrabold pr-2">
                      {domain} : <span style={{ color: colorInfo.bg }}>{score} pts</span>
                    </span>
                  </div>
                )}

                {badgeStyle === "minimal" && (
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-gray-300 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-full">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colorInfo.bg }}
                    ></span>
                    <span>GEO Score: <b>{score}</b></span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-300">Markdown (for GitHub README)</label>
                    <button
                      onClick={() => handleCopy(markdownSnippet, "md")}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {copiedType === "md" ? "✓ Copied" : "Copy Markdown"}
                    </button>
                  </div>
                  <pre className="bg-[#070A10] border border-gray-800 rounded-xl p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                    {markdownSnippet}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-300">HTML (for Website / Footer)</label>
                    <button
                      onClick={() => handleCopy(htmlSnippet, "html")}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {copiedType === "html" ? "✓ Copied" : "Copy HTML"}
                    </button>
                  </div>
                  <pre className="bg-[#070A10] border border-gray-800 rounded-xl p-3 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {htmlSnippet}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl space-y-1">
              <p className="text-xs font-bold text-purple-300">💡 Growth Tip:</p>
              <p className="text-xs text-gray-400">
                Embedding this badge in your public docs improves brand legitimacy for search engines and AI crawlers.
              </p>
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
      <ReadinessBadgeContent />
    </Suspense>
  );
}