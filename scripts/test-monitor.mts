/**
 * The suite for the monthly monitor: the question bank, mention detection, response extraction and the
 * one network call.
 *
 * WHY THIS SUITE EXISTS. Every number in monitoring/runs/*.jsonl is produced by the functions below, and
 * each of them can be wrong in a way that still reads correctly:
 *
 *   - The brand matcher that normalises separators turns every mention of DataForSEO's "LLM Mentions
 *     API" into a mention of LLMention. The month then reports visibility that never happened, and the
 *     direction of the time series is inverted. This is the repository's documented false positive, and
 *     it is the first thing tested.
 *   - A question bank that loses or duplicates an id silently changes the denominator, so "12 of 25"
 *     becomes a rate over 24 real questions plus one asked twice.
 *   - A citation extractor that returns [] for a response shape it did not recognise turns "the engine
 *     did not search" into "the engine cited no sources". The suite asserts the null-with-reason case
 *     separately from the empty-list case.
 *   - The call helper is stubbed here, so a wrong endpoint, a missing auth header, or a swallowed error
 *     body fails a test instead of failing a month.
 *
 * No test touches the network and none needs a key: the impure part of the runner is behind FetchLike
 * and this file passes a stub. Run: node scripts/test-monitor.mts
 */
import assert from "node:assert/strict";

import {
  BANK_VERSION,
  QUESTION_BANK,
  QUESTION_COUNT,
  QUESTION_GROUPS,
  questionBankText,
} from "../lib/monitoring/questions.ts";
import {
  DEFAULT_COMPETITORS,
  analyseAnswer,
  detectBrandMention,
  detectCompetitorMentions,
  findFirstMention,
} from "../lib/monitoring/mention.ts";
import {
  ENGINES,
  ENGINE_CONFIG,
  buildRequest,
  callEngine,
  extractAnthropic,
  extractGemini,
  extractOpenAI,
  extractPerplexity,
  resolveEngineKey,
  resolveModel,
} from "../lib/monitoring/providers.ts";

const results: string[] = [];
function check(name: string, fn: () => void | Promise<void>) {
  const finish = (error?: unknown) => {
    if (error === undefined) {
      results.push(`  PASS  ${name}`);
    } else {
      results.push(`  FAIL  ${name}\n        ${(error as Error).message.split("\n")[0]}`);
      process.exitCode = 1;
    }
  };
  try {
    const value = fn();
    if (value instanceof Promise) return value.then(() => finish(), (error: unknown) => finish(error));
    finish();
    return undefined;
  } catch (error) {
    finish(error);
    return undefined;
  }
}

const BRAND_NAMES = ["LLMention", "LLMention GEO Scanner"];

/* ------------------------------------------------------------------ */
/* The question bank                                                   */
/* ------------------------------------------------------------------ */

check("the bank is 25 questions in 5 groups of 5", () => {
  assert.equal(QUESTION_COUNT, 25);
  assert.equal(QUESTION_BANK.length, 25);
  assert.equal(QUESTION_GROUPS.length, 5);
  for (const group of QUESTION_GROUPS) {
    assert.equal(group.questions.length, 5, `${group.id} should have five questions`);
  }
});

