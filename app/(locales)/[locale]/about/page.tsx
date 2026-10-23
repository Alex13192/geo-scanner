import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";
import { BRAND_FULL, CONTACT_EMAIL } from "@/lib/site";

/**
 * `/zh/about/` - the About page, in Chinese.
 *
 * WHY THE SHELL IS REBUILT INLINE INSTEAD OF USING ProsePage: ProsePage renders SiteNav and
 * PageFooter, whose navigation, footer and back-to-scanner strings are English. A localized
 * page has to use LocaleHeader/LocaleFooter or the language switcher would drop the reader
 * onto an English frame. The band/wrap/doc-article geometry, the section order, the scope
 * table, the FAQ and the evidence block are copied from the English shell so the two pages
 * still read as one page in two languages.
 *
 * WHY THE LINKS ARE MIXED: /methodology/, /pricing/, /insights/ and /author/ have Chinese
 * versions and are linked in Chinese. The scanner CTA points at an English surface - the
 * scanner is still English-only - so it keeps hrefLang="en" and the （英文） marker that
 * tells a reader they are leaving the translation. The GitHub and arXiv links are external
 * identifiers and stay untouched.
 *
 * WHAT STAYS ENGLISH: the quoted KDD finding, the paper titles, the source labels, the
 * product and organisation names, `llms.txt`, and `llm.dataforseo.com`. Those are the
 * subject matter or citations; translating them would change what the page is about.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "关于 LLMention";
const DESCRIPTION =
  "LLMention 是什么、为什么它完整公布自己的评分方法、由谁维护，以及扫描器刻意不做哪些事。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/about/",
    languages: {
      en: "/about/",
      "zh-Hans": "/zh/about/",
      "x-default": "/about/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/about/" }),
};

export default async function ChineseAboutPage({
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

      {/* The way back to the Chinese hub, kept where ProsePage puts the English page's
          "back to scanner" action. */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/zh/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 返回首页
          </Link>
        </div>
      </div>

      <main>
        {/* Full-bleed title band: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                关于
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                一个免费扫描器，告诉你 AI 搜索引擎能否读取、解析并引用你的页面，并公开它用来做判断的规则。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* Same measure and typography as the English page: `.doc-article` carries the
                heading, list and link styles because Tailwind Typography is not installed. */}
            <div className="reveal-stagger mx-auto max-w-3xl">
              <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <h2>为什么会有这个站点</h2>
                <p>
                  人们越来越多地直接从助手那里得到答案，而不是点击一个链接。一旦如此，一个排名很好却从未被引用的页面就已经彻底失去了这位访客，而常规分析工具不会告诉你原因。LLMention 的存在，就是要在这种失效模式开始消耗你的流量之前，让它变得可见。
                </p>
                <p>
                  这个品类在另一个方向上同样存在可信度问题。工具们描述神秘的「AI 可见度分数」，却不说它是怎么算出来的；有些还就文件和标记做出证据并不支持的断言。这个项目走的是相反的路。
                </p>

                <h2>它有什么不同</h2>
                <ul>
                  <li>
                    <strong>方法完整公开。</strong>全部十二个维度、每一项检查、它确切的规则和分值，都在{" "}
                    <Link href="/zh/methodology/">方法论页面</Link>
                    上，由扫描器实际执行的同一份数据生成，所以文档不会和行为脱节。
                  </li>
                  <li>
                    <strong>没有分数下限。</strong>一项检查都满足不了的页面会接近 0 分，而不会被抬到一个看起来体面的最低分。
                  </li>
                  <li>
                    <strong>低价值信号权重就低。</strong> <code>llms.txt</code>{" "}
                    是这里权重最低的三个维度之一：这项检查占该维度 6 分中的 4 分，而该维度占总分的 5%，所以这个文件最多只能贡献 100 分里的 3.3 分。
                  </li>
                  <li>
                    <strong>局限一开始就写明。</strong>扫描器不会就你的品牌去询问 ChatGPT。它测量的是你的页面是否处于「有可能被引用」的状态；这是一个更窄、也更诚实的断言。
                  </li>
                </ul>

                <h2>谁在运营它</h2>
                <p>
                  LLMention 由 <Link href="/zh/author/">{AUTHOR.name}</Link>{" "}
                  作为独立项目维护。他是常驻中国的独立开发者；这不是一家公司，本站也不隶属于 OpenAI、Anthropic、Google 或 Perplexity，与它们没有任何数据关系。扫描器免费，无需账号。
                </p>
                <p>
                  它不是那种背后什么都没有的免费站点，所以资金来源是写明的，而不是留给读者自己去发现：由 Google 投放的广告，以及{" "}
                  <Link href="/zh/pricing/">定价页面</Link>
                  上描述的付费测量报告。两者都无法改变分数——分数由扫描器根据它抓取到的响应计算，而报告解释一个结果，而不是修改它。
                  <Link href="/zh/author/">作者页面</Link>
                  列出了编辑规则，以及这种模式带来的利益冲突。
                </p>
                <p>
                  由 {AUTHOR.name} 撰写和维护。评分方法完整公布在{" "}
                  <Link href="/zh/methodology/">方法论页面</Link>
                  上，源代码公开在{" "}
                  <a href={AUTHOR.githubRepo} target="_blank" rel="noopener noreferrer">
                    github.com/Alex13192/geo-scanner
                  </a>
                  ，所以对结果的不同意见可以很具体：指出是哪一项检查、哪一个 URL。
                  篇幅更长的写作——研究报告发现了什么，以及这套方法在哪里比它看起来更弱——在{" "}
                  <Link href="/zh/insights/">/zh/insights/</Link>。
                </p>

                <h2>这个名字，以及它不是的东西</h2>
                <p>
                  产品的全名是 {BRAND_FULL}。它是一份独立的就绪度审计——按爬虫的方式抓取你的页面，并报告这些页面能否被读取和引用——不是提及追踪器；它不统计提及，也不向引擎询问你的品牌。
                </p>
                <p>
                  它与 DataForSEO 的 LLM Mentions API——即 <code>llm.dataforseo.com</code>{" "}
                  上的那个产品——没有关联，后者测量的是另一件事：两者之间没有合作、没有数据关系，也没有共同的运营方。
                </p>

                <h2>联系</h2>
                <p>
                  问题和更正都发往同一个地址：
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  。如果扫描器对你的站点报告了你认为有误的内容，那就是你能发来的最有用的消息；方法之所以公开，正是为了让不同意见可以具体。
                </p>

                <h2>主要来源</h2>
                <p>
                  本项目在判断生成式引擎偏好什么时，依据的是已发表的研究，而不是口口相传的说法：
                </p>
                <ul>
                  <li>
                    <a
                      href="https://arxiv.org/abs/2311.09735"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Generative Engine Optimization: How to Dominate AI Search
                    </a>{" "}
                    ——KDD 2024，Princeton 与 Georgia Tech。
                  </li>
                  <li>
                    <a
                      href="https://arxiv.org/abs/2510.11438"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      What Generative Search Engines Like
                    </a>
                  </li>
                  <li>
                    <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">
                      llms.txt 约定
                    </a>
                  </li>
                </ul>
              </article>

              <div className="mt-16 pt-8 border-t border-[var(--line)]">
                <Link
                  href="/#scan"
                  hrefLang="en"
                  className="text-xs text-[var(--accent)] hover:opacity-75"
                >
                  免费审计你自己的网站（英文） →
                </Link>
              </div>

              {/*
                The scope table, outside the article so it keeps the shell's 14px measure
                rather than the article's 17px body copy - the same nesting as the English
                page, where this block is a sibling of <article>.
              */}
              <div className="mt-16 space-y-6 text-sm leading-relaxed text-[var(--ink-2)]">
                <h2 className="text-xl font-bold text-[var(--ink-1)]">
                  扫描器做什么、不做什么
                </h2>
                <p>
                  在已发表的研究中，30 个首页里有 2 个（7%）达到 B 或以上，没有一个达到 A。把范围平实地说明白，这个结果会更容易读懂。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
                    <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">它做</th>
                        <th className="text-left px-4 py-2.5 font-semibold">它不做</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5 align-top">按爬虫的方式抓取你的首页</td>
                        <td className="px-4 py-2.5 align-top">
                          执行 JavaScript，所以客户端渲染的页面会按爬虫看到的样子来评判
                        </td>
                      </tr>
                      <tr className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5 align-top">
                          在 robots.txt、llms.txt 和 sitemap 存在时读取它们
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          登录、提交表单，或访问任何在付费墙之后的内容
                        </td>
                      </tr>
                      <tr className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5 align-top">
                          对每项失败的检查，报告产生该结论的证据
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          询问任何 AI 引擎你的品牌是否被提及、推荐或引用
                        </td>
                      </tr>
                      <tr className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5 align-top">
                          公布每一条规则、它的权重和通过条件
                        </td>
                        <td className="px-4 py-2.5 align-top">预测某次引用，或承诺排名</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
                <Faq
                  title="关于这个项目的问题"
                  items={[
                    {
                      q: "谁在运营 LLMention？",
                      a: "Alex，一名独立开发者，在作者页面上署名，并附有项目发布所用的 GitHub 账号。它不隶属于 OpenAI、Anthropic、Google 或 Perplexity，与它们中任何一家都没有数据关系。",
                    },
                    {
                      q: "LLMention 和 DataForSEO 的 LLM Mentions API 是同一个东西吗？",
                      a: `不是。全名是 ${BRAND_FULL}，一份独立的就绪度审计；它不追踪提及，也不向引擎询问某个品牌。DataForSEO 的 LLM Mentions API 是另一个测量提及的产品。两者之间没有合作、没有数据关系，也没有共同的运营方。`,
                    },
                    {
                      q: "为什么要把评分方法完整公开？",
                      a: "因为这个品类在另一个方向上存在可信度问题：工具们描述神秘的 AI 可见度分数，却不说它是怎么算出来的。你无法检查的方法，不是证据。",
                    },
                    {
                      q: "扫描器会就我的品牌去询问 ChatGPT 吗？",
                      a: "不会。它测量的是你的页面是否处于「有可能被引用」的状态；与「你是否正在被引用」相比，这是一个更窄、也更容易站得住脚的断言。",
                    },
                  ]}
                />
                <Evidence
                  title="证据与来源"
                  quote={GEO_PRIMARY_QUOTE}
                  attribution="Generative Engine Optimization, KDD 2024"
                  attributionUrl="https://arxiv.org/abs/2311.09735"
                  sources={GEO_PRIMARY_SOURCES}
                  note="本站使用的权重遵循那项测量结果，而不是个人偏好；单 URL 扫描看不到的那部分图景，也会被写明，而不是省略。"
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
