import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";
import DiagramRobotsMatch from "../_components/DiagramRobotsMatch";

import { og } from "@/lib/og";

const TITLE = "Configuring robots.txt and WAF for GPTBot and PerplexityBot";
const DESCRIPTION =
  "Which user-agents AI search engines send, how to allow them in robots.txt, and how to confirm a WAF is not silently returning 403 to AI crawlers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/docs/allow-ai-crawlers/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/allow-ai-crawlers/",
    type: "article",
  }),
};

export default function Page() {
  return (
    <ArticleShell
      category="Technical"
      title={TITLE}
      description={DESCRIPTION}
      readTime="4 min read"
      updated="October 2026"
      faq={{
        title: "Questions about crawler access",
        items: [
          { q: "Which user-agents do I need to allow?", a: "At minimum GPTBot and OAI-SearchBot for OpenAI, ClaudeBot and Claude-SearchBot for Anthropic, PerplexityBot for Perplexity, and Google-Extended for Google's AI surfaces." },
          { q: "robots.txt allows them, so why does a scan still report a block?", a: "Because a firewall or CDN rule can refuse a request before robots.txt is consulted. Large sites verify crawlers by IP address, so the WAF configuration is part of the answer, not just the file." },
          { q: "Should I allow every AI crawler?", a: "That is a policy decision rather than a technical one. Allowing search crawlers while disallowing training crawlers is a common and defensible split, and robots.txt can express it." },
        ],
      }}
    >
      <p>
        <strong>A blocked crawler means you cannot be cited by that engine, no matter how good
        your content is.</strong> The two places this happens are <code>robots.txt</code> and
        your firewall — and the second one is the one nobody checks.
      </p>

      <h2>Which user-agents do AI search engines send?</h2>
      <ul>
        <li><strong>OpenAI:</strong> <code>GPTBot</code> (training), <code>OAI-SearchBot</code> (search index), <code>ChatGPT-User</code> (live user-triggered fetch)</li>
        <li><strong>Anthropic:</strong> <code>ClaudeBot</code>, <code>Claude-User</code>, <code>Claude-SearchBot</code>, <code>anthropic-ai</code></li>
        <li><strong>Perplexity:</strong> <code>PerplexityBot</code>, <code>Perplexity-User</code></li>
        <li><strong>Google:</strong> <code>Google-Extended</code> (AI grounding; <code>Googlebot</code> is separate)</li>
        <li><strong>Others:</strong> <code>Bytespider</code> (ByteDance), <code>CCBot</code> (Common Crawl), <code>meta-externalagent</code> (Meta), <code>Applebot-Extended</code> (Apple)</li>
      </ul>
      <p>
        The <code>*-User</code> agents are worth separating from the rest: they fetch a URL
        because a person just asked about it, so blocking them changes what an individual user
        sees right now — not just what gets indexed later.
      </p>

      {/*
        Placed before the "how do I allow them" section rather than after it, because the question
        it answers comes first: whether your file even applies to the agent you are worried about.
        A reader who does not know that an unlisted agent is allowed will read the next section as
        instructions for a problem they may not have.
      */}
      <DiagramRobotsMatch />

      <h2>How do I allow them in robots.txt?</h2>
      <p>
        Default behaviour already allows everything, so most sites need no change. The failure
        mode is the opposite one: an inherited or copied rule that blocks them. Be explicit so
        the intent is visible and reviewable.
      </p>
      <pre>{`# AI search crawlers - explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# Everything else
User-agent: *
Allow: /
Disallow: /private/

Sitemap: https://your-domain.com/sitemap.xml`}</pre>
      <p>
        Keep the file in one place. Pointing at a separate sitemap costs nothing and is
        frequently forgotten.
      </p>

      <h2>Why does my firewall return 403 to AI crawlers?</h2>
      <p>
        <strong>Bot-management features are the usual culprit, not your robots.txt.</strong>
        Challenge-based bot protection scores a request and may issue a JavaScript challenge to
        anything that is not a browser. Server-side crawlers cannot solve a JS challenge, so
        they receive a challenge page or a <code>403</code> and record a fetch failure.
      </p>
      <p>
        Check, in this order: bot-fight mode or equivalent, security level set to an
        under-attack profile, custom WAF rules matching on user-agent, and rate-limiting rules
        that treat a crawler burst as an attack.
      </p>

      <h2>Should I block AI training crawlers?</h2>
      <p>
        It is a legitimate choice, and it is separate from search visibility. Blocking{" "}
        <code>CCBot</code> or <code>GPTBot</code> affects model training and grounding;
        blocking <code>OAI-SearchBot</code> or <code>PerplexityBot</code> affects whether you
        can be cited in answers at all. Decide which one you are actually objecting to, and
        never block <code>Googlebot</code> or <code>Bingbot</code> by accident while doing it.
      </p>

      <h2>How do I verify the crawlers are not blocked?</h2>
      <ol>
        <li>Fetch your own <code>robots.txt</code> and confirm no group blocks the agents above.</li>
        <li>Request a page with an AI crawler user-agent from a server that is not a browser, and check the status code is <code>200</code>.</li>
        <li>Look for the <code>cf-mitigated</code> response header, which indicates a challenge was issued.</li>
        <li>Review your edge security event log for blocked requests from Google, OpenAI or Perplexity address ranges.</li>
      </ol>
      <p>
        The <a href="/">LLMention scanner</a> runs step 1 automatically and reports which of
        gptbot, claudebot, perplexitybot, oai-searchbot and google-extended are disallowed at the
        site root. It does <strong>not</strong> run steps 2 or 3: it fetches your site as itself,
        from its own address, so a request it makes can never show you what your firewall does to
        a real AI crawler. Those two steps are yours to run.
      </p>
    </ArticleShell>
  );
}
