"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ReportData {
  domain: string;
  score: number;
  engines: {
    name: string;
    visibility: number;
    status: string;
    mentions: string;
  }[];
  insights: string[];
}

function ReportContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "example.com";

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReport({
        domain,
        score: Math.floor(Math.random() * 25) + 68,
        engines: [
          { name: "ChatGPT (SearchGPT)", visibility: 85, status: "Strong Recommendation", mentions: "Frequent citation in domain queries" },
          { name: "Perplexity AI", visibility: 72, status: "Moderate Citation", mentions: "Listed in top comparison answers" },
          { name: "Google Gemini", visibility: 68, status: "Moderate Citation", mentions: "Secondary source citation" },
          { name: "Claude 3.5", visibility: 58, status: "Needs Improvement", mentions: "Limited domain entity recognition" },
        ],
        insights: [
          "Knowledge Graph entity coverage is optimal across Wikidata & Crunchbase.",
          "Add schema.org structured markup for primary service pages to improve Perplexity indexing.",
          "Boost brand mentions in reputable industry news sources to increase Claude entity awareness.",
        ],
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [domain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white flex flex-col items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-semibold text-gray-200">Analyzing GEO Search Signals...</h2>
          <p className="text-sm text-gray-500 mt-2">Querying AI models for <span className="text-blue-400 font-medium">{domain}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-white selection:bg-blue-500 selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#090D16]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            &larr; Back to Scanner
          </Link>
          <div className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
            Target: <span className="text-blue-400 font-medium">{report?.domain}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-5xl mx-auto px-6 pt-10">
        {/* Top Summary Card */}
        <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">GEO Visibility Score</div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Search Recommendation Index</h1>
            <p className="text-sm text-gray-400 max-w-lg">
              Calculated based on brand presence, citation frequency, and recommendation preference across major generative search engines.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-blue-600/10 border border-blue-500/20 min-w-[160px]">
            <div className="text-5xl font-extrabold text-blue-400">{report?.score}</div>
            <div className="text-xs text-gray-400 mt-1">Out of 100</div>
          </div>
        </div>

        {/* Engine Breakdown */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">Generative Engine Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report?.engines.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-200">{item.name}</span>
                  <span className="text-sm font-bold text-blue-400">{item.visibility}%</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{item.mentions}</p>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" style={{ width: `${item.visibility}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Strategic Action Items</h2>
          <div className="space-y-3">
            {report?.insights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <span className="text-blue-400 font-bold text-base">&bull;</span>
                <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}