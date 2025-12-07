import { eq, sql, and, gte, lte, desc, count, isNotNull } from "drizzle-orm";
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
  emailRecipients,
  apiKeys,
  scheduledReports,
  emailLogs,
  type Message,
  type Student,
  type DailyAnalytics,
  type HourlyPeakTime,
  type QueryCategory,
  type Notification,
  type InsertNotification,
  type EmailRecipient,
  type InsertEmailRecipient,
  type ApiKey,
  type InsertApiKey,
  type ScheduledReport,
  type InsertScheduledReport,
  type EmailLog,
  type InsertEmailLog
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


// ============ Pattern Detection for Notifications ============

/**
 * Detect sentiment trend anomalies
 * Returns true if negative sentiment is significantly higher than the 30-day average
 */
export async function detectSentimentAnomaly(): Promise<{
  hasAnomaly: boolean;
  currentNegativeRate: number;
  averageNegativeRate: number;
  threshold: number;
}> {
  const db = await getDb();
  if (!db) return { hasAnomaly: false, currentNegativeRate: 0, averageNegativeRate: 0, threshold: 0 };

  // Get last 24 hours sentiment
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentMessages = await db
    .select({ sentiment: messages.sentiment })
    .from(messages)
    .where(gte(messages.createdAt, last24Hours));

  const recentTotal = recentMessages.length;
  const recentNegative = recentMessages.filter(m => m.sentiment === 'negative').length;
  const currentNegativeRate = recentTotal > 0 ? (recentNegative / recentTotal) * 100 : 0;

  // Get 30-day average
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const historicalMessages = await db
    .select({ sentiment: messages.sentiment })
    .from(messages)
    .where(and(
      gte(messages.createdAt, last30Days),
      lte(messages.createdAt, last24Hours)
    ));

  const historicalTotal = historicalMessages.length;
  const historicalNegative = historicalMessages.filter(m => m.sentiment === 'negative').length;
  const averageNegativeRate = historicalTotal > 0 ? (historicalNegative / historicalTotal) * 100 : 0;

  // Anomaly if current rate is 2 standard deviations above average (simplified: 50% higher)
  const threshold = averageNegativeRate * 1.5;
  const hasAnomaly = currentNegativeRate > threshold && currentNegativeRate > 10;

  return {
    hasAnomaly,
    currentNegativeRate: Math.round(currentNegativeRate * 10) / 10,
    averageNegativeRate: Math.round(averageNegativeRate * 10) / 10,
    threshold: Math.round(threshold * 10) / 10,
  };
}

/**
 * Detect response time degradation
 * Returns true if average response time is significantly higher than normal
 */
export async function detectResponseTimeAnomaly(): Promise<{
  hasAnomaly: boolean;
  currentAvgMs: number;
  historicalAvgMs: number;
  threshold: number;
}> {
  const db = await getDb();
  if (!db) return { hasAnomaly: false, currentAvgMs: 0, historicalAvgMs: 0, threshold: 0 };

  // Get last 2 hours average response time
  const last2Hours = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const recentMessages = await db
    .select({ responseTimeMs: messages.responseTimeMs })
    .from(messages)
    .where(and(
      gte(messages.createdAt, last2Hours),
      isNotNull(messages.responseTimeMs)
    ));

  const recentTimes = recentMessages.map(m => m.responseTimeMs).filter((t): t is number => t !== null);
  const currentAvgMs = recentTimes.length > 0 
    ? recentTimes.reduce((sum, t) => sum + t, 0) / recentTimes.length 
    : 0;

  // Get 7-day average
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const historicalMessages = await db
    .select({ responseTimeMs: messages.responseTimeMs })
    .from(messages)
    .where(and(
      gte(messages.createdAt, last7Days),
      lte(messages.createdAt, last2Hours),
      isNotNull(messages.responseTimeMs)
    ));

  const historicalTimes = historicalMessages.map(m => m.responseTimeMs).filter((t): t is number => t !== null);
  const historicalAvgMs = historicalTimes.length > 0 
    ? historicalTimes.reduce((sum, t) => sum + t, 0) / historicalTimes.length 
    : 0;

  // Anomaly if current is 100% higher than historical
  const threshold = historicalAvgMs * 2;
  const hasAnomaly = currentAvgMs > threshold && currentAvgMs > 2000;

  return {
    hasAnomaly,
    currentAvgMs: Math.round(currentAvgMs),
    historicalAvgMs: Math.round(historicalAvgMs),
    threshold: Math.round(threshold),
  };
}

/**
 * Detect satisfaction score decline
 * Returns true if satisfaction dropped significantly
 */
