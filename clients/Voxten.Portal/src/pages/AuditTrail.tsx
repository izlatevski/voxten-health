import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FileSearch, Search, Download, ShieldCheck, Hash, ChevronDown, ChevronUp, Lock, FileText, Scale } from 'lucide-react';

/* ── Types ── */
interface AuditEvent {
  id: string;
  timestamp: string;
  eventId: string;
  user: string;
  role: string;
  action: string;
  target: string;
  channel: string;
  verdict: string;
  regulation: string;
  auditHash: string;
  detail?: {
    content?: string;
    matchedPolicies?: string[];
    entities?: string[];
    fullHash: string;
    prevEventId: string;
    nextEventId: string;
  };
}

/* ── Demo Data — 20 rows ── */
const auditEvents: AuditEvent[] = [
  { id: '1', timestamp: '2026-02-23T14:23:15.447Z', eventId: 'VOX-2026-004893', user: 'Dr. Chen', role: 'Attending', action: 'Message Blocked', target: 'Martinez, Robert', channel: 'Secure Chat', verdict: 'BLOCK', regulation: 'HIPAA §164.502', auditHash: 'a3f8b2...e7d1c4', detail: { content: 'Attempted to send patient photo without documented imaging consent. Message held for compliance review.', matchedPolicies: ['HIPAA-PHI-IMG-001', 'HIPAA §164.502 — Uses & Disclosures'], entities: ['Patient Photo (Image)', 'Martinez, Robert (Patient)'], fullHash: 'a3f8b2c91d4e7f0a6b3c8d2e5f1a9b4c7d0e3f6a8b1c4d7e0f2a5b8c1d4e7d1c4', prevEventId: 'VOX-2026-004892', nextEventId: 'VOX-2026-004894' } },
  { id: '2', timestamp: '2026-02-23T14:23:01.221Z', eventId: 'VOX-2026-004892', user: 'Torres, Maria RN', role: 'Charge Nurse', action: 'Message Redacted', target: 'Martinez, Robert', channel: 'Secure Chat', verdict: 'REDACT', regulation: 'HIPAA §164.514', auditHash: '7c2e91...b4f8a3', detail: { content: 'Dr. Rivera, patient Martinez SSN [REDACTED] needs insurance verification for the cardiology consult. His wife Linda can be reached at [REDACTED].', matchedPolicies: ['HIPAA-PHI-SMS-001', 'HIPAA §164.514 — De-identification', 'HIPAA §164.502 — Minimum Necessary'], entities: ['SSN: 423-55-XXXX (Pattern Match, 1.00)', 'Phone: 555-XXXX (Pattern Match, 0.94)'], fullHash: '7c2e91d4a8b3f0c6e2d5a9b1c4f7e0a3d6b9c2e5f8a1d4b7c0e3f6a9b2c5f4f8a3', prevEventId: 'VOX-2026-004891', nextEventId: 'VOX-2026-004893' } },
  { id: '3', timestamp: '2026-02-23T14:22:47.803Z', eventId: 'VOX-2026-004891', user: 'System: Copilot', role: 'AI Agent', action: 'AI Content Governed', target: 'Martinez, Robert', channel: 'AI-Gen', verdict: 'PASS', regulation: 'AI Governance Policy', auditHash: 'd4f1a8...c3e9b2', detail: { content: 'Auto-generated clinical summary: Patient Robert Martinez, 67M, CHF NYHA III, presented with hyperkalemia (K+ 6.8). Treatment initiated per protocol.', matchedPolicies: ['AI-PHI-001 — PHI in AI Output', 'AI-ACCURACY-001 — EHR Verification', 'AI-BIAS-001 — Bias Detection'], entities: [], fullHash: 'd4f1a8b3c9e2f7a0d6b1c4e8f2a5d9b3c7e0f4a8b2c6d1e5f9a3b7c1d4e8f2c3e9b2', prevEventId: 'VOX-2026-004890', nextEventId: 'VOX-2026-004892' } },
  { id: '4', timestamp: '2026-02-23T14:22:15.112Z', eventId: 'VOX-2026-004890', user: 'Dr. Rivera', role: 'Hospitalist', action: 'Message Sent', target: 'Martinez, Robert', channel: 'Secure Chat', verdict: 'PASS', regulation: 'HIPAA §164.502', auditHash: '9b3c7f...a2d8e1', detail: { content: 'K+ is critically elevated at 6.8. Recommending IV calcium gluconate and sodium polystyrene. Please confirm orders and monitor telemetry.', matchedPolicies: ['HIPAA-PHI-CHAT-002 — PHI in Secure Channel (Allowed)', 'JC-CRITRESULT-002 — Critical Result Notification'], entities: ['K+ 6.8 (Lab Value, Clinical Context)', 'Martinez (Patient, Context)'], fullHash: '9b3c7f0a4d8e2b6c1f5a9d3b7e0c4f8a2d6b1e5c9f3a7d0b4e8c2f6a1d5b9e3a2d8e1', prevEventId: 'VOX-2026-004889', nextEventId: 'VOX-2026-004891' } },
  { id: '5', timestamp: '2026-02-23T14:21:58.665Z', eventId: 'VOX-2026-004889', user: 'System', role: 'Escalation', action: 'Escalation Triggered', target: 'Martinez, Robert', channel: 'System', verdict: '—', regulation: 'CMS CoP', auditHash: 'e2a4d6...f7b1c8', detail: { content: 'Critical lab result K+ 6.8 mEq/L triggered CRIT-LAB-001 escalation workflow. Attending, primary nurse, department chief in escalation chain.', matchedPolicies: ['CMS-CRITLAB-001 — Critical Lab Escalation', 'JC-NPG-CRIT-002 — Critical Test Result Notification'], entities: ['K+ 6.8 mEq/L (Critical Lab)', 'CRIT-LAB-001 (Workflow)'], fullHash: 'e2a4d6b8c1f3a7d0e5b9c2f6a0d4b8e1c5f9a3d7b0e4c8f2a6d1b5e9c3f7a0d4f7b1c8', prevEventId: 'VOX-2026-004888', nextEventId: 'VOX-2026-004890' } },
  { id: '6', timestamp: '2026-02-23T14:20:30.449Z', eventId: 'VOX-2026-004888', user: 'Dr. Rivera', role: 'Hospitalist', action: 'Patient Record Viewed', target: 'Martinez, Robert', channel: 'EHR', verdict: '—', regulation: 'HIPAA §164.312', auditHash: 'f8c2b1...d3a7e9', detail: { content: 'Accessed patient chart: Martinez, Robert (MRN-0038291). Sections viewed: Labs, Medications, Vitals, Active Orders.', matchedPolicies: ['HIPAA §164.312 — Access Controls', 'HIPAA §164.528 — Accounting of Disclosures'], entities: ['MRN-0038291 (Medical Record)', 'Labs, Medications, Vitals (Chart Sections)'], fullHash: 'f8c2b1a4d7e0c3f6b9a2d5e8c1f4b7a0d3e6c9f2b5a8d1e4c7f0b3a6d9e2c5f8d3a7e9', prevEventId: 'VOX-2026-004887', nextEventId: 'VOX-2026-004889' } },
  { id: '7', timestamp: '2026-02-23T14:15:22.871Z', eventId: 'VOX-2026-004887', user: 'Nurse Torres', role: 'RN', action: 'Message Sent', target: 'Martinez, Robert', channel: 'Secure Chat', verdict: 'PASS', regulation: 'HIPAA §164.502', auditHash: 'a1b2c3...d4e5f6', detail: { content: 'Copy. Calcium gluconate 1g IV now, telemetry already on. Patient is asymptomatic, no EKG changes. Will recheck BMP in 2 hours.', matchedPolicies: ['HIPAA-PHI-CHAT-002 — PHI in Secure Channel (Allowed)'], entities: [], fullHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2d4e5f6', prevEventId: 'VOX-2026-004886', nextEventId: 'VOX-2026-004888' } },
  { id: '8', timestamp: '2026-02-23T13:45:13.552Z', eventId: 'VOX-2026-004886', user: 'System: Copilot', role: 'AI Agent', action: 'AI Content Redacted', target: 'Martinez, Robert', channel: 'AI-Gen', verdict: 'REDACT', regulation: 'HIPAA §164.514', auditHash: 'b3c4d5...e6f7a8', detail: { content: 'AI-generated discharge summary contained patient SSN. SSN pattern detected and redacted before delivery to Dr. Rivera.', matchedPolicies: ['AI-PHI-001 — PHI in AI Output'], entities: ['SSN (Pattern Match, Redacted)'], fullHash: 'b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4e6f7a8', prevEventId: 'VOX-2026-004885', nextEventId: 'VOX-2026-004887' } },
  { id: '9', timestamp: '2026-02-23T13:30:44.218Z', eventId: 'VOX-2026-004885', user: 'Dr. Williams', role: 'Psychiatrist', action: 'Message Flagged', target: 'Garcia, Maria', channel: 'Secure Chat', verdict: 'FLAG', regulation: '42 CFR Part 2', auditHash: 'c5d6e7...f8a9b0', detail: { content: 'Substance use assessment for patient Garcia. 42 CFR Part 2 consent verification triggered — consent record found and validated.', matchedPolicies: ['HIPAA-PART2-008 — SUD Data Sharing', 'CFR2-SEGMENT-002 — Segmented Audit Trail'], entities: ['Substance Use Assessment (Behavioral Health)', 'Alcohol Use Disorder (Diagnosis)'], fullHash: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6f8a9b0', prevEventId: 'VOX-2026-004884', nextEventId: 'VOX-2026-004886' } },
  { id: '10', timestamp: '2026-02-23T12:15:33.107Z', eventId: 'VOX-2026-004884', user: 'P. Okonkwo', role: 'CCO', action: 'Configuration Change', target: 'AI-ACCURACY-001', channel: 'Admin', verdict: '—', regulation: 'N/A', auditHash: 'd7e8f9...a0b1c2', detail: { content: 'Updated AI accuracy confidence threshold from 0.75 to 0.80. Change approved by D. Park (CISO). Effective immediately.', matchedPolicies: ['CONFIG-AUDIT-001 — Configuration Change Tracking'], entities: ['AI-ACCURACY-001 (Policy Rule)', 'Confidence Threshold: 0.75 → 0.80'], fullHash: 'd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8a0b1c2', prevEventId: 'VOX-2026-004883', nextEventId: 'VOX-2026-004885' } },
  { id: '11', timestamp: '2026-02-23T11:47:33.891Z', eventId: 'VOX-2026-004883', user: 'System', role: 'Policy Engine', action: 'Message Blocked', target: 'Outbound SMS', channel: 'SMS', verdict: 'BLOCK', regulation: 'HIPAA §164.502', auditHash: 'e9f0a1...b2c3d4', detail: { content: 'Outbound SMS contained SSN pattern (XXX-XX-XXXX). Auto-blocked by pattern matching engine. Sender notified.', matchedPolicies: ['HIPAA-PHI-SMS-001 — PHI Detection in Outbound SMS'], entities: ['SSN Pattern (1.00 confidence)'], fullHash: 'e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b2c3d4', prevEventId: 'VOX-2026-004882', nextEventId: 'VOX-2026-004884' } },
  { id: '12', timestamp: '2026-02-23T11:30:19.447Z', eventId: 'VOX-2026-004882', user: 'System', role: 'Policy Engine', action: 'SUD Consent Verified', target: 'Garcia, Maria', channel: 'Secure Chat', verdict: 'FLAG', regulation: '42 CFR Part 2', auditHash: 'f1a2b3...c4d5e6', detail: { content: '42 CFR Part 2 consent verification for substance use disorder data. Consent form located and validated. Data sharing permitted to authorized care team.', matchedPolicies: ['HIPAA-PART2-008 — SUD Data Sharing', 'CFR2-CONSENT-001 — Consent Verification'], entities: ['SUD Data (Behavioral Health)'], fullHash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2c4d5e6', prevEventId: 'VOX-2026-004881', nextEventId: 'VOX-2026-004883' } },
  { id: '13', timestamp: '2026-02-23T11:02:14.773Z', eventId: 'VOX-2026-004881', user: 'System: Copilot', role: 'AI Agent', action: 'PHI Redacted from AI Output', target: 'Dr. Chen', channel: 'AI-Gen', verdict: 'REDACT', regulation: 'HIPAA §164.514', auditHash: 'a3b4c5...d6e7f8', detail: { content: 'AI-generated patient summary contained patient MRN and phone number. PII tokens redacted before delivery to Dr. Chen inbox.', matchedPolicies: ['AI-PHI-001 — PHI in AI Output'], entities: ['MRN-0038291 (Pattern Match)', 'Phone: 555-XXXX (Pattern Match)'], fullHash: 'a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4d6e7f8', prevEventId: 'VOX-2026-004880', nextEventId: 'VOX-2026-004882' } },
  { id: '14', timestamp: '2026-02-23T10:45:22.556Z', eventId: 'VOX-2026-004880', user: 'Dr. Kim', role: 'PharmD', action: 'Message Sent', target: 'Adams, Patricia', channel: 'Secure Chat', verdict: 'PASS', regulation: 'HIPAA §164.502', auditHash: 'b5c6d7...e8f9a0', detail: { content: 'Drug interaction alert: Metformin + IV contrast. Recommend holding Metformin 48h pre/post contrast per protocol.', matchedPolicies: ['HIPAA-PHI-CHAT-002 — PHI in Secure Channel (Allowed)'], entities: [], fullHash: 'b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6e8f9a0', prevEventId: 'VOX-2026-004879', nextEventId: 'VOX-2026-004881' } },
  { id: '15', timestamp: '2026-02-23T10:15:08.334Z', eventId: 'VOX-2026-004879', user: 'Nurse Torres', role: 'RN', action: 'Message Sent', target: 'Chen, Margaret', channel: 'Secure Chat', verdict: 'PASS', regulation: 'HIPAA §164.502', auditHash: 'c7d8e9...f0a1b2', detail: { content: 'Post-op vitals stable. BP 124/78, HR 72, SpO2 98% on room air. Patient alert and oriented x3. Surgical site clean, no drainage.', matchedPolicies: ['HIPAA-PHI-CHAT-002 — PHI in Secure Channel (Allowed)', 'JC-HANDOFF-001 — Handoff Completeness'], entities: [], fullHash: 'c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8f0a1b2', prevEventId: 'VOX-2026-004878', nextEventId: 'VOX-2026-004880' } },
  { id: '16', timestamp: '2026-02-23T09:30:55.112Z', eventId: 'VOX-2026-004878', user: 'Dr. Rivera', role: 'Hospitalist', action: 'Record Exported', target: 'Williams, David', channel: 'EHR', verdict: '—', regulation: 'Cures Act', auditHash: 'd9e0f1...a2b3c4', detail: { content: 'Patient records exported via FHIR R4 for continuity of care transfer to pulmonology outpatient clinic. USCDI v3 data elements verified complete.', matchedPolicies: ['CURES-FHIR-002 — FHIR R4 Export Completeness', 'CURES-BLOCK-001 — Information Blocking Check'], entities: ['Williams, David (Patient)', 'FHIR R4 Bundle (Export)'], fullHash: 'd9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0a2b3c4', prevEventId: 'VOX-2026-004877', nextEventId: 'VOX-2026-004879' } },
  { id: '17', timestamp: '2026-02-23T09:15:44.218Z', eventId: 'VOX-2026-004877', user: 'System', role: 'Policy Engine', action: 'PHI Redacted — Min. Necessary', target: 'Email Outbound', channel: 'Email', verdict: 'REDACT', regulation: 'HIPAA §164.514', auditHash: 'e1f2a3...b4c5d6', detail: { content: 'Outbound referral email contained more PHI than necessary for recipient role. Excess data elements redacted per minimum necessary standard.', matchedPolicies: ['HIPAA-MINNEC-005 — Minimum Necessary Check'], entities: ['Patient DOB (Redacted)', 'Insurance ID (Redacted)'], fullHash: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2b4c5d6', prevEventId: 'VOX-2026-004876', nextEventId: 'VOX-2026-004878' } },
  { id: '18', timestamp: '2026-02-23T08:55:11.992Z', eventId: 'VOX-2026-004876', user: 'Dr. Rivera', role: 'Hospitalist', action: 'Login — MFA Verified', target: 'Portal', channel: 'Auth', verdict: '—', regulation: 'HIPAA §164.312', auditHash: 'f3a4b5...c6d7e8', detail: { content: 'Authentication successful. Method: Entra ID SSO + Microsoft Authenticator MFA. Session: CommonSpirit Health Azure AD tenant. Device: Workstation-4N-001.', matchedPolicies: ['HIPAA §164.312(d) — Person or Entity Authentication'], entities: ['Dr. James Rivera (User)', 'Workstation-4N-001 (Device)'], fullHash: 'f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4c6d7e8', prevEventId: 'VOX-2026-004875', nextEventId: 'VOX-2026-004877' } },
  { id: '19', timestamp: '2026-02-23T08:30:22.114Z', eventId: 'VOX-2026-004875', user: 'D. Park', role: 'CISO', action: 'PHI Access Report Generated', target: 'Compliance Archive', channel: 'Admin', verdict: '—', regulation: 'HIPAA §164.528', auditHash: 'a5b6c7...d8e9f0', detail: { content: 'Monthly PHI access report generated for February 2026. 12,847 access events reviewed. 0 unauthorized access detected. Report archived to compliance vault.', matchedPolicies: ['HIPAA §164.528 — Accounting of Disclosures'], entities: ['February 2026 Report (Document)', '12,847 Access Events'], fullHash: 'a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6d8e9f0', prevEventId: 'VOX-2026-004874', nextEventId: 'VOX-2026-004876' } },
  { id: '20', timestamp: '2026-02-23T07:30:55.337Z', eventId: 'VOX-2026-004874', user: 'Nurse Torres', role: 'RN', action: 'Video Session Started', target: 'Williams, David', channel: 'Video', verdict: 'PASS', regulation: 'HIPAA §164.312', auditHash: 'b7c8d9...e0f1a2', detail: { content: 'Telehealth video session initiated with patient Williams, David. AES-256 encrypted, recording governed, consent verified on file.', matchedPolicies: ['HIPAA-VIDEO-001 — Telehealth Encryption', 'HIPAA §164.312 — Transmission Security'], entities: ['Williams, David (Patient)', 'Video Session (Telehealth)'], fullHash: 'b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8e0f1a2', prevEventId: 'VOX-2026-004873', nextEventId: 'VOX-2026-004875' } },
];

const verdictStyle: Record<string, string> = {
  PASS: 'text-success bg-success/10',
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
  '—': 'text-muted-foreground bg-muted',
  'N/A': 'text-muted-foreground bg-muted',
};

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filtered = auditEvents.filter((e) => {
    if (verdictFilter !== 'all' && e.verdict !== verdictFilter) return false;
    if (channelFilter !== 'all' && e.channel !== channelFilter) return false;
    if (userFilter !== 'all' && e.user !== userFilter) return false;
    if (actionFilter !== 'all' && !e.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.eventId.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q) || e.regulation.toLowerCase().includes(q) || (e.detail?.content || '').toLowerCase().includes(q);
    }
    return true;
  });

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
  };

  const uniqueUsers = [...new Set(auditEvents.map(e => e.user))];

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
                  Last verification: <strong className="text-foreground">2 minutes ago</strong> | Next: <strong className="text-foreground">continuous</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-success" />
                SHA-256 hash chain: <strong className="text-success">intact</strong>
              </span>
              <span className="text-border">│</span>
              <span><strong className="text-foreground">0</strong> records modified</span>
              <span className="text-border">│</span>
              <span><strong className="text-foreground">0</strong> records deleted</span>
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
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today" className="text-xs">Today</SelectItem>
                  <SelectItem value="7d" className="text-xs">Last 7 Days</SelectItem>
                  <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="custom" className="text-xs">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Users</SelectItem>
                  {uniqueUsers.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Action Type */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Actions</SelectItem>
                  <SelectItem value="Message Sent" className="text-xs">Message Sent</SelectItem>
                  <SelectItem value="Message Blocked" className="text-xs">Message Blocked</SelectItem>
                  <SelectItem value="Message Redacted" className="text-xs">Message Redacted</SelectItem>
                  <SelectItem value="Message Flagged" className="text-xs">Message Flagged</SelectItem>
                  <SelectItem value="Policy Evaluated" className="text-xs">Policy Evaluated</SelectItem>
                  <SelectItem value="Escalation" className="text-xs">Escalation Triggered</SelectItem>
                  <SelectItem value="Login" className="text-xs">Login</SelectItem>
                  <SelectItem value="Configuration" className="text-xs">Configuration Change</SelectItem>
                  <SelectItem value="PHI" className="text-xs">PHI Accessed</SelectItem>
                  <SelectItem value="Export" className="text-xs">Record Exported</SelectItem>
                  <SelectItem value="AI Content" className="text-xs">AI Content Governed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Channel */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Channel</label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Channels</SelectItem>
                  <SelectItem value="Secure Chat" className="text-xs">Secure Chat</SelectItem>
                  <SelectItem value="Voice" className="text-xs">Voice</SelectItem>
                  <SelectItem value="Video" className="text-xs">Video</SelectItem>
                  <SelectItem value="SMS" className="text-xs">SMS</SelectItem>
                  <SelectItem value="Email" className="text-xs">Email</SelectItem>
                  <SelectItem value="AI-Gen" className="text-xs">AI-Generated</SelectItem>
                  <SelectItem value="EHR" className="text-xs">EHR</SelectItem>
                  <SelectItem value="System" className="text-xs">System</SelectItem>
                  <SelectItem value="Auth" className="text-xs">Auth</SelectItem>
                  <SelectItem value="Admin" className="text-xs">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verdict */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Verdict</label>
              <Select value={verdictFilter} onValueChange={setVerdictFilter}>
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
                  placeholder="Search audit events..."
                  className="bg-transparent text-xs outline-none w-full text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5 justify-end">
              <label className="text-[9px] invisible">.</label>
              <span className="text-[11px] text-muted-foreground tabular-nums h-7 flex items-center">{filtered.length} events</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Table */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-480px)] min-h-[300px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/90 backdrop-blur-sm">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">Timestamp</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-32">Event ID</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">User</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-20">Role</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">Patient/Target</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-20">Channel</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-16">Verdict</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-24">Regulation</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-24 hidden xl:table-cell">Audit Hash</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <>
                    <tr
                      key={e.id}
                      onClick={() => setExpandedEvent(expandedEvent === e.id ? null : e.id)}
                      className={cn(
                        'border-b border-border/40 transition-colors cursor-pointer',
                        e.verdict === 'BLOCK' && 'bg-stat/5',
                        e.verdict === 'FLAG' && 'bg-urgent/5',
                        e.verdict === 'REDACT' && 'bg-ehr-part2/5',
                        expandedEvent === e.id ? 'bg-muted/50' : 'hover:bg-muted/30',
                      )}
                    >
                      <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">{formatTs(e.timestamp)}</td>
                      <td className="px-3 py-2 font-mono text-foreground text-[10px]">{e.eventId}</td>
                      <td className="px-3 py-2 text-foreground font-medium">{e.user}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-[9px] h-4 px-1">{e.role}</Badge></td>
                      <td className="px-3 py-2 text-foreground">{e.action}</td>
                      <td className="px-3 py-2 text-foreground">{e.target}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.channel}</td>
                      <td className="px-3 py-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[e.verdict] || verdictStyle['—'])}>{e.verdict}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">{e.regulation}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground hidden xl:table-cell">{e.auditHash}</td>
                      <td className="px-2 py-2">
                        {expandedEvent === e.id ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                      </td>
                    </tr>
                    {expandedEvent === e.id && e.detail && (
                      <tr key={`${e.id}-detail`} className="bg-muted/30 border-b border-border/40">
                        <td colSpan={11} className="px-6 py-4">
                          <div className="space-y-3">
                            {/* Content */}
                            {e.detail.content && (
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Event Content</p>
                                <div className="bg-card rounded-md border border-border/50 p-3">
                                  <p className="text-xs text-foreground leading-relaxed">{e.detail.content}</p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              {/* Matched Policies */}
                              {e.detail.matchedPolicies && e.detail.matchedPolicies.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Matched Policies</p>
                                  <div className="space-y-1">
                                    {e.detail.matchedPolicies.map((p, i) => (
                                      <div key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span className="font-mono">{p}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Entities */}
                              {e.detail.entities && e.detail.entities.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Detected Entities</p>
                                  <div className="space-y-1">
                                    {e.detail.entities.map((ent, i) => (
                                      <div key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                                        <span className="text-urgent mt-0.5">▸</span>
                                        <span>{ent}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Hash + Chain */}
                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/50">
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Full SHA-256 Hash</p>
                                <p className="text-[10px] font-mono text-foreground break-all">{e.detail.fullHash}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Previous Event</p>
                                <p className="text-[10px] font-mono text-primary">{e.detail.prevEventId}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next Event</p>
                                <p className="text-[10px] font-mono text-primary">{e.detail.nextEventId}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Lock className="w-3 h-3 text-success" />
                              <span className="text-[10px] text-success font-medium">Chain Integrity: Verified ✓</span>
                              <span className="text-[10px] text-muted-foreground">| Tamper detection: No modifications</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Bar */}
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
        <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
          <strong className="text-foreground">847</strong> events today · <strong className="text-foreground">23,492</strong> events (30 days) · <strong className="text-success">0</strong> integrity violations
        </span>
      </div>
    </div>
  );
}
