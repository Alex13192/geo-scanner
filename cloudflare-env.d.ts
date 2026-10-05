/*
 * Cloudflare bindings, declared by hand. This file is NOT generated, and that is the point.
 *
 * WHY NOT `npm run cf-typegen`, WHICH USED TO BE THE ANSWER. That script runs
 * `wrangler types`, and there are only two things it can produce here, both measured:
 *
 *   --include-runtime (the default)  `D1Database` resolves, and so does workerd's whole
 *                                    runtime type set - which redeclares the global
 *                                    Response and Body interfaces. Response.json() stops
 *                                    returning `any` and starts returning `unknown`, and
 *                                    that turns twelve lines across StudioWidget.tsx and
 *                                    BadgeWidget.tsx into type errors. A generator whose
 *                                    output fails the build's own type step is not a
 *                                    convenience. (The script has been removed for this
 *                                    reason; see package.json.)
 *
 *   --include-runtime=false          Nothing breaks, and `D1Database` resolves to nothing
 *                                    either, so `env.DB` is `any`. A binding typed `any`
 *                                    is worse than no annotation, because it looks checked.
 *
 * THE THIRD OPTION, WHICH IS WHAT THIS FILE DOES: declare the slice of D1 this project
 * actually calls, structurally. No global runtime types, no `any`, and every statement the
 * data layer writes is still checked - a typo in a method name is a compile error here,
 * which is the property the second option silently loses.
 *
 * WHAT IT GIVES UP, stated rather than discovered later: it is a hand-written subset, so a
 * D1 feature this project starts using has to be added below before it typechecks. That is
 * the honest cost of not adopting a type set that conflicts with the DOM lib, and it is
 * smaller than either alternative above.
 *
 * WHEN A BINDING IS ADDED TO wrangler.jsonc, ADD IT HERE TOO.
 */

/** Only the members the data layer uses. Extend deliberately, not speculatively. */
interface D1ResultLike<T> {
  results: T[];
  success: boolean;
  meta: { changes?: number; last_row_id?: number };
}

interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1ResultLike<T>>;
  run(): Promise<D1ResultLike<never>>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<D1ResultLike<T>[]>;
}

interface CloudflareEnv {
  /** Subscribers and scan history. Schema in migrations/. */
  DB: D1DatabaseLike;

  /**
   * "production" on a deployed Worker, something else under `wrangler dev`.
   *
   * Set by the OpenNext adapter, and it is the only reliable way to tell a local run from a
   * real one: NODE_ENV is "production" inside the Worker even during local development,
   * which is why lib/email/send.ts reads this instead.
   */
  NEXTJS_ENV: string;

  /**
   * The sending credential, and the from-address it is allowed to use.
   *
   * BOTH ARE OPTIONAL AND THAT IS LOAD-BEARING. The provider has not been chosen yet - see
   * the header of lib/email/send.ts - and the subscription flow is expected to work before
   * it is: without a key, mail goes to the console in development, and the endpoints report
   * a failure in production rather than pretending to have sent something.
   */
  RESEND_API_KEY?: string;

  /**
   * The `whsec_...` value Resend shows when a webhook is created.
   *
   * Optional for the same reason RESEND_API_KEY is, and with the same failure direction: with no
   * secret configured the webhook endpoint REFUSES every delivery rather than accepting them.
   * Failing open there would leave a public endpoint that anyone can use to mark arbitrary
   * subscribers as bounced, which is worse than not having the endpoint at all.
   */
  RESEND_WEBHOOK_SECRET?: string;

  /**
   * Guards the report Worker's on-demand run. Set with `wrangler secret put` on
   * geo-scanner-reports only.
   *
   * Optional, and the endpoint fails closed without it: no secret means every request gets the
   * same 404 the Worker returned before the route existed, rather than an open trigger that can
   * enqueue a report for every subscriber.
   */
  MANUAL_TRIGGER_SECRET?: string;
  EMAIL_FROM?: string;
}
