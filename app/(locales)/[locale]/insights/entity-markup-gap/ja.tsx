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
 * `/ja/insights/entity-markup-gap/` - the entity-markup essay, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only `page.tsx` would have deleted the Chinese essay, which is the
 * version that already exists for this URL.
 *
 * WHAT IS TRANSLATED: the English article's prose, headings, tables, FAQ, the evidence note,
 * the author card and the related links. The text is a translation of the ENGLISH page, so
 * the argument is the same one, not a different Japanese argument.
 * WHAT IS NOT: the schema.org vocabulary (`Organization`, `WebSite`, `Person`,
 * `LocalBusiness`, `sameAs`, `@type`, `@id`), the JSON-LD sample, every domain, every score
 * and every percentage. Those are the subject matter or the data; translating them would
 * change what the reader is told to paste or what the numbers say. The Evidence quotation,
 * its attribution and the source labels also stay in English verbatim - a translated
 * quotation would change what the cited paper says while still looking like a quotation.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/insights/`,
 * `/ja/docs/schema-org-jsonld/`, `/ja/methodology/`). Anything that only exists in English
 * points at the English route with hrefLang="en" and says （英語）, so a reader is never
 * dropped onto an English page without being told.
 *
 * TITLE and DESCRIPTION are exported because the dispatcher's generateMetadata returns them
 * for `ja`, so the canonical can never describe a page whose visible heading says something
 * else.
 */
export const TITLE = "30 サイト中 22 サイトが、AI に自社を推測させている";
export const DESCRIPTION =
  "調査対象のホームページで Organization または WebSite エンティティを宣言しているのは 8 サイトだけでした。ブランドを解決するモデルにとってそれが何を犠牲にするのか、そしてそれを修正するマークアップを説明します。";

const insight = getInsight("entity-markup-gap");

/**
 * The two URLs this pair claims. Written out rather than built from `insightPath`, because
 * that helper is the English base: the canonical and the `ja` alternate must differ, and
 * deriving one from the other is how an hreflang pair ends up pointing at itself.
 */
const PATH = "/ja/insights/entity-markup-gap/";

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "エンティティマークアップはランキング要因ですか？",
    a: "直接的には違います。これは解決の補助であり、モデルに名前、URL、そしてその名前を照合できる外部プロフィールの集合を与えます。ページが引用されるかどうかはそれよりもはるかに多くのことに依存し、引用を保証するマークアップはありません。",
  },
  {
    q: "JSON-LD は多ければ多いほど役立ちますか？",
    a: "いいえ。ページを正直に説明する有効なグラフは役立ちますが、ページが支持しない型で埋め尽くされた大きなグラフはキーワード詰め込みと同じ負債であり、可視ページとの矛盾を見つけた消費側はどちらも信じません。",
  },
  {
    q: "数字を動かす最小の変更は何ですか？",
    a: "name、url、sameAs を持つ Organization ノード 1 つと、それを参照する WebSite ノードです。それだけで当サイトの 2 つのルールを通り、サンプルのほとんどが欠けているのはそのマークアップです。",
  },
];

export default function JapaneseEntityMarkupGapPage() {
  const dict = getDictionary("ja");
  /*
   * `lib/insights.ts` is the single source for the publication date and the reading time.
   * Only the " min read" suffix is rewritten here: the number itself is the measured one,
   * and copying it into this file would let the two language versions disagree.
   */
  const readMinutes = insight.readTime.replace(" min read", "");

  /*
   * The same BlogPosting shape the English route emits, with the one field that must differ:
   * `inLanguage`. The @id and mainEntityOfPage are this locale's URL, so the Japanese page
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
    articleSection: "研究",
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)] selection:bg-blue-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <LocaleHeader locale="ja" dict={dict} />

      {/* The way back to the Japanese archive, kept where PostShell puts the English one. */}
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
                研究
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                名前をドメインに結び付けられないモデルは推測するしかなく、推測は引用ではありません。それを修正するマークアップは 4 行の
                JSON で、サンプルのほとんどはそれを持っていません。
              </p>
              {/*
                The publication date stays ISO: it is the value in lib/insights.ts and the
                one the JSON-LD repeats, so a reader can check it. The author link goes to
                the English author page and says so, as every localized page does.
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
                研究対象の 30 のホームページのうち 22 は、Organization、WebSite、Person、LocalBusiness
                のエンティティをまったく宣言していません。これはサンプルの <strong>73%</strong>{" "}
                に当たり、モデルが名前を確実に知っている企業もいくつか含まれています。名前を知っていることと、その名前をどのドメインが所有しているかを教えられることは、別の問題だからです。
              </p>
              <p>
                30 のうち 19、つまり <strong>63%</strong> は、エンティティノードも{" "}
                <code>sameAs</code> のリストも持っていません。そうしたページでは、あらゆる消費側がブランドを可視テキストから推測しなければならず、推測こそが静かに間違う部分です。モデルはその企業を完璧に知っていても、名前をあなたのドメインに結び付けられないことがあります。
              </p>

              <h2>エンティティを宣言するとは何をすることか</h2>
              <p>
                解析に成功した 1 つの JSON-LD ブロックに、Organization、WebSite、Person、LocalBusiness
                のいずれかの <code>@type</code> が含まれていること。ルールはこれだけで、4 点の価値があります。
              </p>
              <p>
                意図的に浅く定義しています。スキャナーは解析に成功したグラフのどこかに現れる型を、ネストされたものも含めて読み取るため、記事の{" "}
                <code>author</code> プロパティの中にある Person
                ノードでも、ページのどこにも Organization ノードがなくても条件を満たします。根拠の行には一致した型が表示されるので、合格は「ブランドのエンティティが存在する」という断定ではなく、見たものを述べたものになります。
              </p>

              <h2>30 のうちいくつが宣言しているか</h2>
              <p>
                エンティティ型を宣言しているのは 8、<code>sameAs</code> を持つのは 9、両方を持つのは 6、どちらも持たないのは 19
                です。興味深いのは重なりです。この 2 つのプロパティは一緒に追加されることが多く、片方だけを持つサイトこそ見る価値があります。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>シグナル</th>
                      <th>サイト数</th>
                      <th>30 に占める割合</th>
                      <th>採点される場所</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>エンティティ型を宣言</td>
                      <td>8</td>
                      <td>27%</td>
                      <td>機械可読性、全体の 12%</td>
                    </tr>
                    <tr>
                      <td>sameAs リストを持つ</td>
                      <td>9</td>
                      <td>30%</td>
                      <td>信頼性と権威性、全体の 10%</td>
                    </tr>
                    <tr>
                      <td>両方</td>
                      <td>6</td>
                      <td>20%</td>
                      <td>両方のディメンション</td>
                    </tr>
                    <tr>
                      <td>どちらもなし</td>
                      <td>19</td>
                      <td>63%</td>
                      <td>両方のディメンション</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>合格したページと不合格のページはどう違うか</h2>
              <p>
                パターンは人が期待するものではありません。高得点のページのいくつかはエンティティを持ち{" "}
                <code>sameAs</code> を持たず、低めのページのいくつかはエンティティなしで{" "}
                <code>sameAs</code> を持っています。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>ホームページ</th>
                      <th>スコア</th>
                      <th>エンティティ</th>
                      <th>sameAs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>salesforce.com</td>
                      <td>83</td>
                      <td>はい</td>
                      <td>いいえ</td>
                    </tr>
                    <tr>
                      <td>vercel.com</td>
                      <td>79</td>
                      <td>はい</td>
                      <td>はい</td>
                    </tr>
                    <tr>
                      <td>shopify.com</td>
                      <td>72</td>
                      <td>いいえ</td>
                      <td>はい</td>
                    </tr>
                    <tr>
                      <td>bbc.com</td>
                      <td>61</td>
                      <td>いいえ</td>
                      <td>はい</td>
                    </tr>
                    <tr>
                      <td>github.com</td>
                      <td>60</td>
                      <td>いいえ</td>
                      <td>いいえ</td>
                    </tr>
                    <tr>
                      <td>microsoft.com</td>
                      <td>48</td>
                      <td>いいえ</td>
                      <td>いいえ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                このうち 2 行が示唆に富みます。Salesforce はサンプル全体で最高スコアでありながら{" "}
                <code>sameAs</code> を持っていません。識別の仕事はエンティティノードがしており、プロフィールへのリンクは一度も追加されていないのです。Shopify はエンティティを宣言せずに{" "}
                <code>sameAs</code> を通しているため、プロフィールはページが一度も名指ししていない何かを指しています。アンカーのない結合です。
              </p>

              <h2>モデルはこのマークアップを実際にどう使うか</h2>
              <p>
                文字列を 1 つのものに解決するために使います。<code>name</code>、
                <code>url</code>、<code>sameAs</code> を伴う <code>Organization</code>{" "}
                が、「この名前、このドメイン、これらのプロフィールは同じエンティティだ」と言う形です。
              </p>
              <p>
                それがなければ、あなたのブランドを解決する消費側はページのテキストと、すでに信じているものだけを使うしかありません。それは何もないことではありません。企業名がはっきり書かれた大きな文書は不可視ではないのです。しかしそれは推測であり、推測には宣言にはない失敗モードがあります。同名の別企業、略称、ブランドの改名、あるいは企業を知っていてドメインを知らないモデルです。
              </p>
              <p>
                これが 2 つのルールが別のディメンションで採点される理由です。エンティティノードは機械可読性のプロパティです。パーサーが指し示せるものを見られるかどうか。
                <code>sameAs</code>{" "}
                リストは信頼性のプロパティです。そのものが、他所に存在するアカウントを指しているかどうか。前者はこのページについて、後者は世界の中のあなたのブランドについてです。
              </p>

              <h2>このチェックはエンティティが正しいことを証明するか</h2>
              <p>
                いいえ。ルールページにもそう書かれています。テストされるのは存在だけです。
                <code>sameAs</code> のプロフィールを取得するものはなく、宣言された名前をページタイトルと比較するものもありません。
              </p>
              <p>
                それに最適化する前に、この限界を知っておく価値があります。可視コピーのどこにも名前が出てこない Person
                ノードを宣言してもページは合格でき、両方を読んだモデルはその不一致に気づきます。ルールは解析可能性の下限であり、身元の証明書ではありません。
              </p>

              <h2>両方のルールを通る最小のマークアップは？</h2>
              <p>
                Organization ノード 1 つ、それを参照する WebSite ノード 1 つ、そして{" "}
                <code>sameAs</code> 配列です。プレースホルダーは置き換えてください。残さないでください。
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
                このスニペットには意図的な点が 2 つあります。<code>@id</code>{" "}
                の値は実際のオリジン上のフラグメントなので、各ページはブランドを繰り返し述べるのではなく同じノードを参照できます。そして配列は水増ししていません。存在する 2 つのプロフィールは、存在しない 6 つより価値があります。このプロパティは消費側が検証できる主張だからです。
              </p>

              <h2>先にやる価値が高いのはどちらか</h2>
              <p>
                エンティティノードです。2 回採点されるからです。1 回は直接、もう 1 回は <code>sameAs</code>{" "}
                を意味のあるものにするアンカーとして。
              </p>
              <ol>
                <li>
                  Organization ノードをすべてのページに、またはすべてのページを包むレイアウトに追加します。どちらでも機能しますが、1
                  つのファイルのほうが正確に保ちやすいです。
                </li>
                <li>
                  実際に維持しているプロフィールで <code>sameAs</code> を追加します。死んだプロフィールは壊れた主張であり、モデルが反証できる主張は、存在しない主張より高いコストになります。
                </li>
                <li>
                  ブロックが解析できることを検証します。構文エラーは消費側にとってはマークアップがないのと区別がつかず、追加したと思っている読者にとっては何もないより悪いです。
                </li>
                <li>
                  スキャンを再実行します。根拠の行に一致した型が表示されるので、合格は仮定ではなく観察できます。
                </li>
              </ol>
              <p>
                完全な手順を載せたガイドは{" "}
                <Link href="/ja/docs/schema-org-jsonld/">Schema.org JSON-LD ガイド</Link>、重みの背後にある算術は{" "}
                <Link href="/ja/methodology/">方法論のページ</Link>にあります。
              </p>
            </article>

            {/* Outside the article, so the FAQ and the evidence block keep the shell's 15px
                measure rather than inheriting the 17px body copy. */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="エンティティマークアップについての質問" items={FAQ_ITEMS} level="h3" />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="この記事の数字はすべて、公開された研究か、スキャナーが実行するルールセットに由来しています。どちらもリンクがあり、再実行できます。"
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — LLMention のメンテナー
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                私は LLMention
                を構築し、維持しています。スキャナー、ルールセット、そしてその背景にある研究です。この仕事はソースコードとして公開されているので、方法は信じるしかないものではなく、検証できるものになっています。
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
                    href="/ja/insights/thirty-homepages-none-graded-a/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    私たちは 30 のホームページをスキャンし、A を取ったものは一つもありませんでした
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    エンティティマークアップはスコアの 12% です。複数のディメンションが同時に失敗したときのコストを分布図が示しています。
                  </p>
                </li>
                <li>
                  <Link
                    href="/ja/insights/reading-a-failed-check/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    失敗したチェックを読み解き、正しい場所を直す方法
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    失敗したエンティティチェックは、マークアップがないのか、パーサーがそれを見なかったのかのどちらかを意味します。必要な修正はそれぞれ異なります。
                  </p>
                </li>
              </ul>
            </div>

            <div className="mx-auto mt-14 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link href="/#scan" hrefLang="en" className="text-sm text-[var(--accent)] hover:opacity-75">
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
