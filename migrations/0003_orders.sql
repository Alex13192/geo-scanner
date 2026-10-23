-- Orders written before checkout, confirmed by a signed provider webhook.
--
-- WHY THE ROW IS CREATED BEFORE THE PAYMENT: the reference in the checkout link has to
-- resolve when the buyer comes back and when the provider calls the webhook. Creating the row
-- only on "paid" would make an abandoned checkout indistinguishable from a forged reference,
-- and would leave the webhook with nothing to transition.
--
-- status is the paywall: 'pending' -> 'paid' happens once, behind the webhook signature.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  amount_usd INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT,
  provider TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders (reference);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders (paid_at);
