import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";
import {
  JA_CHECK_TITLES,
  JA_DIMENSION_LABELS,
  JA_DIMENSION_SUMMARIES,
} from "@/lib/i18n/ja-copy";
import { ZH_CHECK_TITLES, ZH_DIMENSION_LABELS, ZH_DIMENSION_SUMMARIES } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";

/**
 * `/<locale>/checks/` — the rule reference, in Chinese and in Japanese.
 *
 * なぜ 1 ファイルで 2 言語なのか。`app/(locales)/[locale]/checks/page.tsx` という 1 つのルートを
 * `/zh/checks/` と `/ja/checks/` が共有しているためで、日本語版を別ファイルにすると中国語版の
 * URL が 404 になる。locale で分岐する 1 ファイルに両方を置き、`zh` と `ja` 以外は
 * `dynamicParams = false` と notFound() で弾く。
 *
 * WHY AN OVERVIEW RATHER THAN A SECOND SET OF RULE PAGES: the layout, the grouping and the
 * point values are generated from the same catalogue the analyser runs on, so a translated
 * overview cannot quote a total, a weight or a check count the engine disagrees with. The
 * per-rule detail lives on `/ja/checks/<id>/` for the parts that are translated and on the
 * English page for the long analysis, and this page says which is which instead of letting
 * the reader find out one click later.
 */
export const dynamicParams = false;

/** 実行されるチェック。alias は同じチェックの別結果を記述したものなので数えない。 */
const RUNNABLE_CHECKS = CHECK_CATALOG.filter((check) => !check.alias);

export function generateStaticParams() {
  /* 中国語版は既存のまま残す。日本語版だけを返すと `/zh/checks/` が消える。 */
  return [{ locale: "zh" }, { locale: "ja" }];
}

const ZH_TITLE = "全部 40 条规则";
const ZH_DESCRIPTION =
  "扫描器执行的 40 条公开规则，按 12 个加权维度分组；每条规则的分值、含义与完整规则页链接。";

/** 件数はカタログから数える。翻訳が総数を書き写すと、エンジンと食い違う公開文になる。 */
const JA_TITLE = `全 ${RUNNABLE_CHECKS.length} 件のルール`;
const JA_DESCRIPTION = `スキャナが実行する ${RUNNABLE_CHECKS.length} 件の公開ルールを、${DIMENSION_CATALOG.length} の加重ディメンション別に整理しました。各ルールの配点、意味、詳細ページへのリンク。`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "ja") {
    return {
      title: JA_TITLE,
      description: JA_DESCRIPTION,
      alternates: {
        canonical: "/ja/checks/",
        /* 3 言語すべてを宣言する。x-default は英語（唯一の完全版）を指す。 */
        languages: {
          en: "/checks/",
          "zh-Hans": "/zh/checks/",
          ja: "/ja/checks/",
          "x-default": "/checks/",
        },
      },
      ...social({ title: JA_TITLE, description: JA_DESCRIPTION, url: "/ja/checks/" }),
    };
  }

  if (locale === "zh") {
    return {
      title: ZH_TITLE,
      description: ZH_DESCRIPTION,
      alternates: {
        canonical: "/zh/checks/",
        /* ja を足すのは、日本語版がこのページを zh-Hans として宣言しているためである。 */
        languages: {
          en: "/checks/",
          "zh-Hans": "/zh/checks/",
          ja: "/ja/checks/",
          "x-default": "/checks/",
        },
      },
      ...social({ title: ZH_TITLE, description: ZH_DESCRIPTION, url: "/zh/checks/" }),
    };
  }

  return {};
}

export default async function LocalizedChecksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale === "ja") return <JapaneseChecks />;
  if (locale === "zh") return <ChineseChecks />;
  notFound();
}

/** ディメンション id ごとにチェックをまとめる。両言語で同じ並びになるよう 1 か所で作る。 */
function groupByDimension() {
  const byDimension = new Map<string, typeof RUNNABLE_CHECKS>();
  for (const check of RUNNABLE_CHECKS) {
    const list = byDimension.get(check.dimension) ?? [];
    list.push(check);
    byDimension.set(check.dimension, list);
  }
  return byDimension;
}

