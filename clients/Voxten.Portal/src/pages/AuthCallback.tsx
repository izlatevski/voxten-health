import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { getApiAccessToken } from "@/auth/tokenManager";
import { buildCurrentUser } from "@/auth/currentUser";
import { useAppStore } from "@/stores/appStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const redirectResult = await instance.handleRedirectPromise();

      if (redirectResult?.account) {
        instance.setActiveAccount(redirectResult.account);
      }

      const account =
        redirectResult?.account ??
        accounts[0] ??
        instance.getActiveAccount() ??
        null;
      if (account) {
        instance.setActiveAccount(account);
      }

      const apiToken = await getApiAccessToken();
      const user = buildCurrentUser(account, apiToken);
      setCurrentUser(user);

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
