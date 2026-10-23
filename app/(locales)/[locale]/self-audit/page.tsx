import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { CHECK_CATALOG, DIMENSION_CATALOG, GRADE_BANDS } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { SELF_AUDIT } from "@/lib/home-content";
import { homePath, PREFIXED_LOCALES } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ZH_CHECK_TITLES, ZH_DIMENSION_LABELS } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";
import { BRAND, SITE_HOST, SITE_URL } from "@/lib/site";

/**
 * `/zh/self-audit/` - the site's own measurement, in Chinese.
 *
 * WHY NOTHING NUMERIC IS TYPED HERE: the English page reads the record through
 * lib/home-content.ts, the catalogue through lib/geo/catalog.ts and the wording through
 * lib/geo/check-copy.ts. This page imports the same four modules. A translation that
 * repeated the score or the check counts would be a second copy of a weekly measurement,
 * and the first re-measurement would make the two language versions disagree about the
 * same fact. The numbers below are computed; only the prose around them is written here.
 *
 * WHY THE SHELL IS REBUILT INSTEAD OF USING ProsePage: that shell renders SiteNav and
 * PageFooter, whose strings are English. A localized page has to use LocaleHeader and
 * LocaleFooter or the language switcher would drop the reader back onto an English page.
 * The band, the byline, the headline tiles, the table, the method section, the FAQ and
 * the evidence block are rebuilt in the same order and with the same classes as the
 * English page so the two versions read as one page in two languages.
 *
 * WHY THE DATE IS ISO: formatDate() prints English month names. A Chinese sentence with
 * "23 October 2026" in the middle of it would carry English prose into the translation,
 * so the date prints exactly as the record stores it. It is still read from the record,
 * not typed, and the same value feeds the visible sentence and the <time> elements.
 *
 * WHAT STAYS ENGLISH: every command, file path, URL and status code; the product and
 * agent names; the quotation and the bibliographic source titles in the evidence block.
 * Those are the subject matter or citations, and translating them would make the page
 * harder to verify rather than easier to read.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

/** The denominator the score is published against: the sum of the dimension weights. */
const SCALE = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);

/** The measurement date as the record stores it; see the note above on ISO dates. */
const MEASURED_ON = SELF_AUDIT.measuredAt;

/** Applicable checks that passed, as the percentage the analyser's statistics rule reads. */
const PASS_SHARE =
  SELF_AUDIT.applicable > 0
    ? Math.round((SELF_AUDIT.passed / SELF_AUDIT.applicable) * 100)
    : 0;

/** The heaviest dimension, read from the catalogue rather than typed into the prose. */
const AI_ACCESS_WEIGHT =
  DIMENSION_CATALOG.find((dimension) => dimension.id === "ai-crawler-access")?.weight ?? 0;

/**
 * How many languages the homepage and pricing page publish beyond English.
 *
 * WHY THIS IS COUNTED, NOT TYPED: the hreflang paragraph below explains that the rule now
 * passes because those pages declare the full matrix. Adding or removing a locale must move
 * that sentence with the metadata, or the explanation quietly becomes a stale claim about a
 * translation set the site no longer publishes.
 */
const ADDITIONAL_LANGUAGES = PREFIXED_LOCALES.length;

/** The band this record landed in, used for the label beside the grade letter. */
const GRADE_BAND = GRADE_BANDS.find((band) => band.grade === SELF_AUDIT.grade);

/**
 * Chinese descriptions for the grade bands.
 *
 * WHY A LOCAL MAP: GRADE_BANDS lives in the catalogue and its `label` field is English
 * prose. The grade letter and the band boundaries are imported so the page cannot invent
 * a grade; only the sentence beside the letter is translated. A grade missing from this
 * map falls back to the published English label rather than rendering an empty caption.
 */
const ZH_GRADE_LABELS: Record<string, string> = {
  A: "就绪度优秀：页面具备被引用所需的要素",
  B: "就绪度良好：具备被引用所需的大部分要素",
  C: "就绪度一般：具备部分要素，多个维度仍需改进",
  D: "就绪度较差：存在明显的 GEO 缺口",
  F: "就绪度严重不足：缺失大部分被引用所需的要素",
};

