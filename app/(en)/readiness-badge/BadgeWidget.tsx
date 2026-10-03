"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { SITE_URL } from "@/lib/site";

/**
 * Readiness badge generator.
 *
 * Three things were wrong here and they compounded:
 *   1. The domain defaulted to "cisco.com", so anyone landing on the page saw
 *      somebody else's site in the form.
 *   2. The score defaulted to 68 and was a free-text field, so a user could
 *      type any number and have the badge assert it. A badge whose number the
 *      bearer chooses is not evidence of anything.
 *   3. The homepage advertised a "real-time" badge. The badge is a static
 *      shields.io image with the number baked in at copy time; it never
 *      updates.
 *
 * The score is now read from a real scan and cannot be edited. If the scan
 * fails, no embed code is shown at all - better to say nothing than to hand
 * somebody a number they cannot defend.
 *
 * WHY THIS IS A SEPARATE FILE FROM page.tsx:
 * This component calls useSearchParams(), which opts its subtree out of
 * prerendering - `next build` writes the nearest Suspense fallback instead. While
 * page.tsx was a single "use client" module, this route shipped 12 words of HTML
 * and not one <a href>, which for a site that scores other people on exactly that
 * was the wrong answer to give. The static copy now lives in page.tsx as a server
 * component. Do not move copy back into this file.
 */
function cleanDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0]
    .toLowerCase();
}

function getScoreColor(s: number) {
  if (s >= 80) return { bg: "#10B981", label: "Good" };
  if (s >= 60) return { bg: "#F59E0B", label: "Moderate" };
  return { bg: "#EF4444", label: "Critical" };
}

