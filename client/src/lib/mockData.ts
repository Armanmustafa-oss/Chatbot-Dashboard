/**
 * Mock data for static frontend (replaces tRPC)
 * This provides sample data for all dashboard pages
 */

export const mockAnalyticsData = {
  getDailyData: () => [
  { 
    date: "2024-01-01", 
    totalMessages: 45, 
    uniqueStudents: 12, 
    positiveCount: 30, 
    neutralCount: 10, 
    negativeCount: 5,
    avgResponseTimeMs: 1200,
    avgRating: 4.2 
  },
  { 
    date: "2024-01-02", 
    totalMessages: 52, 
    uniqueStudents: 15, 
    positiveCount: 35, 
    neutralCount: 12, 
    negativeCount: 5,
    avgResponseTimeMs: 1500,
    avgRating: 4.3 
  },
  
  // ... add more entries with same structure
],
  getHourlyPeakTimes: () => [
  { hour: "08:00", messages: 12 },
  { hour: "09:00", messages: 28 },
  { hour: "10:00", messages: 35 },
  { hour: "11:00", messages: 42 },
  { hour: "12:00", messages: 38 },
  { hour: "13:00", messages: 25 },
  { hour: "14:00", messages: 45 },
  { hour: "15:00", messages: 52 },
  { hour: "16:00", messages: 48 },
  { hour: "17:00", messages: 32 },
],
  getKPISummary: () => ({
  totalMessages: 3952,
  totalStudents: 287,
  avgSatisfaction: 4.2,
  avgResponseTime: 1800,        // Match Settings.tsx expectation
  resolutionRate: 78,
  positiveCount: 2530,          // Required by Settings.tsx
  neutralCount: 1000,
  negativeCount: 422,
}),
};

export const mockMessagesData = {
  list: () => [
    {
      id: 1,
      studentId: "STU001",
      query: "How do I reset my password?",
      response: "You can reset your password by clicking the forgot password link on the login page.",
      category: "Account",
      sentiment: "neutral",
      rating: 5,
      responseTimeMs: 1200,
      createdAt: new Date("2024-01-05"),
    },
    {
      id: 2,
      studentId: "STU002",
      query: "What are the course prerequisites?",
      response: "The prerequisites are listed in the course description.",
      category: "Academics",
      sentiment: "positive",
      rating: 4,
      responseTimeMs: 1500,
      createdAt: new Date("2024-01-05"),
    },
    {
      id: 3,
      studentId: "STU003",
      query: "When is the next exam?",
      response: "The next exam is scheduled for January 15th at 2:00 PM.",
      category: "Academics",
      sentiment: "neutral",
      rating: 5,
      responseTimeMs: 800,
      createdAt: new Date("2024-01-04"),
    },
  ],

  getById: (id: number) => ({
    id,
    studentId: `STU${String(id).padStart(3, "0")}`,
    query: "Sample question?",
    response: "Sample response to the question.",
    category: "General",
    sentiment: "neutral",
    rating: 4,
    responseTimeMs: 1000,
    createdAt: new Date(),
  }),
};

export const mockStudentsData = {
  list: () => [
    { id: 1, studentId: "STU001", name: "John Doe", messagesCount: 12, lastActive: new Date() },
    { id: 2, studentId: "STU002", name: "Jane Smith", messagesCount: 8, lastActive: new Date() },
    { id: 3, studentId: "STU003", name: "Bob Johnson", messagesCount: 15, lastActive: new Date() },
  ],
};

export const mockApiKeysData = {
  list: () => [
    {
      id: "key_1",
      name: "Production API Key",
      keyPrefix: "sk_live_...",
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ],
};

export const mockEmailRecipientsData = {
  list: () => [
    { id: "rec_1", email: "admin@example.com", name: "Admin" },
  ],
};

export const mockScheduledReportsData = {
  list: () => [
    {
      id: "rep_1",
      reportType: "Daily Summary",
      recipients: ["admin@example.com"],
      frequency: "daily",
      createdAt: new Date(),
    },
  ],
};
