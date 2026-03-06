import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { SmartLaunchOverlay } from '@/components/ehr/SmartLaunchOverlay';
import { DemoToolbar } from '@/components/ehr/DemoToolbar';
import { useEHRStore } from '@/stores/ehrStore';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const demoMode = useEHRStore((s) => s.demoMode);

  return (
    <div className="flex min-h-screen bg-background">
      <SmartLaunchOverlay />
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className={`flex-1 p-4 ${demoMode ? 'pb-16' : ''}`}>
          {children}
        </main>
      </div>
      <DemoToolbar />
    </div>
  );
}
