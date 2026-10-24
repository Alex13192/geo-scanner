import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { INSIGHTS, insightsForLocale, type InsightCategory } from "@/lib/insights";

/**
 * `/zh/blog/` - the writing index, in Chinese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. Writing the Japanese archive into `page.tsx` would have deleted this one, and one
 * URL pattern cannot have two route files. `page.tsx` keeps the locale guard, the static
 * params and the per-locale canonical; this module keeps the body and the strings metadata
 * reads, so a title cannot describe a page whose heading says something else.
 *
 * WHY THE CARDS ARE BUILT FROM `INSIGHTS` PLUS A LOCAL COPY TABLE, RATHER THAN A SECOND
 * ARRAY: the English index maps the registry so the order, dates and figures cannot drift
 * from `app/sitemap.ts` or from each article's own metadata. A translated array would be a
 * second list of six entries, and the first time one of them was edited the two archives
 * would disagree about what is published. Slugs, dates and figures stay in `INSIGHTS`; only
 * the strings a reader reads live below, and a missing key throws at import time instead of
 * rendering a card with no title.
 *
 * WHY EVERY CARD POINTS AT `/zh/blog/...`: the writing is translated into English,
 * Chinese and Japanese, and `app/sitemap.ts` already claims the zh-Hans alternate for all six
 * slugs. Linking the English original from here would send a Chinese reader to the page whose
 * hreflang pair says a Chinese version exists.
 *
 * WHY THE CARDS KEEP `0 of 30` AND `3.3 / 100` AS PUBLISHED: those are the study's numbers,
 * not prose. Printing the same figure two ways across the locales of one archive is the kind
 * of drift this page exists to prevent, so only the label under each figure is translated. The
 * dates are ISO for the same reason: `formatDate` prints English month names.
 *
 * The text below is the original Chinese body unchanged; only the route-level exports moved to
 * `page.tsx`.
 */
export const TITLE = "博客:测量 AI 搜索的笔记";
export const DESCRIPTION =
  "30 站研究发现了什么、规则在实践中如何失效，以及这套方法拒绝声称什么。来自运行扫描的人的第一手写作。";

type CardCopy = {
  title: string;
  dek: string;
  figureLabel: string;
};

/**
 * The translated card copy, keyed by the slug the registry already owns.
 *
 * WHY THESE STRINGS ARE COPIED FROM EACH ARTICLE'S TITLE BAND RATHER THAN TRANSLATED AGAIN
 * HERE: on the English site the card and the article print the same registry fields, so a
 * reader who clicks a card sees the title and dek they just read. Two independent
 * translations would drift the moment either was polished, and the drift would be invisible
 * because both would still be defensible Chinese. The figures and dates come from the
 * registry; the title and dek here are kept identical to each page's own constants.
 *
 * The figure label is translated but the figure itself is not - see the file comment.
 */
const CARD_COPY: Record<string, CardCopy> = {
  "thirty-homepages-none-graded-a": {
    title: "我们扫描了 30 个首页，没有一个拿到 A",
    dek: "这项研究里有一个数字人人都在引用，另外四个却很少被提起。这一篇讲的是它们背后的分布，包括那 9 行根本没有产出页面的记录。",
    figureLabel: "评分为 A",
  },
  "six-news-publishers-blocking-ai-crawlers": {
    title: "六家新闻出版商，六家屏蔽 AI 爬虫",
    dek: "样本里的每一家新闻媒体都拒绝了 ChatGPT、Claude、Perplexity 和豆包背后至少一个爬虫。这是一个有可测量代价的策略选择，而且它未必是错的。",
    figureLabel: "新闻站点屏蔽了爬虫",
  },
  "nine-homepages-never-answered": {
    title: "九个首页从未回应爬虫",
    dek: "403 不是一个页面。研究里有九行描述的是错误响应，而不是站点；把它们当作 0 计入，会得出一个更耸动、也更不真实的数字。",
    figureLabel: "以错误响应作答",
  },
  "entity-markup-gap": {
    title: "30 个站点里有 22 个让 AI 猜它们是谁",
    dek: "一个无法把名字绑定到域名的模型只能靠猜，而猜测不是引用。修复它的标记只有四行 JSON，而样本里大多数站点并没有。",
    figureLabel: "未声明实体",
  },
  "llms-txt-what-the-evidence-supports": {
    title: "llms.txt：证据究竟支持什么",
    dek: "这个文件加进去很容易，要把它当成一根杠杆却很难说得通。本文讲为什么仍然值得发布一个，也讲为什么不该假装它比实际更重要。",
    figureLabel: "最多可争取的分数",
  },
  "reading-a-failed-check": {
    title: "如何读懂一次未通过的检查，并修对地方",
    dek: "大多数糟糕的修复，都源于把一次失败当成一条指令。规则页正是为此写明每条检查不测什么；本文讲的就是怎么用这一点。",
    figureLabel: "在你动手改写之前",
  },
};

