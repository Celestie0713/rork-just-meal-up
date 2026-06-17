import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { searchPlacesProcedure } from "./routes/places/search";
import { resolveAddressProcedure } from "./routes/places/resolve-address";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  places: createTRPCRouter({
    search: searchPlacesProcedure,
    resolveAddress: resolveAddressProcedure,
  }),
});

export type AppRouter = typeof appRouter;
