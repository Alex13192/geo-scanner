"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * `/zh/monitor/` 的订阅表单——英文组件 `app/(en)/monitor/MonitorForm.tsx` 的中文副本。
 *
 * WHY A COPY AND NOT A `locale` PROP ON THE ENGLISH FORM: the English form is rendered by a
 * server page whose whole prose is English, and the only strings that differ here are its own
 * chrome. A `locale` branch inside it would put two languages in one component and make every
 * sentence conditional - which is the same reason every localized route in this repo owns its
 * own file instead of parameterising the English one.
 *
 * WHY TWO FIELDS AND NOT ONE: the scanner's form takes a domain because a scan needs nothing
 * else. This one has to send something later, so the address is part of the subscription rather
 * than an afterthought - collecting it on a second screen would leave a pending row with
 * nowhere to send it, which is a state the database deliberately does not have.
 *
 * WHAT IS DELIBERATELY IDENTICAL, BECAUSE BEHAVIOUR IS THE CONTRACT: the endpoint
 * (`/api/subscribe/`, trailing slash included for `trailingSlash: true`), the POST body keys
 * (`domain`, `email`), the four states (`idle` / `sending` / `sent` / `error`), the empty-message
 * reset at the start of a submit, clearing both fields only after a success, and the aria-live
 * status paragraph. The validation rules live in `lib/subscribe/flow.ts` and are the server's
 * business - this form neither copies nor second-guesses them, so the two language versions
 * cannot start accepting different input.
 *
 * WHY THE SUCCESS AND ERROR TEXT COME FROM THE SERVER, AND THEREFORE ARRIVE IN ENGLISH. The
 * endpoint answers the same way whether the address is new, already pending or already
 * confirmed, so that it cannot be used to ask whether a given person is on the list. A message
 * written here would have to reproduce that careful phrasing a second time and the two would
 * drift; a Chinese rewrite of it would be a second claim about what happens to the address.
 * The strings below are therefore only the fallbacks used when the response carries no message
 * at all, plus the chrome this file owns. `app/(locales)/[locale]/monitor/page.tsx` says in the
 * form's fine print that the confirmation mail and the status line are English, rather than
 * letting a reader discover it after submitting.
 */
export default function MonitorFormZh() {
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
        setMessage(data.error ?? "出错了，请再试一次。");
        return;
      }

      setState("sent");
      setMessage(data.message ?? "请查收收件箱里的确认邮件。");
      setDomain("");
      setEmail("");
    } catch {
      setState("error");
      setMessage("请求没能发出去。请检查网络连接，然后再试一次。");
    }
  }

  const sending = state === "sending";

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-describedby="monitor-form-status">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="monitor-domain" className="sr-only">
            要盯住的域名
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
            接收报告的邮箱地址
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
          <span>{sending ? "发送中……" : "发送每周报告"}</span>
          {!sending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {/*
        aria-live rather than only a visual change: the result replaces nothing on screen, so
        without this a screen reader user submits the form and hears silence. The id is the same
        one the English form uses - the two never render together, and keeping it identical means
        the `aria-describedby` wiring above cannot differ between them.
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
