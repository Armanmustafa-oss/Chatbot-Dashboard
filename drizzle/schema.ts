import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;



/**
 * Students table - represents students who interact with the chatbot
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  studentId: varchar("studentId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  department: varchar("department", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Messages table - stores all chatbot interactions
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  query: text("query").notNull(),
  response: text("response"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  category: varchar("category", { length: 128 }),
  responseTimeMs: int("responseTimeMs"),
  isResolved: boolean("isResolved").default(true),
  rating: int("rating"), // 1-5 star rating
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Daily analytics aggregation table
 */
export const dailyAnalytics = mysqlTable("dailyAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  positiveCount: int("positiveCount").default(0).notNull(),
  neutralCount: int("neutralCount").default(0).notNull(),
  negativeCount: int("negativeCount").default(0).notNull(),
  avgResponseTimeMs: int("avgResponseTimeMs").default(0),
  avgRating: int("avgRating"), // Stored as rating * 10 for precision (e.g., 45 = 4.5)
  uniqueStudents: int("uniqueStudents").default(0),
});

export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;
export type InsertDailyAnalytics = typeof dailyAnalytics.$inferInsert;

/**
 * Hourly peak times aggregation
 */
export const hourlyPeakTimes = mysqlTable("hourlyPeakTimes", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  hour: int("hour").notNull(), // 0-23
  messageCount: int("messageCount").default(0).notNull(),
});

export type HourlyPeakTime = typeof hourlyPeakTimes.$inferSelect;
export type InsertHourlyPeakTime = typeof hourlyPeakTimes.$inferInsert;

/**
 * Query categories for tracking popular topics
 */
export const queryCategories = mysqlTable("queryCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  count: int("count").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type QueryCategory = typeof queryCategories.$inferSelect;
export type InsertQueryCategory = typeof queryCategories.$inferInsert;


/**
 * Notifications table - stores urgent alerts and notifications for administrators
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["critical", "warning", "info"]).default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  studentId: int("studentId"), // Optional reference to related student
  messageId: int("messageId"), // Optional reference to related message
  isRead: boolean("isRead").default(false).notNull(),
  isDismissed: boolean("isDismissed").default(false).notNull(),
  snoozeUntil: timestamp("snoozeUntil"), // When snoozed notification should reappear
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Email recipients table - stores email addresses for notification delivery
 */
export const emailRecipients = mysqlTable("emailRecipients", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  notifyOnCritical: boolean("notifyOnCritical").default(true).notNull(),
  notifyOnWarning: boolean("notifyOnWarning").default(true).notNull(),
  notifyOnInfo: boolean("notifyOnInfo").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;

/**
 * API keys table - stores API keys for external integrations (e.g., WhatsApp bot)
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  keyHash: varchar("keyHash", { length: 64 }).notNull().unique(), // SHA-256 hash of the key
  keyPrefix: varchar("keyPrefix", { length: 8 }).notNull(), // First 8 chars for identification
  permissions: text("permissions"), // JSON array of permissions
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"), // User ID who created the key
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Scheduled reports table - stores configuration for automated report delivery
 */
export const scheduledReports = mysqlTable("scheduledReports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  reportType: mysqlEnum("reportType", ["daily", "weekly", "monthly"]).default("weekly").notNull(),
  format: mysqlEnum("format", ["pdf", "excel", "csv"]).default("pdf").notNull(),
  recipients: text("recipients").notNull(), // JSON array of email addresses
  includeMetrics: text("includeMetrics"), // JSON array of metrics to include
  isActive: boolean("isActive").default(true).notNull(),
  lastSentAt: timestamp("lastSentAt"),
  nextSendAt: timestamp("nextSendAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;

/**
 * Email logs table - tracks sent emails for audit purposes
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["notification", "report", "alert"]).default("notification").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
