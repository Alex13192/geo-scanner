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

/**
 * `/ja/docs/ai-visibility-self-check/` - the manual measurement method, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so the body for each language lives beside it and the route only decides which
 * one to render. A Japanese-only `page.tsx` would have deleted the Chinese guide that already
 * ranks for this URL.
 *
 * TRANSLATED FROM THE ENGLISH PAGE, NOT FROM THE CHINESE ONE: `app/(en)/docs/ai-visibility-self-check/`
 * is the source, so the section order, the four question kinds, the twenty-question template, the
 * six scoring checks, the four limitations, the fix order, the three FAQs and the evidence block
 * all match it one for one. The Chinese page is a sibling translation, not an intermediary -
 * paraphrasing a paraphrase is how a claim drifts.
 *
 * WHAT STAYS ENGLISH, ON PURPOSE: the twenty-question template and the scoring cue words
 * (`recommend`, `best for`, `worth considering`, `a good fit`). They are the measurement inputs,
 * not prose: a question asked in one language and the same question asked in another are two
 * different measurements, and translating a cue word would silently change what the six checks
 * are looking for. The prose around them is Japanese.
 *
 * LINKS GO WHERE THEY SAY. `/ja/docs/`, `/ja/methodology/` and `/ja/checks/...` exist in Japanese.
 * Anything that only exists in English (`/answer-check/`, `/report/`, `/docs/qa-style-headings/`,
 * `/docs/schema-org-jsonld/`, `/monitor/`, `/#scan`, the author page) is linked with
 * `hrefLang="en"` and labelled 「（英語）」, so a reader is never dropped onto an English page
 * without being told.
 *
 * LINE BREAKS IN THE SOURCE ARE NOT LINE BREAKS ON THE PAGE. JSX keeps a newline between two
 * lines of text as a single space, so a Japanese sentence is kept on one source line and breaks
 * are placed only after 「。」 or next to a tag, where the whitespace is dropped.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper emits
 * English month names. The machine-readable `dateTime` and the visible date are the same string
 * here, so they cannot disagree.
 *
 * TITLE and DESCRIPTION are exported because `page.tsx` needs the same two strings for the ja
 * metadata; importing them means the `<h1>` and the `<title>` cannot drift apart.
 */
export const TITLE = "AI エンジンがあなたのブランドに言及しているかを確認する方法";
export const DESCRIPTION =
  "自分で実行できる無料のセルフチェックです。尋ねるべき 20 の質問、回答を採点する機械的なルール、そして 1 回の実行では何も証明できない理由をまとめました。";

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "このチェックはどのくらいの頻度で実行すべきですか？",
    a: "月に 1 回、同じ質問セットで行います。実行する日には、各質問を 3 回尋ねてください。1 つの回答は逸話にすぎません。日付とモデルを記録した 3 つの回答が、比較できるベースラインになります。",
  },
  {
    q: "どのエンジンをテストすべきですか？",
    a: "買い手が実際に使っているエンジンで、個別に報告してください。ChatGPT と Perplexity を平均して 1 つの数字にすると、両者の取得方法が違うという事実が隠れます。しかも 20 の質問では、2 つのエンジン間の差は通常ノイズであり、発見ではありません。",
  },
  {
    q: "これは自動化できますか？",
    a: "プラットフォームを呼び出す場合に限ります。AI エンジンが答えた内容を知る無料の方法はありません。自分で尋ねるか、代わりに尋ねてくれるツールを買うかのどちらかです。この方法は手作業で尋ねることであり、そのため無料で、寝ている間には動かせません。",
  },
];

