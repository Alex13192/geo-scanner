import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AnswerCheckWidgetZh from "./AnswerCheckWidgetZh";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { QUESTION_GROUPS, questionBankText } from "@/lib/answer-check/questions";
import {
  CUE_WINDOW,
  EARLY_CHARS,
  HEDGE_CUES,
  RECOMMENDATION_CUES,
} from "@/lib/answer-check/rules";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/answer-check/` - the answer checker, in Chinese.
 *
 * WHY THIS REBUILDS ProsePage'S SHELL INSTEAD OF USING IT: ProsePage renders SiteNav and
 * PageFooter, whose navigation and footer strings are English. A localized page has to use
 * LocaleHeader/LocaleFooter or the reader would be handed English chrome on a Chinese page.
 *
 * WHY THE RULES ARE IMPORTED, NOT RESTATED: the six ids, their order and the two thresholds all
 * come from lib/answer-check/rules.ts. The widget calls the same checkAnswer() the English page
 * calls, so the two pages cannot drift into describing different methods. The page only names the
 * signals the module already returns.
 *
 * WHY THE QUESTION TEMPLATES STAY ENGLISH: they are fill-in text the reader pastes into an engine
 * after replacing the brackets, and the copy button copies the same English bank. Translating the
 * templates here would make the page and the clipboard disagree about what was copied. The note
 * above the groups tells the reader to ask in their buyers' language, which is the same advice the
 * Chinese self-check guide gives.
 *
 * WHAT STAYS ENGLISH: engine names, the example brand and domain, the cue vocabularies (they are
 * the literal strings the rules match, so translating them would misdescribe the tool), the
 * twenty question templates, and the research quotation in the evidence block.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "检查一段 AI 回答有没有提到你的品牌";
const DESCRIPTION =
  "粘贴你从 ChatGPT、Perplexity 或 Gemini 得到的一段回答，看看它包含六项信号中的哪几项。全程在你的浏览器里运行，不联系任何 AI 引擎，也不给分数。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/answer-check/",
    languages: {
      en: "/answer-check/",
      "zh-Hans": "/zh/answer-check/",
      "x-default": "/answer-check/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/answer-check/", type: "website" }),
};

/**
 * Chinese group headings and reasons. The ids come from QUESTION_GROUPS; the questions themselves
 * are rendered from that module, so this map cannot silently change how many questions are shown.
 */
const QUESTION_GROUP_COPY: Record<string, { label: string; why: string }> = {
  category: {
    label: "品类",
    why: "问题里没有品牌名。这是唯一测量触达的一组：被一个根本不知道你存在的人找到。",
  },
  scenario: {
    label: "场景",
    why: "一个具体问题，没有品牌名。它检验推荐究竟是从需求推导出来的，还是从一张品类清单里挑出来的。",
  },
  comparison: {
    label: "对比",
    why: "你的品牌对上一个点名的替代品。它显示你究竟能不能进入候选名单——而这类问题最常被回答成「看情况」。",
  },
  fact: {
    label: "事实",
    why: "直接点名你的品牌，问可以核实的信息。它测量的是准确度而不是触达，而出错代价最高的也正是这里。",
  },
};

export default async function ChineseAnswerCheckPage({
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
        {/* Full-bleed title band, matching ProsePage: the colour step marks the margin. */}
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
                自查
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                六条公开规则，用在你粘贴的回答上。不会联系任何 AI 引擎，也不需要注册。
              </p>
              <p className="font-mono text-xs text-[var(--ink-3)]">全程在你的浏览器里运行</p>
              <Link
                href="/zh/docs/ai-visibility-self-check/"
                className="inline-block text-[14px] font-medium text-[var(--accent)] transition-opacity hover:opacity-75"
              >
                如何正确运行这项检查 →
              </Link>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="reveal-stagger mx-auto max-w-3xl">
              <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <p>
                  <strong>粘贴一段回答，得到它包含的六项信号，并看到每个判定背后的原文。</strong>
                  用你的买家实际在用的那个引擎提出你的问题，复制回答，粘贴到下面的框里。没有任何内容会被上传：这里的分析就是一段在本页运行的字符串匹配。
                </p>
                <p>
                  这<strong>不是</strong>一次可见度测量，而且有必要把原因说清楚。测量意味着——反复地、按计划地、跨平台地——向引擎提问，而每次运行都要花钱。LLMention
                  不做这件事，这个工具也不假装自己在做：它只给你提供的文本打分。这个说法比这一领域厂商们的说法要弱，但它是唯一一个读到这里的人可以自行核对的。
                </p>
              </article>

              <section className="mt-8">
                <Suspense
                  fallback={
                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm text-[var(--ink-2)]">
                      正在加载检查器……
                    </div>
                  }
                >
                  <AnswerCheckWidgetZh />
                </Suspense>
              </section>

              <article className="doc-article mt-12 text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <h2>这六项信号是什么？</h2>
                <p>
                  每一项都是机械的，并且都会附上产生它的原文片段，所以你可以不同意规则，而不是不同意这个工具：
                </p>
                <ol>
                  <li>
                    <strong>被提到</strong>
                    ——品牌名或你填写的别名出现在回答中的任何位置。拉丁字母名称按词边界匹配，所以「Ramp」不会在「ramp-up」里被找到；包含非拉丁字符的名称按子串匹配，因为那些文字里没有词边界，用边界模式会什么都匹配不到。
                  </li>
                  <li>
                    <strong>在靠前位置被提到</strong>
                    ——第一次提及落在前 {EARLY_CHARS} 个字符内，大约两句话。在结尾段才点你名字的回答，不是能让你浮出来的回答。
                  </li>
                  <li>
                    <strong>出现在候选清单里</strong>
                    ——提及落在项目符号或编号的行上，那才是读者真正做选择的地方。
                  </li>
                  <li>
                    <strong>带有推荐</strong>
                    ——在提及前后 {CUE_WINDOW}{" "}
                    个字符内，出现这份已公布词表中的一个词：
                    <span className="font-mono text-xs">{RECOMMENDATION_CUES.join(", ")}</span>
                    。没有这类词的提及只是一个名字，不是一个建议。
                  </li>
                  <li>
                    <strong>引用了来源</strong>
                    ——回答链接到的域名。如果你自己的域名不在其中，引擎就是在从你无法控制的地方描述你。
                  </li>
                  <li>
                    <strong>诚实的空白</strong>
                    ——说明了自己无法确认什么，从这份已公布词表中检测：
                    <span className="font-mono text-xs">{HEDGE_CUES.join(", ")}</span>
                    。在事实问题上，这是通过而不是失败：空白是可以补的，一个被客户拿来反问你的自信错误数字，补不回来。
                  </li>
                </ol>
              </article>

              <article className="doc-article mt-10 text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <h2>我应该问哪些问题？</h2>
                <p>
                  先用二十个，分成四组，测量的是不同的东西。把方括号里的部分换成你自己的词——并且使用你的买家实际使用的语言，因为同一个问题用英文问和用中文问，是两次不同的测量。
                </p>
                <p className="text-sm">
                  问题模板本身保留英文，因为它们是可替换的填空结构，复制按钮复制的也是这份英文题库；真正向引擎提问时，用你买家实际使用的语言把方括号替换掉。
                </p>
                {QUESTION_GROUPS.map((group) => {
                  const copy = QUESTION_GROUP_COPY[group.id] ?? {
                    label: group.label,
                    why: group.why,
                  };
                  return (
                    <div key={group.id}>
                      <h3>{copy.label}</h3>
                      <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.why}</p>
                      <ul className="mt-2 space-y-1 text-sm text-[var(--ink-2)]">
                        {group.questions.map((q) => (
                          <li key={q} className="font-mono text-xs leading-relaxed">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                <details className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--ink-1)]">
                    整份题库的纯文本，方便粘贴到笔记文件
                  </summary>
                  <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-[var(--ink-2)]">
                    {questionBankText()}
                  </pre>
                </details>
              </article>

              <article className="doc-article mt-10 text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <h2>这个工具不能告诉你什么</h2>
                <ul>
                  <li>
                    <strong>它给不出一个比率。</strong>
                    它一次只给一段回答打分。二十个问题问三遍是六十个样本——足够注意到变化，远不足以支撑一个描述你所在市场的百分比。
                  </li>
                  <li>
                    <strong>它不知道任何引擎会回答什么。</strong>
                    它从未与任何引擎对话。如果你想要自动化，那要按查询付费，你应该向一个把这一点讲清楚的人购买。
                  </li>
                  <li>
                    <strong>名字本身就是普通单词的品牌，有时会匹配到那个单词。</strong>
                    「we ramp up quickly」包含独立的词「ramp」，而任何字符串规则都无法把它和这家公司区分开。每个判定都会显示子串，所以你能看见它；一个更具体的别名能解决大多数情况。
                  </li>
                  <li>
                    <strong>一段回答只是一则轶事。</strong>
                    引擎会随会话、版本和地区变化。记录日期、模型和每个问题的三次运行，否则第二次测量和第一次没法比。
                  </li>
                </ul>
              </article>

              {/* Outside the prose articles, so Faq and Evidence keep their own 15px measure,
                  matching the English page's ProsePage layout. */}
              <div className="mt-16 space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
                <Evidence
                  title="证据与来源"
                  quote={GEO_PRIMARY_QUOTE}
                  attribution="Generative Engine Optimization, KDD 2024"
                  attributionUrl="https://arxiv.org/abs/2311.09735"
                  sources={GEO_PRIMARY_SOURCES}
                  note="已发表的 GEO 研究正是第五项信号值得关注的原因：加入引文和被引用的来源，在测试过的所有单项改动中产生的可测量增益最大。"
                />
                <Faq
                  title="关于这个检查器的问题"
                  items={[
                    {
                      q: "我粘贴的文本会被存储或发送到别处吗？",
                      a: "不会。规则在你的浏览器里运行，文本从不离开这个页面。没有服务器请求、没有日志、也没有账号——这也是为什么页面加载完成后，即使断网，这个工具仍然可用。",
                    },
                    {
                      q: "为什么没有百分制分数？",
                      a: "因为一个分数会诱使你去优化那个分数。六项信号的计数，每一项都附上产生它的子串，告诉你缺了什么，也让你能核对判定。一个数字更容易被引用，也更容易被钻空子。",
                    },
                    {
                      q: "我可以把它用在客户报告里吗？",
                      a: "你可以引用你粘贴的任何一段回答的六项信号及其证据。但不能把一段回答的计数当作可见度比率来呈现——这正是这个工具刻意拒绝做出的声称；指南里说明了如何正确记录结果。",
                    },
                  ]}
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
