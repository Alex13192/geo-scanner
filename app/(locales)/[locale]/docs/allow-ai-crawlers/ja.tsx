import Link from "next/link";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import DiagramRobotsMatch from "@/app/(en)/docs/_components/DiagramRobotsMatch";
import { AUTHOR } from "@/lib/author";
import { homePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * `/ja/docs/allow-ai-crawlers/` - the crawler-access guide, in Japanese.
 *
 * WHY THIS IS A MODULE AND NOT THE ROUTE: `/zh/...` and `/ja/...` share one route file
 * (`page.tsx`), so the body for each language lives beside it and the route only decides
 * which one to render. A Japanese-only `page.tsx` would have deleted the Chinese guide,
 * which is still the version most of this article's readers arrive on.
 *
 * WHAT IS TRANSLATED: the English article's prose, headings, FAQ and the evidence note.
 * WHAT IS NOT: the robots.txt sample, the agent names, the HTTP status codes and the
 * diagram's SVG labels. Those are the subject matter - translating `GPTBot` or `Allow:`
 * would stop the example being the thing the guide is teaching - and the diagram is a
 * drawing reused from the English route rather than forked, so the paragraph under it says
 * its labels are English.
 *
 * LINKS: a translated target points at its Japanese route (`/ja/docs/`, `/ja/methodology/`).
 * Anything that only exists in English points at the English route with hrefLang="en" and
 * says （英語）, so a reader is never dropped onto an English page without being told.
 *
 * DATES ARE PRINTED AS ISO STRINGS rather than through formatDate(), because that helper
 * emits English month names. The machine-readable `dateTime` and the visible date are the
 * same string here, so they cannot disagree.
 */
export const TITLE = "GPTBot と PerplexityBot のための robots.txt と WAF の設定";
export const DESCRIPTION =
  "AI 検索エンジンが送信する user-agent、robots.txt でそれらを許可する方法、そして WAF が AI クローラーに 403 を静かに返していないことを確認する方法を説明します。";

export default function JapaneseAllowAiCrawlersPage() {
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
        {/* Full-bleed title band: the colour step is what marks the margin. */}
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <div className="mx-auto max-w-3xl space-y-4">
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)]">
                技術
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
            {/*
              本文は英語版と同じ 17px、同じ行長。見出し・リスト・pre・リンクの体裁は
              `.doc-article` が持つ（このプロジェクトには Tailwind Typography が入っていない）。
            */}
            <article className="doc-article reveal-stagger mx-auto max-w-3xl text-[17px] leading-[1.65] text-[var(--ink-2)]">
              <p>
                <strong>クローラーがブロックされていると、コンテンツがどれほど優れていても、そのエンジンから引用されることはありません。</strong>これが起きる場所は <code>robots.txt</code> とファイアウォールの 2 か所です。しかも、2 つ目のほうは誰も確認していない場所です。
              </p>

              <h2>AI 検索エンジンはどの user-agent を送信しますか？</h2>
              <ul>
                <li>
                  <strong>OpenAI：</strong> <code>GPTBot</code>（学習）、
                  <code>OAI-SearchBot</code>（検索インデックス）、<code>ChatGPT-User</code>
                  （ユーザーの操作でリアルタイムに取得）
                </li>
                <li>
                  <strong>Anthropic：</strong> <code>ClaudeBot</code>、
                  <code>Claude-User</code>、<code>Claude-SearchBot</code>、
                  <code>anthropic-ai</code>
                </li>
                <li>
                  <strong>Perplexity：</strong> <code>PerplexityBot</code>、
                  <code>Perplexity-User</code>
                </li>
                <li>
                  <strong>Google：</strong> <code>Google-Extended</code>（AI grounding 用。
                  <code>Googlebot</code> は別のものです）
                </li>
                <li>
                  <strong>その他：</strong> <code>Bytespider</code>（ByteDance）、
                  <code>CCBot</code>（Common Crawl）、<code>meta-externalagent</code>（Meta）、
                  <code>Applebot-Extended</code>（Apple）
                </li>
              </ul>
              <p>
                <code>*-User</code> の agent は、ほかとは分けて考える価値があります。これらは、誰かがたった今その URL について質問したために取得するので、
                ブロックすると、あとでインデックスされる内容だけでなく、いま個々のユーザーが見ている内容も変わります。
              </p>

              {/*
                英語版と同じ位置 - 「どう許可するか」の前 - に置く。この図が答える問い
                （そのファイルは、気にしている agent にそもそも適用されるのか）が先に来るため。
              */}
              <DiagramRobotsMatch />
              <p className="text-sm leading-relaxed text-[var(--ink-3)]">
                図のラベルは英語のままです。user-agent、Allow、Disallow などは技術用語であり、robots.txt の原文と項目ごとに照合できるようにするためです。
              </p>

              <h2>robots.txt で許可するにはどうすればよいですか？</h2>
              <p>
                デフォルトの動作ではすでにすべてが許可されているため、ほとんどのサイトに変更は必要ありません。実際の失敗パターンはその逆で、
                継承した規則やコピーしてきた規則がそれらをブロックしている場合です。意図が可視化され、レビューできるように、明示的に書いてください。
              </p>
              <pre>{`# AI search crawlers - explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# Everything else
User-agent: *
Allow: /
Disallow: /private/

Sitemap: https://your-domain.com/sitemap.xml`}</pre>
              <p>
                ファイルは 1 か所にまとめてください。別の sitemap を指し示すのにコストはかかりませんが、忘れられがちです。
              </p>

              <h2>ファイアウォールが AI クローラーに 403 を返すのはなぜですか？</h2>
              <p>
                <strong>通常の原因は bot 管理機能であり、robots.txt ではありません。</strong>
                チャレンジベースの bot 対策はリクエストを採点し、ブラウザではないものに JavaScript チャレンジを発行することがあります。
                サーバー側のクローラーは JS チャレンジを解けないため、チャレンジページか <code>403</code> を受け取り、取得失敗として記録されます。
              </p>
              <p>
                次の順に確認してください。bot-fight モードまたは同等の設定、under-attack プロファイルに設定されたセキュリティレベル、
                user-agent に一致するカスタム WAF ルール、そしてクローラーのバーストを攻撃として扱うレート制限ルールです。
              </p>

              <h2>AI の学習用クローラーをブロックすべきですか？</h2>
              <p>
                これは正当な選択であり、検索での可視性とは別の問題です。<code>CCBot</code> や{" "}
                <code>GPTBot</code> をブロックすると、影響するのはモデルの学習と grounding です。
                <code>OAI-SearchBot</code> や <code>PerplexityBot</code> をブロックすると、影響するのは回答の中で引用される可能性そのものです。
                自分が本当に反対しているのはどちらなのかを決めてください。そして、その作業の途中で誤って{" "}
                <code>Googlebot</code> や <code>Bingbot</code> までブロックしないでください。
              </p>

              <h2>クローラーがブロックされていないことを確認するにはどうすればよいですか？</h2>
              <ol>
                <li>
                  自分の <code>robots.txt</code> を取得し、上記の agent をブロックするグループがないことを確認します。
                </li>
                <li>
                  ブラウザではないサーバーから AI クローラーの user-agent でページをリクエストし、HTTP ステータスコードが{" "}
                  <code>200</code> であることを確認します。
                </li>
                <li>
                  チャレンジが発行されたことを示す <code>cf-mitigated</code> レスポンスヘッダーを確認します。
                </li>
                <li>
                  Google、OpenAI、Perplexity のアドレス範囲からのリクエストがブロックされていないか、エッジのセキュリティイベントログを確認します。
                </li>
              </ol>
              <p>
                <Link href="/#scan" hrefLang="en">
                  LLMention スキャナー（英語）
                </Link>
                は手順 1 を自動で実行し、サイトのルートで gptbot、claudebot、perplexitybot、oai-searchbot、google-extended のうち
                どれが禁止されているかを報告します。手順 2 と 3 は実行<strong>しません</strong>。スキャナーは自分自身として、
                自分のアドレスからあなたのサイトを取得するため、スキャナーが出すリクエストからは、実際の AI クローラーに対して
                あなたのファイアウォールがどう振る舞うかを知ることはできません。この 2 つの手順は、ご自身で実行してください。
              </p>
            </article>

            {/* 記事の外に置き、FAQ と根拠ブロックが 17px の本文サイズを継承しないようにする（英語版と同じ）。 */}
            <div className="reveal-stagger mx-auto mt-16 max-w-3xl space-y-10 text-[15px] leading-relaxed text-[var(--ink-2)]">
              <Faq
                title="クローラーアクセスについての質問"
                level="h3"
                items={[
                  {
                    q: "どの user-agent を許可する必要がありますか？",
                    a: "少なくとも、OpenAI の GPTBot と OAI-SearchBot、Anthropic の ClaudeBot と Claude-SearchBot、Perplexity の PerplexityBot、そして Google の AI 製品向けの Google-Extended です。",
                  },
                  {
                    q: "robots.txt では許可しているのに、スキャンがブロックと報告するのはなぜですか？",
                    a: "ファイアウォールや CDN のルールが、robots.txt を読む前にリクエストを拒否することがあるからです。大規模なサイトは IP アドレスでクローラーを検証するため、WAF の設定も答えの一部であり、ファイルだけでは足りません。",
                  },
                  {
                    q: "すべての AI クローラーを許可すべきですか？",
                    a: "それは技術的な問題ではなく、ポリシーの判断です。検索用クローラーを許可し、学習用クローラーを禁止する、というのはよくある妥当な線引きで、robots.txt で表現できます。",
                  },
                ]}
              />
              <Evidence
                title="根拠と出典"
                quote={GEO_PRIMARY_QUOTE}
                attribution="Generative Engine Optimization, KDD 2024"
                attributionUrl="https://arxiv.org/abs/2311.09735"
                sources={GEO_PRIMARY_SOURCES}
                note={
                  <>
                    当サイトが使う重み付けはこの測定結果に従っています。そのため「引用可能性と根拠」が 11%、「AI
                    コンテキストファイル」のディメンションが 5% です。重み付けの全体と、単一 URL
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
