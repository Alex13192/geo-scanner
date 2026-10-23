import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleFooter, LocaleHeader } from "@/app/components/LocalizedChrome";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homePath } from "@/lib/i18n/config";
import { ZH_CHECK_TITLES, ZH_DIMENSION_LABELS, ZH_DIMENSION_SUMMARIES } from "@/lib/i18n/zh-copy";
import { social } from "@/lib/og";

/**
 * `/zh/checks/` - the rule reference, in Chinese.
 *
 * WHY AN OVERVIEW RATHER THAN 40 TRANSLATED RULE PAGES: the full rule text is generated from
 * the analyser and runs to a few hundred words per rule; translating it is a later pass. What a
 * Chinese reader cannot currently get anywhere is the *shape* of the method: which 40 rules
 * exist, which dimension each belongs to, and what each one is trying to establish. This page
 * gives that, links each title to the published English rule, and says plainly that the detail
 * is English rather than pretending otherwise.
 *
 * Points and weights come from the catalogue, so this page cannot drift from the engine.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

const TITLE = "全部 40 条规则";
const DESCRIPTION =
  "扫描器执行的 40 条公开规则，按 12 个加权维度分组；每条规则的分值、含义与完整规则页链接。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/checks/",
    languages: {
      en: "/checks/",
      "zh-Hans": "/zh/checks/",
      "x-default": "/checks/",
    },
  },
  ...social({ title: TITLE, description: DESCRIPTION, url: "/zh/checks/" }),
};

export default async function ChineseChecksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh") notFound();

  const dict = getDictionary("zh");
  const runnable = CHECK_CATALOG.filter((check) => !check.alias);
  const byDimension = new Map<string, typeof runnable>();
  for (const check of runnable) {
    const list = byDimension.get(check.dimension) ?? [];
    list.push(check);
    byDimension.set(check.dimension, list);
  }

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
              {TITLE}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              扫描器执行 <strong>{runnable.length} 条明确规则</strong>，分布在{" "}
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
                            href={`/checks/${check.id}/`}
                            hrefLang="en"
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
