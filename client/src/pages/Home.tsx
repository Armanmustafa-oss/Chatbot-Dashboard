import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  generateMessagingData,
  generatePeakTimeData,
  kpiData,
  sentimentData,
  topQueries
} from "@/lib/data-parser";
import {
  Activity,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Filter,
  MessageCircle,
  ThumbsUp,
  TrendingUp
} from "lucide-react";
import { useMemo, useState } from "react";
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
  YAxis
} from "recharts";

export default function Home() {
  const [timeRange, setTimeRange] = useState("30d");
  
  const dailyData = useMemo(() => generateMessagingData(), []);
  const peakTimeData = useMemo(() => generatePeakTimeData(), []);

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Administrator. Here's what's happening today.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="neu-flat px-1 p-1 rounded-xl flex items-center gap-1">
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
          <Button variant="outline" className="neu-flat border-0 h-12 w-12 p-0 rounded-xl">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="outline" className="neu-flat border-0 h-12 w-12 p-0 rounded-xl">
            <Download className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NeuStat 
          label="Total Messages" 
          value={kpiData.totalMessages.toLocaleString()} 
          icon={MessageCircle} 
          trend="+12.5%" 
        />
        <NeuStat 
          label="Avg Response Time" 
          value={kpiData.avgResponseTime} 
          icon={Clock} 
          trend="-0.4s" 
        />
        <NeuStat 
          label="Satisfaction Score" 
          value={kpiData.satisfactionScore} 
          icon={ThumbsUp} 
          trend="+0.2" 
        />
        <NeuStat 
          label="Est. Cost Saved" 
          value={kpiData.moneySaved} 
          icon={DollarSign} 
          trend="+15%" 
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Message Volume Trend (Large Area Chart) */}
        <NeuCard className="lg:col-span-2 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Message Volume Trend</h3>
              <p className="text-sm text-muted-foreground">Daily student interactions over time</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '5px 5px 10px #d1d9e6' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMessages)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        {/* Sentiment Analysis (Pie Chart) */}
        <NeuCard className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Sentiment Analysis</h3>
              <p className="text-sm text-muted-foreground">Student satisfaction breakdown</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px] relative">
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
                    backgroundColor: 'var(--color-card)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '5px 5px 10px #d1d9e6' 
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-bold text-foreground">90%</span>
              <span className="text-xs text-muted-foreground font-semibold uppercase">Positive</span>
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Peak Messaging Times (Bar Chart) */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Peak Messaging Times</h3>
              <p className="text-sm text-muted-foreground">Hourly activity distribution (24h)</p>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
                  interval={2}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '5px 5px 10px #d1d9e6' 
                  }}
                />
                <Bar 
                  dataKey="messages" 
                  fill="var(--color-primary)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        {/* Top Queries List */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Top Student Queries</h3>
              <p className="text-sm text-muted-foreground">Most frequently asked topics</p>
            </div>
            <div className="p-2 bg-secondary rounded-lg">
              <Calendar className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="space-y-4">
            {topQueries.map((query, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {query.topic}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{query.count}</span>
                  <span className="text-xs text-muted-foreground">queries</span>
                </div>
              </div>
            ))}
            
            <div className="mt-6 pt-4 border-t border-border">
              <Button variant="ghost" className="w-full text-primary hover:text-primary/80 hover:bg-primary/5">
                View All Queries
              </Button>
            </div>
          </div>
        </NeuCard>
      </div>
    </DashboardLayout>
  );
}
