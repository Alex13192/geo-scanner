import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG, GRADE_BANDS } from "@/lib/geo/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";
import { JA_DIMENSION_LABELS } from "@/lib/i18n/ja-copy";
import { ZH_DIMENSION_LABELS } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";

/**
 * `/<locale>/methodology/` — the method page, in Chinese and in Japanese.
 *
 * なぜ 1 ファイルで 2 言語なのか。`app/(locales)/[locale]/` の 1 つのルートに置ける page は
 * 1 つだけで、`/zh/methodology/` と `/ja/methodology/` は同じルートを共有している。日本語版を
 * 別ファイルにすると中国語版の URL が 404 になり、しかもこのページ自身が hreflang で
 * zh-Hans を宣言している（＝存在しない URL を宣言することになる）ので、locale で分岐する
 * 1 ファイルに両方を置いている。`zh` と `ja` 以外は `dynamicParams = false` と notFound() で
 * 弾くので、レンダリングできる URL は増えない。
 *
 * WHY THE NUMBERS COME FROM THE CATALOGUE: the check count, the weights and the grade
 * thresholds are imported, not typed. A translated page that quotes a different total would
 * be the exact drift this site sells protection against.
 */
export const dynamicParams = false;

/** 公開している再実行可能なチェック。alias は同じチェックの別結果を記述したものなので数えない。 */
const RUNNABLE_CHECKS = CHECK_CATALOG.filter((check) => !check.alias);
const TOTAL_WEIGHT = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);

export function generateStaticParams() {
  /* 中国語版は既存のまま残す。日本語版だけを返すと `/zh/methodology/` が消える。 */
  return [{ locale: "zh" }, { locale: "ja" }];
}

const ZH_TITLE = "GEO 分数是怎么算出来的";
const ZH_DESCRIPTION =
  "计分规则、12 个加权维度、两类「不适用」的处理方式，以及扫描器明确不能告诉你的三件事。";

const JA_TITLE = "GEO スコアはどう計算されるか";
const JA_DESCRIPTION = `採点ルール、${DIMENSION_CATALOG.length} 個の加重ディメンション、「当てはまらない」の扱い、そしてスキャナが答えられないこと。`;

/**
 * 何が、いつ変わったか（新しい順）。日付はここが唯一の出所で、上の「最終改訂」はこの配列の
 * 先頭を読む。文章で日付を二度書くと、履歴に載っていない改訂を名乗れてしまうためである。
 * 翻訳文だけを変えた編集は載せない。スコアが動きうる変更だけを記録する。
 */
const JA_METHOD_CHANGELOG = [
  {
    date: "2026-10-23",
    change:
      "宣言している言語コードが 2 つ未満のページでは、hreflang が採点されなくなりました。このルールはページに他の言語版の宣言を求めるもので、単一言語のサイトには宣言する対象がありません。スキャナは 1 ページだけを取得するため、「単一言語のサイト」と「翻訳はあるが宣言していないサイト」を区別できません。そこで、何も宣言していない場合は「当てはまらない」として採点から除外します。言語コードをちょうど 1 つだけ宣言しているページは、これまでどおり失敗です。",
  },
  {
    date: "2026-10-03",
    change:
      "チェックを、判断できないページ種別に対して「当てはまらない」とマークし、失敗として数えるのではなく採点から除外できるようになりました。法務ページ、お問い合わせページ、記事ページ向けの 6 件の除外を公開しています（プライバシーポリシーは、誰も引用していないからといって劣ったページではありません）。残りのディメンションは再正規化されるため、ルートパスのスコアは以前とまったく同じです。",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "ja") {
    return {
      title: JA_TITLE,
      description: JA_DESCRIPTION,
      alternates: {
        canonical: "/ja/methodology/",
        /* 3 言語すべてを宣言する。x-default は英語（唯一の完全版）を指す。 */
        languages: {
          en: "/methodology/",
          "zh-Hans": "/zh/methodology/",
          ja: "/ja/methodology/",
          "x-default": "/methodology/",
        },
      },
      ...social({ title: JA_TITLE, description: JA_DESCRIPTION, url: "/ja/methodology/" }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/methodology/",
        /* ja を足すのは、日本語版がこのページを zh-Hans として宣言しているためである。
           hreflang は相互でなければ片側だけの宣言になる。 */
        languages: {
          en: "/methodology/",
          "zh-Hans": "/zh/methodology/",
          ja: "/ja/methodology/",
          "x-default": "/methodology/",
        },
      },
      ...social({ title: ZH_TITLE, description: ZH_DESCRIPTION, url: "/zh/methodology/" }),
    };
  }

  return {};
}

