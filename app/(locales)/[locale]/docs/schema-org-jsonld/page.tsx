import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagramEntityGraph from "@/app/(en)/docs/_components/DiagramEntityGraph";
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
 * `/zh/docs/schema-org-jsonld/` - the entity-markup guide, in Chinese.
 *
 * WHY THIS PAGE IS BUILT INLINE RATHER THAN THROUGH ArticleShell: that shell stamps
 * English chrome on every article ("All guides", "Published", the English evidence
 * note and a /docs/ back link). Reusing it here would give a Chinese reader an English
 * frame around Chinese prose, which is the half-translated page this site has already
 * withdrawn once. The band/wrap/doc-article geometry is copied from it deliberately so
 * the two language versions look like the same publication.
 *
 * WHAT STAYS ENGLISH, AND WHY: the JSON-LD block, the schema.org vocabulary and the
 * validator URL are literal machine-facing strings - translating them would change what
 * the reader is told to paste. The diagram also stays as it is, because it is shared
 * with the English page and its labels are code-facing terms; forking it would let the
 * two versions drift.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "为 AI 实体消歧编写 Schema.org JSON-LD";
const DESCRIPTION =
  "如何用 Schema.org JSON-LD 让 ChatGPT 和 Claude 把你的品牌、域名和产品关联到同一个实体，并附一个最小示例与验证步骤。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/docs/schema-org-jsonld/",
    languages: {
      en: "/docs/schema-org-jsonld/",
      "zh-Hans": "/zh/docs/schema-org-jsonld/",
      "x-default": "/docs/schema-org-jsonld/",
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/docs/schema-org-jsonld/",
    type: "article",
  }),
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "哪些 schema 类型最重要？",
    a: "Organization 和 WebSite。它们让模型把你的品牌名、域名和产品绑定到同一个实体上，而不是去猜三个彼此独立的字符串是不是同一个意思。",
  },
  {
    q: "sameAs 到底起什么作用？",
    a: "它列出同一实体在其他平台上的档案，正是它把字符串变成一个已解析的实体。指向空档案或废弃档案的链接，比没有链接更糟。",
  },
  {
    q: "如何验证这些标记？",
    a: "把它粘贴到结构化数据验证器里，检查两件事：每个节点都有一个稳定的 @id；该类型要求的属性确实存在，而不只是打算写。",
  },
];

export default async function ChineseSchemaOrgPage({
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
                Schema
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
                <time dateTime="2026-10-02">发布于 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新于 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>阅读约 5 分钟</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <p>
                <strong>
                  JSON-LD 是你告诉机器「品牌名、域名和产品是同一件事，而不是三次巧合」的方式。
                </strong>
                没有它，模型只能去推断你 <code>&lt;title&gt;</code> 里的字符串和你的域名是同一个实体。
                结构化数据消除了这层猜测。
              </p>

              <h2>JSON-LD 为 AI 引擎解决了什么问题？</h2>
              <p>
                实体消歧。如果你的产品叫 <em>Northwind</em>，而恰好还有一家叫 Northwind
                的电影工作室，AI 系统就没有可靠的办法把一次提及归到你头上。带有稳定{" "}
                <code>@id</code>、规范 <code>url</code> 和 <code>sameAs</code> 列表的{" "}
                <code>Organization</code> 标记，提供了它需要的连接点。
              </p>

              {/*
                放在这里而不是放到下面 @graph 示例旁边：它回答的是紧邻的上一句——稳定的
                @id、规范的 url 和 sameAs 列表就是「连接点」——而这一句最容易被读成装饰。
                下面的代码块接着展示读者已经见过的形状的语法，而不是让人从语法反推形状。
              */}
              <DiagramEntityGraph />

              <h2>哪些 schema 类型对 GEO 最重要？</h2>
              <ul>
                <li>
                  <strong>Organization</strong> —— 把你的品牌锚定为一个实体。单个价值最高的节点。
                </li>
                <li>
                  <strong>WebSite</strong> —— 把域名绑定到该实体上。
                </li>
                <li>
                  <strong>SoftwareApplication</strong> 或 <strong>Product</strong> ——
                  描述你实际卖的东西。
                </li>
                <li>
                  <strong>FAQPage</strong> —— 把问题和答案配对。只在同一组问答确实显示在页面上时才使用。
                </li>
                <li>
                  <strong>Article</strong> —— 在编辑类页面上标明作者和日期。
                </li>
              </ul>

              <h2>如何把多个节点连成一个实体？</h2>
              <p>
                使用单个 <code>@graph</code>，并给每个节点一个 <code>@id</code>。
                其他节点随后引用这些标识符，而不是重复数据。正是这一点把彼此分离的片段变成一段连贯的实体描述。
              </p>
              {/* The JSON-LD itself is not translated: it is the literal payload the
                  reader pastes into their own page, so translating it would change the
                  instruction rather than explain it. */}
              <pre>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://your-domain.com/#organization",
      "name": "Your Brand Name",
      "url": "https://your-domain.com",
      "logo": "https://your-domain.com/logo.png",
      "sameAs": [
        "https://x.com/yourhandle",
        "https://github.com/you/repo"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://your-domain.com/#website",
      "url": "https://your-domain.com",
      "name": "Your Brand Name",
      "publisher": { "@id": "https://your-domain.com/#organization" }
    }
  ]
}
</script>`}</pre>
              <p>
                最常被跳过的一点：
                <strong>
                  <code>name</code> 必须在你的 <code>&lt;title&gt;</code>、你的{" "}
                  <code>&lt;h1&gt;</code>、你的 <code>llms.txt</code> 和这段标记里完全一致。
                </strong>
                同一个页面上出现三个不同的名字，会让整件事彻底失效。
              </p>

              <h2>如何验证这些标记？</h2>
              <ol>
                <li>
                  把 URL 提交给{" "}
                  <a
                    href="https://validator.schema.org/"
                    rel="nofollow noopener"
                    target="_blank"
                  >
                    Schema.org 验证器
                  </a>
                  。零错误是及格线。
                </li>
                <li>确认你想要的节点类型确实被检测到了——而不只是「没有报错」。</li>
                <li>
                  检查渲染后的 HTML 源码，而不是编辑器。客户端渲染可能让脚本从初始响应里消失。
                </li>
              </ol>
              <p>
                注意，Google 已把 FAQ <em>富媒体结果</em>收窄到少数站点，所以 FAQPage
                的资格很低并不意味着这段标记没用——生成式引擎仍然会解析它。另见{" "}
                <Link
                  href="/zh/docs/qa-style-headings/"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  为直接 AI 引用优化标题
                </Link>
                。
              </p>
            </article>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="关于实体标记的问题" items={FAQ_ITEMS} level="h3" />
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
