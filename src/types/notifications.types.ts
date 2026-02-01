/**
 * Notification Types
 */

export type NotificationType =
  | "project_created"
  | "project_status_changed"
  | "milestone_completed"
  | "task_completed"
  | "budget_warning"
  | "budget_exceeded"
  | "deadline_approaching"
  | "project_archived"
  | "project_restored"
  | "new_comment"
  | "comment_mention"
  | "comment_reply";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  read_at: string | null;
  project_id: string | null;
  client_id: string | null;
  metadata: Record<string, any>;
}

export interface NotificationPreferences {
  user_id: string;
  project_created: boolean;
  project_status_changed: boolean;
  milestone_completed: boolean;
  task_completed: boolean;
  budget_warning: boolean;
  budget_exceeded: boolean;
  deadline_approaching: boolean;
  project_archived: boolean;
  project_restored: boolean;
  email_enabled: boolean;
  email_digest: boolean;
  email_frequency: "daily" | "weekly" | "instant";
  created_at: string;
  updated_at: string;
}
