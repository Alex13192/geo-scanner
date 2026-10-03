import type { Metadata } from "next";
import ArticleShell from "../_components/ArticleShell";

import { og } from "@/lib/og";

const TITLE = "Optimizing Headings for Direct AI Citation";
const DESCRIPTION =
  "How to rewrite H2 and H3 headings as real questions and pair them with answer-first paragraphs, so an AI search engine can lift a self-contained answer.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/docs/qa-style-headings/" },
  openGraph: og({
    title: TITLE,
    description: DESCRIPTION,
    url: "/docs/qa-style-headings/",
    type: "article",
  }),
};

export default function Page() {
  return (
    <ArticleShell
      category="Content"
      title={TITLE}
      description={DESCRIPTION}
      readTime="4 min read"
      updated="October 2026"
      faq={{
        title: "Questions about question-shaped headings",
        items: [
          { q: "What makes a heading answerable?", a: "It is phrased the way a person would ask, and the paragraph underneath answers it in the first sentence rather than building up to the answer." },
          { q: "Should every heading become a question?", a: "No. Question headings help where a section genuinely answers something. Forcing one onto a section that is not an answer produces worse writing and no gain." },
          { q: "Does this change how the page looks?", a: "It changes the wording of the heading and the order of the paragraph, not the layout. The headings stay the same size and the page keeps its structure." },
        ],
      }}
    >
      <p>
        <strong>AI engines quote passages, not pages.</strong> A generated answer lifts a
        sentence or two from a source and cites it. Your headings decide whether your passage
        is self-contained enough to lift. That is the entire reason heading structure matters
        more in GEO than it did in classic SEO.
      </p>

      <h2>Why do headings matter more in AI search than in SEO?</h2>
      <p>
        A search engine ranks a URL. A generative engine retrieves a span of text, verifies it
        answers the question, then cites the page it came from. If your heading is{" "}
        <code>Features</code>, a retrieval system has no signal that the paragraph beneath it
        answers anyone's question. If the heading is a real question, the paragraph can be
        matched directly — and it can be quoted without the reader needing surrounding
        context.
      </p>

      <h2>What does a citation-ready heading look like?</h2>
      <p>
        Rewrite labels as interrogatives that match how people actually ask the question. Keep
        the original keyword inside the sentence so traditional rankings do not collapse.
      </p>
      <pre>{`<!-- Before: a label. Nothing to retrieve. -->
<h2>Features</h2>

<!-- After: a retrievable question, keyword intact. -->
<h2>How does Your Company measure brand AI visibility?</h2>`}</pre>
      <p>
        Write the question the way a customer would say it out loud, not the way a
        specification would. <em>"How do I check whether AI crawlers can read my site?"</em>{" "}
        beats <em>"Crawler access verification methodology"</em>.
      </p>

      <h2>What should the first sentence under a heading do?</h2>
      <p>
        <strong>Answer the question immediately, in one declarative sentence.</strong> Treat it
        as the sentence a machine will quote in isolation. Detail, caveats and examples belong
        in the sentences that follow.
      </p>
      <p>
        A reliable test: copy that first sentence on its own and ask whether it still makes
        sense to someone who has not read the rest of the page. If it opens with{" "}
        <em>"As we mentioned above"</em> or <em>"It depends"</em>, it fails the test and will
        not be selected.
      </p>

      <h2>How do I rewrite existing headings without losing rankings?</h2>
      <ol>
        <li>List the pages that already get search traffic. Those headings are load-bearing.</li>
        <li>Keep the primary keyword, convert the surrounding wording into a question.</li>
        <li>Add the one-sentence answer directly under the heading, before any preamble.</li>
        <li>Leave URL slugs alone. Changing a heading is safe; changing a URL is a migration.</li>
        <li>Check that each H2 still maps to exactly one question. Split headings that cover two.</li>
      </ol>

      <h2>What are the common mistakes?</h2>
      <ul>
        <li><strong>Question-shaped headings with no answer underneath.</strong> The pattern is easy to copy and worthless without the answer-first sentence.</li>
        <li><strong>Every heading a question.</strong> Navigation and section labels do not need it; forcing it produces awkward prose that readers bounce off.</li>
        <li><strong>Burying the answer.</strong> If the direct answer is in paragraph three, a retrieval system may not reach it.</li>
        <li><strong>Marketing language in the answer slot.</strong> <em>"We are the leading provider…"</em> is not an answer and will not be cited.</li>
      </ul>
      <p>
        Pair this with structured data: see{" "}
        <a href="/docs/schema-org-jsonld/">implementing Schema.org JSON-LD for entity
        disambiguation</a>.
      </p>
    </ArticleShell>
  );
}
