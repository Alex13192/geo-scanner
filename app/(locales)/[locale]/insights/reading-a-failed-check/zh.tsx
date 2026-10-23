/**
 * `/zh/insights/reading-a-failed-check/` - "How to read a failed check", in Chinese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which
 * one to render. Writing the Japanese version into `page.tsx` would have deleted the
 * Chinese essay that already ranks for this URL; two route files cannot exist on one URL
 * pattern, so `ja.tsx` holds the Japanese translation of the English original and this
 * file holds the Chinese body unchanged.
 *
 * WHY THIS REBUILDS PostShell's SHELL INSTEAD OF USING IT: PostShell renders SiteNav,
 * PageFooter and the English `/insights/` back-link, so a Chinese reader would get English
 * navigation and be sent to the English archive by the one link that exists to orient them.
 * The shell is rebuilt from LocaleHeader/LocaleFooter with the same `band` / `wrap` /
 * `doc-article` classes, and keeps every section PostShell renders - byline, FAQ, evidence,
 * author card, "read next", scan CTA - so the two language versions are the same article.
 *
 * WHAT IS TRANSLATED: prose, headings, the table, the FAQ, the notes around the evidence
 * block, the author card and the related links.
 * WHAT IS NOT: `robots.txt`, `blockquote`, the HTTP status codes, the four rule names in the
 * table and the Evidence quotation. The codes and identifiers are the subject matter, and
 * the quotation is a sentence from a paper - translating it would change what the source
 * says while still presenting it as a quotation. Every number and percentage is identical
 * to the English page, because the argument is about those numbers.
 *
 * THE DATE IS PRINTED AS AN ISO STRING rather than through formatDate(), which emits English
 * month names, and it is read from lib/insights.ts so it cannot drift from the English page.
 *
 * TITLE and DESCRIPTION are exported so the route's generateMetadata reads the same strings
 * the page prints: a canonical that describes a different page from the one rendered is the
 * failure this split avoids. Everything below the constants is the original Chinese body,
 * moved here unchanged.
 */
import Link from "next/link";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInsight } from "@/lib/insights";

const insight = getInsight("reading-a-failed-check");

export const TITLE = "如何读懂一次未通过的检查，并修对地方";
export const DESCRIPTION =
  "一条未通过的检查是对你页面的一个判断，不是判决。在你动手改写任何东西之前该问的三个问题，附扫描器里的真实例子。";
const DEK =
  "大多数糟糕的修复，都源于把一次失败当成一条指令。规则页正是为此写明每条检查不测什么；本文讲的就是怎么用这一点。";
const CATEGORY = "方法";

/* lib/insights.ts stores readTime as an English sentence ("7 min read"); taking the number
   from it keeps this byline and the English one from reporting different reading times. */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

/* Translations of AUTHOR.role and AUTHOR.bio from lib/author.ts, kept beside the page that
   prints them so a change there is visible here. */
const AUTHOR_ROLE_ZH = "LLMention 维护者";
const AUTHOR_BIO_ZH =
  "我构建并维护 LLMention：扫描器、规则集，以及它背后的那项研究。这些工作以源码形式发布，所以方法可以被核查，而不必凭空相信。";

