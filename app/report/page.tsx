"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

// 定义 12 维指标数据类型
interface MetricItem {
  label: string;
  score: number;
  color: string;
}

// 定义优化建议数据类型
interface AdviceItem {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionText: string;
  buttonText?: string;
  buttonPath?: string;
}

// 建议数据列表
const adviceData: AdviceItem[] = [
  {
    id: "GEO-109",
    priority: "high",
    title: "Deploy Standardized /llms.txt at Root Directory",
    description:
      "AI agents like GPTBot and ClaudeBot require a clean Markdown context map to crawl complex domain hierarchies without hallucinating.",
    actionText: "Generate or download your custom /llms.txt file and deploy to site root.",
    buttonText: "Open Studio Builder →",
    buttonPath: "/llms-txt-studio/",
  },
  {
    id: "GEO-209",
    priority: "high",
    title: "Fix Robots.txt Disallow Rules for PerplexityBot",
    description:
      "PerplexityBot is experiencing elevated 403 response rates due to overly aggressive WAF challenge rules on /api endpoints.",
    actionText: "Update Cloudflare / WAF rules to whitelist PerplexityBot user-agents for public product catalog URLs.",
  },
  {
    id: "GEO-304",
    priority: "medium",
    title: "Enhance JSON-LD Schema for Product Entities",
    description:
      "Structured data coverage is missing explicit 'sameAs' cross-references and detailed technical specifications for LLM context aggregation.",
    actionText: "Inject Schema.org/Product and Organization metadata into primary landing page templates.",
  },
  {
    id: "GEO-402",
    priority: "medium",
    title: "Optimize Q&A Structure for Direct Answer Retrieval",
    description:
      "Content headers (H2/H3) lack conversational query matching, reducing citation probability in SearchGPT answer cards.",
    actionText: "Restructure key product pages to feature direct 2-3 sentence answer paragraphs immediately after core questions.",
  },
  {
    id: "GEO-501",
    priority: "low",
    title: "Accelerate Indexing for China AI Ecosystems",
    description:
      "Bot accessibility for Chinese LLM crawlers (e.g. Baiduspider-AI, Bytespider) shows higher latency and occasional timeout flags.",
    actionText: "Ensure CDN edge nodes in Asia-Pacific correctly bypass strict challenge pages for verified crawler IP ranges.",
  },
];

// 12 维 GEO 指标数据
const metricsData: MetricItem[] = [
  { label: "Crawlability & Bot Access", score: 85, color: "bg-emerald-500" },
  { label: "Understandability (Schema/JSON-LD)", score: 72, color: "bg-amber-500" },
  { label: "Answer Readiness & Q&A Formatting", score: 64, color: "bg-amber-500" },
  { label: "Citability & Entity Authority", score: 78, color: "bg-emerald-500" },
  { label: "Trust & Content E-E-A-T Signals", score: 68, color: "bg-amber-500" },
  { label: "Content Depth & Context Density", score: 82, color: "bg-emerald-500" },
  { label: "Freshness & Signal Velocity", score: 55, color: "bg-red-500" },
  { label: "GEO Content Optimization Level", score: 60, color: "bg-amber-500" },
  { label: "Competitive GEO Share of Voice", score: 70, color: "bg-amber-500" },
  { label: "China AI Ecosystem Compatibility", score: 45, color: "bg-red-500" },
  { label: "AI Native Agent Features", score: 62, color: "bg-amber-500" },
  { label: "Technical Performance & TTFB", score: 94, color: "bg-emerald-500" },
];

function ReportContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "cisco.com";
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // 统一的跳转函数
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // 过滤建议列表
  const filteredAdvice = adviceData.filter((item) => {
    if (activeFilter === "all") return true;
    return item.priority === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      {/* 1. 顶部导航栏 */}
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
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm"
              >
                Audit Overview
              </button>
              <button
                onClick={() => navigateTo(`/llms-txt-studio/?domain=${domain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </button>
              <button className="px-3 py-1.5 rounded-lg text-gray-500 cursor-not-allowed">
                Readiness Badge (Coming Soon)
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-gray-400">Target:</span>
              <span className="font-mono text-blue-400 font-semibold">{domain}</span>
            </div>
            <button
              onClick={() => navigateTo("/")}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-xl transition-all shadow-md"
            >
              New Scan
            </button>
          </div>
        </div>
      </header>

      {/* 2. 主体区域 */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* 分数和维度明细区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧总分卡片 */}
          <div className="lg:col-span-4 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Moderate Readiness
            </div>

            <div className="text-center my-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-white">68</span>
                    <span className="block text-[11px] text-gray-400 font-medium">/ 100 GEO Index</span>
                  </div>
                </div>
              </div>
              <h2 className="text-base font-bold text-white mt-4">GEO Readiness Grade: B+</h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Scanned on 2026-10-01 • Response Time: 128ms • HTTPS Verified
              </p>
            </div>
          </div>

          {/* 右侧 12 维 GEO 指标 */}
          <div className="lg:col-span-8 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📊</span> 12-Dimensional GEO Metrics Breakdown
              </h3>
              <span className="text-[11px] font-mono text-gray-400">Paper-Validated Algorithm v2.4</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {metricsData.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="font-mono font-bold text-white">{item.score} / 100</span>
                  </div>
                  <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 策略优化建议区 */}
        <div className="bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>💡</span> Strategic Optimization Advice
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md font-mono font-normal">
                  {filteredAdvice.length} Action {filteredAdvice.length === 1 ? "Item" : "Items"}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Prioritized technical and content adjustments to boost AI agent indexing.
              </p>
            </div>

            {/* 筛选按钮组 */}
            <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
              {["all", "high", "medium", "low"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all ${
                    activeFilter === filter ? "bg-blue-600 text-white font-medium" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {filter === "all" ? "All Priority" : `${filter} Priority`}
                </button>
              ))}
            </div>
          </div>

          {/* 建议列表展现 */}
          <div className="space-y-4">
            {filteredAdvice.length > 0 ? (
              filteredAdvice.map((item) => (
                <div key={item.id} className="bg-[#070A10] border border-gray-800/80 p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        item.priority === "high"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : item.priority === "medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {item.priority} PRIORITY
                    </span>
                    <span className="text-xs font-mono text-gray-500">ID: {item.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>

                  <div className="bg-gray-900/60 border border-gray-800 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs text-gray-300">
                      <strong className="font-semibold text-white">Action:</strong> {item.actionText}
                    </span>
                    {item.buttonText && item.buttonPath && (
                      <button
                        onClick={() => navigateTo(`${item.buttonPath}?domain=${domain}`)}
                        className="whitespace-nowrap text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        {item.buttonText}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 text-xs font-mono">
                No optimization items found for this priority filter.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">
          Loading Report...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}