/**
 * The suite for the answer-check rules.
 *
 * WHY THIS SUITE EXISTS. These rules decide what a stranger is told about their own brand, and every
 * one of them can be wrong in a way that looks right:
 *
 *   - A Latin brand name matched without boundaries turns "Ramp" into a hit inside "ramp-up".
 *   - A CJK brand name matched WITH boundaries matches nothing at all, because every neighbouring
 *     character is also a letter - so a Chinese brand would silently score zero on every signal.
 *   - "Mentioned early" measured in the wrong direction (from the end) flips the one signal that
 *     decides whether a mention surfaces.
 *   - Domains extracted from a markdown link can capture the label instead of the host.
 *
 * None of those raise an error. They produce a report that reads correctly, which is the failure
 * mode this repository keeps building gates against.
 *
 * Run: npm run test:answer-check
 */
import assert from "node:assert/strict";

import {
  checkAnswer,
  extractDomains,
  findMention,
  EARLY_CHARS,
  RECOMMENDATION_CUES,
} from "../lib/answer-check/rules.ts";
import { QUESTION_GROUPS, questionBankText } from "../lib/answer-check/questions.ts";

const results: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    results.push(`  PASS  ${name}`);
  } catch (err) {
    results.push(`  FAIL  ${name}\n        ${(err as Error).message.split("\n")[0]}`);
    process.exitCode = 1;
  }
}

const signal = (report: ReturnType<typeof checkAnswer>, id: string) =>
  report.signals.find((s) => s.id === id)!;

check("a Latin brand name is not matched inside a longer word or a hyphenated compound", () => {
  // The false positive that would make every scan of a short generic brand name useless: "Ramp"
  // inside "ramp-up" is a noun phrase, not a mention of the company.
  const text = "The ramp-up was fast. Ramp is a spend platform.";
  const lower = text.toLowerCase();
  assert.equal(findMention(lower, "Ramp"), lower.indexOf("ramp is"), "should match the standalone word");
  assert.equal(findMention("a ramp-up in spending", "Ramp"), -1, "must not match inside 'ramp-up'");
  assert.equal(findMention("de-ramp the system", "Ramp"), -1, "must not match after a hyphen");

  /*
   * A TWO-WORD VERB PHRASE IS INDISTINGUISHABLE FROM A MENTION, and this asserts that rather than
   * hiding it. "we ramp up quickly" contains the standalone token "ramp" surrounded by spaces, and
   * no string rule can tell it from the company without knowing what the word means in context. The
   * consequence is a possible false positive on short generic names - which is why every signal
   * shows the substring it matched, so a reader can see that this was the verb.
   */
  assert.notEqual(findMention("we ramp up quickly", "Ramp"), -1, "two words: the token is really there");
});

check("a CJK brand name is matched as a substring, because boundaries do not exist there", () => {
  // Without this, a Chinese brand scores zero on every signal and the report looks merely negative.
  const text = "在青少年智慧体育领域,冠军股份提供智能跳绳方案。";
  assert.notEqual(findMention(text.toLowerCase(), "冠军股份"), -1);
  const report = checkAnswer({ answer: text, brand: "冠军股份" });
  assert.equal(signal(report, "mentioned").status, "yes");
});

check("a mention near the end is not 'early'", () => {
  const filler = "x".repeat(EARLY_CHARS + 50);
  const report = checkAnswer({ answer: `${filler} and finally Novacorp is mentioned.`, brand: "Novacorp" });
  assert.equal(signal(report, "mentioned").status, "yes");
  assert.equal(signal(report, "early").status, "no");
});

check("a mention inside the window is 'early'", () => {
  const report = checkAnswer({ answer: "Novacorp is the tool for this.", brand: "Novacorp" });
  assert.equal(signal(report, "early").status, "yes");
});

