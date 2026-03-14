import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getAuditRecord, queryAuditRecords, type AuditDetail, type AuditSummary } from '@/lib/complianceApi';
import {
  Radio,
  X,
  FileText,
  Clock,
  Hash,
  Layers,
  Eye,
  Loader2,
} from 'lucide-react';

type Verdict = 'PASS' | 'FLAG' | 'BLOCK' | 'REDACT';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type FeedEvent = {
  id: string;
  timestamp: Date;
  verdict: Verdict;
  channel: string;
  severity: Severity;
  actor: string;
  summary: string;
  rulesEvaluated: number;
  auditId: string;
  direction?: string;
  threadId?: string;
};

const verdictStyle: Record<Verdict, string> = {
  PASS: 'text-success bg-success/10',
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
};

const channelOptions = ['All Channels', 'Secure Msg', 'Voice', 'SMS', 'Email', 'EHR', 'Unknown'];
const verdictOptions: Array<Verdict | 'All Verdicts'> = ['All Verdicts', 'PASS', 'FLAG', 'BLOCK', 'REDACT'];
const severityOptions = ['All', 'Critical', 'High', 'Medium', 'Low', 'Info'];
const timeOptions = ['Live', 'Last Hour', 'Today', 'Last 7 Days'];

function startOfRange(value: string): string {
  const now = new Date();
  switch (value) {
    case 'Last Hour':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case 'Today': {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }
    case 'Last 7 Days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'Live':
    default:
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  }
}

function mapVerdict(value: string): Verdict {
  switch (value) {
    case 'blocked':
      return 'BLOCK';
    case 'redacted':
      return 'REDACT';
    case 'flagged':
      return 'FLAG';
    default:
      return 'PASS';
  }
}

function mapSeverity(value?: string | null): Severity {
  switch ((value || '').toLowerCase()) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'info';
  }
}

function mapChannel(value?: string): string {
  switch (value) {
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
      return 'Unknown';
  }
}

function formatActor(audit: AuditSummary): string {
  return audit.senderDisplayName || audit.senderId || audit.senderRole || 'System';
}

function formatSummary(audit: AuditSummary): string {
  const severity = audit.maxViolationSeverity || 'Compliant';
  const violationText = audit.violationCount > 0
    ? `${audit.violationCount} violation${audit.violationCount === 1 ? '' : 's'}`
    : 'No violations';
  return `${severity} severity · ${violationText}`;
}

