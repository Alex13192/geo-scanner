import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { type EvidenceSource } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ZH_DIMENSION_LABELS } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";

/**
 * `/zh/compare/llm-mentions-api/` - the head-to-head page, in Chinese.
 *
 * WHY THIS PAGE IS TRANSLATED RATHER THAN LINKED AS ENGLISH: the page exists to stop two
 * similar product names from being merged, and the readers who merge them include the ones
 * searching in Chinese. A denial that is only readable in English does not reach the reader
 * who is currently confusing the two, which is the same argument the English page makes for
 * putting the difference on a comparison page instead of on /about/.
 *
 * WHY THE ENGLISH PAGE'S SHELL IS REBUILT HERE INSTEAD OF REUSING ProsePage: that shell renders
 * SiteNav and PageFooter, whose navigation and footer strings are English, so a reader following
 * the language switcher would land back on an English page. LocaleHeader/LocaleFooter are the
 * localized chrome. Everything between them is copied from the English page - the section order,
 * the two intro paragraphs, the five-row table, the four-item list, the FAQ and the source list -
 * so the two language versions still read as one article rather than two takes on a topic.
 *
 * WHAT STAYS ENGLISH, AND WHY (the rule is that a translation must not be able to weaken or
 * strengthen the English page's claim):
 *   - The DataForSEO quotation. It is their sentence, and a translated quotation is no longer
 *     the thing this page is quoting - a reader could not check it against their page.
 *   - The source titles, and every product and feature name (LLM Mentions API, Search Mentions,
 *     Target Metrics, Lite). These are the names a reader will look for in DataForSEO's own
 *     documentation and in the scan output; translating them would make the page harder to check.
 *   - URLs, the repository path in <code>, and the two dates. The dates are left in the English
 *     page's own forms (23 October 2026 and 2026-10-23) instead of being reformatted into Chinese:
 *     the whole point of stating the day the other product was read is that a reader can confirm
 *     the same day in either language version, so the string is kept matchable byte for byte.
 *   - No price and no ranking claimed by either side appears here, exactly as on the English page:
 *     a number copied from a pricing table or a comparison table goes stale without a code diff.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "LLMention 与 DataForSEO 的 LLM Mentions API 有何区别";
/**
 * The H1 keeps the full product name, because separating the two strings is the page's whole
 * job; the metadata title drops "GEO Scanner" for the reason the English page gives - the
 * layout appends " | LLMention" and the rendered <title> should stay within the length range
 * this site publishes and scores other pages against.
 */
const HEADING = "LLMention GEO Scanner 与 DataForSEO 的 LLM Mentions API";
const DESCRIPTION =
  "名字相似，测量对象不同：本站给「你的页面能否被引用」打分；DataForSEO 的 LLM Mentions API 追踪品牌在 AI 回答中的提及。";

/** The catalog's own numbers, imported rather than retyped - see /tools/ for why. */
const CHECK_COUNT = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;
const dimensionWeight = (id: string) =>
  DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;

/**
 * The Chinese name of a dimension, taken from the same map the Chinese methodology and checks
 * pages read. The five labels below are named in prose, and a hand-typed label would be a second
 * copy that could disagree with the table a reader clicks through to; the English label is shown
 * as a fallback rather than an invented translation.
 */
const dimensionLabel = (id: string) => ZH_DIMENSION_LABELS[id] ?? id;

/**
 * One sentence, quoted exactly, from DataForSEO's own overview page. Described in their words
 * rather than ours because a comparison written entirely in the competitor's paraphrase is the
 * thing readers have no way to check - the argument holds in Chinese for the same reason.
 */
const DATAFORSEO_QUOTE =
  "LLM Mentions API provides data on keyword, brand and website mentions in LLMs, including metrics like LLM chat mentions, sources and AI search volume.";

const DATAFORSEO_DOCS =
  "https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/overview/";
const DATAFORSEO_PRODUCT = "https://dataforseo.com/apis/ai-optimization-api/llm-mentions-api";

