import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { PatientBanner } from '@/components/ehr/PatientBanner';
import { SmartLaunchOverlay } from '@/components/ehr/SmartLaunchOverlay';
import { ClinicalAlertSystem, useAlertTriggers } from '@/components/ehr/ClinicalAlertSystem';
import { DemoToolbar } from '@/components/ehr/DemoToolbar';
import { useEHRStore } from '@/stores/ehrStore';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const demoMode = useEHRStore((s) => s.demoMode);

  useAlertTriggers();

  return (
    <div className="flex min-h-screen bg-background">
      <SmartLaunchOverlay />
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <ClinicalAlertSystem />
        <PatientBanner />
        <main className={`flex-1 p-4 ${demoMode ? 'pb-16' : ''}`}>
          {children}
        </main>
      </div>
      <DemoToolbar />
    </div>
  );
}
