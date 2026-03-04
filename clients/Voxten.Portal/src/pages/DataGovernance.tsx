import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database, Shield, HardDrive, Tag, Lock, Clock, CheckCircle,
  MapPin, Key, ArrowRight, MessageSquare, Search, Archive,
} from 'lucide-react';

/* ── Section 1: Purview Labels ── */
const purviewLabels = [
  { label: 'Highly Confidential — PHI', desc: 'Protected Health Information', rule: 'Messages containing MRN, SSN, diagnoses, lab results', count: '12,847' },
  { label: 'Confidential — Clinical', desc: 'Clinical communications without direct PHI', rule: 'Provider-to-provider care coordination', count: '34,291' },
  { label: 'Internal — Administrative', desc: 'Non-clinical operational communications', rule: 'Scheduling, logistics, non-patient discussions', count: '8,445' },
];

/* ── Section 2: Retention by regulation ── */
const retentionRegs = [
  { reg: 'HIPAA', required: '6 years', setting: '7 years', status: '✓ Exceeds' },
  { reg: 'Joint Commission', required: '6 years', setting: '7 years', status: '✓ Exceeds' },
  { reg: '42 CFR Part 2', required: '6 years', setting: '7 years', status: '✓ Exceeds' },
  { reg: 'State Medical Records (CA)', required: '10 years', setting: '10 years (CA patients)', status: '✓ Compliant' },
];

/* ── Section 4: Data lifecycle steps ── */
const lifecycleSteps = [
  { name: 'Clinical Message', service: 'ACS Chat / Voice', icon: MessageSquare },
  { name: 'Governance Engine', service: '12 ms avg latency', icon: Shield },
  { name: 'Policy Evaluation', service: 'VOXTEN Policy Engine', icon: CheckCircle },
  { name: 'PASS / BLOCK / REDACT', service: 'Verdict Applied', icon: Lock },
  { name: 'Encrypted Delivery', service: 'TLS 1.3 + AES-256', icon: Key },
  { name: 'Cosmos DB', service: 'Searchable Index', icon: Search },
  { name: 'Blob Storage', service: 'Immutable WORM', icon: Archive },
  { name: 'Purview Classification', service: 'Sensitivity Labels', icon: Tag },
];

export default function DataGovernance() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Data Governance</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Data classification, retention, encryption, and lifecycle management</p>
      </div>

      {/* SECTION 1 — Data Classification */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Microsoft Purview Sensitivity Labels
          </h2>
          <p className="text-[10px] text-muted-foreground mb-3">Labels synced from Microsoft Purview Information Protection</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Label</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Auto-Apply Rule</th>
                  <th className="pb-2 font-medium text-right">Communications Tagged</th>
                </tr>
              </thead>
              <tbody>
                {purviewLabels.map((l) => (
                  <tr key={l.label} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${l.label.includes('PHI') ? 'bg-destructive/10 text-destructive border-destructive/20' : l.label.includes('Clinical') ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {l.label}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-foreground">{l.desc}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{l.rule}</td>
                    <td className="py-2.5 text-right font-medium text-foreground tabular-nums">{l.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — Retention Policies */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              Immutable Retention & WORM Compliance
            </h2>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
              7-Year Retention: ACTIVE
            </Badge>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Records Stored', value: '1,847,293' },
              { label: 'Records Deleted', value: '0' },
              { label: 'Records Modified', value: '0' },
              { label: 'Immutability Policy', value: 'Time-based, locked' },
            ].map((m) => (
              <div key={m.label} className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
            <Archive className="w-3.5 h-3.5" />
            Storage: Azure Blob Storage — WORM (Write Once Read Many)
          </div>

          {/* Regulation table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Regulation</th>
                  <th className="pb-2 font-medium">Required Retention</th>
                  <th className="pb-2 font-medium">VOXTEN Setting</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {retentionRegs.map((r) => (
                  <tr key={r.reg} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 text-foreground font-medium">{r.reg}</td>
                    <td className="py-2 text-muted-foreground">{r.required}</td>
                    <td className="py-2 text-foreground">{r.setting}</td>
                    <td className="py-2">
                      <span className="text-success font-medium">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3 — Data Residency & Encryption */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Data Residency & Encryption
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Details */}
            <div className="lg:col-span-2 space-y-2 text-xs">
              {[
                { k: 'Region', v: 'East US 2 (Virginia)', icon: MapPin },
                { k: 'Encryption at Rest', v: 'AES-256 — Azure Storage Service Encryption', icon: Lock },
                { k: 'Encryption in Transit', v: 'TLS 1.3', icon: Shield },
                { k: 'Key Management', v: 'Azure Key Vault — Customer-managed keys available', icon: Key },
                { k: 'Certificate', v: 'Valid through Dec 2026', icon: CheckCircle },
              ].map((row) => (
                <div key={row.k} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                  <row.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground w-36 shrink-0">{row.k}</span>
                  <span className="text-foreground font-medium">{row.v}</span>
                </div>
              ))}
            </div>

            {/* US Map placeholder */}
            <div className="rounded-lg border border-border bg-muted/30 flex flex-col items-center justify-center p-4 min-h-[180px]">
              <svg viewBox="0 0 200 130" className="w-full max-w-[180px] opacity-60" fill="none">
                {/* Simplified US outline */}
                <path d="M10 90 Q30 95 50 85 L70 80 Q90 75 110 78 L130 82 Q150 86 165 80 L180 70 Q190 60 185 45 L175 30 Q165 20 145 18 L120 15 Q100 12 80 18 L55 25 Q35 30 20 45 L12 65 Z" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="hsl(var(--muted) / 0.5)" />
                {/* East US 2 marker */}
                <circle cx="155" cy="40" r="8" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                <circle cx="155" cy="40" r="3" fill="hsl(var(--primary))" />
              </svg>
              <p className="text-[10px] text-primary font-medium mt-2">East US 2 (Virginia)</p>
              <p className="text-[9px] text-muted-foreground">Primary data residency region</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — Communication Data Lifecycle */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Communication Data Lifecycle
          </h2>

          {/* Horizontal flow */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-0 min-w-[900px]">
              {lifecycleSteps.map((step, i) => (
                <div key={step.name} className="flex items-center">
                  <div className="flex flex-col items-center text-center w-[110px]">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1.5 ${i === 3 ? 'bg-success/10 border border-success/30' : 'bg-primary/10 border border-primary/20'}`}>
                      <step.icon className={`w-4.5 h-4.5 ${i === 3 ? 'text-success' : 'text-primary'}`} />
                    </div>
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{step.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{step.service}</p>
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mx-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
