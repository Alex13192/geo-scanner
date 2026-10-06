/**
 * The starter question bank, as data.
 *
 * WHY THIS IS A MODULE AND NOT TEXT IN TWO PLACES. These twenty questions appear on
 * /docs/ai-visibility-self-check/ (copyable) and are offered for copying on /answer-check/. Two
 * copies of a list like this drift the first time somebody rewords one of them, and the drift is
 * invisible: both pages still look right, and only a reader who compares them finds out that the
 * method and the tool disagree about what to ask. The same reasoning as MAX_LINKS in lib/llms-txt.ts.
 *
 * WHY THEY ARE TEMPLATES RATHER THAN FINISHED QUESTIONS. A bank written for one industry is wrong
 * for every other one, and a finished list invites copying without thinking - which is how a
 * "measurement" ends up testing vocabulary instead of whether the brand is findable. The brackets
 * are the part the reader has to supply, and that is the part that decides whether the answers mean
 * anything.
 */

export type QuestionGroup = {
  id: "category" | "scenario" | "comparison" | "fact";
  /** Shown as the group heading. */
  label: string;
  /** Why this group is here, in one line - it is the reason the groups are kept apart. */
  why: string;
  questions: string[];
};

export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: "category",
    label: "Category",
    why: "No brand name in the question. This is the only group that measures reach: being found by somebody who does not know you exist.",
    questions: [
      "Which companies offer [product type] for [audience]?",
      "What are the best [category] tools in 2026?",
      "Who are the main vendors in [category]?",
      "Which [product type] is suitable for [size / region / industry]?",
      "What should I look for when choosing [category]?",
    ],
  },
  {
    id: "scenario",
    label: "Scenario",
    why: "A problem, no brand name. Tests whether a recommendation follows from a need rather than from a category list.",
    questions: [
      "How do I solve [problem the product solves]?",
      "What is the cheapest way to [outcome]?",
      "How do teams like mine handle [workflow]?",
      "What alternatives exist when [common constraint]?",
      "How do I compare [approach A] and [approach B]?",
    ],
  },
  {
    id: "comparison",
    label: "Comparison",
    why: "Your brand against a named alternative. Shows whether you can enter a shortlist at all - and these are the questions most often answered with \"it depends\".",
    questions: [
      "[Your brand] vs [competitor]: which is better for [use case]?",
      "Is [your brand] worth it compared with [competitor]?",
      "What are the disadvantages of [your brand]?",
      "Which is easier to set up, [your brand] or [competitor]?",
      "If I need [requirement], should I choose [your brand]?",
    ],
  },
  {
    id: "fact",
    label: "Fact",
    why: "Your brand by name, against verifiable detail. Measures accuracy rather than reach, and this is where an error is expensive.",
    questions: [
      "What does [your brand] do?",
      "Who owns [your brand] and when was it founded?",
      "What does [your brand] cost?",
      "Which company is behind [your product name]?",
      "Does [your brand] handle [specific requirement]?",
    ],
  },
];

/** The bank as plain text, for a copy button and for the guide's code block. */
export function questionBankText(): string {
  return QUESTION_GROUPS.map(
    (group) =>
      `${group.label} (${group.why.split(".")[0]})\n` +
      group.questions.map((q, i) => `${i + 1}.  ${q}`).join("\n")
  ).join("\n\n");
}
