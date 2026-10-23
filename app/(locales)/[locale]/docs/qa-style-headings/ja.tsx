import Link from "next/link";
import DiagramHeadingRetrieval from "@/app/(en)/docs/_components/DiagramHeadingRetrieval";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * `/ja/docs/qa-style-headings/` - "Optimizing Headings for Direct AI Citation", in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which
 * one to render. A Japanese-only `page.tsx` would have deleted the Chinese guide that
 * already ranks for this URL; two route files cannot exist on one URL pattern. The route
 * owns `dynamicParams`, `generateStaticParams`, `generateMetadata` and the locale guard.
 *
 * WHAT IS TRANSLATED: the English article's prose, headings, lists, FAQ and the evidence
 * note. WHAT IS NOT: the HTML sample and the diagram. The sample's `<h2>Features</h2>` is
 * the very label the article is about - translating `Features` would delete the example -
 * and the diagram is a drawing reused from the English route rather than forked, so its
 * SVG labels stay English while the prose around it does not.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/docs/`, `/ja/methodology/`).
 * Anything that only exists in English points at the English route with hrefLang="en" and
 * says 「（英語）」, so a reader is never dropped onto an English page without being told.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper
 * emits English month names. The visible date and the `dateTime` attribute are the same
 * string, so the printed and the machine-readable date cannot disagree.
 */
export const TITLE = "AI の直接引用に向けた見出しの最適化";
export const DESCRIPTION =
  "H2 と H3 の見出しを本当の問いの形に書き換え、「答えを先に置く」段落と組み合わせることで、AI 検索エンジンが自己完結した答えをそのまま抜き出せるようにする方法を説明します。";

export default function JapaneseQaStyleHeadingsPage() {
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
        {/* Full-bleed title band: the colour step is what marks the margin. Same geometry as the
            English guide, so switching language does not change the page's skeleton. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                コンテンツ
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {DESCRIPTION}
              </p>
              {/* 著者と日付は英語版のバイラインと同じ形で、日付は ISO のまま表示する。
                  formatDate は英語の月名を返すため、ここでは使わない。 */}
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
                <time dateTime="2026-10-02">公開日 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新日 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>4 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <p>
                <strong>AI エンジンが引用するのは、ページ全体ではなく段落です。</strong>{" "}
                生成された回答は、ある情報源から 1、2 文を抜き出して引用します。
                その抜き出しに耐えられるだけの自己完結性を段落が持っているかどうかは、見出しが決めます。
                見出しの構造が従来の SEO よりも GEO で重要なのは、まさにこの理由です。
              </p>

              <h2>AI 検索では、なぜ SEO よりも見出しが重要になるのですか？</h2>
              <p>
                検索エンジンは 1 つの URL をランク付けします。生成エンジンはテキストの一続きを取得し、
                それが問いに答えているかを検証してから、その出所であるページを引用します。
                見出しが <code>Features</code> であれば、その下の段落が誰のどんな問いに答えているのかを
                示す手がかりを、取得システムは持ちません。見出しが本当の問いであれば、
                段落は直接照合でき、読者が周囲の文脈を知らなくても引用できます。
              </p>

              {/*
                英語版と同じ位置（この節の後、書き換えの助言の前）に置く。この図が答えるのは、
                取得が実際に段落単位で行われるかという、直前の節が提起した問いである。
                図のラベルは共有コンポーネント側にあり、英語のまま残る。
              */}
              <DiagramHeadingRetrieval />

              <h2>引用される準備ができた見出しは、どのようなものですか？</h2>
              <p>
                ラベルを、人が実際に問いかける形の疑問文に書き換えてください。
                元のキーワードは文の中に残し、従来の順位が崩れないようにします。
              </p>
              <pre>{`<!-- Before: a label. Nothing to retrieve. -->
<h2>Features</h2>

