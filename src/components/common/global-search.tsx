/**
 * Global Search Component
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useProjects } from "@/store/project.store";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, FolderKanban, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database.types";

const statusColors: Record<ProjectStatus, string> = {
  onboarding: "bg-blue-500/10 text-blue-700",
  active: "bg-green-500/10 text-green-700",
  blocked: "bg-red-500/10 text-red-700",
  completed: "bg-gray-500/10 text-gray-700",
  maintenance: "bg-yellow-500/10 text-yellow-700",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { projects, clients, fetchProjects, fetchClients } = useProjects();

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchProjects(), fetchClients()]).finally(() => {
        setLoading(false);
      });
    }
  }, [open, fetchProjects, fetchClients]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter results based on search
  const filteredProjects = projects.filter((project) => {
    const searchLower = search.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.client.name.toLowerCase().includes(searchLower) ||
      project.client.company?.toLowerCase().includes(searchLower) ||
      project.status.toLowerCase().includes(searchLower)
    );
  });

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64",
          "border-muted bg-muted/50 hover:bg-muted/80 shadow-none",
          "px-3 py-2"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search projects, clients..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No results found.</CommandEmpty>

                  {filteredProjects.length > 0 && (
                    <CommandGroup heading="Projects">
                      {filteredProjects.slice(0, 8).map((project) => (
                        <CommandItem
                          key={project.id}
                          value={`project-${project.id}`}
                          onSelect={() =>
                            handleSelect(() => navigate(`/projects/${project.id}`))
                          }
                        >
                          <FolderKanban className="mr-2 h-4 w-4" />
                          <div className="flex flex-1 items-center justify-between gap-2">
                            <div className="flex-1 truncate">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {project.client.name}
                                {project.client.company && ` • ${project.client.company}`}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(statusColors[project.status], "text-xs")}
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {filteredClients.length > 0 && (
                    <CommandGroup heading="Clients">
                      {filteredClients.slice(0, 5).map((client) => (
                        <CommandItem
                          key={client.id}
                          value={`client-${client.id}`}
                          onSelect={() => handleSelect(() => navigate("/clients"))}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {client.company || client.email}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
