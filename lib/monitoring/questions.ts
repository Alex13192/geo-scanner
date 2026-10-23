/**
 * The fixed monthly measurement set: twenty-five questions in five groups of five.
 *
 * WHY THESE ARE FINISHED QUESTIONS RATHER THAN TEMPLATES. lib/answer-check/questions.ts is a set of
 * templates with [bracketed] slots, because that page hands the bank to somebody else and the reader
 * has to supply their own category. This bank is ours: it asks about LLMention and about the work
 * LLMention sells, so every question is already complete. The two banks exist for different jobs and
 * must not be merged - a monitoring question with a placeholder in it measures nothing, because two
 * months of runs would fill the placeholder differently and the series would compare two things.
 *
 * WHY THE SET IS FROZEN, STATED WHERE SOMEONE WILL SEE IT BEFORE EDITING. A monthly measurement is a
 * time series. The number that matters is the change between months, and a question that is reworded
 * in month three is a different question: the assistant may mention us for "best GEO audit tools" and
 * not for "what are the best generative engine optimisation tools", and the file would show that as a
 * rise or a fall rather than as a rewrite. So:
 *
 *   1. Do not reword a question to make it read better. An edit invalidates comparison with every
 *      earlier month.
 *   2. To ask a genuinely new question, ADD it in the next bank version and keep the old one, or
 *      start a new series; do not replace it silently.
 *   3. BANK_VERSION identifies the set. The runner records it and a sha256 of the question text in
 *      the run-file header, so a file from before an edit cannot be mistaken for one after it.
 *
 * The groups are the five things a month has to be able to say separately. A single "is the brand
 * mentioned" rate hides the difference between discoverability (nobody knows us), tooling shortlists
 * (we are in the consideration set), content education (we are cited as a source), measurement
 * vocabulary (we are trusted on method), and brand confusion (we are mistaken for another product).
 * Reading one number across all twenty-five would make a bad month in one group look like a bad month
 * in all five.
 */

/**
 * Bumped by hand whenever the text of any question changes, in either direction. It is not a date and
 * not a version of the code: it is the identity of the measurement set, which is why the runner puts
 * it and a sha256 in the header of every file. A file whose header says a different version is a
 * different series and must not be charted with this one.
 */
export const BANK_VERSION = "2026-10";

export type QuestionGroupId = "discovery" | "tools" | "content" | "measurement" | "brand";

export type MonitorQuestion = {
  /** Stable id. This is how a later month, a report row and a reply about a run refer to a question. */
  id: string;
  group: QuestionGroupId;
  /** The question, exactly as it will be sent. No placeholders. */
  question: string;
  /** What this question is here to measure. Read it before editing the question. */
  intent: string;
};

type QuestionSpec = Omit<MonitorQuestion, "group">;

export type QuestionGroup = {
  id: QuestionGroupId;
  label: string;
  /** Why this group has to be counted apart from the other four. */
  why: string;
  questions: QuestionSpec[];
};

