/**
 * Tests for lib/net/rate-limit.ts.
 *
 * Run with:  node scripts/test-rate-limit.mts
 *
 * This file exists because the limiter's memory guard used to disarm the limiter.
 * `buckets.clear()` ran when the map exceeded MAX_KEYS, so the flood that triggered
 * the guard also reset every client's bucket, the flooder's included - a rate-limit
 * bypass that looked like prudence. Nothing caught it because nothing tested it: the
 * bucket has no seam for time, so a test could only ever see the empty end of it.
 *
 * The first assertion below is that regression, stated as the property that broke:
 * a client who is currently limited must still be limited after a flood.
 */
import { takeToken, RATE_LIMIT } from "../lib/net/rate-limit.ts";

const CAPACITY = RATE_LIMIT.capacity;
/**
 * The flood has to exceed maxKeys + trimSlack, or the eviction code never runs and the
 * regression test passes without testing anything. The first version flooded maxKeys
 * + 50, which sat below the amortisation threshold, and the bug it was written to catch
 * looked fixed.
 */
const TRIM_AT = RATE_LIMIT.maxKeys + RATE_LIMIT.trimSlack;
const FLOOD = TRIM_AT + 200;

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

/** A fixed clock, advanced explicitly, so refill is testable. */
let clock = 1_000_000_000_000;
const tick = (ms: number) => (clock += ms);

console.log("=== rate limiter ===");

/* 1. A fresh client is allowed and is told nothing about waiting. */
{
  const first = takeToken("fresh-client", clock);
  check("a fresh client is allowed", first.allowed && first.retryAfter === 0);
}

/* 2. Distinct clients do not share a bucket. */
{
  for (let i = 0; i < CAPACITY; i++) takeToken("exhaust-me", clock);
  const other = takeToken("unrelated-client", clock);
  check("a second client is unaffected by the first", other.allowed);
}

/* 3. The bucket empties after CAPACITY requests and reports a wait. */
{
  const denied = takeToken("exhaust-me", clock);
  check(
    "a client is denied after CAPACITY requests",
    !denied.allowed,
    `retryAfter=${denied.retryAfter}s`
  );
  check("retryAfter is at least one second", denied.retryAfter >= 1);
}

/* 4. Tokens come back, and a full window is enough for all of them. */
{
  const key = "refill-client";
  for (let i = 0; i < CAPACITY; i++) takeToken(key, clock);
  const beforeRefill = takeToken(key, clock);
  tick(60_000);
  const afterRefill = takeToken(key, clock);
  check(
    "denied before a full window and allowed after it",
    !beforeRefill.allowed && afterRefill.allowed,
    `${beforeRefill.allowed} -> ${afterRefill.allowed}`
  );
}

/* 5. THE REGRESSION. A flood of distinct keys must not reset an exhausted client.
      Under the old clear() this client came back with a full bucket and the
      assertion below failed. */
{
  const victim = "flood-victim";
  for (let i = 0; i < CAPACITY; i++) takeToken(victim, clock);
  const beforeFlood = takeToken(victim, clock);
  check("the victim is limited before the flood", !beforeFlood.allowed);

  for (let i = 0; i < FLOOD; i++) takeToken(`flood-${i}`, clock);

  const afterFlood = takeToken(victim, clock);
  check(
    "the victim is STILL limited after a flood of distinct keys",
    !afterFlood.allowed,
    `flooded ${FLOOD} keys, past the trim threshold of ${TRIM_AT}`
  );
}

/* 6. The flood must not have been made cheaper for the flooder either: identities
      are per key, so each gets its own bucket, but an individual flood key that has
      been exhausted inside the flood stays exhausted. */
{
  const key = "flood-0";
  for (let i = 0; i < CAPACITY; i++) takeToken(key, clock);
  const denied = takeToken(key, clock);
  check("an exhausted flood key is still denied", !denied.allowed);
}

console.log(
  failures === 0
    ? "\nAll rate limiter tests passed."
    : `\n${failures} rate limiter test(s) failed.`
);
process.exitCode = failures === 0 ? 0 : 1;
