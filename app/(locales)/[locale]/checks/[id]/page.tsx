import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG, type CatalogCheck } from "@/lib/geo/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";
import { JA_CHECK_RULES } from "@/lib/i18n/ja-check-rules";
import { JA_CHECK_TITLES, JA_DIMENSION_LABELS } from "@/lib/i18n/ja-copy";
import { ZH_CHECK_RULES } from "@/lib/i18n/zh-check-rules";
import { ZH_CHECK_TITLES, ZH_DIMENSION_LABELS } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";

/**
 * `/<locale>/checks/<id>/` — one rule page, in Chinese and in Japanese.
 *
 * なぜ 1 ファイルで 2 言語なのか。`app/(locales)/[locale]/checks/[id]/page.tsx` という 1 つの
 * ルートを `/zh/checks/<id>/` と `/ja/checks/<id>/` が共有しているためで、日本語版を別ファイルに
 * すると中国語版の 40 ページが 404 になる。locale で分岐する 1 ファイルに両方を置き、
 * `zh` と `ja` 以外は `dynamicParams = false` と notFound() で弾く。
 *
 * WHAT IS TRANSLATED AND WHAT IS NOT: the rule text ("what this check looks at"), what a
 * failure means, and every fix branch are translated, because those are the parts a reader
 * acts on. The long analysis prose on the English page (why the rule exists, how it was
 * built, worked examples) stays English and the page links to it; claiming a full translation
 * of a page that is not fully translated would be the half-built translation this site has
 * withdrawn once already.
 *
 * WHY THE NUMBERS ARE IMPORTED: points, dimension weight and the catalogue itself come from
 * the same modules the analyser uses. A translated page that quotes a different point value
 * would be a published claim the engine disagrees with.
 */
export const dynamicParams = false;

/** 実行されるチェック。alias は同じチェックの別結果を記述したものなので、単独のページを持たない。 */
const RUNNABLE_CHECKS = CHECK_CATALOG.filter((check) => !check.alias);

export function generateStaticParams() {
  /* zh と ja の両方を返す。片方だけ返すと、もう片方の 40 ページが 404 になる。 */
  return ["zh", "ja"].flatMap((locale) =>
    RUNNABLE_CHECKS.map((check) => ({ locale, id: check.id }))
  );
}

function findCheck(id: string) {
  return CHECK_CATALOG.find((check) => check.id === id && !check.alias) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (locale !== "zh" && locale !== "ja") return {};
  const check = findCheck(id);
  if (!check) return {};

  if (locale === "ja") {
    const copy = JA_CHECK_RULES[id];
    if (!copy) return {};
    /* 日本語は 1 文字 ≒ 1 トークンではないが、説明文の長さの上限は同じ考え方で切る。 */
    const title = `${JA_CHECK_TITLES[id] ?? check.id}：ルールの説明`;
    const description = copy.rule.length > 150 ? `${copy.rule.slice(0, 147)}…` : copy.rule;

    return {
      title,
      description,
      alternates: {
        canonical: `/ja/checks/${check.id}/`,
        /* 3 言語すべてを宣言する。x-default は英語（唯一の完全版）を指す。 */
        languages: {
          en: `/checks/${check.id}/`,
          "zh-Hans": `/zh/checks/${check.id}/`,
          ja: `/ja/checks/${check.id}/`,
          "x-default": `/checks/${check.id}/`,
        },
      },
      ...social({ title, description, url: `/ja/checks/${check.id}/`, type: "article" }),
    };
  }

  const copy = ZH_CHECK_RULES[id];
  if (!copy) return {};
  const title = `${ZH_CHECK_TITLES[id] ?? check.id}：规则说明`;
  const description = copy.rule.length > 150 ? `${copy.rule.slice(0, 147)}…` : copy.rule;

  return {
    title,
    description,
    alternates: {
      canonical: `/zh/checks/${check.id}/`,
      /* ja を足すのは、日本語版がこのページを zh-Hans として宣言しているためである。 */
      languages: {
        en: `/checks/${check.id}/`,
        "zh-Hans": `/zh/checks/${check.id}/`,
        ja: `/ja/checks/${check.id}/`,
        "x-default": `/checks/${check.id}/`,
      },
    },
    ...social({ title, description, url: `/zh/checks/${check.id}/`, type: "article" }),
  };
}

export default async function LocalizedRulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (locale !== "zh" && locale !== "ja") notFound();

  const check = findCheck(id);
  if (!check) notFound();

  return locale === "ja" ? <JapaneseRulePage check={check} /> : <ChineseRulePage check={check} />;
}

