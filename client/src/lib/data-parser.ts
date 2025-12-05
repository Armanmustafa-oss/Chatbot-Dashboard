/**
 * Data Parser Utility
 * 
 * This utility parses the raw text content provided by the user to extract
 * meaningful metrics for the dashboard. Since the input is unstructured text
 * describing a chatbot's performance and requirements, we will simulate
 * the data visualization based on the *intent* of the text, as there is no
 * actual structured dataset (CSV/JSON) provided, only a description of what
 * the dashboard SHOULD show.
 * 
 * However, to make this functional and impressive, we will generate 
 * realistic mock data that mirrors the metrics requested in the text:
 * - Peak messaging times (Last 30 days)
 * - Positive vs Negative response rates
 * - Most frequent queries
 * - Time/Money saved
 * - Student satisfaction ratings
 */

export interface MessageData {
  date: string;
  hour: number;
  count: number;
}

export interface QueryData {
  topic: string;
  count: number;
}

export interface SentimentData {
  type: 'Positive' | 'Neutral' | 'Negative';
  value: number;
  fill: string;
}

export interface DailyActivity {
  date: string;
  messages: number;
}

// Generate last 30 days of data
export const generateMessagingData = (): DailyActivity[] => {
  const data: DailyActivity[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate higher traffic on weekdays
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseCount = isWeekend ? 50 : 150;
    const randomVar = Math.floor(Math.random() * 100);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      messages: baseCount + randomVar
    });
  }
  return data;
};

// Generate peak time heatmap data (24 hours)
export const generatePeakTimeData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    // Simulate peak times around 10AM-2PM and 7PM-10PM
    let base = 20;
    if (i >= 9 && i <= 14) base = 80;
    if (i >= 19 && i <= 22) base = 60;
    
    data.push({
      hour: `${i}:00`,
      messages: base + Math.floor(Math.random() * 30)
    });
  }
  return data;
};

export const sentimentData: SentimentData[] = [
  { type: 'Positive', value: 65, fill: 'var(--color-chart-1)' }, // Soft Blue
  { type: 'Neutral', value: 25, fill: 'var(--color-chart-3)' },  // Soft Yellow/Green
  { type: 'Negative', value: 10, fill: 'var(--color-chart-2)' }, // Coral
];

export const topQueries: QueryData[] = [
  { topic: "Exam Schedule", count: 450 },
  { topic: "Course Registration", count: 380 },
  { topic: "Library Hours", count: 310 },
  { topic: "Hostel Fees", count: 290 },
  { topic: "Bus Routes", count: 210 },
];

export const kpiData = {
  totalMessages: 12543,
  avgResponseTime: "1.2s",
  satisfactionScore: 4.8,
  moneySaved: "$15,400",
  timeSaved: "850 hrs"
};
