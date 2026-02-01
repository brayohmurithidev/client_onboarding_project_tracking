/**
 * Application Router Configuration
 */

import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./layout";
import { ProtectedRoute } from "@/components/common/protected-route";

// Auth pages
import { LoginPage } from "@/pages/auth/login";
import { RegisterPage } from "@/pages/auth/register";

// Dashboard
import { DashboardPage } from "@/pages/dashboard";

// Clients
import { ClientsPage } from "@/pages/clients";
import { NewClientPage } from "@/pages/clients/new";

// Projects
import { ProjectsPage } from "@/pages/projects";
import { NewProjectPage } from "@/pages/projects/new";
import { ProjectDetailPage } from "@/pages/projects/[id]";
import { KanbanPage } from "@/pages/projects/kanban";
import { CalendarPage } from "@/pages/projects/calendar";

// Templates
import { TemplatesPage } from "@/pages/templates";
import { NewTemplatePage } from "@/pages/templates/new";

// Notifications
import { NotificationsPage } from "@/pages/notifications";
import { NotificationSettingsPage } from "@/pages/settings/notifications";

// Team
import { TeamPage } from "@/pages/team";
import { MyTasksPage } from "@/pages/my-tasks";

/**
 * Application router with protected and public routes
 */
export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  // Protected routes
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "/clients",
        element: <ClientsPage />,
      },
      {
        path: "/clients/new",
        element: <NewClientPage />,
      },
      {
        path: "/projects",
        element: <ProjectsPage />,
      },
      {
        path: "/projects/kanban",
        element: <KanbanPage />,
      },
      {
        path: "/projects/calendar",
        element: <CalendarPage />,
      },
      {
        path: "/projects/new",
        element: <NewProjectPage />,
      },
      {
        path: "/projects/:id",
        element: <ProjectDetailPage />,
      },
      {
        path: "/templates",
        element: <TemplatesPage />,
      },
      {
        path: "/templates/new",
        element: <NewTemplatePage />,
      },
      {
        path: "/notifications",
        element: <NotificationsPage />,
      },
      {
        path: "/settings/notifications",
        element: <NotificationSettingsPage />,
      },
      {
        path: "/team",
        element: <TeamPage />,
      },
      {
        path: "/my-tasks",
        element: <MyTasksPage />,
      },
    ],
  },
  // Catch all - redirect to dashboard
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
