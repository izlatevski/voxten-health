import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useEHRStore, type EHRAlert } from '@/stores/ehrStore';
import { AlertTriangle, Bed, Pill, Lock, X, CheckCircle, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const alertConfig = {
  critical_lab: { icon: AlertTriangle, label: 'Critical Lab', iconColor: 'text-stat' },
  adt_transfer: { icon: Bed, label: 'Patient Movement', iconColor: 'text-urgent' },
  med_admin: { icon: Pill, label: 'Med Admin', iconColor: 'text-primary' },
  part2_restriction: { icon: Lock, label: 'Part 2 Restriction', iconColor: 'text-ehr-part2' },
};

function AlertRow({ alert }: { alert: EHRAlert }) {
  const { acknowledgeAlert, collapseAlert } = useEHRStore();
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <Icon className={cn('w-4 h-4 flex-shrink-0', config.iconColor)} />
      <Badge variant="outline" className="text-[9px] h-4 px-1.5 flex-shrink-0">{config.label}</Badge>
      <span className="text-xs text-foreground truncate flex-1">{alert.content}</span>
      <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono flex-shrink-0">{alert.source}</Badge>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">{alert.timestamp}</span>
      {!alert.acknowledged ? (
        <button
          onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id); toast.success('Alert acknowledged'); }}
          className="text-[10px] font-medium text-primary hover:underline flex-shrink-0"
        >
          Acknowledge
        </button>
      ) : (
        <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
      )}
      <button onClick={(e) => { e.stopPropagation(); collapseAlert(alert.id); }} className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

export function ClinicalAlertSystem() {
  const { alerts } = useEHRStore();
  const [expanded, setExpanded] = useState(false);

  // Filter out dismissed (collapsed) alerts
  const visibleAlerts = alerts.filter((a) => !a.collapsed);
  if (visibleAlerts.length === 0) return null;

  // Group by type for summary
  const grouped = visibleAlerts.reduce<Record<string, number>>((acc, a) => {
    const label = alertConfig[a.type].label;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const hasCritical = visibleAlerts.some((a) => a.priority === 'critical');
  const summaryParts = Object.entries(grouped).map(([label, count]) => `${count} ${label}${count > 1 ? 's' : ''}`);

  return (
    <div>
      {/* Compact summary bar — max 36px */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-4 h-9 text-left transition-colors',
          hasCritical ? 'bg-stat/8 border-b border-stat/15' : 'bg-urgent/8 border-b border-urgent/15'
        )}
      >
        <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0', hasCritical ? 'text-stat' : 'text-urgent')} />
        <span className={cn('text-xs font-semibold flex-shrink-0', hasCritical ? 'text-stat' : 'text-urgent')}>
          {visibleAlerts.length} Active Alert{visibleAlerts.length > 1 ? 's' : ''}:
        </span>
        <span className="text-xs text-foreground truncate">
          {summaryParts.join(' · ')}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground font-medium flex-shrink-0">
          {expanded ? 'Hide' : 'View All'}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {/* Expanded alert list */}
      {expanded && (
        <div className="bg-card border-b border-border max-h-64 overflow-y-auto">
          {visibleAlerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

export function useAlertTriggers() {
  const { addAlert, part2Active, demoMode } = useEHRStore();

  const fireCriticalLab = useCallback(() => {
    addAlert({
      id: `alert-lab-${Date.now()}`,
      type: 'critical_lab',
      content: 'CRITICAL LAB RESULT | K+ 6.8 mEq/L | Patient: Martinez, Robert',
      source: 'Epic Lab Interface | ORU^R01',
      timestamp: new Date().toLocaleTimeString(),
      acknowledged: false,
      collapsed: false,
      priority: 'critical',
    });
    toast.error('Critical Lab Result — K+ 6.8 mEq/L', { duration: 5000 });
  }, [addAlert]);

  const firePatientTransfer = useCallback(() => {
    addAlert({
      id: `alert-adt-${Date.now()}`,
      type: 'adt_transfer',
      content: 'PATIENT MOVEMENT | Martinez, Robert transferred from 4-North 412A to ICU Bed 7 | ADT^A02',
      source: 'Epic ADT | ADT^A02',
      timestamp: new Date().toLocaleTimeString(),
      acknowledged: false,
      collapsed: false,
      priority: 'warning',
    });
    toast.warning('Patient Transfer — Martinez moved to ICU Bed 7');
  }, [addAlert]);

  const fireMedAdmin = useCallback(() => {
    addAlert({
      id: `alert-med-${Date.now()}`,
      type: 'med_admin',
      content: 'MED ADMIN | IV Furosemide 40mg administered | Nurse: M. Torres',
      source: 'Epic MAR | RAS^O17',
      timestamp: new Date().toLocaleTimeString(),
      acknowledged: false,
      collapsed: false,
      priority: 'info',
    });
    toast.info('Medication Administered — IV Furosemide 40mg');
  }, [addAlert]);

  const firePart2 = useCallback(() => {
    if (!part2Active) return;
    addAlert({
      id: `alert-part2-${Date.now()}`,
      type: 'part2_restriction',
      content: 'RESTRICTED DATA | Substance use assessment results available but restricted under 42 CFR Part 2. Consent required.',
      source: 'VOXTEN Compliance Engine',
      timestamp: new Date().toLocaleTimeString(),
      acknowledged: false,
      collapsed: false,
      priority: 'restricted',
    });
  }, [addAlert, part2Active]);

  const firedRef = useRef(false);
  useEffect(() => {
    if (demoMode || firedRef.current) return;
    firedRef.current = true;
    const t1 = setTimeout(fireCriticalLab, 8000);
    const t2 = setTimeout(firePatientTransfer, 20000);
    const t3 = setTimeout(fireMedAdmin, 35000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [demoMode, fireCriticalLab, firePatientTransfer, fireMedAdmin]);

  return { fireCriticalLab, firePatientTransfer, fireMedAdmin, firePart2 };
}
