// app/api/subscribe/route.ts
//
// POST { domain, email } -> a pending row and a confirmation email.
//
// The response is the same whether or not the address was already subscribed. Anything else
// turns this endpoint into a way to ask "is this person on the list?" one address at a time,
// and the answer to that question is not one this site should give about anybody.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createPending } from "@/lib/db/subscribers";
import { confirmationEmail } from "@/lib/email/messages";
import { sendEmail } from "@/lib/email/send";
import { inspectTarget } from "@/lib/net/fetch-safe";
import { clientKey, takeToken } from "@/lib/net/rate-limit";
import {
  confirmUrl,
  isValidDomain,
  isValidEmail,
  normaliseDomain,
  normaliseEmail,
  unsubscribeUrl,
} from "@/lib/subscribe/flow";
import { newId, newToken } from "@/lib/subscribe/tokens";

export const dynamic = "force-dynamic";

/**
 * The one message the endpoint ever returns on success, whoever the caller is.
 *
 * Written to be true in all three cases - new, re-sent, already confirmed - because the
 * caller is told to check their inbox and in the third case there is nothing to check. That
 * is the deliberate trade: an address that is already subscribed learns nothing, and its
 * owner learns nothing either, which they do not need to, because they already know.
 */
const ACCEPTED =
  "If that address can be subscribed, a confirmation email is on its way. Open it to start the weekly report.";

export async function POST(request: Request) {
  // Separate bucket from the scanner. Sharing one would mean a visitor who ran a few scans
  // could not then subscribe, which reads as the form being broken.
  const limit = takeToken(`sub:${clientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this address. Please wait a moment and try again.", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: { domain?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const domain = normaliseDomain(typeof body.domain === "string" ? body.domain : "");
  const email = normaliseEmail(typeof body.email === "string" ? body.email : "");

  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: "That does not look like a domain." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That does not look like an email address." }, { status: 400 });
  }

  // Refused before anything is written, for the reason the scanner gives: a target that
  // points at a network rather than a website should be told so, not stored and then
  // discovered to be unusable by a cron job at three in the morning.
  const target = inspectTarget(`https://${domain}`);
  if (!target.ok) {
    return NextResponse.json({ error: target.reason }, { status: 400 });
  }

  const { env } = getCloudflareContext();

  const confirmToken = newToken();
  const unsubToken = newToken();

  const outcome = await createPending(env.DB, {
    domain,
    email,
    id: newId(),
    confirmToken,
    unsubToken,
    now: Date.now(),
  });

  if (outcome.ok) {
    const message = confirmationEmail(domain, confirmUrl(confirmToken), unsubscribeUrl(unsubToken));
    const sent = await sendEmail(env, { ...message, to: email });

    /*
     * A send that failed is reported, not swallowed. The alternative - answering "check your
     * inbox" when nothing was sent - is the silent lie this codebase keeps refusing to tell,
     * and here it would also leave a pending row that can never be confirmed.
     */
    if (!sent.ok) {
      console.error(`[subscribe] confirmation not sent for ${domain}: ${sent.reason}`);
      return NextResponse.json(
        { error: "The confirmation email could not be sent. Please try again shortly." },
        { status: 503 }
      );
    }
  }

  // Includes the already-subscribed case, which deliberately sends nothing further.
  return NextResponse.json({ message: ACCEPTED }, { status: 200 });
}
