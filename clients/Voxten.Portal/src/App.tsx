import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getApiAccessToken } from "@/auth/tokenManager";
import { hasAnyRole, hasPortalAccessRole, isClinicianOnlyUser } from "@/auth/roles";
import { buildCurrentUser } from "@/auth/currentUser";
import { useAppStore } from "@/stores/appStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import PatientCases from "./pages/PatientCases";
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
import Unauthorized from "./pages/Unauthorized";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

function AuthStateSync() {
  const { accounts, instance } = useMsal();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  useEffect(() => {
    async function run() {
      const account = accounts[0] ?? instance.getActiveAccount() ?? null;
      if (account) {
        instance.setActiveAccount(account);
      }

      const apiToken = await getApiAccessToken();
      const user = buildCurrentUser(account, apiToken);
      setCurrentUser(user);
    }

    void run();
  }, [accounts, instance, setCurrentUser]);

  return null;
}

function RequireRoles({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const currentUser = useAppStore((s) => s.currentUser);
  const roles = currentUser?.roles ?? [];
  const scopes = currentUser?.scopes ?? [];

  if (allowedRoles.length === 0 || hasAnyRole(roles, allowedRoles)) {
    return <>{children}</>;
  }

  const scopeFallback = allowedRoles.some((role) => {
    if (role === "Voxten.Admin") return scopes.includes("Governance.Write") || scopes.includes("ACS.Access");
    if (role === "Voxten.Security") return scopes.includes("Governance.Write");
    if (role === "Voxten.Compliance" || role === "Voxten.Clinical" || role === "Voxten.ReadOnly") {
      return scopes.includes("Governance.Read");
    }
    return false;
  });
  if (scopeFallback) return <>{children}</>;

  return <Navigate to="/unauthorized" replace />;
}

function ProtectedRoutes() {
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useAppStore((s) => s.currentUser);
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roles = currentUser?.roles ?? [];
  if (!hasPortalAccessRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const isClinicianOnly = isClinicianOnlyUser(currentUser);

  return (
    <AppLayout>
      <Routes>
        <Route path="dashboard" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <Dashboard />} />
        <Route path="messages" element={<Messages />} />
        <Route path="patients" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <PatientCases />} />
        <Route path="ehr-integration" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <EHRIntegration />} />
        <Route path="policy-engine" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <PolicyEngine />} />
        <Route path="ai-governance" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <AIGovernance />} />
        <Route path="live-feed" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <LiveFeed />} />
        <Route path="video-sessions" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <VideoSessions />} />
        <Route path="compliance" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <ComplianceReports />} />
        <Route path="regulations" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <RegulatoryCompliance />} />
        <Route path="audit-trail" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <AuditTrail />} />
        <Route path="azure-services" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <AzureServices />} />
        <Route
          path="organization"
          element={
            isClinicianOnly ? <Navigate to="/messages" replace /> : (
            <RequireRoles allowedRoles={["Voxten.Admin", "Voxten.Compliance"]}>
              <Organization />
            </RequireRoles>)
          }
        />
        <Route
          path="security"
          element={
            isClinicianOnly ? <Navigate to="/messages" replace /> : (
            <RequireRoles allowedRoles={["Voxten.Admin", "Voxten.Security"]}>
              <SecurityAdmin />
            </RequireRoles>)
          }
        />
        <Route path="data-governance" element={isClinicianOnly ? <Navigate to="/messages" replace /> : <DataGovernance />} />
        <Route
          path="api-webhooks"
          element={
            isClinicianOnly ? <Navigate to="/messages" replace /> : (
            <RequireRoles allowedRoles={["Voxten.Admin", "Voxten.Security"]}>
              <ApiWebhooks />
            </RequireRoles>)
          }
        />
        <Route
          path="settings"
          element={
            isClinicianOnly ? <Navigate to="/messages" replace /> : (
            <RequireRoles allowedRoles={["Voxten.Admin"]}>
              <SettingsPage />
            </RequireRoles>)
          }
        />
        <Route path="platform" element={<Navigate to={isClinicianOnly ? "/messages" : "/api-webhooks"} replace />} />
        <Route path="*" element={<Navigate to={isClinicianOnly ? "messages" : "dashboard"} replace />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthStateSync />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
