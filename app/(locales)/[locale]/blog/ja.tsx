import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { INSIGHTS, insightsForLocale, type InsightCategory } from "@/lib/insights";

/**
 * `/ja/blog/` - the writing archive, in Japanese.
 *
 * TRANSLATED FROM THE ENGLISH INDEX, NOT FROM THE CHINESE ONE: `app/(en)/blog/page.tsx` is
 * the source, so the grid, the prose, the table, the four FAQ answers and the evidence block
 * all match it one for one. The Chinese archive is a sibling translation, not an intermediary.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file, so each
 * language's body lives beside it and `page.tsx` only decides which one to render. A
 * Japanese-only `page.tsx` would have deleted the Chinese archive. Metadata lives in
 * `page.tsx`, because one segment cannot export both `metadata` and `generateMetadata`.
 *
 * WHY THE CARDS ARE BUILT FROM `INSIGHTS` PLUS A LOCAL COPY TABLE: the registry owns the slug,
 * the date and the figure, so the card cannot advertise a number the article does not report.
 * Only the strings a reader reads are translated here, and a missing key throws at import time
 * rather than rendering a card with no title.
 *
 * WHY THE CARDS KEEP `0 of 30` AND `3.3 / 100` AS PUBLISHED: those are the study's numbers,
 * not prose. The label under each figure is translated; the figure is not.
 *
 * WHY EVERY CARD POINTS AT `/ja/blog/...`: all six pieces in this batch have a Japanese
 * version, and the sitemap claims the ja alternate for each slug. Linking the English original
 * from here would send a Japanese reader to the page whose hreflang pair says a Japanese
 * version exists.
 */
export const TITLE = "ブログ — AI 検索を測るノート";
export const DESCRIPTION =
  "30 サイト調査でわかったこと、ルールが実務でどう破綻するか、そしてこの手法が何を主張しないのか。スキャンを運用する本人による一次情報です。";

type CardCopy = {
  title: string;
  dek: string;
  figureLabel: string;
};

/**
 * The translated card copy, keyed by the slug the registry already owns.
 *
 * The title and dek are kept identical to each article's own Japanese constants, so a reader
 * who clicks a card sees the title and dek they just read. The figures and dates come from the
 * registry; only the label under each figure is translated here.
 */
const CARD_COPY: Record<string, CardCopy> = {
  "thirty-homepages-none-graded-a": {
    title: "30 個のホームページをスキャンし、A 評価はゼロだった",
    dek: "この調査には誰もが引用する数字が 1 つあり、ほとんど語られない数字が 4 つあります。この記事ではその背後にある分布を、ページをまったく返さなかった 9 行も含めて説明します。",
    figureLabel: "A 評価",
  },
  "six-news-publishers-blocking-ai-crawlers": {
    title: "ニュース出版社6社、6社ともAIクローラーをブロック",
    dek: "サンプルに含まれるニュース出版社はすべて、ChatGPT、Claude、Perplexity、Doubao の背後にあるAIクローラーを少なくとも1つ拒否しています。これは測定可能なコストを伴うポリシーの選択であり、必ずしも誤りとは言えません。",
    figureLabel: "クローラーをブロックするニュースサイト",
  },
  "nine-homepages-never-answered": {
    title: "9つのホームページはクローラーに応答しなかった",
    dek: "403 はページではありません。調査の9行はサイトではなくエラー応答を記述しており、それらを0として数えると、より派手で、より不正確な数字になります。",
    figureLabel: "エラーで応答",
  },
  "entity-markup-gap": {
    title: "30 サイト中 22 サイトが、AI に自社を推測させている",
    dek: "名前をドメインに結び付けられないモデルは推測するしかなく、推測は引用ではありません。それを修正するマークアップは 4 行の JSON で、サンプルのほとんどはそれを持っていません。",
    figureLabel: "エンティティ未宣言",
  },
  "llms-txt-what-the-evidence-supports": {
    title: "llms.txt：証拠は実際に何を支持しているのか",
    dek: "ファイルを追加するのは簡単で、それをレバーとして正当化するのは困難です。それでも公開する価値がある理由と、実際以上に見せかけるべきでない理由を書きます。",
    figureLabel: "獲得できる最大ポイント",
  },
  "reading-a-failed-check": {
    title: "失敗したチェックの読み方と、正しく直す方法",
    dek: "悪い修正のほとんどは、失敗を指示として読んでしまうことから生まれます。ルールページが「そのチェックが何をテストしないか」を公開しているのは、まさにそのためです。本稿はその使い方を説明します。",
    figureLabel: "書き換える前に",
  },
};

