// app/api/subscribe/confirm/route.ts
//
// GET ?t=<confirm_token> -> the subscription becomes confirmed.
//
// Safe to fetch more than once, and it has to be: mail clients, security scanners and link
// previewers all fetch the URLs in a message before a person ever sees them. A one-shot
// endpoint that consumed the token on first sight would confirm subscriptions nobody
// clicked, and an endpoint that errored on the second visit would show a failure page to
// the one person who did.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { confirmByToken } from "@/lib/db/subscribers";
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
  const subscriber = await confirmByToken(env.DB, token, Date.now());

  if (!subscriber) {
    return linkPage({
      title: "Link not recognised",
      heading: "That link is not recognised",
      body: "It may have been replaced by a newer signup for the same address - each confirmation replaces the last. Sign up again and use the most recent email.",
    });
  }

  if (subscriber.status === "unsubscribed") {
    return linkPage({
      title: "Subscription ended",
      heading: "This subscription has ended",
      body: "That address was unsubscribed, so confirming it here would start sending again without being asked. Sign up again if you want the report back.",
    });
  }

  return linkPage({
    title: "Subscription confirmed",
    heading: "You are subscribed",
    body: `The weekly report for <strong>${escapeHtml(subscriber.domain)}</strong> starts on the next run. Every report carries a one-click unsubscribe link.`,
  });
}

/** The domain comes from a database row a visitor wrote, so it is escaped before it is markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
