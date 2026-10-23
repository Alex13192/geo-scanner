import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import AuthorLine from "@/app/components/AuthorLine";
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

import { social } from "@/lib/og";

const TITLE = "Methodology — how the GEO score is calculated";
const DESCRIPTION =
  "The complete scoring method: twelve weighted dimensions, every check with its exact rule and point value, the A-F bands, and what the score cannot tell you.";

/**
 * What changed in the rule set, newest first.
 *
 * WHY THIS LIST IS ON THIS PAGE: /study/ publishes scores produced by an older version of
 * these rules, and a reader comparing that table against a scan run today is entitled to
 * know why a number moved. A method that changes and does not say so makes every published
 * score unverifiable after the fact, which is the failure this whole page is built against.
 *
 * The byline's date is read from the first entry rather than typed a second time, so the
 * page cannot claim a revision that no entry lists. The 2026-10-23 date is recorded beside
 * the hreflang rule in lib/geo/analyze.ts and lib/geo/catalog.ts; the 2026-10-03 entry is
 * the change that introduced page-type exemptions and the renormalisation that goes with
 * them. Editorial rewording does not appear here - only changes that can move a score.
 */
const METHOD_CHANGELOG = [
  {
    date: "2026-10-23",
    change:
      "hreflang is no longer scored when a page declares fewer than two language codes. It asks a page to declare alternate language versions, which a single-language site has none of, so the old rule cost such sites 2 points for a question that does not apply. The scanner fetches one page and cannot tell a single-language site from one that has not declared its translations, so absence is now marked not applicable and excluded from the score. A page that declares exactly one code still fails.",
  },
  {
    date: "2026-10-03",
    change:
      "A check can be marked not applicable to a page type it cannot judge, and is then excluded from the score rather than failed. Six exemptions were published for legal, contact and article pages - a privacy policy is not a worse page for quoting nobody - and the remaining dimensions are renormalised, so a root path scored exactly what it scored before.",
  },
] as const;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/methodology/" },
  ...social({
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
    <ProsePage
      eyebrow="Methodology"
      title="How the GEO score is calculated"
      description={
        <p>
          Every rule on this page is the rule the scanner actually executes. The list below is
          generated from the same data the analyser runs on, so the published method and the
          live method cannot drift apart.
        </p>
      }
      action={{ href: "/", label: "← Back to Scanner" }}
    >
        {/*
          The byline sits under the intro rather than in the header band: the header says what
          the page is, and this says who is accountable for the method and which revision of
          it is being published. The date is read from the top of the changelog below, so the
          byline cannot claim a revision that no entry lists.
        */}
        <div className="mb-10">
          <AuthorLine date={METHOD_CHANGELOG[0].date} label="Method last revised" />
        </div>

        <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
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
          <p>
            There are two ways a check can reach that state, and the difference is worth knowing
            when you read a score. <strong>Page-type exclusions</strong> are declared against the
            check they apply to in the table the analyser executes and this page renders below: a
            privacy policy is not asked for expert quotations or statistics because it is a
            policy, and an article body is not asked for the site&rsquo;s About and Contact links
            because a single-page fetch never sees the chrome around it.{" "}
            <strong>Rule-level inapplicability</strong> is decided by the rule itself from what it
            found on the page rather than from the kind of page it is: hreflang asks a page to
            declare alternate language versions, a page that declares none cannot be judged on
            that question, and one fetched page cannot tell a single-language site from a site
            that has translations it has not declared. Neither kind is a failure and neither is a
            discount. In both, the points leave the numerator and the denominator, the remaining
            weights are renormalised, and the total stays a percentage of the checks that could
            actually be assessed — which is why a perfect score means &ldquo;nothing that applies
            to this page failed&rdquo;, never &ldquo;every rule in the catalogue passed&rdquo;.
          </p>

          {/*
            The changelog is the other half of the not-applicable explanation: the exclusions
            and the rules change, and a reader comparing this page with an old scan is owed
            the record of when. It is placed here rather than at the foot of the page because
            the reader who needs it is the one currently working out how the score was
            calculated, not the one scrolling to the sources.
          */}
          <h2 id="what-changed" className="scroll-mt-28">What changed, and when</h2>
          <p>
            A method that never changes is not being maintained, and one that changes without
            saying so cannot be checked after the fact. Every change that could move a score is
            recorded here with its date and its reason, because a score is only comparable to
            another score produced under the same rules:
          </p>
          <ul>
            {METHOD_CHANGELOG.map((entry) => (
              <li key={entry.date}>
                <time dateTime={entry.date} className="font-mono text-[var(--ink-3)]">
                  {entry.date}
                </time>{" "}
                — {entry.change}
              </li>
            ))}
          </ul>
          <p>
            The list is short on purpose and it is the record of the method rather than of this
            site: copy edits and new worked examples do not appear. The one entry a reader of{" "}
            <Link href="/study/">the study</Link> has to know about is the first — that table was
            measured before it, which is why the study page states both dates and leaves the rows
            as measured instead of re-scoring them under the current rules.
          </p>

          <h2>What do the grades mean?</h2>
          <div className="not-prose overflow-x-auto my-5">
            <table className="w-full text-xs border border-[var(--line)] rounded-xl overflow-hidden">
              <thead className="bg-[var(--surface-2)] text-[var(--ink-2)]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Grade</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Score</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Reading</th>
                </tr>
              </thead>
              <tbody className="text-[var(--ink-2)]">
                {GRADE_BANDS.map((band, i) => (
                  <tr key={band.grade} className="border-t border-[var(--line)]">
                    <td className="px-4 py-2.5 font-mono font-bold text-[var(--ink-1)]">{band.grade}</td>
                    <td className="px-4 py-2.5 font-mono text-[var(--ink-2)]">
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
              {/*
                This read "Only the homepage is analysed" until a site scope existed. The
                free scan still reads one page, and a single-URL scan still cannot see
                interior pages - so the sentence was not wrong, it was incomplete, and
                incomplete in the direction of claiming more than the method delivers once
                the second unit exists. It is now stated as the default it is.

                The query parameter is deliberately NOT published here. Site scope is a paid
                capability, and naming it on this page would turn the free endpoint into a
                ten-page scraper for anyone who reads the docs - which is a cost decision for
                the operator, not a wording decision for this comment. What is published is
                the limit, because a reader is owed that either way.
              */}
              <strong>The score describes one page unless a site scan is asked for.</strong> A
              single-URL scan cannot see site-wide problems on interior pages. A site scan reads a
              few more pages the sitemap names &mdash; capped at five by default and ten at most
              &mdash; scores each of them with exactly these rules, and reports every
              page&rsquo;s score separately, so a homepage number is never passed off as a site
              number.
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
                /*
                 * The id is what makes a dimension addressable, and the homepage's twelve cards
                 * now link here. Without it those cards had nowhere specific to land and pointed
                 * at the top of this page - which is worse than not being clickable, because it
                 * looks like it worked.
                 *
                 * scroll-mt-28 is not decoration. The header is sticky and 105px tall (a 40px
                 * announcement strip over a 64px bar), so an anchor without a scroll margin puts
                 * the heading underneath it and the reader arrives at a section whose title they
                 * cannot see. 7rem clears it at every breakpoint the site serves.
                 */
                id={dim.id}
                className="scroll-mt-28 bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6"
              >
                <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-[var(--line)]">
                  <h3 className="text-base font-bold text-[var(--ink-1)]">
                    <span className="text-[var(--ink-3)] font-mono text-xs pr-2">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {dim.label}
                  </h3>
                  <span className="text-xs font-mono text-[var(--accent)] shrink-0">{dim.weight}%</span>
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed pt-3">{dim.rationale}</p>
                <p className="text-xs text-[var(--ink-3)] leading-relaxed pt-2">
                  <span className="text-[var(--ink-2)] font-medium">Why this weight: </span>
                  {dim.weighting}
                </p>

                <ul className="list-none pl-0 pt-4 space-y-3">
                  {checks.map((check) => (
                    <li key={check.id} className="text-xs leading-relaxed">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-[var(--ink-3)] shrink-0">
                          {check.points} pt
                        </span>
                        <span className="text-[var(--ink-2)]">{check.rule}</span>
                      </div>
                      {check.onFail && (
                        <div className="text-[var(--ink-3)] pl-10 pt-0.5">
                          Not satisfied: {check.onFail}
                        </div>
                      )}
                      {NA_BY_PAGE_TYPE[check.id] && (
                        <div className="text-[var(--ink-3)] pl-10 pt-0.5">
                          Not applicable to{" "}
                          <span className="text-[var(--ink-2)]">
                            {NA_BY_PAGE_TYPE[check.id].join(", ")}
                          </span>{" "}
                          pages. Excluded from the score rather than counted as a failure.
                        </div>
                      )}
                      {check.note && (
                        <div className="text-[var(--ink-3)] pl-10 pt-0.5 border-l border-[var(--line)] ml-10 pl-3">
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

        <article className="doc-article text-sm text-[var(--ink-2)] leading-relaxed pt-14">
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

        <div className="mt-16 pt-8 border-t border-[var(--line)]">
          <Link href="/" className="text-xs text-[var(--accent)] hover:opacity-75">
            Run a free GEO audit on your own site →
          </Link>
        </div>
        <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
          <Faq
            title="Questions about the method"
            items={[
            { q: "Is the total an average of the twelve dimensions?", a: "No. Each dimension is scored as the fraction of its own points that were earned, and the twelve are then combined by weight. A dimension worth 16% moves the total three times as much as one worth 5%." },
            { q: "Why is a context file weighted so low?", a: "Because nothing we can measure shows it moving a ranking, and the arithmetic is small: the check is worth 4 of that dimension's 6 points, and the dimension carries 5%, so the file is capped at 3.3 of the 100. It is scored because the convention is cheap to follow." },
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

    </ProsePage>
  );
}