const GRADE_LABEL = GRADE_BAND
  ? ZH_GRADE_LABELS[GRADE_BAND.grade] ?? GRADE_BAND.label
  : "";

/**
 * The page title carries the measured score, so it is assembled from the record rather
 * than typed. The suffix is the one the locale layout appends, built from BRAND so the
 * guard below measures the rendered length rather than the raw one.
 *
 * WHY THE GUARD: the score changes when the page is re-measured, and this page is itself
 * scored by the analyser that publishes the 15-65 / 50-160 title and description ranges.
 * A measured value must not quietly push the page outside a range the site documents.
 */
const TITLE = `自审——本站用自己的扫描器得了 ${SELF_AUDIT.score} 分`;
const DESCRIPTION = `测量于 ${MEASURED_ON}：${SELF_AUDIT.score}/${SCALE}，等级 ${SELF_AUDIT.grade}，${SELF_AUDIT.passed} / ${SELF_AUDIT.applicable} 项适用检查通过。记录、方法，以及这个数字看不到的东西。`;
const RENDERED_TITLE = `${TITLE} | ${BRAND}`;

if (RENDERED_TITLE.length > 65 || TITLE.length < 15) {
  throw new Error(
    `The Chinese self-audit title is ${RENDERED_TITLE.length} characters with the site suffix ` +
      `("${RENDERED_TITLE}"). The published range is 15-65, and lib/self-audit.json has moved ` +
      "since this title was written. Shorten the sentence rather than the recorded number.",
  );
}
if (DESCRIPTION.length < 50 || DESCRIPTION.length > 160) {
  throw new Error(
    `The Chinese self-audit description is ${DESCRIPTION.length} characters. The published range ` +
      "is 50-160, and it was assembled from lib/self-audit.json. Shorten the sentence rather " +
      "than the recorded number.",
  );
}

/**
 * WHY AN EXCLUSION NEEDS A SENTENCE AND NOT JUST AN ID.
 *
 * The record stores check ids. A reader cannot act on "hreflang" without being told what
 * the rule asked and why the page was never asked it. The English map says "this site
 * serves one language"; that sentence is no longer true, because the site now publishes
 * five additional locales. Copying it here would preserve a false claim, so the Chinese
 * text states the absence reasoning the rule actually applies: a page that declares no
 * language version has nothing to judge, and one fetch cannot tell a single-language site
 * from a translated one that never declared its versions. Declaring exactly one code
 * still fails. The fallback below keeps an unknown id honest rather than blank.
 */
const NOT_APPLICABLE_WHY: Record<string, string> = {
  hreflang:
    "规则要求页面至少声明两个语言版本。没有声明任何语言版本的页面，没有可判断的东西——一次抓取也分不清「单语站」和「有翻译但没声明」。缺失是页面从未被问到的问题，所以标为不适用而不是失败；声明了恰好一个语言代码的页面仍然失败。",
};
const NOT_APPLICABLE_FALLBACK =
  "规则无法判断这一页，所以它被移出分数，而不是计为失败。规则到底问的是什么，写在它自己的页面上。";

/**
 * Rule titles come from ZH_CHECK_TITLES, then from CHECK_COPY (generated from the
 * analyser), then from the id itself. The middle step is the English fallback the task
 * allows when a translation is missing: a newly catalogued rule shows its published
 * English title rather than a blank or a guess. Points and dimension come from
 * CHECK_CATALOG, which is what turns an id into something a reader can follow.
 */
function checkTitle(id: string): string {
  return ZH_CHECK_TITLES[id] ?? CHECK_COPY[id]?.title ?? id;
}

const NOT_APPLICABLE = SELF_AUDIT.notApplicable.map((id) => {
  const check = CHECK_CATALOG.find((entry) => entry.id === id);
  const dimension = check
    ? DIMENSION_CATALOG.find((entry) => entry.id === check.dimension)
    : undefined;
  return {
    id,
    title: checkTitle(id),
    why: NOT_APPLICABLE_WHY[id] ?? NOT_APPLICABLE_FALLBACK,
    check,
    dimension,
  };
});

