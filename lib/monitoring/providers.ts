/**
 * The four engines, their request shapes, and how each provider's citations are read.
 *
 * WHY THE NETWORK CALL IS ONE SMALL FUNCTION AND THE REST IS PURE. The monthly run is four API shapes
 * that change independently, and the thing that must not change is the answer: what was asked, what
 * came back, which URLs the engine cited. If the fetch and the parsing are interleaved, none of that
 * can be checked without a key - and this environment has none. So:
 *
 *   buildRequest()   pure: engine + question + model -> URL, headers, JSON body. Testable by eye.
 *   extract*()       pure: a recorded response body -> answer text, citations, raw annotation field.
 *                    Testable against a hand-written body in the shape the provider documents.
 *   callEngine()     the only impure function: fetch behind a FetchLike parameter, so the tests pass a
 *                    stub and the runner passes the real one. No key is ever read here; the caller
 *                    supplies it, and the caller only asks providers that have one.
 *
 * WHY THE ENDPOINTS LIVE IN THIS FILE AND NOT IN THE WORKFLOW. .github/workflows/monitor.yml must not
 * carry a hostname (check:values cannot see a second source of truth in YAML, and a stale endpoint in
 * CI is silent until the month it runs). An endpoint is code and belongs beside the request shape it
 * serves.
 *
 * WHAT "BEST EFFORT" MEANS FOR CITATIONS, AND WHY SOME VALUES ARE NULL. Each provider reports citations
 * in a different field, and two of them omit the field entirely when the model answered without
 * searching. A missing field is not the same measurement as an empty list: [] says "the engine cited
 * nothing", null says "this response has no field to read citations from". Recording [] for both would
 * turn "the engine did not search" into the finding "the engine cited no sources", which is a claim
 * about the engine that the response does not support. So every extraction returns citedUrls plus a
 * reason when it is null, and the runner writes both into the record.
 */

export type Engine = "openai" | "anthropic" | "gemini" | "perplexity";

/** Asked in this order, so a file and a console agree about what "1 of 4" is. */
export const ENGINES: Engine[] = ["openai", "anthropic", "gemini", "perplexity"];

export type EngineConfig = {
  engine: Engine;
  /** How a reader names the engine: the assistant people use, not the company's API name. */
  label: string;
  /** Environment variables that may hold the key, in priority order. First one set wins. */
  apiKeyEnv: string[];
  /** Environment variable that overrides defaultModel. */
  modelEnv: string;
  /**
   * The model asked for when nothing overrides it. A default, not a claim: model ids are retired, and
   * a retired id produces an HTTP 4xx which the run records rather than hides. The header of every run
   * file names the model actually asked, so a month measured with a different one is visible.
   */
  defaultModel: string;
};

export const ENGINE_CONFIG: Record<Engine, EngineConfig> = {
  openai: {
    engine: "openai",
    label: "ChatGPT (OpenAI)",
    apiKeyEnv: ["OPENAI_API_KEY"],
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4.1",
  },
  anthropic: {
    engine: "anthropic",
    label: "Claude (Anthropic)",
    apiKeyEnv: ["ANTHROPIC_API_KEY"],
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-4-5",
  },
  gemini: {
    engine: "gemini",
    label: "Gemini (Google)",
    // Google documents both names; accepting both is not ambiguity, it is the one provider whose docs
    // and console disagree. The header records which variable was used.
    apiKeyEnv: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.5-flash",
  },
  perplexity: {
    engine: "perplexity",
    label: "Perplexity",
    apiKeyEnv: ["PERPLEXITY_API_KEY"],
    modelEnv: "PERPLEXITY_MODEL",
    defaultModel: "sonar-pro",
  },
};

export type EnvLike = Record<string, string | undefined>;

/**
 * The key for one engine, and which variable supplied it. Null when none is set. The variable name is
 * returned with the key because the run header needs to say where the credential came from without
 * ever containing the credential.
 */
