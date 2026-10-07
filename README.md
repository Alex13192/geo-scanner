# LLMention

A GEO scanner for AI search visibility, at https://llmention-geo.com.

**What it does not do:** it never queries an AI engine. It measures whether a page *can* be read,
extracted and cited — not whether any engine currently mentions you. That limit is stated in the
method rather than left for you to discover.

It fetches a homepage the way a crawler would, scores it against 40 published checks across
12 weighted dimensions, and reports every failure with the evidence that produced it. The
ruling principle is that the method must be inspectable: every rule, its point value and the
condition that makes it pass are published, and the tests assert that the published method
and the executed method cannot drift apart.

- Every rule: `/checks/`, one page per check, generated from `lib/geo/catalog.ts`
- The full method, the weights and the limits: `/methodology/`
- The study over 30 homepages: `/study/`, collected by `npm run study:run`
- 
## Run a scan without installing anything

## What we measured

| Finding | Value |
|---|---|
| Homepages scanned in the published study | 30 |
| Sites scoring an A (90+) | **0** |
| Highest score | 83 (B) |
| Sites blocking at least one AI crawler | 9 of 30 |
| Sites declaring an entity type (Organization / Person / WebSite) | 8 of 30 |
| News publishers blocking AI crawlers | 6 of 6 |

The rows are downloadable and the run is reproducible: [`/study/`](https://llmention-geo.com/study/)
and [`/study/data/`](https://llmention-geo.com/study/data/). Rows were collected on 3 October 2026
under the 38 checks that existed then; the scanner ships 40 today, and the study page says so.

No key, no account, no email. The scan is not stored.

## Running it

```bash
npm ci
npm run dev            # http://localhost:3000
npm run preview        # build and serve the real Cloudflare Worker locally
```

## Deploying

The site is a **Cloudflare Worker**, built with `@opennextjs/cloudflare` and configured by
`wrangler.jsonc`. It is not a Pages project any more, and it is not deployed from the
Cloudflare dashboard: the build command and output directory used to live only there, which
meant nothing in this repository described how the site reached production and nobody could
reproduce a deployment failure locally.

```bash
npx wrangler login     # once
npm run deploy         # build + deploy to Cloudflare
```

Push to `main` also deploys, through `.github/workflows/deploy.yml`, **but only once these
repository secrets exist**:

| Secret | Where it comes from |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → template "Edit Cloudflare Workers" |
| `CLOUDFLARE_ACCOUNT_ID` | the account id in the dashboard URL, or `npx wrangler whoami` |

Without them the deploy job fails with a wrangler error and ships nothing, which is the
correct failure. `npm run deploy` from a development machine always works as a fallback.

**Working on something without shipping it.** `verify.yml` runs on every branch, so a feature
branch can be pushed as often as its author likes: the push is a backup and a set of checks,
and neither of those reaches production. Only `deploy.yml` ships, and it listens to `main`
alone, which makes `main` the gate - merge when the work is finished, not when it compiles.
A merge runs the gates twice, once from `verify.yml` and once from `deploy.yml`'s call to it.
That is a few minutes of CI rather than a correctness problem; excluding `main` from
`verify.yml` would avoid the duplicate at the cost of making production's coverage depend on
`deploy.yml` continuing to call that file.

`wrangler.jsonc` attaches the production hostname as a **route**, not as a `custom_domain`.
That is deliberate: attaching it as a custom domain is refused with `code: 100117` because
the hostname carries an externally managed DNS record left by the Pages integration. A route
creates no DNS record and needs none. The comment in that file records the error.

## Checking it

Six gates. The first five inspect local build output; the sixth is the only one that can see
what is actually being served.

| Command | What it proves |
| --- | --- |
| `npm run check:values` | every static URL and address agrees with `lib/site.ts` |
| `npm run test:analyze` | the scoring engine: robots.txt parsing, measurement guards, page-type exemptions, generated copy, the ranges the site publishes for its own titles, and that no source file declares the edge runtime |
| `npm run test:rate-limit` | the token bucket, including that a flood of distinct keys cannot reset an exhausted client |
| `npx tsc --noEmit` | types |
| `npx opennextjs-cloudflare build` | the adapter accepts the app, then `npm run check:built` scores the built HTML with the scanner's own analyser and fails below a floor |
| `npm run check:live` | the deployed origin, taken from `lib/site.ts`: security headers, which deployment is answering, robots.txt, llms.txt, `/ads.txt`, the `/report/` canonical, a markdown twin resolving, the withdrawn pages redirecting, and the rule hub |

`check:live` takes any origin, so it also works against `npm run preview` or a preview
hostname. Its `deployment identity` assertion checks for the `x-opennext` response header:
without it, a run against a hostname still served by the old Pages deployment passed every
content check and looked like a successful cutover.

## Layout

```
app/                 routes; (en)/ is the only locale, deliberately
  (en)/checks/       the rule reference, generated from the catalogue
  api/               scan and llms.txt endpoints, Node runtime inside the Worker
lib/geo/             the scoring engine, the published catalogue, generated copy
lib/og.ts            the openGraph block, built in one place
lib/site.ts          the origin and contact address, declared once
scripts/             the gates above, plus the study runner
public/_headers      static asset caching, read under Workers
wrangler.jsonc       the Worker: entry, compatibility flags, bindings, routes
```

## A note on the comments

They are long, and they explain why rather than what. Several of them record a mistake that
was made and what it cost, because the reasoning is the part that does not survive a rewrite
of the code. `lib/geo/analyze.ts`, `middleware.ts` and `next.config.ts` are the densest.

## License

MIT — see [LICENSE](LICENSE).
