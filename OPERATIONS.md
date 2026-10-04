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

**The step that was never completed is edge caching.** The comment above `headers()` in
`next.config.ts` predicted this outcome and named the fix. `check-live.mjs` has been reporting
the evidence all along, as `cf-cache-status: -` on both requests - nothing is cached anywhere.
With the HTML cached at the edge, a repeat page view never reaches the Worker, so it costs no
CPU and cannot return 1102.

### The rule to add

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

### Verifying it

```bash
npm run check:live
```

The last block of that script is labelled "informational, not gated" and prints
`cf-cache-status` for three cacheable paths, twice each. Before the rule it reads
`1st -, 2nd -`. After it, the second request should read `HIT` or `REVALIDATED`. The script is
the instrument for this, which is the reason the rule is written down here and not remembered.

### The alternative, which removes it rather than reducing it

Workers Paid is USD 5 a month and raises the budget from 10 ms to 30 seconds, at which point
no cold start approaches it. Edge caching reduces the frequency - a cache expiry, or a path
nobody has requested recently, still invokes a possibly-cold Worker - while the paid plan
removes the class of failure. The site carries advertising, so the comparison is between that
plan and showing a viewer an error page instead of the site.

