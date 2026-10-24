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
import {
  parsePaddleSignature,
  readPaddleCheckoutConfig,
  readPaddleTransaction,
  verifyPaddleSignature,
} from "../lib/paddle.ts";
import { PRODUCTS, formatUsd, getProduct } from "../lib/pricing.ts";
import { createHmac } from "node:crypto";

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

/* ------------------------------------------------------------------ */
/* Paddle: signature, payload mapping, configuration                   */
/* ------------------------------------------------------------------ */

const paddleSecret = "pdl_ntfset_test_not_a_real_secret";
const paddleEvent = JSON.stringify({
  event_id: "evt_01gks14ge726w50ch2tmaw2a1x",
  event_type: "transaction.completed",
  occurred_at: "2026-10-24T12:00:00.000000Z",
  notification_id: "ntf_01gks14ge726w50ch2tmaw2a1x",
  data: {
    id: "txn_01gks14ge726w50ch2tmaw2a1x",
    status: "completed",
    currency_code: "USD",
    customer_id: "ctm_01gks14ge726w50ch2tmaw2a1x",
    custom_data: { reference: ref },
    details: { totals: { subtotal: "3900", total: "4239", tax: "339" } },
    items: [{ price: { id: "pri_01gks14ge726w50ch2tmaw2a1x" }, quantity: 1 }],
  },
});
const paddleTs = ts;
const paddleHash = createHmac("sha256", paddleSecret)
  .update(`${paddleTs}:${paddleEvent}`, "utf8")
  .digest("hex");
const paddleHeader = `ts=${paddleTs};h1=${paddleHash}`;

check(
  parsePaddleSignature(paddleHeader)?.timestamp === paddleTs,
  "Paddle-Signature ts is parsed",
  "Paddle-Signature ts was not parsed"
);
check(
  verifyPaddleSignature(paddleSecret, paddleHeader, paddleEvent, now).ok,
  "a correctly signed Paddle event verifies",
  "a correctly signed Paddle event was rejected"
);
check(
  !!parsePaddleSignature("garbage") === false,
  "a malformed Paddle-Signature header is refused",
  "a malformed Paddle-Signature header parsed"
);
check(
  !verifyPaddleSignature(paddleSecret, paddleHeader, paddleEvent + " ", now).ok,
  "a Paddle body changed after signing is rejected",
  "tampered Paddle body was accepted"
);
check(
  !verifyPaddleSignature("wrong-secret", paddleHeader, paddleEvent, now).ok,
  "a wrong Paddle secret is rejected",
  "wrong Paddle secret was accepted"
);
check(
  !verifyPaddleSignature(paddleSecret, paddleHeader, paddleEvent, now + 10 * 60 * 1000).ok,
  "a Paddle signature outside the tolerance window is rejected",
  "replayed Paddle signature was accepted"
);
check(
  verifyPaddleSignature(
    paddleSecret,
    `ts=${paddleTs};h1=${"0".repeat(64)};h1=${paddleHash}`,
    paddleEvent,
    now
  ).ok,
  "one valid h1 among several verifies (secret rotation)",
  "a valid h1 was ignored when another h1 was present"
);

const summary = readPaddleTransaction(JSON.parse(paddleEvent));
check(
  summary?.reference === ref,
  "the Paddle transaction maps back to the order reference",
  `Paddle reference did not map: ${summary?.reference}`
);
check(
  summary?.subtotalCents === 3900 && summary.currency === "USD",
  "the Paddle transaction carries USD subtotal in cents",
  "Paddle totals were not read as USD cents"
);
check(
  summary?.priceIds.join() === "pri_01gks14ge726w50ch2tmaw2a1x",
  "the Paddle transaction exposes its price id for the product check",
  "Paddle price id was not extracted"
);
check(
  readPaddleTransaction({
    event_type: "transaction.updated",
    data: { custom_data: { reference: ref } },
  }) === null,
  "non-completed Paddle events are ignored",
  "a non-completed Paddle event was mapped"
);
check(
  readPaddleTransaction({
    event_type: "transaction.completed",
    data: { currency_code: "USD", details: { totals: { subtotal: "3900" } }, items: [] },
  }) === null,
  "a Paddle event without custom_data.reference is ignored",
  "a Paddle event without a reference was mapped"
);

const sandboxConfig = readPaddleCheckoutConfig({
  PADDLE_CLIENT_TOKEN: "test_client_token",
  PADDLE_PRICE_IDS: '{"signal":"pri_a","pro":"pri_b"}',
});
check(
  sandboxConfig?.environment === "sandbox" && sandboxConfig.priceIds.pro === "pri_b",
  "checkout config defaults to sandbox and reads the price map",
  "checkout config did not default to sandbox or lost the price map"
);
check(
  readPaddleCheckoutConfig({
    PADDLE_CLIENT_TOKEN: "test_client_token",
    PADDLE_PRICE_IDS: "not json",
  }) === null,
  "invalid PADDLE_PRICE_IDS disables checkout instead of throwing",
  "invalid PADDLE_PRICE_IDS produced a config"
);
check(
  readPaddleCheckoutConfig({ PADDLE_CLIENT_TOKEN: "test_client_token" }) === null,
  "checkout stays off when the price map is absent",
  "checkout turned on without a price map"
);

console.log(
  failures === 0 ? `\nAll ${passes} paywall tests passed.` : `\n${failures} paywall test(s) failed.`
);
process.exitCode = failures === 0 ? 0 : 1;
