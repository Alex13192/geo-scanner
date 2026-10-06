# Operating the site

## The paid audit was withdrawn (4 October 2026)

The site sold one thing: a one-time manual GEO audit at USD 199, ordered by email, with no
checkout. It is no longer offered, and this file no longer describes a process, because the
version it replaces documented a service the site does not provide - which was the one thing
that version said was worse than saying nothing:

> If you change the process, change those pages in the same commit. A page that describes a
> process you do not run is worse than a page that says nothing, because the customer and any
> reviewer will rely on it.

What went with it, in the same change:

- `/pricing/`, `/refund/` and `/withdrawal/` were deleted. They promised the audit, the refund
  commitment and the EU/UK withdrawal notice, and none of the three has a subject once there is
  nothing to buy.
- `lib/legal-entity.ts` was deleted with them. Its only consumer was the withdrawal notice, and
  the operator's name existed solely to make that notice addressable.
- `/privacy/` and `/terms/` were edited. Their paragraphs about payment providers, about
  performance of a contract, and about the consumer right of withdrawal described a transaction
  that cannot happen, and a privacy policy that describes processing you do not carry out is the
  same failure as a process page for a process you do not run.
- `/contact/` lost its "request an audit" route, and `/about/` lost the sentence offering one.
- The three URLs 301 to `/` from `middleware.ts`. They were published in the sitemap and may be
  indexed, and a 404 throws away whatever they hold.

`/privacy/`, `/terms/` and `/contact/` remain. The free scanner still needs a reachable privacy
policy for the advertising that funds it.

## Bringing it back

The full process - the five email steps, the scope note, the model withdrawal form, and the
merchant-of-record analysis for EU VAT - is in this file's history:

```bash
git log --follow -- OPERATIONS.md
```

Two things to settle first. Both are recorded there, and both are still true:

- **EU VAT was never resolved.** A merchant of record (Paddle, Creem, Lemon Squeezy) handles it;
  a Stripe payment link or a PayPal invoice leaves the registration obligation with the operator,
  in every member state sold into.
- **Consumer sales in the EU can require notices this repository cannot hold.** An Impressum
  means a postal address; a postal address means making this repository private first, because
  anything committed here is published whether or not a page renders it. That was the note in
  `lib/legal-entity.ts`, and it is why that file carried no address.

## The site returns 1102 after a deploy (4 October 2026)

**Symptom.** Opening a page shows Cloudflare's `Worker exceeded resource limits` page. It is
intermittent, it clears on its own, and it is most likely in the minutes after a deployment.

**Cause, confirmed rather than guessed.** Every page view invokes the Worker and boots the
Next.js runtime, because `.open-next/assets` contains no prerendered HTML - only `_next/`,
`public/` and `_headers`. This account is on the Workers **Free** plan, whose CPU budget is
**10 ms per invocation and cannot be raised**. A cold isolate needs longer than that to start
the Next.js runtime, and a deployment discards every warm isolate at once. Static assets are
not part of this: they are served from the assets binding without invoking the Worker, which
is why the legacy-host redirect in `middleware.ts` does not apply to them.

**What is NOT established: whether a Cache Rule can stop the Worker being invoked.** The
comment above `headers()` in `next.config.ts` predicted this outcome and named that as the
fix, and it may be right - but it has not been demonstrated on this route, and the instrument
that comment named does not work here. Measured against the deployed site: a response from
this Worker carries **no `cf-cache-status` at all** - not `HIT`, not `MISS`, not `DYNAMIC` -
and no `age` or `etag` either, while `x-opennext: 1` and `x-nextjs-cache: MISS` are present on
every request. So `check-live.mjs` cannot report whether the edge is caching, and an
instruction to look there for a `2nd HIT` is wrong. That instruction was written here first
and is the reason this paragraph exists.

**What the edge does per page view**, from `Server-Timing` on the deployed site:
`cfEdge;dur=205, cfOrigin;dur=0, cfWorker;dur=272` on a cold request, then `cfEdge;dur=9,
cfWorker;dur=93` on the next one. `cfOrigin;dur=0` is the part that matters: there is no
origin behind this, the Worker is the origin.

### The fix that is certain

Workers Paid is USD 5 a month and raises the CPU budget from 10 ms to 30 seconds, at which
point no cold start approaches it. It needs no code change, no Cache Rule and no verification:
the limit being exceeded stops being 10 ms. In the dashboard it is under **Workers & Pages ->
Plans**, which is also where the account is shown to be on Free.

**It is not the zone plan, and this is worth stating because the mistake is the obvious one.**
The domain's own Plans page offers Free, Pro at USD 20 and Business at USD 200, and Workers
Paid appears nowhere on it - it is a separate subscription on the Workers side. Following the
instruction above from the domain rather than from Workers & Pages lands on a page whose
cheapest paid tier is four times the actual fix, which is enough to make somebody decide the
fix is not worth it for the wrong reason.

