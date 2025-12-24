import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useMemo } from "react";
import {
  Activity,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Filter,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

// Mock data for charts
const generateMessagingData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      date: `Day ${i + 1}`,
      messages: Math.floor(Math.random() * 300 + 100),
    });
  }
  return data;
};

const generatePeakTimeData = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      hour: `${String(i).padStart(2, "0")}:00`,
      messages: Math.floor(Math.random() * 100 + 20),
    });
  }
  return hours;
};

const kpiData = {
  totalMessages: 3952,
  avgResponseTime: "1.8s",
  satisfactionScore: "64%",
  moneySaved: "$8,233",
};

const sentimentData = [
  { name: "Positive", value: 64, fill: "#10b981" },
  { name: "Neutral", value: 25, fill: "#6b7280" },
  { name: "Negative", value: 11, fill: "#ef4444" },
];

const topQueries = [
  { topic: "General Questions", count: 17 },
  { topic: "Class Schedule", count: 9 },
  { topic: "Course Information", count: 4 },
  { topic: "Contact Information", count: 1 },
  { topic: "Fee/Payment Information", count: 1 },
];

export default function Home() {
  const [timeRange, setTimeRange] = useState("30d");
  const dailyData = useMemo(() => generateMessagingData(), []);
  const peakTimeData = useMemo(() => generatePeakTimeData(), []);

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Administrator. Here's what's happening today.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex gap-1 bg-card rounded-xl p-1 border border-border">
            {["7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  timeRange === range
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "3 Months"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Filter className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Messages */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                TOTAL MESSAGES
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {kpiData.totalMessages.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-green-600">+12.5%</p>
            </div>
            <div className="text-4xl text-primary opacity-20">
              <MessageCircle />
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                AVG RESPONSE TIME
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {kpiData.avgResponseTime}
              </p>
              <p className="mt-1 text-sm text-green-600">-0.4s</p>
            </div>
            <div className="text-4xl text-primary opacity-20">
              <Clock />
            </div>
          </div>
        </div>

        {/* Satisfaction Score */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                SATISFACTION SCORE
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {kpiData.satisfactionScore}
              </p>
              <p className="mt-1 text-sm text-green-600">+2%</p>
            </div>
            <div className="text-4xl text-primary opacity-20">
              <ThumbsUp />
            </div>
          </div>
        </div>

        {/* Cost Saved */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                EST. COST SAVED
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {kpiData.moneySaved}
              </p>
              <p className="mt-1 text-sm text-green-600">+15%</p>
            </div>
            <div className="text-4xl text-primary opacity-20">
              <DollarSign />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Message Volume Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Message Volume Trend
              </h3>
              <p className="text-sm text-muted-foreground">
                Daily student interactions over time
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMessages)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Sentiment Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Student satisfaction breakdown
              </p>
            </div>
          </div>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-bold text-foreground">90%</span>
              <span className="text-xs text-muted-foreground font-semibold uppercase">
                Positive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Messaging Times */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Peak Messaging Times
              </h3>
              <p className="text-sm text-muted-foreground">
                Hourly activity distribution (24h)
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakTimeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  interval={2}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar
                  dataKey="messages"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Queries List */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Top Student Queries
              </h3>
              <p className="text-sm text-muted-foreground">
                Most frequently asked topics
              </p>
            </div>
            <div className="p-2 bg-secondary rounded-lg">
              <Calendar className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="space-y-4">
            {topQueries.map((query, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {query.topic}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {query.count}
                  </span>
                  <span className="text-xs text-muted-foreground">queries</span>
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
              >
                View All Queries
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
