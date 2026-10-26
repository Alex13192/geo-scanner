import type { Metadata } from "next";
import Link from "next/link";
import PostShell from "@/app/components/PostShell";
import { getInsight, insightPath } from "@/lib/insights";
import { social } from "@/lib/og";

const insight = getInsight("answer-first-writing-measured-positions");
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
        title: "Questions about measuring answer-first writing",
        items: [
          {
            q: "Is this measurement the same as the scanner's rule?",
            a: "It is the same shape, not the same code. The scanner takes the first 30 heading-then-paragraph pairs in the first 200 KB, allows wrapper elements between the heading and the paragraph, and excludes pages with fewer than three pairs. The measurement here used a simpler regex over the rendered HTML of this blog's articles. It is close enough to describe the pattern and not close enough to replace the scanner.",
          },
          {
            q: "Why not use the 30-site study?",
            a: "Because the study did not record paragraph positions. It recorded scores, statuses and the entity/sameAs booleans. Publishing a statistic about openings that the dataset never measured would be exactly the kind of invented number this site refuses to print, so the measurement is scoped to pages where it was actually taken: this blog, on 2026-10-26.",
          },
          {
            q: "Does a short opening paragraph get a page cited?",
            a: "No. It makes the passage easier to cut and read on its own, which is a precondition for being extractable. Whether an engine retrieves and quotes it is the engine's decision, and nothing in this measurement speaks to that.",
          },
        ],
      }}
      related={[
        {
          href: insightPath("how-answer-engines-pick-the-span-they-quote"),
          label: "How answer engines pick the span they quote",
          note: "The conceptual version: headings as scope, openers as candidate answers, liftable structures.",
        },
        {
          href: insightPath("thirty-homepages-none-graded-a"),
          label: "We scanned 30 homepages and none graded an A",
          note: "The study this article deliberately does not claim numbers from.",
        },
        {
          href: "/checks/answer-first/",
          label: "The rule this article is about",
          note: "The exact 30-pair sample, the 80-word opener and the partial-pass arithmetic.",
        },
      ]}
    >
      <p>
        "Answer-first" is easy to say and hard to check. It usually means: put the answer in the
        first sentence or two after a heading, then explain. That description is a style opinion
        until someone measures it. This article measures it — not across the web, and not across
        the 30-site study, which never recorded paragraph positions, but across the pages where
        the measurement was actually taken: this blog, on 2026-10-26.
      </p>
      <p>
        The result is a small, reproducible number, and the method matters more than the number.
        Both are below.
      </p>

      <h2>What "position" means here</h2>
      <p>
        The scanner's rule is{" "}
        <Link href="/checks/answer-first/">answer-first</Link>, worth 3 points. It looks at the
        first 30 heading-then-paragraph pairs in the page: an H2 or H3, optionally some wrapper
        elements, then a paragraph. At least 60% of those opening paragraphs must be 80 words or
        fewer. Fewer than three pairs fails the check; three or more with a lower ratio is a
        partial pass worth 1 of the 3 points.
      </p>
      <p>
        Two words in that description do the work. "Opening" means the first paragraph after the
        heading, not the best paragraph in the section. "Position" means where the answer sits
        relative to the heading, not how good the answer is. The rule cannot tell whether the first
        paragraph actually answers the heading; it can only tell whether the answer arrives early
        enough to be cut cleanly.
      </p>

      <h2>The measurement, and its scope</h2>
      <p>
        On 2026-10-26 I fetched the 16 English blog articles on this site, extracted their H2/H3
        headings and the first paragraph after each, and counted words. The method is a regex
        approximation of the rule, not the scanner itself: it reads the rendered HTML, strips tags,
        and treats whitespace-separated tokens as words. It does not allow wrapper elements, and it
        only counts a heading if a paragraph follows before the next heading. That makes it a
        slightly stricter, simpler version of the check.
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Measurement</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Articles measured</td>
              <td>16 (all English blog articles live on 2026-10-26)</td>
            </tr>
            <tr>
              <td>Heading-to-paragraph pairs found</td>
              <td>101</td>
            </tr>
            <tr>
              <td>Opening paragraphs of 80 words or fewer</td>
              <td>91 (90.1%)</td>
            </tr>
            <tr>
              <td>Articles meeting the 60% threshold with at least 3 pairs</td>
              <td>16 of 16</td>
            </tr>
            <tr>
              <td>Question-shaped H2/H3 headings</td>
              <td>83 across 16 articles</td>
            </tr>
            <tr>
              <td>Smallest and largest pair count on a page</td>
              <td>5 and 8</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        A few individual pages, to show the shape rather than the average:
      </p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Pairs</th>
              <th>Openers ≤80 words</th>
              <th>Question-shaped headings</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>How answer engines pick the span they quote</td>
              <td>6</td>
              <td>5</td>
              <td>4</td>
            </tr>
            <tr>
              <td>sameAs: which profiles actually help an entity resolve</td>
              <td>6</td>
              <td>6</td>
              <td>5</td>
            </tr>
            <tr>
              <td>datePublished, dateModified and AI freshness</td>
              <td>5</td>
              <td>3</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What the numbers do and do not show</h2>
      <p>
        They show that the pattern is measurable and that it is achievable in ordinary prose: 91 of
        101 opening paragraphs are under the threshold, and every page in the set clears the
        scanner's ratio. They do not show that the pages are well written, that the openers answer
        their headings, or that any engine cites them. They are also not an independent sample:
        these are pages written after the rule was known, which is precisely the bias a study of
        other sites would avoid.
      </p>
      <p>
        The honest reading is narrower. A page can be checked for where its answers sit, the check
        can be run in seconds, and the failure mode is visible without an engine's help. That is
        enough to justify doing it before a rewrite.
      </p>

      <h2>How to measure your own pages</h2>
      <p>
        The script below is the one used here, in its simplest form. It is deliberately crude: it
        counts words by splitting on spaces, which is fine for English and wrong for Japanese or
        Chinese, and it does not handle wrapper elements. Treat it as a first pass, then read the
        pages it flags.
      </p>
      <pre>{`// node measure.mjs
const urls = [/* your article URLs */];
for (const url of urls) {
  const html = await (await fetch(url)).text();
  const article = html.match(/<article[\\s\\S]*?<\\/article>/)?.[0] ?? html;
  const headings = [...article.matchAll(/<h[23][^>]*>([\\s\\S]*?)<\\/h[23]>/gi)];
  let pairs = 0, short = 0, questions = 0;
  for (let i = 0; i < headings.length; i++) {
    const text = headings[i][1].replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
    if (/\\?$/.test(text) || /^(how|what|why|which|when|who|where|is|are|do|does|can|should|will)\\b/i.test(text)) questions++;
    const next = headings[i + 1]?.index ?? article.length;
    const region = article.slice(headings[i].index + headings[i][0].length, next);
    const firstP = region.match(/<p[^>]*>([\\s\\S]*?)<\\/p>/i);
    if (!firstP) continue;
    pairs++;
    const words = firstP[1].replace(/<[^>]+>/g, " ").trim().split(/\\s+/).filter(Boolean).length;
    if (words <= 80) short++;
  }
  console.log(url, { pairs, short, questions, ratio: pairs ? Math.round((short / pairs) * 100) : null });
}`}</pre>
      <p>
        Read the output as a floor, not a verdict. A page with a low ratio has a structural problem
        worth looking at; a page with a high ratio has passed a cheap check, not a quality review.
      </p>

      <h2>The writing pattern the numbers describe</h2>
      <p>
        The pages above were written to one pattern, and it is not complicated. The heading names
        the question or the claim. The first paragraph gives the answer in one or two sentences,
        without a run-up. The next paragraphs carry the qualification, the evidence and the
        exceptions. Lists and tables hold the enumerable details, because those are the structures
        a parser can lift.
      </p>
      <p>
        The pattern fails in two predictable ways. The first is the long opening: three sentences of
        context before the answer, which produces a passage that either includes the run-up or
        starts mid-thought. The second is the missing paragraph: a heading followed directly by a
        list or a table contributes no pair at all, so a page built entirely that way can fail on
        pair count even though it is well structured. The rule's arithmetic is unforgiving about
        both.
      </p>

      <h2>What the scanner scores</h2>
      <p>
        <Link href="/checks/answer-first/">answer-first</Link> is 3 points;{" "}
        <Link href="/checks/qa-headings/">qa-headings</Link> is 4 points and counts headings that
        end in a question mark or start with one of fourteen question words. They measure different
        halves of the same idea: that the page makes its questions and answers explicit. Neither
        measures whether the answer is correct or whether the page is worth citing.
      </p>
      <p>
        The measurement in this article is the bridge between the two: it shows what the numbers
        look like on real pages, and it makes the claim checkable rather than rhetorical.
      </p>
    </PostShell>
  );
}
