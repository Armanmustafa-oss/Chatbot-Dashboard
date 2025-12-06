import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { NeuCard } from "@/components/NeuCard";
import { StudentLink, CategoryLink } from "@/components/StudentLink";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Filter,
  History,
  MessageSquare,
  Phone,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
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
  const [timePeriodFilter, setTimePeriodFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
  const { data, isLoading, refetch } = trpc.messages.list.useQuery({
    sentiment: sentimentFilter === "all" ? undefined : sentimentFilter as 'positive' | 'neutral' | 'negative',
    category: categoryFilter === "all" ? undefined : categoryFilter,
    startDate: dateRange.from,
    endDate: dateRange.to,
    limit,
    offset: page * limit,
  });

  // Fetch categories for filter dropdown
  const { data: categories } = trpc.analytics.getTopQueries.useQuery({ limit: 50 });

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

  // Filter messages by search query, rating, response time, and time period
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
          case "under2s":
            return m.responseTimeMs < 2000;
          case "2to5s":
            return m.responseTimeMs >= 2000 && m.responseTimeMs < 5000;
          case "5to10s":
            return m.responseTimeMs >= 5000 && m.responseTimeMs < 10000;
          case "over10s":
            return m.responseTimeMs >= 10000;
          default:
            return true;
        }
      });
    }

    // Time period filter
    if (timePeriodFilter) {
      filtered = filtered.filter((m) => {
        const hour = new Date(m.createdAt).getHours();
        switch (timePeriodFilter) {
          case "morning":
            return hour >= 6 && hour < 12;
          case "afternoon":
            return hour >= 12 && hour < 18;
          case "evening":
            return hour >= 18 && hour < 24;
          case "overnight":
            return hour >= 0 && hour < 6;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [messages, searchQuery, ratingFilter, responseTimeFilter, timePeriodFilter]);

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

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "negative":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
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
    timePeriodFilter !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSentimentFilter("all");
    setCategoryFilter("all");
    setRatingFilter("all");
    setResponseTimeFilter("all");
    setTimePeriodFilter(null);
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

  // Unique categories from data
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    messages.forEach((m) => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats).sort();
  }, [messages]);

  // Filter sidebar component
  const FilterSidebar = ({ className }: { className?: string }) => (
    <div className={cn("space-y-6", className)}>
      {/* Search */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* Sentiment Filter */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">Sentiment</label>
        <div className="space-y-2">
          {[
            { value: "all", label: "All Sentiments", icon: null },
            { value: "positive", label: "Positive", icon: <ThumbsUp className="h-4 w-4 text-green-500" /> },
            { value: "neutral", label: "Neutral", icon: <MessageSquare className="h-4 w-4 text-gray-400" /> },
            { value: "negative", label: "Negative", icon: <ThumbsDown className="h-4 w-4 text-red-500" /> },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSentimentFilter(option.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                sentimentFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Category Filter */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">Category</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            All Categories
          </button>
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Response Time Filter */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">Response Time</label>
        <div className="space-y-2">
          {[
            { value: "all", label: "All Times" },
            { value: "under2s", label: "Under 2 seconds" },
            { value: "2to5s", label: "2-5 seconds" },
            { value: "5to10s", label: "5-10 seconds" },
            { value: "over10s", label: "Over 10 seconds" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setResponseTimeFilter(option.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                responseTimeFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Time Period Filter */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">Time of Day</label>
        <div className="space-y-2">
          {[
            { value: null, label: "Any Time" },
            { value: "morning", label: "Morning (6am-12pm)" },
            { value: "afternoon", label: "Afternoon (12pm-6pm)" },
            { value: "evening", label: "Evening (6pm-12am)" },
            { value: "overnight", label: "Overnight (12am-6am)" },
          ].map((option) => (
            <button
              key={option.value || "any"}
              onClick={() => setTimePeriodFilter(option.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                timePeriodFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-3 block">Rating</label>
        <div className="space-y-2">
          <button
            onClick={() => setRatingFilter("all")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              ratingFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(String(rating))}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                ratingFilter === String(rating)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <span className="text-yellow-500">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Permanent Filter Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <NeuCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <FilterSidebar />
            </NeuCard>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-4">
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
                View and analyze student conversations
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden gap-2"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

              <Button variant="outline" className="gap-2" onClick={handleExportMessages}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
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
              {timePeriodFilter && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTimePeriodFilter(null)}
                  className="gap-1 h-7"
                >
                  Time: {timePeriodFilter}
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
                      <div className="flex items-center gap-2 mb-2">
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
        </main>
      </div>

      {/* Mobile Filters Dialog */}
      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <FilterSidebar />
          </ScrollArea>
          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => setMobileFiltersOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Detail Modal */}
      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              Complete conversation and student context
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : messageDetail ? (
            <ScrollArea className="flex-1 pr-4">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMessage(null);
                      navigate(`/students?id=${messageDetail.message.studentId}&from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}&source=messages`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
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
                        <div className="space-y-4">
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
                                  <CategoryLink
                                    category={msg.category}
                                    context={{ fromPage: "/messages", dateRange }}
                                  />
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
                          
                          {studentConversations.length > 10 && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setSelectedMessage(null);
                                navigate(`/students?id=${messageDetail.message.studentId}&source=messages`);
                              }}
                            >
                              View Complete Student Profile
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
