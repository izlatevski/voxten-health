import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Radio,
  Filter,
  X,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  Hash,
  Link2,
  Layers,
  Eye,
} from 'lucide-react';

/* ── Types ── */
type Verdict = 'PASS' | 'FLAG' | 'BLOCK' | 'REDACT';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface GovEvent {
  id: string;
  timestamp: Date;
  verdict: Verdict;
  channel: string;
  regulation: string;
  severity: Severity;
  from: string;
  to: string;
  preview: string;
  latency: number;
  // Detail fields
  eventId: string;
  sessionId: string;
  sourceIP: string;
  fullContent: string;
  policyChain: { rule: string; result: string; time: string }[];
  aiAnalysis: string | null;
  action: string;
  auditTrailId: string;
  fhirContext: string | null;
}

/* ── Static data pools ── */
const verdictStyle: Record<Verdict, string> = {
  PASS: 'text-success bg-success/10',
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
};

const channelOptions = ['All Channels', 'Secure Chat', 'Voice', 'Video', 'SMS', 'Email', 'AI-Generated'];
const regulationOptions = ['All Regulations', 'HIPAA Privacy', 'HIPAA Security', 'Joint Commission NPG', '42 CFR Part 2', '21st Century Cures', 'CMS CoP'];
const verdictOptions: (Verdict | 'All Verdicts')[] = ['All Verdicts', 'PASS', 'FLAG', 'BLOCK', 'REDACT'];
const severityOptions = ['All', 'Critical', 'High', 'Medium', 'Low', 'Info'];
const timeOptions = ['Live', 'Last Hour', 'Today', 'Last 7 Days'];

const channelsList = ['Secure Chat', 'AI-Generated', 'Email', 'Voice', 'Video', 'SMS'];
const regs = ['HIPAA Privacy', 'HIPAA Security', 'Joint Commission NPG', '42 CFR Part 2', '21st Century Cures', 'CMS CoP'];
const severities: Severity[] = ['low', 'medium', 'high', 'critical'];

const people = [
  { from: 'Dr. Rivera', to: 'Care Team', content: 'Patient discharge plan has been updated. K+ levels are normalizing after treatment with sodium polystyrene. Recommend follow-up in 48 hours with repeat BMP. Continue monitoring I/O and daily weights.' },
  { from: 'Copilot', to: 'Dr. Chen', content: 'AI-generated summary: Patient Robert Martinez, 67M, admitted 02/19 for CHF exacerbation. Current medications include Furosemide 40mg IV BID, Lisinopril 10mg PO daily. Labs show improving BNP trend.' },
  { from: 'PharmD Kim', to: 'Dr. Rivera', content: 'Medication reconciliation complete for patient Martinez. Confirmed Furosemide 40mg BID, Lisinopril 10mg daily, Potassium Chloride 20mEq daily. No interactions identified. Ready for discharge.' },
  { from: 'Nurse Torres', to: 'Dr. Kim', content: 'Voice call transcript: Discussed patient room 412 bed A status. Vitals stable, BP 128/82, HR 76, O2 sat 97% on 2L NC. Patient reports decreased dyspnea. Awaiting pharmacy for evening medication pass.' },
  { from: 'Discharge Agent', to: 'Patient Portal', content: 'Dear Mr. Martinez, your discharge instructions have been prepared. Please follow up with Dr. Chen within 7 days. Your diagnosis of CHF requires daily weight monitoring and sodium restriction to <2000mg/day.' },
  { from: 'Dr. Chen', to: 'Lab Team', content: 'Requesting stat BMP and troponin for patient MRN-0038291. Clinical concern for worsening renal function given rising creatinine trend. Please call critical values immediately.' },
  { from: 'Clinical Agent', to: 'EHR', content: 'Auto-generated progress note: Patient showing clinical improvement day 4 of admission. Diuresis achieving target negative fluid balance of -1.5L/day. Echo scheduled for tomorrow AM.' },
  { from: 'P. Okonkwo', to: 'Compliance Team', content: 'Weekly compliance summary generated. 338,291 events governed this period. 147 violations detected, all resolved within SLA. HIPAA pack caught 89 PHI-related events, 42 CFR Part 2 flagged 4 communications.' },
];

const ruleTemplates: Record<string, { rule: string; result: string }[]> = {
  'HIPAA Privacy': [
    { rule: 'HIPAA-PHI-SMS-001', result: 'PHI pattern scan' },
    { rule: 'HIPAA-PHI-EMAIL-003', result: 'Encryption verification' },
    { rule: 'HIPAA-MINNEC-005', result: 'Minimum necessary check' },
  ],
  'HIPAA Security': [
    { rule: 'HIPAA-SEC-ACCESS-001', result: 'Access control verification' },
    { rule: 'HIPAA-SEC-AUDIT-002', result: 'Audit logging check' },
  ],
  'Joint Commission NPG': [
    { rule: 'JC-NPG-HANDOFF-001', result: 'Handoff communication check' },
    { rule: 'JC-NPG-CRIT-002', result: 'Critical result notification' },
    { rule: 'JC-NPG-IDENT-003', result: 'Patient identification check' },
  ],
  '42 CFR Part 2': [
    { rule: 'HIPAA-PART2-008', result: 'SUD data consent check' },
    { rule: 'CFR2-SEGMENT-001', result: 'Segmented audit trail' },
  ],
  '21st Century Cures': [
    { rule: 'CURES-BLOCK-001', result: 'Information blocking check' },
    { rule: 'CURES-FHIR-002', result: 'FHIR R4 export verification' },
  ],
  'CMS CoP': [
    { rule: 'CMS-COP-NOTIFY-001', result: 'Patient notification check' },
    { rule: 'CMS-COP-COORD-002', result: 'Care coordination verification' },
  ],
};

