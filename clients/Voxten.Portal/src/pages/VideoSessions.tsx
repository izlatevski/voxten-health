import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Video,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Lock,
  FileText,
  Monitor,
  Eye,
  Hash,
  Users,
  MapPin,
} from 'lucide-react';

/* ── Types ── */
interface VideoSession {
  id: string;
  status: 'live' | 'completed' | 'scheduled';
  provider: string;
  participant: string;
  type: 'Telehealth Visit' | 'Virtual Consult' | 'Virtual Rounding' | 'Post-Discharge Check-in' | 'Admin';
  startTime: string;
  duration?: string;
  elapsed?: string;
  consent: boolean;
  recording: boolean;
  transcribed: boolean;
  compliant: boolean;
  flags: { rule: string; desc: string }[];
  encrypted: boolean;
  monitoring: boolean;
  // Detail fields
  patientMRN?: string;
  visitType?: string;
  providerLocation?: string;
  patientLocation?: string;
  stateLicense?: boolean;
  ehrLinked?: boolean;
  auditEventId?: string;
  transcriptAnalysis?: string;
  archiveStatus?: { recording: boolean; transcript: boolean; retention: string; hash: boolean };
}

/* ── Demo Data ── */
const sessions: VideoSession[] = [
  {
    id: 'vs-001', status: 'live', provider: 'Dr. Rivera', participant: 'Martinez, Robert',
    type: 'Telehealth Visit', startTime: '14:12', elapsed: '12:47',
    consent: true, recording: true, transcribed: false, compliant: true, flags: [],
    encrypted: true, monitoring: true,
    patientMRN: '0038291', visitType: 'Follow-up — CHF management',
    providerLocation: 'St. Mary Medical Center', patientLocation: 'Colorado (home)',
    stateLicense: true, ehrLinked: true, auditEventId: 'VOX-2026-0483102',
    transcriptAnalysis: 'Session in progress — real-time monitoring active. No governance events detected.',
    archiveStatus: { recording: false, transcript: false, retention: '7 years (HIPAA + State req.)', hash: false },
  },
  {
    id: 'vs-002', status: 'live', provider: 'Dr. Chen', participant: 'Dr. Patel',
    type: 'Virtual Consult', startTime: '14:08', elapsed: '16:33',
    consent: true, recording: true, transcribed: false, compliant: true, flags: [],
    encrypted: true, monitoring: true,
    providerLocation: 'St. Mary Medical Center', patientLocation: 'N/A (Provider-to-Provider)',
    auditEventId: 'VOX-2026-0483098',
    transcriptAnalysis: 'Provider-to-provider consult — no patient PHI restrictions for clinical discussion.',
  },
  {
    id: 'vs-003', status: 'completed', provider: 'Dr. Rivera', participant: 'Thompson, Angela',
    type: 'Telehealth Visit', startTime: '13:45', duration: '18m',
    consent: true, recording: true, transcribed: true, compliant: true, flags: [],
    encrypted: true, monitoring: false,
    patientMRN: '0041877', visitType: 'Follow-up — Post-surgical recovery',
    providerLocation: 'St. Mary Medical Center', patientLocation: 'California (home)',
    stateLicense: true, ehrLinked: true, auditEventId: 'VOX-2026-0483087',
    transcriptAnalysis: 'Transcript analyzed by policy engine:\n• PHI Detection: Names, medications, vitals discussed — all within clinical context of active patient encounter. Verdict: COMPLIANT (minimum necessary met)\n• No off-channel references detected\n• No restricted data (42 CFR Part 2)',
    archiveStatus: { recording: true, transcript: true, retention: '7 years (HIPAA + State req.)', hash: true },
  },
  {
    id: 'vs-004', status: 'completed', provider: 'Dr. Kim', participant: 'Williams, David',
    type: 'Telehealth Visit', startTime: '11:20', duration: '12m',
    consent: true, recording: true, transcribed: true, compliant: false,
    flags: [{ rule: 'HIPAA-VIDEO-003', desc: 'State licensing check — provider may not be licensed in patient state' }],
    encrypted: true, monitoring: false,
    patientMRN: '0039442', visitType: 'Cardiology follow-up',
    providerLocation: 'St. Mary Medical Center (CA)', patientLocation: 'Nevada (home)',
    stateLicense: false, ehrLinked: true, auditEventId: 'VOX-2026-0483071',
    transcriptAnalysis: 'Transcript analyzed by policy engine:\n• PHI Detection: Clinical data within encounter context — COMPLIANT\n• ⚠ State licensing flag: Provider licensed in CA, patient located in NV. Verification pending.\n• No restricted data detected',
    archiveStatus: { recording: true, transcript: true, retention: '7 years (HIPAA + State req.)', hash: true },
  },
  {
    id: 'vs-005', status: 'completed', provider: 'Nurse Torres', participant: 'Garcia, Maria',
    type: 'Post-Discharge Check-in', startTime: '09:15', duration: '8m',
    consent: true, recording: true, transcribed: true, compliant: true, flags: [],
    encrypted: true, monitoring: false,
    patientMRN: '0040112', visitType: 'Post-discharge — medication reconciliation',
    providerLocation: 'St. Mary Medical Center', patientLocation: 'California (home)',
    stateLicense: true, ehrLinked: true, auditEventId: 'VOX-2026-0483044',
    transcriptAnalysis: 'Transcript analyzed by policy engine:\n• PHI Detection: Patient name and medications discussed — within clinical context. Verdict: COMPLIANT\n• No off-channel references detected\n• No restricted data (42 CFR Part 2)',
    archiveStatus: { recording: true, transcript: true, retention: '7 years (HIPAA + State req.)', hash: true },
  },
  {
    id: 'vs-006', status: 'scheduled', provider: 'Dr. Rivera', participant: 'Williams, David',
    type: 'Telehealth Visit', startTime: '15:30',
    consent: false, recording: false, transcribed: false, compliant: true, flags: [],
    encrypted: true, monitoring: false,
  },
];