const FAILED = SELF_AUDIT.failures.map((id) => ({
  id,
  title: checkTitle(id),
}));

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/self-audit/",
    languages: {
      en: "/self-audit/",
      "zh-Hans": "/zh/self-audit/",
      "x-default": "/self-audit/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/self-audit/",
  }),
};

export default async function ChineseSelfAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");
  const failedCount = SELF_AUDIT.failures.length;
  const notApplicableCount = SELF_AUDIT.notApplicable.length;

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
                ← 返回扫描器
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                自审
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                一个测量工具能给出的最好证据，是对它自己的测量。这一页是 LLMention 自己首页的结果——日期、分数、
                不适用的规则、失败项（或没有失败项），以及方法——发布在一个爬虫被允许读取的 URL 上，而不是只放在
                爬虫不被允许读取的报告里。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* The 4xl column is width="4xl" in the English ProsePage: this page is mostly a table. */}
            <div className="reveal-stagger mx-auto max-w-4xl">
              {/*
                This is AuthorLine rebuilt in Chinese: the component prints "By" and English
                month names, and the byline is the one place where the page has to name who is
                accountable for the number and when it was taken. The date is the record's,
                not the page's, and it is the same value printed in the table below.
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
                    测量于 <time dateTime={SELF_AUDIT.measuredAt}>{MEASURED_ON}</time>
                  </span>
                </p>
                <p className="text-[13px] leading-relaxed text-[var(--ink-3)]">
                  这个日期是完成测量的那一天，不是这一页最后一次编辑的那一天。记录按计划重新测量，所以日期随
                  测量移动，而不是随编辑移动；没有这一点，下面那句话就和一句冒充当前结论的过期说法没有区别。
                </p>
              </div>

              {/* Headline numbers, all read from the record. */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-semibold text-[var(--ink-1)] font-mono">
                    {SELF_AUDIT.score}
                    <span className="text-lg text-[var(--ink-3)]">/{SCALE}</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    本站扫描器给出的首页得分
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-semibold text-[var(--ok)] font-mono">
                    {SELF_AUDIT.grade}
                  </div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    等级{GRADE_LABEL ? `——${GRADE_LABEL}` : ""}
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-semibold text-[var(--ink-1)] font-mono">
                    {SELF_AUDIT.passed}
                    <span className="text-lg text-[var(--ink-3)]">/{SELF_AUDIT.applicable}</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    通过的适用检查（{PASS_SHARE}%）
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
                  <div className="text-3xl font-semibold text-[var(--ink-2)] font-mono">
                    {notApplicableCount}
                  </div>
                  <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
                    条不适用规则，下方逐条列出
                  </div>
                </div>
              </section>

              <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <h2>测量了什么，什么时候测的？</h2>
                <p>
                  测量对象是本站首页 <code>/</code>：<code>next build</code> 为它写出的那份
                  HTML，也就是爬虫实际收到的东西，再加上站点的 <code>robots.txt</code>、
                  <code>llms.txt</code> 和 <code>sitemap.xml</code>。分析器就是公开的{" "}
                  <code>/api/scan</code> 端点运行的那一个；这一页没有任何一部分是手工打分的。
                  测量完成于 <time dateTime={SELF_AUDIT.measuredAt}>{MEASURED_ON}</time>
                  ，结果写入 <code>lib/self-audit.json</code>——这一页和首页读的是同一个文件。
                </p>
                <p>
                  <strong>一个 URL，不是一个站点。</strong>
                  免费扫描只读取一个页面，所以这个数字描述的是首页，对首页链出去的页面——指南、规则参考、
                  研究——什么也没说。首页也是一个站点里最难拿高分的页面：它短、以导航为主，承载的证据比
                  一篇文章少。这正是应该把这个数字读成一次测量、而不是读成整站总结的理由。
                </p>

                <h2>测量结果是什么？</h2>
                <p>
                  记录显示 <strong>{SELF_AUDIT.score} / {SCALE}</strong>，
                  <strong>等级 {SELF_AUDIT.grade}</strong>
                  {GRADE_LABEL ? `（${GRADE_LABEL}）` : ""}。在适用的检查中，
                  <strong>
                    {SELF_AUDIT.passed} / {SELF_AUDIT.applicable}
                  </strong>{" "}
                  项通过，占适用集合的 {PASS_SHARE}%；{notApplicableCount} 条规则被排除，
                  {failedCount} 项检查失败。逐字段如下：
                </p>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>字段</th>
                        <th>{MEASURED_ON} 的值</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>被测页面</td>
                        <td>
                          位于 <code>/</code> 的首页，域名{" "}
                          <Link href={`/report/?domain=${SITE_HOST}`} hrefLang="en">
                            {SITE_HOST}
                          </Link>
                          （英文）
                        </td>
                      </tr>
                      <tr>
                        <td>测量日期</td>
                        <td>
                          <time dateTime={SELF_AUDIT.measuredAt}>{MEASURED_ON}</time>
                        </td>
                      </tr>
                      <tr>
                        <td>分数</td>
                        <td>
                          {SELF_AUDIT.score} / {SCALE}
                        </td>
                      </tr>
                      <tr>
                        <td>等级</td>
                        <td>
                          {SELF_AUDIT.grade}
                          {GRADE_LABEL ? `——${GRADE_LABEL}` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td>执行的检查</td>
                        <td>{SELF_AUDIT.run}</td>
                      </tr>
                      <tr>
                        <td>通过的检查</td>
                        <td>
                          {SELF_AUDIT.passed} / {SELF_AUDIT.applicable} 项适用（
                          {SELF_AUDIT.passed} / {SELF_AUDIT.run} 项执行）
                        </td>
                      </tr>
                      <tr>
                        <td>不适用</td>
                        <td>
                          {notApplicableCount}
                          {notApplicableCount > 0
                            ? `——${SELF_AUDIT.notApplicable.join("、")}`
                            : "——无"}
                        </td>
                      </tr>
                      <tr>
                        <td>失败</td>
                        <td>
                          {failedCount}
                          {failedCount > 0 ? `——${SELF_AUDIT.failures.join("、")}` : "——无"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  表格由记录生成，所以它不是第二份可能与第一份不一致的数字。记录本身以{" "}
                  <code>lib/self-audit.json</code> 的形式发布在仓库里，结构就是上面这样。
                </p>

                <h2>哪些规则被标为「不适用」？</h2>
                <p>
                  {notApplicableCount === 0
                    ? "本次测量没有不适用规则：目录里的每一条规则都能判断这一页，所以分母就是完整目录，没有任何规则被排除。"
                    : `有 ${notApplicableCount} 条规则因为所问的问题不适用于这一页而被排除出分数。记录把它们的 id 列出来，而不是在执行数和通过数之间留下一个无声的空缺。`}
                </p>
                {NOT_APPLICABLE.length > 0 ? (
                  <ul>
                    {NOT_APPLICABLE.map((entry) => (
                      <li key={entry.id}>
                        <Link href={`/zh/checks/${entry.id}/`}>{entry.title}</Link>——{entry.why}
                        {entry.check && entry.dimension ? (
                          <>
                            {" "}
                            这条规则在「
                            {ZH_DIMENSION_LABELS[entry.dimension.id] ?? entry.dimension.label}
                            」维度内值 {entry.check.points} 分；把它排除，等于从分数的分子和分母
                            同时去掉这些分，所以总分仍然是「实际可评估部分」的百分比，而不是悄悄
                            变成一次扣分。
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {NOT_APPLICABLE.length > 0 ? (
                  <p>
                    把一次「不适用」而不是「失败」变成可能的那次改动，连同日期和原因，记录在{" "}
                    <Link href="/zh/methodology/#what-changed">方法变更记录</Link>
                    里。每条规则执行时的样子发布在它自己的规则页上，目录里的每条规则都列在{" "}
                    <Link href="/zh/checks/">规则参考</Link>中。
                  </p>
                ) : (
                  <p>
                    过去在这里被排除的规则是 hreflang：它现在通过了，因为首页和定价页已经以英文之外的{" "}
                    {ADDITIONAL_LANGUAGES} 种语言发布，并声明了完整的语言矩阵。改了什么、
                    什么时候改的，都在{" "}
                    <Link href="/zh/methodology/#what-changed">方法变更记录</Link>里。
                  </p>
                )}

                <h2>哪些检查失败了？</h2>
                <p>
                  {failedCount === 0
                    ? `在 ${MEASURED_ON} 的这次测量中没有失败项：记录里的失败列表为空，所以 ${SELF_AUDIT.applicable} 项适用检查中有 ${failedCount} 项失败。这里保留这个空列表，而不是把整节删掉，因为一份会删掉空章节的报告，和一份从来没有这些章节的报告无法区分。`
                    : `${failedCount} 项检查在 ${MEASURED_ON} 失败。下面列出它们并附上规则链接，在之后某次测量显示页面通过之前，它们会一直留在这里。`}
                </p>
                {FAILED.length > 0 ? (
                  <ul>
                    {FAILED.map((entry) => (
                      <li key={entry.id}>
                        <Link href={`/zh/checks/${entry.id}/`}>{entry.title}</Link>——
                        <code>{entry.id}</code>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>
                  失败是关于页面在被测量那一刻的判断，不是永久结论。
                  <Link href={`/report/?domain=${SITE_HOST}`} hrefLang="en">
                    实时报告
                  </Link>
                  （英文）显示某项检查现在是否仍然失败，并附上分析器看到的证据；这一页保留带日期的
                  记录，因为一条没有日期的失败判断只是记忆，不是测量。
                </p>

                <h2>已经有实时报告了，为什么还要有这个页面？</h2>
                <p>
                  首页把自己的分数当作证据展示，并把细节链接到实时报告——而对爬虫来说，那个链接是
                  死路。位于 <code>/report/</code> 的报告是工具，不是文档。它针对传入的任意{" "}
                  <code>?domain=</code> 现场生成结果，包含 {DIMENSION_CATALOG.length} 个维度的
                  分数和每项检查背后的证据。这恰恰是它不能成为索引中证据的原因：它的输出是用户
                  特定的，URL 空间没有边界，而且它被刻意排除在爬虫使用的两个系统之外。该路由自己
                  的布局把它标为 <code>noindex</code>，<code>public/robots.txt</code> 又禁止了{" "}
                  <code>/report/</code>——而被禁止抓取的 URL 永远不会被请求，所以连{" "}
                  <code>noindex</code> 标签都不会被读到。API 也是一样：<code>/api/</code>{" "}
                  同样被禁止。
                </p>
                <p>
                  这就是这一页存在的原因。它是同一次测量的稳定、可索引陈述：一个 URL，日期，结果，
                  排除项，失败项，方法，以及边界。它不复现报告——报告展示今天的证据，这一页发布一次
                  测量的记录——但爬虫，以及不想运行工具的读者，现在不用信任一个自己无权打开的页面，
                  就能看到首页提出的主张。
                </p>

                <h2>这个数字是怎么产生的？</h2>
                <p>一步一步，全部在仓库里，而不是在表格里：</p>
                <ol>
                  <li>
                    <strong>构建写出首页。</strong> <code>next build</code> 把本站渲染成静态
                    HTML；首页是 <code>.next/server/app/index.html</code> 那个文件。
                  </li>
                  <li>
                    <strong>记录是测量出来的，不是敲进去的。</strong>{" "}
                    <code>scripts/self-audit.mts</code>（<code>npm run self-audit</code>）读取
                    那份 HTML 以及站点的 <code>robots.txt</code>、<code>llms.txt</code> 和{" "}
                    <code>sitemap.xml</code>，运行公开端点所用的同一个 <code>analyze()</code>
                    ，然后写出 <code>lib/self-audit.json</code>。
                  </li>
                  <li>
                    <strong>一道门禁让页面和记录保持同步。</strong>{" "}
                    <code>scripts/check-built-pages.mts</code>（<code>npm run check:built</code>
                    ）会给构建出的首页打分，当分数、等级、检查计数或 id 列表与记录不一致时构建
                    失败。测量日期刻意不比较：它记录的是测量的时间，不是页面的属性。因此，一次改变
                    分数的页面编辑会让构建失败，直到记录被重新测量。
                  </li>
                  <li>
                    <strong>一个定时工作流负责刷新。</strong>{" "}
                    <code>.github/workflows/self-audit.yml</code> 每周重新构建、重新测量，并且
                    只在记录发生变化时提交它；一次失败的测量会保留上一份好记录，而不是发布一个从
                    坏页面得来的数字。部署再从包含刷新记录的提交重新触发，所以这里打印的日期是最后
                    一次测量的日期，而不是最后一次编辑的日期。
                  </li>
                </ol>
                <p>
                  首页通过 <code>lib/home-content.ts</code> 导入同一份记录，所以两个页面不可能
                  引用不同的数字；位于{" "}
                  <Link href="/markdown/" hrefLang="en">
                    /markdown/
                  </Link>
                  （英文）的机器可读版本读的也是同一批值。
                </p>

                <h2>我怎么重新跑一次测量？</h2>
                <p>
                  你不需要相信这个数字。下面两种方式都会在你提问的那一刻重新测量页面，而且都免费：
                </p>
                <ul>
                  <li>
                    <strong>在浏览器里：</strong>{" "}
                    <Link href={`/report/?domain=${SITE_HOST}`} hrefLang="en">
                      /report/?domain={SITE_HOST}
                    </Link>
                    （英文）显示 {DIMENSION_CATALOG.length} 个维度的分数和每项检查背后的证据。
                  </li>
                  <li>
                    <strong>作为 JSON：</strong>{" "}
                    公开端点返回头部数字——分数、等级、执行与通过的检查数、页面类型，以及有多少项
                    检查不适用——省略 <code>brief=1</code> 时还会附上完整的维度与问题列表。它不需要
                    密钥，也不需要任何浏览器替它干活。
                  </li>
                </ul>
                <pre>{`curl "${SITE_URL}/api/scan?brief=1&domain=${SITE_HOST}"`}</pre>
                <p>
                  重跑是一次新的测量，不是查这份记录。自 {MEASURED_ON} 以来，页面、它的{" "}
                  <code>robots.txt</code> 和规则都可能已经变了，所以一个不同的数字会是一个发现，
                  而不是矛盾——这也是日期要印在分数旁边的理由。端点按地址限流，<code>brief</code>{" "}
                  形式的存在，是为了让覆盖大量域名的研究不必从每个域名拉取完整报告；
                  <Link href="/zh/study/">针对大量首页的公开研究</Link>就是这种用法的例子。
                </p>

                <h2>满分到底意味着什么？</h2>
                <p>
                  {SELF_AUDIT.score} / {SCALE} 不是通过检查的比例。每项检查在所属维度内值固定
                  分数，一个维度的得分是它自己那部分分数的获得比例，{DIMENSION_CATALOG.length}{" "}
                  个维度再按权重合并——仅 AI 爬虫访问一个维度就占总分的 {AI_ACCESS_WEIGHT}%。
                  结果是「这一页实际可评估部分」的百分比，这就是上面分母是{" "}
                  {SELF_AUDIT.applicable} 而不是 {SELF_AUDIT.run} 的原因。
                </p>
                <p>
                  等级 {GRADE_BANDS[0].grade} 从量表的 {GRADE_BANDS[0].min}% 开始，这份记录越过
                  了它。但满分只说明一件事：适用于这一页的规则没有一项失败。它不说明目录里的每条
                  规则都通过了——有 {notApplicableCount} 条规则被排除——也不是在声称方法已经完成。
                  它只是说：这一页，在这版规则下，在这个日期，没有分析器能看到的适用缺口。这比
                  「分数达到了最大值」更窄，也更有用。
                </p>

                <h2>这个数字不能告诉你什么？</h2>
                <p>边界是测量的一部分，不是它的脚注。</p>
                <ul>
                  <li>
                    <strong>它只读一个首页。</strong>{" "}
                    一个内页可能在首页通过的检查上失败，而这个数字不会动。指南、规则页和研究都在
                    这个数字之外。
                  </li>
                  <li>
                    <strong>它不会向任何 AI 引擎询问这个站点。</strong>{" "}
                    这里没有任何东西测量 ChatGPT、Claude、Perplexity 或 Google 的 AI 界面是否
                    提到 LLMention，或是否引用这些页面。它测量的是就绪度——页面是否处于「有可能被
                    引用」的状态。提及追踪是另一种测量，数据源也不同，写在
                    <Link href="/zh/compare/readiness-vs-mention-tracking/">
                      与提及追踪的对比
                    </Link>
                    里。
                  </li>
                  <li>
                    <strong>它是一个快照。</strong>{" "}
                    标记、robots.txt 规则和内容都会变；记录因此带日期，而每周工作流的存在，是因为
                    一份没人刷新的测量会变成关于测量的记忆。
                  </li>
                  <li>
                    <strong>方法会动。</strong>{" "}
                    发现测量错误时规则会改，每一次可能移动分数的改动都连同日期记录在
                    <Link href="/zh/methodology/#what-changed">方法变更记录</Link>
                    里。一个分数只有在与同一版规则下产生的另一个分数比较时才有意义。
                  </li>
                  <li>
                    <strong>它是自我测量。</strong>{" "}
                    规则和页面由同一个团队撰写，这是数字本身无法解决的冲突。回答它的不是更强的主张，
                    而是公开的方法、记录文件、构建门禁和公开端点——读者可以逐项对照这一页检查。
                    如果这里的数字看起来不对，那是一个缺陷报告，不是辩论题：
                    <Link href="/contact/" hrefLang="en">
                      联系页面
                    </Link>
                    （英文）是提交它的地方，
                    <Link href="/about/" hrefLang="en">
                      关于页面
                    </Link>
                    （英文）说明谁对这份记录负责。
                  </li>
                </ul>
              </article>

              <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/zh/methodology/" className="text-xs text-[var(--accent)] hover:opacity-75">
                  完整方法，逐条规则 →
                </Link>
                <Link
                  href="/zh/checks/"
                  className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                >
                  全部 {SELF_AUDIT.run} 条规则页
                </Link>
                <Link
                  href="/zh/study/"
                  className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                >
                  公开研究
                </Link>
              </div>

              <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
                <Faq
                  title="关于这份自审的问题"
                  items={[
                    {
                      q: "为什么站点不直接链接自己的报告？",
                      a: "因为报告是工具输出，不是文档。它按请求、根据请求里的域名参数现场生成，所以 URL 空间没有边界，内容也因人而异；该路由是 noindex，并在 robots.txt 中被禁止，API 同样被禁止。一个从不抓取它的爬虫读不到那些证据，这就是这一页要把记录放在一个稳定 URL 上的原因。",
                    },
                    {
                      q: `${SELF_AUDIT.score} / ${SCALE} 是否意味着 ChatGPT 提到了 LLMention？`,
                      a: "不是。分数测量的是就绪度：爬虫能否到达页面，以及页面是否携带答案所需的东西。它从不向引擎询问品牌，所以无法告诉你站点今天是否被提及或被引用。",
                    },
                    {
                      q: "记录多久刷新一次？",
                      a: "一个定时工作流每周重新构建并重新测量首页，只在记录变化时提交。显示的日期是最后一次测量的日期，不是这一页最后一次编辑的日期；一次失败的测量会保留上一份记录。",
                    },
                    {
                      q: "我能不信任这一页就自己核对数字吗？",
                      a: `可以。自己运行 /report/?domain=${SITE_HOST}，或者用 brief=1 调用公开 API；两者都会重新测量当前页面。记录就是仓库里的 lib/self-audit.json，当构建出的页面与记录不一致时，check:built 会让构建失败。`,
                    },
                  ]}
                  footer={
                    <>
                      每个数字背后的规则在
                      <Link href="/zh/methodology/">方法论页</Link>
                      上；给你的站点打分的分析器，就是给这一页打分的那个。
                    </>
                  }
                />

                {/*
                  The same evidence block every measurement page carries. The quote and the
                  source titles stay in the language they were published in, because they are
                  citations a reader is meant to check against the paper and the repository.
                */}
                <Evidence
                  title="证据与来源"
                  quote={GEO_PRIMARY_QUOTE}
                  attribution="Generative Engine Optimization, KDD 2024"
                  attributionUrl="https://arxiv.org/abs/2311.09735"
                  sources={GEO_PRIMARY_SOURCES}
                  note="本站的就绪度权重遵循那项已发表的测量，而不是凭个人喜好；这一页把同一套权重应用在发布这些权重的站点上。分数看不到的东西写在上面，而不是由数字暗示；来源里点名的仓库，就是记录、分析器和比对两者的构建门禁所在的地方。"
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
