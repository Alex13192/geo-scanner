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