This is the recommendation rather than the rule below, on the ground that a fix nobody can
confirm is not a fix. The site carries advertising, so the comparison is between that plan and
showing a viewer an error page instead of the site.

### The Cache Rule, which is still worth adding

It is what `next.config.ts` already intends, and it is the correct setting for content that is
identical for every visitor - but treat it as a latency and bandwidth improvement rather than
as the remedy for the 1102s, until somebody measures otherwise.

Note that this is a **zone** setting. It lives under the domain's own sidebar, not under
Workers & Pages, which is where the Worker's settings are and where it is natural to look
first. Looking in the wrong one costs a round trip.

Cloudflare dashboard, on the `llmention-geo.com` zone: **Caching -> Cache Rules -> Create rule**.

Expression (switch the builder to "Edit expression"):

```
(http.host eq "llmention-geo.com" and not starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/report"))
```

- Cache eligibility: **Eligible for cache**
- Edge TTL: **Use cache-control header if present, bypass cache if not**

**Do not choose "Ignore cache-control and use this TTL".** That overrides the `no-store` that
`next.config.ts` sets on `/report/` and `/api/`, and `/report/` is generated per request from
the visitor's own domain. Caching one visitor's scan and serving it to the next is a
correctness bug, not a performance trade - which is why the comment there records that
`/report/` was "one platform behaviour away from being cached for a year".

### Follow-up, 6 October 2026: that Cache Rule cannot work, and what can

**The rule described above is inert.** It was created in the dashboard, and the site still invoked
the Worker on every page view. Measured on the deployed site, twice per route, on both hostnames:

| request | `cf-cache-status` | Worker ran? |
| --- | --- | --- |
| `/_next/static/*.css`, `*.js` | `HIT` | no |
| `/`, a `/checks/` page, the legacy hostname | absent | **yes, every time** |

`x-opennext: 1` and `Server-Timing: cfEdge;dur=9,cfOrigin;dur=0,cfWorker;dur=78` are the evidence
that the Worker ran. The absence of `cf-cache-status` is what a Worker-produced response looks like
here - so the instrument this section previously called unusable is usable for **assets** and
misleading for **pages**.

**Why the rule cannot work**, quoted from Cloudflare's documentation rather than inferred:

- "When a request arrives, it hits the Worker before the cache is checked."
- "When using cache rules with Workers, the cache rule must match the properties of the URL in the
  `fetch()` request - not the original visitor URL/host. Otherwise, the rule will not be applied."
  This Worker generates its responses and fetches no origin, so there is no `fetch()` for a rule to
  match.
- And decisively: "**No zone configuration for caching applies to Workers Caching.** Cache Rules,
  Cache Response Rules, Page Rules, cache level settings... have no effect on a Worker's cache."

**What was done instead**: `"cache": { "enabled": true }` in `wrangler.jsonc` - Workers Cache,
released 3 October 2026. A cache hit returns the response *without running the Worker*, so it consumes
no CPU and cannot produce a 1102. It is configured per Worker and lives in this repository, so there
is no dashboard state to keep in sync.

**It worked, and it was turned off the same day, because it broke the old hostname.** The cache key is
"the request path, entrypoint, `ctx.props`, and (by default) the Worker version, **not by hostname**".
This Worker answers on two hostnames and one of them must redirect, so a request for `/` on
`geo-scanner.ccie13192.com` was served from the entry cached for `/` on `llmention-geo.com`: the Worker
never ran, `middleware.ts` never saw the Host header, and the 301 became a 200 carrying the canonical
page on both hostnames.

**The smoke job caught it, and it is the only gate that could have.** `Deploy to Cloudflare Workers`
reported success; `scripts/check-live.mjs` reported `FAIL geo-scanner.ccie13192.com/ does not redirect
permanently — HTTP 200`. Every other check in this workflow inspects local build output, where the
redirect is a line of middleware that looks correct.

Measured while it was on: `/` and `/methodology/` returned `cf-cache-status: HIT` on the first and
second request with the Worker not running - the mechanism does what it claims. (Also measured, and
worth keeping: `/methodology/` sends **no** `Cache-Control` at all, so heuristic freshness gave it a
two-hour TTL. The pre-flight audit for enabling caching had missed that route.)

**Why off rather than fixed**: the account moved to Workers Paid on 6 October 2026, so the 10 ms CPU
ceiling this cache worked around no longer applies. It was the free alternative to that purchase, and
the purchase happened. Two untested candidates are recorded in `wrangler.jsonc` for the day it is
wanted back - a zone Redirect Rule outside the Worker, or `Vary: Host` appended to Next's own `Vary`.

**Checked before switching it on**, because a response with no `Cache-Control` is still cached
heuristically - a `200` for two hours. Every GET route was measured and each sets a directive:
`/api/scan` and `/api/llms-txt` are `no-store`, `/report/` and `/monitor/report/<token>/` are
`no-store` and `private`, the content pages carry `s-maxage`. Nothing that must not be cached would
have been cached by this change.