export function resolveEngineKey(
  engine: Engine,
  env: EnvLike
): { apiKey: string | null; envName: string | null } {
  for (const name of ENGINE_CONFIG[engine].apiKeyEnv) {
    const value = env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return { apiKey: value.trim(), envName: name };
    }
  }
  return { apiKey: null, envName: null };
}

/** The model for one engine: the override when set, the default otherwise. */
export function resolveModel(engine: Engine, env: EnvLike): string {
  const config = ENGINE_CONFIG[engine];
  const override = env[config.modelEnv];
  return typeof override === "string" && override.trim().length > 0
    ? override.trim()
    : config.defaultModel;
}

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */

export type EngineRequest = {
  url: string;
  headers: Record<string, string>;
  /** Already serialised, so callEngine cannot accidentally send a different body than the tests saw. */
  body: string;
};

/**
 * The request for one question, exactly as the provider's own documentation describes it. The web
 * search / grounding tool is always enabled: a monitor that asks without search would measure the
 * model's memory rather than what a user asking the same question sees, which is the whole point.
 */
export function buildRequest(
  engine: Engine,
  question: string,
  options: { apiKey: string; model: string }
): EngineRequest {
  const { apiKey, model } = options;
  const json = (body: unknown): string => JSON.stringify(body);

  switch (engine) {
    case "openai":
      return {
        url: "https://api.openai.com/v1/responses",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: json({
          model,
          input: question,
          tools: [{ type: "web_search" }],
        }),
      };
    case "anthropic":
      return {
        url: "https://api.anthropic.com/v1/messages",
        headers: {
          "x-api-key": apiKey,
          // The Messages API requires an explicit version and rejects requests without it.
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: json({
          model,
          max_tokens: 4096,
          messages: [{ role: "user", content: question }],
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        }),
      };
    case "gemini":
      return {
        url:
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          `${encodeURIComponent(model)}:generateContent`,
        headers: {
          // A HEADER, NOT ?key=. A key in a query string ends up in URLs that get pasted into issues and
          // proxy logs; the header keeps it out of the place a credential is most often leaked from.
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: json({
          contents: [{ parts: [{ text: question }] }],
          tools: [{ google_search: {} }],
        }),
      };
    case "perplexity":
      return {
        url: "https://api.perplexity.ai/chat/completions",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: json({
          model,
          messages: [{ role: "user", content: question }],
        }),
      };
  }
}

/* ------------------------------------------------------------------ */
/* Reading a recorded response                                         */
/* ------------------------------------------------------------------ */

export type Extracted = {
  answer: string | null;
  /** Why answer is null. Null when there is an answer. */
  answerMissingReason: string | null;
  /** The URLs the engine cited, in the order the response listed them and without duplicates. */
  citedUrls: string[] | null;
  /** Why citedUrls is null - a different outcome from an empty list. Null when citations were read. */
  citationsMissingReason: string | null;
  /** The provider field citations were read from, verbatim, so a later reader can re-derive them. */
  rawAnnotations: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Join the text parts of one response into the answer.
 *
 * WHY PARTS ARE JOINED WITH A NEWLINE. A response can split one answer across several content blocks
 * (a text block, a tool block, then more text). Concatenating without a separator would merge the last
 * word of one part into the first word of the next and could hide a word boundary - which is exactly
 * what brand detection depends on.
 */
function joinAnswer(parts: string[], missing: string): { text: string | null; reason: string | null } {
  const text = parts.map((p) => p.trim()).filter(Boolean).join("\n").trim();
  return text.length > 0 ? { text, reason: null } : { text: null, reason: missing };
}

/** Every http(s) URL in a list of strings or {url} records, trimmed, validated, de-duplicated. */
function collectUrls(candidates: unknown[]): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const candidate of candidates) {
    const raw = typeof candidate === "string" ? candidate : asString(asRecord(candidate)?.url);
    if (!raw) continue;
    const value = raw.trim();
    if (!/^https?:\/\//i.test(value)) continue;
    try {
      // Parsing rejects a malformed URL rather than recording a guess at what was meant.
      new URL(value);
    } catch {
      continue;
    }
    if (seen.has(value)) continue;
    seen.add(value);
    urls.push(value);
  }
  return urls;
}

/** ChatGPT: Responses API, output[].content[].annotations[].url_citation. */
export function extractOpenAI(body: unknown): Extracted {
  const record = asRecord(body);
  const output = asArray(record?.output) ?? [];
  const parts: string[] = [];
  const annotations: unknown[] = [];
  let sawAnnotations = false;

  for (const item of output) {
    const message = asRecord(item);
    if (!message || message.type !== "message") continue;
    for (const rawContent of asArray(message.content) ?? []) {
      const content = asRecord(rawContent);
      if (!content) continue;
      if (content.type !== "output_text" && content.type !== "text") continue;
      const text = asString(content.text);
      if (text) parts.push(text);
      if (Array.isArray(content.annotations)) {
        sawAnnotations = true;
        annotations.push(...content.annotations);
      }
    }
  }
  // The REST API returns output[]. Some proxies and recordings expose the SDK-style top-level
  // convenience field instead; accepting it costs one branch and loses nothing.
  if (parts.length === 0) {
    const flat = asString(record?.output_text);
    if (flat) parts.push(flat);
  }

  const answer = joinAnswer(
    parts,
    "the response contains no message with output_text, so there is no answer to record"
  );
  return {
    answer: answer.text,
    answerMissingReason: answer.reason,
    citedUrls: sawAnnotations ? collectUrls(annotations) : null,
    citationsMissingReason: sawAnnotations
      ? null
      : "the response contains no output_text.annotations array, so citations cannot be read from this shape (the web search tool may not have run)",
    rawAnnotations: sawAnnotations ? { annotations } : null,
  };
}

/** Claude: Messages API, content[] text blocks with citations, plus web_search_tool_result blocks. */
export function extractAnthropic(body: unknown): Extracted {
  const record = asRecord(body);
  const content = asArray(record?.content) ?? [];
  const parts: string[] = [];
  const textCitations: unknown[] = [];
  const searchResults: unknown[] = [];
  let sawCitationField = false;
  let sawSearchBlock = false;

  for (const rawBlock of content) {
    const block = asRecord(rawBlock);
    if (!block) continue;
    if (block.type === "text") {
      const text = asString(block.text);
      if (text) parts.push(text);
      if (Array.isArray(block.citations)) {
        sawCitationField = true;
        textCitations.push(...block.citations);
      }
    }
    if (block.type === "web_search_tool_result") {
      sawSearchBlock = true;
      const inner = asArray(block.content);
      if (inner) {
        searchResults.push(...inner);
      } else {
        // The search result content can be an error object instead of a list (rate limit, max_uses).
        // It is still a citation-bearing block, and recording it in rawAnnotations is what makes the
        // empty citation list readable rather than mysterious.
        searchResults.push(block.content);
      }
    }
  }

  const answer = joinAnswer(
    parts,
    "the response contains no text block, so there is no answer to record"
  );
  const sawCitations = sawCitationField || sawSearchBlock;
  return {
    answer: answer.text,
    answerMissingReason: answer.reason,
    citedUrls: sawCitations ? collectUrls([...textCitations, ...searchResults]) : null,
    citationsMissingReason: sawCitations
      ? null
      : "the response contains neither a text citations array nor a web_search_tool_result block, so citations cannot be read from this shape (the model may have answered without web search)",
    rawAnnotations: sawCitations
      ? { text_citations: textCitations, web_search_results: searchResults }
      : null,
  };
}

/** Gemini: generateContent, candidates[0] parts plus groundingMetadata.groundingChunks[].web.uri. */
export function extractGemini(body: unknown): Extracted {
  const record = asRecord(body);
  const candidates = asArray(record?.candidates) ?? [];
  const first = asRecord(candidates[0]);
  const candidateContent = asRecord(first?.content);
  const parts: string[] = [];
  for (const rawPart of asArray(candidateContent?.parts) ?? []) {
    const part = asRecord(rawPart);
    if (!part || part.thought === true) continue;
    const text = asString(part.text);
    if (text) parts.push(text);
  }

  const grounding = asRecord(first?.groundingMetadata);
  const chunks = asArray(grounding?.groundingChunks) ?? [];
  const citedCandidates: unknown[] = [];
  for (const rawChunk of chunks) {
    const chunk = asRecord(rawChunk);
    // Gemini's grounding entries carry the URL as `uri`, not `url` - the field name differs from every
    // other provider here, and looking for `url` on this shape silently produces an empty citation list.
    const web = asRecord(chunk?.web);
    const webUri = asString(web?.uri);
    if (webUri) citedCandidates.push(webUri);
    // Grounding for non-web sources nests the URI under retrievedContext. Best effort: whichever one
    // the response carries is a source worth recording.
    const retrieved = asRecord(chunk?.retrievedContext);
    const retrievedUri = asString(retrieved?.uri);
    if (retrievedUri) citedCandidates.push(retrievedUri);
  }

  const answer = joinAnswer(
    parts,
    "the response contains no candidate text part, so there is no answer to record"
  );
  return {
    answer: answer.text,
    answerMissingReason: answer.reason,
    citedUrls: grounding ? collectUrls(citedCandidates) : null,
    citationsMissingReason: grounding
      ? null
      : "the response contains no groundingMetadata, so citations cannot be read from this shape (google_search grounding may not have run)",
    rawAnnotations: grounding,
  };
}

/** Perplexity: chat completions, choices[0].message.content plus citations / search_results. */
export function extractPerplexity(body: unknown): Extracted {
  const record = asRecord(body);
  const choices = asArray(record?.choices) ?? [];
  const message = asRecord(asRecord(choices[0])?.message);
  const answerText = asString(message?.content);

  const citations = asArray(record?.citations);
  const searchResults = asArray(record?.search_results);
  const sawCitationField =
    record !== null &&
    (Object.prototype.hasOwnProperty.call(record, "citations") ||
      Object.prototype.hasOwnProperty.call(record, "search_results"));

  return {
    answer: answerText && answerText.trim().length > 0 ? answerText.trim() : null,
    answerMissingReason:
      answerText && answerText.trim().length > 0
        ? null
        : "the response contains no choices[0].message.content string, so there is no answer to record",
    citedUrls: sawCitationField
      ? collectUrls([...(citations ?? []), ...(searchResults ?? [])])
      : null,
    citationsMissingReason: sawCitationField
      ? null
      : "the response contains neither a citations nor a search_results field, so citations cannot be read from this shape",
    rawAnnotations: sawCitationField
      ? { citations: citations ?? null, search_results: searchResults ?? null }
      : null,
  };
}

/** Dispatch by engine. The runner and the tests both go through this, so they cannot disagree. */
export function extract(engine: Engine, body: unknown): Extracted {
  switch (engine) {
    case "openai":
      return extractOpenAI(body);
    case "anthropic":
      return extractAnthropic(body);
    case "gemini":
      return extractGemini(body);
    case "perplexity":
      return extractPerplexity(body);
  }
}

/* ------------------------------------------------------------------ */
/* The call                                                            */
/* ------------------------------------------------------------------ */

/** The small part of a Response that this code uses, so a test can stand in for fetch. */
export type FetchResponseLike = {
  status: number;
  text(): Promise<string>;
};

/**
 * A fetch-shaped function. The real one is global fetch; the tests pass a stub that returns a recorded
 * body. Keeping the call behind this type is what makes the request shape and the error handling
 * testable without a key and without network access.
 */
export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  }
) => Promise<FetchResponseLike>;

