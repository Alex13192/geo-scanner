"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * The signup form for the weekly report.
 *
 * WHY TWO FIELDS AND NOT ONE. The scanner's form takes a domain because a scan needs nothing
 * else. This one has to send something later, so the address is part of the subscription
 * rather than an afterthought - collecting it on a second screen would mean a pending row
 * with nowhere to send it, which is a state the database deliberately does not have.
 *
 * WHY THE SUCCESS TEXT COMES FROM THE SERVER RATHER THAN BEING WRITTEN HERE. The endpoint
 * answers the same way whether the address is new, already subscribed, or already confirmed,
 * so that it cannot be used to ask whether a given person is on the list. A message written
 * in this component would have to reproduce that same careful phrasing a second time, and
 * the two would drift.
 */
export default function MonitorForm() {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setMessage("");

    try {
      /*
       * The trailing slash is required, not cosmetic: next.config.ts sets
       * `trailingSlash: true`, so /api/subscribe answers with a 308 to /api/subscribe/.
       * fetch follows it and keeps the POST, but that is one wasted round trip on the
       * request a visitor is waiting on.
       */
      const response = await fetch("/api/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, email }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };

      if (!response.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("sent");
      setMessage(data.message ?? "Check your inbox for a confirmation email.");
      setDomain("");
      setEmail("");
    } catch {
      setState("error");
      setMessage("The request could not be sent. Check your connection and try again.");
    }
  }

  const sending = state === "sending";

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-describedby="monitor-form-status">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="monitor-domain" className="sr-only">
            Domain to watch
          </label>
          <input
            id="monitor-domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="your-domain.com"
            required
            autoComplete="url"
            disabled={sending}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--ink-1)] placeholder-[var(--ink-3)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-60"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="monitor-email" className="sr-only">
            Email address for the report
          </label>
          <input
            id="monitor-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
            disabled={sending}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--ink-1)] placeholder-[var(--ink-3)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--on-accent)] transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          <span>{sending ? "Sending…" : "Send weekly report"}</span>
          {!sending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {/*
        aria-live rather than only a visual change: the result replaces nothing on screen, so
        without this a screen reader user submits the form and hears silence.
      */}
      <p
        id="monitor-form-status"
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
