import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-stat/10 text-stat mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          Your Entra account is authenticated but does not have the required role for this page.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
