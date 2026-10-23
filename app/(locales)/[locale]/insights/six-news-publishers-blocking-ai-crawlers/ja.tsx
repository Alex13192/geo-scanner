import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { getInsight } from "@/lib/insights";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/ja/insights/six-news-publishers-blocking-ai-crawlers/` - the news-publisher piece, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only route would have deleted the Chinese essay that already ranks
 * here; two route files cannot answer one URL pattern. The route keeps
 * `generateStaticParams`, `generateMetadata` and the zh/ja branch, and imports TITLE and
 * DESCRIPTION from this module so its canonical can never describe a page whose heading says
 * something else.
 *
 * WHAT IS TRANSLATED: the English article's prose, its six headings, the table's caption-like
 * column headers and cell prose, the FAQ and the evidence note. The argument is translated, not
 * summarised: each paragraph makes the same claim as the English source.
 *
 * WHAT IS NOT: every domain, status code, score, percentage, crawler user-agent name,
 * `robots.txt`, the `blocked` / `refused` field names and the KDD quotation. Those are the data
 * and the technical vocabulary the piece turns on; rendering `bbc.com` or `403` in Japanese
 * would make the examples unverifiable.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/insights/`,
 * `/ja/insights/<slug>/`, `/ja/docs/allow-ai-crawlers/`). Anything that only exists in English
 * points at the English route with hrefLang="en" and says （英語）, so a reader is never
 * dropped onto an English page without being told.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 */
export const TITLE = "ニュース出版社6社、6社ともAIクローラーをブロック";
export const DESCRIPTION =
  "調査対象のニュースサイト6社すべてが、少なくとも1つのAIクローラーを拒否しています。実測スコア、robots.txt の該当行、そして各社がしているトレードオフを説明します。";

const insight = getInsight("six-news-publishers-blocking-ai-crawlers");

/** 日本語ページ自身の URL。JSON-LD の @id と mainEntityOfPage がこれを指す。 */
const JA_PATH = "/ja/insights/six-news-publishers-blocking-ai-crawlers/";

/** レジストリの "8 min read" から数を取り出す。読了時間の出どころを1か所に保つため。 */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

