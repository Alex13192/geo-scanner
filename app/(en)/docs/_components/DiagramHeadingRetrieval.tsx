"use client";

import DiagramFigure from "./DiagramFigure";

/**
 * Why a label is not a question.
 *
 * THE SENTENCE THIS EXISTS TO MAKE VISIBLE. The article says a generative engine retrieves a span
 * of text, checks that it answers the question, and cites the page it came from - but it says so in
 * prose, and in prose that reads like advice about wording. It is a statement about what gets
 * retrieved. Two sections of the same page, one headed `Features` and one headed by the question
 * itself, are not two styles of writing: only one of them is a retrievable passage, and the diagram
 * is the difference stated as a picture.
 *
 * WHY THE RIGHT-HAND COLUMN SHOWS THE ANSWER IN BOLD. The point is not the heading on its own. A
 * question-shaped heading over a paragraph that builds up to its answer is the mistake the article
 * spends a section on, so the picture has to show the heading and the first sentence as one
 * passage - which is also what the caption and the closing block say.
 *
 * THE DELAYS MARK THAT READING ORDER: the question, the fork, the label, the question, the two
 * verdicts, the rule. The label is drawn before the question because that is the order the article
 * presents them in, and the two verdicts share one step because the comparison is the point -
 * landing them separately would read as two unrelated claims.
 *
 * `"use client"` IS NOT REDUNDANT WITH THE ONE IN DiagramFigure, and DiagramFigure's note has the
 * measurement: without it the markup moves into the RSC payload and this page grows by 6.5 kB.
 */
export default function DiagramHeadingRetrieval() {
  const node = "var(--surface-2)";
  const line = "var(--line)";
  const inkStrong = "var(--ink-1)";
  const inkSoft = "var(--ink-2)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <DiagramFigure
      viewBox="0 0 720 430"
      titleId="heading-retrieval-title"
      descId="heading-retrieval-desc"
      title="Why a question-shaped heading is retrieved where a label is not"
      desc="A retrieval system receives a question and finds two sections of the same page. The first is headed Features and its paragraph assumes the rest of the page, so there is no question for the passage to match and it cannot be lifted on its own. The second is headed by the question itself and opens with a one-sentence answer, so the heading and that sentence are retrieved and quoted together. A heading and the sentence under it travel as one passage."
      caption="A label gives a retrieval system nothing to match against. A question gives it a passage it can quote whole."
    >
      {/* 1. The question, which is all a retrieval system starts with. */}
      <g style={{ animationDelay: "0ms" }}>
        <rect x="170" y="6" width="380" height="44" rx="12" fill={node} stroke={line} />
        <text x="360" y="26" textAnchor="middle" fontSize="13.5" fill={inkStrong}>
          A retrieval system gets a question:
        </text>
        <text x="360" y="43" textAnchor="middle" fontSize="12" fill={inkSoft}>
          &quot;how does this company measure brand AI visibility?&quot;
        </text>
      </g>

      {/* 2. Two sections of one page are the candidates. */}
      <g style={{ animationDelay: "240ms" }}>
        <line x1="360" y1="50" x2="360" y2="74" stroke={line} strokeWidth="1.5" />
        <line x1="185" y1="74" x2="535" y2="74" stroke={line} strokeWidth="1.5" />
        <line x1="185" y1="74" x2="185" y2="96" stroke={line} strokeWidth="1.5" />
        <line x1="535" y1="74" x2="535" y2="96" stroke={line} strokeWidth="1.5" />
        <path d="M185 104 l-5 -9 h10 z" fill={inkSoft} />
        <path d="M535 104 l-5 -9 h10 z" fill={inkSoft} />
      </g>

      {/* 3. The label, which is what most pages have. */}
      <g style={{ animationDelay: "480ms" }}>
        <text x="185" y="122" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={inkSoft}>
          A label
        </text>
        <rect x="20" y="132" width="330" height="132" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="36" y="158" fontSize="12.5" fill={inkStrong} fontFamily={mono}>
          &lt;h2&gt;Features&lt;/h2&gt;
        </text>
        <text x="36" y="188" fontSize="12.5" fill={inkSoft}>
          Our platform includes scheduling,
        </text>
        <text x="36" y="206" fontSize="12.5" fill={inkSoft}>
          reporting and alerts.
        </text>
        <text x="36" y="240" fontSize="11.5" fill={inkSoft}>
          Nothing here answers the question.
        </text>
      </g>

      {/* 4. The question, with its answer in the first sentence. */}
      <g style={{ animationDelay: "720ms" }}>
        <text x="535" y="122" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={inkStrong}>
          A real question
        </text>
        <rect x="370" y="132" width="330" height="132" rx="12" fill="none" stroke={line} strokeDasharray="4 4" />
        <text x="386" y="156" fontSize="11.5" fill={inkStrong} fontFamily={mono}>
          &lt;h2&gt;How does Your Company measure
        </text>
        <text x="386" y="172" fontSize="11.5" fill={inkStrong} fontFamily={mono}>
          brand AI visibility?&lt;/h2&gt;
        </text>
        <text x="386" y="200" fontSize="12" fontWeight="600" fill={inkStrong}>
          It checks whether AI crawlers can reach
        </text>
        <text x="386" y="217" fontSize="12" fontWeight="600" fill={inkStrong}>
          your site and whether it can be quoted.
        </text>
        <text x="386" y="245" fontSize="11.5" fill={inkSoft}>
          The heading is the question.
        </text>
      </g>

      {/* 5. What happens to each passage, side by side, because that is the comparison. */}
      <g style={{ animationDelay: "960ms" }}>
        <rect x="20" y="276" width="330" height="56" rx="12" fill="none" stroke={line} />
        <text x="185" y="298" textAnchor="middle" fontSize="13" fontWeight="600" fill={inkStrong}>
          Not lifted
        </text>
        <text x="185" y="317" textAnchor="middle" fontSize="11.5" fill={inkSoft}>
          no question for the passage to match
        </text>

        <rect x="370" y="276" width="330" height="56" rx="12" fill="var(--ok-bg)" stroke="var(--ok)" />
        <text x="535" y="298" textAnchor="middle" fontSize="13" fontWeight="600" fill={inkStrong}>
          Retrieved and quoted
        </text>
        <text x="535" y="317" textAnchor="middle" fontSize="11.5" fill={inkSoft}>
          heading and answer arrive as one passage
        </text>
      </g>

      {/* 6. The rule the picture exists to land, including the way it is copied wrongly. */}
      <g style={{ animationDelay: "1200ms" }}>
        <rect x="40" y="344" width="640" height="80" rx="12" fill="none" stroke={line} />
        <text x="360" y="368" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={inkStrong}>
          A heading and the sentence under it are retrieved as one passage.
        </text>
        <text x="360" y="388" textAnchor="middle" fontSize="12" fill={inkSoft}>
          So the first sentence has to answer the question on its own - copy it out and read it.
        </text>
        <text x="360" y="406" textAnchor="middle" fontSize="12" fill={inkSoft}>
          A question-shaped heading with no answer underneath it fixes nothing.
        </text>
      </g>
    </DiagramFigure>
  );
}
