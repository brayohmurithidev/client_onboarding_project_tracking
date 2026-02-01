/**
 * My Tasks Page
 * View all tasks assigned to the current user
 */

import { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AssignedTask {
  task_id: string;
  task_title: string;
  task_status: string;
  task_priority: string;
  milestone_id: string;
  milestone_title: string;
  project_id: string;
  project_name: string;
  project_status: string;
  due_date: string | null;
  assigned_at: string;
}

const priorityColors = {
  low: "bg-gray-500/10 text-gray-700",
  medium: "bg-blue-500/10 text-blue-700",
  high: "bg-orange-500/10 text-orange-700",
  urgent: "bg-red-500/10 text-red-700",
};

const statusColors = {
  pending: "text-gray-500",
  in_progress: "text-blue-500",
  review: "text-yellow-500",
  completed: "text-green-500",
};

export function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      const { data, error } = await supabase.rpc("get_my_assigned_tasks");

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task updated");
      fetchMyTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.task_status !== filterStatus) return false;
    if (filterPriority !== "all" && task.task_priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.task_status === "completed").length,
    inProgress: tasks.filter((t) => t.task_status === "in_progress").length,
    pending: tasks.filter((t) => t.task_status === "pending").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Tasks</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          All tasks assigned to you across projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {(filterStatus !== "all" || filterPriority !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setFilterPriority("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">
              {tasks.length === 0 ? "No tasks assigned" : "No tasks match filters"}
            </h3>
            <p className="text-center text-muted-foreground">
              {tasks.length === 0
                ? "You'll see tasks here when they're assigned to you"
                : "Try adjusting your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.task_id}
              task={task}
              onToggle={toggleTaskStatus}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredTasks.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      )}
    </div>
  );
}

// Task Card
function TaskCard({
  task,
  onToggle,
}: {
  task: AssignedTask;
  onToggle: (taskId: string, status: string) => void;
}) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <button
              onClick={() => onToggle(task.task_id, task.task_status)}
              className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary"
            >
              {task.task_status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>

            <div className="flex-1 space-y-2">
              <div>
                <h3
                  className={cn(
                    "font-medium",
                    task.task_status === "completed" && "text-muted-foreground line-through"
                  )}
                >
                  {task.task_title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className={priorityColors[task.task_priority as keyof typeof priorityColors]}>
                    {task.task_priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {task.milestone_title}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-4 w-4" />
                  <span>{task.project_name}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Due {format(new Date(task.due_date), "MMM d")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link to={`/projects/${task.project_id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
