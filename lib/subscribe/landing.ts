/**
 * What clicking the confirmation link actually does, as a function that can be tested.
 *
 * WHY THIS IS NOT IN THE ROUTE. app/api/subscribe/confirm/route.ts used to hold every branch of
 * this decision inline, which made the one thing that matters here - that confirming a
 * subscription lands the reader on THEIR report - impossible to test without a Worker, a D1
 * binding and a request. The route now does three things: read the query string, rate limit, and
 * hand the token to this function. Everything about what comes back is decided here, where
 * scripts/test-report-link.mts can drive it with a fake database and assert on the returned
 * response. A redirect nobody tests is a redirect that silently breaks, and this one is the whole
 * point of the confirmation email.
 *
 * WHY A REDIRECT RATHER THAN A SUCCESS PAGE WITH A BUTTON ON IT. The competitor this mechanism is
 * borrowed from replays the visitor's own input after they authenticate - the action they already
 * took is not wasted and they do not have to take it twice. There is no account here, so the
 * equivalent is: they gave an address, they clicked the link in the message, and the thing they
 * asked for opens. A "You are subscribed" page that leaves them to find the report is the same
 * deferred intent with the last step removed.
 *
 * WHY IT IS A 303 RATHER THAN A 302, on a GET: the distinction is about what a client should do
 * next rather than about caching here, and 303 is the code whose meaning is exactly "the answer to
 * this request is somewhere else, fetch it with GET". It is also the code that behaves correctly
 * if a link scanner or a proxy repeats the request.
 *
 * WHY THE TOKEN IS TAKEN FROM THE ROW RATHER THAN FROM THE QUERY. The link carries confirm_token.
 * The report page is addressed by report_token. They are different secrets on purpose (see
 * migrations/0002_report_token.sql): the confirm token is consumed and stays in the message
 * archive, while the report token has to keep working every week and is the one that gets
 * forwarded. Handing the confirm token to the report page would either publish the token that
 * confirms a subscription, or break the moment the confirm token is rotated - so the redirect
 * target is read out of the row this request just confirmed.
 *
 * THE TWO BRANCHES THAT DO NOT REDIRECT, and why each stays a page instead. A subscription that
 * has been unsubscribed must not be sent to a live report: the link would then work for somebody
 * who ended it, which is the same mistake confirmByToken's status filter exists to prevent. A
 * token that resolves to nothing has nothing to show. Both are answered with the sentence that
 * explains which of them happened, because the reader clicked a link and deserves to know why
 * they are not where they expected.
 */
import { confirmByToken } from "../db/subscribers.ts";
import { linkPage, reportUrl } from "./flow.ts";

/**
 * A subscription write fails at this point exactly one way that the reader can act on.
 *
 * confirmByToken reads the row and then updates it. If the read succeeds and the update is
 * refused - a database that has gone read-only, a quota, a network blip - the person is left
 * holding a confirmation link that did not confirm anything. Reporting that as "this link is not
 * recognised" would be a false statement about a valid link, and it would send somebody to sign up
 * again on top of a row that may well confirm on the next attempt.
 */
export type ConfirmOutcome =
  | { ok: true; response: Response }
  | { ok: false; reason: "not_found" | "unsubscribed" | "database" };

/** The subscriber fields this decision reads. Deliberately narrower than the row. */
export type ConfirmableSubscriber = {
  domain: string;
  status: string;
  report_token?: string;
};

/**
 * Confirm one token, and say what the reader should be shown or sent to.
 *
 * `now` is a parameter rather than a call to Date.now() inside, for the same reason
 * lib/monitor/report.ts takes its rows rather than querying: a function with a clock in it cannot
 * be tested at a fixed moment.
 */
export async function confirmSubscription(
  db: D1DatabaseLike,
  token: string,
  now: number
): Promise<ConfirmOutcome> {
  let subscriber;
  try {
    subscriber = await confirmByToken(db, token, now);
  } catch (err) {
    console.error(`[confirm] the lookup or the update failed: ${(err as Error).message}`);
    return { ok: false, reason: "database" };
  }

  if (!subscriber) return { ok: false, reason: "not_found" };
  if (subscriber.status === "unsubscribed") return { ok: false, reason: "unsubscribed" };

  /*
   * A confirmed row always has a report token: the subscribe route writes the two in the same
   * statement, and the migration backfills every row that predates the column. So this is a
   * schema-drift guard rather than an expected state, and it is handled by falling back to a page
   * rather than by redirecting to a URL that would 404. The reader is told what happened and
   * given the one link that does work.
   */
  const report = subscriber.report_token ? reportUrl(subscriber.report_token) : "";
  const domain = escapeHtml(subscriber.domain);

  if (!report) {
    console.error(`[confirm] ${subscriber.domain} is confirmed but has no report token`);
    return {
      ok: true,
      response: linkPage({
        title: "Subscription confirmed",
        heading: "You are subscribed",
        body:
          `The weekly report for <strong>${domain}</strong> starts on the next run. ` +
          "Every report carries a one-click unsubscribe link.",
      }),
    };
  }

  return {
    ok: true,
    response: linkPage({
      title: "Subscription confirmed",
      heading: "You are subscribed",
      body:
        `The weekly report for <strong>${domain}</strong> starts on the next run, and the report ` +
        `page for it is yours to keep and to forward - it needs no login and no domain typed. ` +
        `The first weekly run records the baseline, so until it has run the page says nothing has ` +
        `been measured yet rather than showing a zero. Every report carries a one-click ` +
        `unsubscribe link.`,
      action: { label: `Open the report for ${escapeHtml(subscriber.domain)}`, url: report },
    }),
  };
}

/** The domain comes from a database row a visitor wrote, so it is escaped before it is markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
