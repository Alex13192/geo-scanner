// app/api/checkout/route.ts
//
// POST { product: "signal" | "pro" } -> something the buy button can act on: a Paddle checkout
// request, a legacy hosted URL, or an honest fallback.
//
// WHY THIS EXISTS: the paid report used to be sold by email only. A paywall that starts with
// "write us an email" is not a paywall, it is a contact form, and the audit said so. This is
// the one place that turns a product id into an order reference and a payment page.
//
// WHY PADDLE IS RETURNED AS DATA RATHER THAN A URL: Paddle Billing has no standalone hosted
// checkout page. The buyer's browser loads Paddle.js and opens the overlay with a price id and
// the order reference as custom data; the returned `mode: "paddle"` payload is what the button
// needs to do that. Returning a `checkout.url` from Paddle would open a page that only renders a
// checkout if Paddle.js also runs on it - a redirect that looks broken in exactly the case it is
// used.
//
// WHY IT FALLS BACK RATHER THAN FAILING: the provider account may not be approved yet. Until a
// checkout is configured, the endpoint must still let a buyer order - so it returns `fallback`
// with the contact address, which is exactly the behaviour the site had before. When the
// environment variables appear, the same button starts taking cards with no page change.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createOrder } from "@/lib/db/orders";
import { newReference } from "@/lib/payments";
import { readPaddleCheckoutConfig } from "@/lib/paddle";
import { getProduct } from "@/lib/pricing";
import { clientKey, takeToken } from "@/lib/net/rate-limit";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** A checkout attempt is not a scan; it gets its own bucket so one does not exhaust the other. */
export async function POST(request: Request) {
  const limit = takeToken(`checkout:${clientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: { product?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const product = getProduct(typeof body.product === "string" ? body.product : "");
  if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 400 });

  const reference = newReference();
  const now = Date.now();

  /*
   * Best-effort persistence, deliberately not fatal. The provider's webhook is the source of
   * truth for payment; the row exists so support can answer questions. If D1 is unavailable,
   * refusing to sell would be the wrong trade - the buyer would see a broken paywall because
   * of an internal bookkeeping table.
   */
  try {
    const { env } = getCloudflareContext();
    await createOrder(env.DB as D1DatabaseLike, {
      id: `ord_${reference.toLowerCase()}`,
      reference,
      product: product.id,
      amountUsd: product.priceUsd,
      now,
    });
  } catch (error) {
    console.error(`[checkout] order not recorded for ${reference}:`, error);
  }

  /*
   * The custom variable is read from the Worker environment rather than declared on
   * CloudflareEnv: it is optional, only this route reads it, and an absent value is the
   * normal state today. The cast is the cost of not pretending the variable exists.
   */
  const { env } = getCloudflareContext();
  const runtimeEnv = env as unknown as Record<string, string | undefined>;

  /*
   * Paddle first: it is the provider this store is applying to. The config is null until the
   * sandbox (then production) price ids and client-side token are configured, so an unapproved
   * account leaves the old behaviour untouched.
   */
  const paddle = readPaddleCheckoutConfig(runtimeEnv);
  const paddlePriceId = paddle?.priceIds[product.id];
  if (paddle && paddlePriceId) {
    const successUrl = `${new URL(request.url).origin}/thanks/?reference=${encodeURIComponent(reference)}`;
    return NextResponse.json(
      {
        mode: "paddle",
        reference,
        priceId: paddlePriceId,
        clientToken: paddle.clientToken,
        environment: paddle.environment,
        successUrl,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const configured = runtimeEnv[product.checkoutEnv];
  const checkoutUrl = (configured ?? "").trim();

  if (checkoutUrl) {
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    return NextResponse.json(
      {
        url: `${checkoutUrl}${separator}merchant_reference=${encodeURIComponent(reference)}`,
        reference,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      fallback: true,
      reference,
      email: CONTACT_EMAIL,
      message:
        "Card checkout is not live yet. Email us with this reference and we will send payment instructions.",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
