/**
 * Project Time Tracker Component
 * Display time entries and start/stop timer for projects
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Clock,
  Play,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Timer as TimerIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  project_id: string;
  project_name: string;
  task_id: string | null;
  task_title: string | null;
  entry_type: "manual" | "timer";
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  duration_hours: number;
  description: string | null;
  billable: boolean;
  hourly_rate: number | null;
  amount: number;
  is_running: boolean;
  created_at: string;
}

interface ProjectTimeTrackerProps {
  projectId: string;
  tasks?: Array<{ id: string; title: string }>;
  onUpdate?: () => void;
}

export function ProjectTimeTracker({ projectId, tasks = [], onUpdate }: ProjectTimeTrackerProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [billableHours, setBillableHours] = useState(0);
  const [billableAmount, setBillableAmount] = useState(0);
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null);

  useEffect(() => {
    fetchTimeEntries();
    fetchTimeSummary();
  }, [projectId]);

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase.rpc("get_time_entries_with_details", {
        p_project_id: projectId,
        p_start_date: null,
        p_end_date: null,
      });

      if (error) throw error;

      setEntries(data || []);
      
      // Check if there's a running timer
      const running = data?.find((e: TimeEntry) => e.is_running);
      setRunningTimer(running || null);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSummary = async () => {
    try {
      // Get total hours
      const { data: totalData } = await supabase.rpc("get_project_total_hours", {
        p_project_id: projectId,
      });

      // Get billable hours
      const { data: billableData } = await supabase.rpc("get_project_billable_hours", {
        p_project_id: projectId,
      });

      // Get billable amount
      const { data: amountData } = await supabase.rpc("get_project_billable_amount", {
        p_project_id: projectId,
      });

      setTotalHours(totalData || 0);
      setBillableHours(billableData || 0);
      setBillableAmount(amountData || 0);
    } catch (error) {
      console.error("Error fetching time summary:", error);
    }
  };

  const startTimer = async (taskId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        project_id: projectId,
        task_id: taskId || null,
        entry_type: "timer",
        start_time: new Date().toISOString(),
        is_running: true,
      });

      if (error) throw error;

      toast.success("Timer started");
      fetchTimeEntries();
      onUpdate?.();
    } catch (error) {
      console.error("Error starting timer:", error);
      toast.error("Failed to start timer");
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      toast.success("Time entry deleted");
      fetchTimeEntries();
      fetchTimeSummary();
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Total Hours</span>
            </div>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Billable Hours</span>
            </div>
            <p className="text-2xl font-bold">{billableHours.toFixed(1)}h</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Total Amount</span>
            </div>
            <p className="text-2xl font-bold">${billableAmount.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Time Entries</h3>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>
        <div className="flex gap-2">
          {!runningTimer && (
            <StartTimerDialog projectId={projectId} tasks={tasks} onStart={fetchTimeEntries} />
          )}
          <AddManualEntryDialog
            projectId={projectId}
            tasks={tasks}
            onSuccess={() => {
              fetchTimeEntries();
              fetchTimeSummary();
              onUpdate?.();
            }}
          />
        </div>
      </div>

      {/* Time Entries List */}
      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">No time tracked yet</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Start a timer or add a manual entry
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <TimeEntryItem key={entry.id} entry={entry} onDelete={deleteEntry} />
          ))}
        </div>
      )}
    </div>
  );
}

// Time Entry Item
function TimeEntryItem({
  entry,
  onDelete,
}: {
  entry: TimeEntry;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={entry.is_running ? "default" : "outline"} className="text-xs">
              {entry.is_running ? (
                <>
                  <Play className="mr-1 h-3 w-3" />
                  Running
                </>
              ) : (
                <>
                  <Clock className="mr-1 h-3 w-3" />
                  {entry.entry_type === "timer" ? "Timer" : "Manual"}
                </>
              )}
            </Badge>
            {entry.billable && (
              <Badge variant="secondary" className="text-xs">
                <DollarSign className="mr-1 h-3 w-3" />
                Billable
              </Badge>
            )}
          </div>

          {entry.task_title && (
            <p className="text-sm font-medium">{entry.task_title}</p>
          )}

          {entry.description && (
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{format(new Date(entry.start_time), "MMM d, h:mm a")}</span>
            {entry.end_time && (
              <>
                <span>→</span>
                <span>{format(new Date(entry.end_time), "h:mm a")}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="font-mono text-lg font-bold">
              {entry.duration_hours?.toFixed(1) || "0.0"}h
            </p>
            {entry.billable && entry.hourly_rate && (
              <p className="text-xs text-muted-foreground">
                ${entry.amount?.toFixed(2) || "0.00"}
              </p>
            )}
          </div>

          {!entry.is_running && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entry.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Start Timer Dialog
function StartTimerDialog({
  projectId,
  tasks,
  onStart,
}: {
  projectId: string;
  tasks: Array<{ id: string; title: string }>;
  onStart: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string>("");
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!user) return;

    setStarting(true);
    try {
      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        project_id: projectId,
        task_id: taskId || null,
        entry_type: "timer",
        start_time: new Date().toISOString(),
        is_running: true,
      });

      if (error) throw error;

      toast.success("Timer started");
      setOpen(false);
      onStart();
    } catch (error) {
      console.error("Error starting timer:", error);
      toast.error("Failed to start timer");
    } finally {
      setStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Play className="mr-2 h-4 w-4" />
          Start Timer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Timer</DialogTitle>
          <DialogDescription>Start tracking time for this project</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {tasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task">Task (Optional)</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={starting}>
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={starting}>
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Manual Entry Dialog
function AddManualEntryDialog({
  projectId,
  tasks,
  onSuccess,
}: {
  projectId: string;
  tasks: Array<{ id: string; title: string }>;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    task_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    duration_hours: "",
    description: "",
    billable: true,
    hourly_rate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`);
      const durationHours = parseFloat(formData.duration_hours);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        project_id: projectId,
        task_id: formData.task_id || null,
        entry_type: "manual",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        description: formData.description || null,
        billable: formData.billable,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      });

      if (error) throw error;

      toast.success("Time entry added");
      setOpen(false);
      setFormData({
        task_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        duration_hours: "",
        description: "",
        billable: true,
        hourly_rate: "",
      });
      onSuccess();
    } catch (error) {
      console.error("Error adding time entry:", error);
      toast.error("Failed to add time entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Time
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Time Entry</DialogTitle>
          <DialogDescription>Record time spent on this project</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="manual-task">Task (Optional)</Label>
              <Select
                value={formData.task_id}
                onValueChange={(value) => setFormData({ ...formData, task_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
              placeholder="2.5"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Use decimals (e.g., 1.5 for 1 hour 30 minutes)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you work on?"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="billable">Billable</Label>
              <p className="text-xs text-muted-foreground">
                Include in client billing
              </p>
            </div>
            <Switch
              id="billable"
              checked={formData.billable}
              onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
            />
          </div>

          {formData.billable && (
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (Optional)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="75.00"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use project default rate
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
