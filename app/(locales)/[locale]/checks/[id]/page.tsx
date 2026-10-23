import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";
import { ZH_CHECK_RULES } from "@/lib/i18n/zh-check-rules";
import { ZH_CHECK_TITLES, ZH_DIMENSION_LABELS } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";

/**
 * `/zh/checks/<id>/` - one rule page, in Chinese.
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

export function generateStaticParams() {
  return CHECK_CATALOG.filter((check) => !check.alias).map((check) => ({
    locale: "zh",
    id: check.id,
  }));
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
  if (locale !== "zh") return {};
  const check = findCheck(id);
  const copy = ZH_CHECK_RULES[id];
  if (!check || !copy) return {};

  const title = `${ZH_CHECK_TITLES[id] ?? check.id}：规则说明`;
  const description = copy.rule.length > 150 ? `${copy.rule.slice(0, 147)}…` : copy.rule;

  return {
    title,
    description,
    alternates: {
      canonical: `/zh/checks/${check.id}/`,
      languages: {
        en: `/checks/${check.id}/`,
        "zh-Hans": `/zh/checks/${check.id}/`,
        "x-default": `/checks/${check.id}/`,
      },
    },
    ...social({ title, description, url: `/zh/checks/${check.id}/`, type: "article" }),
  };
}

export default async function ChineseRulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (locale !== "zh") notFound();
  const check = findCheck(id);
  const copy = ZH_CHECK_RULES[id];
  if (!check || !copy) notFound();

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
