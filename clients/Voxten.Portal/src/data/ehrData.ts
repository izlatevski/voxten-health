// Mock FHIR R4 resources for the EHR integration simulation layer

export const fhirPatientResource = {
  resourceType: 'Patient',
  id: 'epic-pat-38291',
  meta: {
    versionId: '3',
    lastUpdated: '2026-02-22T14:30:00Z',
  },
  identifier: [
    { system: 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384.14', value: 'MRN-0038291' },
    { system: 'http://hl7.org/fhir/sid/us-ssn', value: '***-**-4291' },
  ],
  name: [{ use: 'official', family: 'Martinez', given: ['Robert', 'A'] }],
  gender: 'male',
  birthDate: '1958-03-14',
  address: [{ city: 'Long Beach', state: 'CA', postalCode: '90802' }],
  communication: [{ language: { coding: [{ system: 'urn:ietf:bcp:47', code: 'en' }], text: 'English' }, preferred: true }],
};

export const fhirEncounterResource = {
  resourceType: 'Encounter',
  id: 'enc-77402',
  meta: { lastUpdated: '2026-02-22T14:30:00Z' },
  status: 'in-progress',
  class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
  type: [{ coding: [{ system: 'http://snomed.info/sct', code: '32485007', display: 'Hospital admission' }] }],
  subject: { reference: 'Patient/epic-pat-38291' },
  participant: [{ individual: { reference: 'Practitioner/pract-1042', display: 'Dr. Sarah Chen' } }],
  period: { start: '2026-02-19T08:30:00Z' },
  location: [{ location: { display: '4-North, Room 412, Bed A' }, status: 'active' }],
  serviceProvider: { display: 'St. Mary Medical Center — CommonSpirit Health' },
};

export interface FhirObservation {
  resourceType: string;
  id: string;
  meta: { lastUpdated: string };
  status: string;
  code: { coding: { system: string; code: string; display: string }[]; text: string };
  subject: { reference: string };
  effectiveDateTime: string;
  valueQuantity: { value: number; unit: string; system: string; code: string };
  referenceRange: { low?: { value: number; unit: string }; high?: { value: number; unit: string }; text: string }[];
  flag: 'critical' | 'high' | 'low' | 'normal';
}

export const fhirObservations: FhirObservation[] = [
  {
    resourceType: 'Observation',
    id: 'obs-k-001',
    meta: { lastUpdated: '2026-02-22T12:15:00Z' },
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '6298-4', display: 'Potassium [Moles/volume] in Blood' }], text: 'Potassium' },
    subject: { reference: 'Patient/epic-pat-38291' },
    effectiveDateTime: '2026-02-22T12:00:00Z',
    valueQuantity: { value: 6.8, unit: 'mEq/L', system: 'http://unitsofmeasure.org', code: 'meq/L' },
    referenceRange: [{ low: { value: 3.5, unit: 'mEq/L' }, high: { value: 5.0, unit: 'mEq/L' }, text: '3.5-5.0 mEq/L' }],
    flag: 'critical',
  },
  {
    resourceType: 'Observation',
    id: 'obs-cr-002',
    meta: { lastUpdated: '2026-02-22T12:15:00Z' },
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '2160-0', display: 'Creatinine [Mass/volume] in Serum' }], text: 'Creatinine' },
    subject: { reference: 'Patient/epic-pat-38291' },
    effectiveDateTime: '2026-02-22T12:00:00Z',
    valueQuantity: { value: 2.1, unit: 'mg/dL', system: 'http://unitsofmeasure.org', code: 'mg/dL' },
    referenceRange: [{ low: { value: 0.7, unit: 'mg/dL' }, high: { value: 1.3, unit: 'mg/dL' }, text: '0.7-1.3 mg/dL' }],
    flag: 'high',
  },
  {
    resourceType: 'Observation',
    id: 'obs-bnp-003',
    meta: { lastUpdated: '2026-02-22T11:45:00Z' },
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '30934-4', display: 'BNP [Mass/volume] in Serum' }], text: 'BNP' },
    subject: { reference: 'Patient/epic-pat-38291' },
    effectiveDateTime: '2026-02-22T11:30:00Z',
    valueQuantity: { value: 1247, unit: 'pg/mL', system: 'http://unitsofmeasure.org', code: 'pg/mL' },
    referenceRange: [{ high: { value: 100, unit: 'pg/mL' }, text: '<100 pg/mL' }],
    flag: 'high',
  },
  {
    resourceType: 'Observation',
    id: 'obs-hgb-004',
    meta: { lastUpdated: '2026-02-22T12:15:00Z' },
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' }], text: 'Hemoglobin' },
    subject: { reference: 'Patient/epic-pat-38291' },
    effectiveDateTime: '2026-02-22T12:00:00Z',
    valueQuantity: { value: 10.2, unit: 'g/dL', system: 'http://unitsofmeasure.org', code: 'g/dL' },
    referenceRange: [{ low: { value: 13.5, unit: 'g/dL' }, high: { value: 17.5, unit: 'g/dL' }, text: '13.5-17.5 g/dL' }],
    flag: 'low',
  },
  {
    resourceType: 'Observation',
    id: 'obs-na-005',
    meta: { lastUpdated: '2026-02-22T12:15:00Z' },
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '2951-2', display: 'Sodium [Moles/volume] in Serum' }], text: 'Sodium' },
    subject: { reference: 'Patient/epic-pat-38291' },
    effectiveDateTime: '2026-02-22T12:00:00Z',
    valueQuantity: { value: 138, unit: 'mEq/L', system: 'http://unitsofmeasure.org', code: 'mEq/L' },
    referenceRange: [{ low: { value: 136, unit: 'mEq/L' }, high: { value: 145, unit: 'mEq/L' }, text: '136-145 mEq/L' }],
    flag: 'normal',
  },
];

