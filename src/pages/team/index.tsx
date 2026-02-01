/**
 * Team Members Page
 * Manage team members, roles, and invitations
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Mail,
  Trash2,
  Crown,
  Shield,
  User,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  active: boolean;
  joined_at: string | null;
  last_active_at: string | null;
}

const roleIcons = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  member: <User className="h-4 w-4" />,
  viewer: <Eye className="h-4 w-4" />,
};

const roleColors = {
  owner: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  admin: "bg-purple-500/10 text-purple-700 border-purple-200",
  member: "bg-blue-500/10 text-blue-700 border-blue-200",
  viewer: "bg-gray-500/10 text-gray-700 border-gray-200",
};

export function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_team_members", {
        p_workspace_owner_id: user.id,
      });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Team member removed");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove team member");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team Members</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your team and their access
          </p>
        </div>
        <InviteTeamMemberDialog onSuccess={fetchTeamMembers} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter((m) => m.role === "owner" || m.role === "admin").length}
                </p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter((m) => m.role === "member").length}
                </p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter((m) => m.role === "viewer").length}
                </p>
                <p className="text-xs text-muted-foreground">Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No team members yet</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Invite team members to collaborate on projects
            </p>
            <InviteTeamMemberDialog onSuccess={fetchTeamMembers} trigger="button" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onRemove={removeTeamMember}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Team Member Card
function TeamMemberCard({
  member,
  onRemove,
  currentUserId,
}: {
  member: TeamMember;
  onRemove: (id: string) => void;
  currentUserId?: string;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRemove = async () => {
    setDeleting(true);
    await onRemove(member.id);
    setDeleting(false);
    setShowDeleteDialog(false);
  };

  const isCurrentUser = member.user_id === currentUserId;

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {(member.display_name || member.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {member.display_name || member.email.split("@")[0]}
                  </p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <Badge variant="outline" className={cn("text-xs", roleColors[member.role])}>
                  <span className="mr-1">{roleIcons[member.role]}</span>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
              </div>
            </div>

            {!isCurrentUser && member.role !== "owner" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {member.joined_at && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>Joined {format(new Date(member.joined_at), "MMM d, yyyy")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {member.display_name || member.email} from your team and revoke
              their access to all projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Invite Team Member Dialog
function InviteTeamMemberDialog({
  onSuccess,
  trigger = "icon",
}: {
  onSuccess: () => void;
  trigger?: "icon" | "button";
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "member" as "admin" | "member" | "viewer",
    display_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Note: This is a simplified version
      // In production, you'd send an invitation email with a unique token
      // For now, we'll just add them directly (assumes they already have an account)

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const invitedUser = existingUsers?.users?.find((u) => u.email === formData.email);

      if (!invitedUser) {
        toast.error("User not found. They need to sign up first.");
        return;
      }

      // Add to team
      const { error } = await supabase.from("team_members").insert({
        user_id: invitedUser.id,
        workspace_owner_id: user.id,
        role: formData.role,
        display_name: formData.display_name || null,
        joined_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This user is already on your team");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Team member added");
      setOpen(false);
      setFormData({ email: "", role: "member", display_name: "" });
      onSuccess();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Failed to add team member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "icon" ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        ) : (
          <Button size="lg">
            <Mail className="mr-2 h-5 w-5" />
            Invite Team Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Add a team member to collaborate on projects
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="colleague@example.com"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              User must already have an account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name (Optional)</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as "admin" | "member" | "viewer" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">
                        Full access to all projects
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-muted-foreground">
                        Can manage assigned projects
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-muted-foreground">
                        Read-only access
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
