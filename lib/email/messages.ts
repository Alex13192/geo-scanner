/**
 * The messages this project sends, and nothing about how they are sent.
 *
 * WHY THEY ARE NOT INLINE AT THE CALL SITES: the confirmation email has to carry a link
 * built from SITE_URL, and a second copy of that link written into a cron worker is how the
 * old hostname survived a move once already - which is what scripts/check-values.mjs exists
 * to prevent. Keeping the templates here means the origin appears once, in lib/site.ts, and
 * the value check keeps proving it.
 */

import { BRAND, CONTACT_EMAIL, SITE_URL } from "@/lib/site";
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

/**
 * Confirmation is a page, not an email, so there is no second message here yet.
 *
 * The weekly report is the next template, and it is deliberately absent until the cron that
 * fills it exists: a template written against data nothing produces is a template nobody
 * can check, which is how the site ended up with copy describing a paid audit it had
 * withdrawn. See OPERATIONS.md.
 */
