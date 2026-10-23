import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("nine-homepages-never-answered");
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
        title: "Questions about the nine",
        items: [
          {
            q: "Does a low score mean my site is blocking the scanner?",
            a: "Sometimes. Open the report and read the status code first: a 401, 403, 429, 202 or 520 means the number describes the response rather than your page. Only a 200 can produce a score that is about content.",
          },
          {
            q: "Why not delete the nine rows and report a clean average?",
            a: "Because deleting them would hide the most interesting finding in the sample, and the average would silently describe 21 pages while being presented as 30. The rows are published, flagged, and excluded from the mean.",
          },
          {
            q: "Is excluding them not just flattering the result?",
            a: "It raises the number from 44 to 62, so it is the less dramatic choice, not the flattering one. The rule is stated in advance: the mean is over pages that answered, because a 403 is not a page.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("six-news-publishers-blocking-ai-crawlers"),
          label: "Six news publishers, six blocking AI crawlers",
          note: "Three of these nine rows are news publishers, and the piece explains what they were declining.",
        },
        {
          href: insightPath("thirty-homepages-none-graded-a"),
          label: "We scanned 30 homepages and none graded an A",
          note: "The distribution this exclusion changes, and why the headline number is not 44.",
        },
      ]}
    >
      <p>
        Nine of the 30 homepages in the study never produced a page. The scanner asked, and got
        401, 403, 429, 202 or 520 back. Those rows are still in the published data, they still
        carry a score, and that score is a measurement of the error response rather than of the
        site.
      </p>
      <p>
        The exclusion is the methodological decision behind the study&rsquo;s headline number.
        Count the nine as zero and the average is 44; count them as unmeasured and it is 62. The
        second is the number this site publishes, and this piece is the argument for it —
        including the part where it makes the result look less dramatic. It is also a large
        correction: <strong>30%</strong> of the sample never produced a page, and excluding them
        moves the mean by 18 points, or <strong>29%</strong> of the published figure.
      </p>

      <h2>Which nine, and what did they answer?</h2>
      <p>
        Four status codes and one non-standard code account for all nine. Only two of the nine —{" "}
        <strong>22%</strong> — refused the crawler while serving a browser.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Homepage</th>
              <th>Status</th>
              <th>Same URL as a browser</th>
              <th>What the code says</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>bmw.com</td>
              <td>520</td>
              <td>520</td>
              <td>Edge error, not a standard code</td>
            </tr>
            <tr>
              <td>nytimes.com</td>
              <td>403</td>
              <td>403</td>
              <td>Forbidden to every client</td>
            </tr>
            <tr>
              <td>reuters.com</td>
              <td>401</td>
              <td>401</td>
              <td>Authentication required</td>
            </tr>
            <tr>
              <td>stackoverflow.com</td>
              <td>403</td>
              <td>403</td>
              <td>Forbidden to every client</td>
            </tr>
            <tr>
              <td>perplexity.ai</td>
              <td>403</td>
              <td>403</td>
              <td>Forbidden to every client</td>
            </tr>
            <tr>
              <td>google.com</td>
              <td>429</td>
              <td>429</td>
              <td>Too many requests</td>
            </tr>
            <tr>
              <td>amazon.com</td>
              <td>202</td>
              <td>202</td>
              <td>Accepted, no page returned</td>
            </tr>
            <tr>
              <td>zeit.de</td>
              <td>403</td>
              <td>200</td>
              <td>Refused the crawler only</td>
            </tr>
            <tr>
              <td>openai.com</td>
              <td>403</td>
              <td>200</td>
              <td>Refused the crawler only</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What does each status code actually mean here?</h2>
      <p>
        Four of the five codes describe a wall, and one describes a limit on the scanner. They
        are not interchangeable, and the fix is different for each. 403 is the dominant answer:{" "}
        <strong>five of the nine</strong> rows (<strong>56%</strong>) came back forbidden.
      </p>
      <ul>
        <li>
          <strong>401 — authentication required.</strong> The server wants credentials before it
          will answer. A paywall or a private origin produces this.
        </li>
        <li>
          <strong>403 — forbidden.</strong> The server understood the request and refused it.
          This is the ordinary shape of bot protection, and it is the code that most often
          hides a fixable configuration.
        </li>
        <li>
          <strong>429 — too many requests.</strong> This one is about the scanner, not the
          site: the request rate was limited, so the answer is a limit rather than a judgement
          of the page. It is published as such rather than dropped.
        </li>
        <li>
          <strong>202 — accepted, with no page.</strong> A 202 is an acknowledgement, not a
          document. There is nothing to score, which is why it is flagged as aborted rather
          than scored as thin content.
        </li>
        <li>
          <strong>520 — a non-standard edge error.</strong> It is emitted by Cloudflare when an
          origin returns something the edge cannot use. It is a failure to answer, not an
          answer.
        </li>
      </ul>

      <h2>Why does a 403 get a score at all?</h2>
      <p>
        Because the report has to show what happened, and a missing number would hide it. The
        score is computed from whatever came back, is flagged as aborted, and is excluded from
        the mean.
      </p>
      <p>
        This is the same principle as the study&rsquo;s publish-everything rule. The nine rows
        are the most interesting part of the sample: they show that <strong>30%</strong> of a
        list of well-known sites will not be read by a crawler on a first request, and that a
        tool which silently dropped them would report a tidy number about a smaller world.
      </p>

      <h2>What is the difference between refused and blocked?</h2>
      <p>
        Refused means the same URL served a browser-shaped request and turned away a
        crawler-shaped one. Blocked means the crawler was not admitted, by a
        <code>robots.txt</code> rule or by that refusal.
      </p>
      <p>
        The distinction is worth keeping because it is provable. Zeit and OpenAI are the two
        rows where the scan can demonstrate it: the identical URL answered 200 to one
        user-agent and 403 to another. Every other refusal in the table is a wall that applies
        to everybody, and calling it a crawler block would be an assumption rather than an
        observation.
      </p>

      <h2>How does the exclusion change the study&rsquo;s average?</h2>
      <p>
        It moves it from 44 to 62. Treating the nine as zero adds them to the denominator without
        adding the 142 points they scored, so the mean falls by 18.
      </p>
      <p>
        Both numbers are arithmetic on the same table. Only one of them is a statement about
        websites. A 403 page has no word count, no headings and no entity markup, and scoring
        it zero says the absence of a document is a badly made document.
      </p>

      <h2>What should I do if my own scan comes back with an error?</h2>
      <p>
        Read the status before reading the score. A non-200 is a configuration question, and no
        amount of content work will move it.
      </p>
      <ol>
        <li>
          Check whether a bot-protection rule is returning 403 to the user-agent the scanner
          sends. The <Link href="/docs/allow-ai-crawlers/">crawler guide</Link> lists the names.
        </li>
        <li>
          If the site is behind a login or a paywall, the scan cannot see it and the number is
          not about your content.
        </li>
        <li>
          If the status is 429, wait and re-run. That one is a limit, and re-running is the
          whole fix.
        </li>
        <li>
          Once a 200 is returned, the score becomes a list of things to change. Until then it is
          a report about a door.
        </li>
      </ol>

      <h2>Why publish the failures instead of only the wins?</h2>
      <p>
        Because a sample that only reports what it could read is a sample selected by
        accessibility, and the selection is the finding. The nine refusals are the evidence that
        crawler access is not a formality even for famous domains.
      </p>
      <p>
        It also keeps the method honest in a way a reader can audit: every row, including the
        ones that make the result worse, is at <Link href="/study/data/">the study data
        endpoint</Link>, and the rule set that produced the scores is on the{" "}
        <Link href="/methodology/">methodology page</Link>.
      </p>
    </PostShell>
  );
}
