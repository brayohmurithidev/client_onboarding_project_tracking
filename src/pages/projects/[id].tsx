/**
 * Project Detail Page
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useProjects } from "@/store/project.store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { TagManager } from "@/components/project/tag-manager";
import { BudgetTracker } from "@/components/project/budget-tracker";
import { ArchiveButton } from "@/components/project/archive-button";
import { SaveAsTemplateButton } from "@/components/project/save-as-template-button";
import { ProjectLinks } from "@/components/project/project-links";
import { ProjectAttachments } from "@/components/project/project-attachments";
import { CommentSection } from "@/components/comments/comment-section";
import { ProjectTimeTracker } from "@/components/time-tracking/project-time-tracker";
import { TaskAssigneeSelector } from "@/components/team/task-assignee-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProjectDetail,
  Milestone,
  Task,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  Tag,
} from "@/types/database.types";
import { format } from "date-fns";

const statusColors = {
  onboarding: "bg-blue-500/10 text-blue-700",
  active: "bg-green-500/10 text-green-700",
  blocked: "bg-red-500/10 text-red-700",
  completed: "bg-gray-500/10 text-gray-700",
  maintenance: "bg-yellow-500/10 text-yellow-700",
};

const milestoneStatusColors: Record<MilestoneStatus, string> = {
  pending: "text-gray-500",
  in_progress: "text-blue-500",
  review: "text-yellow-500",
  approved: "text-green-500",
};

const taskPriorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-500/10 text-gray-700",
  medium: "bg-blue-500/10 text-blue-700",
  high: "bg-orange-500/10 text-orange-700",
  urgent: "bg-red-500/10 text-red-700",
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchProjectDetail } = useProjects();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [projectTags, setProjectTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchProjectDetail(id);
      setProject(data);
      
      // Fetch project tags
      const { data: tagsData } = await supabase
        .from("project_tags")
        .select("tag_id, tags(*)")
        .eq("project_id", id);
      
      if (tagsData) {
        setProjectTags(tagsData.map((pt: any) => pt.tags).filter(Boolean));
      }
    } catch {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="md:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">Project not found</h3>
          <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back to Projects</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
          {project.description ? (
            <div 
              className="prose prose-sm max-w-none text-sm text-muted-foreground sm:text-base"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground sm:text-base">No description</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <Badge className={cn(statusColors[project.status], "self-start")}>{project.status}</Badge>
          <div className="flex gap-2">
            <SaveAsTemplateButton project={project} />
            <ArchiveButton 
              projectId={project.id} 
              archived={project.archived} 
              onUpdate={loadProject}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client Info */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Name</p>
                <p className="text-sm font-semibold sm:text-base">{project.client.name}</p>
              </div>
              {project.client.company && (
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Company</p>
                    <p className="truncate text-xs sm:text-sm">{project.client.company}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">Email</p>
                  <a
                    href={`mailto:${project.client.email}`}
                    className="truncate text-xs text-primary hover:underline sm:text-sm"
                  >
                    {project.client.email}
                  </a>
                </div>
              </div>
              {project.client.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Phone</p>
                    <a
                      href={`tel:${project.client.phone}`}
                      className="text-xs text-primary hover:underline sm:text-sm"
                    >
                      {project.client.phone}
                    </a>
                  </div>
                </div>
              )}
              {project.start_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Start Date</p>
                    <p className="text-xs sm:text-sm">{format(new Date(project.start_date), "MMM d, yyyy")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <TagManager 
                projectId={project.id} 
                selectedTags={projectTags}
                onTagsChange={loadProject}
              />
            </CardContent>
          </Card>

          {/* Budget */}
          <BudgetTracker
            projectId={project.id}
            budget={project.budget}
            spent={project.spent}
            currency={project.currency}
            onUpdate={loadProject}
          />

          {/* Project Links */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Project Links</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ProjectLinks projectId={project.id} />
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Files & Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ProjectAttachments projectId={project.id} />
            </CardContent>
          </Card>
        </div>

        {/* Milestones & Tasks */}
        <Card className="md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base sm:text-lg">Milestones & Tasks</CardTitle>
              <CreateMilestoneDialog projectId={project.id} onSuccess={loadProject} />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {project.milestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                <h3 className="mb-2 text-base font-semibold sm:text-lg">No milestones yet</h3>
                <p className="mb-3 text-center text-xs text-muted-foreground sm:mb-4 sm:text-sm">
                  Add milestones to track project progress
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {project.milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onUpdate={loadProject}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card className="md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ProjectTimeTracker 
              projectId={project.id} 
              tasks={project.milestones.flatMap(m => m.tasks)}
              onUpdate={loadProject}
            />
          </CardContent>
        </Card>

        {/* Comments & Discussion */}
        <Card className="md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Comments & Discussion</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <CommentSection targetType="project" targetId={project.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Milestone Card Component
function MilestoneCard({
  milestone,
  onUpdate,
}: {
  milestone: Milestone & { tasks: Task[] };
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const getStatusIcon = (status: MilestoneStatus) => {
    if (status === "approved") return <CheckCircle2 className="h-5 w-5" />;
    if (status === "in_progress") return <Circle className="h-5 w-5" />;
    return <Circle className="h-5 w-5" />;
  };

  const updateMilestoneStatus = async (newStatus: MilestoneStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("milestones")
        .update({ status: newStatus })
        .eq("id", milestone.id);

      if (error) throw error;
      toast.success("Milestone status updated");
      onUpdate();
    } catch {
      toast.error("Failed to update milestone");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className={cn("mt-0.5 flex-shrink-0", milestoneStatusColors[milestone.status])}>
            {getStatusIcon(milestone.status)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold sm:text-base">{milestone.title}</h4>
              <Select
                value={milestone.status}
                onValueChange={(value) => updateMilestoneStatus(value as MilestoneStatus)}
                disabled={updating}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {milestone.description && (
              <div 
                className="prose prose-sm max-w-none text-xs text-muted-foreground sm:text-sm"
                dangerouslySetInnerHTML={{ __html: milestone.description }}
              />
            )}
            {milestone.due_date && (
              <p className="mt-1 text-xs text-muted-foreground">
                Due: {format(new Date(milestone.due_date), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
        <CreateTaskDialog milestoneId={milestone.id} onSuccess={onUpdate} />
      </div>

      {milestone.tasks.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 pl-3 sm:ml-8 sm:pl-4">
          {milestone.tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={onUpdate} projectId={milestone.project_id} />
          ))}
        </div>
      )}
    </div>
  );
}

// Task Item Component
function TaskItem({ task, onUpdate, projectId }: { task: Task; onUpdate: () => void; projectId: string }) {
  const [updating, setUpdating] = useState(false);

  const toggleTaskStatus = async () => {
    setUpdating(true);
    try {
      const newStatus: TaskStatus =
        task.status === "completed" ? "pending" : "completed";
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Task updated");
      onUpdate();
    } catch {
      toast.error("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded border p-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          onClick={toggleTaskStatus}
          disabled={updating}
          className="flex-shrink-0 text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
          ) : (
            <Circle className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </button>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-xs sm:text-sm",
            task.status === "completed" && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <TaskAssigneeSelector taskId={task.id} projectId={projectId} onUpdate={onUpdate} />
        <Badge variant="secondary" className={cn(taskPriorityColors[task.priority], "text-xs")}>
          {task.priority}
        </Badge>
      </div>
    </div>
  );
}

// Create Milestone Dialog
function CreateMilestoneDialog({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "pending" as MilestoneStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("milestones").insert({
        project_id: projectId,
        ...formData,
      });

      if (error) throw error;
      toast.success("Milestone created");
      setOpen(false);
      setFormData({ title: "", description: "", due_date: "", status: "pending" });
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create milestone";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Milestone</DialogTitle>
          <DialogDescription>Add a new milestone to track project progress</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Title *</Label>
            <Input
              id="milestone-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-description">Description</Label>
            <WysiwygEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe this milestone..."
              disabled={loading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="milestone-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as MilestoneStatus })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-due">Due Date</Label>
              <Input
                id="milestone-due"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Task Dialog
function CreateTaskDialog({
  milestoneId,
  onSuccess,
}: {
  milestoneId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    status: "pending" as TaskStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        milestone_id: milestoneId,
        ...formData,
      });

      if (error) throw error;
      toast.success("Task created");
      setOpen(false);
      setFormData({ title: "", description: "", priority: "medium", status: "pending" });
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-3 w-3" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new task to this milestone</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <WysiwygEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe this task..."
              disabled={loading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value as TaskPriority })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as TaskStatus })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
