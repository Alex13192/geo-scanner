import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("six-news-publishers-blocking-ai-crawlers");
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
        title: "Questions about the news publishers",
        items: [
          {
            q: "Is blocking GPTBot the same as blocking Google Search?",
            a: "No. Search indexing and the AI crawler controls are separate user-agents, so a publisher can keep the search crawler and turn the AI ones away. The scanner reports each tracked crawler separately for that reason.",
          },
          {
            q: "Did blocking make their scores low?",
            a: "Partly, and by design: the tracked-crawler rule sits inside the dimension worth 16% of the score. But three of the six also returned an error to the crawler, which means their numbers measure the refusal rather than a page.",
          },
          {
            q: "Should a small site copy them?",
            a: "Only if you have decided you do not want citations. A publisher negotiating a licence is trading reach for money; a site with no such deal is trading reach for nothing, which is a different decision.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("nine-homepages-never-answered"),
          label: "Nine homepages never answered the crawler",
          note: "The status codes behind three of these six, and why a 403 is not a measurement of a page.",
        },
        {
          href: insightPath("thirty-homepages-none-graded-a"),
          label: "We scanned 30 homepages and none graded an A",
          note: "The full distribution these six rows sit inside.",
        },
      ]}
    >
      <p>
        Six of the 30 homepages in the study are news publishers — <strong>20%</strong> of the
        sample — and every one of them turns at least one tracked AI crawler away. Three of the
        six disallow the crawlers in <code>robots.txt</code> while still serving the page; a
        fourth refuses the crawler at the edge while serving the same URL to a browser; and two
        answer every request, crawler or browser, with 401 or 403.
      </p>
      <p>
        The news half is also the densest part of a wider finding: <strong>9 of the 30</strong>{" "}
        sites (<strong>30%</strong>) block at least one tracked crawler, and all six news sites
        are among them.
      </p>
      <p>
        The interesting question is not whether they block — they clearly do — but what the
        block costs them in this measurement and whether that cost is a mistake. For a
        publisher negotiating a content licence, it may be the price of the negotiation. For
        a site that has never had that conversation, it is usually just a setting nobody
        looked at.
      </p>

      <h2>Which six publishers, and what did each one return?</h2>
      <p>
        Three answered with a 200 and a <code>robots.txt</code> that disallows a tracked
        crawler. One answered the crawler with a 403 and a browser with a 200. Two answered
        everything with 401 or 403.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Homepage</th>
              <th>Status returned</th>
              <th>Tracked crawler admitted?</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>bbc.com</td>
              <td>200</td>
              <td>No — robots.txt</td>
              <td>61</td>
            </tr>
            <tr>
              <td>spiegel.de</td>
              <td>200</td>
              <td>No — robots.txt</td>
              <td>56</td>
            </tr>
            <tr>
              <td>theguardian.com</td>
              <td>200</td>
              <td>No — robots.txt</td>
              <td>47</td>
            </tr>
            <tr>
              <td>zeit.de</td>
              <td>403 to the crawler, 200 to a browser</td>
              <td>No — refused at the edge</td>
              <td>26</td>
            </tr>
            <tr>
              <td>nytimes.com</td>
              <td>403</td>
              <td>No — robots.txt</td>
              <td>12</td>
            </tr>
            <tr>
              <td>reuters.com</td>
              <td>401</td>
              <td>No — robots.txt</td>
              <td>12</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Three of the six decline at the policy layer while still serving a page. Zeit declines
        at the edge, which is the harder kind: no <code>robots.txt</code> line can express it
        and no crawler can negotiate it. The last two do not serve a page to anybody, so their
        scores describe the refusal rather than a page.
      </p>

      <h2>What is the difference between a policy block and a refusal?</h2>
      <p>
        A policy block is a statement. The page is served, <code>robots.txt</code> says which
        agents may not use it, and a well-behaved crawler complies.
      </p>
      <p>
        A refusal is a wall. The server returns 401, 403 or 429 to the request itself, so the
        crawler never sees the content and never gets to consider the policy. The scanner keeps
        them as two fields — <code>blocked</code> and <code>refused</code> — because they need
        opposite fixes. One is a line to edit; the other is a rule in a CDN or a WAF
        configuration, often in a different system owned by a different team.
      </p>
      <p>
        Zeit is the clean example of the second kind: the same URL answered a browser-shaped
        request with a 200 and a crawler-shaped request with a 403. That is a block that
        happens before <code>robots.txt</code> matters, and it is the one configuration in the
        sample that can be proved from the outside by changing nothing but the user-agent.
      </p>

      <h2>What does blocking cost a publisher in this measurement?</h2>
      <p>
        The tracked-crawler rule lives inside AI crawler access, the heaviest dimension at 16% of
        the score. A site that turns away one tracked crawler cannot pass that dimension in full,
        so the ceiling on its total drops before content is considered at all. For scale: content
        depth is worth 11% and trust 10%, so a block costs more than the whole content dimension.
      </p>
      <p>
        The measured effect is visible: the three publishers that served a page scored 61, 56
        and 47, all below the study average of 62 for the sites that answered. That is not
        proof of causation — these are three large, complex homepages and they fail other
        checks too — but it is consistent with a penalty that is structural rather than
        editorial.
      </p>

      <h2>Is blocking the crawlers a mistake?</h2>
      <p>
        For a large publisher, probably not, and it is not this site&rsquo;s place to call it
        one. Six of six is a pattern rather than six coincidences, but a single homepage scan
        cannot tell a licensing strategy apart from a paywall, a bot-protection rule or a
        robots file copied from a template.
      </p>
      <p>
        The trade is legible. Being readable by ChatGPT, Claude, Perplexity and Doubao is how
        a publisher gets quoted, and a quote is a distribution channel. Turning the crawlers
        away gives up that channel in exchange for leverage in a licensing negotiation, or in
        exchange for nothing at all if no negotiation exists. Which of those two situations a
        given site is in is not something a scan can see.
      </p>
      <p>
        The distinction that matters for everyone else: a small site that blocks the crawlers
        is usually not running a licensing strategy. It copied a template, or inherited a WAF
        rule, or added a blanket bot block during a scraping incident and never revisited the
        user-agent list. That is the case worth checking, and the{" "}
        <Link href="/docs/allow-ai-crawlers/">robots.txt and WAF guide</Link> is the one that
        walks through it.
      </p>

      <h2>What should a site owner check first?</h2>
      <p>
        Read <code>robots.txt</code> for the crawler names, then ask whether the edge agrees
        with it. The two can disagree, and the disagreement is invisible in a browser.
      </p>
      <ol>
        <li>
          Look for <code>GPTBot</code>, <code>ClaudeBot</code>, <code>PerplexityBot</code> and
          <code>Bytespider</code> in <code>robots.txt</code>. A <code>Disallow: /</code> under
          any of them is a policy block.
        </li>
        <li>
          Check whether a bot-protection rule returns 403 to these user-agents. The scan reports
          this as a refusal rather than a policy block, which is the only way to tell them
          apart from outside.
        </li>
        <li>
          Decide deliberately. A block you chose and can name is different from one you
          inherited and cannot explain.
        </li>
      </ol>

      <h2>How is this measured, and what can the number not tell you?</h2>
      <p>
        The scanner compares two requests to the same URL: one crawler-shaped, one
        browser-shaped. A difference between them is a refusal; a <code>robots.txt</code>
        match is a policy block; everything else is scored as a page.
      </p>
      <p>
        What it cannot see is intent or a contract. It does not know whether a publisher has a
        licensing deal, and it does not fetch the crawler&rsquo;s own logs to check whether a
        block was honoured. It measures the public state of the front door, which is the
        correct scope for a tool that has to work on any domain in one request.
      </p>
    </PostShell>
  );
}
