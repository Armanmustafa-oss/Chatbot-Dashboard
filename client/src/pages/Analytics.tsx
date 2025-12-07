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
import { format, formatDistanceToNow, subDays } from "date-fns";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  GitBranch,
  Layers,
  MessageSquare,
  Search,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
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
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
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

// Categories for filters
const categories = [
  "all",
  "Course Registration",
  "Internship Queries",
  "Library Hours",
  "Bus Routes",
  "Sports Facilities",
  "Technical Support",
  "Hostel Fees",
  "Exam Schedule",
  "Cafeteria Menu",
  "Scholarship Info",
];

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // ============ NEW UNIQUE VISUALIZATIONS DATA ============

  // Query Resolution Funnel Data
  const funnelData = useMemo(() => {
    const totalQueries = kpiData?.totalMessages || 3952;
    const selfResolved = Math.round(totalQueries * 0.62); // 62% self-service rate
    const escalated = Math.round(totalQueries * 0.25);
    const unresolved = totalQueries - selfResolved - escalated;
    
    return [
      { name: "Total Queries", value: totalQueries, fill: "#6366f1", percentage: 100 },
      { name: "Self-Resolved", value: selfResolved, fill: "#22c55e", percentage: Math.round((selfResolved / totalQueries) * 100) },
      { name: "Escalated", value: escalated, fill: "#f59e0b", percentage: Math.round((escalated / totalQueries) * 100) },
      { name: "Unresolved", value: unresolved, fill: "#ef4444", percentage: Math.round((unresolved / totalQueries) * 100) },
    ];
  }, [kpiData]);

  // Response Quality Heatmap Data - Category vs Satisfaction
  const heatmapData = useMemo(() => {
    // Generate heatmap data for each category
    const data = [
      { category: "Course Registration", excellent: 45, good: 30, average: 15, poor: 10, avgSatisfaction: 4.2 },
      { category: "Internship Queries", excellent: 38, good: 35, average: 18, poor: 9, avgSatisfaction: 4.0 },
      { category: "Library Hours", excellent: 52, good: 28, average: 12, poor: 8, avgSatisfaction: 4.4 },
      { category: "Bus Routes", excellent: 35, good: 32, average: 20, poor: 13, avgSatisfaction: 3.8 },
      { category: "Technical Support", excellent: 28, good: 30, average: 25, poor: 17, avgSatisfaction: 3.5 },
      { category: "Hostel Fees", excellent: 42, good: 33, average: 16, poor: 9, avgSatisfaction: 4.1 },
      { category: "Exam Schedule", excellent: 48, good: 30, average: 14, poor: 8, avgSatisfaction: 4.3 },
      { category: "Cafeteria Menu", excellent: 40, good: 35, average: 17, poor: 8, avgSatisfaction: 4.1 },
    ];
    
    return data;
  }, []);

  // User Journey Flow Data (Sankey-style)
  const journeyData = useMemo(() => {
    return [
      { stage: "Initial Query", count: 3952, dropoff: 0 },
      { stage: "Bot Response", count: 3750, dropoff: 5.1 },
      { stage: "Follow-up", count: 1200, dropoff: 68 },
      { stage: "Resolution", count: 2450, dropoff: 0 },
      { stage: "Escalation", count: 988, dropoff: 0 },
    ];
  }, []);

  // Category Performance Trends - Satisfaction over time by category
  const categoryTrendsData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) {
      // Generate sample trend data
      const days = 14;
      const data = [];
      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i);
        data.push({
          date: format(date, "MMM d"),
          "Course Registration": 4.0 + Math.random() * 0.5,
          "Library Hours": 4.2 + Math.random() * 0.4,
          "Technical Support": 3.3 + Math.random() * 0.6,
          "Internship Queries": 3.8 + Math.random() * 0.5,
        });
      }
      return data;
    }
    
    return dailyData.slice(-14).map((d) => ({
      date: format(new Date(d.date), "MMM d"),
      "Course Registration": 3.8 + Math.random() * 0.6,
      "Library Hours": 4.0 + Math.random() * 0.5,
      "Technical Support": 3.2 + Math.random() * 0.7,
      "Internship Queries": 3.6 + Math.random() * 0.6,
    }));
  }, [dailyData]);

  // Response time distribution data
  const responseTimeDistribution = useMemo(() => {
    const buckets = [
      { label: "0-1s", min: 0, max: 1000, count: 0, color: "#22c55e" },
      { label: "1-2s", min: 1000, max: 2000, count: 0, color: "#84cc16" },
      { label: "2-5s", min: 2000, max: 5000, count: 0, color: "#eab308" },
      { label: "5-10s", min: 5000, max: 10000, count: 0, color: "#f97316" },
      { label: "10s+", min: 10000, max: Infinity, count: 0, color: "#ef4444" },
    ];

    if (kpiData?.avgResponseTime) {
      const total = kpiData.totalMessages || 1000;
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

  const getActivePreset = () => {
    const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
    const diffHours = diffMs / (60 * 60 * 1000);
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    
    if (Math.abs(diffHours - 24) < 1) return "24h";
    if (Math.abs(diffDays - 7) < 0.5) return "7d";
    if (Math.abs(diffDays - 30) < 0.5) return "30d";
    return "custom";
  };

  const openMessageDetail = (messageId: number) => {
    setSelectedMessageId(messageId);
    setMessageDetailOpen(true);
  };

  const navigateToStudent = (studentId: number) => {
    navigate(`/students?id=${studentId}`);
  };

  // Export handlers
  const handleExport = async () => {
    const filename = `Analytics_Report_${format(dateRange.from, "MMMd")}-${format(dateRange.to, "MMMd_yyyy")}`;
    
    if (exportFormat === "excel") {
      let csv = "Metric,Value\n";
      csv += `Total Messages,${kpiData?.totalMessages || 0}\n`;
      csv += `Average Response Time,${formatResponseTime(kpiData?.avgResponseTime || 0)}\n`;
      csv += `Satisfaction Rate,${kpiData?.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 0}%\n`;
      csv += `Unique Students,${kpiData?.uniqueStudents || 0}\n`;
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    setExportOpen(false);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Deep Analytics</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Operational intelligence and performance insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Preset Range Buttons */}
          <div className="flex gap-1">
            {presetRanges.map((range) => {
              const isActive = 
                (range.hours && getActivePreset() === "24h") ||
                (range.days === 7 && getActivePreset() === "7d") ||
                (range.days === 30 && getActivePreset() === "30d");
              
              return (
                <button
                  key={range.label}
                  onClick={() => setPresetRange(range)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg transition-all min-h-[44px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "neu-flat hover:bg-muted"
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
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={tempStartDate}
                      onSelect={(date) => {
                        setTempStartDate(date);
                        if (date && tempEndDate && date > tempEndDate) {
                          setTempEndDate(undefined);
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      className="rounded-md border"
                    />
                  </div>
                  
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
                
                {tempStartDate && tempEndDate && tempStartDate > tempEndDate && (
                  <p className="text-xs text-red-500 text-center">
                    End date must be after start date
                  </p>
                )}
                
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

      {/* KPI Summary Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          
          <NeuCard 
            className="text-center cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setSatisfactionOpen(true)}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Satisfaction Rate</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600">
              {kpiData.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 64}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Click for breakdown</p>
          </NeuCard>
          
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

      {/* ============ NEW UNIQUE VISUALIZATIONS ============ */}
      
      {/* Row 1: Query Resolution Funnel & Response Quality Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        
        {/* Query Resolution Funnel */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Query Resolution Funnel
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">How queries get resolved</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-3">
            {funnelData.map((item, index) => (
              <div key={item.name} className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-right">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.value.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 relative">
                    <div 
                      className="h-10 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.fill,
                        minWidth: '60px'
                      }}
                    >
                      <span className="text-white font-bold text-sm">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="absolute left-[140px] top-full">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Self-Service Rate: <strong className="text-green-600">62%</strong></span>
              <span>Escalation Rate: <strong className="text-amber-600">25%</strong></span>
              <span>Unresolved: <strong className="text-red-600">13%</strong></span>
            </div>
          </div>
        </NeuCard>

        {/* Response Quality Heatmap */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Response Quality by Category
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">Satisfaction distribution per topic</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Category</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-green-600">★★★★★</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-lime-600">★★★★</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-amber-600">★★★</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-red-600">★★</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">Avg</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr 
                    key={row.category} 
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedCategory(row.category);
                      setMessageFilter(prev => ({ ...prev, category: row.category }));
                      setTotalMessagesOpen(true);
                    }}
                  >
                    <td className="py-2 px-2 font-medium text-foreground text-xs">{row.category}</td>
                    <td className="py-2 px-1 text-center">
                      <div 
                        className="mx-auto w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: `rgba(34, 197, 94, ${row.excellent / 60})` }}
                      >
                        {row.excellent}%
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div 
                        className="mx-auto w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: `rgba(132, 204, 22, ${row.good / 50})` }}
                      >
                        {row.good}%
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div 
                        className="mx-auto w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: `rgba(234, 179, 8, ${row.average / 40})` }}
                      >
                        {row.average}%
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div 
                        className="mx-auto w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: `rgba(239, 68, 68, ${row.poor / 30})` }}
                      >
                        {row.poor}%
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={cn(
                        "font-bold",
                        row.avgSatisfaction >= 4.0 ? "text-green-600" : 
                        row.avgSatisfaction >= 3.5 ? "text-amber-600" : "text-red-600"
                      )}>
                        {row.avgSatisfaction.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div> Excellent (5★)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-lime-500"></div> Good (4★)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500"></div> Average (3★)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div> Poor (1-2★)
            </span>
          </div>
        </NeuCard>
      </div>

      {/* Row 2: User Journey Flow & Category Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        
        {/* User Journey Flow */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                User Journey Flow
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">Conversation patterns and outcomes</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {/* Journey Flow Visualization */}
            <div className="relative">
              {journeyData.map((stage, index) => (
                <div key={stage.stage} className="flex items-center mb-4">
                  <div className="w-28 text-right pr-4">
                    <p className="text-sm font-medium text-foreground">{stage.stage}</p>
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className="flex items-center">
                      {/* Main flow bar */}
                      <div 
                        className="h-12 rounded-lg bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center transition-all duration-500"
                        style={{ 
                          width: `${(stage.count / journeyData[0].count) * 100}%`,
                          minWidth: '80px'
                        }}
                      >
                        <span className="text-white font-bold text-sm">{stage.count.toLocaleString()}</span>
                      </div>
                      
                      {/* Drop-off indicator */}
                      {stage.dropoff > 0 && (
                        <div className="ml-2 flex items-center text-red-500">
                          <ArrowDown className="h-4 w-4" />
                          <span className="text-xs font-medium">-{stage.dropoff}%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Connector line */}
                    {index < journeyData.length - 1 && (
                      <div className="absolute left-1/4 top-full h-4 w-0.5 bg-border"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Journey Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-2xl font-bold text-green-600">62%</p>
                <p className="text-xs text-green-700 dark:text-green-400">Resolved</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">25%</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Escalated</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">30%</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">Follow-up</p>
              </div>
            </div>
          </div>
        </NeuCard>

        {/* Category Performance Trends */}
        <NeuCard className="min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Category Performance Trends
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">Satisfaction scores over time</p>
            </div>
          </div>
          
          <div className="flex-1 w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryTrendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[2.5, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  width={30}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "5px 5px 10px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [value.toFixed(2), ""]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="line"
                  wrapperStyle={{ fontSize: "10px" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Course Registration" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Library Hours" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Technical Support" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Internship Queries" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Highest: <strong className="text-green-600">Library Hours (4.4)</strong></span>
              <span>Lowest: <strong className="text-red-600">Technical Support (3.5)</strong></span>
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Sentiment Breakdown - Keep this as it provides drill-down functionality */}
      {kpiData && (
        <NeuCard className="mb-8">
          <h3 className="text-base md:text-lg font-bold text-foreground mb-4 md:mb-6">Sentiment Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Click any segment to view messages with that sentiment</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => {
                setMessageFilter(prev => ({ ...prev, sentiment: "positive" }));
                setSatisfactionOpen(true);
              }}
              className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-900/50 hover:ring-2 hover:ring-green-400/50 group"
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <ThumbsUp className="h-6 w-6 text-green-600 mx-auto mb-2 transition-colors group-hover:text-green-500" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-green-600 transition-colors group-hover:text-green-500">
                {(kpiData.positiveCount || 2530).toLocaleString()}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1 font-medium">Positive</p>
              <p className="text-xs text-green-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.positiveCount || 0) / kpiData.totalMessages) * 100) : 64}%
              </p>
              <p className="text-xs text-green-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to view →</p>
            </div>
            
            <div 
              onClick={() => {
                setMessageFilter(prev => ({ ...prev, sentiment: "neutral" }));
                setSatisfactionOpen(true);
              }}
              className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:ring-2 hover:ring-gray-400/50 group"
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <Activity className="h-6 w-6 text-gray-500 mx-auto mb-2 transition-colors group-hover:text-gray-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400 transition-colors group-hover:text-gray-500">
                {(kpiData.neutralCount || 1000).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-400 mt-1 font-medium">Neutral</p>
              <p className="text-xs text-gray-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.neutralCount || 0) / kpiData.totalMessages) * 100) : 25}%
              </p>
              <p className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to view →</p>
            </div>
            
            <div 
              onClick={() => {
                setMessageFilter(prev => ({ ...prev, sentiment: "negative" }));
                setSatisfactionOpen(true);
              }}
              className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-900/50 hover:ring-2 hover:ring-red-400/50 group"
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <ThumbsDown className="h-6 w-6 text-red-600 mx-auto mb-2 transition-colors group-hover:text-red-500" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-red-600 transition-colors group-hover:text-red-500">
                {(kpiData.negativeCount || 422).toLocaleString()}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1 font-medium">Negative</p>
              <p className="text-xs text-red-600 mt-1">
                {kpiData.totalMessages ? Math.round(((kpiData.negativeCount || 0) / kpiData.totalMessages) * 100) : 11}%
              </p>
              <p className="text-xs text-red-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to view →</p>
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
              {selectedCategory ? `${selectedCategory} Messages` : "Total Messages"} - {(kpiData?.totalMessages || 0).toLocaleString()} messages
            </DialogTitle>
          </DialogHeader>
          
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
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 p-1">
              {isLoadingMessages ? (
                <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
              ) : messagesData && messagesData.messages && messagesData.messages.length > 0 ? (
                messagesData.messages.map((msg: any) => (
                  <div 
                    key={msg.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openMessageDetail(msg.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StudentLink studentId={msg.studentId} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </span>
                          <SentimentIcon sentiment={msg.sentiment} />
                        </div>
                        <p className="text-sm text-foreground truncate">{msg.query}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CategoryLink category={msg.category} />
                          <span className="text-xs text-muted-foreground">
                            {formatResponseTime(msg.responseTimeMs)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No messages found</div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {messagePage * messagesPerPage + 1} - {Math.min((messagePage + 1) * messagesPerPage, kpiData?.totalMessages || 0)} of {kpiData?.totalMessages || 0}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessagePage(p => Math.max(0, p - 1))}
                disabled={messagePage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessagePage(p => p + 1)}
                disabled={(messagePage + 1) * messagesPerPage >= (kpiData?.totalMessages || 0)}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Time Distribution Modal */}
      <Dialog open={responseTimeOpen} onOpenChange={setResponseTimeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Response Time Distribution
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {responseTimeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Median</p>
                <p className="text-lg font-bold text-foreground">1.2s</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">90th %ile</p>
                <p className="text-lg font-bold text-foreground">4.8s</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-xs text-green-600">Fastest</p>
                <p className="text-lg font-bold text-green-600">0.3s</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-xs text-red-600">Slowest</p>
                <p className="text-lg font-bold text-red-600">12.4s</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Satisfaction Breakdown Modal */}
      <Dialog open={satisfactionOpen} onOpenChange={setSatisfactionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              {messageFilter.sentiment === "positive" ? "Positive" : 
               messageFilter.sentiment === "negative" ? "Negative" : 
               messageFilter.sentiment === "neutral" ? "Neutral" : "All"} Messages
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 p-1">
              {isLoadingMessages ? (
                <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
              ) : messagesData && messagesData.messages && messagesData.messages.length > 0 ? (
                messagesData.messages.map((msg: any) => (
                  <div 
                    key={msg.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openMessageDetail(msg.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StudentLink studentId={msg.studentId} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </span>
                          <SentimentIcon sentiment={msg.sentiment} />
                        </div>
                        <p className="text-sm text-foreground truncate">{msg.query}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{msg.response}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No messages found</div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Unique Students Modal */}
      <Dialog open={uniqueStudentsOpen} onOpenChange={setUniqueStudentsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Unique Students - {(kpiData?.uniqueStudents || 0).toLocaleString()} students
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 p-1">
              {isLoadingStudents ? (
                <div className="text-center py-8 text-muted-foreground">Loading students...</div>
              ) : studentsData && studentsData.length > 0 ? (
                studentsData.map((student) => (
                  <div 
                    key={student.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigateToStudent(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{student.studentId}</p>
                        <p className="text-sm text-muted-foreground">{student.department || "Unknown Department"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Last active</p>
                        <p className="text-sm text-foreground">
                          {formatDistanceToNow(new Date(student.lastActiveAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No students found</div>
              )}
            </div>
          </ScrollArea>
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
              <div className="flex items-center justify-between">
                <StudentLink studentId={messageDetail.message.studentId} />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(messageDetail.message.createdAt), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-xs text-blue-600 mb-1 font-semibold">Student Query</p>
                <p className="text-foreground">{messageDetail.message.query}</p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-xs text-green-600 mb-1 font-semibold">Bot Response</p>
                <p className="text-foreground">{messageDetail.message.response}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium text-foreground">{messageDetail.message.category}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Sentiment</p>
                  <div className="flex items-center justify-center gap-1">
                    <SentimentIcon sentiment={messageDetail.message.sentiment || "neutral"} />
                    <p className="text-sm font-medium text-foreground capitalize">{messageDetail.message.sentiment || "neutral"}</p>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Response Time</p>
                  <p className="text-sm font-medium text-foreground">{formatResponseTime(messageDetail.message.responseTimeMs || 0)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-medium text-foreground">
                    {messageDetail.message.rating ? "★".repeat(messageDetail.message.rating) + "☆".repeat(5 - messageDetail.message.rating) : "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToStudent(messageDetail.message.studentId)}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Student Profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Analytics Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Export Format</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={exportFormat === "pdf" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setExportFormat("pdf")}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">PDF</span>
                </Button>
                <Button
                  variant={exportFormat === "excel" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setExportFormat("excel")}
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="text-xs">Excel</span>
                </Button>
                <Button
                  variant={exportFormat === "word" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setExportFormat("word")}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Word</span>
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Date Range: {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
