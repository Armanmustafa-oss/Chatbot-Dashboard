import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import { createCallerFactory } from './_core/trpc';

// Mock the database functions
vi.mock('./db', () => ({
  getDailyAnalytics: vi.fn().mockResolvedValue([
    {
      id: 1,
      date: new Date('2024-12-01'),
      totalMessages: 150,
      positiveCount: 100,
      neutralCount: 30,
      negativeCount: 20,
      avgResponseTimeMs: 1500,
      avgRating: 45,
      uniqueStudents: 50,
    },
    {
      id: 2,
      date: new Date('2024-12-02'),
      totalMessages: 180,
      positiveCount: 120,
      neutralCount: 40,
      negativeCount: 20,
      avgResponseTimeMs: 1400,
      avgRating: 46,
      uniqueStudents: 60,
    },
  ]),
  getAggregatedHourlyData: vi.fn().mockResolvedValue([
    { hour: 9, totalMessages: 50 },
    { hour: 10, totalMessages: 80 },
    { hour: 11, totalMessages: 120 },
    { hour: 14, totalMessages: 100 },
    { hour: 15, totalMessages: 90 },
  ]),
  getTopQueryCategories: vi.fn().mockResolvedValue([
    { id: 1, name: 'Exam Schedule', count: 250, lastUpdated: new Date() },
    { id: 2, name: 'Course Registration', count: 200, lastUpdated: new Date() },
    { id: 3, name: 'Library Hours', count: 150, lastUpdated: new Date() },
  ]),
  getKPISummary: vi.fn().mockResolvedValue({
    totalMessages: 4500,
    avgResponseTime: 1500,
    avgRating: 45,
    positiveCount: 3000,
    neutralCount: 1000,
    negativeCount: 500,
    uniqueStudents: 500,
  }),
  getMessages: vi.fn().mockResolvedValue([
    {
      id: 1,
      studentId: 1,
      query: 'When is the final exam?',
      response: 'The final exam is on December 15th.',
      sentiment: 'positive',
      category: 'Exam Schedule',
      responseTimeMs: 1200,
      isResolved: true,
      rating: 5,
      createdAt: new Date('2024-12-01T10:00:00'),
    },
  ]),
  getMessageById: vi.fn().mockResolvedValue({
    message: {
      id: 1,
      studentId: 1,
      query: 'When is the final exam?',
      response: 'The final exam is on December 15th.',
      sentiment: 'positive',
      category: 'Exam Schedule',
      responseTimeMs: 1200,
      isResolved: true,
      rating: 5,
      createdAt: new Date('2024-12-01T10:00:00'),
    },
    student: {
      id: 1,
      studentId: 'STU12345',
      name: 'John Doe',
      email: 'john.doe@university.edu',
      department: 'Computer Science',
      createdAt: new Date(),
      lastActiveAt: new Date(),
    },
  }),
  getMessageCount: vi.fn().mockResolvedValue(100),
  getStudents: vi.fn().mockResolvedValue([
    {
      id: 1,
      studentId: 'STU12345',
      name: 'John Doe',
      email: 'john.doe@university.edu',
      department: 'Computer Science',
      createdAt: new Date(),
      lastActiveAt: new Date(),
    },
    {
      id: 2,
      studentId: 'STU12346',
      name: 'Jane Smith',
      email: 'jane.smith@university.edu',
      department: 'Engineering',
      createdAt: new Date(),
      lastActiveAt: new Date(),
    },
  ]),
  getStudentById: vi.fn().mockResolvedValue({
    id: 1,
    studentId: 'STU12345',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    department: 'Computer Science',
    createdAt: new Date(),
    lastActiveAt: new Date(),
  }),
  getNotifications: vi.fn().mockResolvedValue([
    {
      id: 1,
      type: 'critical',
      title: 'Student Frustration Detected',
      message: 'A student has expressed frustration multiple times.',
      studentId: 1,
      messageId: 10,
      isRead: false,
      isDismissed: false,
      createdAt: new Date(),
    },
    {
      id: 2,
      type: 'warning',
      title: 'Low Satisfaction Score',
      message: 'Satisfaction score dropped below 70%.',
      studentId: null,
      messageId: null,
      isRead: false,
      isDismissed: false,
      createdAt: new Date(),
    },
  ]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(5),
  createNotification: vi.fn().mockResolvedValue({
    id: 3,
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification.',
    studentId: null,
    messageId: null,
    isRead: false,
    isDismissed: false,
    createdAt: new Date(),
  }),
  markNotificationAsRead: vi.fn().mockResolvedValue(true),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(true),
  dismissNotification: vi.fn().mockResolvedValue(true),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

const createCaller = createCallerFactory(appRouter);

describe('Analytics Router', () => {
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user: null,
  };

  const caller = createCaller(mockContext);

  it('should get daily analytics data', async () => {
    const result = await caller.analytics.getDailyData({
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-02'),
    });

    expect(result).toHaveLength(2);
    expect(result[0].totalMessages).toBe(150);
    expect(result[1].totalMessages).toBe(180);
  });

  it('should get hourly peak times', async () => {
    const result = await caller.analytics.getHourlyPeakTimes({
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-02'),
    });

    expect(result).toHaveLength(5);
    expect(result[2].hour).toBe(11);
    expect(result[2].totalMessages).toBe(120);
  });

  it('should get top query categories', async () => {
    const result = await caller.analytics.getTopQueries({ limit: 10 });

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Exam Schedule');
    expect(result[0].count).toBe(250);
  });

  it('should get KPI summary', async () => {
    const result = await caller.analytics.getKPISummary({
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-02'),
    });

    expect(result).not.toBeNull();
    expect(result?.totalMessages).toBe(4500);
    expect(result?.positiveCount).toBe(3000);
  });
});

describe('Messages Router', () => {
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user: null,
  };

  const caller = createCaller(mockContext);

  it('should list messages', async () => {
    const result = await caller.messages.list({
      limit: 50,
      offset: 0,
    });

    expect(result.messages).toHaveLength(1);
    expect(result.total).toBe(100);
    expect(result.messages[0].query).toBe('When is the final exam?');
  });

  it('should get message by ID', async () => {
    const result = await caller.messages.getById({ id: 1 });

    expect(result).not.toBeNull();
    expect(result?.message.query).toBe('When is the final exam?');
    expect(result?.student?.name).toBe('John Doe');
  });

  it('should get message count', async () => {
    const result = await caller.messages.count({});

    expect(result).toBe(100);
  });
});

describe('Students Router', () => {
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user: null,
  };

  const caller = createCaller(mockContext);

  it('should list students', async () => {
    const result = await caller.students.list({
      limit: 50,
      offset: 0,
    });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('John Doe');
    expect(result[1].name).toBe('Jane Smith');
  });

  it('should get student by ID', async () => {
    const result = await caller.students.getById({ id: 1 });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('John Doe');
    expect(result?.department).toBe('Computer Science');
  });
});

describe('Notifications Router', () => {
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user: null,
  };

  const caller = createCaller(mockContext);

  it('should list notifications', async () => {
    const result = await caller.notifications.list({
      limit: 10,
      includeRead: true,
    });

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('critical');
    expect(result[0].title).toBe('Student Frustration Detected');
  });

  it('should get unread notification count', async () => {
    const result = await caller.notifications.unreadCount();

    expect(result).toBe(5);
  });

  it('should mark notification as read', async () => {
    const result = await caller.notifications.markAsRead({ id: 1 });

    expect(result).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const result = await caller.notifications.markAllAsRead();

    expect(result).toBe(true);
  });

  it('should dismiss notification', async () => {
    const result = await caller.notifications.dismiss({ id: 1 });

    expect(result).toBe(true);
  });
});
