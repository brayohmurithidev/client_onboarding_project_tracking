/**
 * Task Assignee Selector Component
 * Assign team members to tasks
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { UserPlus, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
}

interface AssignedUser {
  user_id: string;
  email: string;
}

interface TaskAssigneeSelectorProps {
  taskId: string;
  projectId: string;
  onUpdate?: () => void;
}

export function TaskAssigneeSelector({
  taskId,
  projectId,
  onUpdate,
}: TaskAssigneeSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      fetchAssignedUsers();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_team_members", {
        p_workspace_owner_id: user.id,
      });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchAssignedUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_task_assignees", {
        p_task_id: taskId,
      });

      if (error) throw error;

      setAssignedUsers(data || []);
    } catch (error) {
      console.error("Error fetching assigned users:", error);
    }
  };

  const toggleAssignment = async (userId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const isAssigned = assignedUsers.some((a) => a.user_id === userId);

      if (isAssigned) {
        // Remove assignment
        const { error } = await supabase
          .from("task_assignments")
          .delete()
          .eq("task_id", taskId)
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("Assignee removed");
      } else {
        // Add assignment
        const { error } = await supabase.from("task_assignments").insert({
          task_id: taskId,
          user_id: userId,
          assigned_by: user.id,
        });

        if (error) throw error;
        toast.success("Assignee added");
      }

      fetchAssignedUsers();
      onUpdate?.();
    } catch (error) {
      console.error("Error toggling assignment:", error);
      toast.error("Failed to update assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
          {assignedUsers.length > 0 ? (
            <>
              <div className="flex -space-x-2">
                {assignedUsers.slice(0, 3).map((assigned) => (
                  <Avatar key={assigned.user_id} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {assigned.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {assignedUsers.length > 3 && (
                <span className="text-xs">+{assignedUsers.length - 3}</span>
              )}
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span className="text-xs">Assign</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b p-3">
          <p className="text-sm font-medium">Assign to</p>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {teamMembers.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No team members yet
            </p>
          ) : (
            <div className="space-y-1">
              {teamMembers.map((member) => {
                const isAssigned = assignedUsers.some((a) => a.user_id === member.user_id);
                return (
                  <button
                    key={member.user_id}
                    onClick={() => toggleAssignment(member.user_id)}
                    disabled={loading}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent",
                      loading && "opacity-50"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(member.display_name || member.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">
                        {member.display_name || member.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {isAssigned && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
