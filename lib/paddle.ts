/**
 * Paddle Billing: the two things this site needs from the provider, kept pure.
 *
 * WHY THIS FILE EXISTS: the site already has a provider-agnostic contract (an order reference in
 * the checkout request, a signed webhook that marks it paid). Paddle is the merchant of record the
 * store is applying to, so the adapter is a signature scheme plus one payload mapping - not a
 * rewrite of the pricing page, the order table or the success page. Everything that can be tested
 * without a network lives here; the two API calls live below it.
 *
 * WHY PADDLE'S SIGNATURE IS NOT THE GENERIC ONE IN lib/payments.ts: Paddle signs
 * `${ts}:${rawBody}` with HMAC-SHA256 and puts `ts=...;h1=...` in `Paddle-Signature`. The generic
 * verifier signs `<t>.<rawBody>` and reads `x-payment-signature`. Pretending they are the same
 * header would mean either weakening one check or silently accepting the wrong scheme.
 *
 * THE TOLERANCE IS FIVE MINUTES, NOT PADDLE'S FIVE SECONDS. Paddle's SDKs use five seconds against
 * the timestamp; a Worker cold start plus Paddle's own retry queue makes that a coin flip on a slow
 * delivery. The signature still proves the body came from Paddle, and replay is stopped where it
 * matters: `markOrderPaid` only transitions `pending` -> `paid`, so a replay cannot deliver twice.
 * This mirrors the decision recorded for the generic verifier in lib/payments.ts.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type PaddleEnvironment = "sandbox" | "production";

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function paddleApiBase(environment: PaddleEnvironment): string {
  return environment === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

export function paddleSignedPayload(timestamp: string | number, rawBody: string): string {
  return `${timestamp}:${rawBody}`;
}

/** Parse `ts=1671552777;h1=...` (at least one h1; Paddle may return several during rotation). */
export function parsePaddleSignature(header: string): { timestamp: number; hashes: string[] } | null {
  const parts = new Map<string, string[]>();
  for (const part of header.split(";")) {
    const [key, value] = part.trim().split("=", 2);
    if (!key || !value) continue;
    const list = parts.get(key) ?? [];
    list.push(value);
    parts.set(key, list);
  }
  const ts = Number(parts.get("ts")?.[0]);
  const hashes = parts.get("h1") ?? [];
  if (!Number.isFinite(ts) || hashes.length === 0) return null;
  return { timestamp: ts, hashes };
}

export function verifyPaddleSignature(
  secret: string,
  header: string | null,
  rawBody: string,
  now: number = Date.now(),
  toleranceSeconds = 300
): VerifyResult {
  if (!secret) return { ok: false, reason: "no webhook secret configured" };
  if (!header) return { ok: false, reason: "missing Paddle-Signature header" };

  const parsed = parsePaddleSignature(header);
  if (!parsed) return { ok: false, reason: "malformed Paddle-Signature header" };
  if (Math.abs(Math.floor(now / 1000) - parsed.timestamp) > toleranceSeconds) {
    return { ok: false, reason: "signature timestamp outside the tolerance window" };
  }

  const expected = createHmac("sha256", secret)
    .update(paddleSignedPayload(parsed.timestamp, rawBody), "utf8")
    .digest("hex");
  const matched = parsed.hashes.some((candidate) => timingSafeEqualHex(expected, candidate));
  return matched ? { ok: true } : { ok: false, reason: "signature mismatch" };
}

export type PaddleTransactionSummary = {
  reference: string;
  customerId: string | null;
  currency: string;
  subtotalCents: number;
  priceIds: string[];
};

/**
 * The parts of a `transaction.completed` event the site verifies. Returns null rather than guessing:
 * a payload without a `custom_data.reference` is not an order this site created, so it must not
 * reach `markOrderPaid`.
 */
