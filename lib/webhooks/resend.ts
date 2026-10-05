/**
 * Verifying that a webhook actually came from Resend.
 *
 * WHY THIS IS NOT OPTIONAL, AND WHY IT IS THE WHOLE FILE. The endpoint it guards is public by
 * necessity - it is called by a third party, so it cannot require a session and cannot be
 * hidden. Without a signature check, anyone who learns the URL can POST a body saying that any
 * address has bounced, and the product will stop emailing that person. The attack needs no
 * credentials and leaves no trace beyond a subscription that quietly stopped. Verifying the
 * signature is the only thing standing between the endpoint and that.
 *
 * RESEND SIGNS WITH SVIX, so this implements Svix's scheme rather than inventing one:
 *
 *   signed content = `${svix-id}.${svix-timestamp}.${raw body}`
 *   signature      = base64( HMAC-SHA256( base64decode(secret without "whsec_"), content ) )
 *
 * and the `svix-signature` header is a space-separated list of `v1,<signature>` pairs. Any one
 * matching is a pass, because Svix sends every active key during a rotation.
 */

/** How far out of date a timestamp may be. Svix's own default is five minutes. */
const TOLERANCE_SECONDS = 300;

export type VerifyInput = {
  /** `svix-id` */
  id: string | null;
  /** `svix-timestamp`, as sent - seconds since the epoch, as a string. */
  timestamp: string | null;
  /** `svix-signature` */
  signature: string | null;
  /** The RAW request body. Re-serialising parsed JSON would change the bytes and break this. */
  body: string;
  /** The `whsec_...` value from the Resend dashboard. */
  secret: string | undefined;
  /** Injectable so the timestamp window can be tested without waiting five minutes. */
  nowMs?: number;
};

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/** base64 to bytes. `atob` is a workerd global, so this needs no dependency. */
/*
 * The explicit `Uint8Array<ArrayBuffer>` return type is not decoration. TypeScript 5.7 made the
 * typed arrays generic over their backing buffer, and the default is `ArrayBufferLike` - which
 * includes SharedArrayBuffer and is therefore not assignable to the `BufferSource` that
 * crypto.subtle.importKey takes. Widening it back here keeps the cast in one place instead of at
 * every call site.
 */
function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

/**
 * Compare without leaking position through timing.
 *
 * The same reason lib/subscribe/tokens.ts has one: an attacker controls the input and can
 * measure the reply, and a `===` on a signature exits at the first differing character.
 */
function equalInConstantTime(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyResendSignature(input: VerifyInput): Promise<VerifyResult> {
  const { id, timestamp, signature, body, secret } = input;

  /*
   * A missing secret is a refusal, not a pass. It is the state before the webhook is configured,
   * and the tempting alternative - accept everything until a secret exists - would mean the
   * endpoint is unprotected for exactly as long as nobody remembers to set it.
   */
  if (!secret) return { ok: false, reason: "no webhook secret is configured" };
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing svix headers" };

  const sent = Number(timestamp);
  if (!Number.isFinite(sent)) return { ok: false, reason: "unparseable timestamp" };

  /*
   * Replay protection. A signature stays valid forever on its own, so a captured request could
   * be resent at any time - and one of the events this handles is permanent, so a replay would
   * re-apply a decision that was already made. The window is what makes a signature a signature
   * of a moment rather than of a string.
   */
  const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - sent) > TOLERANCE_SECONDS) {
    return { ok: false, reason: "timestamp outside the tolerance window" };
  }

  const keyBytes = base64ToBytes(secret.replace(/^whsec_/, ""));

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedContent = `${id}.${timestamp}.${body}`;
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = bytesToBase64(mac);

  // `v1,<sig>` pairs, space separated. The version prefix is compared rather than stripped, so
  // a future v2 scheme fails here instead of being silently accepted as if it were v1.
  const candidates = signature.split(" ").map((part) => part.trim()).filter(Boolean);
  const matched = candidates.some((part) => {
    const [version, value] = part.split(",");
    return version === "v1" && value !== undefined && equalInConstantTime(value, expected);
  });

  return matched ? { ok: true } : { ok: false, reason: "signature does not match" };
}
