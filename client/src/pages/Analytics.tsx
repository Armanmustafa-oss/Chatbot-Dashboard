import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Activity,
  CalendarIcon,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const { data: dailyData, isLoading: isLoadingDaily } = trpc.analytics.getDailyData.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: hourlyData, isLoading: isLoadingHourly } = trpc.analytics.getHourlyPeakTimes.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: kpiData, isLoading: isLoadingKPI } = trpc.analytics.getKPISummary.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const formattedDailyData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.map((d) => ({
      date: format(new Date(d.date), "MMM d"),
      messages: d.totalMessages,
      positive: d.positiveCount,
      negative: d.negativeCount,
    }));
  }, [dailyData]);

  const formattedHourlyData = useMemo(() => {
    if (!hourlyData) return [];
    return hourlyData.map((h) => ({
      hour: `${h.hour}:00`,
      messages: Number(h.totalMessages) || 0,
    }));
  }, [hourlyData]);

  const presetRanges = [
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
  ];

  const setPresetRange = (days: number) => {
    setDateRange({
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      to: new Date(),
    });
  };

  return (
    <DashboardLayout>
      {/* Header with Date Range Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into messaging patterns and trends
          </p>
        </div>

        <div className="flex gap-3 items-center">
          {/* Preset Buttons */}
          <div className="neu-flat px-1 p-1 rounded-xl flex items-center gap-1">
            {presetRanges.map((range) => (
              <button
                key={range.days}
                onClick={() => setPresetRange(range.days)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (24 * 60 * 60 * 1000)) === range.days
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="neu-flat border-0 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {kpiData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NeuCard className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Messages</p>
            <p className="text-3xl font-bold text-foreground">
              {(kpiData.totalMessages || 0).toLocaleString()}
            </p>
          </NeuCard>
          <NeuCard className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-foreground">
              {Math.round(kpiData.avgResponseTime || 0)}ms
            </p>
          </NeuCard>
          <NeuCard className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Satisfaction Rate</p>
            <p className="text-3xl font-bold text-green-600">
              {kpiData.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%
            </p>
          </NeuCard>
          <NeuCard className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Students</p>
            <p className="text-3xl font-bold text-foreground">
              {(kpiData.uniqueStudents || 0).toLocaleString()}
            </p>
          </NeuCard>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Message Volume */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Message Volume Trend</h3>
              <p className="text-sm text-muted-foreground">Daily message count over selected period</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {isLoadingDaily ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedDailyData}>
                  <defs>
                    <linearGradient id="colorMessagesAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "5px 5px 10px #d1d9e6",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMessagesAnalytics)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeuCard>

        {/* Hourly Peak Times */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Peak Messaging Times</h3>
              <p className="text-sm text-muted-foreground">Aggregated hourly activity</p>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {isLoadingHourly ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "5px 5px 10px #d1d9e6",
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
            )}
          </div>
        </NeuCard>
      </div>

      {/* Sentiment Breakdown */}
      {kpiData && (
        <NeuCard>
          <h3 className="text-lg font-bold text-foreground mb-6">Sentiment Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-600">
                {(kpiData.positiveCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-700 mt-1">Positive</p>
              <p className="text-xs text-green-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-gray-600">
                {(kpiData.neutralCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 mt-1">Neutral</p>
              <p className="text-xs text-gray-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.neutralCount || 0) / kpiData.totalMessages) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-red-600">
                {(kpiData.negativeCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-red-700 mt-1">Negative</p>
              <p className="text-xs text-red-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.negativeCount || 0) / kpiData.totalMessages) * 100) : 0}%
              </p>
            </div>
          </div>
        </NeuCard>
      )}
    </DashboardLayout>
  );
}
