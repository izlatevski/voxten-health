import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore, personas, personaOrder } from '@/stores/appStore';
import { useEHRStore } from '@/stores/ehrStore';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  Scale,
  Activity,
  MessageSquare,
  FileSearch,
  BarChart3,
  Database,
  Bot,
  Server,
  Webhook,
  Building2,
  Lock,
  Joystick,
  Users,
  ChevronDown,
  ChevronRight,
  Video,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badgeCount?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar, currentPersona } = useAppStore();
  const { alerts } = useEHRStore();
  const location = useLocation();
  const navigate = useNavigate();
  const persona = personas[currentPersona];

  const activeAlerts = alerts.filter((a) => !a.collapsed && !a.acknowledged).length;

  const navGroups: NavGroup[] = [
    {
      title: 'COMMAND CENTER',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/live-feed', label: 'Live Feed', icon: Radio },
        { path: '/escalations', label: 'Alerts & Escalations', icon: AlertTriangle, badgeCount: activeAlerts },
      ],
    },
    {
      title: 'GOVERNANCE',
      items: [
        { path: '/policy-engine', label: 'Policy Engine', icon: ShieldCheck },
        { path: '/ai-governance', label: 'AI Governance', icon: Bot },
      ],
    },
    {
      title: 'COMMUNICATIONS',
      items: [
        { path: '/messages', label: 'Governed Threads', icon: MessageSquare, badgeCount: 4 },
        { path: '/video-sessions', label: 'Video Sessions', icon: Video },
        { path: '/patients', label: 'Patient Cases', icon: Users },
      ],
    },
    {
      title: 'COMPLIANCE & AUDIT',
      items: [
        { path: '/audit-trail', label: 'Audit Trail', icon: FileSearch },
        { path: '/compliance', label: 'Reports', icon: BarChart3 },
        { path: '/regulations', label: 'Regulatory Posture', icon: Scale },
        { path: '/data-governance', label: 'Data Governance', icon: Database },
      ],
    },
    {
      title: 'INTEGRATION',
      items: [
        { path: '/ehr-integration', label: 'EHR Integration', icon: Activity },
        { path: '/azure-services', label: 'Azure Services', icon: Server },
        { path: '/api-webhooks', label: 'API & Webhooks', icon: Webhook },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { path: '/organization', label: 'Organization', icon: Building2 },
        { path: '/security', label: 'Security', icon: Lock },
        { path: '/settings', label: 'Demo Controls', icon: Joystick },
      ],
    },
  ];

  const activeGroupIndex = navGroups.findIndex((g) =>
    g.items.some((item) => location.pathname === item.path)
  );

  const [openGroup, setOpenGroup] = useState<number>(activeGroupIndex >= 0 ? activeGroupIndex : 0);

  const toggleGroup = (idx: number) => {
    setOpenGroup(openGroup === idx ? -1 : idx);
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen sticky top-0 z-30',
        sidebarCollapsed ? 'w-14' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-12 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-secondary-foreground font-bold text-xs">V</span>
        </div>
        {!sidebarCollapsed && (
          <h1 className="font-semibold text-sidebar-primary text-sm tracking-wide">VOXTEN</h1>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 py-1 px-1.5 overflow-y-auto">
        {navGroups.map((group, gIdx) => {
          const isOpen = sidebarCollapsed || openGroup === gIdx;
          const hasActiveItem = group.items.some((item) => location.pathname === item.path);

          return (
            <div key={group.title} className="mt-1.5">
              {!sidebarCollapsed ? (
                <button
                  onClick={() => toggleGroup(gIdx)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors rounded',
                    hasActiveItem ? 'text-sidebar-primary' : 'text-sidebar-muted/60 hover:text-sidebar-muted'
                  )}
                >
                  <span>{group.title}</span>
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              ) : (
                <div className="h-px bg-sidebar-border mx-1.5 my-1" />
              )}

              {isOpen && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[12px] font-medium transition-colors relative',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-secondary" />
                        )}
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        {!sidebarCollapsed && item.badgeCount != null && item.badgeCount > 0 && (
                          <span className={cn(
                            'ml-auto w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0',
                            item.path === '/escalations'
                              ? 'bg-stat text-stat-foreground'
                              : 'bg-sidebar-ring/20 text-sidebar-ring'
                          )}>
                            {item.badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info + Collapse */}
      <div className="border-t border-sidebar-border p-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-accent-foreground text-[9px] font-semibold">{persona.initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-sidebar-primary truncate">{persona.name}</p>
              <p className="text-[9px] text-sidebar-muted truncate">{persona.shortLabel}</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded text-sidebar-muted hover:text-sidebar-primary hover:bg-sidebar-accent/50 transition-colors"
        >
          {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!sidebarCollapsed && <span className="text-[11px]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
