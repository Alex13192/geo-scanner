import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/app/components/ProsePage";
import AuthorLine from "@/app/components/AuthorLine";
import Evidence, { GEO_PRIMARY_QUOTE, GEO_PRIMARY_SOURCES } from "@/app/components/Evidence";
import Faq from "@/app/components/Faq";
import { CHECK_CATALOG, DIMENSION_CATALOG, GRADE_BANDS } from "@/lib/geo/catalog";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { SELF_AUDIT } from "@/lib/home-content";
import { formatDate } from "@/lib/insights";
import { social } from "@/lib/og";
import { BRAND, SITE_HOST, SITE_URL } from "@/lib/site";

/**
 * THE SITE'S OWN MEASUREMENT, AS AN INDEXABLE PAGE.
 *
 * WHY THIS PAGE EXISTS AT ALL: the homepage already presents its own score as evidence, but it
 * points at `/report/?domain=...` for the detail - and that route is deliberately noindex and
 * disallowed in robots.txt, because it is generated per request from a query parameter. A
 * crawler that is disallowed never fetches the URL, so it never reads the noindex tag either,
 * and an AI engine therefore cannot see the evidence the homepage is counting on. The fix is
 * not to make a user-specific tool output indexable; it is to publish the measurement itself
 * once, at a stable URL, with the date, the result, the exclusions and the method attached.
 *
 * AUTHORITY FOR EVERY NUMBER ON THIS PAGE: lib/self-audit.json, through lib/home-content.ts.
 * Nothing here is a hand-typed figure. `measuredAt`, the score, the grade, the check counts,
 * the not-applicable list and the failure list are all read from that record, and every other
 * number - the points on a check, dimension weights, the grade band, the catalogue size - is
 * imported from lib/geo. The one thing the record cannot supply is a sentence explaining an
 * exclusion, and that is written below beside the rule it explains rather than left as a bare
 * id. `scripts/check-built-pages.mts` gates this page like every other indexable route, so the
 * page is scored by the analyser it is describing.
 *
 * THIS PAGE DOES NOT REPRODUCE /report/. The report is the live tool: it shows the evidence
 * behind every check for whatever domain was asked for, at the moment it was asked. This page
 * publishes the record of one measurement of this site, which is what an engine can cite.
 */

/** The denominator the score is published against. It is the sum of the weights, not a literal. */
const SCALE = DIMENSION_CATALOG.reduce((sum, dimension) => sum + dimension.weight, 0);

/**
 * The measurement date in the form the site prints dates, from lib/insights.ts.
 *
 * The record stores an ISO date; the visible sentence and the <time> element need two different
 * things from it, and both come from this one value so a date cannot be printed one way in the
 * prose and another way in the table.
 */
const MEASURED_ON = formatDate(SELF_AUDIT.measuredAt);

/** Applicable checks that passed, as the percentage the analyser's own statistics rule reads. */
const PASS_SHARE =
  SELF_AUDIT.applicable > 0
    ? Math.round((SELF_AUDIT.passed / SELF_AUDIT.applicable) * 100)
    : 0;

/**
 * The single heaviest dimension, quoted in the section that explains the weighting.
 *
 * Read from the catalogue rather than typed so a re-weighting cannot leave this sentence
 * claiming a share the method no longer assigns.
 */
const AI_ACCESS_WEIGHT =
  DIMENSION_CATALOG.find((dimension) => dimension.id === "ai-crawler-access")?.weight ?? 0;

/** The band this record landed in, for the label next to the grade. */
const GRADE_BAND = GRADE_BANDS.find((band) => band.grade === SELF_AUDIT.grade);

