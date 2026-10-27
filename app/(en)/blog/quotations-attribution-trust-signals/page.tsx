import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("quotations-attribution-trust-signals");
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
        title: "Questions about quotations and attribution",
        items: [
          {
            q: "Does a blockquote need a source to pass the scanner?",
            a: "No. The quotations rule only checks for a blockquote element; it does not read the text or look for attribution, so a pull-quote of the page's own sentence passes. An unattributed quote is a styling decision, not a citation.",
          },
          {
            q: "Is a pseudonymous byline a trust problem?",
            a: "Not by itself. What matters is that the byline is consistent, that there is an author page or contact route, and that the claims are checkable. A pen name with a stable history is more trustworthy than a real name with no accountability; the failure is a name that appears once and cannot be reached.",
          },
          {
            q: "Can I quote an AI-generated statement as an expert quote?",
            a: "Not as an expert quote. Attributing generated text to a person or an organisation that did not say it is fabrication, and it is the kind of fabrication that a reader can catch. If a passage is your own analysis, present it as analysis; if it is someone else's words, quote them exactly and name them.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("statistics-without-sources-citation-trap"),
          label: "Statistics without sources: the citation trap",
          note: "The number half of the same argument: a figure without a source is a liability.",
        },
        {
          href: insightPath("sameas-which-profiles-help-entity-resolution"),
          label: "sameAs: which profiles actually help an entity resolve",
          note: "The identity half: a byline is stronger when the person is a resolvable entity.",
        },
        {
          href: "/checks/quotations/",
          label: "The rule this article is about",
          note: "Three points for a blockquote element, and the rule page's admission that nothing reads inside it.",
        },
      ]}
    >
      <p>
        Quotations are the most quotable content on a page and the easiest to fake. A sentence in
        quotation marks looks like evidence, but the marks are typography, not verification. What
        makes a quote useful is the same thing that makes a number useful: a reader can find out who
        said it, when, and what they meant. This article is about the difference between a quote and
        a pull-quote, and the trust signals around both.
      </p>
      <p>
        The scanner has two rules here, and both are presence checks. Knowing exactly what they look
        at is the first step to not confusing a green tick with credibility.
      </p>

      <h2>What the two rules check</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Points</th>
              <th>What it asks</th>
              <th>What it does not ask</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Link href="/checks/quotations/">quotations</Link>
              </td>
              <td>3</td>
              <td>Does the response contain at least one <code>&lt;blockquote&gt;</code> element?</td>
              <td>Who said it, whether they exist, whether the words are exact, or whether the quote is the page&rsquo;s own sentence in a styled box.</td>
            </tr>
            <tr>
              <td>
                <Link href="/checks/author/">author</Link>
              </td>
              <td>3</td>
              <td>Is authorship signalled by a <code>Person</code> node, an <code>author</code> property, <code>rel=&quot;author&quot;</code>, or a visible byline matching &quot;by Firstname Lastname&quot;?</td>
              <td>Whether that person exists, wrote the page, or can be reached. The rule page notes that &quot;by Jane Doe&quot; in a caption or a comment satisfies it.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        So a page can pass both with a self-quote and a decorative byline. The checks are floors;
        the work is the part they cannot do. The useful question is not "does my page have a
        blockquote" but "if a reader followed this quote back, would they find the person and the
        words?".
      </p>

      <h2>What makes a quotation citable</h2>
      <ul>
        <li>
          <strong>The exact words.</strong> Editing a quote without marking the edit, or stitching
          two answers into one sentence, changes what the person said. Use square brackets for
          clarifications and ellipses for omissions, and do not use them to reverse a meaning.
        </li>
        <li>
          <strong>A named person and role.</strong> "Jane Doe, head of security at Example Labs" is
          checkable; "an expert" is not. The role is part of the attribution, not decoration.
        </li>
        <li>
          <strong>Date and context.</strong> A quote from 2021 may be true and still misleading in a
          2026 article. Say when it was said and what it was answering.
        </li>
        <li>
          <strong>A link where one exists.</strong> If the quote comes from a published interview,
          report, filing or documentation page, link to it. The link is what lets a reader verify the
          words rather than trust the quotation marks.
        </li>
        <li>
          <strong>Permission or fair use.</strong> Quoting a public statement with attribution is
          ordinary practice; quoting a private email or a paid report is a different decision. The
          markup does not make that decision for you.
        </li>
      </ul>

      <h2>The markup, and why the markup is not enough</h2>
      <p>
        A proper quotation names its source in the HTML, not only in the surrounding prose. The{" "}
        <code>cite</code> attribute carries a URL when one exists; a <code>cite</code> element or a
        caption carries the human-readable attribution.
      </p>
      <pre>{`<figure>
  <blockquote cite="https://example.com/interview">
    <p>The measurement is only useful if the reader can re-run it.</p>
  </blockquote>
  <figcaption>
    Jane Doe, head of research at Example Labs, in an interview on 12 March 2026.
  </figcaption>
</figure>`}</pre>
      <p>
        This passes the scanner because of the <code>blockquote</code>. It is also a citation,
        because the source is named and linked. The first fact is cheap; the second is the one that
        changes how a reader (or an engine summarising the page) can use the sentence. A{" "}
        <code>blockquote</code> without a source is a pull-quote: it changes the typography, not the
        evidence.
      </p>

      <h2>Trust signals around the quote</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>What it does</th>
              <th>What breaks it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Author byline</td>
              <td>Names the person accountable for the page.</td>
              <td>A name with no author page, no contact route and no history.</td>
            </tr>
            <tr>
              <td>Author page</td>
              <td>Gives the person a stable identity and a list of their work.</td>
              <td>Claims that cannot be checked, or a page that copies the byline and nothing else.</td>
            </tr>
            <tr>
              <td>Person node in JSON-LD</td>
              <td>Connects the byline to an entity with a <code>sameAs</code>.</td>
              <td>A <code>Person</code> node with no links and no relation to the page.</td>
            </tr>
            <tr>
              <td>Corrections / contact</td>
              <td>Shows that errors have a route to be fixed.</td>
              <td>A contact page that nobody answers, or no route at all.</td>
            </tr>
            <tr>
              <td>Date and method</td>
              <td>Lets a reader judge whether the quote and the claim are current.</td>
              <td>A fresh byline over stale evidence, or no date at all.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        None of these signals is proof. A confident byline and a polished author page can sit on top
        of invented quotes, and a pseudonymous blog can be scrupulous. What the signals do is make
        the claim auditable: they tell a reader where to look, and they make it expensive to
        fabricate without leaving a trail.
      </p>

      <h2>How to audit a page's quotations</h2>
      <pre>{`# 1. Extract the blockquotes from the response
curl -sS https://your-domain.com/page/ \\
  | grep -oE '<blockquote[^>]*>[^<]*' | head

# 2. Look for a cite attribute or a named source near each one
curl -sS https://your-domain.com/page/ \\
  | grep -c 'cite='

# 3. Look for author signals (any one satisfies the scanner)
curl -sS https://your-domain.com/page/ | grep -c 'rel="author"'
curl -sS https://your-domain.com/page/ | grep -ciE '>by [A-Z][a-z]+ [A-Z][a-z]+<'`}</pre>
      <p>
        Then read each quote and ask the three questions the scanner cannot: who said it, when, and
        can a reader check it. A quote that fails any of them is not evidence; it is a sentence in
        quotation marks.
      </p>

      <h2>What this buys, and what it does not</h2>
      <p>
        A named quote with a link is easier to trust and easier to reuse, and a consistent author
        identity gives an engine another way to associate claims with a source. That is real value
        in a medium where summaries circulate without their context.
      </p>
      <p>
        It does not guarantee a citation, and it does not make the quote true. The durable standard
        is the same as for numbers: publish claims a stranger can check, attribute the words to
        someone who said them, and make the route back to the source visible. Everything else is
        typography.
      </p>
    </PostShell>
  );
}
