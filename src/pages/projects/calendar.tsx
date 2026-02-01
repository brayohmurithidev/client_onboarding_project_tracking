/**
 * Calendar View for Projects
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useProjects } from "@/store/project.store";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, List, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database.types";

// Define View type
type View = "month" | "week" | "day" | "agenda";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const statusColors: Record<ProjectStatus, string> = {
  onboarding: "#3b82f6",
  active: "#22c55e",
  blocked: "#ef4444",
  completed: "#6b7280",
  maintenance: "#eab308",
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    status: ProjectStatus;
    clientName: string;
    description: string | null;
  };
}

export function CalendarPage() {
  const { projects, loading, fetchProjects } = useProjects();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const events: CalendarEvent[] = useMemo(() => {
    return projects
      .filter((p) => p.start_date && !p.archived)
      .map((project) => ({
        id: project.id,
        title: project.name,
        start: new Date(project.start_date!),
        end: new Date(project.start_date!),
        resource: {
          status: project.status,
          clientName: project.client.name,
          description: project.description,
        },
      }));
  }, [projects]);

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: statusColors[event.resource.status],
        borderColor: statusColors[event.resource.status],
        color: "white",
        borderRadius: "4px",
        padding: "2px 5px",
        fontSize: "0.875rem",
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <CalendarIcon className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Project Calendar</h1>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="calendar" className="hidden md:block">
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
          <Select
            value={view}
            onValueChange={(value) => setView(value as View)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-muted-foreground">Status:</span>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-4">
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => navigate(`/projects/${event.id}`)}
            popup
            tooltipAccessor={(event) => 
              `${event.title}\nClient: ${event.resource.clientName}\nStatus: ${event.resource.status}`
            }
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{events.length}</div>
          <p className="text-sm text-muted-foreground">Scheduled Projects</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {events.filter((e) => e.resource.status === "onboarding").length}
          </div>
          <p className="text-sm text-muted-foreground">Onboarding</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {events.filter((e) => e.resource.status === "active").length}
          </div>
          <p className="text-sm text-muted-foreground">Active</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {events.filter((e) => e.resource.status === "blocked").length}
          </div>
          <p className="text-sm text-muted-foreground">Blocked</p>
        </Card>
      </div>
    </div>
  );
}
