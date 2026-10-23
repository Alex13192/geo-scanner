import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { guidePathForCheck } from "@/lib/geo/check-links";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ZH_CHECK_RULES } from "@/lib/i18n/zh-check-rules";
import {
  ZH_CHECK_TITLES,
  ZH_DIMENSION_LABELS,
  ZH_DIMENSION_SUMMARIES,
} from "@/lib/i18n/zh-copy";
import { INSIGHTS, insightPath } from "@/lib/insights";
import { MAX_FETCH_PAGES, MAX_LINKS_PER_SECTION } from "@/lib/llms-txt";
import { social } from "@/lib/og";

/**
 * `/zh/tools/` - the tools index, in Chinese.
 *
 * WHY THIS REBUILDS ProsePage'S SHELL INSTEAD OF USING IT: ProsePage renders SiteNav and
 * PageFooter, whose navigation and footer strings are English. A localized page has to use
 * LocaleHeader/LocaleFooter or the reader would be handed English chrome on a Chinese page.
 * The section order - lookup table, seven groups, the boundary section, the FAQ and the
 * evidence block - is copied from the English page so the two versions still read as one
 * index in two languages.
 *
 * WHY DESTINATIONS ARE SPLIT BY TRANSLATION STATE: /zh/docs/, /zh/methodology/, /zh/checks/,
 * /zh/insights/ and /zh/compare/ exist, so they are linked in Chinese. /report/,
 * /answer-check/, /llms-txt-studio/, /readiness-badge/, /monitor/, /api-docs/ and
 * /dimensions/ are English, so their cards keep the English name, set hrefLang="en" and
 * append 「（英文）」. A Chinese label on an English page would send the reader one click into
 * a language the page cannot serve them in.
 *
 * WHY EVERY COUNT IS COMPUTED: the numbers in the intro, the table and the FAQ are lengths of
 * the arrays that render the same page. A translated index that quoted a different total
 * would be exactly the drift this page exists to expose.
 *
 * WHY THE RULE CARDS USE THE FIRST SENTENCE OF THE TRANSLATED RULE: see the English page's
 * firstSentence comment. The meta description is a template, and forty of those in one list
 * would say the same thing with a different noun. The rule's own opening sentence says what
 * the check actually tests.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "免费 GEO 工具、规则参考与测量方法";
const DESCRIPTION = `这里列出每个免费工具、每条已公布的规则、${DIMENSION_CATALOG.length} 个加权维度，以及分数背后的测量方法，并按你带着的问题分组。`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/tools/",
    languages: {
      en: "/tools/",
      "zh-Hans": "/zh/tools/",
      "x-default": "/tools/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/tools/" }),
};

/** A destination in the index. `note` is the honest qualifier, where one is needed. */
type Entry = {
  href: string;
  label: string;
  description: string;
  note?: string;
  /**
   * True when the destination has no Chinese page. The card keeps the English name, prints
   * 「（英文）」 and sets hrefLang="en", so the label and the destination agree about language.
   */
  english?: boolean;
};

type Group = {
  /** Anchor id, so the table above can link into the section. */
  id: string;
  /** The purpose, stated as the question the reader has. */
  purpose: string;
  /** One line on what the whole group is, shown in the lookup table. */
  what: string;
  entries: Entry[];
};

/*
 * The tools. The names stay English because the pages are English (the parent page's rule:
 * a translated name on an untranslated destination is a promise the click does not keep);
 * the descriptions and the qualifiers are translated.
 */
