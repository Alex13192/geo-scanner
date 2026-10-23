"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { SITE_URL } from "@/lib/site";

/**
 * `/zh/readiness-badge/` 的交互部分——中文版的徽章生成器。
 *
 * WHY THIS IS A COPY OF THE ENGLISH WIDGET RATHER THAN A `locale` PROP ON IT: the English widget
 * hard-codes every label around the form, so a Chinese reader would otherwise get Chinese chrome
 * wrapped around an English form. Adding a language branch to the English file would turn every
 * sentence into a ternary and make the published English page carry a translation dependency it
 * does not need. What is copied is only the presentation; what is NOT copied is any machinery:
 * this file still fetches `/api/scan?domain=`, still reads the same JSON keys (`reachable`,
 * `status`, `scoreBasis`, `score`, `grade`), still builds the same `SITE_URL/report/?domain=`
 * link, and still produces byte-identical Markdown and HTML snippets. Behaviour changes belong in
 * the English widget first and are then mirrored here.
 *
 * WHY THE SCORE IS STILL READ-ONLY AND THE SNIPPETS ARE STILL ENGLISH: the label inside a
 * shields.io URL (`GEO Readiness`), the alt text (`GEO Readiness Score`) and the report link are
 * the artefact the reader pastes into their own README or footer, not prose on this page. They are
 * code: translating them would change the bytes every existing copy of the badge depends on, and
 * a Chinese label would no longer match the image the snippet actually renders. So the snippets,
 * the generated URLs and the three preview faces below stay exactly as the English page emits
 * them; only the copy around them is Chinese.
 *
 * WHY THE REPORT LINK STILL POINTS AT `/report/` AND NOT `/zh/report/`: the URL is baked into
 * every badge a visitor copies, so its locale is part of the published contract. Repointing it
 * would silently rewrite snippets that are already in other people's repositories - the same
 * reason `lib/site.ts` keeps the badge origin in one place.
 */
function cleanDomain(domain: string): string {
  // Never invent a domain: empty input must stay empty so the "no score yet" state is honest.
  if (!domain) return "";
  return domain
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0]
    .toLowerCase();
}

/**
 * Colours and their bands, unchanged from the English widget. The `label` is not rendered today;
 * it is translated anyway because it is display copy, and mixing languages inside one helper is
 * how the next reader ends up shipping an English word into a Chinese banner.
 */
function getScoreColor(s: number) {
  if (s >= 80) return { bg: "#10B981", label: "良好" };
  if (s >= 60) return { bg: "#F59E0B", label: "一般" };
  return { bg: "#EF4444", label: "较差" };
}

/**
 * WHY THIS HELPER EXISTS: `/api/scan` describes a non-homepage result with a fixed English
 * string - `homepage`, or `${status} error response`. The English sentence interpolates that raw,
 * which reads acceptably there because the API's vocabulary is English too; in a Chinese sentence
 * "返回的是 403 error response" reads like a half-translated page. Only the status code is
 * extracted and re-worded, and an unrecognised value is passed through untouched - the API's own
 * wording is never guessed at or replaced. This mirrors `zhScoreBasis` in
 * `app/(locales)/[locale]/report/ReportWidgetZh.tsx`, which translates the same field for the
 * same reason.
 */
function zhScoreBasis(basis: string): string {
  if (basis === "homepage") return "首页";
  const status = /^(\d{3}) error response$/.exec(basis)?.[1];
  return status ? `HTTP ${status} 错误响应页面` : basis;
}

/** The three style keys are the English widget's state values; only the visible label is new. */
const BADGE_STYLES = ["flat", "cyber", "minimal"] as const;

const BADGE_STYLE_LABELS: Record<(typeof BADGE_STYLES)[number], string> = {
  flat: "扁平",
  cyber: "赛博",
  minimal: "极简",
};

