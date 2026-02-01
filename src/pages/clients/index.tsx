/**
 * Clients List Page
 */

import { useEffect } from "react";
import { Link } from "react-router";
import { useProjects } from "@/store/project.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Mail, Phone, Building2, User } from "lucide-react";
import { format } from "date-fns";

export function ClientsPage() {
  const { clients, loading, fetchClients } = useProjects();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Clients</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Manage your client relationships</p>
        </div>
        <Button asChild size="sm" className="sm:size-default">
          <Link to="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Link>
        </Button>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No clients yet</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Start by adding your first client to track projects
            </p>
            <Button asChild>
              <Link to="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
                  <span className="truncate">{client.name}</span>
                </CardTitle>
                {client.company && (
                  <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
                    <Building2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{client.company}</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <a
                      href={`mailto:${client.email}`}
                      className="truncate hover:text-primary hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:text-primary hover:underline"
                      >
                        {client.phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="pt-2 text-xs text-muted-foreground sm:pt-3">
                  Added {format(new Date(client.created_at), "MMM d, yyyy")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
