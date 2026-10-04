import type { Metadata } from "next";
import Link from "next/link";
import { CHECK_CATALOG, DIMENSION_CATALOG } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import ProsePage from "@/app/components/ProsePage";
import Faq from "@/app/components/Faq";
import { og } from "@/lib/og";

/**
 * /checks/ - the index of every published rule.
 *
 * This is the hub the per-check pages need and the one the report links into. It is
 * generated from lib/geo/catalog.ts rather than written out, so the list cannot go
 * stale when a check is added: the same file drives the methodology page and the
 * analyser, and the tests assert the three agree.
 *
 * The rule text is truncated to its first sentence here on purpose. A reader
 * scanning 40 rules wants to recognise the one they need, not read all of them; the
 * full wording, with the weight reasoning and the fix, is one page away.
 */
const TITLE = "Every GEO check the scanner runs";
const DESCRIPTION =
  "All 40 checks the scanner runs, grouped by the twelve weighted dimensions, each with its exact rule, its point value and a page explaining how to fix it.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/checks/" },
  openGraph: og({ title: TITLE, description: DESCRIPTION, url: "/checks/" }),
};

/** The first sentence, which is enough to recognise a rule by. */
function firstSentence(text: string): string {
  /*
   * [\s\S] rather than `.` with the dotAll flag: the project's TypeScript target is
   * below es2018, so the `s` flag is a compile error rather than a runtime detail.
   * The build caught it; the intent is identical.
   */
  const match = text.match(/^[\s\S]*?\.(?=\s|$)/);
  const sentence = (match ? match[0] : text).trim();
  return sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence;
}

export default function ChecksIndexPage() {
  const runnable = CHECK_CATALOG.filter((check) => !check.alias);
  const byDimension = new Map<string, typeof runnable>();
  for (const check of runnable) {
    const list = byDimension.get(check.dimension) ?? [];
    list.push(check);
    byDimension.set(check.dimension, list);
  }

  return (
    <ProsePage
      title={TITLE}
      description={
        <>
          <p>
            The scanner runs <strong>{runnable.length} explicit checks</strong> across{" "}
            <strong>{DIMENSION_CATALOG.length} weighted dimensions</strong>. Every one of them is
            listed here with the exact rule it applies, so a score can be argued with rather than
            taken on trust. Nothing on these pages is a summary of the method — it is the method.
          </p>
          <p>
            A check is worth points inside its dimension, and each dimension carries a share of the
            total. A dimension is not a checklist of equal items: the weights are published below
            and the reasoning for each one is on its page.
          </p>
        </>
      }
      action={{ href: "/methodology/", label: "The full method →" }}
    >
        <div className="overflow-x-auto mb-14">
          <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
            <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Dimension</th>
                <th className="text-left px-4 py-2.5 font-semibold">Weight</th>
                <th className="text-left px-4 py-2.5 font-semibold">Checks</th>
                <th className="text-left px-4 py-2.5 font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSION_CATALOG.map((dimension) => {
                const list = byDimension.get(dimension.id) ?? [];
                const points = list.reduce((sum, c) => sum + c.points, 0);
                return (
                  <tr key={dimension.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-2.5 align-top">
                      <a href={`#${dimension.id}`} className="text-[var(--accent)] hover:opacity-75">
                        {dimension.label}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono">{dimension.weight}%</td>
                    <td className="px-4 py-2.5 align-top font-mono">{list.length}</td>
                    <td className="px-4 py-2.5 align-top font-mono">{points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-12">
          {DIMENSION_CATALOG.map((dimension) => {
            const list = byDimension.get(dimension.id) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={dimension.id} id={dimension.id} className="scroll-mt-24">
                <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2 mb-4">
                  <h2 className="text-lg font-bold text-[var(--ink-1)]">{dimension.label}</h2>
                  <span className="font-mono text-xs text-[var(--ink-3)]">{dimension.weight}% of total</span>
                </div>
                <p className="text-xs text-[var(--ink-3)] leading-relaxed mb-4">{dimension.rationale}</p>
                <ul className="list-none pl-0 space-y-4">
                  {list.map((check) => (
                    <li key={check.id} className="text-sm leading-relaxed">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-[var(--ink-3)] shrink-0 w-12">
                          {check.points} pt
                        </span>
                        <Link
                          href={`/checks/${check.id}/`}
                          className="text-[var(--accent)] hover:opacity-75 font-medium underline"
                        >
                          {CHECK_COPY[check.id]?.title ?? check.id}
                        </Link>
                      </div>
                      <p className="text-[var(--ink-2)] pl-14 pt-0.5">{firstSentence(check.rule)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
          <Faq
            title="Questions about the checks"
            items={[
              {
                q: "Can I see the rule without running a scan?",
                a: "Yes, and that is the point of this section. Every rule, its point value and the exact condition that makes it pass are published, so you can read the method before deciding whether the score is worth anything.",
              },
              {
                q: "Are all checks applied to every page?",
                a: "No. A small number are marked not applicable to particular kinds of page, such as a policy or contact page, and are removed from the calculation rather than counted as failures. Each exclusion is listed on the page for the check it applies to.",
              },
              {
                q: "What happens when a check cannot be evaluated?",
                a: "It says so rather than guessing. A refusal aimed at our scanner is reported as unverified, not as a failure of your site, because those are different findings and only one of them is yours to fix.",
              },
            ]}
          />

          <div>
            <p>
              <Link href="/" className="text-[var(--accent)] hover:opacity-75 underline">
                Run a free GEO audit on your own site →
              </Link>
            </p>
            <p className="mt-3 text-[var(--ink-2)]">
              The dimension weights, the A–F bands and the parts of the picture a single-URL scan
              cannot see are all on the{" "}
              <Link href="/methodology/" className="text-[var(--accent)] hover:opacity-75 underline">
                methodology page
              </Link>
              .
            </p>
          </div>
        </div>
    </ProsePage>
  );
}
