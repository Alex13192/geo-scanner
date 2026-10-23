import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

import BadgeWidgetZh from "./BadgeWidgetZh";

/**
 * `/zh/readiness-badge/` - 中文版徽章生成器，服务端渲染的那一半。
 *
 * WHY THIS IS A REBUILD OF THE ENGLISH PAGE RATHER THAN A TRANSLATION COMPONENT: the English
 * `/readiness-badge/` page (`app/(en)/readiness-badge/page.tsx`) renders its own header, its own
 * footer and its own English prose. Wrapping it with a `locale` flag would put two languages in
 * one server component and a branch on every sentence; every other localized page on this site
 * keeps the two route files separate. What is copied is the structure - a server half that
 * explains the badge before the widget runs, a Suspense fallback that is real content, and the
 * client widget below it. What is NOT copied is any of the machinery: `BadgeWidgetZh` calls the
 * same `/api/scan?domain=` endpoint with the same parameter, reads the same JSON keys and emits
 * the same badge URL, Markdown and HTML. Only strings differ.
 *
 * WHY THE COPY IS HERE AND NOT IN THE WIDGET: `BadgeWidgetZh` calls useSearchParams(), which opts
 * its subtree out of prerendering - `next build` writes the nearest Suspense fallback instead.
 * While the English page was a single "use client" module that route shipped twelve words of HTML
 * and not one <a href>. Keeping the prose in a server component is what makes this page readable
 * with JavaScript still loading, which matters most for a page whose product is exactly that.
 *
 * WHY THE NUMBERS IN THE PROSE ARE DERIVED: the check count, the dimension count and the three
 * weights the argument rests on are read from `lib/geo/catalog.ts`, the module the analyser runs
 * from. A translated page that retyped "40" or "16%" would be the drift this site sells protection
 * against - and the Chinese `checks` and `methodology` pages already read them the same way.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

/** Published, runnable checks - the same filter `/zh/checks/` and `/zh/report/` use. */
const RUNNABLE_CHECKS = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;

/** A dimension's published weight, read rather than retyped. */
function weightOf(id: string): number {
  return DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;
}

const CRAWLER_ACCESS_WEIGHT = weightOf("ai-crawler-access");
const DELIVERY_WEIGHT = weightOf("delivery");
const MULTILINGUAL_WEIGHT = weightOf("multilingual");

const TITLE = "GEO 就绪度徽章生成器";
const DESCRIPTION =
  "把一个真实扫描得到的分数嵌入徽章，提供 Markdown 与 HTML 两种代码，可用于 GitHub README 或网站页脚；数字读自扫描结果，不能手动填写。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/readiness-badge/",
    /* The pair is claimed on both pages; the English layout names the same two URLs. */
    languages: {
      en: "/readiness-badge/",
      "zh-Hans": "/zh/readiness-badge/",
      "x-default": "/readiness-badge/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/readiness-badge/" }),
};