export async function detectSatisfactionDecline(): Promise<{
  hasDecline: boolean;
  currentScore: number;
  previousScore: number;
  changePercent: number;
}> {
  const db = await getDb();
  if (!db) return { hasDecline: false, currentScore: 0, previousScore: 0, changePercent: 0 };

  // Get last 7 days satisfaction
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const recentMessages = await db
    .select({ sentiment: messages.sentiment })
    .from(messages)
    .where(gte(messages.createdAt, last7Days));

  const recentTotal = recentMessages.length;
  const recentPositive = recentMessages.filter(m => m.sentiment === 'positive').length;
  const currentScore = recentTotal > 0 ? (recentPositive / recentTotal) * 100 : 0;

  // Get previous 7 days
  const previousMessages = await db
    .select({ sentiment: messages.sentiment })
    .from(messages)
    .where(and(
      gte(messages.createdAt, last14Days),
      lte(messages.createdAt, last7Days)
    ));

  const previousTotal = previousMessages.length;
  const previousPositive = previousMessages.filter(m => m.sentiment === 'positive').length;
  const previousScore = previousTotal > 0 ? (previousPositive / previousTotal) * 100 : 0;

  const changePercent = previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;
  const hasDecline = changePercent < -10; // More than 10% decline

  return {
    hasDecline,
    currentScore: Math.round(currentScore * 10) / 10,
    previousScore: Math.round(previousScore * 10) / 10,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

/**
 * Get high-volume query categories that may need attention
 */
export async function getHighVolumeCategories(): Promise<Array<{
  category: string;
  count: number;
  negativeRate: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const categoryStats = await db
    .select({
      category: messages.category,
      total: count(),
    })
    .from(messages)
    .where(and(
      gte(messages.createdAt, last24Hours),
      isNotNull(messages.category)
    ))
    .groupBy(messages.category)
    .orderBy(desc(count()));

  const results = [];
  for (const stat of categoryStats.slice(0, 5)) {
    if (!stat.category) continue;
    
    const negativeCount = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        gte(messages.createdAt, last24Hours),
        eq(messages.category, stat.category),
        eq(messages.sentiment, 'negative')
      ));

    const negativeRate = stat.total > 0 ? ((negativeCount[0]?.count || 0) / stat.total) * 100 : 0;
    
    results.push({
      category: stat.category,
      count: stat.total,
      negativeRate: Math.round(negativeRate * 10) / 10,
    });
  }

  return results;
}

/**
 * Snooze a notification until a specific time
 */
export async function snoozeNotification(id: number, snoozeUntil: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(notifications)
    .set({ 
      snoozeUntil,
      isRead: true // Mark as read when snoozed
    })
    .where(eq(notifications.id, id));

  return true;
}

/**
 * Get snoozed notifications that should reappear
 */
export async function getSnoozedNotificationsToReactivate(): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  return await db
    .select()
    .from(notifications)
    .where(and(
      isNotNull(notifications.snoozeUntil),
      lte(notifications.snoozeUntil, now),
      eq(notifications.isDismissed, false)
    ));
}

/**
 * Reactivate snoozed notifications
 */
export async function reactivateSnoozedNotifications(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  
  const result = await db
    .update(notifications)
    .set({ 
      isRead: false,
      snoozeUntil: null
    })
    .where(and(
      isNotNull(notifications.snoozeUntil),
      lte(notifications.snoozeUntil, now),
      eq(notifications.isDismissed, false)
    ));

  return 1; // Drizzle doesn't return affected rows easily, return 1 if successful
}

/**
 * Get notification history (including dismissed)
 */
export async function getNotificationHistory(limit: number = 100): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}


// ============ Email Recipients Queries ============

/**
 * Get all email recipients
 */
export async function getEmailRecipients(): Promise<EmailRecipient[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailRecipients)
    .where(eq(emailRecipients.isActive, true))
    .orderBy(desc(emailRecipients.createdAt));
}

/**
 * Add a new email recipient
 */
export async function addEmailRecipient(data: InsertEmailRecipient): Promise<EmailRecipient | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(emailRecipients).values(data);
  
  const result = await db
    .select()
    .from(emailRecipients)
    .where(eq(emailRecipients.email, data.email))
    .limit(1);

  return result[0] || null;
}

/**
 * Update email recipient preferences
 */
export async function updateEmailRecipient(id: number, data: Partial<InsertEmailRecipient>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(emailRecipients)
    .set(data)
    .where(eq(emailRecipients.id, id));

  return true;
}

/**
 * Remove an email recipient (soft delete)
 */
export async function removeEmailRecipient(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(emailRecipients)
    .set({ isActive: false })
    .where(eq(emailRecipients.id, id));

  return true;
}

// ============ API Keys Queries ============

/**
 * Get all API keys (without revealing the actual key)
 */
export async function getApiKeys(): Promise<Array<Omit<ApiKey, 'keyHash'>>> {
  const db = await getDb();
  if (!db) return [];

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      isActive: apiKeys.isActive,
      createdAt: apiKeys.createdAt,
      createdBy: apiKeys.createdBy,
    })
    .from(apiKeys)
    .where(eq(apiKeys.isActive, true))
    .orderBy(desc(apiKeys.createdAt));

  return keys;
}

