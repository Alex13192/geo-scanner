import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  MAX_FETCH_PAGES,
  MAX_LINKS_PER_SECTION,
  SECTION_ORDER,
  SUBPAGE_BUDGET,
} from "@/lib/llms-txt";
import { social } from "@/lib/og";
import StudioWidgetZh from "./StudioWidgetZh";

/**
 * `/zh/llms-txt-studio/` —— 中文版 llms.txt 工坊，服务端渲染的那一半。
 *
 * WHY THIS REBUILDS THE ENGLISH PAGE'S SHELL INSTEAD OF REUSING IT: `app/(en)/llms-txt-studio/page.tsx`
 * 自带英文 header、英文 footer、英文导航和英文正文；用一个 `locale` 参数复用它，会让两种语言
 * 出现在同一个服务端组件里，并且每一句话都要分支。中文站其他深页都是各自一份路由文件，这一页
 * 沿用同样的做法：结构照搬（服务端先解释，Suspense 里放客户端组件，下面一份可以慢慢读的正文），
 * 但 chrome 换成 `LocaleHeader`／`LocaleFooter`，即本地化页面统一使用的页头页脚。行为没有第二份：
 * `StudioWidgetZh` 仍然请求同一个 `/api/llms-txt?domain=...&lang=en`，读同一组 JSON 键，
 * 生成、复制和下载的逻辑逐行不变——差别的只有显示字符串。
 *
 * WHY THE COPY LIVES IN THIS SERVER COMPONENT: 英文版把静态文案放在服务端，是因为客户端组件里的
 * `useSearchParams()` 会把整个子树排除出预渲染，构建产物只剩 "Loading Studio..." 两个词。
 * 这一页照做：中文正文和标题在预渲染的 HTML 里，只有真正需要浏览器的输入框、请求和预览在
 * `StudioWidgetZh.tsx` 里。若以后要加文案，加在这里。
 *
 * WHY THE NUMBERS ARE IMPORTED: 抓取页数、每节链接上限、小节顺序和时间预算都来自
 * `lib/llms-txt.ts`，检查数、维度数和三个权重来自 `lib/geo/catalog.ts`。把 "12" 或 "5%"
 * 重新抄进译文，正是这个站点声称要防的那种漂移——生成器改了上限，页面却还在描述旧工具。
 *
 * WHAT STAYS ENGLISH: 生成的文件本身。`/api/llms-txt` 的 `lang` 只声明了 en 和 de，没有中文
 * 骨架，所以 `lang=en` 生成的文件是英文的，页面里的文件示例也必须保持英文，否则示例不再等于
 * 读者会拿到的输出。URL、代码、检查 id、研究引文同样原样保留：翻译它们会改变被解释的对象。
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

/** 页面标题（`<title>`）对应英文 layout 的 "llms.txt Generator — Free AI Context File Builder"。 */
const TITLE = "llms.txt 生成器——免费的 AI 上下文文件构建器";
const DESCRIPTION =
  "生成一份标准的 /llms.txt 上下文文件，让 ChatGPT、Claude 和 Perplexity 更干净地消化你的内容。免费，无需注册。";

/** H1 对应英文页面的 "Free /llms.txt Generator"，与 `<title>` 本来就是两句话。 */
const H1 = "免费的 /llms.txt 生成器";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/llms-txt-studio/",
    languages: {
      en: "/llms-txt-studio/",
      "zh-Hans": "/zh/llms-txt-studio/",
      "x-default": "/llms-txt-studio/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/llms-txt-studio/" }),
};

/** 已发布、可运行的检查数：与 `/zh/checks/` 和 `/zh/report/` 用的是同一个过滤条件。 */
const RUNNABLE_CHECKS = CHECK_CATALOG.filter((check) => !check.alias).length;
const DIMENSION_COUNT = DIMENSION_CATALOG.length;

