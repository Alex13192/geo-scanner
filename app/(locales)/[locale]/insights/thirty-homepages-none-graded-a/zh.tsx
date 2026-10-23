import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { getInsight, insightPath } from "@/lib/insights";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/zh/insights/thirty-homepages-none-graded-a/` - the 30-homepage study write-up, in Chinese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one to
 * render. A Japanese version written into `page.tsx` would have deleted this Chinese article,
 * and one URL pattern cannot have two route files. The route keeps the locale guard, the static
 * params and the per-locale canonical; this module keeps the body and the strings metadata
 * reads.
 *
 * WHY THIS REBUILDS THE ENGLISH SHELL INSTEAD OF USING PostShell: PostShell renders SiteNav and
 * PageFooter, whose strings are English, and it reads title, dek and reading time from
 * lib/insights.ts, which carries the English copy. A localized article has to use
 * LocaleHeader/LocaleFooter or the language switcher would drop the reader onto an English
 * page, so the band, the byline, the FAQ, the evidence block, the author card and the related
 * links are rebuilt here in the same order and with the same classes as the English shell.
 *
 * WHY TITLE AND DESCRIPTION ARE AUTHORED HERE: the registry in lib/insights.ts is the single
 * source for the English page, and its strings are the English metadata. The Chinese title and
 * description are translations of those strings, and they are exported so the route's
 * metadata reads the same strings the page prints; the publication date and the reading time
 * are imported instead of retyped, so the language versions cannot disagree about when the
 * piece was published.
 *
 * WHAT STAYS ENGLISH: every score, percentage, grade letter, site domain, rule count, status
 * code, `robots.txt`, the study data URL and the paper quotation. Those are the data the piece
 * reports; a translated number would be a different number.
 *
 * WHY THE LINKS ARE MIXED: /methodology/, the crawler guide and the other pieces in this
 * archive now have Chinese versions and are linked in Chinese. The study data endpoint and the
 * author page do not, so those links keep hrefLang="en" and the （英文） marker that tells a
 * reader they are leaving the translation.
 *
 * The text below is the original Chinese body unchanged.
 */
const insight = getInsight("thirty-homepages-none-graded-a");

/** Built from the slug, because a second literal would drift from the registry one day. */
const ZH_PATH = `/zh${insightPath(insight.slug)}`;

export const TITLE = "我们扫描了 30 个首页，没有一个拿到 A";
export const DESCRIPTION =
  "我们 30 个站点研究的完整分布：平均分、上限，以及为什么最高只到 B 而不是 A。";

/**
 * The registry stores "9 min read", which a Chinese byline cannot print. Parsing the number
 * keeps the reading time in one place, so a changed value still moves both pages together.
 */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

export default function ChineseThirtyHomepagesPage() {
  const dict = getDictionary("zh");

  /*
   * The same BlogPosting shape PostShell emits for the English page, with `inLanguage` and the
   * URL changed: a Chinese page has to describe itself under its own canonical rather than
   * borrow the English article's identity.
   */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}${ZH_PATH}#article`,
    name: TITLE,
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: insight.published,
    dateModified: insight.published,
    inLanguage: "zh-Hans",
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: AUTHOR.name,
      url: `${SITE_URL}${AUTHOR.path}`,
    },
    about: { "@id": `${SITE_URL}/#author` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${ZH_PATH}` },
    image: `${SITE_URL}${OG_IMAGE.url}`,
    articleSection: "研究",
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)] selection:bg-blue-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <LocaleHeader locale="zh" dict={dict} />

      {/* The way back to the Chinese archive, in the position the English shell puts it. */}
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
        {/* Full-bleed title band, the same colour step that marks the margin on the English page. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                研究
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                这项研究里有一个数字人人都在引用，另外四个却很少被提起。这一篇讲的是它们背后的分布，包括那 9 行根本没有产出页面的记录。
              </p>
              {/*
                The byline from PostShell, in Chinese. The date stays ISO rather than going
                through formatDate: that helper prints English month names, and a publication
                date a reader can check is the point of the byline.
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
                <time dateTime={insight.published}>发布于 {insight.published}</time>
                <span aria-hidden="true">·</span>
                <span>{READ_MINUTES} 分钟阅读</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              17px body copy at the same measure as the English article. `.doc-article` carries
              the typography (h2, lists, tables, links); Tailwind Typography is not installed
              in this project.
            */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>2026 年 10 月 3 日，我们用扫描器对 30 个知名站点的首页各发了一次请求，并按照当时存在的 38 条规则给返回结果打分。没有一个达到 A 级。最高的是 <strong>83</strong> 分，作出回应的站点平均 <strong>62</strong> 分，而数量最多的一组——<strong>30 个中的 16 个（53%）</strong>——被评为 F 级。</p>
              <p>这个结果往两个方向都容易被过度解读。它并不意味着普通网站都建得很糟——这些并不是普通网站。它也不意味着 AI 搜索对所有人都失效了。下面讲的是那个头条数字背后的分布，包括那 9 行根本没有产出页面的记录，因为真正的发现是分布的形状，而不是那一个平均值。</p>

              <h2>这 30 个站点究竟得了多少分？</h2>
              <p>2 个站点拿到 B，4 个拿到 C，8 个拿到 D，16 个拿到 F。没有任何一个进入 90 分档——那是这个扫描器认定为 A 的档位。</p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>等级</th>
                      <th>分数档</th>
                      <th>站点数</th>
                      <th>占 30 个的比例</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>A</td>
                      <td>90–100</td>
                      <td>0</td>
                      <td>0%</td>
                    </tr>
                    <tr>
                      <td>B</td>
                      <td>80–89</td>
                      <td>2</td>
                      <td>7%</td>
                    </tr>
                    <tr>
                      <td>C</td>
                      <td>70–79</td>
                      <td>4</td>
                      <td>13%</td>
                    </tr>
                    <tr>
                      <td>D</td>
                      <td>60–69</td>
                      <td>8</td>
                      <td>27%</td>
                    </tr>
                    <tr>
                      <td>F</td>
                      <td>低于 60</td>
                      <td>16</td>
                      <td>53%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>前五名依次是：salesforce.com 83 分、siemens.com 80 分、vercel.com 79 分、cloudflare.com 77 分、stripe.com 75 分。作出回应的站点里垫底的是 sap.com，41 分——它仍然是一个渲染出来的页面，以及一个衡量它的分数。</p>

              <h2>为什么上限是 B，而不是缺了一个 A？</h2>
              <p>因为分数分散在 12 个加权维度上，而 A 需要几乎全部维度都拿满。样本中最好的页面在几条互不相关的规则上合计丢了 7 到 9 分，而不是在某一条大规则上失分。</p>
              <p>这正是单个数字掩盖的部分。一个读不懂页面的引擎会一次性拿走 16% 的分数；缺失实体拿走 12%；引述与引用相关的规则合计再拿走 11%。一个站点的内容可以很出色，却因为标记、时效性，以及两三条从来没人看过的规则而丢掉 A。</p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>维度</th>
                      <th>权重</th>
                      <th>它在问什么</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>AI 爬虫访问</td>
                      <td>16%</td>
                      <td>爬虫究竟能不能抓到页面？</td>
                    </tr>
                    <tr>
                      <td>机器可读性</td>
                      <td>12%</td>
                      <td>标记可解析吗，有没有声明实体？</td>
                    </tr>
                    <tr>
                      <td>内容深度</td>
                      <td>11%</td>
                      <td>正文够不够多，结构清不清楚？</td>
                    </tr>
                    <tr>
                      <td>可引用性与证据</td>
                      <td>11%</td>
                      <td>有没有数字、引述和外部来源？</td>
                    </tr>
                    <tr>
                      <td>答案就绪度</td>
                      <td>10%</td>
                      <td>标题是否写成问句，下面是否跟着简短回答？</td>
                    </tr>
                    <tr>
                      <td>信任与权威</td>
                      <td>10%</td>
                      <td>作者、联系方式、sameAs，以及一个可见的日期。</td>
                    </tr>
                    <tr>
                      <td>语义结构</td>
                      <td>8%</td>
                      <td>标题层级、landmark，以及唯一的 H1。</td>
                    </tr>
                    <tr>
                      <td>元数据与可发现性</td>
                      <td>7%</td>
                      <td>title、description、canonical、Open Graph。</td>
                    </tr>
                    <tr>
                      <td>AI 上下文文件</td>
                      <td>5%</td>
                      <td><code>robots.txt</code> 里的信号，以及一个 llms.txt。</td>
                    </tr>
                    <tr>
                      <td>时效性</td>
                      <td>5%</td>
                      <td>一个机器可读、而且足够新的日期。</td>
                    </tr>
                    <tr>
                      <td>国际就绪度</td>
                      <td>3%</td>
                      <td>语言与 hreflang 声明。</td>
                    </tr>
                    <tr>
                      <td>交付与移动端</td>
                      <td>2%</td>
                      <td>viewport、载荷大小，不依赖 JavaScript。</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>如果把 9 个错误响应当作 0 分，会怎样？</h2>
              <p>平均分会从 62 掉到 44，而第二个数字是算术结果，不是测量结果。403 并不是一个建得很糟的页面；那是一个站点拒绝回答，把它记成 0 分，等于把这种拒绝描述成内容问题。</p>
              <p>所以这项研究把那 9 行排除在均值之外，同时把它们留在表里。30 次请求中，<strong>21 次（70%）</strong>返回了可以评分的页面。另外 <strong>9 次（30%）</strong>返回的是 401、403、429、202 或 520。这个区分很重要，因为这两种失败需要相反的应对：你自己给出的页面分数低，那是一份待修清单；而 403 是一个关于「让谁进来」的决定。那是另一篇文章的主题，链接在下面。</p>

              <h2>一项只覆盖 30 个首页的研究，可以信到什么程度？</h2>
              <p>它是一个固定样本，每个站点只有一页，只读了一次，而且对首页背后的页面一无所知。把它当作「这些检查在真实站点上如何表现」的示例，而不是对整个网络的估计。</p>
              <ul>
                <li><strong>样本不是随机的。</strong>我们挑选了横跨 15 个类别的 30 个有辨识度的站点，这对「让人认得出」有用，对统计没有用。</li>
                <li><strong>每个站点只有一页。</strong>首页往往是站点上最不具代表性的一页，而扫描器只给它收到的那个 URL 打分。</li>
                <li><strong>规则集已经变了。</strong>这些记录是在 38 条规则下采集的；扫描器今天发布 40 条，研究页面写明了这一点，而不是悄悄重算历史数据。</li>
                <li><strong>有 9 行是错误响应。</strong>它们被公开、被标注，并被排除在平均值之外，因为删掉它们会掩盖这组数据里最有意思的发现。</li>
              </ul>

              <h2>我怎样才能知道自己站点的位置？</h2>
              <p>跑一次扫描。它只需要一次请求、不需要账号，返回的是这项研究用过的那套检查——并且附带得出每个结果的证据，而不只是一个数字。</p>
              <p>有用的比较对象不是 83。而是你的页面没有通过的那份规则清单，因为那份清单可以照着改，83 不能。如果你想先看完整记录，30 条全部发布在 <Link href="/study/data/" hrefLang="en">研究数据端点（英文）</Link>，分数背后的方法在 <Link href="/zh/methodology/">方法论页面</Link>。</p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block do not inherit its 17px measure. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于这项研究的问题"
                level="h3"
                items={[
                  {
                    q: "60 多分是否意味着站点不会被引用？",
                    a: "不是。分数衡量的是一个页面是否处于「让引用成为可能」的状态：可抓取、可解析、可提取。它不衡量当下是否有任何引擎在引用你，也没有任何分数能保证这一点。",
                  },
                  {
                    q: "为什么是这 30 个站点？",
                    a: "它们是因为在各自类别里辨识度高而被选中的，不是随机抽样。这让这个分布作为示例有用，而作为对整个网络的估计则无用——研究页面本身也这么写。",
                  },
                  {
                    q: "这次运行可以被复现吗？",
                    a: "可以。每一行都发布在 /study/data/，每一行也都可以通过公开 API 重新扫描，所以分歧可以通过运行同一个请求来解决。",
                  },
                ]}
              />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本文中的每一个数字都来自已公开的研究，或来自扫描器实际执行的规则集；两者都给了链接，也都可以重新运行。"
              />
            </div>

            {/* The author card PostShell renders, with the shared role and bio translated once
                here so the two language versions of the card say the same thing. */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — LLMention 维护者
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                我构建并维护 LLMention：扫描器、规则集，以及它背后的研究。这些工作以源代码形式发布，所以方法可以被检查，而不是只能被信任。
              </p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  这个站点是如何撰写和获得资助的（英文） →
                </Link>
              </p>
            </div>

            {/* The two translated pieces that continue this one; both are in this archive. */}
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">继续阅读</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/zh/insights/nine-homepages-never-answered/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    九个首页从未回应爬虫
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    为什么 30 行里有 9 行描述的是错误响应而不是页面，以及这对平均值意味着什么。
                  </p>
                </li>
                <li>
                  <Link
                    href="/zh/insights/entity-markup-gap/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    30 个站点里有 22 个让 AI 猜它们是谁
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    样本里最常见的单一结构性缺口，以及补上它的那 4 行 JSON。
                  </p>
                </li>
              </ul>
            </div>

            <div className="mx-auto mt-14 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link
                href="/#scan"
                hrefLang="en"
                className="text-sm text-[var(--accent)] hover:opacity-75"
              >
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
