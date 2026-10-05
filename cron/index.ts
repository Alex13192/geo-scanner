/**
 * The weekly report runner: a producer that decides what to scan, and a consumer that scans it.
 *
 * WHY THIS IS A SECOND WORKER RATHER THAN A scheduled() EXPORT ON THE SITE'S. The site's worker
 * imports the entire Next.js server at module scope, so any isolate it starts pays for the
 * framework whatever the request was. A scan measures 1-2.6 ms of actual work on workerd
 * against a 10 ms CPU budget, and the framework costs several times that before the work
 * starts. This Worker is 5.86 KiB gzip against the site's 1.14 MB.
 *
 * WHY THE WORK IS SPLIT ACROSS INVOCATIONS. One scan fits the budget; a loop over a hundred
 * does not - 100-260 ms in one invocation, twenty times over. So `scheduled` enumerates and
 * enqueues one message per subscriber, and each message gets its own invocation and its own
 * budget. A cron that loops over subscribers works perfectly until the hundredth one and then
 * fails at three in the morning for whoever signed up last.
 */
import {
  getById,
  latestScan,
  listConfirmed,
  recordScan,
  type Subscriber,
} from "../lib/db/subscribers.ts";
import { reportEmail } from "../lib/email/messages.ts";
import { sendEmail } from "../lib/email/send.ts";
import { runScan } from "../lib/geo/scan.ts";
import { unsubscribeUrl } from "../lib/subscribe/flow.ts";
import { newId, tokensMatch } from "../lib/subscribe/tokens.ts";

/**
 * A message is an id, not a row.
 *
 * Passing the whole subscriber would mean the consumer acts on a snapshot taken minutes
 * earlier - so somebody who unsubscribes in between still gets emailed. The consumer re-reads
 * by id and re-checks the status, which costs one query and removes that whole class of race.
 */
export type ReportJob = { subscriberId: string };

/** Bounded so one invocation cannot be asked to enqueue an unbounded number of messages. */
const BATCH = 200;

/*
 * The slices of the Queues API this file uses, declared rather than imported.
 *
 * The same trade cloudflare-env.d.ts documents for D1: the only source of the real types also
 * drags in workerd's global type set, which redeclares Response and breaks twelve existing
 * lines elsewhere in the project. Declaring the subset keeps this file checked - a wrong method
 * name is a compile error - at the cost of adding members here when a feature is first used.
 */
type ReportQueue = { sendBatch(messages: { body: ReportJob }[]): Promise<void> };
type ReportMessage = { body: ReportJob; ack(): void; retry(): void };
type ReportBatch = { queue: string; messages: ReportMessage[] };

type CronEnv = CloudflareEnv & { REPORT_QUEUE?: ReportQueue };

/** Titles for a set of ids, taken from this run's catalogue. Ids are what gets stored. */
function titlesFor(checks: { id: string; title: string }[], ids: string[]): string[] {
  const byId = new Map(checks.map((c) => [c.id, c.title]));
  return ids.map((id) => byId.get(id) ?? id);
}

/**
 * Enumerate what is due and enqueue one message per subscriber.
 *
 * Extracted from the scheduled handler so the manual trigger below can run exactly the same
 * thing. A second copy for the manual path would be a second answer to "who is due", and the two
 * would drift - which is the whole reason the scan sequence lives in lib/geo/scan.ts instead of
 * in the route.
 */
async function runProducer(env: CronEnv): Promise<{ due: number; enqueued: number }> {
  const due = await listConfirmed(env.DB, BATCH);

  if (due.length === 0) {
    console.log("[reports] nothing due");
    return { due: 0, enqueued: 0 };
  }

  if (!env.REPORT_QUEUE) {
    /*
     * Logged as an error rather than quietly skipped. Without the binding every subscriber
     * simply stops receiving reports, and the only symptom would be their absence - which
     * nobody reports and no check catches.
     */
    console.error(`[reports] REPORT_QUEUE is not bound; ${due.length} subscription(s) skipped`);
    return { due: due.length, enqueued: 0 };
  }

  await env.REPORT_QUEUE.sendBatch(due.map((s: Subscriber) => ({ body: { subscriberId: s.id } })));
  console.log(`[reports] enqueued ${due.length}`);
  return { due: due.length, enqueued: due.length };
}

