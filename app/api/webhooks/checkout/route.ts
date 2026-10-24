// app/api/webhooks/checkout/route.ts
//
// The provider's "this order is paid" call. Two schemes end here because two adapters do:
//
//   Paddle   POST  Paddle-Signature: ts=<unix seconds>;h1=<hex hmac-sha256 of "<ts>:<raw body>">
//            body  a Paddle event; `transaction.completed` carries custom_data.reference
//
//   generic  POST  x-payment-signature: t=<unix seconds>,v1=<hex hmac-sha256 of "<t>.<raw body>">
//            body  { "event": "payment.succeeded", "reference": "LM-...", "email": "...", "provider": "..." }
//
// WHY TWO SCHEMES AND NOT ONE: Paddle signs a different string and sends a different header. The
// generic contract was written before a provider was chosen, for a provider whose signature looked
// like `t=...,v1=...`; Paddle is the merchant of record this store is applying to, and reshaping its
// header into the generic one would mean either weakening the check or lying about what was hashed.
// The shared part is the order table: both paths end in `markOrderPaid`, whose `pending` -> `paid`
// transition is the idempotency guard.
//
// WHY THE RAW BODY IS READ BEFORE JSON.parse: a signature over a re-serialised object is invalid the
// moment key order or whitespace changes, and that difference is invisible in testing until
// production receives its first real webhook.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { findOrder, markOrderPaid } from "@/lib/db/orders";
import {
  getPaddleCustomerEmail,
  readPaddlePriceIds,
  readPaddleTransaction,
  verifyPaddleSignature,
} from "@/lib/paddle";
import { isReference, verifySignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Events that mean "money arrived". Everything else is acknowledged and ignored. */
const PAID_EVENTS = new Set(["payment.succeeded", "order.paid", "checkout.completed"]);

type WorkerEnv = Record<string, string | undefined> & { DB: D1DatabaseLike };

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const runtimeEnv = env as unknown as WorkerEnv;

  const raw = await request.text();
  const paddleSignature = request.headers.get("paddle-signature");
  if (paddleSignature) return handlePaddle(runtimeEnv, raw, paddleSignature);

  const secret = (runtimeEnv.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  const header =
    request.headers.get("x-payment-signature") ?? request.headers.get("x-signature");

  const verified = verifySignature(secret, header, raw);
  if (!verified.ok) {
    /*
     * 401 for every failure, and the reason stays in the log rather than the response: an
     * unauthenticated caller learns nothing about whether the secret is configured, and a
     * provider retrying a mis-signed body gets a clear failure rather than a silent 200.
     */
    console.error(`[webhook] rejected: ${verified.reason}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event?: unknown;
    reference?: unknown;
    email?: unknown;
    provider?: unknown;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  }

  const event = typeof payload.event === "string" ? payload.event : "";
  if (!PAID_EVENTS.has(event)) {
    // Acknowledged so the provider stops retrying an event this route does not handle.
    return NextResponse.json({ ignored: true }, { status: 200 });
  }

  const reference = typeof payload.reference === "string" ? payload.reference : "";
  if (!isReference(reference)) {
    return NextResponse.json({ error: "Unknown reference" }, { status: 400 });
  }

  const email =
    typeof payload.email === "string" && payload.email.includes("@") ? payload.email : null;
  const provider = typeof payload.provider === "string" ? payload.provider : null;

  const transitioned = await markOrderPaid(runtimeEnv.DB, {
    reference,
    email,
    provider,
    now: Date.now(),
  });

  /*
   * A duplicate webhook is answered 200 rather than treated as an error: providers retry, and
   * a retry that turns red is how a provider decides a webhook is broken and disables it. The
   * transition flag is what keeps delivery single-fire when it is wired.
   */
  return NextResponse.json({ received: true, duplicate: !transitioned }, { status: 200 });
}

/**
 * Paddle's path.
 *
 * The event is checked against the local order before it can do anything: the reference must exist,
 * the price id must be the one this site minted for that product, the currency must be USD and the
 * subtotal must equal the price table. A mismatch is acknowledged with 200 (so Paddle stops
 * retrying) but never marks an order paid - the same rule the Creem adapter used, and the reason is
 * the same: a 4xx makes Paddle retry a payload that will never become valid, while a 200 with a log
 * line is a fact an operator can act on.
 */
async function handlePaddle(env: WorkerEnv, raw: string, signature: string) {
  const secret = (env.PADDLE_WEBHOOK_SECRET ?? "").trim();
  const verified = verifyPaddleSignature(secret, signature, raw);
  if (!verified.ok) {
    console.error(`[paddle_webhook] rejected: ${verified.reason}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Expected JSON" }, { status: 400 });
  }

  const summary = readPaddleTransaction(payload);
  if (!summary) return NextResponse.json({ ignored: true }, { status: 200 });

  const order = await findOrder(env.DB, summary.reference);
  if (!order) {
    console.error(`[paddle_webhook] unknown_order ${summary.reference}`);
    return NextResponse.json({ ignored: true }, { status: 200 });
  }

  const expectedPrice = readPaddlePriceIds(env)[order.product];
  if (!expectedPrice || !summary.priceIds.includes(expectedPrice)) {
    console.error(
      `[paddle_webhook] product_mismatch reference=${summary.reference} order=${order.product}`
    );
    return NextResponse.json({ ignored: true }, { status: 200 });
  }
  if (summary.currency !== "USD") {
    console.error(
      `[paddle_webhook] currency_mismatch reference=${summary.reference} currency=${summary.currency}`
    );
    return NextResponse.json({ ignored: true }, { status: 200 });
  }
  if (summary.subtotalCents !== Math.round(order.amount_usd * 100)) {
    console.error(
      `[paddle_webhook] amount_mismatch reference=${summary.reference} got=${summary.subtotalCents} expected=${order.amount_usd * 100}`
    );
    return NextResponse.json({ ignored: true }, { status: 200 });
  }

  // Paddle sends customer_id, not an email; the report is delivered by email, so resolve it. A
  // failed lookup does not block the payment record - it is logged and the order is still paid.
  const email = summary.customerId
    ? await getPaddleCustomerEmail(env, summary.customerId)
    : null;

  let transitioned = false;
  try {
    transitioned = await markOrderPaid(env.DB, {
      reference: summary.reference,
      email,
      provider: "paddle",
      now: Date.now(),
    });
  } catch (error) {
    console.error(`[paddle_webhook] mark_paid_failed reference=${summary.reference}:`, error);
    return NextResponse.json({ received: true, duplicate: false }, { status: 200 });
  }

  console.log(
    `[paddle_webhook] ${transitioned ? "fulfilled" : "duplicate"} reference=${summary.reference}`
  );
  return NextResponse.json({ received: true, duplicate: !transitioned }, { status: 200 });
}
