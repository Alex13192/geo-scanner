import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("cache-headers-what-an-auditor-sees");
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
        title: "Questions about cache headers",
        items: [
          {
            q: "Why did an audit see the old page after a deploy?",
            a: "Because a cache between the origin and the auditor was allowed to keep serving the old response. `s-maxage` and `stale-while-revalidate` are permission to do exactly that; the deploy changed the origin, not the copies already held by intermediaries.",
          },
          {
            q: "Is max-age=0 bad for performance?",
            a: "It costs a revalidation request, not a full download: with an ETag the answer is usually a 304. For HTML on a site whose accuracy is the product, that round trip is the correct trade. Static assets with content-hashed filenames keep their long cache.",
          },
          {
            q: "Does purging the CDN fix it?",
            a: "It helps, and it is best-effort: you cannot purge caches you do not control, including a reader's browser or a third-party audit tool's own cache. The durable fix is the header, so the copy is not allowed to age in the first place.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("sitemap-lastmod-false-freshness"),
          label: "Sitemap lastmod: why false freshness is worse than none",
          note: "The same disagreement between what the site says and what a reader receives.",
        },
        {
          href: insightPath("redirect-chains-and-crawler-budget"),
          label: "Redirect chains and crawler budget",
          note: "The other intermediary between the URL and the content.",
        },
        {
          href: "/methodology/",
          label: "The method",
          note: "What this site claims the published version is, and why staleness is a correctness issue here.",
        },
      ]}
    >
      <p>
        The page you see and the page an auditor sees are not necessarily the same response. Between
        the origin and the auditor sit a browser cache, a CDN, a framework cache, and sometimes the
        audit tool&rsquo;s own storage. Each one is allowed to keep a copy for as long as the cache
        headers say. When the headers say &quot;a day&quot;, a deploy does not change the copies that
        already exist.
      </p>
      <p>
        This site learned that the hard way on 2026-10-23: the origin was updated, and an external
        audit read an old version because the HTML headers permitted intermediaries to serve a stale
        copy. This article is about what those headers mean, what an auditor actually receives, and
        why the fix was to make HTML revalidate rather than to purge harder.
      </p>

      <h2>The layers between you and the reader</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>What it holds</th>
              <th>What controls it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Browser cache</td>
              <td>A copy on the reader&rsquo;s device.</td>
              <td><code>Cache-Control</code> (the <code>max-age</code> part).</td>
            </tr>
            <tr>
              <td>CDN / edge cache</td>
              <td>A copy at the nearest point of presence.</td>
              <td><code>s-maxage</code>, <code>stale-while-revalidate</code>, CDN rules.</td>
            </tr>
            <tr>
              <td>Framework cache</td>
              <td>A prerendered page held by the app runtime.</td>
              <td>Framework config and the response headers it emits.</td>
            </tr>
            <tr>
              <td>Audit tool</td>
              <td>Its own snapshot of what it fetched.</td>
              <td>Nothing you can set; it may not refetch on demand.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Only the first three are influenced by your headers, and the third-party tool is the one that
        reports what it saw. That asymmetry is the trap: you can verify the origin and still fail to
        verify the experience.
      </p>

      <h2>The directives that matter</h2>
      <ul>
        <li>
          <strong><code>max-age=N</code></strong> — a browser may reuse the response for N seconds
          without asking.
        </li>
        <li>
          <strong><code>s-maxage=N</code></strong> — a shared cache (CDN) may reuse it for N seconds.
          This is the directive that produces &quot;the deploy is live but the edge still serves the
          old page&quot;.
        </li>
        <li>
          <strong><code>stale-while-revalidate=N</code></strong> — a cache may serve the stale copy
          for N seconds while it revalidates in the background. It is a performance feature and a
          permission to be out of date.
        </li>
        <li>
          <strong><code>no-store</code></strong> — do not store the response at all. Correct for
          per-request pages and APIs.
        </li>
        <li>
          <strong><code>must-revalidate</code></strong> — once stale, the cache must check with the
          origin rather than serving the old copy.
        </li>
        <li>
          <strong><code>ETag</code> / <code>304</code></strong> — the cheap revalidation: a request
          comes in, the origin says &quot;unchanged&quot;, and the body is not resent.
        </li>
      </ul>

      <h2>What this site had, and what it changed</h2>
      <p>
        Before the fix, content HTML carried <code>s-maxage=86400</code> and{" "}
        <code>stale-while-revalidate=604800</code>. In plain terms: a shared cache could serve a
        copy for a day, and keep serving a stale copy for up to a week while revalidating. For a site
        whose product argument is &quot;the published version is the running version&quot;, that is
        the wrong trade. An external audit read a version that no longer matched the origin, and the
        report was written against the old page.
      </p>
      <p>
        The fix was to stop granting the permission. HTML now carries{" "}
        <code>public, max-age=0, must-revalidate</code>, and the ETag makes the revalidation a 304
        rather than a full response. <code>stale-while-revalidate</code> is gone from HTML
        entirely. Static assets under <code>/_next/static/</code> keep a long cache, which is correct
        because their filenames are content-hashed: a new build produces new URLs, so an old copy can
        never be the wrong version of a current URL.
      </p>
      <p>
        Per-request pages are the other direction: <code>/report/</code> is generated from the
        visitor&rsquo;s own domain and <code>/api/</code> returns live data, so both are{" "}
        <code>no-store</code>. Caching one visitor&rsquo;s scan and serving it to the next would be a
        correctness bug, not a performance trade.
      </p>

      <h2>What an auditor actually sees</h2>
      <p>
        &quot;I deployed it&quot; answers a question about the origin. The auditor&rsquo;s question is
        &quot;what did you receive, and when&quot;. The useful evidence is the response they got:
        status, <code>Cache-Control</code>, <code>Age</code>, <code>ETag</code>, and the content
        itself. A response with a large <code>Age</code> and an old title is an old copy, regardless
        of what the origin has now.
      </p>
      <pre>{`# 1. What headers does the deployed page return?
curl -sS -D - -o /dev/null https://your-domain.com/

# 2. Fetch twice and compare Age / ETag
curl -sS -D - -o /dev/null https://your-domain.com/ | grep -iE 'cache-control|age|etag|cf-cache-status'

# 3. Does the body contain the version marker you expect?
curl -sS https://your-domain.com/ | grep -oE '<title>[^<]+'`}</pre>
      <p>
        The second command is the one that distinguishes a cache hit from a fresh response. If an
        intermediary reports <code>HIT</code> with a growing <code>Age</code>, the response did not
        come from the origin; the origin&rsquo;s state is not what the reader saw.
      </p>

      <h2>The tests that keep it fixed</h2>
      <p>
        A header policy that is only written down drifts. This repository asserts the cache header in
        <code>check:live</code>, so a deploy that accidentally restores a long <code>s-maxage</code>{" "}
        on HTML fails the smoke check rather than waiting for an external report. The deploy also
        purges the edge on a best-effort basis, because a header change and a deploy can race with a
        copy that was already cached.
      </p>
      <p>
        The general lesson is worth stating separately from this site: tests that fetch the origin are
        not tests of what a reader receives. If the product claims a version is live, the test has to
        look at the response the way an outsider would, including the cache headers.
      </p>

      <h2>The trade, stated plainly</h2>
      <p>
        Revalidating HTML costs a round trip per view. Keeping static assets immutable costs nothing
        because their URLs change with the content. Caching per-request pages would be a correctness
        bug. The choice is not &quot;performance versus correctness&quot;; it is deciding which
        content can tolerate being old and for how long, and writing that decision into the headers
        instead of hoping the intermediary agrees.
      </p>
      <p>
        For a site that publishes a number, a score, or a date, &quot;old&quot; is a wrong answer.
        That is the whole reason the header changed.
      </p>
    </PostShell>
  );
}
