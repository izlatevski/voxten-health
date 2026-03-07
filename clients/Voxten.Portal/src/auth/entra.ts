import { LogLevel, PublicClientApplication, type RedirectRequest } from "@azure/msal-browser";

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID ?? "common";
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID ?? "";
const apiClientId = import.meta.env.VITE_ENTRA_API_CLIENT_ID ?? "";
const authority = import.meta.env.VITE_ENTRA_AUTHORITY ?? `https://login.microsoftonline.com/${tenantId}`;
const redirectUri = import.meta.env.VITE_ENTRA_REDIRECT_URI ?? `${window.location.origin}/auth/callback`;
const postLogoutRedirectUri = import.meta.env.VITE_ENTRA_POST_LOGOUT_REDIRECT_URI ?? window.location.origin;


function normalizeScope(scope: string): string {
  const trimmed = scope.trim();
  if (!trimmed) return "";

  const cleaned = trimmed.replace(/^\/+/, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("api://") || cleaned.includes("://")) return cleaned;
  if (!apiClientId) return trimmed;
  return `api://${apiClientId}/${cleaned}`;
}

const scopes = (import.meta.env.VITE_ENTRA_SCOPES ?? "openid,profile,email")
  .split(/[,\s]+/)
  .map(normalizeScope)
  .filter(Boolean);

export const isEntraConfigured = Boolean(clientId);

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority,
    redirectUri,
    postLogoutRedirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: () => undefined,
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
});

export const loginRequest: RedirectRequest = {
  scopes,
};

export const SESSION_JWT_KEY = "voxten.auth.jwt";
