"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";

/**
 * German llms.txt studio.
 *
 * Calls the same /api/llms-txt endpoint as the English page. Only the chrome is
 * translated by this file; the generated document's scaffolding comes from the
 * endpoint, which localises it from the lang parameter. The two studios do NOT
 * produce identical bytes: lang=de also asks the target site for its German
 * version via Accept-Language, which is the point of having a German studio.
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
      setError("Bitte zuerst eine Domain eingeben.");
      setContent("");
      return;
    }
    setLoading(true);
    setError("");
    setContent("");
    setLinkCount(null);

    try {
      const res = await fetch(
        `/api/llms-txt?domain=${encodeURIComponent(target)}&lang=de`
      );
      const data = await res.json();
      if (!data.reachable) {
        setError(
          data.status
            ? `Die Startseite antwortete mit HTTP ${data.status}.`
            : "Die Website konnte nicht gelesen werden."
        );
      } else {
        setContent(data.content || "");
        setLinkCount(typeof data.linkCount === "number" ? data.linkCount : null);
      }
    } catch {
      setError("Der Generator war nicht erreichbar. Bitte erneut versuchen.");
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
              onClick={() => navigateTo("/de/")}
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
                Analyse
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                /llms.txt-Studio
              </span>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${domain || rootDomain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Sichtbarkeits-Badge
              </button>
            </nav>
          </div>
          <a
            href="/llms-txt-studio/"
            hrefLang="en"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap"
          >
            🇬🇧 English
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Markdown-Studio
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            /llms.txt-Generator
            {domain ? (
              <>
                {" "}
                für <span className="text-blue-400">{domain}</span>
              </>
            ) : null}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Liest Ihre Startseite und entwirft eine erste llms.txt aus Ihrem echten Titel, Ihrer
            Beschreibung und Ihren internen Links.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-8">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate(cleanDomain(domain))}
            placeholder="ihre-domain.de"
            className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-all"
          />
          <button
            onClick={() => generate(cleanDomain(domain))}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
          >
            {loading ? "Website wird gelesen…" : "llms.txt erzeugen"}
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
              <span className="text-xs font-mono text-gray-400">Vorschau: /llms.txt</span>
              {linkCount !== null && (
                <span className="text-[11px] text-gray-500 font-mono">
                  {linkCount} {linkCount === 1 ? "Link" : "Links"} auf der Startseite gefunden
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!content}
                className="text-xs bg-gray-900 hover:bg-gray-800 disabled:opacity-50 border border-gray-700 text-gray-200 px-3 py-1.5 rounded-lg font-medium transition-all"
              >
                {copied ? "✓ Kopiert" : "Kopieren"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!content}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              >
                Als .txt herunterladen
              </button>
            </div>
          </div>

          <textarea
            value={loading ? "Ihre Startseite wird gelesen…" : content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="w-full h-96 bg-[#070A10] border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
          />

          <p className="text-[11px] text-gray-500 leading-relaxed pt-4">
            Vor dem Veröffentlichen prüfen. Dieser Entwurf entsteht aus einer einzigen Seite und
            listet daher nur, worauf die Startseite verlinkt; die Beschreibungen sind die
            Linktexte wie geschrieben. Websites, die Besucher nach Standort weiterleiten, liefern
            möglicherweise eine regionale Fassung – prüfen Sie die Links daher vor der
            Veröffentlichung. Laden Sie das Ergebnis so hoch, dass es unter{" "}
            <code className="text-gray-400">https://ihre-domain.de/llms.txt</code> erreichbar ist.
            Beachten Sie, dass llms.txt eine Konvention und kein Standard ist und Google erklärt
            hat, sie nicht in der Suche zu verwenden – siehe{" "}
            <a href="/de/docs/llms-txt-erstellen/" className="text-blue-400 hover:text-blue-300 underline">
              was llms.txt leistet und was nicht
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default function GermanStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">
          Studio wird geladen…
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
