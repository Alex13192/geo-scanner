import type { Metadata } from "next";
import Link from "next/link";
import PageFooter from "@/app/components/PageFooter";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import {
  DIMENSION_CATALOG,
  CHECK_CATALOG,
  GRADE_BANDS,
  REFERENCES,
} from "@/lib/geo/catalog";
// Imported from the analyser rather than duplicated here, so the exclusions this
// page publishes are the same object the scoring code applies. Editing one and not
// the other is the drift the catalogue-driven method exists to prevent.
import { NA_BY_PAGE_TYPE } from "@/lib/geo/analyze";

import { og } from "@/lib/og";

const TITLE = "Methodology — how the GEO score is calculated";
const DESCRIPTION =
  "The complete scoring method: twelve weighted dimensions, every check with its exact rule and point value, the A-F bands, and what the score cannot tell you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/methodology/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/methodology/",
  }),
};

export default function MethodologyPage() {
  const byDimension = new Map<string, typeof CHECK_CATALOG>();
  for (const check of CHECK_CATALOG) {
    const list = byDimension.get(check.dimension) ?? [];
    list.push(check);
    byDimension.set(check.dimension, list);
  }

  // Alias entries document the other outcome of the same check and never run
  // alongside their counterpart, so they are excluded from the per-scan count.
  const totalChecks = CHECK_CATALOG.filter((c) => !c.alias).length;
  const totalWeight = DIMENSION_CATALOG.reduce((sum, d) => sum + d.weight, 0);

  return (
    <div className="min-h-screen bg-[#070A10] text-white selection:bg-blue-500 selection:text-white font-sans pb-20">
      <header className="border-b border-gray-800/80 bg-[#070A10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">LLMention</span>
          </Link>
          <Link
            href="/"
            className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium px-4 py-2 rounded-xl transition-all"
          >
            ← Back to Scanner
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-3 mb-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Methodology
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            How the GEO score is calculated
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Every rule on this page is the rule the scanner actually executes. The list below is
            generated from the same data the analyser runs on, so the published method and the
            live method cannot drift apart.
          </p>
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed">
          <h2>How is the total score calculated?</h2>
          <p>
            The scanner runs <strong>{totalChecks} explicit checks</strong> across{" "}
            <strong>twelve dimensions</strong>. Each check is worth a fixed number of points
            inside its dimension. A dimension&rsquo;s score is the fraction of its available
            points that were earned, and the total is those twelve scores combined by weight:
          </p>
          <pre>{`total = Σ ( dimension_score × dimension_weight / 100 )

where dimension_score = earned_points / available_points × 100
and   Σ dimension_weight = ${totalWeight}`}</pre>
          <p>
            There are <strong>no score floors</strong>. A page that satisfies none of the checks
            scores near zero rather than being lifted to a respectable-looking minimum. Points
            are relative weights within a dimension: where two entries below describe the two
            outcomes of a single check, only one of them applies to any given scan.
          </p>
          <p>
            There is one thing that is <em>not</em> a floor and is worth separating from one: a
            small number of checks are marked <strong>not applicable</strong> to a particular kind
            of page, and are removed from the calculation entirely rather than counted as a
            failure. A policy page is not a worse page for containing no expert quotations; the
            question does not apply. When a check is excluded, its points leave both sides of the
            fraction and the remaining dimensions are renormalised against their own sum, so the
            total stays a percentage of what could actually be assessed. Every exclusion is listed
            against the check it applies to below, and the tests assert that each one names a real
            check and that no exclusion applies to a homepage — which is what makes this change
            score-neutral for every scan the tool performed before page types existed.
          </p>

          <h2>What do the grades mean?</h2>
          <div className="not-prose overflow-x-auto my-5">
            <table className="w-full text-xs border border-gray-800/80 rounded-xl overflow-hidden">
              <thead className="bg-gray-900/60 text-gray-400">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Grade</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Score</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Reading</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {GRADE_BANDS.map((band, i) => (
                  <tr key={band.grade} className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 font-mono font-bold text-white">{band.grade}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-400">
                      {band.min}
                      {i === 0 ? "-100" : `-${GRADE_BANDS[i - 1].min - 1}`}
                    </td>
                    <td className="px-4 py-2.5">{band.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>What the scanner cannot tell you</h2>
          <p>
            A score is only useful if its limits are stated. These are the ones that matter:
          </p>
          <ul>
            <li>
              <strong>It does not ask any AI engine about you.</strong> Nothing here measures
              whether ChatGPT currently recommends your brand. It measures whether your pages are
              in a state that makes being cited possible. Those are different questions, and
              conflating them is the most common overclaim in this category.
            </li>
            <li>
              <strong>A refused request is not proof of a block.</strong> Large sites verify
              crawlers by IP address rather than user-agent, so a scanner&rsquo;s request can be
              refused even when real GPTBot traffic is served normally. Whether a site blocks AI
              crawlers is answered here by <code>robots.txt</code>, which is the site&rsquo;s
              stated intent, not by guessing from one response code.
            </li>
            <li>
              <strong>Only the homepage is analysed.</strong> Site-wide problems on interior
              pages are invisible to a single-URL scan.
            </li>
            <li>
              <strong>Performance checks are coarse.</strong> Real Core Web Vitals need a
              browser; this scanner deliberately does not run one. That is why the Delivery
              dimension carries the lowest weight.
            </li>
            <li>
              <strong>Weights are a judgement, not a measurement.</strong> The dimension weights
              reflect published research and the fact that unreadable pages cannot be cited. They
              are stated in full so you can disagree with them specifically rather than vaguely.
            </li>
          </ul>

          <h2>The twelve dimensions</h2>
        </article>

        {/* Dimension detail: weights and rationales come from the same catalog. */}
        <div className="space-y-8 pt-4">
          {DIMENSION_CATALOG.map((dim, index) => {
            const checks = byDimension.get(dim.id) ?? [];
            return (
              <section
                key={dim.id}
                className="bg-gray-950/40 border border-gray-800/80 rounded-2xl p-6"
              >
                <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-gray-800/60">
                  <h3 className="text-base font-bold text-white">
                    <span className="text-gray-600 font-mono text-xs pr-2">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {dim.label}
                  </h3>
                  <span className="text-xs font-mono text-blue-400 shrink-0">{dim.weight}%</span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed pt-3">{dim.rationale}</p>
                <p className="text-xs text-gray-500 leading-relaxed pt-2">
                  <span className="text-gray-400 font-medium">Why this weight: </span>
                  {dim.weighting}
                </p>

                <ul className="list-none pl-0 pt-4 space-y-3">
                  {checks.map((check) => (
                    <li key={check.id} className="text-xs leading-relaxed">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-gray-500 shrink-0">
                          {check.points} pt
                        </span>
                        <span className="text-gray-300">{check.rule}</span>
                      </div>
                      {check.onFail && (
                        <div className="text-gray-500 pl-10 pt-0.5">
                          Not satisfied: {check.onFail}
                        </div>
                      )}
                      {NA_BY_PAGE_TYPE[check.id] && (
                        <div className="text-gray-500 pl-10 pt-0.5">
                          Not applicable to{" "}
                          <span className="text-gray-400">
                            {NA_BY_PAGE_TYPE[check.id].join(", ")}
                          </span>{" "}
                          pages. Excluded from the score rather than counted as a failure.
                        </div>
                      )}
                      {check.note && (
                        <div className="text-gray-500 pl-10 pt-0.5 border-l border-gray-800 ml-10 pl-3">
                          Note: {check.note}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <article className="doc-article text-sm text-gray-300 leading-relaxed pt-14">
          <h2>Primary sources</h2>
          <p>
            Where this method makes a judgement about what generative engines favour, it follows
            published research rather than folklore. Read the sources directly:
          </p>
          <ul>
            {REFERENCES.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer">
                  {ref.title}
                </a>{" "}
                — {ref.note}
              </li>
            ))}
          </ul>
          <p>
            This site holds itself to the same standard it measures: it publishes{" "}
            <a href="/llms.txt">its own llms.txt</a>, declares a single Organization entity in
            JSON-LD, and labels its own dates. You can verify all of it by{" "}
            <Link href="/">scanning this domain</Link>.
          </p>
        </article>

        <div className="mt-16 pt-8 border-t border-gray-800/60">
          <Link href="/" className="text-xs text-blue-400 hover:text-blue-300">
            Run a free GEO audit on your own site →
          </Link>
        </div>
        <div className="mt-16 space-y-10 text-sm leading-relaxed text-gray-300">
          <Faq
            title="Questions about the method"
            items={[
            { q: "Is the total an average of the twelve dimensions?", a: "No. Each dimension is scored as the fraction of its own points that were earned, and the twelve are then combined by weight. A dimension worth 16% moves the total three times as much as one worth 5%." },
            { q: "Why is a context file weighted so low?", a: "Because the published evidence for it is weak. Google has said it does not use llms.txt in Search, so it is worth 5 of the 100 points rather than being advertised as a ranking factor." },
            { q: "Can I reproduce a score?", a: "Yes. A scan is a single GET against the public API, and the same inputs produce the same score. The study over 30 homepages names the exact endpoint it used." },
            ]}
          />
          <Evidence
            quote={GEO_PRIMARY_QUOTE}
            attribution="Generative Engine Optimization, KDD 2024"
            attributionUrl="https://arxiv.org/abs/2311.09735"
            sources={GEO_PRIMARY_SOURCES}
            note="The weightings on this site follow that measurement rather than taste, and the parts of the picture a single-URL scan cannot see are stated rather than left out."
          />
        </div>

      </main>

      <PageFooter width="3xl" />
    </div>
  );
}
