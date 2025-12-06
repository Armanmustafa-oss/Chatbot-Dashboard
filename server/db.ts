import { eq, sql, and, gte, lte, desc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  students, 
  messages, 
  dailyAnalytics, 
  hourlyPeakTimes, 
  queryCategories,
  notifications,
  type Message,
  type Student,
  type DailyAnalytics,
  type HourlyPeakTime,
  type QueryCategory,
  type Notification,
  type InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Analytics Queries ============

/**
 * Get daily analytics for a date range
 */
export async function getDailyAnalytics(startDate: Date, endDate: Date): Promise<DailyAnalytics[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(dailyAnalytics)
    .where(and(
      gte(dailyAnalytics.date, startDate),
      lte(dailyAnalytics.date, endDate)
    ))
    .orderBy(dailyAnalytics.date);

  return result;
}

/**
 * Get aggregated hourly data (sum of all hours across date range)
 */
export async function getAggregatedHourlyData(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      hour: hourlyPeakTimes.hour,
      totalMessages: sql<number>`SUM(${hourlyPeakTimes.messageCount})`.as('totalMessages')
    })
    .from(hourlyPeakTimes)
    .where(and(
      gte(hourlyPeakTimes.date, startDate),
      lte(hourlyPeakTimes.date, endDate)
    ))
    .groupBy(hourlyPeakTimes.hour)
    .orderBy(hourlyPeakTimes.hour);

  return result;
}

/**
 * Get top query categories
 */
export async function getTopQueryCategories(limit: number = 10): Promise<QueryCategory[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(queryCategories)
    .orderBy(desc(queryCategories.count))
    .limit(limit);

  return result;
}

/**
 * Get KPI summary for a date range
 */
export async function getKPISummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      totalMessages: sql<number>`SUM(${dailyAnalytics.totalMessages})`.as('totalMessages'),
      avgResponseTime: sql<number>`AVG(${dailyAnalytics.avgResponseTimeMs})`.as('avgResponseTime'),
      avgRating: sql<number>`AVG(${dailyAnalytics.avgRating})`.as('avgRating'),
      positiveCount: sql<number>`SUM(${dailyAnalytics.positiveCount})`.as('positiveCount'),
      neutralCount: sql<number>`SUM(${dailyAnalytics.neutralCount})`.as('neutralCount'),
      negativeCount: sql<number>`SUM(${dailyAnalytics.negativeCount})`.as('negativeCount'),
      uniqueStudents: sql<number>`SUM(${dailyAnalytics.uniqueStudents})`.as('uniqueStudents'),
    })
    .from(dailyAnalytics)
    .where(and(
      gte(dailyAnalytics.date, startDate),
      lte(dailyAnalytics.date, endDate)
    ));

  return result[0] || null;
}

// ============ Messages Queries ============

/**
 * Get messages with pagination and filters
 */
export async function getMessages(options: {
  startDate?: Date;
  endDate?: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (options.startDate) {
    conditions.push(gte(messages.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(messages.createdAt, options.endDate));
  }
  if (options.sentiment) {
    conditions.push(eq(messages.sentiment, options.sentiment));
  }
  if (options.category) {
    conditions.push(eq(messages.category, options.category));
  }

  const query = db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }

  return await query;
}

/**
 * Get message by ID with student info
 */
export async function getMessageById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      message: messages,
      student: students
    })
    .from(messages)
    .leftJoin(students, eq(messages.studentId, students.id))
    .where(eq(messages.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get total message count with filters
 */
export async function getMessageCount(options: {
  startDate?: Date;
  endDate?: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  category?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [];
  
  if (options.startDate) {
    conditions.push(gte(messages.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(messages.createdAt, options.endDate));
  }
  if (options.sentiment) {
    conditions.push(eq(messages.sentiment, options.sentiment));
  }
  if (options.category) {
    conditions.push(eq(messages.category, options.category));
  }

  const query = db.select({ count: count() }).from(messages);

  if (conditions.length > 0) {
    const result = await query.where(and(...conditions));
    return result[0]?.count || 0;
  }

  const result = await query;
  return result[0]?.count || 0;
}

// ============ Students Queries ============

/**
 * Get all students with pagination
 */
export async function getStudents(limit: number = 50, offset: number = 0): Promise<Student[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(students)
    .orderBy(desc(students.lastActiveAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get student by ID
 */
export async function getStudentById(id: number): Promise<Student | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  return result[0] || null;
}

// ============ Notifications Queries ============

/**
 * Get all notifications with optional filters
 */
export async function getNotifications(options: {
  includeRead?: boolean;
  includeDismissed?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (!options.includeRead) {
    conditions.push(eq(notifications.isRead, false));
  }
  if (!options.includeDismissed) {
    conditions.push(eq(notifications.isDismissed, false));
  }

  const query = db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(options.limit || 20)
    .offset(options.offset || 0);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }

  return await query;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(
      eq(notifications.isRead, false),
      eq(notifications.isDismissed, false)
    ));

  return result[0]?.count || 0;
}

/**
 * Create a new notification
 */
export async function createNotification(data: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(notifications).values(data);
  
  // Return the created notification
  const result = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.id))
    .limit(1);

  return result[0] || null;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));

  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.isRead, false));

  return true;
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(notifications)
    .set({ isDismissed: true })
    .where(eq(notifications.id, id));

  return true;
}
