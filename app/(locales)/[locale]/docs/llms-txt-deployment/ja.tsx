import Link from "next/link";
/*
 * WHY THIS IS IMPORTED FROM THE ENGLISH ROUTE GROUP: the drawing is the explanation, not decoration,
 * and it is inline SVG whose labels live inside the component. Forking it into a Japanese copy would
 * mean two drawings that must be kept in step with one argument, which is the drift the English
 * component exists to avoid - and an English label inside a diagram is legible to this reader, while
 * a missing diagram is not. The caption and the surrounding prose are translated; the picture is
 * reused byte for byte, and the note under it says the labels stay English.
 */
import DiagramFileRoles from "@/app/(en)/docs/_components/DiagramFileRoles";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * 日本語版の本文：`/ja/docs/llms-txt-deployment/`。
 *
 * なぜ 1 ファイル 1 言語なのか。`app/(locales)/[locale]/docs/llms-txt-deployment/page.tsx` という
 * 1 つのルートを `/zh/` と `/ja/` が共有しているため、言語はルートの中で選ぶしかない。本文を
 * `zh.tsx`（既存の中国語版をそのまま移したもの）と `ja.tsx`（このファイル）に置き、`page.tsx` が
 * どちらかを選んで metadata を持つ。日本語だけの page.tsx にすると、中国語版のガイドが消える。
 *
 * WHAT IS TRANSLATED AND WHAT IS NOT. Every heading, paragraph, list and FAQ entry a reader acts
 * on is Japanese. The identifiers are not: `llms.txt`, `robots.txt`, `Markdown`, `HTML`, `HTTP`,
 * `URL`, the status codes, the URLs and the code sample are the subject of the article, so they
 * stay byte for byte as the English page prints them. The diagram is a drawing rather than copy -
 * its labels live in the English component - so it is reused and the note under it says so.
 *
 * LINKS GO WHERE THEY SAY. `/ja/docs/`, `/ja/methodology/` and `/ja/` exist in Japanese. Anything
 * that only exists in English (`/llms-txt-studio/`, `/#scan`, the author page) is linked with
 * `hrefLang="en"` and labelled 「（英語）」 - a link that silently changes language is worse than an
 * labelled one, and this reader is being asked to trust a page about being quotable.
 *
 * LINE BREAKS IN THE SOURCE ARE NOT LINE BREAKS ON THE PAGE. JSX keeps a newline between two lines
 * of text as a single space, so a sentence is kept on one source line and breaks are placed only
 * after 「。」 or next to a tag, where the whitespace is dropped. A break in the middle of a
 * Japanese sentence would print a space in the middle of it.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 *
 * THE TITLE AND DESCRIPTION ARE EXPORTED because `page.tsx` needs the same two strings for the
 * ja metadata. Importing them means the `<h1>` and the `<title>` cannot drift apart.
 */
export const JA_TITLE = "llms.txt ファイルを生成して配置する方法";
export const JA_DESCRIPTION =
  "ドメインのルートに /llms.txt ファイルを構成し、ホストし、検証するための実践的なガイドです。AI での可視性のためにこのファイルが果たさないことについても、正直に説明します。";

