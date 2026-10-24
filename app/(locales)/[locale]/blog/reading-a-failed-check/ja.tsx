import Link from "next/link";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInsight } from "@/lib/insights";

/**
 * `/ja/blog/reading-a-failed-check/` - "How to read a failed check", in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only `page.tsx` would have deleted the Chinese essay that already
 * ranks for this URL; two route files cannot exist on one URL pattern.
 *
 * WHY THIS REBUILDS PostShell's SHELL INSTEAD OF USING IT: PostShell renders SiteNav,
 * PageFooter and the English `/blog/` back-link, so a Japanese reader would get English
 * navigation and be sent to the English archive by the one link that exists to orient them.
 * The shell is rebuilt from LocaleHeader/LocaleFooter with the same `band` / `wrap` /
 * `doc-article` classes, and keeps every section PostShell renders - byline, FAQ, evidence,
 * author card, "read next", scan CTA - so the three language versions are the same article.
 *
 * WHAT IS TRANSLATED: the English essay's prose, headings, the table, the FAQ, the note around
 * the evidence block, the author card and the related links.
 * WHAT IS NOT: `robots.txt`, `blockquote`, the HTTP status codes and the Evidence quotation.
 * The codes and identifiers are the subject matter, and the quotation is a sentence from a
 * paper - translating it would change what the source says while still presenting it as a
 * quotation. Every number and percentage (30 homepages, 53%, 7%, 800/300/799 words, 740, 60,
 * 796, 9 rows, 30%, 2%, 16%, 40 rules) is byte-identical to the English page, because the
 * argument is about those numbers.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/blog/`,
 * `/ja/blog/<slug>/`, `/ja/checks/`, `/ja/methodology/`). Anything that only exists in
 * English - the author page, the scan console on the English homepage - points at the English
 * route with hrefLang="en" and says 「（英語）」, so a reader is never dropped onto an English
 * page without being told.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper
 * emits English month names. The visible date and the `dateTime` attribute are the same
 * string, and the string comes from lib/insights.ts so it cannot drift from the English page.
 *
 * TITLE and DESCRIPTION are exported so the route's generateMetadata reads the same strings
 * the page prints: a canonical that describes a different page from the one rendered is the
 * failure this split avoids.
 */
export const TITLE = "失敗したチェックの読み方と、正しく直す方法";
export const DESCRIPTION =
  "失敗したチェックは、あなたのページについての主張であり、判定ではありません。書き換える前に問うべき 3 つの質問を、スキャナの実際の例とともに説明します。";
const DEK =
  "悪い修正のほとんどは、失敗を指示として読んでしまうことから生まれます。ルールページが「そのチェックが何をテストしないか」を公開しているのは、まさにそのためです。本稿はその使い方を説明します。";
const CATEGORY = "方法";

const insight = getInsight("reading-a-failed-check");

/* lib/insights.ts stores readTime as an English sentence ("7 min read"); taking the number
   from it keeps this byline and the English one from reporting different reading times. */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

/* Translations of AUTHOR.role and AUTHOR.bio from lib/author.ts, kept beside the page that
   prints them so a change there is visible here. */
const AUTHOR_ROLE_JA = "LLMention のメンテナー";
const AUTHOR_BIO_JA =
  "私は LLMention を構築し、維持しています。スキャナ、ルールセット、そしてその背後の調査です。作業はソースとして公開されているので、方法は信じて受け入れるものではなく、検証できるものになっています。";

