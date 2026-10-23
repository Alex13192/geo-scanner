import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence, {
  GEO_PRIMARY_QUOTE,
  GEO_PRIMARY_SOURCES,
} from "@/app/components/Evidence";
import Faq, { type FaqItem } from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/docs/ai-visibility-self-check/` - the manual measurement method, in Chinese.
 *
 * WHY THIS PAGE IS BUILT INLINE RATHER THAN THROUGH ArticleShell: see the note on the
 * schema.org guide. The shell's chrome is English, and wrapping Chinese prose in an
 * English frame is what makes a translation read as unfinished.
 *
 * WHY THE TWENTY-QUESTION BLOCK IS LEFT IN ENGLISH: it is a fill-in template whose
 * placeholders are replaced with the reader's own words, and the guide itself says a
 * question asked in one language and the same question asked in another are two
 * different measurements. Translating the template would silently change the thing
 * being measured; the paragraph above it tells the reader to add the language their
 * buyers use.
 *
 * LINKS: translated targets point at their Chinese route; everything still English
 * points at the English route and says (英文) in the label, so a reader never lands on
 * an English page without warning.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "如何自查 AI 引擎是否提到了你的品牌";
const DESCRIPTION =
  "一份你自己就能跑完的免费自查：20 个要问的问题、给回答打分的机械规则，以及为什么只跑一次什么都证明不了。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/docs/ai-visibility-self-check/",
    languages: {
      en: "/docs/ai-visibility-self-check/",
      "zh-Hans": "/zh/docs/ai-visibility-self-check/",
      "x-default": "/docs/ai-visibility-self-check/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/docs/ai-visibility-self-check/",
    type: "article",
  }),
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "我应该多久跑一次这个检查？",
    a: "每月一次，用同一组问题。在你跑的那一天，每个问题问三遍。单个回答只是一则轶事；三个回答，加上记录的日期和模型，才是一条可以拿来对比的基线。",
  },
  {
    q: "我应该测哪个引擎？",
    a: "你的买家实际在用的那个，并且单独报告。把 ChatGPT 和 Perplexity 平均成一个数字，会掩盖它们检索方式不同这一事实——而且只有二十个问题时，两个引擎之间的差异通常是噪声，而不是一个发现。",
  },
  {
    q: "这个过程可以自动化吗？",
    a: "只能通过调用这些平台来实现。想知道 AI 引擎答了什么，没有免费的办法：你要么自己去问，要么买一个替你问的工具。这个方法就是手工去问，所以它不花钱，也所以它没法在你睡觉时运行。",
  },
];

export default async function ChineseAiVisibilitySelfCheckPage({
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

      {/* The way back to the docs index, kept as a slim strip under the header:
          a reader arriving from a search result needs it more than the menu. */}
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
                {DESCRIPTION}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  作者{" "}
                  <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    {AUTHOR.name}
                  </Link>
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-06">发布于 2026-10-06</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新于 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>阅读约 6 分钟</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <p>
                <strong>
                  你可以在一小时左右、不花钱、不用任何工具，查出 AI 引擎是否提到了你的品牌。
                </strong>
                你做不到的是：只查一次就下结论。这一页给你要问的问题、给回答打分的机械规则，
                以及把「一次测量」和「一个你讲给自己听的故事」区分开的记录纪律。
              </p>
              <p>
                开始之前先说清一件事：
                <strong>LLMention 扫描器不做这件事。</strong>
                它读取你的页面，按 40 项公开检查打分，从不向任何 AI 引擎提问。
                这是有意设定的边界，而不是缺口——测量引擎说了什么就意味着查询它，每次运行都要花钱，
                而本站不会发布自己没有测量过的说法。下面这个方法是我们推荐的替代方案；
                与其向一个说不出数字怎么来的人买一个数字，我们更愿意你自己跑一遍。
                如果你想让那六项信号由别人替你判断，
                <Link
                  href="/answer-check/"
                  hrefLang="en"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  回答检查器（英文）
                </Link>
                会把本指南的规则原样应用到你粘贴的一段回答上——在你的浏览器里运行，
                文本不会离开页面。
              </p>

              <h2>为什么一个 AI 回答算不上一次测量？</h2>
              <p>
                因为同一个问题不会两次给出同一个答案。每次运行之间有三样东西在变：
                <strong>模型版本</strong>（在不改名字的情况下被悄悄更新）、<strong>日期</strong>，
                以及<strong>会话</strong>——新开的对话和进行中的对话并不相同，个性化设置和地区
                也会改变检索到的内容。只问一次，你观察到的只是你看不见的分布里的一个样本。
              </p>
              <p>
                这就是为什么诚实的测量是要花力气的：在同一天把每个问题问三遍，报告三个结果，
                而不是一个。如果一个品牌在三个回答里只出现一次，结论是「三次里有一次」——
                而不是「33% 的用户能看到你」；后者是比率所暗示的东西，而这个样本量支撑不起它。
              </p>

              <h2>我应该问哪几类问题？</h2>
              <p>
                四类，它们测量的是不同的东西。把它们分开，是「有用的检查」和「让自己安心的检查」
                之间的区别：
              </p>
              <ul>
                <li>
                  <strong>品类问题</strong>——问题里没有品牌名。「有哪些厂商在做 X？」
                  这一类测的是触达：会不会被一个根本不知道你存在的人找到。
                </li>
                <li>
                  <strong>场景问题</strong>——一个具体问题，没有品牌名。「我怎么解决 Y？」
                  这类问题检验的是：推荐究竟是从需求推导出来的，还是从一张品类清单里挑出来的。
                </li>
                <li>
                  <strong>对比问题</strong>——你的品牌对上一个点名的替代品。它们显示你究竟能不能
                  进入候选名单，也是最常被回答成「看情况」的一类。
                </li>
                <li>
                  <strong>事实问题</strong>——直接点名你的品牌，问可以核实的信息：法定名称、
                  成立日期、产品做什么、面向谁。这类测的是准确度而不是触达，
                  而出错代价最高的也正是这里。
                </li>
              </ul>
              <p>
                看增长，盯品类问题和场景问题，因为那里的提及是你没花钱买来的。看风险，盯事实问题。
              </p>

              <h2>我应该从哪些问题开始？</h2>
              <p>
                二十个足够起步，也小到真的能做完。把方括号里的部分换成你自己的词——{" "}
                <code>[category]</code>、<code>[product type]</code>、<code>[competitor]</code>
                ——再加上你买家实际使用的语言，因为用英文问的问题和用中文问的同一个问题，
                是两次不同的测量。
              </p>
              {/* The template stays English on purpose: its placeholders are instructions
                  about what to substitute, and the questions are what the reader will
                  actually type to an engine. See the WHY note at the top of the file. */}
              <pre>{`Category (no brand name)
