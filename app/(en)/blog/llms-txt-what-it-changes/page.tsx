import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("llms-txt-what-it-changes");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English first; translations add their own hreflang keys when they ship. */
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
        title: "Questions about llms.txt",
        items: [
          {
            q: "Does llms.txt make AI engines read my site?",
            a: "No. It is a published file that an agent may choose to fetch or ignore. Access is controlled by robots.txt, server behaviour and the engine's own crawling, and a context file does not override any of them.",
          },
          {
            q: "Why does the scanner score it if the evidence is weak?",
            a: "Because the convention is cheap to follow and a site that publishes a clean one is easier to check than a site that does not. The dimension is deliberately capped: the file is worth at most 3.3 of the 100, and the rule page says the evidence for it is weak.",
          },
          {
            q: "Should I generate it at build time or write it by hand?",
            a: "Either, with a different cost. Generation keeps it from going stale but produces sitemap-like output; hand-writing keeps the curation and drifts unless someone updates it. The failure to avoid is a dated file that still lists pages that were removed.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("what-a-crawler-sees-without-javascript"),
          label: "What a crawler sees when your page needs JavaScript",
          note: "The precondition that matters more than a context file: the content has to be in the fetch.",
        },
        {
          href: insightPath("robots-txt-lines-that-block-ai-crawlers"),
          label: "Which robots.txt lines actually block AI crawlers",
          note: "The file that controls access; llms.txt only describes what is already available.",
        },
        {
          href: "/checks/llms-txt/",
          label: "The rule this article is about",
          note: "The exact four properties the scanner checks, and what the check does not judge.",
        },
      ]}
    >
      <p>
        <code>llms.txt</code> is the rare thing in this field: a convention with almost no
        standardisation, a very low cost of adoption, and a lot of claims attached to it. It is
        also the file most likely to be published for the wrong reason — because a checklist said
        to, not because anyone has a use for it. This article is about what the file can do, what
        it cannot, and how to tell whether yours is worth the bytes.
      </p>
      <p>
        The short version: publish it if you want to, keep it accurate, and do not expect it to
        change your access. The work that changes access is the crawl path and the content itself.
      </p>

      <h2>What the file is</h2>
      <p>
        The convention proposes a Markdown file at <code>/llms.txt</code> that gives a model a
        curated map of a site: a title, a one-line summary, and sections of links with short
        descriptions. An optional <code>/llms-full.txt</code> carries a fuller corpus for tools
        that want the text rather than the map. The details come from the proposal at{" "}
        <a href="https://llmstxt.org/" rel="noopener noreferrer">
          llmstxt.org
        </a>
        , and the scanner tests only the shape, not the prose.
      </p>
      <p>
        That is the whole mechanism. There is no registry, no crawler instruction that makes a
        model read it, and no ranking system that rewards it. An agent may fetch the URL because
        its instructions say to look for one; if it does, a good file saves it work. If it does
        not, the file is still a URL on your site that costs almost nothing.
      </p>

      <h2>What the scanner checks — and the number it is worth</h2>
      <p>
        The rule is{" "}
        <Link href="/checks/llms-txt/">published in full</Link>: the file must return more than
        20 bytes, contain an H1, contain a <code>&gt;</code> summary line and contain at least
        three Markdown links. Missing any of those is a partial pass. What the file says is not
        judged, which the rule page states plainly: three links to pages that do not exist pass
        the structure test.
      </p>
      <p>
        The points are deliberately small. The rule is worth 4 of the 6 points in the AI context
        files dimension, and the dimension is 5% of the total — so the file can move a score by at
        most about 3.3 points out of 100. The methodology page says the reason: the convention is
        cheap to follow, and the evidence that engines consume it is weak. A site that treats this
        file as the main lever is optimising the cheapest thing on the list.
      </p>

      <h2>What it changes</h2>
      <ul>
        <li>
          <strong>If an agent reads it:</strong> it gets a curated list of what matters, in the
          order you chose, with one-line descriptions. That is a better starting point than
          guessing from a sitemap, which lists URLs without saying which ones are the product and
          which are the legal pages.
        </li>
        <li>
          <strong>If a human reads it:</strong> the file is a compact statement of what the site
          is. That has some value on its own — it is a page that can be linked, quoted and
          diffed.
        </li>
        <li>
          <strong>If nobody reads it:</strong> nothing happens. That is the honest default, and
          it is why the cost matters more than the upside.
        </li>
      </ul>

      <h2>What it does not do</h2>
      <p>
        The file is not a permission system. It does not allow a crawler that robots.txt or a WAF
        refuses, it does not render JavaScript, and it does not create content that is not already
        published. It also does not express training consent in a way that any major provider has
        agreed to honour; that discussion happens in robots.txt, terms, and the crawler's own
        documentation, with varying degrees of enforceability.
      </p>
      <p>
        Nor is it a substitute for the files beside it. Sitemaps describe URLs, robots.txt
        describes crawl permission, structured data describes entities and page types. A context
        file describes the site to a reader that has already decided to look. Publishing one does
        not remove the need for the other three, and deleting the others while adding this one is
        a net loss.
      </p>

      <h2>A file that is worth the bytes</h2>
      <p>
        The shape is simple. Keep it Markdown, keep the summary one sentence, and write each
        section for a reader who has never seen the site.
      </p>
      <pre>{`# Your product name

> One sentence on what this site is and who it is for.

## Core pages

- [Product overview](https://your-domain.com/): what it does, in one line.
- [Pricing](https://your-domain.com/pricing/): what is free and what is paid.
- [How it works](https://your-domain.com/methodology/): the method and its limits.

## Reference

- [Rules](https://your-domain.com/checks/): every rule the tool applies.

## Optional

- [Changelog](https://your-domain.com/changelog/): what changed, dated.`}</pre>
      <p>
        Three properties do most of the work: absolute URLs, descriptions that say something the
        link text does not, and a stable order that puts the most useful pages first. The optional
        section is the right place for pages that are useful but not central; it is not a place to
        hide the product.
      </p>

      <h2>Common mistakes, in the order they cost you</h2>
      <ol>
        <li>
          <strong>Serving HTML at <code>/llms.txt</code>.</strong> A framework catch-all route
          returns the app shell with a 200, the file fails every structural check, and the reader
          gets a page where a file was promised. Check the content type and the first bytes.
        </li>
        <li>
          <strong>Listing pages that do not exist.</strong> The scanner cannot catch this because
          it does not follow the links; a reader can, and a broken map is worse than no map.
        </li>
        <li>
          <strong>Writing marketing instead of a map.</strong> The summary is one sentence; the
          sections are links. A page of adjectives tells an agent nothing it can use.
        </li>
        <li>
          <strong>Letting it drift.</strong> A dated file that still lists the old pricing page is
          a false statement about the site, and it is the most common failure of hand-maintained
          files. Either generate the list from a source of truth or put the review date in the CI
          checklist.
        </li>
        <li>
          <strong>Expecting it to fix access.</strong> If a crawler is refused a page, the context
          file cannot serve the content it is refused. Fix the refusal first; the article on
          403s covers how to tell which layer is refusing.
        </li>
      </ol>

      <h2>How to test yours in four commands</h2>
      <pre>{`# 1. Status and content type
curl -sS -D - -o /dev/null https://your-domain.com/llms.txt

# 2. It should start with a heading, not HTML
curl -sS https://your-domain.com/llms.txt | head -n 3

# 3. Count the markdown links
curl -sS https://your-domain.com/llms.txt | grep -cE '\\[[^]]+\\]\\(https?://'

# 4. Find links worth checking by hand
curl -sS https://your-domain.com/llms.txt | grep -oE 'https?://[^)]+' | sort -u`}</pre>
      <p>
        Command 3 is a proxy for the scanner's structure test; command 4 gives you the list to
        check against a sitemap or a link checker. A file with a heading, a summary and three
        links passes the rule. A file with those and no broken links is actually useful.
      </p>

      <h2>What to expect from it</h2>
      <p>
        Nothing measurable, in the short term. If your server logs show requests for{" "}
        <code>/llms.txt</code>, something is reading it; if they do not, nothing is. The file is
        best treated as a low-cost convention with a diagnostic side effect: it forces a site to
        state, in one page, what it is and which URLs matter.
      </p>
      <p>
        The higher-value work is unchanged: make the pages fetchable, put the content in the
        response, and structure it so an answer can be extracted. A context file is a nice
        description of a site that already works. It is not a substitute for one.
      </p>
    </PostShell>
  );
}
