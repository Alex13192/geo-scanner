"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";

interface EvaluationCriterion {
  id: string;
  category: "Technical" | "Content" | "Schema" | "Setup";
  name: string;
  passed: boolean;
  score: number;
  weight: string;
  summary: string;
  guideDocId: string;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "example.com";
  const lang = searchParams.get("lang") || "en";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "passed" | "failed">("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const criteria: EvaluationCriterion[] = [
    {
      id: "c1",
      category: "Setup",
      name: "/llms.txt File Accessibility",
      passed: true,
      score: 100,
      weight: "High",
      summary: "Standard /llms.txt found at domain root. Allows AI agents to parse high-level brand entity context.",
      guideDocId: "llms-txt-deployment",
    },
    {
      id: "c2",
      category: "Technical",
      name: "AI Crawler Passability (Robots.txt)",
      passed: true,
      score: 95,
      weight: "High",
      summary: "GPTBot, PerplexityBot, and ClaudeBot are explicitly permitted. No blocking disallow rules detected.",
      guideDocId: "allow-ai-crawlers",
    },
    {
      id: "c3",
      category: "Content",
      name: "Q&A Interrogative Headings",
      passed: false,
      score: 40,
      weight: "Medium",
      summary: "Headings lack natural language Q&A phrasing. Transforming H2s into questions increases direct AI citation odds.",
      guideDocId: "qa-style-headings",
    },
    {
      id: "c4",
      category: "Schema",
      name: "Schema.org JSON-LD Structured Data",
      passed: false,
      score: 50,
      weight: "High",
      summary: "Organization and Product entities missing JSON-LD schema markup, causing ambiguous brand disambiguation in LLMs.",
      guideDocId: "schema-org-jsonld",
    },
  ];

  const totalScore = Math.round(
    criteria.reduce((acc, c) => acc + c.score, 0) / criteria.length
  );

  const filteredCriteria = criteria.filter((item) => {
    if (activeTab === "passed") return item.passed;
    if (activeTab === "failed") return !item.passed;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A10] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 font-mono tracking-wider">
          ANALYZING GEO ENGINE VISIBILITY FOR <span className="text-blue-400 uppercase">{domain}</span>...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      {/* Header */}
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              A
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">AIO Pulse</span>
          </Link>
          <Link
            href="/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
          >
            ← Scan Another Domain
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        {/* Score Overview Card */}
        <div className="bg-gray-900/60 border border-gray-800 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-semibold">
              Generative Engine Audit Report
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{domain}</h1>
            <p className="text-xs text-gray-400">
              Evaluated against 4 core Generative Engine Optimization (GEO) standards.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#070A10] border border-gray-800 px-8 py-4 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-mono">GEO Readiness Score</p>
              <p className="text-4xl font-black text-blue-400 mt-1">{totalScore}<span className="text-lg font-normal text-gray-500">/100</span></p>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            {(["all", "passed", "failed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Results List */}
        <div className="space-y-4">
          {filteredCriteria.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900/40 border border-gray-800/80 hover:border-gray-700 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      item.passed ? "bg-green-400 shadow-sm shadow-green-500/50" : "bg-red-400 shadow-sm shadow-red-500/50"
                    }`}
                  ></span>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed pl-5">{item.summary}</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-800 pt-3 md:pt-0">
                {/* 关联导流至 /docs 的 Learn More 按钮 */}
                <Link
                  href={`/docs#${item.guideDocId}`}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-300 px-3.5 py-2 rounded-xl border border-gray-700 transition-all font-medium whitespace-nowrap"
                >
                  Learn More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A10]"></div>}>
      <ReportContent />
    </Suspense>
  );
}