export type EngineCallStatus =
  | "ok"
  | "no_key"
  | "http_error"
  | "invalid_json"
  | "unusable_response"
  | "timeout"
  | "throw";

export type EngineCall = {
  engine: Engine;
  model: string;
  status: EngineCallStatus;
  httpStatus: number | null;
  ms: number;
  answer: string | null;
  answerMissingReason: string | null;
  citedUrls: string[] | null;
  citationsMissingReason: string | null;
  rawAnnotations: unknown;
  /** Why the call itself did not produce a usable answer. Null when status is "ok". */
  error: string | null;
  /** The provider's error body (or an unparseable body), digested to 300 characters. Never a key. */
  errorBody: string | null;
};

/** Web-search calls are slow. 120s is generous, and a timeout is recorded, not retried here. */
export const DEFAULT_TIMEOUT_MS = 120_000;

/** One line, bounded, so an HTML error page does not become the record. */
function digestBody(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 300);
}

/**
 * Ask one engine one question, and return everything the record needs.
 *
 * WHAT IT DOES NOT DO, deliberately: retry, or invent an answer. A retry would make one month's
 * "n" depend on the runner's luck, and a fabricated value on a failed call would make a broken
 * provider look like a quiet month. A failure is returned as a status and a reason, and the runner
 * writes it down; the next month retries by existing.
 */
