"use client";

import { useState } from "react";

import {
  checkAnswer,
  type AnswerReport,
  type CompetitorResult,
  type Signal,
} from "@/lib/answer-check/rules";
import { questionBankText } from "@/lib/answer-check/questions";

/**
 * The interactive half of /zh/answer-check/.
 *
 * WHY THIS IS A COPY OF THE ENGLISH WIDGET RATHER THAN A SHARED COMPONENT: the English widget
 * hard-codes every label around the form, so a Chinese reader would otherwise get Chinese chrome
 * wrapped around an English form. The scoring itself is not copied: it is imported from
 * lib/answer-check/rules.ts, which remains the single source of truth for the six rules, their
 * order and their thresholds. Only the strings rendered around that result are translated, so the
 * two widgets cannot disagree about a verdict.
 *
 * WHY THE SIGNAL LABELS ARE MAPPED BY ID: rules.ts returns English labels because it also feeds
 * the English page. The ids are the stable contract; mapping by id keeps the translation in the
 * presentation layer and falls back to the English label if a signal is ever renamed, so the gap
 * is visible rather than silently translated into something wrong.
 *
 * WHY THE EVIDENCE SENTENCES ARE REFORMATTED HERE: rules.ts produces fixed English template
 * sentences ("first mention at character 3", "2 domain(s): ..."). Translating those in the
 * presentation layer keeps the rule module free of locale branching, and every pattern falls back
 * to the original string if the format changes. Mention and list evidence are quoted substrings of
 * the pasted answer and must stay verbatim - they are evidence, not UI copy.
 */

const STATUS_STYLE: Record<string, string> = {
  yes: "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]",
  partly: "border-[var(--warn)] bg-[var(--warn-bg)] text-[var(--warn)]",
  no: "border-[var(--line)] bg-[var(--surface-1)] text-[var(--ink-3)]",
};

const STATUS_WORD: Record<string, string> = { yes: "已找到", partly: "部分", no: "未找到" };

/**
 * The six labels are the ones /zh/docs/ai-visibility-self-check/ already uses for the same six
 * rules, so a reader moving between the guide and the tool sees one vocabulary rather than two.
 */