/** The registry's three categories, as the badge prints them. */
const CATEGORY_JA: Record<InsightCategory, string> = {
  Study: "研究",
  Method: "方法",
  Explainer: "解説",
};

/**
 * A missing translation must fail the build rather than render a blank card.
 *
 * Typed as a lookup on `string` on purpose: the registry's slug is a string, and adding a
 * seventh piece to `lib/insights.ts` should surface here as a build error naming the slug, not
 * as a page that silently omits a title.
 */
function cardCopy(slug: string): CardCopy {
  const copy = CARD_COPY[slug];
  if (!copy) {
    throw new Error(
      `No Japanese index copy for "${slug}". Add it to CARD_COPY in app/(locales)/[locale]/blog/ja.tsx.`
    );
  }
  return copy;
}

export default function JapaneseInsightsIndexPage() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      <main>
        {/* 英語版と同じ全幅のタイトル帯。色の段差がページの上端を示す。 */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                執筆
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                スキャナの背後にある 1 回の実行から生まれた 6 本の記事です。誰も引用しない分布、決して応答しなかった 9 つのホームページ、サンプルの大半に共通するマークアップの欠落、そして当サイトが実際以上に強いとは主張しない 2 つのルールについて書いています。
              </p>
              {/*
                日付はレジストリが持つ値のまま ISO で表示する。formatDate は英語の月名を返す
                ため、ここでは使わない。著者ページはまだ英語のみなので、リンクは英語のまま
                残し、そのことを（英語）と明記する。
              */}
              <p className="font-mono text-xs text-[var(--ink-3)]">
                <time dateTime="2026-10-18">公開日 2026-10-18</time> · 著者{" "}
                <Link
                  href={AUTHOR.path}
                  hrefLang="en"
                  className="text-[var(--accent)] hover:opacity-75"
                >
                  {AUTHOR.name}
                </Link>
                （英語）
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {insightsForLocale("ja").map((insight) => {
                const copy = cardCopy(insight.slug);
                return (
                  <Link
                    key={insight.slug}
                    href={`/ja/blog/${insight.slug}/`}
                    hrefLang="ja"
                    className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-7 transition-colors hover:border-blue-500/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono font-semibold text-[var(--accent)]">
                        {CATEGORY_JA[insight.category]}
                      </span>
                      <span className="font-mono text-[var(--ink-3)]">
                        <time dateTime={insight.published}>{insight.published}</time>
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug tracking-tight">
                      {copy.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--ink-2)]">{copy.dek}</p>
                    <div className="mt-auto flex items-end justify-between border-t border-[var(--line)] pt-4">
                      <span className="font-mono text-2xl font-semibold text-[var(--ink-1)]">
                        {insight.figure}
                      </span>
                      <span className="text-right text-xs leading-tight text-[var(--ink-3)]">
                        {copy.figureLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 本文記事と同じ行長に揃えた、グリッド下の文章。 */}
            <div className="mx-auto mt-16 max-w-3xl space-y-6 text-[16px] leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                ここでは何を公開していますか？
              </h2>
              <p>
                一次情報の執筆です。30 サイト調査の測定値、説明する価値のある形で破綻するルールの解説、そしてこの手法が実際より弱いのはどこかの記録です。ここにプレスリリースはなく、スポンサー記事もなく、カレンダーを埋めるために書かれた記事もありません。
              </p>
              <p>
                基準は一文だけです。<strong>その記事を削除して、読者が何を失うかを問う</strong>。答えが、ほかでは手に入らない数字や、自分で実行できる手順であれば、その記事は残ります。答えが「何もない」なら公開されません。ここに 30 本ではなく 6 本しかないのはそのためです。
              </p>
              <p>
                このアーカイブが依拠する数字はすべて、30 のホームページに対する 1 回の実行から来ています。
                <strong>53%</strong>が F 評価、<strong>7%</strong>が B に到達、
                <strong>30%</strong>はクローラーにまったく応答せず、<strong>27%</strong>がエンティティを宣言し、<strong>63%</strong>はエンティティも{" "}
                <code>sameAs</code> リストも持っていません。以下の各記事は、その元になったデータ行にリンクしており、データ行は再スキャンできます。
              </p>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                各記事はどう作られていますか？
              </h2>
              <p>
                どの記事も、再実行できるデータに基づいています。調査のデータ行はスキャナ本体から、ルールの重みは公開されているカタログから、限界は各ルールに付された注記から来ています。
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse overflow-hidden rounded-xl border border-[var(--line)] text-sm">
                  <thead className="bg-[var(--surface-1)] text-[var(--ink-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">記事</th>
                      <th className="px-4 py-3 text-left font-semibold">依拠するデータ</th>
                      <th className="px-4 py-3 text-left font-semibold">参照するルール</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">30 スコアの分布</td>
                      <td className="px-4 py-3 align-top">公開されている調査データ行</td>
                      <td className="px-4 py-3 align-top">全 40 項目、ディメンション別</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">ニュース出版社</td>
                      <td className="px-4 py-3 align-top">6 行のデータ、そのステータスコードと robots</td>
                      <td className="px-4 py-3 align-top">クローラーの通過可能性</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">応答しなかった 9 件</td>
                      <td className="px-4 py-3 align-top">ステータスコードとブラウザステータスの組</td>
                      <td className="px-4 py-3 align-top">測定ガード</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">エンティティの欠落</td>
                      <td className="px-4 py-3 align-top">サンプル全体の 2 つの真偽値フィールド</td>
                      <td className="px-4 py-3 align-top">エンティティと sameAs</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">llms.txt と根拠</td>
                      <td className="px-4 py-3 align-top">重み付けの算術</td>
                      <td className="px-4 py-3 align-top">コンテキストファイル</td>
                    </tr>
                    <tr className="border-t border-[var(--line)]">
                      <td className="px-4 py-3 align-top">失敗したチェックの読み方</td>
                      <td className="px-4 py-3 align-top">ルールページとその注記</td>
                      <td className="px-4 py-3 align-top">公開されている限界</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                ここに載らないものは何ですか？
              </h2>
              <ul>
                <li>
                  <strong>スポンサー記事。</strong>
                  有料の掲載枠はなく、ベンダーがレポートを買うことで言及を買うことはできません。
                </li>
                <li>
                  <strong>出典のない数字。</strong>
                  調査や再実行可能なスキャンに遡れない数字は、どれほど説得力があっても書きません。
                </li>
                <li>
                  <strong>測定を装った予測。</strong>
                  スキャナはあなたのブランドについてモデルに問い合わせないので、それについての記事も問い合わせません。
                </li>
                <li>
                  <strong>量のための量。</strong>
                  公開計画は公開するという約束であり、基準を下げてそれを守るサイトは、見た目より少ないものしか公開していません。
                </li>
              </ul>

              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-1)]">
                同意できない記事はどう読めばよいですか？
              </h2>
              <p>
                チェック項目、URL、スキャンが報告した内容をお送りください。具体的なルールを名指しした異議は、このプロジェクトが受け取る最も有用なメッセージです。手法を公開しているのは、異議を具体的にできるようにするためです。
              </p>
              <p>
                執筆がどのように生まれ、訂正され、資金提供されているかは
                <Link href={AUTHOR.path} hrefLang="en">
                  著者ページ
                </Link>
                （英語）に書かれています。ルール一式は
                <Link href="/ja/checks/">チェック項目のリファレンス</Link>
                に、算出方法は
                <Link href="/ja/methodology/">方法論ページ</Link>にあります。
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="執筆についての質問"
                items={[
                  {
                    q: "これはブログですか？",
                    a: "一次情報のノートのアーカイブです。調査結果、ルールの解説、明示された限界があります。更新は数日おきに1本を目標にしています。ただし各記事の背後には測定があります。ニュースフィードでもスポンサー記事でもありません。記事の背後に測定があるときにだけ公開されます。",
                  },
                  {
                    q: "記事を引用してもよいですか？",
                    a: "はい。出典とリンクを明記してください。どのサンプルから来たかを示さずに数字だけを引用することは、このアーカイブが難しくしようとしている失敗そのものです。数字を含む文とその出典を一緒に引用してください。",
                  },
                  {
                    q: "記事は査読されていますか？",
                    a: "いいえ。査読済みと称するのは事実に反します。公開データとルールカタログに照らして確認しており、各記事は自らの手法が実際より弱い部分を明記しています。",
                  },
                ]}
              />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="このアーカイブが議論する重み付けは、好みではなく公開された研究に従っています。各数字の背後にある調査データ行は公開されており、再実行できます。"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ほかのローカライズページと同じ遷移先。言語を切り替えると、翻訳されていない
          隣のページではなく、その言語のホームに移動する。 */}
      <LocaleFooter locale="ja" dict={dict} target={homePath} />
    </div>
  );
}
