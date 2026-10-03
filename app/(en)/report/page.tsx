"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, Suspense } from "react";

function cleanDomain(domain: string): string {
  // Never invent a domain. This returned "example.com" for empty input, which
  // turned a missing parameter into a confident report about a site the visitor
  // never asked about.
  if (!domain) return "";
  return domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
}

function scoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-500";
  if (score >= 50) return "bg-gradient-to-r from-amber-500 to-orange-500";
  return "bg-gradient-to-r from-red-500 to-rose-500";
}

function gradeBadgeClass(score: number): string {
  if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (score >= 60) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  return "text-red-400 bg-red-500/10 border-red-500/30";
}

interface IssueItem {
  id: string;
  category: string;
  title: string;
  severity: "high" | "medium" | "low";
  summary: string;
  recommendation: string;
  evidence?: string;
}

interface Dimension {
  id: string;
  label: string;
  /** Share of the total score, in percent. */
  weight: number;
  score: number;
  earned: number;
  possible: number;
  rationale: string;
}

interface Metrics {
  crawlability: number;
  understandability: number;
  answerReadiness: number;
  citability: number;
  trustAuthority: number;
  contentDepth: number;
}

/**
 * Fallback used only if the API response predates the weighted dimension
 * breakdown, so the page degrades to the old six-card view instead of breaking.
 */
function legacyDimensions(m: Metrics): Dimension[] {
  return [
    { id: "ai-crawler-access", label: "AI Crawler Access", score: m.crawlability, weight: 16, earned: 0, possible: 0, rationale: "" },
    { id: "semantic-structure", label: "Semantic Structure", score: m.understandability, weight: 8, earned: 0, possible: 0, rationale: "" },
    { id: "answer-readiness", label: "Answer Readiness", score: m.answerReadiness, weight: 10, earned: 0, possible: 0, rationale: "" },
    { id: "citability", label: "Citability & Evidence", score: m.citability, weight: 11, earned: 0, possible: 0, rationale: "" },
    { id: "trust-authority", label: "Trust & Authority", score: m.trustAuthority, weight: 10, earned: 0, possible: 0, rationale: "" },
    { id: "content-depth", label: "Content Depth", score: m.contentDepth, weight: 11, earned: 0, possible: 0, rationale: "" },
  ];
}

