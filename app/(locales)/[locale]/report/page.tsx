import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import ReportPreview from "@/app/components/ReportPreview";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import ReportMailFormZh from "./ReportMailFormZh";
import ReportWidgetZh from "./ReportWidgetZh";

/**
 * `/zh/report/` - 中文版报告页，服务端渲染的那一半。
 *
 * WHY THIS IS A REBUILD OF THE ENGLISH PAGE RATHER THAN A TRANSLATION COMPONENT: the English
 * `/report/` page (`app/(en)/report/page.tsx`) renders its own header, its own footer and its own
 * English prose. Reusing it with a `locale` flag would mean two languages inside one server
 * component and a branch on every sentence; keeping the two route files separate is how every
 * other localized page on this site is built. What is copied is the structure: a server half that
 * explains the scan before it runs, a Suspense fallback that is real content rather than a
 * spinner, and the client widget below it. What is NOT copied is any of the machinery -
 * `ReportWidgetZh` still calls the same `/api/scan?domain=` endpoint with the same parameter and
 * reads the same JSON keys, and `ReportMailFormZh` still posts to `/api/subscribe/`. Only strings
 * differ.
 *
 * WHY THE NUMBERS IN THE PROSE ARE DERIVED: the check count, the dimension count and the three
 * weights the argument rests on are read from `lib/geo/catalog.ts`, the same module the analyser
 * runs from. A translated page that retyped "40" or "11%" would be the exact drift this site sells
 * protection against - and the Chinese `checks` and `methodology` pages already read them the same
 * way.
 *
 * WHY IT TAKES searchParams AND HANDS THEM TO A CHILD. The offer of a weekly report has to post the
 * domain that was scanned, and that domain is in the query string. Reading it here is what makes
 * the route per-request rather than prerendered, which is correct: the result depends on the URL.
 * The page still renders a complete server half - headings, the fallback table, the explanation -
 * because for a reader whose JavaScript has not started yet that HTML is the whole page.
 *
 * ON WHAT IS DELIBERATELY MISSING: this route is noindex and is a tool output rather than a
 * document, so it carries no canonical and no hreflang alternates. Advertising a translated URL for
 * a page that is `index: false, follow: false` and whose content is a per-visitor scan would be a
 * claim a search engine can never use. The English route makes the same decision in its layout.
 */
const TITLE = "GEO 审计报告";

/** Published, runnable checks - the same filter `/zh/checks/` uses. */
const RUNNABLE_CHECKS = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;

/** A dimension's published weight, read rather than retyped. */
function weightOf(id: string): number {
  return DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;
}

const CITABILITY_WEIGHT = weightOf("citability");
const ANSWER_READINESS_WEIGHT = weightOf("answer-readiness");
const LLMS_TXT_WEIGHT = weightOf("llms-txt");

