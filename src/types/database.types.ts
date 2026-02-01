/**
 * Database TypeScript types generated from Supabase schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectStatus = "onboarding" | "active" | "blocked" | "completed" | "maintenance";

export type MilestoneStatus = "pending" | "in_progress" | "review" | "approved";

export type TaskStatus = "pending" | "in_progress" | "review" | "completed";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          company: string | null;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          company?: string | null;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          company?: string | null;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          start_date: string | null;
          budget: number | null;
          spent: number | null;
          currency: string;
          archived: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          budget?: number | null;
          spent?: number | null;
          currency?: string;
          archived?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          budget?: number | null;
          spent?: number | null;
          currency?: string;
          archived?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      project_tags: {
        Row: {
          project_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      project_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          default_milestones: Json | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          default_milestones?: Json | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          default_milestones?: Json | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          status: MilestoneStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: MilestoneStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: MilestoneStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          milestone_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          milestone_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper types for easier use
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type MilestoneInsert = Database["public"]["Tables"]["milestones"]["Insert"];
export type MilestoneUpdate = Database["public"]["Tables"]["milestones"]["Update"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
export type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

export type ProjectTag = Database["public"]["Tables"]["project_tags"]["Row"];
export type ProjectTagInsert = Database["public"]["Tables"]["project_tags"]["Insert"];
export type ProjectTagUpdate = Database["public"]["Tables"]["project_tags"]["Update"];

export type ProjectTemplate = Database["public"]["Tables"]["project_templates"]["Row"];
export type ProjectTemplateInsert = Database["public"]["Tables"]["project_templates"]["Insert"];
export type ProjectTemplateUpdate = Database["public"]["Tables"]["project_templates"]["Update"];

// Project Links types
export type LinkType = "production" | "staging" | "development" | "design" | "documentation" | "repository" | "other";

export interface ProjectLink {
  id: string;
  project_id: string;
  user_id: string;
  type: LinkType;
  label: string;
  url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Attachment types
export interface ProjectAttachment {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneAttachment {
  id: string;
  milestone_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Comment types
export type CommentTargetType = "project" | "milestone" | "task";

export interface Comment {
  id: string;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  content: string;
  parent_id: string | null;
  mentions: string[];
  edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser extends Comment {
  user_email: string;
  reply_count: number;
  reaction_count: number;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// Extended types with relations
export type ProjectWithClient = Project & {
  client: Client;
  tags?: Tag[];
};

export type MilestoneWithTasks = Milestone & {
  tasks: Task[];
};

export type ProjectDetail = Project & {
  client: Client;
  milestones: MilestoneWithTasks[];
  tags?: Tag[];
};
