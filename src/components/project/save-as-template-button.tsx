/**
 * Save Project as Template Button
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ProjectDetail } from "@/types/database.types";

interface SaveAsTemplateButtonProps {
  project: ProjectDetail;
}

export function SaveAsTemplateButton({ project }: SaveAsTemplateButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState(`${project.name} Template`);
  const [description, setDescription] = useState("");

  const saveAsTemplate = async () => {
    if (!user || !templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    setLoading(true);
    try {
      // Extract milestones (without IDs and project_id)
      const defaultMilestones = project.milestones.map((milestone) => ({
        title: milestone.title,
        description: milestone.description,
      }));

      const { error } = await supabase.from("project_templates").insert({
        name: templateName.trim(),
        description: description.trim() || null,
        default_milestones: defaultMilestones,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Template created successfully!");
      setOpen(false);
      
      // Ask if user wants to view templates
      setTimeout(() => {
        const viewTemplates = window.confirm("Template saved! Would you like to view your templates?");
        if (viewTemplates) {
          navigate("/templates");
        }
      }, 500);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this project with {project.milestones.length}{" "}
            milestone(s)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Website Development Template"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard template for website development projects..."
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Included:</strong> {project.milestones.length} milestone
              {project.milestones.length !== 1 ? "s" : ""} with titles and descriptions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={saveAsTemplate} className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
