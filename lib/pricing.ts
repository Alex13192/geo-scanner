/**
 * What is for sale, declared once.
 *
 * WHY A MODULE RATHER THAN PRICES IN JSX: the price appears on the English pricing page,
 * five localized pricing pages, the checkout endpoint and (later) the payment provider's
 * product. Four of those are in this repository; the provider is not. A number typed into a
 * page is the copy that drifts last and is noticed first - by a buyer charged something else.
 *
 * WHY THE PRICES ARE LOW AND ONE-TIME: the previous $299 / $499 ladder was priced like a
 * consultancy and sold nothing, because there was no checkout, no proof and no cheap way in.
 * $39 / $99 are impulse-range for an agency or an indie founder, and the deliverable is a
 * digital product (report + workbook), which is also the framing a merchant of record
 * approves. The price can move once there are ten real buyers; it cannot move back down from
 * a price nobody paid.
 */

export type ProductId = "signal" | "pro";

export type Product = {
  id: ProductId;
  /** English name. Localized pages take the name from their dictionary. */
  name: string;
  priceUsd: number;
  /** Questions in the frozen bank. */
  questions: number;
  /** Engines the buyer may choose. */
  engines: number;
  /** Environment variable that holds this product's hosted checkout URL. */
  checkoutEnv: "CHECKOUT_URL_SIGNAL" | "CHECKOUT_URL_PRO";
};

export const PRODUCTS: Product[] = [
  { id: "signal", name: "Signal report", priceUsd: 39, questions: 30, engines: 1, checkoutEnv: "CHECKOUT_URL_SIGNAL" },
  { id: "pro", name: "Pro report", priceUsd: 99, questions: 30, engines: 2, checkoutEnv: "CHECKOUT_URL_PRO" },
];

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

/** `39` -> `$39`. Whole dollars only, on purpose: a report is not an impulse add-on. */
export function formatUsd(amount: number): string {
  return `$${amount}`;
}
