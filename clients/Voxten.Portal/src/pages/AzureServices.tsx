import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Server, Shield, Lock, MapPin, CheckCircle, Clock,
  Database, MessageSquare, Eye, HardDrive, Zap,
  Activity, Globe, BarChart3, Key, Users,
} from 'lucide-react';

/* ── Metrics ── */
const topMetrics = [
  { label: '30-day rolling', value: '99.99%', title: 'Uptime', good: true },
  { label: 'Policy evaluation', value: '12ms', title: 'Avg Latency', good: true },
  { label: 'Primary region', value: 'East US 2', title: 'Data Region', blue: true },
  { label: 'All healthy', value: '12', title: 'Active Services', good: true },
];

/* ── Services ── */
const services = [
  { name: 'Azure Communication Services', purpose: 'Chat, Voice, Video, SMS, Email', status: 'Active', latency: '8ms', region: 'East US 2', icon: MessageSquare },
  { name: 'Azure OpenAI Service (GPT-4o)', purpose: 'Real-time policy evaluation, AI governance', status: 'Active', latency: '12ms', region: 'East US 2', icon: Eye },
  { name: 'Azure Health Data Services (FHIR R4)', purpose: 'Patient context, EHR integration', status: 'Active', latency: '15ms', region: 'East US 2', icon: Activity },
  { name: 'Azure Cosmos DB', purpose: 'Communication store, audit search', status: 'Active', latency: '4ms', region: 'East US 2 (multi-region)', icon: Database },
  { name: 'Azure Kubernetes Service', purpose: 'Application platform, microservices', status: 'Active', latency: '—', region: 'East US 2', icon: Server },
  { name: 'Azure Cache for Redis', purpose: 'Policy evaluation cache', status: 'Active', latency: '<1ms', region: 'East US 2', icon: Zap },
  { name: 'Azure Event Hubs', purpose: 'Real-time event streaming', status: 'Active', latency: '3ms', region: 'East US 2', icon: Activity },
  { name: 'Azure Blob Storage (WORM)', purpose: 'Immutable audit archive', status: 'Active', latency: '—', region: 'East US 2', icon: HardDrive },
  { name: 'Microsoft Entra ID (P2)', purpose: 'Identity, SSO, Conditional Access', status: 'Active', latency: '—', region: 'Global', icon: Users },
  { name: 'Microsoft Sentinel', purpose: 'SIEM, security monitoring', status: 'Active', latency: '—', region: 'East US 2', icon: Shield },
  { name: 'Microsoft Purview', purpose: 'Data classification, DLP, compliance', status: 'Active', latency: '—', region: 'Global', icon: Globe },
  { name: 'Azure Monitor + Log Analytics', purpose: 'Observability, SLA reporting', status: 'Active', latency: '—', region: 'East US 2', icon: BarChart3 },
];

export default function AzureServices() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Azure Infrastructure</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Platform services, health monitoring, and security posture</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topMetrics.map((m) => (
          <Card key={m.title} className={`clinical-shadow border-border ${m.good ? 'border-success/20' : ''}`}>
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">{m.title}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
              <span className={`text-[10px] font-medium ${m.blue ? 'text-primary' : 'text-success'}`}>{m.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Health Table */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Azure Service Health</h2>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
              <CheckCircle className="w-3 h-3" />
              12/12 Operational
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium pl-6">Service</th>
                  <th className="pb-2 font-medium">Purpose</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Latency</th>
                  <th className="pb-2 font-medium text-right">Region</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.name} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                        <s.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground whitespace-nowrap">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{s.purpose}</td>
                    <td className="py-2.5 pr-3">
                      <span className="text-success font-medium flex items-center gap-1">● {s.status}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-foreground tabular-nums">{s.latency}</td>
                    <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap">{s.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Posture */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Security Posture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Encryption</span>
              <span className="text-foreground font-medium ml-auto">AES-256 at rest | TLS 1.3 in transit</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <Key className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Key Management</span>
              <span className="text-foreground font-medium ml-auto">Azure Key Vault — CMK enabled</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Sentinel</span>
              <span className="text-success font-medium ml-auto">0 active alerts | 12 rules deployed | Last incident: None (30d)</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Defender for Cloud</span>
              <span className="text-success font-medium ml-auto">Secure Score 94/100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
