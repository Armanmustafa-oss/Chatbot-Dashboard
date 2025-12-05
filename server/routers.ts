import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDailyAnalytics,
  getAggregatedHourlyData,
  getTopQueryCategories,
  getKPISummary,
  getMessages,
  getMessageById,
  getMessageCount,
  getStudents,
  getStudentById
} from "./db";

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

  // Analytics Router
  analytics: router({
    getDailyData: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await getDailyAnalytics(input.startDate, input.endDate);
      }),

    getHourlyPeakTimes: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await getAggregatedHourlyData(input.startDate, input.endDate);
      }),

    getTopQueries: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional())
      .query(async ({ input }) => {
        return await getTopQueryCategories(input?.limit || 10);
      }),

    getKPISummary: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await getKPISummary(input.startDate, input.endDate);
      }),
  }),

  // Messages Router
  messages: router({
    list: publicProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const messages = await getMessages({
          startDate: input?.startDate,
          endDate: input?.endDate,
          sentiment: input?.sentiment,
          category: input?.category,
          limit: input?.limit || 50,
          offset: input?.offset || 0,
        });
        
        const total = await getMessageCount({
          startDate: input?.startDate,
          endDate: input?.endDate,
          sentiment: input?.sentiment,
          category: input?.category,
        });

        return { messages, total };
      }),

    getById: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await getMessageById(input.id);
      }),

    count: publicProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
        category: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getMessageCount({
          startDate: input?.startDate,
          endDate: input?.endDate,
          sentiment: input?.sentiment,
          category: input?.category,
        });
      }),
  }),

  // Students Router
  students: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        return await getStudents(input?.limit || 50, input?.offset || 0);
      }),

    getById: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await getStudentById(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
