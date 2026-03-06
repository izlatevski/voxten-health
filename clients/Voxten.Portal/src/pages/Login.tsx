import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Shield, Lock } from "lucide-react";
import { isEntraConfigured, loginRequest } from "@/auth/entra";

export default function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const signIn = async () => {
    await instance.loginRedirect(loginRequest);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">VOXTEN Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Healthcare Communication Compliance Platform</p>
        </div>

        {!isEntraConfigured ? (
          <div className="rounded-lg border border-stat/20 bg-stat/10 p-4 text-sm text-stat">
            Entra ID is not configured. Set `VITE_ENTRA_CLIENT_ID` and tenant settings in your `.env` file.
          </div>
        ) : (
          <button
            onClick={signIn}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Sign In with Microsoft
          </button>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-success">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">HIPAA-Compliant Secure Access</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Authentication handled by Microsoft Entra ID</span>
          </div>
        </div>
      </div>
    </div>
  );
}
