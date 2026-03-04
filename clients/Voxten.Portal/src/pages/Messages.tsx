import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Send,
  Paperclip,
  AlertTriangle,
  FileText,
  User,
  Activity,
  Video,
  Bot,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Thread Data ── */
interface Thread {
  id: string;
  title: string;
  participants: { name: string; role: string }[];
  channel: 'chat' | 'voice' | 'email' | 'ai';
  governance: 'compliant' | 'flagged' | 'violation';
  flags: number;
  lastActivity: string;
  unread: number;
  preview: string;
}

const threads: Thread[] = [
  { id: '1', title: 'Critical Lab — K+ 6.8 Escalation', participants: [{ name: 'Dr. Rivera', role: 'Hospitalist' }, { name: 'Nurse Torres', role: 'RN' }, { name: 'Dr. Chen', role: 'Attending' }], channel: 'chat', governance: 'compliant', flags: 0, lastActivity: '2 min ago', unread: 3, preview: 'K+ trending down after treatment...' },
  { id: '2', title: 'Discharge Planning — Martinez, R.', participants: [{ name: 'Dr. Chen', role: 'Attending' }, { name: 'J. Kim', role: 'PharmD' }, { name: 'L. Nguyen', role: 'RT' }], channel: 'chat', governance: 'compliant', flags: 0, lastActivity: '15 min ago', unread: 0, preview: 'Pharmacy has cleared discharge meds...' },
  { id: '3', title: 'AI Summary Review — Patient 38291', participants: [{ name: 'Copilot', role: 'AI Assistant' }, { name: 'Dr. Rivera', role: 'Hospitalist' }], channel: 'ai', governance: 'flagged', flags: 1, lastActivity: '28 min ago', unread: 1, preview: 'AI-generated summary flagged for review...' },
  { id: '4', title: 'Substance Use Consult — Garcia, M.', participants: [{ name: 'Dr. Williams', role: 'Psychiatrist' }, { name: 'Nurse Torres', role: 'RN' }], channel: 'chat', governance: 'flagged', flags: 1, lastActivity: '1h ago', unread: 0, preview: '42 CFR Part 2 data — restricted access...' },
  { id: '6', title: 'Post-Op Recovery — Chen, Margaret', participants: [{ name: 'Nurse Torres', role: 'RN' }, { name: 'Dr. Rivera', role: 'Hospitalist' }], channel: 'chat', governance: 'compliant', flags: 0, lastActivity: '1h ago', unread: 0, preview: 'Nurse Torres: Vitals stable...' },
  { id: '7', title: 'Discharge Planning — Williams, David', participants: [{ name: 'Dr. Rivera', role: 'Hospitalist' }, { name: 'L. Nguyen', role: 'RT' }], channel: 'chat', governance: 'compliant', flags: 0, lastActivity: '2h ago', unread: 0, preview: 'Dr. Rivera: Clear for discharge...' },
  { id: '8', title: 'Medication Reconciliation — Adams, Patricia', participants: [{ name: 'J. Kim', role: 'PharmD' }, { name: 'Dr. Chen', role: 'Attending' }], channel: 'chat', governance: 'flagged', flags: 1, lastActivity: '2h ago', unread: 1, preview: 'Pharmacy alert: interaction...' },
  { id: '5', title: 'Weekly Compliance Briefing', participants: [{ name: 'P. Okonkwo', role: 'Compliance' }, { name: 'D. Park', role: 'CISO' }], channel: 'chat', governance: 'compliant', flags: 0, lastActivity: '3h ago', unread: 0, preview: 'All systems nominal this week...' },
];

/* ── Message Data ── */
interface GovMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
  isAI: boolean;
  governance: {
    compliance: 'passed' | 'flagged' | 'blocked' | 'redacted';
    encryption: string;
    syncStatus: string;
    auditId: string;
    aiGoverned?: string;
    redactedEntities?: { type: string; rule: string }[];
  };
  priority?: 'routine' | 'urgent' | 'stat';
  type?: 'message' | 'system' | 'blocked';
}

