import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { NeuCard } from "@/components/NeuCard";
import { StudentLink, CategoryLink } from "@/components/StudentLink";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatResponseTime } from "@/lib/export-service";
import { parseNavigationParams, formatDateRangeForBreadcrumb } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  History,
  MessageSquare,
  Search,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Folder,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";

export default function Messages() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const navParams = parseNavigationParams(searchParams);

  const [selectedMessage, setSelectedMessage] = useState<number | null>(navParams.id || null);
  const [sentimentFilter, setSentimentFilter] = useState<string>(navParams.sentiment || "all");
  const [categoryFilter, setCategoryFilter] = useState<string>(navParams.category || "all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [responseTimeFilter, setResponseTimeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: navParams.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: navParams.to || new Date(),
  });
  const limit = 20;

  // Check if navigated from another page with context
  const hasNavigationContext = navParams.source !== undefined;
  const sourcePageLabel = navParams.source === "analytics" ? "Analytics" : 
                          navParams.source === "students" ? "Students" : null;

  // Fetch messages with filters
  const { data, isLoading } = trpc.messages.list.useQuery({
    sentiment: sentimentFilter === "all" ? undefined : sentimentFilter as 'positive' | 'neutral' | 'negative',
    category: categoryFilter === "all" ? undefined : categoryFilter,
    startDate: dateRange.from,
    endDate: dateRange.to,
    limit,
    offset: page * limit,
  });

  // Fetch message detail
  const { data: messageDetail, isLoading: isLoadingDetail } = trpc.messages.getById.useQuery(
    { id: selectedMessage! },
    { enabled: selectedMessage !== null }
  );

  // Fetch conversation history for selected student
  const { data: conversationHistory, isLoading: isLoadingHistory } = trpc.messages.list.useQuery(
    {
      limit: 50,
      offset: 0,
    },
    { enabled: showConversationHistory && messageDetail?.student !== null }
  );

  const messages = data?.messages || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Calculate sentiment counts from messages
  const sentimentCounts = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0, all: total };
    messages.forEach((m) => {
      if (m.sentiment === "positive") counts.positive++;
      else if (m.sentiment === "negative") counts.negative++;
      else counts.neutral++;
    });
    return counts;
  }, [messages, total]);

  // Unique categories from data
  const uniqueCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    messages.forEach((m) => {
      if (m.category) {
        catMap.set(m.category, (catMap.get(m.category) || 0) + 1);
      }
    });
    return Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [messages]);

  // Filter messages by search query, rating, response time
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.query.toLowerCase().includes(query) ||
          (m.response && m.response.toLowerCase().includes(query)) ||
          (m.category && m.category.toLowerCase().includes(query))
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((m) => m.rating === rating);
    }

    // Response time filter
    if (responseTimeFilter !== "all") {
      filtered = filtered.filter((m) => {
        if (!m.responseTimeMs) return false;
        switch (responseTimeFilter) {
          case "instant":
            return m.responseTimeMs < 1000;
          case "fast":
            return m.responseTimeMs >= 1000 && m.responseTimeMs < 3000;
          case "moderate":
            return m.responseTimeMs >= 3000 && m.responseTimeMs < 10000;
          case "slow":
            return m.responseTimeMs >= 10000;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [messages, searchQuery, ratingFilter, responseTimeFilter]);

  // Student's conversation history
  const studentConversations = useMemo(() => {
    if (!conversationHistory || !messageDetail?.student) return [];
    return conversationHistory.messages.filter(
      (m) => m.studentId === messageDetail.message.studentId
    );
  }, [conversationHistory, messageDetail]);

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeFiltersCount = [
    sentimentFilter !== "all",
    categoryFilter !== "all",
    ratingFilter !== "all",
    responseTimeFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSentimentFilter("all");
    setCategoryFilter("all");
    setRatingFilter("all");
    setResponseTimeFilter("all");
    setSearchQuery("");
  };

  const handleExportMessages = () => {
    const headers = ["Date", "Student ID", "Query", "Response", "Sentiment", "Category", "Response Time", "Rating"];
    const rows = filteredMessages.map((m) => [
      formatDate(m.createdAt),
      m.studentId,
      `"${m.query.replace(/"/g, '""')}"`,
      `"${(m.response || "").replace(/"/g, '""')}"`,
      m.sentiment || "neutral",
      m.category || "",
      m.responseTimeMs ? formatResponseTime(m.responseTimeMs) : "",
      m.rating || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Messages exported successfully");
  };

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
              Viewing messages from {formatDateRangeForBreadcrumb(dateRange.from, dateRange.to)}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Messages</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and analyze student conversations with the chatbot
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button variant="outline" className="gap-2" onClick={handleExportMessages}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {/* Filter Boxes - Redesigned with Chips */}
        <div className="space-y-4">
          {/* Sentiment Filter - Horizontal Chips */}
          <NeuCard className="p-5 bg-gradient-to-br from-background via-background to-muted/30">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Sentiment
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSentimentFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  sentimentFilter === "all"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                )}
              >
                <span>All</span>
                <span className="text-xs opacity-75 font-semibold">{total.toLocaleString()}</span>
              </button>
              <button
                onClick={() => setSentimentFilter("positive")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  sentimentFilter === "positive"
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                    : "bg-green-50 dark:bg-green-950/30 text-foreground border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40"
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Positive</span>
                <span className="text-xs opacity-75 font-semibold">{sentimentCounts.positive}</span>
              </button>
              <button
                onClick={() => setSentimentFilter("neutral")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  sentimentFilter === "neutral"
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                    : "bg-amber-50 dark:bg-amber-950/30 text-foreground border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Neutral</span>
                <span className="text-xs opacity-75 font-semibold">{sentimentCounts.neutral}</span>
              </button>
              <button
                onClick={() => setSentimentFilter("negative")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  sentimentFilter === "negative"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                    : "bg-red-50 dark:bg-red-950/30 text-foreground border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                )}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Negative</span>
                <span className="text-xs opacity-75 font-semibold">{sentimentCounts.negative}</span>
              </button>
            </div>
          </NeuCard>

          {/* Category Filter - Horizontal Chips */}
          <NeuCard className="p-5 bg-gradient-to-br from-background via-background to-muted/30">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Folder className="h-5 w-5 text-purple-500" />
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  categoryFilter === "all"
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105"
                    : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                )}
              >
                All Categories
              </button>
              {uniqueCategories.slice(0, 6).map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                    categoryFilter === cat
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105"
                      : "bg-purple-50 dark:bg-purple-950/30 text-foreground border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                  )}
                >
                  <span className="truncate">{cat}</span>
                  <span className="text-xs opacity-75 font-semibold">{count}</span>
                </button>
              ))}
            </div>
          </NeuCard>

          {/* Response Time Filter - Horizontal Chips */}
          <NeuCard className="p-5 bg-gradient-to-br from-background via-background to-muted/30">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Clock className="h-5 w-5 text-emerald-500" />
              Response Time
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setResponseTimeFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  responseTimeFilter === "all"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                    : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                )}
              >
                All Times
              </button>
              <button
                onClick={() => setResponseTimeFilter("instant")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  responseTimeFilter === "instant"
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                    : "bg-green-50 dark:bg-green-950/30 text-foreground border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40"
                )}
              >
                <Zap className="h-4 w-4" />
                <span>Instant</span>
              </button>
              <button
                onClick={() => setResponseTimeFilter("fast")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  responseTimeFilter === "fast"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-blue-50 dark:bg-blue-950/30 text-foreground border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                )}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Fast</span>
              </button>
              <button
                onClick={() => setResponseTimeFilter("moderate")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  responseTimeFilter === "moderate"
                    ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-105"
                    : "bg-yellow-50 dark:bg-yellow-950/30 text-foreground border border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <span>Moderate</span>
              </button>
              <button
                onClick={() => setResponseTimeFilter("slow")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  responseTimeFilter === "slow"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                    : "bg-red-50 dark:bg-red-950/30 text-foreground border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                )}
              >
                <XCircle className="h-4 w-4" />
                <span>Slow</span>
              </button>
            </div>
          </NeuCard>

          {/* Rating Filter - Horizontal Chips */}
          <NeuCard className="p-5 bg-gradient-to-br from-background via-background to-muted/30">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="text-yellow-500">⭐</span>
              Rating
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRatingFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                  ratingFilter === "all"
                    ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-105"
                    : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                )}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(String(rating))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                    ratingFilter === String(rating)
                      ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-105"
                      : "bg-yellow-50 dark:bg-yellow-950/30 text-foreground border border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                  )}
                >
                  <span className="text-yellow-500">{"★".repeat(rating)}</span>
                  <span className="text-gray-400">{"☆".repeat(5 - rating)}</span>
                </button>
              ))}
            </div>
          </NeuCard>
        </div>

        {/* Applied Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Active Filters:</span>
            {sentimentFilter !== "all" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSentimentFilter("all")}
                className="gap-1 h-7"
              >
                Sentiment: {sentimentFilter}
                <X className="h-3 w-3" />
              </Button>
            )}
            {categoryFilter !== "all" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCategoryFilter("all")}
                className="gap-1 h-7"
              >
                Category: {categoryFilter}
                <X className="h-3 w-3" />
              </Button>
            )}
            {ratingFilter !== "all" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRatingFilter("all")}
                className="gap-1 h-7"
              >
                Rating: {ratingFilter} stars
                <X className="h-3 w-3" />
              </Button>
            )}
            {responseTimeFilter !== "all" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setResponseTimeFilter("all")}
                className="gap-1 h-7"
              >
                Response: {responseTimeFilter}
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7">
              Clear All
            </Button>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredMessages.length} of {total.toLocaleString()} messages
          {activeFiltersCount > 0 && " (filtered)"}
        </p>

        {/* Message List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <NeuCard className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No messages found</p>
              <p className="text-muted-foreground">Try adjusting your filters or date range</p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </NeuCard>
          ) : (
            filteredMessages.map((message) => (
              <NeuCard
                key={message.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedMessage(message.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getSentimentIcon(message.sentiment)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </span>
                      {message.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          {message.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{message.query}</p>
                    {message.response && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {message.response}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-shrink-0">
                    {message.responseTimeMs && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatResponseTime(message.responseTimeMs)}</span>
                      </div>
                    )}
                    {message.rating && (
                      <span className="text-yellow-500">
                        {"★".repeat(message.rating)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </NeuCard>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Message Detail Modal - Fixed with internal scrolling */}
      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Sticky Header */}
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              Complete conversation and student context
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : messageDetail ? (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <StudentLink
                        studentId={messageDetail.message.studentId}
                        studentName={messageDetail.student?.name}
                        showIcon={false}
                        context={{
                          fromPage: '/messages',
                          dateRange: dateRange,
                        }}
                        className="text-base"
                      />
                      <p className="text-sm text-muted-foreground">{messageDetail.student?.studentId}</p>
                    </div>
                  </div>
                </div>

                {/* Query */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Student Query</p>
                  <p className="p-4 bg-muted rounded-lg">{messageDetail.message.query}</p>
                </div>

                {/* Response */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bot Response</p>
                  <p className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
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
                        fromPage: '/messages',
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

                {/* Rating */}
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

                {/* Student History Section */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => setShowConversationHistory(!showConversationHistory)}
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Student Conversation History</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-5 w-5 transition-transform",
                      showConversationHistory && "rotate-90"
                    )} />
                  </button>
                  
                  {showConversationHistory && (
                    <div className="border-t p-4">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      ) : studentConversations.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No other conversations found for this student
                        </p>
                      ) : (
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                          {studentConversations.slice(0, 10).map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "border rounded-lg overflow-hidden",
                                msg.id === selectedMessage && "ring-2 ring-primary"
                              )}
                            >
                              {/* Question */}
                              <div className="p-3 bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase">Query</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}
                                  </span>
                                </div>
                                <p className="text-sm">{msg.query}</p>
                              </div>
                              
                              {/* Response */}
                              <div className="p-3 bg-primary/5 border-l-4 border-primary">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Response</span>
                                <p className="text-sm mt-1">{msg.response}</p>
                              </div>
                              
                              {/* Metadata */}
                              <div className="p-2 bg-muted/30 flex items-center gap-4 text-xs flex-wrap">
                                {msg.category && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {msg.category}
                                  </span>
                                )}
                                <span className={cn(
                                  "capitalize",
                                  msg.sentiment === "positive" && "text-green-600",
                                  msg.sentiment === "negative" && "text-red-600"
                                )}>
                                  {msg.sentiment}
                                </span>
                                {msg.responseTimeMs && (
                                  <span className="text-muted-foreground">
                                    {formatResponseTime(msg.responseTimeMs)}
                                  </span>
                                )}
                                {msg.rating && (
                                  <span className="text-yellow-500">
                                    {"★".repeat(msg.rating)}{"☆".repeat(5 - msg.rating)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sticky Footer with Actions */}
          {messageDetail && (
            <div className="p-4 border-t flex-shrink-0 flex items-center justify-between gap-4 bg-background">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMessage(null);
                  navigate(`/students?id=${messageDetail.message.studentId}&from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}&source=messages`);
                }}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Student Profile
              </Button>
              <Button
                onClick={() => {
                  const data = `Message ID: ${messageDetail.message.id}\nStudent: ${messageDetail.student?.name || messageDetail.message.studentId}\nQuery: ${messageDetail.message.query}\nResponse: ${messageDetail.message.response}\nCategory: ${messageDetail.message.category}\nSentiment: ${messageDetail.message.sentiment}\nResponse Time: ${formatResponseTime(messageDetail.message.responseTimeMs || 0)}\nRating: ${messageDetail.message.rating || 'N/A'}\nTimestamp: ${format(new Date(messageDetail.message.createdAt), "PPpp")}`;
                  const blob = new Blob([data], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `message-${messageDetail.message.id}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Message exported successfully");
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
