-- =====================================================
-- COMPLETE SETUP SCRIPT
-- Client Onboarding & Project Tracking System
-- =====================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TYPES
DO $$
BEGIN
    -- Base Types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('onboarding', 'active', 'blocked', 'completed', 'maintenance');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') THEN
        CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'review', 'approved');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'review', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    
    -- Feature Types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'project_created', 'project_status_changed', 'milestone_completed', 'task_completed',
            'budget_warning', 'budget_exceeded', 'deadline_approaching', 'project_archived', 'project_restored',
            'comment_mention', 'new_comment', 'comment_reply'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_target_type') THEN
        CREATE TYPE comment_target_type AS ENUM ('project', 'milestone', 'task');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'link_type') THEN
        CREATE TYPE link_type AS ENUM ('production', 'staging', 'development', 'design', 'documentation', 'repository', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_entry_type') THEN
        CREATE TYPE time_entry_type AS ENUM ('manual', 'timer');
    END IF;
END$$;

-- 3. TABLES & INDEXES

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'onboarding',
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Extensions
  hourly_rate DECIMAL(10,2),
  budget DECIMAL(10,2),
  spent DECIMAL(10,2) DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status milestone_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON tasks(milestone_id);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  display_name VARCHAR(255),
  avatar_url TEXT,
  job_title VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_owner_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_workspace_owner ON team_members(workspace_owner_id);

-- Project Assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON project_assignments(user_id);

-- Task Assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);

-- Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_owner_id, email)
);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  project_created BOOLEAN DEFAULT TRUE,
  project_status_changed BOOLEAN DEFAULT TRUE,
  milestone_completed BOOLEAN DEFAULT TRUE,
  task_completed BOOLEAN DEFAULT TRUE,
  budget_warning BOOLEAN DEFAULT TRUE,
  budget_exceeded BOOLEAN DEFAULT TRUE,
  deadline_approaching BOOLEAN DEFAULT TRUE,
  project_archived BOOLEAN DEFAULT FALSE,
  project_restored BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  email_digest BOOLEAN DEFAULT FALSE,
  email_frequency VARCHAR(20) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type comment_target_type NOT NULL,
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  mentions UUID[] DEFAULT '{}',
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Comment Reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  entry_type time_entry_type NOT NULL DEFAULT 'manual',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  description TEXT,
  billable BOOLEAN DEFAULT TRUE,
  hourly_rate DECIMAL(10,2),
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_is_running ON time_entries(is_running) WHERE is_running = TRUE;

-- Links & Attachments
CREATE TABLE IF NOT EXISTS project_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type link_type NOT NULL,
  label VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestone_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS POLICIES (Simplified for consolidated script)

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Helper function for access control (redefined here for global use)
CREATE OR REPLACE FUNCTION user_can_access_project(
  p_project_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id 
    AND (
      user_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM project_assignments 
        WHERE project_id = p_project_id 
        AND user_id = p_user_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (We apply the most permissive 'team aware' policies)

-- Clients
CREATE POLICY "Users can view their own or assigned clients" ON clients FOR SELECT
  USING (
    user_id = auth.uid() OR id IN (
      SELECT DISTINCT p.client_id FROM projects p
      JOIN project_assignments pa ON pa.project_id = p.id
      WHERE pa.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can view their own or assigned projects" ON projects FOR SELECT
  USING (user_id = auth.uid() OR id IN (SELECT project_id FROM project_assignments WHERE user_id = auth.uid()));
CREATE POLICY "Project owners can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Project owners can update projects" ON projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Project owners can delete projects" ON projects FOR DELETE USING (user_id = auth.uid());

-- Milestones & Tasks (Access inherited from Project)
CREATE POLICY "Users can view milestones for accessible projects" ON milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = milestones.project_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM project_assignments pa WHERE pa.project_id = p.id AND pa.user_id = auth.uid()))));
CREATE POLICY "Users can manage milestones for accessible projects" ON milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = milestones.project_id AND p.user_id = auth.uid())); -- Simplified: only owners for now

CREATE POLICY "Users can view tasks for accessible projects" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM milestones m JOIN projects p ON p.id = m.project_id WHERE m.id = tasks.milestone_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM project_assignments pa WHERE pa.project_id = p.id AND pa.user_id = auth.uid()))));
CREATE POLICY "Users can manage tasks for accessible projects" ON tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM milestones m JOIN projects p ON p.id = m.project_id WHERE m.id = tasks.milestone_id AND p.user_id = auth.uid())); -- Simplified

