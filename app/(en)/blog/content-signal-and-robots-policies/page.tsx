import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("content-signal-and-robots-policies");
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
        title: "Questions about Content-Signal",
        items: [
          {
            q: "Does Content-Signal block a crawler?",
            a: "No. It is a statement of preference inside robots.txt; blocking is still done with a User-agent group and Disallow, or at the edge. A crawler that does not understand the directive ignores it, and no major engine has committed to honouring it.",
          },
          {
            q: "Can I say search=yes and ai-train=no?",
            a: "You can write it, and it expresses a real position. Whether it is honoured is a different question, and it is only coherent if the robots rules agree: allowing a training crawler in robots.txt while saying ai-train=no is a contradiction the file itself creates.",
          },
          {
            q: "Why does the scanner score a one-point directive?",
            a: "Because the convention is cheap to follow and a tool that recommends it should be able to show its own line. The rule is 1 of the 16 points in the AI crawler access dimension, and the rule page says it is read as a stated position rather than a signal any engine has committed to.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("robots-txt-lines-that-block-ai-crawlers"),
          label: "Which robots.txt lines actually block AI crawlers",
          note: "The enforce-by-policy half: what a Disallow group does that a signal does not.",
        },
        {
          href: insightPath("cloudflare-waf-ai-crawlers-403-meaning"),
          label: "Cloudflare WAF and AI crawlers: what a 403 actually means",
          note: "The enforce-at-the-edge half, and how to tell it from a robots.txt block.",
        },
        {
          href: "/checks/content-signal/",
          label: "The rule this article is about",
          note: "One point for a Content-Signal line with a value, and the rule page's rationale.",
        },
      ]}
    >
      <p>
        robots.txt is a permission file with a yes/no shape: an agent is allowed a path or it is
        not. Content-Signal is an attempt to say something more specific inside the same file —
        whether a site wants its content used for search, for AI input, or for training — without
        pretending those are the same decision. It is a useful line to publish. It is not a gate, and
        treating it like one is the mistake this article is about.
      </p>
      <p>
        The scanner carries a one-point rule for it, and the rule page is unusually direct about
        why: the convention is cheap, adoption is early, and no engine has committed to honouring
        it. That is a good description of the whole idea.
      </p>

      <h2>What the directive looks like</h2>
      <p>
        A single line in <code>robots.txt</code>:
      </p>
      <pre>{`Content-Signal: search=yes, ai-input=yes, ai-train=yes`}</pre>
      <p>
        The three names describe different uses. <code>search</code> is indexing and being shown in
        search results. <code>ai-input</code> is being read as part of an answer — grounding,
        retrieval, citation. <code>ai-train</code> is training a model on the content. A site can
        reasonably answer yes to some and no to others; that is the point of a separate line rather
        than another <code>Disallow</code>.
      </p>
      <p>
        The scanner&rsquo;s rule is <Link href="/checks/content-signal/">content-signal</Link>, worth
        1 point of the 16 in the AI crawler access dimension. It matches the directive
        case-insensitively at the start of a line and requires a value after the colon. The rule
        page says what it is reading: a stated position, not a signal an engine has committed to.
      </p>

      <h2>What it changes, and what it does not</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Content-Signal</th>
              <th>The enforcement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Can a crawler read it?</td>
              <td>Only if its parser knows the directive; unknown lines are ignored by compliant parsers.</td>
              <td><code>User-agent</code> plus <code>Disallow</code> is the mechanism every crawler knows.</td>
            </tr>
            <tr>
              <td>Does it block a request?</td>
              <td>No.</td>
              <td>A WAF rule or bot management can refuse at the edge; robots is cooperative.</td>
            </tr>
            <tr>
              <td>Does it settle training rights?</td>
              <td>It states a position; whether it is binding depends on the crawler, the terms and the law.</td>
              <td>Terms of service, contracts and applicable law are the actual instruments.</td>
            </tr>
            <tr>
              <td>Does it affect ranking?</td>
              <td>No.</td>
              <td>Not applicable — no engine has said it uses the signal for ranking.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The most useful way to read the directive is as documentation: it tells a reader with the
        right parser what the site&rsquo;s position is, in one line, where the crawl rules already
        live. That is worth something even if enforcement is somewhere else. It is not worth
        pretending the line is a wall.
      </p>

      <h2>Make the line agree with the file</h2>
      <p>
        The failure that matters is contradiction. A site that writes{" "}
        <code>ai-train=no</code> while its robots.txt allows <code>GPTBot</code>,{" "}
        <code>CCBot</code> and every other training crawler has created a file that says two
        different things. The signal is not wrong; the pair is.
      </p>
      <p>
        This site resolves it in the other direction. Its robots.txt explicitly allows the AI
        crawlers, and it publishes{" "}
        <code>Content-Signal: search=yes, ai-input=yes, ai-train=yes</code> with a comment
        explaining the choice: being readable by AI is the product&rsquo;s argument, and a signal
        that contradicted the rules would be worse than no signal at all. The consistency is the
        point, not the value.
      </p>
      <p>
        If you want to disallow training, the coherent version is both: disallow the training
        tokens in robots.txt and state <code>ai-train=no</code>. If you want to allow citation but
        not training, say so and accept that enforcement is partial — different crawlers publish
        different tokens, and not all of them separate the two uses.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li>
          <strong>Putting it in a comment.</strong> A directive after <code>#</code> is text, not a
          directive. The scanner matches the start of a line.
        </li>
        <li>
          <strong>Empty value.</strong> <code>Content-Signal:</code> with nothing after it is not a
          signal; it is a truncated line.
        </li>
        <li>
          <strong>Contradicting the robots rules.</strong> The pair has to describe one policy.
        </li>
        <li>
          <strong>Expecting it to enforce.</strong> It does not block, throttle, or opt out by
          itself. If the content matters, the blocking belongs in robots or at the edge.
        </li>
        <li>
          <strong>Putting it in a meta tag or a response header.</strong> The convention is a
          robots.txt line; a meta tag with the same words is not read as this directive.
        </li>
        <li>
          <strong>Copying a value without deciding.</strong> <code>yes</code> to everything is a
          position; so is <code>no</code>. The line should be the one the site means.
        </li>
      </ul>

      <h2>How to check a site's line</h2>
      <pre>{`# 1. Is the directive present, and what does it say?
curl -sS https://your-domain.com/robots.txt | grep -i '^Content-Signal:'

# 2. Does the file allow the crawlers the signal talks about?
curl -sS https://your-domain.com/robots.txt | grep -iE 'User-agent|Disallow|Allow'

# 3. Is the line inside a comment anywhere? (It should not be.)
curl -sS https://your-domain.com/robots.txt | grep -n 'Content-Signal'

# 4. Follow the scanner's exact test: case-insensitive, start of line, value present
curl -sS https://your-domain.com/robots.txt \\
  | grep -icE '^[[:space:]]*content-signal[[:space:]]*:[[:space:]]*[^[:space:]]'`}</pre>
      <p>
        The fourth command is the mechanical check. The second is the one that catches the
        contradiction: read the allowed tokens and ask whether the signal describes the same policy.
      </p>

      <h2>What the signal is worth</h2>
      <p>
        One point out of sixteen in one dimension, which is about right. It is a cheap way to state
        a position where crawlers already look, and it may become more useful as the convention and
        the tooling around it mature. It does not replace the rules that actually govern access, and
        it does not change what an engine does by itself.
      </p>
      <p>
        The standard is the same as for every other signal in this series: publish only what the
        site means, make it agree with the rest of the file, and do not let a line of text stand in
        for enforcement that lives somewhere else.
      </p>
    </PostShell>
  );
}
