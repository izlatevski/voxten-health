import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, Lock, Server, Key, Eye, TrendingUp, CheckCircle } from 'lucide-react';
import { AzureInfraHealth } from './AzureInfraHealth';
import { ChannelGovernance } from './ChannelGovernance';

/* ── Security KPIs ── */
const securityMetrics = [
  { title: 'Events Processed (24h)', value: '51,138', trend: 'All channels incl. video', icon: ShieldCheck },
  { title: 'Encryption Status', value: 'AES-256', trend: 'At rest + transit + processing', icon: Lock },
  { title: 'Security Incidents', value: '0', trend: 'Last 30 days', icon: Eye },
  { title: 'Sentinel Alerts Exported', value: '23', trend: 'To customer SIEM', icon: Server },
  { title: 'Platform Uptime', value: '99.97%', trend: 'Last 90 days', icon: TrendingUp },
];

/* ── Encryption Card ── */
const encryptionItems = [
  { label: 'Data at rest', value: 'AES-256 (Key Vault)', ok: true },
  { label: 'Data in transit', value: 'TLS 1.3', ok: true },
  { label: 'Data in processing', value: 'SGX Enclave', ok: true },
  { label: 'Key rotation', value: 'Last 7d ago | Next: 23d | 30-day auto', ok: true },
  { label: 'Customer-managed keys', value: 'Active', ok: true },
];

/* ── Security Events ── */
const securityEvents = [
  { time: '14:22', type: 'auth', desc: 'SSO login — Dr. Rivera via Okta', status: 'ok' },
  { time: '14:20', type: 'sentinel', desc: 'Sentinel export: 3 alerts forwarded to SIEM', status: 'ok' },
  { time: '14:18', type: 'encryption', desc: 'AES-256 key access — audit log export', status: 'ok' },
  { time: '14:15', type: 'auth', desc: 'MFA verification — Patricia Okonkwo', status: 'ok' },
  { time: '14:10', type: 'sentinel', desc: 'Anomaly scan complete — 0 findings', status: 'ok' },
  { time: '13:55', type: 'encryption', desc: 'TLS 1.3 session renegotiation — Epic FHIR', status: 'ok' },
];

/* ── Certifications ── */
const certifications = [
  { name: 'HITRUST CSF r2', ok: true },
  { name: 'SOC 2 Type II', ok: true },
  { name: 'HIPAA BAA', ok: true },
  { name: 'ISO 27001', ok: true },
  { name: 'FedRAMP', ok: false, note: 'In Progress' },
  { name: 'ONC Health IT', ok: true },
];

export function CISODashboard() {
  return (
    <div className="space-y-4">
      {/* Row 1: Security KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {securityMetrics.map((m) => (
          <Card key={m.title} className="clinical-shadow border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <m.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-success">{m.trend}</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Azure Infrastructure — FULL WIDTH */}
      <AzureInfraHealth />

      {/* Row 3: Channel Volume + Encryption */}
      <div className="flex flex-col lg:flex-row gap-4">
        <ChannelGovernance />

        {/* Encryption */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Encryption & Key Management</h2>
            </div>
            <div className="space-y-2">
              {encryptionItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    {item.ok && <CheckCircle className="w-3 h-3 text-success" />}
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Security Events + Certifications */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Security Events */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Security Event Feed</h2>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {securityEvents.map((evt, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-border/50 text-xs hover:bg-muted/30">
                  <span className="font-mono text-muted-foreground w-12">{evt.time}</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{evt.type}</Badge>
                  <span className="text-foreground flex-1 truncate">{evt.desc}</span>
                  <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Compliance Certifications</h2>
            <div className="grid grid-cols-2 gap-2">
              {certifications.map((cert) => (
                <div key={cert.name} className={cn(
                  'flex items-center gap-2 p-2.5 rounded-md border text-xs',
                  cert.ok ? 'border-success/20 bg-success/5' : 'border-urgent/20 bg-urgent/5'
                )}>
                  {cert.ok ? (
                    <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-urgent flex-shrink-0" />
                  )}
                  <span className="text-foreground font-medium">{cert.name}</span>
                  {cert.note && <span className="text-[9px] text-urgent ml-auto">{cert.note}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
