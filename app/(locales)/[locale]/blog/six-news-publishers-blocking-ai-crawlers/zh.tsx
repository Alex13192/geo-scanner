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
 * `/zh/blog/six-news-publishers-blocking-ai-crawlers/` - the news-publisher piece, in Chinese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only route would have deleted the Chinese essay that already ranks
 * here; two route files cannot answer one URL pattern. The route keeps
 * `generateStaticParams`, `generateMetadata` and the zh/ja branch, and imports TITLE and
 * DESCRIPTION from this module so its canonical can never describe a page whose heading says
 * something else.
 *
 * WHY THIS REBUILDS THE ENGLISH SHELL INSTEAD OF USING PostShell: PostShell renders SiteNav and
 * PageFooter, whose strings are English, and it reads title, dek and reading time from
 * lib/insights.ts, which carries the English copy. LocaleHeader/LocaleFooter are the only chrome
 * that keeps the language switcher on a Chinese page, so the band, byline, FAQ, evidence block,
 * author card and related links are rebuilt here with the same order and classes as the
 * English shell.
 *
 * WHY TITLE AND DESCRIPTION ARE AUTHORED HERE: the registry in lib/insights.ts holds the English
 * metadata. The Chinese strings are translations of it; the publication date and reading time
 * are imported rather than retyped, so the two language versions cannot disagree about when the
 * piece was published.
 *
 * WHAT STAYS ENGLISH: every domain, status code, score, percentage, crawler user-agent name,
 * robots.txt fragment, `blocked` / `refused` field name and the paper quotation. Those are the
 * data and the technical vocabulary the piece turns on - translating them would make the
 * examples unverifiable.
 *
 * WHY THE LINKS ARE MIXED: /docs/allow-ai-crawlers/ and the two related pieces have Chinese
 * versions and are linked in Chinese. The author page does not, so that link keeps
 * hrefLang="en" and the （英文） marker that tells a reader they are leaving the translation.
 *
 * The text below is the original Chinese body, moved here byte-for-byte. Only the component
 * signature lost its params/notFound guard, which the route now owns.
 */
export const TITLE = "六家新闻出版商，六家屏蔽 AI 爬虫";
export const DESCRIPTION =
  "我们研究中的六家新闻站点全部禁止了至少一个 AI 爬虫。实测分数、对应的 robots.txt 行，以及它们正在做的取舍。";

const insight = getInsight("six-news-publishers-blocking-ai-crawlers");

/** Built from the slug, because a second literal would drift from the registry one day. */
const EN_PATH = insightPath(insight.slug);
const ZH_PATH = `/zh${EN_PATH}`;

/**
 * The registry stores "8 min read", which a Chinese byline cannot print. Parsing the number
 * keeps the reading time in one place, so a changed value still moves both pages together.
 */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

