/**
 * The webhook signature check, tested against an independent implementation.
 *
 * WHY THIS DOES NOT JUST SIGN WITH THE MODULE AND CHECK THE MODULE AGREES. That test passes
 * when both sides share the same mistake - it proves the code is self-consistent, which is not
 * the property that matters. The endpoint is public and the only thing standing between it and
 * anyone marking arbitrary subscribers as bounced is that the signature scheme matches Svix's.
 *
 * So every positive case here is signed with node:crypto - createHmac over the documented
 * content, base64-encoded - which is a different implementation from the WebCrypto one under
 * test. If our reading of the scheme is wrong, the two disagree and this fails.
 *
 * The negative cases matter more than the positive one, and each exists because of a specific
 * way to get this wrong: accepting a body that was altered after signing, accepting a signature
 * computed with a different secret, accepting a replay, and accepting a v2 signature as though
 * it were v1.
 */
import { createHmac } from "node:crypto";
import { verifyResendSignature } from "../lib/webhooks/resend.ts";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
}

const SECRET = "whsec_" + Buffer.from("a-test-signing-key-of-at-least-24-bytes").toString("base64");
const ID = "msg_2bY8kLQqVv3nR7sT1uW4xZ";
const NOW = 1_791_200_000_000;
const TIMESTAMP = String(Math.floor(NOW / 1000));
const BODY = JSON.stringify({
  type: "email.bounced",
  data: { to: ["reader@example.com"], bounce: { type: "Permanent" } },
});

/** The scheme as Svix documents it, implemented without touching the module under test. */
function sign(body: string, opts: { id?: string; timestamp?: string; secret?: string } = {}): string {
  const id = opts.id ?? ID;
  const ts = opts.timestamp ?? TIMESTAMP;
  const key = Buffer.from((opts.secret ?? SECRET).replace(/^whsec_/, ""), "base64");
  return createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
}

const headers = (signature: string, extra: { id?: string; timestamp?: string } = {}) => ({
  id: extra.id ?? ID,
  timestamp: extra.timestamp ?? TIMESTAMP,
  signature: `v1,${signature}`,
});

console.log("\n=== the signature scheme ===");

{
  const r = await verifyResendSignature({ ...headers(sign(BODY)), body: BODY, secret: SECRET, nowMs: NOW });
  check("a signature made by an independent implementation is accepted", r.ok, r.ok ? "" : r.reason);
}

{
  // Svix sends every active key during a rotation, so a list with one good entry must pass.
  const r = await verifyResendSignature({
    ...headers(`v1,${Buffer.from("nonsense").toString("base64")} v1,${sign(BODY)}`),
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("any one matching entry in a multi-signature header is enough", r.ok, r.ok ? "" : r.reason);
}

console.log("\n=== the ways this can be got wrong ===");

{
  const r = await verifyResendSignature({
    ...headers(sign(BODY)),
    body: BODY.replace("reader@example.com", "someone-else@example.com"),
    secret: SECRET,
    nowMs: NOW,
  });
  check("a body altered after signing is refused", !r.ok, r.ok ? "ACCEPTED A TAMPERED BODY" : "");
}

{
  const other = "whsec_" + Buffer.from("a-completely-different-signing-key-here").toString("base64");
  const r = await verifyResendSignature({
    ...headers(sign(BODY, { secret: other })),
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("a signature from a different secret is refused", !r.ok, r.ok ? "ACCEPTED A FOREIGN KEY" : "");
}

{
  // A captured request resent an hour later. One of the events handled is permanent, so a
  // replay would re-apply a decision that was already made.
  const old = String(Math.floor(NOW / 1000) - 3600);
  const r = await verifyResendSignature({
    ...headers(sign(BODY, { timestamp: old }), { timestamp: old }),
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("a replay an hour later is refused", !r.ok, r.ok ? "ACCEPTED A REPLAY" : "");
}

{
  // The id is part of the signed content, so swapping it invalidates the signature. This is
  // what stops a captured signature being re-attached to a different delivery.
  const r = await verifyResendSignature({
    ...headers(sign(BODY), { id: "msg_a_completely_different_id" }),
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("a swapped svix-id is refused", !r.ok, r.ok ? "ACCEPTED A SWAPPED ID" : "");
}

{
  const r = await verifyResendSignature({
    id: ID,
    timestamp: TIMESTAMP,
    signature: `v2,${sign(BODY)}`,
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("a v2 signature is not accepted as v1", !r.ok, r.ok ? "ACCEPTED AN UNKNOWN VERSION" : "");
}

{
  const r = await verifyResendSignature({
    id: ID,
    timestamp: TIMESTAMP,
    signature: sign(BODY),
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("a signature with no version prefix is refused", !r.ok, r.ok ? "ACCEPTED A PREFIXLESS VALUE" : "");
}

console.log("\n=== the states that are not attacks ===");

{
  const r = await verifyResendSignature({ ...headers(sign(BODY)), body: BODY, secret: undefined, nowMs: NOW });
  check("no configured secret refuses rather than allows", !r.ok, r.ok ? "FAILED OPEN WITH NO SECRET" : "");
}

{
  const r = await verifyResendSignature({ id: null, timestamp: null, signature: null, body: BODY, secret: SECRET, nowMs: NOW });
  check("missing svix headers are refused", !r.ok);
}

{
  const r = await verifyResendSignature({
    id: ID,
    timestamp: "not-a-number",
    signature: `v1,${sign(BODY)}`,
    body: BODY,
    secret: SECRET,
    nowMs: NOW,
  });
  check("an unparseable timestamp is refused", !r.ok);
}

console.log(
  failures === 0
    ? "\nAll webhook signature tests passed.\n"
    : `\n${failures} webhook signature test(s) FAILED.\n`
);
process.exit(failures === 0 ? 0 : 1);