export default function JapaneseAiVisibilitySelfCheckPage() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      {/* ガイド一覧への戻り口。英語のシェルが置いているのと同じ位置に、日本語の一覧を指して置く。 */}
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
                方法
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                {DESCRIPTION}
              </p>
              {/*
                著者と日付は英語版のバイラインと同じ形で、日付は ISO のまま表示する。
                formatDate は英語の月名を返すため、ここでは使わない。
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
                <time dateTime="2026-10-06">公開日 2026-10-06</time>
                <span aria-hidden="true">·</span>
                <time dateTime="2026-10-23">更新日 2026-10-23</time>
                <span aria-hidden="true">·</span>
                <span>6 分で読めます</span>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-16">
            {/* 本文は英語版と同じ 17px、同じ行長。見出し・リスト・pre・リンクの体裁は `.doc-article` が持つ。 */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.7] text-[var(--ink-2)]">
              <p>
                <strong>AI エンジンがあなたのブランドに言及しているかどうかは、1 時間ほどで、無料で、ツールを使わずに確認できます。</strong>できないのは、1 回確認して結論を出すことです。このページでは、尋ねるべき質問、回答を採点するための機械的なルール、そして「測定」と「自分に都合のよい物語」を分ける記録の規律を示します。
              </p>
              <p>
                始める前に 1 つはっきりさせておきます。<strong>LLMention のスキャナーはこの作業を行いません。</strong>スキャナーはページを読み取り、40 件の公開チェックで採点するだけで、AI エンジンに何も尋ねません。これは隙間ではなく、意図的な限界です。エンジンが何と言ったかを測るには問い合わせが必要で、実行のたびに費用がかかります。そして当サイトは、自分で測定していない主張を公開しません。以下の方法は、その代わりに推奨するものです。数字の出し方を示せない相手から数字を買うより、ご自身で実行していただくほうがよいと考えています。6 つのシグナルの判定を任せたい場合は、<Link href="/answer-check/" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">回答チェッカー（英語）</Link>が、このガイドのルールを貼り付けた回答にそのまま適用します。ブラウザ内で動作するため、テキストがページの外に出ることはありません。
              </p>

              <h2>なぜ AI の回答 1 つが測定にならないのですか？</h2>
              <p>
                同じ質問が 2 回同じ答えを返すことはないからです。実行のたびに 3 つのものが動きます。<strong>モデルのバージョン</strong>（同じ名前のまま静かに更新されます）、<strong>日付</strong>、そして<strong>セッション</strong>です。新しく開いた会話と進行中の会話は異なり、パーソナライズや地域によって取得される内容も変わります。1 回尋ねただけで観測できるのは、見えない分布からの 1 サンプルにすぎません。
              </p>
              <p>
                だからこそ、誠実な測定には手間がかかります。同じ日に各質問を 3 回尋ね、1 つの結果ではなく 3 つの結果を報告してください。あるブランドが 3 つの回答のうち 1 つに現れたなら、結論は「3 回に 1 回」です。「33% のユーザーがあなたを見ている」ではありません。それは比率が暗示するものであり、このサンプルでは支えられない主張です。
              </p>

              <h2>どの種類の質問をすればよいですか？</h2>
              <p>
                4 種類あり、それぞれ測っているものが違います。これらを分けておくことが、「役に立つチェック」と「安心するためのチェック」の違いです。
              </p>
              <ul>
                <li>
                  <strong>カテゴリ質問</strong> — ブランド名を含みません。「X を提供しているベンダーはどこですか？」これはリーチを測る質問で、あなたの存在を知らない人に見つけてもらえるかどうかを見ます。
                </li>
                <li>
                  <strong>シナリオ質問</strong> — ブランド名のない、具体的な問題です。「Y を解決するにはどうすればよいですか？」推薦がニーズから導かれているのか、カテゴリ一覧から選ばれているのかを試します。
                </li>
                <li>
                  <strong>比較質問</strong> — あなたのブランドと、名前を挙げた代替手段の比較です。候補リストにそもそも入れるかどうかが分かり、最もよく「状況によります」と答えられる種類でもあります。
                </li>
                <li>
                  <strong>事実質問</strong> — あなたのブランドを名指しし、検証できる情報を尋ねます。正式名称、設立日、製品が何をするか、誰向けなのか、といった点です。これはリーチではなく正確さを測り、誤りのコストが最も高い領域です。
                </li>
              </ul>
              <p>
                成長を見るならカテゴリ質問とシナリオ質問です。そこでの言及は、お金を払って得たものではないからです。危険を見るなら事実質問です。
              </p>

              <h2>どの質問から始めればよいですか？</h2>
              <p>
                20 個あれば始めるのに十分で、実際に終えられる大きさです。角括弧の部分を自分の言葉に置き換えてください（<code>[category]</code>、<code>[product type]</code>、<code>[competitor]</code>）。さらに、買い手が実際に使う言語を加えてください。英語で尋ねた質問と、中国語で尋ねた同じ質問は、2 つの異なる測定だからです。
              </p>
              {/* The template stays English on purpose: its placeholders are instructions
                  about what to substitute, and the questions are what the reader will
                  actually type to an engine. See the WHY note at the top of the file. */}
              <pre>{`Category (no brand name)
1.  Which companies offer [product type] for [audience]?
2.  What are the best [category] tools in 2026?
3.  Who are the main vendors in [category]?
4.  Which [product type] is suitable for [size / region / industry]?
5.  What should I look for when choosing [category]?

Scenario (a problem, no brand name)
6.  How do I solve [problem the product solves]?
7.  What is the cheapest way to [outcome]?
8.  How do teams like mine handle [workflow]?
9.  What alternatives exist when [common constraint]?
10. How do I compare [approach A] and [approach B]?

Comparison (your brand against a named one)
11. [Your brand] vs [competitor]: which is better for [use case]?
12. Is [your brand] worth it compared with [competitor]?
13. What are the disadvantages of [your brand]?
14. Which is easier to set up, [your brand] or [competitor]?
15. If I need [requirement], should I choose [your brand]?

Fact (your brand by name)
16. What does [your brand] do?
17. Who owns [your brand] and when was it founded?
18. What does [your brand] cost?
19. Which company is behind [your product name]?
20. Does [your brand] handle [specific requirement]?`}</pre>

              <h2>回答はどう採点すればよいですか？</h2>
              <p>
                6 つのチェックは、すべて機械的です。同じ回答を読んだ 2 人が同じ判定に到達するように書かれています。だからこそ、その結果は記録する価値があります。
              </p>
              <ol>
                <li>
                  <strong>言及されている</strong> — ブランド名または既知の別名が、回答のどこかに現れます。
                </li>
                <li>
                  <strong>早い位置で言及されている</strong> — 最初の言及がおおよそ最初の 300 文字以内にあります。最後の段落で名前を出す回答は、あなたを浮上させる回答ではありません。
                </li>
                <li>
                  <strong>候補リストに入っている</strong> — 言及が、何気ない文章の中ではなく、箇条書きまたは番号付きの選択肢リストの中にあります。読者が選択するのはリストです。
                </li>
                <li>
                  <strong>推薦を伴っている</strong> — 言及の前後およそ 120 文字以内に、推薦を表す動詞があります。<em>recommend</em>、<em>best for</em>、<em>worth considering</em>、<em>a good fit</em>。これらを伴わない言及は、提案ではなく単なる名前です。
                </li>
                <li>
                  <strong>出典が引用されている</strong> — 回答がリンクしているドメインを集めます。自分のドメインがそこに含まれていないなら、エンジンは別の場所からあなたを説明しており、その説明方法をあなたは制御できません。
                </li>
                <li>
                  <strong>正直な空白</strong> — 事実質問では、「それは確認できません」は合格であり、自信に満ちた誤答は不合格です。空白は取り返せますが、顧客があなたに突き返してくる誤った数字は取り返せません。
                </li>
              </ol>
              <p>
                感じたことではなく、質問ごとに 6 つの結果を記録してください。通常最も重要なのは 5 番目です。出典は AI の回答の中で実際に働きかけられる部分であり、同時にほとんどの人が見ない部分でもあります。
              </p>

              <h2>価値のある記録にするにはどうすればよいですか？</h2>
              <p>
                <strong>始める前に条件を固定してください。そうしなければ 2 回目の実行は 1 回目と比較できません。</strong>同じ質問、同じモデルバージョン、同じ言語、同じ日、毎回新しいセッション、そして各質問を 24 時間以内に 3 回です。日付と、表示されたモデル名を書き留め、生の回答テキストを保存してください。スクリーンショットでも貼り付けでも、3 か月後にもまだ手元にあるほうを選びます。
              </p>
              <p>
                次に、実行同士を比較します。ベンダーが出す 1 つの数字と比べるのではありません。「3 つのカテゴリ質問のうち 2 つで言及」から「3 つすべて」への変化は、自分で検証できる実際の観察です。「可視性が 21% から 34% に上がった」は 20 サンプルに対して行った算術であり、どう計算したのかと問われれば持ちこたえません。
              </p>

              <h2>この方法で分からないことは何ですか？</h2>
              <ul>
                <li>
                  <strong>比率は出せません。</strong>20 の質問を 3 回で、エンジンあたり 60 サンプルです。変化に気づくには十分ですが、あなたの市場を表すパーセントを支えるにはまったく足りません。
                </li>
                <li>
                  <strong>すべてのユーザーを代表しません。</strong>エンジンは地域、履歴、アカウントによってパーソナライズし、ベンダーのコンソールで見える回答は、あなたのノート PC で見えるものと違います。
                </li>
                <li>
                  <strong>寝ている間には実行できません。</strong>自動化はクエリごとの課金を意味します。この方法が手作業の形で存在する理由は、まさにそこにあります。
                </li>
                <li>
                  <strong>エンジン間の小さな差はノイズです。</strong>20 の質問では、2 つのプラットフォーム間の 5 ポイントの差は、プラットフォームについての発見にはなりません。
                </li>
              </ul>

              <h2>結果が出たら何をすればよいですか？</h2>
              <p>
                <strong>言及されるための工夫をする前に、自分が読み取ってもらえる状態かを確認してください。</strong>エンジンは取得できないページを引用できませんし、エッジで拒否されるクローラーは、どれだけコンテンツを足しても救えません。気になるページに<Link href="/report/" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">無料監査（英語）</Link>を実行してください。クローラーがアクセスできるか、回答を含むコンテンツが機械可読か、そしてモデルがあなたについて繰り返すかもしれない事実が自分のページ間で一貫しているかを報告します。
              </p>
              <p>
                次に、この順に直してください。1 つ直すたびに、次の修正が安くなるからです。
              </p>
              <ol>
                <li>
                  アクセス — <Link href="/ja/checks/robots-ai-allowed/" className="text-[var(--accent)] underline hover:opacity-75">クローラーアクセスのルール</Link>と、<Link href="/ja/docs/allow-ai-crawlers/" className="text-[var(--accent)] underline hover:opacity-75">robots.txt とファイアウォールで AI クローラーを許可する</Link>ガイドをご覧ください。
                </li>
                <li>
                  取得可能性 — 質問形式の見出しと、その直下に置く直接的な回答です。<Link href="/docs/qa-style-headings/" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">AI の直接引用に向けた見出しの最適化（英語）</Link>で扱っています。
                </li>
                <li>
                  アイデンティティ — モデルが同名の別ブランドと区別できるようにするエンティティマークアップです。<Link href="/docs/schema-org-jsonld/" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">Schema.org JSON-LD の実装（英語）</Link>で扱っています。
                </li>
                <li>
                  根拠 — 公開された GEO 研究が、最も大きな単独の効果として測定した統計値、引用、出典です。すべてのルールは<Link href="/ja/methodology/" className="text-[var(--accent)] underline hover:opacity-75">方法論のページ</Link>に記載されています。
                </li>
              </ol>
              <p>
                1 か月後に、もう一度 20 の質問を実行してください。修正が効いていれば、最初に見える変化は言及の増加ではありません。5 番目のチェックである出典に、自分が管理するページが含まれ始めることです。それが先行指標であり、当サイトが直接手助けできる部分でもあります。<Link href="/monitor/" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">週次レポート（英語）</Link>が技術チェックを代わりに再実行し、何が変わったかを知らせます。そうすれば、質問に費やす 1 時間を、スキャンにはできない部分に使えます。
              </p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする（英語版と同じ）。 */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="AI 可視性を自分で確認することについての質問"
                items={FAQ_ITEMS}
                level="h3"
              />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    当サイトが使う重み付けはこの測定結果に従っています。そのため「引用可能性と根拠」が 11%、AI
                    コンテキストファイルのディメンションが 5% です。重み付けの全体と、単一 URL
                    のスキャンでは見えない部分は、
                    <Link href="/ja/methodology/" className="text-[var(--accent)] hover:opacity-75">
                      方法論のページ
                    </Link>
                    に書かれています。
                  </>
                }
              />
            </div>

            <div className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-8">
              <Link href="/#scan" hrefLang="en" className="text-sm text-[var(--accent)] hover:opacity-75">
                無料で自分のサイトを診断する（英語） →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="ja" dict={dict} target={homePath} />
    </div>
  );
}
