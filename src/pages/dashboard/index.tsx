/**
 * Dashboard Page
 */

import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useProjects } from "@/store/project.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import {
  FolderKanban,
  Users,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database.types";
import { format } from "date-fns";

const statusColors: Record<ProjectStatus, string> = {
  onboarding: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
  active: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
  blocked: "bg-red-500/10 text-red-700 hover:bg-red-500/20",
  completed: "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20",
  maintenance: "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20",
};

export function DashboardPage() {
  const { projects, clients, loading, fetchProjects, fetchClients } = useProjects();

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [fetchProjects, fetchClients]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const blockedProjects = projects.filter((p) => p.status === "blocked").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;

    return {
      totalProjects: projects.length,
      activeProjects,
      blockedProjects,
      completedProjects,
      totalClients: clients.length,
    };
  }, [projects, clients]);

  const recentProjects = useMemo(() => {
    return projects.slice(0, 5);
  }, [projects]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Overview of your projects and clients</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm" className="sm:size-default">
            <Link to="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">New Client</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="sm:size-default">
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">New Project</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Active Projects</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{stats.activeProjects}</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {stats.totalProjects} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Blocked Projects</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{stats.blockedProjects}</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {stats.blockedProjects > 0 ? (
                <AlertCircle className="h-3 w-3 text-red-600" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              )}
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{stats.totalClients}</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              Active clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Completed</CardTitle>
            <FolderKanban className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{stats.completedProjects}</div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-gray-600" />
              Finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Widgets Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1">
          <ProjectStatusChart projects={projects} />
        </div>
        <div className="md:col-span-1">
          <UpcomingDeadlines projects={projects} />
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <ActivityTimeline projects={projects} clients={clients} />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Get started by creating your first project
              </p>
              <Button asChild>
                <Link to="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-start justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:items-center sm:p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold truncate">{project.name}</h4>
                      <Badge
                        variant="secondary"
                        className={cn(statusColors[project.status], "text-xs")}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm truncate">
                      {project.client.name} • {project.client.company || "No company"}
                    </p>
                    {project.description && (
                      <div 
                        className="prose prose-sm max-w-none text-xs text-muted-foreground line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: project.description }}
                      />
                    )}
                    {project.start_date && (
                      <p className="text-xs text-muted-foreground">
                        Started {format(new Date(project.start_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
