import Link from "next/link";
import { Fragment } from "react";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";

/**
 * `/ja/docs/` - the guides hub, in Japanese.
 *
 * TRANSLATED FROM THE ENGLISH HUB, NOT FROM THE CHINESE ONE: `app/(en)/docs/page.tsx` is the
 * source, so the section order, the five cards, the filter row, the table, the three FAQs and
 * the evidence block all match it one for one. The Chinese page is a sibling translation, not
 * an intermediary - paraphrasing a paraphrase is how a claim drifts.
 *
 * WHY THIS IS A SERVER COMPONENT: the English hub filters with useState, which forces "use
 * client" and makes `generateMetadata` impossible from the same segment. The filter here is
 * the CSS-only radio group the Chinese page already uses: `peer-checked` paints the label and
 * `group-has` hides the non-matching cards, so it works without hydration. Metadata lives in
 * `page.tsx`, because one segment cannot export both `metadata` and `generateMetadata`.
 *
 * WHICH LINKS ARE JAPANESE: only the guides that have a Japanese page - llms-txt-deployment
 * and allow-ai-crawlers. A card pointing at `/ja/docs/<slug>/` for a guide that has not been
 * translated would be a 404 with a Japanese label on it, so the remaining three point at the
 * English guide with `hrefLang="en"` and say 「（英語）」 on the card. The same rule the sitemap
 * follows: claim a translation only where one exists.
 *
 * WHAT IS NOT TRANSLATED, DELIBERATELY: the five `codeSnippet` strings. They are robots.txt
 * and JSON-LD examples, reproduced exactly as the English hub prints them; only the prose
 * around them is Japanese. Translating a JSON-LD key would stop the example being the thing
 * the guide teaches.
 */

type GuideCategory = "method" | "setup" | "content" | "schema" | "technical";

interface Guide {
  id: string;
  category: GuideCategory;
  categoryLabel: string;
  title: string;
  description: string;
  readTime: string;
  href: string;
  /** "ja" for a translated guide; "en" where only the English original exists so far. */
  hrefLang: "ja" | "en";
  codeSnippet?: string;
}

const guides: Guide[] = [
  {
    id: "ai-visibility-self-check",
    category: "method",
    categoryLabel: "方法",
    title: "AI エンジンがあなたのブランドに言及しているかを確認する方法",
    description:
      "エンジン自身に投げる 20 の質問、回答を採点する 6 つの機械的チェック、そして 1 回の実行が測定ではなく逸話にすぎない理由。",
    readTime: "6 分で読めます",
    href: "/ja/docs/ai-visibility-self-check/",
    hrefLang: "ja",
    codeSnippet: `Category  — no brand name in the question ("which vendors do X?")
Scenario  — a problem, no brand name ("how do I solve Y?")
Comparison — your brand against a named one
Fact      — your brand by name, against verifiable details

Ask each question three times. Report "2 of 3", never a percentage.`,
  },
  {
    id: "llms-txt-deployment",
    category: "setup",
    categoryLabel: "セットアップ",
    title: "llms.txt ファイルを生成して配置する方法",
    description:
      "標準化された /llms.txt ファイルを整形し、構成し、ドメインルートに配置して、AI クローラーがコンテンツをきれいに消化できるようにする方法を説明します。",
    readTime: "3 分で読めます",
    href: "/ja/docs/llms-txt-deployment/",
    hrefLang: "ja",
    // ASCII on purpose: this is the file format itself, not prose about it.
    codeSnippet: `# your-domain.com\n> One factual sentence on what the company does.\n\n## Core business\nA short description an AI system can quote directly.`,
  },
  {
    id: "qa-style-headings",
    category: "content",
    categoryLabel: "コンテンツ",
    title: "AI の直接引用に向けた見出しの最適化（Q&A 形式）",
    description:
      "一般的な H2/H3 見出しを、実際の AI 検索エンジンのユーザークエリに合う自然な疑問文に書き換えます。",
    readTime: "4 分で読めます",
    href: "/ja/docs/qa-style-headings/",
    hrefLang: "ja",
    codeSnippet: `<!-- Poor -->\n<h2>Features</h2>\n\n<!-- Optimized for GEO -->\n<h2>How Does Your Company Measure Brand AI Visibility?</h2>`,
  },
  {
    id: "schema-org-jsonld",
    category: "schema",
    categoryLabel: "Schema",
    title: "AI のエンティティ曖昧性解消に向けた Schema.org JSON-LD の実装",
    description:
      "モデルがあなたのブランドを 1 つのエンティティとして解決できるよう、Organization、WebSite、sameAs のマークアップを宣言する方法と、その検証方法。",
    readTime: "5 分で読めます",
    href: "/ja/docs/schema-org-jsonld/",
    hrefLang: "ja",
    codeSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand Name",\n  "url": "https://your-domain.com"\n}\n</script>`,
  },
  {
    id: "allow-ai-crawlers",
    category: "technical",
    categoryLabel: "技術",
    title: "GPTBot と PerplexityBot のための robots.txt と WAF の設定",
    description:
      "AI クローラーを追い返すルールが robots.txt にないかを確認する方法と、答えの残り半分が WAF や CDN のどこにあるか。",
    readTime: "4 分で読めます",
    href: "/ja/docs/allow-ai-crawlers/",
    hrefLang: "ja",
    codeSnippet: `# robots.txt\nUser-agent: GPTBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /`,
  },
];

