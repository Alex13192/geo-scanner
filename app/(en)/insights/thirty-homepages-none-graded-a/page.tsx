import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("thirty-homepages-none-graded-a");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* Translated into Chinese on 2026-10-23; the pair is claimed on both pages. */
    languages: {
      en: `/insights/${insight.slug}/`,
      "zh-Hans": `/zh/insights/${insight.slug}/`,
      ja: `/ja/insights/${insight.slug}/`,
      "x-default": `/insights/${insight.slug}/`,
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
        title: "Questions about the study",
        items: [
          {
            q: "Does a score in the 60s mean a site will not be cited?",
            a: "No. The score measures whether a page is in a state that makes citation possible: crawlable, parseable, extractable. It does not measure whether any engine currently cites you, and no score can promise that.",
          },
          {
            q: "Why these 30 sites?",
            a: "They were chosen for recognisability across categories, not sampled at random. That makes the spread useful as an illustration and useless as an estimate of the web as a whole, which is stated on the study page.",
          },
          {
            q: "Can the run be reproduced?",
            a: "Yes. Every row is published at /study/data/ and every row can be re-scanned through the public API, so a disagreement can be settled by running the same request.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("nine-homepages-never-answered"),
          label: "Nine homepages never answered the crawler",
          note: "Why 9 of the 30 rows describe an error response rather than a page, and what that does to the average.",
        },
        {
          href: insightPath("entity-markup-gap"),
          label: "22 of 30 sites leave AI guessing who they are",
          note: "The single most common structural gap in the sample, and the four lines of JSON that close it.",
        },
      ]}
    >
      <p>
        On 3 October 2026 we ran the scanner over the homepages of 30 well-known sites, one
        request each, and scored the response against the 38 rules that existed at the time.
        None of them reached a grade A. The best was <strong>83</strong>, the average of the
        sites that answered was <strong>62</strong>, and the largest single group —
        <strong>16 of 30 (53%)</strong> — graded F.
      </p>
      <p>
        That result is easy to over-read in both directions. It does not mean the average
        website is badly built; these are not average websites. It also does not mean AI
        search is broken for everyone. What follows is the distribution behind the headline
        number, including the nine rows that never produced a page at all, because the shape
        of the spread is the finding and the single average is not.
      </p>

      <h2>What did the 30 sites actually score?</h2>
      <p>
        Two sites reached a B, four a C, eight a D and sixteen an F. Nothing reached the
        90-point band, which is the band this scanner calls an A.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Score band</th>
              <th>Sites</th>
              <th>Share of the 30</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A</td>
              <td>90–100</td>
              <td>0</td>
              <td>0%</td>
            </tr>
            <tr>
              <td>B</td>
              <td>80–89</td>
              <td>2</td>
              <td>7%</td>
            </tr>
            <tr>
              <td>C</td>
              <td>70–79</td>
              <td>4</td>
              <td>13%</td>
            </tr>
            <tr>
              <td>D</td>
              <td>60–69</td>
              <td>8</td>
              <td>27%</td>
            </tr>
            <tr>
              <td>F</td>
              <td>Below 60</td>
              <td>16</td>
              <td>53%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The top five, in order: salesforce.com at 83, siemens.com at 80, vercel.com at 79,
        cloudflare.com at 77 and stripe.com at 75. The bottom of the answered set is sap.com
        at 41, which is still a page that rendered and a score that measures it.
      </p>

      <h2>Why is a B the ceiling rather than a missing A?</h2>
      <p>
        Because points are spread across twelve weighted dimensions and an A needs almost all
        of them. The best page in the sample missed seven to nine points across several
        unrelated rules, not one big one.
      </p>
      <p>
        This is the part a single number hides. An engine that cannot read the page costs 16%
        of the score at once; a missing entity costs 12%; quotation and citation rules
        together cost another 11%. A site can be excellent on content and lose the A on
        markup, freshness and the two or three rules nobody has ever looked at.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Weight</th>
              <th>What it is asking</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AI crawler access</td>
              <td>16%</td>
              <td>Can the crawler fetch the page at all?</td>
            </tr>
            <tr>
              <td>Machine readability</td>
              <td>12%</td>
              <td>Is the markup parseable, and is there an entity?</td>
            </tr>
            <tr>
              <td>Content depth</td>
              <td>11%</td>
              <td>Is there enough text, and is it structured?</td>
            </tr>
            <tr>
              <td>Citability and evidence</td>
              <td>11%</td>
              <td>Are there figures, quotations and outside sources?</td>
            </tr>
            <tr>
              <td>Answer readiness</td>
              <td>10%</td>
              <td>Are headings question-shaped with short answers under them?</td>
            </tr>
            <tr>
              <td>Trust and authority</td>
              <td>10%</td>
              <td>Author, contact routes, sameAs, and a visible date.</td>
            </tr>
            <tr>
              <td>Semantic structure</td>
              <td>8%</td>
              <td>Headings, landmarks and a single H1.</td>
            </tr>
            <tr>
              <td>Metadata and discoverability</td>
              <td>7%</td>
              <td>Title, description, canonical, Open Graph.</td>
            </tr>
            <tr>
              <td>AI context files</td>
              <td>5%</td>
              <td>robots.txt signals and an llms.txt.</td>
            </tr>
            <tr>
              <td>Freshness</td>
              <td>5%</td>
              <td>A machine-readable date that is recent.</td>
            </tr>
            <tr>
              <td>International readiness</td>
              <td>3%</td>
              <td>Language and hreflang declarations.</td>
            </tr>
            <tr>
              <td>Delivery and mobile</td>
              <td>2%</td>
              <td>Viewport, payload, no JavaScript dependency.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What happens if the nine error responses are counted as zero?</h2>
      <p>
        The average falls from 62 to 44, and that second number is arithmetic rather than
        measurement. A 403 is not a badly built page; it is a site declining to answer, and
        scoring it zero would describe the decline as a content problem.
      </p>
      <p>
        So the study excludes those nine rows from the mean and keeps them in the table. Of
        the 30 requests, <strong>21 (70%)</strong> returned a page that could be scored. The
        other <strong>nine (30%)</strong> returned 401, 403, 429, 202 or 520. The distinction
        matters because the two failures need opposite responses: a low score on a page you
        served is a fix list, and a 403 is a decision about who you let in. That is the
        subject of its own piece, linked below.
      </p>

      <h2>What should a study of 30 homepages be trusted for?</h2>
      <p>
        It is a fixed sample, one page per site, read once, and it says nothing about the
        pages behind the homepage. Treat it as an illustration of how the checks behave on
        real sites, not as an estimate of the web.
      </p>
      <ul>
        <li>
          <strong>The sample is not random.</strong> 30 recognisable sites across 15
          categories were chosen, which is useful for recognition and not for statistics.
        </li>
        <li>
          <strong>One page per site.</strong> A homepage is often the least representative
          page on a site, and the scanner scores the URL it is given.
        </li>
        <li>
          <strong>The rule set has moved.</strong> The rows
          were collected under 38 rules; the scanner ships 40 today, and the study page says so
          rather than quietly re-scoring history.
        </li>
        <li>
          <strong>Nine rows are error responses.</strong> They are published, flagged, and
          excluded from the average, because deleting them would hide the most interesting
          finding in the set.
        </li>
      </ul>

      <h2>How do I find out where my own site lands?</h2>
      <p>
        Run the scan. It takes one request, needs no account, and returns the same checks the
        study used — with the evidence that produced each result rather than just a number.
      </p>
      <p>
        The useful comparison is not 83. It is the list of rules your page fails, because
        that list is actionable and 83 is not. If you want the full rows first, every one of
        the 30 is published at{" "}
        <Link href="/study/data/">the study data endpoint</Link>, and the method behind the
        scores is on the <Link href="/methodology/">methodology page</Link>.
      </p>
    </PostShell>
  );
}
