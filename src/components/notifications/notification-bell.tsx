/**
 * Notification Bell Component
 */

import { useState } from "react";
import { Link } from "react-router";
import { useNotifications } from "@/store/notification.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  FolderKanban,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Archive,
  TrendingUp,
  MessageSquare,
  AtSign,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@/types/notifications.types";

const notificationIcons: Record<string, React.ReactNode> = {
  project_created: <FolderKanban className="h-4 w-4 text-blue-500" />,
  project_status_changed: <FolderKanban className="h-4 w-4 text-purple-500" />,
  milestone_completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  task_completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  budget_warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  budget_exceeded: <AlertCircle className="h-4 w-4 text-red-500" />,
  deadline_approaching: <TrendingUp className="h-4 w-4 text-orange-500" />,
  project_archived: <Archive className="h-4 w-4 text-gray-500" />,
  project_restored: <Archive className="h-4 w-4 text-blue-500" />,
  new_comment: <MessageSquare className="h-4 w-4 text-blue-500" />,
  comment_mention: <AtSign className="h-4 w-4 text-purple-500" />,
  comment_reply: <Reply className="h-4 w-4 text-green-500" />,
};

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  const handleNotificationClick = async (id: string, link: string | null) => {
    await markAsRead(id);
    setOpen(false);
    
    if (link) {
      // Navigation will be handled by Link component
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto p-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-auto p-1"
              title="Notification settings"
            >
              <Link to="/settings/notifications" onClick={() => setOpen(false)}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative px-4 py-3 transition-colors hover:bg-muted/50",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  {notification.link ? (
                    <Link
                      to={notification.link}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                      className="block"
                    >
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : (
                    <div onClick={() => markAsRead(notification.id)}>
                      <NotificationContent notification={notification} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="h-6 w-6 p-0"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="h-6 w-6 p-0"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link to="/notifications" onClick={() => setOpen(false)}>
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({ notification }: { notification: any }) {
  const icon = notificationIcons[notification.type] || <Bell className="h-4 w-4 text-gray-500" />;
  
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex-shrink-0">{icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{notification.title}</p>
          {!notification.read && (
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
