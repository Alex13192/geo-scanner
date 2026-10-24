/**
 * Comment-flow tests.
 *
 * WHAT IS PINNED: the path rule (only published article paths under the three locales - this is
 * the guard against a comment being posted onto arbitrary pages), email validation, the body
 * caps and the link cap. The network pieces (D1, email) are exercised by the live check rather
 * than mocked here, because a mock would only prove the mock.
 *
 * Run: node scripts/test-comments.mts   (npm run test:comments)
 */
import {
  MAX_BODY,
  MAX_LINKS,
  countLinks,
  hashEmail,
  isValidEmail,
  newCommentId,
  newCommentToken,
  normaliseBody,
  normaliseName,
  normalisePath,
} from "../lib/comments/flow.ts";

let failures = 0;

function check(ok: boolean, pass: string, fail: string) {
  if (ok) console.log(`  PASS  ${pass}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${fail}`);
  }
}

console.log("=== comments ===");

/* Paths: article paths only, three locales, no query/hash/traversal. */
for (const path of [
  "/blog/thirty-homepages-none-graded-a/",
  "/zh/blog/thirty-homepages-none-graded-a/",
  "/ja/blog/thirty-homepages-none-graded-a/",
]) {
  check(normalisePath(path) === path, `accepts ${path}`, `rejected ${path}`);
}
for (const path of [
  "/blog/",
  "/blog",
  "/pricing/",
  "/blog/thirty-homepages-none-graded-a",
  "/blog/../../api/",
  "/blog/thirty-homepages-none-graded-a/?x=1",
  "//blog/thirty-homepages-none-graded-a/",
  "https://example.com/blog/x/",
]) {
  check(normalisePath(path) === "", `rejects ${JSON.stringify(path)}`, `accepted ${JSON.stringify(path)}`);
}

/* Email. */
check(isValidEmail("reader@example.com"), "accepts a normal address", "rejected reader@example.com");
check(!isValidEmail("not-an-email"), "rejects a malformed address", "accepted not-an-email");
check(!isValidEmail("a@b"), "rejects a missing TLD", "accepted a@b");

/* Body and links. */
check(normaliseBody("a".repeat(MAX_BODY + 50)).length === MAX_BODY, "body is capped", "body cap not applied");
check(countLinks("see https://a.example and https://b.example") === 2, "counts links", "link count wrong");
check(MAX_LINKS === 2, "link cap is two", `link cap is ${MAX_LINKS}`);
check(normaliseName("  Alex   Xu  ") === "Alex Xu", "normalises whitespace in names", "name not normalised");

/* Tokens. */
const token = newCommentToken();
check(/^[0-9a-f]{48}$/.test(token), "confirm token is 48 hex characters", `unexpected token: ${token}`);
check(newCommentToken() !== token, "tokens do not repeat", "token collision");
check(newCommentId().startsWith("cm_"), "comment ids carry the cm_ prefix", "id prefix missing");

/* Email hashing is stable and does not return the address. */
const hashA = await hashEmail("Reader@Example.com");
const hashB = await hashEmail("reader@example.com");
check(hashA === hashB, "hash is case-insensitive", "hash differs for the same address");
check(!hashA.includes("reader"), "hash does not contain the address", "hash leaks the address");

console.log(failures === 0 ? "\nAll comment checks passed." : `\n${failures} comment check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