**Still true, and not fixed by caching**: the Free plan's 10 ms CPU ceiling, and the weekly cron
trigger's 10 ms budget. The cache removes the page-view cliff; Workers Paid remains the fix for the
cron and for the first request after each deployment - which is a cache miss by design, because the
Worker version is part of the cache key.

## The weekly report's first run (5 October 2026)

Step 0 of the subscription work went live on this date: /monitor/, D1, a queue, and a second
Worker that scans every confirmed domain once a week. The notes worth keeping are the ones that
cost time to find rather than the ones that were obvious.

### The two Workers deploy by different paths, and one of them was missing

`cron/` is a second wrangler config. `deploy.yml` knew nothing about it until the day this
shipped, so a merge would have deployed the site and not the runner - and that failure is
completely silent. /monitor/ renders, the form posts, the confirmation email arrives, the
subscriber is written to D1 and confirmed. No report is ever sent. Nothing errors anywhere,
because nothing is broken; the worker that sends it was simply never uploaded. The only symptom
is an absence, and absences are not reported by anybody.

`verify.yml` did not build it either, so a bad import or an unresolvable binding would have
reached production unchallenged. Both are now steps in those files.

### There is no button that runs a cron Worker once

The dashboard shows the schedule under Triggers as text. It is not clickable, and Settings ->
Trigger Events does not offer a manual run either. To exercise the runner outside its schedule:

    edit cron/wrangler.jsonc    "0 3 * * 1"  ->  "*/5 * * * *"
    npx wrangler deploy -c cron/wrangler.jsonc
    wait ten minutes - it fires on :00/:05/:10, so reverting sooner than that does nothing
    edit it back, then DEPLOY the revert

THE REVERT HAS TO BE DEPLOYED. Editing the file alone leaves the live schedule at every five
minutes, and the symptom is not an error - it is a slow drip of duplicate report emails, two per
subscriber per run, which is also how the free Resend allowance gets spent.

### The database is the log

Workers Logs and Workers Traces are disabled on both Workers and may not be available on this
plan. Nothing about the product depends on them: every run writes a row to `scans` and updates
`subscribers.last_score`, so a run can be confirmed from outside by counting rows rather than by
reading logs. That is how the first successful run was verified - two rows, 97/A, 38 of 40,
failing exactly `markdown-alternate` and `hreflang`, which is what the homepage's own SELF_AUDIT
constant records. The weekly scan and a manual scan agreeing is the promise /monitor/ makes, and
that agreement is itself checkable from the database.

The second run is worth having too. With a previous scan present, the same unchanged site
produced the subject `llmention-geo.com: 97/100 (A) - no change`, which is the diff path
exercised for real rather than assumed.

### Still open

Bounces. `markBounced` exists in lib/db/subscribers.ts and nothing calls it, because a bounce
arrives from the provider as a webhook and no webhook is connected. Until one is, an address that
stops existing stays `pending` or `confirmed` and is retried every week. The refusal to send
without an unsubscribe token is deliberate and unrelated to this.

### A cron schedule that would not change (5 October 2026)

Found the hard way, and the symptom is what makes it worth writing down: the dashboard showed the
correct schedule while the wrong one kept executing.

The runner was put on `*/5 * * * *` to exercise it once, then changed back to `0 3 * * 1` and
deployed. `wrangler deploy` printed `schedule: 0 3 * * 1`, and the Worker's Settings -> Triggers
page showed `At 03:00 AM on Sunday` with a next-run of the following Sunday. It kept firing every
five minutes anyway - `scans` grew by two rows every five minutes, at :10, :15, :20, :25 and so on,
across two further deploys that each reported success for the report-worker step and each printed
the correct schedule.

WHAT ACTUALLY FIXED IT was deleting the trigger in the dashboard, confirming the runs stopped, and
deploying again. The re-deployed trigger does not fire early - checked by counting `scans` six
minutes later, which is the only check that means anything here. Reading the deploy output, or the
settings page, or the deployment history, all said it was already correct.

WHAT IS NOT ESTABLISHED: why. Both later deploys may have updated the displayed configuration
without replacing the registered trigger, or the platform may have kept serving a stale schedule.
The evidence is consistent with either and does not distinguish them, so this records the fix and
the symptom rather than a mechanism nobody has proved.

THE PROCESS LESSON IS THE USEFUL PART. Temporarily changing a live schedule to test a cron job
means three state changes that must all land - edit, deploy, and later edit back and deploy again -
and a failure of the last one is invisible in every place a person would look. The symptoms are
duplicate emails and a spent sending allowance, not an error. If this has to be done again, prefer
a mechanism that cannot get stuck: a guarded endpoint that runs one pass on demand, or accepting
the wait for the real schedule.