const TOOL_ENTRIES: Entry[] = [
  {
    href: "/report/",
    label: "GEO audit report",
    description:
      "按已公布的检查为一个首页打分，并列出未通过的项，附上每项检查产生的证据。",
    note: "免费。无需账号。无需邮箱。不存储关于该站点的任何信息，结果只存在于你当前所在的 URL 里。",
    english: true,
  },
  {
    href: "/answer-check/",
    label: "Answer checker",
    description:
      "六条公开规则，用在你从 ChatGPT、Perplexity 或 Gemini 粘贴的一段回答上：它有没有提到你、有没有在开头提到你、有没有把你列出来、有没有推荐你，以及有没有引用你的域名。",
    note: "免费，而且不会联系任何 AI 引擎——规则在你浏览器里、针对你粘贴的文本运行——也没有什么需要注册的。",
    english: true,
  },
  {
    href: "/llms-txt-studio/",
    label: "/llms.txt studio",
    description: `根据站点自身的标记草拟一份 llms.txt：真实的页面标题、首页描述，以及每个章节最多 ${MAX_LINKS_PER_SECTION} 个链接；每个链接的描述都取自被链接页面自身的 meta description 或 H1（如果读到了的话）。`,
    note: `文件里的任何描述都不是由工具撰写的。它会读取首页，以及至多 ${MAX_FETCH_PAGES} 个它链接到的页面，然后在文件里说明这份文件是如何生成的，以及它没能读取什么。`,
    english: true,
  },
  {
    href: "/readiness-badge/",
    label: "GEO readiness badge",
    description:
      "以 Markdown（用于 README）或 HTML（用于页脚）嵌入一个带有真实扫描分数的徽章。数字读自扫描结果，无法手动填写。",
    note: "无需账号、无需邮箱，也没有任何需要安装的东西。",
    english: true,
  },
  {
    href: "/monitor/",
    label: "Weekly GEO report",
    description:
      "当站点分数发生变化时给你发邮件：每周运行同一套检查，点名新近失败的检查，并附上失败检查所看到的证据。",
    note: "无需账号。整个订阅就是这一个邮箱地址——确认它即开始接收报告，退订链接即结束订阅。",
    english: true,
  },
  {
    /*
     * The API is a tool for the reader who wants the number rather than the page. It sits
     * last because it is the specialist entry point, not the one a first-time visitor needs.
     */
    href: "/zh/api-docs/",
    label: "Scan API",
    description:
      "一个公开的 JSON 端点：运行的是报告页所用的同一个分析器，无需密钥、无需账号，并逐字段说明。",
    note: "没有版本号、有限流；参数、状态码以及它看不到什么，都写在该页面上，而不是等你调用时才发现。",
  },
];

/**
 * The first sentence of a Chinese rule, for the same reason the English page takes the first
 * sentence of the English rule: the meta description is a template, and forty template
 * sentences in one list tell the reader nothing. `。` is the sentence end here; the ASCII
 * branch only covers an untranslated fallback.
 */
function firstSentence(text: string): string {
  const match = text.match(/^[\s\S]*?。|^[\s\S]*?\.(?=\s|$)/);
  const sentence = (match ? match[0] : text).trim();
  return sentence.length > 240 ? `${sentence.slice(0, 237)}…` : sentence;
}

const guidesList: { href: string; label: string }[] = [
  {
    href: "/zh/docs/ai-visibility-self-check/",
    label: "如何检查 AI 引擎是否提到你的品牌",
  },
  { href: "/zh/docs/llms-txt-deployment/", label: "如何生成并部署 /llms.txt 文件" },
  { href: "/zh/docs/qa-style-headings/", label: "为 AI 直接引用优化标题（问答式）" },
  {
    href: "/zh/docs/schema-org-jsonld/",
    label: "用 Schema.org JSON-LD 消除 AI 实体歧义",
  },
  { href: "/zh/docs/allow-ai-crawlers/", label: "为 GPTBot 与 PerplexityBot 配置 robots.txt 与 WAF" },
];

/*
 * The comparisons. Written as an array because the table above counts it: the number of
 * destinations in this group is used by the description, and "3" typed into both places is
 * the drift /tools/ exists to prevent one level up. The three Chinese pages are part of the
 * same translation wave, so the cards point at them rather than at the English originals.
 */
