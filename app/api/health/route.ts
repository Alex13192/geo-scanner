// app/api/health/route.ts
//
// A small, honest status endpoint for the one thing a deploy cannot prove by itself: whether the
// payment channel is configured in the environment it was deployed to.
//
// WHY THIS EXISTS: the Paddle adapter is designed to look identical whether or not it has
// credentials - the buy button falls back to email, which is correct but silent. During go-live
// that silence is the failure mode: a deploy that forgot `PADDLE_PRICE_IDS` looks successful and
// takes no money. This endpoint turns "did the secrets land?" into one curl.
//
// WHAT IT DOES NOT EXPOSE: no token, no price id, no webhook secret. `environment` is the only
// configuration detail returned, and it is the one an operator needs to check before the first
// real order ("is production pointing at sandbox again?").
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readPaddleCheckoutConfig } from "@/lib/paddle";

export const dynamic = "force-dynamic";

export async function GET() {
  const { env } = getCloudflareContext();
  const paddle = readPaddleCheckoutConfig(env as unknown as Record<string, string | undefined>);

  return NextResponse.json(
    {
      ok: true,
      payments: {
        paddle: paddle
          ? { configured: true, environment: paddle.environment }
          : { configured: false, environment: null },
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
