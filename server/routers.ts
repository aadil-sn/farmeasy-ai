import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { getRegionalSignals } from "./externalSignals";
import { recordMarketplaceEvent } from "./db";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  regionalSignals: router({
    current: publicProcedure.query(() => getRegionalSignals()),
  }),
  marketplace: router({
    recordActivity: publicProcedure
      .input(z.object({
        actorRole: z.enum(["farmer", "buyer", "fpo"]),
        eventType: z.enum(["lot_published", "lot_updated", "lot_removed", "farmer_verified", "farmer_rejected", "offer_created", "offer_accepted", "offer_rejected", "aggregation_approved", "order_advanced"]),
        referenceId: z.string().min(1).max(80),
        summary: z.string().min(1).max(500),
      }))
      .mutation(({ input }) => recordMarketplaceEvent(input)),
  }),
});

export type AppRouter = typeof appRouter;
