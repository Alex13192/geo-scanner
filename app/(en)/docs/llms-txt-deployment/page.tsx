import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";

import { og } from "@/lib/og";

const TITLE = "How to Generate and Deploy an llms.txt File";
const DESCRIPTION =
  "A practical guide to structuring, hosting and verifying an /llms.txt file at your domain root, and an honest look at what it does not do for AI visibility.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/docs/llms-txt-deployment/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/llms-txt-deployment/",
    type: "article",
  }),
};

export default function Page() {
  return (
    <ArticleShell
      category="Setup"
      title={TITLE}
      description={DESCRIPTION}
      readTime="3 min read"
      updated="October 2026"
      faq={{
        title: "Questions about deploying llms.txt",
        items: [
          { q: "Where exactly does the file go?", a: "At the domain root, so that https://your-domain.com/llms.txt returns it directly with HTTP 200 and a body. A redirect to a login page, or an HTML error page, counts as not served." },
          { q: "Does publishing llms.txt improve rankings?", a: "No. Google has said it does not use the file in Search, and support across the other engines is inconsistent. It is cheap and worth doing, and it is not a ranking factor." },
          { q: "How do I confirm it is being served correctly?", a: "Request the URL and read what comes back: markdown with a 200, rather than a 404 or a page of HTML. A status code alone is not enough, because an empty file returns 200 too." },
        ],
      }}
    >
      <p>
        <strong>llms.txt is a plain markdown file served at your domain root that tells
        language models which parts of your site matter.</strong> It is a convention, not a
        standard, and it takes about ten minutes to add. This guide covers the format, the
        deployment, and how to verify it is actually reachable.
      </p>

      <h2>What is llms.txt?</h2>
      <p>
        <code>/llms.txt</code> is a proposed convention for giving AI systems a curated,
        machine-readable summary of a website. Instead of asking a model to infer structure
        from HTML, it hands over a short markdown document with a project summary and a list
        of the most important links. The companion file <code>/llms-full.txt</code> carries
        the expanded content itself.
      </p>

      <h2>What goes inside the file?</h2>
      <p>The convention is deliberately simple: one H1 with your site name, a blockquote summary, then H2 sections of annotated links.</p>
      <pre>{`# Your Company

> One or two sentences describing what you do and who it is for.

## Core pages
- [Product overview](https://example.com/product): what it does.
- [Pricing](https://example.com/pricing): plans and limits.

## Documentation
- [Getting started](https://example.com/docs/start): setup in five minutes.

## Optional
- [Blog](https://example.com/blog): release notes and research.`}</pre>
      <p>
        Two rules matter more than the format: <strong>the summary line is what a model is
        most likely to quote</strong>, so write it as a fact-rich sentence rather than a
        slogan; and <strong>every link must resolve</strong>, because a file full of 404s is
        worse than no file at all.
      </p>

      <h2>Where does the file go?</h2>
      <p>
        It must be reachable at the exact path <code>https://your-domain.com/llms.txt</code> —
        the domain root, not a subdirectory. How you publish it depends on your stack: on
        Next.js, drop it in <code>public/llms.txt</code>; on most static hosts, put it in the
        publish directory. Avoid redirects: serve it directly with a{" "}
        <code>text/plain</code> content type.
      </p>

      <h2>Does llms.txt actually improve AI visibility?</h2>
      <p>
        <strong>Partly, and less than most vendors claim.</strong> Google has stated it does
        not use llms.txt in Search. Crawler support is inconsistent, and no major AI provider
        has committed to reading it as a ranking signal.
      </p>
      <p>
        What it genuinely helps with today: documentation sites and coding agents that fetch
        context deliberately, and any retrieval system that accepts a curated entry point. The
        honest framing is <strong>one small, cheap signal</strong> — worth adding, not worth
        treating as a ranking factor.
      </p>

      <h2>How do I verify it is live?</h2>
      <ol>
        <li>Request <code>https://your-domain.com/llms.txt</code> in a browser. It should render as plain text, not download or 404.</li>
        <li>Confirm the response is <code>200</code> and the content type is <code>text/plain</code>.</li>
        <li>Check that <code>robots.txt</code> does not disallow the path, and that your firewall does not block crawler user-agents.</li>
        <li>Click every link in the file once. Broken links are the most common defect.</li>
      </ol>
      <p>
        You can run all of this automatically with the{" "}
        <a href="/llms-txt-studio/">llms.txt Studio</a>, or audit crawler access first with the{" "}
        <a href="/">free GEO scanner</a>.
      </p>
    </ArticleShell>
  );
}