/**
 * Sources for the DataForSEO description, plus the two sources behind the readiness method. The
 * authority links are not decoration: the page makes a claim about a third party, and the reader
 * should be able to read that party's own words rather than take ours for it - so the labels stay
 * as published and only the note around them is in Chinese.
 *
 * WHY THIS IS A PLAIN LIST RATHER THAN THE EVIDENCE COMPONENT the other comparison pages use: that
 * component renders the site's standing GEO quotation as one blockquote, while this page's central
 * quotation is the competitor's own definition, already quoted in full where it is described.
 * Rendering it a second time in a sources block would read as two quotations of one sentence.
 */
const SOURCES: EvidenceSource[] = [
  {
    label: "DataForSEO, LLM Mentions API overview",
    url: DATAFORSEO_DOCS,
    note: "读取于 23 October 2026；上文的引语出自这一页",
  },
  {
    label: "DataForSEO, LLM Mentions API product page",
    url: DATAFORSEO_PRODUCT,
    note: "读取于 23 October 2026；下面的端点清单与数据来源浓缩自这一页",
  },
  {
    label: "DataForSEO, AI visibility trend tracker",
    url: "https://llm.dataforseo.com/",
    note: "读取于 23 October 2026；他们免费的品类趋势追踪器，与 API 分开",
  },
  {
    label: "Generative Engine Optimization (KDD 2024)",
    url: "https://arxiv.org/abs/2311.09735",
    note: "就绪度权重所遵循的那项测量",
  },
  {
    label: "The rule set and its weights",
    url: "https://github.com/Alex13192/geo-scanner",
    note: "每一项检查、它的权重与通过条件",
  },
];

/** When the competitor pages were read. Stated on the page, not only in a commit. */
const ACCESSED = "23 October 2026";
const REVIEWED = "2026-10-23";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/compare/llm-mentions-api/",
    languages: {
      en: "/compare/llm-mentions-api/",
      "zh-Hans": "/zh/compare/llm-mentions-api/",
      "x-default": "/compare/llm-mentions-api/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/compare/llm-mentions-api/",
  }),
};

