/**
 * Recent Activity Timeline
 */

import { useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FolderKanban, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProjectWithClient, Client } from "@/types/database.types";

interface ActivityTimelineProps {
  projects: ProjectWithClient[];
  clients: Client[];
}

interface ActivityItem {
  id: string;
  type: "project" | "client";
  action: string;
  title: string;
  timestamp: string;
  link?: string;
}

export function ActivityTimeline({ projects, clients }: ActivityTimelineProps) {
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add recent projects
    projects.slice(0, 5).forEach((project) => {
      items.push({
        id: project.id,
        type: "project",
        action: "created",
        title: project.name,
        timestamp: project.created_at,
        link: `/projects/${project.id}`,
      });
    });

    // Add recent clients
    clients.slice(0, 3).forEach((client) => {
      items.push({
        id: client.id,
        type: "client",
        action: "added",
        title: client.name,
        timestamp: client.created_at,
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 8);
  }, [projects, clients]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      activity.type === "project"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-purple-500/10 text-purple-600"
                    )}
                  >
                    {activity.type === "project" ? (
                      <FolderKanban className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 pb-4">
                  {activity.link ? (
                    <Link
                      to={activity.link}
                      className="font-medium hover:underline"
                    >
                      {activity.title}
                    </Link>
                  ) : (
                    <p className="font-medium">{activity.title}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {activity.type === "project" ? "Project" : "Client"}
                    </Badge>
                    <span>•</span>
                    <span>{activity.action}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
