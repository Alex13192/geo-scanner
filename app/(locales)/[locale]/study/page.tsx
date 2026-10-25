import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { CHECK_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatDate, getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import {
  ANSWERED,
  AVERAGE,
  BLOCKED,
  NEWS,
  NEWS_BLOCKED,
  REFUSED,
  SCAN_DATE,
  STUDY_DATA_PATH,
  STUDY_ROWS,
  gradeCount,
} from "@/lib/study-data";

/**
 * `/zh/study/` - the first-party 30-homepage study, in Chinese.
 *
 * WHY THIS REBUILDS THE ENGLISH SHELL INSTEAD OF USING ProsePage: that shell renders SiteNav
 * and PageFooter, whose strings are English, and a localized page has to use
 * LocaleHeader/LocaleFooter or the language switcher would drop the reader onto an English
 * page. The band, the byline, the headline tiles, the table, the two prose sections and the
 * closing FAQ and evidence block are rebuilt here in the same order and with the same classes
 * as the English page, so the two versions read as one study in two languages.
 *
 * WHY ALMOST NO NUMBER IS TYPED HERE: the rows, the aggregates and the scan date come from
 * lib/study-data.ts, the current check count comes from the catalogue the engine runs, and the
 * three readings at the bottom take their figures from lib/insights.ts. A translated page that
 * quoted a different average or a hand-copied "40" would be the exact drift this study is
 * published to argue against. The English page asserts these same values in
 * scripts/test-analyze.mts; this page cannot disagree with them because it does not hold them.
 *
 * WHY THE DATES PRINT AS ISO: formatDate() prints English month names, and a Chinese page that
 * printed them would carry English prose into the middle of a sentence. The zh archive already
 * prints ISO for the same reason. The check below is what keeps this ISO twin from becoming a
 * second, quietly disagreeing date the next time the study is re-run - the English page keeps
 * the same guard for the same reason.
 *
 * WHAT STAYS ENGLISH: every domain, score, grade letter, percentage, rule count and status
 * code; every agent name (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended);
 * `robots.txt`, `llms.txt`, `sitemap.xml`, `npm run study:run`, the curl request and its JSON
 * body; the data endpoint URLs; and the paper quotation. Those are the subject matter or the
 * data, and a translated number or command would be a different one.
 *
 * WHY THE LINKS ARE MIXED: /methodology/ and the three readings have Chinese versions and are
 * linked in Chinese. /study/data/, the per-domain report and /author/ do not, so those links
 * keep hrefLang="en" and the （英文） marker that tells a reader they are leaving the
 * translation.
 *
 * WHAT THE TABLE DOES NOT DO: it does not re-score a single row. Every value below is read from
 * the row the English study publishes, and only the descriptive cells (disallowed / refused /
 * admitted / yes / no) are translated, as 禁止 / 拒绝 / 放行 / 是 / 否. The two mechanisms keep
 * separate words because telling them apart is the point of the section above the table; 禁止 is
 * deliberately not rendered as a policy claim, since some rows are blocked by an error response
 * rather than by a robots.txt line.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "我们扫描了 30 个大型网站的 AI 可见度";
const DESCRIPTION =
  "30 个首页没有一个拿到 A，平均分是 62。样本里每一家新闻出版商都屏蔽了 AI 爬虫。逐域名的结果，全部可以用公开 API 复现。";

/**
 * The ISO twin of SCAN_DATE, which lib/study-data.ts stores in the display form the English
 * page prints ("3 October 2026"). The assertion fails the build rather than letting the two
 * language versions date the same run differently.
 */
const SCAN_DATE_ISO = "2026-10-03";
if (formatDate(SCAN_DATE_ISO) !== SCAN_DATE) {
  throw new Error(
    `SCAN_DATE_ISO (${SCAN_DATE_ISO}) no longer matches SCAN_DATE ("${SCAN_DATE}") in lib/study-data.ts.`
  );
}

/**
 * The day the hreflang rule changed, as recorded beside the rule in lib/geo/analyze.ts and as
 * the newest entry in the /zh/methodology/ changelog. The rows were measured before it, so the
 * byline names both dates and the note under it says what a re-run would do differently.
 */
const METHOD_REVISED_ISO = "2026-10-23";

/**
 * How many checks the scanner publishes today, read from the catalogue rather than typed, so
 * the 38 in the method list stays a fact about this run and not a claim about the current
 * build.
 */
const CURRENT_CHECK_COUNT = CHECK_CATALOG.filter((check) => !check.alias).length;

type InterpretationCopy = {
  title: string;
  figureLabel: string;
};

/**
 * Chinese copy for the three readings, keyed by the slug lib/insights.ts already owns.
 *
 * WHY THE TITLES ARE COPIED FROM THE /zh/blog/ CARDS RATHER THAN TRANSLATED AGAIN: on the
 * English site the link text and the destination's title are the same registry field, so a
 * reader who clicks one sees what they clicked. The figures are not copied at all - they are
 * read from the registry below - and a missing key throws at import time instead of rendering a
 * link with no title.
 */
const INTERPRETATION_COPY: Record<string, InterpretationCopy> = {
  "thirty-homepages-none-graded-a": {
    title: "我们扫描了 30 个首页，没有一个拿到 A",
    figureLabel: "评分为 A",
  },
  "nine-homepages-never-answered": {
    title: "九个首页从未回应爬虫",
    figureLabel: "以错误响应作答",
  },
  "six-news-publishers-blocking-ai-crawlers": {
    title: "六家新闻出版商，六家屏蔽 AI 爬虫",
    figureLabel: "新闻站点屏蔽了爬虫",
  },
};

/**
 * The pieces that interpret this table, looked up in the archive registry rather than retyped.
 * The English href is derived from the slug and then prefixed with `/zh`, because every one of
 * these three has a Chinese version; a slug that moves takes its link and its title with it.
 */
const INTERPRETATIONS = [
  "thirty-homepages-none-graded-a",
  "nine-homepages-never-answered",
  "six-news-publishers-blocking-ai-crawlers",
].map((slug) => {
  const copy = INTERPRETATION_COPY[slug];
  if (!copy) {
    throw new Error(
      `No Chinese study-page copy for "${slug}". Add it to INTERPRETATION_COPY in app/(locales)/[locale]/study/page.tsx.`
    );
  }
  return {
    ...copy,
    slug,
    figure: getInsight(slug).figure,
    href: `/zh${insightPath(slug)}`,
  };
});

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/study/",
    languages: {
      en: "/study/",
      "zh-Hans": "/zh/study/",
      "x-default": "/study/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/study/",
  }),
};

