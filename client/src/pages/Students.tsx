import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatResponseTime } from "@/lib/export-service";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Phone,
  Search,
  TrendingUp,
  User,
  Users,
  History,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface StudentWithStats {
  id: number;
  studentId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  createdAt: Date | string;
  lastActiveAt: Date | string;
  messageCount?: number;
  avgSentiment?: number;
  topCategory?: string;
  avgResponseTime?: number;
  positiveRate?: number;
  negativeRate?: number;
}

export default function Students() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"lastActive" | "name" | "messages" | "satisfaction">("lastActive");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const limit = 20;

  const { data: students, isLoading } = trpc.students.list.useQuery({
    limit,
    offset: page * limit,
  });

  // Fetch conversation history for selected student
  const { data: conversationHistory, isLoading: isLoadingHistory } = trpc.messages.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: showConversationHistory && selectedStudent !== null }
  );

  // Simulated student statistics with phone numbers
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    if (!students) return [];
    return students.map((student, index) => {
      const messageCount = Math.floor(Math.random() * 50) + 5;
      const positiveRate = Math.floor(Math.random() * 40) + 40;
      const negativeRate = Math.floor(Math.random() * 20);
      return {
        ...student,
        phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        messageCount,
        avgSentiment: Math.floor(Math.random() * 40) + 60,
        topCategory: ["Financial Aid", "Registration", "Housing", "IT Support", "Admissions"][index % 5],
        avgResponseTime: Math.floor(Math.random() * 2000) + 500,
        positiveRate,
        negativeRate,
      };
    });
  }, [students]);

  // Filter by date range and search
  const filteredStudents = useMemo(() => {
    let result = [...studentsWithStats];

    // Filter by date range
    result = result.filter((s) => {
      const lastActive = new Date(s.lastActiveAt);
      return lastActive >= dateRange.from && lastActive <= dateRange.to;
    });

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.phone?.toLowerCase().includes(query) ||
          s.studentId.toLowerCase().includes(query) ||
          s.department?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "messages":
          return (b.messageCount || 0) - (a.messageCount || 0);
        case "satisfaction":
          return (b.avgSentiment || 0) - (a.avgSentiment || 0);
        case "lastActive":
        default:
          return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
      }
    });

    return result;
  }, [studentsWithStats, searchQuery, sortBy, dateRange]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const totalMessages = filteredStudents.reduce((sum, s) => sum + (s.messageCount || 0), 0);
    const avgMessages = totalStudents > 0 ? Math.round(totalMessages / totalStudents) : 0;
    const avgSatisfaction = totalStudents > 0
      ? Math.round(filteredStudents.reduce((sum, s) => sum + (s.avgSentiment || 0), 0) / totalStudents)
      : 0;

    return { totalStudents, totalMessages, avgMessages, avgSatisfaction };
  }, [filteredStudents]);

  // Simulated interaction history for selected student
  const studentInteractionHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "short" }),
      messages: Math.floor(Math.random() * 10) + 1,
    }));
  }, [selectedStudent]);

  // Sentiment breakdown for selected student
  const sentimentBreakdown = useMemo(() => {
    if (!selectedStudent) return [];
    return [
      { name: "Positive", value: selectedStudent.positiveRate || 0, color: "#22c55e" },
      { name: "Neutral", value: 100 - (selectedStudent.positiveRate || 0) - (selectedStudent.negativeRate || 0), color: "#94a3b8" },
      { name: "Negative", value: selectedStudent.negativeRate || 0, color: "#ef4444" },
    ];
  }, [selectedStudent]);

  // Student's conversation history filtered
  const studentConversations = useMemo(() => {
    if (!conversationHistory || !selectedStudent) return [];
    return conversationHistory.messages.filter(
      (m) => m.studentId === selectedStudent.id
    );
  }, [conversationHistory, selectedStudent]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRelativeTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 80) return "text-green-600 bg-green-100";
    if (sentiment >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handleExport = () => {
    // Export with phone numbers instead of emails
    const headers = ["Student ID", "Name", "Phone", "Department", "Messages", "Satisfaction", "Top Category", "Last Active"];
    const rows = filteredStudents.map((s) => [
      s.studentId,
      s.name || "",
      s.phone || "",
      s.department || "",
      s.messageCount || 0,
      `${s.avgSentiment}%`,
      s.topCategory || "",
      formatDate(s.lastActiveAt),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Students data exported successfully!");
  };

  const handleExportStudentData = (student: StudentWithStats) => {
    const data = {
      studentId: student.studentId,
      name: student.name,
      phone: student.phone,
      department: student.department,
      totalMessages: student.messageCount,
      satisfaction: `${student.avgSentiment}%`,
      topCategory: student.topCategory,
      avgResponseTime: formatResponseTime(student.avgResponseTime || 0),
      lastActive: formatDate(student.lastActiveAt),
      memberSince: formatDate(student.createdAt),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-${student.studentId}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Student data exported");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Student Interaction Intelligence
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Comprehensive view of student engagement and behavior patterns
            </p>
          </div>

          <Button
            variant="outline"
            className="neu-flat border-0 gap-2 h-11"
            onClick={handleExport}
            style={{ minHeight: "44px" }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export All</span>
          </Button>
        </div>

        {/* Date Range Filter */}
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <NeuStat
            label="Total Students"
            value={summaryStats.totalStudents}
            icon={Users}
            tooltipContent="Total unique students in the selected date range"
          />
          <NeuStat
            label="Total Interactions"
            value={summaryStats.totalMessages}
            icon={MessageSquare}
            tooltipContent="Combined message count across all students"
          />
          <NeuStat
            label="Avg per Student"
            value={summaryStats.avgMessages}
            icon={TrendingUp}
            tooltipContent="Average number of messages per student"
          />
          <NeuStat
            label="Avg Satisfaction"
            value={`${summaryStats.avgSatisfaction}%`}
            icon={ThumbsUp}
            tooltipContent="Average satisfaction score across all students"
          />
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-flat pl-10 pr-4 py-3 rounded-xl text-sm w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ minHeight: "44px" }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["lastActive", "messages", "satisfaction", "name"] as const).map((sort) => (
            <Button
              key={sort}
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sort)}
              className={cn(
                "neu-flat border-0 h-11",
                sortBy === sort && "bg-primary text-white"
              )}
              style={{ minHeight: "44px" }}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {sort === "lastActive" ? "Recent" : sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{searchQuery ? "No students match your search" : "No students found in this date range"}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredStudents.map((student) => (
              <NeuCard
                key={student.id}
                interactive
                className="cursor-pointer group"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm sm:text-base group-hover:text-primary transition-colors">
                      {student.name || `Student ${student.studentId}`}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {student.phone || "No phone"}
                    </p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {student.department && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary">
                          {student.department}
                        </span>
                      )}
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium", getSentimentColor(student.avgSentiment || 0))}>
                        {student.avgSentiment}% satisfaction
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>{student.messageCount} messages</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(student.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="neu-flat border-0 h-11"
              style={{ minHeight: "44px" }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={filteredStudents.length < limit}
              className="neu-flat border-0 h-11"
              style={{ minHeight: "44px" }}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}

      {/* Student Detail Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg">{selectedStudent?.name || `Student ${selectedStudent?.studentId}`}</span>
                <p className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedStudent?.phone || "No phone on file"}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed interaction history and engagement metrics
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {selectedStudent && (
              <div className="space-y-6 mt-4 pb-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/30 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{selectedStudent.messageCount}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{selectedStudent.avgSentiment}%</p>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {formatResponseTime(selectedStudent.avgResponseTime || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{getRelativeTime(selectedStudent.lastActiveAt)}</p>
                    <p className="text-xs text-muted-foreground">Last Active</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Activity Chart */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">7-Day Activity</h4>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={studentInteractionHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                          <XAxis dataKey="day" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              borderRadius: "8px",
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Bar dataKey="messages" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sentiment Breakdown */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Sentiment Breakdown</h4>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {sentimentBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                      {sentimentBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center gap-1 text-xs">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}: {item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Student ID</p>
                      <p className="font-medium text-foreground">{selectedStudent.studentId}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="font-medium text-foreground">{selectedStudent.department || "Not specified"}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Top Category</p>
                      <p className="font-medium text-foreground">{selectedStudent.topCategory}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium text-foreground">{formatDate(selectedStudent.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setShowConversationHistory(true)}
                  >
                    <History className="h-4 w-4" />
                    View History
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      toast.info("Send Message", {
                        description: `This would open a messaging interface to contact ${selectedStudent.phone}`,
                      });
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleExportStudentData(selectedStudent)}
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Conversation History Dialog */}
      <Dialog open={showConversationHistory} onOpenChange={setShowConversationHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Conversation History
            </DialogTitle>
            <DialogDescription>
              All interactions from {selectedStudent?.name || `Student ${selectedStudent?.studentId}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoadingHistory ? (
              <div className="p-4 text-center text-muted-foreground">Loading history...</div>
            ) : studentConversations.length > 0 ? (
              <div className="space-y-4 pb-4">
                {studentConversations.map((message) => (
                  <div key={message.id} className="p-4 rounded-xl border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {message.sentiment === "positive" ? (
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        ) : message.sentiment === "negative" ? (
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {message.sentiment || "neutral"}
                        </span>
                        {message.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                            {message.category}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(message.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Query</p>
                        <p className="text-sm text-foreground">{message.query}</p>
                      </div>
                      {message.response && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Response</p>
                          <p className="text-sm text-foreground line-clamp-3">{message.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No conversation history found</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
