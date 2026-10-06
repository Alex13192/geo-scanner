/**
 * Scoring one pasted AI answer, deterministically.
 *
 * WHAT THIS IS, STATED SO IT CANNOT BE MISREAD. It scores text a person pasted. It does not ask any
 * AI engine anything, it does not know what any engine would answer, and it cannot produce a
 * visibility rate. The user supplies the answer; this returns what six published rules say about it.
 * The whole product's credibility rests on that distinction, so it is in the module's first
 * paragraph and repeated on the page.
 *
 * WHY DETERMINISTIC RULES AND NOT A LANGUAGE MODEL. Two people reading the same answer should reach
 * the same verdict, or the record is worth nothing. Every rule below is string matching, the
 * vocabularies are published on the page, and each result carries the exact substring that produced
 * it so a reader can disagree with the rule they can see. A model judging this would be more
 * flexible and unfalsifiable, which is the wrong direction for a measurement.
 *
 * WHY IT RUNS IN THE BROWSER. It is pure string work with no network and no server: zero cost per
 * check, instant, and the pasted answer never leaves the page. That is a property worth keeping, and
 * the page says so.
 */

/** A signal is present, partly present, or absent - the site's three-way vocabulary, without a score. */
export type SignalStatus = "yes" | "partly" | "no";

export type Signal = {
  id: string;
  label: string;
  status: SignalStatus;
  /** What was matched, so the verdict can be checked by eye. Empty when nothing matched. */
  evidence: string;
};

export type CompetitorResult = {
  name: string;
  mentioned: boolean;
  /** True when the brand is named before this competitor. Only meaningful if both appear. */
  brandFirst: boolean;
};

export type AnswerReport = {
  brand: string;
  /** How many of the six signals are present. NOT a score out of 100 and never shown as one. */
  present: number;
  total: number;
  signals: Signal[];
  competitors: CompetitorResult[];
  citations: { domains: string[]; ownDomainCited: boolean | null };
  /** True when the answer hedges somewhere, which is the honest outcome on a fact question. */
  hedged: boolean;
};

/**
 * Recommendation cues, published on the page because a private list would make the result
 * unfalsifiable. Kept deliberately small and specific: a cue is a word that asserts a preference,
 * not a word that merely sounds positive.
 */
export const RECOMMENDATION_CUES = [
  "recommend",
  "recommended",
  "best for",
  "a good fit",
  "worth considering",
  "top pick",
  "strong option",
  "leading",
  "优先",
  "推荐",
  "首选",
  "适合",
  "值得考虑",
];

/** Hedging, which on a fact question is a pass rather than a failure. */
export const HEDGE_CUES = [
  "cannot confirm",
  "can't confirm",
  "cannot verify",
  "not sure",
  "don't have",
  "do not have",
  "unclear",
  "may vary",
  "无法确认",
  "不确定",
  "需核实",
  "请核实",
  "建议核实",
];

/** A mention is "early" when it lands inside this many characters. 300 is roughly two sentences. */
export const EARLY_CHARS = 300;

/** How close a cue has to be to count as being about the mention. */
export const CUE_WINDOW = 120;

const LIST_LINE = /^\s*(?:[-*•·]|\d+[.)])\s/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find a name in the answer.
 *
 * WHY THERE ARE TWO STRATEGIES. A Latin name has word boundaries, and matching "Ramp" inside
 * "ramp-up" would be a false positive worth avoiding. A CJK name has none: every neighbouring
 * character is also a letter, so a boundary pattern matches nothing at all. Names containing a
 * non-ASCII letter are therefore matched as plain substrings, which is the only thing that works.
 * Both are case-insensitive; the answer is lowercased once.
 *
 * A HYPHEN COUNTS AS PART OF THE WORD, which is a deliberate trade rather than an oversight. Short
 * generic brand names are the case this tool meets most often ("Ramp", "Champion", "Wave"), and
 * "ramp-up" is a noun phrase far more often than it is a mention of the company. The cost is a
 * missed mention in compounds like "Ramp-based platform" - which is visible rather than silent,
 * because every signal shows the substring it matched, and a reader who disagrees can add the
 * compound as an alias.
 *
 * The capture-group form is used rather than lookbehind: lookbehind is a parse-time feature, and an
 * older browser would throw on the regular expression itself instead of returning a result.
 *
 * WHAT NO STRING RULE CAN DO, stated because the page has to say it too: a two-word verb phrase is
 * indistinguishable from a mention. "we ramp up quickly" contains the standalone token "ramp", and
 * telling it from the company needs meaning rather than matching. A short generic brand name will
 * therefore produce false positives, and the mitigation is that every signal reports the substring
 * it matched - the reader sees that it was the verb, and can add a more specific alias.
 */
export function findMention(haystackLower: string, name: string): number {
  const needle = name.trim().toLowerCase();
  if (!needle) return -1;
  if (/[^\x00-\x7f]/.test(needle)) return haystackLower.indexOf(needle);
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}-])${escapeRegExp(needle)}([^\\p{L}\\p{N}-]|$)`,
    "u"
  );
  const match = pattern.exec(haystackLower);
  return match ? match.index + match[1].length : -1;
}

/** Every position a name occurs at, so signals that are not about the first mention can look wider. */
export function findAllMentions(haystackLower: string, name: string): number[] {
  const needle = name.trim().toLowerCase();
  if (!needle) return [];
  if (/[^\x00-\x7f]/.test(needle)) {
    const out: number[] = [];
    let from = 0;
    for (;;) {
      const at = haystackLower.indexOf(needle, from);
      if (at === -1) return out;
      out.push(at);
      from = at + needle.length;
    }
  }
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}-])(${escapeRegExp(needle)})(?=[^\\p{L}\\p{N}-]|$)`,
    "gu"
  );
  const out: number[] = [];
  for (const match of haystackLower.matchAll(pattern)) {
    out.push(match.index + match[1].length);
  }
  return out;
}

