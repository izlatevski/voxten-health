import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  createChatThread,
  deleteChatThreadFromAcs,
  ensureAcsUserIdForEntra,
  getUserChatThreadsFromAcs,
  getChatThreadMessagesFromAcs,
  getThreadParticipants,
  getThreadsForUser,
  issueAcsTokenForUser,
  sendChatMessage,
  subscribeToAcsIncomingMessages,
  SESSION_ACS_USER_ID_KEY,
  SESSION_ACS_USER_TOKEN_KEY,
  type AcsIncomingMessage,
  type ComplianceVerdict,
  type ThreadParticipant,
} from '@/lib/chatApi';
import { searchEntraUsers, type EntraUserSearchItem } from '@/lib/portalApi';
import { useAppStore } from '@/stores/appStore';
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
  Plus,
  X,
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

const seedThreads: Thread[] = [
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

type ComposeOutcome = {
  verdict: ComplianceVerdict;
  auditId: string;
  reason?: string;
};

const baseThreadMessages: Record<string, GovMessage[]> = {
  ...threadMessages,
  '6': thread6Messages,
  '7': thread7Messages,
  '8': thread8Messages,
};

function mapComplianceState(value: string): Thread['governance'] {
  if (value === 'blocked') return 'violation';
  if (value === 'flagged' || value === 'redacted') return 'flagged';
  return 'compliant';
}

function formatRelativeTime(isoValue: string): string {
  const timestamp = new Date(isoValue).getTime();
  if (!Number.isFinite(timestamp)) return 'just now';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function threadFromIndex(item: {
  threadId: string;
  topic: string;
  lastMessagePreview: string;
  lastMessageAtUtc: string;
  unreadCount: number;
  complianceState: string;
}): Thread {
  return {
    id: item.threadId,
    title: item.topic || 'Untitled Thread',
    participants: [],
    channel: 'chat',
    governance: mapComplianceState(item.complianceState),
    flags: item.complianceState === 'flagged' ? 1 : 0,
    lastActivity: formatRelativeTime(item.lastMessageAtUtc),
    unread: item.unreadCount,
    preview: item.lastMessagePreview || 'No messages yet',
  };
}

function participantToLabel(participant: ThreadParticipant): { name: string; role: string } {
  return {
    name: participant.displayName || participant.entraUserId,
    role: participant.role || 'Participant',
  };
}

/* ── Compose with live governance ── */
function ComposeArea({
  isSending,
  onSend,
  lastOutcome,
}: {
  isSending: boolean;
  onSend: (input: { text: string; channel: string }) => Promise<void>;
  lastOutcome: ComposeOutcome | null;
}) {
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
      {lastOutcome && (
        <div
          className={cn(
            'mb-2 px-3 py-1.5 rounded border text-[11px]',
            lastOutcome.verdict === 'allowed'
              ? 'bg-success/10 border-success/20 text-success'
              : lastOutcome.verdict === 'redacted'
                ? 'bg-urgent/10 border-urgent/20 text-urgent'
                : 'bg-stat/10 border-stat/20 text-stat'
          )}
        >
          {lastOutcome.verdict === 'allowed' && `✓ Sent — audit ${lastOutcome.auditId}`}
          {lastOutcome.verdict === 'redacted' && `⚠ Sent with redaction — audit ${lastOutcome.auditId}`}
          {lastOutcome.verdict === 'blocked' && `⛔ Blocked — audit ${lastOutcome.auditId}${lastOutcome.reason ? ` (${lastOutcome.reason})` : ''}`}
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
            onKeyDown={async (e) => {
              if (e.key !== 'Enter' || !text.trim() || isSending) return;
              e.preventDefault();
              await onSend({ text, channel });
              setText('');
            }}
          />
        </div>
        <button className="p-2.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim() || isSending}
          onClick={async () => {
            if (!text.trim() || isSending) return;
            await onSend({ text, channel });
            setText('');
          }}
        >
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
  const currentUser = useAppStore((s) => s.currentUser);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const liveMessagesRef = useRef<Record<string, GovMessage[]>>({});
  const selectedThreadIdRef = useRef<string>('');
  const messageListEndRef = useRef<HTMLDivElement | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [showNewThreadPanel, setShowNewThreadPanel] = useState(false);
  const [newThreadTopic, setNewThreadTopic] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<EntraUserSearchItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<EntraUserSearchItem[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [remoteMessages, setRemoteMessages] = useState<Record<string, GovMessage[]>>({});
  const [liveMessages, setLiveMessages] = useState<Record<string, GovMessage[]>>({});
  const [threadParticipants, setThreadParticipants] = useState<Record<string, { name: string; role: string }[]>>({});
  const [lastOutcome, setLastOutcome] = useState<ComposeOutcome | null>(null);
  const thread = useMemo(
    () => threads.find((t) => t.id === selectedThread) ?? threads[0] ?? null,
    [threads, selectedThread],
  );
  const selectedThreadId = thread?.id ?? '';
  const messages = useMemo(() => {
    const remote = remoteMessages[selectedThreadId] || [];
    const live = liveMessages[selectedThreadId] || [];
    const merged = [...remote, ...live];
    const unique = new Map<string, GovMessage>();

    for (const message of merged) {
      const key = message.governance.auditId || message.id;
      if (!key) continue;
      if (!unique.has(key)) {
        unique.set(key, message);
      }
    }

    return Array.from(unique.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [remoteMessages, liveMessages, selectedThreadId]);

  useEffect(() => {
    liveMessagesRef.current = liveMessages;
  }, [liveMessages]);

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId) return;

    const frame = window.requestAnimationFrame(() => {
      messageListEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedThreadId, messages.length]);

  async function ensureSessionAcsToken(options?: { forceRefresh?: boolean }): Promise<string | null> {
    const existing = sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY);
    if (existing && !options?.forceRefresh) return existing;

    if (!currentUser?.tenantId || !currentUser?.oid) {
      return null;
    }

    try {
      const issued = await issueAcsTokenForUser({
        tenantId: currentUser.tenantId,
        entraUserId: currentUser.oid,
        includeVoip: false,
      });
      sessionStorage.setItem(SESSION_ACS_USER_TOKEN_KEY, issued.token);
      sessionStorage.setItem(SESSION_ACS_USER_ID_KEY, issued.userId);
      return issued.token;
    } catch {
      return null;
    }
  }

  async function loadThreadsForCurrentUser() {
    if (!currentUser?.oid || !currentUser.tenantId) {
      setThreads([]);
      setSelectedThread('');
      return;
    }

    setLoadingThreads(true);
    try {
      const indexed = await getThreadsForUser(currentUser.tenantId, currentUser.oid, 50);
      if (indexed.length === 0) {
        setThreads([]);
        setSelectedThread('');
        return;
      }

      const nextThreads = indexed.map(threadFromIndex);
      setThreads(nextThreads);
      setSelectedThread((prev) =>
        prev && nextThreads.some((t) => t.id === prev)
          ? prev
          : nextThreads[0].id,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load thread index.';
      toast.error('Could not load threads from API', { description: message });
      setThreads([]);
      setSelectedThread('');
    } finally {
      setLoadingThreads(false);
    }
  }

  useEffect(() => {
    setLastOutcome(null);
  }, [selectedThread]);

  useEffect(() => {
    let cancelled = false;

    async function loadThreads() {
      await loadThreadsForCurrentUser();
    }

    void loadThreads();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.oid, currentUser?.tenantId]);

  // NOTE: ACS auto-delete thread cleanup kept for future troubleshooting.
  // Re-enable this effect only in controlled/dev scenarios.
  /*
  useEffect(() => {
    let cancelled = false;

    async function cleanupUserThreads() {
      if (!currentUser?.oid || !currentUser?.tenantId) return;

      const userToken = await ensureSessionAcsToken();
      if (!userToken) return;

      try {
        const userThreads = await getUserChatThreadsFromAcs(userToken, 500);
        if (cancelled || userThreads.length === 0) return;

        await Promise.all(
          userThreads.map(async (item) => {
            try {
              await deleteChatThreadFromAcs(item.id, userToken);
            } catch {
              // Continue best-effort deletion for remaining threads.
            }
          }),
        );

        if (cancelled) return;
        await loadThreadsForCurrentUser();
        setRemoteMessages({});
        setLiveMessages({});
        setSelectedThread('');
        toast.success('Cleared ACS threads', {
          description: `Deleted ${userThreads.length} thread(s) for this user.`,
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to delete ACS threads.';
        toast.error('ACS cleanup failed', { description: message });
      }
    }

    void cleanupUserThreads();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.oid, currentUser?.tenantId]);
  */

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      const query = userSearchQuery.trim();
      if (query.length < 2 || !showNewThreadPanel) {
        setUserSearchResults([]);
        return;
      }

      setSearchingUsers(true);
      try {
        const users = await searchEntraUsers(query, 20);
        if (cancelled) return;
        const filtered = users.filter((u) => u.id !== currentUser?.oid);
        setUserSearchResults(filtered);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to search Entra users.';
        toast.error('User search failed', { description: message });
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void runSearch();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userSearchQuery, showNewThreadPanel, currentUser?.oid]);

  useEffect(() => {
    let cancelled = false;

    async function loadParticipants() {
      if (!selectedThreadId || !currentUser?.tenantId) {
        return;
      }

      try {
        const participants = await getThreadParticipants(currentUser.tenantId, selectedThreadId);
        if (cancelled) return;
        setThreadParticipants((prev) => ({
          ...prev,
          [selectedThreadId]: participants.map(participantToLabel),
        }));
      } catch {
        // Keep UI stable when participant metadata is not yet available.
      }
    }

    void loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [selectedThreadId, currentUser?.tenantId]);

  useEffect(() => {
    let cancelled = false;

    function mapAcsItemsToMessages(items: Awaited<ReturnType<typeof getChatThreadMessagesFromAcs>>): GovMessage[] {
      const unique = new Map<string, GovMessage>();
      for (const item of items) {
        const id = item.id || `remote-${Math.random()}`;
        const mapped: GovMessage = {
          id,
          sender: item.senderDisplayName || item.senderId || 'Participant',
          role: 'Participant',
          content: item.content || '',
          timestamp: item.createdOnUtc
            ? new Date(item.createdOnUtc).toLocaleTimeString('en-GB', { hour12: false })
            : '',
          isAI: false,
          governance: {
            compliance: 'passed',
            encryption: 'AES-256',
            syncStatus: 'Synced from ACS',
            auditId: item.id || 'message',
          },
        };
        unique.set(id, mapped);
        if (item.id) {
          seenMessageIdsRef.current.add(item.id);
        }
      }
      return Array.from(unique.values());
    }

    function isAcsPermissionError(error: unknown): boolean {
      if (typeof error !== 'object' || error === null) return false;
      const maybeError = error as { statusCode?: number; message?: string };
      if (maybeError.statusCode === 403) return true;
      const message = maybeError.message?.toLowerCase() || '';
      return message.includes('permission') || message.includes('403');
    }

    async function loadMessages() {
      if (!selectedThreadId) return;

      const userToken = await ensureSessionAcsToken();
      if (!userToken) return;

      setLoadingMessages(true);
      try {
        let items = await getChatThreadMessagesFromAcs(selectedThreadId, userToken, 100);
        let mapped = mapAcsItemsToMessages(items);

        if (cancelled) return;

        setRemoteMessages((prev) => ({
          ...prev,
          [selectedThreadId]: mapped,
        }));
        setLiveMessages((prev) => {
          const current = prev[selectedThreadId] || [];
          if (current.length === 0) return prev;

          const fetchedIds = new Set(
            mapped.map((message) => message.governance.auditId || message.id).filter(Boolean),
          );
          const remaining = current.filter((message) => {
            const key = message.governance.auditId || message.id;
            return !key || !fetchedIds.has(key);
          });

          if (remaining.length === current.length) return prev;
          return {
            ...prev,
            [selectedThreadId]: remaining,
          };
        });
      } catch (error) {
        if (isAcsPermissionError(error)) {
          try {
            const refreshedToken = await ensureSessionAcsToken({ forceRefresh: true });
            if (!refreshedToken) throw error;

            const retryItems = await getChatThreadMessagesFromAcs(selectedThreadId, refreshedToken, 100);
            if (cancelled) return;

            const retryMapped = mapAcsItemsToMessages(retryItems);
            setRemoteMessages((prev) => ({
              ...prev,
              [selectedThreadId]: retryMapped,
            }));
            setLiveMessages((prev) => {
              const current = prev[selectedThreadId] || [];
              if (current.length === 0) return prev;

              const fetchedIds = new Set(
                retryMapped.map((message) => message.governance.auditId || message.id).filter(Boolean),
              );
              const remaining = current.filter((message) => {
                const key = message.governance.auditId || message.id;
                return !key || !fetchedIds.has(key);
              });

              if (remaining.length === current.length) return prev;
              return {
                ...prev,
                [selectedThreadId]: remaining,
              };
            });
            return;
          } catch {
            // Fall through to the standard error toast below.
          }
        }

        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load thread messages.';
        toast.error('Could not load messages', { description: message });
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedThreadId]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    function asGovMessage(item: AcsIncomingMessage): GovMessage {
      return {
        id: item.id || `incoming-${Date.now()}`,
        sender: item.senderDisplayName || item.senderId || 'Participant',
        role: 'Participant',
        content: item.content || '',
        timestamp: item.createdOnUtc
          ? new Date(item.createdOnUtc).toLocaleTimeString('en-GB', { hour12: false })
          : new Date().toLocaleTimeString('en-GB', { hour12: false }),
        isAI: false,
        governance: {
          compliance: 'passed',
          encryption: 'AES-256',
          syncStatus: 'Live via ACS',
          auditId: item.id || 'message',
        },
      };
    }

    async function subscribe() {
      const token = await ensureSessionAcsToken();
      if (!token || disposed) return;

      const currentAcsUserId = sessionStorage.getItem(SESSION_ACS_USER_ID_KEY) || '';

      try {
        unsubscribe = await subscribeToAcsIncomingMessages(
          token,
          (incoming) => {
            if (!incoming.threadId || !incoming.id) return;
            if (incoming.senderId && currentAcsUserId && incoming.senderId === currentAcsUserId) return;
            if (seenMessageIdsRef.current.has(incoming.id)) return;
            seenMessageIdsRef.current.add(incoming.id);

            setRemoteMessages((prev) => {
              const existing = prev[incoming.threadId] || [];
              const existingLive = liveMessagesRef.current[incoming.threadId] || [];
              if (
                existing.some((m) => m.id === incoming.id || m.governance.auditId === incoming.id) ||
                existingLive.some((m) => m.id === incoming.id || m.governance.auditId === incoming.id)
              ) {
                return prev;
              }

              return {
                ...prev,
                [incoming.threadId]: [...existing, asGovMessage(incoming)],
              };
            });

            setThreads((prev) =>
              prev.map((thread) =>
                thread.id !== incoming.threadId
                  ? thread
                  : {
                      ...thread,
                      preview: incoming.content || thread.preview,
                      lastActivity: 'just now',
                      unread: selectedThreadIdRef.current === incoming.threadId ? thread.unread : thread.unread + 1,
                    },
              ),
            );
          },
          () => {
            toast.error('Live chat listener error', { description: 'Unable to process incoming ACS message event.' });
          },
        );
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : 'Failed to subscribe to ACS notifications.';
        toast.error('Live chat unavailable', { description: message });
      }
    }

    void subscribe();
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [currentUser?.oid, currentUser?.tenantId]);

  function addUserToThread(user: EntraUserSearchItem) {
    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, user];
    });
  }

  function removeUserFromThread(userId: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  async function handleCreateThread() {
    if (!currentUser?.oid || !currentUser?.tenantId) {
      toast.error('Missing user context');
      return;
    }

    const creatorToken = sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY);
    if (!creatorToken) {
      toast.error('Missing ACS token', { description: 'Sign in again to provision your chat token.' });
      return;
    }

    const topic = newThreadTopic.trim();
    if (!topic) {
      toast.error('Thread topic is required');
      return;
    }

    setCreatingThread(true);
    try {
      let currentAcsUserId = sessionStorage.getItem(SESSION_ACS_USER_ID_KEY);
      if (!currentAcsUserId) {
        currentAcsUserId = await ensureAcsUserIdForEntra(currentUser.tenantId, currentUser.oid);
        sessionStorage.setItem(SESSION_ACS_USER_ID_KEY, currentAcsUserId);
      }

      const selectedWithAcsIds = await Promise.all(
        selectedUsers.map(async (user) => ({
          user,
          acsUserId: await ensureAcsUserIdForEntra(currentUser.tenantId!, user.id),
        })),
      );

      const participants = [
        {
          communicationUserId: currentAcsUserId,
          entraUserId: currentUser.oid,
          displayName: currentUser.displayName,
          role: currentUser.roles[0] || currentUser.jobTitle || 'User',
        },
        ...selectedWithAcsIds.map(({ user, acsUserId }) => ({
          communicationUserId: acsUserId,
          entraUserId: user.id,
          displayName: user.displayName,
          role: user.jobTitle || 'Participant',
        })),
      ];

      const created = await createChatThread({
        creatorToken,
        topic,
        tenantId: currentUser.tenantId,
        participants,
      });

      await loadThreadsForCurrentUser();
      setSelectedThread(created.threadId);
      setShowNewThreadPanel(false);
      setNewThreadTopic('');
      setUserSearchQuery('');
      setSelectedUsers([]);
      setUserSearchResults([]);
      toast.success('Thread created');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create thread.';
      toast.error('Create thread failed', { description: message });
    } finally {
      setCreatingThread(false);
    }
  }

  async function handleSend(input: { text: string; channel: string }) {
    if (!selectedThreadId) {
      toast.error('No thread selected');
      return;
    }

    const senderToken = sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY);
    const resolvedSenderToken = senderToken || (await ensureSessionAcsToken());
    if (!resolvedSenderToken) {
      toast.error('Missing ACS token', { description: 'Sign in again to provision your chat token.' });
      return;
    }

    setSending(true);
    setLastOutcome(null);

    try {
      const result = await sendChatMessage({
        senderToken: resolvedSenderToken,
        threadId: selectedThreadId,
        content: input.text,
        senderDisplayName: currentUser?.displayName || 'Authenticated User',
        tenantId: currentUser?.tenantId,
        senderEntraUserId: currentUser?.oid,
        complianceState: 'passed',
      });

      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const auditId = result.messageId || `msg-${Date.now()}`;

      const next: GovMessage[] = [
        {
          id: `live-${Date.now()}`,
          sender: currentUser?.displayName || 'Authenticated User',
          role: (currentUser?.roles?.[0] || currentUser?.jobTitle || 'User').replace(/^Voxten\./, ''),
          content: input.text,
          timestamp,
          isAI: false,
          governance: {
            compliance: 'passed',
            encryption: 'AES-256',
            syncStatus: 'Sent via Communications API',
            auditId,
          },
        },
      ];

      setLiveMessages((prev) => ({
        ...prev,
        [selectedThreadId]: [...(prev[selectedThreadId] || []), ...next],
      }));

      setLastOutcome({
        verdict: 'allowed',
        auditId,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unexpected API error.';
      toast.error('Failed to send message', { description: msg });
      setLastOutcome({
        verdict: 'blocked',
        auditId: 'send-failed',
        reason: 'API request failed',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6">
      {/* Thread List */}
      <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search governed threads..." className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground" />
          </div>
          <button
            type="button"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            onClick={() => setShowNewThreadPanel((v) => !v)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Thread
          </button>
          {showNewThreadPanel && (
            <div className="mt-2 rounded-md border border-border bg-background p-2 space-y-2">
              <input
                value={newThreadTopic}
                onChange={(e) => setNewThreadTopic(e.target.value)}
                placeholder="Thread topic"
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none"
              />
              <input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search Entra users..."
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none"
              />
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map((user) => (
                    <span key={user.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
                      {user.displayName}
                      <button type="button" onClick={() => removeUserFromThread(user.id)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="max-h-32 overflow-y-auto rounded border border-border">
                {searchingUsers ? (
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground">Searching...</div>
                ) : userSearchResults.length === 0 ? (
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground">No users</div>
                ) : (
                  userSearchResults.map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      className="w-full border-b border-border px-2 py-1.5 text-left text-[10px] hover:bg-muted last:border-b-0"
                      onClick={() => addUserToThread(user)}
                    >
                      <div className="font-medium text-foreground">{user.displayName}</div>
                      <div className="text-muted-foreground">{user.mail || user.userPrincipalName}</div>
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 rounded border border-border px-2 py-1 text-[10px] hover:bg-muted"
                  onClick={() => setShowNewThreadPanel(false)}
                  disabled={creatingThread}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground disabled:opacity-50"
                  onClick={() => void handleCreateThread()}
                  disabled={creatingThread || !newThreadTopic.trim() || selectedUsers.length === 0}
                >
                  {creatingThread ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads && (
            <div className="px-4 py-2 text-[11px] text-muted-foreground">Loading threads...</div>
          )}
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
        {!thread ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a thread or create a new thread to start chatting.
          </div>
        ) : (
          <>
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{thread.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {(threadParticipants[thread.id] || thread.participants).map((p) => (
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
          {loadingMessages && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
              </span>
              Syncing messages...
            </div>
          )}
          {messages.map((msg) => (
            <GovernedMessage key={msg.id} msg={msg} />
          ))}
          <div ref={messageListEndRef} />
        </div>

        {/* Compose */}
        <ComposeArea isSending={sending} onSend={handleSend} lastOutcome={lastOutcome} />
          </>
        )}
      </div>
    </div>
  );
}