/**
 * The filter labels, in the same order as the English hub and the Chinese page. `method` has
 * no button, so the method guide is reachable under 「すべて」 and nowhere else - the English
 * behaviour, not a label dropped in translation.
 */
const FILTERS = [
  { key: "all", label: "すべて" },
  { key: "setup", label: "セットアップ" },
  { key: "content", label: "コンテンツ" },
  { key: "schema", label: "Schema" },
  { key: "technical", label: "技術" },
] as const;

/**
 * Which cards each radio hides, mirroring the Chinese page: a card is hidden when a
 * *different* category is checked, and `#cat-all` matches none of these selectors, so
 * 「すべて」 leaves the whole grid visible. The method card hides under all four specific
 * filters, exactly as the English `filteredGuides` array does.
 */
const HIDE_WHEN_OTHER_CATEGORY: Record<GuideCategory, string> = {
  method:
    "group-has-[#cat-setup:checked]:hidden group-has-[#cat-content:checked]:hidden group-has-[#cat-schema:checked]:hidden group-has-[#cat-technical:checked]:hidden",
  setup:
    "group-has-[#cat-content:checked]:hidden group-has-[#cat-schema:checked]:hidden group-has-[#cat-technical:checked]:hidden",
  content:
    "group-has-[#cat-setup:checked]:hidden group-has-[#cat-schema:checked]:hidden group-has-[#cat-technical:checked]:hidden",
  schema:
    "group-has-[#cat-setup:checked]:hidden group-has-[#cat-content:checked]:hidden group-has-[#cat-technical:checked]:hidden",
  technical:
    "group-has-[#cat-setup:checked]:hidden group-has-[#cat-content:checked]:hidden group-has-[#cat-schema:checked]:hidden",
};

