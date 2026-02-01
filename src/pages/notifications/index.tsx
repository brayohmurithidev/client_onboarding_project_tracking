/**
 * All Notifications Page
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useNotifications } from "@/store/notification.store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  FolderKanban,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Archive,
  TrendingUp,
  Filter,
  MessageSquare,
  AtSign,
  Reply,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import type { NotificationType, Notification } from "@/types/notifications.types";

const notificationIcons: Record<string, React.ReactNode> = {
  project_created: <FolderKanban className="h-5 w-5 text-blue-500" />,
  project_status_changed: <FolderKanban className="h-5 w-5 text-purple-500" />,
  milestone_completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  task_completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  budget_warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  budget_exceeded: <AlertCircle className="h-5 w-5 text-red-500" />,
  deadline_approaching: <TrendingUp className="h-5 w-5 text-orange-500" />,
  project_archived: <Archive className="h-5 w-5 text-gray-500" />,
  project_restored: <Archive className="h-5 w-5 text-blue-500" />,
  new_comment: <MessageSquare className="h-5 w-5 text-blue-500" />,
  comment_mention: <AtSign className="h-5 w-5 text-purple-500" />,
  comment_reply: <Reply className="h-5 w-5 text-green-500" />,
};

export function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [viewMode, setViewMode] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((n) => {
    if (viewMode === "unread" && n.read) return false;
    if (filterType !== "all" && n.type !== filterType) return false;
    return true;
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Stay updated on your projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings/notifications">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "unread")}>
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as NotificationType | "all")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project_status_changed">Status Changes</SelectItem>
                <SelectItem value="milestone_completed">Milestones</SelectItem>
                <SelectItem value="task_completed">Tasks</SelectItem>
                <SelectItem value="budget_warning">Budget Warnings</SelectItem>
                <SelectItem value="budget_exceeded">Budget Exceeded</SelectItem>
                <SelectItem value="deadline_approaching">Deadlines</SelectItem>
                <SelectItem value="project_archived">Archived</SelectItem>
                <SelectItem value="project_restored">Restored</SelectItem>
                <SelectItem value="new_comment">Comments</SelectItem>
                <SelectItem value="comment_mention">Mentions</SelectItem>
                <SelectItem value="comment_reply">Replies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">
              {viewMode === "unread" ? "No unread notifications" : "No notifications"}
            </h3>
            <p className="text-center text-muted-foreground">
              {viewMode === "unread"
                ? "You're all caught up!"
                : "You'll see notifications here when there's activity"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors hover:bg-muted/50",
                !notification.read && "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="mt-1 flex-shrink-0">
                    {notificationIcons[notification.type] || <Bell className="h-5 w-5 text-gray-500" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="default" className="h-5 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                      <span>•</span>
                      <span>{format(new Date(notification.created_at), "MMM d, h:mm a")}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {notification.link && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <Link to={notification.link}>View</Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results info */}
      {filteredNotifications.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </p>
      )}
    </div>
  );
}