export default function ChineseSixNewsPublishersPage() {
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
            href="/zh/blog/"
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
                样本里的每一家新闻出版商都拒绝了 ChatGPT、Claude、Perplexity 和豆包背后至少一个爬虫。这是一个有可测量代价的策略选择，而且它未必是错的。
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
                {insight.updated ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>更新于 {insight.updated}</span>
                  </>
                ) : null}
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
              <p>研究中的 30 个首页里有 6 个是新闻出版商——占样本的 <strong>20%</strong>——而且每一个都至少拒绝了一个被追踪的 AI 爬虫。6 个里有 3 个在 <code>robots.txt</code> 中禁止这些爬虫，但页面照常返回；第 4 个在边缘层拒绝爬虫，却把同一个 URL 正常返回给浏览器；还有 2 个对所有请求——无论来自爬虫还是浏览器——都以 401 或 403 回应。</p>
              <p>新闻这一半也是这个更大发现里最密集的部分：30 个站点中有 <strong>9 个</strong>（<strong>30%</strong>）屏蔽了至少一个被追踪的爬虫，而 6 家新闻站点全部在其中。</p>
              <p>有意思的问题不是它们是否屏蔽——它们显然屏蔽了——而是这种屏蔽在这套测量里让它们付出了什么，以及这个代价是不是一个错误。对一家正在谈内容授权的出版商来说，它可能是谈判的代价。对一个从来没有过这种对话的站点来说，它通常只是一个没人看过的设置。</p>

              <h2>是哪 6 家出版商，各自返回了什么？</h2>
              <p>3 家返回 200，并在 <code>robots.txt</code> 中禁止了一个被追踪的爬虫。1 家对爬虫返回 403、对浏览器返回 200。2 家对所有请求都返回 401 或 403。</p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>首页</th>
                      <th>返回状态</th>
                      <th>是否放行被追踪的爬虫？</th>
                      <th>分数</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>bbc.com</td>
                      <td>200</td>
                      <td>否——robots.txt</td>
                      <td>61</td>
                    </tr>
                    <tr>
                      <td>spiegel.de</td>
                      <td>200</td>
                      <td>否——robots.txt</td>
                      <td>56</td>
                    </tr>
                    <tr>
                      <td>theguardian.com</td>
                      <td>200</td>
                      <td>否——robots.txt</td>
                      <td>47</td>
                    </tr>
                    <tr>
                      <td>zeit.de</td>
                      <td>对爬虫 403，对浏览器 200</td>
                      <td>否——在边缘层被拒绝</td>
                      <td>26</td>
                    </tr>
                    <tr>
                      <td>nytimes.com</td>
                      <td>403</td>
                      <td>否——robots.txt</td>
                      <td>12</td>
                    </tr>
                    <tr>
                      <td>reuters.com</td>
                      <td>401</td>
                      <td>否——robots.txt</td>
                      <td>12</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>6 家里有 3 家在策略层拒绝，同时仍然返回页面。Zeit 在边缘层拒绝，这是更难的一种：没有任何 <code>robots.txt</code> 行能表达它，也没有爬虫能就它进行协商。最后 2 家不对任何人返回页面，所以它们的分数描述的是拒绝，而不是页面。</p>

              <h2>策略性屏蔽和直接拒绝有什么区别？</h2>
              <p>策略性屏蔽是一种声明。页面照常返回，<code>robots.txt</code> 写明哪些 agent 不得使用它，行为规范的爬虫会遵守。</p>
              <p>直接拒绝是一堵墙。服务器对请求本身返回 401、403 或 429，所以爬虫永远看不到内容，也根本没有机会考虑那条策略。扫描器把它们保留为两个字段——<code>blocked</code> 和 <code>refused</code>——因为它们需要相反的修法。一个是改一行；另一个是 CDN 或 WAF 配置里的一条规则，而且往往在另一个系统里、由另一个团队维护。</p>
              <p>Zeit 是第二种的干净例子：同一个 URL 对「浏览器形状」的请求返回 200，对「爬虫形状」的请求返回 403。这是一个发生在 <code>robots.txt</code> 起作用之前的屏蔽，也是样本里唯一一个可以从外部证明的配置——只需要改变 user-agent，别的什么都不用动。</p>

              <h2>在这套测量里，屏蔽让一家出版商付出多少？</h2>
              <p>被追踪爬虫这条规则属于「AI 爬虫访问」，也就是最重的维度，占总分的 16%。一个拒绝了某个被追踪爬虫的站点无法完整通过这个维度，所以在考虑内容之前，它的总分上限就已经下降了。作为参照：内容深度值 11%，信任值 10%，所以一次屏蔽的代价超过整个内容维度的分值。</p>
              <p>测量到的效果是看得见的：返回了页面的 3 家出版商分别得到 61、56 和 47 分，都低于研究中「作出回应的站点」的 62 分平均。这不是因果关系的证明——这是 3 个大型、复杂的首页，它们在其他检查上也没有通过——但它与「这是一种结构性而非编辑性的扣分」相符。</p>

              <h2>屏蔽这些爬虫是个错误吗？</h2>
              <p>对大型出版商来说，大概不是，而且这也不是本站该下的判断。六分之六是一个模式，而不是 6 次巧合，但一次首页扫描分不清「授权策略」和「付费墙」、「bot 防护规则」或「从模板抄来的 robots 文件」。</p>
              <p>这笔交换是看得清的。能被 ChatGPT、Claude、Perplexity 和豆包读取，是一家出版商被引用的方式，而一次引用就是一个分发渠道。把爬虫拒之门外，是用这个渠道去换授权谈判中的筹码；如果根本不存在谈判，那就是用它换了什么都没有。某个站点处在哪种情况，不是扫描能看见的。</p>
              <p>对其他所有人来说，真正重要的区分是：一个屏蔽了这些爬虫的小站点，通常并不是在执行授权策略。它抄了一个模板，继承了一条 WAF 规则，或者在某个抓取事件里加了一条「全站禁止 bot」的规则，然后再没回头看过 user-agent 名单。这才是值得检查的情况，而 <Link href="/zh/docs/allow-ai-crawlers/">robots.txt 与 WAF 指南</Link> 正是逐条讲这件事的那一篇。</p>

              <h2>站点所有者应该先检查什么？</h2>
              <p>先读 <code>robots.txt</code> 里的爬虫名字，然后问一句：边缘层和它一致吗。两者可能不一致，而这种不一致在浏览器里是看不见的。</p>
              <ol>
                <li>在 <code>robots.txt</code> 里找 <code>GPTBot</code>、<code>ClaudeBot</code>、<code>PerplexityBot</code> 和 <code>Bytespider</code>。其中任何一个下面出现 <code>Disallow: /</code>，就是一次策略性屏蔽。</li>
                <li>检查是否有 bot 防护规则对这几个 user-agent 返回 403。扫描会把它报告为「拒绝」而不是「策略性屏蔽」，这是从外部区分两者的唯一办法。</li>
                <li>有意识地做决定。你主动选择、并且说得出理由的屏蔽，和一条你继承下来、解释不清的屏蔽，是两件事。</li>
              </ol>

              <h2>这是怎么测量的，这个数字又不能告诉你什么？</h2>
              <p>扫描器比较对同一个 URL 的两次请求：一次是爬虫形状的，一次是浏览器形状的。两者之间存在差异，就是「拒绝」；命中 <code>robots.txt</code> 的，就是「策略性屏蔽」；其余一切按页面正常评分。</p>
              <p>它看不见的是意图或合同。它不知道一家出版商是否签了授权协议，也不会去抓取爬虫自己的日志来核实屏蔽是否被遵守。它测量的是前门的公开状态——对于一个要在一次请求里对任何域名起作用的工具来说，这是正确的范围。</p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block do not inherit its 17px measure. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于这些新闻出版商的问题"
                level="h3"
                items={[
                  {
                    q: "屏蔽 GPTBot 和屏蔽 Google 搜索是一回事吗？",
                    a: "不是。搜索索引和 AI 爬虫控制对应不同的 user-agent，所以一家出版商可以保留搜索爬虫、同时把 AI 爬虫挡在外面。扫描器之所以分别报告每一个被追踪的爬虫，原因就在这里。",
                  },
                  {
                    q: "是屏蔽让它们的分数变低了吗？",
                    a: "部分是，而且是设计如此：被追踪爬虫这条规则属于占总分 16% 的那个维度。但这 6 家里有 3 家还向爬虫返回了错误，这意味着它们的数字衡量的是那次拒绝，而不是一个页面。",
                  },
                  {
                    q: "小站点应该照搬它们吗？",
                    a: "除非你已经决定不想要引用。一家在谈授权协议的出版商是在用覆盖面换钱；一个没有这种协议的站点是在用覆盖面换什么都没有，那是另一个决定。",
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
                    href="/zh/blog/nine-homepages-never-answered/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    九个首页从未回应爬虫
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    这 6 家当中 3 家背后的状态码，以及为什么 403 不是对一个页面的测量。
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
                    这 6 行所在的完整分布。
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
