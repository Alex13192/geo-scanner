/**
 * Payment primitives tests.
 *
 * WHAT IS PINNED HERE, AND WHY EACH ONE MATTERS:
 *   - the reference format, because it is quoted in emails and matched in a provider's
 *     dashboard by a human;
 *   - the HMAC round trip, because a webhook that accepts any body is a free report;
 *   - tampering, replay-window and missing-secret rejection, because those are the three
 *     ways a signature check is usually weakened without anybody noticing;
 *   - the price table shape, because the pricing page and the checkout endpoint read the
 *     same module and a duplicated number is how a buyer gets charged something else.
 *
 * Run: node scripts/test-paywall.mts   (npm run test:paywall)
 */
import {
  isReference,
  newReference,
  signPayload,
  verifySignature,
} from "../lib/payments.ts";
import { PRODUCTS, formatUsd, getProduct } from "../lib/pricing.ts";

let failures = 0;
let passes = 0;

function check(ok: boolean, pass: string, fail: string) {
  if (ok) {
    passes += 1;
    console.log(`  PASS  ${pass}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${fail}`);
  }
}

console.log("=== paywall primitives ===");

/* References */
const ref = newReference(1_700_000_000_000, () => 0.123456);
check(isReference(ref), `reference matches the format: ${ref}`, `bad reference format: ${ref}`);
check(
  newReference(1, () => 0.1) !== newReference(1, () => 0.2),
  "two references at the same millisecond differ",
  "references collide when the clock is identical"
);

/* Signature round trip */
const secret = "test-secret-not-a-real-one";
const body = JSON.stringify({ event: "payment.succeeded", reference: ref });
const now = 1_700_000_000_000;
const ts = Math.floor(now / 1000);
const header = `t=${ts},v1=${signPayload(secret, ts, body)}`;

check(
  verifySignature(secret, header, body, now).ok,
  "a correctly signed body verifies",
  "a correctly signed body was rejected"
);
check(
  !verifySignature(secret, header, body + " ", now).ok,
  "a body changed after signing is rejected",
  "tampered body was accepted"
);
check(
  !verifySignature(secret, `t=${ts},v1=${"0".repeat(64)}`, body, now).ok,
  "a wrong signature is rejected",
  "wrong signature was accepted"
);
check(
  !verifySignature(secret, header, body, now + 10 * 60 * 1000).ok,
  "a signature outside the tolerance window is rejected",
  "replayed signature was accepted"
);
check(
  !verifySignature("", header, body, now).ok,
  "an unconfigured secret rejects every webhook",
  "an empty secret accepted a webhook"
);
check(
  !verifySignature(secret, "garbage", body, now).ok,
  "a malformed header is rejected",
  "malformed header was accepted"
);

/* Prices */
check(
  PRODUCTS.length === 2 && getProduct("signal")?.priceUsd === 39 && getProduct("pro")?.priceUsd === 99,
  "the ladder is $39 Signal / $99 Pro",
  `unexpected ladder: ${PRODUCTS.map((p) => `${p.id}=${p.priceUsd}`).join(", ")}`
);
check(getProduct("nope") === null, "unknown product ids are refused", "unknown product id matched");
check(formatUsd(39) === "$39", "prices render as whole dollars", `unexpected price format: ${formatUsd(39)}`);
check(
  PRODUCTS.every((p) => p.checkoutEnv.startsWith("CHECKOUT_URL_")),
  "each product names the environment variable its checkout URL comes from",
  "a product has no checkout environment variable"
);

console.log(
  failures === 0 ? `\nAll ${passes} paywall tests passed.` : `\n${failures} paywall test(s) failed.`
);
process.exitCode = failures === 0 ? 0 : 1;
