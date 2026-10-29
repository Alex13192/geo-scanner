import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { SITE_HOST, SITE_URL } from "@/lib/site";
import { social } from "@/lib/og";

const insight = getInsight("redirect-chains-and-crawler-budget");
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
        title: "Questions about redirect chains",
        items: [
          {
            q: "Does a redirect pass link signals?",
            a: "A permanent redirect is generally treated as a move and the signals are expected to follow it. That is not a guarantee, and it is not a reason to accept chains: every hop is another request and another chance for a crawler to stop following.",
          },
          {
            q: "What is the difference between 301 and 308?",
            a: "Both are permanent. 308 preserves the request method and body, which matters for non-GET requests; 301 is the familiar choice for page moves. Neither changes the cost of the hop.",
          },
          {
            q: "Should I keep redirects forever?",
            a: "Keep them as long as the old URL can still receive traffic: links, ads, printed materials, other people's pages. A redirect that is removed while inbound links still exist turns a working path into a 404.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("canonical-urls-split-citations"),
          label: "Canonical URLs: the mistakes that split citations",
          note: "The other head-level instruction that has to agree with the redirect target.",
        },
        {
          href: insightPath("refused-vs-blocked-waf-robots"),
          label: "Refused vs blocked: telling WAF from robots.txt",
          note: "Another case where the status code is a finding that has to be read correctly.",
        },
        {
          href: insightPath("sitemap-lastmod-false-freshness"),
          label: "Sitemap lastmod: why false freshness is worse than none",
          note: "The sitemap should list final URLs, not the ones that redirect to them.",
        },
      ]}
    >
      <p>
        One redirect is cheap: a request, a status, a location, and a second request. A chain of
        four is four chances to lose a crawler, four round trips before any content is read, and a
        set of links that point at addresses the site no longer considers canonical. Every hop looks
        insignificant in isolation, which is why chains accumulate.
      </p>
      <p>
        This article is about what a redirect costs a crawler, the shapes that produce chains, and
        how to measure the chain you have. It uses this site&apos;s own redirects as the worked
        example, because they are deliberately one hop each.
      </p>

      <h2>What a redirect costs</h2>
      <p>
        A redirect is a complete request that returns no content. For a person, it is a flash of
        latency. For a crawler, it is a request spent on a URL that produced no page, plus a second
        request for the target. A chain of N redirects costs N requests before the content request,
        and each one is an opportunity for a timeout, a loop, or a hop limit.
      </p>
      <p>
        Most crawlers cap how many redirects they will follow in one fetch. The number varies; the
        practical rule does not: the safe design is one hop to the final URL. That is also the only
        design whose cost does not grow when the site moves again.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Meaning</th>
              <th>Right use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>301</td>
              <td>Permanent move.</td>
              <td>The page will not come back at the old URL.</td>
            </tr>
            <tr>
              <td>308</td>
              <td>Permanent move, method preserved.</td>
              <td>Non-GET requests that must keep their method.</td>
            </tr>
            <tr>
              <td>302 / 307</td>
              <td>Temporary move.</td>
              <td>A/B tests, maintenance, short-lived gateways.</td>
            </tr>
            <tr>
              <td>Meta refresh / JS redirect</td>
              <td>A page that moves itself.</td>
              <td>Last resort; some crawlers and agents do not execute it.</td>
            </tr>
            <tr>
              <td>410</td>
              <td>Gone.</td>
              <td>The content is intentionally removed and should not be replaced.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>The shapes that produce chains</h2>
      <ul>
        <li>
          <strong>The protocol, host and slash stack.</strong> <code>http</code> to{" "}
          <code>https</code>, then <code>www</code> to apex, then a missing trailing slash. Three
          hops where one would do, and the third is often added by a framework rather than a person.
        </li>
        <li>
          <strong>The legacy domain.</strong> A site moves to a new domain and redirects the old
          domain to the new homepage, but the old deep links redirect to old paths that then redirect
          again. The old domain should map directly to the final path.
        </li>
        <li>
          <strong>The temporary redirect left in place.</strong> A 302 from a migration becomes
          permanent in practice, and a chain builds on top of it.
        </li>
        <li>
          <strong>The redirect to a canonical that redirects.</strong> The redirect target is not the
          final URL; the canonical disagrees with the redirect; the crawler follows to a third
          address.
        </li>
        <li>
          <strong>The UA-specific redirect.</strong> A mobile or bot-specific branch sends crawlers
          somewhere different from people, which is both a chain and a cloaking risk.
        </li>
        <li>
          <strong>The loop.</strong> A to B, B to A. Easy to create with two rules that each think
          they are normalizing the other.
        </li>
      </ul>

      <h2>How this site does it</h2>
      <p>
        The proxy has a small table of legacy paths and one rule for each, and every rule targets the
        final URL rather than an intermediate one. On 2026-10-29 I measured five of them with a
        redirect count:
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Starting URL</th>
              <th>Hops</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>http://{SITE_HOST}/</code></td>
              <td>1</td>
              <td><code>{SITE_URL}/</code></td>
            </tr>
            <tr>
              <td><code>the legacy hostname/</code></td>
              <td>1</td>
              <td><code>{SITE_URL}/</code></td>
            </tr>
            <tr>
              <td><code>/insights/</code></td>
              <td>1</td>
              <td><code>/blog/</code></td>
            </tr>
            <tr>
              <td><code>/zh/zh/report/?domain=example.com</code></td>
              <td>1</td>
              <td><code>/zh/report/?domain=example.com</code></td>
            </tr>
            <tr>
              <td><code>/checks/robots-ai-blocked/</code></td>
              <td>1</td>
              <td><code>/docs/allow-ai-crawlers/</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        One of the five is a doubled-locale URL that was published by mistake, one is an alias in the
        catalogue, one is a path that moved when the writing path changed, one is a protocol
        upgrade, and one is a hostname the site used before it had a domain. They are different
        stories with the same target property: each goes straight to the final URL.
      </p>
      <p>
        The test suite asserts the exact status and destination for each. That is not decoration: a
        redirect is a promise, and a promise that is not tested drifts the first time a rule is
        reordered.
      </p>

      <h2>Measuring a chain</h2>
      <pre>{`# 1. Hops and final URL for one address
curl -sS -L -o /dev/null -w "%{http_code} %{num_redirects} %{url_effective}\\n" \\
  http://your-domain.com/old-path/

# 2. Each individual hop, in order
curl -sS -L -o /dev/null -D - http://your-domain.com/old-path/ \\
  | grep -iE "^HTTP/|^location:"

# 3. Find internal links that still point at legacy URLs
curl -sS https://your-domain.com/ | grep -oE 'href="[^"]+"' \\
  | grep -E 'geo-scanner|/insights/|/zh/zh/'

# 4. Check the sitemap lists final URLs, not redirectors
curl -sS https://your-domain.com/sitemap.xml | grep -c '<loc>'`}</pre>
      <p>
        The third command is the one that prevents chains from coming back. A redirect is for
        addresses the site cannot edit — other people&apos;s links, old emails, printed material. An
        internal link should point at the final URL directly; otherwise the site pays the hop on
        every crawl and every click.
      </p>

      <h2>Batching redirects into one hop</h2>
      <p>
        The fix is mechanical once the chain is measured: every rule should target the final URL, not
        the next rule&rsquo;s source. If a legacy host redirects to the apex, the legacy deep paths
        should map to the apex deep paths in the same rule rather than to the old deep paths. If
        http and www and slash normalization are separate branches, they should collapse into one
        computed target.
      </p>
      <p>
        Two cautions. First, do not remove a redirect just because a chain is gone; keep it as long
        as the old address can receive traffic. Second, do not build UA-specific redirects to solve
        a bot problem — that is how a redirect becomes a cloaking question.
      </p>

      <h2>What redirects do not buy</h2>
      <p>
        A clean redirect does not guarantee the target is crawled or cited, and a redirect does not
        make the old URL&apos;s content relevant again. It preserves the path: a link that worked,
        a bookmark that resolves, a crawler that reaches the page in one request instead of four.
        That is a maintenance property, and it is worth keeping even when nothing is measured.
      </p>
      <p>
        The standard from the rest of this series applies: make the path one hop, make it tested, and
        make the site&apos;s internal links stop depending on it.
      </p>
    </PostShell>
  );
}
