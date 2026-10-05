"use client";

import { useEffect, useState } from "react";

/**
 * The client half of a report link: fetch the history and draw it, or say why it could not.
 *
 * WHY THE FETCH IS HERE AND NOT IN THE PAGE. Every read of D1 in this project happens in a route
 * handler - see the note in the route. The page around this widget is server-rendered prose so that
 * the route is a document rather than a spinner, which is the mistake /llms-txt-studio/ made once
 * and check-built-pages now catches.
 *
 * WHY FAILURE IS A FIRST-CLASS STATE, AND WHY A 404 IS NOT AN ERROR MESSAGE. A report link that
 * stops working has exactly one ordinary cause: the subscription ended, or it was never confirmed.
 * Showing "Something went wrong" there would send somebody to support for something that is working
 * as intended, so a 404 gets its own sentence and its own next step.
 */

type HistoryPoint = {
  at: string;
  score: number;
  grade: string;
  checksPassed: number;
  checksRun: number;
  failed: number;
};

type FailingCheck = {
  id: string;
  title: string;
  fix: string;
  ruleUrl: string;
  failingSince: string;
  failedRuns: number;
};

type Payload = {
  domain: string;
  latest: HistoryPoint | null;
  history: HistoryPoint[];
  failing: FailingCheck[];
  runs: number;
  windowFrom: string;
  windowTo: string;
  historyDays: number;
};

type State =
  | { kind: "loading" }
  | { kind: "expired" }
  | { kind: "error"; message: string }
  | { kind: "ready"; payload: Payload };

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function ReportLinkWidget({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/monitor/report/?t=${encodeURIComponent(token)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.status === 404) {
          setState({ kind: "expired" });
          return;
        }
        if (!res.ok) {
          setState({ kind: "error", message: `The report could not be loaded (HTTP ${res.status}).` });
          return;
        }
        setState({ kind: "ready", payload: (await res.json()) as Payload });
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setState({ kind: "error", message: "The report could not be loaded. Check your connection." });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm text-[var(--ink-2)]">
        Reading your scan history…
      </div>
    );
  }

  if (state.kind === "expired") {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-1)]">This link is no longer active</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
          It was issued for a subscription that has since ended, or for one that was never
          confirmed. Subscribe again and a new link is issued; the old one stays inactive, which is
          deliberate, because a link that outlives the subscription it describes is one more copy of
          somebody&apos;s data than they asked for.
        </p>
        <a
          href="/monitor/"
          className="mt-4 inline-block text-sm text-[var(--accent)] hover:opacity-75"
        >
          Subscribe to the weekly report →
        </a>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6 text-sm text-[var(--ink-2)]">
        {state.message}
      </div>
    );
  }

  const { payload } = state;

  if (!payload.latest) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-1)]">
          No scan has run for {payload.domain} yet
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
          The first weekly scan records a baseline, and the report fills in from there. Nothing is
          shown here in the meantime, because a report with no measurement in it is the thing this
          product exists to argue against.
        </p>
      </div>
    );
  }

  const latest = payload.latest;
  const oldest = payload.history[payload.history.length - 1];
  const change = oldest ? latest.score - oldest.score : 0;

  return (
    <div className="space-y-8">
      {/* Current state */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-3)]">
          {payload.domain}
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--ink-1)]">
          {latest.score} / 100
        </p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Grade {latest.grade} · {latest.checksPassed} of {latest.checksRun} checks passing · measured{" "}
          {shortDate(latest.at)}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
          {payload.runs === 1
            ? "This is the baseline scan. A change can only be reported once there is a second one."
            : change === 0
              ? `No change across ${payload.runs} scans since ${shortDate(oldest.at)}.`
              : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} points across ${payload.runs} scans since ${shortDate(oldest.at)}.`}
        </p>
      </div>

      {/* History */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ink-1)]">Week by week</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--ink-3)]">
                <th className="py-2 pr-4 font-medium">Scan</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 font-medium">Grade</th>
                <th className="py-2 pr-4 font-medium">Checks passing</th>
                <th className="py-2 font-medium">Failing</th>
              </tr>
            </thead>
            <tbody className="text-[var(--ink-2)]">
              {payload.history.map((point) => (
                <tr key={point.at} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-4">{shortDate(point.at)}</td>
                  <td className="py-2 pr-4 font-mono">{point.score}</td>
                  <td className="py-2 pr-4">{point.grade}</td>
                  <td className="py-2 pr-4 font-mono">
                    {point.checksPassed}/{point.checksRun}
                  </td>
                  <td className="py-2 font-mono">{point.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--ink-3)]">
          Showing the last {payload.historyDays} days. Scores are as they were reported each week and
          are not recalculated.
        </p>
      </section>

      {/* Failing checks */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ink-1)]">
          {payload.failing.length === 0
            ? "Nothing is failing"
            : `Failing now (${payload.failing.length})`}
        </h2>
        {payload.failing.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
            Every applicable check passed in the most recent scan. The weekly email still arrives,
            because a monitoring report that only appears when something breaks makes its own arrival
            the alarm.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {payload.failing.map((check) => (
              <li
                key={check.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <a
                    href={check.ruleUrl}
                    className="text-sm font-semibold text-[var(--ink-1)] underline decoration-[var(--line)] underline-offset-2 hover:decoration-[var(--ink-2)]"
                  >
                    {check.title}
                  </a>
                  {/*
                    A DATE, NOT A WEEK COUNT. The first version printed Math.floor(days / 7), so a
                    run of thirteen days read as "failing for 1 week" - a number that is arithmetically
                    defensible and misleading to anybody reading it. The date the run started is exact,
                    and the scan count beside it is what shows a check that flaps.
                  */}
                  <span className="font-mono text-xs text-[var(--ink-3)]">
                    failing since {shortDate(check.failingSince)} · {check.failedRuns} of{" "}
                    {payload.runs} scans
                  </span>
                </div>
                {check.fix ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{check.fix}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-[var(--ink-3)]">
        This page reports what the weekly scan recorded: a score, a grade, the check counts and which
        checks failed. It does not measure whether any AI engine mentions or recommends the site —
        see{" "}
        <a href="/monitor/" className="underline">
          what the monitoring does and does not do
        </a>
        . For the full per-scan breakdown, including the evidence each check produced,{" "}
        <a href={`/report/?domain=${encodeURIComponent(payload.domain)}`} className="underline">
          run a live audit of {payload.domain}
        </a>
        .
      </p>
    </div>
  );
}