/* ── Component ── */
export default function VideoSessions() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  const filtered = sessions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Video Sessions</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Governed telehealth and clinical video communication sessions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Sessions</SelectItem>
            <SelectItem value="live" className="text-xs">Live Now</SelectItem>
            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
            <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-7 text-xs w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            <SelectItem value="Telehealth Visit" className="text-xs">Telehealth</SelectItem>
            <SelectItem value="Virtual Consult" className="text-xs">Virtual Consult</SelectItem>
            <SelectItem value="Virtual Rounding" className="text-xs">Virtual Rounding</SelectItem>
            <SelectItem value="Post-Discharge Check-in" className="text-xs">Post-Discharge</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">{filtered.length} sessions</span>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Session List */}
        <Card className="clinical-shadow border-border flex-1 lg:max-w-[55%]">
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted/40',
                    selectedId === s.id && 'bg-primary/5 border-l-[3px] border-l-primary',
                    s.flags.length > 0 && 'border-l-[3px] border-l-urgent'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {s.status === 'live' && (
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse-subtle flex-shrink-0" />
                    )}
                    {s.status === 'completed' && (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />
                    )}
                    {s.status === 'scheduled' && (
                      <span className="w-2 h-2 rounded-full border border-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {s.provider} ↔ {s.participant}
                    </span>
                    {s.status === 'live' && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-success/10 text-success border-success/20 ml-auto">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1">{s.type}</Badge>
                    <span>{s.status === 'live' ? `Started ${s.startTime}` : s.status === 'completed' ? `${s.startTime} · ${s.duration}` : `Scheduled ${s.startTime}`}</span>
                  </div>
                  {s.status !== 'scheduled' && (
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      {s.consent && <span className="text-success">✓ Consent</span>}
                      {s.recording && <span className="text-success">✓ Recording</span>}
                      {s.transcribed && <span className="text-success">✓ Transcribed</span>}
                      {s.encrypted && <span className="text-success">✓ Encrypted</span>}
                      {s.monitoring && <span className="text-primary">● Monitoring</span>}
                      {s.flags.length > 0 && (
                        <span className="text-urgent ml-auto">⚠ {s.flags.length} Flag{s.flags.length > 1 ? 's' : ''}</span>
                      )}
                      {s.flags.length === 0 && s.status === 'completed' && (
                        <span className="text-success ml-auto">✓ Compliant</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No sessions match filters</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            {!selected ? (
              /* ── Empty State: Aggregate Stats ── */
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Sessions Today', value: '12' },
                    { label: 'Consent Coverage', value: '100%' },
                    { label: 'Flagged Sessions', value: '0' },
                    { label: 'Avg Duration', value: '18 min' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-success font-medium text-center flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> All recordings encrypted & archived
                </p>
                {/* Sessions by Hour */}
                <div>
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sessions by Hour</h3>
                  <div className="flex items-end gap-1.5 h-20">
                    {[
                      { h: '7a', v: 1 }, { h: '8a', v: 2 }, { h: '9a', v: 3 }, { h: '10a', v: 2 },
                      { h: '11a', v: 1 }, { h: '12p', v: 0 }, { h: '1p', v: 2 }, { h: '2p', v: 1 },
                    ].map((bar) => (
                      <div key={bar.h} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full bg-primary/20 rounded-sm min-h-[2px]"
                          style={{ height: `${Math.max(bar.v * 25, 2)}%` }}
                        />
                        <span className="text-[8px] text-muted-foreground">{bar.h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Selected Session Detail ── */
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {/* Session Header */}
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={cn('text-[10px]',
                      selected.status === 'live' ? 'bg-success/10 text-success border-success/20' :
                      selected.status === 'scheduled' ? 'bg-muted text-muted-foreground' :
                      'bg-primary/10 text-primary border-primary/20'
                    )}>
                      {selected.status === 'live' ? '● LIVE' : selected.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{selected.type}</Badge>
                  </div>
                  <h2 className="text-base font-semibold text-foreground">
                    {selected.type} — {selected.participant}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selected.duration ? `Duration: ${selected.duration}` : selected.elapsed ? `Elapsed: ${selected.elapsed}` : `Scheduled ${selected.startTime}`}
                    {' | '}Status: {selected.status === 'live' ? 'In Progress' : selected.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                  </p>
                </div>

                {/* Participants */}
                <DetailSection title="Participants" icon={Users}>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-foreground font-medium">{selected.provider}</span>
                      <span className="text-muted-foreground">
                        {selected.type === 'Virtual Consult' ? 'Consulting Physician' : 'Hospitalist'}
                      </span>
                    </div>
                    {selected.type !== 'Virtual Consult' && (
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-foreground font-medium">{selected.participant}</span>
                        <span className="text-muted-foreground">Patient</span>
                      </div>
                    )}
                    {selected.type === 'Virtual Consult' && (
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-foreground font-medium">{selected.participant}</span>
                        <span className="text-muted-foreground">Consulting Physician</span>
                      </div>
                    )}
                  </div>
                </DetailSection>

                {/* Governance Checkmarks — enhanced */}
                {selected.status !== 'scheduled' && (
                  <DetailSection title="Governance Status" icon={Shield}>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <StatusRow label="✓ Consent" value={selected.consent ? 'Obtained' : 'Not recorded'} ok={selected.consent} />
                        {selected.consent && (
                          <p className="text-[10px] text-muted-foreground pl-4 mt-0.5">
                            Verbal consent recorded at 0:00:12 — Witnessed by attending staff
                          </p>
                        )}
                      </div>
                      <div>
                        <StatusRow label="✓ Recording" value={selected.recording ? 'Active' : 'Not recording'} ok={selected.recording} />
                        {selected.recording && (
                          <p className="text-[10px] text-muted-foreground pl-4 mt-0.5">
                            Full session recorded — Storage: Azure Blob — Encrypted
                          </p>
                        )}
                      </div>
                      <div>
                        <StatusRow label="✓ Encryption" value="AES-256 end-to-end" ok />
                        <p className="text-[10px] text-muted-foreground pl-4 mt-0.5">
                          AES-256 end-to-end — Certificate: valid
                        </p>
                      </div>
                      <div>
                        <StatusRow
                          label="✓ Transcription"
                          value={selected.transcribed ? 'Complete' : selected.status === 'live' ? 'In progress' : 'Pending'}
                          ok={selected.transcribed || selected.status === 'live'}
                        />
                        {selected.transcribed && (
                          <p className="text-[10px] text-muted-foreground pl-4 mt-0.5">
                            AI transcription complete — Governance scan: PASS — 0 violations
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Flags */}
                    {selected.flags.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {selected.flags.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-urgent/5 border border-urgent/20 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-urgent flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-mono text-urgent text-[10px]">{f.rule}</span>
                              <p className="text-muted-foreground mt-0.5">{f.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </DetailSection>
                )}

                {/* Transcript Preview */}
                {selected.transcribed && (
                  <DetailSection title="Transcript Preview" icon={FileText}>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { time: '0:00:12', speaker: selected.provider, text: 'Good afternoon, can you confirm your full name and date of birth for me?', verdict: 'PASS' as const },
                        { time: '0:01:45', speaker: selected.participant, text: 'Yes, and I\'ve been taking the medications as prescribed. The swelling has gone down.', verdict: 'PASS' as const },
                        { time: '0:03:22', speaker: selected.provider, text: 'Your labs from this morning look improved. Potassium is back in normal range at 4.1.', verdict: 'PASS' as const },
                        { time: '0:05:10', speaker: selected.provider, text: 'I\'m going to adjust your Furosemide to 20mg oral and continue the Lisinopril.', verdict: 'PASS' as const },
                      ].map((line, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                          <span className="font-mono text-muted-foreground w-12 shrink-0 tabular-nums">{line.time}</span>
                          <div className="flex-1">
                            <span className="font-medium text-foreground">{line.speaker}:</span>{' '}
                            <span className="text-muted-foreground">{line.text}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-success/10 text-success border-success/20 shrink-0">
                            {line.verdict}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="text-[11px] h-7">View Full Transcript</Button>
                      <Button variant="outline" size="sm" className="text-[11px] h-7">View Recording</Button>
                    </div>
                  </DetailSection>
                )}

                {/* Audit Trail */}
                {selected.auditEventId && (
                  <DetailSection title="Audit Trail" icon={Hash}>
                    <div className="space-y-1.5 text-xs">
                      <InfoRow label="Session Audit ID" value="VOX-2026-VID-0089" />
                      <InfoRow label="SHA-256 Hash" value="8f2c9a1b3d4e5f6a7b8c..." />
                      <StatusRow label="Integrity" value="Verified ✓" ok />
                    </div>
                  </DetailSection>
                )}

                {/* Archive */}
                {selected.archiveStatus && (
                  <DetailSection title="Archive Status" icon={Lock}>
                    <div className="space-y-1.5 text-xs">
                      <StatusRow label="Recording" value={selected.archiveStatus.recording ? 'Archived to WORM storage ✓' : 'Pending'} ok={selected.archiveStatus.recording} />
                      <StatusRow label="Transcript" value={selected.archiveStatus.transcript ? 'Archived to WORM storage ✓' : 'Pending'} ok={selected.archiveStatus.transcript} />
                      <InfoRow label="Retention" value={selected.archiveStatus.retention || '7 years (HIPAA + State req.)'} />
                      <StatusRow label="Hash" value={selected.archiveStatus.hash ? 'SHA-256 verified ✓' : 'Pending verification'} ok={selected.archiveStatus.hash} />
                    </div>
                  </DetailSection>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Helper Components ── */
function DetailSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-border/50">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusRow({ label, value, ok, mono }: { label: string; value: string; ok?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', ok ? 'text-success' : 'text-urgent', mono && 'font-mono text-[10px] text-foreground')}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