1.  Which companies offer [product type] for [audience]?
2.  What are the best [category] tools in 2026?
3.  Who are the main vendors in [category]?
4.  Which [product type] is suitable for [size / region / industry]?
5.  What should I look for when choosing [category]?

Scenario (a problem, no brand name)
6.  How do I solve [problem the product solves]?
7.  What is the cheapest way to [outcome]?
8.  How do teams like mine handle [workflow]?
9.  What alternatives exist when [common constraint]?
10. How do I compare [approach A] and [approach B]?

Comparison (your brand against a named one)
11. [Your brand] vs [competitor]: which is better for [use case]?
12. Is [your brand] worth it compared with [competitor]?
13. What are the disadvantages of [your brand]?
14. Which is easier to set up, [your brand] or [competitor]?
15. If I need [requirement], should I choose [your brand]?

Fact (your brand by name)
16. What does [your brand] do?
17. Who owns [your brand] and when was it founded?
18. What does [your brand] cost?
19. Which company is behind [your product name]?
20. Does [your brand] handle [specific requirement]?`}</pre>

              <h2>如何给一个回答打分？</h2>
              <p>
                六项检查，全部是机械的。它们被写成这样：两个人读同一个回答，会得到同一个判定——
                这正是结果值得记录的原因：
              </p>
              <ol>
                <li>
                  <strong>被提到</strong>——品牌名或一个已知别名出现在回答中的任何位置。
                </li>
                <li>
                  <strong>在靠前位置被提到</strong>——第一次提及大致落在前 300 个字符以内。
                  在最后一段才点你名字的回答，不是能让你浮出来的回答。
                </li>
                <li>
                  <strong>出现在候选清单里</strong>——提及落在项目符号或编号的选项列表中，
                  而不是顺带一提的段落里。读者做选择的地方是清单。
                </li>
                <li>
                  <strong>带有推荐</strong>——在提及前后约 120 个字符内出现推荐性动词：
                  <em>recommend</em>、<em>best for</em>、<em>worth considering</em>、
                  <em>a good fit</em>。没有这类词的提及只是一个名字，不是一个建议。
                </li>
                <li>
                  <strong>引用了来源</strong>——收集回答里链接到的域名。如果你自己的域名不在其中，
                  引擎就是在别处描述你，而描述方式不由你控制。
                </li>
                <li>
                  <strong>诚实的空白</strong>——对事实问题来说，「我无法确认这一点」算通过，
                  一个自信的错误答案算失败。空白可以补；一个被客户拿来反问你的错误数字，补不回来。
                </li>
              </ol>
              <p>
                每个问题记录这六项结果，而不是记录一个感觉。通常最重要的是第五项：
                来源是 AI 回答里你真正能影响的部分，也是大多数人从来不看的部分。
              </p>

              <h2>怎么记录，结果才有价值？</h2>
              <p>
                <strong>开始之前先把条件固定下来，否则第二次运行和第一次没法比。</strong>
                同一组问题、同一个模型版本、同一种语言、同一天，每次都新开会话，
                每个问题在 24 小时内跑三遍。写下日期和你看到的模型名称，并保存原始回答文本——
                截图或粘贴都行，选那个三个月后你还能找到的。
              </p>
              <p>
                然后把各次运行互相对比，而不是去比某个供应商给的一个数字。
                从「3 个品类问题里被提到 2 次」变成「3 次全中」，是一个你可以核实的真实观察。
                「可见度从 21% 升到 34%」是在二十个样本上做出来的算术，
                一旦被问「这是怎么算的」就站不住。
              </p>

              <h2>这个方法不能告诉你什么？</h2>
              <ul>
                <li>
                  <strong>它给不了你一个比率。</strong>二十个问题问三遍，每个引擎六十个样本。
                  够你注意到变化，但远不够支撑一个描述你所在市场的百分比。
                </li>
                <li>
                  <strong>它不代表所有用户。</strong>引擎会按地区、历史和账号做个性化，
                  供应商控制台看到的回答，和你笔记本上看到的不一样。
                </li>
                <li>
                  <strong>它没法在你睡觉时运行。</strong>自动化意味着按查询付费，
                  这正是这个方法以手工形态存在的原因。
                </li>
                <li>
                  <strong>引擎之间的小差异是噪声。</strong>只有二十个问题时，
                  两个平台之间五分的差距不构成一个关于平台的发现。
                </li>
              </ul>

              <h2>拿到结果之后该做什么？</h2>
              <p>
                <strong>在想办法被提到之前，先检查自己能不能被读到。</strong>
                引擎无法引用它抓取不到的页面，而一个在边缘就被拒绝的爬虫，再多内容也救不回来。
                对你在意的页面跑一遍
                <Link
                  href="/zh/report/"
                  hrefLang="en"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  免费审计（英文）
                </Link>
                ：它会报告爬虫访问情况、承载答案的内容是否机器可读，以及模型可能重复的关于你的
                事实，在你自己的各个页面之间是否一致。
              </p>
              <p>然后按这个顺序修，因为每修好一项都会让下一项更便宜：</p>
              <ol>
                <li>
                  访问——见
                  <Link
                    href="/zh/checks/robots-ai-allowed/"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    爬虫访问规则
                  </Link>
                  ，以及
                  <Link
                    href="/docs/allow-ai-crawlers/"
                    hrefLang="en"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    通过 robots.txt 和防火墙放行 AI 爬虫（英文）
                  </Link>
                  的指南。
                </li>
                <li>
                  可检索性——问句形式的标题，紧跟一个直接答案，详见
                  <Link
                    href="/docs/qa-style-headings/"
                    hrefLang="en"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    为直接 AI 引用优化标题（英文）
                  </Link>
                  。
                </li>
                <li>
                  身份——用实体标记让模型把你的品牌和同名者区分开，详见
                  <Link
                    href="/zh/docs/schema-org-jsonld/"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    实现 Schema.org JSON-LD
                  </Link>
                  。
                </li>
                <li>
                  证据——统计数字、引文和被引用的来源；公开发表的 GEO 研究把这部分测为单项收益
                  最大的一项。每条规则都列在
                  <Link
                    href="/zh/methodology/"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    方法论页面
                  </Link>
                  上。
                </li>
              </ol>
              <p>
                一个月后再跑一遍这二十个问题。如果修复生效了，你应该最先看到的变化不是提及变多——
                而是第五项检查（来源）开始包含你能控制的页面。那是领先指标，也正是本站能直接
                帮上忙的地方：
                <Link
                  href="/monitor/"
                  hrefLang="en"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  每周报告（英文）
                </Link>
                会替你重跑技术检查并告诉你哪里变了，这样你花在问题上的那一小时，
                就花在扫描做不到的那部分上。
              </p>
            </article>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="关于自己检查 AI 可见度的问题" items={FAQ_ITEMS} level="h3" />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    本站使用的权重遵循这项测量，因此可引用性与证据各占 11%，而 AI
                    上下文文件维度占 5%。完整权重，以及单 URL 扫描看不到的部分，都在{" "}
                    <Link href="/zh/methodology/" className="text-[var(--accent)] hover:opacity-75">
                      方法论页面
                    </Link>
                    。
                  </>
                }
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link href="/#scan" hrefLang="en" className="text-sm text-[var(--accent)] hover:opacity-75">
                免费扫描你自己的网站 →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