const COMPARE_ENTRIES: Entry[] = [
  {
    href: "/zh/compare/",
    label: "你需要哪一种测量？",
    description:
      "把就绪度审计、品牌提及监测、排名监测与爬虫日志分析并排比较：各自回答什么、需要什么数据，以及看不到什么。",
  },
  {
    href: "/zh/compare/llm-mentions-api/",
    label: "LLMention 与 DataForSEO 的 LLM Mentions API 有何区别",
    description:
      "两个名字相似、测量的却不是同一件事的产品，按数据来源、结果单位和盲区进行比较——并附上 DataForSEO 自己的描述及读取日期。",
  },
  {
    href: "/zh/compare/readiness-vs-mention-tracking/",
    label: "AI 能引用你，还是已经在引用了？",
    description:
      "为什么就绪度处在提及的上游、为什么一个页面可以已就绪却仍未被提到，以及如何先审计、后监测。",
  },
];

/*
 * The six article titles and deks are the strings /zh/insights/ already prints on its cards,
 * copied here so a reader who follows a card sees the same title on the article. Slugs, order
 * and the count still come from INSIGHTS, which is the registry the archive and the sitemap
 * read; only the copy is duplicated. A slug without copy throws at build time rather than
 * rendering a blank card.
 */
const ZH_INSIGHT_COPY: Record<string, { title: string; dek: string }> = {
  "thirty-homepages-none-graded-a": {
    title: "我们扫描了 30 个首页，没有一个拿到 A",
    dek: "这项研究里有一个数字人人都在引用，另外四个却很少被提起。这一篇讲的是它们背后的分布，包括那 9 行根本没有产出页面的记录。",
  },
  "six-news-publishers-blocking-ai-crawlers": {
    title: "六家新闻出版商，六家屏蔽 AI 爬虫",
    dek: "样本里的每一家新闻媒体都拒绝了 ChatGPT、Claude、Perplexity 和豆包背后至少一个爬虫。这是一个有可测量代价的策略选择，而且它未必是错的。",
  },
  "nine-homepages-never-answered": {
    title: "九个首页从未回应爬虫",
    dek: "403 不是一个页面。研究里有九行描述的是错误响应，而不是站点；把它们当作 0 计入，会得出一个更耸动、也更不真实的数字。",
  },
  "entity-markup-gap": {
    title: "30 个站点里有 22 个让 AI 猜它们是谁",
    dek: "一个无法把名字绑定到域名的模型只能靠猜，而猜测不是引用。修复它的标记只有四行 JSON，而样本里大多数站点并没有。",
  },
  "llms-txt-what-the-evidence-supports": {
    title: "llms.txt：证据究竟支持什么",
    dek: "这个文件加进去很容易，要把它当成一根杠杆却很难说得通。本文讲为什么仍然值得发布一个，也讲为什么不该假装它比实际更重要。",
  },
  "reading-a-failed-check": {
    title: "如何读懂一次未通过的检查，并修对地方",
    dek: "大多数糟糕的修复，都源于把一次失败当成一条指令。规则页正是为此写明每条检查不测什么；本文讲的就是怎么用这一点。",
  },
};

/** A missing translation must fail the build rather than render a card with no title. */
function zhInsightCopy(slug: string): { title: string; dek: string } {
  const copy = ZH_INSIGHT_COPY[slug];
  if (!copy) {
    throw new Error(
      `No Chinese index copy for "${slug}". Add it to ZH_INSIGHT_COPY in app/(locales)/[locale]/tools/page.tsx.`
    );
  }
  return copy;
}

/*
 * The method page, in an array for the same reason as the other groups: `totalEntries` below
 * is the sum of the array lengths, and a bare `+ 1` would be a count typed into code rather
 * than read from the thing it counts.
 */
const METHOD_ENTRIES: Entry[] = [
  {
    href: "/zh/methodology/",
    label: "GEO 分数是怎么算出来的",
    description:
      "公式、A–F 等级区间、每条规则及其 onFail 文本和分值，以及单 URL 扫描看不到的那部分图景。",
  },
];

