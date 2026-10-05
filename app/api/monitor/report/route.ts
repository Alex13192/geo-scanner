/**
 * The data behind /monitor/report/<token>/.
 *
 * WHY THIS IS A ROUTE AND NOT A SERVER COMPONENT. Every read of D1 in this project happens in a
 * route handler, because that is where the Cloudflare bindings are reachable without the page
 * having to be dynamic in the way that also breaks prerendering - see the note in
 * app/api/subscribe/route.ts and the async-context caveats in @opennextjs/cloudflare. A report page
 * that fetched its own data would be the first exception to that, and the exception is the thing
 * that surprises whoever reads this next.
 *
 * WHAT IT DOES NOT RETURN: the subscriber's email address. A report link is built to be forwarded,
 * and the address behind it is not part of the report - returning it would put somebody's address in
 * a page they mailed to a school. The domain is enough for the reader to know whose site this is.
 *
 * NO-STORE IS SET HERE AND IN next.config.ts. next.config covers /api/*, and this repeats it because
 * the one thing this endpoint must never do is have a shared cache answer one subscriber's request
 * with another's report.
 */
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getByReportToken, listScans } from "@/lib/db/subscribers";
import { CHECK_COPY } from "@/lib/geo/check-copy";
import { buildReportPayload, historySince, HISTORY_DAYS } from "@/lib/monitor/report";
import { clientKey, takeToken } from "@/lib/net/rate-limit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** One row per weekly run, so a window this wide is a bounded read rather than a full table scan. */
const MAX_ROWS = 60;

export async function GET(request: Request) {
  /*
   * Rate limited before any database work, like every other public endpoint here. The token is
   * unguessable in practice, so this is not the access control - it is what stops a leaked link
   * from being used to hammer D1, and it costs one in-memory lookup.
   */
  const limit = takeToken(`report:${clientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter), "cache-control": "no-store" } }
    );
  }

  const token = new URL(request.url).searchParams.get("t") || "";
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const { env } = getCloudflareContext();
  const subscriber = await getByReportToken(env.DB, token);

  /*
   * 404 rather than an explanation, and the same 404 for "no such token" and "that subscription is
   * not confirmed". Answering differently would turn this endpoint into a way to test whether a
   * given token exists, and the page it belongs to already tells a legitimate reader that a link
   * that stopped working is a link whose subscription ended.
   */
  if (!subscriber) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const scans = await listScans(env.DB, subscriber.id, historySince(Date.now()), MAX_ROWS);

  /*
   * The published copy for every check, keyed by id. Built once per request from the generated
   * module rather than stored alongside the scan: a stored copy is a snapshot of the wording at the
   * time of the scan, and a fix whose text has since been improved should read as improved.
   *
   * The `fail` branch is the one that applies, and that is a fact about the runner rather than an
   * assumption here: the weekly consumer stores `status === "fail"` ids and nothing else, so a warn
   * never reaches this table.
   */
  const checkCopy = new Map(
    Object.entries(CHECK_COPY).map(([id, copy]) => [
      id,
      { title: copy.title, fix: copy.fixes.find((f) => f.when === "fail")?.text ?? "" },
    ])
  );

  const payload = buildReportPayload({
    domain: subscriber.domain,
    scans,
    checkCopy,
    siteUrl: SITE_URL,
  });

  return NextResponse.json(
    { ...payload, historyDays: HISTORY_DAYS },
    { headers: { "cache-control": "no-store" } }
  );
}
