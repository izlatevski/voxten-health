import { useEffect } from 'react';
import { useEHRStore } from '@/stores/ehrStore';
import { useAppStore, personas, personaOrder, type PersonaId } from '@/stores/appStore';
import { useAlertTriggers } from './ClinicalAlertSystem';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import {
  Zap,
  FlaskConical,
  Bed,
  Pill,
  FileText,
  Shield,
  WifiOff,
  Wifi,
  RotateCcw,
  Loader2,
  Users,
} from 'lucide-react';

export function DemoToolbar() {
  const {
    demoMode,
    connectionStatus,
    setConnectionStatus,
    setSmartLaunchComplete,
    togglePart2,
    part2Active,
    clearAlerts,
    updateLastSync,
    setEncounterLocation,
  } = useEHRStore();

  const { currentPersona, setPersona } = useAppStore();
  const { fireCriticalLab, firePatientTransfer, fireMedAdmin, firePart2 } = useAlertTriggers();
  const [recovering, setRecovering] = useState(false);

  const handleEHRDown = useCallback(() => {
    setConnectionStatus('offline');
    toast.error('Epic connection lost. VOXTEN continuing on independent infrastructure.', { duration: 6000 });
  }, [setConnectionStatus]);

  const handleRestoreEHR = useCallback(() => {
    setRecovering(true);
    const steps = [
      { msg: 'Reconnecting to FHIR endpoint...', delay: 1000 },
      { msg: 'Syncing 12 queued messages to Epic...', delay: 1500 },
      { msg: 'Updating patient context...', delay: 1000 },
    ];
    let total = 0;
    steps.forEach((step) => {
      total += step.delay;
      setTimeout(() => toast.info(step.msg), total - step.delay);
    });
    setTimeout(() => {
      setConnectionStatus('connected');
      updateLastSync();
      setRecovering(false);
      toast.success('All clear — EHR Connected | 12 messages synced', { duration: 6000 });
    }, total + 500);
  }, [setConnectionStatus, updateLastSync]);

  const handleSmartLaunch = useCallback(() => {
    setSmartLaunchComplete(false);
  }, [setSmartLaunchComplete]);

  const handleResetAll = useCallback(() => {
    clearAlerts();
    setConnectionStatus('connected');
    updateLastSync();
    setEncounterLocation('4-North, Rm 412, Bed A');
    toast('Demo state reset');
  }, [clearAlerts, setConnectionStatus, updateLastSync, setEncounterLocation]);

  // Keyboard shortcuts — including persona switching
  useEffect(() => {
    if (!demoMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < personaOrder.length) {
          e.preventDefault();
          setPersona(personaOrder[idx]);
          toast(`Switched to ${personas[personaOrder[idx]].name}`);
        }
        return;
      }
      if (!e.ctrlKey && !e.metaKey) return;
      switch (e.key) {
        case '1': e.preventDefault(); fireCriticalLab(); break;
        case '2': e.preventDefault(); firePatientTransfer(); break;
        case '3': e.preventDefault(); fireMedAdmin(); break;
        case '4': e.preventDefault(); handleEHRDown(); break;
        case '0': e.preventDefault(); handleResetAll(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [demoMode, fireCriticalLab, firePatientTransfer, fireMedAdmin, handleEHRDown, handleResetAll, setPersona]);

  if (!demoMode) return null;

  const eventButtons = [
    { label: 'SMART Launch', icon: Zap, action: handleSmartLaunch },
    { label: 'Critical Lab', icon: FlaskConical, action: fireCriticalLab },
    { label: 'Patient Transfer', icon: Bed, action: () => { firePatientTransfer(); setEncounterLocation('ICU Bed 7'); } },
    { label: 'Med Admin', icon: Pill, action: fireMedAdmin },
    { label: 'Part 2', icon: Shield, action: () => { togglePart2(); firePart2(); }, active: part2Active },
    { label: 'Video Session', icon: FileText, action: () => { toast.info('Telehealth session started: Dr. Rivera ↔ Martinez, Robert — Recording & Monitoring Active', { duration: 5000 }); } },
    { label: 'State License Flag', icon: Shield, action: () => { toast.warning('State licensing mismatch: Provider (CA) → Patient (NV). Verification required.', { duration: 6000 }); } },
    { label: connectionStatus === 'offline' ? 'Restore EHR' : 'EHR Down', icon: connectionStatus === 'offline' ? Wifi : WifiOff,
      action: connectionStatus === 'offline' ? handleRestoreEHR : handleEHRDown, disabled: recovering },
    { label: 'Reset', icon: RotateCcw, action: handleResetAll },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-foreground/90 backdrop-blur-sm border-t border-border px-4 py-1.5">
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-primary-foreground/70 font-medium mr-1">DEMO</span>

        {/* Persona switcher */}
        {personaOrder.map((pid, i) => (
          <button
            key={pid}
            onClick={() => { setPersona(pid); toast(`Switched to ${personas[pid].name}`); }}
            title={`${personas[pid].name} — ${personas[pid].title} (Ctrl+Shift+${i + 1})`}
            className={cn(
              'px-2 py-1 rounded text-[10px] font-medium transition-colors',
              currentPersona === pid
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
            )}
          >
            {personas[pid].initials}
          </button>
        ))}

        <div className="w-px h-4 bg-primary-foreground/20 mx-1" />

        {/* Event buttons */}
        {eventButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            disabled={btn.disabled}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors',
              btn.active
                ? 'bg-ehr-part2 text-primary-foreground'
                : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20',
              btn.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {btn.disabled ? <Loader2 className="w-3 h-3 animate-spin" /> : <btn.icon className="w-3 h-3" />}
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
