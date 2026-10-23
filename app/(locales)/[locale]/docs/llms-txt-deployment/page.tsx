import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
/*
 * WHY THIS IS IMPORTED FROM THE ENGLISH ROUTE GROUP: the drawing is the explanation, not decoration,
 * and it is inline SVG whose labels live inside the component. Forking it into a Chinese copy would
 * mean two drawings that must be kept in step with one argument, which is the drift the English
 * component exists to avoid - and an English label inside a diagram is legible to this reader, while
 * a missing diagram is not. The caption and the surrounding prose are translated; the picture is
 * reused byte for byte.
 */
import DiagramFileRoles from "@/app/(en)/docs/_components/DiagramFileRoles";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { social } from "@/lib/og";

/**
 * `/zh/docs/llms-txt-deployment/` - "How to Generate and Deploy an llms.txt File", in Chinese.
 *
 * WHY THIS PAGE DOES NOT RENDER THROUGH ArticleShell. The shell is the right thing for the
 * English guides, but it imports SiteNav, PageFooter and the `/docs/` back-link directly, so a
 * Chinese reader would land in English navigation on the first scroll and be sent back to the
 * English index by the only link that says "go back". This page rebuilds the same shell from
 * LocaleHeader/LocaleFooter and the same `band` / `wrap` / `doc-article` classes, which is the
 * chrome the rest of the localized surface already uses - one localized header everywhere,
 * rather than a second, English one appearing inside a Chinese route.
 *
 * WHAT IS TRANSLATED: every heading, paragraph, list, caption and FAQ entry a reader acts on.
 * WHAT IS NOT: the code sample, the URLs, and the diagram's SVG labels. The identifiers are the
 * subject of the article - translating `llms.txt` or `text/plain` would be translating the thing
 * being explained - and the diagram is a drawing, not copy: its labels live in the English
 * component and are reused verbatim rather than forked (see the note at the import below).
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "如何生成并部署 llms.txt 文件";
const DESCRIPTION =
  "在域名根目录上组织、托管并验证 /llms.txt 文件的实用指南，也如实说明它不会为 AI 可见度做什么。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/docs/llms-txt-deployment/",
    languages: {
      en: "/docs/llms-txt-deployment/",
      "zh-Hans": "/zh/docs/llms-txt-deployment/",
      "x-default": "/docs/llms-txt-deployment/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/docs/llms-txt-deployment/",
    type: "article",
  }),
};

export default async function ChineseLlmsTxtDeploymentPage({
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

      {/* The way back to the index, kept as a slim strip under the navigation. It goes to the
          Chinese index rather than /docs/: a reader who arrived in Chinese should not be handed
          an English list on the one click whose whole job is orientation. */}
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
        {/* Full-bleed title band: the colour step is what marks the margin. Same geometry as the
            English guides, so the two language versions of a guide do not look like two sites. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                部署
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {DESCRIPTION}
              </p>
              {/* The byline carries a link to the author page, which is English; it is labelled
                  rather than silently switching language halfway through a Chinese byline. */}
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
                  （作者页为英文）
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-02">发布于 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新于 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>阅读约 3 分钟</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <p>
                <strong>
                  llms.txt 是一个放在域名根目录、用 Markdown 写的纯文本文件，它告诉语言模型你网站上哪些部分重要。
                </strong>{" "}
                它是一项约定，不是标准，添加它大约需要十分钟。本指南讲格式、讲部署，也讲怎么验证它确实能被访问到。
              </p>

              {/*
                先给心智模型。这篇文章要纠正的每一个错误——加了 llms.txt 就以为页面会被发现、
                提交了 sitemap 就以为获得了许可——都来自把这三个文件当成同一件事的三种说法。
              */}
              <DiagramFileRoles />

              <h2>什么是 llms.txt？</h2>
              <p>
                <code>/llms.txt</code> 是一项提案中的约定，用来给 AI 系统一份经过整理、机器可读的网站摘要。
                它不要求模型从 HTML 里推断结构，而是直接交给模型一份简短的 Markdown 文档，
                里面有项目摘要和最重要的一批链接。配套的 <code>/llms-full.txt</code> 承载展开后的内容本身。
              </p>

              <h2>文件里写什么？</h2>
              <p>
                约定刻意保持简单：一个写着你站点名称的 H1，一段引用块摘要，然后是若干由带注释的链接组成的 H2 小节。
              </p>
              <pre>{`# Your Company

> One or two sentences describing what you do and who it is for.

## Core pages
- [Product overview](https://example.com/product): what it does.
- [Pricing](https://example.com/pricing): plans and limits.

## Documentation
- [Getting started](https://example.com/docs/start): setup in five minutes.

## Optional
- [Blog](https://example.com/blog): release notes and research.`}</pre>
              <p>
                有两条规则比格式更重要：<strong>摘要那一行是模型最可能引用的话</strong>，
                所以要把它写成信息密集的事实句，而不是一句标语；以及<strong>每个链接都必须能打开</strong>，
                因为一个满是 404 的文件比没有文件更糟。
              </p>

              <h2>文件放在哪里？</h2>
              <p>
                它必须能从准确路径 <code>https://your-domain.com/llms.txt</code> 访问到——是域名根目录，
                不是某个子目录。怎么发布取决于你的技术栈：用 Next.js 就放进 <code>public/llms.txt</code>；
                大多数静态托管就放进发布目录。不要用重定向：直接用 <code>text/plain</code> 内容类型提供它。
              </p>

              <h2>llms.txt 真的能提升 AI 可见度吗？</h2>
              <p>
                <strong>我们能展示它的成本；我们不能展示它提升了可见度。</strong>{" "}
                我们能打开的两份爬虫文档——OpenAI 的帮助中心和 Anthropic 于 2026 年 4 月 7 日发布的爬虫文章——都没有提到这个文件；
                两份文档都指明 <code>robots.txt</code> 是它们遵守的机制。
              </p>
              <p>
                它今天真正帮到的是：会主动抓取上下文的文档站和编码代理，以及任何接受「整理过的入口」的检索系统。
                诚实的说法是：<strong>一个很小、很便宜的信号</strong>——值得加，不值得当作排名因素。
              </p>

              <h2>我如何验证它已经上线？</h2>
              <ol>
                <li>
                  在浏览器里请求 <code>https://your-domain.com/llms.txt</code>。它应当以纯文本呈现，
                  而不是被下载或返回 404。
                </li>
                <li>
                  确认响应是 <code>200</code>，内容类型是 <code>text/plain</code>。
                </li>
                <li>
                  检查 <code>robots.txt</code> 没有禁止该路径，并且你的防火墙没有拦截爬虫的 user-agent。
                </li>
                <li>把文件里的每个链接都点一遍。失效链接是最常见的缺陷。</li>
              </ol>
              <p>
                你可以用{" "}
                <Link
                  href="/llms-txt-studio/"
                  hrefLang="en"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  llms.txt Studio
                </Link>
                （英文）自动完成以上全部检查，或者先用{" "}
                <Link href="/zh/" className="text-[var(--accent)] underline hover:opacity-75">
                  免费 GEO 扫描器
                </Link>
                审计爬虫访问。
              </p>
            </article>

            {/*
              The FAQ and the evidence block are part of the shell on every English guide, so they
              are reproduced here rather than dropped: a Chinese version that quietly loses the
              sources block would be a different article under the same title. `Faq` and `Evidence`
              are locale-neutral components and are reused rather than re-implemented, so the
              FAQPage JSON-LD and the source list cannot drift from the English page.
            */}
            <div className="reveal-stagger mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="关于部署 llms.txt 的问题"
                items={[
                  {
                    q: "文件到底放在哪里？",
                    a: "域名根目录，也就是 https://your-domain.com/llms.txt 直接返回 HTTP 200 和正文的那个位置。跳到登录页的重定向，或者一个 HTML 错误页，都算没有提供。",
                  },
                  {
                    q: "发布 llms.txt 会提升排名吗？",
                    a: "我们没有找到任何一份承诺会读取它的爬虫文档；我们能打开的两份——OpenAI 的帮助中心和 Anthropic 的爬虫文章——指定的都是 robots.txt。它很便宜，对真正会抓取它的读者来说值得做，但我们不把它当作排名因素。",
                  },
                  {
                    q: "如何确认它被正确提供？",
                    a: "请求这个 URL，然后读返回的内容：应当是 200 的 Markdown，而不是 404 或一整页 HTML。只看状态码不够，因为空文件也会返回 200。",
                  },
                ]}
                level="h3"
              />
              {/*
                The quoted finding is a quotation from a paper, so it stays verbatim in English:
                paraphrasing a quoted percentage into Chinese would change what the source says
                while still looking like a quotation. Everything around it - the heading, the note,
                the link to the localized methodology page - is translated.
              */}
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    本站使用的权重依据那项测量，因此可引用性与证据各占 11%，而 AI 上下文文件维度占 5%。
                    完整权重，以及单 URL 扫描看不到的那部分图景，都在{" "}
                    <Link
                      href="/zh/methodology/"
                      className="text-[var(--accent)] underline hover:opacity-75"
                    >
                      中文方法论页面
                    </Link>
                    里。
                  </>
                }
              />
            </div>

            {/* The scan console only exists on the English homepage, so the call to action goes
                where the tool actually is rather than to a Chinese page with no form on it. */}
            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link
                href="/#scan"
                hrefLang="en"
                className="text-sm text-[var(--accent)] hover:opacity-75"
              >
                免费审计你自己的网站 →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}