/**
 * The title carries the measured score, so it is assembled rather than typed.
 *
 * WHY THERE IS A GUARD AROUND IT: the score, the date and the counts are re-measured weekly, so
 * a title or description that reads correctly today could drift out of the 15-65 / 50-160 ranges
 * the site itself publishes - and this page is scanned by the analyser that checks those ranges.
 * A measured value quietly producing a partially-passing page on a site about measurement is the
 * exact failure this repository would rather fail the build over. The suffix is the one
 * app/(en)/layout.tsx appends, built here from BRAND so the count is the rendered length rather
 * than the raw one.
 */
const TITLE = `Self-audit — this site scores ${SELF_AUDIT.score} on its own scanner`;
const DESCRIPTION = `Measured on ${MEASURED_ON}: ${SELF_AUDIT.score}/${SCALE}, grade ${SELF_AUDIT.grade}, ${SELF_AUDIT.passed} of ${SELF_AUDIT.applicable} applicable checks passing. The record, the method and what the number cannot see.`;
const RENDERED_TITLE = `${TITLE} | ${BRAND}`;

if (RENDERED_TITLE.length > 65 || TITLE.length < 15) {
  throw new Error(
    `The self-audit title is ${RENDERED_TITLE.length} characters with the site suffix ` +
      `("${RENDERED_TITLE}"). The published range is 15-65, and lib/self-audit.json has moved ` +
      "since this title was written. Shorten the sentence rather than the recorded number.",
  );
}
if (DESCRIPTION.length < 50 || DESCRIPTION.length > 160) {
  throw new Error(
    `The self-audit description is ${DESCRIPTION.length} characters. The published range is ` +
      "50-160, and it was assembled from lib/self-audit.json. Shorten the sentence rather than " +
      "the recorded number.",
  );
}

/**
 * WHY AN EXCLUSION NEEDS A SENTENCE AND NOT JUST AN ID.
 *
 * The record stores check ids, because that is what the analyser emits and what the gate compares.
 * A reader cannot act on "hreflang" without being told what the rule asked and why this page was
 * never asked it. The map below is the one hand-written piece of content on this page, and it is
 * written where it is used rather than in lib/self-audit.json deliberately: the record is a
 * measurement, and a sentence about a rule belongs with the rule's published text.
 *
 * The fallback keeps the page honest if a future measurement excludes a check this map does not
 * name - the id is still printed, linked to its rule page, and the generic sentence says what
 * exclusion means. Adding a rule id here without adding a sentence is therefore a blank, not a
 * wrong claim.
 */
const NOT_APPLICABLE_WHY: Record<string, string> = {
  hreflang:
    "The rule asks a page to declare at least two language versions. This site serves one language, so there is nothing to declare — and one fetched page cannot distinguish a single-language site from a multilingual one that has translations it has not declared. Absence is a question the page was never asked, so it is excluded rather than failed. A page that declares exactly one language code still fails it.",
};
const NOT_APPLICABLE_FALLBACK =
  "The rule cannot judge this page, so it is excluded from the score rather than counted as a failure. What the rule asks is stated on its own page.";

/**
 * The exclusions and the failures, resolved against the catalogue and the generated copy.
 *
 * Titles come from CHECK_COPY (generated from the analyser, so the wording cannot drift) and the
 * points and dimension from CHECK_CATALOG. Those are what turn an id from the record into
 * something a reader can follow.
 */
const NOT_APPLICABLE = SELF_AUDIT.notApplicable.map((id) => {
  const check = CHECK_CATALOG.find((entry) => entry.id === id);
  const dimension = check
    ? DIMENSION_CATALOG.find((entry) => entry.id === check.dimension)
    : undefined;
  return {
    id,
    title: CHECK_COPY[id]?.title ?? id,
    why: NOT_APPLICABLE_WHY[id] ?? NOT_APPLICABLE_FALLBACK,
    check,
    dimension,
  };
});

const FAILED = SELF_AUDIT.failures.map((id) => ({
  id,
  title: CHECK_COPY[id]?.title ?? id,
}));

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/self-audit/" },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: "/self-audit/",
  }),
};