export default function JaDocsPage() {
  const dict = getDictionary("ja");

  /*
   * Counted from the same array the grid and the table render, so the sentence below cannot
   * claim a number of Japanese guides the cards do not provide.
   */
  const japaneseGuides = guides.filter((guide) => guide.hrefLang === "ja").length;
  const englishGuides = guides.length - japaneseGuides;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                LLMention ナレッジハブ
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                生成エンジン最適化ガイド
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                ChatGPT、Perplexity、Claude におけるブランドの見え方を最適化するための、エンジニアリングチームと SEO チーム向けの手順別テクニカルブループリント。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              The same CSS-only filter as the Chinese page: the radios are visually hidden but
              focusable, `peer-checked` paints the label and `group-has` hides the non-matching
              cards, so the interaction survives without hydration.
            */}
            <div className="group">
              <div
                role="radiogroup"
                aria-label="トピックでガイドを絞り込む"
                className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-4 text-xs"
              >
                {FILTERS.map((filter) => (
                  <Fragment key={filter.key}>
                    <input
                      type="radio"
                      name="guide-category"
                      id={`cat-${filter.key}`}
                      defaultChecked={filter.key === "all"}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={`cat-${filter.key}`}
                      className="cursor-pointer rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 font-medium text-[var(--ink-2)] transition-all hover:text-[var(--ink-1)] peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500"
                    >
                      {filter.label}
                    </label>
                  </Fragment>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                {guides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={guide.href}
                    hrefLang={guide.hrefLang}
                    className={`flex flex-col justify-between gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 hover:border-blue-500/50 hover:shadow-lg ${HIDE_WHEN_OTHER_CATEGORY[guide.category]}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono font-semibold text-[var(--accent)]">
                          {guide.categoryLabel}
                        </span>
                        <span className="font-mono text-[var(--ink-3)]">{guide.readTime}</span>
                      </div>
                      <h2 className="text-lg font-semibold leading-snug tracking-tight">
                        {guide.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                        {guide.description}
                      </p>
                    </div>

                    {guide.codeSnippet && (
                      <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-0)] p-3 font-mono text-[11px] text-[var(--accent)]">
                        {guide.codeSnippet}
                      </pre>
                    )}

                    <span className="text-sm font-medium text-[var(--accent)]">
                      {guide.hrefLang === "en" ? "ガイドを読む（英語） →" : "ガイドを読む →"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Prose, table and Q&A: all bounded to the same readable measure. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-6 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                ガイドについて
              </h2>
              <p>
                全 {guides.length} 本のガイドです。技術系の記事は、全体としてはよく作られているサイトでスキャナーが最もよく不合格にするチェックを扱っています。方法の記事は、スコアを信じるのではなく、結果を自分の手で確認する方法を扱っています。このうち {japaneseGuides} 本は日本語、{englishGuides} 本は英語で公開しています。
              </p>
              {/*
                Read from the same array the grid above renders, so the table cannot list a
                different number of guides from the sentence under it.
              */}
              <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[var(--surface-1)] text-[var(--ink-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">ガイド</th>
                      <th className="px-4 py-3 text-left font-semibold">テーマ</th>
                      <th className="px-4 py-3 text-left font-semibold">読了時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guides.map((guide) => (
                      <tr key={guide.id} className="border-t border-[var(--line)]">
                        <td className="px-4 py-3 align-top">{guide.title}</td>
                        <td className="px-4 py-3 align-top">{guide.categoryLabel}</td>
                        <td className="px-4 py-3 align-top">{guide.readTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="これらのガイドについての質問"
                items={[
                  {
                    q: "どこから始めればよいですか？",
                    a: "まだコンテキストファイルを公開していないなら llms.txt の配置ガイドから、AI クローラーが robots.txt を読む前にファイアウォールで遮断されている可能性があるなら robots.txt ガイドから始めてください。",
                  },
                  {
                    q: "ガイドは特定の AI エンジン向けですか？",
                    a: "いいえ。主要なエンジンに共通するクローラーの user-agent とマークアップの慣習を扱い、サポートが一貫していない箇所は率直に説明しています。",
                  },
                  {
                    q: "ガイドはスキャンの代わりになりますか？",
                    a: "いいえ、互いに補完する関係です。ガイドはルールが何を求めているかを説明し、スキャンはあなたのページがそのルールを満たしているかを示します。スキャナーは、これらのガイドが説明しているのと同じルールを適用しています。",
                  },
                ]}
              />
              <Evidence
                title="証拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="このサイトの重み付けは好みではなく、その測定結果に従っています。単一 URL のスキャンでは見えない部分も、省略せずに明記しています。"
              />
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="ja" dict={dict} target={homePath} />
    </div>
  );
}
