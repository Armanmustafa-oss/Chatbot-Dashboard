import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { exportAnalyticsToCSV } from "@/lib/export";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Activity,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Download,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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

export default function Home() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Fetch real data from database
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

  const { data: topQueries } = trpc.analytics.getTopQueries.useQuery({ limit: 5 });

  // Format data for charts
  const formattedDailyData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.map((d) => ({
      date: format(new Date(d.date), "MMM d"),
      messages: d.totalMessages,
    }));
  }, [dailyData]);

  const formattedHourlyData = useMemo(() => {
    if (!hourlyData) return [];
    return hourlyData.map((h) => ({
      hour: `${h.hour}:00`,
      messages: Number(h.totalMessages) || 0,
    }));
  }, [hourlyData]);

  const sentimentData = useMemo(() => {
    if (!kpiData) return [];
    const total = (kpiData.positiveCount || 0) + (kpiData.neutralCount || 0) + (kpiData.negativeCount || 0);
    if (total === 0) return [];
    return [
      { name: "Positive", value: kpiData.positiveCount || 0, fill: "#22c55e" },
      { name: "Neutral", value: kpiData.neutralCount || 0, fill: "#94a3b8" },
      { name: "Negative", value: kpiData.negativeCount || 0, fill: "#ef4444" },
    ];
  }, [kpiData]);

  const positivePercentage = useMemo(() => {
    if (!kpiData || !kpiData.totalMessages) return 0;
    return Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100);
  }, [kpiData]);

  // Calculate cost savings breakdown
  const costSavingsData = useMemo(() => {
    const totalMessages = kpiData?.totalMessages || 0;
    const avgMinutesPerQuery = 5;
    const hourlyRate = 25;
    const minutesSaved = totalMessages * avgMinutesPerQuery;
    const hoursSaved = minutesSaved / 60;
    const costSaved = hoursSaved * hourlyRate;
    
    return {
      totalMessages,
      avgMinutesPerQuery,
      hourlyRate,
      minutesSaved,
      hoursSaved: hoursSaved.toFixed(1),
      costSaved: Math.round(costSaved),
    };
  }, [kpiData]);

  const presetRanges = [
    { label: "7D", fullLabel: "7 Days", days: 7 },
    { label: "30D", fullLabel: "30 Days", days: 30 },
    { label: "90D", fullLabel: "90 Days", days: 90 },
  ];

  const setPresetRange = (days: number) => {
    setDateRange({
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      to: new Date(),
    });
  };

  const currentDays = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (24 * 60 * 60 * 1000));

  const handleExport = () => {
    if (dailyData && dailyData.length > 0) {
      const exportData = dailyData.map(d => ({
        ...d,
        uniqueStudents: d.uniqueStudents ?? 0
      }));
      exportAnalyticsToCSV(exportData);
      toast.success("Analytics data exported successfully!");
    } else {
      toast.error("No data to export");
    }
  };

  return (
    <DashboardLayout>
      {/* Header Section - Mobile Responsive */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back, Administrator. Here's what's happening.
          </p>
        </div>

        {/* Controls - Stack on mobile */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {/* Preset Range Buttons */}
          <div className="neu-flat px-1 p-1 rounded-xl flex items-center gap-1">
            {presetRanges.map((range) => (
              <button
                key={range.days}
                onClick={() => setPresetRange(range.days)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation",
                  currentDays === range.days
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={{ minHeight: "44px" }}
              >
                <span className="sm:hidden">{range.label}</span>
                <span className="hidden sm:inline">{range.fullLabel}</span>
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="neu-flat border-0 h-11 sm:h-12 px-3 sm:px-4 rounded-xl gap-2"
                style={{ minHeight: "44px" }}
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs sm:text-sm">
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
                numberOfMonths={1}
                className="sm:hidden"
              />
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
                className="hidden sm:block"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="neu-flat border-0 h-11 sm:h-12 w-11 sm:w-12 p-0 rounded-xl"
            onClick={handleExport}
            style={{ minHeight: "44px", minWidth: "44px" }}
          >
            <Download className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid - Interactive with Drill-Down */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <NeuStat
          label="Total Messages"
          value={isLoadingKPI ? "..." : (kpiData?.totalMessages || 0).toLocaleString()}
          icon={MessageCircle}
          trend="+12.5%"
          tooltipContent="Total number of student queries handled by the chatbot in the selected period."
        />
        <NeuStat
          label="Avg Response Time"
          value={isLoadingKPI ? "..." : `${Math.round(kpiData?.avgResponseTime || 0)}ms`}
          icon={Clock}
          trend="-0.4s"
          tooltipContent="Average time taken to generate a response to student queries."
        />
        <NeuStat
          label="Satisfaction Score"
          value={isLoadingKPI ? "..." : `${positivePercentage}%`}
          icon={ThumbsUp}
          trend="+2%"
          tooltipContent="Percentage of interactions rated as positive by sentiment analysis."
          drillDown={{
            title: "Satisfaction Score Breakdown",
            description: "Detailed analysis of student satisfaction metrics",
            breakdown: [
              { label: "Positive Interactions", value: kpiData?.positiveCount || 0, description: "Students satisfied with response" },
              { label: "Neutral Interactions", value: kpiData?.neutralCount || 0, description: "No strong sentiment detected" },
              { label: "Negative Interactions", value: kpiData?.negativeCount || 0, description: "Students unsatisfied with response" },
            ],
            formula: "Satisfaction = (Positive / Total) × 100",
          }}
        />
        <NeuStat
          label="Est. Cost Saved"
          value={isLoadingKPI ? "..." : `$${costSavingsData.costSaved.toLocaleString()}`}
          icon={DollarSign}
          trend="+15%"
          tooltipContent="Estimated cost savings from automated responses vs. human staff handling."
          drillDown={{
            title: "Cost Savings Calculation",
            description: "How we calculate the estimated cost savings from automation",
            breakdown: [
              { label: "Queries Automated", value: costSavingsData.totalMessages.toLocaleString(), description: "Total messages handled by bot" },
              { label: "Minutes Saved", value: costSavingsData.minutesSaved.toLocaleString(), description: `${costSavingsData.avgMinutesPerQuery} min × ${costSavingsData.totalMessages} queries` },
              { label: "Hours Saved", value: costSavingsData.hoursSaved, description: "Total staff hours saved" },
              { label: "Cost Saved", value: `$${costSavingsData.costSaved.toLocaleString()}`, description: `${costSavingsData.hoursSaved} hrs × $${costSavingsData.hourlyRate}/hr` },
            ],
            formula: "Cost Saved = (Queries × Avg Minutes) ÷ 60 × Hourly Rate",
            assumptions: [
              { label: "Avg Time per Query", value: `${costSavingsData.avgMinutesPerQuery} minutes` },
              { label: "Staff Hourly Rate", value: `$${costSavingsData.hourlyRate}/hour` },
            ],
          }}
        />
      </div>

      {/* Main Charts Section - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Message Volume Trend (Large Area Chart) */}
        <NeuCard className="lg:col-span-2 min-h-[300px] sm:min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Message Volume Trend</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Daily student interactions over time</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[200px] sm:min-h-[300px]">
            {isLoadingDaily ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedDailyData}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    width={40}
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
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeuCard>

        {/* Sentiment Analysis (Pie Chart) */}
        <NeuCard className="flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Sentiment Analysis</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Student satisfaction breakdown</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[200px] relative">
            {isLoadingKPI ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
                        backgroundColor: "var(--color-card)",
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "5px 5px 10px #d1d9e6",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{positivePercentage}%</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase">Positive</span>
                </div>
              </>
            )}
          </div>
        </NeuCard>
      </div>

      {/* Secondary Charts Row - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Peak Messaging Times (Bar Chart) */}
        <NeuCard className="min-h-[300px] sm:min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Peak Messaging Times</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Hourly activity distribution (24h)</p>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[200px] sm:min-h-[300px]">
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
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
                    interval={3}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    width={35}
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
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeuCard>

        {/* Top Queries List */}
        <NeuCard className="min-h-[300px] sm:min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Top Student Queries</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Most frequently asked topics</p>
            </div>
            <div className="p-2 bg-secondary rounded-lg">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </div>
          </div>
          <div className="space-y-2 sm:space-y-4 flex-1 overflow-y-auto">
            {topQueries && topQueries.length > 0 ? (
              topQueries.map((query, index) => (
                <div
                  key={query.id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer group touch-manipulation"
                  style={{ minHeight: "48px" }}
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {query.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-foreground">{query.count}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">queries</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                No query data available
              </div>
            )}

            {topQueries && topQueries.length > 0 && (
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full text-primary hover:text-primary/80 hover:bg-primary/5 h-11"
                  style={{ minHeight: "44px" }}
                >
                  View All Queries
                </Button>
              </div>
            )}
          </div>
        </NeuCard>
      </div>
    </DashboardLayout>
  );
}
