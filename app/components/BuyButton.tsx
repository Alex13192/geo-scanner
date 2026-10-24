"use client";

import { useState } from "react";
import { formatUsd, getProduct } from "@/lib/pricing";
import { openPaddleCheckout } from "@/lib/paddle-client";

/**
 * The buy button.
 *
 * WHY A CLIENT COMPONENT AND NOT A PLAIN LINK: the checkout URL carries a per-order
 * reference, so the link has to be minted when the buyer clicks rather than baked into the
 * page. The same button is used on the English pricing page and on all five localized ones,
 * which is also why the labels are props.
 *
 * WHAT IT DOES WHEN CHECKOUT IS NOT CONFIGURED: it falls back to a prefilled order email
 * containing the reference, because a paywall that breaks while its provider application is
 * pending is worse than the manual process it replaced.
 */
export default function BuyButton({
  productId,
  label,
  className,
}: {
  productId: "signal" | "pro";
  label: string;
  className?: string;
}) {
  const product = getProduct(productId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: productId }),
      });
      const data = (await res.json()) as {
        mode?: "paddle";
        url?: string;
        fallback?: boolean;
        reference?: string;
        email?: string;
        priceId?: string;
        clientToken?: string;
        environment?: "sandbox" | "production";
        successUrl?: string;
        error?: string;
      };

      if (
        res.ok &&
        data.mode === "paddle" &&
        data.reference &&
        data.priceId &&
        data.clientToken &&
        data.successUrl
      ) {
        await openPaddleCheckout({
          reference: data.reference,
          priceId: data.priceId,
          clientToken: data.clientToken,
          environment: data.environment === "sandbox" ? "sandbox" : "production",
          successUrl: data.successUrl,
        });
        return;
      }
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.ok && data.fallback && data.email) {
        const subject = `Order ${data.reference ?? ""} - ${product?.name ?? productId} (${formatUsd(product?.priceUsd ?? 0)})`;
        const body = [
          `Reference: ${data.reference ?? ""}`,
          `Product: ${product?.name ?? productId}`,
          `Price: ${formatUsd(product?.priceUsd ?? 0)} USD`,
          "",
          "Please send payment instructions. Company, billing country and VAT/tax ID:",
          "",
        ].join("\n");
        window.location.href = `mailto:${data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return;
      }
      setError(data.error ?? "Checkout is temporarily unavailable. Please try again.");
    } catch {
      setError("Checkout is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className={
          className ??
          "w-full rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-85 disabled:opacity-60"
        }
      >
        {busy ? "…" : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-[var(--warn)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
