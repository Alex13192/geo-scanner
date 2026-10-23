/**
 * `/zh/insights/llms-txt-what-the-evidence-supports/` — the llms.txt explainer, in Chinese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only `page.tsx` would have deleted the Chinese explainer, which is
 * the version that already exists for this URL.
 *
 * WHY THIS REBUILDS PostShell'S SHELL INSTEAD OF USING IT: PostShell renders SiteNav,
 * PageFooter and the English `/insights/` back-link directly, so the reader would be handed
 * English navigation and an English index by the one click whose job is orientation. The
 * shell below is the same geometry rebuilt from LocaleHeader/LocaleFooter and the same
 * `band` / `wrap` / `doc-article` classes the localized guides already use, and it keeps
 * every section PostShell renders - byline, FAQ, evidence, author card, "read next", scan
 * CTA - so the Chinese page is the same article rather than an abridged one.
 *
 * WHAT IS TRANSLATED: prose, headings, the table, the FAQ, the notes around the evidence
 * block, the author card and the related links.
 * WHAT IS NOT: the counter-example llms.txt, because it is an example file and translating
 * its contents would make it stop looking like a file; and the Evidence quotation, because
 * paraphrasing a quoted paper into Chinese would change what the source says while still
 * presenting it as a quotation. `llms.txt`, `robots.txt`, `H1`, `sameAs`, `Markdown` and
 * every number, percentage and URL are technical terms or data and stay byte-identical.
 *
 * THE DATE IS PRINTED AS AN ISO STRING rather than through formatDate(), which emits English
 * month names. The machine-readable `dateTime` and the visible date are then the same
 * string and cannot disagree. The date itself is read from lib/insights.ts so it cannot
 * drift from the English article.
 *
 * TITLE and DESCRIPTION are exported because the dispatcher's generateMetadata returns them
 * for `zh`; everything from `const insight` down is the original Chinese page, unchanged.
 */
import Link from "next/link";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInsight } from "@/lib/insights";

const insight = getInsight("llms-txt-what-the-evidence-supports");

export const TITLE = "llms.txt：证据究竟支持什么";
export const DESCRIPTION =
  "llms.txt 这项约定、围绕它提出的种种说法，以及我们把它的权重定为 100 分中的 3.3 分、而不把它当作排名因素的那个决定背后的测量依据。";
const DEK =
  "这个文件加进去很容易，要把它当成一根杠杆却很难说得通。本文讲为什么仍然值得发布一个，也讲为什么不该假装它比实际更重要。";
/* The badge label, matching CATEGORY_ZH in the Chinese archive: the pill must say the same
   word here as on the card that links to it. */
const CATEGORY = "解读";

/*
 * lib/insights.ts stores readTime as an English sentence ("8 min read"). Number.parseInt
 * takes the number and drops the words, so the Chinese byline and the English byline
 * cannot report different reading times.
 */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

/*
 * Translations of AUTHOR.role and AUTHOR.bio from lib/author.ts. They live here as
 * constants rather than in lib/i18n/dictionaries.ts because they appear on this page only,
 * and they must be kept in step with the English strings by whoever edits lib/author.ts.
 */
const AUTHOR_ROLE_ZH = "LLMention 维护者";
const AUTHOR_BIO_ZH =
  "我构建并维护 LLMention：扫描器、规则集，以及它背后的那项研究。这些工作以源码形式发布，所以方法可以被核查，而不必凭空相信。";

