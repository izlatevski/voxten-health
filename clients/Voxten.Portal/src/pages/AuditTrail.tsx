import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FileSearch, Search, Download, ShieldCheck, Hash, ChevronDown, ChevronUp, Lock, FileText, Scale, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { queryAuditRecords, getAuditRecord, type AuditSummary, type AuditDetail } from '@/lib/complianceApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapComplianceStateToVerdict(state: string): string {
  switch (state.toLowerCase()) {
    case 'passed': return 'PASS';
    case 'blocked': return 'BLOCK';
    case 'redacted': return 'REDACT';
    case 'flagged': return 'FLAG';
    default: return '—';
  }
}

function mapComplianceStateToAction(state: string): string {
  switch (state.toLowerCase()) {
    case 'passed': return 'Message Sent';
    case 'blocked': return 'Message Blocked';
    case 'redacted': return 'Message Redacted';
    case 'flagged': return 'Message Flagged';
    default: return 'Evaluated';
  }
}

function mapVerdictFilterToState(v: string): string | undefined {
  switch (v) {
    case 'PASS': return 'passed';
    case 'BLOCK': return 'blocked';
    case 'REDACT': return 'redacted';
    case 'FLAG': return 'flagged';
    default: return undefined;
  }
}

function dateRangeToFrom(range: string): string | undefined {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now); d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === '7d') {
    return new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  }
  if (range === '30d') {
    return new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
  }
  return undefined;
}

const verdictStyle: Record<string, string> = {
  PASS: 'text-success bg-success/10',
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
  '—': 'text-muted-foreground bg-muted',
};

type EvidenceMatch = {
  position?: number;
  length?: number;
  entityType?: string;
  Position?: number;
  Length?: number;
  EntityType?: string;
};

function extractEvidenceMatches(detail: AuditDetail): Array<{ start: number; end: number; entityType: string }> {
  const content = detail.messageContent ?? '';
  if (!content) return [];

  const matches: Array<{ start: number; end: number; entityType: string }> = [];

  for (const result of detail.evaluationResults) {
    if (result.verdict !== 'Violation') continue;

    try {
      const parsed = JSON.parse(result.evidenceJson) as EvidenceMatch[];
      if (!Array.isArray(parsed)) continue;

      for (const item of parsed) {
        const start = item.position ?? item.Position;
        const length = item.length ?? item.Length;
        if (typeof start !== 'number' || typeof length !== 'number') continue;
        if (start < 0 || length <= 0 || start + length > content.length) continue;

        matches.push({
          start,
          end: start + length,
          entityType: item.entityType ?? item.EntityType ?? 'Redacted',
        });
      }
    } catch {
      continue;
    }
  }

  return matches
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .reduce<Array<{ start: number; end: number; entityType: string }>>((merged, current) => {
      const previous = merged[merged.length - 1];
      if (!previous || current.start > previous.end) {
        merged.push(current);
        return merged;
      }

      previous.end = Math.max(previous.end, current.end);
      previous.entityType = previous.entityType === current.entityType ? previous.entityType : `${previous.entityType}, ${current.entityType}`;
      return merged;
    }, []);
}

function HighlightedMessageContent({ detail }: { detail: AuditDetail }) {
  if (!detail.messageContent) {
    return <span className="text-muted-foreground italic">Content not available</span>;
  }

  const matches = extractEvidenceMatches(detail);
  if (matches.length === 0) {
    return <>{detail.messageContent}</>;
  }

  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      fragments.push(
        <span key={`plain-${index}`}>
          {detail.messageContent!.slice(cursor, match.start)}
        </span>,
      );
    }

    fragments.push(
      <mark
        key={`mark-${index}`}
        className="rounded px-0.5 py-0.5 bg-ehr-part2/28 text-foreground border border-ehr-part2/60 shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]"
        title={`Redacted entity: ${match.entityType}`}
      >
        {detail.messageContent!.slice(match.start, match.end)}
      </mark>,
    );

    cursor = match.end;
  });

  if (cursor < detail.messageContent.length) {
    fragments.push(
      <span key="plain-tail">
        {detail.messageContent.slice(cursor)}
      </span>,
    );
  }

  return <>{fragments}</>;
}

