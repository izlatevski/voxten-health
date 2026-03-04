import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import PatientCases from "./pages/PatientCases";
import Escalations from "./pages/Escalations";
import ComplianceReports from "./pages/Compliance";
import RegulatoryCompliance from "./pages/RegulatoryCompliance";
import EHRIntegration from "./pages/EHRIntegration";
import PolicyEngine from "./pages/PolicyEngine";
import AIGovernance from "./pages/AIGovernance";
import LiveFeed from "./pages/LiveFeed";
import VideoSessions from "./pages/VideoSessions";
import SettingsPage from "./pages/Settings";
import AuditTrail from "./pages/AuditTrail";
import AzureServices from "./pages/AzureServices";
import Organization from "./pages/Organization";
import SecurityAdmin from "./pages/SecurityAdmin";
import DataGovernance from "./pages/DataGovernance";
import ApiWebhooks from "./pages/ApiWebhooks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="messages" element={<Messages />} />
        <Route path="patients" element={<PatientCases />} />
        <Route path="escalations" element={<Escalations />} />
        <Route path="ehr-integration" element={<EHRIntegration />} />
        <Route path="policy-engine" element={<PolicyEngine />} />
        <Route path="ai-governance" element={<AIGovernance />} />
        <Route path="live-feed" element={<LiveFeed />} />
        <Route path="video-sessions" element={<VideoSessions />} />
        <Route path="compliance" element={<ComplianceReports />} />
        <Route path="regulations" element={<RegulatoryCompliance />} />
        <Route path="audit-trail" element={<AuditTrail />} />
        <Route path="azure-services" element={<AzureServices />} />
        <Route path="organization" element={<Organization />} />
        <Route path="security" element={<SecurityAdmin />} />
        <Route path="data-governance" element={<DataGovernance />} />
        <Route path="api-webhooks" element={<ApiWebhooks />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Redirect old routes */}
        <Route path="platform" element={<Navigate to="/api-webhooks" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
