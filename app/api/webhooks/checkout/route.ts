// app/api/webhooks/checkout/route.ts
//
// The provider's "this order is paid" call. One contract for every merchant of record the
// site may end up using:
//
//   POST  x-payment-signature: t=<unix seconds>,v1=<hex hmac-sha256 of "<t>.<raw body>">
//   body  { "event": "payment.succeeded", "reference": "LM-...", "email": "...", "provider": "..." }
//
// WHY A GENERIC CONTRACT: Creem rejected this store and the next provider is not chosen. The
// signature scheme is the same shape the big providers use, so adapting one is a header name
// and a payload field mapping in this file - not a rewrite of the pricing page, the order
// table and the success page.
//
// WHY THE RAW BODY IS READ BEFORE JSON.parse: a signature over a re-serialised object is
// invalid the moment key order or whitespace changes, and that difference is invisible in
// testing until production receives its first real webhook.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { markOrderPaid } from "@/lib/db/orders";
import { isReference, verifySignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Events that mean "money arrived". Everything else is acknowledged and ignored. */
const PAID_EVENTS = new Set(["payment.succeeded", "order.paid", "checkout.completed"]);

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const secret =
    ((env as unknown as Record<string, string | undefined>).PAYMENT_WEBHOOK_SECRET ?? "").trim();

  const raw = await request.text();
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

  const transitioned = await markOrderPaid(env.DB as D1DatabaseLike, {
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
