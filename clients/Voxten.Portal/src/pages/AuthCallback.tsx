import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { getSessionJwtToken, loginRequest, SESSION_JWT_KEY } from "@/auth/entra";
import { buildCurrentUser } from "@/auth/currentUser";
import { issueAcsTokenForUser, SESSION_ACS_USER_ID_KEY, SESSION_ACS_USER_TOKEN_KEY } from "@/lib/chatApi";
import { useAppStore } from "@/stores/appStore";

function firstNonEmpty(...values: Array<string | null>): string | null {
  for (const value of values) {
    if (value && value.trim()) return value;
  }
  return null;
}

function tokenFromUrl(url: URL): string | null {
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const queryParams = url.searchParams;

  return firstNonEmpty(
    queryParams.get("token"),
    queryParams.get("jwt"),
    queryParams.get("id_token"),
    queryParams.get("access_token"),
    hashParams.get("token"),
    hashParams.get("jwt"),
    hashParams.get("id_token"),
    hashParams.get("access_token"),
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const currentUrl = new URL(window.location.href);
      const redirectResult = await instance.handleRedirectPromise();

      if (redirectResult?.account) {
        instance.setActiveAccount(redirectResult.account);
      }

      const directToken = tokenFromUrl(currentUrl);
      const codeFlowToken =
        redirectResult?.accessToken || redirectResult?.idToken || null;
      const tokenToStore = codeFlowToken || directToken;

      if (tokenToStore) {
        sessionStorage.setItem(SESSION_JWT_KEY, tokenToStore);
      }

      const account =
        redirectResult?.account ??
        accounts[0] ??
        instance.getActiveAccount() ??
        null;

      const resolvedToken = tokenToStore || getSessionJwtToken();
      const user = buildCurrentUser(account, resolvedToken);
      setCurrentUser(user);

      if (account && !tokenToStore) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account,
          });

          if (tokenResponse.accessToken) {
            sessionStorage.setItem(SESSION_JWT_KEY, tokenResponse.accessToken);
            const refreshedUser = buildCurrentUser(account, tokenResponse.accessToken);
            setCurrentUser(refreshedUser);
          }
        } catch {
          // Silent token acquisition can fail on first login redirect; direct token parsing above is fallback.
        }
      }

      const finalUser = buildCurrentUser(
        account,
        getSessionJwtToken(),
      );
      if (finalUser?.oid && finalUser.tenantId) {
        try {
          const acsToken = await issueAcsTokenForUser({
            tenantId: finalUser.tenantId,
            entraUserId: finalUser.oid,
            includeVoip: false,
          });
          sessionStorage.setItem(SESSION_ACS_USER_TOKEN_KEY, acsToken.token);
          sessionStorage.setItem(SESSION_ACS_USER_ID_KEY, acsToken.userId);
        } catch {
          // ACS token provisioning is best-effort during login; chat screen handles missing token.
        }
      }

      if (!cancelled) {
        navigate("/dashboard", { replace: true });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [accounts, instance, navigate, setCurrentUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-sm text-muted-foreground">Finalizing secure sign-in...</div>
    </div>
  );
}
