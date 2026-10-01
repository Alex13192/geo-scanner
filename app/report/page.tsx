"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

interface ActionItem {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  action: string;
  guideDocId: string;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "adidas.com";

  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string>("All Priority");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const actionItems: ActionItem[] = [
    {
      id: "GEO-109",
      priority: "HIGH",
      title: "Deploy Standardized /llms.txt at Root Directory",
      description: "AI agents like GPTBot and ClaudeBot require a clean Markdown context map to crawl complex domain hierarchies without hallucinating.",
      action: "Download or copy the generated /llms.txt file below and deploy to your site's public root folder.",
      guideDocId: "llms-txt-deployment",
    },
    {
      id: "GEO-209",
      priority: "HIGH",
      title: "Fix Robots.txt Disallow Rules for PerplexityBot",
      description: "PerplexityBot is experiencing elevated 403 response rates due to overly aggressive WAF challenge rules on /api endpoints.",
      action: "Update Cloudflare / WAF rules to whitelist PerplexityBot user-agents for public product catalog URLs.",
      guideDocId: "allow-ai-crawlers",
    },
    {
      id: "GEO-309",
      priority: "MEDIUM",
      title: "Adopt Direct Q&A Headings (H2/H3)",
      description: "Transform generic subheadings into natural query phrases that mirror real user AI prompts (e.g., 'How does X integrate with Y?').",
      action: "Restructure product documentation subheadings into precise interrogative formats.",
      guideDocId: "qa-style-headings",
    },
    {
      id: "GEO-409",
      priority: "MEDIUM",
      title: "Embed Self-Contained Quotable Summaries",
      description: "Place concise 80-100 word summaries at the top of long-form pages. LLMs directly extract these blocks into generated answers.",
      action: "Add executive summary blocks wrapped in <section itemprop='abstract'> tags.",
      guideDocId: "qa-style-headings",
    },
    {
      id: "GEO-509",
      priority: "LOW",
      title: "Enhance Author Person Schema Markup",
      description: "Improve E-E-A-T attribution signals by linking author profiles to external entity bases like Wikidata or LinkedIn.",
      action: "Implement Schema.org JSON-LD Person and Organization properties across core landing pages.",
      guideDocId: "schema-org-jsonld",
    },
  ];

  const filteredItems = actionItems.filter((item) => {
    if (selectedPriority === "High Priority") return item.priority === "HIGH";
    if (selectedPriority === "Medium Priority") return item.priority === "MEDIUM";
    if (selectedPriority === "Low Priority") return item.priority === "LOW";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A10] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 font-mono tracking-wider uppercase">
          EVALUATING GENERATIVE INDEXING FOR {domain}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      {/* Top Navbar */}
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
              <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium">Audit Overview</button>
              <button className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all">/llms.txt Studio</button>
              <button className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all">Readiness Badge</button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg text-gray-300">
              Target: <span className="text-blue-400 font-bold">{domain}</span>
            </span>
            <Link
              href="/"
              className="text-xs bg-blue-600 hover:bg-blue-500 font-medium px-3.5 py-1.5 rounded-lg transition-all"
            >
              New Scan
            </Link>
          </div>
        </div>
      </header>

      {/* Main Advice Section */}
      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        <div className="bg-gray-900/40 border border-gray-800/80 p-8 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-lg">💡</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Strategic Optimization Advice</h2>
                <span className="text-xs font-mono bg-gray-800 text-gray-300 border border-gray-700 px-2.5 py-0.5 rounded-full font-semibold">
                  {actionItems.length} Action Items
                </span>
              </div>
              <p className="text-xs text-gray-400 pl-8">
                Prioritized technical and content adjustments to boost AI agent indexing.
              </p>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800/80 text-xs">
              {["All Priority", "High Priority", "Medium Priority", "Low Priority"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    selectedPriority === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#070A10]/80 border border-gray-800/80 hover:border-gray-700 p-6 rounded-xl space-y-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.priority === "HIGH"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : item.priority === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {item.priority} PRIORITY
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-500">{item.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                </div>

                {/* Action Block with Guide Link */}
                <div className="bg-gray-900/90 border border-gray-800/90 p-3.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="font-mono text-gray-300 flex-1">
                    <span className="text-blue-400 font-bold">Action:</span> {item.action}
                  </div>
                  <Link
                    href={`/docs#${item.guideDocId}`}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-1 whitespace-nowrap"
                  >
                    View Guide →
                  </Link>
                </div>
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
    <Suspense fallback={<div className="min-h-screen bg-[#070A10]"></div>}>
      <ReportContent />
    </Suspense>
  );
}