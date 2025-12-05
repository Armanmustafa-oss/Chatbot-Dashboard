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
