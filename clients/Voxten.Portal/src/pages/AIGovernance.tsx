import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bot,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Header Stats ── */
const headerStats = [
  { label: 'AI Communications Today', value: '12,847', icon: Bot, color: 'text-ehr-part2' },
  { label: 'Governance Pass Rate', value: '99.82%', icon: ShieldCheck, color: 'text-success' },
  { label: 'Blocked', value: '2', icon: ShieldAlert, color: 'text-stat' },
  { label: 'Flagged', value: '18', icon: AlertTriangle, color: 'text-urgent' },
  { label: 'Redacted', value: '7', icon: Eye, color: 'text-ehr-part2' },
];

/* ── AI Sources ── */
const aiSources = [
  { name: 'Azure OpenAI (GPT-4o)', events: 6218, pass: 6201, flag: 12, block: 5, redact: 0, status: 'governed' },
  { name: 'Copilot for Microsoft 365', events: 4102, pass: 4098, flag: 4, block: 0, redact: 3, status: 'governed' },
  { name: 'Clinical Summary Agent', events: 1841, pass: 1839, flag: 2, block: 0, redact: 4, status: 'governed' },
  { name: 'Discharge Letter Agent', events: 686, pass: 683, flag: 2, block: 2, redact: 0, status: 'governed' },
  { name: 'Unmonitored Sources', events: null, pass: null, flag: null, block: null, redact: null, status: 'unmonitored' },
];

/* ── AI Policy Rules ── */
const aiPolicies = [
  { id: 'AI-PHI-001', name: 'Detect PHI in AI-generated content', action: 'Redact & Send', severity: 'critical' as const, fired: 7, lastFired: '45m ago' },
  { id: 'AI-ACCURACY-001', name: 'Flag AI content that contradicts source data', action: 'Flag for Review', severity: 'high' as const, fired: 4, lastFired: '2h ago' },
  { id: 'AI-CONSENT-001', name: 'Block AI content containing restricted data without consent', action: 'Block', severity: 'critical' as const, fired: 2, lastFired: '6h ago' },
  { id: 'AI-HALLUCINATION-001', name: 'Flag AI content with low confidence scores', action: 'Flag for Review', severity: 'medium' as const, fired: 9, lastFired: '30m ago' },
  { id: 'AI-BIAS-001', name: 'Detect potentially biased language in AI communications', action: 'Flag', severity: 'medium' as const, fired: 3, lastFired: '4h ago' },
];

const severityBadge: Record<string, string> = {
  critical: 'bg-stat/10 text-stat border-stat/20',
  high: 'bg-urgent/10 text-urgent border-urgent/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
};

/* ── AI Governance Events ── */
type AIVerdict = 'REDACT' | 'FLAG' | 'BLOCK' | 'PASS';

interface AIEvent {
  id: number;
  time: string;
  verdict: AIVerdict;
  source: string;
  target: string;
  description: string;
  rule: string;
}

const verdictStyle: Record<AIVerdict, string> = {
  PASS: 'text-success bg-success/10',
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
};

const eventTemplates: Omit<AIEvent, 'id' | 'time'>[] = [
  { verdict: 'PASS', source: 'Copilot for M365', target: 'Dr. Rivera', description: 'Clinical summary for Martinez, Robert — PHI compliant, accuracy verified against EHR.', rule: 'N/A' },
  { verdict: 'REDACT', source: 'Clinical Summary Agent', target: 'EHR', description: 'Patient identifier removed from AI-generated handoff note. De-identified content delivered.', rule: 'AI-PHI-001' },
  { verdict: 'PASS', source: 'Discharge Letter Generator', target: 'Patient Portal', description: 'Discharge instructions for Williams, David — Verified against EHR, no PHI leakage.', rule: 'N/A' },
  { verdict: 'FLAG', source: 'Copilot for M365', target: 'Nurse Torres', description: 'AI response referenced medication dosage not in source EHR. Flagged for clinical review before delivery.', rule: 'AI-ACCURACY-001' },
  { verdict: 'PASS', source: 'Medication Interaction Checker', target: 'PharmD Kim', description: 'Drug interaction analysis complete — No PHI in output, 3 interactions evaluated.', rule: 'N/A' },
  { verdict: 'BLOCK', source: 'Clinical Summary Agent', target: 'Care Team', description: 'AI attempted to include SSN in patient summary. Blocked by PHI detection policy. Content held.', rule: 'AI-PHI-001' },
  { verdict: 'REDACT', source: 'Copilot for M365', target: 'Dr. Chen', description: 'Patient MRN and phone number detected in AI-generated email summary. PII tokens redacted before delivery.', rule: 'AI-PHI-001' },
  { verdict: 'PASS', source: 'Clinical Summary Agent', target: 'Dr. Kim', description: 'Lab result summary generated for patient in 4N-302. Content governance checks passed.', rule: 'N/A' },
  { verdict: 'FLAG', source: 'Discharge Letter Generator', target: 'External Facility', description: 'AI-generated referral letter references behavioral health history. 42 CFR Part 2 consent verification required.', rule: 'AI-CONSENT-001' },
  { verdict: 'PASS', source: 'Medication Interaction Checker', target: 'Dr. Rivera', description: 'Metformin + IV contrast interaction flagged clinically. AI output contains no PHI — governance passed.', rule: 'N/A' },
  { verdict: 'BLOCK', source: 'Discharge Letter Generator', target: 'Patient Portal', description: 'AI-generated letter contained substance use disorder data without documented consent. Blocked per 42 CFR Part 2.', rule: 'AI-CONSENT-001' },
  { verdict: 'FLAG', source: 'Copilot for M365', target: 'P. Okonkwo', description: 'AI-generated compliance report has low confidence score (0.71) on violation count. Flagged for manual verification.', rule: 'AI-HALLUCINATION-001' },
];

