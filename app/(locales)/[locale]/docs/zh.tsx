import Link from "next/link";
import { Fragment } from "react";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";

/**
 * `/zh/docs/` - the guides hub, in Chinese.
 *
 * WHERE THIS BODY LIVES NOW: this module is the Chinese page that used to sit in `page.tsx`.
 * `/zh/docs/` and `/ja/docs/` share one route segment, so `page.tsx` became a dispatcher and
 * the page itself moved here without being rewritten - every section, card, string, class and
 * comment below is the original. Only the route-level exports stayed behind: `metadata` (now
 * `generateMetadata` in `page.tsx`, because one segment cannot export both), `dynamicParams`,
 * `generateStaticParams`, and the `locale !== "zh"` guard the dispatcher now performs.
 *
 * WHY THIS IS A SERVER COMPONENT WHILE THE ENGLISH HUB IS NOT: the English page filters its
 * cards with useState, which forces "use client" - and a client component cannot export
 * metadata. This page has to declare its own canonical and zh-Hans/en hreflang pair, because
 * the English docs layout's metadata belongs to a different route group and must not be
 * inherited as if this were the English page. The filter therefore moves to the markup:
 * a radio group whose checked state drives `:has()` on the grid. Same interaction, works with
 * scripting off, and no client bundle on a page that is otherwise static.
 *
 * WHY THE CARDS ARE NOT IMPORTED FROM THE ENGLISH PAGE: that module is a client component that
 * renders its own English header and footer around the list. Importing it would put the
 * English chrome inside the Chinese page. The list is five entries; the translated copy is
 * the translation of that array, and each href points at the Chinese guide. The five Chinese
 * URLs are the ones `app/sitemap.ts` and the English guides' hreflang already advertise.
 *
 * WHAT IS NOT TRANSLATED, DELIBERATELY: the five `codeSnippet` strings. They are code and
 * example markup, reproduced exactly as the English hub prints them; only the prose around
 * them is Chinese. Translating a robots.txt comment or a JSON-LD key would stop the example
 * being the thing the guide is teaching.
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
  codeSnippet?: string;
}

const guides: Guide[] = [
  {
    id: "ai-visibility-self-check",
    category: "method",
    categoryLabel: "方法",
    title: "如何检查 AI 引擎是否提到你的品牌",
    description:
      "你自己向引擎提问的二十个问题、给回答打分的六项机械检查，以及为什么一次运行只是轶事，而不是一次测量。",
    readTime: "6 分钟阅读",
    href: "/zh/docs/ai-visibility-self-check/",
    codeSnippet: `Category  — no brand name in the question ("which vendors do X?")
Scenario  — a problem, no brand name ("how do I solve Y?")
Comparison — your brand against a named one
Fact      — your brand by name, against verifiable details

Ask each question three times. Report "2 of 3", never a percentage.`,
  },
  {
    id: "llms-txt-deployment",
    category: "setup",
    categoryLabel: "部署",
    title: "如何生成并部署 /llms.txt 文件",
    description:
      "了解如何格式化、组织一份标准化的 /llms.txt 文件，并把它托管在域名根目录，让 AI 爬虫能够干净地消化你的内容。",
    readTime: "3 分钟阅读",
    href: "/zh/docs/llms-txt-deployment/",
    // ASCII on purpose: this is the file format itself, not prose about it.
    codeSnippet: `# your-domain.com\n> One factual sentence on what the company does.\n\n## Core business\nA short description an AI system can quote directly.`,
  },
  {
    id: "qa-style-headings",
    category: "content",
    categoryLabel: "内容",
    title: "为 AI 直接引用优化标题（问答式）",
    description:
      "把泛泛的 H2/H3 标题改写成自然的疑问句，与真实世界中 AI 搜索引擎用户的查询相匹配。",
    readTime: "4 分钟阅读",
    href: "/zh/docs/qa-style-headings/",
    codeSnippet: `<!-- Poor -->\n<h2>Features</h2>\n\n<!-- Optimized for GEO -->\n<h2>How Does Your Company Measure Brand AI Visibility?</h2>`,
  },
  {
    id: "schema-org-jsonld",
    category: "schema",
    categoryLabel: "Schema",
    title: "用 Schema.org JSON-LD 消除 AI 实体歧义",
    description:
      "如何声明 Organization、WebSite 与 sameAs 标记，让模型有足够信息把你的品牌解析为同一个实体，以及如何验证它。",
    readTime: "5 分钟阅读",
    href: "/zh/docs/schema-org-jsonld/",
    codeSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand Name",\n  "url": "https://your-domain.com"\n}\n</script>`,
  },
  {
    id: "allow-ai-crawlers",
    category: "technical",
    categoryLabel: "技术",
    title: "为 GPTBot 与 PerplexityBot 配置 robots.txt 与 WAF",
    description:
      "如何检查 robots.txt 中把 AI 爬虫拒之门外的规则，以及答案的另一半藏在 WAF 或 CDN 的哪个位置。",
    readTime: "4 分钟阅读",
    href: "/zh/docs/allow-ai-crawlers/",
    codeSnippet: `# robots.txt\nUser-agent: GPTBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /`,
  },
];

/**
 * The filter labels, in the same order as the English hub. `method` has no button there,
 * so it has none here either: the method guide is reachable under 「全部」 and nowhere else.
 * That is the English behaviour, not an omission introduced by the translation.
 */
