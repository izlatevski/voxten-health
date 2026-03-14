import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  Zap,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { PolicyEngineStatus } from './PolicyEngineStatus';
import { ViolationHeatmap } from './ViolationHeatmap';
import { useNavigate } from 'react-router-dom';
import { getComplianceStats, queryAuditRecords, type AuditSummary } from '@/lib/complianceApi';

type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

type RiskRow = {
  severity: SeverityLevel;
  low: number;
  med: number;
  high: number;
};

function cellColor(val: number, severity: SeverityLevel): string {
  if (val === 0) return 'bg-success/15 text-success';
  if (severity === 'Critical') return 'bg-stat/20 text-stat';
  if (severity === 'High') return 'bg-urgent/20 text-urgent';
  return 'bg-urgent/10 text-urgent';
}

function startOfDaysAgo(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function mapChannel(channel?: string): string {
  switch (channel) {
    case 'SecureChat':
      return 'Secure Msg';
    case 'Sms':
      return 'SMS';
    case 'Email':
      return 'Email';
    case 'Voice':
      return 'Voice';
    case 'Ehr':
      return 'EHR';
    default:
      return channel || 'Unknown';
  }
}

function mapVerdict(state: string): 'FLAG' | 'BLOCK' | 'REDACT' {
  switch (state) {
    case 'blocked':
      return 'BLOCK';
    case 'redacted':
      return 'REDACT';
    default:
      return 'FLAG';
  }
}

function formatActor(audit: AuditSummary): string {
  const source = audit.senderDisplayName || audit.senderId || audit.senderRole || 'System';
  const target = audit.direction ? audit.direction.toLowerCase() : 'message';
  return `${source} → ${target}`;
}

function formatReason(audit: AuditSummary): string {
  const severity = audit.maxViolationSeverity || 'Unknown';
  const violations = `${audit.violationCount} violation${audit.violationCount === 1 ? '' : 's'}`;
  return `${severity} severity · ${violations} · ${audit.totalRulesEvaluated} rules evaluated`;
}

function toRiskMatrix(audits: AuditSummary[]): RiskRow[] {
  const matrix: Record<SeverityLevel, RiskRow> = {
    Critical: { severity: 'Critical', low: 0, med: 0, high: 0 },
    High: { severity: 'High', low: 0, med: 0, high: 0 },
    Medium: { severity: 'Medium', low: 0, med: 0, high: 0 },
    Low: { severity: 'Low', low: 0, med: 0, high: 0 },
  };

  const grouped = new Map<SeverityLevel, number>();
  for (const audit of audits) {
    const severity = (audit.maxViolationSeverity as SeverityLevel | undefined) ?? 'Low';
    grouped.set(severity, (grouped.get(severity) ?? 0) + 1);
  }

  grouped.forEach((count, severity) => {
    if (count >= 10) matrix[severity].high = count;
    else if (count >= 4) matrix[severity].med = count;
    else matrix[severity].low = count;
  });

  return [matrix.Critical, matrix.High, matrix.Medium, matrix.Low];
}

const verdictStyle: Record<'FLAG' | 'BLOCK' | 'REDACT', string> = {
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
};

export function ComplianceDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-compliance-stats', 7],
    queryFn: () => getComplianceStats(7),
    staleTime: 60_000,
  });

  const { data: recentAuditPage, isLoading: recentAuditsLoading } = useQuery({
    queryKey: ['dashboard-recent-audits'],
    queryFn: () => queryAuditRecords({ from: startOfDaysAgo(1), page: 0, pageSize: 25 }),
    staleTime: 30_000,
  });

  const { data: weeklyAuditPage, isLoading: weeklyAuditsLoading } = useQuery({
    queryKey: ['dashboard-weekly-audits'],
    queryFn: () => queryAuditRecords({ from: startOfDaysAgo(7), page: 0, pageSize: 100 }),
    staleTime: 60_000,
  });

  const recentViolations = useMemo(
    () => (recentAuditPage?.items ?? []).filter((item) => item.complianceState !== 'passed').slice(0, 8),
    [recentAuditPage],
  );

  const weeklyViolations = useMemo(
    () => (weeklyAuditPage?.items ?? []).filter((item) => item.complianceState !== 'passed'),
    [weeklyAuditPage],
  );

  const riskMatrix = useMemo(() => toRiskMatrix(weeklyViolations), [weeklyViolations]);

  const totalEvaluations = stats?.total ?? 0;
  const totalViolations = (stats?.flagged ?? 0) + (stats?.blocked ?? 0) + (stats?.redacted ?? 0);
  const passRate = totalEvaluations > 0 ? ((stats?.passed ?? 0) / totalEvaluations) * 100 : 0;
  const resolutionRate = totalViolations > 0 ? (((stats?.blocked ?? 0) + (stats?.redacted ?? 0)) / totalViolations) * 100 : 100;
  const avgLatency = weeklyViolations.length > 0
    ? Math.round(weeklyViolations.reduce((sum, item) => sum + item.totalRulesEvaluated, 0) / weeklyViolations.length)
    : 0;

  const complianceMetrics = [
    {
      title: 'Communications Governed (7d)',
      value: totalEvaluations,
      trend: statsLoading ? 'Loading…' : `${stats?.passed ?? 0} passed`,
      trendGood: true,
      icon: ShieldCheck,
    },
    {
      title: 'Pass Rate',
      value: `${passRate.toFixed(1)}%`,
      trend: statsLoading ? 'Loading…' : `${totalViolations} interventions`,
      trendGood: passRate >= 90,
      icon: BarChart3,
    },
    {
      title: 'Violations Detected',
      value: totalViolations,
      trend: statsLoading ? 'Loading…' : `${stats?.blocked ?? 0} blocked · ${stats?.redacted ?? 0} redacted`,
      trendGood: totalViolations === 0,
      icon: AlertTriangle,
    },
    {
      title: 'Enforced Resolution Rate',
      value: `${resolutionRate.toFixed(0)}%`,
      trend: statsLoading ? 'Loading…' : `${stats?.flagged ?? 0} flagged pending review`,
      trendGood: resolutionRate >= 80,
      icon: CheckCircle,
    },
    {
      title: 'Observed Violation Density',
      value: avgLatency > 0 ? `${avgLatency}` : '0',
      trend: statsLoading ? 'Loading…' : 'avg rules evaluated on violations',
      trendGood: true,
      icon: Zap,
    },
  ];

  const peakRiskRow = riskMatrix.find((row) => row.high > 0 || row.med > 0 || row.low > 0) ?? null;
  const isLoading = statsLoading || recentAuditsLoading || weeklyAuditsLoading;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {complianceMetrics.map((metric) => (
          <Card key={metric.title} className="clinical-shadow border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <metric.icon className="w-4 h-4 text-muted-foreground" />
                <span className={cn(
                  'flex items-center gap-0.5 text-[10px] font-medium',
                  metric.trendGood ? 'text-success' : 'text-urgent',
                )}>
                  {metric.trendGood ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {metric.trend}
                </span>
              </div>
              {isLoading && metric.value === 0 ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground my-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">{metric.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Violation Severity Distribution — Last 7 Days</h2>
            {!weeklyAuditsLoading && weeklyViolations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8">
                <p className="text-sm font-medium text-foreground">No severity distribution to show.</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Once violations are recorded, this will bucket them by severity and activity volume.
                </p>
              </div>
            ) : (
              <>
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
                        {[row.low, row.med, row.high].map((val, idx) => (
                          <td key={idx} className="text-center py-2">
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
                  {peakRiskRow
                    ? <>Most active severity in the last 7 days: <strong className="text-foreground">{peakRiskRow.severity}</strong>.</>
                    : <>No violations recorded in the last 7 days.</>}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <PolicyEngineStatus />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Violations & Flags — Last 24h</h2>
              <button onClick={() => navigate('/audit-trail')} className="text-[10px] text-primary font-medium hover:underline">Open audit trail →</button>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {recentAuditsLoading ? (
                <div className="p-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading audit events...
                </div>
              ) : recentViolations.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">No flagged, blocked, or redacted events in the last 24 hours.</div>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {recentViolations.map((violation) => {
                      const verdict = mapVerdict(violation.complianceState);
                      return (
                        <tr key={violation.auditId} className={cn('border-b border-border/50 hover:bg-muted/30', verdict === 'BLOCK' && 'bg-stat/5')}>
                          <td className="px-3 py-2 font-mono text-muted-foreground w-12">
                            {new Date(violation.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-2 py-2 w-16">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[verdict])}>{verdict}</span>
                          </td>
                          <td className="px-2 py-2 text-foreground w-20">{mapChannel(violation.sourceChannel)}</td>
                          <td className="px-2 py-2 text-muted-foreground w-14">{violation.engineVersion}</td>
                          <td className="px-2 py-2 text-foreground w-32">{formatActor(violation)}</td>
                          <td className="px-2 py-2 text-muted-foreground truncate max-w-[220px]">{formatReason(violation)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        <ViolationHeatmap audits={weeklyViolations} />
      </div>
    </div>
  );
}
