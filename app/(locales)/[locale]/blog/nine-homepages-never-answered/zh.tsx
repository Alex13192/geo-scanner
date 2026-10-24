import Link from "next/link";
import Evidence, {
  GEO_PRIMARY_QUOTE,
  GEO_PRIMARY_SOURCES,
} from "@/app/components/Evidence";
import Faq, { type FaqItem } from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInsight } from "@/lib/insights";
import { OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/zh/blog/nine-homepages-never-answered/` - the nine-homepages essay, in Chinese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only route would have deleted the Chinese essay that already ranks
 * here; two route files cannot answer one URL pattern. The route keeps
 * `generateStaticParams`, `generateMetadata` and the zh/ja branch, and imports TITLE and
 * DESCRIPTION from this module so its canonical can never describe a page whose heading says
 * something else.
 *
 * WHY THE SHELL IS REBUILT INLINE INSTEAD OF USING PostShell: PostShell renders SiteNav and
 * PageFooter, whose navigation, archive strip and author card are English. A Chinese reader
 * would get an English frame around Chinese prose, including an "All writing" link that
 * would drop them back into the English archive. The band/wrap/doc-article geometry, the
 * byline, the FAQ, the evidence block, the author card and the "read next" list are copied
 * from that shell so the two versions still read as one article in two languages.
 *
 * WHAT STAYS ENGLISH: the status codes and their names, robots.txt, every domain in the
 * table, the quoted KDD finding, the bibliographic source labels, and the author's own name.
 * Those are identifiers or quotations, not prose; translating them would change what the
 * piece is about. Everything a reader is meant to follow as argument is Chinese.
 *
 * The text below is the original Chinese body, moved here byte-for-byte. Only the component
 * signature lost its params/notFound guard, which the route now owns.
 */
export const TITLE = "九个首页从未回应爬虫";
export const DESCRIPTION =
  "30 个首页中有 9 个对爬虫形式的请求返回了错误。这些状态码是什么意思，以及为什么它们被排除在均值之外。";

const insight = getInsight("nine-homepages-never-answered");

/**
 * The two URLs this pair claims. Written out rather than built from `insightPath`, because
 * that helper is the English base: the canonical and the `zh-Hans` alternate must differ,
 * and deriving one from the other is how an hreflang pair ends up pointing at itself.
 *
 * Only the Chinese URL stays here - it is what the JSON-LD @id and mainEntityOfPage print.
 * The English and Japanese URLs are the route's business, not the body's.
 */
const PATH = "/zh/blog/nine-homepages-never-answered/";

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "低分是否意味着我的站点在屏蔽扫描器？",
    a: "有时是。打开报告，先读状态码：401、403、429、202 或 520 意味着这个数字描述的是响应，而不是你的页面。只有 200 才可能产生一个关于内容的分数。",
  },
  {
    q: "为什么不删掉这九行，报告一个干净的平均值？",
    a: "因为删掉它们会藏起样本里最有趣的发现，而且那个平均值会在被当作 30 个页面的同时，悄悄描述 21 个页面。这些行是公开的、被标记的，并被排除在均值之外。",
  },
  {
    q: "把它们排除掉，不就是在给结果贴金吗？",
    a: "它把数字从 44 提高到 62，所以这是更不耸动的选择，而不是贴金的选择。规则是事先声明的：均值只对给出回答的页面计算，因为 403 不是一个页面。",
  },
];

export default function ChineseNineHomepagesPage() {
  const dict = getDictionary("zh");
  /*
   * `lib/insights.ts` is the single source for the publication date and the reading time.
   * Only the " min read" suffix is rewritten here: the number itself is the measured one,
   * and copying it into this file would let the two language versions disagree.
   */
  const readMinutes = insight.readTime.replace(" min read", "");

  /*
   * The same BlogPosting shape PostShell emits, with the one field that must differ:
   * `inLanguage`. The @id and mainEntityOfPage are this locale's URL, so the Chinese page
   * describes itself rather than borrowing the English article's identity.
   */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}${PATH}#article`,
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
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${PATH}` },
    image: `${SITE_URL}${OG_IMAGE.url}`,
    articleSection: "方法",
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)] selection:bg-blue-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <LocaleHeader locale="zh" dict={dict} />

      {/* The way back to the Chinese archive, kept where PostShell puts the English one. */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/zh/blog/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 全部文章
          </Link>
        </div>
      </div>

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                方法
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                403 不是一个页面。研究里有九行描述的是错误响应，而不是站点；把它们当作 0
                计入，会得出一个更耸动、也更不真实的数字。
              </p>
              {/*
                The publication date stays ISO: it is the value in lib/insights.ts and the
                one the JSON-LD repeats, so a reader can check it. The author link goes to
                the English author page and says so, as every localized page does.
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
                {insight.updated ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>更新于 {insight.updated}</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>阅读约 {readMinutes} 分钟</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                研究中的 30 个首页里有 9 个从未产出页面。扫描器发出请求，收到的是 401、403、429、202
                或 520。这些行仍然留在已发布的数据里，仍然带着一个分数，而这个分数测量的是错误响应，不是站点本身。
              </p>
              <p>
                这项排除，是研究主推的那个数字背后的方法决定。把这九个当作 0 分计入，均值是 44；把它们视为未测量，均值是 62。本站发布的是第二个数字，本文要论证的也是它——包括它让结果看起来没那么耸动的那一部分。这同时也是一次不小的修正：<strong>30%</strong> 的样本从未产出页面，排除它们会让均值移动 18 分，也就是已发布数字的{" "}
                <strong>29%</strong>。
              </p>

              <h2>是哪九个，它们回了什么？</h2>
              <p>
                四个状态码加一个非标准状态码，构成了全部九个。九行中只有两行——<strong>22%</strong>——在向浏览器正常提供服务的同时拒绝了爬虫。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>首页</th>
                      <th>状态码</th>
                      <th>与浏览器访问同一 URL</th>
                      <th>状态码的含义</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>bmw.com</td>
                      <td>520</td>
                      <td>520</td>
                      <td>边缘错误，不是标准状态码</td>
                    </tr>
                    <tr>
                      <td>nytimes.com</td>
                      <td>403</td>
                      <td>403</td>
                      <td>对所有客户端都禁止访问</td>
                    </tr>
                    <tr>
                      <td>reuters.com</td>
                      <td>401</td>
                      <td>401</td>
                      <td>需要身份验证</td>
                    </tr>
                    <tr>
                      <td>stackoverflow.com</td>
                      <td>403</td>
                      <td>403</td>
                      <td>对所有客户端都禁止访问</td>
                    </tr>
                    <tr>
                      <td>perplexity.ai</td>
                      <td>403</td>
                      <td>403</td>
                      <td>对所有客户端都禁止访问</td>
                    </tr>
                    <tr>
                      <td>google.com</td>
                      <td>429</td>
                      <td>429</td>
                      <td>请求过多</td>
                    </tr>
                    <tr>
                      <td>amazon.com</td>
                      <td>202</td>
                      <td>202</td>
                      <td>已接受，但未返回页面</td>
                    </tr>
                    <tr>
                      <td>zeit.de</td>
                      <td>403</td>
                      <td>200</td>
                      <td>只拒绝了爬虫</td>
                    </tr>
                    <tr>
                      <td>openai.com</td>
                      <td>403</td>
                      <td>200</td>
                      <td>只拒绝了爬虫</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>每个状态码在这里到底意味着什么？</h2>
              <p>
                五个状态码里，四个描述的是一堵墙，一个描述的是对扫描器的限制。它们不能互换，对应的修法也各不相同。403
                是最主要的回答：九行中有<strong>五行</strong>（<strong>56%</strong>）返回了禁止访问。
              </p>
              <ul>
                <li>
                  <strong>401——需要身份验证。</strong>{" "}
                  服务器在回答之前要求提供凭据。付费墙或私有源站会产生这个状态码。
                </li>
                <li>
                  <strong>403——禁止访问。</strong>{" "}
                  服务器理解了请求，并拒绝了它。这是 bot 防护最常见的形态，也是最常掩盖可修复配置的那个状态码。
                </li>
                <li>
                  <strong>429——请求过多。</strong>{" "}
                  这一个说的是扫描器，不是站点：请求速率被限制了，所以这是一个限制，而不是对页面的评判。它按原样发布，而不是被丢掉。
                </li>
                <li>
                  <strong>202——已接受，但没有页面。</strong>{" "}
                  202 是一种确认，不是一份文档。没有任何东西可以评分，所以它被标记为中止，而不是按内容单薄来评分。
                </li>
                <li>
                  <strong>520——非标准的边缘错误。</strong>{" "}
                  它由 Cloudflare 在源站返回了边缘无法使用的内容时发出。这是未能回答，而不是一个回答。
                </li>
              </ul>

              <h2>为什么 403 还会有一个分数？</h2>
              <p>
                因为报告必须展示发生了什么，而一个缺失的数字会把它藏起来。分数由实际返回的内容计算，会被标记为中止，并被排除在均值之外。
              </p>
              <p>
                这与研究「全部发布」的原则是同一条。这九行是样本里最有趣的部分：它们说明，在一份知名站点名单里，有{" "}
                <strong>30%</strong> 的站点第一次请求时不会被爬虫读取；也说明一个悄悄丢掉这些行的工具，会报告一个关于更小世界的漂亮数字。
              </p>

              <h2>「拒绝」和「屏蔽」有什么区别？</h2>
              <p>
                拒绝是指同一个 URL 对浏览器形式的请求正常提供服务，却把爬虫形式的请求拒之门外。屏蔽是指爬虫未被接纳，原因可能是一条{" "}
                <code>robots.txt</code> 规则，也可能是那次拒绝。
              </p>
              <p>
                这个区分值得保留，因为它是可以证明的。Zeit 和 OpenAI
                是扫描能够证明这一点的两行：完全相同的 URL 对一个 user-agent 返回 200，对另一个返回
                403。表里其余每一次拒绝，都是一堵对所有人都适用的墙；把它叫作爬虫屏蔽，只会是假设，而不是观察。
              </p>

              <h2>这项排除如何改变研究的均值？</h2>
              <p>
                它把均值从 44 移到 62。把那九个当作 0 分，会把它们加进分母，却不加它们得到的 142
                分，于是均值下降了 18。
              </p>
              <p>
                两个数字都是对同一张表做算术。但只有一个是在陈述网站。一个 403
                页面没有词数、没有标题，也没有实体标记；给它评 0 分，等于说「没有文档」就是「文档做得很糟」。
              </p>

              <h2>如果我自己扫描也返回错误，该怎么办？</h2>
              <p>
                先读状态码，再读分数。非 200 是配置问题，再多内容工作也挪不动它。
              </p>
              <ol>
                <li>
                  检查是否有 bot 防护规则在向扫描器发送的 user-agent 返回 403。{" "}
                  <Link href="/zh/docs/allow-ai-crawlers/">爬虫指南</Link>列出了这些名字。
                </li>
                <li>
                  如果站点在登录或付费墙之后，扫描就看不到它，这个数字也不是关于你的内容的。
                </li>
                <li>
                  如果状态码是 429，等一等再重跑。那只是一个限制，重跑就是全部的修法。
                </li>
                <li>
                  一旦返回 200，分数就变成了一份待改清单。在那之前，它只是一份关于门的报告。
                </li>
              </ol>

              <h2>为什么发布失败，而不是只发布成功？</h2>
              <p>
                因为一个只报告自己能读到什么的样本，是一个由可访问性筛选出来的样本，而筛选本身就是发现。这九次拒绝就是证据：即使对知名域名来说，爬虫访问也不是走过场。
              </p>
              <p>
                它也让方法保持一种读者可以审计的诚实：每一行，包括那些让结果变差的行，都在{" "}
                <Link href="/study/data/" hrefLang="en">
                  研究数据端点（英文）
                </Link>；产生这些分数的规则集，则在{" "}
                <Link href="/zh/methodology/">方法论页面</Link>上。
              </p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block keep the shell's 15px
                measure rather than inheriting the 17px body copy. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="关于这九个首页的问题" items={FAQ_ITEMS} level="h3" />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本文的每一个数字都来自已发布的研究，或来自扫描器执行的规则集；两者都有链接，也都可以重跑。"
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — LLMention 维护者
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                我构建并维护
                LLMention：扫描器、规则集，以及它背后的研究。这些工作以源代码形式发布，所以方法可以被检查，而不是只能被信任。
              </p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link
                  href={AUTHOR.path}
                  hrefLang="en"
                  className="text-[var(--accent)] hover:opacity-75"
                >
                  这个站点是如何撰写和获得资助的（英文） →
                </Link>
              </p>
            </div>

            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">继续阅读</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/zh/blog/six-news-publishers-blocking-ai-crawlers/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    六家新闻出版商，六家屏蔽 AI 爬虫
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    这九行里有三行是新闻出版商，那篇文章解释了它们在拒绝什么。
                  </p>
                </li>
                <li>
                  <Link
                    href="/zh/blog/thirty-homepages-none-graded-a/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    我们扫描了 30 个首页，没有一个拿到 A
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    这项排除所改变的分布，以及为什么头条数字不是 44。
                  </p>
                </li>
              </ul>
            </div>

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
