/**
 * Tag Manager Component
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag as TagIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tag } from "@/types/database.types";

interface TagManagerProps {
  projectId: string;
  selectedTags: Tag[];
  onTagsChange?: () => void;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // green
  "#06b6d4", // cyan
  "#6b7280", // gray
];

export function TagManager({ projectId, selectedTags, onTagsChange }: TagManagerProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New tag form
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);

  // Load available tags
  useEffect(() => {
    if (open && user) {
      fetchTags();
    }
  }, [open, user]);

  const fetchTags = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!user || !newTagName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          name: newTagName.trim(),
          color: newTagColor,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setAvailableTags([...availableTags, data]);
      setNewTagName("");
      setNewTagColor(DEFAULT_COLORS[0]);
      toast.success("Tag created");
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const addTagToProject = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("project_tags")
        .insert({
          project_id: projectId,
          tag_id: tagId,
        });

      if (error) throw error;

      toast.success("Tag added");
      onTagsChange?.();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const removeTagFromProject = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("project_tags")
        .delete()
        .eq("project_id", projectId)
        .eq("tag_id", tagId);

      if (error) throw error;

      toast.success("Tag removed");
      onTagsChange?.();
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const selectedTagIds = selectedTags.map((t) => t.id);
  const unselectedTags = availableTags.filter((t) => !selectedTagIds.includes(t.id));

  return (
    <div className="space-y-2">
      {/* Selected tags display */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-muted-foreground">No tags</span>
        ) : (
          selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
              className="gap-1 border-0"
            >
              {tag.name}
              <button
                onClick={() => removeTagFromProject(tag.id)}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Add tag button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <TagIcon className="h-4 w-4" />
            Add Tag
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add existing tags or create new ones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new tag */}
            <div className="space-y-2 rounded-lg border p-3">
              <Label>Create New Tag</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTagName.trim()) {
                      createTag();
                    }
                  }}
                />
                <div className="flex gap-1">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-10 w-10 rounded border-2 ${
                        newTagColor === color ? "border-black" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
                <Button
                  onClick={createTag}
                  disabled={!newTagName.trim() || creating}
                  size="sm"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Available tags */}
            <div className="space-y-2">
              <Label>Available Tags</Label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : unselectedTags.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {availableTags.length === 0
                    ? "No tags yet. Create one above!"
                    : "All tags are already added"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unselectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color + "20", color: tag.color }}
                      className="cursor-pointer gap-1 border-0"
                      onClick={() => addTagToProject(tag.id)}
                    >
                      {tag.name}
                      <Plus className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