const threadMessages: Record<string, GovMessage[]> = {
  '1': [
    { id: 'm1', sender: 'VOXTEN System', role: 'System', content: 'Clinical escalation initiated. Critical lab result: K+ 6.8 mEq/L for patient Martinez, R. (MRN-0038291). Escalation workflow CRIT-LAB-001 activated.', timestamp: '14:18:03', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048201' }, type: 'system' },
    { id: 'm2', sender: 'Dr. James Rivera', role: 'Hospitalist', content: 'K+ is critically elevated at 6.8. Recommending IV calcium gluconate and sodium polystyrene. Please confirm orders and monitor telemetry.', timestamp: '14:19:22', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048202' }, priority: 'stat' },
    { id: 'm3', sender: 'Maria Torres, RN', role: 'Primary Nurse', content: 'Copy. Calcium gluconate 1g IV now, telemetry already on. Patient is asymptomatic, no EKG changes. Will recheck BMP in 2 hours.', timestamp: '14:21:47', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048203' } },
    { id: 'm4', sender: 'Copilot', role: 'AI Assistant', content: 'Auto-generated clinical summary: Patient Robert Martinez, 67M, CHF NYHA III, presented with hyperkalemia (K+ 6.8). Treatment initiated per protocol. Historical trend shows K+ rising from 5.2 → 5.8 → 6.8 over 72h. Recommend nephrology consult if K+ >6.0 on repeat.', timestamp: '14:22:05', isAI: true, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048204', aiGoverned: 'PHI check passed, accuracy verified against EHR, bias check passed' } },
    { id: 'm5', sender: 'Dr. Sarah Chen', role: 'Attending', content: 'Good catch. Agree with treatment plan. I\'ll place the nephrology consult order. Please update the family during afternoon rounds.', timestamp: '14:23:15', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048205' } },
    { id: 'm6', sender: 'Maria Torres, RN', role: 'Primary Nurse', content: 'Dr. Rivera, patient Martinez SSN [REDACTED] needs insurance verification for the cardiology consult. His wife Linda can be reached at [REDACTED].', timestamp: '16:02:11', isAI: false, governance: { compliance: 'redacted', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-004892', redactedEntities: [{ type: 'SSN detected', rule: '§164.514 — Auto-redacted' }, { type: 'Personal phone detected', rule: '§164.502 — Auto-redacted' }] } },
    { id: 'm7', sender: 'VOXTEN System', role: 'System', content: '⛔ MESSAGE BLOCKED — Dr. Chen attempted to send a patient photo without documented imaging consent. Message held for compliance review. — VOX-2026-004893', timestamp: '16:08:44', isAI: false, governance: { compliance: 'blocked', encryption: 'AES-256', syncStatus: 'Audit Logged', auditId: 'VOX-2026-004893' }, type: 'blocked' },
    { id: 'm8', sender: 'Maria Torres, RN', role: 'Primary Nurse', content: 'Repeat BMP drawn. K+ trending down to 5.9. Patient remains stable, no rhythm changes. Will continue monitoring q2h.', timestamp: '16:15:33', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048206' } },
  ],
  '3': [
    { id: 'a1', sender: 'Copilot', role: 'AI Assistant', content: 'Generated patient discharge summary for Martinez, R. (MRN-0038291). Summary includes: diagnosis, treatment course, medication reconciliation, follow-up instructions, and dietary recommendations.', timestamp: '13:45:12', isAI: true, governance: { compliance: 'flagged', encryption: 'AES-256', syncStatus: 'Pending Review', auditId: 'VOX-2026-0048180', aiGoverned: '⚠ PHI flagged: Patient SSN detected in AI output. Redaction applied before delivery.' } },
    { id: 'a2', sender: 'VOXTEN System', role: 'System', content: 'AI-PHI-001 triggered: SSN pattern detected in AI-generated discharge summary. Content redacted. Original preserved in secure audit log for compliance review.', timestamp: '13:45:13', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'Audit Logged', auditId: 'VOX-2026-0048181' }, type: 'system' },
    { id: 'a3', sender: 'Dr. James Rivera', role: 'Hospitalist', content: 'Reviewed the redacted summary. Content is accurate after SSN removal. Approving for patient portal delivery.', timestamp: '14:02:44', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048182' } },
  ],
  '4': [
    { id: 'f1', sender: 'Dr. Williams', role: 'Psychiatrist', content: 'Patient Garcia has been evaluated by behavioral health. Substance use assessment indicates alcohol use disorder. Recommending outpatient program referral per consult note.', timestamp: '11:30:18', isAI: false, governance: { compliance: 'flagged', encryption: 'AES-256', syncStatus: 'WORM Archived', auditId: 'VOX-2026-0047990' }, priority: 'urgent' },
    { id: 'f2', sender: 'VOXTEN System', role: 'System', content: 'HIPAA-PART2-008 triggered: Substance use disorder data detected in clinical communication. 42 CFR Part 2 consent verification required before sharing with full care team.', timestamp: '11:30:19', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'WORM Archived', auditId: 'VOX-2026-0047991' }, type: 'system' },
  ],
};

// Defaults for threads without specific messages
const defaultMessages: GovMessage[] = [
  { id: 'd1', sender: 'Patricia Okonkwo', role: 'Compliance Officer', content: 'All systems nominal. Weekly compliance digest attached.', timestamp: '09:00:00', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'Archived', auditId: 'VOX-2026-0047800' } },
];

const thread6Messages: GovMessage[] = [
  { id: 'po1', sender: 'Nurse Torres', role: 'RN', content: 'Post-op vitals stable. BP 124/78, HR 72, SpO2 98% on room air. Patient alert and oriented x3. Surgical site clean, no drainage.', timestamp: '10:15:22', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048300' } },
  { id: 'po2', sender: 'Dr. Rivera', role: 'Hospitalist', content: 'Thank you. Please advance diet to clear liquids and continue ambulation protocol. I\'ll reassess during afternoon rounds.', timestamp: '10:22:44', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048301' } },
];

const thread7Messages: GovMessage[] = [
  { id: 'dp1', sender: 'Dr. Rivera', role: 'Hospitalist', content: 'Patient Williams is clinically stable and meeting discharge criteria. Home O2 arranged via DME. Follow-up with pulmonology in 7 days.', timestamp: '09:30:00', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048310' } },
  { id: 'dp2', sender: 'L. Nguyen', role: 'RT', content: 'Respiratory therapy education complete. Patient demonstrated proper inhaler technique and understands home O2 equipment.', timestamp: '09:45:12', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048311' } },
];

const thread8Messages: GovMessage[] = [
  { id: 'mr1', sender: 'J. Kim', role: 'PharmD', content: '⚠ Drug interaction alert: Metformin + IV contrast (CT scheduled tomorrow). Recommend holding Metformin 48h pre/post contrast per protocol. Please confirm with attending.', timestamp: '11:10:05', isAI: false, governance: { compliance: 'flagged', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048320' } },
  { id: 'mr2', sender: 'Dr. Chen', role: 'Attending', content: 'Confirmed. Hold Metformin starting tonight. Add to medication hold list and notify nursing. Resume 48h post-procedure if Cr stable.', timestamp: '11:24:33', isAI: false, governance: { compliance: 'passed', encryption: 'AES-256', syncStatus: 'EHR Synced', auditId: 'VOX-2026-0048321' } },
];

const govBadge: Record<string, { label: string; style: string }> = {
  compliant: { label: '✓ Compliant', style: 'bg-success/10 text-success border-success/20' },
  flagged: { label: '⚠ 1 Flag', style: 'bg-urgent/10 text-urgent border-urgent/20' },
  violation: { label: '✖ Violation', style: 'bg-stat/10 text-stat border-stat/20' },
};

const channelIcon: Record<string, React.ElementType> = {
  chat: MessageSquare, voice: Activity, email: FileText, ai: Bot,
};

const verticalBadge: Record<string, string> = {
  Healthcare: 'bg-primary/10 text-primary border-primary/20',
};

/* ── Compose with live governance ── */
function ComposeArea() {
  const [text, setText] = useState('');
  const [channel, setChannel] = useState('secure');

  // Live governance indicator
  const hasPHI = /\b(mrn|ssn|patient|diagnosis|potassium)\b/i.test(text);
  const hasSUD = /substance use|alcohol use|opioid|SUD/i.test(text);
  const status = hasSUD ? 'violation' : hasPHI ? 'warning' : 'safe';

  return (
    <div className="border-t border-border p-4 bg-card">
      <div className="flex items-center gap-3 mb-2">
        {/* Live governance indicator */}
        <div className="flex items-center gap-1.5">
          <Shield className={cn('w-3.5 h-3.5', status === 'safe' ? 'text-success' : status === 'warning' ? 'text-urgent' : 'text-stat')} />
          <span className={cn('text-[11px] font-medium', status === 'safe' ? 'text-success' : status === 'warning' ? 'text-urgent' : 'text-stat')}>
            {status === 'safe' ? 'Compliant' : status === 'warning' ? 'Potential PHI detected' : 'Policy violation detected'}
          </span>
        </div>

        {/* Channel selector */}
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-6 text-[10px] w-[130px] ml-auto"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="secure" className="text-xs">Secure Message</SelectItem>
            <SelectItem value="sms" className="text-xs">SMS</SelectItem>
            <SelectItem value="email" className="text-xs">Email</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">AES-256 E2E</span>
        </div>
      </div>

      {status === 'warning' && (
        <div className="mb-2 px-3 py-1.5 rounded bg-urgent/10 border border-urgent/20 text-[11px] text-urgent">
          ⚠ Potential PHI detected. This message will be flagged by HIPAA-PHI-SMS-001 if sent via SMS.
        </div>
      )}
      {status === 'violation' && (
        <div className="mb-2 px-3 py-1.5 rounded bg-stat/10 border border-stat/20 text-[11px] text-stat">
          ✖ 42 CFR Part 2 data detected. HIPAA-PART2-008 requires consent verification before sharing.
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-4 py-2.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a governed message..."
            className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button className="p-2.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
          <Paperclip className="w-5 h-5" />
        </button>
        <button className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Message Component ── */
function GovernedMessage({ msg }: { msg: GovMessage }) {
  const isSystem = msg.type === 'system';
  const g = msg.governance;

  if (isSystem) {
    return (
      <div className="flex gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="bg-muted rounded-lg px-4 py-3">
            <p className="text-sm text-muted-foreground">{msg.content}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{msg.timestamp}</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-muted border-border text-muted-foreground">VOXTEN System</Badge>
              <span className="text-[10px] text-muted-foreground font-mono ml-auto">{g.auditId}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Blocked message type
  if (msg.type === 'blocked') {
    return (
      <div className="flex gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-stat/10 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-4 h-4 text-stat" />
        </div>
        <div className="flex-1">
          <div className="bg-stat/5 border border-stat/20 rounded-lg px-4 py-3">
            <p className="text-sm text-stat font-medium">{msg.content}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{msg.timestamp}</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-stat/10 text-stat border-stat/20">BLOCKED</Badge>
              <span className="text-[10px] text-muted-foreground font-mono ml-auto">{g.auditId}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render content with [REDACTED] highlighting
  const renderContent = (content: string) => {
    const parts = content.split(/(\[REDACTED\])/g);
    return parts.map((part, i) =>
      part === '[REDACTED]' ? (
        <span key={i} className="bg-stat/15 text-stat font-semibold px-1 rounded-sm border border-stat/20">[REDACTED]</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className={cn('flex gap-3 py-2', msg.priority === 'stat' && 'border-l-2 border-stat pl-3')}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', msg.isAI ? 'bg-ehr-part2/10' : 'bg-primary/10')}>
        {msg.isAI ? <Bot className="w-4 h-4 text-ehr-part2" /> : <User className="w-4 h-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{msg.sender}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{msg.role}</Badge>
          {msg.isAI && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-ehr-part2/10 text-ehr-part2 border-ehr-part2/20">AI-Generated</Badge>}
          {msg.priority === 'stat' && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-stat/10 text-stat border-stat/20 font-bold">STAT</Badge>}
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">{msg.timestamp}</span>
        </div>
        <p className="text-sm text-foreground mt-1.5 leading-relaxed">{renderContent(msg.content)}</p>

        {/* AI Governance strip */}
        {msg.isAI && g.aiGoverned && (
          <div className={cn('mt-2 px-3 py-1.5 rounded text-[11px] border', g.aiGoverned.startsWith('⚠') ? 'bg-urgent/5 border-urgent/20 text-urgent' : 'bg-ehr-part2/5 border-ehr-part2/20 text-ehr-part2')}>
            <Bot className="w-3 h-3 inline mr-1" />
            AI Content Governed: {g.aiGoverned}
          </div>
        )}
        {/* Redaction metadata strip */}
        {g.compliance === 'redacted' && g.redactedEntities && (
          <div className="mt-2 px-3 py-2 rounded border border-urgent/20 bg-urgent/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-urgent">
              <AlertTriangle className="w-3.5 h-3.5" />
              ⚠ REDACTED — {g.redactedEntities.length} entities detected and redacted before delivery
            </div>
            {g.redactedEntities.map((entity, i) => (
              <div key={i} className="text-[10px] text-muted-foreground pl-5">
                • {entity.type}: <span className="text-foreground font-medium">{entity.rule}</span>
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground pl-5">
              • Original preserved in audit trail: <span className="font-mono text-foreground">{g.auditId}</span>
            </div>
          </div>
        )}

        {/* Governance metadata strip */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
          <span className={cn('flex items-center gap-1',
            g.compliance === 'passed' ? 'text-success' :
            g.compliance === 'redacted' ? 'text-urgent' :
            g.compliance === 'flagged' ? 'text-urgent' : 'text-stat'
          )}>
            <ShieldCheck className="w-3 h-3" />
            {g.compliance === 'passed' ? '✓ Compliant' : g.compliance === 'redacted' ? '⚠ Redacted' : g.compliance === 'flagged' ? '⚠ Flagged' : '✖ Blocked'}
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {g.encryption}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {g.syncStatus}
          </span>
          {g.compliance === 'redacted' && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Audit Hash: SHA-256
            </span>
          )}
          <span className="font-mono ml-auto">{g.auditId}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Messages() {
  const [selectedThread, setSelectedThread] = useState('1');
  const thread = threads.find((t) => t.id === selectedThread)!;
  const allThreadMessages: Record<string, GovMessage[]> = { ...threadMessages, '6': thread6Messages, '7': thread7Messages, '8': thread8Messages };
  const messages = allThreadMessages[selectedThread] || defaultMessages;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6">
      {/* Thread List */}
      <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search governed threads..." className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => {
            const ChannelIcon = channelIcon[t.channel];
            const govCfg = govBadge[t.governance];
            return (
              <button
                key={t.id}
                onClick={() => setSelectedThread(t.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors',
                  selectedThread === t.id && 'bg-muted',
                  t.governance === 'violation' && 'border-l-2 border-l-stat'
                )}
              >
                <div className="flex items-start gap-2">
                  <ChannelIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate flex-1">{t.title}</span>
                      {t.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">{t.unread}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className={cn('text-[9px] px-1 py-0 h-3.5', govCfg.style)}>{govCfg.label}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">{t.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{thread.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {thread.participants.map((p) => (
                  <span key={p.name} className="text-[10px] text-muted-foreground">{p.name} ({p.role})</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', govBadge[thread.governance].style)}>
                {govBadge[thread.governance].label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Escalation Banner */}
        {thread.governance === 'violation' && (
          <div className="bg-stat/10 border-b border-stat/20 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-stat" />
            <span className="text-xs font-semibold text-stat">Compliance Violation — Supervisory review required</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Governed Thread — All messages policy-checked and archived</span>
          </div>
          {messages.map((msg) => (
            <GovernedMessage key={msg.id} msg={msg} />
          ))}
        </div>

        {/* Compose */}
        <ComposeArea />
      </div>
    </div>
  );
}
