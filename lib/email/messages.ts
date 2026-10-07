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

/**
 * Wrap a body in the smallest HTML that still looks deliberate in a mail client.
 *
 * `footerLink` IS THE SHARED FOOTER, and it is deliberately a different thing from a body
 * paragraph. Every message this product sends carries the token report link in the same place,
 * because the report page is the one deliverable that works without an account and is the one a
 * reader can forward to somebody else - so a message that buries it in a bullet list, or omits it,
 * is the most valuable thing this product has going unmentioned.
 *
 * It is drawn against the address line at the bottom rather than styled like an action button:
 * the body's own button is the thing the reader is being asked to do, and two identically styled
 * buttons in one email is how the primary action stops being distinguishable. See the note on
 * reportEmail for why the body keeps its own copy as well.
 */
function layout(
  heading: string,
  paragraphs: string[],
  action?: { label: string; url: string },
  footerLink?: { label: string; url: string }
): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${p}</p>`).join("");
  const button = action
    ? `<p style="margin:28px 0"><a href="${action.url}" style="background:#0071e3;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;display:inline-block">${action.label}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#6e6e73">Or paste this into your browser:<br><span style="word-break:break-all">${action.url}</span></p>`
    : "";
  const footer = footerLink
    ? `<br><a href="${footerLink.url}" style="color:#0071e3">${footerLink.label}</a>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head><body style="margin:0;background:#f5f5f7;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;font-size:16px;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px;border:1px solid #d2d2d7">
    <p style="margin:0 0 24px;font-weight:600;letter-spacing:-0.02em">${BRAND}</p>
    <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;letter-spacing:-0.02em">${heading}</h1>
    ${body}
    ${button}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#86868b;text-align:center">
    ${BRAND} · <a href="${SITE_URL}" style="color:#86868b">${SITE_URL.replace(/^https?:\/\//, "")}</a> · ${CONTACT_EMAIL}${footer}
  </p>
</body></html>`;
}

/**
 * The double opt-in message.
 *
 * The plain-text part is not a courtesy copy: it is the version that survives every client,
 * every forward and every archive, and it is where the link has to stay usable. Text comes
 * before HTML in this file for that reason.
 *
 * `reportUrl` IS THE DEFERRED INTENT, WITHOUT AN ACCOUNT. This is the one message in the product
 * where a reader has just given something - an address, to watch a domain - and the next thing
 * they expect is the thing they asked for. The competitor this pattern is borrowed from replays
 * the visitor's own input after a login; here there is no login, so what gets replayed is the
 * link to their report, and confirming is the step that lands them on it (see
 * lib/subscribe/landing.ts).
 *
 * IT IS OPTIONAL, AND THAT IS NOT DEFENSIVENESS. A send must never depend on an extra link being
 * constructible: a confirmation email that does not arrive because a token was missing leaves a
 * pending row nobody can ever confirm, which is a subscriber silently lost. The call site passes
 * the token it just wrote; the absence is only possible if the schema and the route have drifted.
 */
export function confirmationEmail(
  domain: string,
  confirmUrl: string,
  unsubUrl: string,
  reportUrl?: string
): EmailMessage {
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
      ...(reportUrl
        ? [
            "Confirming opens the report page for this subscription, which needs no login and no",
            "domain typed. It is the same link every weekly email carries, and it is yours to pass",
            "on - it is not your email address and it is not the unsubscribe link:",
            reportUrl,
            "",
            "Before the first weekly run there is nothing in it to show, and it says so rather than",
            "printing a zero.",
            "",
          ]
        : []),
      `If it was not you, ignore this message and nothing further will be sent. You can`,
      `also stop any future message to this address permanently: ${unsubUrl}`,
      "",
      `— ${BRAND}`,
      CONTACT_EMAIL,
      ...(reportUrl ? [`Your report page: ${reportUrl}`] : []),
    ].join("\n"),
    html: layout(
      `Confirm the weekly report for ${domain}`,
      [
        `Someone asked for a weekly GEO report for <strong>${domain}</strong>, using this address.`,
        "The report checks whether AI search engines can crawl, read and cite the site, and says which check changed since the week before.",
        reportUrl
          ? `Confirming opens <a href="${reportUrl}" style="color:#0071e3">the report page for this subscription</a> - no login, no domain to type, and yours to forward. Before the first weekly run it says there is nothing measured yet rather than showing a zero.`
          : "",
        `If it was not you, ignore this message and nothing further will be sent. This link stops any future message to this address permanently: <a href="${unsubUrl}" style="color:#0071e3">unsubscribe</a>.`,
      ].filter(Boolean),
      { label: "Confirm subscription", url: confirmUrl },
      reportUrl ? { label: "Your report page", url: reportUrl } : undefined
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
  /**
   * The subscriber's own homepage. Named for what it is: this used to be called `reportUrl`, which
   * stopped being an honest name the moment there was a real report URL to distinguish it from.
   */
  homepageUrl: string;
  /**
   * The monitoring page for this subscription, which is the link that can be forwarded: it needs no
   * domain typed and it shows the history rather than one live scan.
   *
   * Optional, because a send must not depend on it. A report whose "see more" link is missing is
   * still the weekly report; a report that does not arrive because an extra link could not be built
   * is a subscriber who silently stops hearing from the product, which is the worse failure. The
   * consumer logs the absence rather than swallowing it - see cron/index.ts.
   */
  historyUrl?: string;
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
    input.homepageUrl,
    ...(input.historyUrl
      ? [
          "",
          "Your scan history, including what has been failing and for how long. This link is yours to",
          "forward - it needs no domain typed:",
          input.historyUrl,
        ]
      : []),
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
      input.historyUrl
        ? `Your scan history, and what each failing check needs: <a href="${input.historyUrl}" style="color:#0071e3">your monitoring report</a>. This link is yours to forward.`
        : "",
      `Every rule is published, so a verdict can be argued with rather than taken on trust: <a href="${SITE_URL}/methodology/" style="color:#0071e3">the methodology</a>.`,
    ].filter(Boolean),
    { label: "See the full breakdown", url: input.homepageUrl },
    /*
     * The report link is in the BODY as well, and that is deliberate rather than duplicated by
     * accident. The body copy is where a reader looks for it and where the sentence explaining
     * that it can be forwarded lives; the footer is the one every one of these messages carries at
     * the same place, so a message whose body is skimmed still has it. The footer is the promise;
     * the body is the explanation.
     */
    input.historyUrl ? { label: "Your monitoring report", url: input.historyUrl } : undefined
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
