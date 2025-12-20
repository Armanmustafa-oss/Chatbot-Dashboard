import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { NeuCard } from "@/components/NeuCard";
import { CategoryLink } from "@/components/StudentLink";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatResponseTime } from "@/lib/export-service";
import { parseNavigationParams, formatDateRangeForBreadcrumb } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  History,
  MessageSquare,
  Phone,
  Search,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  engagementLevel?: "high" | "moderate" | "light";
}

type DrillDownView = "none" | "totalStudents" | "totalInteractions" | "avgSatisfaction" | "avgPerStudent";

export default function Students() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const navParams = parseNavigationParams(searchParams);
  
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"lastActive" | "name" | "messages" | "satisfaction">("lastActive");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [drillDownView, setDrillDownView] = useState<DrillDownView>("none");
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [selectedEngagementFilter, setSelectedEngagementFilter] = useState<string | null>(null);
  const [selectedSatisfactionBucket, setSelectedSatisfactionBucket] = useState<number | null>(null);
  const [selectedFrequencyBucket, setSelectedFrequencyBucket] = useState<number | null>(null);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: navParams.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: navParams.to || new Date(),
  });
  const limit = 20;

  // Check if navigated from another page with context
  const hasNavigationContext = navParams.source !== undefined;
  const sourcePageLabel = navParams.source === "analytics" ? "Analytics" : navParams.source === "messages" ? "Messages" : null;

  // Auto-open student if ID in URL
  useEffect(() => {
    if (navParams.id && !selectedStudent) {
      // Find the student by ID and open their profile
      const studentId = navParams.id;
      // We'll set this after data loads
    }
  }, [navParams.id]);

  const { data: students, isLoading } = trpc.students.list.useQuery({
    limit: 200, // Get more students for drill-down views
    offset: 0,
  });

  // Fetch conversation history for selected student
  const { data: conversationHistory, isLoading: isLoadingHistory } = trpc.messages.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: showConversationHistory && selectedStudent !== null }
  );

  // Simulated student statistics with engagement levels
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    if (!students) return [];
    return students.map((student, index) => {
      const messageCount = Math.floor(Math.random() * 50) + 1;
      const positiveRate = Math.floor(Math.random() * 40) + 40;
      const negativeRate = Math.floor(Math.random() * 20);
      
      // Determine engagement level
      let engagementLevel: "high" | "moderate" | "light";
      if (messageCount > 10) {
        engagementLevel = "high";
      } else if (messageCount >= 3) {
        engagementLevel = "moderate";
      } else {
        engagementLevel = "light";
      }
      
      return {
        ...student,
        phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        messageCount,
        avgSentiment: Math.floor(Math.random() * 40) + 60,
        topCategory: ["Financial Aid", "Registration", "Housing", "IT Support", "Admissions"][index % 5],
        avgResponseTime: Math.floor(Math.random() * 2000) + 500,
        positiveRate,
        negativeRate,
        engagementLevel,
      };
    });
  }, [students]);

  // Auto-select student from URL param
  useEffect(() => {
    if (navParams.id && studentsWithStats.length > 0 && !selectedStudent) {
      const found = studentsWithStats.find(s => s.id === navParams.id);
      if (found) {
        setSelectedStudent(found);
      }
    }
  }, [navParams.id, studentsWithStats, selectedStudent]);

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

    // Filter by engagement level if selected
    if (selectedEngagementFilter) {
      result = result.filter(s => s.engagementLevel === selectedEngagementFilter);
    }

    // Filter by satisfaction bucket if selected
    if (selectedSatisfactionBucket !== null) {
      result = result.filter(s => {
        const rating = Math.round((s.avgSentiment || 0) / 20); // Convert to 1-5 scale
        return rating === selectedSatisfactionBucket;
      });
    }

    // Filter by frequency bucket if selected
    if (selectedFrequencyBucket !== null) {
      result = result.filter(s => s.messageCount === selectedFrequencyBucket);
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
  }, [studentsWithStats, searchQuery, sortBy, dateRange, selectedEngagementFilter, selectedSatisfactionBucket, selectedFrequencyBucket]);

  // Engagement level segmentation
  const engagementSegments = useMemo(() => {
    const high = filteredStudents.filter(s => s.engagementLevel === "high");
    const moderate = filteredStudents.filter(s => s.engagementLevel === "moderate");
    const light = filteredStudents.filter(s => s.engagementLevel === "light");
    const total = filteredStudents.length;
    
    return [
      { 
        level: "high", 
        label: "Highly Engaged", 
        description: "10+ interactions",
        count: high.length, 
        percentage: total > 0 ? Math.round((high.length / total) * 100) : 0,
        students: high,
        color: "bg-green-500",
      },
      { 
        level: "moderate", 
        label: "Moderately Engaged", 
        description: "3-10 interactions",
        count: moderate.length, 
        percentage: total > 0 ? Math.round((moderate.length / total) * 100) : 0,
        students: moderate,
        color: "bg-blue-500",
      },
      { 
        level: "light", 
        label: "Lightly Engaged", 
        description: "1-2 interactions",
        count: light.length, 
        percentage: total > 0 ? Math.round((light.length / total) * 100) : 0,
        students: light,
        color: "bg-gray-400",
      },
    ];
  }, [filteredStudents]);

  // Category breakdown for interactions
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, { count: number; avgSatisfaction: number; students: StudentWithStats[] }> = {};
    
    filteredStudents.forEach(s => {
      const cat = s.topCategory || "Other";
      if (!categories[cat]) {
        categories[cat] = { count: 0, avgSatisfaction: 0, students: [] };
      }
      categories[cat].count += s.messageCount || 0;
      categories[cat].avgSatisfaction += s.avgSentiment || 0;
      categories[cat].students.push(s);
    });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      count: data.count,
      avgSatisfaction: data.students.length > 0 ? Math.round(data.avgSatisfaction / data.students.length) : 0,
      studentCount: data.students.length,
      students: data.students,
    })).sort((a, b) => b.count - a.count);
  }, [filteredStudents]);

  // Satisfaction distribution (1-5 stars)
  const satisfactionDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 1-5 stars
    
    filteredStudents.forEach(s => {
      const rating = Math.round((s.avgSentiment || 0) / 20); // Convert 0-100 to 1-5
      const index = Math.max(0, Math.min(4, rating - 1));
      buckets[index]++;
    });
    
    return buckets.map((count, i) => ({
      rating: i + 1,
      count,
      label: `${i + 1} Star${i === 0 ? "" : "s"}`,
      color: i >= 3 ? "#22c55e" : i >= 2 ? "#eab308" : "#ef4444",
    }));
  }, [filteredStudents]);

  // Frequency distribution
  const frequencyDistribution = useMemo(() => {
    const buckets: Record<number, number> = {};
    
    filteredStudents.forEach(s => {
      const count = s.messageCount || 0;
      buckets[count] = (buckets[count] || 0) + 1;
    });
    
    // Group into ranges for display
    const ranges = [
      { label: "1 interaction", min: 1, max: 1, count: 0 },
      { label: "2 interactions", min: 2, max: 2, count: 0 },
      { label: "3-5 interactions", min: 3, max: 5, count: 0 },
      { label: "6-10 interactions", min: 6, max: 10, count: 0 },
      { label: "11-20 interactions", min: 11, max: 20, count: 0 },
      { label: "21+ interactions", min: 21, max: 999, count: 0 },
    ];
    
    filteredStudents.forEach(s => {
      const count = s.messageCount || 0;
      const range = ranges.find(r => count >= r.min && count <= r.max);
      if (range) range.count++;
    });
    
    return ranges;
  }, [filteredStudents]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const totalMessages = filteredStudents.reduce((sum, s) => sum + (s.messageCount || 0), 0);
    const avgMessages = totalStudents > 0 ? Math.round(totalMessages / totalStudents * 10) / 10 : 0;
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
    return formatDate(date);
  };

  const handleExportStudent = (student: StudentWithStats) => {
    toast.success(`Exporting ${student.name || student.studentId}'s data...`);
  };

  const handleSendMessage = (student: StudentWithStats) => {
    if (student.phone) {
      window.open(`https://wa.me/${student.phone.replace(/\D/g, "")}`, "_blank");
    } else {
      toast.error("No phone number available for this student");
    }
  };

  const clearAllFilters = () => {
    setSelectedEngagementFilter(null);
    setSelectedSatisfactionBucket(null);
    setSelectedFrequencyBucket(null);
    setDrillDownView("none");
    setExpandedSegment(null);
  };

  const hasActiveFilters = selectedEngagementFilter || selectedSatisfactionBucket !== null || selectedFrequencyBucket !== null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Context Breadcrumb */}
        {hasNavigationContext && sourcePageLabel && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/${navParams.source}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {sourcePageLabel}
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">
              Viewing students from {formatDateRangeForBreadcrumb(dateRange.from, dateRange.to)}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Student Intelligence</h1>
            <p className="text-muted-foreground">
              Analyze student engagement patterns and interaction history
            </p>
          </div>
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Active Filters:</span>
            {selectedEngagementFilter && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEngagementFilter(null)}
                className="gap-1 h-7"
              >
                Engagement: {selectedEngagementFilter}
                <X className="h-3 w-3" />
              </Button>
            )}
            {selectedSatisfactionBucket !== null && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSatisfactionBucket(null)}
                className="gap-1 h-7"
              >
                {selectedSatisfactionBucket} Star{selectedSatisfactionBucket !== 1 ? "s" : ""}
                <X className="h-3 w-3" />
              </Button>
            )}
            {selectedFrequencyBucket !== null && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedFrequencyBucket(null)}
                className="gap-1 h-7"
              >
                {selectedFrequencyBucket} interactions
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7">
              Clear All
            </Button>
          </div>
        )}

        {/* Metric Cards with Drill-Down */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students Card */}
          <NeuCard 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              drillDownView === "totalStudents" && "ring-2 ring-primary"
            )}
            onClick={() => setDrillDownView(drillDownView === "totalStudents" ? "none" : "totalStudents")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Students
                </p>
                <p className="text-3xl font-bold mt-1">{summaryStats.totalStudents.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>Click to view engagement segments</span>
              {drillDownView === "totalStudents" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </NeuCard>

          {/* Total Interactions Card */}
          <NeuCard 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              drillDownView === "totalInteractions" && "ring-2 ring-primary"
            )}
            onClick={() => setDrillDownView(drillDownView === "totalInteractions" ? "none" : "totalInteractions")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Interactions
                </p>
                <p className="text-3xl font-bold mt-1">{summaryStats.totalMessages.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>Click to view by category</span>
              {drillDownView === "totalInteractions" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </NeuCard>

          {/* Average Satisfaction Card */}
          <NeuCard 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              drillDownView === "avgSatisfaction" && "ring-2 ring-primary"
            )}
            onClick={() => setDrillDownView(drillDownView === "avgSatisfaction" ? "none" : "avgSatisfaction")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Avg Satisfaction
                </p>
                <p className="text-3xl font-bold mt-1">{summaryStats.avgSatisfaction}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>Click to view distribution</span>
              {drillDownView === "avgSatisfaction" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </NeuCard>

          {/* Average Per Student Card */}
          <NeuCard 
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              drillDownView === "avgPerStudent" && "ring-2 ring-primary"
            )}
            onClick={() => setDrillDownView(drillDownView === "avgPerStudent" ? "none" : "avgPerStudent")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Avg Per Student
                </p>
                <p className="text-3xl font-bold mt-1">{summaryStats.avgMessages}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>Click to view frequency</span>
              {drillDownView === "avgPerStudent" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </NeuCard>
        </div>

        {/* Drill-Down Views */}
        {drillDownView !== "none" && (
          <NeuCard className="animate-in slide-in-from-top-2 duration-300">
            {/* Total Students Drill-Down: Engagement Segmentation */}
            {drillDownView === "totalStudents" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Student Engagement Segments</h3>
                  <Button variant="ghost" size="sm" onClick={() => setDrillDownView("none")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {engagementSegments.map((segment) => (
                    <div key={segment.level} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          if (expandedSegment === segment.level) {
                            setExpandedSegment(null);
                          } else {
                            setExpandedSegment(segment.level);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", segment.color)} />
                          <div className="text-left">
                            <p className="font-medium">{segment.label}</p>
                            <p className="text-sm text-muted-foreground">{segment.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold">{segment.count.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{segment.percentage}%</p>
                          </div>
                          {expandedSegment === segment.level ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      
                      {expandedSegment === segment.level && (
                        <div className="border-t bg-muted/30 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-muted-foreground">
                              Showing {Math.min(10, segment.students.length)} of {segment.count} students
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEngagementFilter(segment.level);
                                setDrillDownView("none");
                              }}
                            >
                              View All {segment.count}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {segment.students.slice(0, 10).map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-3 bg-background rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedStudent(student)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{student.name || student.studentId}</p>
                                    <p className="text-xs text-muted-foreground">{student.department}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">{student.messageCount} msgs</span>
                                  <span className={cn(
                                    (student.avgSentiment || 0) >= 70 ? "text-green-600" : 
                                    (student.avgSentiment || 0) >= 50 ? "text-yellow-600" : "text-red-600"
                                  )}>
                                    {student.avgSentiment}%
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Interactions Drill-Down: Category Breakdown */}
            {drillDownView === "totalInteractions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Interactions by Category</h3>
                  <Button variant="ghost" size="sm" onClick={() => setDrillDownView("none")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryBreakdown.map((cat) => (
                    <div
                      key={cat.name}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/messages?category=${encodeURIComponent(cat.name)}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <CategoryLink
                          category={cat.name}
                          context={{ fromPage: "/students", dateRange }}
                        />
                        <span className="text-sm text-muted-foreground">{cat.studentCount} students</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{cat.count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">interactions</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-semibold",
                            cat.avgSatisfaction >= 70 ? "text-green-600" :
                            cat.avgSatisfaction >= 50 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {cat.avgSatisfaction}%
                          </p>
                          <p className="text-xs text-muted-foreground">satisfaction</p>
                        </div>
                      </div>
                      <Progress value={cat.avgSatisfaction} className="mt-2 h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Average Satisfaction Drill-Down: Distribution Histogram */}
            {drillDownView === "avgSatisfaction" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Satisfaction Distribution</h3>
                  <Button variant="ghost" size="sm" onClick={() => setDrillDownView("none")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={satisfactionDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.label}</p>
                                <p className="text-sm text-muted-foreground">{data.count} students</p>
                                <p className="text-xs text-primary mt-1">Click to filter</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[4, 4, 0, 0]}
                        cursor="pointer"
                        onClick={(data) => {
                          setSelectedSatisfactionBucket(data.rating);
                          setDrillDownView("none");
                        }}
                      >
                        {satisfactionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {satisfactionDistribution.map((bucket) => (
                    <button
                      key={bucket.rating}
                      className="p-3 border rounded-lg text-center hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedSatisfactionBucket(bucket.rating);
                        setDrillDownView("none");
                      }}
                    >
                      <div className="flex justify-center mb-1">
                        {Array.from({ length: bucket.rating }).map((_, i) => (
                          <span key={i} className="text-yellow-500">★</span>
                        ))}
                      </div>
                      <p className="font-bold">{bucket.count}</p>
                      <p className="text-xs text-muted-foreground">students</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Average Per Student Drill-Down: Frequency Distribution */}
            {drillDownView === "avgPerStudent" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Interaction Frequency Distribution</h3>
                  <Button variant="ghost" size="sm" onClick={() => setDrillDownView("none")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={frequencyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.label}</p>
                                <p className="text-sm text-muted-foreground">{data.count} students</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  Click any bar to filter students by interaction count
                </p>
              </div>
            )}
          </NeuCard>
        )}

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="lastActive">Last Active</option>
              <option value="name">Name</option>
              <option value="messages">Most Messages</option>
              <option value="satisfaction">Highest Satisfaction</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredStudents.length} of {studentsWithStats.length} students
          {hasActiveFilters && " (filtered)"}
        </p>

        {/* Student List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <NeuCard className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </NeuCard>
          ) : (
            filteredStudents.slice(page * limit, (page + 1) * limit).map((student) => (
              <NeuCard
                key={student.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{student.name || "Unknown Student"}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{student.studentId}</span>
                        <span>•</span>
                        <span>{student.department}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{student.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-lg">{student.messageCount}</p>
                      <p className="text-muted-foreground text-xs">messages</p>
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "font-bold text-lg",
                        (student.avgSentiment || 0) >= 70 ? "text-green-600" :
                        (student.avgSentiment || 0) >= 50 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {student.avgSentiment}%
                      </p>
                      <p className="text-muted-foreground text-xs">satisfaction</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="font-medium">{getRelativeTime(student.lastActiveAt)}</p>
                      <p className="text-muted-foreground text-xs">last active</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </NeuCard>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredStudents.length > limit && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(filteredStudents.length / limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= filteredStudents.length}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      <Dialog open={selectedStudent !== null} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription>
              Complete interaction history and analytics
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Student Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{selectedStudent.name || "Unknown Student"}</p>
                      <p className="text-muted-foreground">{selectedStudent.studentId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedStudent.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportStudent(selectedStudent)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" onClick={() => handleSendMessage(selectedStudent)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedStudent.messageCount}</p>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      (selectedStudent.avgSentiment || 0) >= 70 ? "text-green-600" :
                      (selectedStudent.avgSentiment || 0) >= 50 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {selectedStudent.avgSentiment}%
                    </p>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{formatResponseTime(selectedStudent.avgResponseTime || 0)}</p>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <CategoryLink
                      category={selectedStudent.topCategory || "General"}
                      context={{ fromPage: "/students", dateRange }}
                    />
                    <p className="text-sm text-muted-foreground mt-1">Top Category</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Activity Chart */}
                  <NeuCard>
                    <h4 className="font-semibold mb-4">Weekly Activity</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={studentInteractionHistory}>
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </NeuCard>

                  {/* Sentiment Breakdown */}
                  <NeuCard>
                    <h4 className="font-semibold mb-4">Sentiment Breakdown</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
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
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}: {item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </NeuCard>
                </div>

                {/* Conversation History */}
                <NeuCard>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Conversation History
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConversationHistory(!showConversationHistory)}
                    >
                      {showConversationHistory ? "Hide" : "Load"} History
                    </Button>
                  </div>
                  
                  {showConversationHistory ? (
                    isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    ) : studentConversations.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No conversation history found for this student
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {studentConversations.slice(0, 10).map((msg) => (
                          <div key={msg.id} className="border rounded-lg overflow-hidden">
                            {/* Question */}
                            <div className="p-3 bg-muted/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Student Query</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm">{msg.query}</p>
                            </div>
                            
                            {/* Response */}
                            <div className="p-3 bg-primary/5 border-l-4 border-primary">
                              <span className="text-xs font-semibold text-muted-foreground uppercase">Bot Response</span>
                              <p className="text-sm mt-1">{msg.response}</p>
                            </div>
                            
                            {/* Metadata */}
                            <div className="p-2 bg-muted/30 flex items-center gap-4 text-xs">
                              <CategoryLink
                                category={msg.category || "General"}
                                context={{ fromPage: "/students", dateRange }}
                              />
                              <span className={cn(
                                "capitalize",
                                msg.sentiment === "positive" && "text-green-600",
                                msg.sentiment === "negative" && "text-red-600"
                              )}>
                                {msg.sentiment}
                              </span>
                              <span className="text-muted-foreground">
                                {formatResponseTime(msg.responseTimeMs || 0)}
                              </span>
                              {msg.rating && (
                                <span className="text-yellow-500">
                                  {"★".repeat(msg.rating)}{"☆".repeat(5 - msg.rating)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {studentConversations.length > 10 && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate(`/messages?studentId=${selectedStudent.id}`)}
                          >
                            View All {studentConversations.length} Conversations
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Click "Load History" to view this student's complete conversation timeline
                    </p>
                  )}
                </NeuCard>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