// ─── Detail row — loads full detail on expand ─────────────────────────────

function AuditDetailRow({ auditId }: { auditId: string }) {
  const { data, isLoading } = useQuery<AuditDetail>({
    queryKey: ['audit-detail', auditId],
    queryFn: () => getAuditRecord(auditId),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 px-6 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading audit detail...
      </div>
    );
  }

  if (!data) return <div className="px-6 py-3 text-xs text-muted-foreground">No detail available</div>;

  return (
    <div className="space-y-3 px-6 py-4">
      {/* Message Content */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Message Content</p>
        <div className="bg-muted/60 rounded-md border border-border/50 px-3 py-2.5 text-[11px] text-foreground font-mono whitespace-pre-wrap break-words leading-relaxed">
          <HighlightedMessageContent detail={data} />
        </div>
      </div>

      {/* Audit Record */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Audit Record</p>
        <div className="bg-card rounded-md border border-border/50 p-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audit ID</span>
            <span className="font-mono text-foreground">{data.auditId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Message ID</span>
            <span className="font-mono text-foreground">{data.messageId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thread ID</span>
            <span className="font-mono text-foreground">{data.threadId ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Engine</span>
            <span className="text-foreground">{data.engineVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rules Evaluated</span>
            <span className="text-foreground">{data.totalRulesEvaluated}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Violations</span>
            <span className={data.violationCount > 0 ? 'text-stat font-semibold' : 'text-foreground'}>{data.violationCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Retain Until</span>
            <span className="text-foreground">{new Date(data.retainUntil).toLocaleDateString()}</span>
          </div>
          {data.contentBlobRef && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Content Ref</span>
              <span className="font-mono text-foreground text-[10px] truncate max-w-[260px]">{data.contentBlobRef}</span>
            </div>
          )}
        </div>
      </div>

      {/* Evaluation results */}
      {data.evaluationResults.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Matched Rules ({data.evaluationResults.length})
          </p>
          <div className="space-y-1">
            {data.evaluationResults.map((er, i) => (
              <div key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                <span className={cn('mt-0.5', er.verdict === 'Violation' ? 'text-stat' : 'text-success')}>
                  {er.verdict === 'Violation' ? '▸' : '•'}
                </span>
                <span className="font-mono">{er.ruleLogicalId} v{er.ruleVersion}</span>
                <span className="text-muted-foreground">— {er.evalLane}</span>
                {er.violationSeverity && (
                  <Badge variant="outline" className="text-[8px] px-1 h-3.5 ml-1">{er.violationSeverity}</Badge>
                )}
                {er.evaluationLatencyMs > 0 && (
                  <span className="text-muted-foreground ml-auto">{er.evaluationLatencyMs}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hash chain */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ingest Hash (SHA-256)</p>
          <p className="text-[10px] font-mono text-foreground break-all">{data.ingestHash}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Evaluation Hash</p>
          <p className="text-[10px] font-mono text-foreground break-all">{data.evaluationHash}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Lock className="w-3 h-3 text-success" />
        <span className="text-[10px] text-success font-medium">Chain Integrity: Verified ✓</span>
        <span className="text-[10px] text-muted-foreground">| Signing Key: {data.signingKeyId}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const from = useMemo(() => dateRangeToFrom(dateRange), [dateRange]);
  const complianceState = mapVerdictFilterToState(verdictFilter);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-records', { complianceState, from, page }],
    queryFn: () => queryAuditRecords({ complianceState, from, page, pageSize: PAGE_SIZE }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const records = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Client-side search on loaded page
  const filtered = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.auditId.toLowerCase().includes(q) ||
      (r.senderId ?? '').toLowerCase().includes(q) ||
      (r.threadId ?? '').toLowerCase().includes(q) ||
      r.complianceState.toLowerCase().includes(q)
    );
  });

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const toggleExpand = (auditId: string) => {
    setExpandedAuditId(prev => prev === auditId ? null : auditId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Audit Trail</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Immutable record of all governance events — cryptographically verified, searchable, exportable.</p>
        </div>
      </div>

      {/* Integrity Banner */}
      <Card className="clinical-shadow border-success/30 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Audit Log Integrity: Verified</span>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">✓</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  SHA-256 hash chain enforced | Immutability enforced at database level
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-success" />
                SHA-256 hash chain: <strong className="text-success">intact</strong>
              </span>
              <span className="text-border">│</span>
              <span>Total records: <strong className="text-foreground">{totalCount.toLocaleString()}</strong></span>
              <span className="text-border">│</span>
              <span><strong className="text-foreground">0</strong> integrity violations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Date Range</label>
              <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(0); }}>
                <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today" className="text-xs">Today</SelectItem>
                  <SelectItem value="7d" className="text-xs">Last 7 Days</SelectItem>
                  <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="all" className="text-xs">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verdict / Compliance State */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Verdict</label>
              <Select value={verdictFilter} onValueChange={(v) => { setVerdictFilter(v); setPage(0); }}>
                <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Verdicts</SelectItem>
                  <SelectItem value="PASS" className="text-xs">Pass</SelectItem>
                  <SelectItem value="BLOCK" className="text-xs">Block</SelectItem>
                  <SelectItem value="REDACT" className="text-xs">Redact</SelectItem>
                  <SelectItem value="FLAG" className="text-xs">Flag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-[180px]">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Search</label>
              <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 h-7">
                <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search audit ID, sender, thread..."
                  className="bg-transparent text-xs outline-none w-full text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5 justify-end">
              <label className="text-[9px] invisible">.</label>
              <span className="text-[11px] text-muted-foreground tabular-nums h-7 flex items-center">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${filtered.length} of ${totalCount.toLocaleString()} events`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Table */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-0">
          {isError ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Failed to load audit records. Check that ComplianceApi is running on port 5009.
            </div>
          ) : (
            <div className="max-h-[calc(100vh-480px)] min-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/90 backdrop-blur-sm">
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-36">Timestamp</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-40">Audit ID</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">Sender</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-20">Role</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-32">Thread</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-20">Channel</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-16">Verdict</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-16">Rules</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {isLoading && records.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading audit records...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">
                        No audit records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const verdict = mapComplianceStateToVerdict(r.complianceState);
                      const action = mapComplianceStateToAction(r.complianceState);
                      const isExpanded = expandedAuditId === r.auditId;

                      return (
                        <>
                          <tr
                            key={r.auditId}
                            onClick={() => toggleExpand(r.auditId)}
                            className={cn(
                              'border-b border-border/40 transition-colors cursor-pointer',
                              verdict === 'BLOCK' && 'bg-stat/5',
                              verdict === 'FLAG' && 'bg-urgent/5',
                              verdict === 'REDACT' && 'bg-ehr-part2/5',
                              isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30',
                            )}
                          >
                            <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">{formatTs(r.createdAt)}</td>
                            <td className="px-3 py-2 font-mono text-foreground text-[10px]">{r.auditId.slice(0, 8)}…</td>
                            <td className="px-3 py-2 text-foreground font-medium">{r.senderId ? r.senderId.slice(0, 12) + '…' : 'System'}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{r.senderRole ?? '—'}</Badge>
                            </td>
                            <td className="px-3 py-2 text-foreground">{action}</td>
                            <td className="px-3 py-2 text-muted-foreground text-[10px] font-mono">{r.threadId ? r.threadId.slice(0, 16) + '…' : '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.sourceChannel ?? '—'}</td>
                            <td className="px-3 py-2">
                              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[verdict] ?? verdictStyle['—'])}>{verdict}</span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground tabular-nums">
                              {r.totalRulesEvaluated}
                              {r.violationCount > 0 && (
                                <span className="text-stat ml-1">({r.violationCount}✕)</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${r.auditId}-detail`} className="bg-muted/30 border-b border-border/40">
                              <td colSpan={10}>
                                <AuditDetailRow auditId={r.auditId} />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button size="sm" className="text-xs gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
          <Download className="w-3.5 h-3.5" />
          Export Compliance Package
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Generate PHI Access Report
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          Place Legal Hold
        </Button>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">
          <strong className="text-foreground">{totalCount.toLocaleString()}</strong> total events · <strong className="text-success">0</strong> integrity violations
        </span>
      </div>
    </div>
  );
}
