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
  getStudentById,
  getNotifications,
  getUnreadNotificationCount,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  snoozeNotification,
  getNotificationHistory,
  detectSentimentAnomaly,
  detectResponseTimeAnomaly,
  detectSatisfactionDecline,
  getHighVolumeCategories,
  reactivateSnoozedNotifications,
  getEmailRecipients,
  addEmailRecipient,
  updateEmailRecipient,
  removeEmailRecipient,
  getApiKeys,
  createApiKey,
  validateApiKey,
  revokeApiKey,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getEmailLogs,
  logEmailSend,
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

  // Notifications Router
  notifications: router({
    list: publicProcedure
      .input(z.object({
        includeRead: z.boolean().optional(),
        includeDismissed: z.boolean().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        return await getNotifications({
          includeRead: input?.includeRead,
          includeDismissed: input?.includeDismissed,
          limit: input?.limit || 20,
          offset: input?.offset || 0,
        });
      }),

    unreadCount: publicProcedure
      .query(async () => {
        return await getUnreadNotificationCount();
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(['critical', 'warning', 'info']),
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        studentId: z.number().optional(),
        messageId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createNotification(input);
      }),

    markAsRead: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await markNotificationAsRead(input.id);
      }),

    markAllAsRead: publicProcedure
      .mutation(async () => {
        return await markAllNotificationsAsRead();
      }),

    dismiss: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await dismissNotification(input.id);
      }),

    snooze: publicProcedure
      .input(z.object({
        id: z.number(),
        duration: z.enum(['15min', '1hour', '4hours', '1day']),
      }))
      .mutation(async ({ input }) => {
        const durationMs = {
          '15min': 15 * 60 * 1000,
          '1hour': 60 * 60 * 1000,
          '4hours': 4 * 60 * 60 * 1000,
          '1day': 24 * 60 * 60 * 1000,
        };
        const snoozeUntil = new Date(Date.now() + durationMs[input.duration]);
        return await snoozeNotification(input.id, snoozeUntil);
      }),

    history: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(100),
      }).optional())
      .query(async ({ input }) => {
        return await getNotificationHistory(input?.limit || 100);
      }),

    // Pattern detection endpoints
    detectAnomalies: publicProcedure
      .query(async () => {
        const [sentiment, responseTime, satisfaction, highVolume] = await Promise.all([
          detectSentimentAnomaly(),
          detectResponseTimeAnomaly(),
          detectSatisfactionDecline(),
          getHighVolumeCategories(),
        ]);

        return {
          sentiment,
          responseTime,
          satisfaction,
          highVolumeCategories: highVolume,
          hasAnyAnomaly: sentiment.hasAnomaly || responseTime.hasAnomaly || satisfaction.hasDecline,
        };
      }),

    reactivateSnoozed: publicProcedure
      .mutation(async () => {
        return await reactivateSnoozedNotifications();
      }),
  }),

  // Email Recipients Router
  emailRecipients: router({
    list: publicProcedure
      .query(async () => {
        return await getEmailRecipients();
      }),

    add: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        notifyOnCritical: z.boolean().default(true),
        notifyOnWarning: z.boolean().default(true),
        notifyOnInfo: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        return await addEmailRecipient(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        notifyOnCritical: z.boolean().optional(),
        notifyOnWarning: z.boolean().optional(),
        notifyOnInfo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateEmailRecipient(id, data);
      }),

    remove: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await removeEmailRecipient(input.id);
      }),
  }),

  // API Keys Router
  apiKeys: router({
    list: publicProcedure
      .query(async () => {
        return await getApiKeys();
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        permissions: z.array(z.string()).optional(),
        expiresInDays: z.number().min(1).max(365).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const expiresAt = input.expiresInDays 
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined;
        return await createApiKey({
          name: input.name,
          permissions: input.permissions,
          expiresAt,
          createdBy: ctx.user?.id,
        });
      }),

    validate: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const apiKey = await validateApiKey(input.key);
        return { valid: !!apiKey, permissions: apiKey?.permissions };
      }),

    revoke: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await revokeApiKey(input.id);
      }),
  }),

  // Scheduled Reports Router
  scheduledReports: router({
    list: publicProcedure
      .query(async () => {
        return await getScheduledReports();
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        reportType: z.enum(['daily', 'weekly', 'monthly']),
        format: z.enum(['pdf', 'excel', 'csv']),
        recipients: z.array(z.string().email()),
        includeMetrics: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Calculate next send time based on report type
        const now = new Date();
        let nextSendAt: Date;
        
        switch (input.reportType) {
          case 'daily':
            nextSendAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            nextSendAt.setHours(8, 0, 0, 0); // 8 AM next day
            break;
          case 'weekly':
            nextSendAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            nextSendAt.setHours(8, 0, 0, 0); // 8 AM next week
            break;
          case 'monthly':
            nextSendAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
            break;
        }

        return await createScheduledReport({
          name: input.name,
          reportType: input.reportType,
          format: input.format,
          recipients: JSON.stringify(input.recipients),
          includeMetrics: input.includeMetrics ? JSON.stringify(input.includeMetrics) : null,
          nextSendAt,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        reportType: z.enum(['daily', 'weekly', 'monthly']).optional(),
        format: z.enum(['pdf', 'excel', 'csv']).optional(),
        recipients: z.array(z.string().email()).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, recipients, ...data } = input;
        return await updateScheduledReport(id, {
          ...data,
          recipients: recipients ? JSON.stringify(recipients) : undefined,
        });
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteScheduledReport(input.id);
      }),
  }),

  // Email Logs Router
  emailLogs: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        return await getEmailLogs(input?.limit || 100);
      }),

    send: publicProcedure
      .input(z.object({
        recipientEmail: z.string().email(),
        subject: z.string(),
        type: z.enum(['notification', 'report', 'alert']),
      }))
      .mutation(async ({ input }) => {
        // Log the email send attempt
        const log = await logEmailSend({
          recipientEmail: input.recipientEmail,
          subject: input.subject,
          type: input.type,
          status: 'pending',
        });
        
        // In a real implementation, you would send the email here using SendGrid, etc.
        // For now, we'll simulate success
        return { success: true, logId: log?.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
