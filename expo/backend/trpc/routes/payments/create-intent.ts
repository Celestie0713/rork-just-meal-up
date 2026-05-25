import { z } from "zod";
import { publicProcedure } from "../../create-context";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil",
});

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