export const fhirDocumentReferences = [
  {
    resourceType: 'DocumentReference',
    id: 'doc-cardiology-001',
    meta: { lastUpdated: '2026-02-20T16:00:00Z' },
    status: 'current',
    type: { coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consult note' }], text: 'Cardiology Consult Note' },
    date: '2026-02-20T15:30:00Z',
    description: 'Cardiology Consult Note - 02/20/2026',
    content: [{ attachment: { contentType: 'application/pdf', url: '/documents/cardiology-consult-022026.pdf', title: 'Cardiology Consult Note' } }],
  },
  {
    resourceType: 'DocumentReference',
    id: 'doc-discharge-002',
    meta: { lastUpdated: '2026-02-22T10:00:00Z' },
    status: 'preliminary',
    type: { coding: [{ system: 'http://loinc.org', code: '18842-5', display: 'Discharge summary' }], text: 'Discharge Summary' },
    date: '2026-02-22T09:45:00Z',
    description: 'Discharge Summary Draft - 02/22/2026',
    content: [{ attachment: { contentType: 'application/pdf', url: '/documents/discharge-summary-draft.pdf', title: 'Discharge Summary Draft' } }],
  },
];

export const cdsHookCards = [
  {
    id: 'cds-patient-view',
    hook: 'patient-view',
    indicator: 'warning' as const,
    summary: '3 unread messages about this patient',
    detail: 'Last critical alert: K+ 6.8 mEq/L (2 hours ago, unacknowledged)',
    source: { label: 'VOXTEN CDS Service', icon: 'shield' },
    links: [{ label: 'Open VOXTEN Thread', url: '/messages' }],
  },
  {
    id: 'cds-order-sign',
    hook: 'order-sign',
    indicator: 'critical' as const,
    summary: 'Communication Advisory: Critical lab result K+ 6.8 pending',
    detail: 'Consider notifying nephrology before ordering potassium replacement.',
    source: { label: 'VOXTEN CDS Service', icon: 'shield' },
    suggestions: [{ label: 'Send VOXTEN Alert to Nephrology' }],
  },
  {
    id: 'cds-encounter-discharge',
    hook: 'encounter-discharge',
    indicator: 'info' as const,
    summary: 'Discharge Communication Checklist',
    detail: '',
    source: { label: 'VOXTEN CDS Service', icon: 'shield' },
    checklist: [
      { label: 'PCP notified via VOXTEN (Dr. Patel)', done: false },
      { label: 'Pharmacy contacted for med reconciliation', done: true },
      { label: 'Home health referral sent', done: false },
    ],
    actions: [{ label: 'Send All Pending Notifications' }],
  },
];
