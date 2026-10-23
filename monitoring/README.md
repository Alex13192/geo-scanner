# Monthly AI-mention monitoring

The same twenty-five questions, asked of four AI engines once a month, with the answer recorded so the
change between months can be read. This directory holds the reader's guide, the run files
(`monitoring/runs/`, gitignored) and the workflow that produces them.

The implementation is `lib/monitoring/questions.ts` (the bank), `lib/monitoring/mention.ts` (what
counts as a mention), `lib/monitoring/providers.ts` (the four API shapes) and
`scripts/monitor/run.mts` (the CLI). `scripts/test-monitor.mts` is the suite; it needs no key and no
network.

## What this measures, and what it does not

It measures, per question and per engine, four things about one answer:

1. **Was the brand mentioned at all**, and at which character offset.
2. **Which competitors were mentioned**, at which offsets, so the brand can be placed before or after
   them.
3. **Which URLs the engine cited**, when the response carries a citation field at all.
4. **What the answer said**, verbatim, so every flag above can be re-derived and checked.

It does **not** measure a visibility rate, a ranking, or share of voice across the market. One sample
per question per engine per month is a set of observations of a non-deterministic process, not a
statistic. See [The honest limit](#the-honest-limit) before quoting any of it.

## The question bank

Twenty-five finished questions in five groups of five, in `lib/monitoring/questions.ts`:

| Group         | What a month can say about it                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `discovery`   | Whether an assistant can find the site at all. No brand name appears in these questions.            |
| `tools`       | Whether LLMention is in a consideration set when somebody is already looking for a tool.           |
| `content`     | Whether LLMention is cited as a source of guidance, which is a different outcome from being recommended. |
| `measurement` | Whether the method is recognised — the questions an agency asks before buying for a client.        |
| `brand`       | Accuracy and disambiguation: what LLMention is, what it costs, and how it differs from the other product with a near-identical name. |

The bank is **frozen**. A monthly measurement is a time series, and a question that is reworded in month
three is a different question: the assistant may mention us for one wording and not the other, and the
file would show that as a rise or a fall rather than as a rewrite. To ask something new, add it in a new
`BANK_VERSION` or start a new series; do not edit a question silently.

The runner writes `BANK_VERSION` and a sha256 of the question text into every run file's header, so a
file from before an edit cannot be mistaken for one after it.

## The monthly cadence

Run on the **first working day** of the month, with the **same 25 questions** and the **same four
engines**. One sample per question per engine: that is the design, not a default. Two samples would be a
different measurement, and comparing it with a one-sample month would compare two methods.

The workflow (`.github/workflows/monitor.yml`) fires on the first of the month and can also be started
by hand with `workflow_dispatch`. Because "first working day" moves when the first falls on a weekend,
the scheduled run does the dry run and then skips the real measurement if the date is a weekend; start
the workflow by hand on the first working day instead. Keeping a fixed calendar day would also be
defensible, but the task's cadence is the working day, and a skipped run that says so is better than a
measurement labelled with the wrong date.

## Running it

```powershell
npm run monitor -- --dry-run     # print the bank and which providers are configured; asks nothing
npm run monitor                  # real run when at least one key is set; dry run when none is
npm run monitor -- --provider=openai   # ask only one engine (openai|anthropic|gemini|perplexity)
npm run monitor -- --date=2026-10-01   # name the run file for a specific day (default: today, UTC)
npm run monitor -- --timeout-ms=180000 # cap each call (default 120000)
npm run monitor -- --force             # replace an existing file for the same date
npm run test:monitor                   # the suite; no key, no network
```

If the npm aliases are not defined in your checkout, the same commands are
`node scripts/monitor/run.mts ...` and `node scripts/test-monitor.mts`. No key is ever read from a file
and none is printed.

An engine runs only when its key is present. The others are recorded as skipped, with the name of the
missing variable, in the run file's header and footer. `--provider=X` where X has no key and no
`--dry-run` is an error rather than a silent no-op: a specific measurement was asked for.

### The four keys

| Engine     | Key variable                                | Model override    |
| ---------- | ------------------------------------------- | ----------------- |
| ChatGPT    | `OPENAI_API_KEY`                            | `OPENAI_MODEL`    |
| Claude     | `ANTHROPIC_API_KEY`                         | `ANTHROPIC_MODEL` |
| Gemini     | `GOOGLE_API_KEY` or `GEMINI_API_KEY`        | `GEMINI_MODEL`    |
| Perplexity | `PERPLEXITY_API_KEY`                        | `PERPLEXITY_MODEL`|

Set them for one shell only, never in a committed file:

```powershell
$env:OPENAI_API_KEY = "<key>"
npm run monitor -- --provider=openai
```

For the monthly workflow, add each as a **repository secret** of the same name
(Settings → Secrets and variables → Actions). No secret value and no hostname appears in the workflow
file; the endpoints live in `lib/monitoring/providers.ts` so that a stale CI copy of a hostname cannot
exist.

Model ids are defaults, not claims: `gpt-4.1`, `claude-sonnet-4-5`, `gemini-2.5-flash`, `sonar-pro` as
of this bank version. A retired id produces an HTTP 4xx that the run records rather than hides, and the
override variable is how to move to a new one. The model actually asked is in every record.

## Reading a run file

`monitoring/runs/<YYYY-MM-DD>.jsonl` — JSON Lines, read one line at a time. There are three kinds of
line, distinguished by `kind`:

1. `monitor-run-header` — always one, first. The bank version and sha256, the date, the mode, the exact
   models, the configured engines, the **skipped** engines and why, the brand spellings, and the
   competitor list the run looked for.
2. `monitor-record` — one per question per engine (25 × engines for a full month). Fields:
   `questionId`, `group`, `question`, `engine`, `engineLabel`, `model`, `timestamp`, `ok`, `status`,
   `httpStatus`, `ms`, `error`, `errorBody`, `answer`, `answerMissingReason`, `brandMentioned`,
   `brandPosition`, `brandMatchedName`, `brandEvidence`, `competitorMentions`, `citedUrls`,
   `citationsMissingReason`, `rawAnnotations`.
3. `monitor-run-footer` — always one, last, and **its absence means the run was interrupted**. Records,
   failures, and a per-engine summary.

Nullability is the part to read carefully, because it is where falsity would creep in:

| Value                        | Means                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `brandMentioned: true/false` | The answer was read and the brand is present/absent.                                                       |
| `brandMentioned: null`       | There was **no answer to read** — the call failed or the response was unreadable. `error` says why.         |
| `brandPosition: null`        | No mention, or no answer. Compare with `competitorMentions[].position` when both are present.              |
| `citedUrls: []`              | The response carried a citation field and it was empty: the engine cited nothing for this answer.          |
| `citedUrls: null`            | The response had no citation field this code can read. `citationsMissingReason` says which field was absent. The engine did not necessarily cite nothing; the response is simply silent. |
| `ok: false`                  | The call failed. `status` is `http_error`, `timeout`, `invalid_json`, `unusable_response`, `throw` or `no_key`; `errorBody` keeps up to 300 characters of the provider's own message. |

A `limit` line in the header repeats the one-sentence version of the warning below, because a file
travels without this README.

## The honest limit

**One sample per question per engine per month is directional, not statistical.** The engines are
non-deterministic — the same question can mention the brand today and not tomorrow, with no change to
anything on the site — and one lane of 25 questions sampled once cannot estimate a rate with an error
bar. Read a month against the *previous* months: is the brand appearing in a group where it never did?
Did a competitor appear in a group where it never had? A single month is a set of readings, not a score.

What is *not* verified, stated rather than implied:

- **The four live API shapes.** This repository has no keys, so no real call has been made from here.
  The request bodies and the four extraction functions are built from the providers' documented shapes
  and tested against hand-written response bodies; the first real month is what confirms them. If a
  provider changes its shape, the extractor records `null` with a reason instead of inventing a value —
  the failure is visible in `citationsMissingReason` / `answerMissingReason`.
- **Whether each engine really ran a web search.** The tools are always requested, but the response
  shape is the only evidence: no annotations/grounding blocks means "not readable this way", which is
  recorded as null rather than as "cited nothing".
- **Comparability across months when a model changes.** The header names the model used. A provider's
  default model changes independently of this repository; if a month used a different model, it is a
  different measurement, and the file says which one it was.
- **The competitor list.** It is a fixed, documented list (see `DEFAULT_COMPETITORS`), recorded in each
  header. It is not an exhaustive market map, and names added later start their own series.

## The false positive this code is built around

`LLMention` is one space away from DataForSEO's **LLM Mentions API**, and `lib/site.ts` already records
that a model can merge the two. A mention detector can make the same mistake in a way that leaves no
trace: normalise the text first (lowercase, strip spaces and punctuation so that `llm mention`,
`LLM-Mention` and `LLMention` all collapse), and `LLM Mentions API` collapses to `llmmentionsapi`, which
*contains* `llmmention`. Every mention of the other product then counts as a mention of ours, and the
month's data says we are visible in a category where every hit came from a competitor's name.

So `lib/monitoring/mention.ts` never normalises separators: it imports the repository's word-boundary
rule (`findMention` in `lib/answer-check/rules.ts`, which treats "Ramp" inside "ramp-up" as a
non-mention), so `LLM Mentions API`, `llm mention`, `LLMentional` and `LLMentions` are not mentions.
`scripts/test-monitor.mts` asserts both the false positive and the boundary rule that prevents it. The
deliberate cost: the plural `LLMentions`, which a person might write, is also not counted. That is the
conservative direction — a missed plural makes a number understated, while a false positive on the other
product's name corrupts the direction of the series.
