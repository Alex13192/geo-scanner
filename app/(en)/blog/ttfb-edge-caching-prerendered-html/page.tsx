import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("ttfb-edge-caching-prerendered-html");
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
        title: "Questions about TTFB and prerendering",
        items: [
          {
            q: "If a page is prerendered, why does every request still render it?",
            a: "Prerendering happens at build time; serving it from a cache happens at request time, and those are separate. A Worker response is not cached by the CDN automatically, and a max-age=0, must-revalidate header tells caches to revalidate. The observed x-nextjs-cache: MISS on repeated requests says the route is being rendered rather than served from a persistent cache.",
          },
          {
            q: "Is a higher TTFB a GEO problem?",
            a: "Not directly. It is a delivery problem: slower responses cost user experience and can hit crawler timeouts, but no engine has published a TTFB threshold for citation. Treat it as part of the delivery dimension, not a ranking switch.",
          },
          {
            q: "Should I cache HTML at the edge to fix it?",
            a: "Only with an explicit staleness policy. If the cache rule ignores the origin's max-age=0, the site can serve a page older than the deploy, which is the incident this site already had. A short TTL plus purge-on-deploy is a trade, not a free win.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("cache-headers-what-an-auditor-sees"),
          label: "Cache headers and what an auditor actually sees",
          note: "Why max-age=0 came first, and what it costs.",
        },
        {
          href: insightPath("redirect-chains-and-crawler-budget"),
          label: "Redirect chains and crawler budget",
          note: "The other per-request cost between a URL and its content.",
        },
        {
          href: "/methodology/",
          label: "The method",
          note: "Where delivery sits among the twelve dimensions.",
        },
      ]}
    >
      <p>
        &quot;The page is prerendered&quot; is a statement about the build. It does not say what
        happens when a request arrives: whether an edge cache has a copy, whether the app runtime
        serves one, or whether the page is rendered again for every visitor. Those are deployment
        questions, and they show up in one number — time to first byte — and one header, the cache
        status.
      </p>
      <p>
        This article measures both on this site, explains why a prerendered page can still be
        rendered on every request, and lays out the trade between correctness and TTFB. It also says
        plainly that TTFB is not a citation signal.
      </p>

      <h2>What the numbers mean</h2>
      <ul>
        <li>
          <strong>TTFB</strong> — time from the request to the first byte of the response. On a
          server-rendered page it includes routing, data, rendering and network; on a cached page it
          is mostly network.
        </li>
        <li>
          <strong>Total time</strong> — TTFB plus the transfer. For a small HTML page the gap is
          usually the network, not the server.
        </li>
        <li>
          <strong><code>x-nextjs-cache</code></strong> — the framework&rsquo;s own cache status.{" "}
          <code>HIT</code> means a stored render was served; <code>MISS</code> means it was rendered.
        </li>
        <li>
          <strong><code>cf-cache-status</code> / <code>Age</code></strong> — the CDN&rsquo;s view:
          whether the edge held the response and for how long.
        </li>
      </ul>

      <h2>A measurement on this site</h2>
      <p>
        On 2026-10-29 I requested four URLs three times each from one network and recorded TTFB and
        total time. The numbers are network-bound — a reader in another region will see different
        absolutes — but the shape is the point.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>TTFB (s, 3 runs)</th>
              <th>Total (s, 3 runs)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>/</code></td>
              <td>1.99, 2.40, 1.54</td>
              <td>3.36, 4.42, 2.64</td>
            </tr>
            <tr>
              <td><code>/blog/cache-headers-what-an-auditor-sees/</code></td>
              <td>1.96, 0.75, 1.63</td>
              <td>2.80, 5.31, 2.63</td>
            </tr>
            <tr>
              <td><code>/pricing/</code></td>
              <td>3.79, 1.98, 1.15</td>
              <td>5.03, 2.84, 1.88</td>
            </tr>
            <tr>
              <td><code>/report/?domain=example.com</code></td>
              <td>1.32, 2.70, 0.89</td>
              <td>1.73, 3.04, 1.40</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        TTFB ranges from roughly 0.75 to 3.8 seconds, and the same URL varies by more than a second
        between runs. The headers explain part of it: the homepage returns{" "}
        <code>cache-control: public, max-age=0, must-revalidate</code> and{" "}
        <code>x-nextjs-cache: MISS</code> on repeated requests, and the response carries no{" "}
        <code>cf-cache-status</code> or <code>Age</code>. In other words, the edge is not holding the
        HTML, and the route is rendering rather than serving a stored copy.
      </p>

      <h2>Why a prerendered page still renders</h2>
      <p>
        There are four separate reasons, and they stack:
      </p>
      <ol>
        <li>
          <strong>Prerendering is a build artifact, not a cache.</strong> The HTML exists on disk,
          but something has to serve it. A Worker response is not automatically cached by the CDN;
          Cloudflare&rsquo;s documentation says Worker responses are not cached by default.
        </li>
        <li>
          <strong>The header forbids reuse without revalidation.</strong> After the 2026-10-23
          incident, HTML is <code>max-age=0, must-revalidate</code>. Every cache must check with the
          origin before serving; a full HTML response is the cost of that check when no ETag path is
          available.
        </li>
        <li>
          <strong>The framework cache may be per-isolate.</strong> <code>x-nextjs-cache: MISS</code>{" "}
          means the render was not served from the framework&rsquo;s incremental cache. Without a
          durable cache behind it, an isolate restart loses it, and the next request renders again.
        </li>
        <li>
          <strong>Some pages are intentionally dynamic.</strong> <code>/report/</code> and{" "}
          <code>/api/</code> are <code>no-store</code> because they depend on the request; their TTFB
          is a different question.
        </li>
      </ol>
      <p>
        The second reason is a deliberate choice and the first and third are deployment properties.
        That distinction matters: a slow TTFB on this site is not evidence that prerendering failed.
        It is evidence that the deployment chose correctness over edge caching, and that the durable
        cache is not doing what a static host would do for free.
      </p>

      <h2>The options, and what each costs</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Effect</th>
              <th>Cost / risk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Accept revalidation</td>
              <td>Every HTML view checks with the origin; correctness is preserved.</td>
              <td>A round trip and a render when there is no usable ETag; slower TTFB.</td>
            </tr>
            <tr>
              <td>Edge-cache HTML with a short TTL and purge on deploy</td>
              <td>Most requests are served at the edge.</td>
              <td>A staleness window after deploy if the purge misses; needs a cache rule that respects the decision.</td>
            </tr>
            <tr>
              <td>Durable incremental cache + on-demand revalidation</td>
              <td>Store renders across isolates, invalidate on content change.</td>
              <td>More moving parts: a cache binding, a revalidation path, a failure mode when the store is unreachable.</td>
            </tr>
            <tr>
              <td>Paid Workers CPU</td>
              <td>Removes the cold-start CPU ceiling.</td>
              <td>A monthly cost; does not change the render-per-request logic.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        This site has chosen the first option and paid for it in TTFB. The choice is defensible for a
        product whose claim is that the published version is the running version; it would be the
        wrong choice for a marketing site whose pages change monthly and whose readers are far from
        the origin.
      </p>

      <h2>How to measure your own</h2>
      <pre>{`# 1. TTFB and total, three times, for one URL
for i in 1 2 3; do
  curl -sS -o /dev/null -w "%{time_starttransfer} %{time_total} %{http_code}\\n" \\
    https://your-domain.com/page/
done

# 2. What does the response say about caching?
curl -sS -D - -o /dev/null https://your-domain.com/page/ \\
  | grep -iE 'cache-control|age|etag|cf-cache-status|x-nextjs-cache'

# 3. The same page, fetched from a cache-busting hostname or region if available
#    (a different network is the cheapest approximation)`}</pre>
      <p>
        The second command is the one that turns a raw number into an explanation. A slow TTFB with{" "}
        <code>x-nextjs-cache: HIT</code> is a network problem; a slow TTFB with{" "}
        <code>MISS</code> and no edge status is a render problem. They have different fixes.
      </p>

      <h2>What TTFB is not</h2>
      <p>
        It is not a GEO score. No engine has published a TTFB threshold for citation, and a fast page
        with no extractable content is not more citable than a slower one that answers the question.
        It is a delivery dimension: it affects readers and can affect whether a crawler waits for
        the response at all.
      </p>
      <p>
        The honest summary is the one the numbers support: prerendered does not mean cached, and
        &quot;the page exists at build time&quot; does not answer &quot;what did the request
        receive&quot;. Measure the response, name the trade, and do not let a build-time claim stand
        in for a runtime fact.
      </p>
    </PostShell>
  );
}
