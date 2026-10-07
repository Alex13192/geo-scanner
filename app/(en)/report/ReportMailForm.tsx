"use client";

import { useState } from "react";

/**
 * "Mail me this report", on /report/ and nowhere else.
 *
 * WHERE IT SITS IS THE WHOLE DESIGN, so it is stated here rather than left to the page's markup
 * order. This form renders BELOW the finished audit, after the score, the dimension bars and the
 * fix list. It is never in front of the result, it never gates it, and the page is fully usable by
 * somebody who scrolls past it - which is the difference between this and the pattern it is
 * borrowed from, where the same free computation is withheld until an identity arrives.
 *
 * WHY THERE IS NO MODAL, NO PROMPT AND NO POPUP. The competitor's conversion leans on an
 * automatically rendered sign-in picker, and that mechanism is recorded as something not to copy:
 * an identity obtained without a request does not tell you whether somebody wanted the product.
 * The only thing this form does is offer, in plain words, to keep sending a summary.
 *
 * WHAT IT ACTUALLY SUBSCRIBES TO, said out loud on the page rather than implied by a button: the
 * weekly report. It is NOT "mail me this scan" - the scan is live and not stored, so the message
 * that arrives is the next scheduled run for that domain, and a form that let somebody believe
 * otherwise would be a small lie told at the exact moment of conversion.
 *
 * WHY THE SUCCESS TEXT COMES FROM THE SERVER. The endpoint answers identically whether the address
 * is new, already pending or already confirmed, deliberately, so that it cannot be used to ask
 * whether a given person is on the list. Wording written here would have to reproduce that phrasing
 * and would drift from it.
 */
export default function ReportMailForm({ domain }: { domain: string }) {
  const [address, setAddress] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const sending = state === "sending";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setMessage("");

    try {
      /*
       * The trailing slash is required rather than cosmetic: next.config.ts sets
       * `trailingSlash: true`, so this path answers with a 308. fetch follows it and keeps the POST,
       * but that is one wasted round trip on the request the visitor is waiting on.
       */
      const response = await fetch("/api/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, email: address }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };

      if (!response.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("sent");
      setMessage(data.message ?? "Check your inbox for a confirmation message.");
      setAddress("");
    } catch {
      setState("error");
      setMessage("The request could not be sent. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-describedby="report-mail-status">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="report-mail-address" className="sr-only">
          Address to send the weekly report to
        </label>
        <input
          id="report-mail-address"
          type="email"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="you@company.com"
          required
          autoComplete="email"
          disabled={sending}
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-0)] px-4 py-2.5 text-sm text-[var(--ink-1)] placeholder-[var(--ink-3)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 cursor-pointer rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--on-accent)] transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send me the weekly report"}
        </button>
      </div>

      {/*
        aria-live rather than only a visual change: the outcome replaces nothing on screen, so
        without this a screen-reader user submits the form and hears silence.
      */}
      <p
        id="report-mail-status"
        aria-live="polite"
        className={`min-h-[1.25rem] text-sm ${
          state === "error" ? "text-[var(--warn)]" : "text-[var(--ink-2)]"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
