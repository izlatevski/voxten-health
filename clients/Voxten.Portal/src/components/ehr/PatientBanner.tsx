import { useEHRStore } from '@/stores/ehrStore';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { FhirResourceViewer } from './FhirResourceViewer';

// Only show patient banner on clinical pages
const CLINICAL_ROUTES = ['/messages', '/patients', '/escalations'];

export function PatientBanner() {
  const { patient, encounter, connectionStatus, lastSync } = useEHRStore();
  const location = useLocation();
  const [fhirOpen, setFhirOpen] = useState(false);

  // Hide on non-clinical pages
  if (!CLINICAL_ROUTES.includes(location.pathname)) return null;

  const syncAgo = () => {
    const diff = Math.round((Date.now() - new Date(lastSync).getTime()) / 1000);
    return diff < 60 ? `${diff}s ago` : `${Math.round(diff / 60)}m ago`;
  };

  return (
    <>
      <div
        className={cn(
          'border-b border-border px-4 py-1.5 cursor-pointer transition-colors h-10 flex items-center',
          connectionStatus === 'offline' ? 'bg-stat/5' : 'bg-card'
        )}
        onClick={() => setFhirOpen(true)}
      >
        <div className="flex items-center gap-4 text-xs w-full">
          <span className="font-bold text-foreground text-sm">
            {patient.name.family.toUpperCase()}, {patient.name.given.toUpperCase()}
          </span>
          <span className="text-muted-foreground font-mono">{patient.mrn}</span>
          <span className="text-muted-foreground">{patient.age}y {patient.gender}</span>
          <span className="text-muted-foreground">{encounter.location}</span>
          <span className="text-muted-foreground flex items-center gap-1">
            <span className="text-stat">●</span> Allergies: {patient.allergies.join(', ')}
          </span>
          <span className="text-muted-foreground">{patient.codeStatus}</span>

          {/* EHR status — far right */}
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <span className={cn(
              'w-2 h-2 rounded-full',
              connectionStatus === 'connected' ? 'bg-success animate-pulse-subtle' :
              connectionStatus === 'degraded' ? 'bg-urgent' : 'bg-stat'
            )} />
            <span className={cn(
              'text-[11px] font-medium',
              connectionStatus === 'offline' ? 'text-stat' : 'text-success'
            )}>
              {connectionStatus === 'connected' ? 'Epic Connected' : connectionStatus === 'degraded' ? 'Sync Delayed' : 'EHR OFFLINE'}
            </span>
            {connectionStatus !== 'offline' && (
              <span className="text-[10px] text-muted-foreground">· {syncAgo()}</span>
            )}
          </div>
        </div>
      </div>

      <FhirResourceViewer open={fhirOpen} onClose={() => setFhirOpen(false)} />
    </>
  );
}