let eventCounter = 0;

function generateEvent(): GovEvent {
  eventCounter++;
  // Create timestamps that count backwards from 14:23:xx with varied spacing
  const base = new Date();
  base.setHours(14, 23, 30, 0);
  const offsetSec = eventCounter * (3 + Math.floor(Math.random() * 12));
  const ts = new Date(base.getTime() - offsetSec * 1000);

  const rand = Math.random();
  let verdict: Verdict;
  if (rand < 0.90) verdict = 'PASS';
  else if (rand < 0.94) verdict = 'FLAG';
  else if (rand < 0.98) verdict = 'REDACT';
  else verdict = 'BLOCK';

  const channel = channelsList[Math.floor(Math.random() * channelsList.length)];
  const reg = regs[Math.floor(Math.random() * regs.length)];
  const sev: Severity = verdict === 'BLOCK' ? 'critical' : verdict === 'FLAG' ? (Math.random() > 0.5 ? 'high' : 'medium') : verdict === 'REDACT' ? 'high' : severities[Math.floor(Math.random() * severities.length)];
  const pair = people[Math.floor(Math.random() * people.length)];
  const latency = 8 + Math.floor(Math.random() * 57);
  const regKey = Object.keys(ruleTemplates).includes(reg) ? reg : 'HIPAA Privacy';
  const chain = (ruleTemplates[regKey] || ruleTemplates['HIPAA Privacy']).map((r) => ({
    rule: r.rule,
    result: verdict === 'PASS' ? 'PASS' : (Math.random() > 0.6 ? verdict : 'PASS'),
    time: `${2 + Math.floor(Math.random() * 15)}ms`,
  }));

  const hasAI = channel === 'AI-Generated' || Math.random() > 0.5;

  return {
    id: `evt-${eventCounter}`,
    timestamp: ts,
    verdict,
    channel,
    regulation: reg,
    severity: sev,
    from: pair.from,
    to: pair.to,
    preview: pair.content.slice(0, 60) + '...',
    latency,
    eventId: `VOX-2026-${String(48000 + eventCounter).padStart(7, '0')}`,
    sessionId: `sess-${Math.random().toString(36).slice(2, 10)}`,
    sourceIP: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    fullContent: pair.content,
    policyChain: chain,
    aiAnalysis: hasAI
      ? `Azure OpenAI semantic analysis performed. Detected entities: [Patient Name] (Person, 0.97), [MRN] (Medical Record, 0.99), [Medication] (Clinical, 0.94). Classification: ${verdict === 'PASS' ? 'No policy-relevant content.' : `Policy-relevant content detected. Confidence: 0.${92 + Math.floor(Math.random() * 7)}.`}`
      : null,
    action: `${verdict} at ${ts.toISOString()} by policy engine`,
    auditTrailId: `VOX-2026-${String(48000 + eventCounter).padStart(7, '0')}`,
    fhirContext: reg.startsWith('HIPAA') ? 'Patient/epic-pat-38291 | Encounter/enc-77402 | Practitioner/pract-1042' : null,
  };
}

