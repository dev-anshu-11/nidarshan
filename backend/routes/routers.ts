import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { systemRouter } from "../_core/systemRouter";
import { publicProcedure, router } from "../_core/trpc";
import { getCaseByNumber, insertCase } from "../db/db";
import { createDemoCase, createDemoPayload, DEMO_CASE_NUMBER } from "../services/nidarshanData";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  cases: router({
    demo: publicProcedure.query(async () => {
      const persisted = await getCaseByNumber(DEMO_CASE_NUMBER);
      return persisted ?? createDemoCase();
    }),
    create: publicProcedure
      .input(z.object({ name: z.string().min(3).max(120) }))
      .mutation(async ({ input }) => {
        const caseNumber = `KRN-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-NEW`;
        const snapshot = await insertCase({
          caseNumber,
          name: input.name,
          status: "active",
          payload: JSON.stringify({ ...createDemoPayload(), generatedAt: "just now" }),
        });
        return snapshot ?? { ...createDemoCase(), caseNumber, name: input.name };
      }),
  }),
});

export type AppRouter = typeof appRouter;