/** The registry's three categories, as the badge prints them. */
const CATEGORY_ZH: Record<InsightCategory, string> = {
  Study: "研究",
  Method: "方法",
  Explainer: "解读",
};

/**
 * A missing translation must fail the build rather than render a blank card.
 *
 * Typed as a lookup on `string` on purpose: the registry's slug is a string, and adding a
 * seventh piece to `lib/insights.ts` should surface here as a build error naming the slug,
 * not as a page that silently omits a title.
 */
function cardCopy(slug: string): CardCopy {
  const copy = CARD_COPY[slug];
  if (!copy) {
    throw new Error(
      `No Chinese index copy for "${slug}". Add it to CARD_COPY in app/(locales)/[locale]/blog/page.tsx.`
    );
  }
  return copy;
}

export default function ChineseInsightsIndexPage() {
  const dict = getDictionary("zh");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        {/* Full-bleed title band, matching the English index: the colour step marks the top. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                写作
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                来自扫描器背后那次运行的六篇文章：没人引用的那个分布、那九个从未回应的首页、样本中大多数站点都存在的标记缺口，以及两条本站不会假装比它们实际更强的规则。
              </p>
              {/*
                The English index prints "Published 18 October 2026 · by Alex". The date stays
                the same ISO value the registry holds, and the author link stays English
                because /author/ is not translated yet - the label says so.
              */}
              <p className="font-mono text-xs text-[var(--ink-3)]">
                <time dateTime="2026-10-18">发布于 2026-10-18</time> · 作者{" "}
                <Link
                  href={AUTHOR.path}
                  hrefLang="en"
                  className="text-[var(--accent)] hover:opacity-75"
                >
                  {AUTHOR.name}
                </Link>
                （英文）
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {insightsForLocale("zh").map((insight) => {
                const copy = cardCopy(insight.slug);
                return (
                  <Link
                    key={insight.slug}
                    href={`/zh/blog/${insight.slug}/`}
                    hrefLang="zh-Hans"
                    className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 transition-colors hover:border-blue-500/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono font-semibold text-[var(--accent)]">
                        {CATEGORY_ZH[insight.category]}
                      </span>
                      <span className="font-mono text-[var(--ink-3)]">
                        <time dateTime={insight.published}>{insight.published}</time>
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug tracking-tight">
                      {copy.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--ink-2)]">{copy.dek}</p>
                    <div className="mt-auto flex items-end justify-between border-t border-[var(--line)] pt-4">
                      <span className="font-mono text-2xl font-semibold text-[var(--ink-1)]">
                        {insight.figure}
                      </span>
                      <span className="text-right text-xs leading-tight text-[var(--ink-3)]">
                        {copy.figureLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Prose under the grid, bounded to the same measure as the articles themselves. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-6 text-[16px] leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                这里发布什么？
              </h2>
              <p>
                第一手写作：来自 30 站研究的测量数据、对那些以值得解释的方式失效的规则的说明，以及一份记录——这套方法在哪些地方比它看起来更弱。这里没有新闻稿，没有赞助内容，也没有哪一篇是为了填满日历而写的。
              </p>
              <p>
                标准只有一句话：<strong>删掉这篇文章，然后问读者失去了什么</strong>
                。如果答案是一个他们在别处拿不到的数字，或者一个他们可以自己执行的步骤，它就留下。如果答案是什么都没有，它就不会被发布——这就是为什么这里有六篇，而不是三十篇。
              </p>
              <p>
                这个档案所依据的数字，全部来自对 30 个首页的一次运行：
                <strong>53%</strong> 被评为 F，<strong>7%</strong> 达到 B，
                <strong>30%</strong> 根本没有回应爬虫，<strong>27%</strong> 声明了实体，
                <strong>63%</strong> 既没有实体也没有 <code>sameAs</code>{" "}
                列表。下面每一篇都会链到它出自的那些数据行，而这些数据行可以重新扫描。
              </p>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                每一篇是怎么做出来的？
              </h2>
              <p>
                每一篇文章都建立在可以重新运行的数据之上。研究数据行来自扫描器本身，规则权重来自已公布的目录，局限来自附在每条规则上的备注。
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-xl border border-[var(--line)] text-sm">
                  <thead className="bg-[var(--surface-1)] text-[var(--ink-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">文章</th>
                      <th className="px-4 py-3 text-left font-semibold">依据的数据</th>
                      <th className="px-4 py-3 text-left font-semibold">对应的规则</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">30 个分数的分布</td>
                      <td className="px-4 py-3 align-top">已公布的研究数据行</td>
                      <td className="px-4 py-3 align-top">全部 40 项，按维度分组</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">新闻出版商</td>
                      <td className="px-4 py-3 align-top">六行数据、它们的状态码与 robots</td>
                      <td className="px-4 py-3 align-top">爬虫可通行性</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">那九个从未回应的首页</td>
                      <td className="px-4 py-3 align-top">状态码与浏览器状态码配对</td>
                      <td className="px-4 py-3 align-top">测量防护</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">实体缺口</td>
                      <td className="px-4 py-3 align-top">整个样本的两个布尔字段</td>
                      <td className="px-4 py-3 align-top">实体与 sameAs</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">llms.txt 与证据</td>
                      <td className="px-4 py-3 align-top">权重算法</td>
                      <td className="px-4 py-3 align-top">上下文文件</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">读懂一次未通过的检查</td>
                      <td className="px-4 py-3 align-top">规则页及其备注</td>
                      <td className="px-4 py-3 align-top">已公布的局限</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                什么不会出现在这里？
              </h2>
              <ul>
                <li>
                  <strong>赞助文章。</strong>
                  这里没有付费投放，厂商也不能靠买一份报告来买到一个提及。
                </li>
                <li>
                  <strong>没有来源的数字。</strong>
                  一个无法追溯到研究或可重新运行的扫描的数字不会被写进去，无论它听起来多可信。
                </li>
                <li>
                  <strong>装扮成测量的预测。</strong>
                  扫描器不会就你的品牌去询问模型，所以关于它的文章也不会。
                </li>
                <li>
                  <strong>为数量而数量。</strong>
                  发布计划是一个发布的承诺，而一个靠降低标准来兑现它的站点，实际发布的东西比它看起来的要少。
                </li>
              </ul>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                遇到我不同意的文章，该怎么读？
              </h2>
              <p>
                把检查项、URL 和扫描报告的结果发给我们。一个点名了具体规则的分歧，是这个项目收到的最有用的消息，而方法之所以公开，正是为了让分歧可以具体。
              </p>
              <p>
                写作是如何产生、更正和资助的，写在
                <Link href={AUTHOR.path} hrefLang="en">
                  作者页面
                </Link>
                （英文）上。完整的规则集在
                <Link href="/zh/checks/">检查项参考</Link>
                ，算法在
                <Link href="/zh/methodology/">方法论页面</Link>。
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于写作的问题"
                items={[
                  {
                    q: "这是一个博客吗？",
                    a: "这是一个第一手笔记的档案：研究结果、规则说明和明确写出的局限。更新节奏目标为每两三天一篇；每一篇背后仍要有一次测量——不是新闻流，也没有赞助内容。",
                  },
                  {
                    q: "我可以引用其中的文章吗？",
                    a: "可以，请注明出处并附上链接。只引一个数字而不交代它来自哪个样本，正是这个档案写作时想要让人更难做到的事，所以请连同承载这个数字的那句话和它的来源一起取用。",
                  },
                  {
                    q: "这些文章经过同行评审吗？",
                    a: "没有，把它们说成经过同行评审是不实的。它们对照已公布的数据和规则目录进行核查，每一篇都会说明自己的方法在哪些地方比它看起来更弱。",
                  },
                ]}
              />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="这个档案所讨论的权重遵循已发表的研究，而不是个人偏好；每个数字背后的研究数据行都已公布，并且可以重新运行。"
              />
            </div>
          </div>
        </section>
      </main>

      {/* The same target every localized page uses: switching language leaves a deep page
          for that language's home rather than an untranslated neighbour. */}
      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
