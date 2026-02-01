/**
 * Projects List Page
 */

import { useEffect } from "react";
import { Link } from "react-router";
import { useProjects } from "@/store/project.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderKanban, ArrowRight, Building2, Search, X, Archive, LayoutGrid, Calendar as CalendarIcon, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectStatus } from "@/types/database.types";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export function ProjectsPage() {
  const { projects, clients, loading, fetchProjects, fetchClients, updateProjectStatus } = useProjects();
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [fetchProjects, fetchClients]);

  const filteredProjects = projects.filter((p) => {
    // Archived filter
    if (!showArchived && p.archived) return false;
    if (showArchived && !p.archived) return false;
    
    // Status filter
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    
    // Client filter
    if (filterClient !== "all" && p.client_id !== filterClient) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesClient = p.client.name.toLowerCase().includes(query);
      const matchesCompany = p.client.company?.toLowerCase().includes(query);
      if (!matchesName && !matchesClient && !matchesCompany) return false;
    }
    
    return true;
  });

  const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
    try {
      await updateProjectStatus(projectId, status);
      toast.success("Project status updated");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Track and manage your projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="list" className="hidden sm:block">
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
          <Button asChild size="sm" className="sm:size-default">
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-medium sm:inline">Status:</span>
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as ProjectStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-medium sm:inline">Client:</span>
            <Select
              value={filterClient}
              onValueChange={setFilterClient}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Archived Toggle */}
          <div className="flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="archived-toggle" className="cursor-pointer text-sm">
              Archived
            </Label>
            <Switch
              id="archived-toggle"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
          </div>

          {/* Clear Filters */}
          {(filterStatus !== "all" || filterClient !== "all" || searchQuery || showArchived) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setFilterClient("all");
                setSearchQuery("");
                setShowArchived(false);
              }}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
          {showArchived && (
            <span className="flex items-center gap-1 text-xs">
              <Archive className="h-3 w-3" />
              Viewing archived projects
            </span>
          )}
        </div>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">
              {filterStatus === "all" ? "No projects yet" : `No ${filterStatus} projects`}
            </h3>
            <p className="mb-6 text-center text-muted-foreground">
              {filterStatus === "all"
                ? "Create your first project to get started"
                : "Try changing the filter or create a new project"}
            </p>
            {filterStatus === "all" && (
              <Button asChild>
                <Link to="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <span className="truncate">{project.name}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {project.client.name}
                        {project.client.company && ` • ${project.client.company}`}
                      </span>
                    </CardDescription>
                  </div>
                  <Select
                    value={project.status}
                    onValueChange={(value) =>
                      handleStatusChange(project.id, value as ProjectStatus)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {project.description && (
                    <div 
                      className="prose prose-sm max-w-none text-xs text-muted-foreground line-clamp-2 sm:text-sm"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:gap-2">
                      {project.start_date && (
                        <>
                          <span>Started {format(new Date(project.start_date), "MMM d, yyyy")}</span>
                          <span className="hidden sm:inline">•</span>
                        </>
                      )}
                      <span>Created {format(new Date(project.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/projects/${project.id}`}>
                        <span className="sm:hidden">View</span>
                        <span className="hidden sm:inline">View Details</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
