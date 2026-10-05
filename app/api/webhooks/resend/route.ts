// app/api/webhooks/resend/route.ts
//
// Resend tells this endpoint what happened to a message after it was sent. Only two answers are
// acted on: an address that does not exist, and a recipient who marked the message as spam.
//
// WHY THIS ENDPOINT HAS TO EXIST AT ALL. Until it did, an address that bounced stayed
// `confirmed` and was retried every week forever. The product had no way to learn that its own
// mail was not arriving, so the only symptom was a subscriber who never heard anything and had
// no reason to say so.
//
// THE SIGNATURE CHECK IS THE WHOLE SECURITY MODEL. This route cannot require a session, because
// it is called by a third party, and it cannot be hidden, because its URL has to be configured
// in a dashboard. Without verification, one POST from anyone who learns the URL stops the
// product emailing any address they name - silently, and with a permanent effect. See
// lib/webhooks/resend.ts.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { markBouncedByEmail, unsubscribeByEmail } from "@/lib/db/subscribers";
import { verifyResendSignature } from "@/lib/webhooks/resend";

export const dynamic = "force-dynamic";

/** Only the fields this file reads, and all of them optional because a third party sends them. */
type ResendEvent = {
  type?: unknown;
  data?: {
    to?: unknown;
    bounce?: { type?: unknown; subType?: unknown };
  };
};

/** Resend batches nothing today, but a payload with several recipients should not half-apply. */
function recipients(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

export async function POST(request: Request) {
  /*
   * THE RAW BODY, read once, as text. Re-serialising parsed JSON would reorder keys and change
   * the bytes, and the signature is over the bytes - so `await request.json()` here would make
   * every genuine delivery fail verification.
   */
  const body = await request.text();

  const { env } = getCloudflareContext();

  const verdict = await verifyResendSignature({
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
    body,
    secret: env.RESEND_WEBHOOK_SECRET,
  });

  if (!verdict.ok) {
    /*
     * 401, and the reason is logged. A webhook that rejects silently is undebuggable from this
     * side: Resend shows a failing delivery and nothing anywhere says whether the secret is
     * wrong, the headers are missing, or the body was altered in transit.
     */
    console.error(`[webhook] rejected a delivery: ${verdict.reason}`);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    // The signature was valid, so this is our bug or a provider change - not an attack.
    console.error("[webhook] signature verified but the body is not JSON");
    return NextResponse.json({ error: "unparseable body" }, { status: 400 });
  }

  const to = recipients(event.data?.to);
  const { env: envForDb } = getCloudflareContext();

  if (to.length === 0) {
    // Acked rather than failed. There is nothing to act on, and a retry would deliver the same
    // empty payload for the rest of the retry budget.
    console.error(`[webhook] ${String(event.type)} carried no recipient`);
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "email.bounced": {
      /*
       * HARD AND SOFT BOUNCES ARE DIFFERENT EVENTS AND ONLY ONE IS PERMANENT. A `Transient`
       * bounce is a full mailbox or a greylist and usually clears; treating it as permanent
       * would unsubscribe somebody for having an inbox that was full once. Resend reports the
       * distinction, so it is read rather than guessed.
       */
      const kind = event.data?.bounce?.type;
      if (kind !== "Permanent") {
        console.log(`[webhook] transient bounce for ${to.join(", ")} (${String(kind)}); no change`);
        break;
      }
      for (const email of to) {
        const changed = await markBouncedByEmail(envForDb.DB, email.toLowerCase());
        console.log(`[webhook] bounce: ${email} marked bounced (${changed} row(s))`);
      }
      break;
    }

    case "email.complained": {
      for (const email of to) {
        const changed = await unsubscribeByEmail(envForDb.DB, email.toLowerCase());
        console.log(`[webhook] complaint: ${email} unsubscribed (${changed} row(s))`);
      }
      break;
    }

    default:
      // Every other event is acknowledged and ignored. Resend retries a non-2xx, so refusing an
      // event this product has no opinion about would spend the retry budget on nothing.
      console.log(`[webhook] ignoring ${String(event.type)}`);
  }

  return NextResponse.json({ received: true });
}