check("a bulleted line counts as a list, prose does not", () => {
  const listed = checkAnswer({
    answer: "Options:\n- Novacorp\n- Othcorp\n",
    brand: "Novacorp",
  });
  assert.equal(signal(listed, "listed").status, "yes");

  const prose = checkAnswer({
    answer: "There are several options. Novacorp is one of them, and it is discussed at length here.",
    brand: "Novacorp",
  });
  assert.equal(signal(prose, "listed").status, "no");
});

check("a numbered list counts too", () => {
  const report = checkAnswer({ answer: "1. Novacorp\n2. Othcorp", brand: "Novacorp" });
  assert.equal(signal(report, "listed").status, "yes");
});

check("prose first, list later still counts as listed", () => {
  /*
   * The bug the browser probe found. The first version of this rule looked only at the first
   * mention, so an answer that discusses the brand in a paragraph and then lists it among the
   * options scored "not found" on the one signal that describes the reader's actual choice.
   */
  const report = checkAnswer({
    answer:
      "For this workflow I would recommend Novacorp, which fits mid-size teams.\n\n" +
      "- Novacorp\n- Othcorp\n",
    brand: "Novacorp",
  });
  assert.equal(signal(report, "listed").status, "yes");
  assert.ok(signal(report, "listed").evidence.startsWith("- Novacorp"), signal(report, "listed").evidence);
});

check("a mention only in prose is not listed, even with bullets elsewhere", () => {
  const report = checkAnswer({
    answer: "Novacorp is discussed at length here.\n\n- Something else\n- Another thing\n",
    brand: "Novacorp",
  });
  assert.equal(signal(report, "listed").status, "no", "bullets that do not contain the brand are not a shortlist");
});

check("evidence for a mention is trimmed to a word boundary rather than starting mid-word", () => {
  const report = checkAnswer({
    answer: `${"padding ".repeat(10)}Novacorp is the tool.`,
    brand: "Novacorp",
  });
  const evidence = signal(report, "mentioned").evidence;
  assert.ok(!evidence.startsWith("padding"), "the cut window should not begin with a partial word");
  assert.ok(evidence.includes("Novacorp"), evidence);
});

check("a recommending word near the mention is found, and one far away is not", () => {
  const near = checkAnswer({
    answer: "I would recommend Novacorp for this use case.",
    brand: "Novacorp",
  });
  assert.equal(signal(near, "recommended").status, "yes");

  const far = checkAnswer({
    answer: `Novacorp appears here. ${"filler ".repeat(60)} I would recommend something else entirely.`,
    brand: "Novacorp",
  });
  assert.equal(signal(far, "recommended").status, "no", "a cue outside the window is not about this mention");
});

check("every published cue is actually reachable", () => {
  // A cue in the list that can never match is a promise the page makes and the code does not keep.
  for (const cue of RECOMMENDATION_CUES) {
    const report = checkAnswer({ answer: `Novacorp is ${cue} here.`, brand: "Novacorp" });
    assert.equal(signal(report, "recommended").status, "yes", `cue not reachable: ${cue}`);
  }
});

check("domains are extracted from URLs, www hosts and markdown links", () => {
  const domains = extractDomains(
    "See https://www.example.org/page and http://second.com/x and www.third.net and [label](https://fourth.io/a)."
  );
  assert.deepEqual(domains, ["example.org", "fourth.io", "second.com", "third.net"]);
});

check("the brand's own domain being cited is reported, and its absence is 'partly'", () => {
  const cited = checkAnswer({
    answer: "Novacorp is described at https://novacorp.com/about.",
    brand: "Novacorp",
    domain: "novacorp.com",
  });
  assert.equal(cited.citations.ownDomainCited, true);
  assert.equal(signal(cited, "cites").status, "yes");

  const notCited = checkAnswer({
    answer: "Novacorp is described at https://somewhere-else.com/about.",
    brand: "Novacorp",
    domain: "novacorp.com",
  });
  assert.equal(notCited.citations.ownDomainCited, false);
  assert.equal(signal(notCited, "cites").status, "partly");
});

