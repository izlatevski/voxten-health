import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getSessionJwtToken } from "@/auth/entra";
import { hasAnyRole } from "@/auth/roles";
import { buildCurrentUser } from "@/auth/currentUser";
import { issueAcsTokenForUser, SESSION_ACS_USER_ID_KEY, SESSION_ACS_USER_TOKEN_KEY } from "@/lib/chatApi";
import { useAppStore } from "@/stores/appStore";
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
import Unauthorized from "./pages/Unauthorized";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

function AuthStateSync() {
  const { accounts } = useMsal();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const account = accounts[0] ?? null;
      const sessionToken = getSessionJwtToken();
      const user = buildCurrentUser(account, sessionToken);
      setCurrentUser(user);

      if (!user?.oid || !user.tenantId || cancelled) return;
      if (sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY)) return;

      try {
        const token = await issueAcsTokenForUser({
          tenantId: user.tenantId,
          entraUserId: user.oid,
          includeVoip: false,
        });
        if (cancelled) return;
        sessionStorage.setItem(SESSION_ACS_USER_TOKEN_KEY, token.token);
        sessionStorage.setItem(SESSION_ACS_USER_ID_KEY, token.userId);
      } catch {
        // Best-effort sync; chat screen can reattempt after sign-in.
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [accounts, setCurrentUser]);

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
  if (!isAuthenticated) return <Navigate to="/login" replace />;

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
        <Route
          path="organization"
          element={
            <RequireRoles allowedRoles={["Voxten.Admin", "Voxten.Compliance"]}>
              <Organization />
            </RequireRoles>
          }
        />
        <Route
          path="security"
          element={
            <RequireRoles allowedRoles={["Voxten.Admin", "Voxten.Security"]}>
              <SecurityAdmin />
            </RequireRoles>
          }
        />
        <Route path="data-governance" element={<DataGovernance />} />
        <Route
          path="api-webhooks"
          element={
            <RequireRoles allowedRoles={["Voxten.Admin", "Voxten.Security"]}>
              <ApiWebhooks />
            </RequireRoles>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRoles allowedRoles={["Voxten.Admin"]}>
              <SettingsPage />
            </RequireRoles>
          }
        />
        <Route path="platform" element={<Navigate to="/api-webhooks" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
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
