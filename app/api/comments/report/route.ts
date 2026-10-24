// app/api/comments/report/route.ts
//
// POST { id }. Three readers reporting the same comment hides it. No queue: a comment that enough
// people found worth reporting is removed automatically, and the row keeps the count so the
// decision is auditable if it is ever asked about.
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { reportComment } from "@/lib/db/comments";
import { clientKey, takeToken } from "@/lib/net/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = takeToken(`report:${clientKey(request)}`);
  if (!limit.allowed) return NextResponse.json({ ok: true }, { status: 200 });

  let payload: { id?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const id = typeof payload.id === "string" ? payload.id : "";
  if (!id.startsWith("cm_")) return NextResponse.json({ error: "Unknown comment" }, { status: 400 });

  const { env } = getCloudflareContext();
  const reports = await reportComment(env.DB as D1DatabaseLike, id);
  return NextResponse.json({ ok: reports !== null }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
