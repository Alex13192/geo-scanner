import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { getInsight, insightPath } from "@/lib/insights";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/ja/blog/thirty-homepages-none-graded-a/` - the 30-homepage study, in Japanese.
 *
 * TRANSLATED FROM THE ENGLISH ARTICLE, NOT FROM THE CHINESE ONE: `app/(en)/blog/
 * thirty-homepages-none-graded-a/page.tsx` is the source, so the title band, the byline, both
 * tables, all six sections, the FAQ, the evidence block, the author card and the related links
 * match it one for one. The Chinese write-up is a sibling translation, not an intermediary.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file, so each
 * language's body lives beside it and `page.tsx` only decides which one to render. A
 * Japanese-only `page.tsx` would have deleted the Chinese article that is already published.
 * Metadata lives in `page.tsx`, because one segment cannot export both `metadata` and
 * `generateMetadata`.
 *
 * WHAT STAYS AS PUBLISHED: every score, percentage, grade letter, site domain, rule count,
 * status code, `robots.txt`, the study data URL and the paper quotation. Those are the data the
 * piece reports; a translated number would be a different number. The title and dek are exported
 * so the route's metadata reads the same strings the page prints.
 *
 * WHY THE LINKS ARE MIXED: /ja/methodology/ and the two continuing pieces have Japanese
 * versions and are linked in Japanese. The study data endpoint and the author page do not, so
 * those links keep hrefLang="en" and the （英語） marker that tells a reader they are leaving the
 * translation.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 */
export const TITLE = "30 個のホームページをスキャンし、A 評価はゼロだった";
export const DESCRIPTION =
  "30 サイト調査の分布をすべて公開します。平均スコア、上限、そして最高が A ではなく B である理由。";

const insight = getInsight("thirty-homepages-none-graded-a");

/** Built from the slug, because a second literal would drift from the registry one day. */
const JA_PATH = `/ja${insightPath(insight.slug)}`;

/**
 * The registry stores "9 min read", which a Japanese byline cannot print. Parsing the number
 * keeps the reading time in one place, so a changed value still moves both pages together.
 */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

export default function JapaneseThirtyHomepagesPage() {
  const dict = getDictionary("ja");

  /*
   * The same BlogPosting shape PostShell emits for the English page, with `inLanguage` and the
   * URL changed: a Japanese page has to describe itself under its own canonical rather than
   * borrow the English article's identity.
   */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}${JA_PATH}#article`,
    name: TITLE,
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: insight.published,
    dateModified: insight.published,
    inLanguage: "ja",
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: AUTHOR.name,
      url: `${SITE_URL}${AUTHOR.path}`,
    },
    about: { "@id": `${SITE_URL}/#author` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${JA_PATH}` },
    image: `${SITE_URL}${OG_IMAGE.url}`,
    articleSection: "研究",
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)] selection:bg-blue-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <LocaleHeader locale="ja" dict={dict} />

      {/* 日本語の記事一覧への戻り口。英語版のシェルと同じ位置に置く。 */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/ja/blog/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 記事一覧
          </Link>
        </div>
      </div>

      <main>
        {/* 英語版と同じ全幅のタイトル帯。色の段差が余白を示す。 */}
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
                この調査には誰もが引用する数字が 1 つあり、ほとんど語られない数字が 4 つあります。この記事ではその背後にある分布を、ページをまったく返さなかった 9 行も含めて説明します。
              </p>
              {/*
                PostShell のバイラインを日本語にしたもの。日付は ISO のまま表示する。
                formatDate は英語の月名を返し、読者が確認できる公開日であることが
                バイラインの目的だからである。
              */}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  著者{" "}
                  <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    {AUTHOR.name}
                  </Link>
                  （英語）
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime={insight.published}>公開日 {insight.published}</time>
                {insight.updated ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>更新日 {insight.updated}</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{READ_MINUTES} 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              英語版と同じ行長の 17px 本文。`.doc-article` が見出し・リスト・表・リンクの
              体裁を持つ（このプロジェクトには Tailwind Typography が入っていない）。
            */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>2026 年 10 月 3 日、私たちはスキャナで 30 の有名サイトのホームページに 1 回ずつリクエストを送り、その時点で存在していた 38 件のルールに照らして応答を採点しました。A 評価に到達したサイトは 1 つもありません。最高は <strong>83</strong>、応答したサイトの平均は <strong>62</strong>、そして最大のグループである <strong>30 サイト中 16 サイト（53%）</strong>が F 評価でした。</p>
              <p>この結果はどちらの方向にも過剰に読まれやすいものです。平均的なウェブサイトがひどく作られているという意味ではありません。これらは平均的なウェブサイトではありません。AI 検索がすべての人にとって壊れているという意味でもありません。以下で示すのは、見出しの数字の背後にある分布です。ページをまったく返さなかった 9 行も含まれます。発見は分布の形にあり、単一の平均にはないからです。</p>

              <h2>30 サイトは実際に何点だったのか？</h2>
              <p>B に到達したのは 2 サイト、C が 4、D が 8、F が 16 でした。90 点台に到達したサイトはなく、その帯がこのスキャナの言う A です。</p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>評価</th>
                      <th>スコア帯</th>
                      <th>サイト数</th>
                      <th>30 サイトに占める割合</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>A</td>
                      <td>90–100</td>
                      <td>0</td>
                      <td>0%</td>
                    </tr>
                    <tr>
                      <td>B</td>
                      <td>80–89</td>
                      <td>2</td>
                      <td>7%</td>
                    </tr>
                    <tr>
                      <td>C</td>
                      <td>70–79</td>
                      <td>4</td>
                      <td>13%</td>
                    </tr>
                    <tr>
                      <td>D</td>
                      <td>60–69</td>
                      <td>8</td>
                      <td>27%</td>
                    </tr>
                    <tr>
                      <td>F</td>
                      <td>60 未満</td>
                      <td>16</td>
                      <td>53%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>上位 5 サイトは順に、salesforce.com が 83、siemens.com が 80、vercel.com が 79、cloudflare.com が 77、stripe.com が 75 です。応答した中で最下位は sap.com の 41 で、それでもレンダリングされたページであり、それを測ったスコアです。</p>

              <h2>なぜ上限は B で、A が欠けているのではないのか？</h2>
              <p>得点が 12 の加重ディメンションに分散しており、A にはほぼすべてのディメンションが必要だからです。サンプルで最良のページは、1 つの大きなルールではなく、互いに関係のない複数のルールで合計 7〜9 点を失っていました。</p>
              <p>これが単一の数字の隠している部分です。ページを読めないエンジンは一度にスコアの 16% を奪います。エンティティの欠落は 12%、引用と出典のルールはさらに 11% です。コンテンツが優れていても、マークアップ、鮮度、そして誰も見たことのない 2〜3 のルールで A を逃すことがあります。</p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>ディメンション</th>
                      <th>重み</th>
                      <th>問いかけていること</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>AI クローラーアクセス</td>
                      <td>16%</td>
                      <td>クローラーはそもそもページを取得できるか？</td>
                    </tr>
                    <tr>
                      <td>機械可読性</td>
                      <td>12%</td>
                      <td>マークアップは解析可能か、エンティティは宣言されているか？</td>
                    </tr>
                    <tr>
                      <td>コンテンツの深さ</td>
                      <td>11%</td>
                      <td>本文は十分か、構造は明確か？</td>
                    </tr>
                    <tr>
                      <td>引用可能性と根拠</td>
                      <td>11%</td>
                      <td>数字、引用、外部ソースはあるか？</td>
                    </tr>
                    <tr>
                      <td>回答準備性</td>
                      <td>10%</td>
                      <td>見出しは問いの形で、その下に短い回答があるか？</td>
                    </tr>
                    <tr>
                      <td>信頼と権威</td>
                      <td>10%</td>
                      <td>著者、連絡先、sameAs、そして表示された日付。</td>
                    </tr>
                    <tr>
                      <td>セマンティック構造</td>
                      <td>8%</td>
                      <td>見出しの階層、ランドマーク、単一の H1。</td>
                    </tr>
                    <tr>
                      <td>メタデータと発見可能性</td>
                      <td>7%</td>
                      <td>title、description、canonical、Open Graph。</td>
                    </tr>
                    <tr>
                      <td>AI コンテキストファイル</td>
                      <td>5%</td>
                      <td><code>robots.txt</code> のシグナルと llms.txt。</td>
                    </tr>
                    <tr>
                      <td>鮮度</td>
                      <td>5%</td>
                      <td>機械可読で、十分に新しい日付。</td>
                    </tr>
                    <tr>
                      <td>国際対応</td>
                      <td>3%</td>
                      <td>言語と hreflang の宣言。</td>
                    </tr>
                    <tr>
                      <td>配信とモバイル</td>
                      <td>2%</td>
                      <td>viewport、ペイロード、JavaScript への依存なし。</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>9 つのエラー応答を 0 点として数えたらどうなりますか？</h2>
              <p>平均は 62 から 44 に下がりますが、その 2 つ目の数字は測定ではなく算術です。403 はひどく作られたページではありません。サイトが応答を拒否しているのであり、それを 0 点として採点することは、その拒否をコンテンツの問題として描写することになります。</p>
              <p>そこでこの調査はその 9 行を平均から除外し、表には残しています。30 回のリクエストのうち、<strong>21 回（70%）</strong>は採点可能なページを返しました。残りの <strong>9 回（30%）</strong>は 401、403、429、202、520 のいずれかを返しています。この区別が重要なのは、2 つの失敗が逆の対応を必要とするからです。自分が返したページの低いスコアは修正リストであり、403 は誰を入れるかという決定です。それは別記事の主題で、下にリンクしています。</p>

              <h2>30 のホームページだけの調査は、どこまで信頼できるのか？</h2>
              <p>固定サンプルで、各サイト 1 ページ、1 回だけ読み取り、ホームページの背後のページについては何も言えません。ウェブ全体の推定ではなく、実際のサイトでチェックがどう振る舞うかの例として扱ってください。</p>
              <ul>
                <li><strong>サンプルはランダムではありません。</strong> 15 カテゴリにまたがる 30 の知名サイトを選んでおり、これは「見てわかる」ことには役立ちますが、統計には役立ちません。</li>
                <li><strong>各サイト 1 ページ。</strong> ホームページはサイト上で最も代表的なページではないことが多く、スキャナは渡された URL だけを採点します。</li>
                <li><strong>ルールセットは変わっています。</strong> これらの行は 38 件のルールの下で収集されました。スキャナは現在 40 件を提供しており、調査ページは履歴を静かに再採点するのではなく、そのことを明記しています。</li>
                <li><strong>9 行はエラー応答です。</strong> それらは公開され、印を付けられ、平均から除外されています。削除すれば、このデータの中で最も興味深い発見が隠れてしまうからです。</li>
              </ul>

              <h2>自分のサイトがどこに位置するかを知るには？</h2>
              <p>スキャンを実行してください。1 回のリクエストで済み、アカウントも不要で、この調査が使ったのと同じチェックを、数字だけでなく各結果を生んだ根拠とともに返します。</p>
              <p>有用な比較対象は 83 ではありません。あなたのページが失敗したルールの一覧です。その一覧は実行可能で、83 はそうではないからです。まず全行を見たい場合は、30 行すべてが <Link href="/study/data/" hrefLang="en">調査データエンドポイント（英語）</Link>に公開されており、スコアの背後にある手法は <Link href="/ja/methodology/">方法論ページ</Link>にあります。</p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする。 */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="この調査についての質問"
                level="h3"
                items={[
                  {
                    q: "60 点台だと引用されないという意味ですか？",
                    a: "いいえ。スコアは、そのページが引用を可能にする状態にあるか（クロール可能、解析可能、抽出可能）を測るものです。現在いずれかのエンジンがあなたを引用しているかは測っていませんし、それを保証できるスコアもありません。",
                  },
                  {
                    q: "なぜこの 30 サイトなのか？",
                    a: "カテゴリをまたいだ知名度で選ばれたもので、無作為抽出ではありません。そのため分布は例として有用で、ウェブ全体の推定としては役に立ちません。調査ページにもそう書かれています。",
                  },
                  {
                    q: "この実行は再現できますか？",
                    a: "はい。すべての行は /study/data/ に公開されており、公開 API を通じて再スキャンできます。異議は同じリクエストを実行することで決着できます。",
                  },
                ]}
              />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="この記事のすべての数字は、公開された調査か、スキャナが実際に実行するルールセットから来ています。どちらもリンクされており、再実行できます。"
              />
            </div>

            {/* PostShell が描画する著者カード。役割と自己紹介はここで一度だけ翻訳し、
                言語版どうしが同じことを言うようにする。 */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — LLMention の維持管理者
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                私は LLMention を構築し、維持しています。スキャナ、ルールセット、そしてその背後の調査です。作業はソースコードとして公開されているため、手法は信頼するしかないものではなく、検証できるものになっています。
              </p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  このサイトがどのように書かれ、資金提供されているか（英語） →
                </Link>
              </p>
            </div>

            {/* この記事を続ける 2 本。どちらもこのアーカイブに入っている。 */}
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">続けて読む</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ja/blog/nine-homepages-never-answered/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    9つのホームページはクローラーに応答しなかった
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    30 行のうち 9 行がページではなくエラー応答である理由と、それが平均に何をもたらすか。
                  </p>
                </li>
                <li>
                  <Link
                    href="/ja/blog/entity-markup-gap/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    30 サイト中 22 サイトが、AI に自社を推測させている
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    サンプルで最も一般的な単一の構造的欠落と、それを埋める 4 行の JSON。
                  </p>
                </li>
              </ul>
            </div>

            <div className="mx-auto mt-14 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link
                href="/#scan"
                hrefLang="en"
                className="text-sm text-[var(--accent)] hover:opacity-75"
              >
                無料で自分のサイトを診断（英語） →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="ja" dict={dict} target={homePath} />
    </div>
  );
}
