import { useAppStore } from '@/stores/appStore';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMsal } from '@azure/msal-react';

function formatRole(role: string): string {
  return role.replace(/^Voxten\./, '').replace(/_/g, ' ');
}

export function TopBar() {
  const { currentUser } = useAppStore();
  const { instance } = useMsal();
  const displayName = currentUser?.displayName;
  const displayInitials = currentUser?.initials || 'EU';
  const displaySubline = currentUser?.email || currentUser?.jobTitle || 'Authenticated User';

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 gap-4 sticky top-0 z-20">
      {/* Left: Org + Environment */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-foreground hidden md:block">CommonSpirit Health</span>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] gap-1 h-5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          PRODUCTION
        </Badge>
      </div>

      {/* Center: Search */}
      <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 flex-1 max-w-xl">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search communications, policies, audit events..."
          className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-stat text-stat-foreground text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Menu with persona switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-[10px] font-semibold">{displayInitials}</span>
              </div>
              <span className="text-xs font-medium text-foreground hidden lg:block">{displayName}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs">
              <div className="font-medium text-foreground">{displayName}</div>
              <div className="text-[10px] text-muted-foreground truncate">{displaySubline}</div>
            </DropdownMenuLabel>
            {currentUser?.roles?.length ? (
              <div className="px-2 pb-2">
                <div className="text-[10px] text-muted-foreground mb-1">Role</div>
                <div className="flex flex-wrap gap-1">
                  {currentUser.roles.slice(0, 3).map((role) => (
                    <Badge key={role} variant="outline" className="text-[9px] h-4 px-1.5">
                      {formatRole(role)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              onClick={() => void instance.logoutRedirect()}
              className="w-full text-left px-2 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              Sign out
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
