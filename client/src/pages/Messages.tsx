import { DashboardLayout } from "@/components/DashboardLayout";
import { DateRangePicker, DateRange, TimePeriodFilter } from "@/components/DateRangePicker";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatResponseTime } from "@/lib/export-service";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  MessageSquare,
  Phone,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
  History,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Messages() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [responseTimeFilter, setResponseTimeFilter] = useState<string>("all");
  const [timePeriodFilter, setTimePeriodFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const limit = 20;

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
          case "fast":
            return m.responseTimeMs < 1000;
          case "normal":
            return m.responseTimeMs >= 1000 && m.responseTimeMs < 3000;
          case "slow":
            return m.responseTimeMs >= 3000;
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
        return "bg-green-100 text-green-700 border-green-200";
      case "negative":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
    // Export filtered messages as CSV
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Messages</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and analyze student conversations with the chatbot
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="neu-flat border-0 gap-2"
              onClick={handleExportMessages}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Date Range and Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

          <div className="flex gap-2 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neu-flat pl-10 pr-4 py-2 rounded-xl text-sm bg-transparent border-0"
              />
            </div>

            <Button
              variant="outline"
              className={cn(
                "neu-flat border-0 gap-2",
                activeFiltersCount > 0 && "bg-primary/10 text-primary"
              )}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <NeuCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filters</h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Sentiment Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sentiment</label>
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="neu-flat border-0 h-10">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="neu-flat border-0 h-10">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rating</label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="neu-flat border-0 h-10">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Response Time Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Response Time</label>
                <Select value={responseTimeFilter} onValueChange={setResponseTimeFilter}>
                  <SelectTrigger className="neu-flat border-0 h-10">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Times</SelectItem>
                    <SelectItem value="fast">&lt; 1 second</SelectItem>
                    <SelectItem value="normal">1-3 seconds</SelectItem>
                    <SelectItem value="slow">&gt; 3 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Period Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time of Day</label>
                <TimePeriodFilter value={timePeriodFilter} onChange={setTimePeriodFilter} />
              </div>
            </div>
          </NeuCard>
        )}
      </div>

      {/* Messages List */}
      <NeuCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No messages found</p>
            {activeFiltersCount > 0 && (
              <Button variant="link" onClick={clearAllFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message.id)}
                className="p-4 hover:bg-black/5 cursor-pointer transition-colors group touch-manipulation"
                style={{ minHeight: "72px" }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm sm:text-base">
                        Student #{message.studentId}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium border",
                          getSentimentColor(message.sentiment)
                        )}
                      >
                        {message.sentiment || "neutral"}
                      </span>
                      {message.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hidden sm:inline">
                          {message.category}
                        </span>
                      )}
                    </div>

                    <p className="text-foreground line-clamp-2 mb-2 text-sm sm:text-base">
                      {message.query}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(message.createdAt)}
                      </span>
                      {message.responseTimeMs && (
                        <span>{formatResponseTime(message.responseTimeMs)}</span>
                      )}
                      {message.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {message.rating}/5
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {getSentimentIcon(message.sentiment)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-3">
            <span className="text-sm text-muted-foreground">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total} messages
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="neu-flat border-0 h-10"
                style={{ minWidth: "44px" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="neu-flat border-0 h-10"
                style={{ minWidth: "44px" }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </NeuCard>

      {/* Message Detail Dialog */}
      <Dialog open={selectedMessage !== null} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              Full conversation details and student information
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoadingDetail ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : messageDetail ? (
              <div className="space-y-6 pb-4">
                {/* Student Info */}
                {messageDetail.student && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {messageDetail.student.name || `Student #${messageDetail.student.studentId}`}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {messageDetail.student.email || "No phone on file"}
                          {messageDetail.student.department && (
                            <span>• {messageDetail.student.department}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowConversationHistory(true)}
                    >
                      <History className="h-4 w-4" />
                      History
                    </Button>
                  </div>
                )}

                {/* Query */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Student Query</h4>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-foreground">{messageDetail.message.query}</p>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Bot Response</h4>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-foreground whitespace-pre-wrap">{messageDetail.message.response}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase">Sentiment</p>
                    <p className={cn(
                      "font-semibold capitalize",
                      messageDetail.message.sentiment === "positive" ? "text-green-600" :
                      messageDetail.message.sentiment === "negative" ? "text-red-600" : "text-gray-600"
                    )}>
                      {messageDetail.message.sentiment || "Neutral"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase">Category</p>
                    <p className="font-semibold text-foreground">
                      {messageDetail.message.category || "General"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase">Response Time</p>
                    <p className="font-semibold text-foreground">
                      {messageDetail.message.responseTimeMs
                        ? formatResponseTime(messageDetail.message.responseTimeMs)
                        : "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground uppercase">Rating</p>
                    <p className="font-semibold text-foreground flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {messageDetail.message.rating || "-"}/5
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      toast.info("Send message feature", {
                        description: "This would open a messaging interface to contact the student",
                      });
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      // Export single message
                      const data = `Student: ${messageDetail.student?.name || messageDetail.student?.studentId}\nQuery: ${messageDetail.message.query}\nResponse: ${messageDetail.message.response}\nSentiment: ${messageDetail.message.sentiment}\nCategory: ${messageDetail.message.category}\nResponse Time: ${formatResponseTime(messageDetail.message.responseTimeMs || 0)}\nRating: ${messageDetail.message.rating || "-"}/5`;
                      const blob = new Blob([data], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `message-${messageDetail.message.id}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Message exported");
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            ) : null}
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
              All interactions from this student
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoadingHistory ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading history...
              </div>
            ) : conversationHistory && conversationHistory.messages.length > 0 ? (
              <div className="space-y-4">
                {conversationHistory.messages
                  .filter((m) => m.studentId === messageDetail?.message.studentId)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "p-4 rounded-xl border",
                        message.id === selectedMessage
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/30 border-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          getSentimentColor(message.sentiment)
                        )}>
                          {message.sentiment || "neutral"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{message.query}</p>
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
