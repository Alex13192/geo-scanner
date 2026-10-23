import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";
import { CONTACT_EMAIL } from "@/lib/site";

import MonitorFormZh from "./MonitorFormZh";

/**
 * `/zh/monitor/` - 每周报告的订阅页，中文版。
 *
 * WHY THIS IS A REBUILD OF THE ENGLISH PAGE RATHER THAN A TRANSLATION COMPONENT: the English
 * `/monitor/` page (`app/(en)/monitor/page.tsx`) renders through ProsePage, whose header, footer
 * and back-link are English. Reusing it with a `locale` flag would put two languages inside one
 * server component and a branch on every sentence, and it would drop a Chinese reader into an
 * English frame at the language switcher. Every other translated page on this site is built the
 * same way: its own route file, with the shell rebuilt inline from LocaleHeader/LocaleFooter.
 *
 * WHY THE BEHAVIOUR IS SHARED BUT THE STRINGS ARE NOT: `MonitorFormZh` posts to the same
 * `/api/subscribe/` endpoint with the same `{domain, email}` body and the same four states, and
 * the server keeps returning the same messages - those are quoted verbatim, because the
 * response text is what the endpoint promises. Only the chrome this page owns is translated.
 * Nothing about validation, normalisation or the response handling is reimplemented here; both
 * forms get their rules from `lib/subscribe/flow.ts` on the server, which is why the two
 * languages cannot drift apart.
 *
 * WHAT STAYS ENGLISH, AND WHY IT IS NOT AN OVERSIGHT: the confirmation email and the submit
 * status line are written by the server, so they arrive in English; the fine print under the
 * form says so instead of letting a reader find out after submitting. `robots.txt`, `llms.txt`,
 * `sitemap` and `viewport` are identifiers rather than words. The KDD 2024 quotation and the
 * source labels are citations - paraphrasing a measured finding is how a claim starts to drift -
 * and the product name LLMention is a name. The privacy policy is English-only in this phase, so
 * it is linked with `hrefLang="en"` and marked 「（英文）」, the same treatment the localized
 * footer gives it.
 *
 * THIS PAGE INHERITS THE ENGLISH PAGE'S MERGE CONDITION: it promises a report "on the next
 * weekly run", so it must not ship before the cron worker does. Both halves merge together or
 * not at all; the warning lives on the English page and is repeated here because this route is
 * public on its own and can be reached directly.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "每周 GEO 报告";
const DESCRIPTION =
  "站点 GEO 分数变化时收到一封邮件：每周运行同一套 40 项公开检查，点名新出现的失败项，一次点击即可停止。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/monitor/",
    /*
     * The pair is claimed on both sides: the English `/monitor/` page lists `zh-Hans`, and this
     * page lists the English URL back. `x-default` points at English because that is the source
     * language of the page and of the only version of the confirmation mail that exists today -
     * sending a crawler that cannot pick a locale anywhere else would be a promise this page
     * cannot keep.
     */
    languages: {
      en: "/monitor/",
      "zh-Hans": "/zh/monitor/",
      "x-default": "/monitor/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/monitor/" }),
};

const FAQ_ITEMS = [
  {
    q: "邮件里会有什么？",
    a: "分数、等级，以及自上一次运行以来的变化：哪些检查新通过、哪些新失败，以及失败项看到的证据。没有任何变化的报告就只用一句话说明，而不会硬凑篇幅。",
  },
  {
    q: "多久运行一次，什么时候？",
    a: "每周一次，单批次运行，而不是按需触发。扫描读取 robots.txt、首页、llms.txt 和 sitemap 的方式与免费扫描器相同，所以同一站点的周报和手动扫描不可能互相矛盾。",
  },
  {
    q: "需要账号吗？",
    a: "不需要。邮箱地址就是整个订阅：确认它，报告开始；每封邮件里的退订链接，结束它。没有要设置的密码，没有要登录的控制台，也没有任何需要取消的东西。",
  },
  {
    q: "关于我，存了什么？",
    a: "域名、邮箱地址，以及该域名的分数历史。没有别的，也不出售、不共享。退订链接在每封邮件里，几个月之后仍然一次点击生效，无需登录。",
  },
  {
    q: "可以观察不止一个域名吗？",
    a: "可以，用同一个地址为每个域名各订阅一次。注意：退订会停止发往该地址的所有报告，而不只是链接来自的那一封——因为「点了退订、别的邮件还继续来」正是收件人把它标记为垃圾邮件的理由。",
  },
  {
    q: "为什么需要确认？",
    a: "因为任何人都能填一个不属于自己的地址。确认这一步证明这个地址本人订阅了报告，这既保护地址的主人，也让发信域名不至于进垃圾邮件过滤器。",
  },
];

