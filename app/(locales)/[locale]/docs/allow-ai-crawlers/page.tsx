import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import DiagramRobotsMatch from "@/app/(en)/docs/_components/DiagramRobotsMatch";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/docs/allow-ai-crawlers/` - the crawler-access guide, in Chinese.
 *
 * WHY THIS REBUILDS THE ENGLISH ARTICLE'S SHELL INSTEAD OF USING ArticleShell: that shell
 * renders SiteNav and PageFooter, whose navigation and footer strings are English. A localized
 * page has to use LocaleHeader/LocaleFooter or the language switch would drop the reader onto
 * an English page. The section order, the FAQ, the evidence block and the closing CTA are all
 * copied from the English shell so the two pages still read as one article in two languages.
 *
 * WHY THE DIAGRAM IS IMPORTED ACROSS ROUTE GROUPS: it is a private component under
 * `app/(en)/docs/_components/`, not a route, and it is driven entirely by CSS tokens and its
 * own English labels. Reusing it keeps the drawing identical to the English page; a second
 * copy with translated labels would be a second thing to maintain and would still draw the
 * same boxes. Because its labels stay English, the paragraph under it says so.
 *
 * WHAT STAYS ENGLISH: every code block (the robots.txt example), every agent name, and the
 * HTTP status codes. Those are the subject matter; translating them would break the example.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "为 GPTBot 与 PerplexityBot 配置 robots.txt 与 WAF";
const DESCRIPTION =
  "AI 搜索引擎会发送哪些 user-agent、如何在 robots.txt 中放行它们，以及如何确认 WAF 没有在静默地向 AI 爬虫返回 403。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/docs/allow-ai-crawlers/",
    languages: {
      en: "/docs/allow-ai-crawlers/",
      "zh-Hans": "/zh/docs/allow-ai-crawlers/",
      "x-default": "/docs/allow-ai-crawlers/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/docs/allow-ai-crawlers/",
    type: "article",
  }),
};

export default async function ChineseAllowAiCrawlersPage({
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

      {/* The way back to the Chinese hub, kept where the English shell puts it. */}
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
        {/* Full-bleed title band: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                技术
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {DESCRIPTION}
              </p>
              {/*
                The byline from ArticleShell, in Chinese. Dates stay ISO rather than going
                through formatDate: that helper prints English month names, and an author page
                and a publication date a reader can check are the point of the byline.
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
                <time dateTime="2026-10-02">发布于 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新于 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>4 分钟阅读</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              17px body copy, the same measure as the English article. `.doc-article` carries
              the typography (h2, lists, pre, links) because Tailwind Typography is not
              installed in this project.
            */}
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                <strong>爬虫被屏蔽，就意味着那个引擎无法引用你，无论你的内容有多好。</strong>发生这件事的地方有两个：<code>robots.txt</code> 和你的防火墙——而第二个恰恰是没人检查的那个。
              </p>

              <h2>AI 搜索引擎会发送哪些 user-agent？</h2>
              <ul>
                <li>
                  <strong>OpenAI：</strong> <code>GPTBot</code>（训练）、
                  <code>OAI-SearchBot</code>（搜索索引）、<code>ChatGPT-User</code>
                  （用户实时触发的抓取）
                </li>
                <li>
                  <strong>Anthropic：</strong> <code>ClaudeBot</code>、
                  <code>Claude-User</code>、<code>Claude-SearchBot</code>、
                  <code>anthropic-ai</code>
                </li>
                <li>
                  <strong>Perplexity：</strong> <code>PerplexityBot</code>、
                  <code>Perplexity-User</code>
                </li>
                <li>
                  <strong>Google：</strong> <code>Google-Extended</code>（用于 AI grounding；
                  <code>Googlebot</code> 是另一个）
                </li>
                <li>
                  <strong>其他：</strong> <code>Bytespider</code>（字节跳动）、
                  <code>CCBot</code>（Common Crawl）、<code>meta-externalagent</code>（Meta）、
                  <code>Applebot-Extended</code>（Apple）
                </li>
              </ul>
              <p>
                <code>*-User</code> 这一类 agent 值得单独拿出来看：它们抓取某个 URL，是因为刚刚有个人问起了它，
                所以屏蔽它们改变的是某个用户此刻看到的内容——而不只是之后被收录的内容。
              </p>

              {/*
                Same placement as the English page: before the "how do I allow them" section,
                because the question it answers comes first - whether the file even applies to
                the agent you are worried about.
              */}
              <DiagramRobotsMatch />
              <p className="text-sm leading-relaxed text-[var(--ink-3)]">
                图中标注保留英文技术术语（user-agent、Allow、Disallow），以便与 robots.txt 原文逐项对照。
              </p>

              <h2>如何在 robots.txt 中允许它们？</h2>
              <p>
                默认行为本来就允许一切，所以大多数站点不需要做任何改动。真正的失败模式是反过来的：
                一条继承来的或照抄来的规则把它们挡住了。把意图写明确，这样它才看得见、可审查。
              </p>
              <pre>{`# AI search crawlers - explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# Everything else