export default function BadgeWidgetZh() {
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
      setError("请输入一个域名，以便检查它的分数。");
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
            ? `该站点返回了 HTTP ${data.status}，因此无法生成分数。`
            : "无法访问该站点，因此无法生成分数。"
        );
      } else if (typeof data.scoreBasis === "string" && data.scoreBasis !== "homepage") {
        // The score describes a block page or an error document rather than the site. A badge
        // carrying it would assert something about a response nobody intended to publish, so no
        // badge is offered - the same refusal as the English widget, only stated in Chinese.
        setError(
          `首页返回的是${zhScoreBasis(
            data.scoreBasis
          )}，而不是页面本身，所以没有诚实的分数可以放到徽章上。请先解决访问问题，然后再检查一次。`
        );
      } else {
        setScore(data.score);
        setGrade(data.grade || "");
        setScannedDomain(target);
      }
    } catch {
      setError("无法连接到扫描器，请重试。");
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    setDomain(rawDomain);
    if (rawDomain) void scan(rawDomain);
  }, [rawDomain, scan]);

  const colorInfo = score === null ? null : getScoreColor(score);

  // Must point at OUR domain. This URL is embedded in every badge a user copies, so a wrong host
  // here sends all badge traffic to someone else. The path stays `/report/` for the reason in the
  // file header: the emitted URL is the published artefact, not page copy.
  const reportUrl = scannedDomain ? `${SITE_URL}/report/?domain=${scannedDomain}` : "";

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
        徽章生成器
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-[var(--surface-1)] border border-[var(--line)] p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-[var(--ink-1)] tracking-wide border-b border-[var(--line)] pb-4">
            徽章配置
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="badge-domain"
                className="block text-xs font-medium text-[var(--ink-2)] mb-1.5"
              >
                目标域名
              </label>
              <div className="flex gap-2">
                {/* A placeholder has to look like the thing being asked for, so it stays ASCII. */}
                <input
                  id="badge-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scan(cleanDomain(domain))}
                  placeholder="your-domain.com"
                  className="flex-1 bg-[var(--surface-0)] border border-[var(--line)] rounded-xl px-4 py-2.5 text-xs text-[var(--ink-1)] placeholder-[var(--ink-3)] focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
                <button
                  onClick={() => scan(cleanDomain(domain))}
                  disabled={scanning}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
                >
                  {scanning ? "正在扫描……" : "检查分数"}
                </button>
              </div>
              <p className="text-[11px] text-[var(--ink-3)] pt-2 leading-relaxed">
                分数来自一次真实扫描，扫描方式和主审计相同。它不能手动填写。
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
                徽章中使用的分数
              </span>
              <div className="w-full bg-[var(--surface-0)] border border-[var(--line)] rounded-xl px-4 py-2.5 text-xs font-mono flex items-center justify-between">
                <span className="text-[var(--ink-2)]">
                  {scanning ? "正在扫描站点……" : ready ? scannedDomain : "尚无分数"}
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
                <span className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
                  徽章样式
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {BADGE_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => setBadgeStyle(style)}
                      aria-pressed={badgeStyle === style}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all capitalize ${
                        badgeStyle === style
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-[var(--surface-0)] border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink-1)]"
                      }`}
                    >
                      {BADGE_STYLE_LABELS[style]}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--ink-3)] pt-2 leading-relaxed">
                  样式只改变下面的预览。三种样式嵌入的都是同一张 shields.io 图片，也就是扁平样式。
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-[var(--surface-1)] border border-[var(--line)] p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[var(--ink-1)] tracking-wide border-b border-[var(--line)] pb-4">
              预览
            </h3>

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-600 text-xs rounded-xl p-4">
                {error}
              </div>
            )}

            {!ready && !error && (
              <div className="my-8 flex items-center justify-center p-8 bg-[var(--surface-0)] rounded-xl border border-dashed border-[var(--line)] text-center">
                <p className="text-xs text-[var(--ink-3)] max-w-sm leading-relaxed">
                  {scanning
                    ? "正在扫描站点，读取它的真实分数……"
                    : "输入域名并检查分数。只有拿到真实分数之后，才会出现徽章和嵌入代码。"}
                </p>
              </div>
            )}

            {ready && colorInfo && (
              <>
                {/*
                  The three faces below are pictures of the badge, not captions for it. Their text
                  is the text the snippet produces - "GEO Readiness", "AI READY", "GEO Score" - so
                  translating the preview would show a badge that differs from the code directly
                  underneath it. The files that receive these snippets are English-labelled images
                  by construction, because the shields.io label is part of the URL.
                */}
                <div className="my-8 flex items-center justify-center p-8 bg-[var(--surface-0)] rounded-xl border border-[var(--line)]">
                  {badgeStyle === "flat" && (
                    <div className="inline-flex items-center text-xs font-mono rounded-md overflow-hidden shadow-lg border border-[var(--line)]">
                      <span className="bg-[var(--surface-1)] text-[var(--ink-2)] px-3 py-1.5 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        GEO Readiness
                      </span>
                      <span
                        style={{ backgroundColor: colorInfo.bg }}
                        className="text-[var(--ink-1)] px-3 py-1.5 font-extrabold"
                      >
                        {score} / 100
                      </span>
                    </div>
                  )}

                  {badgeStyle === "cyber" && (
                    <div className="inline-flex items-center text-xs font-mono rounded-lg overflow-hidden border border-purple-500/30 bg-purple-500/10 p-1 shadow-md gap-2">
                      <span className="text-purple-600 font-bold px-2 py-1 bg-purple-500/10 rounded">
                        ⚡ AI READY
                      </span>
                      <span className="text-[var(--ink-1)] font-extrabold pr-2">
                        {scannedDomain} :{" "}
                        <span style={{ color: colorInfo.bg }}>{score} pts</span>
                      </span>
                    </div>
                  )}

                  {badgeStyle === "minimal" && (
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--line)] px-3 py-1.5 rounded-full">
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
                      <span className="text-xs font-medium text-[var(--ink-2)]">
                        Markdown（用于 GitHub README）
                      </span>
                      <button
                        onClick={() => handleCopy(markdownSnippet, "md")}
                        className="text-[11px] text-[var(--accent)] hover:opacity-75 font-medium"
                      >
                        {copiedType === "md" ? "✓ 已复制" : "复制 Markdown"}
                      </button>
                    </div>
                    <pre className="bg-[var(--surface-0)] border border-[var(--line)] rounded-xl p-3 text-xs text-[var(--ink-2)] font-mono overflow-x-auto">
                      {markdownSnippet}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[var(--ink-2)]">
                        HTML（用于网站或页脚）
                      </span>
                      <button
                        onClick={() => handleCopy(htmlSnippet, "html")}
                        className="text-[11px] text-[var(--accent)] hover:opacity-75 font-medium"
                      >
                        {copiedType === "html" ? "✓ 已复制" : "复制 HTML"}
                      </button>
                    </div>
                    <pre className="bg-[var(--surface-0)] border border-[var(--line)] rounded-xl p-3 text-xs text-[var(--ink-2)] font-mono overflow-x-auto whitespace-pre-wrap">
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
