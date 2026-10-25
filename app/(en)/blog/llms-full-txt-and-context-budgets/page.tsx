import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("llms-full-txt-and-context-budgets");
const TITLE = insight.title;
const DESCRIPTION = insight.description;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: insightPath(insight.slug),
    /* English-first series; translations add their own keys when they ship. */
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
        title: "Questions about llms-full.txt",
        items: [
          {
            q: "Is llms-full.txt a standard?",
            a: "No. It is an optional companion proposed alongside llms.txt: a full-text corpus rather than an index. No major engine has committed to reading it, and there is no specification that makes it binding. Treat it as a convenience file with a cost, not a requirement.",
          },
          {
            q: "How large should it be?",
            a: "There is no universal answer, because context budgets and prices differ by model. The practical test is arithmetic: a file of N characters is roughly N/4 tokens for English prose, and every request that includes it pays that cost. Start with the smallest corpus that answers the questions an agent would ask, and split or prune before adding more.",
          },
          {
            q: "Should I publish it if I already have llms.txt?",
            a: "Only if the index is not enough. The index is cheap and tells a reader what exists; the full file is expensive and tells a reader everything. For most sites the index plus readable HTML is the better trade. This site currently publishes the index and not the corpus, for that reason.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("llms-txt-what-it-changes"),
          label: "llms.txt: what it changes and what it does not",
          note: "The index half of the pair, including the 3.3-point ceiling and the four properties the scanner checks.",
        },
        {
          href: insightPath("what-a-crawler-sees-without-javascript"),
          label: "What a crawler sees when your page needs JavaScript",
          note: "Why a context file cannot compensate for a page whose content never reaches the response.",
        },
        {
          href: "/docs/llms-txt-deployment/",
          label: "The deployment guide",
          note: "Where the file goes, how to serve it, and the checks worth running after a deploy.",
        },
      ]}
    >
      <p>
        <code>llms.txt</code> is an index: a short map of what a site contains.{" "}
        <code>llms-full.txt</code> is the optional other half of the proposal — the corpus itself,
        in one Markdown file. The idea is easy to like: give an agent everything at once and skip
        the fetching. The catch is that "everything" is not free, and the file is usually built by
        someone who never has to pay the context bill.
      </p>
      <p>
        This article is about the trade-off in numbers: what a full corpus costs in tokens, what
        belongs in it, how to split it when it does not fit, and how to tell whether your site
        should publish one at all.
      </p>

      <h2>What the pair is for</h2>
      <p>
        The convention, described at{" "}
        <a href="https://llmstxt.org/" rel="noopener noreferrer">
          llmstxt.org
        </a>
        , defines a Markdown index at <code>/llms.txt</code> with a title, a one-line summary and
        sections of links. <code>/llms-full.txt</code> is mentioned as an optional companion for
        readers that want the content rather than the map. Nothing in the proposal says an engine
        must read either file, and no provider has published an obligation to do so. The files are
        an offer, not a contract.
      </p>
      <p>
        That framing matters because the two files have opposite cost profiles. The index is
        kilobytes and cheap to send on every request. The corpus can be megabytes and is expensive
        to include in a context window, both in tokens and in the attention the model can spend on
        any one part of it. Publishing the second because the first was easy is how a cheap signal
        becomes an expensive one.
      </p>

      <h2>The arithmetic nobody puts in the proposal</h2>
      <p>
        English prose is roughly four characters per token, so a file of N characters is around
        N/4 tokens. The conversion is approximate — Markdown tables, code and non-English text are
        worse — but it is good enough to see the shape of the problem.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>File size</th>
              <th>Rough token count</th>
              <th>What that means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10 KB</td>
              <td>~2,500 tokens</td>
              <td>An index plus a few short pages; cheap to include.</td>
            </tr>
            <tr>
              <td>100 KB</td>
              <td>~25,000 tokens</td>
              <td>A small documentation site; already a real share of many working budgets.</td>
            </tr>
            <tr>
              <td>500 KB</td>
              <td>~125,000 tokens</td>
              <td>A mid-sized docs corpus; expensive per request and hard to attend to evenly.</td>
            </tr>
            <tr>
              <td>2 MB</td>
              <td>~500,000 tokens</td>
              <td>Beyond the working budget of many models, and costly even where it fits.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Two things follow. First, the cost is paid per request if the file is passed as context;
        a tool that reads it on every question pays it every time. Second, fitting is not the same
        as using: a model with a large window does not attend equally to a hundred thousand tokens,
        and the section that matters can be diluted by the sections that do not. A smaller, ordered
        corpus is often more useful than a complete one.
      </p>

      <h2>What belongs in the corpus</h2>
      <p>
        The useful test is not "is this page public?" but "would an agent need this to answer a
        question about the product correctly?". That keeps the file small and raises its signal.
      </p>
      <ul>
        <li>
          <strong>Include:</strong> the product overview, the method and its limits, the rules or
          reference pages that define terms, pricing and what is included, the legal/refund
          essentials, and the pages that answer "how do I do X".
        </li>
        <li>
          <strong>Exclude:</strong> navigation, cookie banners, repeated calls to action, blog
          posts that restate the same point, drafts, internal notes, anything behind a login, and
          anything about a person who has not agreed to be in a training corpus.
        </li>
        <li>
          <strong>Deduplicate:</strong> five pages saying "we scan 40 checks" are one fact and four
          copies. The copies cost tokens and add nothing.
        </li>
        <li>
          <strong>Keep the boundaries:</strong> a short "what this does not do" section is more
          valuable than another marketing paragraph, because it stops an agent from over-claiming
          on your behalf.
        </li>
      </ul>

      <h2>Three ways to stay inside the budget</h2>
      <p>
        <strong>1. Cap and prune.</strong> Pick a ceiling — 100–200 KB is a reasonable starting
        range for a small product — and treat it as a budget. When a page is added, something is
        removed or shortened. This is the simplest strategy and the one most likely to stay
        accurate.
      </p>
      <p>
        <strong>2. Split by area.</strong> Keep <code>llms-full.txt</code> for the core corpus and
        publish per-area files for the rest (for example a rules reference and a deployment
        guide), linked from the index. An agent that needs one area fetches one file. This trades a
        little discoverability for a much smaller context bill.
      </p>
      <p>
        <strong>3. Generate from the source of truth.</strong> Build the file at deploy time from
        the same content that renders the pages, and stamp it with a date and a version. A
        hand-maintained corpus drifts the first week; a generated one can be diffed. The cost is a
        build step and the discipline to exclude what should not ship.
      </p>

      <h2>Implementing it on a normal web stack</h2>
      <p>
        The file is just text at a path, so the implementation is small. A route that returns
        Markdown with the right headers, generated at build time, is enough.
      </p>
      <pre>{`// app/llms-full.txt/route.ts - static generation, one file
export const dynamic = "force-static";

export function GET() {
  return new Response(CORPUS, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}`}</pre>
      <p>
        Three details make it easier to maintain. Put the content in one source module that both
        the route and the index read, so the index cannot advertise a section the corpus dropped.
        Add a "last updated" line and a version, so a reader can tell whether it is stale. And
        serve it as <code>text/markdown</code>, not <code>text/html</code> — a framework catch-all
        that returns the app shell is the most common failure of both files.
      </p>
      <p>
        Then link it from <code>llms.txt</code>, because that is how a reader that only knows about
        the index discovers the corpus:
      </p>
      <pre>{`## Corpus

- [Full text](https://your-domain.com/llms-full.txt): the complete corpus in one Markdown file.`}</pre>

      <h2>What this site does, and why</h2>
      <p>
        LLMention publishes <code>/llms.txt</code> and does not publish{" "}
        <code>/llms-full.txt</code>. The index is about 9 KB; the full corpus of guides, rule
        pages and essays would be several hundred kilobytes before deduplication, which is the
        range where the costs in the table above start to matter more than the convenience.
      </p>
      <p>
        The site also already serves its content as readable HTML and has a Markdown rendering path
        for the pages a reader is most likely to want. Adding a corpus would duplicate that content
        in a second place that has to be kept in sync. The trigger to add one is specific: if the
        index stops being enough — for example, if an integration needs the rules text in one
        request — the right move is a generated, capped corpus for the reference sections, not a
        dump of the whole site.
      </p>

      <h2>How to test what you published</h2>
      <pre>{`# 1. Status, content type and size
curl -sS -D - -o /dev/null https://your-domain.com/llms-full.txt

# 2. Size in bytes and rough tokens (bytes/4 is a rough English estimate)
curl -sS https://your-domain.com/llms-full.txt | wc -c

# 3. It should be Markdown, not an HTML shell
curl -sS https://your-domain.com/llms-full.txt | head -n 5

# 4. Check that the sections you expect are present
curl -sS https://your-domain.com/llms-full.txt | grep -c '^## '`}</pre>
      <p>
        If the response is HTML, the route is being caught by a framework fallback. If the size is
        far above your ceiling, the generator is including pages that should be excluded. If the
        section count is lower than the index promises, the two files have drifted.
      </p>

      <h2>What a corpus does not change</h2>
      <p>
        A full-text file does not grant crawl access, does not render a JavaScript-only page, and
        does not create a citation. It is a convenience for a reader that has already decided to
        look, and it can make an agent's answers more accurate by giving it your own words instead
        of a summary of them. That is a real benefit; it is not the same benefit as being readable,
        and it is not a promise that any engine will read the file at all.
      </p>
      <p>
        The honest ordering is unchanged: make the pages fetchable, put the content in the
        response, structure it so it can be extracted. A corpus is the next step after those, not a
        shortcut around them.
      </p>
    </PostShell>
  );
}
