import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ShieldCheck, BarChart3, AlertTriangle, Zap, CheckCircle, Bot, ArrowRight } from 'lucide-react';
import { PolicyEngineStatus } from './PolicyEngineStatus';
import { ViolationHeatmap } from './ViolationHeatmap';
import { useNavigate } from 'react-router-dom';

/* ── Compliance KPIs ── */
const complianceMetrics = [
  { title: 'Communications Governed (24h)', value: 51138, trend: '+3,291 vs yesterday', trendGood: true, icon: ShieldCheck },
  { title: 'Policy Coverage', value: '100%', trend: 'All channels monitored', trendGood: true, icon: BarChart3 },
  { title: 'Violations Detected', value: 23, trend: '-4 vs yesterday', trendGood: true, icon: AlertTriangle },
  { title: 'Violation Resolution Rate', value: '100%', trend: '23/23 resolved', trendGood: true, icon: CheckCircle },
  { title: 'Governance Latency', value: '<47ms', trend: 'No operational impact', trendGood: true, icon: Zap },
];

/* ── Risk Matrix ── */
const riskMatrix = [
  { severity: 'Critical', low: 0, med: 0, high: 0 },
  { severity: 'High', low: 2, med: 1, high: 0 },
  { severity: 'Medium', low: 4, med: 8, high: 3 },
  { severity: 'Low', low: 1, med: 3, high: 1 },
];

function cellColor(val: number, severity: string): string {
  if (val === 0) return 'bg-success/15 text-success';
  if (severity === 'Critical') return 'bg-stat/20 text-stat';
  if (severity === 'High') return 'bg-urgent/20 text-urgent';
  return 'bg-urgent/10 text-urgent';
}

/* ── Violations Feed ── */
const recentViolations = [
  { time: '14:23', verdict: 'FLAG', channel: 'Secure Msg', reg: 'HIPAA', who: 'Dr. Williams → Care Team', reason: 'SUD data shared without 42 CFR Part 2 consent verification' },
  { time: '11:47', verdict: 'BLOCK', channel: 'SMS', reg: 'HIPAA', who: 'Auto-blocked', reason: 'PII pattern detected in outbound SMS' },
  { time: '11:02', verdict: 'FLAG', channel: 'AI-Gen', reg: 'HIPAA', who: 'Copilot → Dr. Chen', reason: 'PHI in AI-generated patient summary' },
  { time: '09:15', verdict: 'REDACT', channel: 'Email', reg: 'HIPAA', who: 'System', reason: 'PHI redacted — minimum necessary violation in referral letter' },
  { time: '08:44', verdict: 'FLAG', channel: 'Secure Msg', reg: 'HIPAA', who: 'Nurse Torres', reason: 'Patient name in unsecured channel attempt' },
  { time: '07:30', verdict: 'BLOCK', channel: 'SMS', reg: 'HIPAA', who: 'Auto-blocked', reason: 'SSN pattern detected in SMS draft' },
];

const verdictStyle: Record<string, string> = {
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
};

export function ComplianceDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {complianceMetrics.map((m) => (
          <Card key={m.title} className="clinical-shadow border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <m.icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-success">
                  <TrendingUp className="w-3 h-3" />
                  {m.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Risk Matrix + Policy Engine */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Risk Matrix */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Risk Heat Map — Last 7 Days</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 font-medium text-muted-foreground">Severity</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">Low Volume</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">Med Volume</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">High Volume</th>
                </tr>
              </thead>
              <tbody>
                {riskMatrix.map((row) => (
                  <tr key={row.severity} className="border-b border-border/50">
                    <td className="py-2 font-medium text-foreground">{row.severity} Sev.</td>
                    {[row.low, row.med, row.high].map((val, i) => (
                      <td key={i} className="text-center py-2">
                        <span className={cn('inline-block w-10 py-1 rounded text-xs font-bold tabular-nums', cellColor(val, row.severity))}>
                          {val}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground mt-3">
              No critical-severity, high-volume risks. Biggest cluster: medium-severity, medium-volume.
            </p>
          </CardContent>
        </Card>

        <PolicyEngineStatus />
      </div>

      {/* Row 3: AI Governance Spotlight — FULL WIDTH */}
      <Card className="clinical-shadow border-border bg-ehr-part2/3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-ehr-part2" />
              <h2 className="text-base font-semibold text-foreground">AI Communication Governance</h2>
            </div>
            <Badge variant="outline" className="bg-ehr-part2/10 text-ehr-part2 border-ehr-part2/20 text-[10px] gap-1">
              <TrendingUp className="w-3 h-3" />
              +340% (90d)
            </Badge>
          </div>
          <p className="text-2xl font-bold text-foreground mb-3 tabular-nums">12,849 <span className="text-sm font-normal text-muted-foreground">AI-generated communications governed today</span></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="text-xs"><span className="text-muted-foreground">Azure OpenAI:</span> <strong className="text-foreground">6,218</strong></div>
            <div className="text-xs"><span className="text-muted-foreground">Copilot M365:</span> <strong className="text-foreground">4,102</strong></div>
            <div className="text-xs"><span className="text-muted-foreground">Clinical Agents:</span> <strong className="text-foreground">2,529</strong></div>
            <div className="text-xs flex items-center gap-3">
              <span className="text-success">✓ 12,822 passed</span>
              <span className="text-urgent">⚠ 18 flagged</span>
              <span className="text-stat">✕ 2 blocked</span>
              <span className="text-ehr-part2">↺ 7 redacted</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground">
            <span>Most Common Flag: <em className="text-foreground">"PHI detected in AI-generated patient summary"</em></span>
            <span className="hidden sm:inline">·</span>
            <span>Latest Block: <em className="text-foreground">"Behavioral health data in discharge letter (42 CFR Part 2)"</em></span>
          </div>
          <button onClick={() => navigate('/ai-governance')} className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
            View AI Governance Dashboard <ArrowRight className="w-3 h-3" />
          </button>
        </CardContent>
      </Card>

      {/* Row 4: Violations Feed + Heatmap */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Violations Feed */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Violations & Flags — Last 24h</h2>
              <button onClick={() => navigate('/live-feed')} className="text-[10px] text-primary font-medium hover:underline">Show all events →</button>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {recentViolations.map((v, i) => (
                    <tr key={i} className={cn('border-b border-border/50 hover:bg-muted/30', v.verdict === 'BLOCK' && 'bg-stat/5')}>
                      <td className="px-3 py-2 font-mono text-muted-foreground w-12">{v.time}</td>
                      <td className="px-2 py-2 w-16">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[v.verdict])}>{v.verdict}</span>
                      </td>
                      <td className="px-2 py-2 text-foreground w-20">{v.channel}</td>
                      <td className="px-2 py-2 text-muted-foreground w-14">{v.reg}</td>
                      <td className="px-2 py-2 text-foreground w-32">{v.who}</td>
                      <td className="px-2 py-2 text-muted-foreground truncate max-w-[200px]">{v.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <ViolationHeatmap />
      </div>
    </div>
  );
}
