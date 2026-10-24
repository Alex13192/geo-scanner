// app/api/comments/confirm/route.ts
//
// The link in the confirmation email. Confirms one pending comment and sends the reader back to
// the article it belongs to. A GET, because the link is opened from a mail client; no state
// changes beyond that one row.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { confirmComment } from "@/lib/db/comments";
import { normalisePath } from "@/lib/comments/flow";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { env } = getCloudflareContext();

  const confirmed = token
    ? await confirmComment(env.DB as D1DatabaseLike, token, Date.now())
    : null;

  const target = confirmed && normalisePath(confirmed.path)
    ? `${SITE_URL}${confirmed.path}#comments`
    : `${SITE_URL}/blog/?comment=invalid`;

  return NextResponse.redirect(target, 302);
}
