import Link from "next/link";
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
import { OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

/**
 * `/ja/insights/nine-homepages-never-answered/` - the nine-homepages essay, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only route would have deleted the Chinese essay that already ranks
 * here; two route files cannot answer one URL pattern. The route keeps
 * `generateStaticParams`, `generateMetadata` and the zh/ja branch, and imports TITLE and
 * DESCRIPTION from this module so its canonical can never describe a page whose heading says
 * something else.
 *
 * WHAT IS TRANSLATED: the English article's prose, its seven headings, the table's column
 * headers and cell prose, the FAQ and the evidence note. The argument is translated, not
 * summarised - every number in it is the number the English source prints.
 *
 * WHAT IS NOT: the status codes and their names, `robots.txt`, every domain in the table, the
 * quoted KDD finding, the bibliographic source labels and the author's own name. Those are
 * identifiers or quotations; rendering `stackoverflow.com` or `520` in Japanese would change
 * what the piece is about.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/insights/`,
 * `/ja/insights/<slug>/`, `/ja/docs/allow-ai-crawlers/`, `/ja/methodology/`). Anything that
 * only exists in English points at the English route with hrefLang="en" and says （英語）, so a
 * reader is never dropped onto an English page without being told.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 */
export const TITLE = "9つのホームページはクローラーに応答しなかった";
export const DESCRIPTION =
  "30のホームページのうち9つは、クローラー形式のリクエストにエラーで応答しました。これらのステータスコードの意味と、平均値から除外する理由を説明します。";

const insight = getInsight("nine-homepages-never-answered");

/** 日本語ページ自身の URL。JSON-LD の @id と mainEntityOfPage がこれを指す。 */
const PATH = "/ja/insights/nine-homepages-never-answered/";

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "低いスコアは、私のサイトがスキャナーをブロックしているという意味ですか？",
    a: "そうである場合もあります。レポートを開き、まずステータスコードを読んでください。401、403、429、202、520 は、その数字があなたのページではなく応答を表していることを意味します。コンテンツについてのスコアになり得るのは 200 だけです。",
  },
  {
    q: "9行を削除して、きれいな平均を報告してはだめなのですか？",
    a: "削除するとサンプルで最も興味深い発見が隠れ、しかも平均は30ページとして提示されながら、黙って21ページについて述べることになるからです。これらの行は公開され、フラグが立てられ、平均から除外されています。",
  },
  {
    q: "それらを除外するのは、結果をよく見せているだけではないですか？",
    a: "数字を 44 から 62 に上げるので、それは派手に見せる選択ではなく、より地味な選択です。ルールは事前に宣言されています。平均は応答したページに対するもので、403 はページではないからです。",
  },
];

