import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("tables-lists-and-prose-only-facts");
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
        title: "Questions about tables and lists",
        items: [
          {
            q: "Should every fact be in a table?",
            a: "No. A table is for comparable values across the same dimensions. If the facts do not share columns, a table forces them into a shape they do not have, which makes the page harder to read and the data harder to check. Lists are for sequences and sets; paragraphs are for reasoning and nuance.",
          },
          {
            q: "Does the scanner check that a table is a real data table?",
            a: "No. The extractables rule only needs a ul/ol and a table somewhere in the response. A navigation list and a layout table satisfy it, and the rule page says so. The check is a floor: it asks whether the page uses the two structures, not whether they carry the content.",
          },
          {
            q: "Are tables bad for mobile?",
            a: "They are hard on narrow screens, which is a design problem rather than a reason to avoid them. A horizontally scrollable wrapper with a visible caption and readable headers keeps the structure intact; shrinking the text or turning the table into an image loses the thing that made it extractable.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("answer-first-writing-measured-positions"),
          label: "Answer-first writing: measured positions",
          note: "The measurement of where answers sit, and what the rule does not compare.",
        },
        {
          href: insightPath("how-answer-engines-pick-the-span-they-quote"),
          label: "How answer engines pick the span they quote",
          note: "Why the passage, not the page, is the unit an engine works with.",
        },
        {
          href: "/checks/extractables/",
          label: "The rule this article is about",
          note: "Three points for a list and a table, a partial pass for one, and the chrome caveat.",
        },
      ]}
    >
      <p>
        A paragraph can hold several facts and be cited for none of them cleanly. A list item is
        already one claim; a table row is already a tuple. That is the whole structural argument for
        lists and tables: they encode the boundaries a parser would otherwise have to infer from
        prose. The counter-argument is equally real — a page that turns every sentence into a bullet
        stops explaining anything.
      </p>
      <p>
        This article is about the trade: when a table or list makes a fact easier to lift, when it
        makes the page worse, and what the scanner's two structural rules actually verify (less than
        their reputation suggests).
      </p>

      <h2>Why structure helps extraction</h2>
      <p>
        Prose is a sequence of tokens. To get a fact out of it, a parser has to decide where the
        claim starts and ends, what the subject is, and which qualifier belongs to which number. A
        list or a table answers some of those questions in the markup: the item boundary, the
        column header, the row grouping.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Form</th>
              <th>What the markup supplies</th>
              <th>Best for</th>
              <th>Failure mode</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Paragraph</td>
              <td>Nothing beyond sequence</td>
              <td>Reasoning, qualification, causality</td>
              <td>A cut lands mid-thought; several facts share one citeable span</td>
            </tr>
            <tr>
              <td>Unordered list</td>
              <td>Item boundaries</td>
              <td>A set of peers, options, examples</td>
              <td>Items that depend on each other read as a checklist</td>
            </tr>
            <tr>
              <td>Ordered list</td>
              <td>Item boundaries and order</td>
              <td>Procedures, sequences, priority</td>
              <td>Steps that are not really sequential become misleading</td>
            </tr>
            <tr>
              <td>Data table</td>
              <td>Row and column relations</td>
              <td>Comparable values across the same dimensions</td>
              <td>Grid used for layout; rows whose columns do not mean the same thing</td>
            </tr>
            <tr>
              <td>Definition list</td>
              <td>Term and definition pairing</td>
              <td>Glossaries, short definitions</td>
              <td>Long answers crammed into a definition slot</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The last column is the part most guides skip. Structure is not free: every list asserts that
        its items are peers, every table asserts that its rows share the same columns, and every
        ordered list asserts a sequence. If those assertions are false, the markup makes the content
        less accurate than the prose it replaced.
      </p>

      <h2>The cost of prose-only facts</h2>
      <p>
        The cost is not that prose is bad. It is that a paragraph carrying five facts is a single
        unit for a parser, so the answers are coupled: a citation either includes the whole
        paragraph and reads as a wall, or takes a fragment that no longer contains the denominator.
        The fix is not to delete the prose but to separate the enumerable part from the reasoning.
      </p>
      <p>
        Take a sentence like "Three of the six news sites block a crawler, two of the six score
        above 60, and the average is 52." Three figures share one span. As prose, a parser has to
        attribute each figure correctly; as a table row per site, each figure has a row and a
        denominator. The prose is still useful for saying why the pattern matters — the table is
        what makes the numbers checkable.
      </p>

      <h2>What the scanner checks — and what it does not</h2>
      <p>
        The rule is <Link href="/checks/extractables/">extractables</Link>, worth 3 points in the
        content depth dimension. The condition is deliberately blunt: the response must contain both
        a <code>&lt;ul&gt;</code>/<code>&lt;ol&gt;</code> and a <code>&lt;table&gt;</code>. One of
        the two is a partial pass. The rule page admits the consequence: a navigation menu and a
        layout table satisfy it, because the check asks whether the page uses the structures, not
        whether the content lives inside them.
      </p>
      <p>
        The statistics rule next door is similar in spirit:{" "}
        <Link href="/checks/statistics/">statistics</Link> (4 points) counts numeric claims —
        percentages, currency, multipliers, thousands-separated figures, five-digit numbers — and
        explicitly refuses to count bare four-digit numbers because they are usually years. It runs
        over the whole response, chrome included, and five percentages satisfy it as readily as five
        different kinds of measurement.
      </p>
      <p>
        Both rules are cheap floors. Passing them means the page contains the shapes; it does not
        mean the table has headers, the list items are true, or any number has a source. Those are
        editorial checks, and no scanner can make them for you.
      </p>

      <h2>Marking up a table that is actually a table</h2>
      <p>
        The difference between a data table and a layout grid is not visual. A data table names its
        columns in <code>&lt;th&gt;</code> cells, groups the header in <code>&lt;thead&gt;</code>,
        gives each header a scope, and often carries a caption. A layout grid is a set of divs that
        looks like columns. Only the first is liftable in a meaningful way.
      </p>
      <pre>{`<table>
  <caption>Weekly checks, by page type</caption>
  <thead>
    <tr>
      <th scope="col">Page type</th>
      <th scope="col">Checks run</th>
      <th scope="col">Passed</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Homepage</th>
      <td>40</td>
      <td>36</td>
    </tr>
  </tbody>
</table>`}</pre>
      <p>
        The caption is not decoration: it is the sentence that explains what the rows have in
        common, and it is the first thing a screen reader announces. The <code>scope</code>{" "}
        attributes are what let an assistive technology associate a cell with its header. Neither
        is required by the extractables check, and both are what make the table usable by a person.
      </p>

      <h2>Responsive tables without losing the structure</h2>
      <p>
        The usual mobile failure is a table that is widened to fit, shrunk below legibility, or
        replaced with an image. The first two hurt readers; the third also removes the structure
        from the response. The workable pattern is a scroll container with the table at its natural
        width, a caption that names it, and headers that stay visible when the body scrolls.
      </p>
      <pre>{`<div class="overflow-x-auto">
  <table>...</table>
</div>`}</pre>
      <p>
        Wrapping in a scroll container is a layout decision, not a data one: the table still has rows
        and headers in the HTML, and a parser still sees them. Turning it into a grid of divs or an
        image is the version that loses both the structure and the accessibility.
      </p>

      <h2>When a list is worse than prose</h2>
      <ul>
        <li>
          <strong>Causal arguments.</strong> "Because A, B follows unless C" is a sentence, not
          three bullets. Bulleting it destroys the condition.
        </li>
        <li>
          <strong>Dependent steps.</strong> A procedure whose second step assumes the state created
          by the first is an ordered list; a set of tips is not. Mixing them teaches the reader
          that the order does not matter.
        </li>
        <li>
          <strong>Nuance that needs a clause.</strong> A qualifier that applies to only one item
          belongs inside that item, not in a footnote that a list-scraper will drop.
        </li>
        <li>
          <strong>Lists used as layout.</strong> Navigation lists and card grids are lists in the
          markup and not claims in the content; they satisfy the check and help nothing.
        </li>
      </ul>

      <h2>A small test for a page you have</h2>
      <pre>{`# 1. Do the structures exist at all?
curl -sS https://your-domain.com/page/ | grep -c '<ul\\|<ol'
curl -sS https://your-domain.com/page/ | grep -c '<table'

# 2. Does the table have headers, not just cells?
curl -sS https://your-domain.com/page/ | grep -c '<th'

# 3. Does the table have a caption?
curl -sS https://your-domain.com/page/ | grep -c '<caption'

# 4. Plain-text dump: read the page the way a parser approximates it
curl -sS https://your-domain.com/page/ | sed 's/<[^>]*>/ /g' | tr -s ' ' | head -40`}</pre>
      <p>
        The first two commands answer the scanner's question. The next two answer the question the
        scanner does not ask: whether the table is a table. The last one is the useful one — read the
        dumped text and ask whether the facts survive the trip.
      </p>

      <h2>What structure buys, and what it does not</h2>
      <p>
        Structure buys the chance to be quoted precisely: a row can be cited without its neighbours,
        a list item without the rest of the list. It also buys a reader the ability to scan. What it
        does not buy is correctness, and it does not buy a citation. A well-marked-up table of wrong
        numbers is still wrong, and a well-structured page is still only one candidate among the
        sources an engine might use.
      </p>
      <p>
        The useful standard is the one the rest of this series keeps returning to: make the claim
        liftable, make the number checkable, and leave the reasoning in prose where it belongs.
      </p>
    </PostShell>
  );
}