export default {
  /**
   * `_event` is unknown rather than ScheduledController, and `ctx` is not taken: both are
   * workerd globals this project does not declare, and neither is used. The handler reads a
   * binding and writes a binding, and nothing needs to outlive the invocation.
   */
  async scheduled(_event: unknown, env: CronEnv) {
    await runProducer(env);
  },

  /**
   * One message, one domain, one scan.
   *
   * Acked explicitly rather than by returning, because "do not retry" and "this failed" are
   * different decisions. A domain that is down at three in the morning is not worth three more
   * attempts; a database that refused a write is.
   */
  async queue(batch: ReportBatch, env: CronEnv) {
    for (const item of batch.messages) {
      const subscriber = await getById(env.DB, item.body.subscriberId);

      /*
       * THE RE-CHECK, and the reason the message carries an id rather than a row. Somebody who
       * unsubscribed in the minutes since the batch was built must not be emailed, and the only
       * way to know that is to look now instead of trusting the snapshot.
       */
      if (!subscriber) {
        console.log(`[reports] ${item.body.subscriberId} no longer exists; skipping`);
        item.ack();
        continue;
      }
      if (subscriber.status !== "confirmed") {
        console.log(`[reports] ${subscriber.domain} is ${subscriber.status}; skipping`);
        item.ack();
        continue;
      }
      if (!subscriber.unsub_token) {
        /*
         * Refuses to send rather than sending without a working unsubscribe link. Every message
         * this product sends has to carry one, and an email that cannot be stopped is worse
         * than an email that was never sent - so this is logged and skipped, and it means the
         * SELECT and the template have drifted apart.
         */
        console.error(`[reports] ${subscriber.domain} has no unsubscribe token; not sending`);
        item.ack();
        continue;
      }

      const scan = await runScan(subscriber.domain);

      if (!scan.reachable) {
        /*
         * No email for an unreachable domain. "We could not reach your site" is not a GEO
         * finding, and sending it every week to somebody whose site is simply down would train
         * them to ignore the reports that matter. Acked rather than retried: the next scheduled
         * run tries again, and three retries tonight would not.
         */
        console.log(`[reports] ${subscriber.domain} was unreachable; no email sent`);
        item.ack();
        continue;
      }

      const failedIds = scan.result.checks.filter((c) => c.status === "fail").map((c) => c.id);
      const previous = await latestScan(env.DB, subscriber.id);
      const previousIds = previous ? (JSON.parse(previous.failed_check_ids) as string[]) : null;

      const previousSet = new Set(previousIds ?? []);
      const currentSet = new Set(failedIds);

      // `null` means there is no previous run, which is not the same as a previous run that
      // failed nothing - so both sides of the comparison are guarded rather than defaulted.
      const newFailureIds = previousIds ? failedIds.filter((id) => !previousSet.has(id)) : [];
      const fixedIds = previousIds ? previousIds.filter((id) => !currentSet.has(id)) : [];
      const unchangedFailures = previousIds
        ? failedIds.filter((id) => previousSet.has(id)).length
        : failedIds.length;

      const at = Date.now();

      /*
       * Written before the email, not after. A report describing a run the database has no
       * record of makes next week's comparison wrong, and an email cannot be recalled - so the
       * durable half goes first. If the send then fails the scan is recorded twice on retry,
       * which costs a duplicate row; the other order costs a subscriber a week of history.
       */
      await recordScan(env.DB, {
        id: newId(),
        subscriberId: subscriber.id,
        at,
        score: scan.result.score,
        grade: scan.result.grade,
        checksPassed: scan.result.checksPassed,
        checksRun: scan.result.checksRun,
        failedCheckIds: failedIds,
      });

      const report = reportEmail({
        domain: subscriber.domain,
        score: scan.result.score,
        grade: scan.result.grade,
        checksPassed: scan.result.checksPassed,
        checksRun: scan.result.checksRun,
        fixed: titlesFor(scan.result.checks, fixedIds),
        newFailures: titlesFor(scan.result.checks, newFailureIds),
        unchangedFailures,
        firstRun: previousIds === null,
        // The domain's own homepage, not our report page: the reader's next question is what
        // the site looks like now, and the full check list is one click from there.
        reportUrl: `https://${subscriber.domain}/`,
        unsubUrl: unsubscribeUrl(subscriber.unsub_token),
      });

      const sent = await sendEmail(env, { ...report, to: subscriber.email });

      if (!sent.ok) {
        console.error(`[reports] send failed for ${subscriber.domain}: ${sent.reason}`);
        /*
         * Retried rather than acked. The scan is already recorded, so a retry re-sends the
         * report instead of re-scanning and duplicating a week - and a duplicate email is a far
         * cheaper mistake than a subscriber who silently stops hearing from the product.
         */
        item.retry();
        continue;
      }

      console.log(
        `[reports] ${subscriber.domain}: ${scan.result.score} (${scan.result.grade}) via ${sent.via}`
      );
      item.ack();
    }
  },

  /**
   * A guarded way to run one pass on demand.
   *
   * WHY THIS EXISTS, in the words of the incident that produced it. Exercising the runner
   * outside its schedule used to mean temporarily editing the cron to every five minutes,
   * deploying, waiting, editing back and deploying again - three state changes that all have to
   * land, where a failure of the last one is invisible in every place a person would look. It
   * failed exactly that way: the dashboard and `wrangler deploy` both reported `0 3 * * 1` while
   * the Worker kept firing every five minutes, and the only symptom was duplicate report emails
   * and a spent sending allowance. See OPERATIONS.md.
   *
   * This cannot get stuck. It changes no state and leaves nothing to remember.
   *
   * WHY 404 RATHER THAN 401. A 401 confirms the endpoint exists and is worth attacking; a 404 is
   * also exactly what this Worker returned before the route existed, so a prober learns nothing
   * either way.
   *
   * WHY IT FAILS CLOSED ON A MISSING SECRET, like the Resend webhook: the tempting alternative is
   * to allow everything until a secret is configured, which means the endpoint is open for
   * exactly as long as nobody remembers to set it.
   *
   * The comparison is constant-time for the same reason the tokens in lib/subscribe/tokens.ts
   * are: the caller controls the input and can measure the reply, and `===` exits at the first
   * differing byte.
   */
  async fetch(request: Request, env: CronEnv) {
    const secret = env.MANUAL_TRIGGER_SECRET;
    const provided = request.headers.get("x-manual-trigger");

    if (!secret || !provided || !tokensMatch(provided, secret)) {
      return new Response("This worker runs on a schedule and has no pages.", { status: 404 });
    }

    const result = await runProducer(env);

    /*
     * The counts are returned rather than only logged. The point of this endpoint is to answer
     * "did it work" from outside, and Workers Logs are disabled on this plan - so a response that
     * said only "ok" would leave the caller exactly where they started.
     */
    return Response.json({ ran: "producer", ...result });
  },
};
