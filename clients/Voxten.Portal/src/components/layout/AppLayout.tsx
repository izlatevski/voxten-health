import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { SmartLaunchOverlay } from '@/components/ehr/SmartLaunchOverlay';
import { DemoToolbar } from '@/components/ehr/DemoToolbar';
import { useEHRStore } from '@/stores/ehrStore';
import { useLocation } from 'react-router-dom';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const demoMode = useEHRStore((s) => s.demoMode);
  const location = useLocation();
  const isMessagesRoute = location.pathname === '/messages';
  const showDemoToolbar = demoMode && !isMessagesRoute;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SmartLaunchOverlay />
      <AppSidebar />
      <div className="flex h-full flex-col flex-1 min-w-0">
        <TopBar />
        <main className={`flex-1 min-h-0 ${isMessagesRoute ? 'p-0 overflow-hidden' : 'p-4 overflow-y-auto'} ${showDemoToolbar ? 'pb-16' : ''}`}>
          {children}
        </main>
      </div>
      {showDemoToolbar && <DemoToolbar />}
    </div>
  );
}
