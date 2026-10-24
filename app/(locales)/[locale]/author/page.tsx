import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq, { type FaqItem } from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatUsd, PRODUCTS } from "@/lib/pricing";
import { OG_IMAGE, social } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/zh/author/` - the author page, in Chinese.
 *
 * WHY THE SHELL IS REBUILT INLINE INSTEAD OF USING PostShell: PostShell renders SiteNav and
 * PageFooter, whose navigation, archive strip, byline and author card are English. A Chinese
 * reader would get an English frame around Chinese prose, including an "All writing" link
 * that would drop them back into the English archive. The band/wrap/doc-article geometry,
 * the byline, the body sections, the production table, the FAQ, the evidence block and the
 * "read next" list are copied from that shell so the two versions still read as one page in
 * two languages. The ProfilePage JSON-LD is repeated with `inLanguage: "zh-Hans"` for the
 * same reason the localized articles repeat PostShell's BlogPosting node.
 *
 * WHY THE PRICE IS IMPORTED: the English page prints `$39`, and that number has to be the
 * one checkout charges. `formatUsd` and the product table in lib/pricing.ts are the only
 * copy of it in this repository, so the price is computed here rather than retyped.
 *
 * WHAT STAYS ENGLISH: every employer, job title, certification and the university in the
 * background section; the CCIE number; `VXLAN/EVPN`, `spine-leaf`, `BGP/MPLS/SRv6`, the
 * vendor names, `Python`, `Ansible`, `Nornir`; every date and range; and the quoted KDD
 * finding with its source labels. Those are the credentials and identifiers a reader may
 * want to check, and translating them would change what is being asserted.
 *
 * WHY /refund/ KEEPS hrefLang="en": the legal policies are published in English and are not
 * part of this translation phase, so a reader is told before following the link.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "这个站点是谁写的";
const DESCRIPTION =
  "谁在维护 LLMention、这些文字如何产生与更正、它不会做什么，以及本站如何获得资金。";

/**
 * The two URLs this pair claims. Written out rather than derived from AUTHOR.path, because
 * that constant is the English URL: canonical and the `zh-Hans` alternate must differ, and
 * deriving one from the other is how an hreflang pair ends up pointing at itself.
 */
const PATH = "/zh/author/";
const ENGLISH_PATH = "/author/";

const CATEGORY = "说明";
const PUBLISHED = "2026-10-18";
/** The English page's "5 min read", with only the suffix translated. */
const READ_TIME = "5 分钟阅读";

/**
 * The from-price on the English page is the Signal report. Looking it up by id rather than
 * by array position keeps this sentence correct if the product list is reordered.
 */
const SIGNAL = PRODUCTS.find((product) => product.id === "signal") ?? PRODUCTS[0];
const SIGNAL_PRICE = formatUsd(SIGNAL.priceUsd);

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
  /* No `type: "article"`, matching the English page: /author/ is a profile page rather than
     a dated piece, even though it carries a publication date. */
  ...social({ title: TITLE, description: DESCRIPTION, url: PATH }),
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "LLMention 是一家公司在运营吗？",
    a: "不是。它是一个由一个人维护的独立项目，不隶属于 OpenAI、Anthropic、Google 或 Perplexity。源代码是公开的，所以这个说法可以被核查，而不只是听起来真诚。",
  },
  {
    q: "付费客户能拿到更高的分数吗？",
    a: "不能。分数由扫描器根据抓取到的响应计算，付费报告里的任何内容都不会回流到分数里。报告解释一个结果，不能改变它。",
  },
  {
    q: "更正是怎么处理的？",
    a: "发送 URL、检查项，以及扫描报告了什么。点名某条规则的不同意见，是这个项目收到的最有用的消息；更正会发布在出错的地方，而不是放进没人看的更新日志。",
  },
];

/**
 * The ProfilePage shape PostShell emits for this route, with the one field that must differ:
 * `inLanguage`. The @id and mainEntityOfPage are this locale's URL, so the Chinese page
 * describes itself rather than borrowing the English page's identity.
 */
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE_URL}${PATH}#article`,
  name: TITLE,
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
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
  articleSection: CATEGORY,
};

