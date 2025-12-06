import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Info,
  MessageSquare,
  X,
  XCircle,
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
  createdAt: Date | string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } =
    trpc.notifications.list.useQuery(
      { limit: 10, includeRead: true },
      {
        refetchInterval: 30000, // Poll every 30 seconds
      }
    );

  // Fetch unread count
  const { data: unreadCount, refetch: refetchCount } =
    trpc.notifications.unreadCount.useQuery(undefined, {
      refetchInterval: 15000, // Poll every 15 seconds
    });

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
      toast.success("All notifications marked as read");
    },
  });

  const dismissMutation = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  // Show toast for new critical notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestCritical = notifications.find(
        (n) => n.type === "critical" && !n.isRead
      );
      if (latestCritical) {
        // Check if we haven't shown this notification yet
        const shownKey = `notification-shown-${latestCritical.id}`;
        if (!sessionStorage.getItem(shownKey)) {
          sessionStorage.setItem(shownKey, "true");
          toast.error(latestCritical.title, {
            description: latestCritical.message,
            duration: 10000,
            action: {
              label: "View",
              onClick: () => {
                setOpen(true);
                markAsReadMutation.mutate({ id: latestCritical.id });
              },
            },
          });
        }
      }
    }
  }, [notifications]);

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBg = (type: Notification["type"], isRead: boolean) => {
    if (isRead) return "bg-muted/30";
    switch (type) {
      case "critical":
        return "bg-red-50 border-l-2 border-l-red-500";
      case "warning":
        return "bg-amber-50 border-l-2 border-l-amber-500";
      case "info":
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
    // Could navigate to related message or student here
    if (notification.messageId) {
      toast.info("Navigating to message...", {
        description: "Feature coming soon",
      });
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    dismissMutation.mutate({ id });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full neu-flat"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-0 max-h-[70vh] overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount && unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/80 gap-1"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 cursor-pointer transition-colors hover:bg-muted/50 group",
                    getTypeBg(notification.type, notification.isRead)
                  )}
                  onClick={() => handleNotificationClick(notification)}
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
                          aria-label="Dismiss notification"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                      <p
                        className={cn(
                          "text-xs mt-0.5 line-clamp-2",
                          notification.isRead
                            ? "text-muted-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatTime(notification.createdAt)}
                        </span>
                        {notification.messageId && (
                          <span className="flex items-center gap-1 text-[10px] text-primary/70">
                            <MessageSquare className="h-3 w-3" />
                            View message
                          </span>
                        )}
                        {!notification.isRead && (
                          <span className="flex items-center gap-1 text-[10px] text-green-600">
                            <Check className="h-3 w-3" />
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setOpen(false);
                toast.info("View all notifications", {
                  description: "Feature coming soon",
                });
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