/** 维度的公布权重，读自目录而不是抄进译文。 */
function dimensionWeight(id: string): number {
  return DIMENSION_CATALOG.find((dimension) => dimension.id === id)?.weight ?? 0;
}

/** 一项检查的分值，读自同一份目录。 */
function checkPoints(id: string): number {
  return CHECK_CATALOG.find((check) => check.id === id)?.points ?? 0;
}

const CITABILITY_WEIGHT = dimensionWeight("citability");
const ANSWER_READINESS_WEIGHT = dimensionWeight("answer-readiness");
const LLMS_TXT_WEIGHT = dimensionWeight("llms-txt");
const LLMS_TXT_FILE_POINTS = checkPoints("llms-txt");
const LLMS_TXT_ROBOTS_POINTS = checkPoints("ai-context-robots");

const BUDGET_SECONDS = Math.round(SUBPAGE_BUDGET.phaseMs / 1000);
const CONCURRENCY = SUBPAGE_BUDGET.concurrency;

/*
 * 文件里的小节名是英文的（生成端点没有中文骨架），所以这里原样引用这些名字，只用中文顿号
 * 连接。把 Documentation 译成「文档」会让页面上说的标题在输出文件里找不到。
 */
const SECTION_NAMES_LIST = SECTION_ORDER.join("、");

