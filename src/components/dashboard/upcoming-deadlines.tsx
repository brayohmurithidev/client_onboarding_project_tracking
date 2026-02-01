/**
 * Upcoming Deadlines Widget
 */

import { useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProjectWithClient } from "@/types/database.types";

interface UpcomingDeadlinesProps {
  projects: ProjectWithClient[];
}

interface MilestoneDeadline {
  projectId: string;
  projectName: string;
  milestoneTitle: string;
  dueDate: string;
  daysUntil: number;
  isOverdue: boolean;
}

export function UpcomingDeadlines({ projects }: UpcomingDeadlinesProps) {
  const deadlines = useMemo(() => {
    const allDeadlines: MilestoneDeadline[] = [];

    projects.forEach((project) => {
      // For this component, we'd need milestone data
      // Since we don't fetch milestones in the main dashboard,
      // let's use project start dates as placeholders for now
      // In production, you'd fetch milestone data separately
    });

    // Sort by date
    return allDeadlines.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [projects]);

  // For now, show projects with start dates as upcoming items
  const upcomingProjects = useMemo(() => {
    return projects
      .filter((p) => p.start_date && isFuture(new Date(p.start_date)))
      .map((p) => ({
        id: p.id,
        name: p.name,
        date: p.start_date!,
        daysUntil: differenceInDays(new Date(p.start_date!), new Date()),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  }, [projects]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Start Dates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No upcoming project start dates
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingProjects.map((item) => (
              <Link
                key={item.id}
                to={`/projects/${item.id}`}
                className="flex items-start justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.date), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    item.daysUntil <= 7 && "bg-orange-500/10 text-orange-700",
                    item.daysUntil <= 3 && "bg-red-500/10 text-red-700"
                  )}
                >
                  {item.daysUntil === 0
                    ? "Today"
                    : item.daysUntil === 1
                    ? "Tomorrow"
                    : `${item.daysUntil}d`}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
