/**
 * Notification Settings Page
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "@/store/notification.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Bell, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { NotificationPreferences } from "@/types/notifications.types";

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { preferences, fetchPreferences, updatePreferences } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>({});

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      await fetchPreferences();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(localPrefs);
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how you receive notifications about your projects
        </p>
      </div>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose which events trigger notifications in the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            id="project_status_changed"
            label="Project Status Changes"
            description="When a project status is updated"
            checked={localPrefs.project_status_changed ?? true}
            onCheckedChange={(checked) => handleToggle("project_status_changed", checked)}
          />

          <Separator />

          <NotificationToggle
            id="milestone_completed"
            label="Milestone Completions"
            description="When a milestone is marked as approved"
            checked={localPrefs.milestone_completed ?? true}
            onCheckedChange={(checked) => handleToggle("milestone_completed", checked)}
          />

          <Separator />

          <NotificationToggle
            id="task_completed"
            label="Task Completions"
            description="When a task is marked as completed"
            checked={localPrefs.task_completed ?? true}
            onCheckedChange={(checked) => handleToggle("task_completed", checked)}
          />

          <Separator />

          <NotificationToggle
            id="budget_warning"
            label="Budget Warnings"
            description="When project spending reaches 80% of budget"
            checked={localPrefs.budget_warning ?? true}
            onCheckedChange={(checked) => handleToggle("budget_warning", checked)}
          />

          <Separator />

          <NotificationToggle
            id="budget_exceeded"
            label="Budget Exceeded"
            description="When project spending exceeds the budget"
            checked={localPrefs.budget_exceeded ?? true}
            onCheckedChange={(checked) => handleToggle("budget_exceeded", checked)}
          />

          <Separator />

          <NotificationToggle
            id="deadline_approaching"
            label="Deadline Reminders"
            description="When project or milestone deadlines are approaching"
            checked={localPrefs.deadline_approaching ?? true}
            onCheckedChange={(checked) => handleToggle("deadline_approaching", checked)}
          />

          <Separator />

          <NotificationToggle
            id="project_archived"
            label="Project Archived"
            description="When a project is archived"
            checked={localPrefs.project_archived ?? false}
            onCheckedChange={(checked) => handleToggle("project_archived", checked)}
          />

          <Separator />

          <NotificationToggle
            id="project_restored"
            label="Project Restored"
            description="When an archived project is restored"
            checked={localPrefs.project_restored ?? false}
            onCheckedChange={(checked) => handleToggle("project_restored", checked)}
          />

          <Separator />

          <NotificationToggle
            id="new_comment"
            label="New Comments"
            description="When someone comments on your project"
            checked={localPrefs.new_comment ?? true}
            onCheckedChange={(checked) => handleToggle("new_comment", checked)}
          />

          <Separator />

          <NotificationToggle
            id="comment_mention"
            label="Comment Mentions"
            description="When someone @mentions you in a comment"
            checked={localPrefs.comment_mention ?? true}
            onCheckedChange={(checked) => handleToggle("comment_mention", checked)}
          />

          <Separator />

          <NotificationToggle
            id="comment_reply"
            label="Comment Replies"
            description="When someone replies to your comment"
            checked={localPrefs.comment_reply ?? true}
            onCheckedChange={(checked) => handleToggle("comment_reply", checked)}
          />
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            id="email_enabled"
            label="Enable Email Notifications"
            description="Receive notifications via email"
            checked={localPrefs.email_enabled ?? false}
            onCheckedChange={(checked) => handleToggle("email_enabled", checked)}
          />

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="email_frequency">Email Frequency</Label>
            <Select
              value={localPrefs.email_frequency || "instant"}
              onValueChange={(value) => setLocalPrefs({ ...localPrefs, email_frequency: value as any })}
              disabled={!localPrefs.email_enabled}
            >
              <SelectTrigger id="email_frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant (as they happen)</SelectItem>
                <SelectItem value="daily">Daily digest (9 AM)</SelectItem>
                <SelectItem value="weekly">Weekly digest (Monday 9 AM)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how often you want to receive email notifications
            </p>
          </div>

          <Separator />

          <NotificationToggle
            id="email_digest"
            label="Use Email Digest"
            description="Group multiple notifications into a single email"
            checked={localPrefs.email_digest ?? false}
            onCheckedChange={(checked) => handleToggle("email_digest", checked)}
            disabled={!localPrefs.email_enabled || localPrefs.email_frequency === "instant"}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper component for notification toggles
interface NotificationToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className={cn("cursor-pointer", disabled && "opacity-50")}>
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
