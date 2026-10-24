# Payments (Paddle)

Status: **adapter implemented and deployed; no Paddle catalog or credentials yet.** The site still
sells through the mailto fallback until the seller's sandbox/production keys are configured. This
file is the operator runbook: what the code expects, how to provision it, and what each failure
looks like.

The eligibility work, application copy and the seller's dashboard/KYC steps live in the workspace
files `llmention-geo-Paddle-资格审核-2026-10-24.md` and
`llmention-geo-Paddle-申请材料-2026-10-24.md`. This file is the repository-side half.

---

## 1. What exists

| Piece | What it does |
|---|---|
| `lib/paddle.ts` | `Paddle-Signature` verification, `transaction.completed` mapping, checkout config, customer-email lookup. Pure where it can be tested. |
| `lib/paddle-client.ts` | Loads Paddle.js on the Buy click, opens the overlay with `customData.reference`. |
| `POST /api/checkout` | Creates an order row, then returns one of: `mode:"paddle"` + price id, a legacy hosted URL, or the mailto fallback. |
| `POST /api/webhooks/checkout` | Paddle branch if `Paddle-Signature` is present; the generic `t=...,v1=...` branch otherwise. |
| `GET /api/health` | `payments.paddle.configured` + `environment`. One curl after every deploy. |
| `scripts/paddle-provision.mts` | Creates products, one-time prices, the notification destination and a client-side token. Idempotent, dry-run by default. |
| `scripts/test-paywall.mts` | 27 vectors, including 15 Paddle ones (signature, mapping, config). |

Order lifecycle is unchanged: `pending` when checkout is requested, `paid` only after a verified
webhook passes the reference/price/currency/amount checks. `markOrderPaid` is a conditional update,
which is the replay guard.

---

## 2. Environment

Secrets (never in `wrangler.jsonc`, never in git):

| Name | Value | Notes |
|---|---|---|
| `PADDLE_API_KEY` | `pdl_sdbx_…` or `pdl_live_…` | Server calls: customer lookup. Needs **customer.read**. |
| `PADDLE_WEBHOOK_SECRET` | `pdl_ntfset_…` | From the notification destination. |
| `PADDLE_PRICE_IDS` | `{"signal":"pri_…","pro":"pri_…"}` | Single-line JSON. Missing key = that product falls back. |
| `PADDLE_CLIENT_TOKEN` | `test_…` or `live_…` | Public by design; Paddle.js cannot open a checkout without it. |
| `PADDLE_ENV` | `sandbox` or `production` | **Defaults to sandbox.** Forgetting `production` is the classic "looks live, takes no money". |

Set with:

```powershell
cd geo-scanner
"pdl_sdbx_apikey_..."        | npx wrangler secret put PADDLE_API_KEY --name geo-scanner
"pdl_ntfset_..."             | npx wrangler secret put PADDLE_WEBHOOK_SECRET --name geo-scanner
'{"signal":"pri_…","pro":"pri_…"}' | npx wrangler secret put PADDLE_PRICE_IDS --name geo-scanner
"test_..."                   | npx wrangler secret put PADDLE_CLIENT_TOKEN --name geo-scanner
"sandbox"                    | npx wrangler secret put PADDLE_ENV --name geo-scanner
npm run deploy
```

Verify:

```bash
curl -s https://llmention-geo.com/api/health
# {"ok":true,"payments":{"paddle":{"configured":true,"environment":"sandbox"}}}
```

`configured:false` after a deploy means one of the token/price-map secrets did not land; the site is
still silently using the mailto fallback.

---

## 3. Provisioning the catalog

```powershell
cd geo-scanner
$env:PADDLE_API_KEY = "pdl_sdbx_apikey_..."
npm run paddle:provision -- --env sandbox            # dry run: prints what it would create
npm run paddle:provision -- --env sandbox --apply
```

It reads `lib/pricing.ts` (the same module the pricing page and checkout use), creates
`LLMention — Signal report` / `LLMention — Pro report` with one-time USD prices 39.00 / 99.00, a
notification destination at `/api/webhooks/checkout` (`transaction.completed`, `adjustment.created`,
`adjustment.updated`) and a client-side token. Output goes to **`../.keys/paddle-llmention-<env>.json`**
outside the repository, because the repository is public and that file holds a webhook secret.

API key permissions needed: products / prices / notification-settings / client-tokens write,
customers read. The script creates; it never edits an existing price (changing a price in Paddle must
be a deliberate action, not a side effect of a re-run).

---

## 4. Sandbox end-to-end

