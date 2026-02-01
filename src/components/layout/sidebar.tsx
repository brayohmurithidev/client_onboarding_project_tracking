/**
 * Sidebar Navigation Component
 */

import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  Menu,
  X,
  FileText,
  Building2,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth.store";
import { useState } from "react";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "My Tasks", href: "/my-tasks", icon: CheckSquare },
  { name: "Team", href: "/team", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
];

interface SidebarContentProps {
  isActive: (href: string) => boolean;
  handleSignOut: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

function SidebarContent({ isActive, handleSignOut, setMobileMenuOpen }: SidebarContentProps) {
  return (
    <>
      <div className="flex h-16 items-center border-b pl-16 pr-6 md:px-6">
        <h1 className="text-xl font-bold text-primary">Project Tracker</h1>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 h-full w-64 border-r bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              isActive={isActive}
              handleSignOut={handleSignOut}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 flex-col border-r bg-background md:flex">
        <SidebarContent
          isActive={isActive}
          handleSignOut={handleSignOut}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </aside>
    </>
  );
}
