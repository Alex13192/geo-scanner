/**
 * Orders, and the only SQL that touches them.
 *
 * WHY AN ORDER TABLE EXISTS AT ALL: the webhook is the source of truth for "did this get
 * paid", but without a local record the site cannot answer "did this reference exist, and is
 * it paid" when a buyer writes in - and the provider's dashboard is not a support tool. The
 * row is created before checkout and marked paid by a signed webhook; nothing else writes.
 *
 * THE STATUS IS THE PAYWALL: `pending` means an order was started, `paid` means the provider
 * confirmed it. No page may grant delivery on a query string alone, which is why `/thanks/`
 * prints a reference instead of claiming a payment.
 */

export type OrderStatus = "pending" | "paid";

export type Order = {
  id: string;
  reference: string;
  product: string;
  amount_usd: number;
  status: OrderStatus;
  email: string | null;
  provider: string | null;
  created_at: number;
  paid_at: number | null;
};

export async function createOrder(
  db: D1DatabaseLike,
  order: {
    id: string;
    reference: string;
    product: string;
    amountUsd: number;
    now: number;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO orders (id, reference, product, amount_usd, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`
    )
    .bind(order.id, order.reference, order.product, order.amountUsd, order.now)
    .run();
}

/**
 * Mark an order paid. Returns true only on the transition, so a provider that retries a
 * webhook (they all do) cannot send two delivery emails.
 */
export async function markOrderPaid(
  db: D1DatabaseLike,
  input: { reference: string; email: string | null; provider: string | null; now: number }
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE orders
          SET status = 'paid', email = ?, provider = ?, paid_at = ?
        WHERE reference = ? AND status = 'pending'`
    )
    .bind(input.email, input.provider, input.now, input.reference)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function findOrder(db: D1DatabaseLike, reference: string): Promise<Order | null> {
  return db
    .prepare(
      `SELECT id, reference, product, amount_usd, status, email, provider, created_at, paid_at
         FROM orders WHERE reference = ?`
    )
    .bind(reference)
    .first<Order>();
}
