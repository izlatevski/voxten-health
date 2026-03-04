import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Webhook, Code, CheckCircle, Copy, ChevronDown, ChevronRight,
  ExternalLink, Download, Plus, Terminal, Globe,
} from 'lucide-react';

/* ── Endpoints ── */
const endpoints = [
  { method: 'POST', path: '/api/v1/evaluate', desc: 'Submit a message for real-time governance evaluation' },
  { method: 'GET', path: '/api/v1/audit/{eventId}', desc: 'Retrieve a specific audit event by ID' },
  { method: 'GET', path: '/api/v1/audit/search', desc: 'Search audit events with filters' },
  { method: 'POST', path: '/api/v1/threads', desc: 'Create a new governed communication thread' },
  { method: 'GET', path: '/api/v1/threads/{threadId}', desc: 'Retrieve thread with full governance metadata' },
  { method: 'GET', path: '/api/v1/patients/{mrn}/communications', desc: 'Get all communications for a patient' },
  { method: 'POST', path: '/api/v1/webhooks', desc: 'Register a webhook endpoint' },
  { method: 'GET', path: '/api/v1/policies', desc: 'List all active governance policies' },
  { method: 'GET', path: '/api/v1/health', desc: 'Platform health check' },
];

const methodColor: Record<string, string> = {
  GET: 'bg-success/10 text-success',
  POST: 'bg-primary/10 text-primary',
  PUT: 'bg-warning/10 text-warning',
};

/* ── Webhooks ── */
const webhooks = [
  { endpoint: 'https://sentinel.commonspirit.org/webhook', events: 'Violations, Escalations', status: 'Active', last: '14:23 PM' },
  { endpoint: 'https://servicenow.commonspirit.org/api', events: 'All Compliance Events', status: 'Active', last: '14:22 PM' },
  { endpoint: 'https://epic.commonspirit.org/fhir/notify', events: 'EHR Sync Events', status: 'Active', last: '14:20 PM' },
];

/* ── SDKs ── */
const sdks = [
  { lang: 'JavaScript SDK', cmd: 'npm install @voxten/governance-sdk', icon: Terminal },
  { lang: 'Python SDK', cmd: 'pip install voxten', icon: Terminal },
  { lang: 'C# / .NET SDK', cmd: 'NuGet: Voxten.Governance', icon: Terminal },
];

export default function ApiWebhooks() {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedEp, setExpandedEp] = useState<string | null>(null);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">API & Webhooks</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Developer tools, API endpoints, and webhook configuration</p>
      </div>

      {/* SECTION 1 — API Overview */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              VOXTEN Governance API
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">v1.2.0 — Latest</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-28 shrink-0">Base URL</span>
              <code className="text-foreground font-mono font-medium">https://api.voxten.io/v1</code>
              <button onClick={() => copyText('https://api.voxten.io/v1')} className="ml-auto text-muted-foreground hover:text-foreground">
                {copied === 'https://api.voxten.io/v1' ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-28 shrink-0">Authentication</span>
              <span className="text-foreground font-medium">OAuth 2.0 via Microsoft Entra ID</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-28 shrink-0">Rate Limit</span>
              <span className="text-foreground font-medium">1,000 requests/minute (Enterprise tier)</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-28 shrink-0">Format</span>
              <span className="text-foreground font-medium">JSON | REST</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — Core Endpoints */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            Core Endpoints
          </h2>
          <div className="space-y-1">
            {endpoints.map((ep) => (
              <button
                key={ep.path}
                onClick={() => setExpandedEp(expandedEp === ep.path ? null : ep.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/40 transition-colors text-xs text-left"
              >
                {expandedEp === ep.path
                  ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold w-12 text-center shrink-0', methodColor[ep.method])}>
                  {ep.method}
                </span>
                <code className="font-mono text-foreground">{ep.path}</code>
                <span className="text-muted-foreground ml-auto hidden md:inline">{ep.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3 — Webhooks */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Webhook className="w-4 h-4 text-primary" />
              Webhook Configuration
            </h2>
            <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1">
              <Plus className="w-3 h-3" /> Add Webhook
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Endpoint</th>
                  <th className="pb-2 font-medium">Events</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Last Triggered</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <tr key={w.endpoint} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 pr-3">
                      <code className="font-mono text-foreground text-[11px]">{w.endpoint}</code>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{w.events}</td>
                    <td className="py-2.5 pr-3">
                      <span className="text-success font-medium flex items-center gap-1">● {w.status}</span>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground tabular-nums">{w.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — SDK & Docs */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            SDK & Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {sdks.map((s) => (
              <div key={s.lang} className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-foreground mb-1">{s.lang}</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-muted-foreground flex-1">{s.cmd}</code>
                  <button onClick={() => copyText(s.cmd)} className="text-muted-foreground hover:text-foreground shrink-0">
                    {copied === s.cmd ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button className="flex items-center gap-1 text-primary hover:underline font-medium">
              <ExternalLink className="w-3 h-3" /> API Reference
            </button>
            <button className="flex items-center gap-1 text-primary hover:underline font-medium">
              <Download className="w-3 h-3" /> Postman Collection
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
