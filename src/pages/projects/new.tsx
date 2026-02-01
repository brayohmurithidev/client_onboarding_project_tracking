/**
 * Create New Project Page
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProjects } from "@/store/project.store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
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
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, UserPlus, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/auth.store";
import type { ProjectStatus } from "@/types/database.types";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  client_id: z.string().min(1, "Client is required"),
  status: z.enum(["onboarding", "active", "blocked", "completed", "maintenance"]),
  start_date: z.string().optional(),
  budget: z.string().optional(),
  currency: z.string().optional(),
  template_id: z.string().optional(),
});

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type ClientFormData = z.infer<typeof clientSchema>;

export function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, createProject, createClient, fetchClients } = useProjects();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    fetchClients();
    fetchTemplates();
    
    // Set template from navigation state if available
    if (location.state?.template) {
      setSelectedTemplate(location.state.template);
      setValue("template_id", location.state.template.id);
    }
  }, [fetchClients]);

  const fetchTemplates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: "onboarding",
      currency: "USD",
      template_id: selectedTemplate?.id || "",
    },
  });

  const {
    register: registerClient,
    handleSubmit: handleSubmitClient,
    reset: resetClient,
    formState: { errors: clientErrors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      const projectData = {
        name: data.name,
        description: data.description || null,
        client_id: data.client_id,
        status: data.status as ProjectStatus,
        start_date: data.start_date || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        currency: data.currency || "USD",
      };
      
      // Create the project
      const newProject = await createProject(projectData);
      
      // If using a template, create default milestones
      const templateToUse = selectedTemplate;
      if (templateToUse?.default_milestones && Array.isArray(templateToUse.default_milestones)) {
        const milestones = templateToUse.default_milestones.map((milestone: any) => ({
          project_id: newProject.id,
          title: milestone.title,
          description: milestone.description || null,
          status: "pending",
        }));
        
        const { error: milestonesError } = await supabase
          .from("milestones")
          .insert(milestones);
        
        if (milestonesError) {
          console.error("Error creating milestones:", milestonesError);
          toast.warning("Project created but some milestones failed");
        } else {
          toast.success(`Project created with ${milestones.length} milestone(s)!`);
        }
      } else {
        toast.success("Project created successfully!");
      }
      
      navigate("/projects");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create project";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onClientSubmit = async (data: ClientFormData) => {
    setIsCreatingClient(true);
    try {
      const newClient = await createClient(data);
      toast.success("Client created successfully!");
      setShowClientDialog(false);
      resetClient();
      // Automatically select the newly created client
      setValue("client_id", newClient.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create client";
      toast.error(errorMessage);
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back to Projects</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            {selectedTemplate 
              ? `Using "${selectedTemplate.name}" template with ${
                  Array.isArray(selectedTemplate.default_milestones) 
                    ? selectedTemplate.default_milestones.length 
                    : 0
                } milestones`
              : "Add a new project to track progress and milestones"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template_id">Use Template (Optional)</Label>
              <Select
                value={selectedTemplate?.id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setSelectedTemplate(null);
                    setValue("template_id", "");
                  } else {
                    const template = templates.find((t) => t.id === value);
                    setSelectedTemplate(template);
                    setValue("template_id", value);
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template or start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      No template (blank project)
                    </span>
                  </SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {template.name}
                        {template.default_milestones && (
                          <span className="text-xs text-muted-foreground">
                            ({Array.isArray(template.default_milestones) ? template.default_milestones.length : 0} milestones)
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedTemplate.name}</p>
                    {selectedTemplate.description && (
                      <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {Array.isArray(selectedTemplate.default_milestones) 
                      ? selectedTemplate.default_milestones.length 
                      : 0} milestones
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setValue("template_id", "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Website Redesign"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client_id">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientDialog(true)}
                  disabled={isLoading}
                  className="h-auto p-0 text-xs text-primary hover:underline"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add New Client
                </Button>
              </div>
              <Select
                value={watch("client_id")}
                onValueChange={(value) => setValue("client_id", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No clients yet. Click "Add New Client" above.
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-destructive">{errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <WysiwygEditor
                value={watch("description")}
                onChange={(value) => setValue("description", value)}
                placeholder="Project description and goals..."
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as ProjectStatus)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  disabled={isLoading}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watch("currency") || "USD"}
                  onValueChange={(value) => setValue("currency", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KSH">KSh Kenyan Shilling (KSH)</SelectItem>
                    <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10000"
                  {...register("budget")}
                  disabled={isLoading}
                />
                {errors.budget && (
                  <p className="text-sm text-destructive">{errors.budget.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/projects")}
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
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="mb-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center">Create New Client</DialogTitle>
            <DialogDescription className="text-center">
              Add a new client to your project tracker
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitClient(onClientSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                placeholder="John Doe"
                {...registerClient("name")}
                disabled={isCreatingClient}
              />
              {clientErrors.name && (
                <p className="text-sm text-destructive">{clientErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-company">Company</Label>
              <Input
                id="client-company"
                placeholder="Acme Inc."
                {...registerClient("company")}
                disabled={isCreatingClient}
              />
              {clientErrors.company && (
                <p className="text-sm text-destructive">{clientErrors.company.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-email"
                type="email"
                placeholder="john@example.com"
                {...registerClient("email")}
                disabled={isCreatingClient}
              />
              {clientErrors.email && (
                <p className="text-sm text-destructive">{clientErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...registerClient("phone")}
                disabled={isCreatingClient}
              />
              {clientErrors.phone && (
                <p className="text-sm text-destructive">{clientErrors.phone.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowClientDialog(false);
                  resetClient();
                }}
                disabled={isCreatingClient}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isCreatingClient}>
                {isCreatingClient ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