function ReportContent() {
  const searchParams = useSearchParams();
  // No default domain. Landing here without one used to run a full scan of
  // cisco.com and present the result as the visitor's own report.
  const rawDomain = searchParams.get("domain") || "";
  const rootDomain = cleanDomain(rawDomain);

  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [grade, setGrade] = useState<string>("");
  const [gradeLabel, setGradeLabel] = useState<string>("");
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [checksRun, setChecksRun] = useState<number>(0);
  const [checksPassed, setChecksPassed] = useState<number>(0);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    crawlability: 0,
    understandability: 0,
    answerReadiness: 0,
    citability: 0,
    trustAuthority: 0,
    contentDepth: 0,
  });
  const [siteUnreachable, setSiteUnreachable] = useState(false);
  /**
   * What the score actually describes. "homepage" is the normal case; anything
   * else means the server answered with an error or a challenge page and the
   * analyser scored that response body. Twelve dimension scores imply a real
   * page was read, so when they do not describe one, the page has to say so.
   */
  const [scoreBasis, setScoreBasis] = useState("homepage");
  const [browserStatus, setBrowserStatus] = useState<number | null>(null);
  /** True when the response was larger than the read cap and was truncated. */
  const [truncated, setTruncated] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    // Nothing to audit. Do not call the API at all: an empty report full of
    // zeroes looks like a real result, which is worse than saying nothing.
    if (!rootDomain) {
      setLoading(false);
      return;
    }

    async function runServerAudit() {
      setLoading(true);
      setSiteUnreachable(false);
      setScoreBasis("homepage");
      setTruncated(false);
      setDimensions([]);
      setGrade("");
      setGradeLabel("");
      setChecksRun(0);
      setChecksPassed(0);
      setIssues([]);

      try {
        // 请求我们自己的后端 API 接口进行真实服务端扫描
        const res = await fetch(`/api/scan?domain=${encodeURIComponent(rootDomain)}`);
        const data = await res.json();

        if (!data.reachable) {
          setSiteUnreachable(true);
          setOverallScore(0);
        } else {
          setScoreBasis(typeof data.scoreBasis === "string" ? data.scoreBasis : "homepage");
          setBrowserStatus(typeof data.browserStatus === "number" ? data.browserStatus : null);
          setTruncated(data.truncated === true);
          setOverallScore(data.score ?? 0);
          setGrade(data.grade || "");
          setGradeLabel(data.gradeLabel || "");
          setDimensions(Array.isArray(data.dimensions) ? data.dimensions : []);
          setChecksRun(data.checksRun ?? 0);
          setChecksPassed(data.checksPassed ?? 0);
          setIssues(data.issues || []);
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        }
      } catch (e) {
        console.error("Scan error:", e);
        setSiteUnreachable(true);
      } finally {
        setLoading(false);
      }
    }

    runServerAudit();
  }, [rootDomain]);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const filteredIssues = useMemo(() => {
    if (activeFilter === "all") return issues;
    return issues.filter((item) => item.severity === activeFilter);
  }, [activeFilter, issues]);

  if (!rootDomain) {
    return (
      <div className="min-h-screen bg-[#070A10] text-white font-sans flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-gray-950/60 border border-gray-800/80 rounded-2xl p-8 space-y-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">
            L
          </div>
          <h1 className="text-lg font-bold text-white">No domain to audit</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            This page reports on one site at a time and has to be told which one. Enter a domain
            below, or start from the homepage.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = String(new FormData(e.currentTarget).get("domain") || "");
              const target = cleanDomain(value);
              if (target) {
                window.location.href = `/report/?domain=${encodeURIComponent(target)}`;
              }
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              name="domain"
              type="text"
              placeholder="your-domain.com"
              className="flex-1 bg-[#070A10] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              Run audit
            </button>
          </form>
          <a href="/" className="inline-block text-xs text-blue-400 hover:text-blue-300 underline">
            ← Back to the scanner
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-white font-sans pb-20">
      {/* 顶部 Header */}
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
                onClick={() => navigateTo(`/report/?domain=${rootDomain}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium shadow-sm"
              >
                Audit Overview
              </button>
              <button
                onClick={() => navigateTo(`/llms-txt-studio/?domain=${rootDomain}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                /llms.txt Studio
              </button>
              <button
                onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                Readiness Badge
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">Target: {rootDomain}</span>
            <button
              onClick={() => navigateTo(`/llms-txt-studio/?domain=${rootDomain}`)}
              className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              Open Studio Builder →
            </button>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* 顶部 Domain 概览 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gray-950/60 border border-gray-800/80 p-8 rounded-2xl">
          <div>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              GEO Server Scanner
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
              Analysis for <span className="text-blue-400">{rootDomain}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Live scanned via backend edge crawler across multi-dimensional AI optimization vectors.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#070A10] p-4 rounded-xl border border-gray-800">
            <div className="text-center">
              {loading ? (
                <div className="text-sm text-blue-400 animate-pulse font-mono py-2">Scanning via Edge...</div>
              ) : siteUnreachable ? (
                <div className="text-4xl font-black text-red-400 font-mono py-1">--</div>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-4xl font-black font-mono ${scoreTextColor(overallScore)}`}>
                    {overallScore}
                  </span>
                  <span className="text-sm text-gray-500 font-mono">/100</span>
                  {grade && (
                    <span
                      className={`text-base font-black font-mono px-2 py-0.5 rounded-lg border ${gradeBadgeClass(overallScore)}`}
                    >
                      {grade}
                    </span>
                  )}
                </div>
              )}
              <div className="text-[11px] text-gray-400 mt-1">Overall GEO Score</div>
              {!loading && !siteUnreachable && gradeLabel && (
                <div className="text-[11px] text-gray-500 mt-0.5">{gradeLabel}</div>
              )}
              {!loading && !siteUnreachable && checksRun > 0 && (
                <div className="text-[10px] text-gray-600 font-mono mt-1">
                  {checksPassed}/{checksRun} checks passed
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-gray-800"></div>
            <button
              disabled={loading || siteUnreachable}
              onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              Get Badge 🛡️️
            </button>
          </div>
        </div>

        {/* What the score describes. Twelve dimension scores imply that a real
            page was read, so when the analyser actually scored an error or
            challenge response, this has to be said before the numbers are. */}
        {!loading && !siteUnreachable && scoreBasis !== "homepage" && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-2">
            <span className="inline-block text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
              Read this first
            </span>
            <h2 className="text-sm font-bold text-amber-200">
              This score describes a {scoreBasis}, not your page
            </h2>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              The homepage did not return HTTP 200, so what was analysed is the body your server
              sent &mdash; a block page, a challenge or an error document. Every dimension below
              describes that response, not your content.{" "}
              {browserStatus === 200 ? (
                <>
                  The same URL served a browser-shaped request normally, so the refusal is aimed at
                  identified crawlers &mdash; and GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot
                  all present as bots. That refusal <strong>is</strong> a GEO problem rather than a
                  false alarm; the AI Crawler Access finding below says what to change.
                </>
              ) : (
                <>
                  {browserStatus == null
                    ? "A browser-shaped request could not be completed for comparison, so"
                    : `A browser-shaped request was refused as well (HTTP ${browserStatus}), so`}{" "}
                  the refusal points at the address this scan came from rather than at your
                  configuration. Read the score as unverified rather than as a verdict on the site.
                </>
              )}
            </p>
          </div>
        )}

        {!loading && !siteUnreachable && truncated && (
          <div className="mb-8 bg-gray-800/40 border border-gray-700 rounded-2xl p-6 space-y-2">
            <h2 className="text-sm font-bold text-gray-200">The response was truncated</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              The homepage exceeded the 2&nbsp;MB read limit, so scoring stopped partway through
              the document. Checks about content length, structure and extraction are therefore
              measured against an incomplete page and may understate the real result.
            </p>
          </div>
        )}

        {siteUnreachable ? (
          <div className="text-center py-16 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            ❌ Unable to reach <span className="font-mono font-bold">{rootDomain}</span>. Please check if the domain is valid and live.
          </div>
        ) : (
          <>
            {/* Weighted dimension breakdown. Weights are published at /methodology. */}
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Score breakdown</h2>
              <span className="text-[11px] text-gray-500">
                {dimensions.length > 0
                  ? `${dimensions.length} weighted dimensions · 100 points total`
                  : "6 weighted dimensions"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {(dimensions.length > 0 ? dimensions : legacyDimensions(metrics)).map((d) => (
                <div
                  key={d.id}
                  className="bg-gray-950/40 border border-gray-800/80 p-4 rounded-xl"
                  title={d.rationale || undefined}
                >
                  <div className="flex justify-between items-center mb-2 gap-3">
                    <span className="text-xs text-gray-300 font-medium">{d.label}</span>
                    <span className="flex items-baseline gap-2 shrink-0">
                      <span className="text-[10px] text-gray-600 font-mono">{d.weight}%</span>
                      <span className={`text-sm font-bold font-mono ${scoreTextColor(d.score)}`}>
                        {loading ? "--" : d.score}
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${scoreBarColor(d.score)}`}
                      style={{ width: loading ? "0%" : `${d.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* 优化建议列表 Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Optimization Advice</h2>
              <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
                {(["all", "high", "medium", "low"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                      activeFilter === filter
                        ? "bg-gray-800 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* 加载中与问题列表 */}
            {loading ? (
              <div className="text-center py-20 bg-gray-950/20 rounded-2xl border border-gray-800/40">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm text-gray-400 font-mono">Crawling and analyzing https://{rootDomain} via edge nodes...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-mono">
                🎉 Perfect Score! No major GEO issues found for this domain.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-gray-950/40 border border-gray-800/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            issue.severity === "high"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : issue.severity === "medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{issue.category}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{issue.title}</h3>
                      <p className="text-xs text-gray-400">
                        <span className="text-gray-500">What we found: </span>
                        {issue.summary}
                      </p>
                    </div>

                    <div className="bg-[#070A10] p-3 rounded-xl border border-gray-800 text-xs text-gray-300 md:max-w-xs">
                      <span className="text-blue-400 font-bold block mb-1">Recommendation:</span>
                      {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A10] flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}