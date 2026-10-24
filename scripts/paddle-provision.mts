/**
 * Provision the Paddle catalog and notification destination for LLMention.
 *
 * WHY THIS IS A SCRIPT AND NOT A DASHBOARD ROUTINE: two products and two prices have to exist
 * identically in sandbox and in production, and each environment has its own ids. Doing it by hand
 * twice is how a price on the site and a price in Paddle drift apart; this reads `lib/pricing.ts`
 * (the same module the pricing page and the checkout route use) and is idempotent - existing
 * products are matched by name, existing prices by product + amount, an existing destination by URL.
 *
 * USAGE (dry run by default - it prints what it would do and changes nothing):
 *
 *   PADDLE_API_KEY=pdl_sdbx_apikey_... node scripts/paddle-provision.mts --env sandbox
 *   PADDLE_API_KEY=pdl_sdbx_apikey_... node scripts/paddle-provision.mts --env sandbox --apply
 *   PADDLE_API_KEY=pdl_live_apikey_... node scripts/paddle-provision.mts --env production --apply
 *
 * `--env sandbox` talks to https://sandbox-api.paddle.com, `--env production` to
 * https://api.paddle.com. The output (product ids, price ids, webhook secret, client-side token) is
 * written OUTSIDE the repository, to `../.keys/paddle-llmention-<env>.json`: the site repository is
 * public, and a file with a live webhook secret must never be one `git add -A` away from a commit.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: it does not create the default payment link (dashboard-only)
 * and it does not submit the checkout domain for review (dashboard-only). Those are the two steps
 * the seller performs in the dashboard; see the runbook.
 */
import fs from "node:fs";
import path from "node:path";
import { PRODUCTS } from "../lib/pricing.ts";
import { SITE_URL } from "../lib/site.ts";

const WEBHOOK_URL = `${SITE_URL}/api/webhooks/checkout`;
const SUBSCRIBED_EVENTS = ["transaction.completed", "adjustment.created", "adjustment.updated"];
/*
 * `standard`, NOT `digital-goods`. Paddle only lets an account use tax categories that have been
 * approved for it, and the developer docs are explicit that `standard` and `saas` are always
 * approved while `digital-goods` is not: creating with it returns
 * `product_tax_category_not_approved` on a new account. The category can be changed in the
 * dashboard after approval; blocking the whole catalog on a tax-category request is the wrong
 * order of operations for a first sale.
 */
const TAX_CATEGORY = "standard";
const OUT_DIR = path.resolve(process.cwd(), "..", ".keys");

const argv = process.argv.slice(2);
const envName = (() => {
  const i = argv.indexOf("--env");
  const value = i >= 0 ? argv[i + 1] : "sandbox";
  if (value !== "sandbox" && value !== "production") {
    console.error("--env must be sandbox or production");
    process.exit(2);
  }
  return value;
})();
const apply = argv.includes("--apply");
const apiKey = (process.env.PADDLE_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("PADDLE_API_KEY is required (sandbox or production key for this environment)");
  process.exit(2);
}
const base = envName === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

const products = PRODUCTS.map((product) => ({
  plan: product.id,
  name: `LLMention — ${product.name}`,
  cents: Math.round(product.priceUsd * 100),
  description:
    `Standardised one-time digital report: ${product.questions} questions, ${product.engines} ` +
    `AI engine${product.engines === 1 ? "" : "s"}, delivered as a written report plus a data ` +
    `workbook by email within 5-10 working days of the question bank being frozen. No subscription, ` +
    `no custom consulting. Refunds: ${SITE_URL}/refund/ . Terms: ` +
    `${SITE_URL}/terms/`,
}));

