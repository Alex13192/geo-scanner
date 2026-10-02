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

/** Stop the map growing without bound if a lot of distinct clients arrive. */
const MAX_KEYS = 5000;

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

export function takeToken(key: string): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) {
      if (now - b.updated > WINDOW_MS) buckets.delete(k);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
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
