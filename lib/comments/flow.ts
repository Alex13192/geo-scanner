/**
 * Comment validation and the shape of a comment URL, kept pure so the tests can pin it.
 *
 * THE RULES, AND WHY THEY ARE THIS STRICT:
 * - path must be a blog article under one of the three published locales. A comment section is
 *   a public write endpoint; accepting arbitrary paths would let one post appear on every page
 *   or on a page that does not exist.
 * - email is required only to send the confirmation link. It is validated, hashed, and not
 *   stored.
 * - body is capped at 2000 characters and two links. The cap is about spam and layout, not
 *   about how long a thought is allowed to be.
 */

export const MAX_BODY = 2000;
export const MAX_NAME = 60;
export const MAX_LINKS = 2;

export function normalisePath(value: string): string {
  const path = value.trim();
  if (!path.startsWith("/")) return "";
  if (path.includes("?") || path.includes("#") || path.includes("//")) return "";
  // Only published article paths, not the archive index.
  const match = path.match(/^\/(?:zh\/|ja\/)?blog\/[a-z0-9-]+\/$/);
  return match ? path : "";
}

export function normaliseName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

export function normaliseBody(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_BODY);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\//gi) ?? []).length;
}

export function newCommentToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function newCommentId(): string {
  return `cm_${newCommentToken().slice(0, 20)}`;
}

/** A stable hash, so the same address filling the form twice can be recognised without storing it. */
export async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
