import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("how-answer-engines-pick-the-span-they-quote");
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
        title: "Questions about quoted spans",
        items: [
          {
            q: "Can I control which sentence an engine quotes?",
            a: "No. Passage selection is the engine's decision and the details are not published. What a writer can control is how easy the page makes it: a heading that states the question, an answer in the first sentence or two, and paragraphs that each carry one idea. The rest is the engine's choice.",
          },
          {
            q: "Does answer-first mean dumbing the page down?",
            a: "No; it means ordering. The direct answer comes first, then the qualification, the evidence and the exceptions. A reader who wants the short version gets it; a reader who wants the argument keeps reading. The failure mode is burying the answer under a long setup so that neither a person nor a parser can find it quickly.",
          },
          {
            q: "Do tables and lists really help?",
            a: "They help because they are the structures a parser can lift without making a judgement about prose. A table row is already a tuple; a list item is already a claim. Prose can express the same thing, but the parser has to infer the boundaries. Neither form is a guarantee that an engine uses the content.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("datepublished-datemodified-ai-freshness"),
          label: "datePublished, dateModified and AI freshness",
          note: "The date is part of the same judgement: whether the span is worth quoting now.",
        },
        {
          href: insightPath("faqpage-schema-after-rich-results"),
          label: "FAQPage schema after the rich-result changes",
          note: "Question-and-answer structure in markup, and the difference between marking up and being useful.",
        },
        {
          href: "/checks/answer-first/",
          label: "The rule this article is about",
          note: "The 30-pair sample, the 80-word opener and the partial-pass arithmetic.",
        },
      ]}
    >
      <p>
        A citation in an AI answer is usually a paragraph or a sentence, not a page. The engine
        retrieves candidate pages, then some smaller unit inside them, and then writes an answer
        around what it kept. The published detail of how that selection works varies by provider
        and changes; what does not change is the asymmetry — the page author decides how easy the
        passage is to find, and the engine decides whether to use it.
      </p>
      <p>
        This article is about the author&rsquo;s half: what a quotable span looks like, how headings
        and opening sentences frame it, and which structures a parser can lift without guessing.
        It is not a claim about any engine&rsquo;s ranking or a promise that a well-structured
        paragraph will be quoted.
      </p>

      <h2>The pipeline, in general terms</h2>
      <p>
        Most answer systems have the same broad shape: take a question, retrieve a set of candidate
        pages, cut them into passages, rank the passages against the question, and generate an
        answer with citations to the passages that survived. The exact cut and the exact ranker are
        proprietary, which is why this article stays at the level of structure rather than
        algorithm.
      </p>
      <p>
        Two consequences follow. First, the unit of competition is the passage, not the page: a long
        page with one excellent section can compete on that section. Second, the passage has to
        make sense on its own — a fragment that says "this is why it matters" without the thing it
        refers to is a worse citation than a self-contained sentence.
      </p>

      <h2>What a heading does for a passage</h2>
      <p>
        A heading is a scope declaration. When a parser cuts a page into passages, the heading above
        a paragraph is often the cheapest available label for what the paragraph is about. That is
        why question-shaped headings work: they match the shape of the question, and they tell the
        reader (and the extractor) exactly what the next block answers.
      </p>
      <p>
        The scanner&rsquo;s rule for this is{" "}
        <Link href="/checks/qa-headings/">qa-headings</Link>, worth 4 points. It counts H2 and H3
        headings that end in a question mark or begin with how, what, why, which, when, who, where,
        is, are, do, does, can, should or will. Three qualifying headings is a pass; one or two is a
        partial pass. The rule page is candid about the shortcut: "What we do" counts as
        question-shaped and "Our approach" does not, whatever either one actually answers.
      </p>
      <p>
        The lesson is structural, not lexical. A heading that names the question the section
        answers is better than a heading that names the topic; the exact phrasing is yours to
        choose.
      </p>

      <h2>The first paragraph after the heading</h2>
      <p>
        If the heading is the label, the opening paragraph is the candidate answer. Engines and
        parsers tend to treat the first sentences after a heading as the dense part of the section,
        because that is where the author usually puts the claim. The scanner&rsquo;s{" "}
        <Link href="/checks/answer-first/">answer-first</Link> rule makes this concrete: of the
        first 30 heading-then-paragraph pairs, at least 60% must open with a paragraph of 80 words
        or fewer. Fewer than three pairs fails; three or more with a lower ratio gets a partial
        pass.
      </p>
      <p>
        An 80-word opener is not a style rule; it is a proxy for "the answer arrives before the
        caveats". A section that opens with three sentences of context and puts the answer in
        paragraph four is harder to cut cleanly: the passage either includes the setup (and is
        bloated) or starts mid-thought (and is self-contained only by accident).
      </p>
      <p>
        The practical rewrite is: state the answer in the first sentence, qualify it in the second,
        then spend the rest of the section on evidence, exceptions and method. A reader who wants
        the short version gets it; a reader who wants the argument keeps reading.
      </p>

      <h2>Structures a parser can lift</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Structure</th>
              <th>Why it is easier to quote</th>
              <th>What to watch for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Numbered steps</td>
              <td>Each item is a claim with an ordinal; the boundaries are explicit.</td>
              <td>Steps that depend on "as above" are not self-contained.</td>
            </tr>
            <tr>
              <td>Comparison table</td>
              <td>A row is already a tuple; the header supplies the meaning.</td>
              <td>Layout tables and images of tables do not count.</td>
            </tr>
            <tr>
              <td>Definition + example</td>
              <td>One sentence defines, the next instantiates; easy to cut.</td>
              <td>Definitions that require the previous section are fragile.</td>
            </tr>
            <tr>
              <td>Numbers with units and sources</td>
              <td>A figure with a denominator and a date can be checked.</td>
              <td>Bare years are not findings; five bare numbers are not a dataset.</td>
            </tr>
            <tr>
              <td>Direct quotation</td>
              <td>Someone else&rsquo;s words are a ready-made span.</td>
              <td>Unattributed pull-quotes are decoration; the scanner only checks that a blockquote exists.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The corresponding rules are deliberately modest:{" "}
        <Link href="/checks/extractables/">extractables</Link> (3 points) wants both a list and a
        table, and admits that a navigation menu and a layout table count;{" "}
        <Link href="/checks/statistics/">statistics</Link> (4 points) wants at least five numeric
        claims and explicitly does not count bare four-digit numbers;{" "}
        <Link href="/checks/quotations/">quotations</Link> (3 points) passes on any{" "}
        <code>&lt;blockquote&gt;</code>, attributed or not. Cheap checks, honestly labelled — the
        judgement about whether the content is worth quoting is still the writer&rsquo;s.
      </p>

      <h2>What makes a passage fail on its own</h2>
      <ul>
        <li>
          <strong>Dependent references.</strong> "This is why it matters", "as we saw above", "the
          second option" — without the antecedent, the passage is a fragment.
        </li>
        <li>
          <strong>One paragraph, three ideas.</strong> A cut lands in the middle of a topic change,
          and the retrieved text answers a different question than the one asked.
        </li>
        <li>
          <strong>The buried answer.</strong> The section opens with a definition of the problem and
          ends with the recommendation; the extractor takes the opening.
        </li>
        <li>
          <strong>Figures without denominators.</strong> "27%" of what, on which sample, measured
          when. A number that cannot be checked is not evidence.
        </li>
        <li>
          <strong>Content that is not in the response.</strong> A passage inside a client-rendered
          tab, a carousel, or an image is not in the HTML a crawler reads. This is the same failure
          as a JavaScript-only article, one level down.
        </li>
      </ul>

      <h2>How to test a page you have</h2>
      <p>
        The test is a simulation, not a measurement: cut the page the way a parser would, then read
        each cut on its own. A few commands get you the raw material.
      </p>
      <pre>{`# 1. Headings, in order
curl -sS https://your-domain.com/page/ | grep -oE '<h[23][^>]*>[^<]*</h[23]>'

# 2. The first paragraph after each heading is harder with grep;
#    a rough proxy is the first sentence of each paragraph:
curl -sS https://your-domain.com/page/ \\
  | sed 's/<[^>]*>/ /g' | tr -s ' ' | grep -oE '[^.]+\\.' | head -20

# 3. Count lists and tables (both should be non-zero)
curl -sS https://your-domain.com/page/ | grep -c '<ul\\|<ol'
curl -sS https://your-domain.com/page/ | grep -c '<table'`}</pre>
      <p>
        Then read the headings as a list: if they read like a table of contents for the question the
        page is trying to answer, the structure is doing its job. If they read like sections of a
        brochure, the passages underneath are harder to retrieve regardless of how good the prose
        is.
      </p>

      <h2>What none of this guarantees</h2>
      <p>
        A page can be perfectly structured and still not be quoted: the engine may not retrieve it,
        may prefer another source, may not have crawled it, or may be answering a different question
        than the author imagined. Structure improves the odds of being extractable; it does not
        control selection.
      </p>
      <p>
        The honest summary is the same one the rest of this series keeps arriving at: make the
        passage findable, make it self-contained, make the claim checkable. Then measure what
        happens instead of assuming it.
      </p>
    </PostShell>
  );
}
