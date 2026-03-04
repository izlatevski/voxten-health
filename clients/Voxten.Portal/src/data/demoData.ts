export const demoPatient = {
  id: '1',
  mrn: 'MRN-48392',
  firstName: 'Margaret',
  lastName: 'Chen',
  dob: '03/14/1951',
  age: 74,
  gender: 'F',
  allergies: ['Penicillin', 'Sulfa'],
  encounter: {
    type: 'Inpatient',
    department: 'Med/Surg Unit',
    location: 'Room 412B',
    status: 'active' as const,
    attending: 'Dr. James Park',
  },
  epicId: 'EP-48392',
  cernerId: 'CRN-22901',
};

export interface DemoMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
  priority: 'routine' | 'urgent' | 'stat';
  type: 'text' | 'system_alert' | 'ehr_event';
  tags?: string[];
}

export const demoMessages: DemoMessage[] = [
  {
    id: '1',
    sender: 'Sarah Walsh',
    role: 'Nurse',
    content: 'Patient oxygen saturation declining to 89%. Initiating clinical escalation per protocol.',
    timestamp: '09:14 AM',
    priority: 'urgent',
    type: 'text',
    tags: ['Vitals', 'Respiratory'],
  },
  {
    id: '2',
    sender: 'System',
    role: 'VOXTEN System',
    content: 'VOXTEN System Alert: Vitals threshold exceeded — SpO2 < 90%. Auto-alert to attending.',
    timestamp: '09:16 AM',
    priority: 'stat',
    type: 'system_alert',
  },
  {
    id: '3',
    sender: 'Pharmacy',
    role: 'Pharmacy',
    content: 'Medication dosage clarification required for Heparin order #RX-2291. Please confirm weight-based protocol.',
    timestamp: '09:22 AM',
    priority: 'urgent',
    type: 'text',
    tags: ['Pharmacy', 'Medication Safety'],
  },
  {
    id: '4',
    sender: 'Dr. James Park',
    role: 'Attending Physician',
    content: 'Reviewing vitals. Initiating secure video consultation with bedside nurse. Adjusting O2 delivery.',
    timestamp: '09:28 AM',
    priority: 'stat',
    type: 'text',
    tags: ['Critical Care', 'Physician Response'],
  },
  {
    id: '5',
    sender: 'System',
    role: 'VOXTEN System',
    content: 'VOXTEN Secure Recording Active — Video consultation initiated — Dr. Park ↔ Nurse Walsh. Session encrypted and logged.',
    timestamp: '09:31 AM',
    priority: 'routine',
    type: 'system_alert',
  },
];

export const demoConversations = [
  {
    id: '1',
    name: 'Margaret Chen — Care Escalation',
    lastMessage: 'Secure video consultation initiated...',
    timestamp: '09:31 AM',
    unread: 2,
    priority: 'stat' as const,
    mrn: 'MRN-48392',
    isEscalated: true,
  },
  {
    id: '2',
    name: 'Lab Results — Room 305A',
    lastMessage: 'CBC results are within normal range...',
    timestamp: '08:45 AM',
    unread: 0,
    priority: 'routine' as const,
    mrn: 'MRN-51023',
    isEscalated: false,
  },
  {
    id: '3',
    name: 'Discharge Planning — J. Rivera',
    lastMessage: 'PT clearance received. Pending pharmacy...',
    timestamp: '08:12 AM',
    unread: 1,
    priority: 'urgent' as const,
    mrn: 'MRN-33104',
    isEscalated: false,
  },
  {
    id: '4',
    name: 'Nursing Shift Handoff — Unit 4B',
    lastMessage: 'All patients stable. Room 412B flagged...',
    timestamp: 'Yesterday',
    unread: 0,
    priority: 'routine' as const,
    isEscalated: false,
  },
];

export const demoEscalations = [
  {
    id: '1',
    patient: 'Margaret Chen',
    mrn: 'MRN-48392',
    trigger: 'SpO2 < 90% — Vitals threshold exceeded',
    responseTime: '14 min',
    status: 'acknowledged' as const,
    severity: 'critical' as const,
  },
  {
    id: '2',
    patient: 'Robert Liu',
    mrn: 'MRN-20184',
    trigger: 'Fall risk protocol — Patient attempted unassisted ambulation',
    responseTime: '8 min',
    status: 'resolved' as const,
    severity: 'urgent' as const,
  },
  {
    id: '3',
    patient: 'Sandra Williams',
    mrn: 'MRN-67291',
    trigger: 'Medication interaction alert — Warfarin + new NSAID order',
    responseTime: '22 min',
    status: 'active' as const,
    severity: 'critical' as const,
  },
];

export const roleLabels: Record<string, string> = {
  nurse: 'Nurse',
  physician: 'Attending Physician',
  compliance_officer: 'Compliance Officer',
  it_security: 'IT Security',
  admin: 'Administrator',
};