function gradeClass(grade: string): string {
  if (grade === "B") return "text-emerald-400";
  if (grade === "C") return "text-blue-400";
  if (grade === "D") return "text-amber-400";
  return "text-red-400";
}

export default async function ChineseStudyPage({
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
        {/* Full-bleed title band, the same colour step that marks the margin on the English page. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-4xl space-y-4">
              <Link
                href="/zh/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 返回首页
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                研究
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                下面每一条结果，都来自本站发布的同一个扫描器——{SCAN_DATE_ISO}，它对着 30
                个大型网站的首页运行。没有任何结果经过手工调整，每一个数字都可以用公开 API 复现。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* The 4xl column is width="4xl" in the English ProsePage: this page is mostly a
                wide table rather than running text. */}
            <div className="reveal-stagger mx-auto max-w-4xl">
              {/*
                The byline sits above the numbers rather than inside the header: the header says
                what was measured, and these two dates say when and whether the rules have moved
                since. This is AuthorLine rebuilt in Chinese - the component prints its labels and
                month names in English.
              */}
              <div className="mb-12 space-y-2">
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
                    测量于 <time dateTime={SCAN_DATE_ISO}>{SCAN_DATE_ISO}</time>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    方法最近修订 <time dateTime={METHOD_REVISED_ISO}>{METHOD_REVISED_ISO}</time>
                  </span>
                </p>
                <p className="text-[13px] leading-relaxed text-[var(--ink-3)]">
                  这些记录是在 {METHOD_REVISED_ISO} 的 hreflang 变更之前测量的，那是
                  <Link
                    href="/zh/methodology/#what-changed"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    方法变更日志
                  </Link>
                  里的第一条。今天重跑的话，单语站点的分数最多会高 2
                  分，所以这些记录按当时测量到的结果发布，而不是被悄悄重新计分。
                </p>
              </div>

              {/* Headline numbers */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-black text-[var(--ink-1)] font-mono">{AVERAGE}</div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    平均分，满分 100
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-black text-red-600 font-mono">{gradeCount("A")}</div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    评为 A 的站点
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    {BLOCKED.length}
                    <span className="text-lg text-[var(--ink-3)]">/{STUDY_ROWS.length}</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    不接纳 AI 爬虫：或按策略，或直接拒绝
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-black text-[var(--ink-2)] font-mono">
                    {STUDY_ROWS.length - ANSWERED.length}
                  </div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    没有返回正常的 200
                  </div>
                </div>
              </section>

              <article className="doc-article text-sm text-[var(--ink-2)] leading-relaxed">
                <h2>我们发现了什么</h2>
                <p>
                  <strong>30 个首页里没有一个拿到 A。</strong>最高的是 {STUDY_ROWS[0].domain}，
                  {STUDY_ROWS[0].score} 分，只有 {gradeCount("B")} 个站点达到 B。在{" "}
                  {ANSWERED.length} 个正常返回页面的站点里，平均分是 {AVERAGE} 分（满分
                  100）——按这个量表是 D。
                </p>
                <p>
                  第二个发现更尖锐。<strong>30 个域名里有 {BLOCKED.length}{" "}
                  个在站点根目录不接纳 GPTBot、ClaudeBot、PerplexityBot、OAI-SearchBot 或
                  Google-Extended 中的至少一个</strong>——其中 {BLOCKED.length - REFUSED.length}{" "}
                  个在 robots.txt 里写明，另有 {REFUSED.length}{" "}
                  个在服务器上就拒绝了请求，robots.txt 甚至还没被读到。样本里的每一家新闻出版商都在这一组里：
                  {NEWS_BLOCKED.length} 个中有 {NEWS.length} 个。出版行业并不是无意间滑向屏蔽 AI
                  爬虫的——它是主动选择的。
                </p>
                <p>
                  第三个发现和那些卖 AI 的公司有关。<strong>OpenAI 自己的首页得分是{" "}
                  {STUDY_ROWS.find((r) => r.domain === "openai.com")?.score}，Anthropic 的是{" "}
                  {STUDY_ROWS.find((r) => r.domain === "anthropic.com")?.score}</strong>
                  ，两者都低于样本平均值，而 OpenAI 的例子更尖锐：在同一次运行里，对 openai.com
                  的爬虫形式请求被以 HTTP 403 拒绝，而同一个 URL
                  的浏览器形式请求却被正常返回。两者都没有声明 Organization
                  实体。得分最高的站点是那些向开发者出售基础设施的站点，而不是出售答案的站点。
                </p>

                <h2>为什么这些低分比看上去更要紧</h2>
                <p>
                  这些是首页，不是文章，而首页是任何站点上最难拿高分的页面：它很短、以导航为主，几乎不携带生成式回答所需的证据。这里分数低，并不意味着一个站点在
                  AI 回答里不可见——它们的文章可能好得多。
                </p>
                <p>
                  它真正说明的是，<strong>AI
                  系统最先落到的那一页，几乎没给它任何可引用的东西</strong>
                  。没有统计数字，没有引述，通常没有问题式标题，而且往往没有实体标记来说明这个域名属于哪个组织。在
                  30 个里的 {STUDY_ROWS.filter((r) => !r.entity).length}{" "}
                  个上，读首页的模型拿不到一句关于「谁拥有这个站点」的结构化陈述。
                </p>

                <h2>三种不同的东西都能挡住爬虫</h2>
                <p>
                  它们很容易被混为一谈，所以表里把它们分开。<strong>禁止</strong>是指
                  robots.txt 在根目录写明某个 AI agent
                  不得访问——一条公开的、有意为之的策略，任何爬虫都会遵守。
                  <strong>拒绝</strong>是指服务器用错误回应了爬虫形式的请求，却把同一个 URL
                  正常返回给浏览器形式的请求：这种拦截发生在读取 robots.txt
                  之前，而由于 GPTBot、ClaudeBot、PerplexityBot 和 OAI-SearchBot
                  都以 bot 身份出现，这样一条规则会把这一页所讨论的每一个引擎都挡在门外。表里有{" "}
                  {REFUSED.length} 个域名属于这种情况。
                </p>
                <p>
                  两种请求形式<em>都</em>被拒绝，是第三种情况，不计为屏蔽。它说明请求是从这次扫描所在的网络被挡掉的，那是关于扫描器的证据，而不是关于
                  AI 访问的证据。表里有 {STUDY_ROWS.filter((r) => r.aborted && !r.blocked).length}{" "}
                  个域名处于这种位置，表中把它们记为既不是禁止，也不是拒绝。
                </p>

                <h2>结果</h2>
              </article>

              <div className="overflow-x-auto pt-4 pb-10">
                <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold">域名</th>
                      <th className="text-left px-3 py-2.5 font-semibold">分数</th>
                      <th className="text-left px-3 py-2.5 font-semibold">HTTP 爬虫 / 浏览器</th>
                      <th className="text-left px-3 py-2.5 font-semibold">AI 爬虫</th>
                      <th className="text-left px-3 py-2.5 font-semibold">实体</th>
                      <th className="text-left px-3 py-2.5 font-semibold">sameAs</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-2)]">
                    {STUDY_ROWS.map((row) => (
                      <tr key={row.domain} className="border-t border-[var(--line)]">
                        <td className="px-3 py-2 font-mono text-[var(--ink-1)]">
                          <Link
                            href={`/zh/report/?domain=${row.domain}`}
                            hrefLang="zh-Hans"
                            className="hover:opacity-75 transition-colors"
                          >
                            {row.domain}
                          </Link>
                        </td>
                        <td className={`px-3 py-2 font-mono font-bold ${gradeClass(row.grade)}`}>
                          {row.score} {row.grade}
                        </td>
                        <td className="px-3 py-2 font-mono text-[var(--ink-3)]">
                          {row.status}
                          {row.browserStatus !== null && (
                            <span className="text-[var(--ink-3)]"> / {row.browserStatus}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.refused ? (
                            <span className="text-red-600">拒绝</span>
                          ) : row.blocked ? (
                            <span className="text-red-600">禁止</span>
                          ) : (
                            <span className="text-[var(--ink-3)]">放行</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{row.entity ? "是" : <span className="text-[var(--ink-3)]">否</span>}</td>
                        <td className="px-3 py-2">{row.sameAs ? "是" : <span className="text-[var(--ink-3)]">否</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-[var(--ink-3)] pt-3 leading-relaxed">
                  点击域名即可自己跑一次扫描，并在报告页查看当前结果（英文）。表中分数是{" "}
                  {SCAN_DATE_ISO} 的快照，此后已经变化。
                </p>
              </div>

              <article className="doc-article text-sm text-[var(--ink-2)] leading-relaxed">
                <h2>这项研究是怎么做的</h2>
                <ol>
                  <li>
                    这 30
                    个域名是手工挑选的，用来覆盖搜索、AI 实验室、企业软件、基础设施、开发者平台、新闻和德国工业。这是一个
                    <strong>便利样本，不是随机样本</strong>
                    ，它也不是对互联网上最大站点的排名。
                  </li>
                  <li>
                    每个首页都由 LLMention
                    爬虫从它自己的基础设施抓取，并诚实地以 bot 身份表明自己。它没有冒充 AI
                    爬虫，也不是从某个 AI 爬虫的地址发出的。在请求被拒绝的情况下，同一个 URL
                    会用浏览器形式的 User-Agent
                    再请求一次，这样就能把「针对已识别 bot 的规则」和「地址被封」区分开来。第二次请求从不给页面内容打分；它只决定一项检查，而它背后的规则发布在
                    <Link href="/zh/methodology/">方法页</Link>上。
                  </li>
                  <li>
                    robots.txt、llms.txt 和 sitemap.xml 都从同一个源请求，然后对结果运行了 38
                    项有文档记录的检查。那是测量这些记录时的数量；扫描器今天发布{" "}
                    {CURRENT_CHECK_COUNT}{" "}
                    项检查，所以即使站点上什么都没变，在这里重跑一个域名也可能得到不同的分数。
                  </li>
                  <li>
                    没有查询任何 AI 引擎。这一页上没有任何内容是对 ChatGPT、Claude 或 Perplexity
                    实际说了什么的测量——那是另一个实验，这个工具并不运行它。
                  </li>
                </ol>

                <h2>这项研究的局限</h2>
                <ul>
                  <li>
                    <strong>只有首页。</strong>
                    一个站点的文章通常比它的首页状态更好，所以这些分数低估了表中大多数站点。
                  </li>
                  <li>
                    <strong>只是一个时间点。</strong>robots.txt
                    和标记一直在变；表是快照，每一行都可以重跑。
                  </li>
                  <li>
                    <strong>地理依赖。</strong>
                    按访客位置重定向的站点返回的是某个地区版本，而地区版本并不相同。stripe.com
                    在一次运行里返回了荷兰版，在另一次里返回了新加坡版。
                  </li>
                  <li>
                    <strong>两种请求形式都被拒绝，不能证明任何关于 AI 访问的事情。</strong>
                    当扫描器既被当作 bot 又被当作浏览器挡掉时，拦截针对的是它来自的网络，表里会照实这么写，而不是怪罪站点。一次拒绝
                    <em>能</em>
                    说明的，是相反的那种情况——浏览器被正常服务，bot
                    被拒绝——那才是一条正好针对这一页所测量爬虫的规则。
                  </li>
                  <li>
                    <strong>一次拒绝可能在两次请求之间变化。</strong>
                    在这次重跑中，有一个站点先以 200 回应了浏览器形式的请求，几分钟后又给出了和给爬虫一样的错误。所以「拒绝」的标记是某一个时刻的一次观察，不是站点的稳定属性，重跑时这一行可能看起来不一样。
                  </li>
                  <li>
                    <strong>不是预测。</strong>
                    这些是就绪度检查，不是对引用的测量。一个站点可能只有 12 分，明天照样被引用。
                  </li>
                </ul>

                <h2>复现它</h2>
                <p>
                  整张表都以数据形式发布，所以不用抓取这一页也能核对它的算术：
                  <Link
                    href={STUDY_DATA_PATH}
                    hrefLang="en"
                    className="text-[var(--accent)] hover:opacity-75 underline"
                  >
                    <code>{STUDY_DATA_PATH}</code>
                  </Link>
                  （英文）返回包含数据行、计数、平均分和等级分布的 JSON，而{" "}
                  <Link
                    href={`${STUDY_DATA_PATH}?format=csv`}
                    hrefLang="en"
                    className="text-[var(--accent)] hover:opacity-75 underline"
                  >
                    <code>?format=csv</code>
                  </Link>
                  （英文）把同样的数据行返回成电子表格。两者都由这一页渲染的那个数组生成，所以不可能与它不一致。
                </p>
                <p>
                  采集步骤也在仓库里。<code>npm run study:run</code> 会对着线上端点把同样的 30
                  个首页走一遍，并按照上面那张表存储这些行的形状把它们打印出来——也就是{" "}
                  <Link
                    href={STUDY_DATA_PATH}
                    hrefLang="en"
                    className="text-[var(--accent)] hover:opacity-75 underline"
                  >
                    <code>{STUDY_DATA_PATH}</code>
                  </Link>
                  （英文）以 JSON
                  返回的同一批数据行。节奏控制是方法的一部分，而不是出于礼貌：它保持在端点自己的速率限制之下，因为一个被记为「关于某个站点的发现」的
                  429 会污染数据，而不只是让这次运行变慢。
                </p>
                <p>
                  上面的每一行都来自同一个公开端点，而 <code>brief=1</code> 只返回最关键的几个数字：
                </p>
                <pre>{`curl "${SITE_URL}/api/scan?domain=github.com&brief=1"

{"domain":"github.com","status":200,"browserStatus":null,
 "scoreBasis":"homepage","score":60,"grade":"D",
 "checksRun":38,"checksPassed":22,"aiCrawlersBlocked":false,
 "hasJsonLdEntity":false,"hasSameAs":false,"hasRobotsTxt":true,
 "topIssue":"robots-sitemap"}`}</pre>
                <p>
                  每个数字背后的规则都发布在
                  <Link href="/zh/methodology/">方法页</Link>
                  上，包括分数看不到的那部分图景。如果这里的结果看起来不对，那是一个缺陷报告，而且很受欢迎——会修的是检查，而不是数字。
                </p>

                {/*
                  The table is the claim; the archive is what it means. Three pieces, from the
                  registry rather than a hand-typed list, so this page cannot point a reader at an
                  article that no longer exists.
                */}
                <h3>对这张表的三种解读</h3>
                <p>
                  这些数据行是一回事，从它们得出的东西是另一回事。下面三篇走的是同一份数据，并且都链回它：
                </p>
                <ul>
                  {INTERPRETATIONS.map((piece) => (
                    <li key={piece.slug}>
                      <Link href={piece.href}>{piece.title}</Link>——{piece.figure}{" "}
                      {piece.figureLabel}。
                    </li>
                  ))}
                </ul>
              </article>

              <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/zh/" className="text-xs text-[var(--accent)] hover:opacity-75">
                  在你的站点上跑一次 →
                </Link>
                <Link
                  href="/zh/methodology/"
                  className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                >
                  方法论
                </Link>
              </div>

              <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
                <Faq
                  title="关于这项研究的问题"
                  items={[
                    {
                      q: "这 30 个站点是怎么选出来的？",
                      a: "它们是大型、知名首页的便利样本，而不是随机样本。这足以显示一种模式，却不足以据此推广，所以这一页会描述样本是怎么来的，而不是让读者去猜。",
                    },
                    {
                      q: "为什么这么多大型站点分数不高？",
                      a: "首页是任何站点上最难拿高分的页面：它很短、以导航为主，而且几乎不携带生成式回答所需要的证据。它们的文章页可能好得多。",
                    },
                    {
                      q: "有没有哪个数字被手工调整过？",
                      a: "没有。表中的每个数字都来自同一个扫描器、同一天，并且每一行都链接到一份可以对着公开 API 重新运行的报告。",
                    },
                  ]}
                />
                <Evidence
                  title="证据与来源"
                  quote={GEO_PRIMARY_QUOTE}
                  attribution="Generative Engine Optimization, KDD 2024"
                  attributionUrl="https://arxiv.org/abs/2311.09735"
                  sources={GEO_PRIMARY_SOURCES}
                  note="本站的权重遵循那项测量结果，而不是凭个人喜好；单 URL 扫描看不到的那部分图景，是写出来的，而不是被省略的。"
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
