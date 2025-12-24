import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { MessageSquare, Clock, Smile, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Mock data
const messageVolumeData = [
  { date: "Nov 24", messages: 120 },
  { date: "Nov 25", messages: 150 },
  { date: "Nov 26", messages: 200 },
  { date: "Nov 27", messages: 180 },
  { date: "Nov 28", messages: 220 },
  { date: "Nov 29", messages: 250 },
  { date: "Nov 30", messages: 280 },
];

const sentimentData = [
  { name: "Positive", value: 64, color: "#10b981" },
  { name: "Neutral", value: 25, color: "#6b7280" },
  { name: "Negative", value: 11, color: "#ef4444" },
];

const peakHoursData = [
  { hour: "08:00", messages: 45 },
  { hour: "09:00", messages: 52 },
  { hour: "10:00", messages: 48 },
  { hour: "11:00", messages: 61 },
  { hour: "12:00", messages: 55 },
  { hour: "13:00", messages: 67 },
  { hour: "14:00", messages: 72 },
  { hour: "15:00", messages: 68 },
  { hour: "16:00", messages: 59 },
  { hour: "17:00", messages: 45 },
];

const topQueriesData = [
  { category: "General Questions", queries: 17 },
  { category: "Class Schedule", queries: 9 },
  { category: "Course Information", queries: 4 },
  { category: "Contact Information", queries: 1 },
  { category: "Fee/Payment Information", queries: 1 },
];

export default function Home() {
  const [timePeriod, setTimePeriod] = useState("30D");

  return (
    <div className="flex">
      <Sidebar />
      <div className="main-content">
        <Header
          title="Dashboard Overview"
          subtitle="Welcome back, Administrator. Here's what's happening."
        >
          <div className="flex gap-2">
            {["24H", "7D", "30D"].map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  timePeriod === period
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-gray-300"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </Header>

        <div className="page-content">
          {/* KPI Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              icon={<MessageSquare />}
              label="TOTAL MESSAGES"
              value="3,952"
              change="+12.5%"
              changeType="positive"
            />
            <KPICard
              icon={<Clock />}
              label="AVG RESPONSE TIME"
              value="1.8"
              change="-0.4s"
              changeType="positive"
              description="seconds"
            />
            <KPICard
              icon={<Smile />}
              label="SATISFACTION SCORE"
              value="64%"
              change="+2%"
              changeType="positive"
            />
            <KPICard
              icon={<DollarSign />}
              label="EST. COST SAVED"
              value="$8,233"
              change="+15%"
              changeType="positive"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Message Volume Trend */}
            <div className="chart-container">
              <h3 className="mb-4 text-lg font-bold text-foreground">Message Volume Trend</h3>
              <p className="mb-4 text-sm text-muted-foreground">Daily student interactions over time</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={messageVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment Analysis */}
            <div className="chart-container">
              <h3 className="mb-4 text-lg font-bold text-foreground">Sentiment Analysis</h3>
              <p className="mb-4 text-sm text-muted-foreground">All sentiment categories</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Messaging Times */}
            <div className="chart-container">
              <h3 className="mb-4 text-lg font-bold text-foreground">Peak Messaging Times</h3>
              <p className="mb-4 text-sm text-muted-foreground">Hourly activity distribution (24h)</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Student Queries */}
            <div className="chart-container">
              <h3 className="mb-4 text-lg font-bold text-foreground">Top Student Queries</h3>
              <p className="mb-4 text-sm text-muted-foreground">Most frequently asked topics</p>
              <div className="space-y-3">
                {topQueriesData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(item.queries / 20) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.queries}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