export async function callEngine(
  engine: Engine,
  question: string,
  options: {
    apiKey: string;
    model: string;
    /** Defaults to global fetch. The tests pass a stub. */
    fetchImpl?: FetchLike;
    timeoutMs?: number;
  }
): Promise<EngineCall> {
  const { apiKey, model } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();
  const base = (): EngineCall => ({
    engine,
    model,
    status: "throw",
    httpStatus: null,
    ms: Date.now() - startedAt,
    answer: null,
    answerMissingReason: null,
    citedUrls: null,
    citationsMissingReason: null,
    rawAnnotations: null,
    error: null,
    errorBody: null,
  });

  // An empty key would be sent as an empty Authorization header, which some providers reject as a
  // malformed request and others log as an attempt. Neither is a measurement, so no call is made.
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      ...base(),
      status: "no_key",
      error: "no API key was supplied, so no call was made",
    };
  }

  const request = buildRequest(engine, question, { apiKey: apiKey.trim(), model });
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);

  try {
    const response = await fetchImpl(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status < 200 || response.status >= 300) {
      const body = await response.text().catch(() => "");
      return {
        ...base(),
        status: "http_error",
        httpStatus: response.status,
        error: `HTTP ${response.status}`,
        // The body of a rejection is the only diagnosis available: provider error messages name the
        // rejected parameter (a retired model, a missing billing method), and a bare status does not.
        errorBody: digestBody(body) || "(empty error body)",
      };
    }

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ...base(),
        status: "invalid_json",
        httpStatus: response.status,
        error: "the response body is not JSON",
        errorBody: digestBody(text),
      };
    }

    const extracted = extract(engine, parsed);
    return {
      ...base(),
      status: extracted.answer === null ? "unusable_response" : "ok",
      httpStatus: response.status,
      answer: extracted.answer,
      answerMissingReason: extracted.answerMissingReason,
      citedUrls: extracted.citedUrls,
      citationsMissingReason: extracted.citationsMissingReason,
      rawAnnotations: extracted.rawAnnotations,
      error: extracted.answer === null ? extracted.answerMissingReason : null,
    };
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const timedOut =
      /abort|timeout/i.test(message) ||
      (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError"));
    return {
      ...base(),
      status: timedOut ? "timeout" : "throw",
      error: timedOut ? `per-call timeout after ${timeoutMs}ms` : message,
      errorBody: timedOut ? null : message,
    };
  }
}
