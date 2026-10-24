import Link from "next/link";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInsight } from "@/lib/insights";

/**
 * `/ja/blog/llms-txt-what-the-evidence-supports/` — the llms.txt explainer, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so each language's body lives beside it and the route only decides which one
 * to render. A Japanese-only `page.tsx` would have deleted the Chinese explainer, which is
 * the version that already exists for this URL.
 *
 * WHAT IS TRANSLATED: the English article's prose, headings, the table, the FAQ, the note
 * around the evidence block, the author card and the related links. The text translates the
 * ENGLISH page, so it makes the same argument rather than a different Japanese one.
 * WHAT IS NOT: the counter-example llms.txt, because it is an example file and translating
 * its contents would stop it looking like a file; and the Evidence quotation, its attribution
 * and the source labels, because a translated quotation would change what the cited paper
 * says while still looking like a quotation. `llms.txt`, `robots.txt`, `H1`, `sameAs`,
 * `Markdown` and every number, percentage and URL stay byte-identical.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/blog/`,
 * `/ja/methodology/`, `/ja/docs/llms-txt-deployment/`). Anything that only exists in English
 * - here the studio - points at the English route with hrefLang="en" and says （英語）, so a
 * reader is never dropped onto an English page without being told.
 *
 * THE DATE IS PRINTED AS AN ISO STRING rather than through formatDate(), which emits English
 * month names. The machine-readable `dateTime` and the visible date are the same string, so
 * they cannot disagree. The date itself is read from lib/insights.ts so it cannot drift from
 * the English article.
 *
 * TITLE and DESCRIPTION are exported because the dispatcher's generateMetadata returns them
 * for `ja`, so the canonical can never describe a page whose visible heading says something
 * else.
 */
const insight = getInsight("llms-txt-what-the-evidence-supports");

export const TITLE = "llms.txt：証拠は実際に何を支持しているのか";
export const DESCRIPTION =
  "llms.txt という慣習、それに対してなされてきた主張、そしてそれをランキング要因として扱うのではなく 100 点中 3.3 点として重み付けするという私たちの判断の背景にある測定について説明します。";
const DEK =
  "ファイルを追加するのは簡単で、それをレバーとして正当化するのは困難です。それでも公開する価値がある理由と、実際以上に見せかけるべきでない理由を書きます。";
/* The badge label, matching the Japanese archive's category for Explainer. */
const CATEGORY = "解説";

/*
 * lib/insights.ts stores readTime as an English sentence ("8 min read"). Number.parseInt
 * takes the number and drops the words, so the Japanese byline and the English byline
 * cannot report different reading times.
 */
const READ_MINUTES = Number.parseInt(insight.readTime, 10);

/*
 * Translations of AUTHOR.role and AUTHOR.bio from lib/author.ts. They live here as
 * constants rather than in lib/i18n/dictionaries.ts because they appear on this page only,
 * and they must be kept in step with the English strings by whoever edits lib/author.ts.
 */
const AUTHOR_ROLE_JA = "LLMention のメンテナー";
const AUTHOR_BIO_JA =
  "私は LLMention を構築し、維持しています。スキャナー、ルールセット、そしてその背景にある研究です。この仕事はソースコードとして公開されているので、方法は信じるしかないものではなく、検証できるものになっています。";