export default function JapaneseSixNewsPublishersPage() {
  const dict = getDictionary("ja");

  /*
   * 英語ページで PostShell が出すものと同じ BlogPosting。変えるのは inLanguage と URL だけ:
   * 日本語ページは英語記事の identity を借りるのではなく、自分の canonical の下で自分自身を
   * 記述する必要がある。
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
            href="/ja/insights/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← 記事一覧
          </Link>
        </div>
      </div>

      <main>
        {/* 英語版と同じ、余白を示す色の段を持つ全幅のタイトル帯。 */}
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
                サンプルに含まれるニュース出版社はすべて、ChatGPT、Claude、Perplexity、Doubao
                の背後にあるAIクローラーを少なくとも1つ拒否しています。これは測定可能なコストを伴うポリシーの選択であり、必ずしも誤りとは言えません。
              </p>
              {/*
                英語版のバイラインと同じ形。日付は ISO のまま表示する。formatDate は英語の月名を
                返すため、ここでは使わない。著者ページは英語のみなので、そのリンクには
                hrefLang="en" と（英語）を付ける。
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
                <span aria-hidden="true">·</span>
                <span>{READ_MINUTES} 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              英語版と同じ 17px の本文、同じ行長。見出し・リスト・表・リンクの体裁は
              `.doc-article` が持つ（このプロジェクトには Tailwind Typography が入っていない）。
            */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                調査対象の30のホームページのうち6つはニュース出版社で、サンプルの <strong>20%</strong>{" "}
                にあたります。そしてそのすべてが、追跡対象のAIクローラーを少なくとも1つ拒否しています。6社のうち3社は{" "}
                <code>robots.txt</code> でクローラーを拒否しながらページ自体は配信しており、4社目はブラウザには同じURLを配信しつつエッジでクローラーを拒否しています。残る2社は、クローラーかブラウザかを問わず、すべてのリクエストに 401 または 403 を返します。
              </p>
              <p>
                ニュースの6社は、より広い発見の中でも最も密度の高い部分でもあります。30サイトのうち{" "}
                <strong>9サイト</strong>（<strong>30%</strong>）が追跡対象のクローラーを少なくとも1つブロックしており、ニュースサイト6社はすべてそこに含まれています。
              </p>
              <p>
                興味深い問いは、彼らがブロックしているかどうか（明らかにブロックしています）ではなく、この測定においてそのブロックがどれだけのコストになっているか、そしてそのコストが誤りなのかどうかです。コンテンツライセンスを交渉している出版社にとっては、交渉の価格かもしれません。そうした交渉を一度もしたことのないサイトにとっては、たいてい誰も見ていない設定にすぎません。
              </p>

              <h2>6社とはどこで、それぞれ何を返しましたか？</h2>
              <p>
                3社は 200 を返し、<code>robots.txt</code> で追跡対象のクローラーを拒否していました。1社はクローラーに 403、ブラウザに 200 を返しました。2社はすべてのリクエストに 401 または 403 を返しました。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>ホームページ</th>
                      <th>返したステータス</th>
                      <th>追跡クローラーを許可しているか</th>
                      <th>スコア</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>bbc.com</td>
                      <td>200</td>
                      <td>いいえ — robots.txt</td>
                      <td>61</td>
                    </tr>
                    <tr>
                      <td>spiegel.de</td>
                      <td>200</td>
                      <td>いいえ — robots.txt</td>
                      <td>56</td>
                    </tr>
                    <tr>
                      <td>theguardian.com</td>
                      <td>200</td>
                      <td>いいえ — robots.txt</td>
                      <td>47</td>
                    </tr>
                    <tr>
                      <td>zeit.de</td>
                      <td>クローラーには 403、ブラウザには 200</td>
                      <td>いいえ — エッジで拒否</td>
                      <td>26</td>
                    </tr>
                    <tr>
                      <td>nytimes.com</td>
                      <td>403</td>
                      <td>いいえ — robots.txt</td>
                      <td>12</td>
                    </tr>
                    <tr>
                      <td>reuters.com</td>
                      <td>401</td>
                      <td>いいえ — robots.txt</td>
                      <td>12</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                6社のうち3社は、ページを配信しながらポリシーの層で拒否しています。Zeit はエッジで拒否しており、こちらはより厄介な種類です。
                <code>robots.txt</code> の行では表現できず、クローラーが交渉することもできません。最後の2社は誰にもページを配信していないため、そのスコアはページではなく拒否を表しています。
              </p>

              <h2>ポリシーによるブロックと拒否は何が違いますか？</h2>
              <p>
                ポリシーによるブロックは宣言です。ページは配信され、<code>robots.txt</code>{" "}
                がどのエージェントに使わせないかを示し、行儀のよいクローラーはそれに従います。
              </p>
              <p>
                拒否は壁です。サーバーはリクエスト自体に 401、403、429 を返すので、クローラーはコンテンツを見ることも、そのポリシーを検討することもできません。スキャナーがこれらを{" "}
                <code>blocked</code> と <code>refused</code> という2つのフィールドとして保持しているのは、必要な修正が正反対だからです。一方は編集する1行で、もう一方はCDNやWAFの設定にあるルールで、しかも別のチームが管理する別のシステムにあることがよくあります。
              </p>
              <p>
                Zeit は後者のきれいな例です。同じURLが、ブラウザ形式のリクエストには 200 を、クローラー形式のリクエストには 403 を返しました。これは{" "}
                <code>robots.txt</code> が意味を持つ前に起きるブロックであり、サンプルの中で唯一、user-agent 以外に何も変えずに外部から証明できる設定です。
              </p>

              <h2>この測定で、ブロックは出版社にいくらのコストをもたらしますか？</h2>
              <p>
                追跡クローラーのルールは、スコアの 16% を占める最も重いディメンションであるAIクローラーアクセスの内側にあります。追跡対象のクローラーを1つ拒否したサイトは、このディメンションを満点で通過できないため、コンテンツが考慮される前に総スコアの上限が下がります。目安として、コンテンツの深さは 11%、信頼は 10% なので、1回のブロックのコストはコンテンツのディメンション全体を上回ります。
              </p>
              <p>
                実測された効果は目に見えます。ページを配信した3社のスコアは 61、56、47 で、いずれも応答したサイトの調査平均 62 を下回っています。これは因果関係の証明ではありません。いずれも大きく複雑なホームページで、他のチェックでも失敗しています。しかし「編集上のものではなく構造上の減点」という見方とは整合しています。
              </p>

              <h2>これらのクローラーをブロックするのは誤りですか？</h2>
              <p>
                大手出版社にとっては、おそらく誤りではありませんし、それを誤りと断じるのはこのサイトの役割でもありません。6社中6社は6つの偶然ではなくパターンですが、1回のホームページスキャンでは、それがライセンス戦略なのか、ペイウォールなのか、bot対策ルールなのか、テンプレートからコピーした robots ファイルなのかを区別できません。
              </p>
              <p>
                トレードオフは読み取れます。ChatGPT、Claude、Perplexity、Doubao に読まれることは、出版社が引用される方法であり、引用は配信チャネルです。クローラーを拒否することは、そのチャネルをライセンス交渉の材料と引き換えること、交渉が存在しなければ何もないものと引き換えることになります。あるサイトがどちらの状況にあるかは、スキャンには見えません。
              </p>
              <p>
                そのほかのすべての人にとって重要な区別はこれです。これらのクローラーをブロックしている小さなサイトは、たいていライセンス戦略を実行しているわけではありません。テンプレートをコピーしたか、WAFルールを継承したか、あるスクレイピングの事故の際に「bot全般をブロック」するルールを追加して、user-agent のリストを見直さなかったのです。確認する価値があるのはこちらのケースで、それを順に説明しているのが
                <Link href="/ja/docs/allow-ai-crawlers/">robots.txt と WAF のガイド</Link>{" "}
                です。
              </p>

              <h2>サイト所有者はまず何を確認すべきですか？</h2>
              <p>
                <code>robots.txt</code> でクローラーの名前を読み、次にエッジ側の設定がそれと一致しているかを確認してください。両者は食い違うことがあり、その食い違いはブラウザからは見えません。
              </p>
              <ol>
                <li>
                  <code>robots.txt</code> で <code>GPTBot</code>、<code>ClaudeBot</code>、
                  <code>PerplexityBot</code>、<code>Bytespider</code> を探します。そのいずれかの下に{" "}
                  <code>Disallow: /</code> があれば、それはポリシーによるブロックです。
                </li>
                <li>
                  bot対策ルールがこれらの user-agent に 403 を返していないか確認します。スキャンはこれをポリシーによるブロックではなく拒否として報告します。外部から両者を見分ける唯一の方法です。
                </li>
                <li>
                  意図して決めてください。自分で選び、理由を言えるブロックと、継承して説明できないブロックは別物です。
                </li>
              </ol>

              <h2>どのように測定していて、この数字から分からないことは何ですか？</h2>
              <p>
                スキャナーは同じURLへの2つのリクエストを比較します。1つはクローラー形式、1つはブラウザ形式です。両者の差が拒否、
                <code>robots.txt</code> との一致がポリシーによるブロック、それ以外はすべてページとして採点されます。
              </p>
              <p>
                見えないのは意図や契約です。出版社がライセンス契約を結んでいるかは分かりませんし、ブロックが守られているかを確かめるためにクローラー自身のログを取りに行くこともありません。測っているのは玄関の公開状態であり、あらゆるドメインに対して1回のリクエストで機能する必要のあるツールとしては、それが正しい範囲です。
              </p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする。 */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="ニュース出版社についての質問"
                level="h3"
                items={[
                  {
                    q: "GPTBot をブロックすることは Google 検索をブロックすることと同じですか？",
                    a: "いいえ。検索インデックスとAIクローラーの制御は別々の user-agent なので、出版社は検索クローラーを残したままAIクローラーを拒否できます。スキャナーが追跡対象のクローラーを個別に報告するのはそのためです。",
                  },
                  {
                    q: "ブロックが原因で彼らのスコアは低いのですか？",
                    a: "一部はそうで、設計どおりです。追跡クローラーのルールはスコアの 16% を占めるディメンションの内側にあります。ただし6社のうち3社はクローラーにエラーも返しているため、その数字はページではなく拒否を測っています。",
                  },
                  {
                    q: "小さなサイトは彼らを見習うべきですか？",
                    a: "引用を望まないと決めた場合だけです。ライセンスを交渉している出版社はリーチを金銭と交換していますが、そうした契約のないサイトはリーチを何もないものと交換しているので、別の判断になります。",
                  },
                ]}
              />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="この記事のすべての数字は、公開された研究か、スキャナーが実際に実行するルールセットに由来しています。どちらもリンクがあり、再実行できます。"
              />
            </div>

            {/* 英語版のシェルが出す著者カード。役割と紹介文はここで一度だけ翻訳し、
                2つの言語版が同じことを言うようにする。 */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — LLMention のメンテナー
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                私は LLMention を構築し、維持しています。スキャナー、ルールセット、そしてその背後にある研究です。これらの作業はソースコードとして公開されているので、方法は信頼されるだけでなく検証できます。
              </p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  このサイトがどのように書かれ、どのように資金を得ているか（英語） →
                </Link>
              </p>
            </div>

            {/* この記事を引き継ぐ、翻訳済みの2本。どちらもこのアーカイブにある。 */}
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">続けて読む</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ja/insights/nine-homepages-never-answered/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    9つのホームページはクローラーに応答しなかった
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    この6社のうち3社の背後にあるステータスコードと、403 がページの測定ではない理由。
                  </p>
                </li>
                <li>
                  <Link
                    href="/ja/insights/thirty-homepages-none-graded-a/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    30のホームページをスキャンしたが、A は1つもなかった
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    この6行が置かれている分布の全体。
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
