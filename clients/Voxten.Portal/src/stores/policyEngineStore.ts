import { create } from 'zustand';

export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RuleAction = 'block' | 'flag' | 'redact' | 'log' | 'escalate';
export type AnalysisMethod = 'pattern' | 'ai' | 'both';

export interface PolicyRule {
  id: string;
  name: string;
  packId: string;
  description: string;
  trigger: string;
  analysisMethod: AnalysisMethod;
  action: RuleAction;
  severity: RuleSeverity;
  notification: string;
  channels: string[];
  direction: 'outbound' | 'inbound' | 'both';
  fired24h: number;
  fired30d: number;
  lastFired: string;
  fpRate: string;
  avgEvalMs: number;
  avgAiMs: number;
  enabled: boolean;
  aiModel?: string;
  confidenceThreshold?: number;
  patternLibrary?: string;
  patternCount?: number;
  recentFires?: { date: string; action: string; summary: string }[];
}

export interface RegulationPack {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'paused' | 'available' | 'coming';
  rules: number;
  activeRules?: number;
  pausedRules?: number;
  violations: number;
  lastUpdated: string;
  lastEvaluated?: string;
  coverage?: string;
  activeSince?: string;
  description?: string;
}

export type DetailPanelMode = 'pack-overview' | 'rule-detail' | 'rule-tester' | 'rule-create';

interface PolicyEngineState {
  selectedPackId: string | null;
  selectedRuleId: string | null;
  detailMode: DetailPanelMode;
  searchQuery: string;
  severityFilter: RuleSeverity | 'all';
  actionFilter: RuleAction | 'all';
  methodFilter: AnalysisMethod | 'all';
  channelFilter: string;
  packsCollapsed: boolean;
  setSelectedPack: (id: string | null) => void;
  setSelectedRule: (id: string | null) => void;
  setDetailMode: (mode: DetailPanelMode) => void;
  setSearchQuery: (q: string) => void;
  setSeverityFilter: (f: RuleSeverity | 'all') => void;
  setActionFilter: (f: RuleAction | 'all') => void;
  setMethodFilter: (f: AnalysisMethod | 'all') => void;
  setChannelFilter: (f: string) => void;
  setPacksCollapsed: (v: boolean) => void;
  enablePack: (id: string) => void;
}