/** Every http(s) URL and bare www host in the text, reduced to hostnames. */
export function extractDomains(text: string): string[] {
  const found = new Set<string>();
  const urlPattern = /(?:https?:\/\/|www\.)([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;
  for (const match of text.matchAll(urlPattern)) {
    found.add(match[1].toLowerCase().replace(/^www\./, ""));
  }
  return [...found].sort();
}

function windowAround(text: string, index: number, before: number, after: number): string {
  const start = Math.max(0, index - before);
  const raw = text.slice(start, index + after);
  // A snippet that begins mid-word reads like a typo in the tool rather than evidence. When the
  // window was cut, drop the partial leading word and mark the cut.
  if (start === 0) return raw.trim();
  const firstSpace = raw.indexOf(" ");
  return firstSpace === -1 ? `…${raw.trim()}` : `…${raw.slice(firstSpace + 1).trim()}`;
}

function firstCue(textLower: string, index: number): string | null {
  const window = windowAround(textLower, index, CUE_WINDOW, CUE_WINDOW);
  for (const cue of RECOMMENDATION_CUES) {
    if (window.includes(cue)) return cue;
  }
  return null;
}

export type CheckInput = {
  answer: string;
  brand: string;
  /** Other names the same brand answers to. Optional. */
  aliases?: string[];
  /** The site's own domain, to see whether the answer cites it. Optional. */
  domain?: string;
  /** Names to compare position against. Optional. */
  competitors?: string[];
};

export function checkAnswer(input: CheckInput): AnswerReport {
  const answer = input.answer ?? "";
  const lower = answer.toLowerCase();
  const names = [input.brand, ...(input.aliases ?? [])].map((n) => n.trim()).filter(Boolean);

  // The earliest mention across the brand and its aliases is what every other rule hangs on.
  let firstIndex = -1;
  let matchedName = "";
  for (const name of names) {
    const at = findMention(lower, name);
    if (at !== -1 && (firstIndex === -1 || at < firstIndex)) {
      firstIndex = at;
      matchedName = name;
    }
  }
  const mentioned = firstIndex !== -1;

  const signals: Signal[] = [];
  const push = (id: string, label: string, status: SignalStatus, evidence: string) =>
    signals.push({ id, label, status, evidence });

  push(
    "mentioned",
    "Brand is mentioned",
    mentioned ? "yes" : "no",
    mentioned ? windowAround(answer, firstIndex, 30, matchedName.length + 40).trim() : ""
  );

  push(
    "early",
    `Mentioned early (within ${EARLY_CHARS} characters)`,
    !mentioned ? "no" : firstIndex <= EARLY_CHARS ? "yes" : "no",
    mentioned ? `first mention at character ${firstIndex}` : ""
  );

  /*
   * "In a list" is decided by the line a mention sits on, not by nearby characters: a bullet or a
   * numbered item is where a reader makes a choice, and a mention in a paragraph is a mention.
   *
   * IT LOOKS AT EVERY MENTION, NOT JUST THE FIRST, and that was a bug found by running the tool
   * rather than by reading it: an answer that discusses the brand in prose and then lists it among
   * the options scored "not found" here, because the first mention was the prose one. The reader
   * who is choosing from a list sees the list.
   */
  let listLine: string | null = null;
  if (mentioned) {
    for (const name of names) {
      for (const at of findAllMentions(lower, name)) {
        const lineStart = lower.lastIndexOf("\n", at) + 1;
        const lineEnd = lower.indexOf("\n", at);
        const line = answer.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        if (LIST_LINE.test(line)) {
          listLine = line.trim();
          break;
        }
      }
      if (listLine) break;
    }
  }
  push(
    "listed",
    "Sits in a list of options",
    listLine ? "yes" : "no",
    listLine ? listLine.slice(0, 120) : ""
  );

  const cue = mentioned ? firstCue(lower, firstIndex) : null;
  push(
    "recommended",
    "Carries a recommending word",
    cue ? "yes" : "no",
    cue ? `"${cue}" within ${CUE_WINDOW} characters of the mention` : ""
  );

  const domains = extractDomains(answer);
  const own = (input.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const ownDomainCited = own ? domains.some((d) => d === own || d.endsWith(`.${own}`)) : null;
  push(
    "cites",
    "Cites sources",
    domains.length === 0 ? "no" : ownDomainCited ? "yes" : "partly",
    domains.length ? `${domains.length} domain(s): ${domains.slice(0, 6).join(", ")}` : ""
  );

  const hedge = HEDGE_CUES.find((h) => lower.includes(h)) ?? null;
  push(
    "hedged",
    "States what it cannot confirm",
    hedge ? "yes" : "no",
    hedge ? `"${hedge}"` : ""
  );

  const competitors: CompetitorResult[] = (input.competitors ?? [])
    .map((c) => c.trim())
    .filter(Boolean)
    .map((name) => {
      const at = findMention(lower, name);
      return {
        name,
        mentioned: at !== -1,
        brandFirst: at !== -1 && mentioned ? firstIndex < at : false,
      };
    });

  const present = signals.filter((s) => s.status === "yes").length;

  return {
    brand: input.brand,
    present,
    total: signals.length,
    signals,
    competitors,
    citations: { domains, ownDomainCited },
    hedged: Boolean(hedge),
  };
}
