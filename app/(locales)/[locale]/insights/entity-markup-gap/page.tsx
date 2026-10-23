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
import { getInsight } from "@/lib/insights";
import { OG_IMAGE, social } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/zh/insights/entity-markup-gap/` - the entity-markup essay, in Chinese.
 *
 * WHY THE SHELL IS REBUILT INLINE INSTEAD OF USING PostShell: PostShell renders SiteNav and
 * PageFooter, whose navigation, archive strip and author card are English. A Chinese reader
 * would get an English frame around Chinese prose, including an "All writing" link that
 * would drop them back into the English archive. The band/wrap/doc-article geometry, the
 * byline, the FAQ, the evidence block, the author card and the "read next" list are copied
 * from that shell so the two versions still read as one article in two languages.
 *
 * WHAT STAYS ENGLISH: the schema.org vocabulary (`Organization`, `WebSite`, `Person`,
 * `LocalBusiness`, `sameAs`, `@type`, `@id`) and the JSON-LD sample are literal
 * machine-facing strings. The KDD quotation, the bibliographic source labels and the
 * author's name are identifiers or quotations. Translating any of them would change what
 * the reader is told to paste or what a cited source actually says.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const insight = getInsight("entity-markup-gap");

const TITLE = "30 个站点里有 22 个让 AI 猜它们是谁";
const DESCRIPTION =
  "研究里只有 8 个首页声明了 Organization 或 WebSite 实体。这会让模型在解析品牌时付出什么代价，以及修复它所需的标记。";

/**
 * The two URLs this pair claims. Written out rather than built from `insightPath`, because
 * that helper is the English base: the canonical and the `zh-Hans` alternate must differ,
 * and deriving one from the other is how an hreflang pair ends up pointing at itself.
 */
const PATH = "/zh/insights/entity-markup-gap/";
const ENGLISH_PATH = "/insights/entity-markup-gap/";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: PATH,
    languages: {
      en: ENGLISH_PATH,
      "zh-Hans": PATH,
      "x-default": ENGLISH_PATH,
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
    type: "article",
  }),
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "实体标记是排名因素吗？",
    a: "不直接是。它是一种解析辅助：它给模型一个名字、一个 URL，以及一组可以用来核对这个名字的外部资料。一个页面是否被引用，取决于远不止这些的东西，而且没有任何标记能保证被引用。",
  },
  {
    q: "更多 JSON-LD 总是有帮助吗？",
    a: "不。一个如实描述页面的有效图有帮助；一个塞满页面并不支持的类型的庞大图，和关键词堆砌是同一种负担，而一个发现它与可见页面冲突的消费方，两边都不会信。",
  },
  {
    q: "能让这个数字变化的最小改动是什么？",
    a: "一个带有 name、url 和 sameAs 的 Organization 节点，加上一个引用它的 WebSite 节点。这足以通过本站的两条规则，而样本里大多数站点缺的正是这个标记。",
  },
];

export default async function ChineseEntityMarkupGapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

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
    articleSection: "研究",
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
            href="/zh/insights/"
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
                研究
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                一个无法把名字绑定到域名的模型只能靠猜，而猜测不是引用。修复它的标记只有四行
                JSON，而样本里大多数站点并没有。
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
                研究中的 30 个首页里有 22 个完全没有声明 Organization、WebSite、Person 或
                LocalBusiness 实体。这是样本的 <strong>73%</strong>，其中还包括几家模型肯定知道名字的公司——因为「知道一个名字」和「被告知哪个域名拥有它」是两个不同的问题。
              </p>
              <p>
                30 个里有 19 个——<strong>63%</strong>——既没有实体节点，也没有{" "}
                <code>sameAs</code> 列表。对这些页面，每个消费方都必须从可见文本推断品牌，而推断恰恰是那种悄悄出错的部分：模型可以完全了解这家公司，却仍然没把它的名字挂到你的域名上。
              </p>

              <h2>什么才算声明了一个实体？</h2>
              <p>
                一个解析成功的 JSON-LD 块，其中包含 <code>@type</code> 为
                Organization、WebSite、Person 或 LocalBusiness。这就是全部规则，值四分。
              </p>
              <p>
                它刻意做得很浅。扫描器会读取一个成功解析的图中任何位置出现的类型，包括嵌套的，所以文章{" "}
                <code>author</code> 属性里的一个 Person
                节点就能满足它，哪怕页面上任何地方都没有 Organization 节点。证据行会列出匹配到的类型，所以一次通过说的是它看到了什么，而不是断言存在一个品牌实体。
              </p>

              <h2>30 个里有多少声明了？</h2>
              <p>
                8 个声明了实体类型，9 个带有 <code>sameAs</code>，6 个两者都有，19
                个两者都没有。重叠才是值得注意的地方：这两个属性经常被一起加上，而只有其中一个、没有另一个的站点，才是值得看的。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>信号</th>
                      <th>站点数</th>
                      <th>占 30 个的比例</th>
                      <th>计分位置</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>声明实体类型</td>
                      <td>8</td>
                      <td>27%</td>
                      <td>机器可读性，占总分 12%</td>
                    </tr>
                    <tr>
                      <td>带有 sameAs 列表</td>
                      <td>9</td>
                      <td>30%</td>
                      <td>信任与权威，占总分 10%</td>
                    </tr>
                    <tr>
                      <td>两者都有</td>
                      <td>6</td>
                      <td>20%</td>
                      <td>两个维度</td>
                    </tr>
                    <tr>
                      <td>两者都无</td>
                      <td>19</td>
                      <td>63%</td>
                      <td>两个维度</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>通过和失败的页面分别长什么样？</h2>
              <p>
                这个模式不是人们预期的那样。一些得分最高的页面有实体、没有{" "}
                <code>sameAs</code>；一些得分较低的页面有 <code>sameAs</code>、没有实体。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>首页</th>
                      <th>分数</th>
                      <th>实体</th>
                      <th>sameAs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>salesforce.com</td>
                      <td>83</td>
                      <td>是</td>
                      <td>否</td>
                    </tr>
                    <tr>
                      <td>vercel.com</td>
                      <td>79</td>
                      <td>是</td>
                      <td>是</td>
                    </tr>
                    <tr>
                      <td>shopify.com</td>
                      <td>72</td>
                      <td>否</td>
                      <td>是</td>
                    </tr>
                    <tr>
                      <td>bbc.com</td>
                      <td>61</td>
                      <td>否</td>
                      <td>是</td>
                    </tr>
                    <tr>
                      <td>github.com</td>
                      <td>60</td>
                      <td>否</td>
                      <td>否</td>
                    </tr>
                    <tr>
                      <td>microsoft.com</td>
                      <td>48</td>
                      <td>否</td>
                      <td>否</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                其中两行很有启发性。Salesforce 在整个样本里得分最高，却没有{" "}
                <code>sameAs</code>：实体节点在做识别工作，而资料链接从未被加上。Shopify 通过了{" "}
                <code>sameAs</code>，却没有声明实体，于是那些资料指向一个页面从未命名的东西——一次没有锚点的连接。
              </p>

              <h2>模型实际上会拿这些标记做什么？</h2>
              <p>
                模型用它把一个字符串解析成唯一一个东西。带有 <code>name</code>、
                <code>url</code> 和 <code>sameAs</code> 的 <code>Organization</code>，就是那种形状：它说明「这个名字、这个域名、这些资料是同一个实体」。
              </p>
              <p>
                没有它，一个正在解析你品牌的消费方只能使用页面文本和它已经相信的东西。那并不是什么都没有——一份把公司名写得明明白白的大文档并不是隐形的——但那是推断，而推断有声明所没有的失效模式：认错同名者、缩写名、品牌更名，或者一个知道公司却不知道域名的模型。
              </p>
              <p>
                这就是为什么两条规则被放在不同维度里计分。实体节点是机器可读性属性：解析器能不能看到一个可以指向的东西。
                <code>sameAs</code>{" "}
                列表是信任属性：这个东西有没有指向别处存在的账号。第一个关于这个页面，第二个关于你在世界中的品牌。
              </p>

              <h2>这项检查能证明实体是正确的吗？</h2>
              <p>
                不能，规则页也这么写。测试的只是存在性：没有任何东西会去抓取{" "}
                <code>sameAs</code> 里的资料，也没有任何东西会把声明的名字和页面标题作比较。
              </p>
              <p>
                在针对它做优化之前，值得知道这个限制。一个页面可以靠声明一个 Person
                节点通过，而这个节点的名字在可见文案里根本没出现，读到两者的模型会注意到这种不一致。规则是可解析性的下限，不是身份的证书。
              </p>

              <h2>能同时通过两条规则的最小标记是什么？</h2>
              <p>
                一个 Organization 节点、一个引用它的 WebSite 节点，以及一个{" "}
                <code>sameAs</code> 数组。把占位符替换掉；不要留着它们。
              </p>

              {/* The payload is not translated: a reader pastes it, so the literal strings,
                  including the placeholder domain and brand name, are the instruction. */}
              <pre>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://your-domain.com/#organization",
      "name": "Your Brand Name",
      "url": "https://your-domain.com",
      "sameAs": [
        "https://github.com/your-account",
        "https://www.linkedin.com/company/your-brand"
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
                那段代码有两个地方是刻意的。<code>@id</code>{" "}
                的值是真实源站上的片段，所以每个页面都可以引用同一个节点，而不必重复声明品牌。数组也没有被填充：两个真实存在的资料，比六个不存在的更有价值，因为这个属性是一个消费方可以核查的声明。
              </p>

              <h2>先做哪一个更值得？</h2>
              <p>
                实体节点，因为它被计分两次——一次直接计分，一次作为让 <code>sameAs</code>{" "}
                有意义的锚点。
              </p>
              <ol>
                <li>
                  把 Organization 节点加到每个页面，或者加到包裹每个页面的布局里。两种都行；一个文件更容易保持准确。
                </li>
                <li>
                  用你实际维护的资料添加 <code>sameAs</code>。一个失效的资料是一个破损的声明，而一个模型可以反驳的声明，比一个缺失的声明代价更高。
                </li>
                <li>
                  验证这个块能解析。语法错误对消费方来说和缺失标记无法区分，而对一个以为自己已经加了的读者来说，比什么都没有更糟。
                </li>
                <li>
                  重跑扫描。证据行会列出匹配到的类型，所以通过是可观察的，而不是假定的。
                </li>
              </ol>
              <p>
                完整走查的指南是{" "}
                <Link href="/zh/docs/schema-org-jsonld/">Schema.org JSON-LD 指南</Link>，权重背后的算术在{" "}
                <Link href="/zh/methodology/">方法论页面</Link>上。
              </p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block keep the shell's 15px
                measure rather than inheriting the 17px body copy. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="关于实体标记的问题" items={FAQ_ITEMS} level="h3" />
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
                    href="/zh/insights/thirty-homepages-none-graded-a/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    我们扫描了 30 个首页，没有一个拿到 A
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    实体标记占分数的 12%。分布图展示了当几个维度同时失败时要付出什么代价。
                  </p>
                </li>
                <li>
                  <Link
                    href="/zh/insights/reading-a-failed-check/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    如何读懂一次未通过的检查，并修对地方
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    一项失败的实体检查，可能意味着标记缺失，也可能意味着解析器从未看到它。两者需要不同的修法。
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
