import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagramHeadingRetrieval from "@/app/(en)/docs/_components/DiagramHeadingRetrieval";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/docs/qa-style-headings/` - "Optimizing Headings for Direct AI Citation", in Chinese.
 *
 * WHY THIS PAGE DOES NOT RENDER THROUGH ArticleShell. The shell imports SiteNav, PageFooter and
 * the English `/docs/` back-link directly, so a Chinese reader would be dropped into English
 * navigation by the first scroll and sent back to the English index by the one link that exists
 * to orient them. The markup below is the same shell rebuilt on LocaleHeader/LocaleFooter with
 * the same `band` / `wrap` / `doc-article` classes the other localized pages use.
 *
 * WHAT IS TRANSLATED: headings, prose, lists, the FAQ, and the caption-free parts of the page.
 * WHAT IS NOT: the HTML sample and the `<h2>` elements - they are the subject of the article, and
 * translating `Features` into a Chinese label would remove the very "label, not a question" the
 * example is about - and the reused diagram, whose labels live in the English component.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The visible date and the `dateTime` attribute are the same string, so the
 * printed and the machine-readable date cannot disagree.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "为 AI 直接引用优化标题";
const DESCRIPTION =
  "如何把 H2 和 H3 标题改写成真正的问题，并为它们配上「先给答案」的段落，让 AI 搜索引擎能摘走一段自足的答案。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/docs/qa-style-headings/",
    languages: {
      en: "/docs/qa-style-headings/",
      "zh-Hans": "/zh/docs/qa-style-headings/",
      "x-default": "/docs/qa-style-headings/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/docs/qa-style-headings/",
    type: "article",
  }),
};

export default async function ChineseQaStyleHeadingsPage({
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

      {/* The way back to the index, kept as a slim strip under the navigation - the same place it
          occupies on the English guides. It goes to the Chinese index, not /docs/. */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/zh/docs/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 全部指南
          </Link>
        </div>
      </div>

      <main>
        {/* Full-bleed title band: the colour step is what marks the margin. Same geometry as the
            English guide, so switching language does not change the page's skeleton. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                内容
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {DESCRIPTION}
              </p>
              {/* The author page is English; it is labelled rather than silently switching language
                  halfway through a Chinese byline. */}
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
                  （作者页为英文）
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-02">发布于 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新于 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>阅读约 4 分钟</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <p>
                <strong>AI 引擎引用的是段落，不是整页。</strong> 生成的答案会从某个来源里摘走一两句话，
                并标注出处。你的标题决定了这段文字是否自足到可以被摘走。这正是标题结构在 GEO 里
                比在经典 SEO 里更重要的全部原因。
              </p>

              <h2>为什么标题在 AI 搜索里比在 SEO 里更重要？</h2>
              <p>
                搜索引擎给一个 URL 排名。生成式引擎检索的是一段文字，验证它能回答这个问题，
                然后引用它来自的那个页面。如果你的标题是 <code>Features</code>，
                检索系统就没有任何信号表明它下面那段话在回答谁的问题。如果标题是一个真问题，
                段落就能被直接匹配——而且不需要读者先了解上下文，它也能被引用。
              </p>

              {/*
                放在这一节之后、改写建议之前，因为它回答的正是这一节提出的问题：检索是否真的以段落为单位。
                没看到「被摘走的是文字片段」的读者，会把下一节读成用词建议，而不是「一段能被引用、
                一段不能」的区别。

                WHY THE COMPONENT IS IMPORTED FROM THE ENGLISH ROUTE GROUP: the drawing is the
                explanation, and forking it into a Chinese copy would create a second drawing that
                must be kept in step with one argument - the drift the shared component exists to
                prevent. Its SVG labels stay English; the prose around it does not.
              */}
              <DiagramHeadingRetrieval />

              <h2>可被引用的标题长什么样？</h2>
              <p>
                把标签改写成疑问句，措辞要匹配人们实际提问的方式。把原有关键词留在句子里，
                这样传统排名不会塌掉。
              </p>
              <pre>{`<!-- Before: a label. Nothing to retrieve. -->
<h2>Features</h2>