export default async function ChineseStudioPage({
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
        {/* 全宽标题色带：颜色的台阶就是页边距的标记，与其余本地化页面同一种几何。 */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <Link
                href="/zh/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                ← 返回扫描器
              </Link>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                Markdown 工坊
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {H1}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                输入一个域名，这个工具会读取它的首页，再读取首页链接的至多 {MAX_FETCH_PAGES}{" "}
                个页面，然后用这些页面自己写下的内容起草一份 llms.txt 文件。每一条描述都摘自它所描述的那个页面。无需账号，没有次数限制。
              </p>
              <p className="text-xs leading-relaxed text-[var(--ink-3)]">
                生成文件里的固定说明文字保持英文：生成端点目前只为英文和德文输出这套骨架。
                这一页翻译的是工具界面和它周围的说明，而不是生成的文件本身。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="mx-auto max-w-3xl">
              {/*
                Suspense 的 fallback 是一句真实内容，而不是一个转圈：它既是慢连接访客在生成器
                加载时读到的东西，也是预渲染 HTML 里留下的东西。
              */}
              <Suspense
                fallback={
                  <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6 text-[var(--ink-3)] text-sm">
                    正在加载生成器……
                  </div>
                }
              >
                <StudioWidgetZh />
              </Suspense>
            </div>

            <article className="doc-article mx-auto mt-16 max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <h2>什么是 llms.txt？</h2>
              <p>
                llms.txt 是放在网站根目录下的一个 Markdown 文件，它给语言模型一份简短、结构化的摘要，
                说明这个网站是什么、哪些页面重要。它是一项约定，不是标准；读它靠的是约定，而不是契约。
              </p>
              <p>
                格式是一个写着你站点名称的 H1、一段引用块摘要，然后是若干由 Markdown 链接组成的小节。
                它的设计目标是让机器一次读完，所以它是纯 Markdown，而不是 HTML。
              </p>

              <h2>生成的文件里有什么？</h2>
              <p>
                下面列出的每一项，都是你按下「生成」那一刻从你自己的页面上读到的。没有一句话是替你写的。
              </p>
              <ul>
                <li>站点标题，用作 H1，写法与你自己 title 标签里的完全一致。</li>
                <li>首页的 meta description，用作引用块摘要。</li>
                <li>
                  生成日期，单独一行，紧跟在摘要下面，这样任何读到这个文件的人，在读到别的内容之前就能看出它有多旧。
                </li>
                <li>
                  在首页的 HTML 标记里找到的内部链接，按每个路径的第一段分组成小节（文件里的小节名保持英文：{SECTION_NAMES_LIST}），每节最多 {MAX_LINKS_PER_SECTION} 条链接。
                  某一节里的页面超过这个数时，文件会写明有多少页没有列出，所以它不会在并不完整的时候读起来像是完整的。
                </li>
                <li>
                  对于其中至多 {MAX_FETCH_PAGES} 条链接，描述取自
                  <strong>那个页面自己的标记</strong>：它的 meta description；如果没有，就用它的
                  H1。不生成任何文字，子页面也绝不会继承首页的描述。页面没有被读取、或者页面既没有
                  meta description 也没有 H1 的链接，会不带描述地列出，文件会写明这样的链接有多少条。
                </li>
                <li>
                  一段说明，交代文件是怎么生成的、描述从哪里来，让读者能判断它是什么。
                </li>
              </ul>
              <p>
                它不会爬你的整个网站。它读取你的首页，然后读取首页链接的至多 {MAX_FETCH_PAGES}{" "}
                个页面，一次 {CONCURRENCY} 个，整个第二阶段有 {BUDGET_SECONDS} 秒预算——所以一个请求不会拖上几分钟，
                慢的或者打不开的页面会被略过，而不是被猜出来。需要登录才能看的页面，
                或者你的首页没有链接到的页面，不会出现在文件里，文件也不会假装它在里面。
              </p>

              <h2>怎么部署？</h2>
              <p>把输出保存为 llms.txt 并上传，然后确认它能被访问到。</p>
              <ol>
                <li>复制或下载生成的文件。</li>
                <li>
                  把它上传到网站根目录，让 <code>https://your-domain.com/llms.txt</code> 能返回它。
                </li>
                <li>
                  检查响应是有正文的 HTTP 200，而不是跳转到登录页，或者一个 HTML 错误页。
                </li>
                <li>
                  如果 robots.txt 里还没有，加一行 <code>Sitemap:</code>。
                </li>
              </ol>
              <p>
                部署细节，包括被拒绝时是什么样子，都在
                <Link
                  href="/zh/docs/llms-txt-deployment/"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  llms.txt 部署指南
                </Link>
                里。
              </p>

              <h2>llms.txt 是排名因素吗？</h2>
              <p>
                不是。我们能打开的爬虫文档里，没有任何一份承诺会读取它——OpenAI 的帮助中心和
                Anthropic 的爬虫文章都指定用 robots.txt。它在本站总分里大约占{" "}
                {LLMS_TXT_WEIGHT}%。
              </p>
              <p>
                它仍然值得生成，是因为成本几乎为零，而已发表研究里测到的提升来自页面说了什么、
                引用了什么，而不是来自多放一个文件：
              </p>
              {/*
                这段是论文原句的直接引语，保留英文：把一句带百分比的引文转述成中文，会让它看起来
                仍像引文，却不再是来源说的话。引文之外的标题、说明和中文方法论链接都已翻译。
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
                这就是为什么本站的权重把「可引用性与证据」放在 {CITABILITY_WEIGHT}%、
                「答案就绪度」再放 {ANSWER_READINESS_WEIGHT}%，而 AI 上下文文件维度只占{" "}
                {LLMS_TXT_WEIGHT}%。完整权重，以及它能告诉你的东西的边界，都在
                <Link
                  href="/zh/methodology/"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  方法论页
                </Link>
                上。
              </p>

              <h2>文件长什么样</h2>
              <p>
                这个工具生成的每个文件都是同一种形状，所以你在运行之前就能知道会得到什么。
                下面这个示例是生成器对本站的一次真实输出，带着生成当天的日期；链接有删节。
                示例保留英文原文，因为生成器输出的就是这段英文；翻译它会让示例不再等于你实际拿到的文件。
              </p>
              <pre>{`# Your Site Name

> One sentence from your homepage meta description, describing what the site is.

Generated on YYYY-MM-DD. Every link below was read on that date, and a link is only as current as the page it points at: regenerate this file rather than publishing a copy that has aged.

Your Site Name is published at https://your-domain.com. This file lists the pages an AI system should read first.

## Documentation (2 of 4)

- [Guides](https://your-domain.com/docs/): Setup instructions for robots.txt, llms.txt, schema and headings.
- [Methodology](https://your-domain.com/methodology/): The complete scoring method, with every rule.

- 2 of this section's 4 pages are not listed here.

## Company (2)

- [About](https://your-domain.com/about/): What this site is, who maintains it, and what it does not do.
- [Contact](https://your-domain.com/contact/): One address for corrections and data requests.

- 2 listed pages carried neither a meta description nor an H1, so they are linked without a description.

## Notes

- Generated by LLMention from the pages it read on https://your-domain.com. Each description is that page's own meta description, or its own H1 where there is none; no description is written by this tool.
- Review and edit before publishing: the pages are the ones the homepage links to, the descriptions are the pages' own metadata as it stood on the generation date above, and external links are not followed.
- Convention reference: https://llmstxt.org/`}</pre>
              <p>
                <strong>若干小节，来自一条写明的规则。</strong>{" "}
                一个页面会进入以它自己路径的第一段命名的小节，小节顺序是固定的，而不是按大小排序：
                {SECTION_NAMES_LIST}，然后是你首页链接到它的顺序里的其他内容。
                任何工具不认识的第一段仍然会得到自己的小节，并显示自己的名字，所以它没能归类的东西在文件里是看得见的，而不是被吸收进一个没人能质疑的标题里。
              </p>
              <p>
                每个小节最多 {MAX_LINKS_PER_SECTION} 条链接，每一节都单独写明被略过了多少条，
                所以一个有五十条链接的首页产出的文件会很短，并且诚实地承认自己短。每次运行只读取{" "}
                {MAX_FETCH_PAGES} 个页面，按轮次每节各取一个，而不是从页面顶部往下拿；
                工具没有读取的链接不会带描述，也不会得到一条编造出来的描述。
              </p>
              <p>
                草稿仍然只是一个起点。哪些页面值得放进去，以及你自己的标记里恰好带着的那条描述是不是你会选的那条，
                都是你的判断，而不是工具的——而正是这部分决定了这个文件到底值不值得提供。
              </p>

              <h2>扫描器怎么给 llms.txt 打分？</h2>
              <p>
                {DIMENSION_COUNT} 个维度里有一个看上下文文件，它占 100 分里的{" "}
                {LLMS_TXT_WEIGHT} 分。这 {LLMS_TXT_WEIGHT} 分里有 {LLMS_TXT_FILE_POINTS}{" "}
                分来自文件本身，{LLMS_TXT_ROBOTS_POINTS} 分来自 robots.txt 是否能被读取。
              </p>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>检查</th>
                      <th>分值</th>
                      <th>必须成立的条件</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <Link href="/zh/checks/llms-txt/" className="font-mono">
                          llms-txt
                        </Link>
                      </td>
                      <td>{LLMS_TXT_FILE_POINTS}</td>
                      <td>
                        文件大于 20 字节，并且包含一个 H1、一行引用块摘要和至少 3 条 Markdown
                        链接。缺任何一项都只算部分通过。
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="/zh/checks/ai-context-robots/" className="font-mono">
                          ai-context-robots
                        </Link>
                      </td>
                      <td>{LLMS_TXT_ROBOTS_POINTS}</td>
                      <td>
                        robots.txt 可读，也就是发布了某种爬虫策略。空正文不算策略。
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                注意，这项检查读的是文件内容，而不是状态码。返回 200 但正文为空，一分也拿不到；
                这个区分是有意的：衡量一个文件有没有被提供，和衡量它有没有说出任何东西，不是同一件事。
              </p>

              <h2>关于输出的问题</h2>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: [
                      {
                        "@type": "Question",
                        name: "llms.txt 会取代 robots.txt 吗？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "不。robots.txt 说明谁可以抓取、可以取哪些内容，而且它是有强制力的。llms.txt 只是关于哪些页面值得读的建议，没有任何东西强制执行它。在 robots.txt 里被禁止的爬虫，不会去读那个本来要告诉它该读什么的文件。",
                        },
                      },
                      {
                        "@type": "Question",
                        name: "文件到底应该放在哪里？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "放在站点根目录，让 https://your-domain.com/llms.txt 直接以 HTTP 200 和正文返回它。跳转到登录页、返回 200 但没有内容、或者返回一个 HTML 错误页，都算没有提供。",
                        },
                      },
                      {
                        "@type": "Question",
                        name: "这会让 ChatGPT 推荐我的网站吗？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "不会，任何这样承诺的工具都是在夸大。提供这个文件改变的是模型能读到什么，而不是模型决定说什么；这个工具也没有办法测量后者。",
                        },
                      },
                      {
                        "@type": "Question",
                        name: "如果我的首页完全由 JavaScript 渲染呢？",
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "生成器读取的是服务器响应，不执行 JavaScript，所以完全由客户端渲染的首页没有多少东西可给它，草稿会很薄。这件事本身值得知道，因为 AI 爬虫收到的也是同一份响应。之后为了取描述而读取的页面也是同样的读法，所以一个客户端渲染的子页面只能贡献它的 title 标签，别的没有。",
                        },
                      },
                    ],
                  }),
                }}
              />
              <h3>llms.txt 会取代 robots.txt 吗？</h3>
              <p>
                不。robots.txt 说明谁可以抓取、可以取哪些内容，而且它是有强制力的。llms.txt
                只是关于哪些页面值得读的建议，没有任何东西强制执行它。
              </p>

              <h3>文件到底应该放在哪里？</h3>
              <p>
                放在站点根目录，让 <code>https://your-domain.com/llms.txt</code> 直接以 HTTP 200
                和正文返回它。
              </p>

              <h3>这会让 ChatGPT 推荐我的网站吗？</h3>
              <p>
                不会，任何这样承诺的工具都是在夸大。提供这个文件改变的是模型能读到什么，而不是模型决定说什么。
              </p>

              <h3>如果我的首页完全由 JavaScript 渲染呢？</h3>
              <p>
                生成器读取的是服务器响应，不执行 JavaScript，所以完全由客户端渲染的首页没有多少东西可给它。
                这件事本身值得知道，因为 AI 爬虫收到的也是同一份响应。
              </p>

              <h2>生成的文件做不到什么</h2>
              <p>把限制说清楚正是这个工具的意义，所以它对自己产出的东西也照做。</p>
              <ul>
                <li>
                  它无法知道你的网站是做什么的。它读你的首页，所以如果那一页对产品的描述和你的说法不一样，
                  草稿会继承那一页的说法。
                </li>
                <li>
                  它看不到首页没有链接到的页面，而这样的页面通常是大多数。这就是为什么文件里会写明每个小节的数量：
                  那些数字是它看到的东西，不是你的网站拥有的东西。
                </li>
                <li>
                  它无法承诺它读到的描述明天仍然成立。生成日期印在顶部，正是为了这个原因——
                  一个按某一天的样子描述页面的文件是诚实的，同样一个文件如果没写日期，就是在对现在下断言。
                </li>
                <li>
                  它无法保证被引用。提供一个文件改变的是模型能读到什么，不是它选择说什么。
                </li>
              </ul>
              <p>
                这一页所属的扫描器是开源的，所以对上面任何一点有不同意见，都可以具体地提：
                <a
                  href="https://github.com/Alex13192/geo-scanner"
                  className="text-[var(--accent)] underline hover:opacity-75"
                  rel="noopener"
                >
                  github.com/Alex13192/geo-scanner
                </a>
                。它运行 {RUNNABLE_CHECKS} 项检查，覆盖 {DIMENSION_COUNT} 个维度，并在
                <Link
                  href="/zh/checks/"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  规则参考
                </Link>
                里公布它执行的每一条规则，包括那些它有意给低权重的规则。
              </p>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
