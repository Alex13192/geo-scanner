import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("refused-vs-blocked-waf-robots");
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
        title: "Questions about refused versus blocked",
        items: [
          {
            q: "What is the difference in one sentence?",
            a: "Blocked is a policy answer, usually a robots.txt Disallow; refused is a server answer, where a crawler-shaped request is rejected while the same URL serves a browser-shaped request. The first is fixed in a text file, the second in a WAF or application rule.",
          },
          {
            q: "Can a site be both?",
            a: "Yes. A site can disallow a token in robots.txt and also refuse crawler-shaped requests at the edge. The two are independent, and fixing one does not fix the other. That is why the scanner probes both the file and the request.",
          },
          {
            q: "What does the scanner do when both request shapes are refused?",
            a: "It scores the AI crawler access check 2 of 6 as unverified rather than failing the site. A refusal of both shapes is evidence about the scanning address, not about the site's policy toward crawlers, and it would be unfair to record it as a block.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("cloudflare-waf-ai-crawlers-403-meaning"),
          label: "Cloudflare WAF and AI crawlers: what a 403 actually means",
          note: "The mechanics of the 403: which layer refused, and how to test it.",
        },
        {
          href: insightPath("robots-txt-lines-that-block-ai-crawlers"),
          label: "Which robots.txt lines actually block AI crawlers",
          note: "The policy half: which rules and which tokens.",
        },
        {
          href: insightPath("nine-homepages-never-answered"),
          label: "Nine homepages never answered the crawler",
          note: "The 30-site sample's aborted rows, and why they were excluded from the average.",
        },
      ]}
    >
      <p>
        &quot;The AI crawler is blocked&quot; is three different findings wearing one sentence. A
        robots.txt rule says no. A server can refuse the request before the file is read. A response
        can fail for reasons that have nothing to do with either. The symptom — the engine does not
        cite the page — is identical; the fix is different in each case, and applying the wrong one
        is the most common waste in this category.
      </p>
      <p>
        This article is about the vocabulary the scanner uses, why the distinctions survive into the
        score, and how to tell which one you are looking at before editing anything.
      </p>

      <h2>Three words, three findings</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Finding</th>
              <th>What happened</th>
              <th>Where it is fixed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Blocked</strong></td>
              <td>A robots.txt group disallows the token from <code>/</code>, or the server refuses the crawler.</td>
              <td>The robots file for the policy case; the edge or application for the refusal case.</td>
            </tr>
            <tr>
              <td><strong>Refused</strong></td>
              <td>A crawler-shaped request is rejected while the same URL serves a browser-shaped request.</td>
              <td>A WAF rule, bot management, a rate limit or a user-agent rule — never robots.</td>
            </tr>
            <tr>
              <td><strong>Aborted</strong></td>
              <td>The response is not a 200, so any score describes that response rather than the page.</td>
              <td>Whatever produced the status: the origin, the edge, or the scan itself.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The words overlap in casual use and do not overlap in the scanner. <em>Blocked</em> is the
        umbrella the score uses for "this crawler cannot read the site, by policy or by refusal".{" "}
        <em>Refused</em> is the narrower and more interesting case: the refusal happens before
        robots.txt is consulted, so no robots edit can change it, and it catches every engine because
        they all identify as bots. <em>Aborted</em> says the number is about an error response, not a
        page — the reason the 30-site study reports nine rows separately instead of counting them as
        zero.
      </p>

      <h2>What the 30-site sample found</h2>
      <p>
        The published dataset is small and specific: 30 homepages, one scan, 3 October 2026. In those
        rows, nine carry <code>blocked: true</code>. Of those nine, <strong>seven</strong> are
        robots.txt policy — a group that disallows an AI token — and <strong>two</strong> are server
        refusals, where the crawler-shaped request was rejected and the browser-shaped request to the
        same URL was served. Nine rows are also <code>aborted</code>, a non-200 response, and the two
        sets overlap.
      </p>
      <p>
        The overlap is the lesson. A single row can be blocked by policy and aborted at the same
        time; the count of blocked rows is not the count of robots.txt problems, and the count of
        aborted rows is not the count of sites that hate crawlers. The dataset keeps the three
        booleans separate precisely so a reader can ask which mechanism produced the finding.
      </p>

      <h2>Why the difference changes the score</h2>
      <p>
        The access rule is{" "}
        <Link href="/checks/robots-ai-allowed/">robots-ai-allowed</Link>, worth 6 points. If a token
        is disallowed, the rule fails. If the server refuses identified crawlers while serving
        browsers, the rule fails under the companion name{" "}
        <Link href="/checks/robots-ai-allowed/">robots-ai-blocked</Link>, so the blocked agents
        appear in the finding. But if both request shapes are refused, the refusal is about the
        scanning address rather than the site, and the rule scores 2 of 6 as{" "}
        <strong>unverified</strong> instead of failing.
      </p>
      <p>
        That third branch exists because the alternative is unfair: a scanner that cannot reach a
        site from its own network should not report the site as hostile to AI. The cost is that
        &quot;unverified&quot; is not a pass either — the page has not been shown to work, and a
        reader should treat it as an open question, not a green tick.
      </p>

      <h2>How the wrong diagnosis happens</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>What you see</th>
              <th>What it is often mistaken for</th>
              <th>What it actually is</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>403 to a crawler, 200 to a browser</td>
              <td>&quot;robots.txt is blocking us&quot;</td>
              <td>A refusal before robots is read; edit the WAF, not the file.</td>
            </tr>
            <tr>
              <td>A robots Disallow, requests 200</td>
              <td>&quot;the WAF is blocking AI&quot;</td>
              <td>A policy block; the server is happy to serve, the file says no.</td>
            </tr>
            <tr>
              <td>Both shapes refused</td>
              <td>&quot;the site blocks AI&quot;</td>
              <td>Possibly a geo/IP or rate-limit policy; test from another network.</td>
            </tr>
            <tr>
              <td>200 with an empty body</td>
              <td>&quot;the crawler is blocked&quot;</td>
              <td>Client-rendered content; the response arrived, the text did not.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The third row is the one that produces the 2-of-6 unverified verdict. The fourth is a
        different article: a 200 is not evidence that the page was read.
      </p>

      <h2>Telling them apart, in order</h2>
      <pre>{`# 1. Read the policy
curl -sS https://your-domain.com/robots.txt

# 2. Crawler-shaped request
curl -sS -o /dev/null -D - -A "GPTBot" https://your-domain.com/

# 3. Browser-shaped control
curl -sS -o /dev/null -D - -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36" https://your-domain.com/

# 4. If both are refused, repeat from another network before concluding anything`}</pre>
      <p>
        Read the results in this order. If the file disallows the token, the finding is policy, even
        if the request also happens to be refused. If the file allows it and the crawler is refused
        while the browser is served, the finding is a refusal. If both are refused, the finding is
        about the network until proven otherwise.
      </p>

      <h2>What not to conclude</h2>
      <p>
        A 403 is not evidence of a deliberate AI policy. A missing robots.txt is not permission. A
        passed robots check is not proof that an engine can read the page. The scanner publishes
        these sentences because the inverse mistakes are common and expensive: a team edits a robots
        file that was never consulted, or removes a WAF rule that was doing its job, because the
        finding was not read carefully.
      </p>
      <p>
        The vocabulary is the whole point. Once the finding has a name, the fix has a location.
      </p>
    </PostShell>
  );
}
