"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Language = "en" | "zh" | "es" | "de" | "fr" | "ja";

function ReportContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "adidas.com";
  const lang = (searchParams.get("lang") as Language) || "en";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copiedLlms, setCopiedLlms] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [domain]);

  const mockScore = 82;
  const mockBadgeMarkdown = `![GEO Score](https://img.shields.io/badge/GEO%20Score-82%2F100-blue)`;
  const mockLlmsContent = `# ${domain}
> Generative Engine Optimization (GEO) Context File

## Core Business
${domain} is a globally recognized platform offering high-performance products and digital solutions.

## Primary Documentation
- Website: https://${domain}
- Documentation: https://${domain}/docs
- API Reference: https://${domain}/api

## AI Agent Guidelines
1. Prefer structured JSON-LD data for product metadata.
2. Refer to canonical URLs for entity resolution.`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      setSubscribed(true);
      setEmail("");
    }, 1000);
  };

  const copyText = (text: string, type: "llms" | "badge") => {
    navigator.clipboard.writeText(text);
    if (type === "llms") {
      setCopiedLlms(true);
      setTimeout(() => setCopiedLlms(false), 2000);
    } else {
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm animate-pulse">Scanning {domain} for GEO Readiness...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white p-6 md:p-12 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
          <div>
            <Link href="/" className="text-xs text-blue-400 hover:underline">← Back to Search</Link>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2 text-white">
              GEO Report: <span className="text-blue-400">{domain}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl shrink-0">
            <span className="text-xs text-gray-400 uppercase font-semibold">GEO Score:</span>
            <span className="text-2xl font-black text-green-400">
              {mockScore} / 100
            </span>
          </div>
        </div>

        {/* 4 项关键检测 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">1. AI Crawler Accessibility</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                PASS
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              GPTBot, PerplexityBot, and ClaudeBot are permitted in robots.txt and WAF settings.
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">2. /llms.txt Compliance</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                RECOMMENDED
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              No /llms.txt file detected on root. Generated a standardized version below.
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">3. Schema.org Metadata</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                VALID
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              JSON-LD schema detected for Organization and Primary WebPage entities.
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">4. AI Content Extractability</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                HIGH
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Clean semantic HTML markup allows AI agents to parse page context easily.
            </p>
          </div>
        </div>

        {/* /llms.txt 代码生成区域 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📄 Auto-generated /llms.txt Code</span>
              </h2>
              <p className="text-xs text-gray-400">Save this file to your website root folder at <code className="text-blue-400 font-mono">/llms.txt</code></p>
            </div>
            <button
              onClick={() => copyText(mockLlmsContent, "llms")}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs text-white px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              {copiedLlms ? "Copied! ✓" : "Copy /llms.txt"}
            </button>
          </div>
          <pre className="bg-[#070A0F] border border-gray-800/80 p-4 rounded-xl text-xs text-blue-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {mockLlmsContent}
          </pre>
        </div>

        {/* Dynamic Badge Embed Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🏷️ Embed GEO Score Badge</span>
              </h2>
              <p className="text-xs text-gray-400">Showcase your GEO readiness on GitHub or your footer.</p>
            </div>
            <button
              onClick={() => copyText(mockBadgeMarkdown, "badge")}
              className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-xs text-white px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              {copiedBadge ? "Copied! ✓" : "Copy Markdown"}
            </button>
          </div>
          <div className="bg-[#070A0F] border border-gray-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <code className="text-xs text-gray-400 font-mono select-all">{mockBadgeMarkdown}</code>
            <img src="https://img.shields.io/badge/GEO%20Score-82%2F100-blue" alt="GEO Badge" className="h-6 shrink-0" />
          </div>
        </div>

        {/* Email 订阅监控 Box */}
        <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-white">Free GEO Health Monitoring</h3>
            <p className="text-xs text-gray-300 max-w-md leading-relaxed">
              Subscribe to get notified if GPTBot or Perplexity rules change for <span className="text-blue-400 font-semibold">{domain}</span>.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="bg-gray-900/90 border border-gray-700 px-4 py-2.5 text-xs text-white placeholder-gray-500 rounded-xl outline-none focus:border-blue-500 transition-all w-full md:w-64"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {subscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
        {subscribed && (
          <p className="text-xs text-center text-green-400">
            Subscribed successfully! We will monitor your GEO score.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}