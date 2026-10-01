"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [domain, setDomain] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    const cleanDomain = domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    router.push(`/report?domain=${encodeURIComponent(cleanDomain)}`);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-white/5 bg-[#090D16]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
              G
            </div>
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              GEO Scanner
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              v1.0 Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Generative Engine Optimization (GEO) Analytics
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent leading-tight">
          Analyze Your Brand's Share of AI Voice
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-normal leading-relaxed">
          Measure how leading AI engines like ChatGPT, Perplexity, Gemini, and Claude mention, recommend, and position your brand.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mb-16">
          <div className="relative flex items-center p-2 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl focus-within:border-blue-500/50 transition-all duration-300">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter your domain or brand (e.g. adidas.com)"
              className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 outline-none text-base"
              required
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex-shrink-0"
            >
              Scan Brand &rarr;
            </button>
          </div>
        </form>

        {/* Platform Grid Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { name: "ChatGPT", status: "Active Scanner" },
            { name: "Perplexity", status: "Active Scanner" },
            { name: "Google Gemini", status: "Active Scanner" },
            { name: "Claude 3.5", status: "Active Scanner" },
          ].map((engine, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm text-left">
              <div className="text-sm font-medium text-gray-200 mb-1">{engine.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {engine.status}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6 text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} GEO Scanner. Powered by Cloudflare Pages.
      </footer>
    </div>
  );
}