<!-- After: a retrievable question, keyword intact. -->
<h2>How does Your Company measure brand AI visibility?</h2>`}</pre>
              <p>
                仕様書のような言い方ではなく、顧客が口に出して言うような言い方で問いを書いてください。
                <em>「AI クローラーが自分のサイトを読めるかどうかは、どうすれば確認できますか？」</em>{" "}
                は <em>「クローラーアクセス検証の方法論」</em> に勝ります。
              </p>

              <h2>見出しの下の最初の一文は、何をすべきですか？</h2>
              <p>
                <strong>問いに、宣言文 1 文で即座に答えてください。</strong>{" "}
                機械が単独で引用する一文だと考えてください。詳細や注意点、例は、それに続く文に置きます。
              </p>
              <p>
                信頼できるテストがあります。その最初の一文だけをコピーし、
                ページの残りを読んでいない人にも意味が通じるかを自問してください。
                書き出しが <em>「前述のとおり」</em> や <em>「状況によります」</em> であれば、
                その文はテストに失敗し、選ばれることはありません。
              </p>

              <h2>順位を落とさずに、既存の見出しを書き換えるにはどうすればよいですか？</h2>
              <ol>
                <li>すでに検索流入のあるページを洗い出します。それらの見出しは、ページの構造を支える重要な部分です。</li>
                <li>主要なキーワードは残し、周囲の言い回しを問いの形に変えます。</li>
                <li>見出しのすぐ下、前置きより前に、1 文の答えを置きます。</li>
                <li>URL のスラッグには手を付けません。見出しの変更は安全ですが、URL の変更は移行作業です。</li>
                <li>各 H2 が依然として 1 つの問いだけに対応しているか確認します。2 つの問いを扱う見出しは分割します。</li>
              </ol>

              <h2>よくある間違いは何ですか？</h2>
              <ul>
                <li>
                  <strong>問いの形なのに、下に答えがない見出し。</strong>{" "}
                  このパターンは簡単にまねできますが、答えを先に置く一文がなければ何の価値もありません。
                </li>
                <li>
                  <strong>すべての見出しを疑問文にすること。</strong>{" "}
                  ナビゲーションやセクションのラベルには必要ありません。無理に当てはめると不自然な文章になり、
                  読者は離脱します。
                </li>
                <li>
                  <strong>答えを埋もれさせること。</strong>{" "}
                  直接の答えが 3 段落目にあると、取得システムはそこまで到達しない可能性があります。
                </li>
                <li>
                  <strong>答えを置く場所にマーケティング表現を書くこと。</strong>{" "}
                  <em>「当社は業界をリードするプロバイダーです…」</em> は答えではなく、引用もされません。
                </li>
              </ul>
              <p>
                構造化データと組み合わせてください。詳しくは{" "}
                <Link
                  href="/docs/schema-org-jsonld/"
                  hrefLang="en"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  Schema.org JSON-LD によるエンティティの曖昧性解消（英語）
                </Link>
                をご覧ください。
              </p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする（英語版と同じ）。 */}
            <div className="reveal-stagger mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="問いの形をした見出しについての質問"
                items={[
                  {
                    q: "「答えられる見出し」とはどのようなものですか？",
                    a: "人が尋ねるのと同じ言い方で書かれていて、その下の段落が前置きを重ねずに最初の一文で答えている見出しです。",
                  },
                  {
                    q: "すべての見出しを疑問文にするべきですか？",
                    a: "いいえ。疑問文の見出しは、そのセクションが実際に何かに答えている場合にだけ役立ちます。答えていないセクションに無理に当てはめると、文章が悪くなるだけで効果はありません。",
                  },
                  {
                    q: "これでページの見た目は変わりますか？",
                    a: "変わるのは見出しの文言と段落内の文の順序で、レイアウトではありません。見出しのサイズは同じままで、ページの構造も保たれます。",
                  },
                ]}
                level="h3"
              />
              {/*
                引用は論文自身の知見なので英語のまま残す。割合を日本語の文章にすると、
                引用の見た目のまま引用でなくなるためである。見出し、注記、リンクは翻訳する。
              */}
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    当サイトが使う重み付けはこの測定結果に従っています。そのため「引用可能性と根拠」が
                    11%、「AI コンテキストファイル」のディメンションが 5% です。
                    重み付けの全体と、単一 URL のスキャンでは見えない部分は、
                    <Link
                      href="/ja/methodology/"
                      className="text-[var(--accent)] underline hover:opacity-75"
                    >
                      方法論のページ
                    </Link>
                    に書かれています。
                  </>
                }
              />
            </div>

            {/* スキャンコンソールは英語のホームページにしかないため、CTA は実際にツールがある場所へ送る。 */}
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