export default function BadgeWidget() {
  const searchParams = useSearchParams();
  const rawDomain = cleanDomain(searchParams.get("domain") || "");

  const [domain, setDomain] = useState(rawDomain);
  const [score, setScore] = useState<number | null>(null);
  const [grade, setGrade] = useState("");
  const [scannedDomain, setScannedDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [badgeStyle, setBadgeStyle] = useState<"flat" | "cyber" | "minimal">("flat");
  const [copiedType, setCopiedType] = useState<"md" | "html" | null>(null);

  const scan = useCallback(async (target: string) => {
    if (!target) {
      setError("Enter a domain to check its score.");
      setScore(null);
      return;
    }
    setScanning(true);
    setError("");
    setScore(null);
    setScannedDomain("");

    try {
      const res = await fetch(`/api/scan?domain=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!data.reachable) {
        setError(
          data.status
            ? `That site answered with HTTP ${data.status}, so no score could be produced.`
            : "That site could not be reached, so no score could be produced."
        );
      } else if (typeof data.scoreBasis === "string" && data.scoreBasis !== "homepage") {
        // The score describes a block page or an error document rather than the
        // site. A badge carrying it would assert something about a response
        // nobody intended to publish, so no badge is offered.
        setError(
          `The homepage answered with a ${data.scoreBasis} rather than the page itself, so there is no honest score to put on a badge. Resolve the access issue first, then check again.`
        );
      } else {
        setScore(data.score);
        setGrade(data.grade || "");
        setScannedDomain(target);
      }
    } catch {
      setError("The scanner could not be reached. Please try again.");
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    setDomain(rawDomain);
    if (rawDomain) void scan(rawDomain);
  }, [rawDomain, scan]);

  const colorInfo = score === null ? null : getScoreColor(score);

  // Must point at OUR domain. This URL is embedded in every badge a user
  // copies, so a wrong host here sends all badge traffic to someone else.
  const reportUrl = scannedDomain
    ? `${SITE_URL}/report/?domain=${scannedDomain}`
    : "";

  const markdownSnippet =
    score === null || !colorInfo
      ? ""
      : `[![GEO Readiness](https://img.shields.io/badge/GEO%20Readiness-${score}%2F100-${colorInfo.bg.replace("#", "")}?style=flat-square)](${reportUrl})`;

  const htmlSnippet =
    score === null || !colorInfo
      ? ""
      : `<a href="${reportUrl}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/GEO%20Readiness-${score}%2F100-${colorInfo.bg.replace("#", "")}?style=flat-square" alt="GEO Readiness Score" />
</a>`;

  const handleCopy = (text: string, type: "md" | "html") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const ready = score !== null && colorInfo !== null;

  return (
    <section aria-labelledby="badge-generator-heading">
      <h2 id="badge-generator-heading" className="sr-only">
        Badge generator
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-gray-800/80 pb-4">
            Badge Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="badge-domain"
                className="block text-xs font-medium text-gray-300 mb-1.5"
              >
                Target domain
              </label>
              <div className="flex gap-2">
                <input
                  id="badge-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scan(cleanDomain(domain))}
                  placeholder="your-domain.com"
                  className="flex-1 bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
                <button
                  onClick={() => scan(cleanDomain(domain))}
                  disabled={scanning}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
                >
                  {scanning ? "Scanning…" : "Check score"}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 pt-2 leading-relaxed">
                The score is produced by scanning the site the same way the main audit does. It
                cannot be typed in.
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-300 mb-1.5">
                Score used in the badge
              </span>
              <div className="w-full bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono flex items-center justify-between">
                <span className="text-gray-400">
                  {scanning ? "Scanning the site…" : ready ? scannedDomain : "No score yet"}
                </span>
                <span
                  className="font-extrabold"
                  style={{ color: colorInfo ? colorInfo.bg : "#6B7280" }}
                >
                  {ready ? `${score} / 100` : "—"}
                </span>
              </div>
            </div>

            {ready && (
              <div>
                <span className="block text-xs font-medium text-gray-300 mb-1.5">
                  Badge style
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["flat", "cyber", "minimal"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBadgeStyle(style)}
                      aria-pressed={badgeStyle === style}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all capitalize ${
                        badgeStyle === style
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-[#070A10] border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 pt-2 leading-relaxed">
                  The style choice only changes the preview below. All three embed the same
                  shields.io image, which uses the flat style.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-gray-950/60 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide border-b border-gray-800/80 pb-4">
              Preview
            </h3>

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl p-4">
                {error}
              </div>
            )}

            {!ready && !error && (
              <div className="my-8 flex items-center justify-center p-8 bg-[#070A10] rounded-xl border border-dashed border-gray-800 text-center">
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  {scanning
                    ? "Scanning the site to read its real score…"
                    : "Enter a domain and check its score. The badge and the embed code appear once a real score exists."}
                </p>
              </div>
            )}

            {ready && colorInfo && (
              <>
                <div className="my-8 flex items-center justify-center p-8 bg-[#070A10] rounded-xl border border-gray-800/80">
                  {badgeStyle === "flat" && (
                    <div className="inline-flex items-center text-xs font-mono rounded-md overflow-hidden shadow-lg border border-gray-800">
                      <span className="bg-gray-800 text-gray-300 px-3 py-1.5 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        GEO Readiness
                      </span>
                      <span
                        style={{ backgroundColor: colorInfo.bg }}
                        className="text-white px-3 py-1.5 font-extrabold"
                      >
                        {score} / 100
                      </span>
                    </div>
                  )}

                  {badgeStyle === "cyber" && (
                    <div className="inline-flex items-center text-xs font-mono rounded-lg overflow-hidden border border-purple-500/30 bg-purple-950/20 p-1 shadow-md gap-2">
                      <span className="text-purple-300 font-bold px-2 py-1 bg-purple-900/40 rounded">
                        ⚡ AI READY
                      </span>
                      <span className="text-white font-extrabold pr-2">
                        {scannedDomain} :{" "}
                        <span style={{ color: colorInfo.bg }}>{score} pts</span>
                      </span>
                    </div>
                  )}

                  {badgeStyle === "minimal" && (
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-gray-300 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-full">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colorInfo.bg }}
                      ></span>
                      <span>
                        GEO Score: <b>{score}</b>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-300">
                        Markdown (for GitHub README)
                      </span>
                      <button
                        onClick={() => handleCopy(markdownSnippet, "md")}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {copiedType === "md" ? "✓ Copied" : "Copy Markdown"}
                      </button>
                    </div>
                    <pre className="bg-[#070A10] border border-gray-800 rounded-xl p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                      {markdownSnippet}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-300">
                        HTML (for website or footer)
                      </span>
                      <button
                        onClick={() => handleCopy(htmlSnippet, "html")}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {copiedType === "html" ? "✓ Copied" : "Copy HTML"}
                      </button>
                    </div>
                    <pre className="bg-[#070A10] border border-gray-800 rounded-xl p-3 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                      {htmlSnippet}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
