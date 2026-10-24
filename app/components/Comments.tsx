"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Comments, on every blog article.
 *
 * WHAT THIS IS, IN ONE SENTENCE: anonymous, but nothing appears until the author clicks a link
 * in their email - which is the whole moderation model. There is no account, no queue, and no
 * stored address.
 *
 * WHY THE COMPONENT READS THE PATHNAME: it is mounted by the blog layout rather than each
 * article, so an article cannot forget it and a new article gets comments for free. The archive
 * index is excluded; a comment box under a list of posts has no article to attach to.
 */

type Comment = { id: string; name: string; body: string; createdAt: number };

type Labels = {
  title: string;
  intro: string;
  name: string;
  email: string;
  body: string;
  submit: string;
  sending: string;
  sent: string;
  empty: string;
  error: string;
  report: string;
  reported: string;
  missing: string;
};

const LABELS: Record<"en" | "zh" | "ja", Labels> = {
  en: {
    title: "Comments",
    intro: "Comments are anonymous and published after you confirm the link we email you. The address is used once and not stored.",
    name: "Name (optional)",
    email: "Email (for the confirmation link)",
    body: "Comment",
    submit: "Submit comment",
    sending: "Sending…",
    sent: "Check your inbox and open the link to publish your comment.",
    empty: "No comments yet. Be the first.",
    error: "Something went wrong. Please try again.",
    report: "Report",
    reported: "Reported",
    missing: "A name or comment is missing.",
  },
  zh: {
    title: "评论",
    intro: "评论匿名发表;提交后你会收到一封确认邮件,点击链接后评论才会公开。邮箱只用于发送这一封邮件,不会保存。",
    name: "名字(可选)",
    email: "邮箱(用于接收确认链接)",
    body: "评论内容",
    submit: "提交评论",
    sending: "发送中…",
    sent: "请查看邮箱并点击链接,评论才会发布。",
    empty: "还没有评论,来写第一条。",
    error: "出了点问题,请重试。",
    report: "举报",
    reported: "已举报",
    missing: "名字或评论内容为空。",
  },
  ja: {
    title: "コメント",
    intro: "コメントは匿名で、確認メールのリンクを開いた後に公開されます。メールアドレスはその1回だけ使用し、保存しません。",
    name: "名前(任意)",
    email: "メールアドレス(確認リンク用)",
    body: "コメント",
    submit: "コメントを送信",
    sending: "送信中…",
    sent: "メールを確認し、リンクを開くとコメントが公開されます。",
    empty: "まだコメントはありません。最初の一人になってください。",
    report: "報告",
    reported: "報告済み",
    missing: "名前または本文が空です。",
    error: "問題が発生しました。もう一度お試しください。",
  },
};

function localeOf(pathname: string): "en" | "zh" | "ja" {
  if (pathname.startsWith("/zh/")) return "zh";
  if (pathname.startsWith("/ja/")) return "ja";
  return "en";
}

export default function Comments() {
  const [path, setPath] = useState("");
  const [locale, setLocale] = useState<"en" | "zh" | "ja">("en");
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [reported, setReported] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/(?:zh\/|ja\/)?blog\/[a-z0-9-]+\/$/);
    if (!match) return;
    setPath(pathname);
    setLocale(localeOf(pathname));
    fetch(`/api/comments?path=${encodeURIComponent(pathname)}`)
      .then((response) => (response.ok ? response.json() : { comments: [] }))
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, []);

  const labels = LABELS[locale];

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const body = String(form.get("body") ?? "").trim();
      if (!body || !email) {
        setStatus("error");
        setErrorText(labels.missing);
        return;
      }
      setStatus("sending");
      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path, name, email, body, website: String(form.get("website") ?? "") }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          setStatus("error");
          setErrorText(data.error ?? labels.error);
          return;
        }
        setStatus("sent");
        event.currentTarget.reset();
      } catch {
        setStatus("error");
        setErrorText(labels.error);
      }
    },
    [labels, path]
  );

  const report = useCallback(async (id: string) => {
    setReported((current) => ({ ...current, [id]: true }));
    await fetch("/api/comments/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => undefined);
  }, []);

  if (!path) return null;

  return (
    <section id="comments" className="mx-auto mt-16 max-w-3xl border-t border-[var(--line)] pt-10">
      <h2 className="text-xl font-semibold text-[var(--ink-1)]">{labels.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{labels.intro}</p>

      <ol className="mt-6 space-y-5">
        {comments.length === 0 ? (
          <li className="text-sm text-[var(--ink-3)]">{labels.empty}</li>
        ) : (
          comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-[var(--ink-3)]">
                <span className="font-medium text-[var(--ink-2)]">{comment.name || "Anonymous"}</span>
                <time dateTime={new Date(comment.createdAt).toISOString()}>
                  {new Date(comment.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
                <button
                  type="button"
                  onClick={() => report(comment.id)}
                  className="ml-auto text-[11px] underline hover:text-[var(--ink-1)]"
                >
                  {reported[comment.id] ? labels.reported : labels.report}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-2)]">{comment.body}</p>
            </li>
          ))
        )}
      </ol>

      <form onSubmit={submit} className="mt-8 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-[var(--ink-3)]">
            {labels.name}
            <input
              name="name"
              maxLength={60}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)]"
            />
          </label>
          <label className="block text-xs text-[var(--ink-3)]">
            {labels.email}
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)]"
            />
          </label>
        </div>
        {/* Honeypot: hidden from people, filled by naive bots. */}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="block text-xs text-[var(--ink-3)]">
          {labels.body}
          <textarea
            name="body"
            required
            rows={4}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--ink-1)]"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60"
          style={{ color: "var(--on-accent)" }}
        >
          {status === "sending" ? labels.sending : labels.submit}
        </button>
        {status === "sent" ? <p className="text-sm text-[var(--ok)]">{labels.sent}</p> : null}
        {status === "error" ? <p className="text-sm text-[var(--warn)]">{errorText}</p> : null}
      </form>
    </section>
  );
}