export default function JapaneseNineHomepagesPage() {
  const dict = getDictionary("ja");
  /*
   * `lib/insights.ts` が公開日と読了時間の唯一の出どころ。ここで書き換えるのは " min read"
   * の接尾辞だけで、数字そのものは実測値であり、写せば2つの言語版が食い違うことになる。
   */
  const readMinutes = insight.readTime.replace(" min read", "");

  /*
   * 英語ページで PostShell が出すものと同じ BlogPosting。変えるのは inLanguage と URL だけ:
   * @id と mainEntityOfPage はこのロケールの URL なので、日本語ページは英語記事の identity を
   * 借りるのではなく自分自身を記述する。
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
    inLanguage: "ja",
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
    articleSection: "方法",
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
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                方法
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                403 はページではありません。調査の9行はサイトではなくエラー応答を記述しており、それらを0として数えると、より派手で、より不正確な数字になります。
              </p>
              {/*
                公開日は ISO のまま表示する。lib/insights.ts の値であり JSON-LD も同じ値を
                繰り返すので、読者は照合できる。著者ページは英語のみなので、そのリンクには
                hrefLang="en" と（英語）を付ける。
              */}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  著者{" "}
                  <Link
                    href={AUTHOR.path}
                    hrefLang="en"
                    className="text-[var(--accent)] hover:opacity-75"
                  >
                    {AUTHOR.name}
                  </Link>
                  （英語）
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime={insight.published}>公開日 {insight.published}</time>
                <span aria-hidden="true">·</span>
                <span>{readMinutes} 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                調査対象の30のホームページのうち9つは、ページを一度も生成しませんでした。スキャナーがリクエストを送ると、401、403、429、202、または 520
                が返ってきました。これらの行は公開データに残っており、スコアも付いていますが、そのスコアはサイトではなくエラー応答を測ったものです。
              </p>
              <p>
                この除外は、調査のヘッドラインとなる数字の背後にある方法上の判断です。9つを0として数えると平均は 44、未測定として数えると 62 になります。このサイトが公開しているのは2つ目の数字で、この記事はそれを論じるものです。結果をより地味に見せる部分も含めて。これは大きな補正でもあります。サンプルの{" "}
                <strong>30%</strong> がページを一度も生成しておらず、それらを除外すると平均は 18 ポイント、つまり公開値の{" "}
                <strong>29%</strong> 動きます。
              </p>

              <h2>9つとはどこで、何を返しましたか？</h2>
              <p>
                4つのステータスコードと1つの非標準コードが9つすべてを説明します。9つのうち、ブラウザには配信しながらクローラーを拒否したのは2つだけ（<strong>22%</strong>）です。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>ホームページ</th>
                      <th>ステータス</th>
                      <th>ブラウザで同じURL</th>
                      <th>コードの意味</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>bmw.com</td>
                      <td>520</td>
                      <td>520</td>
                      <td>エッジのエラー。標準のコードではありません</td>
                    </tr>
                    <tr>
                      <td>nytimes.com</td>
                      <td>403</td>
                      <td>403</td>
                      <td>すべてのクライアントに禁止</td>
                    </tr>
                    <tr>
                      <td>reuters.com</td>
                      <td>401</td>
                      <td>401</td>
                      <td>認証が必要</td>
                    </tr>
                    <tr>
                      <td>stackoverflow.com</td>
                      <td>403</td>
                      <td>403</td>
                      <td>すべてのクライアントに禁止</td>
                    </tr>
                    <tr>
                      <td>perplexity.ai</td>
                      <td>403</td>
                      <td>403</td>
                      <td>すべてのクライアントに禁止</td>
                    </tr>
                    <tr>
                      <td>google.com</td>
                      <td>429</td>
                      <td>429</td>
                      <td>リクエストが多すぎる</td>
                    </tr>
                    <tr>
                      <td>amazon.com</td>
                      <td>202</td>
                      <td>202</td>
                      <td>受理されたが、ページは返されていない</td>
                    </tr>
                    <tr>
                      <td>zeit.de</td>
                      <td>403</td>
                      <td>200</td>
                      <td>クローラーだけを拒否</td>
                    </tr>
                    <tr>
                      <td>openai.com</td>
                      <td>403</td>
                      <td>200</td>
                      <td>クローラーだけを拒否</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>それぞれのステータスコードは、ここでは何を意味しますか？</h2>
              <p>
                5つのコードのうち4つは壁を表し、1つはスキャナーに対する制限を表します。互換性はなく、修正方法もそれぞれ異なります。403 が最も多い答えです。9行のうち
                <strong>5行</strong>（<strong>56%</strong>）が forbidden（禁止）で返ってきました。
              </p>
              <ul>
                <li>
                  <strong>401 — 認証が必要。</strong>{" "}
                  サーバーは応答する前に資格情報を求めます。ペイウォールや非公開のオリジンがこのコードを返します。
                </li>
                <li>
                  <strong>403 — 禁止。</strong>{" "}
                  サーバーはリクエストを理解し、拒否しました。これはbot対策の一般的な形であり、修正可能な設定を最もよく覆い隠すコードです。
                </li>
                <li>
                  <strong>429 — リクエストが多すぎる。</strong>{" "}
                  これはサイトではなくスキャナーについてのコードです。リクエストレートが制限されたので、答えはページの評価ではなく制限です。捨てるのではなく、そのまま公開します。
                </li>
                <li>
                  <strong>202 — 受理、ただしページなし。</strong>{" "}
                  202 は確認であり、文書ではありません。採点するものが何もないため、薄いコンテンツとして採点するのではなく中止として記録されます。
                </li>
                <li>
                  <strong>520 — 非標準のエッジエラー。</strong>{" "}
                  オリジンがエッジで扱えないものを返したときに Cloudflare が発行します。答えではなく、答えられなかったことです。
                </li>
              </ul>

              <h2>なぜ 403 にもスコアが付くのですか？</h2>
              <p>
                レポートは何が起きたかを示さなければならず、数字を欠けさせるとそれが隠れるからです。スコアは実際に返ってきたものから計算され、中止として記録され、平均から除外されます。
              </p>
              <p>
                これは調査の「すべてを公開する」という原則と同じです。この9行はサンプルで最も興味深い部分です。よく知られたサイトのリストでも{" "}
                <strong>30%</strong>{" "}
                が最初のリクエストではクローラーに読まれないこと、そしてこれらの行を黙って捨てるツールは、より小さな世界について整った数字を報告することになることを示しています。
              </p>

              <h2>拒否とブロックは何が違うのですか？</h2>
              <p>
                拒否とは、同じURLがブラウザ形式のリクエストには配信し、クローラー形式のリクエストは拒んだということです。ブロックとは、クローラーが受け入れられなかったということで、
                <code>robots.txt</code> のルールによる場合も、その拒否による場合もあります。
              </p>
              <p>
                この区別を残す価値があるのは、証明できるからです。Zeit と OpenAI は、スキャンがそれを示せる2行です。まったく同じURLが、ある user-agent には 200、別の user-agent には 403 を返しました。表の他のすべての拒否は全員に適用される壁であり、それをクローラーブロックと呼ぶのは観察ではなく仮定になります。
              </p>

              <h2>この除外は調査の平均をどう変えますか？</h2>
              <p>
                平均を 44 から 62 に動かします。9つを0として扱うと、分母には加わるのに、彼らが得た 142
                ポイントは加わらないため、平均は 18 下がります。
              </p>
              <p>
                どちらの数字も同じ表に対する算術です。しかし、ウェブサイトについて述べているのは片方だけです。403 のページには語数も見出しもエンティティマークアップもなく、それを0点にすることは、文書が存在しないことを「ひどく作られた文書」だと言うことになります。
              </p>

              <h2>自分のスキャンがエラーを返したらどうすればよいですか？</h2>
              <p>
                スコアより先にステータスを読んでください。200 以外は設定の問題であり、コンテンツの作業をいくら積んでも動きません。
              </p>
              <ol>
                <li>
                  bot対策ルールが、スキャナーが送る user-agent に 403 を返していないか確認します。
                  <Link href="/ja/docs/allow-ai-crawlers/">クローラーガイド</Link>に名前が載っています。
                </li>
                <li>
                  サイトがログインやペイウォールの後ろにある場合、スキャンには見えず、その数字はあなたのコンテンツについてのものではありません。
                </li>
                <li>
                  ステータスが 429 なら、待ってから再実行してください。それは制限であり、再実行が修正のすべてです。
                </li>
                <li>
                  200 が返るようになると、スコアは変更すべきことのリストになります。それまでは、ドアについてのレポートです。
                </li>
              </ol>

              <h2>成功だけではなく失敗も公開するのはなぜですか？</h2>
              <p>
                読めたものだけを報告するサンプルは、到達可能性によって選ばれたサンプルであり、その選択自体が発見だからです。9つの拒否は、有名なドメインでもクローラーアクセスが形式的なものではないという証拠です。
              </p>
              <p>
                また、読者が監査できる形で方法を誠実に保ちます。結果を悪くする行も含めて、すべての行は
                <Link href="/study/data/" hrefLang="en">
                  調査データのエンドポイント（英語）
                </Link>
                にあり、スコアを生成したルールセットは
                <Link href="/ja/methodology/">方法論のページ</Link>にあります。
              </p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする。 */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="この9つについての質問" items={FAQ_ITEMS} level="h3" />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="この記事のすべての数字は、公開された研究か、スキャナーが実行するルールセットに由来しています。どちらもリンクがあり、再実行できます。"
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — LLMention のメンテナー
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                私は LLMention を構築し、維持しています。スキャナー、ルールセット、そしてその背後にある研究です。これらの作業はソースコードとして公開されているので、方法は信頼されるだけでなく検証できます。
              </p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link
                  href={AUTHOR.path}
                  hrefLang="en"
                  className="text-[var(--accent)] hover:opacity-75"
                >
                  このサイトがどのように書かれ、どのように資金を得ているか（英語） →
                </Link>
              </p>
            </div>

            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">続けて読む</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ja/insights/six-news-publishers-blocking-ai-crawlers/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    ニュース出版社6社、6社ともAIクローラーをブロック
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    この9行のうち3行はニュース出版社で、その記事は彼らが何を拒否していたかを説明しています。
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
                    この除外が変える分布と、ヘッドラインの数字が 44 ではない理由。
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
