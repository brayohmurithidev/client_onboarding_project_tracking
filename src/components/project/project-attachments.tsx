/**
 * Project Attachments Component
 * Upload and manage project files with drag & drop
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ProjectAttachment } from "@/types/database.types";

const STORAGE_BUCKET = "project-attachments";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface ProjectAttachmentsProps {
  projectId: string;
}

export function ProjectAttachments({ projectId }: ProjectAttachmentsProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [projectId]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("project_attachments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      toast.error("Failed to load attachments");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [projectId]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!user) return;

    // Validate file sizes
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(
        `File(s) too large: ${oversizedFiles.map((f) => f.name).join(", ")}. Max size: 50MB`
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Create attachment record
        const { error: dbError } = await supabase.from("project_attachments").insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: fileName,
        });

        if (dbError) throw dbError;

        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(
        files.length === 1 ? "File uploaded" : `${files.length} files uploaded`
      );
      fetchAttachments();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadFile = async (attachment: ProjectAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(attachment.storage_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("File downloaded");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const deleteAttachment = async (attachment: ProjectAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([attachment.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("project_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      toast.success("File deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const totalSize = attachments.reduce((sum, a) => sum + a.file_size, 0);

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
          <h3 className="text-sm font-medium">Attachments</h3>
          <p className="text-xs text-muted-foreground">
            {attachments.length} file{attachments.length !== 1 ? "s" : ""} • {formatFileSize(totalSize)}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Uploading files...</p>
              <Progress value={uploadProgress} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Max file size: 50MB per file
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDownload={downloadFile}
              onDelete={deleteAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Attachment Item Component
function AttachmentItem({
  attachment,
  onDownload,
  onDelete,
}: {
  attachment: ProjectAttachment;
  onDownload: (attachment: ProjectAttachment) => void;
  onDelete: (attachment: ProjectAttachment) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(attachment);
    setDeleting(false);
  };

  return (
    <div className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{getFileIcon(attachment.file_type)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.file_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(attachment.file_size)}</span>
            <span>•</span>
            <span>{format(new Date(attachment.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(attachment)}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="h-8 w-8 p-0"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper Functions
function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  } else if (fileType.startsWith("video/")) {
    return <Video className="h-5 w-5 text-purple-500" />;
  } else if (fileType.startsWith("audio/")) {
    return <Music className="h-5 w-5 text-green-500" />;
  } else if (
    fileType.includes("pdf") ||
    fileType.includes("document") ||
    fileType.includes("text")
  ) {
    return <FileText className="h-5 w-5 text-orange-500" />;
  } else if (
    fileType.includes("zip") ||
    fileType.includes("compressed") ||
    fileType.includes("archive")
  ) {
    return <Archive className="h-5 w-5 text-gray-500" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