export default function ChineseReadingAFailedCheckPage() {
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
        {/* Full-bleed title band: the same colour step and geometry as the English article. */}
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
              {/* The author page is English, so the link says so instead of switching language
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
            {/* 17px body copy at the same 768px measure the English page uses. */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                一次未通过的检查，是关于你页面的一个判断，而不是一条指令。本站的规则页正是为此公布四件事：
                扫描器测试的条件、失败意味着什么、这项检查不测什么，以及针对每一种失败方式的修复办法。
                动手修改之前先读其中三件，决定了你是在修复还是在重写。
              </p>
              <p>
                失败本身也值得一个数字作为背景。在针对 30 个首页的研究里，<strong>53%</strong> 被评为
                F，<strong>7%</strong> 达到 B，而几乎每一个低分，都来自若干条互不相关的规则同时失败，
                而不是来自某一个灾难性的问题。
              </p>

              <h2>一次未通过的检查到底告诉了我什么？</h2>
              <p>
                它告诉你某一个条件没有被满足，并附上扫描器测试时看到的证据。它不告诉你原因，
                也不告诉你该怎么修——那是规则页上另外的句子。
              </p>
              <p>
                每条规则页都是同样的结构：这项检查看什么、失败意味着什么、修复步骤，
                以及一段说明这项检查不测什么。最后一段最有用，也最常被跳过。规则正是在这里承认自己数的是
                存在与否，而不是质量——引用规则对任何 <code>blockquote</code> 都算通过，
                实体规则对任何已声明的类型都算通过。
              </p>

              <h2>这项检查适用于我这样的页面吗？</h2>
              <p>
                通常适用，但并不总是。扫描器有页面类型的豁免，报告会给出一个「不适用」的检查数量，
                而不是悄悄把它们记成零分。
              </p>
              <p>
                字数是最清楚的例子。法律页或联系页不会承载 800 词的正文，用内容页的篇幅去要求它，
                测到的是页面类型，而不是写作。如果一条规则出现在你的列表里，说明它适用；
                如果报告说某项检查不适用，那么为了满足它而删掉内容，就是对一个从未发生的失败做出的错误反应。
              </p>

              <h2>这个数字说的是我的页面，还是那个响应？</h2>
              <p>
                先看状态码。401、403、429、202 或 520 意味着这个分数描述的是一个错误响应，
                内容上的功夫无法改变它。
              </p>
              <p>
                这不是假设：在那项研究里，<strong>30%</strong> 的首页从未产出一个页面，
                它们的分数衡量的是拒绝本身。扫描器把它们标记为中止，并将它们排除在均值之外，
                但那个数字仍然印在域名旁边，所以读者必须知道自己在看的是哪一类数字。
                专门写那九行的那篇文章，把每个状态码逐个过了一遍。
              </p>

              <h2>它要的是真正的改进，还是凑出来的数字？</h2>
              <p>
                有时候它要的就是一个数字。字数规则在 800 词时通过，300 到 799 词之间算部分通过，
                所以一个 796 词的页面，就因为差四个词没到门槛而丢分。
              </p>
              <p>
                诚实的做法，要么是多讲一些值得讲的内容，要么是接受部分通过。不诚实的做法是填充，
                而它比丢掉那几分更糟：一个察觉到注水的读者，对页面其余部分的信任会降低；
                而后面那些规则——答案前置、可提取内容、引用——只在真正说了些什么的文字上才起作用。
              </p>
              <p>
                本站就发布了一个未能通过自己字数规则的页面，而不是去填充它，并且在规则页的说明里
                写明了这一点。这是把同一笔取舍公开说出来，而这也是读者唯一能核查的版本。
              </p>

              <h2>好的修复和坏的修复分别是什么样？</h2>
              <p>
                坏的修复满足条件。好的修复满足条件存在的理由，然后条件自然就满足了。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>失败</th>
                      <th>满足规则的修复</th>
                      <th>满足理由的修复</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>字数在 740 词处部分通过</td>
                      <td>补 60 词的重复表述</td>
                      <td>补上读者一直在要的完整示例</td>
                    </tr>
                    <tr>
                      <td>爬虫 user-agent 被禁止</td>
                      <td>在 robots.txt 里加一行 Allow</td>
                      <td>检查 CDN，因为防火墙可能仍然返回 403</td>
                    </tr>
                    <tr>
                      <td>页面上没有引文</td>
                      <td>引用本页自己的一句话</td>
                      <td>引用这个说法所依据的第一手来源</td>
                    </tr>
                    <tr>
                      <td>没有 Markdown 替代版本</td>
                      <td>手写一个一个月内就会漂移的孪生版本</td>
                      <td>从同一份来源生成它，或者接受这一项缺失</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                最后一行就是本站自己的例子。首页没有 Markdown 孪生版本，这项检查失败，
                而本站选择公布这次失败，而不是放宽规则，或者写一份六周后就会与它所镜像的页面
                互相矛盾的副本。一条作者无法诚实满足的规则，是关于这条规则的证据，
                它应该写进说明里，而不是绕过去。
              </p>

              <h2>什么时候应该忽略一次未通过的检查？</h2>
              <p>
                三种情况，而且都应该写下来：规则不适用、这笔取舍是有意为之，或者修复的成本
                超过那几分的价值。
              </p>
              <ul>
                <li>
                  <strong>它不适用。</strong>规则的豁免页面类型，或者这条规则测的是你的站点
                  没有理由携带的信号。报告会说明是哪种。
                </li>
                <li>
                  <strong>这笔取舍是有意为之。</strong>屏蔽一个 AI 爬虫是政策决定；
                  一个有意做出这个决定的站点，应当预期分数会下降，也不应该为了把分数找回来
                  而撤销政策。
                </li>
                <li>
                  <strong>修复的成本超过它带来的收益。</strong>一条权重 2%、需要一周工作的规则，
                  不会紧接着排在一条权重 16%、只需要一个下午的规则之后。权重是公开的，
                  所以这个比较可以在动手之前做。
                </li>
              </ul>

              <h2>怎么才能不把同一件事修两遍？</h2>
              <p>
                改完之后重新扫描，然后比较失败列表，而不是比较分数。分数会因为好几个原因同时变动；
                列表才是你实际改动的东西。
              </p>
              <p>
                如果修复是真的，规则会从列表里消失，并且不再回来。如果只是填充，
                那么页面下一次变动时它往往会重新出现——这是反对填充的一条务实论据，
                与任何人对它的看法无关。
              </p>
              <p>
                每条规则都发布在 <Link href="/zh/checks/">检查参考</Link>里，一页一条，
                附有它的权重和它自己声明的局限；全部 40 条的算术在{" "}
                <Link href="/zh/methodology/">方法页</Link>上。
              </p>
            </article>

            {/*
              Outside the article, so the FAQ and the evidence block keep the 15px measure they
              have on the English page instead of inheriting the article's 17px.
            */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于读懂一次失败的问题"
                items={[
                  {
                    q: "每一条未通过的检查我都该修吗？",
                    a: "不该。有些规则不适用于某些页面类型，有些规则带来的分数低于修改的成本，还有一两条是有意为之的取舍。一次失败是关于页面的一个判断；要不要因此动手，是一个有代价的决定。",
                  },
                  {
                    q: "怎样才能最快分辨真实的失败和测量假象？",
                    a: "读状态码和证据那一行。非 200 的状态意味着这个数字描述的是响应；一行点名了扫描器看到了什么的证据，则告诉你这条规则是否被应用到了你以为的那个东西上。",
                  },
                  {
                    q: "部分通过重要吗？",
                    a: "有时候重要。部分通过是留在桌上的分数，不是失败，而且每条规则的算术都是公开的。当缺的那几分容易拿时它重要；当唯一的拿法就是填充时，它不重要。",
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

            {/* The author card from PostShell, translated because its whole job is to tell this
                reader who wrote the piece. */}
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
                    href="/zh/insights/llms-txt-what-the-evidence-supports/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    llms.txt：证据究竟支持什么
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    就是这条规则：诚实的答案是发布这个文件，然后不再对它抱有更多期待。
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
                    就是这条规则：诚实的答案是去干活——标记本身很便宜，而缺口覆盖了样本的大多数。
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
