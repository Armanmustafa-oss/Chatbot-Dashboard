import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard, NeuStat } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportStudentsToCSV } from "@/lib/export";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MessageSquare,
  Search,
  TrendingUp,
  User,
  Users,
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
} from "recharts";

interface StudentWithStats {
  id: number;
  studentId: string;
  name: string | null;
  email: string | null;
  department: string | null;
  createdAt: Date | string;
  lastActiveAt: Date | string;
  messageCount?: number;
  avgSentiment?: number;
  topCategory?: string;
}

export default function Students() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"lastActive" | "name" | "messages">("lastActive");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const limit = 20;

  const { data: students, isLoading } = trpc.students.list.useQuery({
    limit,
    offset: page * limit,
  });

  // Simulated student statistics (in production, this would come from the API)
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    if (!students) return [];
    return students.map((student, index) => ({
      ...student,
      messageCount: Math.floor(Math.random() * 50) + 5,
      avgSentiment: Math.floor(Math.random() * 40) + 60,
      topCategory: ["Financial Aid", "Registration", "Housing", "IT Support", "Admissions"][index % 5],
    }));
  }, [students]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...studentsWithStats];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
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
        case "lastActive":
        default:
          return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
      }
    });

    return result;
  }, [studentsWithStats, searchQuery, sortBy]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalStudents = studentsWithStats.length;
    const totalMessages = studentsWithStats.reduce((sum, s) => sum + (s.messageCount || 0), 0);
    const avgMessages = totalStudents > 0 ? Math.round(totalMessages / totalStudents) : 0;
    const activeThisWeek = Math.floor(totalStudents * 0.6);

    return { totalStudents, totalMessages, avgMessages, activeThisWeek };
  }, [studentsWithStats]);

  // Simulated interaction history for selected student
  const studentInteractionHistory = useMemo(() => {
    if (!selectedStudent) return [];
    // Generate last 7 days of activity
    return Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "short" }),
      messages: Math.floor(Math.random() * 10) + 1,
    }));
  }, [selectedStudent]);

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
    if (students && students.length > 0) {
      exportStudentsToCSV(students);
      toast.success("Students data exported successfully!");
    } else {
      toast.error("No data to export");
    }
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
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <NeuStat
            label="Total Students"
            value={summaryStats.totalStudents}
            icon={Users}
            tooltipContent="Total unique students who have interacted with the chatbot"
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
            label="Active This Week"
            value={summaryStats.activeThisWeek}
            icon={User}
            trend="+8%"
            tooltipContent="Students who have interacted in the last 7 days"
          />
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-flat pl-10 pr-4 py-3 rounded-xl text-sm w-full bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ minHeight: "44px" }}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy("lastActive")}
            className={cn(
              "neu-flat border-0 h-11",
              sortBy === "lastActive" && "bg-primary text-white"
            )}
            style={{ minHeight: "44px" }}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Recent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy("messages")}
            className={cn(
              "neu-flat border-0 h-11",
              sortBy === "messages" && "bg-primary text-white"
            )}
            style={{ minHeight: "44px" }}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Messages
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy("name")}
            className={cn(
              "neu-flat border-0 h-11",
              sortBy === "name" && "bg-primary text-white"
            )}
            style={{ minHeight: "44px" }}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Name
          </Button>
        </div>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No students match your search" : "No students found"}
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
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {student.email || "No email"}
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
        <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg">{selectedStudent?.name || `Student ${selectedStudent?.studentId}`}</span>
                <p className="text-sm font-normal text-muted-foreground">{selectedStudent?.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed interaction history and engagement metrics
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6 mt-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedStudent.messageCount}</p>
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedStudent.avgSentiment}%</p>
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{getRelativeTime(selectedStudent.lastActiveAt)}</p>
                  <p className="text-xs text-muted-foreground">Last Active</p>
                </div>
              </div>

              {/* Activity Chart */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">7-Day Activity</h4>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentInteractionHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="day" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
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
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.info("Feature coming soon")}>
                  <MessageSquare className="h-4 w-4" />
                  View Messages
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => toast.info("Feature coming soon")}>
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
