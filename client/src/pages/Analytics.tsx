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
import { mockAnalyticsData, mockMessagesData, mockStudentsData } from "@/lib/mockData";
import { DashboardLayout } from "@/components/DashboardLayout";

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

  // Use mock data instead of tRPC
  const dailyData = mockAnalyticsData.getDailyData();
  const isLoadingDaily = false;
  const hourlyData = mockAnalyticsData.getHourlyPeakTimes();
  const isLoadingHourly = false;
  const kpiData = mockAnalyticsData.getKPISummary();
  const isLoadingKPI = false;
  const messagesData = mockMessagesData.list();
  const isLoadingMessages = false;
  const messageDetail = selectedMessageId ? mockMessagesData.getById(selectedMessageId) : null;
  const studentsData = mockStudentsData.list();
  const isLoadingStudents = false;

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
    
    return dailyData.slice(-14).map((d: any) => ({
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
      { label: "2-5s", min: 2000, max: 5000, count: 0, color: "#f59e0b" },
      { label: "5-10s", min: 5000, max: 10000, count: 0, color: "#f97316" },
      { label: "10s+", min: 10000, max: Infinity, count: 0, color: "#ef4444" },
    ];

    if (messagesData && Array.isArray(messagesData)) {
      messagesData.forEach((msg: any) => {
        const responseTime = msg.responseTimeMs || 0;
        const bucket = buckets.find(b => responseTime >= b.min && responseTime < b.max);
        if (bucket) bucket.count++;
      });
    }

    return buckets;
  }, [messagesData]);

  // Filtered messages based on category
  const filteredMessages = useMemo(() => {
    if (!messagesData || !Array.isArray(messagesData)) return [];
    
    return messagesData.filter((msg: any) => {
      if (selectedCategory && msg.category !== selectedCategory) return false;
      if (messageFilter.search && !msg.query.toLowerCase().includes(messageFilter.search.toLowerCase())) return false;
      return true;
    });
  }, [messagesData, selectedCategory, messageFilter.search]);

  // Paginated messages
  const paginatedMessages = useMemo(() => {
    const start = messagePage * messagesPerPage;
    return filteredMessages.slice(start, start + messagesPerPage);
  }, [filteredMessages, messagePage, messagesPerPage]);

  const handleDateRangeChange = useCallback(() => {
    if (tempStartDate && tempEndDate) {
      setDateRange({ from: tempStartDate, to: tempEndDate });
      setIsDatePickerOpen(false);
    }
  }, [tempStartDate, tempEndDate]);

  const handleExport = useCallback((format: "pdf" | "excel" | "word") => {
    console.log(`Exporting as ${format}`);
    setExportOpen(false);
  }, []);

  const isLoading = isLoadingDaily || isLoadingHourly || isLoadingKPI || isLoadingMessages || isLoadingStudents;

  return (
    <DashboardLayout>
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-slate-400">Track student queries, satisfaction rates, and system performance</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
=======
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-slate-400">Track student queries, satisfaction rates, and system performance</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={tempStartDate}
                      onSelect={setTempStartDate}
                      disabled={(date) => date > (tempEndDate || new Date())}
                    />
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">End Date</p>
                    <Calendar
                      mode="single"
                      selected={tempEndDate}
                      onSelect={setTempEndDate}
                      disabled={(date) => date < (tempStartDate || new Date())}
                    />
                  </div>
                  <Button onClick={handleDateRangeChange} className="w-full">
                    Apply
>>>>>>> b3fe5f9bd6705aa8c3c6ddb2b0213e123cb0cc0e
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Start Date</p>
                      <Calendar
                        mode="single"
                        selected={tempStartDate}
                        onSelect={setTempStartDate}
                        disabled={(date) => date > (tempEndDate || new Date())}
                      />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">End Date</p>
                      <Calendar
                        mode="single"
                        selected={tempEndDate}
                        onSelect={setTempEndDate}
                        disabled={(date) => date < (tempStartDate || new Date())}
                      />
                    </div>
                    <Button onClick={handleDateRangeChange} className="w-full">
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("word")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as Word
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NeuCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Messages</p>
                  <p className="text-2xl font-bold text-white">{kpiData?.totalMessages || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>12% from last month</span>
              </div>
            </NeuCard>

            <NeuCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Unique Students</p>
                  <p className="text-2xl font-bold text-white">{kpiData?.totalStudents || 0}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>8% from last month</span>
              </div>
            </NeuCard>

            <NeuCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Avg Satisfaction</p>
                  <p className="text-2xl font-bold text-white">{kpiData?.avgSatisfaction?.toFixed(1) || 0}</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>0.3 points up</span>
              </div>
            </NeuCard>

            <NeuCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Avg Response Time</p>
                  <p className="text-2xl font-bold text-white">{(kpiData?.avgResponseTime || 0) / 1000} s</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <ArrowDown className="h-4 w-4 mr-1" />
                <span>0.2s faster</span>
              </div>
            </NeuCard>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <NeuCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Daily Message Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData || []}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Area type="monotone" dataKey="messages" stroke="#6366f1" fillOpacity={1} fill="url(#colorMessages)" />
                </AreaChart>
              </ResponsiveContainer>
            </NeuCard>

            {/* Hourly Peak Times */}
            <NeuCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Peak Hours</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Bar dataKey="messages" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </NeuCard>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <NeuCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Category Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={categoryTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Course Registration" stroke="#6366f1" />
                  <Line type="monotone" dataKey="Library Hours" stroke="#22c55e" />
                  <Line type="monotone" dataKey="Technical Support" stroke="#f59e0b" />
                  <Line type="monotone" dataKey="Internship Queries" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </NeuCard>

            {/* Response Time Distribution */}
            <NeuCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Response Time Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </NeuCard>
          </div>

          {/* Messages Table */}
          <NeuCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Messages</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <ScrollArea className="w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Student ID</th>
                    <th className="text-left py-3 px-4 text-slate-400">Query</th>
                    <th className="text-left py-3 px-4 text-slate-400">Category</th>
                    <th className="text-left py-3 px-4 text-slate-400">Sentiment</th>
                    <th className="text-left py-3 px-4 text-slate-400">Rating</th>
                    <th className="text-left py-3 px-4 text-slate-400">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMessages.map((msg: any) => (
                    <tr key={msg.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-white">{msg.studentId}</td>
                      <td className="py-3 px-4 text-slate-300">{msg.query}</td>
                      <td className="py-3 px-4 text-slate-300">{msg.category}</td>
                      <td className="py-3 px-4">
                        <SentimentIcon sentiment={msg.sentiment} />
                      </td>
                      <td className="py-3 px-4 text-white">{msg.rating || "-"}</td>
                      <td className="py-3 px-4 text-slate-300">{formatResponseTime(msg.responseTimeMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </NeuCard>
        </div>
      </div>
    </DashboardLayout>
  );
}