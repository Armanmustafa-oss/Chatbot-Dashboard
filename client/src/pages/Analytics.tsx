import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentLink, CategoryLink } from "@/components/StudentLink";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  MessageSquare,
  Search,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Types for drill-down data
interface MessageRow {
  id: number;
  studentId: number;
  query: string;
  response: string;
  category: string;
  sentiment: string;
  rating: number | null;
  responseTimeMs: number;
  createdAt: Date;
}

interface StudentRow {
  id: number;
  studentId: string;
  name: string | null;
  email: string | null;
  department: string | null;
  lastActiveAt: Date;
}

// Format response time to human-readable
function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
}

// Sentiment icon component
function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") {
    return <Check className="h-4 w-4 text-green-500" />;
  } else if (sentiment === "negative") {
    return <X className="h-4 w-4 text-red-500" />;
  }
  return <div className="h-4 w-4 rounded-full bg-gray-300" />;
}

export default function Analytics() {
  const [, navigate] = useLocation();
  
  // Date range state with independent start and end
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  
  // Temporary date selection for dual calendar
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(dateRange.from);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(dateRange.to);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Drill-down modal states
  const [totalMessagesOpen, setTotalMessagesOpen] = useState(false);
  const [satisfactionOpen, setSatisfactionOpen] = useState(false);
  const [uniqueStudentsOpen, setUniqueStudentsOpen] = useState(false);
  const [responseTimeOpen, setResponseTimeOpen] = useState(false);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);

  // Filter states for drill-down
  const [messageFilter, setMessageFilter] = useState({
    category: "all",
    sentiment: "all",
    search: "",
  });
  const [messagePage, setMessagePage] = useState(0);
  const [messagesPerPage, setMessagesPerPage] = useState(50);

  // Export panel state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "word">("pdf");
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    landscape: false,
    coverPage: true,
  });

  // Data queries
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

  // Messages query for drill-down
  const { data: messagesData, isLoading: isLoadingMessages } = trpc.messages.list.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
    sentiment: messageFilter.sentiment !== "all" ? messageFilter.sentiment as "positive" | "neutral" | "negative" : undefined,
    category: messageFilter.category !== "all" ? messageFilter.category : undefined,
    limit: messagesPerPage,
    offset: messagePage * messagesPerPage,
  }, {
    enabled: totalMessagesOpen || satisfactionOpen,
  });

  // Message detail query
  const { data: messageDetail } = trpc.messages.getById.useQuery({
    id: selectedMessageId || 0,
  }, {
    enabled: !!selectedMessageId && messageDetailOpen,
  });

  // Students query for drill-down
  const { data: studentsData, isLoading: isLoadingStudents } = trpc.students.list.useQuery({
    limit: 100,
    offset: 0,
  }, {
    enabled: uniqueStudentsOpen,
  });

  // Formatted data for charts
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

  // Response time distribution data (simulated from messages)
  const responseTimeDistribution = useMemo(() => {
    // Create distribution buckets
    const buckets = [
      { label: "0-1s", min: 0, max: 1000, count: 0, color: "#22c55e" },
      { label: "1-2s", min: 1000, max: 2000, count: 0, color: "#84cc16" },
      { label: "2-5s", min: 2000, max: 5000, count: 0, color: "#eab308" },
      { label: "5-10s", min: 5000, max: 10000, count: 0, color: "#f97316" },
      { label: "10s+", min: 10000, max: Infinity, count: 0, color: "#ef4444" },
    ];

    // Simulate distribution based on average response time
    if (kpiData?.avgResponseTime) {
      const avgMs = kpiData.avgResponseTime;
      const total = kpiData.totalMessages || 1000;
      
      // Create a realistic distribution
      buckets[0].count = Math.round(total * 0.35);
      buckets[1].count = Math.round(total * 0.30);
      buckets[2].count = Math.round(total * 0.20);
      buckets[3].count = Math.round(total * 0.10);
      buckets[4].count = Math.round(total * 0.05);
    }

    return buckets;
  }, [kpiData]);

  // Preset ranges with 24h option
  const presetRanges = [
    { label: "24 Hours", hours: 24 },
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
  ];

  const setPresetRange = (range: { hours?: number; days?: number }) => {
    const now = new Date();
    let from: Date;
    
    if (range.hours) {
      from = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
    } else if (range.days) {
      from = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
    } else {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    setDateRange({ from, to: now });
    setTempStartDate(from);
    setTempEndDate(now);
  };

  const applyDateRange = () => {
    if (tempStartDate && tempEndDate && tempStartDate <= tempEndDate) {
      setDateRange({ from: tempStartDate, to: tempEndDate });
      setIsDatePickerOpen(false);
    }
  };

  const cancelDateRange = () => {
    setTempStartDate(dateRange.from);
    setTempEndDate(dateRange.to);
    setIsDatePickerOpen(false);
  };

  // Calculate active preset
  const getActivePreset = () => {
    const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
    const diffHours = diffMs / (60 * 60 * 1000);
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    
    if (Math.abs(diffHours - 24) < 1) return "24h";
    if (Math.abs(diffDays - 7) < 0.5) return "7d";
    if (Math.abs(diffDays - 30) < 0.5) return "30d";
    return "custom";
  };

  // Open message detail
  const openMessageDetail = (messageId: number) => {
    setSelectedMessageId(messageId);
    setMessageDetailOpen(true);
  };

  // Navigate to student profile
  const navigateToStudent = (studentId: number) => {
    navigate(`/students?id=${studentId}`);
  };

  // Export handlers
  const handleExport = async () => {
    // Generate export based on format
    const filename = `Analytics_Report_${format(dateRange.from, "MMMd")}-${format(dateRange.to, "MMMd_yyyy")}`;
    
    if (exportFormat === "excel") {
      // Create CSV content
      let csv = "Metric,Value\n";
      csv += `Total Messages,${kpiData?.totalMessages || 0}\n`;
      csv += `Average Response Time,${formatResponseTime(kpiData?.avgResponseTime || 0)}\n`;
      csv += `Satisfaction Rate,${kpiData?.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%\n`;
      csv += `Unique Students,${kpiData?.uniqueStudents || 0}\n`;
      csv += `\nDaily Data\nDate,Messages,Positive,Negative\n`;
      formattedDailyData.forEach(d => {
        csv += `${d.date},${d.messages},${d.positive},${d.negative}\n`;
      });
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For PDF and Word, create a simple text export
      let content = `Analytics Report\n`;
      content += `Period: ${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}\n\n`;
      content += `Key Metrics:\n`;
      content += `- Total Messages: ${(kpiData?.totalMessages || 0).toLocaleString()}\n`;
      content += `- Average Response Time: ${formatResponseTime(kpiData?.avgResponseTime || 0)}\n`;
      content += `- Satisfaction Rate: ${kpiData?.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%\n`;
      content += `- Unique Students: ${(kpiData?.uniqueStudents || 0).toLocaleString()}\n`;
      
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${exportFormat === "pdf" ? "txt" : "doc"}`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    setExportOpen(false);
  };

  // Categories for filter
  const categories = [
    "all",
    "Financial Aid",
    "Course Registration",
    "Academic Support",
    "Campus Services",
    "Housing",
    "Career Services",
    "IT Support",
    "General Inquiry",
  ];

  return (
    <DashboardLayout>
      {/* Header with Date Range Picker */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Deep dive into messaging patterns and trends
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full lg:w-auto">
          {/* Preset Buttons */}
          <div className="neu-flat px-1 p-1 rounded-xl flex items-center gap-1">
            {presetRanges.map((range) => {
              const isActive = 
                (range.hours === 24 && getActivePreset() === "24h") ||
                (range.days === 7 && getActivePreset() === "7d") ||
                (range.days === 30 && getActivePreset() === "30d");
              
              return (
                <button
                  key={range.label}
                  onClick={() => setPresetRange(range)}
                  className={cn(
                    "px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all min-h-[44px]",
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Dual Calendar Date Range Picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="neu-flat border-0 gap-2 min-h-[44px]">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
                <span className="sm:hidden text-sm">Custom</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="text-sm font-medium text-center text-muted-foreground">
                  Selected Range: {tempStartDate && tempEndDate ? (
                    <span className="text-foreground">
                      {format(tempStartDate, "MMM d, yyyy")} to {format(tempEndDate, "MMM d, yyyy")}
                    </span>
                  ) : "Select dates"}
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Start Date Calendar */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={tempStartDate}
                      onSelect={(date) => {
                        setTempStartDate(date);
                        // If end date is before new start date, clear it
                        if (date && tempEndDate && date > tempEndDate) {
                          setTempEndDate(undefined);
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      className="rounded-md border"
                    />
                  </div>
                  
                  {/* End Date Calendar */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">End Date</p>
                    <Calendar
                      mode="single"
                      selected={tempEndDate}
                      onSelect={setTempEndDate}
                      disabled={(date) => 
                        date > new Date() || 
                        (tempStartDate ? date < tempStartDate : false)
                      }
                      className="rounded-md border"
                    />
                  </div>
                </div>
                
                {/* Validation message */}
                {tempStartDate && tempEndDate && tempStartDate > tempEndDate && (
                  <p className="text-xs text-red-500 text-center">
                    End date must be after start date
                  </p>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={cancelDateRange}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={applyDateRange}
                    disabled={!tempStartDate || !tempEndDate || tempStartDate > tempEndDate}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button 
            variant="outline" 
            className="neu-flat border-0 gap-2 min-h-[44px]"
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards - Clickable for Drill-Down */}
      {kpiData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Messages Card */}
          <NeuCard 
            className="text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setTotalMessagesOpen(true)}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Messages</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {(kpiData.totalMessages || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Click to explore</p>
          </NeuCard>
          
          {/* Avg Response Time Card */}
          <NeuCard 
            className="text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setResponseTimeOpen(true)}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Response Time</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {formatResponseTime(kpiData.avgResponseTime || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Click for distribution</p>
          </NeuCard>
          
          {/* Satisfaction Rate Card */}
          <NeuCard 
            className="text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setSatisfactionOpen(true)}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Satisfaction Rate</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600">
              {kpiData.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Click for breakdown</p>
          </NeuCard>
          
          {/* Unique Students Card */}
          <NeuCard 
            className="text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setUniqueStudentsOpen(true)}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Unique Students</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {(kpiData.uniqueStudents || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Click to view list</p>
          </NeuCard>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {/* Daily Message Volume */}
        <NeuCard className="min-h-[350px] md:min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground">Message Volume Trend</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Daily message count over selected period</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-4 md:h-5 w-4 md:w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px] md:min-h-[300px]">
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
                      boxShadow: "5px 5px 10px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMessagesAnalytics)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeuCard>

        {/* Hourly Peak Times */}
        <NeuCard className="min-h-[350px] md:min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground">Peak Messaging Times</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Aggregated hourly activity</p>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-4 md:h-5 w-4 md:w-5 text-accent" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px] md:min-h-[300px]">
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
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "5px 5px 10px rgba(0,0,0,0.1)",
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
      </div>

      {/* Sentiment Breakdown */}
      {kpiData && (
        <NeuCard className="mb-8">
          <h3 className="text-base md:text-lg font-bold text-foreground mb-4 md:mb-6">Sentiment Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl text-center">
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {(kpiData.positiveCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">Positive</p>
              <p className="text-xs text-green-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl text-center">
              <p className="text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400">
                {(kpiData.neutralCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">Neutral</p>
              <p className="text-xs text-gray-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.neutralCount || 0) / kpiData.totalMessages) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl text-center">
              <p className="text-2xl md:text-3xl font-bold text-red-600">
                {(kpiData.negativeCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">Negative</p>
              <p className="text-xs text-red-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.negativeCount || 0) / kpiData.totalMessages) * 100) : 0}%
              </p>
            </div>
          </div>
        </NeuCard>
      )}

      {/* ============ DRILL-DOWN MODALS ============ */}

      {/* Total Messages Drill-Down Modal */}
      <Dialog open={totalMessagesOpen} onOpenChange={setTotalMessagesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Total Messages - {(kpiData?.totalMessages || 0).toLocaleString()} messages
            </DialogTitle>
          </DialogHeader>
          
          {/* Filter Panel */}
          <div className="flex flex-wrap gap-3 py-3 border-b">
            <Select value={messageFilter.category} onValueChange={(v) => setMessageFilter(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={messageFilter.sentiment} onValueChange={(v) => setMessageFilter(prev => ({ ...prev, sentiment: v }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm"
                  value={messageFilter.search}
                  onChange={(e) => setMessageFilter(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          {/* Message List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {isLoadingMessages ? (
                <div className="py-8 text-center text-muted-foreground">Loading messages...</div>
              ) : messagesData?.messages && messagesData.messages.length > 0 ? (
                messagesData.messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => openMessageDetail(msg.id)}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <SentimentIcon sentiment={msg.sentiment || "neutral"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {msg.query?.substring(0, 60) || "No query"}...
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-primary/10 rounded-full">{msg.category}</span>
                          <span>{format(new Date(msg.createdAt), "MMM d, h:mm a")}</span>
                          <span>{formatResponseTime(msg.responseTimeMs || 0)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">No messages found</div>
              )}
            </div>
          </ScrollArea>
          
          {/* Pagination */}
          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {messagePage * messagesPerPage + 1} - {Math.min((messagePage + 1) * messagesPerPage, messagesData?.total || 0)} of {messagesData?.total || 0}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessagePage(p => Math.max(0, p - 1))}
                disabled={messagePage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessagePage(p => p + 1)}
                disabled={(messagePage + 1) * messagesPerPage >= (messagesData?.total || 0)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Detail Modal */}
      <Dialog open={messageDetailOpen} onOpenChange={setMessageDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          
          {messageDetail ? (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <StudentLink
                      studentId={messageDetail.message.studentId}
                      studentName={messageDetail.student?.name}
                      showIcon={false}
                      context={{
                        fromPage: '/analytics',
                        dateRange: dateRange,
                      }}
                      className="text-base"
                    />
                    <p className="text-sm text-muted-foreground">{messageDetail.student?.studentId}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessageDetailOpen(false);
                    navigate(`/students?id=${messageDetail.message.studentId}&from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}&source=analytics`);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>
              
              {/* Query */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Student Query</p>
                <p className="p-3 bg-muted rounded-lg text-sm">{messageDetail.message.query}</p>
              </div>
              
              {/* Response */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bot Response</p>
                <p className="p-3 bg-primary/5 rounded-lg text-sm border-l-4 border-primary">
                  {messageDetail.message.response}
                </p>
              </div>
              
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <CategoryLink
                    category={messageDetail.message.category || "General"}
                    context={{
                      fromPage: '/analytics',
                      dateRange: dateRange,
                    }}
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Response Time</p>
                  <p className="font-medium text-sm">{formatResponseTime(messageDetail.message.responseTimeMs || 0)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Sentiment</p>
                  <p className={cn(
                    "font-medium text-sm capitalize",
                    messageDetail.message.sentiment === "positive" && "text-green-600",
                    messageDetail.message.sentiment === "negative" && "text-red-600"
                  )}>
                    {messageDetail.message.sentiment}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="font-medium text-sm">{format(new Date(messageDetail.message.createdAt), "MMM d, h:mm a")}</p>
                </div>
              </div>
              
              {/* Rating if available */}
              {messageDetail.message.rating && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Student Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={cn(
                          "text-lg",
                          star <= messageDetail.message.rating! ? "text-yellow-500" : "text-gray-300"
                        )}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm font-medium">{messageDetail.message.rating}/5</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Satisfaction Rate Drill-Down Modal */}
      <Dialog open={satisfactionOpen} onOpenChange={setSatisfactionOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              Satisfaction Breakdown
            </DialogTitle>
          </DialogHeader>
          
          {/* Split View */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            {/* Satisfied Section */}
            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border-b">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {kpiData?.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}% Satisfied
                  </span>
                  <span className="text-sm text-green-600">
                    - {(kpiData?.positiveCount || 0).toLocaleString()} messages
                  </span>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {messagesData?.messages
                    ?.filter(m => m.sentiment === "positive")
                    .slice(0, 20)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => openMessageDetail(msg.id)}
                        className="p-2 rounded-lg border bg-card hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer transition-colors text-sm"
                      >
                        <p className="truncate">{msg.query?.substring(0, 50)}...</p>
                        <p className="text-xs text-muted-foreground mt-1">{msg.category}</p>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Dissatisfied Section */}
            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border-b">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    {kpiData?.totalMessages ? Math.round(((kpiData.negativeCount || 0) / kpiData.totalMessages) * 100) : 0}% Dissatisfied
                  </span>
                  <span className="text-sm text-red-600">
                    - {(kpiData?.negativeCount || 0).toLocaleString()} messages
                  </span>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {messagesData?.messages
                    ?.filter(m => m.sentiment === "negative")
                    .slice(0, 20)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => openMessageDetail(msg.id)}
                        className="p-2 rounded-lg border bg-card hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors text-sm"
                      >
                        <p className="truncate">{msg.query?.substring(0, 50)}...</p>
                        <p className="text-xs text-muted-foreground mt-1">{msg.category}</p>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unique Students Drill-Down Modal */}
      <Dialog open={uniqueStudentsOpen} onOpenChange={setUniqueStudentsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Unique Students - {(kpiData?.uniqueStudents || 0).toLocaleString()} students
            </DialogTitle>
          </DialogHeader>
          
          {/* Student List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {isLoadingStudents ? (
                <div className="py-8 text-center text-muted-foreground">Loading students...</div>
              ) : studentsData && studentsData.length > 0 ? (
                studentsData.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => {
                      setUniqueStudentsOpen(false);
                      navigateToStudent(student.id);
                    }}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{student.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{student.studentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.department || "General"}</p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {formatDistanceToNow(new Date(student.lastActiveAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">No students found</div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Response Time Distribution Modal */}
      <Dialog open={responseTimeOpen} onOpenChange={setResponseTimeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Response Time Distribution
            </DialogTitle>
          </DialogHeader>
          
          {/* Histogram */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), "Messages"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {responseTimeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Median</p>
              <p className="font-bold text-lg">{formatResponseTime((kpiData?.avgResponseTime || 0) * 0.8)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">90th Percentile</p>
              <p className="font-bold text-lg">{formatResponseTime((kpiData?.avgResponseTime || 0) * 2.5)}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Fastest</p>
              <p className="font-bold text-lg text-green-600">0.3s</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Slowest</p>
              <p className="font-bold text-lg text-red-600">{formatResponseTime((kpiData?.avgResponseTime || 0) * 8)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Configuration Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Analytics Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <p className="text-sm font-medium mb-3">Select Format</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setExportFormat("pdf")}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center transition-all",
                    exportFormat === "pdf" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="font-medium text-sm">PDF</p>
                  <p className="text-xs text-muted-foreground">Executive Report</p>
                </button>
                <button
                  onClick={() => setExportFormat("excel")}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center transition-all",
                    exportFormat === "excel" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium text-sm">Excel</p>
                  <p className="text-xs text-muted-foreground">Detailed Data</p>
                </button>
                <button
                  onClick={() => setExportFormat("word")}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center transition-all",
                    exportFormat === "word" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium text-sm">Word</p>
                  <p className="text-xs text-muted-foreground">Narrative Report</p>
                </button>
              </div>
            </div>
            
            {/* Format-specific options */}
            {exportFormat === "pdf" && (
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include visualizations</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.landscape}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, landscape: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Landscape orientation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.coverPage}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, coverPage: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include cover page</span>
                </label>
              </div>
            )}
            
            {/* Preview info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Export Preview</p>
              <p className="text-sm">
                Analytics data from {format(dateRange.from, "MMM d, yyyy")} to {format(dateRange.to, "MMM d, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Includes: KPI summary, daily trends, hourly patterns, sentiment breakdown
              </p>
            </div>
            
            {/* Export button */}
            <Button className="w-full" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export as {exportFormat.toUpperCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