function toFeedEvent(audit: AuditSummary): FeedEvent {
  return {
    id: audit.auditId,
    timestamp: new Date(audit.createdAt || audit.messageTimestamp),
    verdict: mapVerdict(audit.complianceState),
    channel: mapChannel(audit.sourceChannel),
    severity: mapSeverity(audit.maxViolationSeverity),
    actor: formatActor(audit),
    summary: formatSummary(audit),
    rulesEvaluated: audit.totalRulesEvaluated,
    auditId: audit.auditId,
    direction: audit.direction,
    threadId: audit.threadId,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTimestamp(value?: string): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function formatPolicyResult(verdict: string): Verdict {
  switch (verdict.toLowerCase()) {
    case 'violation':
      return 'BLOCK';
    case 'uncertain':
      return 'FLAG';
    default:
      return 'PASS';
  }
}

function summarizeAi(detail: AuditDetail): string | null {
  const aiResults = detail.evaluationResults.filter((result) => result.evalLane === 'Ai' || result.evalLane === 'Hybrid');
  if (aiResults.length === 0) return null;

  return aiResults
    .map((result) => {
      const severity = result.violationSeverity || 'none';
      const confidence = result.confidence != null ? `confidence ${result.confidence.toFixed(2)}` : 'confidence n/a';
      return `${result.ruleLogicalId} (${result.evalLane}) → ${result.verdict}, severity ${severity}, ${confidence}`;
    })
    .join(' | ');
}

export default function LiveFeed() {
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<Verdict | 'All Verdicts'>('All Verdicts');
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [sevFilter, setSevFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Live');

  const from = useMemo(() => startOfRange(timeFilter), [timeFilter]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['live-feed-audits', { from }],
    queryFn: () => queryAuditRecords({ from, page: 0, pageSize: 100 }),
    staleTime: 10_000,
    refetchInterval: timeFilter === 'Live' && !paused ? 5_000 : false,
    placeholderData: (previous) => previous,
  });

  const { data: selectedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['live-feed-audit-detail', selectedAuditId],
    queryFn: () => getAuditRecord(selectedAuditId!),
    enabled: drawerOpen && !!selectedAuditId,
    staleTime: 30_000,
  });

  const events = useMemo(
    () => (data?.items ?? []).map((item) => toFeedEvent(item)),
    [data],
  );

  const filtered = useMemo(() => events.filter((event) => {
    if (verdictFilter !== 'All Verdicts' && event.verdict !== verdictFilter) return false;
    if (channelFilter !== 'All Channels' && event.channel !== channelFilter) return false;
    if (sevFilter !== 'All' && event.severity !== sevFilter.toLowerCase()) return false;
    return true;
  }), [events, verdictFilter, channelFilter, sevFilter]);

  const activeFilters = [verdictFilter !== 'All Verdicts', channelFilter !== 'All Channels', sevFilter !== 'All'].filter(Boolean).length;
  const blockedToday = events.filter((event) => event.verdict === 'BLOCK').length;
  const avgRulesEvaluated = filtered.length > 0
    ? Math.round(filtered.reduce((sum, event) => sum + event.rulesEvaluated, 0) / filtered.length)
    : 0;
  const flaggedToday = events.filter((event) => event.verdict === 'FLAG' || event.verdict === 'REDACT').length;

  const openDetail = (event: FeedEvent) => {
    setSelectedAuditId(event.auditId);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Live Governance Feed</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Polling recent compliance audit events from the live governance pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px] gap-1 h-5', timeFilter === 'Live' && !paused ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground')}>
            <span className={cn('w-1.5 h-1.5 rounded-full', timeFilter === 'Live' && !paused ? 'bg-success animate-pulse-subtle' : 'bg-muted-foreground')} />
            {paused ? 'Paused' : timeFilter === 'Live' ? 'Live' : timeFilter}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} events</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Visible Events', value: filtered.length.toString() },
          { label: 'Blocked In Window', value: blockedToday.toString() },
          { label: 'Flagged / Redacted', value: flaggedToday.toString() },
          { label: 'Avg Rules Evaluated', value: avgRulesEvaluated.toString() },
        ].map((item) => (
          <Card key={item.label} className="clinical-shadow border-border">
            <CardContent className="p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{item.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="clinical-shadow border-border">
        <CardContent className="p-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Verdict</label>
            <Select value={verdictFilter} onValueChange={(value) => setVerdictFilter(value as Verdict | 'All Verdicts')}>
              <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {verdictOptions.map((value) => <SelectItem key={value} value={value} className="text-xs">{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Channel</label>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {channelOptions.map((value) => <SelectItem key={value} value={value} className="text-xs">{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Severity</label>
            <Select value={sevFilter} onValueChange={setSevFilter}>
              <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {severityOptions.map((value) => <SelectItem key={value} value={value} className="text-xs">{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Time</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeOptions.map((value) => <SelectItem key={value} value={value} className="text-xs">{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground gap-1"
              onClick={() => {
                setVerdictFilter('All Verdicts');
                setChannelFilter('All Channels');
                setSevFilter('All');
              }}
            >
              <X className="w-3 h-3" />
              Clear ({activeFilters})
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="clinical-shadow border-border">
        <CardContent className="p-0">
          <div
            className="max-h-[calc(100vh-320px)] min-h-[400px] overflow-y-auto"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-20">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-16">Verdict</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-24">Channel</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-16">Sev</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Actor</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden xl:table-cell">Summary</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-16">Rules</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Loading audit events...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      Failed to load live audit events. Check that ComplianceApi is running.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No events match the current filters</td>
                  </tr>
                ) : (
                  filtered.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => openDetail(event)}
                      className={cn(
                        'border-b border-border/40 transition-colors cursor-pointer',
                        event.verdict === 'BLOCK' && 'bg-stat/5 hover:bg-stat/10',
                        event.verdict === 'FLAG' && 'bg-urgent/5 hover:bg-urgent/10',
                        event.verdict === 'REDACT' && 'bg-ehr-part2/5 hover:bg-ehr-part2/10',
                        event.verdict === 'PASS' && 'hover:bg-muted/50',
                      )}
                    >
                      <td className="px-4 py-2 font-mono text-muted-foreground">{formatTime(event.timestamp)}</td>
                      <td className="px-4 py-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[event.verdict])}>{event.verdict}</span>
                      </td>
                      <td className="px-4 py-2 text-foreground">{event.channel}</td>
                      <td className="px-4 py-2 text-muted-foreground capitalize">{event.severity}</td>
                      <td className="px-4 py-2 text-foreground">{event.actor}</td>
                      <td className="px-4 py-2 text-muted-foreground truncate max-w-[260px] hidden xl:table-cell">{event.summary}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground tabular-nums">{event.rulesEvaluated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              {selectedDetail ? (
                <>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-bold', verdictStyle[mapVerdict(selectedDetail.complianceState)])}>
                    {mapVerdict(selectedDetail.complianceState)}
                  </span>
                  Audit Event Detail
                </>
              ) : (
                <>Audit Event Detail</>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            {detailLoading ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading audit detail...
              </div>
            ) : !selectedDetail ? (
              <div className="text-xs text-muted-foreground">No audit detail loaded.</div>
            ) : (
              <div className="space-y-5">
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Event Metadata</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <MetaRow icon={Hash} label="Audit ID" value={selectedDetail.auditId} mono />
                    <MetaRow icon={Clock} label="Timestamp" value={formatTimestamp(selectedDetail.createdAt)} mono />
                    <MetaRow icon={Hash} label="Message ID" value={selectedDetail.messageId} mono />
                    <MetaRow icon={Hash} label="Thread ID" value={selectedDetail.threadId || '—'} mono />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Message Content</h3>
                  <div className="bg-muted rounded-md p-3 text-xs text-foreground leading-relaxed">
                    {selectedDetail.messageContent || 'Message content unavailable from audit storage.'}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Evaluation Results
                  </h3>
                  <div className="space-y-1.5">
                    {selectedDetail.evaluationResults.map((result, index) => {
                      const pill = formatPolicyResult(result.verdict);
                      return (
                        <div key={`${result.ruleLogicalId}-${index}`} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground tabular-nums w-4">{index + 1}.</span>
                            <span className="font-mono text-foreground">{result.ruleLogicalId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[pill])}>{result.verdict}</span>
                            <span className="text-muted-foreground tabular-nums">{result.evaluationLatencyMs}ms</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {summarizeAi(selectedDetail) && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      AI / Hybrid Evaluation
                    </h3>
                    <div className="bg-ehr-part2/5 border border-ehr-part2/20 rounded-md p-3 text-xs text-foreground leading-relaxed">
                      {summarizeAi(selectedDetail)}
                    </div>
                  </section>
                )}

                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Compliance Outcome</h3>
                  <p className="text-xs text-foreground">
                    State: <strong>{selectedDetail.complianceState}</strong> · Verdict: <strong>{selectedDetail.overallVerdict}</strong> · Violations: <strong>{selectedDetail.violationCount}</strong>
                  </p>
                </section>

                <section className="pt-2 border-t border-border">
                  <button
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1.5"
                    onClick={() => navigate('/audit-trail')}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Open in Audit Trail
                  </button>
                </section>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{label}</span>
      <span className={cn('text-foreground truncate', mono && 'font-mono text-[11px]')}>{value}</span>
    </div>
  );
}
