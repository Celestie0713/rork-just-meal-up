/**
 * Cloudflare Worker — Stripe Checkout endpoints.
 *
 * Replaces the legacy Hono+tRPC backend (broken due to a platform-level
 * `expo/fetch` module-resolution crash) with a portable Cloudflare Worker
 * that creates and retrieves Stripe Checkout sessions.
 */

type Env = {
  STRIPE_SECRET_KEY: string;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

async function stripeFetch(
  path: string,
  env: Env,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Stripe API error ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // POST /checkout-session — create a Stripe Checkout session
    if (url.pathname === "/checkout-session" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          amount: number;
          successUrl: string;
          cancelUrl: string;
          description?: string;
        };

        if (!body.amount || body.amount <= 0 || body.amount > 50000) {
          return Response.json(
            { error: "Invalid amount" },
            { status: 400, headers: CORS },
          );
        }

        if (!body.successUrl || !body.cancelUrl) {
          return Response.json(
            { error: "Missing successUrl or cancelUrl" },
            { status: 400, headers: CORS },
          );
        }

        const amountInCents = Math.round(body.amount * 100);
        const params = new URLSearchParams({
          "mode": "payment",
          "payment_method_types[]": "card",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][product_data][name]":
            body.description ?? "Tip",
          "line_items[0][price_data][unit_amount]": String(amountInCents),
          "line_items[0][quantity]": "1",
          "success_url": body.successUrl,
          "cancel_url": body.cancelUrl,
        });

        const session = await stripeFetch(
          "/checkout/sessions",
          env,
          { method: "POST", body: params },
        );

        if (!session.url || !session.id) {
          throw new Error("Stripe did not return a session URL");
        }

        return Response.json(
          { url: session.url, sessionId: session.id },
          { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
        );
      } catch (e) {
        console.error("checkout-session error:", e);
        return Response.json(
          { error: e instanceof Error ? e.message : "Internal error" },
          { status: 500, headers: CORS },
        );
      }
    }

    // GET /checkout-session?sessionId=cs_xxx — retrieve session status
    if (url.pathname === "/checkout-session" && request.method === "GET") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId) {
        return Response.json(
          { error: "Missing sessionId parameter" },
          { status: 400, headers: CORS },
        );
      }

      try {
        const session = await stripeFetch(
          `/checkout/sessions/${encodeURIComponent(sessionId)}`,
          env,
        );

        return Response.json(
          {
            paymentStatus: session.payment_status,
            status: session.status,
            amountTotal: session.amount_total,
          },
          { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
        );
      } catch (e) {
        console.error("get-checkout-session error:", e);
        return Response.json(
          { error: e instanceof Error ? e.message : "Internal error" },
          { status: 500, headers: CORS },
        );
      }
    }

    // Health check
    if (url.pathname === "/ping") {
      return Response.json(
        { ok: true, now: new Date().toISOString() },
        { headers: CORS },
      );
    }

    return new Response("not found", { status: 404, headers: CORS });
  },
} satisfies ExportedHandler<Env>;
