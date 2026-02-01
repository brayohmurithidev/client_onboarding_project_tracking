/**
 * Project Links Component
 * Manage project links (dev, staging, production, etc.)
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Code,
  Figma,
  FileText,
  Github,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectLink, LinkType } from "@/types/database.types";

const linkTypes: Array<{ value: LinkType; label: string; icon: React.ReactNode }> = [
  { value: "production", label: "Production", icon: <Globe className="h-4 w-4" /> },
  { value: "staging", label: "Staging", icon: <Globe className="h-4 w-4" /> },
  { value: "development", label: "Development", icon: <Code className="h-4 w-4" /> },
  { value: "design", label: "Design", icon: <Figma className="h-4 w-4" /> },
  { value: "documentation", label: "Documentation", icon: <FileText className="h-4 w-4" /> },
  { value: "repository", label: "Repository", icon: <Github className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <ExternalLink className="h-4 w-4" /> },
];

const linkTypeColors: Record<LinkType, string> = {
  production: "bg-green-500/10 text-green-700 border-green-200",
  staging: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  development: "bg-blue-500/10 text-blue-700 border-blue-200",
  design: "bg-purple-500/10 text-purple-700 border-purple-200",
  documentation: "bg-gray-500/10 text-gray-700 border-gray-200",
  repository: "bg-black/10 text-black border-gray-300",
  other: "bg-gray-500/10 text-gray-700 border-gray-200",
};

interface ProjectLinksProps {
  projectId: string;
}

export function ProjectLinks({ projectId }: ProjectLinksProps) {
  const { user } = useAuth();
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, [projectId]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("project_links")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("project_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;

      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      toast.success("Link deleted");
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Project Links</h3>
          <p className="text-xs text-muted-foreground">Dev, staging, production links</p>
        </div>
        <AddLinkDialog projectId={projectId} onSuccess={fetchLinks} />
      </div>

      {links.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ExternalLink className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">No links yet</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Add links to your dev, staging, and production sites
          </p>
          <AddLinkDialog projectId={projectId} onSuccess={fetchLinks} trigger="button" />
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <LinkItem key={link.id} link={link} onDelete={deleteLink} onUpdate={fetchLinks} />
          ))}
        </div>
      )}
    </div>
  );
}

// Link Item Component
function LinkItem({
  link,
  onDelete,
  onUpdate,
}: {
  link: ProjectLink;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}) {
  const linkType = linkTypes.find((t) => t.value === link.type);

  return (
    <div className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{linkType?.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:underline truncate"
            >
              {link.label}
            </a>
            <Badge variant="outline" className={cn("text-xs", linkTypeColors[link.type])}>
              {linkType?.label}
            </Badge>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline truncate block"
          >
            {link.url}
          </a>
          {link.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{link.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <EditLinkDialog link={link} onSuccess={onUpdate} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(link.id)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Add Link Dialog
function AddLinkDialog({
  projectId,
  onSuccess,
  trigger = "icon",
}: {
  projectId: string;
  onSuccess: () => void;
  trigger?: "icon" | "button";
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "production" as LinkType,
    label: "",
    url: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("project_links").insert({
        project_id: projectId,
        user_id: user.id,
        ...formData,
      });

      if (error) throw error;

      toast.success("Link added");
      setOpen(false);
      setFormData({ type: "production", label: "", url: "", description: "" });
      onSuccess();
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "icon" ? (
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project Link</DialogTitle>
          <DialogDescription>
            Add links to dev, staging, production, or other project resources
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as LinkType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {linkTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Production Site"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes about this link"
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Link"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Link Dialog
function EditLinkDialog({ link, onSuccess }: { link: ProjectLink; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: link.type,
    label: link.label,
    url: link.url,
    description: link.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const { error } = await supabase
        .from("project_links")
        .update(formData)
        .eq("id", link.id);

      if (error) throw error;

      toast.success("Link updated");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating link:", error);
      toast.error("Failed to update link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>Update link details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as LinkType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {linkTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-label">Label</Label>
            <Input
              id="edit-label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
