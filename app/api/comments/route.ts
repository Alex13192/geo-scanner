// app/api/comments/route.ts
//
// GET  ?path=/blog/<slug>/     -> confirmed comments, oldest first
// POST { path, name, email, body, website } -> a pending comment and a confirmation email
//
// WHY POST DOES NOT SHOW THE COMMENT: nothing is published until the author clicks the link in
// the email. That single step replaces a moderation queue the operator does not have time for,
// and it is the gate a spam bot cannot pass.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createComment, listConfirmed } from "@/lib/db/comments";
import {
  countLinks,
  hashEmail,
  isValidEmail,
  MAX_LINKS,
  newCommentId,
  newCommentToken,
  normaliseBody,
  normaliseName,
  normalisePath,
} from "@/lib/comments/flow";
import { sendEmail } from "@/lib/email/send";
import { clientKey, takeToken } from "@/lib/net/rate-limit";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = normalisePath(url.searchParams.get("path") ?? "");
  if (!path) return NextResponse.json({ error: "Unknown article" }, { status: 400 });

  const { env } = getCloudflareContext();
  const rows = await listConfirmed(env.DB as D1DatabaseLike, path);
  return NextResponse.json(
    {
      comments: rows.map((row) => ({
        id: row.id,
        name: row.name,
        body: row.body,
        createdAt: row.created_at,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const limit = takeToken(`comment:${clientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  // Honeypot: a field a human never sees and a naive bot fills in.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return NextResponse.json({ message: "Check your inbox to publish the comment." }, { status: 200 });
  }

  const path = normalisePath(typeof payload.path === "string" ? payload.path : "");
  const body = normaliseBody(typeof payload.body === "string" ? payload.body : "");
  const name = normaliseName(typeof payload.name === "string" ? payload.name : "");
  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (!path) return NextResponse.json({ error: "Unknown article" }, { status: 400 });
  if (body.length < 2) return NextResponse.json({ error: "Write a little more." }, { status: 400 });
  if (countLinks(body) > MAX_LINKS) {
    return NextResponse.json({ error: "Please keep links to two or fewer." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is needed to confirm the comment." }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const token = newCommentToken();
  const now = Date.now();

  try {
    await createComment(env.DB as D1DatabaseLike, {
      id: newCommentId(),
      path,
      name,
      body,
      token,
      emailHash: await hashEmail(email),
      now,
    });
  } catch (error) {
    console.error("[comments] insert failed:", error);
    return NextResponse.json({ error: "Comments are temporarily unavailable." }, { status: 503 });
  }

  const confirmUrl = `${SITE_URL}/api/comments/confirm/?token=${token}`;
  const sent = await sendEmail(env, {
    to: email,
    subject: "Confirm your comment on LLMention",
    replyTo: CONTACT_EMAIL,
    text: [
      "Someone (hopefully you) submitted a comment on LLMention.",
      "",
      `Confirm it here: ${confirmUrl}`,
      "",
      "Until the link is opened, the comment is not published. We do not store your email address; it was used once to send this message.",
      "",
      "If this was not you, ignore this email and nothing is published.",
      "",
      `— LLMention · ${CONTACT_EMAIL}`,
    ].join("\n"),
  });

  if (!sent.ok) {
    console.error(`[comments] confirmation not sent: ${sent.reason}`);
    return NextResponse.json(
      { error: "The confirmation email could not be sent. Please try again shortly." },
      { status: 503 }
    );
  }

  return NextResponse.json({ message: "Check your inbox to publish the comment." }, { status: 200 });
}