const SIGNAL_LABEL_ZH: Record<string, string> = {
  mentioned: "被提到",
  early: "在靠前位置被提到",
  listed: "出现在候选清单里",
  recommended: "带有推荐",
  cites: "引用了来源",
  hedged: "诚实的空白",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Reformat the rule module's fixed English evidence templates without touching the rules. */
function evidenceZh(signal: Signal): string {
  const evidence = signal.evidence;
  if (!evidence) return "";

  if (signal.id === "early") {
    const match = /^first mention at character (\d+)$/.exec(evidence);
    if (match) return `首次提及位于第 ${match[1]} 个字符`;
  }

  if (signal.id === "recommended") {
    const match = /^"(.+)" within (\d+) characters of the mention$/.exec(evidence);
    if (match) return `「${match[1]}」在提及前后 ${match[2]} 个字符内`;
  }

  if (signal.id === "cites") {
    const match = /^(\d+) domain\(s\): (.+)$/.exec(evidence);
    if (match) return `${match[1]} 个域名：${match[2]}`;
  }

  if (signal.id === "hedged") {
    const match = /^"(.+)"$/.exec(evidence);
    if (match) return `「${match[1]}」`;
  }

  // Mention and list evidence are quoted substrings of the pasted answer; translating them would
  // falsify the evidence the reader is supposed to be able to check.
  return evidence;
}

function competitorPosition(competitor: CompetitorResult): string {
  if (!competitor.mentioned) return "这段回答中没有提到";
  return competitor.brandFirst ? "被提到，排在你的品牌之后" : "被提到，排在你的品牌之前";
}

function citationsHeading(ownDomainCited: boolean | null): string {
  const base = "这段回答引用的来源";
  if (ownDomainCited === true) return `${base}——包含你的域名`;
  if (ownDomainCited === false) return `${base}——没有你的域名`;
  return base;
}

export default function AnswerCheckWidgetZh() {
  const [brand, setBrand] = useState("");
  const [aliases, setAliases] = useState("");
  const [domain, setDomain] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<AnswerReport | null>(null);
  const [copied, setCopied] = useState(false);

  /*
   * The same two-field gate as the English widget, deliberately: the brand and the answer are
   * what the rules need, and the other three fields are optional context. Requiring more would
   * change which inputs behave as mandatory, which is behaviour rather than copy.
   */
  const canRun = brand.trim().length > 0 && answer.trim().length > 0;

  function run() {
    if (!canRun) return;
    setReport(
      checkAnswer({
        answer,
        brand,
        aliases: splitList(aliases),
        domain,
        competitors: splitList(competitors),
      })
    );
  }

  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(questionBankText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be refused; the bank is on the guide page either way, so this is not
      // worth an error state.
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">你的品牌名称</span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例如：Novacorp"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">
              其他叫法<span className="text-[var(--ink-3)]">（可选）</span>
            </span>
            <input
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="用逗号分隔"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">
              你的域名<span className="text-[var(--ink-3)]">（可选）</span>
            </span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="例如：novacorp.com"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-1)]">
              要对比的竞争对手<span className="text-[var(--ink-3)]">（可选）</span>
            </span>
            <input
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="用逗号分隔"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-[var(--ink-1)]">粘贴你收到的回答</span>
          <span className="mt-0.5 block text-xs text-[var(--ink-3)]">
            在 ChatGPT、Perplexity、Gemini、豆包或其他任何引擎里提出你的问题，然后把回答复制到这里。它会在你的浏览器里分析，不会被发送到任何地方。
          </span>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={9}
            placeholder="粘贴完整回答，包括它引用的任何链接。"
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--ink-1)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canRun}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            检查这段回答
          </button>
          <button
            type="button"
            onClick={copyQuestions}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            {copied ? "已复制" : "复制这 20 个问题"}
          </button>
        </div>
      </form>

      {report ? (
        <section aria-live="polite" className="space-y-6">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-3)]">
              {report.brand}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-1)]">
              共 {report.total} 项信号，找到 {report.present} 项
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
              这是一个计数，不是分数，而且只针对你粘贴的这一段回答。它不代表任何引擎下一次会回答什么。
            </p>
          </div>

          <ul className="space-y-3">
            {report.signals.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-0)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--ink-1)]">
                    {SIGNAL_LABEL_ZH[s.id] ?? s.label}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-xs ${STATUS_STYLE[s.status]}`}
                  >
                    {STATUS_WORD[s.status]}
                  </span>
                </div>
                {s.evidence ? (
                  <p className="mt-2 break-words font-mono text-xs leading-relaxed text-[var(--ink-2)]">
                    {evidenceZh(s)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {report.competitors.length > 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
              <h3 className="text-sm font-semibold text-[var(--ink-1)]">与其他品牌的位置对比</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ink-2)]">
                {report.competitors.map((c) => (
                  <li key={c.name}>
                    <span className="font-medium text-[var(--ink-1)]">{c.name}</span>——
                    {competitorPosition(c)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.citations.domains.length > 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
              <h3 className="text-sm font-semibold text-[var(--ink-1)]">
                {citationsHeading(report.citations.ownDomainCited)}
              </h3>
              <p className="mt-2 break-words font-mono text-xs leading-relaxed text-[var(--ink-2)]">
                {report.citations.domains.join(", ")}
              </p>
              {report.citations.ownDomainCited === false ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                  引擎正在从你无法控制的来源描述你。这是 AI
                  回答中站点所有者可以改变的那部分，也是为什么这项信号值得逐月关注。
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-[var(--ink-3)]">
            规则、词表和示例都公布在本页和
            <a href="/zh/docs/ai-visibility-self-check/" className="underline">
              自查指南
            </a>
            中。如果某个判定看起来不对，上面那段原文就是它产生的原因——而一个名字本身就是普通单词的品牌，偶尔会匹配到那个单词，而不是公司。
          </p>
        </section>
      ) : null}
    </div>
  );
}
