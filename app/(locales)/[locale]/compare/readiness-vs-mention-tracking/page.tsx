import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/compare/readiness-vs-mention-tracking/` - the conceptual comparison, in Chinese.
 *
 * WHY THIS REBUILDS ProsePage's SHELL INSTEAD OF USING IT: ProsePage renders SiteNav and
 * PageFooter, whose strings are English, and its back-link points at the English hub. A
 * localized page has to use LocaleHeader/LocaleFooter and return to `/zh/compare/`, or the
 * one link meant to orient a Chinese reader would hand them an English page. The band, the
 * `wrap` geometry, the `doc-article` measure and the FAQ/evidence order are copied from the
 * English page so the two versions are the same article in two languages.
 *
 * WHY NO CLAIM IS ADDED OR SOFTENED: the distinction is logical - an input is not an outcome -
 * and it does not depend on a vendor's position. Every number here is imported from the
 * catalogue, not retyped, and the comparison table keeps the same four rows and the same
 * disagreement in the last two.
 *
 * WHAT STAYS ENGLISH: product names (ChatGPT, Claude, Perplexity, DataForSEO), the Evidence
 * quotation, and links to pages that have no Chinese translation. Those links keep their
 * English URLs, carry hrefLang="en" and say 「（英文）」. The quotation is a sentence from a
 * paper; translating it would change what the source says while still presenting it as a
 * quotation.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "AI 能引用你吗？就绪度与提及监测的区别";
const DESCRIPTION =
  "就绪度与提及监测回答的是不同的问题：AI 能否引用你的页面，以及它是否已经在这样做？为什么先后顺序重要，以及如何把两者一起使用。";

/**
 * The two weights named below are read from the catalogue rather than typed, for the reason
 * the other comparison pages state: a number in prose is a second copy of a number the scanner
 * computes, and the copy drifts first.
 */
const dimensionWeight = (id: string) =>
  DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;

const REVIEWED = "2026-10-23";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/compare/readiness-vs-mention-tracking/",
    languages: {
      en: "/compare/readiness-vs-mention-tracking/",
      "zh-Hans": "/zh/compare/readiness-vs-mention-tracking/",
      "x-default": "/compare/readiness-vs-mention-tracking/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/compare/readiness-vs-mention-tracking/",
  }),
};

export default async function ChineseReadinessVsMentionsPage({
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
                href="/zh/compare/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 全部对比
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                对比
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <div className="space-y-3 text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                <p>
                  「我能被引用吗？」和「我正在被引用吗？」是两个问题，而不是一个。就绪度在提及的上游，这就是为什么一个页面可以已经就绪却仍然无人提及，也是为什么先审计、后监测比反过来更有效。
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
                    有两个问题被当成一个来问：AI 引擎能否引用我的页面，以及它们是否已经在引用？第一个是你站点的一种属性，你今天就能检查。第二个是对你无法控制的回答的观察，问题集不是你选的，时刻也已经过去。把其中任何一个当作另一个的代理指标，正是大多数糟糕的 AI 可见度看板的起点。
                  </p>

                  <h2>「可被引用」与「已被引用」有什么区别？</h2>
                  <p>
                    可被引用是页面所处的一种状态：爬虫能访问它，解析器能读取它，而且它包含回答可以取用的东西——一个事实、一段引文，或对有人提出的某个问题的直接回答。已被引用是一个事件：某个具体的引擎在回答某个具体问题时使用了你的页面。
                  </p>
                  <p>
                    第一个可以在任何回答存在之前检查。第二个在引擎回答之前根本无从检查，而且即便到了那时，那个回答也只是一个样本——来自一个明天可能给出不同回答的系统。这种不对称，正是这两种测量分属不同产品的全部原因。
                  </p>

                  <h2>为什么就绪度在提及的上游？</h2>
                  <p>
                    生成式回答是分阶段组装出来的，而页面可能在任何一个阶段掉队。扫描器只测量前两个阶段；提及测量只观察最后一个阶段。
                  </p>
                  <ol>
                    <li>
                      <strong>检索。</strong>
                      引擎或它的爬虫抓取它认为可能是候选的页面。一条 robots.txt 的 disallow、一条防火墙规则，或一个 noindex 指令，会在这里终止整条链路。
                    </li>
                    <li>
                      <strong>解析与选择。</strong>
                      引擎读取它拿到的内容，并决定哪些段落回答了问题。实体标记、标题结构、答案前置的段落，以及可提取的事实，正是让这个决定成为可能的东西。
                    </li>
                    <li>
                      <strong>生成。</strong>
                      选中的来源被用来撰写回答。提及或引用可能就发生在这里。
                    </li>
                    <li>
                      <strong>归属。</strong>
                      引擎可能点出品牌、链接页面，或者两者都不做。没有引用的提及很常见，这也是为什么提及监测和就绪度无法从彼此身上读出来。
                    </li>
                  </ol>
                  <p>
                    就绪度之所以在上游，是因为它移除了不引用你的理由。它不会创造需求、权威，也不会创造出一个你的页面能比别人回答得更好的问题。
                  </p>

                  <h2>页面可以已经就绪，却仍然无人提及吗？</h2>
                  <p>
                    可以，而且很常见。一个页面可以通过这个扫描器运行的每一项检查，却仍然从不出现于任何回答中，原因与它的标记毫无关系。
                  </p>
                  <ul>
                    <li>
                      <strong>竞争。</strong>
                      另一个页面可能更好地回答了这个问题，或者更新，或者是引擎最先检索到的来源。
                    </li>
                    <li>
                      <strong>查询需求。</strong>
                      如果没有人问你的页面所回答的问题，就没有一个回答可以让它出现。就绪度无法创造市场。
                    </li>
                    <li>
                      <strong>索引延迟。</strong>
                      抓取、索引和检索都不是即时的，一个上周才发布的页面可能根本还不在候选池里。
                    </li>
                    <li>
                      <strong>第三方来源。</strong>
                      回答可能根据一个评测网站、一个论坛帖子或一篇新闻文章点出你的品牌。你自己的页面缺席，不一定等于你的品牌缺席。
                    </li>
                    <li>
                      <strong>未注明出处的使用。</strong>
                      引擎可以复用你的事实而不点出域名。提及监测工具可能会漏掉一次由就绪度促成的使用。
                    </li>
                  </ul>

                  <h2>页面可以尚未就绪，却已经被提及吗？</h2>
                  <p>
                    同样可以，而且这两种失败模式不应该被混淆。在没有可引用页面的情况下到来的提及，通常是来自第三方的品牌提及——一篇评测、一次对比、一条目录收录。它们证明品牌存在于对话中，而不是证明站点已经准备好成为来源。
                  </p>
                  <p>
                    这个缺口很常见，而且并不矛盾：引擎说出的是它在别处了解到的关于你的信息，而那个本可以支撑这一说法的页面却被屏蔽、内容单薄或无法解析。修好页面，是改变第二种提及的唯一办法。
                  </p>

                  <h2>如何把两者一起使用？</h2>
                  <p>
                    先审计，后监测。这个顺序不是随意的：审计产出的是修改，而监测产出的是一个数字——在它背后的页面被修好之前，你无法对这个数字采取行动。
                  </p>
                  <ol>
                    <li>
                      <strong>先修访问。</strong>
                      在测量任何东西之前，先解除对爬虫的屏蔽。一个连自己的抓取检查都通不过的站点，测量的是屏蔽，而不是内容。
                    </li>
                    <li>
                      <strong>然后修解析器读到的东西。</strong>
                      实体标记、问题式标题、简短的开头回答、数字和引文。
                      <Link href="/zh/methodology/">方法页</Link>
                      公布了权重，所以工作的顺序是可见的，而不是靠猜。
                    </li>
                    <li>
                      <strong>记录一个基线。</strong>
                      手动问一组固定的问题，把回答连同日期保存下来，并保持问题集不变。
                      <Link href="/zh/docs/ai-visibility-self-check/">自检指南</Link>
                      是这一步的自己动手版本。
                    </li>
                    <li>
                      <strong>然后监测。</strong>
                      按计划重复同样的问题。提及计数只有对照一个你在开始改动页面之前就定义好的基线，才有意义。
                    </li>
                    <li>
                      <strong>当一次提及出现时，找到被引用的 URL。</strong>
                      审计那个页面，而不是首页。引擎选中的那个页面，才是值得加强的那个。
                    </li>
                  </ol>

                  <h2>每种测量实际测量的是什么？</h2>
                  <p>
                    用一张表最容易把握这种对应关系。最后两行是这两种测量会产生分歧的地方，而分歧正是重点。
                  </p>
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>问题</th>
                          <th>就绪度审计</th>
                          <th>提及监测</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>它测量什么</td>
                          <td>你页面的状态：可访问性、结构，以及回答能否从中取用一个说法。</td>
                          <td>品牌在 AI 回答中的出现情况，按一组提示词和一段时间来计数。</td>
                        </tr>
                        <tr>
                          <td>它需要什么</td>
                          <td>每个页面一个 URL，以爬虫的方式抓取。本站的审计不需要账号。</td>
                          <td>一套问题集、对模型响应的访问权限，以及一个包含别名和拼写错误的品牌定义。</td>
                        </tr>
                        <tr>
                          <td>它无法告诉你什么</td>
                          <td>引擎是否真的会点出或引用你。</td>
                          <td>被引用的页面是否属于你，或者一个从未被引用的页面究竟能不能被抓取。</td>
                        </tr>
                        <tr>
                          <td>它什么时候是合适的工具</td>
                          <td>在任何引用证据出现之前，以及每当页面发生变化时。</td>
                          <td>在有了值得提及的内容之后，用来观察它是否正在浮出水面。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h2>本站能告诉我什么，不能告诉我什么？</h2>
                  <p>
                    本站运行的是就绪度审计：{DIMENSION_CATALOG.length} 个加权维度，其中 AI 爬虫访问占分数的{" "}
                    {dimensionWeight("ai-crawler-access")}%，AI 上下文文件占{" "}
                    {dimensionWeight("llms-txt")}%——对于一个没有任何引擎承诺过其效果的文件来说，这是一个被有意保持得很小的权重。它报告一个分数、一个等级，以及未通过检查的列表，并附上每条检查所看到的证据。
                  </p>
                  <p>
                    它不查询引擎，所以它无法告诉你是否被提及、被引用或被推荐。这条边界写在扫描器自己的
                    <Link href="/about/" hrefLang="en">
                      关于页
                    </Link>
                    （英文）上，并在
                    <Link href="/zh/study/">
                      30 个首页的研究
                    </Link>
                    中得到展示——那项研究没有查询任何 AI 引擎，也没有任何一行是对 ChatGPT、Claude 或 Perplexity 实际说了什么的测量。
                  </p>

                  <h2>我应该从哪里开始？</h2>
                  <p>
                    在你最希望被引用的那个页面上运行免费审计。修掉它报告的问题，并记下哪些失败是真实的、哪些只是页面类型造成的假象——
                    <Link href="/zh/insights/reading-a-failed-check/">
                      读懂一次未通过的检查
                    </Link>
                    是做出这个判断的指南。然后，如果你有值得提及的内容，就针对固定基线建立一套提及测量。
                  </p>
                  <p>
                    产品对比在{" "}
                    <Link href="/zh/compare/llm-mentions-api/">
                      LLMention 与 DataForSEO 的 LLM Mentions API
                    </Link>{" "}
                    页面上。四种测量的地图——包括排名监测和爬虫日志——在
                    <Link href="/zh/compare/">对比总览</Link>上。
                  </p>
                </article>

                <Faq
                  title="关于就绪度与提及的问题"
                  items={[
                    {
                      q: "高就绪度分数能保证我会被引用吗？",
                      a: "不能。分数说明页面处于一种让引用成为可能的状态；它没有说明引擎检索到了它、偏好它，或者有一个问题可以用它来回答。一个已经就绪、却回答着无人提出的问题的页面，将不会被提及，而审计看不到这一点。",
                    },
                    {
                      q: "如果我已经看到提及，还需要审计吗？",
                      a: "通常需要，但理由不同。已有的提及往往来自第三方来源，而不是你自己的页面。审计显示你的页面是否处于可以成为来源的状态——这是你控制的部分，也是在第三方报道停止后会不断累积的部分。",
                    },
                    {
                      q: "我应该先做哪一个？",
                      a: "先审计，后监测。审计的输出是一份针对你自己页面的修改清单；监测的输出是一个数字，在那些页面修好之前你无法据此行动。在审计之前就做监测，往往是在测量一次爬虫屏蔽，却把它叫作内容问题。",
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
                  note="就绪度评分遵循那项测量，而不是个人偏好。它看不到什么——引擎是否真的点出你——写在本页和方法页上，而不是从这个数字里省略掉。"
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