The checkout domain must be approved **in the sandbox dashboard** (`llmention-geo.com`), and the
default payment link set to `https://llmention-geo.com/`. Sandbox domains are usually approved
automatically once submitted.

1. Configure the four sandbox secrets + `PADDLE_ENV=sandbox`, deploy.
2. `curl /api/health` → `configured:true`, `environment:"sandbox"`.
3. Pricing page → Buy → Paddle overlay → test card `4242 4242 4242 4242`.
4. `transaction.completed` arrives: signature OK → order `pending` → `paid`, `provider='paddle'`.
   The buyer email is resolved through the API (`customer.read`); a lookup failure leaves `email`
   empty but still records the payment.
5. `/thanks/?reference=LM-...` loads.
6. Resend the same event: 200, `duplicate:true`, no second transition.
7. A hand-edited event (wrong price id / amount / currency) must return 200 + a log line and leave
   the order untouched.

**Do not leave sandbox secrets on the production Worker.** While sandbox is configured, real
visitors who click Buy get a sandbox checkout that only test cards can complete.

---

## 5. Production switch

1. Live account approved + `llmention-geo.com` domain approved.
2. Create the live API key and client-side token; store the key outside the repo.
3. `PADDLE_API_KEY=pdl_live_… npm run paddle:provision -- --env production --apply`.
   Sandbox and production ids are separate; nothing is reused.
4. Set the live secrets and `PADDLE_ENV=production`, deploy.
5. `curl /api/health` → `environment:"production"`.
6. Buy the cheapest product with a real card. Confirm `paid`, the delivery email flow, and the
   payout record in Paddle.
7. Refund that order in the Paddle dashboard; see §7 for what the site does (nothing) and why.

---

## 6. Failure log lines

The webhook always answers 200 after a verified request, so "no delivery" is diagnosed from logs,
not status codes.

| Log | Meaning | Action |
|---|---|---|
| `[paddle_webhook] rejected: …` | Signature/secret/timestamp failed. | Check `PADDLE_WEBHOOK_SECRET`; Paddle retries. |
| `unknown_order` | Reference not in D1. | Wrong environment or deleted row; check the event's `custom_data`. |
| `product_mismatch` | Price id is not the one minted for that order's product. | `PADDLE_PRICE_IDS` drifted from the catalog; re-run provisioning. |
| `currency_mismatch` | Not USD. | Paddle price was created in another currency. |
| `amount_mismatch` | Subtotal ≠ price table. | Price changed in Paddle but not in `lib/pricing.ts` (or a discount was applied). Reconcile by hand. |
| `mark_paid_failed` | D1 error during the transition. | Order stays `pending`; retry the event or fulfil manually. |
| `[paddle_webhook] fulfilled` | Transition happened. | Normal. |
| `[paddle_webhook] rejected: signature timestamp outside…` | More than 5 minutes skew. | Paddle retries with a fresh `ts`; persistent means clock/config problem. |

The five-minute tolerance is deliberate: Paddle's SDKs use five seconds, which is a coin flip on a
Worker cold start. The replay guard is the `pending → paid` transition, not the timestamp.

---

## 7. Refunds: manual on purpose

`adjustment.created` / `adjustment.updated` are subscribed, but the handler ignores them. The orders
table has only `pending` and `paid`; there is no `refunded` state and no second write path. Refunds
are issued in the Paddle dashboard and the order is left `paid` as a record that the money did
arrive. A half-implemented refund state would be worse: it would let the site claim a refund it
cannot prove, or revoke delivery on a partial adjustment.

When refunds become routine, the migration is: add `refunded` + `refunded_at`, handle
`adjustment.updated` with `status=approved` and a negative total, and decide whether delivery is
revoked (paid report = probably not automatic).

---

## 8. Rollback

Remove or blank `PADDLE_PRICE_IDS` (or `PADDLE_CLIENT_TOKEN`) and redeploy. `/api/checkout` returns
to the mailto fallback and no card can be charged; already-paid orders are unaffected. This is the
same switch the code used while the provider application was pending, so it is exercised on every
deploy that has no credentials.

---

## 9. What the seller does in the Paddle dashboard

These cannot be done from this repository:

1. Account signup + KYC (passport/ID, proof of address, liveness).
2. Submit `llmention-geo.com` for domain approval (My account → Settings → Website approval).
3. Set the default payment link to `https://llmention-geo.com/` (must match an approved domain).
4. Payout details (Payoneer/Wise/HK bank; direct mainland wire is unreliable).
5. Answer underwriting questions. The site's fixed-scope product description, public seller identity
   and published method are the evidence those answers point at.
