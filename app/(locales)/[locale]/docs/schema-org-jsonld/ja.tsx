import Link from "next/link";
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

/**
 * `/ja/docs/schema-org-jsonld/` - the entity-markup guide, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` are one route file
 * (`page.tsx`), because a `[locale]` segment has exactly one. A Japanese-only `page.tsx` would
 * have deleted the Chinese guide, and two route files cannot share one URL pattern. So the route
 * dispatches between this body and `./zh.tsx`, which is the Chinese body moved unchanged.
 *
 * WHAT IS TRANSLATED: the English article's headings, prose, list items, FAQ and the evidence
 * note. WHAT IS NOT: the JSON-LD sample, the schema.org vocabulary (Organization, WebSite,
 * SoftwareApplication, Product, FAQPage, Article, sameAs, @id, @graph), the validator URL and
 * the diagram's SVG labels. Those are the subject matter - translating a property name would
 * change what the reader is told to paste - and the diagram is a drawing reused from the
 * English route rather than forked, so the note under it says its labels are English.
 *
 * LINKS GO WHERE THEY SAY. `/ja/docs/`, `/ja/docs/qa-style-headings/` and `/ja/methodology/`
 * exist in Japanese, so a translated target points at its Japanese route. Anything that only
 * exists in English (the author page, `/#scan`) is linked with `hrefLang="en"` and labelled
 * 「（英語）」 - a reader should never be dropped onto an English page without being told, least
 * of all from a page about being quotable.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 *
 * TITLE and DESCRIPTION are exported because `page.tsx` needs the same two strings for the ja
 * metadata. Importing them means the `<h1>` and the `<title>` cannot drift apart.
 */
export const TITLE = "AI エンティティの曖昧性解消のための Schema.org JSON-LD 実装";
export const DESCRIPTION =
  "ChatGPT や Claude があなたのブランド、ドメイン、製品を 1 つのエンティティとして結び付けられるように、Schema.org JSON-LD を使う方法を、最小限のサンプルと検証手順とともに説明します。";

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "どの schema タイプが最も重要ですか？",
    a: "Organization と WebSite です。この 2 つが、あなたのブランド名、ドメイン、製品を、3 つの別々の文字列が同じ意味かどうかを推測させるのではなく、1 つのエンティティに結び付けられるようにします。",
  },
  {
    q: "sameAs は実際に何をするのですか？",
    a: "同じエンティティが他のプラットフォームにあるプロフィールを列挙するもので、これが文字列を解決済みのエンティティに変えます。空のプロフィールや放置されたプロフィールへのリンクは、リンクがないより悪いです。",
  },
  {
    q: "マークアップはどう検証すればよいですか？",
    a: "構造化データバリデータに貼り付けて、2 点を確認します。すべてのノードに安定した @id があること、そしてそのタイプが要求するプロパティが、意図ではなく実際に存在することです。",
  },
];