check("no domain supplied means the own-domain question is unanswered, not answered false", () => {
  const report = checkAnswer({ answer: "Novacorp, per https://x.com/", brand: "Novacorp" });
  assert.equal(report.citations.ownDomainCited, null, "null, not false: nothing was asked");
});

check("a subdomain of the supplied domain counts as the same source", () => {
  const report = checkAnswer({
    answer: "Per https://docs.novacorp.com/setup.",
    brand: "Novacorp",
    domain: "novacorp.com",
  });
  assert.equal(report.citations.ownDomainCited, true);
});

check("hedging is detected, and it is reported rather than treated as a failure", () => {
  const report = checkAnswer({
    answer: "I cannot confirm Novacorp's pricing from the available sources.",
    brand: "Novacorp",
  });
  assert.equal(signal(report, "hedged").status, "yes");
  assert.equal(report.hedged, true);
});

check("aliases are searched, and the earliest match across all of them wins", () => {
  const report = checkAnswer({
    answer: "The platform (also known as Novacorp Labs) is one option. Novacorp is the short name.",
    brand: "Novacorp",
    aliases: ["Novacorp Labs"],
  });
  assert.equal(signal(report, "mentioned").status, "yes");
  // "Novacorp" appears inside the alias too, so the earliest index is the alias - either way it is
  // early, and the test is that aliases do not break the search.
  assert.equal(signal(report, "early").status, "yes");
});

check("competitors are compared by position, and brandFirst is false when absent", () => {
  const report = checkAnswer({
    answer: "Novacorp leads, followed by Othcorp.",
    brand: "Novacorp",
    competitors: ["Othcorp", "Absentcorp"],
  });
  const oth = report.competitors.find((c) => c.name === "Othcorp")!;
  assert.equal(oth.mentioned, true);
  assert.equal(oth.brandFirst, true);

  const absent = report.competitors.find((c) => c.name === "Absentcorp")!;
  assert.equal(absent.mentioned, false);
  assert.equal(absent.brandFirst, false, "absent competitor is not 'after' the brand");
});

check("the present count is a count of signals, and it can never exceed six", () => {
  const report = checkAnswer({
    answer: "1. Novacorp is the best for this.\nSources: https://novacorp.com/x",
    brand: "Novacorp",
    domain: "novacorp.com",
  });
  assert.equal(report.total, 6);
  assert.ok(report.present <= 6);
  assert.ok(report.present >= 1);
});

check("an empty answer produces a report of absences rather than throwing", () => {
  const report = checkAnswer({ answer: "", brand: "Novacorp" });
  assert.equal(report.present, 0);
  assert.equal(signal(report, "mentioned").status, "no");
  assert.equal(report.citations.domains.length, 0);
});

check("an empty brand name matches nothing instead of everything", () => {
  // indexOf("") returns 0, which would mark every signal as present - the worst possible bug in a
  // tool whose whole output is "your brand did/did not appear".
  const report = checkAnswer({ answer: "Some answer text.", brand: "   " });
  assert.equal(signal(report, "mentioned").status, "no");
  assert.equal(report.present, 0);
});

check("the question bank has four groups of five, and the text form lists them all", () => {
  assert.equal(QUESTION_GROUPS.length, 4);
  for (const group of QUESTION_GROUPS) {
    assert.equal(group.questions.length, 5, `${group.id} should have five starter questions`);
    assert.ok(group.why.length > 20, `${group.id} needs a reason, not just a label`);
  }
  const text = questionBankText();
  for (const group of QUESTION_GROUPS) {
    assert.ok(text.includes(group.label), `bank text is missing ${group.label}`);
    for (const q of group.questions) {
      assert.ok(text.includes(q), `bank text is missing a question from ${group.id}`);
    }
  }
});

console.log("Answer-check rule tests\n");
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("  FAIL")).length;
console.log(failed ? `\n${failed} test(s) failed.` : `\nAll ${results.length} answer-check tests passed.`);
