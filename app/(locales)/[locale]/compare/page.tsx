import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/compare/` - the comparison hub, in Chinese.
 *
 * WHY THIS REBUILDS ProsePage's SHELL INSTEAD OF USING IT: ProsePage renders SiteNav and
 * PageFooter, whose navigation and footer strings are English. A localized page has to use
 * LocaleHeader/LocaleFooter or the reader would be handed English chrome on a Chinese page.
 * The section order, the title band, the table, the FAQ and the evidence block are copied
 * from the English page so the two versions still read as one page in two languages.
 *
 * WHY THE TABLE IS STILL THE CENTRE: the four measurements are confused because their
 * descriptions share nouns, not because any of them is obscure. A table forces each row into
 * the same three questions - what data it needs, what it answers, what it cannot see - and the
 * last column is the one that decides the choice. Translating the prose around the table does
 * not change that argument, so the table keeps its exact four rows and four columns.
 *
 * WHAT STAYS ENGLISH: product names, URLs, file names (robots.txt, llms.txt, sitemap), and
 * the Evidence quotation, which is a sentence from a paper. Links to pages that have no
 * Chinese translation stay on their English URLs, carry hrefLang="en" and say 「（英文）」,
 * exactly as the other localized pages do. No figure is retyped: the counts and weights are
 * imported from the catalogue the scanner runs.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "你需要哪一种测量？";
const DESCRIPTION =
  "就绪度审计、品牌提及监测、排名监测与爬虫分析回答的是不同的问题。这里用一张表帮你从中做出选择。";

/**
 * The counts are imported rather than typed, for the reason /tools/ states: a number written
 * into prose is a second copy of that number, and the two drift the first time a check is
 * added. The page publishes these values in the FAQ, so they have to be the catalogue's own.
 */
const CHECK_COUNT = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;
/**
 * A dimension's share of the score, read from the catalogue. The two weights this page names
 * in prose are imported for the usual reason: a percentage typed into a sentence is a second
 * copy of a number, and it survives the next re-weighting.
 */
const dimensionWeight = (id: string) =>
  DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;

/**
 * The page's review date, not the date any measurement was taken. There is no measurement on
 * this page - it describes four methods - so the byline says when the description was last
 * checked against them.
 */
const REVIEWED = "2026-10-23";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/compare/",
    languages: {
      en: "/compare/",
      "zh-Hans": "/zh/compare/",
      "x-default": "/compare/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/compare/",
  }),
};

export default async function ChineseCompareHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        {/* Full-bleed title band, matching ProsePage: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-4xl space-y-4">
              {/* ProsePage puts the page's own back-link here, above the eyebrow. */}
              <Link
                href="/zh/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 返回扫描器
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                对比
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <div className="space-y-3 text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                <p>
                  四种不同的测量都被叫作「AI 可见度」。它们使用不同的数据，可能彼此矛盾，也没有哪一种能取代其余几种。本页是一张地图：每一种回答什么、需要什么，以及在哪里停下。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="reveal-stagger mx-auto max-w-4xl">
              <div className="space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
                {/*
                  The byline from AuthorLine, in Chinese. AuthorLine's labels are English and
                  formatDate prints English month names, so the date stays ISO - the value a
                  reader can check - and the author link stays English because /author/ has no
                  Chinese translation yet.
                */}
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                  <span>
                    作者{" "}
                    <Link
                      href={AUTHOR.path}
                      hrefLang="en"
                      className="text-[var(--accent)] hover:opacity-75"
                    >
                      {AUTHOR.name}
                    </Link>
                    （英文）
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    最后审阅于 <time dateTime={REVIEWED}>{REVIEWED}</time>
                  </span>
                </p>

                <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
                  <p>
                    问题通常被表述为「我在 AI 搜索里有多可见？」，而这个说法把选择藏了起来。一个站点可以对爬虫完全可读，却从未被提及；它可以出现在回答里，而被引用的页面属于别人；它可以在传统搜索里排第一，却不在其上方的助手面板里。这每一种都是不同的测量，而测错了那一种，正是一个团队花一个季度去优化一个并不描述问题的数字的方式。
                  </p>
                  <p>
                    本页把四种测量并排放置。最常被彼此混淆的那两种各有自己的页面，表中链接了一次，结尾还会再链接一次。
                  </p>

                  <h2>这四种测量分别是什么？</h2>
                  <p>
                    每一行都是读者可能购买、自建或手动运行的一种测量。最能平息争论的是最后一列。
                  </p>
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>测量</th>
                          <th>它回答的问题</th>
                          <th>它需要的数据</th>
                          <th>它无法告诉你的事</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Link href="/report/" hrefLang="en">
                              就绪度审计
                            </Link>{" "}
                            <span className="text-[var(--ink-3)]">（本站，英文）</span>
                          </td>
                          <td>爬虫能否访问这个页面、解析它，并找到回答所需要的内容？</td>
                          <td>
                            你的 URL 被抓取一次，加上 robots.txt、llms.txt 和 sitemap；页面响应会按已公布的规则评分。
                          </td>
                          <td>是否有任何引擎真的提到或引用你。它测量的是就绪度，不是回答。</td>
                        </tr>
                        <tr>
                          <td>
                            <Link href="/zh/compare/llm-mentions-api/">品牌提及监测</Link>
                          </td>
                          <td>我的品牌是否在 AI 回答中被点名，频率如何，出现在什么语境中？</td>
                          <td>
                            一套问题集和对模型响应的访问权限、一个品牌名及其别名，以及一种按时间统计出现次数的方法。
                          </td>
                          <td>
                            被引用的页面是否属于你，或者一次提及为何出现。提及不是引用。
                          </td>
                        </tr>
                        <tr>
                          <td>排名监测</td>
                          <td>在传统搜索结果中，我的页面在一组关键词下出现在哪里？</td>
                          <td>
                            按计划收集你关心的关键词、国家和语言对应的搜索结果页。
                          </td>
                          <td>
                            助手是否会引用或推荐你。排名位置和回答是不同的界面，而回答可以谁都不引用。
                          </td>
                        </tr>
                        <tr>
                          <td>爬虫与服务器日志分析</td>
                          <td>哪些 AI 爬虫抓取了我的页面、在什么时候，以及它们收到了什么？</td>
                          <td>
                            你自己的服务器或 CDN 日志：user agent、路径、状态码和时间戳。这是四种测量中唯一在你自己控制的基础设施上进行的。
                          </td>
                          <td>
                            一次抓取是否变成了引用。爬虫抓取的页面远多于任何引擎引用的页面，而日志里的一个 200 并不等于一次提及。
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h2>我应该从哪一种测量开始？</h2>
                  <p>
                    从失败可以由你自己修复的那一种测量开始。这通常是就绪度审计，因为它读取你控制的页面，而且每一条未通过的检查都会指出一处修改。
                  </p>
                  <ol>
                    <li>
                      <strong>如果爬虫访问情况未知，先做审计。</strong>
                      它在本站免费，只读取一个 URL，而且它应用的每条规则连同分值都公布在
                      <Link href="/zh/methodology/">方法页</Link>上。一次被屏蔽的抓取，会让另外三种测量都在描述一个没有引擎能读取的页面。
                    </li>
                    <li>
                      <strong>如果页面可读，而问题是存在感，</strong>
                      你需要品牌提及监测。它用不同的数据源回答不同的问题，而
                      <Link href="/zh/compare/llm-mentions-api/">
                        与 DataForSEO 产品的对比
                      </Link>
                      说明了边界在哪里。
                    </li>
                    <li>
                      <strong>如果搜索流量仍然在养活业务，</strong>
                      排名监测仍然是一项真实测量，测的是你的客户依然在点击的那个界面。它只不过不是对助手回答的测量。
                    </li>
                    <li>
                      <strong>如果你怀疑爬虫在边缘被拒之门外，</strong>
                      去读日志。你的 CDN 是唯一能看到针对 bot 的 403 的地方，这也是为什么
                      <Link href="/zh/study/">
                        那项研究
                      </Link>
                      会用一次模拟浏览器的第二次请求，来区分策略屏蔽和网络屏蔽。
                    </li>
                  </ol>

                  <h2>一种测量能代替另一种吗？</h2>
                  <p>
                    不能。这四种测量位于同一条管道的不同位置，而每一种恰好在下一种开始的地方失明。就绪度分数看不到回答。提及次数看不到被引用的页面。排名位置看不到推荐。抓取日志看不到引用。
                  </p>
                  <p>
                    这就是为什么这里有用的对比内容是关于如何在它们之间选择，而不是宣布一个赢家。扫描器在 {DIMENSION_COUNT} 个加权维度上运行 {CHECK_COUNT} 项检查，仅 AI 爬虫访问一项就占分数的{" "}
                    {dimensionWeight("ai-crawler-access")}%，因为无法被抓取的页面就无法被读取。相比之下，AI 上下文文件占分数的{" "}
                    {dimensionWeight("llms-txt")}%——一个真实的信号，但被有意保持得很小。这些权重描述的是就绪度；它们对引擎是否会选中你只字未提。
                  </p>

                  <h2>这些页面接下来去哪里？</h2>
                  <ul>
                    <li>
                      <Link href="/zh/compare/llm-mentions-api/">
                        LLMention GEO Scanner 与 DataForSEO 的 LLM Mentions API
                      </Link>
                      —— 两个名字最常被混淆的产品，按数据源、结果单位和盲区进行比较。
                    </li>
                    <li>
                      <Link href="/zh/compare/readiness-vs-mention-tracking/">
                        AI 能引用你，还是已经在引用了？
                      </Link>
                      —— 概念版本：为什么就绪度在提及的上游，以及如何按正确的顺序使用两者。
                    </li>
                    <li>
                      <Link href="/zh/methodology/">方法论</Link>——
                      每条规则、它的权重和通过条件，都来自扫描器运行的那同一份目录。
                    </li>
                    <li>
                      <Link href="/report/" hrefLang="en">
                        运行审计
                      </Link>
                      （英文）—— 本站提供的免费测量，未通过的检查会连同每条检查看到的证据一起列出。
                    </li>
                  </ul>
                </article>

                <Faq
                  title="关于选择测量的问题"
                  items={[
                    {
                      q: "就绪度分数等同于 AI 可见度吗？",
                      a: "不是。就绪度分数是关于你页面的陈述：爬虫能否访问它们，以及它们是否携带回答所需要的内容。AI 可见度是关于回答的陈述：引擎是否点了你的名。一个页面可以既就绪又未被提及，而一次提及也可以在被引用页面并不属于你的情况下发生。",
                    },
                    {
                      q: "四种测量我都需要吗？",
                      a: "几乎肯定不需要。从就绪度审计开始，因为它免费，而且它的失败可以在你自己的页面上修复。当你有值得被引用的页面时，再加上提及监测；如果搜索流量仍然重要，再加上排名监测；只有当你怀疑爬虫被拒之门外时，才需要日志分析。",
                    },
                    {
                      q: "本站运行的是这四种中的哪一种？",
                      a: `就绪度审计：在 ${DIMENSION_COUNT} 个加权维度上共 ${CHECK_COUNT} 项检查，每次针对一个 URL 运行。它不查询引擎、不统计提及，也不读取你的服务器日志，所以上面四行中有三行描述的是本站有意不销售的测量。`,
                    },
                  ]}
                />

                {/*
                  The quotation stays English: it is a sentence from a paper, and a translated
                  quotation would change what the source says while still presenting it as one.
                  The heading and the note around it are translated.
                */}
                <Evidence
                  title="证据与来源"
                  quote={GEO_PRIMARY_QUOTE}
                  attribution="Generative Engine Optimization, KDD 2024"
                  attributionUrl="https://arxiv.org/abs/2311.09735"
                  sources={GEO_PRIMARY_SOURCES}
                  note="就绪度的权重遵循那项测量，而不是个人偏好。分数看不到什么，写在方法页上，而不是由这个数字去暗示。"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