export default function JapaneseLlmsTxtEvidencePage() {
  const dict = getDictionary("ja");

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      {/* The way back to the Japanese archive, in the place PostShell puts it. */}
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
        {/* Full-bleed title band: same colour step and geometry as the English article, so the
            two language versions do not look like two different sites. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                {CATEGORY}
              </span>
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.028em] md:text-5xl">
                {TITLE}
              </h1>
              <p className="text-base leading-relaxed text-[var(--ink-2)] md:text-lg">{DEK}</p>
              {/*
                The byline from PostShell, in Japanese. The author page is English, so the
                link is labelled rather than silently switching language halfway through the
                line.
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
            {/* 17px body copy at the same 768px measure as the English article. */}
            <article className="doc-article mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                llms.txt は、ドメインのルートに置かれ、サイトを機械向けに説明する提案中の Markdown
                ファイルです。公開のコストは低く、広く推奨されていながら、この分野のほとんど何よりも裏付けとなる証拠が少ないのです。だからこそ、あるツールがそれを正直に言えるかどうかを試す良いリトマス紙になります。
              </p>
              <p>
                当サイトはこれを公開し、存在をチェックし、<strong>100 点中 3.3 点</strong>{" "}
                の重みを与えています。これら 3 つの事実が両立するのは、このチェックが「読まれる価値」ではなく「公開するコスト」を測っている場合だけです。それがこの記事が論じる立場です。
              </p>

              <h2>llms.txt とは何か？</h2>
              <p>
                <code>/llms.txt</code> にある Markdown
                ファイルで、タイトル、1 行の要約、リンクの集合を含み、ブラウザではなく言語モデル向けに書かれたものです。
              </p>
              <p>
                この慣習は{" "}
                <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">
                  llmstxt.org
                </a>
                に文書化されており、これが一次情報源で、意見を形成する前に読む価値のある唯一のものです。形は意図的に単純です。プロジェクト名を書いた H1、引用ブロックの要約、そして 1 行の説明が付いたリンクのセクションが続きます。
              </p>

              <h2>スキャナーが実際に検査するものは？</h2>
              <p>
                4 つの構造的性質です。ファイルが 20 バイトより大きい、H1 を含む、<code>&gt;</code>{" "}
                で始まる要約行を含む、少なくとも 3 つの Markdown
                リンクを含む。いずれかが欠けていれば部分合格です。
              </p>
              <p>
                ファイルが何を言っているかは判定されません。存在しないページへの 3 つのリンクでも構造テストは通ります。これは、あるルールがシグナルの質ではなく存在を測っていることを示す当サイトで最も明確な例であり、ルールページにもそのままそう書かれています。
              </p>

              <h2>llms.txt を読むと明記しているクローラーはあるか？</h2>
              <p>
                私たちが開けたものにはありません。OpenAI のヘルプセンターと Anthropic のクローラーに関する記事は、どちらも制御面として{" "}
                <code>robots.txt</code> を指定しており、llms.txt を読むことを約束してはいません。
              </p>
              <p>
                これはドキュメントについての記述であり、挙動についての記述ではありません。その違いは重要です。クロールポリシーは文書化されていても無視されることがあり、文書化されていない慣習が静かに採用されることもあります。正直に言える範囲はもっと狭いのです。どのベンダーも公約を公開していないため、サイト所有者は証拠から期待される結果を導くことができません。
              </p>

              <h2>それでもなぜ重みを与えるのか？</h2>
              <p>
                公開はほぼ無料であり、効果が測定されていないシグナルにとっては、小さな重みこそが正しい価格だからです。この算術は隠さず公開しています。
              </p>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>ルール</th>
                      <th>点数</th>
                      <th>ディメンションの重み</th>
                      <th>総点に対する上限</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>llms.txt の構造チェック</td>
                      <td>ディメンションの 6 点中 4 点</td>
                      <td>5%</td>
                      <td>100 点中 3.3</td>
                    </tr>
                    <tr>
                      <td>robots.txt が読める</td>
                      <td>ディメンションの 6 点中 1 点</td>
                      <td>5%</td>
                      <td>100 点中 0.8</td>
                    </tr>
                    <tr>
                      <td>比較：クローラーアクセス</td>
                      <td>—</td>
                      <td>16%</td>
                      <td>100 点中 16</td>
                    </tr>
                    <tr>
                      <td>比較：機械可読性</td>
                      <td>—</td>
                      <td>12%</td>
                      <td>100 点中 12</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                完璧な llms.txt は <strong>3.3</strong>{" "}
                点の価値です。クローラーを許可することはスコアの <strong>16%</strong>、エンティティマークアップを正しく行うことは{" "}
                <strong>12%</strong>{" "}
                の価値があります。午後をどこに使うかを決めるサイトにとって、答えはこの比較の中にあり、それはこのファイルではありません。
              </p>

              <h2>このファイルは実際に何の役に立つのか？</h2>
              <p>
                ランキングとは無関係な 2 つのことです。実際に読むツールへの読める要約と、サイト所有者への強制力です。
              </p>
              <ul>
                <li>
                  <strong>ドキュメントサイトとコーディングエージェント。</strong>よく書かれた llms.txt
                  は、リポジトリやドキュメントツリーを要約するツールにとって有用なナビゲーション要約であり、その用途は検索エンジンが採用するかどうかに依存しません。
                </li>
                <li>
                  <strong>要約を書くこと自体が練習です。</strong>サイトが何であるかを 1
                  文で正直に説明すると、それができないコピーが露呈します。そしてその 1 文は meta description、Organization
                  ノード、ピッチのどこにでも必要です。
                </li>
                <li>
                  <strong>正しく保つのは安い。</strong>リンクはナビゲーションにあるものなので、再生成は記事ではなく diff です。
                </li>
              </ul>

              <h2>虚構のないバージョンはどんな形か？</h2>
              <p>
                短く、テンプレートではなくページ自体から生成されます。以下の各行は、それが説明するサイトと照合できます。
              </p>

              <pre>{`# Your Brand

> One sentence on what the product does, written for a reader who has
> never seen the site.

## Core pages

- [Product](https://your-domain.com/product/): what it does and who it is for
- [Pricing](https://your-domain.com/pricing/): what costs money and what does not
- [About](https://your-domain.com/about/): who runs it and how to reach them

## Notes

- The tool is free and requires no account.`}</pre>

              <p>
                この形には 2 つの失敗モードが見えます。テンプレートから生成されたファイルは、サイトが変わった瞬間にドリフトします。ページの実際のタイトル、説明、ナビゲーションから生成されたファイルは、サイトに存在しないものを説明できません。それが{" "}
                <Link href="/llms-txt-studio/" hrefLang="en">
                  llms.txt studio
                </Link>
                （英語）が中心に据えている性質であり、手入力ではなくホームページを読む理由です。
              </p>

              <h2>このファイルを最適化する代わりに、何をすべきか？</h2>
              <p>
                スコアが実際に重みを与えているものを直してください。クローラーアクセス、エンティティマークアップ、回答優先の構造を合わせると、このコンテキストファイルの 4
                倍以上の重みになります。
              </p>
              <ol>
                <li>
                  <code>robots.txt</code> が、引用を得たいクローラーを許可しているか確認します。これは 16%
                  のディメンションであり、ファイル 1 つで済みます。
                </li>
                <li>
                  エンティティとその <code>sameAs</code> プロフィールを宣言します。それは 12%
                  のディメンションであり、十数行の JSON です。
                </li>
                <li>
                  見出しを問いの形に書き換え、その直下に 1 文の答えを置きます。それは 10%
                  のディメンションであり、インフラではなく編集の手間がかかります。
                </li>
                <li>
                  llms.txt はそれらの後に公開します。すでに説明可能にしたサイトの要約だからです。
                </li>
              </ol>
              <p>
                これらの重みの背後にある方法は、このファイルの重みを低く抑える理由も含めて{" "}
                <Link href="/ja/methodology/">方法論のページ</Link>にあり、デプロイの詳細は{" "}
                <Link href="/ja/docs/llms-txt-deployment/">llms.txt ガイド</Link>にあります。
              </p>
            </article>

            {/*
              Outside the article, so the FAQ and the evidence block keep the 15px measure they
              have on the English page instead of inheriting the article's 17px.
            */}
            <div className="mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="llms.txt についての質問"
                items={[
                  {
                    q: "AI 検索に引用されるには llms.txt が必要ですか？",
                    a: "いいえ。当サイトが測定できたものの中に、このファイルが読まれたことを示すものはありませんし、存在するクローラーのドキュメントは代わりに robots.txt を指しています。機械可読な要約が欲しいなら公開してください。ただしスコアが動くと期待しないでください。",
                  },
                  {
                    q: "公開することで何か不都合がありますか？",
                    a: "嘘を書いた場合だけです。持っていない製品を説明したり、存在しないページにリンクしたりするファイルは、読者やモデルが検証できる主張であり、ファイルの価値を超えるコストになります。",
                  },
                  {
                    q: "ではなぜスキャナーは検査するのですか？",
                    a: "安いからです。公開したサイトは少なくとも自分が何であるかを書き留めることを強いられます。そして除外すれば、このカテゴリの大部分が採用している慣習に対してスコアが盲目になるからです。",
                  },
                ]}
                level="h3"
              />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note="この記事の数字はすべて、公開された研究か、スキャナーが実行するルールセットに由来しています。どちらもリンクがあり、再実行できます。"
              />
            </div>

            {/*
              The author card from PostShell. It is translated rather than kept in English
              because its whole job is to tell this reader who wrote the piece.
            */}
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <p className="text-[15px] font-semibold text-[var(--ink-1)]">
                {AUTHOR.name} — {AUTHOR_ROLE_JA}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{AUTHOR_BIO_JA}</p>
              <p className="mt-3 text-[13px] text-[var(--ink-3)]">
                <Link href={AUTHOR.path} hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  このサイトがどのように書かれ、どのように資金を得ているか（英語） →
                </Link>
              </p>
            </div>

            {/*
              "Read next", as PostShell renders it. Both targets exist in this route group,
              so they are linked in Japanese: sending a reader to the English original would
              contradict the hreflang pair each article claims.
            */}
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--ink-1)]">次に読む</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ja/blog/reading-a-failed-check/"
                    className="text-[15px] font-medium text-[var(--accent)] hover:opacity-75"
                  >
                    失敗したチェックを読み解き、正しい場所を直す方法
                  </Link>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-3)]">
                    llms.txt ルールが測るのは構造であり、真実ではありません。どのルールページも明言しなければならない同じギャップです。
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
                    省略するコストが高い項目です。スコアの 12% を占め、サンプルのほとんどが持っていません。
                  </p>
                </li>
              </ul>
            </div>

            {/* The scan console only exists on the English homepage, so the call to action
                points at the page that actually has a form in it. */}
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
