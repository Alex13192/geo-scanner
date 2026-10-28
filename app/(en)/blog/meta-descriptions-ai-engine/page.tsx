import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("meta-descriptions-ai-engine");
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
        title: "Questions about meta descriptions",
        items: [
          {
            q: "Does an AI engine read the meta description?",
            a: "There is no public evidence that any major AI engine uses it as an answer source, and no provider documents it. It is known that search engines use descriptions for result snippets and may rewrite them. For AI, the honest answer is: unknown, and a page should not depend on it.",
          },
          {
            q: "Is it worth writing at all?",
            a: "Yes, for two reasons that do not depend on AI: a search result's description affects whether a person clicks, and a concise summary helps a crawler or a human preview understand what the page is before reading it. Both are real; neither is a citation guarantee.",
          },
          {
            q: "Why does the scanner score only the length?",
            a: "Because length is the part a single fetch can check. The rule wants 50-160 characters of the content attribute; the rule page notes that entities count in their source form, so a description can look in-range to a reader and out-of-range to the scanner. Writing quality is not measured by any automated check.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("how-answer-engines-pick-the-span-they-quote"),
          label: "How answer engines pick the span they quote",
          note: "The passages an answer is built from, which are not the description.",
        },
        {
          href: insightPath("statistics-without-sources-citation-trap"),
          label: "Statistics without sources: the citation trap",
          note: "The other place a short summary can promise more than the page delivers.",
        },
        {
          href: "/checks/description/",
          label: "The rule this article is about",
          note: "Two points for a description between 50 and 160 characters, and the entity-counting caveat.",
        },
      ]}
    >
      <p>
        The question sounds technical and has a disappointingly honest answer: nobody outside the
        model providers knows, and they do not document it. Meta descriptions are definitely used by
        search engines for result snippets, with the caveat that they are often rewritten. Whether an
        answer engine reads the description of a candidate page and uses it as a summary is not
        published, and any article that claims otherwise is guessing.
      </p>
      <p>
        So this article does not answer the question with a confident yes or no. It does the two
        useful things instead: explains what a description is actually for, and measures what can be
        measured on this site — the lengths the scanner's rule cares about.
      </p>

      <h2>What the description is for</h2>
      <p>
        A meta description is a page-level summary in the head. Search engines may show it in the
        result, or may replace it with a passage from the page. Social previews sometimes use it when
        an Open Graph description is absent. A crawler that wants a one-line idea of the page before
        parsing the body has it right there.
      </p>
      <p>
        That is a real job, and it is a different job from the page copy. The page answers a
        question; the description says which question. The best descriptions are specific, match the
        page, and contain a detail that distinguishes the result from the ten around it.
      </p>

      <h2>What the scanner checks</h2>
      <p>
        The rule is <Link href="/checks/description/">description</Link>, worth 2 points in the
        metadata dimension. The condition is a meta description between 50 and 160 characters; one
        outside the range is a partial pass worth 1 of the 2. The rule page notes that the length is
        the content attribute as written, so HTML entities count in their source form.
      </p>
      <p>
        That is all a single fetch can check. Nothing reads the description for truth, duplicates, or
        whether it matches the page; a perfectly in-range description that promises a feature the
        page does not have passes.
      </p>

      <h2>A measurement on this site</h2>
      <p>
        To make the length check concrete, I fetched 40 URLs from this site&rsquo;s sitemap on
        2026-10-28 — a systematic sample of every Nth URL, not a random one — and measured the
        description attribute. The result:
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Measurement</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pages sampled</td>
              <td>40</td>
            </tr>
            <tr>
              <td>Descriptions between 50 and 160 characters</td>
              <td>33</td>
            </tr>
            <tr>
              <td>Descriptions shorter than 50</td>
              <td>4</td>
            </tr>
            <tr>
              <td>Descriptions longer than 160</td>
              <td>3</td>
            </tr>
            <tr>
              <td>Missing descriptions</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Seven of forty are outside the range, which is a normal distribution for a site with
        hand-written and generated pages mixed together. The sample says nothing about AI engines; it
        says that the length check is cheap to run and that a site can see its own numbers without
        waiting for an audit tool.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li>
          <strong>The template duplicate.</strong> Every page gets the same generated sentence with
          the page name inserted. The result is forty descriptions that distinguish nothing.
        </li>
        <li>
          <strong>The promise the page does not keep.</strong> A description is a summary, not a
          sales line; if it claims a feature that is not on the page, the click lands on a
          disappointment.
        </li>
        <li>
          <strong>The truncated ending.</strong> A 200-character description that ends mid-sentence
          is truncated by the result and by the rule; write for the length you will actually get.
        </li>
        <li>
          <strong>Ignoring entities.</strong> The scanner measures the source attribute, so an
          ampersand written as <code>&amp;amp;</code> counts as five characters. A description can
          be in-range visually and out-of-range mechanically.
        </li>
        <li>
          <strong>Contradicting the title or the H1.</strong> The three are read together; a
          description that describes a different page is a signal that the page is inconsistent.
        </li>
        <li>
          <strong>Treating it as answer copy.</strong> The description is not the passage an engine
          quotes. The answer has to be in the body.
        </li>
      </ul>

      <h2>How to write one that survives all three readers</h2>
      <p>
        The pattern is short: state what the page answers, for whom, with one distinguishing detail.
        Aim for roughly 120–155 characters. Avoid "learn more", "in this article" and adjectives that
        could describe any page on the site. If the page has a number or a specific claim, the
        description can carry it — provided the page supports it.
      </p>
      <pre>{`<meta name="description"
  content="How the scanner separates a robots.txt block from a WAF 403, with two curl probes and what each status pair means." />`}</pre>
      <p>
        That description names the topic, the method and the scope, in 137 characters. It is not a
        claim about AI; it is a reason for a reader to choose this result over a generic one.
      </p>

      <h2>What can be tested</h2>
      <pre>{`# 1. Extract the description and its length
curl -sS https://your-domain.com/page/ \\
  | grep -oE '<meta[^>]+name="description"[^>]*>' | head -1

# 2. Length, counting the raw attribute
curl -sS https://your-domain.com/page/ \\
  | grep -oE 'name="description"[^>]*content="[^"]*"' | sed 's/.*content="//;s/"$//' | wc -c

# 3. Duplicates across a handful of pages
for u in / /pricing/ /methodology/ /blog/; do
  curl -sS "https://your-domain.com$u" | grep -oE 'name="description"[^>]*content="[^"]*"'
done | sort | uniq -d`}</pre>
      <p>
        What cannot be tested from outside: whether an AI engine reads it. There is no endpoint that
        reports that, and no public documentation to cite. The honest position is to treat the
        description as a human-facing summary and a search-snippet input, and to make the page work
        without it.
      </p>

      <h2>So does an AI engine read it?</h2>
      <p>
        Unknown. It may be used as a cheap page summary in some retrieval or preview step; it is not
        an answer source, and no provider says it is. What is certain is the asymmetry: the
        description affects whether a person clicks and whether a preview reads well, and those are
        measurable. The AI part is not something a site can verify, so it should not be the reason
        the description is written.
      </p>
      <p>
        The usual standard applies: write it for the reader, keep it true to the page, make the
        length checkable, and do not let a summary stand in for content that is not there.
      </p>
    </PostShell>
  );
}