/* ── Page ── */
export default function LiveFeed() {
  const [events, setEvents] = useState<GovEvent[]>(() => Array.from({ length: 20 }, () => generateEvent()).reverse());
  const [paused, setPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GovEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [verdictFilter, setVerdictFilter] = useState<Verdict | 'All Verdicts'>('All Verdicts');
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [regFilter, setRegFilter] = useState('All Regulations');
  const [sevFilter, setSevFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Live');

  useEffect(() => {
    if (paused || timeFilter !== 'Live') return;
    const interval = setInterval(() => {
      setEvents((prev) => [generateEvent(), ...prev].slice(0, 100));
    }, 1500 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [paused, timeFilter]);

  const filtered = events.filter((e) => {
    if (verdictFilter !== 'All Verdicts' && e.verdict !== verdictFilter) return false;
    if (channelFilter !== 'All Channels' && e.channel !== channelFilter) return false;
    if (regFilter !== 'All Regulations' && e.regulation !== regFilter) return false;
    if (sevFilter !== 'All' && e.severity.toLowerCase() !== sevFilter.toLowerCase()) return false;
    return true;
  });

  const openDetail = useCallback((e: GovEvent) => {
    setSelectedEvent(e);
    setDrawerOpen(true);
  }, []);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const activeFilters = [verdictFilter !== 'All Verdicts', channelFilter !== 'All Channels', regFilter !== 'All Regulations', sevFilter !== 'All'].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Live Governance Feed</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time streaming view of all communication events flowing through VOXTEN.
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

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Message Rate', value: '23/min' },
          { label: 'Blocked Today', value: '2' },
          { label: 'Avg Evaluation', value: '12ms' },
          { label: 'Total Today', value: '847' },
        ].map((s) => (
          <Card key={s.label} className="clinical-shadow border-border">
            <CardContent className="p-2.5 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Verdict</label>
            <Select value={verdictFilter} onValueChange={(v) => setVerdictFilter(v as Verdict | 'All Verdicts')}>
              <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {verdictOptions.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Channel</label>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {channelOptions.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Regulation</label>
            <Select value={regFilter} onValueChange={setRegFilter}>
              <SelectTrigger className="h-7 text-xs w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {regulationOptions.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Severity</label>
            <Select value={sevFilter} onValueChange={setSevFilter}>
              <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {severityOptions.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Time</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeOptions.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground gap-1"
              onClick={() => { setVerdictFilter('All Verdicts'); setChannelFilter('All Channels'); setRegFilter('All Regulations'); setSevFilter('All'); }}
            >
              <X className="w-3 h-3" />
              Clear ({activeFilters})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Event Table */}
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
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-16">Reg</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">From → To</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden xl:table-cell">Preview</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-16">Latency</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => openDetail(e)}
                    className={cn(
                      'border-b border-border/40 transition-colors cursor-pointer',
                      e.verdict === 'BLOCK' && 'bg-stat/5 hover:bg-stat/10',
                      e.verdict === 'FLAG' && 'bg-urgent/5 hover:bg-urgent/10',
                      e.verdict === 'REDACT' && 'bg-ehr-part2/5 hover:bg-ehr-part2/10',
                      e.verdict === 'PASS' && 'hover:bg-muted/50',
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-muted-foreground">{formatTime(e.timestamp)}</td>
                    <td className="px-4 py-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[e.verdict])}>{e.verdict}</span>
                    </td>
                    <td className="px-4 py-2 text-foreground">{e.channel}</td>
                    <td className="px-4 py-2 text-muted-foreground">{e.regulation}</td>
                    <td className="px-4 py-2 text-foreground">{e.from} → {e.to}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[220px] hidden xl:table-cell">{e.preview}</td>
                    <td className="px-4 py-2 text-right font-mono text-muted-foreground tabular-nums">{e.latency}ms</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No events match the current filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <span className={cn('px-2 py-0.5 rounded text-xs font-bold', verdictStyle[selectedEvent.verdict])}>{selectedEvent.verdict}</span>
                  Event Detail
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Metadata */}
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Event Metadata</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <MetaRow icon={Hash} label="Event ID" value={selectedEvent.eventId} mono />
                    <MetaRow icon={Clock} label="Timestamp" value={selectedEvent.timestamp.toISOString()} mono />
                    <MetaRow icon={Hash} label="Session ID" value={selectedEvent.sessionId} mono />
                    <MetaRow icon={Link2} label="Source IP" value={selectedEvent.sourceIP} mono />
                  </div>
                </section>

                {/* Full Content */}
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Message Content</h3>
                  <div className="bg-muted rounded-md p-3 text-xs text-foreground leading-relaxed">
                    {selectedEvent.fullContent}
                  </div>
                </section>

                {/* Policy Evaluation Chain */}
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Policy Evaluation Chain
                  </h3>
                  <div className="space-y-1.5">
                    {selectedEvent.policyChain.map((step, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground tabular-nums w-4">{i + 1}.</span>
                          <span className="font-mono text-foreground">{step.rule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            step.result === 'PASS' ? verdictStyle.PASS : step.result === 'FLAG' ? verdictStyle.FLAG : step.result === 'BLOCK' ? verdictStyle.BLOCK : verdictStyle.REDACT
                          )}>
                            {step.result}
                          </span>
                          <span className="text-muted-foreground tabular-nums">{step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* AI Analysis */}
                {selectedEvent.aiAnalysis && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      AI Analysis Reasoning
                    </h3>
                    <div className="bg-ehr-part2/5 border border-ehr-part2/20 rounded-md p-3 text-xs text-foreground leading-relaxed">
                      {selectedEvent.aiAnalysis}
                    </div>
                  </section>
                )}

                {/* Action */}
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Action Taken</h3>
                  <p className="text-xs text-foreground">{selectedEvent.action}</p>
                </section>

                {/* FHIR Context */}
                {selectedEvent.fhirContext && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">FHIR Context</h3>
                    <p className="text-xs font-mono text-foreground bg-muted rounded-md p-2">{selectedEvent.fhirContext}</p>
                  </section>
                )}

                {/* Audit Trail Link */}
                <section className="pt-2 border-t border-border">
                  <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    View in Audit Trail → {selectedEvent.auditTrailId}
                  </button>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── Helper ── */
function MetaRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{label}</span>
      <span className={cn('text-foreground truncate', mono && 'font-mono text-[11px]')}>{value}</span>
    </div>
  );
}