export default async function ChineseMonitorPage({
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
                每周报告
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                逐周观察一个站点的 GEO 分数
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                扫描器回答的是 AI 搜索引擎此刻能否访问、读取并引用一个页面。这一页回答另一个问题：这件事有没有变化。填入一个域名和一个邮箱地址，确认之后，同一套 40 项检查每周运行一次。
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="reveal-stagger mx-auto max-w-3xl">
              {/*
                The form sits above the prose, not inside it - the same order as the English
                page and the same reason: somebody who arrived from a newsletter or a link
                already knows what this is, and making them read three paragraphs before they
                can act is how a signup page loses the signup.
              */}
              <section className="mb-14 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-7">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--ink-1)]">
                  开始每周报告
                </h2>
                <MonitorFormZh />
                <p className="mt-3 text-sm text-[var(--ink-3)]">
                  免费，无需账号。每封邮件里的退订链接都不需要登录即可使用。
                </p>
                {/*
                  The server owns the success and error wording, so it comes back in English.
                  Saying so here is the same trade the report page makes when it labels an
                  English sample: a reader should learn the language of the next screen before
                  they submit, not after.
                */}
                <p className="mt-1 text-sm text-[var(--ink-3)]">
                  确认邮件与提交后的状态提示由服务端返回，目前是英文。
                </p>
              </section>

              <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
                <h2>报告里有什么</h2>
                <p>
                  每份报告给出当前的分数与等级，然后只讲与上周的差别，而不是把整幅图再画一遍。真正有意思的那一行几乎总是同一行——<strong>上周通过、现在却失败的检查</strong>——而把这一行埋在十二张维度表下面的报告，第三周之后就没人读了。
                </p>
                <p>
                  失败的检查会被点名，并附上支撑这个判断的证据，以及解释它具体要求什么的页面链接。扫描器公布它执行的每一条规则，所以报告可以被质疑，而不必被信任：如果某个判断看起来不对，规则本身、它的措辞和权重都写在
                  <Link href="/zh/methodology/">方法论页</Link>
                  上。
                </p>
                <p>
                  每周运行里没有任何一项检查的计分方式与手动扫描不同。两者在同一批四个文件上调用同一个引擎，这是两个数字能够被相互比较的唯一办法。
                </p>

                <h2>每周运行是如何工作的</h2>
                <ol>
                  <li>
                    <strong>每周一批。</strong>所有已确认的订阅都在同一次运行里扫描，最久没被扫描的排在前面，所以某一周变慢，不会让一个订阅者被饿着、另一个被服务两次。
                  </li>
                  <li>
                    <strong>GEO 审计需要的四个文件。</strong>robots.txt、首页、llms.txt 和 sitemap，按实际应答的协议去请求。站点拒绝其中某个文件，就报告为「拒绝」，而不是当作文件不存在来计分——这两件事意思不同。
                  </li>
                  <li>
                    <strong>与上一次运行做差异对比。</strong>上一次的分数和上一次的失败检查列表被专门保存下来，正是为了让邮件能说出什么变了。
                  </li>
                  <li>
                    <strong>发出邮件，附一键退订。</strong>退订没有确认步骤，也不问理由。
                  </li>
                </ol>

                <h2>收集了什么，以及它会被怎么处理</h2>
                <p>
                  一次订阅存三样东西：域名、收件地址，以及该域名的分数历史。它不出售、不共享，也不用来构建任何画像。退订动作会被记录下来，而不是把那一行删掉，所以事后仍然可以回答「你们持有什么」——细节在
                  <Link href="/privacy/" hrefLang="en">
                    隐私政策（英文）
                  </Link>
                  里，那里写明保存期限，而不是笼统地描述一个期限。
                </p>
                <p>
                  如果扫描器对某个站点报告了看起来有误的内容，那么接收报告的同一个地址，也能直接找到写那条规则的人：
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>。
                </p>
              </article>

              <div className="mt-16 space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
                <Faq title="关于每周报告的问题" items={FAQ_ITEMS} />
                {/*
                  Same component and same constants as the English page, so the quotation, the
                  attribution and the source list cannot drift between the two languages. The
                  heading and the note are translated; the quotation itself is not, because a
                  translated quotation is no longer the thing it cites.
                */}
                <Evidence
                  title="证据与来源"
                  quote={GEO_PRIMARY_QUOTE}
                  attribution="Generative Engine Optimization, KDD 2024"
                  attributionUrl="https://arxiv.org/abs/2311.09735"
                  sources={GEO_PRIMARY_SOURCES}
                  note="每周运行使用的正是这项研究得出的权重，所以「可引用性」的变化，会比一个缺失的 viewport 标签让分数移动得更多。"
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