export default async function ChineseAuthorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <LocaleHeader locale="zh" dict={dict} />

      {/*
        Two ways out, because the English shell has one and the localized shell needs the
        other: PostShell's strip is "All writing" (kept here, pointing at the Chinese
        archive), and every localized page also keeps a way back to the Chinese hub.
      */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center justify-between gap-4">
          <Link
            href="/zh/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 返回首页
          </Link>
          <Link
            href="/zh/insights/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            全部文章 →
          </Link>
        </div>
      </div>

      <main>
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
                为这些测量负责的人、写作所遵循的标准，以及本站赚钱的两种方式。
              </p>
              {/*
                The date stays ISO, as on every localized page: formatDate() prints English
                month names, and the JSON-LD repeats the ISO value so the printed date and
                the machine-readable one are the same fact.
              */}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  作者{" "}
                  <Link href="/zh/author/" className="text-[var(--accent)] hover:opacity-75">
                    {AUTHOR.name}
                  </Link>
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime={PUBLISHED}>发布于 {PUBLISHED}</time>
                <span aria-hidden="true">·</span>
                <span>{READ_TIME}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <h2>LLMention 背后是谁？</h2>
              <p>
                <strong>{AUTHOR.name}</strong> 构建并维护这个项目：扫描器、规则目录、研究，以及这些文字。署名用的是用户名，而不是法定姓名；验证它的方式是公开仓库{" "}
                <a href={AUTHOR.githubRepo} target="_blank" rel="noopener noreferrer">
                  github.com/Alex13192/geo-scanner
                </a>
                ，在那里规则集和站点本身都可以阅读。
              </p>
              <p>
                这是一次刻意的取舍。一个配有公开仓库和可用联系地址的化名是可以核查的；一个没有作品附着的全名则不能。如果支付处理方或监管机构要求提供法定姓名，它会通过{" "}
                <Link href="/refund/" hrefLang="en">
                  退款政策（英文）
                </Link>{" "}
                上的运营方信息提供，而不是为了一条署名而编造。
              </p>

              <h2>他凭什么做这项测量？</h2>
              <p>
                按这个问题通常的含义来理解，他并没有对应的资历。他没有数据科学方面的证书，也没有可援引的 SEO 代理公司履历，所以这一页不会声称自己有。
              </p>
              <p>
                取而代之的资格是结构性的：方法完整公开，每一条规则及其权重都在{" "}
                <Link href="/zh/methodology/">方法论页面</Link>
                上，扫描器运行的就是页面公布的那份目录。认为某条规则有误的读者可以点出它、核查它；这是比一份传记更好的保证——也是这个项目唯一能诚实做出的保证。
              </p>

              <h2>他的职业背景是什么？</h2>
              <p>
                Alex Xu 在网络工程领域有二十多年经验，其中大部分时间投入在大型企业与运营商网络——在那样的网络里,「一个爬虫或一个配置错误的边缘节点」并不是抽象概念。他持有 Cisco CCIE(Routing &amp; Switching and Security)、CCNP 与 CCNA、Microsoft MCSE 和 Juniper JNCIS 认证。
              </p>
              <p>
                他的工作覆盖数据中心与广域网架构、混合云与 SD-WAN 转型、网络安全，以及面向超大型分布式组织的自动化。具体雇主、任职年份与规模数字不在此公布：本站由独立开发者运营，完整职业履历可应要求提供。
              </p>
              <p>
                塑造本站检查项的专业方向也是这些：数据中心网络架构(VXLAN/EVPN、spine-leaf)、BGP/MPLS/SRv6、面向 AI 集群的组播与低延迟交换、网络安全(Zscaler、Palo Alto、FortiGate、Cisco ASA/Firepower),以及用 Python、Ansible 和 Nornir 做自动化。爬虫访问、边缘分发和机器可读结构，正是 GEO 中属于网络问题的部分；而它们出自一个在网络问题上花了二十年的人之手。
              </p>
              <p className="text-sm text-[var(--ink-3)]">
                完整简历(含雇主与教育经历)可应要求提供，请联系{" "}
                <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>
                。电话号码、邮寄地址和出生日期刻意不在此公布。
              </p>

              <h2>这些文字是怎么产生的？</h2>
              <p>
                每一篇都从一次测量开始，然后经过同样的四个阶段。起草阶段使用语言模型；围绕它的三道检查，才是让结果可以发表的原因。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>阶段</th>
                      <th>会发生什么</th>
                      <th>什么会阻止发表</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1. 数据</td>
                      <td>读取研究数据行或规则目录，而不是凭记忆</td>
                      <td>出现一个两者中都不存在的数字</td>
                    </tr>
                    <tr>
                      <td>2. 起草</td>
                      <td>语言模型基于这些数据准备初稿</td>
                      <td>先起草、后取数，编造的数字就是这样混进来的</td>
                    </tr>
                    <tr>
                      <td>3. 检查</td>
                      <td>每个数字、名称和状态码都回溯到它的来源</td>
                      <td>一个无法追溯的数字</td>
                    </tr>
                    <tr>
                      <td>4. 发表</td>
                      <td>断言的局限被写进文章，而不是被省略</td>
                      <td>一个数据并不支持的标题</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                承认起草阶段使用了模型，令人不适，但这是事实。另一种做法——声称每一句话都出自某个人——在一个通篇主张「断言应当可核查」的站点上，会是一句假话。标准不在于谁敲下了这些字，而在于每个数字能否重跑、每项局限是否写明。
              </p>

              <h2>编辑规则是什么？</h2>
              <p>
                五条规则，每一条都可以对照已发布的内容来核查，而在这个品类里，每一条都在某些站点上被违反过。
              </p>
              <ul>
                <li>
                  <strong>没有赞助内容，也没有付费位置。</strong>报告就是报告；提及不出售，任何价格都不卖。
                </li>
                <li>
                  <strong>没有来源的数字不写。</strong>百分比、状态码和权重在发表前都会回溯到研究或规则目录。
                </li>
                <li>
                  <strong>局限与断言一起公布。</strong>扫描不会就你的品牌去询问模型；任何暗示相反的页面都在被更正。
                </li>
                <li>
                  <strong>更正在出错的地方进行。</strong>错误的数字就在刊载它的页面上修正，同时更新日期。
                </li>
                <li>
                  <strong>没有产量目标。</strong>一篇文章背后有一次测量，才会发表。现在有六篇；没有三十篇的配额。
                </li>
              </ul>
              <p>
                最后一条规则，正是让这个档案库看起来刻意显得单薄的原因。研究中的 30 个首页里，<strong>53%</strong> 被评为 F，<strong>30%</strong> 根本没有回应爬虫，没有一个达到 A——这些发现值得写出来，但一个为了凑成每周更新而注水的博客，会变成这个项目所针对的那种内容。
              </p>
              <p>
                决定这些等级的权重是公开的，也正是写作重点所在：AI 爬虫访问占 <strong>16%</strong>，机器可读性占{" "}
                <strong>12%</strong>，内容深度占 <strong>11%</strong>；而本站仍在发布的上下文文件，最多只占 100 分中的 3.3 分。关于那根小杠杆的断言，不值得写一篇文章。
              </p>

              <h2>本站如何获得资金？</h2>
              <p>
                两种方式，都印在站上，而不是让人事后才发现：由 Google 投放的广告，以及{" "}
                <Link href="/zh/pricing/">定价页面</Link>
                上描述的付费测量报告，起价 <strong>{SIGNAL_PRICE}</strong>。价格从{" "}
                <code>lib/pricing.ts</code>{" "}
                导入，与结账使用的是同一组数字；要改的时候，只在一处改。
              </p>
              <p>
                显而易见的利益冲突是：付费客户可能更想要一个更好看的数字。有三件事约束着它：扫描免费，对所有人完全一致；分数由代码根据抓取到的响应计算；付费报告解释一个结果，而不是改变它。读者可以跑一次扫描来验证第一点，再阅读源代码来验证另外两点。
              </p>
              <p>
                这里没有联盟链接，没有带评级的付费目录位，也没有暗示背书的厂商标志。如果某个外链能带来收入，它就不会出现在本站。
              </p>

              <h2>如何报告错误？</h2>
              <p>
                请写信到 <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>
                ，附上 URL、检查项，以及扫描报告了什么。这个项目收到的最有用的消息，是对某条具体规则的不同意见，因为规则集是公开的，具体的反对意见可以被回答，也可以被采纳。
              </p>
              <p>
                对文字的更正走同一条路。一个后来被证明有误的数字，是这个档案库唯一不能悄悄修好的东西，因为其余一切都建立在它上面。
              </p>

              <h2>本站刻意不做什么？</h2>
              <p>
                它不会向 AI 引擎询问你的品牌是否被提及，也不会把就绪度分数伪装成引用。这些局限写在{" "}
                <Link href="/zh/about/">关于页面</Link>
                上，也写在每一篇触及这个问题的文章里。
              </p>
              <p>
                它也不会公布一套自己执行不了的方法：测试会断言已发布的规则集与扫描器的行为不能分叉；这比一份手写、此后再无人核查的方法论页面是更强的承诺。
              </p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block keep the shell's 15px
                measure rather than inheriting the 17px body copy. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="关于作者的问题" items={FAQ_ITEMS} level="h3" />
              <Evidence
                title="证据与来源"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本文的每一个数字都来自已发表的研究，或来自扫描器执行的规则集；两者都有链接，也都可以重跑。"
              />
            </div>

            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">继续阅读</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/zh/insights/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    全部文章
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    六篇关于研究、规则及其局限的文章。
                  </p>
                </li>
                <li>
                  <Link
                    href="/zh/about/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    关于 LLMention
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    扫描器是什么、它刻意不做什么，以及方法如何公布。
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