export default async function LocalizedMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale === "ja") return <JapaneseMethodology />;
  if (locale === "zh") return <ChineseMethodology />;
  notFound();
}

const DIMENSION_LABELS_ZH = ZH_DIMENSION_LABELS;

function ChineseMethodology() {
  const dict = getDictionary("zh");

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
              {ZH_TITLE}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              这一页写的每一条规则，都是扫描器真正执行的规则。下面的内容由引擎运行时使用的同一份目录生成,
              所以「公布的方法」和「运行的方法」不会分叉。
            </p>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              方法最近修订:2026-10-23 · 免费扫描读取一个页面；完整方法见英文版{" "}
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
                扫描器执行 <strong>{RUNNABLE_CHECKS.length} 项明确检查</strong>,分布在{" "}
                <strong>12 个加权维度</strong>里。每项检查在它所属的维度内有一个固定分值;
                维度的分数是「拿到的分 / 这一维度可拿的总分」,总分则是 12 个维度分数按权重合并:
              </p>
              <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed">{`总分 = Σ ( 维度得分 × 维度权重 / 100 )

其中 维度得分 = 已得点数 / 可评估点数 × 100
且   Σ 维度权重 = ${TOTAL_WEIGHT}`}</pre>
              <p>
                没有「分数下限」。一项检查都不满足的页面会接近 0 分，而不会被抬到一个看起来体面的最低分。
                页面类型不适用的检查会被整体移出计算，而不是记为失败。
              </p>

              <h2>两类「不适用」,以及为什么它不是扣分</h2>
              <p>
                第一种是<strong>页面类型排除</strong>:隐私政策页不会被要求提供专家引述或统计数字,
                文章正文页也不会被要求链接 About 和 Contact——因为单页抓取看不到页面外面的导航。
                这些检查从一开始就不该问这一类页面。
              </p>
              <p>
                第二种是<strong>规则级不适用</strong>,由规则根据它在页面上看到的东西决定。
                例如 hreflang 要求页面声明其他语言版本；一个什么都没声明的页面，无法被判断为「没有翻译」还是
                「翻译了但没声明」,所以这一项标为不适用。两种情况都不是失败，也不是折扣:
                分数和分母同时移除这些点，剩余维度按自身权重重新归一化，总分始终是「实际可评估部分」的百分比。
                因此满分只意味着<strong>「对这一个页面适用的规则没有失败」</strong>,而不是「目录里的每条规则都通过了」。
              </p>

              <h2 id="what-changed">改了什么，什么时候改的</h2>
              <ul>
                <li>
                  <time dateTime="2026-10-23" className="font-mono text-[var(--ink-3)]">2026-10-23</time>{" "}
                  — 单语页面的 hreflang 不再被计为失败。规则要求页面声明至少两种语言版本;
                  单语站没有可声明的东西，而一次抓取也分不清「单语站」和「有翻译但没声明」。
                  现在这种情况标为不适用并移出计分；声明了恰好一个语言代码的页面仍然失败。
                </li>
                <li>
                  <time dateTime="2026-10-03" className="font-mono text-[var(--ink-3)]">2026-10-03</time>{" "}
                  — 检查可以被标记为「对该页面类型不适用」并移出计分。法律页、联系页和文章页的
                  六项豁免被公开，剩余维度重新归一化，所以根路径的分数与之前完全一致。
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
                          {RUNNABLE_CHECKS.filter((check) => check.dimension === dimension.id).length}
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
                  而是测量你的页面是否处于「可能被引用」的状态。这是两个问题，混在一起是这一领域最常见的过度声称。
                </li>
                <li>
                  <strong>一次被拒绝的请求不是被封禁的证据。</strong> 大型站点按 IP 而不是 user-agent 验证爬虫,
                  所以扫描器的请求可能被拒绝，而真实的 GPTBot 流量一切正常。是否屏蔽 AI 爬虫，这里以{" "}
                  <code>robots.txt</code> 为准——那是站点自己声明的意图。
                </li>
                <li>
                  <strong>默认只描述一个页面，除非请求站点扫描。</strong> 单 URL 扫描看不到内页的站级问题;
                  站点扫描会多读 sitemap 里列出的几个页面(默认 5 个、最多 10 个),用完全相同的规则分别打分,
                  逐页报告，不会把首页分数冒充整站分数。
                </li>
              </ul>

              <h2>常见问题</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">为什么我的页面分数很低，但看起来内容不少?</dt>
                  <dd className="mt-1">
                    分数只衡量「AI 能不能抓取、解析并引用」,不衡量内容质量。正文很多但标题不是问句、没有可提取的列表或表格、没有日期和作者,
                    这些都会拉低可引用性维度。
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">免费扫描和付费报告有什么区别?</dt>
                  <dd className="mt-1">
                    免费扫描读取你的页面并按 40 条规则打分；付费报告把你的买家问题交给 AI 引擎，记录回答、提及的名字和被引用的域名。
                    扫描器从不询问引擎，报告才会。
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">两个不同日期的分数可以直接比较吗?</dt>
                  <dd className="mt-1">
                    只有当两次测量使用同一版规则时才可以。每次影响分数的规则变更都记录在上面的变更记录里，日期就是比较的前提。
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
                  <Link href="/zh/checks/" className="text-[var(--accent)] hover:opacity-75">
                    全部 {RUNNABLE_CHECKS.length} 条规则(中文总览)
                  </Link>
                  ——每条规则的点数、所属维度,以及逐条规则页。
                </li>
                <li>
                  <Link href="/zh/study/" className="text-[var(--accent)] hover:opacity-75">
                    30 个首页的公开研究
                  </Link>
                  ——用同一套公开 API 采集。
                </li>
                <li>
                  <Link href="/pricing/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    付费测量报告(英文)
                  </Link>
                  ——扫描器不询问引擎；报告询问。
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
                name: "为什么我的页面分数很低，但看起来内容不少?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "分数只衡量 AI 能不能抓取、解析并引用，不衡量内容质量。正文很多但标题不是问句、没有可提取的列表或表格、没有日期和作者，都会拉低可引用性维度。",
                },
              },
              {
                "@type": "Question",
                name: "免费扫描和付费报告有什么区别?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "免费扫描读取页面并按 40 条规则打分；付费报告把买家问题交给 AI 引擎，记录回答、提及的名字和被引用的域名。",
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

function JapaneseMethodology() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              方法論 · Methodology
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.15] tracking-[-0.02em] md:text-5xl">
              {JA_TITLE}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              このページに書かれているルールは、スキャナが実際に実行しているルールそのものです。
              以下の内容は、エンジンが実行時に使うのと同じカタログから生成しています。
              そのため、「公開している方法」と「動いている方法」が食い違うことはありません。
            </p>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              方法の最終改訂：{JA_METHOD_CHANGELOG[0].date} · 無料スキャンが読み取るのは 1 ページです ·
              完全な方法は英語版{" "}
              <Link href="/methodology/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                /methodology/
              </Link>
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-20">
            <article className="doc-article max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <h2>合計スコアはどう計算されるか</h2>
              <p>
                スキャナは <strong>{RUNNABLE_CHECKS.length} 件の明示的なチェック</strong>を、
                <strong>{DIMENSION_CATALOG.length} 個の加重ディメンション</strong>に分けて実行します。
                各チェックは、所属するディメンションの中で固定の配点を持ちます。
                ディメンションのスコアは「獲得した点数 ÷ そのディメンションで獲得できる点数」で、
                合計スコアはそのディメンションスコアを重みで統合したものです。
              </p>
              <pre className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed">{`合計 = Σ ( ディメンションスコア × ディメンション重み / 100 )

ここで ディメンションスコア = 獲得点数 / 評価可能点数 × 100
かつ   Σ ディメンション重み = ${TOTAL_WEIGHT}`}</pre>
              <p>
                スコアの下限はありません。どのチェックも満たしていないページは 0 に近いスコアになり、
                見た目のよい最低点まで引き上げられることはありません。
                ページ種別に当てはまらないチェックは、失敗として数えられるのではなく、計算から丸ごと外されます。
              </p>

              <h2>「当てはまらない」の 2 種類と、それが減点ではない理由</h2>
              <p>
                1 つ目は<strong>ページ種別による除外</strong>です。プライバシーポリシーのページに専門家の引用や
                統計値を求めることはしませんし、記事本文のページに About と Contact へのリンクも求めません。
                単一ページの取得では、ページの外側にあるナビゲーションが見えないからです。
                こうしたチェックは、そもそもその種別のページに問うべきものではありません。
              </p>
              <p>
                2 つ目は<strong>ルール単位の不適用</strong>で、ページ種別ではなく、ルールがページ上で見つけた内容に
                基づいて判断します。たとえば hreflang は、ページに他の言語版を宣言することを求めます。
                何も宣言していないページは、「翻訳が存在しない」のか「翻訳はあるが宣言していない」のかを
                判別できません。そのため、この項目は不適用として扱います。
                どちらも失敗ではなく、割引でもありません。点数は分子からも分母からも外れ、残ったディメンションは
                自身の重みの合計に対して再正規化されます。合計は常に「実際に評価できた部分」の百分率です。
                したがって満点が意味するのは<strong>「このページに当てはまるルールが 1 つも失敗していない」</strong>
                ということであり、「カタログの全ルールを通過した」ということではありません。
              </p>

              <h2 id="what-changed">何が、いつ変わったか</h2>
              <ul>
                {JA_METHOD_CHANGELOG.map((entry) => (
                  <li key={entry.date}>
                    <time dateTime={entry.date} className="font-mono text-[var(--ink-3)]">
                      {entry.date}
                    </time>{" "}
                    — {entry.change}
                  </li>
                ))}
              </ul>

              <h2>グレードとスコア帯</h2>
              <div className="not-prose overflow-x-auto my-5">
                <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">グレード</th>
                      <th className="text-left px-4 py-2.5 font-semibold">スコア</th>
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

              <h2>{DIMENSION_CATALOG.length} 個のディメンションと重み</h2>
              <div className="not-prose overflow-x-auto my-5">
                <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
                  <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">ディメンション</th>
                      <th className="text-left px-4 py-2.5 font-semibold">重み</th>
                      <th className="text-left px-4 py-2.5 font-semibold">チェック数</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink-2)]">
                    {DIMENSION_CATALOG.map((dimension) => (
                      <tr key={dimension.id} className="border-t border-[var(--line)]">
                        <td className="px-4 py-2.5">
                          {JA_DIMENSION_LABELS[dimension.id] ?? dimension.label}
                        </td>
                        <td className="px-4 py-2.5 font-mono">{dimension.weight}%</td>
                        <td className="px-4 py-2.5 font-mono">
                          {RUNNABLE_CHECKS.filter((check) => check.dimension === dimension.id).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2>スキャナが答えられないこと</h2>
              <ul>
                <li>
                  <strong>どの AI エンジンにも、あなたについて問い合わせません。</strong>{" "}
                  ここで測っているのは、ChatGPT が今日あなたのブランドを推薦しているかどうかではありません。
                  あなたのページが「引用されうる状態」にあるかどうかです。これは別の問いであり、
                  両者を混同することがこの領域で最もよくある過大な主張です。
                </li>
                <li>
                  <strong>拒否されたリクエストは、ブロックの証拠ではありません。</strong>{" "}
                  大規模なサイトは user-agent ではなく IP アドレスでクローラーを検証します。
                  そのため、スキャナのリクエストが拒否されても、実際の GPTBot のトラフィックは正常に配信されている
                  ことがあります。AI クローラーをブロックしているかどうかは、ここでは{" "}
                  <code>robots.txt</code> を基準にします。それはサイト自身が表明した意図です。
                </li>
                <li>
                  <strong>サイトスキャンを要求しない限り、1 ページだけを記述します。</strong>{" "}
                  単一 URL のスキャンでは、下層ページにあるサイト全体の問題は見えません。
                  サイトスキャンは sitemap に記載されたいくつかのページを追加で読み取り（既定 5 ページ、
                  最大 10 ページ）、まったく同じルールで個別に採点し、ページごとに報告します。
                  トップページのスコアをサイト全体のスコアとして提示することはありません。
                </li>
              </ul>

              <h2>よくある質問</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">
                    ページの内容は少なくないのに、スコアが低いのはなぜですか。
                  </dt>
                  <dd className="mt-1">
                    スコアが測るのは「AI が取得・解析・引用できるか」だけで、内容の質は測りません。
                    本文が多くても、見出しが問いの形になっていない、抽出できるリストや表がない、
                    日付や著者が示されていない、といった点が引用可能性のディメンションを下げます。
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">
                    無料スキャンと有料レポートは何が違いますか。
                  </dt>
                  <dd className="mt-1">
                    無料スキャンはページを読み取り、{RUNNABLE_CHECKS.length} 件のルールで採点します。
                    有料レポートは購入者の質問を AI エンジンに渡し、回答、言及された名前、引用されたドメインを
                    記録します。スキャナがエンジンに問い合わせることはなく、問い合わせるのはレポートだけです。
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--ink-1)]">
                    日付の違う 2 つのスコアは、そのまま比べられますか。
                  </dt>
                  <dd className="mt-1">
                    2 回の測定が同じ版のルールで行われている場合にかぎり、比べられます。
                    スコアに影響するルール変更はすべて上の変更履歴に記録しており、日付が比較の前提になります。
                  </dd>
                </div>
              </dl>

              <h2>方法と出典</h2>
              <ul>
                <li>
                  <a href="https://developers.google.com/search/docs/crawling-indexing/robots/intro" className="text-[var(--accent)] hover:opacity-75">
                    Google Search Central：robots.txt の仕様
                  </a>
                  ——クローラーアクセスのディメンションが参照している仕様です。
                </li>
                <li>
                  <a href="https://schema.org/" className="text-[var(--accent)] hover:opacity-75">
                    schema.org
                  </a>
                  ——JSON-LD のエンティティとコンテンツタイプのチェックが参照する語彙です。
                </li>
                <li>
                  <a href="https://llmstxt.org/" className="text-[var(--accent)] hover:opacity-75">
                    llmstxt.org
                  </a>
                  ——/llms.txt の公開された取り決めです。
                </li>
                <li>
                  <a href="https://www.bing.com/webmasters/help/webmasters-guidelines-30fba23a" className="text-[var(--accent)] hover:opacity-75">
                    Bing Webmaster Guidelines
                  </a>
                  ——発見可能性と鮮度のチェックの参照先です。
                </li>
              </ul>

              <h2>さらに読む</h2>
              <ul>
                <li>
                  <Link href="/ja/checks/" className="text-[var(--accent)] hover:opacity-75">
                    全 {RUNNABLE_CHECKS.length} 件のルール（日本語の一覧）
                  </Link>
                  ——各ルールの配点、所属するディメンション、個別ルールページ。
                </li>
                <li>
                  <Link href="/study/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    トップページ 30 件の公開調査（英語）
                  </Link>
                  ——同じ公開 API で収集しました。
                </li>
                <li>
                  <Link href="/ja/pricing/" className="text-[var(--accent)] hover:opacity-75">
                    料金と有料レポート
                  </Link>
                  ——スキャナはエンジンに問い合わせません。レポートは問い合わせます。
                </li>
              </ul>

              {/* 日本語ページの戻り口。ヘッダーのロゴ以外に、本文の終わりからも戻れるようにする。 */}
              <p className="mt-10 text-xs">
                <Link href="/ja/" className="text-[var(--accent)] hover:opacity-75">
                  ← トップページへ戻る
                </Link>
              </p>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="ja" dict={dict} target={homePath} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "ページの内容は少なくないのに、スコアが低いのはなぜですか。",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "スコアが測るのは AI が取得・解析・引用できるかだけで、内容の質は測りません。本文が多くても、見出しが問いの形になっていない、抽出できるリストや表がない、日付や著者が示されていない、といった点が引用可能性のディメンションを下げます。",
                },
              },
              {
                "@type": "Question",
                name: "無料スキャンと有料レポートは何が違いますか。",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `無料スキャンはページを読み取り、${RUNNABLE_CHECKS.length} 件のルールで採点します。有料レポートは購入者の質問を AI エンジンに渡し、回答、言及された名前、引用されたドメインを記録します。`,
                },
              },
              {
                "@type": "Question",
                name: "日付の違う 2 つのスコアは、そのまま比べられますか。",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "2 回の測定が同じ版のルールで行われている場合にかぎり、比べられます。スコアに影響するルール変更はすべて変更履歴に記録しており、日付が比較の前提になります。",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
