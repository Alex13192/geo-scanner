"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { CONTACT_EMAIL } from "@/lib/site";
import { ZH_CHECK_TITLES, ZH_DIMENSION_LABELS } from "@/lib/i18n/zh-copy";

/**
 * `/zh/report/` 的交互部分——抓取、打分、维度条与问题列表，中文化。
 *
 * WHY THIS IS A COPY OF THE ENGLISH WIDGET AND NOT A `locale` PROP ON IT:
 * `app/(en)/report/ReportWidget.tsx` 是已发布的英文页面，它的字符串直接写在 JSX 里，与结构和
 * 状态机交错；加一个语言分支会让每一句话都变成三元表达式，也让英文页承担一份它不需要的翻译
 * 依赖。两份文件的差别只在字符串：`fetch` 的目标、查询参数、从响应里读出的 JSON 键、以及下面
 * 整套 loading / 无法访问 / 截断 / 评分为错误响应 的状态判断，都与英文版逐行一致——这正是两个
 * 页面能给出同一个结论的原因。任何涉及行为的需求都应先改英文版，再同步到这里。
 *
 * WHY SOME OF WHAT THE API RETURNS IS STILL ENGLISH, SAID OUT LOUD RATHER THAN HIDDEN:
 * 检查的摘要（`summary` 与 `evidence`）和建议（`recommendation`）由分析器生成，是规则在页面上
 * 实际看到的东西；仓库里没有这两段话的中文版，而在这里另写一份「中文摘要」等于凭空复述证据。
 * 所以它们保持英文原文，而检查标题、维度名、等级说明、按钮和所有界面文案是中文——标题来自
 * `ZH_CHECK_TITLES`，缺失时回落到服务端给的英文标题，而不是留空或猜测。
 *
 * WHY THE API'S ENGLISH DIMENSION LABELS ARE MAPPED THROUGH THE RESPONSE, NOT THROUGH A SECOND TABLE:
 * 响应里的维度是 `{ id, label }`，`id` 是目录 id，而问题条目只带 `category`，它是目录里那个
 * 英文 `label`（见 `lib/geo/analyze.ts`）。用本次响应自带的 `label -> id` 映射去查
 * `ZH_DIMENSION_LABELS`，翻译表就只有一份；另外手写一张「英文名 -> 中文名」对照表，正是
 * `lib/i18n/zh-copy.ts` 开头警告的那种会互相矛盾的副本。映射不出来的标签原样显示英文，
 * 不会变成空白。
 */

/**
 * 五个等级的中文读法。
 *
 * WHY A LOCAL MAP: 服务端返回 `grade`（字母）和 `gradeLabel`（`GRADE_BANDS` 里的英文句子）。
 * 字母与分档阈值必须原样使用，所以只翻译字母旁边那句话；未知等级回落到服务端发来的英文标签，
 * 而不是渲染一片空白。`/zh/self-audit/` 里有一份同样的映射，但那个文件没有导出它，而本次改动
 * 限定在三个文件内——等级字母是稳定的，所以两份副本不可能对同一个分数给出不同等级。
 */
const ZH_GRADE_LABELS: Record<string, string> = {
  A: "就绪度优秀：页面具备被引用所需的要素",
  B: "就绪度良好：具备被引用所需的大部分要素",
  C: "就绪度一般：具备部分要素，多个维度仍需改进",
  D: "就绪度较差：存在明显的 GEO 缺口",
  F: "就绪度严重不足：缺失大部分被引用所需的要素",
};

/** 严重程度筛选器的键，与英文版完全一致；只有显示的文字是中文。 */
const SEVERITY_FILTERS = ["all", "high", "medium", "low"] as const;
const FILTER_LABELS: Record<(typeof SEVERITY_FILTERS)[number], string> = {
  all: "全部",
  high: "高",
  medium: "中",
  low: "低",
};
const SEVERITY_LABELS: Record<IssueItem["severity"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};

/**
 * 把服务端的 `scoreBasis` 讲成中文。
 *
 * `app/api/scan/route.ts` 把不是 200 的首页写成 `${status} error response`，那句话是给英文
 * 横幅的 "This score describes a 403 error response" 用的。中文句子要的是「一个 HTTP 403
 * 错误响应页面」，所以这里只拆出状态码；认不出的写法原样返回，绝不改写服务端的说法。
 */
function zhScoreBasis(basis: string): string {
  if (basis === "homepage") return "首页";
  const status = /^(\d{3}) error response$/.exec(basis)?.[1];
  return status ? `HTTP ${status} 错误响应页面` : basis;
}

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
 * The labels stay English here and are translated at render time by id, so the
 * degraded view is Chinese too.
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

