/**
 * What counts as a mention of the brand, and of a competitor, in an answer the runner recorded.
 *
 * WHY THIS IS A MODULE AND NOT A LOOP IN THE RUNNER. There are two independent callers - the monthly
 * runner (real answers) and its test suite (hand-written answers) - and they must agree about the one
 * fact every number in this pipeline depends on: whether the brand appears. The answer-check page and
 * its collector learned this already (see scripts/report/run-bank.mts): a second copy of a matching
 * rule is how two parts of one product start telling different stories about one answer. So there is
 * one matching implementation, and scripts/test-monitor.mts exercises it.
 *
 * ------------------------------------------------------------------------------------------------
 * THE FALSE POSITIVE THIS FILE EXISTS TO AVOID, IN THE REPOSITORY'S OWN WORDS
 * ------------------------------------------------------------------------------------------------
 * lib/site.ts records it: "LLMention" sits close enough to DataForSEO's "LLM Mentions API" that a
 * model can merge the two. The same merge happens to a naive matcher, in a way that leaves no trace:
 *
 *   - The obvious way to catch spelling variants is to normalise the text first - lowercase it and
 *     strip spaces, punctuation or hyphens - so that "LLMention", "llm mention" and "LLM-Mention" all
 *     collapse to "llmmention". That normalisation is exactly the bug. "LLM Mentions API" collapses to
 *     "llmmentionsapi", which CONTAINS "llmmention", so every answer that mentions the other product is
 *     scored as a mention of ours. The month's data then says we are visible in a category where every
 *     single hit came from a competitor's name.
 *   - A plain case-insensitive contains() has the same defect for the space: "llm mention" does not
 *     contain "llmmention", so it would be fine - but "LLMentions" and "LLMentional" do contain it, and
 *     those are words, not the brand.
 *
 * The rule this file uses is lib/answer-check/rules.ts's findMention, imported rather than copied:
 * a Latin name matches only on word boundaries, where a hyphen counts as part of the word (the
 * repository's Ramp / ramp-up decision). So:
 *
 *   - "LLM Mentions API" has a space where the brand has none, and is not a match at any normalisation
 *     level because we never remove the space;
 *   - "llm mention" (two words) is not a match;
 *   - "LLMentional" and "LLMentions" are not matches, because the character after the name is a letter
 *     and a boundary requires a non-letter there;
 *   - "LLMention" in "LLMention GEO Scanner", "LLMention's" and "LLMention." are matches.
 *
 * The visible cost of the rule, stated rather than discovered: the plural "LLMentions" is a real way a
 * person might write the brand, and it is counted as no mention. That is deliberate. The plural is
 * indistinguishable from "LLM mentions" with the space lost, and a false positive on the other
 * product's name corrupts the direction of the time series; a false negative on a plural only makes the
 * number conservative. A reader can see which substring matched, because every result carries evidence.
 *
 * WHAT NO STRING RULE CAN DO. It cannot tell "we llm mention things" (a verb phrase) from the brand,
 * for the same reason lib/answer-check/rules.ts cannot tell "we ramp up" from the company Ramp. The
 * mitigation is that every result reports the exact substring and its position, so a wrong count is
 * visibly wrong rather than silently wrong.
 */
import { findMention } from "../answer-check/rules.ts";

/**
 * The competitors the monthly run looks for by default.
 *
 * WHY A DEFAULT LIST AT ALL. Share of voice is the first question a client asks about an AI-visibility
 * measurement ("if they did not name us, who did they name?"), and an empty list makes the record say
 * "nobody" when it means "nothing was looked for". This is the GEO / AI-visibility set, plus the product
 * whose name ours is most often confused with, deliberately first.
 *
 * A REAL LIMIT: this is a fixed list, and the market changes. The runner records the exact list it used
 * in the run-file header, so a month with a different list is visible as a different measurement. Adding
 * a competitor does not invalidate earlier months for the brand rate, but it does start the competitor
 * column for that name.
 */
export const DEFAULT_COMPETITORS: string[] = [
  "LLM Mentions API",
  "DataForSEO",
  "Profound",
  "Otterly",
  "Peec AI",
  "AthenaHQ",
  "Scrunch AI",
  "Semrush",
  "Ahrefs",
];

export type BrandMention = {
  mentioned: boolean;
  /**
   * Character offset of the first mention in the answer, or null when absent. An offset rather than a
   * rank: how many characters in is a fact about the answer, while "listed second" needs list parsing
   * that this measurement does not claim to do. A reader can compare it with the competitor positions
   * in the same record, which is what "mentioned before X" means.
   */
  position: number | null;
  /** The spelling that matched, so a reader can see which alias produced the hit. */
  matchedName: string | null;
  /** The surrounding text, so a verdict can be checked by eye instead of trusted. */
  evidence: string | null;
};

export type CompetitorMention = {
  name: string;
  mentioned: boolean;
  /** Same meaning as BrandMention.position, so the two can be compared directly. */
  position: number | null;
};

export type AnswerAnalysis = {
  brand: BrandMention;
  competitors: CompetitorMention[];
};

/** Where a name first occurs, and which spelling of it. Null when the answer does not name it. */
export function findFirstMention(
  text: string,
  names: string[]
): { name: string; index: number } | null {
  const lower = text.toLowerCase();
  let best: { name: string; index: number } | null = null;
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const index = findMention(lower, name);
    // A name may contain a shorter alias ("LLMention GEO Scanner" contains "LLMention"): the earliest
    // index wins, and a tie keeps the first spelling in the list, so the result does not depend on
    // iteration accidents. The alias list is ordered most-specific-first by the caller if it cares.
    if (index !== -1 && (best === null || index < best.index)) {
      best = { name, index };
    }
  }
  return best;
}

/**
 * A short window around a match, with the original casing, for the record and for a human reader.
 *
 * WHY EVIDENCE IS RECORDED AND NOT DERIVED LATER. The answer text is in the record too, so it could be
 * re-derived - but a month's file is read by somebody deciding what a number means, and asking them to
 * run a regex to find out why "mentioned: true" is true is how a measurement stops being checkable. The
 * window is bounded so a mention early in a long answer does not drag the whole answer into evidence.
 */
function evidenceAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + length + 120);
  const raw = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${raw}${end < text.length ? "…" : ""}`;
}

/** Whether the answer names the brand, where, under which spelling, and with what evidence. */
export function detectBrandMention(text: string, brandNames: string[]): BrandMention {
  const hit = findFirstMention(text, brandNames);
  if (!hit) {
    return { mentioned: false, position: null, matchedName: null, evidence: null };
  }
  return {
    mentioned: true,
    position: hit.index,
    matchedName: hit.name,
    evidence: evidenceAround(text, hit.index, hit.name.length),
  };
}

/** The configured competitors, in the order they were supplied, with their positions. */
export function detectCompetitorMentions(text: string, competitorNames: string[]): CompetitorMention[] {
  return competitorNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const hit = findFirstMention(text, [name]);
      return { name, mentioned: hit !== null, position: hit ? hit.index : null };
    });
}

/**
 * Everything the runner records about one answer: the brand verdict and every competitor verdict, from
 * one lowercasing pass over the text.
 */
export function analyseAnswer(
  text: string,
  input: { brandNames: string[]; competitors: string[] }
): AnswerAnalysis {
  return {
    brand: detectBrandMention(text, input.brandNames),
    competitors: detectCompetitorMentions(text, input.competitors),
  };
}
