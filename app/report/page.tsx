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

interface Metrics {
  crawlability: number;
  understandability: number;
  answerReadiness: number;
  citability: number;
  trustAuthority: number;
  contentDepth: number;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const rawDomain = searchParams.get("domain") || "cisco.com";
  const rootDomain = cleanDomain(rawDomain);

  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    crawlability: 0,
    understandability: 0,
    answerReadiness: 0,
    citability: 0,
    trustAuthority: 0,
    contentDepth: 0,
  });
  const [siteUnreachable, setSiteUnreachable] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    async function runServerAudit() {
      setLoading(true);
      setSiteUnreachable(false);

      try {
        // 请求我们自己的后端 API 接口进行真实服务端扫描
        const res = await fetch(`/api/scan?domain=${encodeURIComponent(rootDomain)}`);
        const data = await res.json();

        if (!data.reachable) {
          setSiteUnreachable(true);
          setOverallScore(0);
        } else {
          setOverallScore(data.score);
          setIssues(data.issues || []);
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        }
      } catch (e) {
        console.error("Scan error:", e);
        setSiteUnreachable(true);
      } finally {
        setLoading(false);
      }
    }

    runServerAudit();
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
                L
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
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

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* 顶部 Domain 概览 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gray-950/60 border border-gray-800/80 p-8 rounded-2xl">
          <div>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              GEO Server Scanner
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
              Analysis for <span className="text-blue-400">{rootDomain}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Live scanned via backend edge crawler across multi-dimensional AI optimization vectors.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#070A10] p-4 rounded-xl border border-gray-800">
            <div className="text-center">
              {loading ? (
                <div className="text-sm text-blue-400 animate-pulse font-mono py-2">Scanning via Edge...</div>
              ) : (
                <div className="text-4xl font-black text-amber-400 font-mono">{overallScore}/100</div>
              )}
              <div className="text-[11px] text-gray-400 mt-0.5">Overall GEO Score</div>
            </div>
            <div className="h-8 w-px bg-gray-800"></div>
            <button
              disabled={loading || siteUnreachable}
              onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              Get Badge 🛡️️
            </button>
          </div>
        </div>

        {siteUnreachable ? (
          <div className="text-center py-16 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            ❌ Unable to reach <span className="font-mono font-bold">{rootDomain}</span>. Please check if the domain is valid and live.
          </div>
        ) : (
          <>
            {/* 多维度评分面板 (参考竞品样式) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {[
                { name: "Crawlability", score: metrics.crawlability },
                { name: "Understandability", score: metrics.understandability },
                { name: "Answer Readiness", score: metrics.answerReadiness },
                { name: "Citability", score: metrics.citability },
                { name: "Trust & Authority", score: metrics.trustAuthority },
                { name: "Content Depth", score: metrics.contentDepth },
              ].map((m) => (
                <div key={m.name} className="bg-gray-950/40 border border-gray-800/80 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400 font-medium">{m.name}</span>
                    <span className="text-sm font-bold font-mono text-blue-400">{loading ? "--" : m.score}</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: loading ? "0%" : `${m.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* 优化建议列表 Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Optimization Advice</h2>
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

            {/* 加载中与问题列表 */}
            {loading ? (
              <div className="text-center py-20 bg-gray-950/20 rounded-2xl border border-gray-800/40">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm text-gray-400 font-mono">Crawling and analyzing https://{rootDomain} via edge nodes...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-mono">
                🎉 Perfect Score! No major GEO issues found for this domain.
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
          </>
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