export default async function ChineseReadinessBadgePage({
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
        {/* Full-bleed title band: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <Link
                href="/zh/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 返回扫描器
              </Link>
              <span className="inline-block rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                可嵌入组件
              </span>
              <h1 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                它嵌入的徽章带着一次真实扫描得出的分数。数字读自扫描结果，不能编辑，所以看到它的人知道它意味着什么。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-12 md:py-16">
            {/*
              The fallback is real content rather than a spinner, for the same reason the report
              page's fallback is: it is what a visitor on a slow connection reads, and it is also
              what ends up in the server-rendered HTML when the widget's subtree is deferred.
            */}
            <Suspense
              fallback={
                <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6 text-[var(--ink-3)] text-sm">
                  正在加载徽章生成器……
                </div>
              }
            >
              <BadgeWidgetZh />
            </Suspense>

            <article className="doc-article mt-16 max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <h2>徽章是什么</h2>
              <p>
                它是一张 shields.io 图片，由对你首页的一次扫描生成，图上写着满分 100 的得分，并链接回得出这个分数的报告。提供两种格式：用于 GitHub README 的 Markdown，以及用于网站页脚的 HTML。
              </p>
              <p>
                颜色不是装饰。它由分数决定：80 分及以上是绿色，60 到 79 分是琥珀色，60 分以下是红色。读者不用点击任何东西，大致就能看出你处在什么位置。
              </p>

              <h2>为什么数字不能手动输入</h2>
              <p>
                这一点值得写清楚，因为大多数徽章生成器允许你自己设定分数。
              </p>
              <blockquote>
                一个由持有者自己挑选数字的徽章，不能证明任何事。—— 这一页依据的设计笔记
              </blockquote>
              <p>
                所以这个字段是只读的。如果扫描失败，或者你的首页返回的是拦截页、错误文档而不是页面本身，就完全不会生成嵌入代码。什么都不说，好过递给别人一个数字，而当他被问到数字从哪来时无法回答。
              </p>
              <p>
                适用于分数的规则同样适用于徽章：它是关于你的页面是否处于「可能被引用」这一状态的断言，而不是任何引擎当前正在引用你的断言。
              </p>

              <h2>我该怎么嵌入？</h2>
              <p>四步，其中第三步是大多数人会跳过的那一步。</p>
              <ol>
                <li>输入域名并检查分数。扫描成功之前不会生成任何内容。</li>
                <li>选择一种预览样式。三种样式嵌入的都是同一张扁平 shields.io 图片。</li>
                <li>
                  复制代码并粘贴，然后<strong>点一次徽章</strong>
                  ，确认它能打开。一个 404 的徽章比没有徽章更糟。
                </li>
                <li>
                  站点内容变化后重新扫描并替换代码，因为数字在你复制的那一刻就被固化进图片 URL，它不会自己变动。
                </li>
              </ol>

              <h2>徽章到底能证明什么？</h2>
              <p>
                它能证明的是：在扫描那一天，你的首页满足了一组具体且已公布的检查。仅此而已。扫描器运行{" "}
                {RUNNABLE_CHECKS} 项检查，分布在 {DIMENSION_COUNT}{" "}
                个加权维度上，每条规则及其分值都在
                <Link href="/zh/methodology/">方法论页</Link>上。
              </p>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>徽章显示的</th>
                      <th>徽章不显示的</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>爬虫能否访问这个页面——依据 robots.txt 与响应本身</td>
                      <td>任何 AI 引擎当前是否提到、推荐或引用你</td>
                    </tr>
                    <tr>
                      <td>标记是否给了模型可提取的东西：实体数据、结构、证据</td>
                      <td>引用是否可能发生。就绪度是前提，不是预测</td>
                    </tr>
                    <tr>
                      <td>只有首页，且限于报告上标注的那一天</td>
                      <td>关于内页的任何结论——单 URL 扫描从不读取内页</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                权重最高的是 AI 爬虫访问，占 {CRAWLER_ACCESS_WEIGHT}%，因为一个读不到的页面根本没有被引用的路径。权重最低的是交付与移动端（
                {DELIVERY_WEIGHT}%）和国际就绪度（{MULTILINGUAL_WEIGHT}%）。每一个权重的理由都是公布的，而不是被断言的。
              </p>

              <h2>关于嵌入徽章的常见问题</h2>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: [
                      {
                        "@type": "Question",
                        name: "徽章会自动更新吗？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "不会。分数在你复制代码时就被固化进图片 URL 里，所以在替换代码之前，它会一直停在那一个数字上。这一页曾经被宣传为实时徽章，那是不对的。",
                        },
                      },
                      {
                        "@type": "Question",
                        name: "我可以自己设定分数吗？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "不可以，而且这是有意的。一个由持有者自己挑选数字的徽章不能证明任何事，所以分数字段是只读的，只由一次成功的扫描填入。",
                        },
                      },
                      {
                        "@type": "Question",
                        name: "如果我的站点拦截了扫描，会发生什么？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "不会生成任何嵌入代码。如果首页返回的是错误页或拦截页而不是页面本身，就没有诚实的分数可以展示，页面会如实说明，而不是显示一个数字。",
                        },
                      },
                      {
                        "@type": "Question",
                        name: "如果我的分数下降了，我应该撤掉徽章吗？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "这由你决定，但一个与它所链接的报告不一致的徽章，比没有徽章更糟。重新扫描，然后要么修好页面，要么把徽章撤下。",
                        },
                      },
                    ],
                  }),
                }}
              />
              <h3>徽章会自动更新吗？</h3>
              <p>
                不会。分数在你复制代码时就被固化进图片 URL 里，所以在替换代码之前，它会一直停在那一个数字上。
              </p>

              <h3>我可以自己设定分数吗？</h3>
              <p>不可以，这是有意的。分数字段是只读的，只由一次成功的扫描填入。</p>

              <h3>如果我的站点拦截了扫描，会发生什么？</h3>
              <p>
                不会生成任何嵌入代码。没有诚实的分数可以展示，所以页面会如实说明，而不是显示一个数字。
              </p>

              <h3>如果我的分数下降了，我应该撤掉徽章吗？</h3>
              <p>这由你决定，但一个与它所链接的报告不一致的徽章，比没有徽章更糟。</p>

              <h2>徽章不能替你做什么</h2>
              <p>
                徽章只是一个小小的产物，说清楚它不是什么才是公允的，因为真正能提升可见度的证据在别处。
              </p>
              {/*
                The quotation stays in English on purpose. It is a citation of a published paper,
                and paraphrasing a research result into Chinese would make it easier to drift from
                what the paper actually says - the same choice `/zh/report/` and `/zh/answer-check/`
                make for the same quote.
              */}
              <blockquote>
                GEO can boost visibility by up to 40% overall in generative engine responses, and in
                the paper&rsquo;s Table 1 the best of the tested methods improve on the
                no-optimization baseline by 41% and 28%. &mdash;{" "}
                <a href="https://arxiv.org/abs/2311.09735" rel="noopener">
                  Generative Engine Optimization, KDD 2024
                </a>
              </blockquote>
              <p>
                91 分和 README 里的一个徽章，只是关于你的标记的一句陈述。它不是一次引用，也没有任何徽章生成器能替你产出一次引用。徽章真正有用之处，和一个公开分数在任何地方有用之处一样：它让页面的状态变得可见，而可见的问题才会被修好。
              </p>
              <p>
                扫描器是开源的，所以对上面任何一条的异议都可以很具体。代码，包括这个徽章所依据的规则集，都在{" "}
                <a href="https://github.com/Alex13192/geo-scanner" rel="noopener">
                  github.com/Alex13192/geo-scanner
                </a>
                。
              </p>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
