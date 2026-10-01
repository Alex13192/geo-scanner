"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, Suspense } from "react";

function cleanDomain(domain: string): string {
  if (!domain) return "example.com";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

interface IssueItem {
  id: string;
  category: string;
  title: string;
  severity: "high" | "medium" | "low";
  summary: string;
  recommendation: string;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const rawDomain = searchParams.get("domain") || "cisco.com";
  const rootDomain = cleanDomain(rawDomain);

  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all");

  // 前端直接对目标域名发起真实探测与计算
  useEffect(() => {
    async function runLiveAudit() {
      setLoading(true);
      let calculatedScore = 0;
      const detectedIssues: IssueItem[] = [];

      // 1. 真实请求探测 /llms.txt
      let hasLlmsTxt = false;
      try {
        const llmsRes = await fetch(`https://${rootDomain}/llms.txt`, {
          method: "GET",
          signal: AbortSignal.timeout(4000),
        });
        if (llmsRes.ok) {
          const text = await llmsRes.text();
          if (text && text.length > 20) {
            hasLlmsTxt = true;
            calculatedScore += 35;
          }
        }
      } catch (e) {
        // 请求失败，视为缺失
      }

      if (!hasLlmsTxt) {
        detectedIssues.push({
          id: "llms-missing",
          category: "Crawler Access",
          title: "Missing /llms.txt standard file",
          severity: "high",
          summary: `AI Agents visiting https://${rootDomain}/llms.txt received a 404 or connection error.`,
          recommendation: "Create and publish a valid /llms.txt file at your site root.",
        });
      }

      // 2. 真实请求探测 robots.txt
      let isAiBotAllowed = true;
      try {
        const robotsRes = await fetch(`https://${rootDomain}/robots.txt`, {
          method: "GET",
          signal: AbortSignal.timeout(4000),
        });
        if (robotsRes.ok) {
          const robotsText = await robotsRes.text();
          if (/Disallow:\s*\/\s*$/m.test(robotsText) && /GPTBot|PerplexityBot|ClaudeBot/i.test(robotsText)) {
            isAiBotAllowed = false;
          } else {
            calculatedScore += 25;
          }
        } else {
          calculatedScore += 25;
        }
      } catch (e) {
        calculatedScore += 25;
      }

      if (!isAiBotAllowed) {
        detectedIssues.push({
          id: "robots-blocked",
          category: "Robots Directives",
          title: "AI Bots explicitly blocked in robots.txt",
          severity: "high",
          summary: "Robots.txt restricts major AI crawlers (GPTBot/PerplexityBot) from indexing site content.",
          recommendation: "Update User-agent directives in robots.txt to allow official search/RAG crawlers.",
        });
      }

      // 3. 真实探测首页 HTML
      let hasSchema = false;
      let hasSemanticHTML = false;
      try {
        const htmlRes = await fetch(`https://${rootDomain}`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          if (html.includes("application/ld+json")) {
            hasSchema = true;
            calculatedScore += 20;
          }
          if (/<(main|article|section|header|nav|footer)/i.test(html)) {
            hasSemanticHTML = true;
            calculatedScore += 20;
          }
        }
      } catch (e) {
        // 跨域或抓取失败
      }

      if (!hasSchema) {
        detectedIssues.push({
          id: "schema-missing",
          category: "Schema Metadata",
          title: "Missing JSON-LD Structured Data",
          severity: "medium",
          summary: `Generative search engines cannot automatically construct entity graph for ${rootDomain}.`,
          recommendation: "Add structured JSON-LD schema (Organization / WebSite) in your home page <head>.",
        });
      }

      if (!hasSemanticHTML) {
        detectedIssues.push({
          id: "semantic-missing",
          category: "Content Structure",
          title: "Low semantic element density",
          severity: "low",
          summary: "Page heavily relies on generic <div> tags instead of HTML5 semantic containers.",
          recommendation: "Wrap main components inside <main>, <article>, and <section> tags for better LLM chunking.",
        });
      }

      setOverallScore(calculatedScore);
      setIssues(detectedIssues);
      setLoading(false);
    }

    runLiveAudit();
  }, [rootDomain]);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const filteredIssues = useMemo(() => {
    if (activeFilter === "all") return issues;
    return issues.filter((item) => item.severity === activeFilter);
  }, [activeFilter, issues]);

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      {/* 顶部 Header */}
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
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm"
              >
                Audit Overview
              </button>
              <button
                onClick={() => navigateTo(`/llms-txt-studio/?domain=${rootDomain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </button>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Readiness Badge
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">Target: {rootDomain}</span>
            <button
              onClick={() => navigateTo(`/llms-txt-studio/?domain=${rootDomain}`)}
              className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              Open Studio Builder →
            </button>
          </div>
        </div>
      </header>

      {/* 主体报告 */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-gray-950/60 border border-gray-800/80 p-8 rounded-2xl">
          <div>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              GEO Audit Report
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
              Analysis for <span className="text-blue-400">{rootDomain}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Live evaluated against active Generative Engine Optimization vectors.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#070A10] p-4 rounded-xl border border-gray-800">
            <div className="text-center">
              {loading ? (
                <div className="text-sm text-blue-400 animate-pulse font-mono py-2">Scanning site...</div>
              ) : (
                <div className="text-3xl font-black text-amber-400 font-mono">{overallScore}/100</div>
              )}
              <div className="text-[11px] text-gray-400 mt-0.5">Readiness Score</div>
            </div>
            <div className="h-8 w-px bg-gray-800"></div>
            <button
              disabled={loading}
              onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              Get Badge 🛡️
            </button>
          </div>
        </div>

        {/* 筛选与问题展示 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white tracking-tight">Identified Issues</h2>
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
            {(["all", "high", "medium", "low"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* 渲染扫描结果 */}
        {loading ? (
          <div className="text-center py-20 bg-gray-950/20 rounded-2xl border border-gray-800/40">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-sm text-gray-400 font-mono">Auditing https://{rootDomain} in real-time...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-mono">
            🎉 Perfect Score! No critical GEO optimization issues found for this domain.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-gray-950/40 border border-gray-800/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        issue.severity === "high"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : issue.severity === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{issue.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{issue.title}</h3>
                  <p className="text-xs text-gray-400">{issue.summary}</p>
                </div>

                <div className="bg-[#070A10] p-3 rounded-xl border border-gray-800 text-xs text-gray-300 md:max-w-xs">
                  <span className="text-blue-400 font-bold block mb-1">Recommendation:</span>
                  {issue.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}