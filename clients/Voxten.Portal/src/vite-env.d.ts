/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAT_API_BASE_URL?: string;
  readonly VITE_ACS_ENDPOINT?: string;
  readonly VITE_PORTAL_API_BASE_URL?: string;
  readonly VITE_ENTRA_CLIENT_ID?: string;
  readonly VITE_ENTRA_API_CLIENT_ID?: string;
  readonly VITE_ENTRA_TENANT_ID?: string;
  readonly VITE_ENTRA_AUTHORITY?: string;
  readonly VITE_ENTRA_REDIRECT_URI?: string;
  readonly VITE_ENTRA_POST_LOGOUT_REDIRECT_URI?: string;
  readonly VITE_ENTRA_SCOPES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