export default function JapaneseSchemaOrgJsonLdPage() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      {/* 日本語のガイド一覧への戻り口。英語版のシェルと同じ位置に置く。 */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-1)]">
        <div className="wrap flex h-11 items-center">
          <Link
            href="/ja/docs/"
            className="text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
          >
            ← ガイド一覧
          </Link>
        </div>
      </div>

      <main>
        {/* 全幅のタイトル帯。色が変わるところが余白の境界になる、英語版と同じ設計。 */}
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
              {/* 著者と日付は英語版のバイラインと同じ形。日付は ISO のまま表示する
                  （formatDate は英語の月名を返すため）。著者ページは英語なので明示する。 */}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--ink-3)]">
                <span>
                  著者{" "}
                  <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                    {AUTHOR.name}
                  </Link>
                  （英語）
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-02">公開日 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新日 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>5 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/*
              本文は英語版・中国語版と同じ 17px、同じ行長。見出し・リスト・pre・リンクの体裁は
              `.doc-article` が持つ（このプロジェクトには Tailwind Typography が入っていない）。
            */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <p>
                <strong>JSON-LD は、あなたのブランド名、ドメイン、製品が 3 つの偶然ではなく 1 つのものだとマシンに伝える方法です。</strong>
                これがなければ、モデルは <code>&lt;title&gt;</code> の中の文字列があなたのドメインと同じエンティティだと推測するしかありません。構造化データはその推測を取り除きます。
              </p>

              <h2>JSON-LD は AI エンジンのどのような問題を解決しますか？</h2>
              <p>
                エンティティの曖昧性解消です。あなたの製品が <em>Northwind</em> という名前で、たまたま同名の映画スタジオも存在する場合、AI システムには、ある言及をあなたに帰属させる信頼できる方法がありません。
                安定した <code>@id</code>、正規の <code>url</code>、<code>sameAs</code> リストを備えた <code>Organization</code> マークアップが、必要な結合点を与えます。
              </p>

              {/*
                英語版と同じ位置 - 見出しの直後、@graph の例の前 - に置く。この図が答える問い
                （安定した @id、正規の url、sameAs リストが「結合点」であること）が先に来るため。
              */}
              <DiagramEntityGraph />
              <p className="text-sm leading-relaxed text-[var(--ink-3)]">
                図のラベルは英語のままです。Organization、sameAs、@id などは schema.org の語彙であり、英語版と同じ図を共有しているためです。
              </p>

              <h2>GEO で最も重要な schema タイプはどれですか？</h2>
              <ul>
                <li>
                  <strong>Organization</strong> — ブランドをエンティティとして固定します。単体で最も価値の高いノードです。
                </li>
                <li>
                  <strong>WebSite</strong> — ドメインをそのエンティティに結び付けます。
                </li>
                <li>
                  <strong>SoftwareApplication</strong> または <strong>Product</strong> — 実際に販売しているものを記述します。
                </li>
                <li>
                  <strong>FAQPage</strong> — 質問と回答を対にします。同じ質問と回答がページ上に表示されている場合にのみ使ってください。
                </li>
                <li>
                  <strong>Article</strong> — 編集記事で著者と日付を示します。
                </li>
              </ul>

              <h2>複数のノードを 1 つのエンティティに結び付けるにはどうすればよいですか？</h2>
              <p>
                単一の <code>@graph</code> を使い、すべてのノードに <code>@id</code> を付けます。他のノードはデータを繰り返す代わりに、その識別子を参照します。これが、ばらばらのスニペットを 1 つの一貫したエンティティ記述に変える仕組みです。
              </p>
              {/* JSON-LD そのものは翻訳しない。読者が自分のページに貼り付ける文字列であり、
                  翻訳すると説明ではなく指示が変わってしまうため。 */}
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
                見落とされがちな点：<strong><code>name</code> は、あなたの <code>&lt;title&gt;</code>、<code>&lt;h1&gt;</code>、<code>llms.txt</code>、そしてこのマークアップのすべてで同一でなければなりません。</strong>
                1 つのページに 3 つの異なる名前があれば、目的はまったく達成されません。
              </p>

              <h2>マークアップを検証するにはどうすればよいですか？</h2>
              <ol>
                <li>
                  URL を{" "}
                  <a href="https://validator.schema.org/" rel="nofollow noopener" target="_blank">
                    Schema.org バリデータ
                  </a>
                  に通します。エラーがゼロであることが合格ラインです。
                </li>
                <li>
                  意図したノードタイプが実際に検出されていることを確認します。エラーが出ないことだけでは不十分です。
                </li>
                <li>
                  エディタではなく、レンダリングされた HTML のソースを確認します。クライアントサイドレンダリングでは、スクリプトが初期レスポンスから消えることがあります。
                </li>
              </ol>
              <p>
                Google は FAQ の<em>リッチリザルト</em>を少数のサイトに限定しているため、FAQPage の適格性が低いことは、このマークアップが役に立たないという意味ではありません。生成エンジンは今もこれを解析します。あわせて
                <Link
                  href="/ja/docs/qa-style-headings/"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  直接 AI 引用のための見出し最適化
                </Link>
                もご覧ください。
              </p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする（英語版と同じ）。 */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq title="エンティティマークアップについての質問" items={FAQ_ITEMS} level="h3" />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    当サイトが使う重み付けはこの測定結果に従っています。そのため「引用可能性と根拠」が 11%、「AI コンテキストファイル」のディメンションが 5% です。重み付けの全体と、単一 URL のスキャンでは見えない部分は、
                    <Link href="/ja/methodology/" className="text-[var(--accent)] hover:opacity-75">
                      方法論のページ
                    </Link>
                    に書かれています。
                  </>
                }
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
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
