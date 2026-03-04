import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Lock, Users, Monitor, CheckCircle, Clock,
} from 'lucide-react';

const securityEvents = [
  { time: 'Today 09:15', event: 'Failed login attempt — unknown device', severity: 'Low', status: 'Auto-resolved' },
  { time: 'Yesterday 22:30', event: 'After-hours PHI access — Dr. Rivera (on-call)', severity: 'Info', status: 'Expected' },
  { time: 'Feb 21', event: 'New device registered — Torres, Maria RN', severity: 'Info', status: 'Approved' },
  { time: 'Feb 20', event: 'Conditional access block — non-US IP', severity: 'Medium', status: 'Blocked' },
];

const sevColor: Record<string, string> = {
  Low: 'text-success',
  Info: 'text-primary',
  Medium: 'text-warning',
};

const certs = [
  { label: 'HIPAA BAA: Executed — Mar 2025', done: true },
  { label: 'SOC 2 Type II: Certified — Jan 2026', done: true },
  { label: 'HITRUST CSF v11: Mapped', done: true },
  { label: 'ISO 27001: In Progress — Target Q3 2026', done: false },
];

export default function SecurityAdmin() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Security</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Authentication, encryption, access controls, and security monitoring</p>
      </div>

      {/* Identity & Access */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Identity & Access Management
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">SSO Provider</span>
              <span className="text-foreground font-medium">Microsoft Entra ID (Azure AD) <span className="text-success ml-1.5">● Connected</span></span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">MFA Enforcement</span>
              <span className="text-foreground font-medium">Required for all users <span className="text-success ml-1.5">● Enforced</span></span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Conditional Access Policies</span>
                <span className="text-foreground font-medium">3 active</span>
              </div>
              <ul className="mt-2 space-y-1 pl-4 text-[11px] text-muted-foreground list-disc">
                <li>Require compliant device for PHI access</li>
                <li>Block access from non-US locations</li>
                <li>Require MFA for privileged roles (CCO, CISO, Admin)</li>
              </ul>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Session Timeout</span>
              <span className="text-foreground font-medium">30 min (clinical) · 15 min (admin)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Privileged Identity Management</span>
              <span className="text-success font-medium">Enabled — Just-in-time elevation for admin roles</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encryption */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Encryption & Key Management
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">At Rest</span>
              <span className="text-foreground font-medium">AES-256 — Azure Storage Service Encryption <span className="text-success ml-1.5">● Active</span></span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">In Transit</span>
              <span className="text-foreground font-medium">TLS 1.3 — Certificate valid through Dec 2026 <span className="text-success ml-1.5">● Active</span></span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Key Management</span>
              <span className="text-foreground font-medium">Azure Key Vault <span className="text-success ml-1.5">● Connected</span></span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Customer-Managed Keys (CMK)</span>
              <span className="text-muted-foreground font-medium">Available (not activated)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Key Rotation</span>
              <span className="text-foreground font-medium">Automatic — Last rotation: Feb 1, 2026</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            Recent Security Events
            <span className="text-[10px] text-muted-foreground font-normal ml-1">from Microsoft Sentinel</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Event</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {securityEvents.map((e, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap tabular-nums">{e.time}</td>
                    <td className="py-2.5 pr-3 text-foreground">{e.event}</td>
                    <td className="py-2.5 pr-3"><span className={`font-medium ${sevColor[e.severity] || ''}`}>{e.severity}</span></td>
                    <td className="py-2.5 text-right text-muted-foreground">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">0 Critical events (30 days) · 2 Medium events · 14 Info events</p>
        </CardContent>
      </Card>

      {/* Certifications */}
      <div className="flex flex-wrap items-center gap-2">
        {certs.map((c) => (
          <Badge
            key={c.label}
            variant="outline"
            className={`text-[10px] gap-1 ${c.done ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'}`}
          >
            {c.done ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {c.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
