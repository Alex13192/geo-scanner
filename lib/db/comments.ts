/**
 * The comments table, and the only SQL that touches it.
 *
 * The API routes and the confirmation route both go through here. Two status transitions matter:
 * pending -> confirmed (the author clicked the link) and any -> hidden (enough readers reported
 * it). Neither is exposed as a general update, because a second copy of either filter is how a
 * hidden comment comes back.
 */

export type CommentStatus = "pending" | "confirmed" | "hidden";

export type CommentRow = {
  id: string;
  path: string;
  name: string;
  body: string;
  status: CommentStatus;
  reports: number;
  created_at: number;
  confirmed_at: number | null;
};

export async function createComment(
  db: D1DatabaseLike,
  input: { id: string; path: string; name: string; body: string; token: string; emailHash: string; now: number }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO comments (id, path, name, body, status, confirm_token, email_hash, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
    )
    .bind(input.id, input.path, input.name, input.body, input.token, input.emailHash, input.now)
    .run();
}

/** Returns the confirmed row, or null when the token is unknown or already used. */
export async function confirmComment(
  db: D1DatabaseLike,
  token: string,
  now: number
): Promise<{ path: string } | null> {
  const row = await db
    .prepare(
      `UPDATE comments
          SET status = 'confirmed', confirmed_at = ?
        WHERE confirm_token = ? AND status = 'pending'
        RETURNING path`
    )
    .bind(now, token)
    .first<{ path: string }>();
  return row ?? null;
}

export async function listConfirmed(
  db: D1DatabaseLike,
  path: string,
  limit = 100
): Promise<CommentRow[]> {
  const result = await db
    .prepare(
      `SELECT id, path, name, body, status, reports, created_at, confirmed_at
         FROM comments
        WHERE path = ? AND status = 'confirmed'
        ORDER BY created_at ASC
        LIMIT ?`
    )
    .bind(path, limit)
    .all<CommentRow>();
  return result.results ?? [];
}

/** Increment the report count; hide the comment once three readers have flagged it. */
export async function reportComment(db: D1DatabaseLike, id: string): Promise<number | null> {
  const row = await db
    .prepare(
      `UPDATE comments
          SET reports = reports + 1,
              status = CASE WHEN reports + 1 >= 3 THEN 'hidden' ELSE status END
        WHERE id = ? AND status = 'confirmed'
        RETURNING reports`
    )
    .bind(id)
    .first<{ reports: number }>();
  return row?.reports ?? null;
}
