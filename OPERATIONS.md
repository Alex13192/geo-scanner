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