function ChineseChecks() {
  const dict = getDictionary("zh");
  const byDimension = groupByDimension();

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="zh" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              规则参考 · Rule reference
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.2] tracking-[-0.02em] md:text-5xl">
              {ZH_TITLE}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              扫描器执行 <strong>{RUNNABLE_CHECKS.length} 条明确规则</strong>，分布在{" "}
              <strong>{DIMENSION_CATALOG.length} 个加权维度</strong>里。这里给出每一条规则的名字、归属维度和分值，
              让你先看清全貌；每条的完整规则（通过条件、证据、失败原因）在英文规则页上，下面逐条链接。
            </p>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              规则详情目前为英文 · 计分方式见{" "}
              <Link href="/zh/methodology/" className="text-[var(--accent)] hover:opacity-75">
                中文方法论
              </Link>
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-20">
            <div className="space-y-12">
              {DIMENSION_CATALOG.map((dimension) => {
                const list = byDimension.get(dimension.id) ?? [];
                if (list.length === 0) return null;
                const points = list.reduce((sum, check) => sum + check.points, 0);
                return (
                  <section key={dimension.id} id={dimension.id} className="scroll-mt-24">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
                      <h2 className="text-lg font-bold text-[var(--ink-1)]">
                        {ZH_DIMENSION_LABELS[dimension.id] ?? dimension.label}
                      </h2>
                      <span className="font-mono text-xs text-[var(--ink-3)]">
                        {dimension.weight}% · {list.length} 条规则 · {points} 分
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                      {ZH_DIMENSION_SUMMARIES[dimension.id] ?? dimension.rationale}
                    </p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {list.map((check) => (
                        <li key={check.id} className="flex items-baseline gap-2 text-sm">
                          <span className="w-10 shrink-0 font-mono text-[10px] text-[var(--ink-3)]">
                            {check.points} pt
                          </span>
                          <Link
                            href={`/zh/checks/${check.id}/`}
                            className="font-medium text-[var(--accent)] underline hover:opacity-75"
                          >
                            {ZH_CHECK_TITLES[check.id] ?? check.id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            <div className="mt-14 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-base font-semibold text-[var(--ink-1)]">这些规则是怎么打分的？</h2>
              <p className="mt-2">
                每条规则在所属维度内有固定分值，维度得分 = 已得点数 / 可评估点数，总分按 12 个维度加权合并。
                对某类页面不适用的规则会被移出计算，而不是记为失败；公式、两类“不适用”和变更记录都在{" "}
                <Link href="/zh/methodology/" className="text-[var(--accent)] hover:opacity-75">
                  中文方法论
                </Link>
                里。
              </p>
              <p className="mt-3">
                英文完整规则页在{" "}
                <Link href="/checks/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  /checks/
                </Link>
                ，免费扫描器在{" "}
                <Link href="/#scan" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  首页
                </Link>
                。
              </p>
            </div>
          </div>
        </section>
      </main>

      <LocaleFooter locale="zh" dict={dict} target={homePath} />
    </div>
  );
}

function JapaneseChecks() {
  const dict = getDictionary("ja");
  const byDimension = groupByDimension();

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-1)]">
      <LocaleHeader locale="ja" dict={dict} />

      <main>
        <section className="band band--alt border-b border-[var(--line)]">
          <div className="wrap py-14 md:py-20">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              ルール一覧 · Rule reference
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.2] tracking-[-0.02em] md:text-5xl">
              {JA_TITLE}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              スキャナは <strong>{RUNNABLE_CHECKS.length} 件の明示的なルール</strong>を、
              <strong>{DIMENSION_CATALOG.length} 個の加重ディメンション</strong>に分けて実行します。
              ここでは各ルールの名称、所属するディメンション、配点を示し、全体像を先に把握できるようにしています。
              各ルールの完全な説明（合格条件、根拠、失敗の理由）は英語のルールページにあり、
              以下から 1 件ずつリンクしています。
            </p>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              長い解説文は英語のままです · 採点方法は{" "}
              <Link href="/ja/methodology/" className="text-[var(--accent)] hover:opacity-75">
                日本語の方法論
              </Link>
              にあります
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap py-14 md:py-20">
            <div className="space-y-12">
              {DIMENSION_CATALOG.map((dimension) => {
                const list = byDimension.get(dimension.id) ?? [];
                if (list.length === 0) return null;
                const points = list.reduce((sum, check) => sum + check.points, 0);
                return (
                  <section key={dimension.id} id={dimension.id} className="scroll-mt-24">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
                      <h2 className="text-lg font-bold text-[var(--ink-1)]">
                        {JA_DIMENSION_LABELS[dimension.id] ?? dimension.label}
                      </h2>
                      <span className="font-mono text-xs text-[var(--ink-3)]">
                        {dimension.weight}% · {list.length} 件のルール · {points} 点
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
                      {JA_DIMENSION_SUMMARIES[dimension.id] ?? dimension.rationale}
                    </p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {list.map((check) => (
                        <li key={check.id} className="flex items-baseline gap-2 text-sm">
                          <span className="w-10 shrink-0 font-mono text-[10px] text-[var(--ink-3)]">
                            {check.points} pt
                          </span>
                          <Link
                            href={`/ja/checks/${check.id}/`}
                            className="font-medium text-[var(--accent)] underline hover:opacity-75"
                          >
                            {JA_CHECK_TITLES[check.id] ?? check.id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            <div className="mt-14 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm leading-relaxed text-[var(--ink-2)]">
              <h2 className="text-base font-semibold text-[var(--ink-1)]">
                これらのルールはどう採点されますか。
              </h2>
              <p className="mt-2">
                各ルールは所属するディメンションの中で固定の配点を持ち、ディメンションのスコアは
                「獲得した点数 ÷ 評価できる点数」、合計は {DIMENSION_CATALOG.length} 個のディメンションを
                重みで統合したものです。ページ種別に当てはまらないルールは、失敗として数えず計算から外します。
                計算式、「当てはまらない」の 2 種類、変更履歴は{" "}
                <Link href="/ja/methodology/" className="text-[var(--accent)] hover:opacity-75">
                  日本語の方法論
                </Link>
                にあります。
              </p>
              <p className="mt-3">
                英語の完全なルールページは{" "}
                <Link href="/checks/" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  /checks/
                </Link>
                、無料のスキャナは{" "}
                <Link href="/#scan" hrefLang="en" className="text-[var(--accent)] hover:opacity-75">
                  トップページ
                </Link>
                にあります。
              </p>
            </div>

            {/* 日本語ページの戻り口。一覧の終わりからトップと方法論へ戻れるようにする。 */}
            <p className="mt-8 text-xs">
              <Link href="/ja/" className="text-[var(--accent)] hover:opacity-75">
                ← トップページへ戻る
              </Link>
            </p>
          </div>
        </section>
      </main>

      <LocaleFooter locale="ja" dict={dict} target={homePath} />
    </div>
  );
}
