import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { Shield, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedIn(true);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">VOXTEN Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Healthcare Communication Compliance Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clinician@hospital.org"
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Secure Login
          </button>
        </form>

        {/* Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-success">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">HIPAA-Compliant Secure Access</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Multi-Factor Authentication Required</span>
          </div>
          <p className="text-[10px] text-center text-muted-foreground/60">
            Password requirements: 12+ characters, uppercase, lowercase, number, special character
          </p>
        </div>
      </div>
    </div>
  );
}
