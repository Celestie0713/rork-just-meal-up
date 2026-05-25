import { z } from "zod";
import { publicProcedure } from "../../create-context";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil",
});

/**
 * Creates a Stripe PaymentIntent (kept for native PaymentSheet flow if used).
 */
export const createPaymentIntentProcedure = publicProcedure
  .input(
    z.object({
      amount: z.number().min(0.5).max(50000),
    })
  )
  .mutation(async ({ input }) => {
    const amountInCents = Math.round(input.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create payment intent");
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  });

/**
 * Creates a Stripe Checkout Session and returns the hosted URL.
 * Works in any environment (cloud simulator, Expo Go, real devices, web).
 */
export const createCheckoutSessionProcedure = publicProcedure
  .input(
    z.object({
      amount: z.number().min(0.5).max(50000),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const amountInCents = Math.round(input.amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: input.description ?? "Tip",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  });

/**
 * Verifies a checkout session's payment status server-side.
 */
export const getCheckoutSessionProcedure = publicProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);
    return {
      paymentStatus: session.payment_status,
      status: session.status,
      amountTotal: session.amount_total,
    };
  });