function ChineseRulePage({ check }: { check: CatalogCheck }) {
  const copy = ZH_CHECK_RULES[check.id];
  if (!copy) notFound();

  const dict = getDictionary("zh");
  const dimension = DIMENSION_CATALOG.find((entry) => entry.id === check.dimension);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-12 md:py-16">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              规则 · {check.points} 分 ·{" "}
              {ZH_DIMENSION_LABELS[check.dimension] ?? dimension?.label ?? check.dimension}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.2] tracking-[-0.02em] md:text-4xl">
              {ZH_CHECK_TITLES[check.id] ?? check.id}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
              这是扫描器执行的 {check.points} 分规则之一，属于「
              {ZH_DIMENSION_LABELS[check.dimension] ?? dimension?.label ?? check.dimension}
              」（权重 {dimension?.weight ?? "?"}%）。完整分析文字仍是英文，下面的规则、失败含义和修法已翻译。
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-12 md:py-16">
            <article className="doc-article max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <h2>这条规则看什么</h2>
              <p>{copy.rule}</p>

              {copy.onFail ? (
                <>
                  <h2>失败意味着什么</h2>
                  <p>{copy.onFail}</p>
                </>
              ) : null}

              <h2>怎么修</h2>
              <ul>
                {copy.fixes.map((fix) => (
                  <li key={`${fix.when}-${fix.text}`}>
                    <strong>{fix.when === "partial" ? "部分满足时：" : "失败时："}</strong>
                    {fix.text}
                  </li>
                ))}
              </ul>

              <h2>它如何计入分数</h2>
              <p>
                这条规则满分 <strong>{check.points} 分</strong>，计入「
                {ZH_DIMENSION_LABELS[check.dimension] ?? dimension?.label ?? check.dimension}
                」维度；该维度占总分的 {dimension?.weight ?? "?"}%。扫描器对当前页面按同样的规则计算，
                计分方式（含“不适用”如何从分母中移除）写在{" "}
                <Link href="/zh/methodology/" className="text-[var(--accent)] underline hover:opacity-75">
                  中文方法论
                </Link>
                。
              </p>

              <h2>继续读</h2>
              <ul>
                <li>
                  英文完整分析页：{" "}
                  <Link
                    href={`/checks/${check.id}/`}
                    hrefLang="en"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    /checks/{check.id}/
                  </Link>
                  （为什么有这条规则、它如何被验证、示例）。
                </li>
                <li>
                  <Link href="/zh/checks/" className="text-[var(--accent)] underline hover:opacity-75">
                    全部 40 条规则
                  </Link>{" "}
                  按 12 个维度分组的总览。
                </li>
                <li>
                  要看你自己的这一项结果，运行{" "}
                  <Link href="/#scan" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">
                    免费扫描
                  </Link>
                  。
                </li>
              </ul>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}

function JapaneseRulePage({ check }: { check: CatalogCheck }) {
  const copy = JA_CHECK_RULES[check.id];
  if (!copy) notFound();

  const dict = getDictionary("ja");
  const dimension = DIMENSION_CATALOG.find((entry) => entry.id === check.dimension);
  const dimensionLabel =
    JA_DIMENSION_LABELS[check.dimension] ?? dimension?.label ?? check.dimension;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-12 md:py-16">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              ルール · {check.points} 点 · {dimensionLabel}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.2] tracking-[-0.02em] md:text-4xl">
              {JA_CHECK_TITLES[check.id] ?? check.id}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
              これはスキャナが実行する {check.points} 点のルールの 1 つで、「{dimensionLabel}」
              （重み {dimension?.weight ?? "?"}%）に属します。完全な分析文は英語のままです。
              以下のルール、失敗の意味、直し方は翻訳済みです。
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-12 md:py-16">
            <article className="doc-article max-w-3xl text-[17px] leading-[1.75] text-[var(--ink-2)]">
              <h2>このルールが見ているもの</h2>
              <p>{copy.rule}</p>

              {copy.onFail ? (
                <>
                  <h2>失敗すると何を意味するか</h2>
                  <p>{copy.onFail}</p>
                </>
              ) : null}

              <h2>どう直すか</h2>
              <ul>
                {copy.fixes.map((fix) => (
                  <li key={`${fix.when}-${fix.text}`}>
                    <strong>{fix.when === "partial" ? "一部だけ満たしている場合：" : "失敗している場合："}</strong>
                    {fix.text}
                  </li>
                ))}
              </ul>

              <h2>スコアにどう反映されるか</h2>
              <p>
                このルールの配点は <strong>{check.points} 点</strong>で、ディメンション「{dimensionLabel}」
                に計上されます。このディメンションは合計の {dimension?.weight ?? "?"}% を占めます。
                スキャナは実際のスキャンでも同じルールで採点します。採点方法（「当てはまらない」が
                分母から外れる仕組みを含む）は{" "}
                <Link href="/ja/methodology/" className="text-[var(--accent)] underline hover:opacity-75">
                  日本語の方法論
                </Link>
                にあります。
              </p>

              <h2>続きを読む</h2>
              <ul>
                <li>
                  英語の完全な分析ページ：{" "}
                  <Link
                    href={`/checks/${check.id}/`}
                    hrefLang="en"
                    className="text-[var(--accent)] underline hover:opacity-75"
                  >
                    /checks/{check.id}/
                  </Link>
                  （このルールがなぜあるのか、どう検証されているか、実例）。
                </li>
                <li>
                  <Link href="/ja/checks/" className="text-[var(--accent)] underline hover:opacity-75">
                    全 {RUNNABLE_CHECKS.length} 件のルール
                  </Link>{" "}
                  を {DIMENSION_CATALOG.length} 個のディメンション別にまとめた一覧です。
                </li>
                <li>
                  自分のサイトでこの項目の結果を見るには、
                  <Link href="/#scan" hrefLang="en" className="text-[var(--accent)] underline hover:opacity-75">
                    無料スキャン
                  </Link>
                  を実行してください。
                </li>
              </ul>

              {/* 日本語ページの戻り口。ルール単体のページから一覧とトップへ戻れるようにする。 */}
              <p className="mt-8 text-xs">
                <Link href="/ja/checks/" className="text-[var(--accent)] hover:opacity-75">
                  ← 全 {RUNNABLE_CHECKS.length} 件のルール一覧へ戻る
                </Link>
                {" · "}
                <Link href="/ja/" className="text-[var(--accent)] hover:opacity-75">
                  トップページ
                </Link>
              </p>
            </article>
          </div>
        </section>
      </main>

      <LocaleFooter locale="ja" dict={dict} target={homePath} />
    </div>
  );
}