export default async function ChineseLlmMentionsApiComparisonPage({
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

      {/*
        The way back to the Chinese comparison hub, kept where the other localized deep pages
        put it: a page-specific link belongs beside the page, not in navigation shared by every
        route, and it has to point at the Chinese hub rather than the English one.
      */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/zh/compare/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 全部对比
          </Link>
        </div>
      </div>

      <main>
        {/* Full-bleed title band: the colour step is what marks the margin, as on every band page. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-4xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                对比
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {HEADING}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                两个产品共用几乎相同的词汇，测量的却是不同的东西。一个读取你的页面，给它们能否被引用打分；另一个报告品牌在 LLM 回答中的提及。两者谁也替代不了谁。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="reveal-stagger mx-auto max-w-4xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              {/*
                The byline the English page renders with AuthorLine, written out here because that
                component prints English month names and the word "By". The date stays ISO for the
                same reason the other localized pages keep it: a review date a reader can compare
                across language versions is the point, and the author link is marked as English
                because the page behind it is.
              */}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  作者{" "}
                  <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    {AUTHOR.name}
                  </Link>
                  （英文）
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  最近复核 <time dateTime={REVIEWED}>{REVIEWED}</time>
                </span>
              </p>

              <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <p>
                  这种混淆完全可以理解：「LLM mentions」和「LLMention」共用了同样的词，两个产品也都给出一个看起来像可见度的数字。但它们测量的是同一条链路的相反两端：本站测量一个页面<em>能否</em>被引用，DataForSEO 测量一个品牌<em>是否</em>被提及。
                </p>
                <p>
                  两者并无关联。本站不是 DataForSEO 的合作方、经销商或前端界面，双方之间不存在数据关系，也没有共同的运营者。两个产品名称用词相近，并不构成合作；两者也互不替代。
                </p>

                <h2>DataForSEO 的 LLM Mentions API 做什么？</h2>
                <p>
                  按其网站上的描述（读取于 {ACCESSED}），它提供 LLM 中关键词、品牌和网站提及的数据，定位是追踪品牌在 AI 回答中的可见度。下面这句话是他们的原话，逐字照录：
                </p>
                <blockquote>
                  &ldquo;{DATAFORSEO_QUOTE}&rdquo; —{" "}
                  <a href={DATAFORSEO_DOCS} rel="noopener">
                    DataForSEO, LLM Mentions API overview
                  </a>
                </blockquote>
                <p>
                  他们的产品页把这句话展开成这些内容：Search Mentions，说明某个关键词或域名在 LLM 回答中如何出现、出现在什么语境；Target Metrics，按地区、语言、LLM 和域名汇总提及次数；一个用于并排比较多个品牌的多目标变体；Top Mentioned Domains、Pages 和 Brands；以及历史时间序列，包含新增提及与丢失提及，覆盖 Google 的 AI Overviews 和 ChatGPT，数据可回溯到 2025 年。Lite 端点返回同样的计数和 AI 搜索量，但不带那些更细的拆解。他们的公开页面里还有一个免费的可见度趋势追踪器：<a href="https://llm.dataforseo.com/" rel="noopener">llm.dataforseo.com</a>，与 API 分开。
                </p>

                <h2>LLMention 测的又是什么？</h2>
                <p>
                  这个扫描器像爬虫那样抓取一个 URL，然后按 {CHECK_COUNT} 项公开检查、{DIMENSION_COUNT} 个加权维度给这次响应打分。它读取 robots.txt、llms.txt 和 sitemap；解析 HTML 里的实体标记、标题结构和可提取的事实；并报告每一项未通过的检查，连同得出该结论的证据。它从不查询模型。
                </p>
                <p>
                  这些权重描述的是「什么样的页面可被引用」。{dimensionLabel("ai-crawler-access")}占分数的{" "}
                  {dimensionWeight("ai-crawler-access")}%，因为一个抓取不到的页面根本无从读取。{dimensionLabel("content-depth")}是 {dimensionWeight("content-depth")}%，{dimensionLabel("citability")}是 {dimensionWeight("citability")}%，这也是已发表研究支持得最直接的一个维度。{dimensionLabel("llms-txt")}是 {dimensionWeight("llms-txt")}%，{dimensionLabel("delivery")}是最小的维度，占 {dimensionWeight("delivery")}%：一项真实的检查，但刻意做小。这些百分比没有一个能说明引擎会不会提到你。
                </p>

                <h2>两者有什么不同？</h2>
                <p>
                  这张表列出决定读者需要哪一个的五处差异：各自回答的问题、数据来源、结果单位、盲区，以及各自成为正确工具的时机。
                </p>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>维度</th>
                        <th>LLMention GEO Scanner</th>
                        <th>DataForSEO 的 LLM Mentions API</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>各自回答的问题</td>
                        <td>爬虫能否到达这个页面、解析它，并找到一条回答需要引用的内容？</td>
                        <td>这个品牌在 AI 回答里被提到了吗，多频繁，在什么语境下？</td>
                      </tr>
                      <tr>
                        <td>数据来源</td>
                        <td>
                          你自己的页面，抓取一次，加上 robots.txt、llms.txt 和 sitemap。响应按公开的规则逐项打分。
                        </td>
                        <td>
                          一个 LLM 提示与回答的数据库，按他们网站上的描述，按关键词、域名或品牌查询。
                        </td>
                      </tr>
                      <tr>
                        <td>结果单位</td>
                        <td>一个百分制分数、一个等级，以及未通过检查的清单，每条都附上它看到的证据。</td>
                        <td>
                          提及次数和 AI 搜索量，按地区、语言、LLM 和域名分组，并附历史序列。
                        </td>
                      </tr>
                      <tr>
                        <td>各自看不到什么</td>
                        <td>是否有任何引擎提到或引用你。它测量的是就绪度，不是回答。</td>
                        <td>
                          被引用的是不是你的页面、一次提及因何出现，以及从未被引用的页面究竟有没有被抓取过。
                        </td>
                      </tr>
                      <tr>
                        <td>各自何时是正确工具</td>
                        <td>
                          当你掌控这些页面、还没有被引用的证据，并且想要一份修改清单而不是一条趋势线时。
                        </td>
                        <td>
                          当问题是你是否出现在回答里、与竞争对手相比如何，或者这种存在感随时间如何变化时。
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h2>各自什么时候是正确工具？</h2>
                <p>
                  选哪一个，取决于你盯着的是这条链路的哪一端；而两个都需要，也是可能的。
                </p>
                <ul>
                  <li>
                    <strong>选就绪度审计</strong>：当页面是你自己的，而你还不知道爬虫能不能读到它。它的产出是一份修改清单，规则也是公开的，所以一个结果可以被拿来争论。
                  </li>
                  <li>
                    <strong>选提及监测</strong>：当你需要知道你的品牌是否出现在 AI 回答里、与竞争对手相比如何，或者是在上升还是下降时。页面标记做得再多，也回答不了这个问题。
                  </li>
                  <li>
                    <strong>当「什么发生了变化」才是那个问题时，两个都要选。</strong>审计告诉你对页面的一处改动是否值得做；提及数据告诉你这次改动之后有没有随之发生什么。
                  </li>
                  <li>
                    <strong>要的是传统排名，两个都不要选。</strong>排名监测和服务器日志分析测量的是另外的层面；<Link href="/zh/compare/">对比总览</Link>把四种测量并排列出。
                  </li>
                </ul>

                <h2>其中一个能替代另一个吗？</h2>
                <p>
                  不能，原因是结构性的，而不是商业性的。就绪度是被引用的一个输入，而不是对被引用的测量。一次提及可以在完全没有抓取你页面的情况下发生：一个回答可以提到它从评测站、新闻报道或竞争对手的对比页里读到的品牌。
                </p>
                <p>
                  它们不是替代品，所以这一页不给它们排名。一个赢家只会是提问方式的产物，而不是关于这两个产品的事实。
                </p>

                <h2>关于 DataForSEO 的描述来自哪里？</h2>
                <p>
                  关于他们产品的每一条说法都浓缩自下面的来源，读取于 {ACCESSED}；上面那句引语是他们自己的原话。这里不复制任何价格，也不复制任何一方声称的排名：那些东西不需要代码变更就会变。关于本站方法的数字是从 <code>lib/geo/catalog.ts</code> 导入的，而不是手写进来的，所以它们不会与扫描器实际执行的规则脱节。
                </p>
                <ul>
                  {SOURCES.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} rel="noopener">
                        {source.label}
                      </a>
                      {source.note ? <span> — {source.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </article>

              {/* Outside the article, so the FAQ does not inherit the article's 17px body measure. */}
              <Faq
                title="关于这两个产品的问题"
                items={[
                  {
                    q: "LLMention 与 DataForSEO 有关联吗？",
                    a: "没有。它们是两个独立的产品，由不同的人运营；两者之间不存在合作、转售、数据关系，也没有共同的运营者。名字确实相似，而正是这种相似让人把两者混淆，但相似不是关系的证据。",
                  },
                  {
                    q: "哪一个能告诉我 ChatGPT 是否推荐我的品牌？",
                    a: "两者之中只有 DataForSEO 的那一个，按其网站上的描述：它报告品牌在 LLM 回答中的提及，包括提及次数和 AI 搜索量。本站扫描器永远回答不了这个问题，因为它不查询引擎。它告诉你的是：引擎需要的那张页面，是否处于可被引用的状态。",
                  },
                  {
                    q: "我需要两个都用吗？",
                    a: "只有当两个问题都重要、而且你打算照着答案行动时才需要。从就绪度开始：这是更便宜就能有定论的问题，而且它的失败都落在你自己的页面上。等你有值得被提及的内容时，再加上提及监测。",
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
