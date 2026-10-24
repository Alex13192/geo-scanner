"use client";

/**
 * Paddle.js, loaded only when a buyer actually clicks.
 *
 * WHY NOT A <script> TAG IN THE LAYOUT: every page would pay for the checkout library - the legal
 * pages, the 40 rule pages, the study - and Paddle would see a request from every reader who never
 * buys. The overlay is one click away from the pricing page, so the script is created on that click.
 *
 * WHY THE ENVIRONMENT IS A PARAMETER: sandbox and production load DIFFERENT scripts and different
 * client-side tokens. Mixing them is the failure that looks fine in a browser and pays nobody: a
 * live-looking checkout that writes test transactions. The Worker decides the environment (see
 * `PADDLE_ENV` in lib/paddle.ts) and this module obeys it.
 *
 * WHY `customData.reference`: the webhook is the only thing that marks an order paid, and Paddle
 * carries `custom_data` onto the transaction. The reference is minted before checkout opens, so the
 * event can be mapped back to the order without guessing by email - the same rule the generic
 * contract states.
 */

type PaddleCheckoutRequest = {
  priceId: string;
  clientToken: string;
  environment: "sandbox" | "production";
  reference: string;
  successUrl: string;
};

type PaddleGlobal = {
  Environment?: { set: (environment: "sandbox" | "production") => void };
  Initialize: (options: { token: string; pwCustomer?: Record<string, never> }) => void;
  Checkout: {
    open: (options: {
      items: Array<{ priceId: string; quantity: number }>;
      customData: Record<string, string>;
      settings?: { successUrl?: string };
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

const SCRIPT_URL: Record<"sandbox" | "production", string> = {
  sandbox: "https://sandbox-cdn.paddle.com/paddle/v2/paddle.js",
  production: "https://cdn.paddle.com/paddle/v2/paddle.js",
};

let scriptLoading: Promise<void> | null = null;
let initialized = false;

function loadScript(environment: "sandbox" | "production"): Promise<void> {
  if (window.Paddle) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL[environment];
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Paddle.js failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

export async function openPaddleCheckout(request: PaddleCheckoutRequest): Promise<void> {
  await loadScript(request.environment);
  const Paddle = window.Paddle;
  if (!Paddle) throw new Error("Paddle.js is unavailable");

  if (!initialized) {
    // Paddle.Environment.set is only for sandbox; production is the default and must not be set.
    if (request.environment === "sandbox") Paddle.Environment?.set("sandbox");
    Paddle.Initialize({ token: request.clientToken, pwCustomer: {} });
    initialized = true;
  }

  Paddle.Checkout.open({
    items: [{ priceId: request.priceId, quantity: 1 }],
    customData: { reference: request.reference },
    settings: { successUrl: request.successUrl },
  });
}
