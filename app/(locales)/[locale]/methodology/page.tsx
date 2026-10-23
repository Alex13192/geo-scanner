import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG, GRADE_BANDS } from "@/lib/geo/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";
import { social } from "@/lib/og";

/**
 * `/zh/methodology/` - the method page, in Chinese.
 *
 * WHY THIS PAGE FIRST, AND WHY ONLY IN CHINESE. The audit's biggest content complaint was
 * that a reader could not check the method; the rule pages and the guides are long, but this
 * is the page a skeptical buyer actually opens before paying. It is translated alone, and the
 * hreflang pair names only English and Chinese, because a locale that has no page must not be
 * advertised as having one. The remaining deep pages follow the same shape.
 *
 * WHY THE NUMBERS COME FROM THE CATALOGUE: the check count, the weights and the grade
 * thresholds are imported, not typed. A translated page that quotes a different total would
 * be the exact drift this site sells protection against.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "GEO 分数是怎么算出来的";
const DESCRIPTION =
  "计分规则、12 个加权维度、两类「不适用」的处理方式,以及扫描器明确不能告诉你的三件事。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/methodology/",
    languages: {
      en: "/methodology/",
      "zh-Hans": "/zh/methodology/",
      "x-default": "/methodology/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/methodology/" }),
};

const DIMENSION_LABELS_ZH: Record<string, string> = {
  "ai-crawler-access": "AI 爬虫访问",
  "machine-readability": "机器可读性",
  "content-depth": "内容深度",
  citability: "可引用性与证据",
  "answer-readiness": "答案就绪度",
  "trust-authority": "信任与权威",
  "semantic-structure": "语义结构",
  metadata: "元数据与可发现性",
  "llms-txt": "AI 上下文文件",
  freshness: "时效性",
  multilingual: "国际就绪度",
  delivery: "交付与移动端",
};

export default async function ChineseMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");
  const runnable = CHECK_CATALOG.filter((check) => !check.alias);
  const totalWeight = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              方法论 · Methodology
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.15] tracking-[-0.02em] md:text-5xl">
              {TITLE}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              这一页写的每一条规则,都是扫描器真正执行的规则。下面的内容由引擎运行时使用的同一份目录生成,
              所以「公布的方法」和「运行的方法」不会分叉。
            </p>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              方法最近修订:2026-10-23 · 免费扫描读取一个页面;完整方法见英文版{" "}
              <Link href="/methodology/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                /methodology/
              </Link>
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-20">
            <article className="doc-article max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <h2>总分是怎么算的</h2>
              <p>
                扫描器执行 <strong>{runnable.length} 项明确检查</strong>,分布在{" "}
                <strong>12 个加权维度</strong>里。每项检查在它所属的维度内有一个固定分值;
                维度的分数是「拿到的分 / 这一维度可拿的总分」,总分则是 12 个维度分数按权重合并:
              </p>
              <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed">{`总分 = Σ ( 维度得分 × 维度权重 / 100 )

其中 维度得分 = 已得点数 / 可评估点数 × 100
且   Σ 维度权重 = ${totalWeight}`}</pre>
              <p>
                没有「分数下限」。一项检查都不满足的页面会接近 0 分,而不会被抬到一个看起来体面的最低分。
                页面类型不适用的检查会被整体移出计算,而不是记为失败。
              </p>

              <h2>两类「不适用」,以及为什么它不是扣分</h2>
              <p>
                第一种是<strong>页面类型排除</strong>:隐私政策页不会被要求提供专家引述或统计数字,
                文章正文页也不会被要求链接 About 和 Contact——因为单页抓取看不到页面外面的导航。
                这些检查从一开始就不该问这一类页面。
              </p>
              <p>
                第二种是<strong>规则级不适用</strong>,由规则根据它在页面上看到的东西决定。
                例如 hreflang 要求页面声明其他语言版本;一个什么都没声明的页面,无法被判断为「没有翻译」还是
                「翻译了但没声明」,所以这一项标为不适用。两种情况都不是失败,也不是折扣:
                分数和分母同时移除这些点,剩余维度按自身权重重新归一化,总分始终是「实际可评估部分」的百分比。
                因此满分只意味着<strong>「对这一个页面适用的规则没有失败」</strong>,而不是「目录里的每条规则都通过了」。
              </p>

              <h2 id="what-changed">改了什么,什么时候改的</h2>
              <ul>
                <li>
                  <time dateTime="2026-10-23" className="font-mono text-[var(--ink-3)]">2026-10-23</time>{" "}
                  — 单语页面的 hreflang 不再被计为失败。规则要求页面声明至少两种语言版本;
                  单语站没有可声明的东西,而一次抓取也分不清「单语站」和「有翻译但没声明」。
                  现在这种情况标为不适用并移出计分;声明了恰好一个语言代码的页面仍然失败。
                </li>
                <li>
                  <time dateTime="2026-10-03" className="font-mono text-[var(--ink-3)]">2026-10-03</time>{" "}
                  — 检查可以被标记为「对该页面类型不适用」并移出计分。法律页、联系页和文章页的
                  六项豁免被公开,剩余维度重新归一化,所以根路径的分数与之前完全一致。
                </li>
              </ul>

              <h2>等级对应的分数区间</h2>
              <div className="not-prose overflow-x-auto my-5">
                <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">等级</th>
                      <th className="text-left px-4 py-2.5 font-semibold">分数</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-2)]">
                    {GRADE_BANDS.map((band, index) => (
                      <tr key={band.grade} className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5 font-mono font-bold text-[var(--ink-1)]">
                          {band.grade}
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          {band.min}
                          {index === 0 ? "-100" : `-${GRADE_BANDS[index - 1].min - 1}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>12 个维度与权重</h2>
              <div className="not-prose overflow-x-auto my-5">
                <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">维度</th>
                      <th className="text-left px-4 py-2.5 font-semibold">权重</th>
                      <th className="text-left px-4 py-2.5 font-semibold">检查数</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-2)]">
                    {DIMENSION_CATALOG.map((dimension) => (
                      <tr key={dimension.id} className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5">
                          {DIMENSION_LABELS_ZH[dimension.id] ?? dimension.label}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{dimension.weight}%</td>
                        <td className="px-4 py-2.5 font-mono">
                          {runnable.filter((check) => check.dimension === dimension.id).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>扫描器不能告诉你什么</h2>
              <ul>
                <li>
                  <strong>它不会向任何 AI 引擎询问你。</strong> 这里不测量 ChatGPT 今天是否推荐你的品牌,
                  而是测量你的页面是否处于「可能被引用」的状态。这是两个问题,混在一起是这一领域最常见的过度声称。
                </li>
                <li>
                  <strong>一次被拒绝的请求不是被封禁的证据。</strong> 大型站点按 IP 而不是 user-agent 验证爬虫,
                  所以扫描器的请求可能被拒绝,而真实的 GPTBot 流量一切正常。是否屏蔽 AI 爬虫,这里以{" "}
                  <code>robots.txt</code> 为准——那是站点自己声明的意图。
                </li>
                <li>
                  <strong>默认只描述一个页面,除非请求站点扫描。</strong> 单 URL 扫描看不到内页的站级问题;
                  站点扫描会多读 sitemap 里列出的几个页面(默认 5 个、最多 10 个),用完全相同的规则分别打分,
                  逐页报告,不会把首页分数冒充整站分数。
                </li>
              </ul>

              <h2>常见问题</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">为什么我的页面分数很低,但看起来内容不少?</dt>
                  <dd className="mt-1">
                    分数只衡量「AI 能不能抓取、解析并引用」,不衡量内容质量。正文很多但标题不是问句、没有可提取的列表或表格、没有日期和作者,
                    这些都会拉低可引用性维度。
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">免费扫描和付费报告有什么区别?</dt>
                  <dd className="mt-1">
                    免费扫描读取你的页面并按 40 条规则打分;付费报告把你的买家问题交给 AI 引擎,记录回答、提及的名字和被引用的域名。
                    扫描器从不询问引擎,报告才会。
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">两个不同日期的分数可以直接比较吗?</dt>
                  <dd className="mt-1">
                    只有当两次测量使用同一版规则时才可以。每次影响分数的规则变更都记录在上面的变更记录里,日期就是比较的前提。
                  </dd>
                </div>
              </dl>

              <h2>方法与来源</h2>
              <ul>
                <li>
                  <a href="https://developers.google.com/search/docs/crawling-indexing/robots/intro" className="text-[var(--accent)] hover:opacity-75">
                    Google Search Central:robots.txt 规范
                  </a>
                  ——爬虫访问维度检查的依据。
                </li>
                <li>
                  <a href="https://schema.org/" className="text-[var(--accent)] hover:opacity-75">
                    schema.org
                  </a>
                  ——JSON-LD 实体与内容类型检查引用的词表。
                </li>
                <li>
                  <a href="https://llmstxt.org/" className="text-[var(--accent)] hover:opacity-75">
                    llmstxt.org
                  </a>
                  ——/llms.txt 的公开约定。
                </li>
                <li>
                  <a href="https://www.bing.com/webmasters/help/webmasters-guidelines-30fba23a" className="text-[var(--accent)] hover:opacity-75">
                    Bing Webmaster Guidelines
                  </a>
                  ——可发现性与时效性检查的参照。
                </li>
              </ul>

              <h2>继续阅读</h2>
              <ul>
                <li>
                  <Link href="/checks/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    全部 {runnable.length} 条规则(英文)
                  </Link>
                  ——每条规则的点数、通过条件和证据。
                </li>
                <li>
                  <Link href="/study/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    30 个首页的公开研究(英文)
                  </Link>
                  ——用同一套公开 API 采集。
                </li>
                <li>
                  <Link href="/pricing/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    付费测量报告(英文)
                  </Link>
                  ——扫描器不询问引擎;报告询问。
                </li>
              </ul>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "为什么我的页面分数很低,但看起来内容不少?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "分数只衡量 AI 能不能抓取、解析并引用,不衡量内容质量。正文很多但标题不是问句、没有可提取的列表或表格、没有日期和作者,都会拉低可引用性维度。",
                },
              },
              {
                "@type": "Question",
                name: "免费扫描和付费报告有什么区别?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "免费扫描读取页面并按 40 条规则打分;付费报告把买家问题交给 AI 引擎,记录回答、提及的名字和被引用的域名。",
                },
              },
              {
                "@type": "Question",
                name: "两个不同日期的分数可以直接比较吗?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "只有当两次测量使用同一版规则时才可以。每次影响分数的规则变更都记录在变更记录里。",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
