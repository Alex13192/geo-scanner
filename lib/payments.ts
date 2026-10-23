/**
 * Payment primitives that do not belong to any one provider.
 *
 * The merchant of record is not chosen yet (Creem rejected this store; Anyway/Dodo/Polar
 * are the candidates). The site therefore talks to *one* internal contract - an order
 * reference and a signed webhook - and a provider gets adapted at the edge of that contract
 * rather than rewritten through the pricing page and the order table.
 *
 * WHY HMAC RATHER THAN A PROVIDER SDK: no SDK is installed, and installing one for a
 * provider that may reject the application would be a dependency without a user. The
 * adapter for the chosen provider is `verifySignature` plus the payload mapping in the
 * webhook route; the tests pin the signature behaviour so an adapter cannot weaken it.
 */

/** `LM-<time36>-<random>`: short enough to read on an invoice, unique enough not to collide. */
export function newReference(now: number = Date.now(), random: () => number = Math.random): string {
  const time = Math.floor(now).toString(36).toUpperCase();
  const entropy = Math.floor(random() * 36 ** 6)
    .toString(36)
    .toUpperCase()
    .padStart(6, "0");
  return `LM-${time}-${entropy}`;
}

export function isReference(value: string): boolean {
  return /^LM-[0-9A-Z]+-[0-9A-Z]{6}$/.test(value);
}

/**
 * The signed-header format: `t=<unix seconds>,v1=<hex hmac>`.
 *
 * This is the shape the large payment providers use, so adapting one is a header-name change
 * rather than a new scheme. The timestamp is INSIDE the signed material, which is what stops
 * a captured body from being replayed after the tolerance window.
 */
export function signPayload(secret: string, timestamp: number, rawBody: string): string {
  return hmacHex(secret, `${timestamp}.${rawBody}`);
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifySignature(
  secret: string,
  header: string | null,
  rawBody: string,
  now: number = Date.now(),
  toleranceSeconds = 300
): VerifyResult {
  if (!secret) return { ok: false, reason: "no webhook secret configured" };
  if (!header) return { ok: false, reason: "missing signature header" };

  const parts = new Map(
    header
      .split(",")
      .map((part) => part.trim().split("=", 2) as [string, string])
      .filter((pair) => pair.length === 2)
  );
  const timestamp = Number(parts.get("t"));
  const provided = parts.get("v1") ?? "";
  if (!Number.isFinite(timestamp) || !provided) {
    return { ok: false, reason: "malformed signature header" };
  }
  if (Math.abs(Math.floor(now / 1000) - timestamp) > toleranceSeconds) {
    return { ok: false, reason: "signature timestamp outside the tolerance window" };
  }
  const expected = signPayload(secret, timestamp, rawBody);
  if (!timingSafeEqualHex(expected, provided)) {
    return { ok: false, reason: "signature mismatch" };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Small crypto helpers, kept pure so the tests can pin them          */
/* ------------------------------------------------------------------ */

/**
 * Node's `crypto` is used rather than Web Crypto's async API because these functions are
 * called from a route handler that already awaits; the Worker runs Node with nodejs_compat,
 * and the test script is plain Node. If this module is ever imported by client code it must
 * not be - it is server-only by convention, like lib/db.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
