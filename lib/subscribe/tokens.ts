/**
 * Identifiers and tokens for the subscription flow.
 *
 * Kept in one file because the difference between the two is a security boundary rather
 * than a naming detail, and separating them by accident is how confirm and unsubscribe get
 * swapped later.
 *
 * Both are generated from WebCrypto, which workerd provides as a global. `Math.random` is
 * not an option for either: the confirm token is the only thing standing between a
 * stranger and somebody else's subscription, and the unsubscribe token appears in every
 * email and therefore travels through mail servers, forwards and archives.
 */

/** Random, not sequential: the unsubscribe URL carries an id, and a counter is enumerable. */
export function newId(): string {
  return crypto.randomUUID();
}

/**
 * 32 bytes of entropy, hex encoded.
 *
 * There is no expiry on either token yet, and that is a deliberate limitation rather than
 * an oversight: a confirmation link that expires after an hour has to be re-requested, and
 * the only thing re-requesting it can prove is that the person still reads their email.
 * The unsubscribe link especially must never expire - a link that stops working is a
 * compliance problem, not a security improvement.
 */
export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compare without leaking position through timing.
 *
 * Tokens arrive from a URL, so an attacker controls the input and can measure the reply.
 * A plain `===` on a 64-character token exits at the first differing byte, which is enough
 * to recover it byte by byte given enough requests. The loop below always examines all of
 * them.
 */
export function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
