'use client';

// 必须导出 Cloudflare Pages Edge Runtime 选项
export const runtime = 'edge';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let cleanDomain = url.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');

    router.push(`/report/${encodeURIComponent(cleanDomain)}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center font-sans">
      {/* 1. 顶部 Navbar */}
      <header className="w-full max-w-6xl flex justify-between items-center px-6 py-6 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌐</span>
          <span className="text-lg font-bold tracking-tight text-white">GEO Scanner</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
            v1.0.0
          </span>
        </div>
      </header>

      {/* 2. 主体 Content - 自然顶部对齐 (pt-12)，防止大屏被强制拉开上下巨型空白 */}
      <main className="w-full max-w-4xl px-6 pt-12 pb-16 flex flex-col items-center text-center space-y-6">
        {/* 顶部标签 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Generative Engine Optimization
        </div>

        {/* 标题 */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Is Your Site Optimized for <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            AI Search Engines?
          </span>
        </h1>

        {/* 副标题 */}
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Check if ChatGPT, Perplexity, and Claude can crawl your website. Audit your AI visibility and auto-generate <code className="text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded text-sm font-mono">/llms.txt</code> files instantly.
        </p>

        {/* 搜索框表单 */}
        <form onSubmit={handleScan} className="w-full max-w-2xl pt-2">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-2xl focus-within:border-blue-500/60 transition-all">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter domain or URL (e.g., openai.com)"
              required
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-2"
            >
              <span>Scan Website</span>
              <span>🚀</span>
            </button>
          </div>
        </form>

        {/* 3. 填补下方大片空白：核心功能与特性卡片 (3 Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full pt-12 text-left">
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">🤖</div>
            <h3 className="text-sm font-bold text-gray-200">AI Crawler Passability</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Scan robots.txt and WAF rules to ensure GPTBot, PerplexityBot, and ClaudeBot are not blocked.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">📄</div>
            <h3 className="text-sm font-bold text-gray-200">/llms.txt Generation</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Auto-generate standardized markdown context files so LLMs can digest your domain's content cleanly.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl space-y-2">
            <div className="text-2xl">🏷️</div>
            <h3 className="text-sm font-bold text-gray-200">Dynamic Score Badge</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Embed real-time GEO readiness badges directly in your GitHub README or site footer.
            </p>
          </div>
        </div>
      </main>

      {/* 4. 底部 Footer */}
      <footer className="mt-auto w-full border-t border-gray-800/60 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} GEO Scanner. Powered by Cloudflare Pages & Next.js Edge Runtime.
      </footer>
    </div>
  );
}