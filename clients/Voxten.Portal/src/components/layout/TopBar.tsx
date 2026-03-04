import { useAppStore, personas, personaOrder, type PersonaId } from '@/stores/appStore';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { currentPersona, setPersona } = useAppStore();
  const persona = personas[currentPersona];

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
                <span className="text-primary text-[10px] font-semibold">{persona.initials}</span>
              </div>
              <span className="text-xs font-medium text-foreground hidden lg:block">{persona.name}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Persona</DropdownMenuLabel>
            {personaOrder.map((pid) => {
              const p = personas[pid];
              return (
                <DropdownMenuItem
                  key={pid}
                  onClick={() => setPersona(pid)}
                  className={cn('flex flex-col items-start gap-0 py-2', currentPersona === pid && 'bg-muted')}
                >
                  <span className="text-xs font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.title}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-muted-foreground">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