export default function JapaneseLlmsTxtDeploymentPage() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      {/* 一覧への戻り口。英語のシェルが置いているのと同じ位置に、日本語の一覧を指して置く。 */}
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
                セットアップ
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {JA_TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {JA_DESCRIPTION}
              </p>
              {/* 著者ページは英語なので、日本語の署名の途中で黙って言語を変えず、その旨を書く。 */}
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
                  （著者ページは英語）
                </span>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-02">公開 2026-10-02</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>読了目安 3 分</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <p>
                <strong>
                  llms.txt は、ドメインのルートに置くプレーンな Markdown ファイルで、サイトのどの部分が重要かを言語モデルに伝えるものです。
                </strong>{" "}
                標準ではなく慣習であり、追加にはおよそ 10 分かかります。
                このガイドでは、書式、配置方法、そして実際に取得できるかどうかの確認手順を扱います。
              </p>

              {/*
                先に心のモデルを渡す。この記事が正そうとしている誤り——llms.txt を置けばページが
                見つかると考えること、sitemap を送れば許可を得たと考えること——は、どれも 3 つの
                ファイルを「同じことを言う 3 通りの方法」と見なすところから来ている。
              */}
              <DiagramFileRoles />
              <p className="text-sm leading-relaxed text-[var(--ink-3)]">
                図のラベルは英語のままです。robots.txt、sitemap.xml、llms.txt というファイル名は技術用語であり、図と本文をそのまま対応させて読めるようにしています。
              </p>

              <h2>llms.txt とは何ですか。</h2>
              <p>
                <code>/llms.txt</code> は、AI システムにウェブサイトの整理された機械可読な要約を渡すための提案中の慣習です。
                モデルに HTML から構造を推測させるのではなく、プロジェクトの要約と最も重要なリンクの一覧を含む短い Markdown ドキュメントを直接渡します。
                対になる <code>/llms-full.txt</code> は、展開された内容そのものを収録します。
              </p>

              <h2>ファイルには何を書きますか。</h2>
              <p>
                この慣習は意図的に単純です。サイト名を書いた H1 が 1 つ、引用ブロックによる要約、そのあとに注釈付きリンクを並べた H2 のセクションが続きます。
              </p>
              <pre>{`# Your Company

> One or two sentences describing what you do and who it is for.

## Core pages
- [Product overview](https://example.com/product): what it does.
- [Pricing](https://example.com/pricing): plans and limits.

## Documentation
- [Getting started](https://example.com/docs/start): setup in five minutes.

## Optional
- [Blog](https://example.com/blog): release notes and research.`}</pre>
              <p>
                書式よりも重要なルールが 2 つあります。<strong>要約の行は、モデルが最も引用しやすい箇所です</strong>。
                だからスローガンではなく、事実を詰め込んだ一文にしてください。そして
                <strong>すべてのリンクが解決できる必要があります</strong>。
                404 ばかりのファイルは、ファイルがないより悪いからです。
              </p>

              <h2>ファイルはどこに置きますか。</h2>
              <p>
                正確に <code>https://your-domain.com/llms.txt</code> というパスで取得できる必要があります。サブディレクトリではなく、ドメインのルートです。
                公開方法は技術スタックによって変わります。Next.js なら <code>public/llms.txt</code> に置きます。
                多くの静的ホスティングなら公開ディレクトリに置きます。リダイレクトは避け、<code>text/plain</code> のコンテンツタイプで直接配信してください。
              </p>

              <h2>llms.txt は実際に AI での可視性を高めますか。</h2>
              <p>
                <strong>コストは示せますが、可視性が向上したことは示せません。</strong>{" "}
                参照できた 2 つのクローラー文書——OpenAI のヘルプセンターと、2026 年 4 月 7 日付の Anthropic のクローラー記事——のどちらもこのファイルには言及しておらず、どちらも従う仕組みとして <code>robots.txt</code> を挙げています。
              </p>
              <p>
                今日実際に役立つのは、コンテキストを意識して取得するドキュメントサイトやコーディングエージェント、そして整理された入口を受け入れる検索システムです。
                正直に言えば、<strong>小さくて安価なシグナル</strong>であり、追加する価値はあっても、ランキング要因として扱う価値はありません。
              </p>

              <h2>公開されたことはどう確認しますか。</h2>
              <ol>
                <li>
                  ブラウザで <code>https://your-domain.com/llms.txt</code> を開きます。プレーンテキストとして表示され、ダウンロードされたり 404 になったりしないはずです。
                </li>
                <li>
                  レスポンスが <code>200</code> で、コンテンツタイプが <code>text/plain</code> であることを確認します。
                </li>
                <li>
                  <code>robots.txt</code> がこのパスを禁止していないこと、ファイアウォールがクローラーの user-agent を遮断していないことを確認します。
                </li>
                <li>ファイル内のすべてのリンクを一度ずつ開きます。リンク切れが最もよくある不具合です。</li>
              </ol>
              <p>
                これらの確認は{" "}
                <Link
                  href="/llms-txt-studio/"
                  hrefLang="en"
                  className="text-[var(--accent)] underline hover:opacity-75"
                >
                  llms.txt Studio
                </Link>
                （英語）でまとめて自動化できます。まずクローラーからのアクセスを監査したい場合は、
                <Link href="/ja/" className="text-[var(--accent)] underline hover:opacity-75">
                  無料の GEO スキャナ
                </Link>
                をお使いください。
              </p>
            </article>

            {/*
              FAQ と根拠ブロックは英語版のシェルにも入っているので、ここでも落とさずに再現する。
              出典を黙って落とした日本語版は、同じタイトルの別記事になってしまう。`Faq` と
              `Evidence` は言語に依存しない部品で、作り直さずに再利用するので、FAQPage の JSON-LD と
              出典一覧が英語版からずれることはない。
            */}
            <div className="reveal-stagger mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="llms.txt の配置についての質問"
                items={[
                  {
                    q: "ファイルは正確にどこに置きますか。",
                    a: "ドメインのルートです。https://your-domain.com/llms.txt が HTTP 200 と本文を直接返す位置になります。ログインページへのリダイレクトや、HTML のエラーページが返る場合は、配信されていないものとして扱います。",
                  },
                  {
                    q: "llms.txt を公開すると順位は上がりますか。",
                    a: "このファイルを読むと明言しているクローラー文書は見つかっていません。参照できた 2 つの文書——OpenAI のヘルプセンターと Anthropic のクローラー記事——が指定しているのは robots.txt です。安価で、実際に取得する読者には意味があるため実施する価値はありますが、ランキング要因としては扱いません。",
                  },
                  {
                    q: "正しく配信されているかはどう確認しますか。",
                    a: "その URL をリクエストし、返ってくる内容を読みます。404 や HTML のページではなく、200 の Markdown である必要があります。空のファイルも 200 を返すため、ステータスコードだけでは足りません。",
                  },
                ]}
                level="h3"
              />
              {/*
                引用されているのは論文からの引用なので、英語のまま置く。引用された割合を日本語に
                言い換えると、引用の体裁のまま中身が変わる。見出し、注記、日本語の方法論へのリンクなど、
                その周りはすべて翻訳している。
              */}
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    このサイトが使う重み付けはその測定結果に従っており、引用可能性と根拠がそれぞれ 11%、AI コンテキストファイルのディメンションが 5% です。
                    重み付けの全体と、単一 URL のスキャンでは見えない部分は、
                    <Link
                      href="/ja/methodology/"
                      className="text-[var(--accent)] underline hover:opacity-75"
                    >
                      日本語の方法論ページ
                    </Link>
                    にあります。
                  </>
                }
              />
            </div>

            {/* スキャンの入力欄は英語のトップページにしかないので、CTA はツールが実際にある場所を指す。 */}
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