/*
 * The writing, built from the registry rather than listed by hand, so the archive, the
 * sitemap and this index cannot disagree about what is published. The author page is the last
 * entry rather than a fourth group: it answers the same question - can I check who is saying
 * this - and separating it would make a two-item section. /author/ is English, hence the
 * marker.
 */
const WRITING_ENTRIES: Entry[] = [
  {
    href: "/zh/insights/",
    label: "全部写作",
    description: "研究结果、规则说明和明确写出的局限，汇成一个档案，每篇都附上其背后的数据。",
  },
  ...INSIGHTS.map((insight) => {
    const copy = zhInsightCopy(insight.slug);
    return {
      // insightPath() owns the English route shape; the prefix is the only localized part.
      href: `/zh${insightPath(insight.slug)}`,
      label: copy.title,
      description: copy.dek,
    };
  }),
  {
    href: AUTHOR.path,
    label: "谁在写这个站点",
    description: "对测量结果负责的人、这些文字如何产生与更正，以及这个站点如何获得资助。",
    english: true,
  },
];

export default async function ChineseToolsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");

  const runnableChecks = CHECK_CATALOG.filter((check) => !check.alias);
  const totalWeight = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);
  /*
   * The same arithmetic the English page uses, with the methodology entry counted as an
   * array length rather than a typed `+ 1`. The /zh/checks/ index is navigation, not one of
   * the individual rule pages the description counts, so it is deliberately absent here.
   */
  const totalEntries =
    TOOL_ENTRIES.length +
    runnableChecks.length +
    DIMENSION_CATALOG.length +
    guidesList.length +
    WRITING_ENTRIES.length +
    COMPARE_ENTRIES.length +
    METHOD_ENTRIES.length;
  const guidedChecks = runnableChecks.filter((check) => guidePathForCheck(check.id)).length;

  const groups: Group[] = [
    {
      id: "tools",
      purpose: "我想要一个自己网站的分数",
      what: "工具本身",
      entries: TOOL_ENTRIES,
    },
    {
      id: "rules",
      purpose: "有人告诉我某条规则没通过",
      what: "已公布的规则参考",
      entries: [
        {
          href: "/zh/checks/",
          label: `全部 ${runnableChecks.length} 条规则`,
          description:
            "扫描器执行的每一条规则，按所属维度分组；每条都附有明确的通过条件和分值。",
        },
        ...runnableChecks.map((check) => ({
          href: `/zh/checks/${check.id}/`,
          label: ZH_CHECK_TITLES[check.id] ?? CHECK_COPY[check.id]?.title ?? check.id,
          description: firstSentence(ZH_CHECK_RULES[check.id]?.rule ?? check.rule),
        })),
      ],
    },
    {
      id: "dimensions",
      purpose: "我想知道这个分数从哪来",
      what: `${DIMENSION_CATALOG.length} 个加权维度`,
      entries: DIMENSION_CATALOG.map((dimension) => ({
        // The dimension pages exist in English only, so the label keeps the Chinese name the
        // rest of the Chinese site uses but the destination is marked as English.
        href: `/dimensions/${dimension.id}/`,
        label: `${ZH_DIMENSION_LABELS[dimension.id] ?? dimension.label} — 占总分 ${dimension.weight}%`,
        description: ZH_DIMENSION_SUMMARIES[dimension.id] ?? dimension.rationale,
        english: true,
      })),
    },
    {
      id: "method",
      purpose: "我想核对方法，而不是直接相信它",
      what: "方法及其背后的证据",
      entries: METHOD_ENTRIES,
    },
    {
      id: "compare",
      purpose: "我在两种不同的测量之间做选择",
      what: "测量方法比较",
      entries: COMPARE_ENTRIES,
    },
    {
      id: "guides",
      purpose: "某项检查没通过，我需要修复它",
      what: "指南",
      entries: guidesList.map((guide) => ({ ...guide, description: "" })),
    },
    {
      id: "writing",
      purpose: "我想核对那些说法，而不是直接相信这个分数",
      what: "写作与作者",
      entries: WRITING_ENTRIES,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        {/* Full-bleed title band, matching ProsePage: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-4xl space-y-4">
              <Link
                href="/zh/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 返回扫描器
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                索引
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                本站的全部内容，以及每一项回答什么问题
              </h1>
              <div className="space-y-3 text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                <p>
                  共 {totalEntries} 个条目：{TOOL_ENTRIES.length} 个你可以自己运行的工具，
                  {runnableChecks.length} 个逐条说明规则的页面，
                  {DIMENSION_CATALOG.length} 个说明这些规则如何计分的维度页面，
                  {guidesList.length} 篇针对反复出现的修复的指南，{WRITING_ENTRIES.length}{" "}
                  个写作与作者条目，{COMPARE_ENTRIES.length} 个测量方法之间的比较，以及它们共同依据的方法。
                </p>
                <p>
                  这些工具免费，且不需要账号。参考页面同样免费，而这才是不同寻常的那一半：规则、分值和通过条件都是公开发布的，而不只是被描述，所以一个分数可以被质疑，而不是只能被信任。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="reveal-stagger mx-auto max-w-4xl">
              <div className="space-y-16">
                {/* The lookup table. Seven rows, so a reader can find the right section before
                    scrolling, with each row linking to its own section anchor. */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-[var(--line)] rounded-xl overflow-hidden">
                    <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">如果你的问题是</th>
                        <th className="text-left px-4 py-2.5 font-semibold">去哪里</th>
                        <th className="text-left px-4 py-2.5 font-semibold">条目数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group.id} className="border-t border-[var(--line)]">
                          <td className="px-4 py-2.5 align-top text-[var(--ink-1)]">
                            {group.purpose}
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <a
                              href={`#${group.id}`}
                              className="text-[var(--accent)] hover:opacity-75"
                            >
                              {group.what}
                            </a>
                          </td>
                          <td className="px-4 py-2.5 align-top font-mono text-xs text-[var(--ink-3)]">
                            {group.entries.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {groups.map((group) => (
                  <section key={group.id} id={group.id} className="scroll-mt-24">
                    <div className="border-b border-[var(--line)] pb-3 mb-6">
                      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                        {group.what}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--ink-3)]">
                        {group.purpose} · {group.entries.length} 个条目
                      </p>
                    </div>

                    {/* The guides carry their own titles and nothing else: a one-line summary of
                        a guide is a second description of it, and the five on /docs/ are already
                        the shortest true version of themselves. */}
                    {group.id === "guides" ? (
                      <ul className="space-y-2.5">
                        {group.entries.map((entry) => (
                          <li key={entry.href}>
                            <Link
                              href={entry.href}
                              hrefLang="zh-Hans"
                              className="text-[var(--accent)] hover:opacity-75 underline text-[15px]"
                            >
                              {entry.label}
                            </Link>
                          </li>
                        ))}
                        <li className="pt-2 text-sm text-[var(--ink-3)]">
                          在 {runnableChecks.length} 个规则页面中，有 {guidedChecks}{" "}
                          个指明了覆盖其修复方法的指南。其余规则在规则页本身给出完整修法，因为没有指南覆盖它们，而指向一篇只对了一半的指南，比什么都不说更糟。
                        </li>
                      </ul>
                    ) : (
                      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {group.entries.map((entry) => (
                          <li key={entry.href}>
                            <Link
                              href={entry.href}
                              hrefLang={entry.english ? "en" : "zh-Hans"}
                              className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-5 py-4 transition-colors hover:border-[var(--ink-3)]"
                            >
                              <span className="text-[15px] font-medium text-[var(--ink-1)]">
                                {entry.label}
                                {entry.english ? "（英文）" : null}
                              </span>
                              {entry.description ? (
                                <span className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">
                                  {entry.description}
                                </span>
                              ) : null}
                              {entry.note ? (
                                <span className="mt-2 text-xs leading-relaxed text-[var(--ink-3)]">
                                  {entry.note}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}

                {/* What the index is not. A page listing this many destinations is the one place
                    a reader is most likely to assume the list is complete in some stronger
                    sense, so the boundary is stated where the list ends. */}
                <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-6 py-6 text-[15px] leading-relaxed text-[var(--ink-2)]">
                  <h2 className="text-xl font-bold text-[var(--ink-1)]">这份索引没有收录什么</h2>
                  <div className="doc-article mt-3">
                    <p>
                      扫描器只读取一个页面。它不会向 ChatGPT、Perplexity、Gemini 或任何其他引擎提问，所以这里没有「询问引擎会回答什么」的工具——那篇
                      <Link
                        href="/zh/docs/ai-visibility-self-check/"
                        className="text-[var(--accent)] hover:opacity-75 underline"
                      >
                        自查指南
                      </Link>
                      就是它的诚实版本，由你亲手完成。
                    </p>
                    <p>
                      扫描结果页也没有列在这里，因为它是根据你输入的域名按请求生成的，而不是已发布的页面。上面每条规则都链接进那份报告，所以想知道一个页面当前在这{" "}
                      {runnableChecks.length} 条规则里失败哪几条，最快的方法就是拿你自己的域名跑一次。
                      {DIMENSION_CATALOG.length} 个维度的计分权重合计为 {totalWeight}。
                    </p>
                  </div>
                </section>

                {/*
                  The questions this index is asked, answered from what is on it rather than from
                  new copy. Each answer is assembled from a value the page has already computed -
                  the tool entries and their notes, the guide coverage, the catalogue lengths - so
                  an answer cannot go on describing a tool that changed.
                */}
                <section className="space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
                  <Faq
                    title="关于这些工具与参考的问题"
                    items={[
                      {
                        q: "这些内容需要账号吗？",
                        a: `不需要。${TOOL_ENTRIES.length} 个工具免费，作用在你拥有的页面或你已经拿到的一段回答上；${runnableChecks.length} 个规则页面、${DIMENSION_CATALOG.length} 个维度页面和方法本身都是已公布的文档。唯一需要邮箱地址的是每周报告，而确认这个地址就是订阅的全部。`,
                      },
                      {
                        q: "如果只有五分钟，我该从哪里开始？",
                        a: `先对你自己的域名运行审计报告。它会返回一个百分制分数、背后的 ${DIMENSION_CATALOG.length} 个维度得分，以及失败项列表；每条失败的规则都链接到这里的对应页面。先读这份索引，适合你已经知道自己带着哪个问题的时候。`,
                      },
                      {
                        q: `为什么只有 ${guidedChecks} 个规则页面链接到指南？`,
                        a: `这 ${guidesList.length} 篇指南覆盖的是跨站点反复出现的修复：爬虫访问、schema、标题、llms.txt，以及如何手工核对引用。其余 ${runnableChecks.length - guidedChecks} 条规则没有对应指南，所以它们的页面直接给出完整修法，而不是链接到一篇只对了一半的指南。`,
                      },
                      {
                        q: "有 API 吗？",
                        a: "有。扫描端点已经在 /api-docs/ 文档化：参数、响应结构、限流，以及它不保证什么。它仍然按 isolate 限流、没有版本号——文档里写明了这一点——所以把它当作已公布的接口，而不是稳定的产品 API。方法也一并公布，所以分数可以被重新计算，而不必只靠信任。",
                      },
                    ]}
                  />
                  <Evidence
                    title="证据与来源"
                    quote={GEO_PRIMARY_QUOTE}
                    attribution="Generative Engine Optimization, KDD 2024"
                    attributionUrl="https://arxiv.org/abs/2311.09735"
                    sources={GEO_PRIMARY_SOURCES}
                    note={`${DIMENSION_CATALOG.length} 个维度的权重遵循那项测量结果，而不是凭偏好决定；完整规则集已公布，所以分数可以手工重算，而不必只靠信任。`}
                  />
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
