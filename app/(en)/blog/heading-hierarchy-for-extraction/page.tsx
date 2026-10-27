import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("heading-hierarchy-for-extraction");
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
        title: "Questions about heading hierarchy",
        items: [
          {
            q: "Does heading hierarchy affect ranking?",
            a: "It is a structural signal, not a ranking switch. What it does affect is how a page is cut into passages, how a screen reader navigates it, and whether a parser can tell which heading labels which block. Those matter for extraction; none of them guarantees a citation.",
          },
          {
            q: "Can I have more than one H1?",
            a: "HTML allows it; the scanner does not. Its h1-single rule gives full points for exactly one non-empty H1, a partial pass for several, and no points for none. The practical reason is that the H1 is the page's name; multiple names make the outline ambiguous.",
          },
          {
            q: "Are card titles headings?",
            a: "They can be, and on a list page they often are. The cost is that every card adds a heading to the document outline, so a page of twenty cards produces twenty headings that do not describe the page's sections. If the heading exists only to style a card, a non-heading element is usually the better choice.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("how-answer-engines-pick-the-span-they-quote"),
          label: "How answer engines pick the span they quote",
          note: "Why the heading is the cheapest label a passage cutter has.",
        },
        {
          href: insightPath("tables-lists-and-prose-only-facts"),
          label: "Tables, lists and the cost of prose-only facts",
          note: "The other structural layer: liftable facts inside the sections.",
        },
        {
          href: "/checks/h1-single/",
          label: "The rule this article is about",
          note: "The exact arithmetic for zero, one and several H1s.",
        },
      ]}
    >
      <p>
        Headings are usually discussed as an SEO convention: one H1, H2s for sections, don't skip
        levels. The convention is right, but the reason usually given is incomplete. Headings are
        not just a keyword structure; they are the boundaries a parser uses to cut a page into
        passages, and the labels it attaches to them. A page with a clean outline is easier to
        quote; a page with four H2s that all say "Overview" is four sections to a counter and one
        blur to a reader.
      </p>
      <p>
        This article is about the extraction view of hierarchy: what the heading outline does, how
        the scanner scores it, and the patterns that pass the checks while leaving the document
        harder to use.
      </p>

      <h2>What a heading does for a parser</h2>
      <p>
        A page is a sequence of blocks. To answer a question from it, a system has to decide where
        one passage ends and the next begins. The heading is the cheapest boundary available: it is
        explicit in the markup, it usually names the topic of what follows, and it can be read
        without understanding the prose.
      </p>
      <p>
        That gives a heading three jobs. It marks a boundary, it labels the passage, and it states
        the level of the section. A heading that does only the first (a decorative label), or
        mislabels the passage, or sits at the wrong level, weakens all three.
      </p>

      <h2>The outline failures that matter</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Failure</th>
              <th>What it does to extraction</th>
              <th>Why it is easy to miss</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>No H1, or several</td>
              <td>The page has no single name, or several competing ones.</td>
              <td>Visually, one of them is just larger text.</td>
            </tr>
            <tr>
              <td>H3 before any H2</td>
              <td>The outline implies a parent section that does not exist.</td>
              <td>Browsers do not care; the page looks fine.</td>
            </tr>
            <tr>
              <td>Generic headings ("Overview", "Details")</td>
              <td>Passages are labelled with words that do not distinguish them.</td>
              <td>They read as tidy to the author, who knows the context.</td>
            </tr>
            <tr>
              <td>Card titles as headings</td>
              <td>A list page produces dozens of headings that are not sections.</td>
              <td>Each card is individually reasonable.</td>
            </tr>
            <tr>
              <td>Headings used for styling</td>
              <td>The outline claims structure the content does not have.</td>
              <td>It is the fastest way to make text big.</td>
            </tr>
            <tr>
              <td>Sections with no heading</td>
              <td>Two topics share one passage boundary.</td>
              <td>The prose still reads smoothly to a person.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What the scanner checks</h2>
      <p>
        Three rules cover the outline, and each one is a floor:
      </p>
      <ul>
        <li>
          <Link href="/checks/h1-single/">h1-single</Link> (3 points): exactly one non-empty H1.
          Zero H1s scores nothing; more than one is a partial pass worth 1 of the 3. Empty H1s are
          dropped before counting.
        </li>
        <li>
          <Link href="/checks/sections/">sections</Link> (3 points): at least four H2 elements.
          Two or three is a partial pass. The text is never read, so four H2s that all say
          "Overview" are four sections to this check.
        </li>
        <li>
          <Link href="/checks/landmarks/">landmarks</Link> (3 points): at least three of{" "}
          <code>main</code>, <code>article</code>, <code>section</code>, <code>header</code>,{" "}
          <code>nav</code> and <code>footer</code> appear as elements. ARIA roles do not count, so
          a page built from <code>&lt;div role="main"&gt;</code> scores nothing here however it
          reads to assistive technology.
        </li>
      </ul>
      <p>
        There is a fourth, related rule — <Link href="/checks/qa-headings/">qa-headings</Link>{" "}
        (4 points) — which counts headings shaped like questions. It is a different question: not
        whether the outline is coherent, but whether it matches the way people ask.
      </p>
      <p>
        The limits are the same as everywhere else in this scanner. The rules count elements and
        levels, not meaning. A page can pass all three with headings that are generic, duplicated or
        arranged around marketing sections rather than the reader's questions.
      </p>

      <h2>Reading your own outline</h2>
      <p>
        The useful test is to extract the headings and read them as a table of contents. If the
        list explains what the page covers, the outline is doing its job. If it reads like a
        sequence of campaign phrases, the passages underneath are harder to label.
      </p>
      <pre>{`# 1. The outline, in order
curl -sS https://your-domain.com/page/ \\
  | grep -oE '<h[1-6][^>]*>[^<]*</h[1-6]>'

# 2. Count the levels
for level in 1 2 3 4 5 6; do
  printf 'h%s: ' "$level"
  curl -sS https://your-domain.com/page/ | grep -oE "<h\${level}[ >]" | wc -l
done

# 3. Duplicate heading text (a signal of card titles or generic labels)
curl -sS https://your-domain.com/page/ \\
  | grep -oE '<h[1-6][^>]*>[^<]*</h[1-6]>' | sort | uniq -d`}</pre>
      <p>
        Then read the list. Are the H2s the sections a reader would name? Does every H3 sit under an
        H2 that explains it? Are there headings that exist only because the template needed a slot?
        Those are the fixes that no counter will ask for.
      </p>

      <h2>A hierarchy that survives both readers</h2>
      <p>
        The pattern that works for extraction and for people is the same one: one page title, a
        handful of sections that answer a question or make a claim, subheadings only where a section
        genuinely splits, and the same wording a reader would use. It is also the pattern that
        works for screen readers, because a heading outline is how many assistive technologies
        navigate a document.
      </p>
      <p>
        Two details are worth stating explicitly. First, headings inside repeated components are a
        trade: a card title as an H3 is accessible when the card is the unit of navigation, and
        noisy when the page is a list of thirty cards. Second, a heading is not a font size. If the
        text needs to be larger, style it; if it needs to be a section, head it.
      </p>

      <h2>What hierarchy buys, and what it does not</h2>
      <p>
        A clean outline buys boundaries and labels: a passage can be cut at the right place and
        named with the heading above it. It also buys accessibility and a page that a person can
        scan. What it does not buy is a citation, a ranking, or a guarantee that the section is
        worth quoting.
      </p>
      <p>
        The structural rule from this series applies here too: the checks count the shapes, and the
        shapes are only as good as the content inside them.
      </p>
    </PostShell>
  );
}