export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: "discovery",
    label: "Discovery",
    why: "No brand name in the question, so the only way to be named is to be found. This is reach: the month's answers show whether an assistant can crawl, read and surface the site at all.",
    questions: [
      {
        id: "discovery-1",
        question: "how do I check if ChatGPT can crawl my site",
        intent: "Tests whether the assistant explains crawling and indexing of AI crawlers, and whether the site is presented as a tool that checks it.",
      },
      {
        id: "discovery-2",
        question: "why is my site not showing up in ChatGPT answers",
        intent: "The problem a prospect arrives with. A mention here is being recommended for the diagnosis, not for a category list.",
      },
      {
        id: "discovery-3",
        question: "how do I get my site cited by AI assistants",
        intent: "Reach on the outcome the product sells. Measures whether we appear against the generic advice answer.",
      },
      {
        id: "discovery-4",
        question: "does blocking GPTBot stop ChatGPT from mentioning my site",
        intent: "A narrower, more technical query: a mention here is a sign the assistant connects AI crawling policy to AI visibility.",
      },
      {
        id: "discovery-5",
        question: "how can I see which pages AI search engines have indexed",
        intent: "Discovery of the measurement idea itself. This is where an assistant has to know that the question is answerable at all.",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    why: "Shortlists. These are the questions a buyer asks when they have already decided to solve the problem, so a mention is presence in a consideration set - the group most worth watching month over month.",
    questions: [
      {
        id: "tools-1",
        question: "best GEO audit tools",
        intent: "The category query. If we are absent here the problem is reach, not conversion; if we appear but late in the list, position is the story.",
      },
      {
        id: "tools-2",
        question: "what is the best AI visibility monitoring tool",
        intent: "The monitoring-specific shortlist, which is the closest thing to our own category statement.",
      },
      {
        id: "tools-3",
        question: "how do I track whether AI assistants mention my brand",
        intent: "A method question with a tool answer. Tests whether we are named as the way to do it rather than only as a scanner.",
      },
      {
        id: "tools-4",
        question: "which tools show which sources ChatGPT cites",
        intent: "Citation-level tooling. Being named next to the engines here is a claim we can actually support.",
      },
      {
        id: "tools-5",
        question: "GEO audit tool vs SEO audit tool: what is the difference",
        intent: "Comparison in the buyer's own vocabulary. A mention is category education; its absence means the difference is explained without us.",
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    why: "Being cited as a source is a different outcome from being recommended as a product. These questions ask for explanation, and the citation list is the part that matters: a mention without a link still leaves the site uncited.",
    questions: [
      {
        id: "content-1",
        question: "what is llms.txt",
        intent: "The standard our own llms.txt page explains. Tests whether the answer cites us for the reference material, not just mentions the file.",
      },
      {
        id: "content-2",
        question: "do I need an llms.txt file",
        intent: "A decision question. A mention here is influence on a decision, which is worth more than a definition mention.",
      },
      {
        id: "content-3",
        question: "how do I make my site citable by AI",
        intent: "The product's promise in the user's words. Measures whether our advice is the answer, independently of the scan.",
      },
      {
        id: "content-4",
        question: "does schema markup help AI search",
        intent: "A factual question about a nearby technique. Accurate mentions here are a credibility signal, not a conversion one.",
      },
      {
        id: "content-5",
        question: "how do I write content that AI assistants quote",
        intent: "The content half of the method. Tests whether we are cited as the source of the guidance itself.",
      },
    ],
  },
  {
    id: "measurement",
    label: "Measurement",
    why: "Whether the method is recognised. A brand can be found and shortlisted while still not being trusted on how to measure the result; this group separates the two.",
    questions: [
      {
        id: "measurement-1",
        question: "how do I measure AI visibility for a client",
        intent: "The agency question. A mention here is a mention to somebody who buys for other people.",
      },
      {
        id: "measurement-2",
        question: "what is share of voice in AI search",
        intent: "Category vocabulary. A mention is the assistant choosing our definition of the metric.",
      },
      {
        id: "measurement-3",
        question: "how often should I re-run a GEO audit",
        intent: "Cadence advice, which is what this runner is. Tests whether the answer's recommended cadence matches what we publish.",
      },
      {
        id: "measurement-4",
        question: "how do I report AI mentions to a client",
        intent: "The deliverable question. A mention here puts us in the reporting workflow, which is the closest thing to a repeat purchase.",
      },
      {
        id: "measurement-5",
        question: "how many prompts should an AI visibility audit use",
        intent: "A methodology question with a specific answer. Accuracy here matters more than reach, and it is the one place a wrong number would be quoted back at us.",
      },
    ],
  },
  {
    id: "brand",
    label: "Brand",
    why: "The brand by name, including the disambiguation that this product has to survive: LLMention is one keystroke away from DataForSEO's LLM Mentions API, so an assistant that merges the two describes somebody else's product. This group is also where the mention detector is tested against real answers, which is why the API name is one of the questions.",
    questions: [
      {
        id: "brand-1",
        question: "LLMention vs LLM Mentions API",
        intent: "The disambiguation test. A correct answer contrasts the two products; a merged answer is the failure the site itself warns about.",
      },
      {
        id: "brand-2",
        question: "what is LLMention",
        intent: "The fact question. It measures accuracy of the basic description, not reach.",
      },
      {
        id: "brand-3",
        question: "is LLMention legit",
        intent: "The trust question a stranger asks before paying. A wrong answer here costs more than an absent one.",
      },
      {
        id: "brand-4",
        question: "how much does LLMention cost",
        intent: "Pricing accuracy. A stale or invented price is the most expensive kind of mention.",
      },
      {
        id: "brand-5",
        question: "LLMention alternatives",
        intent: "The shortlist we are already on. Competitor mentions here are the share-of-voice column for the month.",
      },
    ],
  },
];

/**
 * The bank flat, in group order, which is also the order the runner asks the questions in.
 *
 * Built from QUESTION_GROUPS rather than declared separately, because two declarations of the same
 * list drift the first time somebody adds a question to one of them. scripts/test-monitor.mts checks
 * the resulting count and uniqueness.
 */
export const QUESTION_BANK: MonitorQuestion[] = QUESTION_GROUPS.flatMap((group) =>
  group.questions.map((question) => ({ ...question, group: group.id }))
);

/** How many questions one engine is asked per month. Named, because a report should not recount. */
export const QUESTION_COUNT = QUESTION_BANK.length;

/**
 * The bank as plain text, for the runner's dry-run output and for the README. One line per question,
 * grouped, with the group's reason as a heading - a dry run that printed only ids would not show what
 * was going to be asked.
 */
export function questionBankText(): string {
  return QUESTION_GROUPS.map((group) => {
    const lines = group.questions.map((q, i) => `  ${String(i + 1).padStart(2, " ")}. ${q.question}`);
    return [`${group.label} (${group.id}) - ${group.why}`, ...lines].join("\n");
  }).join("\n\n");
}