export const usePolicyEngineStore = create<PolicyEngineState>((set) => ({
  selectedPackId: 'hipaa',
  selectedRuleId: null,
  detailMode: 'pack-overview',
  searchQuery: '',
  severityFilter: 'all',
  actionFilter: 'all',
  methodFilter: 'all',
  channelFilter: 'all',
  packsCollapsed: false,
  setSelectedPack: (id) => set({ selectedPackId: id, selectedRuleId: null, detailMode: 'pack-overview' }),
  setSelectedRule: (id) => set({ selectedRuleId: id, detailMode: id ? 'rule-detail' : 'pack-overview' }),
  setDetailMode: (mode) => set({ detailMode: mode }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSeverityFilter: (f) => set({ severityFilter: f }),
  setActionFilter: (f) => set({ actionFilter: f }),
  setMethodFilter: (f) => set({ methodFilter: f }),
  setChannelFilter: (f) => set({ channelFilter: f }),
  setPacksCollapsed: (v) => set({ packsCollapsed: v }),
  enablePack: (id) => set((state) => ({ selectedPackId: id })),
}));

export const regulationPacks: RegulationPack[] = [
  { id: 'hipaa', name: 'HIPAA Privacy & Security', icon: '🛡', status: 'active', rules: 250, activeRules: 244, pausedRules: 6, violations: 3, lastUpdated: '2h ago', lastEvaluated: '4s ago', coverage: '100%', activeSince: 'Jan 2026', description: 'Comprehensive HIPAA compliance covering PHI detection, minimum necessary standards, consent verification, telehealth video governance, and breach prevention across all communication channels.' },
  { id: 'joint-commission', name: 'Joint Commission NPG 2026', icon: '🏥', status: 'active', rules: 42, activeRules: 42, pausedRules: 0, violations: 0, lastUpdated: '6h ago', lastEvaluated: '9s ago', coverage: '100%', activeSince: 'Jan 2026', description: 'Joint Commission National Patient Safety Goals alignment for staff communication, patient identification, handoff communication, and critical test result communication.' },
  { id: 'part2', name: '42 CFR Part 2 (Behavioral)', icon: '🔒', status: 'active', rules: 89, activeRules: 85, pausedRules: 4, violations: 0, lastUpdated: '4h ago', lastEvaluated: '7s ago', coverage: '100%', activeSince: 'Feb 2026', description: 'Behavioral health and substance use disorder data protection. Stricter than HIPAA for SUD records. Consent-driven access controls and segmented audit trails.' },
  { id: 'cures-act', name: '21st Century Cures Act', icon: '📋', status: 'active', rules: 34, activeRules: 34, pausedRules: 0, violations: 0, lastUpdated: '1d ago', lastEvaluated: '12s ago', coverage: '100%', activeSince: 'Feb 2026', description: 'Anti-information-blocking provisions, FHIR R4 integration requirements, USCDI v3 alignment, and patient access to electronic health information.' },
  { id: 'cms-cop', name: 'CMS Conditions of Participation', icon: '🏛️', status: 'active', rules: 67, activeRules: 67, pausedRules: 0, violations: 0, lastUpdated: '1d ago', lastEvaluated: '15s ago', coverage: '100%', activeSince: 'Feb 2026', description: 'CMS CoP requirements for patient rights, discharge planning, infection control communication, and quality assessment reporting.' },
  { id: 'fedramp', name: 'FedRAMP High', icon: '🏛️', status: 'available', rules: 0, violations: 0, lastUpdated: '', description: 'Federal Risk and Authorization Management Program — High Impact baseline. Requires Confidential Computing tier.' },
  { id: 'dora', name: 'DORA (EU Digital Resilience)', icon: '🌐', status: 'coming', rules: 0, violations: 0, lastUpdated: '', description: 'EU Digital Operational Resilience Act for financial entities. Coming Q3 2026.' },
];

export const policyRules: PolicyRule[] = [
  // ─── HIPAA RULES ───
  {
    id: 'HIPAA-PHI-SMS-001', name: 'PHI Detection in Outbound SMS', packId: 'hipaa',
    description: 'Detects Protected Health Information patterns in outbound SMS messages and blocks transmission before delivery.',
    trigger: 'Outbound SMS containing PHI patterns',
    analysisMethod: 'both', action: 'block', severity: 'critical',
    notification: 'Patricia Okonkwo (CCO)', channels: ['SMS', 'MMS'], direction: 'outbound',
    fired24h: 4, fired30d: 47, lastFired: '2h ago', fpRate: '0.0%', avgEvalMs: 23, avgAiMs: 41,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.85,
    patternLibrary: 'HIPAA-PHI-v3', patternCount: 47,
    recentFires: [
      { date: 'Feb 23, 14:22', action: 'BLOCK', summary: 'SMS from system contained "MRN 38291" + patient name. Auto-blocked.' },
      { date: 'Feb 23, 11:47', action: 'BLOCK', summary: 'SMS draft contained SSN pattern (XXX-XX-XXXX). Auto-blocked before transmission.' },
    ],
  },
  {
    id: 'HIPAA-PHI-AI-002', name: 'PHI in AI-Generated Content', packId: 'hipaa',
    description: 'Scans AI-generated communications (Copilot, Azure OpenAI agents) for inadvertent PHI disclosure and redacts before delivery.',
    trigger: 'AI output contains PHI entities',
    analysisMethod: 'ai', action: 'redact', severity: 'critical',
    notification: 'Patricia Okonkwo (CCO)', channels: ['AI-Generated'], direction: 'outbound',
    fired24h: 7, fired30d: 89, lastFired: '45m ago', fpRate: '1.2%', avgEvalMs: 31, avgAiMs: 52,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.80,
    recentFires: [
      { date: 'Feb 23, 13:38', action: 'REDACT', summary: 'Copilot patient summary contained DOB and MRN. Redacted before delivery to Dr. Chen.' },
    ],
  },
  {
    id: 'HIPAA-PHI-EMAIL-003', name: 'Unencrypted PHI Transmission', packId: 'hipaa',
    description: 'Blocks attempts to send PHI over non-encrypted channels or to external domains without TLS verification.',
    trigger: 'PHI in email to non-TLS recipient',
    analysisMethod: 'pattern', action: 'block', severity: 'critical',
    notification: 'IT Security, Compliance Officer', channels: ['Email'], direction: 'outbound',
    fired24h: 0, fired30d: 3, lastFired: '8d ago', fpRate: '0.0%', avgEvalMs: 8, avgAiMs: 0,
    enabled: true, patternLibrary: 'HIPAA-PHI-v3', patternCount: 47,
  },
  {
    id: 'HIPAA-PHOTO-004', name: 'Clinical Photography Without Consent', packId: 'hipaa',
    description: 'Detects image attachments in clinical contexts without linked consent documentation in the EHR.',
    trigger: 'Image attachment in clinical message without consent record',
    analysisMethod: 'ai', action: 'flag', severity: 'high',
    notification: 'Privacy Officer', channels: ['Secure Messaging', 'SMS'], direction: 'outbound',
    fired24h: 1, fired30d: 6, lastFired: '7h ago', fpRate: '3.1%', avgEvalMs: 45, avgAiMs: 67,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.75,
  },
  {
    id: 'HIPAA-MINNEC-005', name: 'Minimum Necessary Violation', packId: 'hipaa',
    description: 'Flags messages sharing more patient information than necessary for the stated clinical purpose.',
    trigger: 'PHI volume exceeds purpose threshold',
    analysisMethod: 'ai', action: 'flag', severity: 'high',
    notification: 'Privacy Officer', channels: ['All'], direction: 'both',
    fired24h: 2, fired30d: 18, lastFired: '4h ago', fpRate: '4.8%', avgEvalMs: 38, avgAiMs: 55,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.82,
  },
  {
    id: 'HIPAA-AFTERHRS-006', name: 'After-Hours Clinical Communication', packId: 'hipaa',
    description: 'Logs clinical messages sent outside business hours for fatigue risk monitoring and shift compliance.',
    trigger: 'Clinical message sent outside 06:00-22:00',
    analysisMethod: 'pattern', action: 'log', severity: 'medium',
    notification: 'Care Team Lead', channels: ['All'], direction: 'both',
    fired24h: 12, fired30d: 156, lastFired: '35m ago', fpRate: '0.0%', avgEvalMs: 4, avgAiMs: 0,
    enabled: true,
  },
  {
    id: 'HIPAA-XFAC-007', name: 'Cross-Facility PHI Without BAA', packId: 'hipaa',
    description: 'Blocks PHI transmission to facilities without an active Business Associate Agreement on file.',
    trigger: 'PHI to facility without active BAA',
    analysisMethod: 'both', action: 'block', severity: 'critical',
    notification: 'Compliance Officer, Legal', channels: ['Email', 'Secure Messaging'], direction: 'outbound',
    fired24h: 0, fired30d: 1, lastFired: '18d ago', fpRate: '0.0%', avgEvalMs: 19, avgAiMs: 35,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.90,
  },
  {
    id: 'HIPAA-PART2-008', name: 'Patient Self-Referral Data (42 CFR Part 2 Overlap)', packId: 'hipaa',
    description: 'Flags when substance use data might be included in standard clinical communications.',
    trigger: 'Substance use / behavioral health terms in clinical message',
    analysisMethod: 'ai', action: 'flag', severity: 'high',
    notification: 'Privacy Officer', channels: ['All'], direction: 'both',
    fired24h: 0, fired30d: 4, lastFired: '6d ago', fpRate: '2.3%', avgEvalMs: 42, avgAiMs: 61,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.78,
  },
  {
    id: 'HIPAA-VM-009', name: 'Voicemail PHI Exposure', packId: 'hipaa',
    description: 'Flags voicemail transcripts containing PHI that may be stored on non-compliant systems.',
    trigger: 'Voicemail transcript contains PHI patterns',
    analysisMethod: 'pattern', action: 'flag', severity: 'medium',
    notification: 'IT Security', channels: ['Voice'], direction: 'inbound',
    fired24h: 3, fired30d: 31, lastFired: '1h ago', fpRate: '1.8%', avgEvalMs: 11, avgAiMs: 0,
    enabled: true, patternLibrary: 'HIPAA-PHI-v3', patternCount: 47,
  },
  {
    id: 'HIPAA-BULK-010', name: 'Bulk Patient Data in Email', packId: 'hipaa',
    description: 'Catches email attachments containing multiple patient records — potential breach vector.',
    trigger: 'Email attachment with >1 patient record',
    analysisMethod: 'pattern', action: 'block', severity: 'critical',
    notification: 'Compliance Officer, IT Security, Legal', channels: ['Email'], direction: 'outbound',
    fired24h: 0, fired30d: 0, lastFired: 'Never', fpRate: '0.0%', avgEvalMs: 15, avgAiMs: 0,
    enabled: true, patternLibrary: 'HIPAA-BULK-v1', patternCount: 12,
  },
  // ─── JOINT COMMISSION RULES ───
  {
    id: 'JC-HANDOFF-001', name: 'Handoff Communication Completeness', packId: 'joint-commission',
    description: 'Ensures shift handoff communications include required patient safety elements: diagnosis, current status, medications, and pending tasks.',
    trigger: 'Handoff message missing required SBAR elements',
    analysisMethod: 'ai', action: 'flag', severity: 'high',
    notification: 'Charge Nurse, Department Chief', channels: ['Secure Messaging'], direction: 'both',
    fired24h: 2, fired30d: 18, lastFired: '6h ago', fpRate: '3.5%', avgEvalMs: 35, avgAiMs: 52,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.78,
  },
  {
    id: 'JC-CRITRESULT-002', name: 'Critical Test Result Notification Timeline', packId: 'joint-commission',
    description: 'Monitors that critical test results are communicated to the responsible provider within required timeframes.',
    trigger: 'Critical test result with no acknowledgment within 30 minutes',
    analysisMethod: 'pattern', action: 'escalate', severity: 'critical',
    notification: 'Department Chief, CMO', channels: ['All'], direction: 'both',
    fired24h: 1, fired30d: 8, lastFired: '3h ago', fpRate: '0.0%', avgEvalMs: 5, avgAiMs: 0,
    enabled: true,
  },
  {
    id: 'JC-PATIENTID-003', name: 'Two-Patient-Identifier Verification', packId: 'joint-commission',
    description: 'Flags clinical communications that reference a patient by only one identifier (name only, MRN only) without a second verifier.',
    trigger: 'Clinical message with single patient identifier',
    analysisMethod: 'ai', action: 'flag', severity: 'medium',
    notification: 'Care Team Lead', channels: ['Secure Messaging', 'SMS'], direction: 'outbound',
    fired24h: 5, fired30d: 42, lastFired: '1h ago', fpRate: '4.2%', avgEvalMs: 28, avgAiMs: 44,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.75,
  },
  // ─── 42 CFR PART 2 RULES ───
  {
    id: 'CFR2-CONSENT-001', name: 'SUD Data Sharing Without Consent', packId: 'part2',
    description: 'Blocks sharing of substance use disorder records without documented patient consent per 42 CFR Part 2 requirements.',
    trigger: 'SUD data detected in communication without consent record',
    analysisMethod: 'both', action: 'block', severity: 'critical',
    notification: 'Privacy Officer, Compliance Officer', channels: ['All'], direction: 'both',
    fired24h: 0, fired30d: 4, lastFired: '6d ago', fpRate: '0.5%', avgEvalMs: 25, avgAiMs: 42,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.88,
  },
  {
    id: 'CFR2-SEGMENT-002', name: 'Segmented Audit Trail Enforcement', packId: 'part2',
    description: 'Ensures SUD-related communications are logged in a segmented audit trail separate from general clinical communications.',
    trigger: 'SUD data access event',
    analysisMethod: 'pattern', action: 'log', severity: 'medium',
    notification: 'Privacy Officer', channels: ['All'], direction: 'both',
    fired24h: 3, fired30d: 31, lastFired: '1h ago', fpRate: '0.0%', avgEvalMs: 4, avgAiMs: 0,
    enabled: true,
  },
  // ─── CURES ACT RULES ───
  {
    id: 'CURES-BLOCK-001', name: 'Information Blocking Detection', packId: 'cures-act',
    description: 'Flags actions that may constitute information blocking under the 21st Century Cures Act — refusal to share or delayed sharing of patient records.',
    trigger: 'Patient data request unfulfilled within 24 hours',
    analysisMethod: 'pattern', action: 'flag', severity: 'high',
    notification: 'Compliance Officer, HIM Director', channels: ['Email', 'Secure Messaging'], direction: 'both',
    fired24h: 0, fired30d: 2, lastFired: '9d ago', fpRate: '0.0%', avgEvalMs: 8, avgAiMs: 0,
    enabled: true,
  },
  {
    id: 'CURES-FHIR-002', name: 'FHIR R4 Export Completeness', packId: 'cures-act',
    description: 'Verifies that patient data exports via FHIR R4 include all required USCDI v3 data elements.',
    trigger: 'FHIR export missing required USCDI elements',
    analysisMethod: 'pattern', action: 'flag', severity: 'medium',
    notification: 'HIT Director', channels: ['All'], direction: 'outbound',
    fired24h: 0, fired30d: 1, lastFired: '14d ago', fpRate: '0.0%', avgEvalMs: 12, avgAiMs: 0,
    enabled: true,
  },
  // ─── CMS COP RULES ───
  {
    id: 'CMS-DISCHARGE-001', name: 'Discharge Planning Communication', packId: 'cms-cop',
    description: 'Ensures discharge planning communications include required patient education, medication reconciliation, and follow-up instructions.',
    trigger: 'Discharge communication missing required elements',
    analysisMethod: 'ai', action: 'flag', severity: 'high',
    notification: 'Case Manager, Attending Physician', channels: ['Secure Messaging', 'Email'], direction: 'outbound',
    fired24h: 1, fired30d: 12, lastFired: '4h ago', fpRate: '2.8%', avgEvalMs: 38, avgAiMs: 55,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.80,
  },
  {
    id: 'CMS-PATIENTRIGHTS-002', name: 'Patient Rights Notification', packId: 'cms-cop',
    description: 'Monitors that patient rights information is communicated appropriately during admission and care transitions.',
    trigger: 'Admission or transfer without documented rights notification',
    analysisMethod: 'pattern', action: 'flag', severity: 'medium',
    notification: 'Patient Advocate', channels: ['All'], direction: 'both',
    fired24h: 0, fired30d: 3, lastFired: '5d ago', fpRate: '0.0%', avgEvalMs: 6, avgAiMs: 0,
    enabled: true,
  },
  // ─── HIPAA VIDEO RULES ───
  {
    id: 'HIPAA-VIDEO-001', name: 'Telehealth Session Recording Consent', packId: 'hipaa',
    description: 'Verifies that patient consent for recording is documented before telehealth session recording begins.',
    trigger: 'Video session initiated without documented patient consent for recording',
    analysisMethod: 'pattern', action: 'flag', severity: 'high',
    notification: 'Compliance Officer', channels: ['Video'], direction: 'both',
    fired24h: 1, fired30d: 8, lastFired: '5h ago', fpRate: '0.0%', avgEvalMs: 6, avgAiMs: 0,
    enabled: true, patternLibrary: 'HIPAA-CONSENT-v2', patternCount: 5,
    recentFires: [
      { date: 'Feb 23, 09:05', action: 'FLAG', summary: 'Video session started without consent flag set. Provider prompted to obtain consent.' },
    ],
  },
  {
    id: 'HIPAA-VIDEO-002', name: 'Screen Share PHI Exposure', packId: 'hipaa',
    description: 'Analyzes screen sharing during telehealth to detect display of patient data for a different patient than the one in the active session.',
    trigger: 'Screen sharing activated during telehealth session',
    analysisMethod: 'ai', action: 'flag', severity: 'critical',
    notification: 'Privacy Officer, Compliance Officer', channels: ['Video'], direction: 'both',
    fired24h: 0, fired30d: 2, lastFired: '4d ago', fpRate: '1.5%', avgEvalMs: 120, avgAiMs: 180,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.82,
    recentFires: [
      { date: 'Feb 19, 11:22', action: 'FLAG', summary: 'Screen share showed chart for patient Thompson while session was with patient Garcia. Wrong-chart alert generated.' },
    ],
  },
  {
    id: 'HIPAA-VIDEO-003', name: 'Telehealth State Licensing Verification', packId: 'hipaa',
    description: 'Flags video sessions where the patient location state differs from the provider\'s licensed states, indicating potential cross-state practice.',
    trigger: 'Video session where patient location state differs from provider licensed states',
    analysisMethod: 'pattern', action: 'flag', severity: 'high',
    notification: 'Compliance Officer, Credentialing', channels: ['Video'], direction: 'both',
    fired24h: 1, fired30d: 5, lastFired: '3h ago', fpRate: '2.0%', avgEvalMs: 14, avgAiMs: 0,
    enabled: true, patternLibrary: 'LICENSE-REGISTRY-v1', patternCount: 50,
    recentFires: [
      { date: 'Feb 23, 11:20', action: 'FLAG', summary: 'Dr. Kim (licensed: CA) conducted session with patient in NV. State license verification pending.' },
    ],
  },
  // ─── ADDITIONAL HIPAA RULES (formerly GDPR slot) ───
  {
    id: 'HIPAA-BREACH-011', name: 'Breach Notification Assessment', packId: 'hipaa',
    description: 'Automatically assesses whether a detected PHI exposure meets the threshold for HIPAA breach notification requirements.',
    trigger: 'PHI exposure event detected — breach threshold assessment',
    analysisMethod: 'ai', action: 'escalate', severity: 'critical',
    notification: 'Privacy Officer, Legal, CCO', channels: ['All'], direction: 'both',
    fired24h: 0, fired30d: 1, lastFired: '12d ago', fpRate: '0.0%', avgEvalMs: 45, avgAiMs: 68,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.92,
  },
  {
    id: 'HIPAA-CONSENT-012', name: 'Patient Authorization Verification', packId: 'hipaa',
    description: 'Verifies valid patient authorization exists before releasing PHI for non-TPO (Treatment, Payment, Operations) purposes.',
    trigger: 'PHI release request for non-TPO purpose',
    analysisMethod: 'both', action: 'block', severity: 'critical',
    notification: 'HIM Director, Privacy Officer', channels: ['Email', 'Secure Messaging'], direction: 'outbound',
    fired24h: 0, fired30d: 2, lastFired: '8d ago', fpRate: '0.5%', avgEvalMs: 20, avgAiMs: 36,
    enabled: true, aiModel: 'Azure OpenAI (GPT-4o)', confidenceThreshold: 0.88,
  },
];

export interface SampleTestMessage {
  id: string;
  label: string;
  channel: string;
  direction: string;
  sender: string;
  recipient: string;
  text: string;
  packHint: string;
}

export const sampleTestMessages: SampleTestMessage[] = [
  {
    id: 'phi-sms', label: 'PHI in SMS (HIPAA)', channel: 'SMS', direction: 'Outbound',
    sender: 'Dr. Rivera', recipient: 'External Number',
    text: 'Patient John Smith, MRN 38291, has a potassium of 6.8 mEq/L. Please confirm orders for IV calcium gluconate. His SSN is 482-91-0037.',
    packHint: 'hipaa',
  },
  {
    id: 'clean-clinical', label: 'Clean Clinical Message', channel: 'Secure Messaging', direction: 'Outbound',
    sender: 'Dr. Rivera', recipient: 'Care Team',
    text: 'The patient in Room 412 has elevated potassium. Please confirm orders for calcium gluconate. Will follow up after rounds.',
    packHint: 'hipaa',
  },
  {
    id: 'violation-phi', label: '⚠ VIOLATION: PHI with SSN + Phone', channel: 'SMS', direction: 'Outbound',
    sender: 'Nurse Torres', recipient: 'External Number',
    text: 'Patient John Smith SSN 423-55-8890 needs transfer to ICU. His potassium is 6.8 and he has a history of renal failure. Call his wife at 555-0142.',
    packHint: 'hipaa',
  },
  {
    id: 'clean-deidentified', label: '✓ CLEAN: De-identified Clinical', channel: 'Secure Messaging', direction: 'Outbound',
    sender: 'Dr. Rivera', recipient: 'Care Team',
    text: 'Critical lab result for patient in 4N-302. K+ 6.8 mEq/L. Recommend stat repeat BMP and continuous cardiac monitoring. Nephrology consult placed.',
    packHint: 'hipaa',
  },
];