-- Team Members
CREATE POLICY "Users can view team members" ON team_members FOR SELECT
  USING (workspace_owner_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "Owners manage team members" ON team_members FOR ALL USING (workspace_owner_id = auth.uid());

-- Time Entries
CREATE POLICY "Users can view time entries for accessible projects" ON time_entries FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM projects p WHERE p.id = time_entries.project_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON time_entries FOR DELETE USING (auth.uid() = user_id);

-- 5. FUNCTIONS (Consolidated & Fixed)

-- Update Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notification Helper
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR,
  p_message TEXT,
  p_link VARCHAR DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link, project_id, client_id, metadata) 
    VALUES (p_user_id, p_type, p_title, p_message, p_link, p_project_id, p_client_id, p_metadata) 
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Time Tracking: Calculate Duration
CREATE OR REPLACE FUNCTION calculate_duration() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    NEW.is_running := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Time Tracking: Single Timer
CREATE OR REPLACE FUNCTION ensure_single_running_timer() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_running = TRUE THEN
    UPDATE time_entries
    SET is_running = FALSE, end_time = NOW()
    WHERE user_id = NEW.user_id AND is_running = TRUE AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Time Tracking: Get Running Timer (FIXED TYPE MISMATCH)
CREATE OR REPLACE FUNCTION get_running_timer(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  project_name TEXT,
  task_id UUID,
  task_title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  elapsed_seconds INTEGER,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.id,
    te.project_id,
    p.name::TEXT as project_name, -- Cast to TEXT
    te.task_id,
    t.title::TEXT as task_title,  -- Cast to TEXT
    te.start_time,
    EXTRACT(EPOCH FROM (NOW() - te.start_time))::INTEGER as elapsed_seconds,
    te.description
  FROM time_entries te
  JOIN projects p ON p.id = te.project_id
  LEFT JOIN tasks t ON t.id = te.task_id
  WHERE te.user_id = p_user_id
    AND te.is_running = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Time Tracking: Get Entries With Details (FIXED TYPE MISMATCH)
CREATE OR REPLACE FUNCTION get_time_entries_with_details(
  p_project_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  project_id UUID,
  project_name TEXT,
  task_id UUID,
  task_title TEXT,
  entry_type time_entry_type,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  duration_hours DECIMAL,
  description TEXT,
  billable BOOLEAN,
  hourly_rate DECIMAL,
  amount DECIMAL,
  is_running BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.id,
    te.user_id,
    te.project_id,
    p.name::TEXT as project_name, -- Cast to TEXT
    te.task_id,
    t.title::TEXT as task_title,  -- Cast to TEXT
    te.entry_type,
    te.start_time,
    te.end_time,
    te.duration_seconds,
    ROUND((te.duration_seconds::DECIMAL / 3600), 2) as duration_hours,
    te.description,
    te.billable,
    te.hourly_rate,
    ROUND((te.duration_seconds::DECIMAL / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0), 2) as amount,
    te.is_running,
    te.created_at
  FROM time_entries te
  JOIN projects p ON p.id = te.project_id
  LEFT JOIN tasks t ON t.id = te.task_id
  WHERE 
    (p_project_id IS NULL OR te.project_id = p_project_id)
    AND (p_start_date IS NULL OR DATE(te.start_time) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(te.start_time) <= p_end_date)
    AND p.user_id = auth.uid()
  ORDER BY te.start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Time Tracking: Dashboard Stats
CREATE OR REPLACE FUNCTION get_project_total_hours(p_project_id UUID) RETURNS DECIMAL AS $$
DECLARE v_total_seconds BIGINT;
BEGIN
  SELECT COALESCE(SUM(duration_seconds), 0) INTO v_total_seconds FROM time_entries WHERE project_id = p_project_id AND duration_seconds IS NOT NULL;
  RETURN ROUND((v_total_seconds::DECIMAL / 3600), 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_project_billable_hours(p_project_id UUID) RETURNS DECIMAL AS $$
DECLARE v_total_seconds BIGINT;
BEGIN
  SELECT COALESCE(SUM(duration_seconds), 0) INTO v_total_seconds FROM time_entries WHERE project_id = p_project_id AND billable = TRUE AND duration_seconds IS NOT NULL;
  RETURN ROUND((v_total_seconds::DECIMAL / 3600), 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_project_billable_amount(p_project_id UUID) RETURNS DECIMAL AS $$
DECLARE v_total_amount DECIMAL; v_project_rate DECIMAL;
BEGIN
  SELECT hourly_rate INTO v_project_rate FROM projects WHERE id = p_project_id;
  SELECT COALESCE(SUM((duration_seconds::DECIMAL / 3600) * COALESCE(hourly_rate, v_project_rate, 0)), 0) INTO v_total_amount
  FROM time_entries WHERE project_id = p_project_id AND billable = TRUE AND duration_seconds IS NOT NULL;
  RETURN ROUND(v_total_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS

-- Timestamp Triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Logic Triggers
CREATE TRIGGER trigger_calculate_duration BEFORE INSERT OR UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION calculate_duration();
CREATE TRIGGER trigger_ensure_single_running_timer BEFORE INSERT OR UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION ensure_single_running_timer();

-- 7. INITIAL MIGRATIONS & DATA
SELECT 1; -- Placeholder
