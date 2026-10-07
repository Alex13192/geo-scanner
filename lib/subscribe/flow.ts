/**
 * Shared pieces of the subscribe flow: what counts as valid input, and what the two links
 * in an email look like.
 *
 * The URL builders live here rather than at the call sites because every one of them has to
 * start from SITE_URL. A literal origin written into an email template is the failure
 * scripts/check-values.mjs exists for, and an email is the one place it cannot be fixed
 * after the fact - the message is already in somebody's inbox.
 */

/*
 * A RELATIVE IMPORT RATHER THAN `@/lib/site`, and it is not a style preference: this module is
 * imported by lib/subscribe/landing.ts, which scripts/test-report-link.mts loads through plain
 * `node`. Node resolves a `@/...` specifier as a package name and fails, so a path alias here
 * would put the confirmation flow beyond the reach of the test suite - which is the one thing the
 * suite was extended to cover. lib/email/messages.ts uses a relative import for the same reason.
 */
import { SITE_URL } from "../site.ts";

/** Same shape the scanner accepts, so the two never disagree about what a domain is. */
const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/**
 * Deliberately permissive.
 *
 * The only reliable test of an address is that a message to it arrives and somebody clicks.
 * A stricter pattern here would reject valid addresses - plus-addressing, new TLDs, quoted
 * local parts - and every rejection is a person who cannot sign up and will not tell anyone.
 * The confirmation email is the real validation, so this only rejects what is obviously not
 * an address at all.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normaliseDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .toLowerCase();
}

export function isValidDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain);
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

/**
 * Addresses are stored lowercased.
 *
 * Without this, `Alex@example.com` and `alex@example.com` are two rows, two confirmations
 * and two weekly reports to one person - and the unique index cannot help, because to it
 * they are different strings.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function confirmUrl(token: string): string {
  return `${SITE_URL}/api/subscribe/confirm/?t=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/api/subscribe/unsubscribe/?t=${encodeURIComponent(token)}`;
}

/**
 * The report link, and it takes the REPORT token rather than either of the other two.
 *
 * The mistake this exists to prevent is one line long and destructive: passing `unsubToken` here
 * produces a URL that anyone the report is forwarded to can open, and opening it ends the
 * subscription. The three builders are deliberately separate functions with separate arguments so
 * that mixing two of them up is a type error at the call site rather than a silent unsubscribe.
 */
export function reportUrl(token: string): string {
  return `${SITE_URL}/monitor/report/${encodeURIComponent(token)}/`;
}

/**
 * The page both link endpoints return.
 *
 * Returned as HTML from the route rather than as a redirect to a page, for one reason that
 * matters: these links are clicked from a mail client, sometimes hours later, sometimes
 * with the site unreachable from wherever the reader is. A self-contained response has one
 * fewer thing that can fail between the click and the answer.
 *
 * `action` IS THE NEXT STEP, and it is the reason the confirmation page is not a dead end. The
 * reader has just proved they control the address they subscribed with, and what they asked for
 * is a report - so that page carries the link to it rather than stopping at "thank you". It is
 * optional because the other callers of this function (an incomplete link, a token that is not
 * recognised, a rate limit) have no next step to offer, and inventing one would be worse than
 * having none.
 *
 * `noindex` on both, because a confirmation URL is a URL with a secret in it and has no
 * business in an index.
 */
export function linkPage(input: {
  title: string;
  heading: string;
  body: string;
  action?: { label: string; url: string };
}): Response {
  const action = input.action
    ? `<p style="margin:24px 0 0"><a href="${input.action.url}" style="background:#0071e3;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block">${input.action.label}</a></p>`
    : "";

  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${input.title}</title>
<style>
  :root{color-scheme:light}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f5f7;color:#1d1d1f;
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       font-size:17px;line-height:1.6;padding:24px}
  main{max-width:520px;background:#fff;border:1px solid #d2d2d7;border-radius:18px;padding:40px}
  h1{margin:0 0 16px;font-size:26px;letter-spacing:-.02em;line-height:1.2}
  p{margin:0 0 16px;color:#6e6e73}
  a{color:#0071e3}
  .brand{font-weight:600;margin:0 0 24px;letter-spacing:-.02em}
</style></head><body><main>
<p class="brand">LLMention</p>
<h1>${input.heading}</h1>
<p>${input.body}</p>
${action}
<p style="margin:24px 0 0"><a href="${SITE_URL}/" style="color:#6e6e73;font-size:14px">Back to the scanner</a></p>
</main></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
