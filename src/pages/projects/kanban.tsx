/**
 * Kanban Board View for Projects
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useProjects } from "@/store/project.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderKanban, Plus, Building2, DollarSign, List, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { ProjectStatus, ProjectWithClient } from "@/types/database.types";
import { toast } from "sonner";

const statusColumns: Array<{ status: ProjectStatus; label: string; color: string }> = [
  { status: "onboarding", label: "Onboarding", color: "border-blue-500" },
  { status: "active", label: "Active", color: "border-green-500" },
  { status: "blocked", label: "Blocked", color: "border-red-500" },
  { status: "maintenance", label: "Maintenance", color: "border-yellow-500" },
  { status: "completed", label: "Completed", color: "border-gray-500" },
];

export function KanbanPage() {
  const { projects, loading, fetchProjects, updateProjectStatus } = useProjects();
  const navigate = useNavigate();
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDragStart = (projectId: string) => {
    setDraggedProject(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: ProjectStatus) => {
    if (!draggedProject) return;

    const project = projects.find((p) => p.id === draggedProject);
    if (!project) return;

    if (project.status === status) {
      setDraggedProject(null);
      return;
    }

    try {
      await updateProjectStatus(draggedProject, status);
      toast.success(`Moved to ${status}`);
    } catch {
      toast.error("Failed to update project");
    } finally {
      setDraggedProject(null);
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter((p) => p.status === status && !p.archived);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[600px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="kanban" className="hidden sm:block">
            <TabsList>
              <TabsTrigger value="list" asChild>
                <Link to="/projects">
                  <List className="mr-2 h-4 w-4" />
                  List
                </Link>
              </TabsTrigger>
              <TabsTrigger value="kanban" asChild>
                <Link to="/projects/kanban">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Kanban
                </Link>
              </TabsTrigger>
              <TabsTrigger value="calendar" asChild>
                <Link to="/projects/calendar">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Calendar
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statusColumns.map((column) => (
          <div
            key={column.status}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.status)}
          >
            {/* Column Header */}
            <div
              className={cn(
                "mb-3 rounded-lg border-2 border-l-4 bg-muted/50 p-3",
                column.color
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{column.label}</h2>
                <Badge variant="secondary">
                  {getProjectsByStatus(column.status).length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {getProjectsByStatus(column.status).length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                  No projects
                </div>
              ) : (
                getProjectsByStatus(column.status).map((project) => (
                  <KanbanCard
                    key={project.id}
                    project={project}
                    onDragStart={handleDragStart}
                    isDragging={draggedProject === project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Kanban Card Component
interface KanbanCardProps {
  project: ProjectWithClient;
  onDragStart: (id: string) => void;
  isDragging: boolean;
  onClick: () => void;
}

function KanbanCard({ project, onDragStart, isDragging, onClick }: KanbanCardProps) {
  const budgetPercentage = project.budget && project.spent
    ? (project.spent / project.budget) * 100
    : 0;

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      KSH: "KSh",
      USD: "$",
      EUR: "€",
    };
    return symbols[currency] || "$";
  };

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(project.id)}
      onClick={onClick}
      className={cn(
        "cursor-move transition-all hover:shadow-md",
        isDragging && "opacity-50"
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Project Name */}
          <div>
            <h3 className="font-semibold leading-tight">{project.name}</h3>
            {project.description && (
              <div
                className="prose prose-sm mt-1 line-clamp-2 max-w-none text-xs text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{project.client.name}</span>
          </div>

          {/* Budget */}
          {project.budget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Budget
                </span>
                <span
                  className={cn(
                    "font-medium",
                    budgetPercentage > 100 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {budgetPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    budgetPercentage > 100 ? "bg-red-500" : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  className="border-0 text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
              {project.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
