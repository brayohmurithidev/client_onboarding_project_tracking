/**
 * Project Status Distribution Chart
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectStatus } from "@/types/database.types";

interface ProjectStatusChartProps {
  projects: Array<{ status: ProjectStatus }>;
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  onboarding: "#3b82f6", // blue
  active: "#22c55e", // green
  blocked: "#ef4444", // red
  completed: "#6b7280", // gray
  maintenance: "#eab308", // yellow
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
  blocked: "Blocked",
  completed: "Completed",
  maintenance: "Maintenance",
};

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  // Count projects by status
  const statusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<ProjectStatus, number>);

  // Convert to chart data
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status as ProjectStatus],
    value: count,
    color: STATUS_COLORS[status as ProjectStatus],
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No projects to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
