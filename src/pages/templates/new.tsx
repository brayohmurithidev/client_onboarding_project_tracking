/**
 * Create New Template Page
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical } from "lucide-react";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  milestones: z.array(
    z.object({
      title: z.string().min(1, "Milestone title is required"),
      description: z.string().optional(),
    })
  ),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export function NewTemplatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const onSubmit = async (data: TemplateFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("project_templates").insert({
        name: data.name,
        description: data.description || null,
        default_milestones: data.milestones,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Template created successfully!");
      navigate("/templates");
    } catch (error) {
      console.error("Error creating template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create template";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/templates")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>
            Create a reusable template with default milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Website Development Template"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Standard template for website development projects..."
                rows={3}
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Default Milestones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Default Milestones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ title: "", description: "" })}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No milestones yet. Add milestones that will be created automatically
                    when using this template.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="mt-2 h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`milestones.${index}.title`}>
                                  Milestone {index + 1} Title{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`milestones.${index}.title`}
                                  placeholder="Discovery & Planning"
                                  {...register(`milestones.${index}.title`)}
                                  disabled={isLoading}
                                />
                                {errors.milestones?.[index]?.title && (
                                  <p className="text-sm text-destructive">
                                    {errors.milestones[index]?.title?.message}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`milestones.${index}.description`}>
                                  Description
                                </Label>
                                <Textarea
                                  id={`milestones.${index}.description`}
                                  placeholder="Initial discovery and project planning phase..."
                                  rows={2}
                                  {...register(`milestones.${index}.description`)}
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/templates")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Template"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
