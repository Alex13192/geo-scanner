/**
 * The weekly report runner.
 *
 * A second Worker, and this is the first half of it: the scheduled handler that decides what
 * needs scanning. The queue consumer that does the scanning comes next, and the shape of the
 * two is already fixed by a measurement rather than by taste.
 *
 * WHY THE WORK IS SPLIT ACROSS INVOCATIONS AT ALL. One scan measures 1-2.6 ms of CPU on
 * workerd, which fits the Free plan's 10 ms budget. A loop over a hundred subscribers does
 * not - it is 100-260 ms in a single invocation, twenty times over budget. So the scheduled
 * handler must not scan anything: its job is to enumerate and enqueue, one message per
 * domain, and each message is then handled by its own invocation with its own budget.
 *
 * That is not an optimisation to apply later. A cron that loops over subscribers works
 * perfectly until the hundredth one and then fails in production, at three in the morning,
 * for the person who signed up last.
 */
import { listConfirmed, type Subscriber } from "../lib/db/subscribers";

/**
 * A message is an id, not a row.
 *
 * Passing the whole subscriber would mean the consumer acts on a snapshot taken minutes
 * earlier - so somebody who unsubscribes between the two steps would still be emailed. The
 * consumer re-reads by id and re-checks the status, which costs one query and removes that
 * entire class of race.
 */
export type ReportJob = {
  subscriberId: string;
};

/** Bounded so one invocation cannot be asked to enqueue an unbounded number of messages. */
const BATCH = 200;

/**
 * The slice of the Queues API this uses, declared rather than imported.
 *
 * The same trade cloudflare-env.d.ts documents for D1: the only source of the real `Queue<T>`
 * type also drags in workerd's global type set, which redeclares Response and breaks twelve
 * existing lines elsewhere in the project. A structurally declared subset keeps this file
 * checked - a wrong method name is a compile error - at the cost of adding members here when
 * a Queues feature is first used.
 */
type ReportQueue = {
  sendBatch(messages: { body: ReportJob }[]): Promise<void>;
};

export default {
  /*
   * `_event` is unknown and `ctx` is not taken, rather than typed with ScheduledController
   * and ExecutionContext. Both are workerd globals this project does not declare, and neither
   * is used here: the handler reads a binding and writes a binding, and nothing needs to
   * outlive the response.
   */
  async scheduled(_event: unknown, env: CloudflareEnv) {
    const due = await listConfirmed(env.DB, BATCH);

    console.log(`[reports] ${due.length} confirmed subscription(s) due`);

    if (due.length === 0) return;

    /*
     * The queue binding does not exist yet, so this reports what it would enqueue. Written as
     * a visible branch rather than as a `TODO` because the next increment is defined by it:
     * the moment REPORT_QUEUE is declared in wrangler.jsonc, the other side of this `if` is
     * the whole of the remaining producer work.
     */
    const queue = (env as CloudflareEnv & { REPORT_QUEUE?: ReportQueue }).REPORT_QUEUE;

    if (!queue) {
      console.log(
        `[reports] no queue bound yet; would enqueue ${due.length}: ` +
          due.map((s: Subscriber) => `${s.domain} <${s.email}>`).join(", ")
      );
      return;
    }

    await queue.sendBatch(due.map((s) => ({ body: { subscriberId: s.id } })));

    console.log(`[reports] enqueued ${due.length}`);
  },
};
