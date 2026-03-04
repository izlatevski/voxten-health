import { create } from 'zustand';

export type EHRConnectionStatus = 'connected' | 'degraded' | 'offline';

export interface EHRAlert {
  id: string;
  type: 'critical_lab' | 'adt_transfer' | 'med_admin' | 'part2_restriction';
  content: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  collapsed: boolean;
  priority: 'critical' | 'warning' | 'info' | 'restricted';
}

interface EHRState {
  // SMART on FHIR launch context
  launch: {
    iss: string;
    launchToken: string;
    scope: string;
    clientId: string;
  };

  // Patient context
  patient: {
    id: string;
    fhirId: string;
    mrn: string;
    name: { given: string; family: string };
    dob: string;
    age: number;
    gender: string;
    allergies: string[];
    primaryDx: string;
    codeStatus: string;
    isolation: string;
  };

  // Encounter
  encounter: {
    id: string;
    type: string;
    admitDate: string;
    location: string;
    facility: string;
    attendingMD: string;
    careTeam: string[];
  };

  // Practitioner
  practitioner: {
    id: string;
    name: string;
    role: string;
    npi: string;
    department: string;
    facility: string;
    epicUserId: string;
  };

  // Connection state
  connectionStatus: EHRConnectionStatus;
  lastSync: string;
  ehrVendor: string;
  ehrVersion: string;
  fhirEndpoint: string;

  // Demo controls
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  smartLaunchComplete: boolean;
  setSmartLaunchComplete: (v: boolean) => void;
  part2Active: boolean;
  togglePart2: () => void;

  // Alerts
  alerts: EHRAlert[];
  addAlert: (alert: EHRAlert) => void;
  acknowledgeAlert: (id: string) => void;
  collapseAlert: (id: string) => void;
  clearAlerts: () => void;

  // Connection
  setConnectionStatus: (s: EHRConnectionStatus) => void;
  updateLastSync: () => void;
  setEncounterLocation: (loc: string) => void;

  // Reset
  resetAll: () => void;
}

const initialPatient = {
  id: 'epic-pat-38291',
  fhirId: 'Patient/epic-pat-38291',
  mrn: 'MRN-0038291',
  name: { given: 'Robert', family: 'Martinez' },
  dob: '03/14/1958',
  age: 67,
  gender: 'M',
  allergies: ['Penicillin', 'Sulfa'],
  primaryDx: 'CHF - NYHA Class III',
  codeStatus: 'Full Code',
  isolation: 'Contact Precautions',
};

const initialEncounter = {
  id: 'enc-77402',
  type: 'Inpatient',
  admitDate: '2026-02-19T08:30:00Z',
  location: '4-North, Rm 412, Bed A',
  facility: 'Dignity Health - St. Mary Medical Center',
  attendingMD: 'Dr. Sarah Chen',
  careTeam: ['Dr. Sarah Chen (Attending)', 'M. Torres, RN (Primary)', 'J. Kim, PharmD', 'L. Nguyen, RT'],
};

const initialPractitioner = {
  id: 'pract-1042',
  name: 'Dr. James Rivera',
  role: 'Hospitalist',
  npi: '1234567890',
  department: 'Internal Medicine',
  facility: 'Dignity Health - St. Mary Medical Center',
  epicUserId: 'JRIVERA',
};

export const useEHRStore = create<EHRState>((set) => ({
  launch: {
    iss: 'https://epic-fhir.commonspirit.org/R4',
    launchToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
    scope: 'launch patient/*.read user/*.read openid fhirUser',
    clientId: 'voxten-clinical-messenger',
  },
  patient: initialPatient,
  encounter: initialEncounter,
  practitioner: initialPractitioner,
  connectionStatus: 'connected',
  lastSync: new Date().toISOString(),
  ehrVendor: 'Epic',
  ehrVersion: 'Epic 2024 (February 2026)',
  fhirEndpoint: 'https://epic-fhir.commonspirit.org/R4',

  demoMode: false,
  setDemoMode: (v) => set({ demoMode: v }),
  smartLaunchComplete: false,
  setSmartLaunchComplete: (v) => set({ smartLaunchComplete: v }),
  part2Active: false,
  togglePart2: () => set((s) => ({ part2Active: !s.part2Active })),

  alerts: [],
  addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
  acknowledgeAlert: (id) =>
    set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) })),
  collapseAlert: (id) =>
    set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, collapsed: true } : a)) })),
  clearAlerts: () => set({ alerts: [] }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  updateLastSync: () => set({ lastSync: new Date().toISOString() }),
  setEncounterLocation: (location) =>
    set((s) => ({ encounter: { ...s.encounter, location } })),

  resetAll: () =>
    set({
      connectionStatus: 'connected',
      lastSync: new Date().toISOString(),
      alerts: [],
      part2Active: false,
      smartLaunchComplete: false,
      patient: initialPatient,
      encounter: initialEncounter,
    }),
}));
