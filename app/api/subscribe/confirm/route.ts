// app/api/subscribe/confirm/route.ts
//
// GET ?t=<confirm_token> -> the subscription becomes confirmed, and the reader lands on their
// own report page.
//
// Safe to fetch more than once, and it has to be: mail clients, security scanners and link
// previewers all fetch the URLs in a message before a person ever sees them. A one-shot
// endpoint that consumed the token on first sight would confirm subscriptions nobody
// clicked, and an endpoint that errored on the second visit would show a failure page to
// the one person who did.
//
// WHY THIS ROUTE IS NOW SIX BRANCHES SHORTER. Every decision about what the reader is shown - which
// sentence, which next step, whether the report link can be built at all - moved into
// lib/subscribe/landing.ts, where scripts/test-report-link.mts can drive it against a fake
// database. The reason is not tidiness: the redirect to the token report is the entire point of the
// confirmation email, and while it lived inline here the only way to check it was to deploy and
// click. A redirect nobody tests is a redirect that silently breaks. This file now does three
// things - read the query, rate limit, delegate - and the second one lives here because it is
// about the request rather than about the subscription.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { confirmSubscription } from "@/lib/subscribe/landing";
import { linkPage } from "@/lib/subscribe/flow";
import { clientKey, takeToken } from "@/lib/net/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";

  /*
   * Rate limited even though the token is unguessable. The reason is not that the token can
   * be brute-forced at 32 bytes; it is that this endpoint does a database read for any
   * string a stranger sends, and an unlimited read endpoint is a way to spend somebody
   * else's query budget.
   */
  const limit = takeToken(`confirm:${clientKey(request)}`);
  if (!limit.allowed) {
    return linkPage({
      title: "Too many requests",
      heading: "Too many requests",
      body: "Please wait a moment and open the link again.",
    });
  }

  if (!token) {
    return linkPage({
      title: "Link incomplete",
      heading: "That link is incomplete",
      body: "The address was probably cut in half by the mail client. Copy the full link from the email and try again.",
    });
  }

  const { env } = getCloudflareContext();
  const outcome = await confirmSubscription(env.DB, token, Date.now());

  if (outcome.ok) return outcome.response;

  if (outcome.reason === "unsubscribed") {
    return linkPage({
      title: "Subscription ended",
      heading: "This subscription has ended",
      body: "That address was unsubscribed, so confirming it here would start sending again without being asked. Sign up again if you want the report back.",
    });
  }

  if (outcome.reason === "database") {
    /*
     * A failure that is ours, said as ours. The link is valid and the row is still pending, so the
     * honest instruction is to try the same link again rather than to sign up again - which would
     * write a second pending row and replace the token in the message they are holding.
     */
    return linkPage({
      title: "Please try again",
      heading: "That did not go through",
      body: "The confirmation could not be recorded, which is a fault on our side rather than a problem with the link. The link is still valid - open it again in a moment, or reply to the email and it will be confirmed by hand.",
    });
  }

  return linkPage({
    title: "Link not recognised",
    heading: "That link is not recognised",
    body: "It may have been replaced by a newer signup for the same address - each confirmation replaces the last. Sign up again and use the most recent email.",
  });
}
