/**
 * Archive Project Button
 */

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

interface ArchiveButtonProps {
  projectId: string;
  archived: boolean;
  onUpdate?: () => void;
}

export function ArchiveButton({ projectId, archived, onUpdate }: ArchiveButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleArchive = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          archived: !archived,
          archived_at: !archived ? new Date().toISOString() : null,
        })
        .eq("id", projectId);

      if (error) throw error;

      toast.success(archived ? "Project restored" : "Project archived");
      setOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error toggling archive:", error);
      toast.error("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={archived ? "default" : "outline"} size="sm" className="gap-2">
          {archived ? (
            <>
              <ArchiveRestore className="h-4 w-4" />
              Restore
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              Archive
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {archived ? "Restore Project?" : "Archive Project?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {archived
              ? "This project will be restored and visible in your active projects list."
              : "This project will be hidden from your active projects list. You can restore it later."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={toggleArchive} disabled={loading}>
            {loading ? "Processing..." : archived ? "Restore" : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