<!-- After: a retrievable question, keyword intact. -->
<h2>How does Your Company measure brand AI visibility?</h2>`}</pre>
              <p>
                用顾客会当面说出口的方式写这个问题，而不是规格说明书的写法。
                <em>“我要怎么检查 AI 爬虫能不能读取我的网站？”</em> 胜过{" "}
                <em>“爬虫访问验证方法论”</em>。
              </p>

              <h2>标题下的第一句话应该做什么？</h2>
              <p>
                <strong>立刻用一句陈述句回答问题。</strong> 把它当成机器会单独摘走的那句话。
                细节、限定条件和例子属于后面几句。
              </p>
              <p>
                一个可靠的检验：把这句话单独复制出来，问它在没读过页面其余部分的人看来是否仍然成立。
                如果它开头是 <em>“正如上文所述”</em> 或 <em>“这要看情况”</em>，它就没通过检验，不会被选中。
              </p>

              <h2>如何改写已有标题而不丢排名？</h2>
              <ol>
                <li>列出已经有搜索流量的页面。那些页面的标题是承重的。</li>
                <li>保留主关键词，把周围的措辞改成一个问题。</li>
                <li>在标题正下方补上那一句答案，放在任何铺垫之前。</li>
                <li>不要动 URL slug。改标题是安全的；改 URL 是一次迁移。</li>
                <li>检查每个 H2 是否仍然只对应一个问题。覆盖两个问题的标题要拆开。</li>
              </ol>

              <h2>常见错误有哪些？</h2>
              <ul>
                <li>
                  <strong>问句式标题下面没有答案。</strong> 这个模式很容易照抄，
                  但没有「先给答案」的那句话就毫无价值。
                </li>
                <li>
                  <strong>每个标题都是问句。</strong> 导航和栏目标签不需要这样；硬套只会写出别扭的文字，
                  读者会直接离开。
                </li>
                <li>
                  <strong>把答案埋起来。</strong> 如果直接答案在第三段，检索系统可能根本到不了那里。
                </li>
                <li>
                  <strong>在答案的位置写营销话术。</strong> <em>“我们是领先的……”</em> 不是答案，也不会被引用。
                </li>
              </ul>
              <p>
                把它和结构化数据配合使用：见{" "}
                <Link
                  href="/zh/docs/schema-org-jsonld/"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  为实体消歧实现 Schema.org JSON-LD
                </Link>
                。
              </p>
            </article>

            {/*
              The FAQ and the sources block are part of the shell on every English guide, so they
              are kept here rather than dropped: a Chinese version that quietly loses the sources
              block would be a different article under the same title. `Faq` and `Evidence` are
              locale-neutral and reused, so the FAQPage JSON-LD and the source list cannot drift
              from the English page.
            */}
            <div className="reveal-stagger mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于问句式标题的问题"
                items={[
                  {
                    q: "什么样的标题算「可回答」？",
                    a: "它用人们提问的方式措辞，而它下面那段话在第一句就给出答案，而不是层层铺垫到最后才回答。",
                  },
                  {
                    q: "每个标题都要变成问题吗？",
                    a: "不必。问句标题只在某个小节确实在回答某个问题时才有帮助。硬把一个不回答任何问题的小节改成问句，只会让文字更差，没有任何收益。",
                  },
                  {
                    q: "这会改变页面的外观吗？",
                    a: "它改的是标题的措辞和段落里句子的顺序，不是版式。标题字号不变，页面结构也保持不变。",
                  },
                ]}
                level="h3"
              />
              {/*
                The quotation is a paper's own finding, so it stays verbatim in English: rendering
                a quoted percentage as Chinese prose would still look like a quotation while no
                longer being one. The heading, the note and the link are translated.
              */}
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    本站使用的权重依据那项测量，因此可引用性与证据各占 11%，而 AI 上下文文件维度占 5%。
                    完整权重，以及单 URL 扫描看不到的那部分图景，都在{" "}
                    <Link
                      href="/zh/methodology/"
                      className="text-[var(--accent)] underline hover:opacity-75"
                    >
                      中文方法论页面
                    </Link>
                    里。
                  </>
                }
              />
            </div>

            {/* The scan console only exists on the English homepage, so the call to action goes
                where the tool actually is rather than to a Chinese page with no form on it. */}
            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link
                href="/#scan"
                hrefLang="en"
                className="text-sm text-[var(--accent)] hover:opacity-75"
              >
                免费审计你自己的网站 →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
