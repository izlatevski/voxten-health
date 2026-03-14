import { create } from 'zustand';

export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RuleAction = 'block' | 'flag' | 'redact' | 'log' | 'escalate';
export type AnalysisMethod = 'pattern' | 'ai' | 'both';
export type PolicyWorkspaceMode = 'rules' | 'patterns';
export type DetailPanelMode =
  | 'pack-overview'
  | 'rule-detail'
  | 'rule-create'
  | 'rule-edit'
  | 'pattern-library-overview'
  | 'pattern-library-detail'
  | 'pattern-library-create'
  | 'pattern-library-edit';

interface PolicyEngineState {
  workspaceMode: PolicyWorkspaceMode;
  selectedPackId: string | null;
  selectedRuleId: string | null;
  selectedPatternLibraryId: string | null;
  detailMode: DetailPanelMode;
  searchQuery: string;
  severityFilter: RuleSeverity | 'all';
  actionFilter: RuleAction | 'all';
  methodFilter: AnalysisMethod | 'all';
  channelFilter: string;
  packsCollapsed: boolean;
  setWorkspaceMode: (mode: PolicyWorkspaceMode) => void;
  setSelectedPack: (id: string | null) => void;
  setSelectedRule: (id: string | null) => void;
  setSelectedPatternLibrary: (id: string | null) => void;
  setDetailMode: (mode: DetailPanelMode) => void;
  setSearchQuery: (q: string) => void;
  setSeverityFilter: (f: RuleSeverity | 'all') => void;
  setActionFilter: (f: RuleAction | 'all') => void;
  setMethodFilter: (f: AnalysisMethod | 'all') => void;
  setChannelFilter: (f: string) => void;
  setPacksCollapsed: (v: boolean) => void;
}

export const usePolicyEngineStore = create<PolicyEngineState>((set) => ({
  workspaceMode: 'rules',
  selectedPackId: null,
  selectedRuleId: null,
  selectedPatternLibraryId: null,
  detailMode: 'pack-overview',
  searchQuery: '',
  severityFilter: 'all',
  actionFilter: 'all',
  methodFilter: 'all',
  channelFilter: 'all',
  packsCollapsed: false,
  setWorkspaceMode: (mode) => set((state) => ({
    workspaceMode: mode,
    detailMode: mode === 'rules'
      ? (state.selectedRuleId ? 'rule-detail' : 'pack-overview')
      : (state.selectedPatternLibraryId ? 'pattern-library-detail' : 'pattern-library-overview'),
  })),
  setSelectedPack: (id) => set({
    workspaceMode: 'rules',
    selectedPackId: id,
    selectedRuleId: null,
    detailMode: 'pack-overview',
  }),
  setSelectedRule: (id) => set({
    workspaceMode: 'rules',
    selectedRuleId: id,
    detailMode: id ? 'rule-detail' : 'pack-overview',
  }),
  setSelectedPatternLibrary: (id) => set({
    workspaceMode: 'patterns',
    selectedPatternLibraryId: id,
    detailMode: id ? 'pattern-library-detail' : 'pattern-library-overview',
  }),
  setDetailMode: (mode) => set({ detailMode: mode }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSeverityFilter: (f) => set({ severityFilter: f }),
  setActionFilter: (f) => set({ actionFilter: f }),
  setMethodFilter: (f) => set({ methodFilter: f }),
  setChannelFilter: (f) => set({ channelFilter: f }),
  setPacksCollapsed: (v) => set({ packsCollapsed: v }),
}));

export interface SampleTestMessage {
  title: string;
  text: string;
  channel: string;
  direction: string;
  sender: string;
  recipient: string;
}

export const sampleTestMessages: SampleTestMessage[] = [
  {
    title: 'PHI with MRN',
    text: 'The patient John Smith, MRN 38291, has a potassium of 6.8 and needs transfer to ICU.',
    channel: 'SMS',
    direction: 'Outbound',
    sender: 'Dr. Rivera',
    recipient: 'External Number',
  },
  {
    title: 'SSN disclosure',
    text: 'Please verify patient identity with SSN 123-45-6789 before releasing records.',
    channel: 'Secure Messaging',
    direction: 'Outbound',
    sender: 'Care Coordinator',
    recipient: 'Release of Information',
  },
  {
    title: 'Safe operational note',
    text: 'Room 4N-12 is ready for transport and the handoff checklist is complete.',
    channel: 'Secure Messaging',
    direction: 'Internal',
    sender: 'Charge Nurse',
    recipient: 'Transport Team',
  },
];
