import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { searchPlacesProcedure } from "./routes/places/search";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  places: createTRPCRouter({
    search: searchPlacesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
