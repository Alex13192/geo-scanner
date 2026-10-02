"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";

/**
 * llms.txt studio.
 *
 * This page now calls /api/llms-txt, which fetches the submitted site and
 * builds the file from its real title, description and internal links. It used
 * to interpolate the domain into a hardcoded template describing an enterprise
 * networking vendor, so every submission produced copy unrelated to the site.
 *
 * The textarea stays editable on purpose: the generated file is a starting
 * point built from one page, and the page says so.
 */
function cleanDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0]
    .toLowerCase();
}

function StudioContent() {
  const searchParams = useSearchParams();
  const rootDomain = cleanDomain(searchParams.get("domain") || "");

  const [domain, setDomain] = useState(rootDomain);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkCount, setLinkCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async (target: string) => {
    if (!target) {
      setError("Enter a domain first.");
      setContent("");
      return;
    }
    setLoading(true);
    setError("");
    setContent("");
    setLinkCount(null);

    try {
      const res = await fetch(
        `/api/llms-txt?domain=${encodeURIComponent(target)}&lang=en`
      );
      const data = await res.json();
      if (!data.reachable) {
        setError(data.error || "The site could not be read.");
      } else {
        setContent(data.content || "");
        setLinkCount(typeof data.linkCount === "number" ? data.linkCount : null);
      }
    } catch {
      setError("The generator could not be reached. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDomain(rootDomain);
    if (rootDomain) void generate(rootDomain);
  }, [rootDomain, generate]);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "llms.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
                onClick={() => navigateTo(`/report/?domain=${domain || rootDomain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Audit Overview
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                /llms.txt Studio
              </span>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${domain || rootDomain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Readiness Badge
              </button>
            </nav>
          </div>
          <a
            href="/de/llms-txt-studio/"
            hrefLang="de"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap"
          >
            🇩🇪 Deutsch
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Markdown Studio
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            /llms.txt Generator
            {domain ? (
              <>
                {" "}
                for <span className="text-blue-400">{domain}</span>
              </>
            ) : null}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Reads your homepage and drafts a starting llms.txt from your real title, description
            and internal links.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-8">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate(cleanDomain(domain))}
            placeholder="your-domain.com"
            className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-all"
          />
          <button
            onClick={() => generate(cleanDomain(domain))}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
          >
            {loading ? "Reading site…" : "Generate llms.txt"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-2xl p-6 mb-8">
            {error}
          </div>
        )}

        <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-800/80 pb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-mono text-gray-400">Preview: /llms.txt</span>
              {linkCount !== null && (
                <span className="text-[11px] text-gray-500 font-mono">
                  {linkCount} link{linkCount === 1 ? "" : "s"} found on the homepage
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!content}
                className="text-xs bg-gray-900 hover:bg-gray-800 disabled:opacity-50 border border-gray-700 text-gray-200 px-3 py-1.5 rounded-lg font-medium transition-all"
              >
                {copied ? "✓ Copied" : "Copy raw"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!content}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              >
                Download .txt
              </button>
            </div>
          </div>

          <textarea
            value={loading ? "Reading your homepage…" : content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="w-full h-96 bg-[#070A10] border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
          />

          <p className="text-[11px] text-gray-500 leading-relaxed pt-4">
            Edit before publishing. This draft is built from one page, so it only lists what the
            homepage links to, and the descriptions are the link texts as written. Sites that
            redirect visitors by location may return a regional version, so check the links
            before you ship this. Upload the result so it is reachable at{" "}
            <code className="text-gray-400">https://your-domain.com/llms.txt</code>. Note that
            llms.txt is a convention rather than a standard, and Google has said it does not use
            it in Search — see{" "}
            <a href="/docs/llms-txt-deployment/" className="text-blue-400 hover:text-blue-300 underline">
              what llms.txt does and does not do
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">
          Loading Studio...
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
