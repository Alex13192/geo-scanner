// app/api/subscribe/unsubscribe/route.ts
//
// GET ?t=<unsub_token> -> the subscription stops, permanently and without a question.
//
// WHY GET, AND WHY NO CONFIRMATION STEP. This link is in every message the project sends.
// It is required to work with one click, from a mail client, months later, possibly by
// somebody who is not the original recipient. A "are you sure?" page is a way to make that
// not happen, and every extra step here is a message somebody keeps receiving after asking
// not to.
//
// The response never says whether the token existed. A distinct "invalid link" answer would
// let anyone holding a guessed token learn which ones are real, and a person who genuinely
// clicked a dead link is told the same useful thing either way: nothing more will be sent.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { unsubscribeByToken } from "@/lib/db/subscribers";
import { linkPage } from "@/lib/subscribe/flow";
import { clientKey, takeToken } from "@/lib/net/rate-limit";

export const dynamic = "force-dynamic";

const DONE = {
  title: "Unsubscribed",
  heading: "You will not receive any more reports",
  body: "That address has been removed. No further messages will be sent to it, and signing up again is the only way to restart.",
};

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";

  const limit = takeToken(`unsub:${clientKey(request)}`);
  if (!limit.allowed) {
    return linkPage({
      title: "Too many requests",
      heading: "Too many requests",
      body: "Please wait a moment and open the link again.",
    });
  }

  // A missing token is still answered with DONE. Nothing was sent to this caller and
  // nothing will be; telling them otherwise teaches them the endpoint distinguishes inputs.
  if (token) {
    const { env } = getCloudflareContext();
    await unsubscribeByToken(env.DB, token);
  }

  return linkPage(DONE);
}
