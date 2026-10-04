"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

/**
 * The interactive half of /llms-txt-studio/ - input, request, preview, copy.
 *
 * WHY THIS IS A SEPARATE FILE FROM page.tsx:
 * This component calls useSearchParams(), which in the App Router opts the
 * subtree it sits in out of prerendering: during `next build` Next renders the
 * nearest Suspense fallback instead of the component, because the query string
 * is not known at build time. While page.tsx was a single "use client" module,
 * that meant the whole route prerendered to nothing but the string
 * "Loading Studio..." - no headings, no body text, no <a href> anywhere. The
 * live page fetched fine, but the HTML a crawler or an LLM actually received
 * was two words long, on a site whose entire product is telling other people
 * that this is the thing that stops them being cited.
 *
 * So the split is deliberate: everything that does not depend on the query
 * string now lives in page.tsx as a server component and is present in the
 * prerendered HTML, and only the part that genuinely needs the browser is
 * here. Keep it that way - do not move static copy into this file.
 */
function cleanDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0]
    .toLowerCase();
}

export default function StudioWidget() {
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
    <section aria-labelledby="studio-heading">
      <h2 id="studio-heading" className="sr-only">
        Generate an llms.txt file
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-8">
        <label htmlFor="studio-domain" className="sr-only">
          Domain to read
        </label>
        <input
          id="studio-domain"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate(cleanDomain(domain))}
          placeholder="your-domain.com"
          className="flex-1 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink-1)] placeholder-[var(--ink-3)] outline-none focus:border-blue-500 transition-all"
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
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-sm rounded-2xl p-6 mb-8">
          {error}
        </div>
      )}

      <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-mono text-[var(--ink-2)]">Preview: /llms.txt</span>
            {linkCount !== null && (
              <span className="text-[11px] text-[var(--ink-3)] font-mono">
                {linkCount} link{linkCount === 1 ? "" : "s"} found on the homepage
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={!content}
              className="text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-1)] disabled:opacity-50 border border-[var(--line)] text-[var(--ink-1)] px-3 py-1.5 rounded-lg font-medium transition-all"
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

        <label htmlFor="studio-output" className="sr-only">
          Generated llms.txt content, editable
        </label>
        <textarea
          id="studio-output"
          value={loading ? "Reading your homepage…" : content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="w-full h-96 bg-[var(--surface-0)] border border-[var(--line)] rounded-xl p-4 text-xs font-mono text-[var(--ink-2)] focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
        />

        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed pt-4">
          Edit before publishing. This draft is built from one page, so it only lists what the
          homepage links to, and the descriptions are the link texts as written. Sites that
          redirect visitors by location may return a regional version, so check the links
          before you ship this.
        </p>
      </div>
    </section>
  );
}
