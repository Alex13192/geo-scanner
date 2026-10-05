/**
 * The messages this project sends, and nothing about how they are sent.
 *
 * WHY THEY ARE NOT INLINE AT THE CALL SITES: the confirmation email has to carry a link
 * built from SITE_URL, and a second copy of that link written into a cron worker is how the
 * old hostname survived a move once already - which is what scripts/check-values.mjs exists
 * to prevent. Keeping the templates here means the origin appears once, in lib/site.ts, and
 * the value check keeps proving it.
 */

/*
 * A relative import rather than `@/lib/site`: this module is bundled into the cron worker as
 * well, which is a second wrangler config, and path-alias resolution there is not something to
 * depend on. The explicit .ts extension matches the convention inside lib/geo and is what lets
 * a plain `node` script import this file.
 */
import { BRAND, CONTACT_EMAIL, SITE_URL } from "../site.ts";

import type { EmailMessage } from "./send";

/** Wrap a body in the smallest HTML that still looks deliberate in a mail client. */
function layout(heading: string, paragraphs: string[], action?: { label: string; url: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${p}</p>`).join("");
  const button = action
    ? `<p style="margin:28px 0"><a href="${action.url}" style="background:#0071e3;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;display:inline-block">${action.label}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#6e6e73">Or paste this into your browser:<br><span style="word-break:break-all">${action.url}</span></p>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;font-size:16px;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px;border:1px solid #d2d2d7">
    <p style="margin:0 0 24px;font-weight:600;letter-spacing:-0.02em">${BRAND}</p>
    <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;letter-spacing:-0.02em">${heading}</h1>
    ${body}
    ${button}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#86868b;text-align:center">
    ${BRAND} · <a href="${SITE_URL}" style="color:#86868b">${SITE_URL.replace(/^https?:\/\//, "")}</a> · ${CONTACT_EMAIL}
  </p>
</body></html>`;
}

/**
 * The double opt-in message.
 *
 * The plain-text part is not a courtesy copy: it is the version that survives every client,
 * every forward and every archive, and it is where the link has to stay usable. Text comes
 * before HTML in this file for that reason.
 */
export function confirmationEmail(domain: string, confirmUrl: string, unsubUrl: string): EmailMessage {
  return {
    to: "",
    subject: `Confirm the weekly GEO report for ${domain}`,
    text: [
      `Someone asked for a weekly GEO report for ${domain}, using this address.`,
      "",
      "If that was you, confirm here:",
      confirmUrl,
      "",
      "The report checks whether AI search engines can crawl, read and cite the site,",
      "and it says which check changed since the week before.",
      "",
      `If it was not you, ignore this message and nothing further will be sent. You can`,
      `also stop any future message to this address permanently: ${unsubUrl}`,
      "",
      `— ${BRAND}`,
      CONTACT_EMAIL,
    ].join("\n"),
    html: layout(
      `Confirm the weekly report for ${domain}`,
      [
        `Someone asked for a weekly GEO report for <strong>${domain}</strong>, using this address.`,
        "The report checks whether AI search engines can crawl, read and cite the site, and says which check changed since the week before.",
        `If it was not you, ignore this message and nothing further will be sent. This link stops any future message to this address permanently: <a href="${unsubUrl}" style="color:#0071e3">unsubscribe</a>.`,
      ],
      { label: "Confirm subscription", url: confirmUrl }
    ),
    replyTo: CONTACT_EMAIL,
  };
}

export type ReportInput = {
  domain: string;
  score: number;
  grade: string;
  checksPassed: number;
  checksRun: number;
  /** Titles of checks that pass now and failed at the previous run. */
  fixed: string[];
  /** Titles of checks that failed now and passed at the previous run. */
  newFailures: string[];
  /** Failing both weeks. Counted rather than listed - the list is what the site is for. */
  unchangedFailures: number;
  /** No previous run exists, so there is nothing to compare against and nothing to imply. */
  firstRun: boolean;
  reportUrl: string;
  unsubUrl: string;
};

/** "97/100 (A)", or the move when there is one. */
function headline(input: ReportInput): string {
  const now = `${input.score}/100 (${input.grade})`;
  if (input.firstRun) return now;
  if (input.newFailures.length > 0) {
    const n = input.newFailures.length;
    return `${now} - ${n} new failure${n === 1 ? "" : "s"}`;
  }
  if (input.fixed.length > 0) {
    const n = input.fixed.length;
    return `${now} - ${n} fixed`;
  }
  return `${now} - no change`;
}

/**
 * The weekly report.
 *
 * WHAT THE SUBJECT LINE IS FOR, because it decides whether the rest is ever read. It carries
 * the news rather than the product: "3 new failures" gets opened, "Your weekly GEO report for
 * example.com" does not. The score is in there too, so the subject alone answers the question
 * for a reader who never opens it - which is most of them, most weeks.
 *
 * WHY "NO CHANGE" IS A FIRST-CLASS SUBJECT rather than a reason not to send. A monitoring
 * email that only arrives when something breaks teaches the reader that its arrival IS the
 * alarm, and then a message that fails to send is indistinguishable from good news. Saying
 * "no change" every week is what makes the one that says otherwise mean anything.
 */
export function reportEmail(input: ReportInput): EmailMessage {
  const { domain, score, grade, checksPassed, checksRun, fixed, newFailures, unchangedFailures } = input;

  const changes: string[] = [];
  if (newFailures.length > 0) {
    changes.push(`Now failing (${newFailures.length}):`, ...newFailures.map((t) => `  - ${t}`), "");
  }
  if (fixed.length > 0) {
    changes.push(`Fixed since last week (${fixed.length}):`, ...fixed.map((t) => `  - ${t}`), "");
  }
  if (unchangedFailures > 0) {
    changes.push(
      `${unchangedFailures} other check${unchangedFailures === 1 ? "" : "s"} ${
        unchangedFailures === 1 ? "is" : "are"
      } still failing.`,
      ""
    );
  }

  const opening = input.firstRun
    ? `First report for ${domain}.`
    : newFailures.length > 0
      ? `Something changed on ${domain}.`
      : `Nothing changed on ${domain} this week.`;

  const text = [
    opening,
    "",
    `${score}/100, grade ${grade}. ${checksPassed} of ${checksRun} published checks pass.`,
    "",
    ...(changes.length > 0 ? changes : []),
    "The full breakdown, with the evidence behind each verdict:",
    input.reportUrl,
    "",
    `Every rule this is scored against is published at ${SITE_URL}/methodology/.`,
    "",
    `— ${BRAND}`,
    `Stop these emails: ${input.unsubUrl}`,
  ].join("\n");

  const list = (items: string[]) =>
    `<ul style="margin:0 0 16px;padding-left:20px">${items.map((t) => `<li>${escapeText(t)}</li>`).join("")}</ul>`;

  const html = layout(
    headline(input),
    [
      escapeText(opening),
      `<strong>${score}/100</strong>, grade ${grade}. ${checksPassed} of ${checksRun} published checks pass.`,
      newFailures.length > 0 ? `<strong>Now failing</strong>${list(newFailures)}` : "",
      fixed.length > 0 ? `<strong>Fixed since last week</strong>${list(fixed)}` : "",
      unchangedFailures > 0
        ? `${unchangedFailures} other check${unchangedFailures === 1 ? "" : "s"} still failing.`
        : "",
      `Every rule is published, so a verdict can be argued with rather than taken on trust: <a href="${SITE_URL}/methodology/" style="color:#0071e3">the methodology</a>.`,
    ].filter(Boolean),
    { label: "See the full breakdown", url: input.reportUrl }
  );

  return {
    to: "",
    subject: `${domain}: ${headline(input)}`,
    text,
    html,
    replyTo: CONTACT_EMAIL,
  };
}

/**
 * The report lists check titles, which come from our own catalogue today.
 *
 * Escaped anyway. The domain in the subject is whatever a visitor typed, and a template that
 * is safe only because of where its inputs currently come from is one refactor away from not
 * being safe.
 */
function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
