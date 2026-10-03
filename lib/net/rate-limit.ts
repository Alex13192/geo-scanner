// lib/net/rate-limit.ts
//
// Best-effort request limiting for the two public scan endpoints.
//
// READ THIS BEFORE TRUSTING IT: this is an in-isolate token bucket. Cloudflare
// runs many isolates across many locations, each with its own copy of this Map,
// and they are evicted whenever the platform feels like it. So it reliably
// stops one client hammering one isolate, and it does NOT enforce a global
// limit. The authoritative limit belongs in Cloudflare's own rate limiting
// rules on /api/*, which run before the worker and are shared across the edge.
//
// This exists anyway because "no limit at all" and "a limit that is right most
// of the time" are different failure modes, and the second one is survivable.

const CAPACITY = 20;
const WINDOW_MS = 60_000;
const REFILL_PER_MS = CAPACITY / WINDOW_MS;

/*
 * Exported so the tests cannot drift away from them. A test that floods fewer keys
 * than TRIM_AT never reaches the eviction code at all and passes while verifying
 * nothing - which is precisely what happened on the first attempt, where the flood
 * size (5050) sat below the amortisation threshold (5500) and the regression looked
 * fixed.
 */
export const RATE_LIMIT = {
  /** Tokens per client per window. */
  capacity: CAPACITY,
  windowMs: WINDOW_MS,
  /** Cap on tracked keys. */
  maxKeys: 5000,
  /** How far above maxKeys the map may drift before it is swept. */
  trimSlack: 500,
} as const;

/** Stop the map growing without bound if a lot of distinct clients arrive. */
const MAX_KEYS = RATE_LIMIT.maxKeys;

/**
 * How far above the cap the map is allowed to drift before it is swept.
 *
 * The sweep is O(n), so running it on every request once the map is full would put a
 * 5000-entry scan inside the CPU budget of each request during exactly the flood the
 * guard exists for. Trimming in batches amortises that to once per trimSlack new keys.
 */
const TRIM_SLACK = RATE_LIMIT.trimSlack;
const TRIM_AT = MAX_KEYS + TRIM_SLACK;

type Bucket = { tokens: number; updated: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry. Zero when allowed. */
  retryAfter: number;
};

/**
 * Identify the caller. Cloudflare always sets cf-connecting-ip on a request that
 * reaches a worker, so the fallback only matters when this is run somewhere
 * else - and there, sharing one bucket is the safe direction to fail.
 */
export function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/**
 * Take one token for a client, or report how long to wait.
 *
 * `now` exists so the refill behaviour can be tested. Without it a test can only
 * observe the empty end of the bucket, because refilling one token takes three
 * seconds of real time - which is how the eviction bug below survived: nothing could
 * reach the state where it mattered. Production callers pass nothing and get
 * Date.now().
 */
export function takeToken(key: string, now: number = Date.now()): RateLimitResult {
  if (buckets.size > TRIM_AT) {
    /*
     * This guard used to be buckets.clear(), and that was a rate-limit bypass wearing
     * the costume of a memory guard: the flood that tripped it also reset every
     * client's bucket INCLUDING the flooder's, so an attacker who opened enough
     * distinct keys got a fresh 20 tokens for each identity while everybody else's
     * accounting vanished with them. The guard was disarmed by the exact event it
     * existed to survive.
     *
     * No eviction policy makes a per-identity limiter immune to key flooding - the
     * header above says the authoritative limit belongs in Cloudflare's rules - so the
     * aim here is narrower and achievable: bound the memory without discarding the
     * history that enforcement depends on.
     *
     * Pass one is free. An entry whose tokens have refilled to full is
     * indistinguishable from no entry at all, so dropping it costs no accuracy.
     *
     * Pass two keeps the ESTABLISHED keys and drops the newest arrivals in insertion
     * order. The first attempt at this dropped the least-recently-updated instead, and
     * scripts/test-rate-limit.mts caught it being backwards: under a flood the newcomer
     * keys all share one timestamp, so the long-standing client sorts as the oldest and
     * the policy set about evicting precisely the history it was meant to protect. A key
     * seen for the first time during a flood is the one least worth tracking; a key with
     * history is the one being enforced.
     */
    for (const [k, b] of buckets) {
      if (Math.min(CAPACITY, b.tokens + (now - b.updated) * REFILL_PER_MS) >= CAPACITY) {
        buckets.delete(k);
      }
    }

    if (buckets.size > MAX_KEYS) {
      const keys = [...buckets.keys()];
      const drop = buckets.size - MAX_KEYS;
      // Insertion order, and a Map keeps it when an existing key is re-set, so this is
      // "first seen", not "last used" - which is the direction we want.
      for (let i = keys.length - 1; i >= keys.length - drop; i--) buckets.delete(keys[i]);
    }
  }

  const bucket = buckets.get(key) ?? { tokens: CAPACITY, updated: now };
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + (now - bucket.updated) * REFILL_PER_MS);
  bucket.updated = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((1 - bucket.tokens) / REFILL_PER_MS / 1000)) };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true, retryAfter: 0 };
}
