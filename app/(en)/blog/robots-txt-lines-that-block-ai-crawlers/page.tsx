import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("robots-txt-lines-that-block-ai-crawlers");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /*
     * English only for now. Declaring zh-Hans or ja here would advertise pages that do not
     * exist yet; the translations will add their keys when they ship, and the sitemap reads
     * the same `languages` field on the registry entry.
     */
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
        title: "Questions about robots.txt and AI crawlers",
        items: [
          {
            q: "Does Disallow: / in robots.txt stop AI engines from citing me?",
            a: "It stops compliant crawlers from fetching the pages. It does not remove citations that already exist, and it does not affect a user who pastes your URL into a chat: that is a user-triggered fetch by a different agent, not a crawl. Blocking training and blocking search are also different decisions, because the tokens are different.",
          },
          {
            q: "Can a 403 be caused by robots.txt?",
            a: "Only indirectly. robots.txt is read after the request is served; a 403 happens before the file matters. The common causes are a WAF rule, bot management, rate limiting or a geo block. The test is to repeat the request with a browser User-Agent: if the browser-shaped request is served and the crawler-shaped one is not, the refusal is aimed at crawlers.",
          },
          {
            q: "If robots.txt says nothing, am I accessible?",
            a: "Probably, but that is not the same as verified. The server can still refuse the request, and the file is a request rather than an enforcement mechanism. The scanner therefore asks for both: a readable robots.txt and a homepage that answered a crawler-shaped request with HTTP 200.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("six-news-publishers-blocking-ai-crawlers"),
          label: "Six news publishers, six blocking AI crawlers",
          note: "The policy case: what a deliberate block looks like in practice, and what it costs.",
        },
        {
          href: insightPath("reading-a-failed-check"),
          label: "How to read a failed check",
          note: "Why the evidence behind a failure matters more than the failure itself.",
        },
        {
          href: "/checks/robots-ai-allowed/",
          label: "The rule this article is about",
          note: "The exact pass condition, the five tokens and the 2-of-6 unverified case.",
        },
      ]}
    >
      <p>
        There are two different reasons an AI crawler fails to read your site, and they present
        the same way: the engine does not cite you. One is a line in <code>robots.txt</code>. The
        other is a server that refuses the request before it ever reads the file. Fixing the first
        when the cause is the second is one of the most common pieces of wasted work in this
        category, so the test below separates them before any editing.
      </p>
      <p>
        This article is about the robots.txt half. It is written against the five tokens the
        LLMention scanner actually tests — <code>gptbot</code>, <code>claudebot</code>,{" "}
        <code>perplexitybot</code>, <code>oai-searchbot</code> and <code>google-extended</code> —
        and against the matching rules the scanner implements. It is not a list of every agent in
        existence, and it does not claim every crawler behaves the same way.
      </p>

      <h2>What "blocked by robots.txt" actually means</h2>
      <p>
        <code>robots.txt</code> is a request published at the domain root. A compliant crawler
        fetches it before crawling, joins the rules to its own product token, and decides which
        paths it may fetch. The file cannot enforce anything: a crawler that ignores it is not
        stopped by it, and a server that refuses requests is not overruled by it. What the file
        does control is the behaviour of crawlers that choose to comply — which is most of the
        large ones, which is why it still matters.
      </p>
      <p>
        The scanner's rule for this is{" "}
        <Link href="/checks/robots-ai-allowed/">one published check</Link>, worth 6 points inside
        the AI crawler access dimension. It asks two things: none of the five tokens is
        disallowed from <code>/</code>, and the homepage answered a crawler-shaped request with
        HTTP 200. A readable robots.txt that permits everything but a homepage that returns 403
        fails the check, because the stronger evidence wins.
      </p>

      <h2>The five tokens, and why they are not interchangeable</h2>
      <p>
        Each token is a separate product with a separate purpose, and a site can reasonably want
        different answers for each. The table is the scanner's scope, not the whole industry.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>What it represents</th>
              <th>Why a site might allow or disallow it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>gptbot</code>
              </td>
              <td>OpenAI's crawler for training and product improvement</td>
              <td>Disallowing it is a data-use decision, not a visibility decision.</td>
            </tr>
            <tr>
              <td>
                <code>oai-searchbot</code>
              </td>
              <td>OpenAI's crawler for search and answer surfaces</td>
              <td>Disallowing it removes you from those surfaces; it is the one most often blocked by accident.</td>
            </tr>
            <tr>
              <td>
                <code>claudebot</code>
              </td>
              <td>Anthropic's crawler</td>
              <td>Same split as above: training and product use versus answering.</td>
            </tr>
            <tr>
              <td>
                <code>perplexitybot</code>
              </td>
              <td>Perplexity's crawler for its answer engine</td>
              <td>Its answer product is the citation channel; blocking it is usually a deliberate trade.</td>
            </tr>
            <tr>
              <td>
                <code>google-extended</code>
              </td>
              <td>Google's control for generative AI use of content</td>
              <td>Not a crawl switch for Search; it controls a different use of the same content.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        User-triggered fetches are a separate path. When a reader pastes your URL into a chat, the
        assistant may fetch the page on that person's behalf, and that behaviour is not the same
        as a scheduled crawl. A robots.txt rule aimed at a crawl token is not automatically a
        rule about that fetch, and treating them as one is how sites end up believing they have
        blocked something they have not.
      </p>

      <h2>Rule shapes that block by accident</h2>
      <p>
        The matching rules are small enough to state precisely, and most accidental blocks are one
        of these five shapes.
      </p>
      <ul>
        <li>
          <strong>A wildcard at the top.</strong> <code>User-agent: *</code> followed by{" "}
          <code>Disallow: /</code> blocks every compliant agent that has no more specific group —
          including all five AI tokens. A site that copied this while staging a new version is
          blocking AI search from a placeholder file.
        </li>
        <li>
          <strong>A specific group that overrides the wildcard.</strong> An exact token group takes
          precedence over <code>*</code>. So <code>User-agent: GPTBot</code> plus{" "}
          <code>Disallow: /</code> blocks GPTBot while the wildcard permits everything else. If
          the intent was "block training but allow search", this is the shape that gets it wrong:
          it blocks the product token that also serves answers.
        </li>
        <li>
          <strong>An empty <code>Disallow</code>.</strong> <code>Disallow:</code> with an empty
          value permits everything for that group. This is the correct way to write an explicit
          allow for one agent when the wildcard is restrictive.
        </li>
        <li>
          <strong>Overlapping paths and precedence.</strong> When both <code>Allow</code> and{" "}
          <code>Disallow</code> match, the most specific (longest) path wins; on a tie the
          scanner, like several large crawlers, lets <code>Allow</code> win. A file that relies
          on the opposite tie-break will behave differently across crawlers, which is a reason to
          avoid exact ties rather than to memorise one.
        </li>
        <li>
          <strong>A path that is not the path.</strong> <code>Disallow: /blog</code> does not
          block <code>/blog/</code> on every crawler unless the prefix matches; and a rule written
          as a full URL instead of a path is ignored. Test with the exact URL, not with the
          intent.
        </li>
      </ul>

      <h2>What robots.txt cannot fix</h2>
      <p>
        A server that refuses a crawler will do so whether or not robots.txt permits it. The
        common causes are a WAF rule aimed at bots, bot management that challenges anything with a
        non-browser User-Agent, a rate limit hit during a scan, or a geo/IP policy. The refusal is
        visible as a 403, a 429, a 503 or a challenge response, and the file is not consulted
        before the response is produced.
      </p>
      <p>
        The scanner handles this explicitly. When the homepage refuses a crawler-shaped request,
        it repeats the same URL with a browser-shaped User-Agent. If the browser-shaped request is
        served, the refusal is aimed at identified crawlers and the check fails under{" "}
        <Link href="/docs/allow-ai-crawlers/">the blocked rule</Link>. If both are refused, the
        refusal is about the scanning address rather than the site, and the check scores 2 of 6 as
        unverified rather than failing you for something that may not be yours.
      </p>

      <h2>Five commands that separate the causes</h2>
      <p>
        Replace the host with your own. Each command answers a different question, and the order
        matters less than reading the status and the <code>cf-mitigated</code> header before
        editing anything.
      </p>
      <pre>{`# 1. Is the file there, and does it parse at all?
curl -sS -o /dev/null -w "%{http_code}\\n" https://your-domain.com/robots.txt

# 2. What does a crawler-shaped request for the homepage get?
curl -sS -o /dev/null -D - -A "GPTBot" https://your-domain.com/

# 3. The same request as a browser — the control.
curl -sS -o /dev/null -D - -A "Mozilla/5.0 (compatible; Chrome/126)" https://your-domain.com/

# 4. Does the file mention the tokens at all, and in which group?
curl -sS https://your-domain.com/robots.txt | grep -inE "gptbot|claudebot|perplexitybot|oai-searchbot|google-extended|user-agent|disallow|allow"

# 5. Did the page actually render for a crawler, or is the content JavaScript-only?
curl -sS -A "GPTBot" https://your-domain.com/ | wc -c`}</pre>
      <p>
        Reading the results: a 200 on command 2 with a robots.txt that permits the token means
        the crawl path is open. A 403 on command 2 and a 200 on command 3 means the refusal is
        aimed at crawlers, and no robots.txt edit will change it. A 403 on both means the request
        is being refused for the address; test from another network before concluding anything
        about the site. Command 5 is the check people skip: a 200 with an empty body is a
        JavaScript-rendered page, which is a different failure mode with a different fix.
      </p>

      <h2>What a permissive file looks like</h2>
      <p>
        If the intent is to allow the five tokens, the smallest correct file is a wildcard that
        permits everything, plus a sitemap line. The explicit groups are optional; they are worth
        adding when you want the intent to be legible to a human reviewer, and they carry no
        extra effect for compliant crawlers.
      </p>
      <pre>{`User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`}</pre>
      <p>
        If the intent is to block training while allowing answer surfaces, the tokens have to be
        split by purpose, not by company. A file that disallows <code>gptbot</code> but permits{" "}
        <code>oai-searchbot</code> expresses that choice; a file that disallows everything under{" "}
        <code>gpt</code> does not, and a wildcard that blocks bots generally blocks all of them.
        Whether the split survives depends on the crawler honouring it, which is why the next
        section is about what blocking can and cannot promise.
      </p>

      <h2>What blocking does not do</h2>
      <p>
        Blocking a crawler stops future fetches by that crawler, if it complies. It does not
        retract citations that already exist, it does not remove you from an answer built from
        other sources, and it does not guarantee that no assistant will quote a page that another
        party archived. It also does not distinguish "block training" from "block answering"
        unless the crawler publishes separate tokens for those purposes — which is exactly why the
        five-token list is a list and not a switch.
      </p>
      <p>
        The honest summary: robots.txt is a policy statement with real but bounded effect. The
        measurable part is whether the file permits the tokens and whether the server serves a
        crawler-shaped request. The unmeasurable part is what an engine does with content it may
        already have. The scanner scores the first and does not pretend to know the second.
      </p>

      <h2>How to check your own site</h2>
      <p>
        Run the <Link href="/report/">free scan</Link> and read the AI crawler access dimension:
        it will tell you whether the five tokens are permitted and whether the homepage answered a
        crawler-shaped request. If a rule fails, the{" "}
        <Link href="/checks/robots-ai-allowed/">rule page</Link> names the exact condition and the
        fix branches. If the refusal is server-side, the{" "}
        <Link href="/methodology/">methodology</Link> explains how the unverified case is scored
        rather than hidden. The number is only useful if you know which of the two problems it is
        describing.
      </p>
    </PostShell>
  );
}