export default function JapaneseReadingAFailedCheckPage() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
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
        {/* 全幅のタイトル帯。英語版の記事と同じ色の段と幾何で、言語を変えても骨格は変わらない。 */}
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
                {DEK}
              </p>
              {/*
                著者ページは英語なので、日本語のバイラインの途中で言語を切り替えないよう、
                リンク自体にその旨を書く。日付は ISO のまま表示する（formatDate は英語の月名を返す）。
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
                <span>{READ_MINUTES} 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* 英語版と同じ 17px、同じ行長。見出し・表・リスト・リンクの体裁は `.doc-article` が持つ。 */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                失敗したチェックは、あなたのページについての主張であり、指示ではありません。当サイトのルールページが
                4 つのことを公開しているのは、まさにそのためです。スキャナがテストする条件、失敗が意味するもの、
                そのチェックがテストしないこと、そして失敗しうるそれぞれの形に対する修正方法です。
                編集を始める前にこのうち 3 つを読むかどうかが、修正と書き直しを分けます。
              </p>
              <p>
                失敗そのものにも、文脈として数字を添える価値があります。30 のホームページを対象にした調査では、
                <strong>53%</strong> が F 評価で、<strong>7%</strong> が B に到達し、低いスコアのほとんどは、
                1 つの壊滅的な問題ではなく、互いに関係のない複数のルールが同時に失敗した結果でした。
              </p>

              <h2>失敗したチェックは、実際に何を教えてくれますか？</h2>
              <p>
                ある 1 つの条件が満たされなかったことと、スキャナがそのテストで見た根拠です。理由は教えてくれませんし、
                修正方法も教えてくれません。それらはルールページの別の文に書かれています。
              </p>
              <p>
                ルールページの構成はどれも同じです。そのチェックが何を見るか、失敗が何を意味するか、修正する手順、
                そしてそのチェックがテストしないことの注記です。最後のものが最も役に立ち、最も飛ばされがちです。
                ルールが「品質ではなく存在を数えている」と認めるのは、そこです。引用のルールはどんな{" "}
                <code>blockquote</code> でも通過し、エンティティのルールは宣言されたどんな型でも通過します。
              </p>

              <h2>このチェックは、私のようなページにも当てはまりますか？</h2>
              <p>
                たいていは当てはまりますが、いつもではありません。スキャナにはページ種別による除外があり、
                レポートは当てはまらなかったチェックの件数を表示します。黙って 0 点として数えることはしません。
              </p>
              <p>
                最も分かりやすい例は文字数です。法務ページやお問い合わせページが 800 語の本文を持つことはありませんし、
                それをコンテンツページの長さに合わせて測れば、測っているのは文章ではなくページ種別です。
                ルールがあなたのリストに現れていれば、そのルールは適用されています。レポートがあるチェックを
                「当てはまらない」と述べているなら、それを満たすためにコンテンツを削除するのは、
                起きてもいない失敗への誤った対応です。
              </p>

              <h2>その数字はページのものですか、レスポンスのものですか？</h2>
              <p>
                まずステータスを確認してください。401、403、429、202、520 は、そのスコアがエラー応答を
                説明しているという意味で、コンテンツ側の作業では動かせません。
              </p>
              <p>
                これは仮定の話ではありません。調査では、ホームページの <strong>30%</strong>{" "}
                がページを一度も返しておらず、そのスコアは拒否そのものを測っていました。スキャナはそれらを中止として
                記録し、平均から除外します。それでも数字はドメインの隣に印刷されるので、読者は自分が見ているのが
                どちらの種類の数字なのかを知っておく必要があります。その 9 行についての記事では、
                各コードを 1 つずつ確認しています。
              </p>

              <h2>求められているのは本当の改善ですか、水増しした数字ですか？</h2>
              <p>
                数字でしかないこともあります。文字数のルールは 800 語で通過し、300 語から 799 語までを
                部分通過とします。そのため 796 語のページは、しきい値まで 4 語足りないというだけで
                ポイントを失います。
              </p>
              <p>
                正直な対応は、言う価値のあることをもっと書くか、部分通過を受け入れることです。
                不正直な対応は埋め草で、失ったポイントより悪いものです。水増しに気づいた読者は、
                ページの残りへの信頼を下げます。そして後続のルール（答えを先に置く、抽出可能なコンテンツ、引用）は、
                何かを語っている文章でしか機能しません。
              </p>
              <p>
                当サイトは、自分の文字数ルールに失敗しているページを、水増しするのではなくそのまま公開し、
                ルールページの注記にそう書いています。同じトレードオフを公にしているわけで、
                読者が確認できるのはその形だけです。
              </p>

              <h2>良い修正は、悪い修正とどう違いますか？</h2>
              <p>
                悪い修正は条件を満たします。良い修正は、その条件が存在する理由を満たし、
                結果として条件も満たされます。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>失敗</th>
                      <th>ルールを満たす修正</th>
                      <th>理由を満たす修正</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>文字数が 740 語で部分通過</td>
                      <td>60 語の言い換えを足す</td>
                      <td>読者がずっと求めていた実例を足す</td>
                    </tr>
                    <tr>
                      <td>クローラーの user-agent が禁止されている</td>
                      <td>robots.txt に Allow 行を足す</td>
                      <td>CDN を確認する。ファイアウォールが 403 を返したままの可能性がある</td>
                    </tr>
                    <tr>
                      <td>ページに引用がない</td>
                      <td>ページ自身の一文を引用する</td>
                      <td>その主張が依拠する一次資料を引用する</td>
                    </tr>
                    <tr>
                      <td>Markdown の代替版がない</td>
                      <td>1 か月で食い違う双子の版を手で書く</td>
                      <td>同じソースから生成する。あるいは欠落を受け入れる</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                最後の行は、当サイト自身の例です。ホームページには Markdown の双子の版がなく、そのチェックは
                失敗しています。当サイトは、ルールを緩めるのでも、6 週間後に鏡像のページと食い違うコピーを
                書くのでもなく、失敗を公開することを選びました。著者が正直に満たせないルールは、
                そのルールについての根拠であり、回避策ではなく注記に書かれるべきものです。
              </p>

              <h2>どういうときには、失敗したチェックを無視すべきですか？</h2>
              <p>
                3 つの場合で、どれも書き残すべきです。ルールが当てはまらない、トレードオフが意図的である、
                修正のコストがポイントの価値を上回る、のいずれかです。
              </p>
              <ul>
                <li>
                  <strong>当てはまらない。</strong>ルールが除外しているページ種別であるか、そのルールが、
                  あなたのサイトが持つ理由のないシグナルをテストしているかです。どちらなのかはレポートに書かれています。
                </li>
                <li>
                  <strong>トレードオフが意図的である。</strong>AI クローラーをブロックすることは
                  ポリシーの判断です。それを意図して選んだサイトは、ポイントが下がることを想定すべきで、
                  取り戻すためにポリシーを撤回すべきではありません。
                </li>
                <li>
                  <strong>修正のコストが、得られるものより大きい。</strong>1 週間の作業を要する重み 2%
                  のルールは、午後 1 日で済む 16% のルールの次に来るものではありません。重みは公開されているので、
                  この比較は作業の前にできます。
                </li>
              </ul>

              <h2>同じところを二度直さないためには、どうすればよいですか？</h2>
              <p>
                変更したら再スキャンし、スコアではなく失敗リストを比較してください。スコアはいくつかの理由で
                同時に動きますが、リストはあなたが実際に編集したものです。
              </p>
              <p>
                修正が本物なら、ルールはリストから消え、そのまま戻りません。水増しなら、次にページが変わるときに
                戻ってくる傾向があります。これは水増しに反対する実務的な論拠で、誰かの意見とは関係ありません。
              </p>
              <p>
                すべてのルールは<Link href="/ja/checks/">ルール一覧</Link>に 1 ページずつ公開され、
                それぞれの重みと、自ら宣言した限界が書かれています。40 件全体の計算は
                <Link href="/ja/methodology/">方法論のページ</Link>にあります。
              </p>
            </article>

            {/*
              記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする（英語版と同じ）。
            */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="失敗したチェックの読み方についての質問"
                level="h3"
                items={[
                  {
                    q: "失敗したチェックは、すべて直すべきですか？",
                    a: "いいえ。ページ種別によって当てはまらないルールもあり、修正のコストに見合わないルールもあり、意図的なトレードオフであるものも 1 つか 2 つあります。失敗はページについての主張であり、それに基づいて動くかどうかは、コストを伴う判断です。",
                  },
                  {
                    q: "本物の失敗と、測定上のアーティファクトを最短で見分ける方法は？",
                    a: "ステータスと根拠の行を読みます。200 以外のステータスは、その数字がレスポンスを説明しているという意味です。スキャナが何を見たかを示す根拠の行は、そのルールが、あなたが思っている対象に適用されたかどうかを教えてくれます。",
                  },
                  {
                    q: "部分通過は気にするべきですか？",
                    a: "場合によります。部分通過は取りこぼしたポイントであって失敗ではなく、その計算はルールごとに公開されています。足りないポイントを安く取れるときは重要で、水増し以外に取り方がないときは重要ではありません。",
                  },
                ]}
              />
              {/*
                引用は論文からの一文なので英語のまま残す。翻訳すると、引用の見た目のまま
                出典の言っていないことになるためである。見出し、注記、出典の見出しは翻訳する。
              */}
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="本稿のすべての数字は、公開された研究か、スキャナが実行するルールセットに由来します。どちらもリンクがあり、どちらも再実行できます。"
              />
            </div>

            {/* 英語版 PostShell の著者カード。この読者に「誰が書いたか」を伝えることが役目なので翻訳する。 */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — {AUTHOR_ROLE_JA}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{AUTHOR_BIO_JA}</p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  当サイトの執筆と資金調達の方法（英語） →
                </Link>
              </p>
            </div>

            {/*
              「次に読む」。英語版 PostShell と同じ位置に置く。3 言語すべてで同じ記事群なので、
              日本語の記事へ送る。
            */}
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">次に読む</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ja/blog/llms-txt-what-the-evidence-supports/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    llms.txt：証拠は実際に何を支持しているのか
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    このルールについては、ファイルを公開し、それ以上を期待しないのが正直な答えです。
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
                    このルールについては、作業をするのが正直な答えです。マークアップは安く、ギャップはサンプルの大半に及びます。
                  </p>
                </li>
              </ul>
            </div>

            {/* スキャンコンソールは英語のホームページにしかないため、CTA は実際にフォームがある場所へ送る。 */}
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