const FILTERS = [
  { key: "all", label: "全部" },
  { key: "setup", label: "部署" },
  { key: "content", label: "内容" },
  { key: "schema", label: "Schema" },
  { key: "technical", label: "技术" },
] as const;

/**
 * Which cards each radio hides. A card is hidden when a *different* category is checked;
 * `#cat-all` never matches any of these selectors, so 「全部」 leaves the whole grid visible.
 * The method card hides under all four specific filters, which is exactly what the English
 * `filteredGuides` array does when the selected category is not "All".
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

export default function ZhDocsPage() {
  const dict = getDictionary("zh");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                LLMention 知识库
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                生成式引擎优化指南
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                帮助工程团队与 SEO 团队优化品牌在 ChatGPT、Perplexity 和 Claude 中呈现的分步技术蓝图。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              The CSS-only filter. The radios are visually hidden but focusable; `peer-checked`
              paints the label and `group-has` hides the non-matching cards, so the interaction
              survives without hydration. `role="radiogroup"` is stated because a div is not a
              fieldset and the group still needs an accessible name.
            */}
            <div className="group">
              <div
                role="radiogroup"
                aria-label="按主题筛选指南"
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
                    hrefLang="zh-Hans"
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
                      阅读指南 →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Prose, table and Q&A: all bounded to the same readable measure. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-6 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                这些指南
              </h2>
              <p>
                共 {guides.length} 篇指南。技术类文章讲的是：在整体建得不错的站点上，扫描器最常判失败的检查有哪些；方法类文章讲的是如何亲手核对结果，而不是直接相信分数。
              </p>
              {/*
                Read from the same array the grid above renders, so the table cannot list a
                different number of guides from the sentence under it. The count and the rows
                both come from `guides`, exactly as on the English page.
              */}
              <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[var(--surface-1)] text-[var(--ink-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">指南</th>
                      <th className="px-4 py-3 text-left font-semibold">主题</th>
                      <th className="px-4 py-3 text-left font-semibold">阅读时间</th>
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
                title="关于这些指南的问题"
                items={[
                  {
                    q: "我应该从哪里开始？",
                    a: "如果你还没有发布上下文文件，就先看 llms.txt 部署指南；如果 AI 爬虫可能在防火墙那一层、还没读到 robots.txt 就被挡住，就先看 robots.txt 指南。",
                  },
                  {
                    q: "这些指南只针对某一家 AI 引擎吗？",
                    a: "不是。它们覆盖主要引擎共有的爬虫 user-agent 和标记约定，并明确说明哪些地方的支持并不一致。",
                  },
                  {
                    q: "这些指南能替代扫描吗？",
                    a: "不能，它们互为补充。指南解释一条规则想要什么；扫描告诉你页面是否满足这条规则，而扫描器执行的正是这些指南所描述的同一套规则。",
                  },
                ]}
              />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本站的权重遵循那项测量结果，而不是凭偏好决定；单 URL 扫描看不到的那部分图景会被如实说明，而不是略过。"
              />
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
