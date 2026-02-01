/**
 * Topbar Component
 */

import { useAuth } from "@/store/auth.store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/common/global-search";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Topbar() {
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4 md:ml-0 ml-14">
        <h2 className="hidden text-base font-semibold sm:block sm:text-lg">Welcome back!</h2>
      </div>

      <div className="flex flex-1 items-center px-2 sm:px-0 sm:justify-start md:max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