export default function ChineseLlmsTxtEvidencePage() {
  const dict = getDictionary("zh");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      {/* The way back to the Chinese archive, in the place PostShell puts it. */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/zh/insights/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 全部文章
          </Link>
        </div>
      </div>

      <main>
        {/* Full-bleed title band: same colour step and geometry as the English article, so the
            two language versions do not look like two different sites. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                {CATEGORY}
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {DEK}
              </p>
              {/*
                The byline from PostShell, in Chinese. The author page is English, so the link
                is labelled rather than silently switching language halfway through the line.
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
                <time dateTime={insight.published}>发布于 {insight.published}</time>
                <span aria-hidden="true">·</span>
                <span>阅读约 {READ_MINUTES} 分钟</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* 17px body copy at the same 768px measure as the English article. */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                llms.txt 是一份提案中的 Markdown 文件，放在域名根目录，用机器可读的方式描述这个站点。
                发布它的成本很低，推荐它的人很多，而支撑它的证据却比这一领域里几乎任何其他东西都少——
                正因如此，它成了一个好用的试金石：看一个工具是否愿意把这件事说出来。
              </p>
              <p>
                本站发布了一个，也检查它是否存在，并给它 <strong>100 分中的 3.3 分</strong> 的权重。
                只有把这项检查理解为「发布的成本」，而不是「被读取的价值」，这三个事实才彼此自洽。
                这正是本文要论证的立场。
              </p>

              <h2>什么是 llms.txt？</h2>
              <p>
                一个位于 <code>/llms.txt</code> 的 Markdown 文件，包含一个标题、一句摘要和一组链接，
                写给语言模型而不是浏览器看。
              </p>
              <p>
                这项约定记录在{" "}
                <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">
                  llmstxt.org
                </a>
                ，它是第一手来源，也是在形成看法之前唯一值得先读的一份。它的形态刻意保持简单：
                一个写着项目名的 H1，一段引用块摘要，然后是若干链接小节，每条链接配一行说明。
              </p>

              <h2>扫描器实际检查的是什么？</h2>
              <p>
                四项结构属性：文件大于 20 字节、包含一个 H1、包含一行以 <code>&gt;</code>{" "}
                开头的摘要、至少包含三个 Markdown 链接。缺少其中任何一项都算部分通过。
              </p>
              <p>
                文件说了什么，不在评判范围之内。三个指向并不存在的页面的链接，同样能通过结构测试——
                这是本站最清楚的一个例子，说明某条规则衡量的是信号是否存在，而不是它的质量；
                规则页也把这一点原话说清楚了。
              </p>

              <h2>有哪家爬虫的文档写明会读它吗？</h2>
              <p>
                我们能打开的那些都没有。OpenAI 的帮助中心和 Anthropic 的爬虫文章都指定{" "}
                <code>robots.txt</code> 作为控制手段；两者都没有承诺会读取 llms.txt。
              </p>
              <p>
                这是关于文档的陈述，不是关于行为的陈述，而这个区别很重要。一项抓取政策可以被写进文档，
                却依然被无视；一项没有写进文档的约定，也可能被悄悄采纳。能诚实说出来的范围要窄得多：
                没有任何厂商公开过承诺，所以站长无法从证据推导出一个预期结果。
              </p>

              <h2>那为什么还要给它权重？</h2>
              <p>
                因为发布它几乎不花钱，而对于一个效果尚未被测量的信号，小权重就是正确的定价。
                这套算术是公开的，而不是藏起来的。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>规则</th>
                      <th>分值</th>
                      <th>维度权重</th>
                      <th>对总分的上限</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>llms.txt 结构检查</td>
                      <td>该维度 6 分中的 4 分</td>
                      <td>5%</td>
                      <td>100 分中的 3.3</td>
                    </tr>
                    <tr>
                      <td>robots.txt 可读取</td>
                      <td>该维度 6 分中的 1 分</td>
                      <td>5%</td>
                      <td>100 分中的 0.8</td>
                    </tr>
                    <tr>
                      <td>对照：爬虫访问</td>
                      <td>—</td>
                      <td>16%</td>
                      <td>100 分中的 16</td>
                    </tr>
                    <tr>
                      <td>对照：机器可读性</td>
                      <td>—</td>
                      <td>12%</td>
                      <td>100 分中的 12</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                一个完美的 llms.txt 值 <strong>3.3</strong> 分。放行爬虫，值总分的{" "}
                <strong>16%</strong>；把实体标记写对，值 <strong>12%</strong>。
                一个正在决定把某个下午花在哪里的站点，答案就在这组对比里，而那不是这个文件。
              </p>

              <h2>这个文件真正有用在哪？</h2>
              <p>
                两件与排名无关的事：给那些确实会读它的工具一份可读的摘要，以及给站长一个不得不动手的契机。
              </p>
              <ul>
                <li>
                  <strong>文档站与编码代理。</strong>写得好的 llms.txt，对需要概括一个代码仓库
                  或一棵文档树的工具来说是一份有用的导航摘要，而这种用途并不依赖任何搜索引擎采纳它。
                </li>
                <li>
                  <strong>写摘要本身就是练习。</strong>用一句话如实描述这个站点是什么，
                  会暴露出那些做不到这一点的文案——而这句话在 meta description、Organization
                  节点和推销话术里本来也都需要。
                </li>
                <li>
                  <strong>保持正确很便宜。</strong>链接就是导航里的那些，
                  所以重新生成一次只是一份 diff，而不是一篇文章。
                </li>
              </ul>

              <h2>一个不虚构的版本长什么样？</h2>
              <p>
                很短，而且是从页面本身生成，而不是从模板生成。下面每一行都可以对照它所描述的站点被验证。
              </p>

              <pre>{`# Your Brand

> One sentence on what the product does, written for a reader who has
> never seen the site.

## Core pages

- [Product](https://your-domain.com/product/): what it does and who it is for
- [Pricing](https://your-domain.com/pricing/): what costs money and what does not
- [About](https://your-domain.com/about/): who runs it and how to reach them

## Notes

- The tool is free and requires no account.`}</pre>

              <p>
                两种失败模式在这个形态里就能看出来。由模板生成的文件，站点一变就会漂移。
                由页面真实的标题、描述和导航生成的文件，无法描述站点里并不存在的东西——
                这正是{" "}
                <Link href="/llms-txt-studio/" hrefLang="en">
                  llms.txt studio
                </Link>
                （英文）所围绕的性质，也是它去读取首页、而不是让你手动输入的原因。
              </p>

              <h2>与其优化这个文件，我该做什么？</h2>
              <p>
                去修评分真正加权的地方。爬虫访问、实体标记和答案前置结构三者加起来，
                权重超过这个上下文文件的四倍。
              </p>
              <ol>
                <li>
                  检查 <code>robots.txt</code> 是否放行你希望从中获得引用的那些爬虫。
                  这是 16% 的维度，而它只是一个文件。
                </li>
                <li>
                  声明实体以及它的 <code>sameAs</code> 资料链接。那是 12% 的维度，
                  也是十几行 JSON。
                </li>
                <li>
                  把标题改写成问句，下面跟一句回答。那是 10% 的维度，
                  花的是编辑功夫，而不是基础设施。
                </li>
                <li>
                  在这些之后再去发布 llms.txt，因为它是对一个你已经让它变得可描述的站点的摘要。
                </li>
              </ol>
              <p>
                这些权重背后的方法，包括把这份文件的权重压低到这种程度的理由，都在{" "}
                <Link href="/zh/methodology/">方法页</Link>上；部署细节在{" "}
                <Link href="/zh/docs/llms-txt-deployment/">llms.txt 指南</Link>里。
              </p>
            </article>

            {/*
              Outside the article, so the FAQ and the evidence block keep the 15px measure they
              have on the English page instead of inheriting the article's 17px.
            */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于 llms.txt 的问题"
                items={[
                  {
                    q: "要想被 AI 搜索引用，我需要一个 llms.txt 吗？",
                    a: "不需要。本站能测量到的任何东西，都没有显示这个文件被读取过；而现有的爬虫文档指向的其实是 robots.txt。如果你想要一份机器可读的摘要，那就发布一个；但不要指望它能改变分数。",
                  },
                  {
                    q: "发布一个会带来什么坏处吗？",
                    a: "只有一种情况：它说了不真实的东西。一个描述你并不拥有的产品的文件，或者链接到并不存在的页面，就是一条读者或模型可以核查的说法，它造成的损失超过这个文件的价值。",
                  },
                  {
                    q: "那扫描器为什么还要检查它？",
                    a: "因为它成本低；因为一个发布了它的站点，至少被迫写下了自己是什么；也因为如果把它排除在外，评分就会对这一领域大部分站点已经采纳的一项约定视而不见。",
                  },
                ]}
                level="h3"
              />
              {/*
                The quotation stays in English: it is a sentence from a paper, and a translated
                quotation would change what the source says while still looking like one. The
                heading, the note and the link around it are translated.
              */}
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本文中的每一个数字，都来自已发表的研究，或者来自扫描器执行的规则集；两者都有链接，也都可以重新运行。"
              />
            </div>

            {/*
              The author card from PostShell. It is translated rather than kept in English
              because its whole job is to tell this reader who wrote the piece.
            */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — {AUTHOR_ROLE_ZH}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{AUTHOR_BIO_ZH}</p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  本站如何写作与获得资助（英文） →
                </Link>
              </p>
            </div>

            {/*
              "Read next", as PostShell renders it. Both targets now exist in this route
              group, so they are linked in Chinese: sending a reader to the English original
              would contradict the hreflang pair each article claims.
            */}
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">接下来读</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/zh/insights/reading-a-failed-check/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    如何读懂一次未通过的检查，并修对地方
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    llms.txt 规则测的是结构，不是真实性。这是每条规则页都必须点明的同一个缺口。
                  </p>
                </li>
                <li>
                  <Link
                    href="/zh/insights/entity-markup-gap/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    30 个站点里有 22 个让 AI 去猜它们是谁
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    跳过它代价更高的那一项：占总分 12%，而样本里大多数站点都没有。
                  </p>
                </li>
              </ul>
            </div>

            {/* The scan console only exists on the English homepage, so the call to action
                points at the page that actually has a form in it. */}
            <div className="mx-auto mt-14 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link href="/#scan" hrefLang="en" className="text-sm text-[var(--accent)] hover:opacity-75">
                免费审计你自己的网站（英文） →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