export default function SelfAuditPage() {
  const failedCount = SELF_AUDIT.failures.length;
  const notApplicableCount = SELF_AUDIT.notApplicable.length;

  return (
    <ProsePage
      eyebrow="Self-audit"
      title={TITLE}
      description={
        <p>
          The best evidence a measurement tool can offer is a measurement of itself. This page is
          LLMention&rsquo;s own homepage result — the date, the score, the rule that did not apply,
          the failures (or their absence) and the method — published at a URL a crawler is allowed
          to read, rather than only inside a report it is not.
        </p>
      }
      action={{ href: "/", label: "← Back to the scanner" }}
      width="4xl"
    >
      {/*
        The byline goes above the numbers for the reason /study/ gives: the header says what the
        page is, and this line answers who measured it and when. The date is the record's, not the
        page's, and the label says so.
      */}
      <div className="mb-12 space-y-2">
        <AuthorLine date={SELF_AUDIT.measuredAt} label="Measured" />
        <p className="text-[13px] leading-relaxed text-[var(--ink-3)]">
          This date is the day the measurement was taken, not the day this page was last edited.
          The record is re-measured on a schedule, so the date moves with the measurement rather
          than with an edit; without that, the sentence below it would be indistinguishable from a
          stale claim dressed as a current one.
        </p>
      </div>

      {/* Headline numbers, all read from the record. */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
          <div className="text-3xl font-semibold text-[var(--ink-1)] font-mono">
            {SELF_AUDIT.score}
            <span className="text-lg text-[var(--ink-3)]">/{SCALE}</span>
          </div>
          <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
            homepage score on the site&rsquo;s own scanner
          </div>
        </div>
        <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
          <div className="text-3xl font-semibold text-[var(--ok)] font-mono">
            {SELF_AUDIT.grade}
          </div>
          <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
            grade{GRADE_BAND ? ` — ${GRADE_BAND.label.toLowerCase()}` : ""}
          </div>
        </div>
        <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
          <div className="text-3xl font-semibold text-[var(--ink-1)] font-mono">
            {SELF_AUDIT.passed}
            <span className="text-lg text-[var(--ink-3)]">/{SELF_AUDIT.applicable}</span>
          </div>
          <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
            applicable checks passing ({PASS_SHARE}%)
          </div>
        </div>
        <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5">
          <div className="text-3xl font-semibold text-[var(--ink-2)] font-mono">
            {notApplicableCount}
          </div>
          <div className="text-[11px] text-[var(--ink-2)] pt-1 leading-snug">
            rule{notApplicableCount === 1 ? "" : "s"} not applicable, named below
          </div>
        </div>
      </section>

      <article className="doc-article text-[17px] leading-[1.65] text-[var(--ink-2)]">
        <h2>What was measured, and when?</h2>
        <p>
          The subject is this site&rsquo;s homepage at <code>/</code>: the HTML <code>next build</code>{" "}
          wrote for it, which is what a crawler receives, together with the site&rsquo;s{" "}
          <code>robots.txt</code>, <code>llms.txt</code> and <code>sitemap.xml</code>. The analyser is
          the same one the public <code>/api/scan</code> endpoint runs; no part of the page was
          scored by hand. The measurement was taken on{" "}
          <time dateTime={SELF_AUDIT.measuredAt}>{MEASURED_ON}</time> and written to{" "}
          <code>lib/self-audit.json</code>, the file this page and the homepage both read.
        </p>
        <p>
          <strong>One URL, not a site.</strong> The free scan reads a single page, so the figure
          describes the homepage and says nothing about the pages linked from it — the guides, the
          rule reference, the study. A homepage is also the hardest page on a site to score well
          on: it is short, navigational, and carries less of the evidence an answer needs than an
          article does. That is a reason to read the number as a measurement rather than as a
          summary of the whole site.
        </p>

        <h2>What did the measurement find?</h2>
        <p>
          The record reads <strong>{SELF_AUDIT.score} out of {SCALE}</strong>,{" "}
          <strong>grade {SELF_AUDIT.grade}</strong>
          {GRADE_BAND ? ` — ${GRADE_BAND.label.toLowerCase()}` : ""}. Of the checks that applied,{" "}
          <strong>
            {SELF_AUDIT.passed} of {SELF_AUDIT.applicable}
          </strong>{" "}
          passed, which is {PASS_SHARE}% of the applicable set; {notApplicableCount} rule
          {notApplicableCount === 1 ? " was" : "s were"} excluded and {failedCount} check
          {failedCount === 1 ? " failed" : "s failed"}. The record, field by field:
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value on {MEASURED_ON}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Measured page</td>
                <td>
                  the homepage at <code>/</code> on{" "}
                  <Link href={`/report/?domain=${SITE_HOST}`}>{SITE_HOST}</Link>
                </td>
              </tr>
              <tr>
                <td>Measured on</td>
                <td>
                  <time dateTime={SELF_AUDIT.measuredAt}>{MEASURED_ON}</time>
                </td>
              </tr>
              <tr>
                <td>Score</td>
                <td>
                  {SELF_AUDIT.score} / {SCALE}
                </td>
              </tr>
              <tr>
                <td>Grade</td>
                <td>
                  {SELF_AUDIT.grade}
                  {GRADE_BAND ? ` — ${GRADE_BAND.label}` : ""}
                </td>
              </tr>
              <tr>
                <td>Checks run</td>
                <td>{SELF_AUDIT.run}</td>
              </tr>
              <tr>
                <td>Checks passed</td>
                <td>
                  {SELF_AUDIT.passed} of {SELF_AUDIT.applicable} applicable ({SELF_AUDIT.passed}{" "}
                  of {SELF_AUDIT.run} run)
                </td>
              </tr>
              <tr>
                <td>Not applicable</td>
                <td>
                  {notApplicableCount}
                  {notApplicableCount > 0
                    ? ` — ${SELF_AUDIT.notApplicable.join(", ")}`
                    : " — none"}
                </td>
              </tr>
              <tr>
                <td>Failures</td>
                <td>
                  {failedCount}
                  {failedCount > 0 ? ` — ${SELF_AUDIT.failures.join(", ")}` : " — none"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The table is generated from the record, so it is not a second copy of the numbers that
          could disagree with the first. The record itself is published in the repository as{" "}
          <code>lib/self-audit.json</code>, in exactly the shape above.
        </p>

        <h2>Which rules were marked not applicable?</h2>
        <p>
          {notApplicableCount === 0
            ? "None on this measurement: every rule in the catalogue could judge this page, so the denominator is the full catalogue and nothing was excluded."
            : `${notApplicableCount === 1 ? "One rule was" : `${notApplicableCount} rules were`} excluded from the score because the question does not apply to this page. The record names it rather than leaving a silent gap between the checks run and the checks passed.`}
        </p>
        {NOT_APPLICABLE.length > 0 ? (
          <ul>
            {NOT_APPLICABLE.map((entry) => (
              <li key={entry.id}>
                <Link href={`/checks/${entry.id}/`}>{entry.title}</Link> — {entry.why}
                {entry.check && entry.dimension ? (
                  <>
                    {" "}
                    The rule is worth {entry.check.points} point
                    {entry.check.points === 1 ? "" : "s"} inside the {entry.dimension.label}{" "}
                    dimension; excluding it removes those points from both sides of the fraction,
                    so the total stays a percentage of what could actually be assessed rather than
                    silently becoming a loss.
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          The change that made this an exclusion rather than a failure is recorded, with its date
          and its reason, in the{" "}
          <Link href="/methodology/#what-changed">method changelog</Link>. The rule as it executes
          is published on the{" "}
          <Link href="/checks/hreflang/">hreflang check page</Link>, and every other rule in the
          catalogue is listed on the <Link href="/checks/">rule reference</Link>.
        </p>

        <h2>Which checks failed?</h2>
        <p>
          {failedCount === 0
            ? `None on ${MEASURED_ON}: the record's failure list is empty, so ${failedCount} of the ${SELF_AUDIT.applicable} applicable checks failed. The empty list is rendered here rather than the section being removed, because a report that deletes its empty sections cannot be told apart from one that never had them.`
            : `${failedCount} check${failedCount === 1 ? "" : "s"} failed on ${MEASURED_ON}. ${failedCount === 1 ? "It is" : "They are"} named below with a link to the rule, and ${failedCount === 1 ? "it stays" : "they stay"} listed until a later measurement shows the page passing.`}
        </p>
        {FAILED.length > 0 ? (
          <ul>
            {FAILED.map((entry) => (
              <li key={entry.id}>
                <Link href={`/checks/${entry.id}/`}>{entry.title}</Link> —{" "}
                <code>{entry.id}</code>
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          A failure is a claim about the page at the moment it was measured, not a permanent
          verdict. The{" "}
          <Link href={`/report/?domain=${SITE_HOST}`}>live report</Link> shows whether a check still
          fails now, with the evidence the analyser saw; this page keeps the dated record, because
          an undated claim about a failing check is a memory rather than a measurement.
        </p>

        <h2>Why is there a page for this, when the live report already exists?</h2>
        <p>
          The homepage presents its own score as evidence and links the live report for the detail
          — and that link is a dead end for a crawler. The report at <code>/report/</code> is the
          tool, not the document. It generates a result for whatever <code>?domain=</code> it is
          given, with the {DIMENSION_CATALOG.length} dimension scores and the evidence behind every
          check. That is exactly why it cannot be the evidence in an index: its output is
          user-specific, its URL space is unbounded, and it is deliberately excluded from both
          systems a crawler uses. The route&rsquo;s own layout marks it <code>noindex</code>, and{" "}
          <code>public/robots.txt</code> disallows <code>/report/</code> — and a disallowed URL is
          never fetched, so the <code>noindex</code> tag is never even read. The API has the same
          treatment: <code>/api/</code> is disallowed as well.
        </p>
        <p>
          That is why this page exists. It is the stable, indexable statement of the same
          measurement: one URL, the date, the result, the exclusion, the failures, the method and
          the limits. It does not reproduce the report — the report shows today&rsquo;s evidence, and
          this page publishes the record of one measurement — but a crawler, and a reader who does
          not want to run a tool, can now see the claim the homepage makes without being asked to
          trust a route they are not allowed to open.
        </p>

        <h2>How is the number produced?</h2>
        <p>
          Step by step, all of it in the repository rather than in a spreadsheet:
        </p>
        <ol>
          <li>
            <strong>The build writes the homepage.</strong> <code>next build</code> renders this
            site to static HTML; the homepage is the file at{" "}
            <code>.next/server/app/index.html</code>.
          </li>
          <li>
            <strong>The record is measured, not typed.</strong>{" "}
            <code>scripts/self-audit.mts</code> (<code>npm run self-audit</code>) reads that HTML
            and the site&rsquo;s <code>robots.txt</code>, <code>llms.txt</code> and{" "}
            <code>sitemap.xml</code>, runs the same <code>analyze()</code> the public endpoint runs,
            and writes <code>lib/self-audit.json</code>.
          </li>
          <li>
            <strong>A gate keeps the page and the record in step.</strong>{" "}
            <code>scripts/check-built-pages.mts</code> (<code>npm run check:built</code>) scores the
            built homepage and fails when its score, grade, check counts or the id lists disagree
            with the record. The measurement date is deliberately not compared: it records when the
            measurement was taken, not a property of the page. A page edit that changes the score
            therefore fails the build until the record is re-measured.
          </li>
          <li>
            <strong>A scheduled workflow refreshes it.</strong>{" "}
            <code>.github/workflows/self-audit.yml</code> rebuilds the site on a weekly schedule,
            re-measures, and commits the record only when it changed; a failed measurement leaves
            the last good record in place rather than publishing a number produced from a broken
            page. The deploy is then re-dispatched from the commit that contains the refreshed
            record, so the date printed here is the date of the last measurement and not the last
            edit.
          </li>
        </ol>
        <p>
          The homepage imports the same record through <code>lib/home-content.ts</code>, so the two
          pages cannot quote different numbers, and the machine-readable twin at{" "}
          <Link href="/markdown/">/markdown/</Link> reads the same values again.
        </p>

        <h2>How can I re-run this measurement?</h2>
        <p>
          You do not have to take the number on trust. Both of these re-measure the page as it is
          at the moment you ask, and both are free:
        </p>
        <ul>
          <li>
            <strong>In a browser:</strong>{" "}
            <Link href={`/report/?domain=${SITE_HOST}`}>
              /report/?domain={SITE_HOST}
            </Link>{" "}
            shows the {DIMENSION_CATALOG.length} dimension scores and the evidence behind every
            check.
          </li>
          <li>
            <strong>As JSON:</strong> the public endpoint returns the headline numbers — score,
            grade, checks run and passed, page type, and how many checks did not apply — and adds
            the full dimension and issue list when <code>brief=1</code> is omitted. It needs no key
            and makes no browser do the work.
          </li>
        </ul>
        <pre>{`curl "${SITE_URL}/api/scan?brief=1&domain=${SITE_HOST}"`}</pre>
        <p>
          A re-run is a new measurement, not a lookup of this record. The page, its{" "}
          <code>robots.txt</code> and the rules can all have moved since {MEASURED_ON}, so a
          different number would be a finding rather than a contradiction — which is why the date
          is printed next to the score. The endpoint is rate-limited per address, and the{" "}
          <code>brief</code> form exists so a study over many domains does not pull the full report
          from each one; <Link href="/study/">the public study over large homepages</Link> is the
          example of that use.
        </p>

        <h2>What does a perfect score actually mean?</h2>
        <p>
          {SELF_AUDIT.score} out of {SCALE} is not the fraction of checks that passed. Each check is
          worth a fixed number of points inside its dimension, a dimension is scored as the share of
          its own points that were earned, and the {DIMENSION_CATALOG.length} dimensions are
          combined by weight — AI crawler access alone carries {AI_ACCESS_WEIGHT}% of the total. The
          result is a percentage of what could be assessed for this page, which is why the
          denominator above is {SELF_AUDIT.applicable} rather than {SELF_AUDIT.run}.
        </p>
        <p>
          Grade {GRADE_BANDS[0].grade} begins at {GRADE_BANDS[0].min}% of the scale and this record
          clears it. But a perfect score says exactly one thing: nothing that applied to this page
          failed. It does not say that every rule in the catalogue passed — {notApplicableCount} rule
          {notApplicableCount === 1 ? " was" : "s were"} excluded — and it is not a claim that the
          method is finished. It is a claim that this page, under this revision of the rules, on
          this date, had no applicable gap the analyser could see. That is a narrower and more
          useful sentence than a score having reached its maximum.
        </p>

        <h2>What does the number not tell you?</h2>
        <p>The limits are part of the measurement, not a footnote to it.</p>
        <ul>
          <li>
            <strong>It reads one homepage.</strong> An interior page can be failing checks the
            homepage passes, and this number would not move. The guides, the rule pages and the
            study are outside this figure.
          </li>
          <li>
            <strong>It does not ask any AI engine about this site.</strong> Nothing here measures
            whether ChatGPT, Claude, Perplexity or Google&rsquo;s AI surfaces mention LLMention or
            cite these pages. It measures readiness — whether the page is in a state where being
            cited is possible. Mention tracking is a different measurement with a different data
            source, set out in{" "}
            <Link href="/compare/readiness-vs-mention-tracking/">
              the comparison with mention tracking
            </Link>
            .
          </li>
          <li>
            <strong>It is a snapshot.</strong> Markup, robots rules and content change; the record
            is dated for that reason, and the weekly workflow exists because a measurement nobody
            refreshes becomes a memory of a measurement.
          </li>
          <li>
            <strong>The method moves.</strong> Rules change when a measurement error is found, and
            every change that can move a score is recorded with its date in the{" "}
            <Link href="/methodology/#what-changed">method changelog</Link>. A score is only
            comparable with another score produced under the same rules.
          </li>
          <li>
            <strong>It is self-measurement.</strong> The same team writes the rules and the page,
            which is a conflict a number cannot resolve. What answers it is not a better claim but
            the published method, the record file, the build gate and the public endpoint — each of
            which a reader can check against this page. If a number here looks wrong, that is a bug
            report rather than a debating point: the <Link href="/contact/">contact page</Link> is
            the place to send it, and the <Link href="/about/">about page</Link> says who is
            accountable for the record.
          </li>
        </ul>
      </article>

      <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/methodology/" className="text-xs text-[var(--accent)] hover:opacity-75">
          The full method, rule by rule →
        </Link>
        <Link href="/checks/" className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-1)]">
          All {SELF_AUDIT.run} rule pages
        </Link>
        <Link href="/study/" className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-1)]">
          The public study
        </Link>
      </div>

      <div className="mt-16 space-y-10 text-sm leading-relaxed text-[var(--ink-2)]">
        <Faq
          title="Questions about this self-audit"
          items={[
            {
              q: "Why does the site not simply link to its own report?",
              a: "Because the report is a tool output, not a document. It is generated per request from a domain parameter, so its URL space is unbounded and its content is user-specific; the route is noindex and disallowed in robots.txt, and the API is disallowed too. A crawler that never fetches it cannot read the evidence, which is why this page carries the record at one stable URL.",
            },
            {
              q: `Does ${SELF_AUDIT.score} out of ${SCALE} mean ChatGPT mentions LLMention?`,
              a: "No. The score measures readiness: whether a crawler can reach the page and whether the page carries what an answer needs. It never asks an engine about a brand, so it cannot tell you whether the site is mentioned or cited today.",
            },
            {
              q: "How often is the record refreshed?",
              a: "A scheduled workflow rebuilds and re-measures the homepage every week, and commits the record only when it changed. The date shown is the day of the last measurement, not the day this page was last edited; a measurement that fails leaves the previous record in place.",
            },
            {
              q: "Can I check the number without trusting this page?",
              a: `Yes. Run /report/?domain=${SITE_HOST} yourself, or call the public API with brief=1; either re-measures the page as it is now. The record is lib/self-audit.json in the repository, and check:built fails the build when the built page and the record disagree.`,
            },
          ]}
          footer={
            <>
              The rules behind every number are on the{" "}
              <Link href="/methodology/">methodology page</Link>; the analyser that scores your
              site is the one that scored this page.
            </>
          }
        />

        {/*
          The same evidence block every measurement page carries. It is not decoration: a quote and
          external authority links are checks this very page is scored against, and the quoted
          paper is the source the dimension weights follow.
        */}
        <Evidence
          quote={GEO_PRIMARY_QUOTE}
          attribution="Generative Engine Optimization, KDD 2024"
          attributionUrl="https://arxiv.org/abs/2311.09735"
          sources={GEO_PRIMARY_SOURCES}
          note={
            <>
              The readiness weights follow that published measurement rather than taste, and this
              page applies the same weights to the site that publishes them. What the score cannot
              see is stated above rather than implied by the number; the repository named in the
              sources is where the record, the analyser and the gate that compares them live.
            </>
          }
        />
      </div>
    </ProsePage>
  );
}
