import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("core-web-vitals-and-ai-crawlers");
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
        title: "Questions about Core Web Vitals and crawlers",
        items: [
          {
            q: "Are Core Web Vitals a GEO ranking factor?",
            a: "No engine has published a Core Web Vitals threshold for AI citation. They are user-experience metrics used by Google's page-experience signals; an AI crawler fetching HTML is not a browser and does not run Lighthouse. The connection is shared causes, not a shared score.",
          },
          {
            q: "Is a slow page less likely to be cited?",
            a: "It can be, indirectly: slower responses cost timeouts and crawl budget, and a page that takes long to become readable is harder to render. But that is a delivery effect, not a documented citation rule. Do not sell speed as a citation guarantee.",
          },
          {
            q: "Should I optimize CWV for AI crawlers?",
            a: "Optimize them for users; the crawler benefits from the same things only where they overlap — the content arriving in the response, the server answering quickly, and the HTML not being enormous. Those are worth doing on their own merits.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("ttfb-edge-caching-prerendered-html"),
          label: "TTFB, edge caching and prerendered HTML",
          note: "The delivery measurement this article keeps separate from the browser metrics.",
        },
        {
          href: insightPath("what-a-crawler-sees-without-javascript"),
          label: "What a crawler sees when your page needs JavaScript",
          note: "The shared cause: a JavaScript-heavy page is slow for people and empty for crawlers.",
        },
        {
          href: "/methodology/",
          label: "The method",
          note: "Where delivery sits among the twelve dimensions, and its two coarse rules.",
        },
      ]}
    >
      <p>
        Core Web Vitals and AI crawlers are usually discussed in the same paragraph for a bad reason:
        both are about pages being &quot;fast&quot; or &quot;well built&quot;, so a sentence that
        connects them sounds plausible. The connection is real but narrower than the paragraph
        suggests. Core Web Vitals measure a person&rsquo;s experience in a browser; an AI crawler
        fetching HTML is not a browser, and no engine has published a Core Web Vitals threshold for
        citation.
      </p>
      <p>
        This article separates the two, then says where they genuinely overlap. The overlap is worth
        knowing because it points at work that helps both; the separation is worth knowing because
        selling one as the other is the kind of overclaim this site argues against.
      </p>

      <h2>What the three metrics measure</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>What it measures</th>
              <th>Good threshold (field data)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LCP</td>
              <td>How long until the largest visible element is rendered.</td>
              <td>2.5 seconds or less.</td>
            </tr>
            <tr>
              <td>INP</td>
              <td>How responsive the page is to interaction, across the visit.</td>
              <td>200 milliseconds or less.</td>
            </tr>
            <tr>
              <td>CLS</td>
              <td>How much the layout shifts unexpectedly while loading.</td>
              <td>0.1 or less.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The thresholds are Google&rsquo;s, evaluated on field data from real users (the Chrome UX
        Report) rather than on a single lab run. That matters for this article: the score describes
        what people experienced, not what a machine can fetch.
      </p>

      <h2>What an AI crawler actually does</h2>
      <p>
        The agents this scanner tests fetch a URL, receive a response, and work with what came back.
        Some may render pages; none promises to. What none of them does is load your page in a
        browser, run Lighthouse, wait for INP, or measure layout shift. A perfect CLS is not an input
        to their decision, because they do not compute it.
      </p>
      <p>
        What they can experience is the delivery side: a server that takes ten seconds to answer, a
        response that times out, or an HTML body so large that fetching it is expensive. Those are
        real, and they are not the same measurements as LCP or INP.
      </p>

      <h2>Where they genuinely connect</h2>
      <ul>
        <li>
          <strong>The same cause: client-side rendering.</strong> A page that assembles its content
          in the browser is often slow to paint and empty in the response. Fixing it with
          server-rendering improves both LCP and the no-JS body — one change, two audiences.
        </li>
        <li>
          <strong>The same cause: JavaScript weight.</strong> A large bundle delays the main thread
          and also means the HTML response carries more code than content. Less JS helps a person and
          a parser.
        </li>
        <li>
          <strong>The same delivery path.</strong> TTFB is part of LCP; it is also how long a crawler
          waits for the first byte. A slow origin is slow for both, and the fixes overlap at the edge
          even though the metrics do not.
        </li>
        <li>
          <strong>The same content cost.</strong> Serving images at full resolution and loading
          fonts you do not use hurts CWV; serving an enormous HTML document hurts a parser&rsquo;s
          token budget. Different numbers, same principle: send less of what is not needed.
        </li>
      </ul>
      <p>
        The overlap is a set of shared causes. It is not a single score. A site can have green Core
        Web Vitals and a JavaScript-only article, or a plain server-rendered page with poor CLS. The
        easiest way to see that is to measure both separately.
      </p>

      <h2>What this site scores, and what it does not</h2>
      <p>
        The delivery dimension has two rules, and both are deliberately coarse.{" "}
        <Link href="/checks/viewport/">viewport</Link> (1 point) checks that a meta viewport tag is
        present; the rule page admits it does not read the value, because judging whether the
        configuration is usable needs a rendering engine. <Link href="/checks/payload/">payload</Link>{" "}
        (1 point) checks that the uncompressed HTML is under 500 KB; the rule page admits it counts
        only the document, so a 400 KB page with three megabytes of images passes.
      </p>
      <p>
        That is honest and limited. The scanner does not run Lighthouse and does not report LCP, INP
        or CLS. A site that wants those numbers should use the field data from the Chrome UX Report,
        or a lab tool for a single page; the two are different questions and neither is a citation
        metric.
      </p>

      <h2>How to measure the two separately</h2>
      <pre>{`# 1. Browser experience: field data (needs a CrUX/PSI key) or PageSpeed Insights
#    https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fyour-domain.com%2F

# 2. What a crawler receives, in bytes and time
curl -sS -o /dev/null -w "%{time_starttransfer} %{size_download}\\n" https://your-domain.com/page/

# 3. Does the content need JavaScript? (the first 1000 characters of the body)
curl -sS https://your-domain.com/page/ | sed 's/<[^>]*>/ /g' | tr -s ' ' | head -c 1000

# 4. Are the heavy assets separate requests?
curl -sS https://your-domain.com/page/ | grep -oE '<(img|script|link)[^>]+(src|href)="[^"]+"' | wc -l`}</pre>
      <p>
        Command 2 is the overlap: TTFB and bytes matter to both. Command 3 is the part CWV cannot
        tell you: whether the content is in the response at all. Command 1 is the part a crawler
        cannot tell you: how the page felt to a person.
      </p>

      <h2>The overclaims to avoid</h2>
      <ul>
        <li>
          <strong>&quot;Fast pages get cited more.&quot;</strong> Plausible as a tendency, not
          established as a rule; no engine publishes it, and the causal path is unclear.
        </li>
        <li>
          <strong>&quot;CWV is a GEO ranking factor.&quot;</strong> No. It is a page-experience
          signal for search, and an AI crawler does not compute it.
        </li>
        <li>
          <strong>&quot;INP matters to GPTBot.&quot;</strong> INP measures interaction; a crawler
          does not interact with the page.
        </li>
        <li>
          <strong>&quot;A green Lighthouse score means AI can read the page.&quot;</strong> Lighthouse
          runs a browser; the question is what the server returned.
        </li>
      </ul>

      <h2>The useful framing</h2>
      <p>
        Treat Core Web Vitals as user-experience engineering and treat crawler access as a separate
        discipline that shares some causes. Where the causes overlap — client rendering, JS weight,
        TTFB, payload — one fix serves both. Where they do not, do not borrow the authority of one
        metric for the other.
      </p>
      <p>
        The rest of this series keeps making the same move: name the mechanism, measure the thing
        that actually matters, and say what the measurement does not cover. &quot;Fast&quot; is not a
        mechanism, and &quot;cited&quot; is not a metric.
      </p>
    </PostShell>
  );
}
