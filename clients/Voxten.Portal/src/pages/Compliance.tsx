import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, FileText, Download, Calendar, Clock, Bot,
  TrendingUp, TrendingDown, AlertTriangle, Users, MessageSquare,
  Activity, Mail, ChevronRight,
} from 'lucide-react';

/* ── Metrics ── */
const metrics = [
  { label: 'Violations (30 days)', value: '47', trend: '↓12% from prior period', good: false, icon: AlertTriangle },
  { label: 'Resolution Rate', value: '94.2%', trend: '↑3.1%', good: true, icon: TrendingUp },
  { label: 'Avg Escalation Response', value: '4.2 min', trend: '↓0.8 min', good: true, icon: Clock },
  { label: 'Communication Coverage', value: '100%', trend: 'All channels governed', good: true, icon: MessageSquare },
];

/* ── Report Templates ── */
const reportTemplates = [
  { icon: ShieldCheck, name: 'PHI Access Report', desc: 'Complete log of all PHI access events with user, timestamp, justification, and patient context' },
  { icon: AlertTriangle, name: 'Break-the-Glass Review', desc: 'Emergency access events requiring post-hoc review and justification documentation' },
  { icon: FileText, name: 'Communication Audit Report', desc: 'Full communication history by patient, provider, channel, or date range with governance metadata' },
  { icon: Activity, name: 'Regulatory Readiness Assessment', desc: 'Gap analysis across HIPAA, Joint Commission, 42 CFR Part 2, and CMS requirements' },
  { icon: MessageSquare, name: 'Off-Channel Activity Report', desc: 'Detected off-channel communication attempts with resolution status' },
  { icon: Bot, name: 'AI Governance Summary', desc: 'AI-generated content volume, governance results, blocked/redacted/flagged breakdown by AI source' },
];

/* ── Scheduled Reports ── */
const scheduledReports = [
  { name: 'Weekly Compliance Summary', next: 'Monday, Feb 25', recipients: 'P. Okonkwo, D. Park', lastSent: 'Feb 17' },
  { name: 'Monthly Regulatory Report', next: 'Mar 1', recipients: 'P. Okonkwo, Board', lastSent: 'Feb 1' },
  { name: 'Daily PHI Access Digest', next: 'Tomorrow 6:00 AM', recipients: 'Compliance Team', lastSent: 'Today' },
];

export default function ComplianceReports() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Compliance Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Generated compliance reports, trend analysis, and regulatory readiness dashboards.</p>
      </div>

      {/* Posture Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 text-[10px]">
          <ShieldCheck className="w-3 h-3" /> Audit Log Integrity: Verified ✓
        </Badge>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
          <ShieldCheck className="w-3 h-3" /> HITRUST CSF v11: Mapped
        </Badge>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 text-[10px]">
          <ShieldCheck className="w-3 h-3" /> VOXTEN BAA Status: Active
        </Badge>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
          <ShieldCheck className="w-3 h-3" /> SOC 2 Type II: Certified
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className={`clinical-shadow border-border ${!m.good ? 'border-destructive/20' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`w-3.5 h-3.5 ${m.good ? 'text-success' : 'text-destructive'}`} />
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
              <span className={`flex items-center gap-0.5 text-[10px] font-medium mt-0.5 ${m.good ? 'text-success' : 'text-destructive'}`}>
                {m.good ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {m.trend}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Templates */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Generate Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportTemplates.map((r) => (
              <div key={r.name} className="p-4 rounded-lg border border-border hover:bg-muted/40 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <r.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{r.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  <Button size="sm" className="text-[11px] h-7 gap-1">
                    <Download className="w-3 h-3" /> Generate PDF
                  </Button>
                  <Button variant="outline" size="sm" className="text-[11px] h-7">CSV</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Scheduled Reports
          </h2>
          <div className="space-y-2">
            {scheduledReports.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-xs">
                <div className="flex items-center gap-3">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.recipients}</span>
                      <span>·</span>
                      <span>Last sent: {s.lastSent}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-medium">Next: {s.next}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                    <Mail className="w-3 h-3" /> Auto-delivery enabled
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