check("every question id and text is unique, and each id belongs to its group", () => {
  const ids = QUESTION_BANK.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate question id: ${ids.join(", ")}`);
  const texts = QUESTION_BANK.map((q) => q.question.toLowerCase());
  assert.equal(new Set(texts).size, texts.length, "two questions ask the same thing");

  for (const group of QUESTION_GROUPS) {
    for (const question of group.questions) {
      const flat = QUESTION_BANK.find((q) => q.id === question.id);
      assert.ok(flat, `${question.id} is missing from QUESTION_BANK`);
      assert.equal(flat!.group, group.id, `${question.id} carries the wrong group`);
    }
  }
});

check("every question carries an intent and is a finished question, not a template", () => {
  for (const question of QUESTION_BANK) {
    assert.ok(question.question.trim().length > 10, `${question.id} has no question text`);
    assert.ok(question.intent.trim().length > 20, `${question.id} has no real intent`);
    // A [bracket] placeholder would be filled differently each month, which is a different question.
    assert.ok(
      !/[\[\]{}]/.test(question.question),
      `${question.id} contains a placeholder instead of a finished question`
    );
  }
});

check("the bank includes the brand/disambiguation group and the documented example question", () => {
  const brand = QUESTION_GROUPS.find((group) => group.id === "brand");
  assert.ok(brand, "the brand group is what tests disambiguation");
  assert.ok(
    QUESTION_BANK.some((q) => q.question === "LLMention vs LLM Mentions API"),
    "the disambiguation question must be asked verbatim"
  );
});

check("BANK_VERSION identifies the set, and the text form lists every question once", () => {
  assert.match(BANK_VERSION, /^\d{4}-\d{2}$/);
  const text = questionBankText();
  for (const group of QUESTION_GROUPS) {
    assert.ok(text.includes(group.label), `bank text is missing ${group.label}`);
    for (const question of group.questions) {
      assert.ok(text.includes(question.question), `bank text is missing ${question.id}`);
    }
  }
});

/* ------------------------------------------------------------------ */
/* Mention detection: the false positive this file exists to prevent   */
/* ------------------------------------------------------------------ */

check("the brand is found as a standalone word, with its position", () => {
  const atStart = detectBrandMention("LLMention is a GEO scanner.", BRAND_NAMES);
  assert.equal(atStart.mentioned, true);
  assert.equal(atStart.position, 0);
  assert.equal(atStart.matchedName, "LLMention");
  assert.ok(atStart.evidence?.includes("LLMention"), atStart.evidence ?? "(no evidence)");

  const prefix = "Ask an assistant. ";
  const later = detectBrandMention(`${prefix}LLMention does this.`, BRAND_NAMES);
  assert.equal(later.position, prefix.length, "position is the character offset of the first mention");

  assert.equal(detectBrandMention("Try LLMention.", BRAND_NAMES).mentioned, true);
  assert.equal(detectBrandMention("llmention is the tool", BRAND_NAMES).mentioned, true, "case-insensitive");
  assert.equal(detectBrandMention("LLMention's scan is here", BRAND_NAMES).mentioned, true);
  assert.equal(
    detectBrandMention("Use LLMention GEO Scanner for this.", BRAND_NAMES).matchedName,
    "LLMention"
  );
});

check("LLM Mentions API is NOT a mention of LLMention", () => {
  // The documented false positive (lib/site.ts): the other product's name is one space away from ours.
  for (const text of [
    "LLM Mentions API",
    "The LLM Mentions API from DataForSEO tracks mentions.",
    "llm mentions api pricing",
    "LLM mentions",
  ]) {
    const result = detectBrandMention(text, BRAND_NAMES);
    assert.equal(result.mentioned, false, `false positive on ${JSON.stringify(text)}`);
    assert.equal(result.position, null);
    assert.equal(result.matchedName, null);
    assert.equal(result.evidence, null, "no evidence is invented for a non-mention");
  }
});

check("the normalisation that would cause it is shown to be the cause", () => {
  /*
   * THIS IS THE TEST THAT EXPLAINS THE OTHERS. "llmmentionsapi" does contain "llmmention". Any matcher
   * that lowercases and strips punctuation/spaces - the obvious way to catch "LLM-Mention" and
   * "llm mention" - therefore scores every mention of the other product as ours. Asserting the
   * substring exists proves the false positive is real; asserting detectBrandMention() rejects it
   * proves the boundary rule is what prevents it.
   */
  const normalised = "LLM Mentions API".toLowerCase().replace(/[^a-z0-9]/g, "");
  assert.ok(normalised.includes("llmmention"), "the naive matcher's false positive does exist");
  assert.equal(detectBrandMention("LLM Mentions API", BRAND_NAMES).mentioned, false);
});

check("words that merely start with the brand are not mentions", () => {
  for (const text of ["LLMentional", "LLMentionX", "LLMentions", "LLM-Mention", "llm-mention-api"]) {
    const result = detectBrandMention(text, BRAND_NAMES);
    assert.equal(result.mentioned, false, `false positive on ${JSON.stringify(text)}`);
  }
});

check("the API name can be found while the brand is not, and both in one answer", () => {
  const onlyApi = "We used the LLM Mentions API for this.";
  assert.equal(detectBrandMention(onlyApi, BRAND_NAMES).mentioned, false);
  assert.equal(detectCompetitorMentions(onlyApi, ["LLM Mentions API"])[0].mentioned, true);

  const both = "The LLM Mentions API is a different product. LLMention is a GEO scanner.";
  const brand = detectBrandMention(both, BRAND_NAMES);
  assert.equal(brand.mentioned, true);
  assert.equal(brand.position, both.indexOf("LLMention is a GEO scanner."));
  assert.equal(detectCompetitorMentions(both, ["LLM Mentions API"])[0].position, 4);
});

check("an empty answer or an empty name list is 'not mentioned', never everything", () => {
  // indexOf("") is 0, so an unguarded empty alias would mark every answer as a mention.
  assert.equal(detectBrandMention("", BRAND_NAMES).mentioned, false);
  assert.equal(detectBrandMention("LLMention is here", []).mentioned, false);
  assert.equal(detectBrandMention("LLMention is here", ["", "   "]).mentioned, false);
  assert.equal(findFirstMention("LLMention is here", []), null);
});

check("the earliest alias occurrence wins, deterministically", () => {
  const hit = findFirstMention("First nothing. Then LLMention GEO Scanner.", BRAND_NAMES);
  assert.ok(hit);
  assert.equal(hit!.name, "LLMention");
  assert.equal(hit!.index, "First nothing. Then ".length);
});

/* ------------------------------------------------------------------ */
/* Competitors and the combined analysis                               */
/* ------------------------------------------------------------------ */

check("competitors are recorded present or absent, with positions", () => {
  const text = "I would try LLMention first, then Profound; Otterly is another option.";
  const mentions = detectCompetitorMentions(text, ["Profound", "Otterly", "Peec AI"]);
  assert.deepEqual(
    mentions.map((m) => m.name),
    ["Profound", "Otterly", "Peec AI"],
    "order follows the configured list"
  );
  assert.equal(mentions[0].mentioned, true);
  assert.equal(mentions[0].position, text.indexOf("Profound"));
  assert.equal(mentions[1].mentioned, true);
  assert.equal(mentions[2].mentioned, false);
  assert.equal(mentions[2].position, null);
});

check("analyseAnswer reports the brand and the competitor set from one answer", () => {
  const text =
    "For this I would use LLMention GEO Scanner or Otterly. Profound is a heavier option.";
  const analysis = analyseAnswer(text, {
    brandNames: BRAND_NAMES,
    competitors: ["Profound", "Otterly"],
  });
  assert.equal(analysis.brand.mentioned, true);
  assert.equal(analysis.brand.position, text.indexOf("LLMention"));
  assert.deepEqual(
    analysis.competitors.map((c) => c.mentioned),
    [true, true]
  );
  // "mentioned before the competitor" is the comparison the record exists to allow.
  assert.ok(analysis.brand.position! < analysis.competitors[1].position!);
});

check("the default competitor list includes the product most often confused with the brand", () => {
  assert.ok(DEFAULT_COMPETITORS.includes("LLM Mentions API"));
  assert.ok(DEFAULT_COMPETITORS.every((name) => name.trim().length > 0));
});

/* ------------------------------------------------------------------ */
/* Citation extraction, one provider shape at a time                   */
/* ------------------------------------------------------------------ */

check("OpenAI: answer text and url_citation annotations are read, duplicates dropped", () => {
  const extracted = extractOpenAI({
    output: [
      { type: "web_search_call", id: "ws_1" },
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: "LLMention is one option.",
            annotations: [
              { type: "url_citation", url: "https://example.com/a", title: "A" },
              { type: "url_citation", url: "https://example.com/a", title: "A again" },
              { type: "url_citation", url: "https://second.example/b" },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(extracted.answer, "LLMention is one option.");
  assert.deepEqual(extracted.citedUrls, ["https://example.com/a", "https://second.example/b"]);
  assert.equal(extracted.citationsMissingReason, null);
  assert.ok(extracted.rawAnnotations, "the raw annotation field is kept");
});

check("OpenAI: no annotations field is null-with-a-reason, not an empty citation list", () => {
  const extracted = extractOpenAI({
    output: [{ type: "message", content: [{ type: "output_text", text: "No sources here." }] }],
  });
  assert.equal(extracted.answer, "No sources here.");
  assert.equal(extracted.citedUrls, null);
  assert.match(extracted.citationsMissingReason ?? "", /no output_text\.annotations/);

  const measuredEmpty = extractOpenAI({
    output: [
      { type: "message", content: [{ type: "output_text", text: "No sources.", annotations: [] }] },
    ],
  });
  assert.deepEqual(measuredEmpty.citedUrls, [], "an empty annotations array IS a measured zero");
  assert.equal(measuredEmpty.citationsMissingReason, null);
});

check("OpenAI: an empty response has no answer, and the reason says so", () => {
  const extracted = extractOpenAI({ output: [] });
  assert.equal(extracted.answer, null);
  assert.ok(extracted.answerMissingReason);
  assert.equal(extracted.citedUrls, null);
});

check("Anthropic: text blocks are joined, and both citation shapes are read", () => {
  const extracted = extractAnthropic({
    content: [
      {
        type: "text",
        text: "LLMention is one option.",
        citations: [{ type: "web_search_result_location", url: "https://a.example/x", title: "X" }],
      },
      { type: "web_search_tool_result", content: [
        { type: "web_search_result", url: "https://b.example/y", title: "Y" },
      ] },
      { type: "text", text: "It is described in the sources above." },
    ],
  });
  assert.equal(extracted.answer, "LLMention is one option.\nIt is described in the sources above.");
  assert.deepEqual(extracted.citedUrls, ["https://a.example/x", "https://b.example/y"]);
  assert.equal(extracted.citationsMissingReason, null);
  assert.ok(extracted.rawAnnotations);
});

check("Anthropic: no citation blocks is null-with-a-reason; no text block is no answer", () => {
  const noCitations = extractAnthropic({
    content: [{ type: "text", text: "No web search was used." }],
  });
  assert.equal(noCitations.answer, "No web search was used.");
  assert.equal(noCitations.citedUrls, null);
  assert.match(noCitations.citationsMissingReason ?? "", /web_search_tool_result/);

  const noAnswer = extractAnthropic({ content: [] });
  assert.equal(noAnswer.answer, null);
  assert.ok(noAnswer.answerMissingReason);
});

check("Gemini: parts are joined, thought parts are skipped, grounding URLs are read", () => {
  const extracted = extractGemini({
    candidates: [
      {
        content: {
          parts: [
            { text: "internal reasoning", thought: true },
            { text: "LLMention first." },
            { text: "Otterly second." },
          ],
        },
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://g.example/1", title: "G1" } },
            { web: { uri: "https://g.example/1", title: "G1 again" } },
          ],
        },
      },
    ],
  });
  assert.equal(extracted.answer, "LLMention first.\nOtterly second.");
  assert.deepEqual(extracted.citedUrls, ["https://g.example/1"]);
  assert.ok(extracted.rawAnnotations);
});

check("Gemini: missing groundingMetadata is null-with-a-reason; empty chunks is a measured zero", () => {
  const noGrounding = extractGemini({
    candidates: [{ content: { parts: [{ text: "Answer." }] } }],
  });
  assert.equal(noGrounding.answer, "Answer.");
  assert.equal(noGrounding.citedUrls, null);
  assert.match(noGrounding.citationsMissingReason ?? "", /groundingMetadata/);

  const emptyGrounding = extractGemini({
    candidates: [{ content: { parts: [{ text: "Answer." }] }, groundingMetadata: { groundingChunks: [] } }],
  });
  assert.deepEqual(emptyGrounding.citedUrls, []);
  assert.equal(emptyGrounding.citationsMissingReason, null);
});

check("Perplexity: content, citations and search_results are read and merged", () => {
  const extracted = extractPerplexity({
    choices: [{ message: { content: "LLMention is one tool." } }],
    citations: ["https://p.example/1", "https://p.example/2"],
    search_results: [
      { url: "https://p.example/2", title: "duplicate" },
      { url: "https://p.example/3", title: "third" },
    ],
  });
  assert.equal(extracted.answer, "LLMention is one tool.");
  assert.deepEqual(extracted.citedUrls, [
    "https://p.example/1",
    "https://p.example/2",
    "https://p.example/3",
  ]);
  assert.equal(extracted.citationsMissingReason, null);
});

check("Perplexity: neither citation field is null-with-a-reason; empty fields are a measured zero", () => {
  const noFields = extractPerplexity({ choices: [{ message: { content: "Answer." } }] });
  assert.equal(noFields.citedUrls, null);
  assert.match(noFields.citationsMissingReason ?? "", /citations nor a search_results/);

  const emptyFields = extractPerplexity({
    choices: [{ message: { content: "Answer." } }],
    citations: [],
    search_results: [],
  });
  assert.deepEqual(emptyFields.citedUrls, []);
  assert.equal(emptyFields.citationsMissingReason, null);
});

/* ------------------------------------------------------------------ */
/* Requests: the shapes and the key placement                          */
/* ------------------------------------------------------------------ */

const TEST_KEY = "sk-test-DO-NOT-PRINT-123";
const TEST_MODEL = "test-model-1";

check("each request names the documented endpoint and tool, and never puts the key in the body", () => {
  const expected: Record<string, string> = {
    openai: "https://api.openai.com/v1/responses",
    anthropic: "https://api.anthropic.com/v1/messages",
    gemini:
      "https://generativelanguage.googleapis.com/v1beta/models/test-model-1:generateContent",
    perplexity: "https://api.perplexity.ai/chat/completions",
  };
  for (const engine of ENGINES) {
    const request = buildRequest(engine, "how do I check if ChatGPT can crawl my site", {
      apiKey: TEST_KEY,
      model: TEST_MODEL,
    });
    assert.equal(request.url, expected[engine]);
    assert.ok(!request.body.includes(TEST_KEY), `${engine}: the key must not be in the JSON body`);
    assert.equal(request.headers["Content-Type"], "application/json");
  }
});

check("the web search / grounding tool is enabled on all four requests", () => {
  const openai = JSON.parse(
    buildRequest("openai", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).body
  );
  assert.deepEqual(openai.tools, [{ type: "web_search" }]);

  const anthropic = JSON.parse(
    buildRequest("anthropic", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).body
  );
  assert.equal(anthropic.tools[0].type, "web_search_20250305");
  assert.equal(anthropic.tools[0].name, "web_search");

  const gemini = JSON.parse(buildRequest("gemini", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).body);
  assert.deepEqual(gemini.tools, [{ google_search: {} }]);
});

check("the Gemini key travels in a header, not in the URL", () => {
  const request = buildRequest("gemini", "q", { apiKey: TEST_KEY, model: TEST_MODEL });
  assert.equal(request.headers["x-goog-api-key"], TEST_KEY);
  assert.ok(
    !request.url.includes(TEST_KEY),
    "a key in a query string ends up in logs and pasted URLs"
  );
});

check("each provider's auth header is the one its documentation requires", () => {
  assert.equal(
    buildRequest("openai", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).headers.Authorization,
    `Bearer ${TEST_KEY}`
  );
  assert.equal(
    buildRequest("perplexity", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).headers.Authorization,
    `Bearer ${TEST_KEY}`
  );
  assert.equal(
    buildRequest("anthropic", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).headers["x-api-key"],
    TEST_KEY
  );
  assert.equal(
    buildRequest("anthropic", "q", { apiKey: TEST_KEY, model: TEST_MODEL }).headers[
      "anthropic-version"
    ],
    "2023-06-01"
  );
});

check("keys and models resolve from the documented environment variables", () => {
  assert.deepEqual(resolveEngineKey("openai", {}), { apiKey: null, envName: null });
  assert.deepEqual(resolveEngineKey("openai", { OPENAI_API_KEY: "k" }), {
    apiKey: "k",
    envName: "OPENAI_API_KEY",
  });
  // Gemini accepts either name, and prefers the first one documented.
  assert.deepEqual(
    resolveEngineKey("gemini", { GOOGLE_API_KEY: "g1", GEMINI_API_KEY: "g2" }),
    { apiKey: "g1", envName: "GOOGLE_API_KEY" }
  );
  assert.deepEqual(resolveEngineKey("gemini", { GEMINI_API_KEY: "g2" }), {
    apiKey: "g2",
    envName: "GEMINI_API_KEY",
  });
  assert.equal(resolveModel("openai", {}), ENGINE_CONFIG.openai.defaultModel);
  assert.equal(resolveModel("openai", { OPENAI_MODEL: "override" }), "override");
});

/* ------------------------------------------------------------------ */
/* The call, with a stubbed fetch                                      */
/* ------------------------------------------------------------------ */

type StubInit = {
  method: string;
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
};

function stubFetch(response: { status: number; body: string }) {
  const calls: { url: string; init: StubInit }[] = [];
  const fetchImpl = async (url: string, init: StubInit) => {
    calls.push({ url, init });
    return { status: response.status, text: async () => response.body };
  };
  return { calls, fetchImpl };
}

await check("a 200 response becomes an answer, its citations, and the request is logged", async () => {
  const stub = stubFetch({
    status: 200,
    body: JSON.stringify({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "LLMention is one option.",
              annotations: [{ type: "url_citation", url: "https://example.com/a" }],
            },
          ],
        },
      ],
    }),
  });
  const call = await callEngine("openai", "q", {
    apiKey: TEST_KEY,
    model: TEST_MODEL,
    fetchImpl: stub.fetchImpl,
    timeoutMs: 1000,
  });
  assert.equal(call.status, "ok");
  assert.equal(call.httpStatus, 200);
  assert.equal(call.answer, "LLMention is one option.");
  assert.deepEqual(call.citedUrls, ["https://example.com/a"]);
  assert.equal(call.error, null);
  assert.equal(stub.calls.length, 1);
  assert.equal(stub.calls[0].init.headers.Authorization, `Bearer ${TEST_KEY}`);
  assert.ok(stub.calls[0].init.signal instanceof AbortSignal, "the call is bounded by a timeout signal");
});

check("an HTTP rejection keeps the provider's error body and records no answer", async () => {
  const stub = stubFetch({ status: 429, body: '{"error":{"message":"rate limited, slow down"}}' });
  const call = await callEngine("anthropic", "q", {
    apiKey: TEST_KEY,
    model: TEST_MODEL,
    fetchImpl: stub.fetchImpl,
    timeoutMs: 1000,
  });
  assert.equal(call.status, "http_error");
  assert.equal(call.httpStatus, 429);
  assert.equal(call.answer, null);
  assert.equal(call.error, "HTTP 429");
  assert.match(call.errorBody ?? "", /rate limited/);
});

check("a non-JSON body is recorded as such, not parsed into an invented answer", async () => {
  const stub = stubFetch({ status: 200, body: "<html>upstream proxy error</html>" });
  const call = await callEngine("gemini", "q", {
    apiKey: TEST_KEY,
    model: TEST_MODEL,
    fetchImpl: stub.fetchImpl,
    timeoutMs: 1000,
  });
  assert.equal(call.status, "invalid_json");
  assert.equal(call.answer, null);
  assert.match(call.errorBody ?? "", /upstream proxy/);
});

check("a 200 response the extractor cannot read is unusable, not a non-mention", async () => {
  const stub = stubFetch({ status: 200, body: JSON.stringify({ output: [] }) });
  const call = await callEngine("openai", "q", {
    apiKey: TEST_KEY,
    model: TEST_MODEL,
    fetchImpl: stub.fetchImpl,
    timeoutMs: 1000,
  });
  assert.equal(call.status, "unusable_response");
  assert.equal(call.answer, null);
  assert.ok(call.answerMissingReason);
  assert.ok(call.error, "the record needs a reason for the missing verdict");
});

check("a network throw and a timeout are distinguished", async () => {
  const thrower = async () => {
    throw new Error("connect ECONNREFUSED");
  };
  const failed = await callEngine("perplexity", "q", {
    apiKey: TEST_KEY,
    model: TEST_MODEL,
    fetchImpl: thrower as never,
    timeoutMs: 1000,
  });
  assert.equal(failed.status, "throw");
  assert.match(failed.error ?? "", /ECONNREFUSED/);

  const timedOutFetch = async () => {
    const error = new Error("The operation was aborted due to timeout");
    error.name = "TimeoutError";
    throw error;
  };
  const timedOut = await callEngine("perplexity", "q", {
    apiKey: TEST_KEY,
    model: TEST_MODEL,
    fetchImpl: timedOutFetch as never,
    timeoutMs: 1000,
  });
  assert.equal(timedOut.status, "timeout");
  assert.match(timedOut.error ?? "", /timeout/i);
});

check("an empty key makes no call at all", async () => {
  const stub = stubFetch({ status: 200, body: "{}" });
  const call = await callEngine("openai", "q", {
    apiKey: "   ",
    model: TEST_MODEL,
    fetchImpl: stub.fetchImpl,
    timeoutMs: 1000,
  });
  assert.equal(call.status, "no_key");
  assert.equal(call.answer, null);
  assert.equal(stub.calls.length, 0, "a call with no credential is not a measurement");
});

/* ------------------------------------------------------------------ */
/* The whole chain, still without network                              */
/* ------------------------------------------------------------------ */

check("extraction and detection together read a real-shaped answer correctly", async () => {
  /*
   * The chain the runner performs, minus the network: provider JSON -> answer -> mention verdicts. The
   * answer names the OTHER product first and the brand second, which is the hardest case: a matcher
   * without boundaries would report the brand at the first position, and the record would say the brand
   * came before the competitor when it did the opposite.
   */
  const body = {
    choices: [
      {
        message: {
          content:
            "The LLM Mentions API is a DataForSEO product for tracking mentions. LLMention is a GEO scanner.",
        },
      },
    ],
    citations: ["https://example.com/source"],
  };
  const extracted = extractPerplexity(body);
  assert.ok(extracted.answer);
  const analysis = analyseAnswer(extracted.answer!, {
    brandNames: BRAND_NAMES,
    competitors: ["LLM Mentions API", "DataForSEO"],
  });
  assert.equal(analysis.brand.mentioned, true);
  assert.equal(analysis.brand.position, body.choices[0].message.content.indexOf("LLMention is"));
  assert.equal(analysis.competitors[0].mentioned, true);
  assert.ok(
    analysis.competitors[0].position! < analysis.brand.position!,
    "the API mention comes before the brand mention, and the record must say so"
  );
});

console.log("Monitor tests\n");
console.log(results.join("\n"));
const failed = results.filter((result) => result.startsWith("  FAIL")).length;
console.log(failed ? `\n${failed} test(s) failed.` : `\nAll ${results.length} monitor tests passed.`);
