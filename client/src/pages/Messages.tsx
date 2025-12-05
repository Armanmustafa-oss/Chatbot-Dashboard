import { DashboardLayout } from "@/components/DashboardLayout";
import { NeuCard } from "@/components/NeuCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { useState } from "react";

export default function Messages() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = trpc.messages.list.useQuery({
    sentiment: sentimentFilter === "all" ? undefined : sentimentFilter as 'positive' | 'neutral' | 'negative',
    limit,
    offset: page * limit,
  });

  const { data: messageDetail, isLoading: isLoadingDetail } = trpc.messages.getById.useQuery(
    { id: selectedMessage! },
    { enabled: selectedMessage !== null }
  );

  const messages = data?.messages || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze student conversations with the chatbot
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search messages..."
              className="neu-flat pl-10 pr-4 py-2 rounded-xl text-sm w-64 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="neu-flat w-40 border-0">
              <SelectValue placeholder="Filter by sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages List */}
      <NeuCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No messages found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message.id)}
                className="p-4 hover:bg-black/5 cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
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
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {message.category}
                        </span>
                      )}
                    </div>

                    <p className="text-foreground line-clamp-2 mb-2">
                      {message.query}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(message.createdAt)}
                      </span>
                      {message.responseTimeMs && (
                        <span>Response: {message.responseTimeMs}ms</span>
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
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total} messages
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="neu-flat border-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="neu-flat border-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </NeuCard>

      {/* Message Detail Dialog */}
      <Dialog open={selectedMessage !== null} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : messageDetail ? (
            <div className="space-y-6">
              {/* Student Info */}
              {messageDetail.student && (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {messageDetail.student.name || `Student #${messageDetail.student.studentId}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {messageDetail.student.email} • {messageDetail.student.department}
                    </p>
                  </div>
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
                  <p className="text-foreground">{messageDetail.message.response}</p>
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
                    {messageDetail.message.responseTimeMs}ms
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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
