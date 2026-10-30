import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("30-site-sample-not-a-benchmark");
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
        title: "Questions about reading the study",
        items: [
          {
            q: "Is the 30-site study a benchmark?",
            a: "No. It is a convenience sample of 30 homepages, chosen by hand, scanned once on 3 October 2026. It describes those rows on that date. A benchmark implies a fixed, representative reference; this is neither.",
          },
          {
            q: "What can I legitimately quote from it?",
            a: "Statements about the sample: for example, that 9 of the 30 homepages did not admit an AI crawler, 7 by robots.txt and 2 by server refusal, in one scan on one date. Every such sentence should carry the scope with it.",
          },
          {
            q: "Can I compare my site's score with the study's?",
            a: "Only if you scan the same page type with the same method on a comparable date, and even then the comparison is about readiness, not citations. A homepage and an article are different measurements; a scan today and a scan in October are different dates.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("refused-vs-blocked-waf-robots"),
          label: "Refused vs blocked: telling WAF from robots.txt",
          note: "The mechanism breakdown inside those nine blocked rows.",
        },
        {
          href: insightPath("nine-homepages-never-answered"),
          label: "Nine homepages never answered the crawler",
          note: "The aborted rows, and why the study reports them separately.",
        },
        {
          href: "/study/",
          label: "The study",
          note: "The rows, the method, the limits and the machine-readable data endpoint.",
        },
      ]}
    >
      <p>
        A small sample is useful when it is described as a small sample and dangerous when it is
        described as a benchmark. The difference is not pedantry: a benchmark implies a fixed,
        representative reference you can measure yourself against; a sample of thirty hand-picked
        homepages scanned once describes thirty rows on one date. Both can be honest. Only one can
        support &quot;the industry average is 62&quot;.
      </p>
      <p>
        This article is about how to read the 30-site study correctly — what it supports, what it
        cannot, and how to quote it without turning it into something it is not. It is also a general
        template for reading any small-sample SEO or GEO study, including the ones that are less
        careful than this one.
      </p>

      <h2>What the study actually is</h2>
      <ul>
        <li>
          <strong>30 homepages, chosen by hand.</strong> The page says so in its own comments and
          limits: a convenience sample, not a random one, and not a ranking of the largest sites on
          the internet.
        </li>
        <li>
          <strong>One scan, on 3 October 2026.</strong> One run of the same public endpoint the
          product ships, no hand-adjusted results.
        </li>
        <li>
          <strong>Homepages, not articles.</strong> Homepages are short, navigational and carry
          little of the evidence an answer needs; a low homepage score does not mean a site is
          invisible in AI answers.
        </li>
        <li>
          <strong>Readiness checks, not citations.</strong> The score describes whether a page is in
          a state that makes citation possible; it does not measure whether an engine cites the site.
        </li>
      </ul>

      <h2>What it can support</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Supported?</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&quot;9 of these 30 homepages did not admit an AI crawler on 3 October 2026.&quot;</td>
              <td>Yes</td>
              <td>It is a count over the listed rows on the stated date.</td>
            </tr>
            <tr>
              <td>&quot;Of those 9, 7 said so in robots.txt and 2 refused the request.&quot;</td>
              <td>Yes</td>
              <td>The data separates the mechanisms.</td>
            </tr>
            <tr>
              <td>&quot;Every news publisher in the sample blocks at least one AI crawler.&quot;</td>
              <td>Yes, for the sample</td>
              <td>It is a statement about the publishers included, not the industry.</td>
            </tr>
            <tr>
              <td>&quot;The average homepage scores 62.&quot;</td>
              <td>For these rows</td>
              <td>It is a mean of the sample, not an industry average.</td>
            </tr>
            <tr>
              <td>&quot;A 0-of-30 A rate shows nobody is ready.&quot;</td>
              <td>No</td>
              <td>It shows none of these homepages scored an A under this method on this date.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What it cannot support</h2>
      <ul>
        <li>
          <strong>Prevalence.</strong> Thirty hand-picked sites cannot estimate what fraction of the
          web blocks AI crawlers. The selection is not random, and the sample is small.
        </li>
        <li>
          <strong>A ranking of the largest sites.</strong> The list is a convenience sample across
          infrastructure, developer platforms, news and German industry; it is not &quot;the 30
          largest&quot;.
        </li>
        <li>
          <strong>Prediction.</strong> A site can score 12 and still be quoted tomorrow. The study
          measures readiness, not citation.
        </li>
        <li>
          <strong>Causation.</strong> &quot;News publishers block because AI reduces referrals&quot;
          is a hypothesis the data cannot test; the data shows the block, not the motive.
        </li>
        <li>
          <strong>Fine-grained comparisons.</strong> 62 versus 60 is one point on a 30-row sample;
          treating it as a meaningful difference is reading noise as signal.
        </li>
        <li>
          <strong>Generalisation across page types.</strong> These are homepages. A product page, an
          article and a documentation page are different measurements.
        </li>
      </ul>

      <h2>The common misreadings</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Misreading</th>
              <th>What is actually true</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&quot;30 of the largest sites&quot;</td>
              <td>30 hand-picked homepages across a few categories.</td>
            </tr>
            <tr>
              <td>&quot;9 of 30 sites block AI&quot; → &quot;30% of the web blocks AI&quot;</td>
              <td>9 of 30 in this sample; no estimate about the web.</td>
            </tr>
            <tr>
              <td>&quot;Low score means invisible in AI answers&quot;</td>
              <td>The score is readiness; the articles may be in better shape than the homepage.</td>
            </tr>
            <tr>
              <td>&quot;Blocking causes invisibility&quot;</td>
              <td>Blocking prevents crawling; whether it prevents citation depends on the engine and other sources.</td>
            </tr>
            <tr>
              <td>&quot;My score beats Salesforce&quot;</td>
              <td>Different scan, different date, different page type.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How to quote it honestly</h2>
      <p>
        The template is one sentence with three parts: the scope, the count, and the date. For
        example: &quot;In a hand-picked sample of 30 homepages scanned on 3 October 2026, 9 did not
        admit at least one AI crawler — 7 by a robots.txt rule and 2 by a server refusal.&quot; That
        sentence is checkable against the published rows and cannot be stretched into a claim about
        the web.
      </p>
      <p>
        The same template works for any small study: name the sample, the method and the date before
        the finding. If a study does not let you write that sentence, it is not telling you what it
        appears to tell you.
      </p>

      <h2>What a stronger study would need</h2>
      <ol>
        <li>
          <strong>Random or stratified selection</strong> from a defined population, so the sample
          can speak to something beyond itself.
        </li>
        <li>
          <strong>Multiple page types</strong> per site, because homepages and articles behave
          differently.
        </li>
        <li>
          <strong>Repeat runs</strong>, because bot-management responses can differ between two
          requests seconds apart; the re-run here already exposed that.
        </li>
        <li>
          <strong>Pre-registered questions</strong>, so the analysis is not chosen after the data.
        </li>
        <li>
          <strong>Published data and code</strong>, which this study does: rows, a data endpoint, and
          the collection script.
        </li>
      </ol>

      <h2>Why this matters beyond one study</h2>
      <p>
        The GEO field is full of numbers from small samples presented as benchmarks: &quot;X% of
        sites fail AI search&quot; from a scrape of a few dozen URLs, with no date, no method and no
        data. The damage is not only to the reader; it is to the trust in every honest small study.
        A vendor that quotes its own convenience sample as an industry statistic is asking to be
        ignored, and a reader who learns to check the scope will ignore it.
      </p>
      <p>
        The standard this site tries to hold is the one in the study&rsquo;s own limits section:
        publish the rows, state the scope, and make the claim small enough to be true. A small true
        finding is worth more than a large one that has to be retracted.
      </p>
    </PostShell>
  );
}
