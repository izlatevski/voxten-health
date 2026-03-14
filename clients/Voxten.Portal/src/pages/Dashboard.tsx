import { useAppStore, personas, personaOrder } from '@/stores/appStore';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { CISODashboard } from '@/components/dashboard/CISODashboard';
import { ClinicalDashboard } from '@/components/dashboard/ClinicalDashboard';
import { FinancialDashboard } from '@/components/dashboard/FinancialDashboard';
import { EndUserDashboard } from '@/components/dashboard/EndUserDashboard';
import { useEHRStore } from '@/stores/ehrStore';
import { hasAnyRole, isClinicianOnlyUser, isPrivilegedPortalUser } from '@/auth/roles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PersonaId } from '@/stores/appStore';

const dashboardComponents: Record<PersonaId, React.ComponentType> = {
  patricia: ComplianceDashboard,
  david: CISODashboard,
  rivera: ClinicalDashboard,
  jordan: FinancialDashboard,
  maria: EndUserDashboard,
};

function resolveDashboardPersona(
  user: ReturnType<typeof useAppStore.getState>['currentUser'],
  fallback: PersonaId,
): PersonaId {
  const roles = user?.roles ?? [];
  if (hasAnyRole(roles, ['Admin', 'Compliance']) || isPrivilegedPortalUser(user)) return 'patricia';
  if (hasAnyRole(roles, ['Security'])) return 'david';
  if (isClinicianOnlyUser(user)) return 'maria';
  if (hasAnyRole(roles, ['Clinician'])) return 'rivera';
  return fallback;
}

export default function Dashboard() {
  const { currentPersona, currentUser, setPersona } = useAppStore();
  const demoMode = useEHRStore((s) => s.demoMode);
  const effectivePersona = demoMode
    ? currentPersona
    : resolveDashboardPersona(currentUser, currentPersona);
  const persona = personas[effectivePersona];
  const DashboardView = dashboardComponents[effectivePersona];

  return (
    <div className="space-y-4">
      {/* Header with View As */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {effectivePersona === 'maria' ? 'Secure Messaging' : 'Command Center'}
            {effectivePersona === 'david' && ' — Security & Infrastructure'}
            {effectivePersona === 'rivera' && ' — Clinical Communications'}
            {effectivePersona === 'jordan' && ' — Client Communications'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {effectivePersona === 'patricia' && 'Communication governance overview — all channels, all regulations, real time.'}
            {effectivePersona === 'david' && 'Platform health, encryption posture, and security operations.'}
            {effectivePersona === 'rivera' && 'Secure messaging, clinical alerts, and care team coordination.'}
            {effectivePersona === 'jordan' && 'Compliant client engagement across all channels.'}
            {effectivePersona === 'maria' && 'Your care team conversations and alerts.'}
          </p>
        </div>
        {demoMode && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-muted-foreground hidden md:block">Viewing as:</span>
            <Select value={currentPersona} onValueChange={(v) => setPersona(v as PersonaId)}>
              <SelectTrigger className="h-7 text-[11px] w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {personaOrder.map((pid) => {
                  const p = personas[pid];
                  return (
                    <SelectItem key={pid} value={pid} className="text-xs">
                      {p.name} — {p.shortLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DashboardView />
    </div>
  );
}
