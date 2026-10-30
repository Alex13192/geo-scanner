import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("what-i-would-measure-next");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English-first series; translations add their own hreflang keys when they ship. */
    languages: {
      en: `/blog/${insight.slug}/`,
      "x-default": `/blog/${insight.slug}/`,
    },
  },
  ...social({
    title: TITLE,
    description: DESCRIPTION,
    url: insightPath(insight.slug),
    type: "article",
  }),
};

export default function Page() {
  return (
    <PostShell
      insight={insight}
      faq={{
        title: "Questions about what comes next",
        items: [
          {
            q: "Will the next measurement prove that fixing a page improves citations?",
            a: "It can measure what changed in the answers, not why. A before/after run with the same question bank and the same engine can show a difference in counts; attributing it to one edit requires more control than a small product can afford. The honest claim is descriptive.",
          },
          {
            q: "What is the most valuable thing to measure next?",
            a: "A randomised or stratified sample across page types would make every future claim stronger. After that, a citation measurement with a frozen question bank and three runs per question, because it is the question every buyer actually asks.",
          },
          {
            q: "Does this tool replace analytics or rank tracking?",
            a: "No. It measures readiness and, in the paid product, mentions on a fixed question bank. It does not measure traffic, rankings or conversions, and it should not be sold as a replacement for the tools that do.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("30-site-sample-not-a-benchmark"),
          label: "A 30-site sample is not a benchmark",
          note: "The scope lesson applied to the study the series kept returning to.",
        },
        {
          href: insightPath("three-runs-per-question"),
          label: "Three runs per question: why \"2 of 3\" beats a percentage",
          note: "The measurement design the next round should keep.",
        },
        {
          href: "/methodology/",
          label: "The method",
          note: "Every dimension, its weight, and the rules this tool applies.",
        },
      ]}
    >
      <p>
        This is the last piece in the series, and it is the one where the tool has to talk about
        itself without advertising. The useful question is not &quot;what else can it score&quot; but
        &quot;what can it not tell you, and what would be worth measuring next&quot;. Both answers are
        more specific than they sound.
      </p>

      <h2>What this tool still cannot tell you</h2>
      <ul>
        <li>
          <strong>Whether an engine will cite you.</strong> The free scan measures readiness: whether
          a page is in a state that makes citation possible. A high score is not a citation; a low
          one is not proof of invisibility.
        </li>
        <li>
          <strong>Why a page scored low.</strong> The evidence line says what the scanner saw; it
          does not say which cause mattered, or what the effect of the cause is in a given engine.
        </li>
        <li>
          <strong>What was used for training.</strong> Robots rules and content signals state a
          position; they do not prove what a provider did with content it may already have.
        </li>
        <li>
          <strong>What people actually ask.</strong> The free scan has no prompt bank and no demand
          data. The paid measurement uses a question bank the buyer approves; it is not a sample of
          real user queries.
        </li>
        <li>
          <strong>Competitors&rsquo; share of voice.</strong> The free scan does not run any answer
          engine. The paid measurement counts mentions in a fixed bank; that is a different
          measurement, not a market share.
        </li>
        <li>
          <strong>Whether a fix worked.</strong> A re-scan can show that a check now passes. It
          cannot show that a citation changed, because readiness and citation are different
          measurements and the second one needs a before/after run.
        </li>
        <li>
          <strong>Content truth or quality.</strong> Every markup rule is a presence check. A page
          can pass them with false claims, a weak argument, or a translation nobody would read.
        </li>
        <li>
          <strong>Rendering and mobile experience.</strong> The scanner fetches; it does not run a
          browser. JavaScript-only content is detected, but visual usability is not measured.
        </li>
        <li>
          <strong>Site-wide behaviour.</strong> One URL is one page. A site can have a perfect
          homepage and a broken checkout, and this scan will not see the checkout.
        </li>
        <li>
          <strong>Whether a context file is read.</strong> llms.txt, markdown alternates and
          content-signal are declarations. Whether an engine reads them is not observable from here.
        </li>
      </ul>

      <h2>What this series actually measured</h2>
      <p>
        Thirty pieces, one per scheduled slot, all English. The measured pieces in the series were
        deliberately small and scoped:
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Piece</th>
              <th>Measurement</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Answer-first writing</td>
              <td>101 heading-paragraph pairs, 91 openers ≤80 words</td>
              <td>16 English blog articles on 2026-10-26</td>
            </tr>
            <tr>
              <td>Meta descriptions</td>
              <td>33 of 40 in the 50-160 range</td>
              <td>A systematic 40-URL sample of this site&rsquo;s sitemap</td>
            </tr>
            <tr>
              <td>Study re-read</td>
              <td>9 blocked rows = 7 robots + 2 refusals</td>
              <td>The published 30-row dataset of 3 October 2026</td>
            </tr>
            <tr>
              <td>Redirects</td>
              <td>5 legacy URLs, 1 hop each</td>
              <td>This site&rsquo;s own redirect table on 2026-10-29</td>
            </tr>
            <tr>
              <td>TTFB</td>
              <td>0.75-3.8s TTFB; x-nextjs-cache MISS</td>
              <td>4 URLs, 3 runs each, one network, 2026-10-29</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        None of these is an industry benchmark, and each says so in its own piece. What they have in
        common is that a reader can reproduce them: the URLs, the dates and the method are in the
        text, and the raw data for the study is published.
      </p>

      <h2>What I would measure next</h2>
      <ol>
        <li>
          <strong>A random or stratified sample.</strong> The convenience sample of 30 homepages was
          useful for finding mechanisms, not for prevalence. A sample drawn from a defined
          population, with page types stratified, would make every future claim stronger.
        </li>
        <li>
          <strong>Citations with a frozen question bank.</strong> The paid measurement already runs
          three runs per question. The next step is a before/after design on a page that changed,
          with the same bank fingerprint, so the comparison has a denominator and a date.
        </li>
        <li>
          <strong>Profile verification, automated.</strong> The sameAs rule checks presence. A
          follow-up fetch could check that each URL resolves, names the entity and links back; that
          is automatable and would close the rule&rsquo;s stated gap.
        </li>
        <li>
          <strong>Markdown twin drift.</strong> Compare the H1, heading outline and word count of each
          twin with its HTML page in CI. Drift is the failure mode the declaration cannot see.
        </li>
        <li>
          <strong>Internal link graph.</strong> Orphan pages and pages with a single inbound link are
          cheap to find from a crawl and are a real part of discoverability.
        </li>
        <li>
          <strong>Page-type rules.</strong> A product page and a documentation page have different
          high-value checks; the current method applies one set to every page.
        </li>
        <li>
          <strong>Consent and paywall detection.</strong> Whether the body is in the response is
          checkable; whether a banner hides it is the next layer.
        </li>
      </ol>

      <h2>How the next measurement should be reported</h2>
      <p>
        The rules are already in the series: a sample size in the sentence, a count instead of a
        percentage, a date, the raw rows behind the count, and a line about what the measurement does
        not cover. What I would add is a fixed fingerprint for the question bank, so a before/after
        comparison can prove the questions did not change between runs.
      </p>
      <p>
        And a refusal: no &quot;visibility score&quot; that compresses questions, engines and runs
        into one number. The compression is what makes the result look like a ranking, and it is the
        one claim this product does not want to make.
      </p>

      <h2>What the tool will not promise</h2>
      <p>
        It will not promise a citation, a ranking, or a training opt-out. It will not replace
        analytics, rank tracking or a human reading the page. It will not tell you what an engine
        thinks; it will tell you what a fetch saw and whether the page is in a state that makes being
        understood possible.
      </p>
      <p>
        That is a narrower product than the category usually advertises, and it is the one this site
        can defend. The series ends here, but the measurements do not: the study can be re-run, the
        scan is public, and the counts are checkable.
      </p>
    </PostShell>
  );
}
