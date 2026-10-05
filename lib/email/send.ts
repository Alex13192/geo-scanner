/**
 * Sending email, behind one function.
 *
 * THE PROVIDER IS NOT CHOSEN YET, and that is why this file exists in this shape. The
 * design's open risk is which sender to use - Cloudflare's own Email Sending, which is
 * still beta, or a third party such as Resend - and neither can be decided before the
 * domain has SPF, DKIM and DMARC and a reputation. Everything else in the subscription flow
 * can be written and tested while that is unresolved, as long as the sender sits behind a
 * seam.
 *
 * THE SEAM IS ONE FUNCTION. Adding a provider means adding a case below, not touching the
 * endpoints or the cron.
 *
 * THE CONSOLE TRANSPORT, AND WHY IT IS NOT A SILENT NO-OP. In development, a message with
 * no provider configured is written to the log and reported as sent, so the confirmation
 * link can be read out of `wrangler dev` and the whole flow exercised. In production the
 * same situation returns a failure instead, because the alternative is an endpoint that
 * tells a visitor "check your email" while nothing was ever sent - the exact class of
 * silent lie the rest of this repository spends its comments avoiding.
 */

/* Relative, with the extension, for the same reason as in messages.ts: the cron worker bundles
 * this file under a second wrangler config, where path-alias resolution is not guaranteed. */
import { SITE_HOST } from "../site.ts";

export type EmailMessage = {
  to: string;
  subject: string;
  /** Always sent. Some clients and every plain-text reader will use only this. */
  text: string;
  html?: string;
  /** Replies go here rather than to a no-reply address. */
  replyTo?: string;
};

export type SendOutcome =
  | { ok: true; via: "console" | "resend" }
  | { ok: false; reason: string };

/** The subset of the Resend API this uses. */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(env: CloudflareEnv, message: EmailMessage): Promise<SendOutcome> {
  const apiKey = env.RESEND_API_KEY;

  if (apiKey) {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        /*
         * The from-address is built from SITE_HOST rather than written out, because it is
         * the same origin claim as every other link in the product and scripts/check-values.mjs
         * refuses a second copy of it anywhere under lib/. It caught this line when the
         * address was a literal, which is the check working rather than an inconvenience.
         */
        from: env.EMAIL_FROM ?? `LLMention <reports@${SITE_HOST}>`,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo,
      }),
    });

    if (!response.ok) {
      /*
       * The body is read rather than discarded. A rejected send is usually a configuration
       * problem - an unverified domain, a from-address that does not match it - and the
       * provider says which in the response. Logging only the status code turns a
       * five-minute fix into an afternoon.
       */
      const detail = await response.text().catch(() => "");
      console.error(`[email] resend rejected a send: ${response.status} ${detail.slice(0, 400)}`);
      return { ok: false, reason: `provider rejected the message (${response.status})` };
    }

    return { ok: true, via: "resend" };
  }

  /*
   * NEXTJS_ENV is set by the OpenNext adapter to "production" on a deployed Worker and to
   * something else in development. Reading it rather than NODE_ENV is deliberate: NODE_ENV
   * is "production" inside the Worker even during `wrangler dev`, so it would send every
   * confirmation into the console of a real deployment.
   */
  if (env.NEXTJS_ENV !== "production") {
    console.log(
      [
        "",
        "───────────────────────────────────────────────",
        "[email] no provider configured - printing instead",
        `  to:      ${message.to}`,
        `  subject: ${message.subject}`,
        "",
        message.text,
        "───────────────────────────────────────────────",
        "",
      ].join("\n")
    );
    return { ok: true, via: "console" };
  }

  console.error("[email] no provider configured in production; message not sent", message.subject);
  return { ok: false, reason: "no email provider is configured" };
}