function generateAIEvent(id: number): AIEvent {
  const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
  const now = new Date();
  return {
    ...template,
    id,
    time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/* ── Page Component ── */
export default function AIGovernance() {
  const [events, setEvents] = useState<AIEvent[]>(() => {
    const init: AIEvent[] = [];
    for (let i = 0; i < 10; i++) init.push(generateAIEvent(i));
    return init.reverse();
  });
  const [paused, setPaused] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<AIVerdict | 'all'>('all');
  const idRef = useRef(10);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      idRef.current++;
      setEvents((prev) => [generateAIEvent(idRef.current), ...prev].slice(0, 50));
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [paused]);

  const filteredEvents = verdictFilter === 'all' ? events : events.filter((e) => e.verdict === verdictFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-ehr-part2" />
          <h1 className="text-2xl font-semibold text-foreground">AI Communication Governance</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and govern all AI-generated communications across Azure OpenAI, Copilot, and custom agents.
        </p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {headerStats.map((s) => (
          <Card key={s.label} className="clinical-shadow border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={cn('w-5 h-5', s.color)} />
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row: AI Source Monitor + AI Volume Trend */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Source Monitor Table */}
        <Card className="clinical-shadow border-border flex-[2]">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">AI Source Monitor</h2>
              <Badge variant="outline" className="bg-ehr-part2/10 text-ehr-part2 border-ehr-part2/20 text-[10px] gap-1 h-5">
                <TrendingUp className="w-3 h-3" />
                +340% (90d)
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Source</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Events</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pass</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Flag</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Block</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Redact</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aiSources.map((s) => {
                    const isUnmonitored = s.status === 'unmonitored';
                    return (
                      <tr key={s.name} className={cn(
                        'border-b border-border/50 transition-colors',
                        isUnmonitored ? 'bg-stat/5 hover:bg-stat/10' : 'hover:bg-muted/30'
                      )}>
                        <td className={cn('px-4 py-2.5 font-medium', isUnmonitored ? 'text-stat' : 'text-foreground')}>
                          {isUnmonitored && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-stat" />}
                          {s.name}
                          {isUnmonitored && <span className="ml-2 text-[10px] font-semibold text-stat">Shadow AI — No governance visibility</span>}
                        </td>
                        <td className={cn('px-4 py-2.5 text-right tabular-nums', isUnmonitored ? 'text-stat font-semibold' : 'text-foreground')}>{s.events?.toLocaleString() ?? '??'}</td>
                        <td className={cn('px-4 py-2.5 text-right tabular-nums', isUnmonitored ? 'text-stat' : 'text-success')}>{s.pass?.toLocaleString() ?? '??'}</td>
                        <td className={cn('px-4 py-2.5 text-right tabular-nums', isUnmonitored ? 'text-stat' : 'text-urgent')}>{s.flag ?? '??'}</td>
                        <td className={cn('px-4 py-2.5 text-right tabular-nums', isUnmonitored ? 'text-stat' : 'text-stat')}>{s.block ?? '??'}</td>
                        <td className={cn('px-4 py-2.5 text-right tabular-nums', isUnmonitored ? 'text-stat' : 'text-ehr-part2')}>{s.redact ?? '??'}</td>
                        <td className="px-4 py-2.5 text-right">
                          {s.status === 'governed' ? (
                            <span className="inline-flex items-center gap-1 text-success text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-success" />
                              Gov
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-stat text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              NONE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-2.5 border-t border-border">
              <p className="text-[11px] text-muted-foreground">
                Sources monitored: <strong className="text-foreground">Azure OpenAI</strong>, <strong className="text-foreground">Copilot for Microsoft 365</strong>, <strong className="text-foreground">Custom Agents</strong> · AI communication volume <strong className="text-ehr-part2">+340%</strong> in 90 days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Policy Configuration */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">AI Policy Configuration</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {aiPolicies.map((p) => (
                <div key={p.id} className="p-3 rounded-md border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.id}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4 uppercase flex-shrink-0', severityBadge[p.severity])}>
                      {p.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{p.action}</Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{p.fired}× · {p.lastFired}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Governance Event Feed */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">AI Governance Event Feed</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={verdictFilter} onValueChange={(v) => setVerdictFilter(v as AIVerdict | 'all')}>
                <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="REDACT" className="text-xs">Redact</SelectItem>
                  <SelectItem value="FLAG" className="text-xs">Flag</SelectItem>
                  <SelectItem value="BLOCK" className="text-xs">Block</SelectItem>
                  <SelectItem value="PASS" className="text-xs">Pass</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground">
                {paused ? 'Paused' : 'Live'}
              </span>
            </div>
          </div>
          <div
            className="max-h-[400px] overflow-y-auto"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="divide-y divide-border/50">
              {filteredEvents.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    'px-5 py-3 hover:bg-muted/30 transition-colors',
                    e.verdict === 'BLOCK' && 'bg-stat/5',
                    e.verdict === 'FLAG' && 'bg-urgent/5',
                    e.verdict === 'REDACT' && 'bg-ehr-part2/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground mt-0.5 w-16 flex-shrink-0">{e.time}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5', verdictStyle[e.verdict])}>
                      {e.verdict}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        <strong>{e.source}</strong>
                        <span className="text-muted-foreground"> → </span>
                        <strong>{e.target}</strong>
                        <span className="text-muted-foreground">: </span>
                        {e.description}
                      </p>
                      {e.rule !== 'N/A' && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">Rule: {e.rule}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
