import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { ExportPanel, MetricCheckbox } from "@/components/ExportPanel";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExportableData, formatResponseTime, getDefaultMetrics, SelectableMetric } from "@/lib/export-service";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  Activity,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState, useCallback } from "react";
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
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

// Chart Error Boundary Component
function ChartErrorFallback({ 
  title, 
  onRetry, 
  isRetrying 
}: { 
  title: string; 
  onRetry: () => void; 
  isRetrying: boolean;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 p-4">
      <AlertCircle className="h-8 w-8 text-destructive/60" />
      <p className="text-sm text-center">Unable to load {title}</p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRetry}
        disabled={isRetrying}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying...' : 'Retry'}
      </Button>
    </div>
  );
}

// Loading Skeleton for Charts
function ChartLoadingSkeleton() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading chart data...</p>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Selectable metrics for export
  const [selectableMetrics, setSelectableMetrics] = useState<SelectableMetric[]>(getDefaultMetrics());

  // Top Queries Modal State
  const [isTopQueriesModalOpen, setIsTopQueriesModalOpen] = useState(false);
  const [selectedQueryCategory, setSelectedQueryCategory] = useState<string | null>(null);

  // Fetch real data from database with refetch capability
  const { 
    data: dailyData, 
    isLoading: isLoadingDaily, 
    isError: isErrorDaily,
    refetch: refetchDaily,
    isRefetching: isRefetchingDaily
  } = trpc.analytics.getDailyData.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { 
    data: hourlyData, 
    isLoading: isLoadingHourly,
    isError: isErrorHourly,
    refetch: refetchHourly,
    isRefetching: isRefetchingHourly
  } = trpc.analytics.getHourlyPeakTimes.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { 
    data: kpiData, 
    isLoading: isLoadingKPI,
    isError: isErrorKPI,
    refetch: refetchKPI,
    isRefetching: isRefetchingKPI
  } = trpc.analytics.getKPISummary.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: topQueries } = trpc.analytics.getTopQueries.useQuery({ limit: 5 });
  const { data: allQueries } = trpc.analytics.getTopQueries.useQuery({ limit: 50 });

  // Theme-aware chart colors
  const chartColors = useMemo(() => ({
    primary: isDark ? "#60a5fa" : "#3b82f6",
    primaryLight: isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(59, 130, 246, 0.3)",
    grid: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    text: isDark ? "#a1a1aa" : "#71717a",
    tooltipBg: isDark ? "#27272a" : "#ffffff",
    tooltipShadow: isDark ? "0 4px 12px rgba(0,0,0,0.5)" : "5px 5px 10px #d1d9e6",
    positive: "#22c55e",
    neutral: isDark ? "#6b7280" : "#94a3b8",
    negative: "#ef4444",
  }), [isDark]);

  // Format data for charts with validation
  const formattedDailyData = useMemo(() => {
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) return [];
    return dailyData.map((d) => ({
      date: format(new Date(d.date), "MMM d"),
      messages: Number(d.totalMessages) || 0,
    }));
  }, [dailyData]);

  const formattedHourlyData = useMemo(() => {
    if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0) return [];
    return hourlyData.map((h) => ({
      hour: `${h.hour}:00`,
      hourNum: h.hour,
      messages: Number(h.totalMessages) || 0,
    }));
  }, [hourlyData]);

  const sentimentData = useMemo(() => {
    if (!kpiData) return [];
    const total = (kpiData.positiveCount || 0) + (kpiData.neutralCount || 0) + (kpiData.negativeCount || 0);
    if (total === 0) return [];
    return [
      { name: "Positive", value: kpiData.positiveCount || 0, fill: chartColors.positive },
      { name: "Neutral", value: kpiData.neutralCount || 0, fill: chartColors.neutral },
      { name: "Negative", value: kpiData.negativeCount || 0, fill: chartColors.negative },
    ];
  }, [kpiData, chartColors]);

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

  // Toggle metric selection for export
  const toggleMetric = (id: string) => {
    setSelectableMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const clearAllMetrics = () => {
    setSelectableMetrics((prev) => prev.map((m) => ({ ...m, selected: false })));
  };

  // Prepare export data
  const exportData: ExportableData = useMemo(() => ({
    kpiSummary: kpiData
      ? {
          totalMessages: kpiData.totalMessages || 0,
          avgResponseTime: kpiData.avgResponseTime || 0,
          avgResponseTimeFormatted: formatResponseTime(kpiData.avgResponseTime || 0),
          satisfactionScore: positivePercentage,
          costSaved: costSavingsData.costSaved,
        }
      : undefined,
    dailyAnalytics: dailyData?.map((d) => ({
      ...d,
      uniqueStudents: d.uniqueStudents ?? 0,
    })),
    hourlyData: hourlyData?.map((h) => ({
      hour: h.hour,
      totalMessages: Number(h.totalMessages) || 0,
    })),
    sentimentData: kpiData
      ? {
          positive: kpiData.positiveCount || 0,
          neutral: kpiData.neutralCount || 0,
          negative: kpiData.negativeCount || 0,
        }
      : undefined,
    topQueries: topQueries?.map((q) => ({
      name: q.name,
      count: q.count,
    })),
    dateRange,
  }), [kpiData, dailyData, hourlyData, topQueries, dateRange, positivePercentage, costSavingsData]);

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Retry handlers
  const handleRetryDaily = useCallback(() => {
    refetchDaily();
  }, [refetchDaily]);

  const handleRetryHourly = useCallback(() => {
    refetchHourly();
  }, [refetchHourly]);

  const handleRetryKPI = useCallback(() => {
    refetchKPI();
  }, [refetchKPI]);

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

        {/* Controls - Enhanced Date Range Picker */}
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* KPI Stats Grid - Interactive with Drill-Down and Export Checkboxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="relative">
          <MetricCheckbox
            id="totalMessages"
            checked={selectableMetrics.find((m) => m.id === "totalMessages")?.selected || false}
            onCheckedChange={() => toggleMetric("totalMessages")}
          />
          <NeuStat
            label="Total Messages"
            value={isLoadingKPI ? "..." : (kpiData?.totalMessages || 0).toLocaleString()}
            icon={MessageCircle}
            trend="+12.5%"
            tooltipContent="Total number of student queries handled by the chatbot in the selected period."
          />
        </div>
        <div className="relative">
          <MetricCheckbox
            id="avgResponseTime"
            checked={selectableMetrics.find((m) => m.id === "avgResponseTime")?.selected || false}
            onCheckedChange={() => toggleMetric("avgResponseTime")}
          />
          <NeuStat
            label="Avg Response Time"
            value={isLoadingKPI ? "..." : formatResponseTime(kpiData?.avgResponseTime || 0)}
            icon={Clock}
            trend="-0.4s"
            tooltipContent="Average time taken to generate a response to student queries. Displayed in human-readable format (seconds/minutes)."
            drillDown={{
              title: "Response Time Analysis",
              description: "Detailed breakdown of response time metrics",
              breakdown: [
                { label: "Raw Value", value: `${Math.round(kpiData?.avgResponseTime || 0)}ms`, description: "Average response time in milliseconds" },
                { label: "Formatted", value: formatResponseTime(kpiData?.avgResponseTime || 0), description: "Human-readable format" },
                { label: "Target", value: "< 2s", description: "Industry standard target" },
              ],
              formula: "Avg = Sum(Response Times) / Total Queries",
            }}
          />
        </div>
        <div className="relative">
          <MetricCheckbox
            id="satisfactionScore"
            checked={selectableMetrics.find((m) => m.id === "satisfactionScore")?.selected || false}
            onCheckedChange={() => toggleMetric("satisfactionScore")}
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
        </div>
        <div className="relative">
          <MetricCheckbox
            id="costSaved"
            checked={selectableMetrics.find((m) => m.id === "costSaved")?.selected || false}
            onCheckedChange={() => toggleMetric("costSaved")}
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
                { label: "Total Messages", value: costSavingsData.totalMessages.toLocaleString(), description: "Queries handled by bot" },
                { label: "Avg Time Saved/Query", value: `${costSavingsData.avgMinutesPerQuery} min`, description: "Estimated human handling time" },
                { label: "Staff Hourly Rate", value: `$${costSavingsData.hourlyRate}`, description: "Average staff cost per hour" },
                { label: "Hours Saved", value: `${costSavingsData.hoursSaved} hrs`, description: "Total staff hours saved" },
              ],
              formula: "Cost Saved = (Messages × Avg Time) ÷ 60 × Hourly Rate",
            }}
          />
        </div>
      </div>

      {/* Primary Charts Row - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Message Volume Trend (Area Chart) - Fixed with error boundary */}
        <div className="lg:col-span-2 relative">
          <MetricCheckbox
            id="messageVolumeTrend"
            checked={selectableMetrics.find((m) => m.id === "messageVolumeTrend")?.selected || false}
            onCheckedChange={() => toggleMetric("messageVolumeTrend")}
            className="top-4 right-4"
          />
          <NeuCard className="min-h-[300px] sm:min-h-[400px] flex flex-col">
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
                <ChartLoadingSkeleton />
              ) : isErrorDaily ? (
                <ChartErrorFallback 
                  title="Message Volume Trend" 
                  onRetry={handleRetryDaily}
                  isRetrying={isRefetchingDaily}
                />
              ) : formattedDailyData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Activity className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No data available for selected period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedDailyData}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.text, fontSize: 10 }}
                      dy={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.text, fontSize: 10 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: chartColors.tooltipShadow,
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke={chartColors.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMessages)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </NeuCard>
        </div>

        {/* Sentiment Analysis (Pie Chart) - Fixed with error boundary and hover effects */}
        <div className="relative">
          <MetricCheckbox
            id="sentimentAnalysis"
            checked={selectableMetrics.find((m) => m.id === "sentimentAnalysis")?.selected || false}
            onCheckedChange={() => toggleMetric("sentimentAnalysis")}
            className="top-4 right-4"
          />
          <NeuCard className="flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Sentiment Analysis</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">All sentiment categories</p>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[200px] relative">
              {isLoadingKPI ? (
                <ChartLoadingSkeleton />
              ) : isErrorKPI ? (
                <ChartErrorFallback 
                  title="Sentiment Analysis" 
                  onRetry={handleRetryKPI}
                  isRetrying={isRefetchingKPI}
                />
              ) : sentimentData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ThumbsUp className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No sentiment data available</p>
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
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill}
                            className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                            onClick={() => navigate(`/messages?sentiment=${entry.name.toLowerCase()}`)}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: chartColors.tooltipShadow,
                          color: isDark ? "#fff" : "#000",
                        }}
                        formatter={(value: number, name: string) => {
                          const total = sentimentData.reduce((sum, d) => sum + d.value, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                          return [`${value.toLocaleString()} (${percentage}%)`, name];
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span style={{ color: chartColors.text }}>{value}</span>}
                      />
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
            {/* Sentiment Breakdown Bar with hover effects */}
            {!isLoadingKPI && !isErrorKPI && sentimentData.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {sentimentData.map((entry, index) => {
                    const total = sentimentData.reduce((sum, d) => sum + d.value, 0);
                    const width = total > 0 ? (entry.value / total) * 100 : 0;
                    return (
                      <div
                        key={index}
                        style={{ width: `${width}%`, backgroundColor: entry.fill }}
                        className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                        title={`${entry.name}: ${entry.value.toLocaleString()} (${Math.round(width)}%) - Click to view messages`}
                        onClick={() => navigate(`/messages?sentiment=${entry.name.toLowerCase()}`)}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {sentimentData.map((entry) => {
                    const total = sentimentData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                    return (
                      <span 
                        key={entry.name} 
                        className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => navigate(`/messages?sentiment=${entry.name.toLowerCase()}`)}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                        {entry.name}: {percentage}%
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </NeuCard>
        </div>
      </div>

      {/* Secondary Charts Row - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Peak Messaging Times (Bar Chart) - Fixed with error boundary */}
        <div className="relative">
          <MetricCheckbox
            id="peakMessagingTimes"
            checked={selectableMetrics.find((m) => m.id === "peakMessagingTimes")?.selected || false}
            onCheckedChange={() => toggleMetric("peakMessagingTimes")}
            className="top-4 right-4"
          />
          <NeuCard className="min-h-[300px] sm:min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Peak Messaging Times</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Hourly activity distribution (24h)</p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
              </div>
            </div>
            <div className="flex-1 w-full min-h-[200px] sm:min-h-[300px]">
              {isLoadingHourly ? (
                <ChartLoadingSkeleton />
              ) : isErrorHourly ? (
                <ChartErrorFallback 
                  title="Peak Messaging Times" 
                  onRetry={handleRetryHourly}
                  isRetrying={isRefetchingHourly}
                />
              ) : formattedHourlyData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <TrendingUp className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No hourly data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.text, fontSize: 9 }}
                      interval={3}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chartColors.text, fontSize: 10 }}
                      width={35}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: chartColors.tooltipShadow,
                        color: isDark ? "#fff" : "#000",
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const hour = props.payload?.hourNum;
                        return [`${value.toLocaleString()} messages`, formatHour(hour)];
                      }}
                    />
                    <Bar
                      dataKey="messages"
                      fill={chartColors.primary}
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </NeuCard>
        </div>

        {/* Top Queries List - With functional "View All" */}
        <div className="relative">
          <MetricCheckbox
            id="topQueries"
            checked={selectableMetrics.find((m) => m.id === "topQueries")?.selected || false}
            onCheckedChange={() => toggleMetric("topQueries")}
            className="top-4 right-4"
          />
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
                    onClick={() => {
                      setSelectedQueryCategory(query.name);
                      navigate("/messages");
                    }}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-colors cursor-pointer group touch-manipulation"
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
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
                    onClick={() => setIsTopQueriesModalOpen(true)}
                  >
                    View All Queries
                  </Button>
                </div>
              )}
            </div>
          </NeuCard>
        </div>
      </div>

      {/* Export Panel */}
      <ExportPanel
        metrics={selectableMetrics}
        onMetricToggle={toggleMetric}
        onClearAll={clearAllMetrics}
        data={exportData}
      />

      {/* Top Queries Modal - Shows all queries */}
      <Dialog open={isTopQueriesModalOpen} onOpenChange={setIsTopQueriesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>All Student Query Categories</DialogTitle>
            <DialogDescription>
              Complete list of query categories ranked by frequency. Click a category to view messages.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {allQueries?.map((query, index) => (
              <div
                key={query.id}
                onClick={() => {
                  setSelectedQueryCategory(query.name);
                  setIsTopQueriesModalOpen(false);
                  navigate("/messages");
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {query.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-foreground">{query.count.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">queries</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