const api = async (method: string, endpoint: string, body?: unknown) => {
  const res = await fetch(base + endpoint, {
    method,
    headers: {
      // Paddle Billing authenticates with a Bearer API key (not x-api-key; that is Creem's scheme).
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} -> ${res.status}: ${text.slice(0, 500)}`);
  }
  return json;
};

const outFile = path.join(OUT_DIR, `paddle-llmention-${envName}.json`);
const out: any = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : {};
out.env = envName;
out.api = base;
out.products = out.products ?? {};

const listAll = async (endpoint: string) => {
  const seen: any[] = [];
  let after = "";
  for (let page = 0; page < 10; page++) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const data = await api(
      "GET",
      `${endpoint}${sep}per_page=200${after ? `&after=${after}` : ""}`
    );
    seen.push(...(data.data ?? []));
    if (!data.meta?.pagination?.has_more) break;
    after = data.meta.pagination.next ?? "";
    if (!after) break;
  }
  return seen;
};

console.log(`Paddle ${envName} (${base}) — ${apply ? "APPLY" : "dry run"}`);
for (const p of products) console.log(`  ${p.plan.padEnd(7)} $${(p.cents / 100).toFixed(2)}  ${p.name}`);

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to create/update the catalog and webhook destination.");
  process.exit(0);
}

const existingProducts = await listAll("/products");
for (const p of products) {
  let product = existingProducts.find((x: any) => x.name === p.name);
  if (!product) {
    const created = await api("POST", "/products", {
      name: p.name,
      tax_category: TAX_CATEGORY,
      description: p.description,
      image_url: `${SITE_URL}/og.png`,
      custom_data: { plan: p.plan },
    });
    product = created.data;
    console.log(`created product ${p.plan}: ${product.id}`);
  } else {
    console.log(`product ${p.plan} exists: ${product.id}`);
  }

  const prices = await listAll(`/prices?product_id=${encodeURIComponent(product.id)}`);
  let price = prices.find(
    (x: any) =>
      x.unit_price?.currency_code === "USD" &&
      Number(x.unit_price?.amount) === p.cents &&
      x.status === "active"
  );
  if (!price) {
    const created = await api("POST", "/prices", {
      description: `${p.name} (one-time, USD)`,
      name: p.name,
      product_id: product.id,
      billing_cycle: null,
      tax_mode: "external",
      unit_price: { amount: String(p.cents), currency_code: "USD" },
      quantity: { minimum: 1, maximum: 1 },
    });
    price = created.data;
    console.log(`created price ${p.plan}: ${price.id}`);
  } else {
    console.log(`price ${p.plan} exists: ${price.id}`);
  }

  out.products[p.plan] = { product_id: product.id, price_id: price.id, amount: p.cents };
}

const settings = await listAll("/notification-settings");
let destination = settings.find((x: any) => x.destination === WEBHOOK_URL);
if (!destination) {
  const created = await api("POST", "/notification-settings", {
    description: "LLMention checkout webhook",
    type: "url",
    destination: WEBHOOK_URL,
    subscribed_events: SUBSCRIBED_EVENTS,
    traffic_source: "platform",
  });
  destination = created.data;
  console.log(`created webhook destination: ${destination.id}`);
} else {
  console.log(`webhook destination exists: ${destination.id}`);
}
out.notification = {
  id: destination.id,
  destination: destination.destination,
  secret: destination.endpoint_secret_key ?? out.notification?.secret ?? "",
};

// Paddle.js cannot open a checkout without a client-side token. It is a public value (it can only
// open checkouts), so it is written to the output file and printed; a secret API key never is.
const clientTokenName = `LLMention website (${envName})`;
let clientToken = "";
const tokens = await listAll("/client-tokens");
const existingToken = tokens.find((t: any) => t.name === clientTokenName && t.status === "active");
if (existingToken) {
  clientToken = existingToken.token;
  console.log(`client-side token exists: ${existingToken.id}`);
} else {
  const created = await api("POST", "/client-tokens", {
    name: clientTokenName,
    description: "Paddle.js checkout overlay on the LLMention website",
  });
  clientToken = created.data.token;
  console.log(`created client-side token: ${created.data.id}`);
}
out.clientToken = clientToken;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8");

const priceIds = Object.fromEntries(
  Object.entries(out.products).map(([plan, value]: [string, any]) => [plan, value.price_id])
);
console.log(`\nwrote ${outFile}`);
console.log(`PADDLE_PRICE_IDS='${JSON.stringify(priceIds)}'`);
console.log(`PADDLE_CLIENT_TOKEN='${clientToken}'`);
if (out.notification?.secret) {
  console.log("webhook secret captured (see file; it is not printed to the console on purpose)");
} else {
  console.log(
    "!! no webhook secret in this run: destination already existed. Copy it from the dashboard or delete the destination and re-run."
  );
}
