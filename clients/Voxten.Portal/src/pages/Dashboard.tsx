import { useAppStore, personas, personaOrder } from '@/stores/appStore';
import { PolicyEngineStatus } from '@/components/dashboard/PolicyEngineStatus';
import { ViolationHeatmap } from '@/components/dashboard/ViolationHeatmap';
import { AIGovernanceSpotlight } from '@/components/dashboard/AIGovernanceSpotlight';
import { AzureInfraHealth } from '@/components/dashboard/AzureInfraHealth';
import { ChannelGovernance } from '@/components/dashboard/ChannelGovernance';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { CISODashboard } from '@/components/dashboard/CISODashboard';
import { ClinicalDashboard } from '@/components/dashboard/ClinicalDashboard';
import { FinancialDashboard } from '@/components/dashboard/FinancialDashboard';
import { EndUserDashboard } from '@/components/dashboard/EndUserDashboard';
import { Badge } from '@/components/ui/badge';
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

export default function Dashboard() {
  const { currentPersona, setPersona } = useAppStore();
  const persona = personas[currentPersona];
  const DashboardView = dashboardComponents[currentPersona];

  return (
    <div className="space-y-4">
      {/* Header with View As */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {currentPersona === 'maria' ? 'Secure Messaging' : 'Command Center'}
            {currentPersona === 'david' && ' — Security & Infrastructure'}
            {currentPersona === 'rivera' && ' — Clinical Communications'}
            {currentPersona === 'jordan' && ' — Client Communications'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentPersona === 'patricia' && 'Communication governance overview — all channels, all regulations, real time.'}
            {currentPersona === 'david' && 'Platform health, encryption posture, and security operations.'}
            {currentPersona === 'rivera' && 'Secure messaging, clinical alerts, and care team coordination.'}
            {currentPersona === 'jordan' && 'Compliant client engagement across all channels.'}
            {currentPersona === 'maria' && 'Your care team conversations and alerts.'}
          </p>
        </div>
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
      </div>

      <DashboardView />
    </div>
  );
}
