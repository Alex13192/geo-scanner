"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

/**
 * The interactive half of /report/ - fetch, score, dimension bars, issues.
 *
 * WHY THIS IS A SEPARATE FILE FROM page.tsx:
 * This component calls useSearchParams(), which opts its subtree out of
 * prerendering, so `next build` writes the Suspense fallback instead of the
 * component. While this was the whole route, /report/ shipped with no headings,
 * no body text and no <a href> at all - on the page a visitor sees first after
 * typing a domain, and the page the badge generator links to.
 *
 * The report itself genuinely cannot be prerendered: it depends on a query
 * string. What can be is the chrome and the explanation, which is what page.tsx
 * now renders as a server component. Keep static copy there.
 *
 * The <h1> was demoted to a <p> during that split, because page.tsx supplies the
 * page's only h1. Hydrating two would have been worse than the original problem.
 */

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

export default function ReportWidget() {
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
      <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] font-sans flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-8 space-y-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">
            L
          </div>
          <h2 className="text-lg font-bold text-[var(--ink-1)]">No domain to audit</h2>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
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
              className="flex-1 bg-[var(--surface-0)] border border-[var(--line)] rounded-xl px-4 py-2.5 text-xs text-[var(--ink-1)] placeholder-[var(--ink-3)] focus:outline-none focus:border-blue-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              Run audit
            </button>
          </form>
          <a href="/" className="inline-block text-xs text-[var(--accent)] hover:opacity-75 underline">
            ← Back to the scanner
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[var(--ink-1)] font-sans">
      {/* 主体内容 */}
      <section aria-label="Scan result" className="mt-2">
        {/* 顶部 Domain 概览 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-2xl">
          <div>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-[var(--accent)] border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              GEO Server Scanner
            </span>
            <p className="text-lg font-bold text-[var(--ink-1)] mt-3 tracking-tight">
              Live result for <span className="text-[var(--accent)]">{rootDomain}</span>
            </p>
            <p className="text-xs text-[var(--ink-2)] mt-1">
              Live scanned via backend edge crawler across multi-dimensional AI optimization vectors.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[var(--surface-0)] p-4 rounded-xl border border-[var(--line)]">
            <div className="text-center">
              {loading ? (
                <div className="text-sm text-[var(--accent)] animate-pulse font-mono py-2">Scanning via Edge...</div>
              ) : siteUnreachable ? (
                <div className="text-4xl font-black text-red-600 font-mono py-1">--</div>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-4xl font-black font-mono ${scoreTextColor(overallScore)}`}>
                    {overallScore}
                  </span>
                  <span className="text-sm text-[var(--ink-3)] font-mono">/100</span>
                  {grade && (
                    <span
                      className={`text-base font-black font-mono px-2 py-0.5 rounded-lg border ${gradeBadgeClass(overallScore)}`}
                    >
                      {grade}
                    </span>
                  )}
                </div>
              )}
              <div className="text-[11px] text-[var(--ink-2)] mt-1">Overall GEO Score</div>
              {!loading && !siteUnreachable && gradeLabel && (
                <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{gradeLabel}</div>
              )}
              {!loading && !siteUnreachable && checksRun > 0 && (
                <div className="text-[10px] text-[var(--ink-3)] font-mono mt-1">
                  {checksPassed}/{checksRun} checks passed
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-[var(--surface-1)]"></div>
            <button
              disabled={loading || siteUnreachable}
              onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
              className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/30 px-3.5 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
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
            <span className="inline-block text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
              Read this first
            </span>
            <h2 className="text-sm font-bold text-amber-700">
              This score describes a {scoreBasis}, not your page
            </h2>
            <p className="text-xs text-amber-700 leading-relaxed">
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
          <div className="mb-8 bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6 space-y-2">
            <h2 className="text-sm font-bold text-[var(--ink-1)]">The response was truncated</h2>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              The homepage exceeded the 2&nbsp;MB read limit, so scoring stopped partway through
              the document. Checks about content length, structure and extraction are therefore
              measured against an incomplete page and may understate the real result.
            </p>
          </div>
        )}

        {siteUnreachable ? (
          <div className="text-center py-16 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm">
            ❌ Unable to reach <span className="font-mono font-bold">{rootDomain}</span>. Please check if the domain is valid and live.
          </div>
        ) : (
          <>
            {/* Weighted dimension breakdown. Weights are published at /methodology. */}
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold text-[var(--ink-1)] tracking-tight">Score breakdown</h2>
              <span className="text-[11px] text-[var(--ink-3)]">
                {dimensions.length > 0
                  ? `${dimensions.length} weighted dimensions · 100 points total`
                  : "6 weighted dimensions"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {(dimensions.length > 0 ? dimensions : legacyDimensions(metrics)).map((d) => (
                <div
                  key={d.id}
                  className="bg-[var(--surface-1)] border border-[var(--line)] p-4 rounded-xl"
                  title={d.rationale || undefined}
                >
                  <div className="flex justify-between items-center mb-2 gap-3">
                    <span className="text-xs text-[var(--ink-2)] font-medium">{d.label}</span>
                    <span className="flex items-baseline gap-2 shrink-0">
                      <span className="text-[10px] text-[var(--ink-3)] font-mono">{d.weight}%</span>
                      <span className={`text-sm font-bold font-mono ${scoreTextColor(d.score)}`}>
                        {loading ? "--" : d.score}
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 overflow-hidden">
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
              <h2 className="text-lg font-bold text-[var(--ink-1)] tracking-tight">Optimization Advice</h2>
              <div className="flex items-center gap-1 bg-[var(--surface-0)] p-1 rounded-xl border border-[var(--line)] text-xs">
                {(["all", "high", "medium", "low"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                      activeFilter === filter
                        ? "bg-[var(--surface-1)] text-[var(--ink-1)] shadow-sm"
                        : "text-[var(--ink-2)] hover:text-[var(--ink-1)]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* 加载中与问题列表 */}
            {loading ? (
              <div className="text-center py-20 bg-[var(--surface-1)] rounded-2xl border border-[var(--line)]">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm text-[var(--ink-2)] font-mono">Crawling and analyzing https://{rootDomain} via edge nodes...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 text-sm font-mono">
                🎉 Perfect Score! No major GEO issues found for this domain.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-[var(--surface-1)] border border-[var(--line)] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            issue.severity === "high"
                              ? "bg-red-500/10 text-red-600 border border-red-500/20"
                              : issue.severity === "medium"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-blue-500/10 text-[var(--accent)] border border-blue-500/20"
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-xs text-[var(--ink-2)] font-mono">{issue.category}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--ink-1)]">{issue.title}</h3>
                      <p className="text-xs text-[var(--ink-2)]">
                        <span className="text-[var(--ink-3)]">What we found: </span>
                        {issue.summary}
                      </p>
                    </div>

                    <div className="bg-[var(--surface-0)] p-3 rounded-xl border border-[var(--line)] text-xs text-[var(--ink-2)] md:max-w-xs">
                      <span className="text-[var(--accent)] font-bold block mb-1">Recommendation:</span>
                      {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
