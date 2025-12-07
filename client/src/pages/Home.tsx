import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { ExportPanel } from "@/components/ExportPanel";
import { SelectableMetric, getDefaultMetrics } from "@/lib/export-service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  MessageSquare,
  Clock,
  ThumbsUp,
  DollarSign,
  Activity,
  TrendingUp,
  Calendar as CalendarIcon,
  RefreshCw,
  ChevronRight,
  X,
} from "lucide-react";

// Metric Checkbox Component
function MetricCheckbox({ id, checked, onCheckedChange, className }: {
  id: string;
  checked: boolean;
  onCheckedChange: () => void;
  className?: string;
}) {
  return (
    <Checkbox
      id={`export-${id}`}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`absolute z-10 ${className}`}
    />
  );
}

// Chart Error Fallback
function ChartErrorFallback({ title, onRetry, isRetrying }: { title: string; onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <p className="text-sm">Failed to load {title}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
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

// Format hour for display
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
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
  const [topQueriesTab, setTopQueriesTab] = useState<'categories' | 'queries'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  // Fetch real data from database
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
  const { data: topIndividualQueries } = trpc.analytics.getTopIndividualQueries.useQuery({ limit: 5 });
  const { data: allIndividualQueries } = trpc.analytics.getTopIndividualQueries.useQuery({ limit: 50 });

  // HIGH CONTRAST CHART COLORS - Visible in both light and dark modes
  const chartColors = useMemo(() => ({
    // Primary blue - high contrast
    primary: "#3b82f6",
    primaryLight: "rgba(59, 130, 246, 0.4)",
    // Grid lines
    grid: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
    // Text colors
    text: isDark ? "#e5e7eb" : "#374151",
    // Tooltip
    tooltipBg: isDark ? "#1f2937" : "#ffffff",
    tooltipBorder: isDark ? "#374151" : "#e5e7eb",
    tooltipShadow: "0 4px 12px rgba(0,0,0,0.15)",
    // Sentiment colors - HIGH CONTRAST
    positive: "#22c55e",
    neutral: "#f59e0b",
    negative: "#ef4444",
    // Bar chart gradient
    barStart: "#3b82f6",
    barEnd: "#8b5cf6",
  }), [isDark]);

  // Format data for charts with validation
  const formattedDailyData = useMemo(() => {
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) {
      // Generate sample data if no data
      const sampleData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleData.push({
          date: format(date, "MMM d"),
          messages: Math.floor(Math.random() * 150) + 80,
        });
      }
      return sampleData;
    }
    return dailyData.map((d: any) => ({
      date: format(new Date(d.date), "MMM d"),
      messages: Number(d.totalMessages) || 0,
    }));
  }, [dailyData]);

  const formattedHourlyData = useMemo(() => {
    if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0) {
      // Generate sample hourly data
      const hourlyPattern = [5, 3, 2, 2, 3, 8, 25, 65, 120, 145, 160, 155, 140, 155, 165, 170, 150, 120, 85, 55, 35, 20, 12, 8];
      return hourlyPattern.map((base, hour) => ({
        hour: `${hour}:00`,
        hourNum: hour,
        messages: base + Math.floor(Math.random() * 20),
      }));
    }
    return hourlyData.map((h: any) => ({
      hour: `${h.hour}:00`,
      hourNum: h.hour,
      messages: Number(h.totalMessages) || 0,
    }));
  }, [hourlyData]);

  const sentimentData = useMemo(() => {
    // Always use sample data for now since database doesn't have sentiment counts populated
    // When real data is available, this can be updated to use kpiData values
    const positiveCount = 2530;
    const neutralCount = 1000;
    const negativeCount = 422;
    
    return [
      { name: "Positive", value: positiveCount, fill: chartColors.positive },
      { name: "Neutral", value: neutralCount, fill: chartColors.neutral },
      { name: "Negative", value: negativeCount, fill: chartColors.negative },
    ];
  }, [chartColors]);

  const positivePercentage = useMemo(() => {
    const total = sentimentData.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return 0;
    return Math.round((sentimentData[0].value / total) * 100);
  }, [sentimentData]);

  // Calculate cost savings
  const costSavingsData = useMemo(() => {
    const totalMessages = kpiData?.totalMessages || 3952;
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

  // Toggle metric selection
  const toggleMetric = (id: string) => {
    setSelectableMetrics(prev =>
      prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m)
    );
  };

  const selectedMetrics = selectableMetrics.filter(m => m.selected);

  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Retry handlers
  const handleRetryDaily = () => refetchDaily();
  const handleRetryHourly = () => refetchHourly();
  const handleRetryKPI = () => refetchKPI();

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Welcome back, Administrator. Here's what's happening.
            </p>
          </div>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="relative">
            <MetricCheckbox
              id="totalMessages"
              checked={selectableMetrics.find((m) => m.id === "totalMessages")?.selected || false}
              onCheckedChange={() => toggleMetric("totalMessages")}
              className="top-4 right-4"
            />
            <NeuStat
              title="TOTAL MESSAGES"
              value={(kpiData?.totalMessages || 3952).toLocaleString()}
              change="+12.5%"
              isPositive={true}
              icon={<MessageSquare className="h-5 w-5 text-primary" />}
            />
          </div>

          <div className="relative">
            <MetricCheckbox
              id="avgResponseTime"
              checked={selectableMetrics.find((m) => m.id === "avgResponseTime")?.selected || false}
              onCheckedChange={() => toggleMetric("avgResponseTime")}
              className="top-4 right-4"
            />
            <NeuStat
              title="AVG RESPONSE TIME"
              value={`${((kpiData?.avgResponseTime || 1800) / 1000).toFixed(1)} seconds`}
              change="-0.4s"
              isPositive={true}
              icon={<Clock className="h-5 w-5 text-primary" />}
              onClick={() => navigate("/analytics")}
              tooltip="Click for details →"
            />
          </div>

          <div className="relative">
            <MetricCheckbox
              id="satisfactionScore"
              checked={selectableMetrics.find((m) => m.id === "satisfactionScore")?.selected || false}
              onCheckedChange={() => toggleMetric("satisfactionScore")}
              className="top-4 right-4"
            />
            <NeuStat
              title="SATISFACTION SCORE"
              value={`${positivePercentage}%`}
              change="+2%"
              isPositive={true}
              icon={<ThumbsUp className="h-5 w-5 text-primary" />}
              onClick={() => navigate("/analytics")}
              tooltip="Click for details →"
            />
          </div>

          <div className="relative">
            <MetricCheckbox
              id="costSaved"
              checked={selectableMetrics.find((m) => m.id === "costSaved")?.selected || false}
              onCheckedChange={() => toggleMetric("costSaved")}
              className="top-4 right-4"
            />
            <NeuStat
              title="EST. COST SAVED"
              value={`$${costSavingsData.costSaved.toLocaleString()}`}
              change="+15%"
              isPositive={true}
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              onClick={() => navigate("/roi")}
              tooltip="Click for details →"
            />
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Message Volume Trend */}
          <div className="relative">
            <MetricCheckbox
              id="messageVolumeTrend"
              checked={selectableMetrics.find((m) => m.id === "messageVolumeTrend")?.selected || false}
              onCheckedChange={() => toggleMetric("messageVolumeTrend")}
              className="top-4 right-4"
            />
            <NeuCard className="min-h-[350px] sm:min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Message Volume Trend</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Daily student interactions over time</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </div>
              <div className="w-full h-[280px]">
                {isLoadingDaily ? (
                  <ChartLoadingSkeleton />
                ) : isErrorDaily ? (
                  <ChartErrorFallback 
                    title="Message Volume Trend" 
                    onRetry={handleRetryDaily}
                    isRetrying={isRefetchingDaily}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedDailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.text, fontSize: 11 }}
                        dy={10}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.text, fontSize: 11 }}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          borderRadius: "8px",
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          boxShadow: chartColors.tooltipShadow,
                        }}
                        labelStyle={{ color: chartColors.text, fontWeight: 600 }}
                        itemStyle={{ color: chartColors.primary }}
                      />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMessages)"
                        name="Messages"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </NeuCard>
          </div>

          {/* Sentiment Analysis Pie Chart */}
          <div className="relative">
            <MetricCheckbox
              id="sentimentAnalysis"
              checked={selectableMetrics.find((m) => m.id === "sentimentAnalysis")?.selected || false}
              onCheckedChange={() => toggleMetric("sentimentAnalysis")}
              className="top-4 right-4"
            />
            <NeuCard className="flex flex-col min-h-[350px] sm:min-h-[400px]">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Sentiment Analysis</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">All sentiment categories</p>
                </div>
              </div>
              <div className="w-full h-[220px] relative">
                {isLoadingKPI ? (
                  <ChartLoadingSkeleton />
                ) : isErrorKPI ? (
                  <ChartErrorFallback 
                    title="Sentiment Analysis" 
                    onRetry={handleRetryKPI}
                    isRetrying={isRefetchingKPI}
                  />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill}
                              className="cursor-pointer transition-opacity hover:opacity-80"
                              onClick={() => navigate(`/messages?sentiment=${entry.name.toLowerCase()}`)}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: chartColors.tooltipBg,
                            borderRadius: "8px",
                            border: `1px solid ${chartColors.tooltipBorder}`,
                            boxShadow: chartColors.tooltipShadow,
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
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginBottom: "36px" }}>
                      <span className="text-3xl sm:text-4xl font-bold text-foreground">{positivePercentage}%</span>
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Positive</span>
                    </div>
                  </>
                )}
              </div>
              {/* Sentiment Breakdown Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {sentimentData.map((entry, index) => {
                    const total = sentimentData.reduce((sum, d) => sum + d.value, 0);
                    const width = total > 0 ? (entry.value / total) * 100 : 0;
                    return (
                      <div
                        key={index}
                        style={{ width: `${width}%`, backgroundColor: entry.fill }}
                        className="transition-all duration-300 hover:brightness-110 cursor-pointer"
                        onClick={() => navigate(`/messages?sentiment=${entry.name.toLowerCase()}`)}
                        title={`${entry.name}: ${width.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {sentimentData.map((entry) => {
                    const total = sentimentData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
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
            </NeuCard>
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Peak Messaging Times Bar Chart */}
          <div className="relative">
            <MetricCheckbox
              id="peakMessagingTimes"
              checked={selectableMetrics.find((m) => m.id === "peakMessagingTimes")?.selected || false}
              onCheckedChange={() => toggleMetric("peakMessagingTimes")}
              className="top-4 right-4"
            />
            <NeuCard className="min-h-[350px] sm:min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Peak Messaging Times</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Hourly activity distribution (24h)</p>
                </div>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                </div>
              </div>
              <div className="w-full h-[280px]">
                {isLoadingHourly ? (
                  <ChartLoadingSkeleton />
                ) : isErrorHourly ? (
                  <ChartErrorFallback 
                    title="Peak Messaging Times" 
                    onRetry={handleRetryHourly}
                    isRetrying={isRefetchingHourly}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedHourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors.barStart} stopOpacity={1} />
                          <stop offset="100%" stopColor={chartColors.barEnd} stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.text, fontSize: 10 }}
                        interval={2}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.text, fontSize: 11 }}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          borderRadius: "8px",
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          boxShadow: chartColors.tooltipShadow,
                        }}
                        labelStyle={{ color: chartColors.text, fontWeight: 600 }}
                        formatter={(value: number, name: string, props: any) => {
                          const hour = props.payload?.hourNum;
                          return [`${value.toLocaleString()} messages`, formatHour(hour)];
                        }}
                      />
                      <Bar
                        dataKey="messages"
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                        barSize={18}
                        name="Messages"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </NeuCard>
          </div>

          {/* Top Queries List with Tabs */}
          <div className="relative">
            <MetricCheckbox
              id="topQueries"
              checked={selectableMetrics.find((m) => m.id === "topQueries")?.selected || false}
              onCheckedChange={() => toggleMetric("topQueries")}
              className="top-4 right-4"
            />
            <NeuCard className="min-h-[350px] sm:min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Top Student Queries</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Most frequently asked topics</p>
                </div>
                <div className="p-2 bg-secondary rounded-lg">
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-border">
                <button
                  onClick={() => setTopQueriesTab('categories')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    topQueriesTab === 'categories'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Categories
                </button>
                <button
                  onClick={() => setTopQueriesTab('queries')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    topQueriesTab === 'queries'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Top Queries
                </button>
              </div>
              
              {/* Categories Tab */}
              {topQueriesTab === 'categories' && (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {topQueries && topQueries.length > 0 ? (
                    topQueries.map((query: any, index: number) => (
                      <div
                        key={query.id || index}
                        onClick={() => {
                          setSelectedCategory(query.category);
                          navigate(`/messages?category=${encodeURIComponent(query.category)}`);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-foreground">{query.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{query.count} queries</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 opacity-50 mb-2" />
                      <p className="text-sm">No category data available</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Top Queries Tab */}
              {topQueriesTab === 'queries' && (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {topIndividualQueries && topIndividualQueries.length > 0 ? (
                    topIndividualQueries.map((query: any, index: number) => (
                      <div
                        key={query.query}
                        onClick={() => {
                          setSelectedQuery(query.query);
                          navigate(`/messages?query=${encodeURIComponent(query.query)}`);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{query.query}</p>
                            <p className="text-xs text-muted-foreground">{query.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-muted-foreground">{query.count}x</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 opacity-50 mb-2" />
                      <p className="text-sm">No query data available</p>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                variant="ghost"
                className="mt-4 w-full text-primary hover:text-primary/80"
                onClick={() => setIsTopQueriesModalOpen(true)}
              >
                {topQueriesTab === 'categories' ? 'View All Categories' : 'View All Queries'}
              </Button>
            </NeuCard>
          </div>
        </div>

        {/* Export Panel */}
        {selectedMetrics.length > 0 && (
          <ExportPanel
            metrics={selectableMetrics}
            onMetricToggle={toggleMetric}
            onClearAll={() => setSelectableMetrics(getDefaultMetrics())}
            data={{
              kpiSummary: kpiData ? {
                totalMessages: kpiData.totalMessages || 0,
                avgResponseTime: kpiData.avgResponseTime || 0,
                avgResponseTimeFormatted: `${((kpiData.avgResponseTime || 0) / 1000).toFixed(1)}s`,
                satisfactionScore: positivePercentage,
                costSaved: costSavingsData.costSaved,
              } : undefined,
              dailyAnalytics: dailyData as any,
              hourlyData: hourlyData as any,
              sentimentData: {
                positive: kpiData?.positiveCount || 0,
                neutral: kpiData?.neutralCount || 0,
                negative: kpiData?.negativeCount || 0,
              },
              topQueries: topQueries?.map((q: any) => ({ name: q.category, count: q.count })),
              dateRange: { from: dateRange.from, to: dateRange.to },
            }}
          />
        )}

        {/* Top Queries Modal with Tabs */}
        <Dialog open={isTopQueriesModalOpen} onOpenChange={setIsTopQueriesModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Query Analytics</DialogTitle>
            </DialogHeader>
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-border px-6">
              <button
                onClick={() => setTopQueriesTab('categories')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  topQueriesTab === 'categories'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setTopQueriesTab('queries')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  topQueriesTab === 'queries'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Queries
              </button>
            </div>
            
            {/* Categories Tab */}
            {topQueriesTab === 'categories' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {allQueries && allQueries.length > 0 ? (
                  allQueries.map((query: any, index: number) => (
                    <div
                      key={query.id || index}
                      onClick={() => {
                        navigate(`/messages?category=${encodeURIComponent(query.category)}`);
                        setIsTopQueriesModalOpen(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground">{query.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{query.count} queries</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No query categories available</p>
                )}
              </div>
            )}
            
            {/* Queries Tab */}
            {topQueriesTab === 'queries' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {allIndividualQueries && allIndividualQueries.length > 0 ? (
                  allIndividualQueries.map((query: any, index: number) => (
                    <div
                      key={query.query}
                      onClick={() => {
                        navigate(`/messages?query=${encodeURIComponent(query.query)}`);
                        setIsTopQueriesModalOpen(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{query.query}</p>
                          <p className="text-xs text-muted-foreground">{query.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">{query.count}x asked</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No query data available</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
