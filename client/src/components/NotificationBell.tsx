/**
 * Enhanced Notification Bell Component
 * Features:
 * - Real-time notification polling
 * - Pattern detection alerts
 * - Snooze functionality
 * - Notification history
 * - Visual urgency indicators
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Clock,
  History,
  Info,
  Trash2,
  X,
  TrendingDown,
  Activity,
  ThumbsDown,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  studentId: number | null;
  messageId: number | null;
  isRead: boolean;
  isDismissed: boolean;
  snoozeUntil: Date | null;
  createdAt: Date | string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(false);

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } =
    trpc.notifications.list.useQuery(
      { limit: 10, includeRead: true },
      { refetchInterval: 15000 }
    );

  const { data: unreadCount, refetch: refetchCount } =
    trpc.notifications.unreadCount.useQuery(undefined, {
      refetchInterval: 15000,
    });

  const { data: notificationHistory } = trpc.notifications.history.useQuery(
    { limit: 50 },
    { enabled: showHistory }
  );

  // Pattern detection
  const { data: anomalies } = trpc.notifications.detectAnomalies.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );

  // Mutations
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
      toast.success("All notifications marked as read");
    },
  });

  const dismiss = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  const snooze = trpc.notifications.snooze.useMutation({
    onSuccess: (_, variables) => {
      refetchNotifications();
      refetchCount();
      const durationLabels: Record<string, string> = {
        "15min": "15 minutes",
        "1hour": "1 hour",
        "4hours": "4 hours",
        "1day": "1 day",
      };
      toast.success(`Notification snoozed for ${durationLabels[variables.duration]}`);
    },
  });

  const reactivateSnoozed = trpc.notifications.reactivateSnoozed.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  // Check for snoozed notifications to reactivate
  useEffect(() => {
    const interval = setInterval(() => {
      reactivateSnoozed.mutate();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show toast for new critical notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestCritical = notifications.find(
        (n) => n.type === "critical" && !n.isRead
      );
      if (latestCritical) {
        const shownKey = `notification-shown-${latestCritical.id}`;
        if (!sessionStorage.getItem(shownKey)) {
          sessionStorage.setItem(shownKey, "true");
          toast.error(latestCritical.title, {
            description: latestCritical.message,
            duration: 10000,
          });
        }
      }
    }
  }, [notifications]);

  // Show toast for anomalies
  useEffect(() => {
    if (anomalies?.hasAnyAnomaly) {
      const anomalyKey = `anomaly-shown-${Date.now().toString().slice(0, -5)}`;
      if (!sessionStorage.getItem(anomalyKey)) {
        sessionStorage.setItem(anomalyKey, "true");
        if (anomalies.sentiment.hasAnomaly) {
          toast.warning("Sentiment Anomaly Detected", {
            description: `Negative rate: ${anomalies.sentiment.currentNegativeRate}%`,
          });
        }
      }
    }
  }, [anomalies?.hasAnyAnomaly]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBg = (type: string, isRead: boolean) => {
    if (isRead) return "bg-muted/30";
    switch (type) {
      case "critical":
        return "bg-red-50 border-l-2 border-l-red-500";
      case "warning":
        return "bg-amber-50 border-l-2 border-l-amber-500";
      default:
        return "bg-blue-50 border-l-2 border-l-blue-500";
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleDismiss = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    dismiss.mutate({ id });
  };

  const totalAlerts = (unreadCount || 0) + (anomalies?.hasAnyAnomaly ? 1 : 0);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full neu-flat"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <AnimatePresence>
              {totalAlerts > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                >
                  {totalAlerts > 9 ? "9+" : totalAlerts}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 sm:w-96 p-0 max-h-[70vh] overflow-hidden"
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Notifications</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setOpen(false);
                  setShowAnomalies(true);
                }}
              >
                <Activity className="h-3 w-3 mr-1" />
                Alerts
                {anomalies?.hasAnyAnomaly && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setOpen(false);
                  setShowHistory(true);
                }}
              >
                <History className="h-3 w-3 mr-1" />
                History
              </Button>
            </div>
          </div>

          {/* Mark All Read */}
          {unreadCount && unreadCount > 0 && (
            <div className="px-3 py-2 border-b bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary hover:text-primary/80 gap-1"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all as read ({unreadCount})
              </Button>
            </div>
          )}

          {/* Anomaly Alert Banner */}
          {anomalies?.hasAnyAnomaly && (
            <div
              className="p-3 bg-amber-50 border-b border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={() => {
                setOpen(false);
                setShowAnomalies(true);
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Pattern anomalies detected
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                Click to view details and recommendations
              </p>
            </div>
          )}

          {/* Notification List */}
          <ScrollArea className="max-h-[350px]">
            {!notifications || notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 transition-colors hover:bg-muted/50 group",
                      getTypeBg(notification.type, notification.isRead)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              notification.isRead
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => handleDismiss(e, notification.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <Check className="h-3 w-3" />
                              New
                            </span>
                          )}
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-1 mt-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => markAsRead.mutate({ id: notification.id })}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Read
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Snooze
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  snooze.mutate({ id: notification.id, duration: "15min" })
                                }
                              >
                                15 minutes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  snooze.mutate({ id: notification.id, duration: "1hour" })
                                }
                              >
                                1 hour
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  snooze.mutate({ id: notification.id, duration: "4hours" })
                                }
                              >
                                4 hours
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  snooze.mutate({ id: notification.id, duration: "1day" })
                                }
                              >
                                1 day
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Anomaly Details Dialog */}
      <Dialog open={showAnomalies} onOpenChange={setShowAnomalies}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Pattern Detection Alerts
            </DialogTitle>
            <DialogDescription>
              Automated monitoring has detected the following patterns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sentiment Anomaly */}
            <div
              className={`p-4 rounded-lg border ${
                anomalies?.sentiment.hasAnomaly
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="h-4 w-4" />
                <span className="font-medium">Sentiment Analysis</span>
                {anomalies?.sentiment.hasAnomaly ? (
                  <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                    ALERT
                  </span>
                ) : (
                  <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                    NORMAL
                  </span>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>Current negative rate: <strong>{anomalies?.sentiment.currentNegativeRate || 0}%</strong></p>
                <p>30-day average: <strong>{anomalies?.sentiment.averageNegativeRate || 0}%</strong></p>
              </div>
            </div>

            {/* Response Time */}
            <div
              className={`p-4 rounded-lg border ${
                anomalies?.responseTime.hasAnomaly
                  ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Response Time</span>
                {anomalies?.responseTime.hasAnomaly ? (
                  <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded">
                    WARNING
                  </span>
                ) : (
                  <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                    NORMAL
                  </span>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>Current avg: <strong>{anomalies?.responseTime.currentAvgMs || 0}ms</strong></p>
                <p>7-day avg: <strong>{anomalies?.responseTime.historicalAvgMs || 0}ms</strong></p>
              </div>
            </div>

            {/* Satisfaction */}
            <div
              className={`p-4 rounded-lg border ${
                anomalies?.satisfaction.hasDecline
                  ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">Satisfaction Trend</span>
                {anomalies?.satisfaction.hasDecline ? (
                  <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded">
                    DECLINING
                  </span>
                ) : (
                  <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                    STABLE
                  </span>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>This week: <strong>{anomalies?.satisfaction.currentScore || 0}%</strong></p>
                <p>Last week: <strong>{anomalies?.satisfaction.previousScore || 0}%</strong></p>
                <p className="text-xs text-muted-foreground">
                  Change: {anomalies?.satisfaction.changePercent || 0}%
                </p>
              </div>
            </div>

            {/* High Volume Categories */}
            {anomalies?.highVolumeCategories && anomalies.highVolumeCategories.length > 0 && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">High Volume Categories (24h)</span>
                </div>
                <div className="space-y-2">
                  {anomalies.highVolumeCategories.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{cat.count} queries</span>
                        {cat.negativeRate > 20 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            {cat.negativeRate}% negative
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Notification History
            </DialogTitle>
            <DialogDescription>
              View all past notifications including dismissed ones.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {notificationHistory && notificationHistory.length > 0 ? (
              <div className="space-y-2">
                {notificationHistory.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.isDismissed
                        ? "opacity-50 bg-muted/30"
                        : getTypeBg(notification.type, notification.isRead)
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {notification.title}
                          </p>
                          {notification.isDismissed && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              Dismissed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <History className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No notification history</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
