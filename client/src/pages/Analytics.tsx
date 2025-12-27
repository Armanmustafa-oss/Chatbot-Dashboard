import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { format, subDays } from "date-fns";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  ThumbsUp,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockAnalyticsData, mockMessagesData, mockStudentsData } from "@/lib/mockData";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Analytics() {
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Temporary date selection for dual calendar
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(dateRange.from);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(dateRange.to);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Use mock data
  const dailyData = mockAnalyticsData.getDailyData();
  const hourlyData = mockAnalyticsData.getHourlyPeakTimes();
  const kpiData = mockAnalyticsData.getKPISummary();
  const messagesData = mockMessagesData.list();
  const studentsData = mockStudentsData.list();

  const handleDateRangeChange = useCallback(() => {
    if (tempStartDate && tempEndDate) {
      setDateRange({ from: tempStartDate, to: tempEndDate });
      setIsDatePickerOpen(false);
    }
  }, [tempStartDate, tempEndDate]);

  const handleExport = useCallback((format: "pdf" | "excel" | "word") => {
    console.log(`Exporting as ${format}`);
  }, []);

  // Category trends data
  const categoryTrendsData = useMemo(() => {
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
  }, []);

  // Response time distribution
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

  return (
    <DashboardLayout>
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
                <p className="text-2xl font-bold text-white">{((kpiData?.avgResponseTime || 0) / 1000).toFixed(2)}s</p>
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
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </NeuCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