export function readPaddleTransaction(payload: unknown): PaddleTransactionSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const event = payload as Record<string, unknown>;
  if (event.event_type !== "transaction.completed") return null;
  const data = event.data;
  if (!data || typeof data !== "object") return null;
  const transaction = data as Record<string, unknown>;

  const customData = transaction.custom_data;
  const reference =
    customData && typeof customData === "object"
      ? (customData as Record<string, unknown>).reference
      : undefined;
  if (typeof reference !== "string" || reference.length === 0) return null;

  const currency = transaction.currency_code;
  if (typeof currency !== "string") return null;

  const details = transaction.details as Record<string, unknown> | undefined;
  const totals = details?.totals as Record<string, unknown> | undefined;
  const subtotal = Number(totals?.subtotal);
  if (!Number.isFinite(subtotal)) return null;

  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const priceIds = items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const price = (item as Record<string, unknown>).price;
      if (!price || typeof price !== "object") return null;
      const id = (price as Record<string, unknown>).id;
      return typeof id === "string" ? id : null;
    })
    .filter((id): id is string => id !== null);

  const customerId = typeof transaction.customer_id === "string" ? transaction.customer_id : null;

  return { reference, customerId, currency, subtotalCents: subtotal, priceIds };
}

/* ------------------------------------------------------------------ */
/* Configuration and API calls                                         */
/* ------------------------------------------------------------------ */

export type PaddleCheckoutConfig = {
  environment: PaddleEnvironment;
  clientToken: string;
  priceIds: Record<string, string>;
};

function readEnv(env: Record<string, string | undefined>, key: string): string {
  return (env[key] ?? "").trim();
}

/**
 * Checkout is enabled only when all three values are present. `PADDLE_ENV` defaults to sandbox on
 * purpose: forgetting to set `production` must not quietly take real money from a test catalogue.
 */
export function readPaddleCheckoutConfig(
  env: Record<string, string | undefined>
): PaddleCheckoutConfig | null {
  const clientToken = readEnv(env, "PADDLE_CLIENT_TOKEN");
  const rawPrices = readEnv(env, "PADDLE_PRICE_IDS");
  if (!clientToken || !rawPrices) return null;

  let priceIds: unknown;
  try {
    priceIds = JSON.parse(rawPrices);
  } catch {
    console.error("[paddle] PADDLE_PRICE_IDS is not valid JSON");
    return null;
  }
  if (!priceIds || typeof priceIds !== "object" || Array.isArray(priceIds)) return null;
  const map = Object.fromEntries(
    Object.entries(priceIds as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0
    )
  );
  if (Object.keys(map).length === 0) return null;

  const environment = readEnv(env, "PADDLE_ENV") === "production" ? "production" : "sandbox";
  return { environment, clientToken, priceIds: map };
}

/** Read the same price map in the webhook, where only the reverse lookup is needed. */
export function readPaddlePriceIds(env: Record<string, string | undefined>): Record<string, string> {
  const config = readPaddleCheckoutConfig(env);
  return config?.priceIds ?? {};
}

/**
 * The webhook carries `customer_id`, not an email address. The report is delivered by email, so the
 * handler resolves the address from Paddle. A failure here is logged and the order is still marked
 * paid: refusing to record money because a lookup failed would be the wrong trade.
 */
export async function getPaddleCustomerEmail(
  env: Record<string, string | undefined>,
  customerId: string
): Promise<string | null> {
  const apiKey = readEnv(env, "PADDLE_API_KEY");
  if (!apiKey) return null;
  const environment = readEnv(env, "PADDLE_ENV") === "production" ? "production" : "sandbox";
  try {
    const res = await fetch(`${paddleApiBase(environment)}/customers/${encodeURIComponent(customerId)}`, {
      headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[paddle] customer lookup failed: HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { data?: { email?: unknown } };
    return typeof json.data?.email === "string" ? json.data.email : null;
  } catch (error) {
    console.error("[paddle] customer lookup failed:", error);
    return null;
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