/**
 * 维度或问题分类的中文名。`id` 优先（维度对象自带），否则用本次响应里的英文标签反查 id。
 * 两者都查不到时原样返回英文标签——一条翻译缺失的规则应该显示它发布时的名字，而不是空白。
 */
function dimensionLabel(
  label: string,
  id: string | undefined,
  idByLabel: Map<string, string>
): string {
  const resolved = id ?? idByLabel.get(label);
  return (resolved ? ZH_DIMENSION_LABELS[resolved] : undefined) ?? label;
}

export default function ReportWidgetZh() {
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
        // 请求我们自己的后端 API 接口进行真实服务端扫描。端点与参数与英文版完全相同。
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

  /** 本次响应自带的「英文维度名 -> 目录 id」映射，用于翻译问题条目上的分类标签。 */
  const dimensionIdByLabel = useMemo(
    () => new Map(dimensions.map((dimension) => [dimension.label, dimension.id])),
    [dimensions]
  );

  if (!rootDomain) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-1)] font-sans flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-8 space-y-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">
            L
          </div>
          <h2 className="text-lg font-bold text-[var(--ink-1)]">没有可审计的域名</h2>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            这一页一次只报告一个站点，所以必须知道是哪一个。在下面输入域名，或者从首页开始。
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = String(new FormData(e.currentTarget).get("domain") || "");
              const target = cleanDomain(value);
              if (target) {
                // 中文站点内跳转要留在中文路由上，否则中文读者会被送回英文报告页。
                window.location.href = `/zh/report/?domain=${encodeURIComponent(target)}`;
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
              运行审计
            </button>
          </form>
          <a href="/zh/" className="inline-block text-xs text-[var(--accent)] hover:opacity-75 underline">
            ← 返回扫描器
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[var(--ink-1)] font-sans">
      {/* 主体内容 */}
      <section aria-label="扫描结果" className="mt-2">
        {/* 顶部 Domain 概览 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-2xl">
          <div>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-[var(--accent)] border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
              GEO 服务端扫描器
            </span>
            <p className="text-lg font-bold text-[var(--ink-1)] mt-3 tracking-tight">
              <span className="text-[var(--accent)]">{rootDomain}</span> 的实时结果
            </p>
            <p className="text-xs text-[var(--ink-2)] mt-1">
              由后端边缘爬虫实时抓取，覆盖多个 AI 优化维度。
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[var(--surface-0)] p-4 rounded-xl border border-[var(--line)]">
            <div className="text-center">
              {loading ? (
                <div className="text-sm text-[var(--accent)] animate-pulse font-mono py-2">正在通过边缘节点扫描……</div>
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
              <div className="text-[11px] text-[var(--ink-2)] mt-1">GEO 总分</div>
              {!loading && !siteUnreachable && gradeLabel && (
                <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                  {ZH_GRADE_LABELS[grade] ?? gradeLabel}
                </div>
              )}
              {!loading && !siteUnreachable && checksRun > 0 && (
                <div className="text-[10px] text-[var(--ink-3)] font-mono mt-1">
                  {checksPassed}/{checksRun} 项检查通过
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-[var(--surface-1)]"></div>
            {/*
              徽章页只有英文版，所以按钮上标出「英文」。跳转地址与参数保持不变：
              它是英文版链接到的同一个生成器。
            */}
            <button
              disabled={loading || siteUnreachable}
              onClick={() => navigateTo(`/readiness-badge/?domain=${rootDomain}&score=${overallScore}`)}
              className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/30 px-3.5 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              获取徽章（英文）🛡️️
            </button>
          </div>
        </div>

        {/* What the score describes. Twelve dimension scores imply that a real
            page was read, so when the analyser actually scored an error or
            challenge response, this has to be said before the numbers are. */}
        {!loading && !siteUnreachable && scoreBasis !== "homepage" && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-2">
            <span className="inline-block text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
              先读这段
            </span>
            <h2 className="text-sm font-bold text-amber-700">
              这份分数描述的是{zhScoreBasis(scoreBasis)}，而不是你的页面
            </h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              首页没有返回 HTTP 200，所以被分析的是你的服务器发回的那个响应体——一个拦截页、一个挑战页或一个错误文档。下面每个维度描述的都是那个响应，而不是你的内容。
              {browserStatus === 200 ? (
                <>
                  同一个 URL 对浏览器形状的请求正常返回，所以这次拒绝是针对已识别的爬虫的——而 GPTBot、ClaudeBot、PerplexityBot 和 OAI-SearchBot 都以机器人身份出现。这次拒绝<strong>确实</strong>是一个 GEO 问题，而不是误报；下面的「AI 爬虫访问」检查会说明该改什么。
                </>
              ) : (
                <>
                  {browserStatus == null
                    ? "无法完成一次浏览器形状的请求来做对比，所以"
                    : `浏览器形状的请求同样被拒绝（HTTP ${browserStatus}），所以`}
                  这次拒绝指向的是本次扫描的出口地址，而不是你的配置。请把这个分数读作「未经证实」，而不是对站点的判断。
                </>
              )}
            </p>
          </div>
        )}

        {!loading && !siteUnreachable && truncated && (
          <div className="mb-8 bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6 space-y-2">
            <h2 className="text-sm font-bold text-[var(--ink-1)]">响应被截断了</h2>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              首页超过了 2 MB 的读取上限，所以打分在文档中途停止。关于内容长度、结构和可提取性的检查因此是针对一个不完整的页面测量的，可能低估真实结果。
            </p>
          </div>
        )}

        {siteUnreachable ? (
          <div className="text-center py-16 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm">
            ❌ 无法访问 <span className="font-mono font-bold">{rootDomain}</span>。请检查域名是否有效并且在线。
          </div>
        ) : (
          <>
            {/* Weighted dimension breakdown. Weights are published at /methodology. */}
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold text-[var(--ink-1)] tracking-tight">分数构成</h2>
              <span className="text-[11px] text-[var(--ink-3)]">
                {dimensions.length > 0
                  ? `${dimensions.length} 个加权维度 · 共 100 分`
                  : "6 个加权维度"}
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
                    <span className="text-xs text-[var(--ink-2)] font-medium">
                      {dimensionLabel(d.label, d.id, dimensionIdByLabel)}
                    </span>
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
              <h2 className="text-lg font-bold text-[var(--ink-1)] tracking-tight">优化建议</h2>
              <div className="flex items-center gap-1 bg-[var(--surface-0)] p-1 rounded-xl border border-[var(--line)] text-xs">
                {SEVERITY_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                      activeFilter === filter
                        ? "bg-[var(--surface-1)] text-[var(--ink-1)] shadow-sm"
                        : "text-[var(--ink-2)] hover:text-[var(--ink-1)]"
                    }`}
                  >
                    {FILTER_LABELS[filter]}
                  </button>
                ))}
              </div>
            </div>

            {/* 加载中与问题列表 */}
            {loading ? (
              <div className="text-center py-20 bg-[var(--surface-1)] rounded-2xl border border-[var(--line)]">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm text-[var(--ink-2)] font-mono">正在通过边缘节点抓取并分析 https://{rootDomain}……</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 text-sm font-mono">
                🎉 满分！没有在这个域名上发现重大 GEO 问题。
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
                          {SEVERITY_LABELS[issue.severity]}
                        </span>
                        <span className="text-xs text-[var(--ink-2)] font-mono">
                          {dimensionLabel(issue.category, undefined, dimensionIdByLabel)}
                        </span>
                      </div>
                      {/*
                        标题优先用中文对照表；表里没有的规则显示服务端给的英文标题，
                        而不是留空或猜一个译名。
                      */}
                      <h3 className="text-base font-bold text-[var(--ink-1)]">
                        {ZH_CHECK_TITLES[issue.id] ?? issue.title}
                      </h3>
                      <p className="text-xs text-[var(--ink-2)]">
                        <span className="text-[var(--ink-3)]">我们发现：</span>
                        {issue.summary}
                      </p>
                    </div>

                    <div className="bg-[var(--surface-0)] p-3 rounded-xl border border-[var(--line)] text-xs text-[var(--ink-2)] md:max-w-xs">
                      <span className="text-[var(--accent)] font-bold block mb-1">建议：</span>
                      {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/*
              检查摘要与建议由分析器生成，仓库里只有英文原文，所以在这里说明它们的语言，
              而不是让读者以为页面漏译了。
            */}
            {!loading && !siteUnreachable && issues.length > 0 && (
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-3)]">
                检查标题与维度名已译为中文；每条检查的摘要与建议是分析器输出的英文原文，逐字保留以便与规则页对照。
              </p>
            )}
          </>
        )}

        {/*
          A feedback route, added after an audit pointed out that the tool invites a
          disagreement with its number but never offers a way to report one from the page
          that shows it. The address is the site's single contact constant, and the subject
          is prefilled so a reply can be matched to the domain without asking which scan it
          refers to.
        */}
        <p className="mt-8 text-xs leading-relaxed text-[var(--ink-3)]">
          这里看起来有问题？把检查项 id 和域名一起发到{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
              `扫描结果有误：${rawDomain}`
            )}`}
            className="text-[var(--accent)] underline hover:opacity-75"
          >
            {CONTACT_EMAIL}
          </a>
          。针对某条已公布规则的具体异议，是这个项目收到的最有用的邮件。
        </p>
      </section>
    </div>
  );
}
