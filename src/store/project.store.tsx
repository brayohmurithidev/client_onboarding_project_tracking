/**
 * Project Data Context Store
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {
  Client,
  Project,
  ProjectWithClient,
  ProjectDetail,
} from "@/types/database.types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth.store";

interface ProjectContextType {
  clients: Client[];
  projects: ProjectWithClient[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchProjectDetail: (id: string) => Promise<ProjectDetail | null>;
  createClient: (client: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => Promise<Client>;
  createProject: (
    project: Omit<Project, "id" | "created_at" | "updated_at" | "user_id">
  ) => Promise<Project>;
  updateProjectStatus: (id: string, status: Project["status"]) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

/**
 * Project Provider Component
 */
export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:clients(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data as ProjectWithClient[] || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchProjectDetail = useCallback(async (id: string): Promise<ProjectDetail | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(*),
          milestones(
            *,
            tasks(*)
          )
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as ProjectDetail;
    } catch (error) {
      console.error("Error fetching project detail:", error);
      return null;
    }
  }, [user]);

  const createClient = useCallback(async (
    clientData: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">
  ): Promise<Client> => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("clients")
      .insert({ ...clientData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    
    // Update local state
    setClients((prev) => [data, ...prev]);
    
    return data;
  }, [user]);

  const createProject = useCallback(async (
    projectData: Omit<Project, "id" | "created_at" | "updated_at" | "user_id">
  ): Promise<Project> => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...projectData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    
    // Refresh projects to get the client data
    await fetchProjects();
    
    return data;
  }, [user, fetchProjects]);

  const updateProjectStatus = useCallback(async (id: string, status: Project["status"]) => {
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    
    // Update local state
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        clients,
        projects,
        loading,
        fetchClients,
        fetchProjects,
        fetchProjectDetail,
        createClient,
        createProject,
        updateProjectStatus,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Hook to access project context
 */
export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}