/**
 * Create a new API key
 * Returns the full key only once - it should be shown to the user immediately
 */
export async function createApiKey(data: {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
  createdBy?: number;
}): Promise<{ key: string; keyPrefix: string; id: number } | null> {
  const db = await getDb();
  if (!db) return null;

  // Generate a random API key
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  const fullKey = 'sma_' + Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const keyPrefix = fullKey.substring(0, 12);
  
  // Hash the key for storage
  const encoder = new TextEncoder();
  const keyData = encoder.encode(fullKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  await db.insert(apiKeys).values({
    name: data.name,
    keyHash,
    keyPrefix,
    permissions: data.permissions ? JSON.stringify(data.permissions) : null,
    expiresAt: data.expiresAt,
    createdBy: data.createdBy,
  });

  const result = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  return {
    key: fullKey,
    keyPrefix,
    id: result[0]?.id || 0,
  };
}

/**
 * Validate an API key
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const db = await getDb();
  if (!db) return null;

  // Hash the provided key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const result = await db
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true)
    ))
    .limit(1);

  if (result.length === 0) return null;

  const apiKey = result[0];

  // Check expiration
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return apiKey;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(eq(apiKeys.id, id));

  return true;
}

// ============ Scheduled Reports Queries ============

/**
 * Get all scheduled reports
 */
export async function getScheduledReports(): Promise<ScheduledReport[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.isActive, true))
    .orderBy(desc(scheduledReports.createdAt));
}

/**
 * Create a new scheduled report
 */
export async function createScheduledReport(data: InsertScheduledReport): Promise<ScheduledReport | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(scheduledReports).values(data);

  const result = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.name, data.name))
    .orderBy(desc(scheduledReports.createdAt))
    .limit(1);

  return result[0] || null;
}

/**
 * Update a scheduled report
 */
export async function updateScheduledReport(id: number, data: Partial<InsertScheduledReport>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(scheduledReports)
    .set(data)
    .where(eq(scheduledReports.id, id));

  return true;
}

/**
 * Delete a scheduled report (soft delete)
 */
export async function deleteScheduledReport(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(scheduledReports)
    .set({ isActive: false })
    .where(eq(scheduledReports.id, id));

  return true;
}

/**
 * Get reports due for sending
 */
export async function getReportsDueForSending(): Promise<ScheduledReport[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  return await db
    .select()
    .from(scheduledReports)
    .where(and(
      eq(scheduledReports.isActive, true),
      lte(scheduledReports.nextSendAt, now)
    ));
}

/**
 * Update report after sending
 */
export async function markReportAsSent(id: number, nextSendAt: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(scheduledReports)
    .set({ 
      lastSentAt: new Date(),
      nextSendAt
    })
    .where(eq(scheduledReports.id, id));

  return true;
}

// ============ Email Logs Queries ============

/**
 * Log an email send attempt
 */
export async function logEmailSend(data: InsertEmailLog): Promise<EmailLog | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(emailLogs).values(data);

  const result = await db
    .select()
    .from(emailLogs)
    .orderBy(desc(emailLogs.createdAt))
    .limit(1);

  return result[0] || null;
}

/**
 * Get email logs
 */
export async function getEmailLogs(limit: number = 100): Promise<EmailLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailLogs)
    .orderBy(desc(emailLogs.createdAt))
    .limit(limit);
}

/**
 * Update email log status
 */
export async function updateEmailLogStatus(id: number, status: 'sent' | 'failed', errorMessage?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(emailLogs)
    .set({ 
      status,
      errorMessage,
      sentAt: status === 'sent' ? new Date() : undefined
    })
    .where(eq(emailLogs.id, id));

  return true;
}


/**
 * Get top individual queries with student and category information
 */
export async function getTopIndividualQueries(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  // Get messages grouped by query text to find most frequent queries
  const result = await db
    .select({
      id: messages.id,
      query: messages.query,
      category: messages.category,
      studentId: messages.studentId,
      studentName: students.name,
      createdAt: messages.createdAt,
      responseTimeMs: messages.responseTimeMs,
      sentiment: messages.sentiment,
      isResolved: messages.isResolved,
    })
    .from(messages)
    .leftJoin(students, eq(messages.studentId, students.id))
    .orderBy(desc(messages.createdAt));

  // Group by query to count occurrences
  const queryMap = new Map();
  result.forEach(row => {
    if (row.query && !queryMap.has(row.query)) {
      const count = result.filter(r => r.query === row.query).length;
      const categoryValue = row.category || 'General';
      queryMap.set(row.query, {
        query: row.query,
        category: categoryValue,
        count: count,
        studentId: row.studentId,
        studentName: row.studentName,
        createdAt: row.createdAt,
        responseTimeMs: row.responseTimeMs,
        sentiment: row.sentiment,
        isResolved: row.isResolved,
      });
    }
  });

  // Sort by count descending and return top limit
  return Array.from(queryMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
