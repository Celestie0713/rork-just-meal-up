import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { searchPlacesProcedure } from "./routes/places/search";
import {
  createPaymentIntentProcedure,
  createCheckoutSessionProcedure,
  getCheckoutSessionProcedure,
} from "./routes/payments/create-intent";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  places: createTRPCRouter({
    search: searchPlacesProcedure,
  }),
  payments: createTRPCRouter({
    createIntent: createPaymentIntentProcedure,
    createCheckoutSession: createCheckoutSessionProcedure,
    getCheckoutSession: getCheckoutSessionProcedure,
  }),
});

export type AppRouter = typeof appRouter;
