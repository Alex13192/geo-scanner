// app/api/comments/confirm/route.ts
//
// The link in the confirmation email opens this route. GET ONLY SHOWS A BUTTON; the comment is
// confirmed by the POST that the button sends.
//
// WHY NOT CONFIRM ON GET, WHICH IS OBVIOUSLY SIMPLER: mail providers and corporate link scanners
// fetch URLs in incoming mail automatically. The first version of this route confirmed on GET, and
// the test comment was confirmed without anyone clicking - the scanner opened the link. A
// confirmation that a robot's fetch can satisfy is not a spam gate at all. The extra click is the
// difference between "a human opened this" and "something fetched this".
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { confirmComment } from "@/lib/db/comments";
import { normalisePath } from "@/lib/comments/flow";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function page(token: string, message?: string): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Confirm your comment</title>
<style>
 body{font:16px/1.6 system-ui,sans-serif;max-width:38rem;margin:4rem auto;padding:0 1.5rem;color:#111;background:#fff}
 button{font:inherit;background:#2563eb;color:#fff;border:0;border-radius:999px;padding:.7rem 1.4rem;cursor:pointer}
 p{color:#444} a{color:#2563eb}
</style></head>
<body><h1>Publish your comment?</h1>
<p>${message ?? "Your comment is not published yet. Press the button to publish it on the article you commented on."}</p>
<form method="POST"><input type="hidden" name="token" value="${token}">
<button type="submit">Publish my comment</button></form>
<p><a href="${SITE_URL}/blog/">Back to the blog</a></p></body></html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[0-9a-f]{48}$/.test(token)) return page("", "That link is not valid.");
  return page(token);
}

export async function POST(request: Request) {
  let token = "";
  try {
    const form = await request.formData();
    token = String(form.get("token") ?? "");
  } catch {
    return NextResponse.redirect(`${SITE_URL}/blog/?comment=invalid`, 303);
  }
  if (!/^[0-9a-f]{48}$/.test(token)) return NextResponse.redirect(`${SITE_URL}/blog/?comment=invalid`, 303);

  const { env } = getCloudflareContext();
  const confirmed = await confirmComment(env.DB as D1DatabaseLike, token, Date.now());
  const path = confirmed && normalisePath(confirmed.path) ? confirmed.path : "";
  return NextResponse.redirect(path ? `${SITE_URL}${path}#comments` : `${SITE_URL}/blog/?comment=invalid`, 303);
}