const DESCRIPTION = `用 ${RUNNABLE_CHECKS} 项公开检查给一个首页打分：${DIMENSION_COUNT} 个加权维度、没通过的检查及其证据。扫描在页面加载时运行。`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  /*
   * noindex, and deliberately no canonical or hreflang here: the URL space of this page is the
   * ?domain= variants of one tool output, so there is no canonical form to name and no translation
   * to advertise. `follow: false` because the only links worth following are the method pages, and
   * a per-request report should not be a crawl path into them.
   */
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ChineseReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ domain?: string | string[] }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");

  /*
   * Normalised here rather than inside the form, so the value posted onward is the same shape the
   * scanner was given. Empty input means no domain was asked about at all, and then there is
   * nothing to offer a report for - the widget's `!rootDomain` branch says so rather than
   * inventing one.
   */
  const query = await searchParams;
  const rawDomain = typeof query.domain === "string" ? query.domain : "";
  const domain = rawDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        {/* Full-bleed title band: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                边缘扫描
              </span>
              <h1 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                这一页用 {RUNNABLE_CHECKS} 项公开检查给一个首页打分，分布在 {DIMENSION_COUNT}{" "}
                个加权维度上，并列出没有通过的检查及其证据。扫描在页面加载时运行。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-12 md:py-16">
            {/*
              The fallback is real content rather than the word "Loading", because it is
              what a visitor on a slow connection reads while the scan runs, and it is
              also what ends up in the server-rendered HTML. Both audiences want a sentence
              about what is being measured, not a spinner.
            */}
            <Suspense
              fallback={
                <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-8 space-y-4">
                  <p className="text-sm text-[var(--accent)] font-mono animate-pulse">
                    正在读取首页与 robots.txt……
                  </p>
                  <p className="text-sm text-[var(--ink-2)] max-w-3xl leading-relaxed">
                    扫描会像爬虫那样抓取页面，然后读取 robots.txt、llms.txt 和 sitemap（如果它们存在）。
                    这需要几秒钟，因为它发出五次真实请求，而不是读一份缓存。
                  </p>
                  <p className="text-sm text-[var(--ink-2)] max-w-3xl leading-relaxed">
                    不会存储关于这个站点的任何内容。结果只存在于你当前的 URL 里，重新加载这一页就会再扫描一次。
                  </p>
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--line)]">
                          <th className="py-2 pr-4 font-semibold text-[var(--ink-1)]">抓取的对象</th>
                          <th className="py-2 font-semibold text-[var(--ink-1)]">为什么它影响分数</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--ink-2)]">
                        <tr className="border-b border-[var(--line)]">
                          <td className="py-2 pr-4 font-mono">首页</td>
                          <td className="py-2">
                            在 {DIMENSION_COUNT} 个维度中权重最高，因为爬虫读不到的页面，
                            根本没有被引用的路径
                          </td>
                        </tr>
                        <tr className="border-b border-[var(--line)]">
                          <td className="py-2 pr-4 font-mono">/robots.txt</td>
                          <td className="py-2">
                            站点自己声明谁可以抓取，这是扫描器能拿到的唯一权威答案
                          </td>
                        </tr>
                        <tr className="border-b border-[var(--line)]">
                          <td className="py-2 pr-4 font-mono">/llms.txt</td>
                          <td className="py-2">
                            只值 {LLMS_TXT_WEIGHT}%，不会再高，因为它背后的证据很弱
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono">/sitemap.xml</td>
                          <td className="py-2">可发现性，以及站点是否愿意发布一个</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            >
              <ReportWidgetZh />
            </Suspense>

            {/*
              THE OFFER COMES AFTER THE RESULT, AND THE ORDER IS THE POINT.

              Everything above this line - the score, the dimension bars, every failing check,
              the research the weights come from - is delivered without asking for anything, and
              the scan is complete before this form is ever seen. Gating the score, or asking
              before it is shown, would trade this site's strongest asset - that anybody can check
              the numbers without becoming a user - for a worse version of somebody else's funnel.

              WHAT IT OFFERS IS THE WEEKLY REPORT, NOT THIS SCAN. The scan is live and nothing about
              it is stored, so there is no "this report" to mail; a button implying otherwise would
              be the small dishonesty this site spends its copy arguing against. The form says what
              arrives.
            */}
            {domain ? (
              <section className="mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 sm:p-7">
                <h2 className="text-xl font-bold mb-2 text-[var(--ink-1)]">每周检查一次</h2>
                <p className="mb-5 text-sm leading-relaxed text-[var(--ink-2)]">
                  上面的审计已经完成，没有任何内容被保留。如果你希望同样的检查按计划运行，留下邮箱，
                  每周报告会带着变化送到：分数、等级，以及新出现的失败项。每周一封，一次点击即可停止。
                </p>
                <ReportMailFormZh domain={domain} />
              </section>
            ) : null}

            {/*
              The paid deliverable, shown rather than described, and placed after the free result
              and the weekly-report form so nothing the scan found is hidden behind it.

              IT STAYS THE ENGLISH COMPONENT, AND SAYS SO. `ReportPreview` is the sample paid
              report - its headings, question bank and sample answers are the deliverable's own
              English copy, and a Chinese shell around an English sample is honest as long as the
              label says which language it is. Translating it would mean editing a shared component
              outside this route, and the two versions would then have to be kept in step.
            */}
            <div className="mt-16 max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
                付费报告示例
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">
                下面这份示例由英文组件渲染，示例文字保持英文，以便与英文版逐字对照；上面的免费扫描结果不受影响。
                示例里的「See pricing」指向英文定价页，中文的价格与交付说明在
                <Link href="/zh/pricing/">中文定价页</Link>。
              </p>
            </div>
            <ReportPreview />

            <article className="doc-article mt-16 max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <h2>分数在衡量什么</h2>
              <p>
                你的页面是否处于「可能被引用」的状态。这比字面听起来要窄，而收窄是有意的。
              </p>
              <p>
                权重不是凭偏好定的，而是来自一项公开测量。下面这段引文保留英文原文，因为转述一项
                研究结论，比让读者自己读它更容易走样：
              </p>
              <blockquote>
                GEO can boost visibility by up to 40% overall in generative engine responses, and in
                the paper&rsquo;s Table 1 the best of the tested methods improve on the
                no-optimization baseline by 41% and 28%. &mdash;{" "}
                <a href="https://arxiv.org/abs/2311.09735" rel="noopener">
                  Generative Engine Optimization, KDD 2024
                </a>
              </blockquote>
              <p>
                这些数字是「可引用性与证据」占 {CITABILITY_WEIGHT}%、「答案就绪度」再占{" "}
                {ANSWER_READINESS_WEIGHT}%，而「AI 上下文文件」占 {LLMS_TXT_WEIGHT}% 的原因。
                每一个权重、每一项检查和每一个通过条件都公布在
                <Link href="/zh/methodology/">方法论页</Link>上，规则清单在
                <Link href="/zh/checks/">规则参考</Link>里；每条规则的完整条件与证据链接到它自己的
                （英文）规则页。分析器本身开源在{" "}
                <a href="https://github.com/Alex13192/geo-scanner" rel="noopener">
                  github.com/Alex13192/geo-scanner
                </a>
                。
              </p>

              <h2>这份报告不能告诉你什么</h2>
              <p>
                它不会向任何 AI 引擎询问你。这里没有任何东西在测量 ChatGPT 目前是否推荐你的品牌，
                高分也不是被引用的承诺。
              </p>
              <ul>
                <li>
                  <strong>只分析首页。</strong>内页完全不在单 URL 扫描的范围内。上面的免费扫描就是
                  全部产品：不需要账号、不需要邮箱、不需要付费，并且保持免费。
                </li>
                <li>
                  <strong>请求被拒绝不等于被封禁。</strong>大型站点按 IP 验证爬虫，所以扫描器可能
                  被拒绝，而真实的爬虫流量一切正常。结论以 robots.txt 为准，那是站点自己声明的意图。
                </li>
                <li>
                  <strong>性能检查是粗粒度的。</strong>真正的 Core Web Vitals 需要浏览器，而这个
                  扫描器刻意不运行浏览器。
                </li>
              </ul>
              <p>
                拿到分数之后，<Link href="/zh/readiness-badge/">徽章生成器</Link>
                可以把它变成一个可嵌入的东西，而{" "}
                <Link href="/zh/llms-txt-studio/">llms.txt 工坊</Link>
                会起草「AI 上下文文件」维度所寻找的那个上下文文件。
              </p>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
