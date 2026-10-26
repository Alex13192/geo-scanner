import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("statistics-without-sources-citation-trap");
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
        title: "Questions about statistics and citations",
        items: [
          {
            q: "Does the scanner check that my numbers are correct?",
            a: "No. The statistics rule counts numeric claims and the authority-citations rule counts links to a list of research, government, academic and documentation domains. Neither fetches the linked page or compares it with the claim. They are presence checks, and the rule pages say so.",
          },
          {
            q: "Is it better to remove an unsourced number or to keep it?",
            a: "If the number cannot be supported, remove it or restate the claim without the figure. An unsourced number is a liability: a reader cannot check it, an engine may repeat it without attribution, and the first person who asks where it came from gets no answer. A weaker claim that is true is worth more than a precise one that is not.",
          },
          {
            q: "What does a citable statistic need?",
            a: "The value, the denominator, the population, the date, the source, and a link to where the source says it. If any of those is missing, the number is a slogan rather than a measurement. The test is whether a stranger could reproduce the figure from what the page gives them.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("tables-lists-and-prose-only-facts"),
          label: "Tables, lists and the cost of prose-only facts",
          note: "Where to put the numbers once they have a denominator and a source.",
        },
        {
          href: insightPath("thirty-homepages-none-graded-a"),
          label: "We scanned 30 homepages and none graded an A",
          note: "The study this site publishes with its sample, date and raw rows.",
        },
        {
          href: "/checks/statistics/",
          label: "The rule this article is about",
          note: "What counts as a numeric claim, and what the check does not verify.",
        },
      ]}
    >
      <p>
        A number is the most quotable thing on a page and the easiest thing to fake. It carries an
        air of measurement even when it came from a conference slide, a competitor&rsquo;s landing
        page, or nothing at all. In an AI answer, that is a bad combination: the number is likely to
        be repeated, the denominator is likely to be dropped, and the page that supplied it may
        never be named. This article is about the trap and how to stay out of it.
      </p>
      <p>
        The scanner has two rules that touch this area, and both are weaker than they look. Knowing
        what they actually check is the first step to not mistaking a green tick for a fact-check.
      </p>

      <h2>What the two rules check</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Points</th>
              <th>What it asks</th>
              <th>What it does not ask</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Link href="/checks/statistics/">statistics</Link>
              </td>
              <td>4</td>
              <td>Does the response contain at least five numeric claims (percentages, currency, multipliers, thousands-separated figures, five-digit numbers)?</td>
              <td>Whether any number has a source, a denominator, a date, or is correct. Bare four-digit numbers are excluded because they are usually years; everything else counts, chrome included.</td>
            </tr>
            <tr>
              <td>
                <Link href="/checks/authority-citations/">authority-citations</Link>
              </td>
              <td>3</td>
              <td>Are there at least two links to the published authority list (research, government, academic, documentation domains)?</td>
              <td>Whether the linked page supports the claim. It counts links, not distinct hosts, so three links to one domain can satisfy a rule that names two sources.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Neither rule fetches the source. A page with five invented percentages and two links to a
        paper it never read can pass both. That is not a bug in the checks; it is the limit of what
        a single request can establish, and the rule pages state it in the same words. The point of
        quoting it here is that a passing scan should not be read as evidence that the numbers are
        true.
      </p>

      <h2>The shapes of the trap</h2>
      <ul>
        <li>
          <strong>The orphan percentage.</strong> "72% of buyers prefer X" with no population, no
          sample size and no date. It is unverifiable, and an engine that repeats it will drop the
          context that was never there.
        </li>
        <li>
          <strong>The missing denominator.</strong> "27% higher" — than what, on which baseline,
          measured how. A relative figure without a base is a direction, not a magnitude.
        </li>
        <li>
          <strong>The stale figure with a fresh date.</strong> A 2021 number republished under a
          2026 byline. The date on the page is not the date of the measurement, and the reader has
          no way to tell.
        </li>
        <li>
          <strong>The decorative citation.</strong> A link to a reputable domain that does not
          contain the claim. The authority-citations rule passes; a reader who follows the link
          finds nothing.
        </li>
        <li>
          <strong>Two links, one source.</strong> The rule counts links rather than distinct hosts,
          so two references to the same paper read as two sources. The evidence line prints distinct
          hosts, which is how a page can pass with only one.
        </li>
        <li>
          <strong>False precision.</strong> "37.4%" from a sample of twenty. The decimal implies a
          resolution the data does not have.
        </li>
        <li>
          <strong>Correlation presented as cause.</strong> The number is real and the sentence around
          it claims a mechanism the study did not test.
        </li>
      </ul>

      <h2>What a citable number needs</h2>
      <p>
        The list is short and unglamorous: value, denominator, population, date, source, link. If a
        stranger cannot reproduce the figure from those six things, the page has not published a
        measurement; it has published a mood.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Bad answer</th>
              <th>Citable answer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>How many?</td>
              <td>"Most sites fail."</td>
              <td>"16 of 30 homepages graded F in one scan on 3 October 2026."</td>
            </tr>
            <tr>
              <td>Out of what?</td>
              <td>"53%."</td>
              <td>"53% of the 30 homepages in the sample."</td>
            </tr>
            <tr>
              <td>Measured when?</td>
              <td>"Recently."</td>
              <td>"One run, 3 October 2026; the raw rows are published."</td>
            </tr>
            <tr>
              <td>Says who?</td>
              <td>"Studies show."</td>
              <td>"The project&rsquo;s own scan; method and limits on /methodology/."</td>
            </tr>
            <tr>
              <td>What does it not show?</td>
              <td>(nothing)</td>
              <td>"A 30-site convenience sample says nothing about the rest of the web."</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How this site tries to do it</h2>
      <p>
        The 30-site study is the clearest example. The numbers come from one run of the same public
        endpoint the product ships, on a stated date, over a listed set of homepages. The rows are
        published as data, not only as prose, so anyone can diff them or re-run the endpoint. The
        page says what the sample cannot support: it is a convenience sample, the scan measures one
        homepage per site, and a snapshot is not a trend.
      </p>
      <p>
        That does not make the study true by assertion. It makes it checkable, which is the most a
        publisher can offer. The same standard applies to a single sentence in a product page: if
        the number cannot survive the six questions above, it should be a qualitative statement
        instead.
      </p>

      <h2>Auditing a page's numbers</h2>
      <pre>{`# 1. Extract the numeric claims (rough; the rule's regex is broader)
curl -sS https://your-domain.com/page/ \\
  | sed 's/<[^>]*>/ /g' | grep -oE '[0-9]+([.,][0-9]+)? ?(%|x|\\$|€|£)?' | head -30

# 2. List the external authority links
curl -sS https://your-domain.com/page/ \\
  | grep -oE 'href="https?://[^"]+"' | grep -E 'arxiv\\.org|doi\\.org|nature\\.com|\\.gov|\\.edu|wikipedia\\.org|github\\.com' | sort -u

# 3. Follow one link and check the claim by hand
#    (the rule does not do this; a person has to)`}</pre>
      <p>
        Then read each number with the six questions in mind. If a figure has no denominator or no
        date, it is not a finding yet; it is a sentence with a digit in it. The fix is usually to
        restate the claim at the resolution the data supports, or to remove it.
      </p>

      <h2>What good citations buy — and what they do not</h2>
      <p>
        A sourced number is easier to quote because the quote can carry its own caveat; it is easier
        to defend because the source is one click away; and it is harder to misread because the
        denominator is in the same sentence. Those are real advantages in a medium where numbers get
        repeated without their context.
      </p>
      <p>
        What they do not buy is a citation guarantee, a ranking, or correctness by association. A
        link to a paper is not proof that the paper says what the page claims, and a scan cannot
        tell the difference. The only durable rule is the one this series keeps returning to:
        publish claims that a stranger can check, and say what they do not show.
      </p>
    </PostShell>
  );
}