User-agent: *
Allow: /
Disallow: /private/

Sitemap: https://your-domain.com/sitemap.xml`}</pre>
              <p>
                让 robots.txt 只保留在一处。指向一个单独的 sitemap 不花什么成本，却经常被忘记。
              </p>

              <h2>为什么我的防火墙会向 AI 爬虫返回 403？</h2>
              <p>
                <strong>通常的元凶是 bot 管理功能，而不是你的 robots.txt。</strong>
                基于挑战的 bot 防护会给请求打分，并可能向任何不是浏览器的东西发出 JavaScript 挑战。
                服务端爬虫无法完成 JS 挑战，于是它们收到一个挑战页或 <code>403</code>，并记录一次抓取失败。
              </p>
              <p>
                按这个顺序检查：bot-fight 模式或同类设置、被设为 under-attack 配置的安全级别、
                按 user-agent 匹配的自定义 WAF 规则，以及把爬虫突发流量当成攻击的限流规则。
              </p>

              <h2>我应该屏蔽 AI 训练爬虫吗？</h2>
              <p>
                这是一个正当的选择，而且它与搜索可见性是两件事。屏蔽 <code>CCBot</code> 或{" "}
                <code>GPTBot</code> 影响的是模型训练与 grounding；屏蔽 <code>OAI-SearchBot</code> 或{" "}
                <code>PerplexityBot</code> 影响的是你究竟还能不能被引用到答案里。
                先确定你真正反对的是哪一个，并且在这个过程中千万不要一不留神把{" "}
                <code>Googlebot</code> 或 <code>Bingbot</code> 也屏蔽了。
              </p>

              <h2>如何验证爬虫没有被屏蔽？</h2>
              <ol>
                <li>
                  抓取你自己的 <code>robots.txt</code>，确认没有任何一组规则挡住上面这些 agent。
                </li>
                <li>
                  从一台不是浏览器的服务器上，用 AI 爬虫的 user-agent 请求一个页面，确认返回的状态码是{" "}
                  <code>200</code>。
                </li>
                <li>
                  查看 <code>cf-mitigated</code> 响应头，它表示系统已经发出了挑战。
                </li>
                <li>
                  检查边缘安全事件日志，看有没有来自 Google、OpenAI 或 Perplexity 地址段的请求被拦截。
                </li>
              </ol>
              <p>
                由{" "}
                <Link href="/#scan" hrefLang="en">
                  LLMention 扫描器（英文）
                </Link>自动执行第 1 步，并报告在站点根目录下，gptbot、claudebot、perplexitybot、oai-searchbot
                和 google-extended 中哪些被禁止。它<strong>不</strong>执行第 2、3 步：它以自身的身份、
                从自己的地址抓取你的站点，所以它发出的请求永远无法告诉你，你的防火墙会怎样对待一个真正的
                AI 爬虫。这两步需要你自己来运行。
              </p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block do not inherit the
                article's 17px body measure, matching ArticleShell. */}
            <div className="reveal-stagger mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于爬虫访问的问题"
                level="h3"
                items={[
                  {
                    q: "我需要允许哪些 user-agent？",
                    a: "至少包括：OpenAI 的 GPTBot 与 OAI-SearchBot、Anthropic 的 ClaudeBot 与 Claude-SearchBot、Perplexity 的 PerplexityBot，以及 Google 用于其 AI 产品的 Google-Extended。",
                  },
                  {
                    q: "robots.txt 已经允许它们了，为什么扫描仍然报告被屏蔽？",
                    a: "因为防火墙或 CDN 规则可能在读取 robots.txt 之前就拒绝请求。大型站点按 IP 地址验证爬虫，所以 WAF 配置也是答案的一部分，而不只是那个文件。",
                  },
                  {
                    q: "我应该允许所有 AI 爬虫吗？",
                    a: "这是策略决定，而不是技术问题。允许搜索爬虫、同时禁止训练爬虫，是一种常见且站得住脚的划分，robots.txt 可以表达它。",
                  },
                ]}
              />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本站使用的权重遵循那项测量结果，所以「可引用性与证据」占 11%，而「AI 上下文文件」维度占 5%。完整的权重，以及单 URL 扫描看不到的那部分图景，都写在方法论页上。"
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
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
