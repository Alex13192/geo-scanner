import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("cloudflare-waf-ai-crawlers-403-meaning");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English first; the translation adds its own hreflang keys when it ships. */
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
        title: "Questions about 403s and AI crawlers",
        items: [
          {
            q: "Is a 403 always a block?",
            a: "No. It means the request was understood and refused, but the reason can be a WAF rule, bot management, a rate limit, a geo policy or the origin application itself. The useful distinction is whether the same URL answers a browser-shaped request, and whether the response carries a Cloudflare challenge marker.",
          },
          {
            q: "Does fixing robots.txt fix a 403?",
            a: "No. robots.txt is fetched after the request is served; a refusal at the edge happens before the file is read. If the crawler-shaped request is refused and the browser-shaped one succeeds, the file is not the cause and editing it cannot help.",
          },
          {
            q: "Should I allow AI crawlers through my WAF?",
            a: "That is a policy decision, not a technical one. If you want the answer surfaces to read your pages, the crawl tokens need a path through the edge. If you do not, blocking is a legitimate choice with a measurable cost, and it is worth documenting it as a decision rather than discovering it as a side effect.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("robots-txt-lines-that-block-ai-crawlers"),
          label: "Which robots.txt lines actually block AI crawlers",
          note: "The other half of the same problem: a rule in the file versus a refusal before the file.",
        },
        {
          href: insightPath("nine-homepages-never-answered"),
          label: "Nine homepages never answered the crawler",
          note: "What refusal looked like in the 30-site sample, and why those rows were excluded from the average.",
        },
        {
          href: "/checks/robots-ai-allowed/",
          label: "The rule this article explains",
          note: "The exact pass condition, including the 2-of-6 unverified case when the scan itself is refused.",
        },
      ]}
    >
      <p>
        A 403 is the most misread status code in this category. It gets filed as "robots.txt
        blocked the AI crawler", the robots file gets edited, and nothing changes — because the
        request was refused before the file was ever read. The two failures look identical from
        the outside: the engine does not cite the page. They have different causes, different
        fixes, and different owners.
      </p>
      <p>
        This article is about telling them apart when a CDN or WAF sits in front of the origin,
        with Cloudflare as the worked example because it is the common case for sites like this
        one. The method generalises: make the same request twice with different User-Agents, read
        the response headers, and only then decide what to change.
      </p>

      <h2>Where a 403 can come from</h2>
      <p>
        A request to a site behind a CDN passes through several layers before your application
        runs. Each layer can answer with 403, and each has a different fix.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Typical signal</th>
              <th>What changes it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>WAF custom rule</td>
              <td>403 with the CDN&rsquo;s server header; rule name in the dashboard</td>
              <td>The rule expression, scope or skip action</td>
            </tr>
            <tr>
              <td>Bot management</td>
              <td>403 or a challenge page; <code>cf-mitigated</code> header on challenges</td>
              <td>Bot mode settings, verified-bot handling, exceptions</td>
            </tr>
            <tr>
              <td>Rate limiting</td>
              <td>429, sometimes 403 on older configurations</td>
              <td>Thresholds and paths, not robots.txt</td>
            </tr>
            <tr>
              <td>Geo or IP policy</td>
              <td>403 from the edge for every UA from a region</td>
              <td>The policy itself; a different network can confirm it</td>
            </tr>
            <tr>
              <td>Origin application</td>
              <td>403 with your app&rsquo;s own body or headers, CDN usually passes it through</td>
              <td>The application&rsquo;s auth or filtering logic</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The practical question is not "which layer is it" at first — it is "is the refusal aimed at
        the crawler, or at the request in general". That question has a one-command answer.
      </p>

      <h2>The one test that separates crawler-targeted from general refusal</h2>
      <p>
        Send the same request twice: once with the crawler&rsquo;s User-Agent, once with a browser
        User-Agent. Keep everything else identical, including the path and any cookies you have.
      </p>
      <pre>{`# crawler-shaped request
curl -sS -o /dev/null -D /tmp/crawler.headers \\
  -A "GPTBot" https://your-domain.com/

# browser-shaped control
curl -sS -o /dev/null -D /tmp/browser.headers \\
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \\
      (KHTML, like Gecko) Chrome/126.0 Safari/537.36" https://your-domain.com/

# compare
grep -iE "^HTTP/|^cf-mitigated:|^server:|^cf-ray:" /tmp/crawler.headers
grep -iE "^HTTP/|^cf-mitigated:|^server:|^cf-ray:" /tmp/browser.headers`}</pre>
      <p>
        Reading it:
      </p>
      <ul>
        <li>
          <strong>200 / 200.</strong> The crawler is not refused. If it still is not cited, the
          cause is elsewhere — parsing, content, or the engine&rsquo;s own choices — and this is
          the wrong file to edit.
        </li>
        <li>
          <strong>403 / 200.</strong> The refusal is aimed at identified crawlers. That is a WAF,
          bot-management or user-agent rule, not robots.txt. The fix is an exception for the
          crawler tokens you want to admit, and it has a real security cost that should be
          weighed.
        </li>
        <li>
          <strong>403 / 403.</strong> The request is refused regardless of its identity. The
          likely causes are a geo/IP policy, a site-wide WAF rule, or a rate limit that the test
          itself triggered. Test again from another network before changing anything.
        </li>
        <li>
          <strong>429 in either.</strong> Rate limiting. Wait and retry; a crawler hitting the
          same limit is a capacity or rule problem, not a robots.txt one.
        </li>
        <li>
          <strong>503 or a challenge HTML page.</strong> Bot management is challenging the
          request. A 200 with a JavaScript challenge body is not a readable page for a crawler
          that does not execute JavaScript, even though the status looks fine.
        </li>
      </ul>

      <h2>Reading the Cloudflare headers</h2>
      <p>
        Two headers carry most of the signal on Cloudflare. <code>cf-ray</code> identifies the
        edge request, which is useful when comparing what you saw with what the origin logged.
        <code>cf-mitigated</code> is set on responses produced by Cloudflare&rsquo;s mitigation
        features; a challenge typically carries <code>cf-mitigated: challenge</code>, and other
        block responses are marked as blocked. Seeing it tells you the response was produced at
        the edge, not by your application.
      </p>
      <p>
        The absence of <code>cf-mitigated</code> is not proof that the origin answered. Some WAF
        actions and custom rules produce plain 403s. That is why the browser-shaped control request
        matters more than any single header: it distinguishes identity-based refusal from a
        broader policy, which is the decision you actually have to make.
      </p>

      <h2>What the refusal does to a scan</h2>
      <p>
        The LLMention scanner treats this case explicitly rather than guessing. When the homepage
        refuses a crawler-shaped request, it repeats the URL with a browser-shaped User-Agent. If
        that second request is served, the refusal is aimed at identified crawlers and the AI
        crawler access check fails under{" "}
        <Link href="/docs/allow-ai-crawlers/">the blocked outcome</Link>. If both requests are
        refused, the refusal is about the scanning address rather than the site, and the check
        scores 2 of 6 as unverified instead of failing a site for somebody else&rsquo;s network
        policy.
      </p>
      <p>
        The published rule states this in the same words: robots.txt that says nothing is not
        permission if the request is rejected before the file is read. That is why the two-probe
        test is part of the rule rather than a footnote in a blog post.
      </p>

      <h2>If the block is intentional</h2>
      <p>
        Blocking AI crawlers can be a legitimate decision — the sample of news publishers in the
        study does it deliberately, and the article on that sample describes the trade honestly.
        The problem is not the block; it is an accidental block that nobody chose, discovered only
        when a citation does not happen and attributed to the wrong cause.
      </p>
      <p>
        If the block is deliberate, write it down: which tokens, at which layer, from when, and
        what you expect it to cost. A one-line comment in the repository next to the WAF change
        is enough. If it is accidental, the fix depends on the layer: bot-management modes
        sometimes need a different mode rather than an exception, WAF rules need a scope change,
        and user-agent allowlists are weak on their own because the header is trivially spoofed.
        Prefer verified-bot handling or IP-based identity where the CDN offers it, and keep the
        exception as narrow as the policy allows.
      </p>

      <h2>What to do next</h2>
      <ol>
        <li>Run the two-command probe above and record the status pairs.</li>
        <li>
          If both are refused, test from another network; if the second network is served, the
          policy is about geography or address, not about your site.
        </li>
        <li>
          If only the crawler is refused, decide whether that was intended. If not, narrow the
          exception to the tokens you want, and re-run the probe.
        </li>
        <li>
          Re-scan the site and confirm the AI crawler access dimension moved from blocked or
          unverified to passed — or record why it is blocked on purpose.
        </li>
      </ol>
      <p>
        A 403 is not a verdict about your content. It is a statement about the path the request
        took. Reading the right path is the difference between a five-minute fix and an afternoon
        spent editing a file that was never consulted.
      </p>
    </PostShell>
  );
}
