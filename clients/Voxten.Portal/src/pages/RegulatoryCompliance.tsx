import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, ShieldCheck, ChevronDown, ExternalLink, Clock } from 'lucide-react';

/* ── Types ── */
interface ComplianceItem {
  label: string;
  reference: string;
  lastVerified: string;
  method: string;
  evidence: string;
  score: string;
  detail: string;
}

interface ComplianceSection {
  title: string;
  items: ComplianceItem[];
}

const sections: ComplianceSection[] = [
  {
    title: 'HIPAA Security Rule',
    items: [
      { label: 'Access Control — RBAC + Row Level Security', reference: '§164.312(a)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Entra ID RBAC policy audit + RLS verification',
        evidence: '1,247 access control checks (30 days) — 0 failures', score: '100%',
        detail: 'Role-based access enforced via Microsoft Entra ID security groups mapped to VOXTEN roles. Row Level Security applied to all patient data queries.' },
      { label: 'Unique User ID — Individual accounts, NPI tracking', reference: '§164.312(a)(2)(i)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Entra ID directory sync verification',
        evidence: '749 unique user accounts — all individually identifiable', score: '100%',
        detail: 'Every user authenticated via unique Entra ID credential. NPI numbers linked for clinical staff. No shared or generic accounts permitted.' },
      { label: 'Emergency Access — Break-the-glass workflow', reference: '§164.312(a)(2)(ii)',
        lastVerified: 'Feb 22, 2026 — Manual attestation', method: 'Break-the-glass workflow test + audit review',
        evidence: '3 emergency access events (30 days) — all justified and reviewed', score: '100%',
        detail: 'Emergency access grants immediate PHI access with mandatory post-hoc justification. CCO reviews within 24 hours. Full audit trail captured.' },
      { label: 'Automatic Logoff — Configurable session timeout', reference: '§164.312(a)(2)(iii)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Session management policy verification',
        evidence: '847 session timeouts enforced (30 days)', score: '100%',
        detail: 'Clinical sessions timeout after 30 minutes of inactivity. Admin sessions timeout after 15 minutes. Configurable per role.' },
      { label: 'Encryption — AES-256 at rest, TLS 1.3 in transit', reference: '§164.312(a)(2)(iv) & (e)(1)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Azure Key Vault certificate check + TLS handshake verification',
        evidence: '842 encryption verifications (30 days) — 0 failures', score: '100%',
        detail: 'All data encrypted using Azure Storage Service Encryption (AES-256). TLS 1.3 enforced for all connections. Key Vault manages rotation.' },
      { label: 'Audit Controls — Immutable audit logging', reference: '§164.312(b)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'WORM storage integrity check + SHA-256 hash chain verification',
        evidence: '1,847,293 audit records — 0 modified, 0 deleted', score: '100%',
        detail: 'Every communication event logged immutably to Azure Blob Storage (WORM). SHA-256 hash chain ensures tamper evidence. 7-year retention enforced.' },
      { label: 'Integrity — Message hashing, tamper-evident records', reference: '§164.312(c)(1)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Hash chain integrity verification',
        evidence: '51,138 messages hashed (24h) — chain intact', score: '100%',
        detail: 'Every message receives a SHA-256 hash at creation. Hash chain links ensure any modification is detectable. Cosmos DB stores searchable index.' },
      { label: 'Authentication — MFA, credential verification', reference: '§164.312(d)',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Entra ID MFA enforcement policy check',
        evidence: '749/749 users MFA-enabled — 0 exceptions', score: '100%',
        detail: 'MFA required for all users via Microsoft Entra ID. Conditional access blocks non-compliant devices. PIM enforces just-in-time admin elevation.' },
    ],
  },
  {
    title: 'Joint Commission NPG Alignment (2026)',
    items: [
      { label: 'Staff communication of patient information', reference: 'NPG.01',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Policy engine rule evaluation',
        evidence: '34,291 clinical communications governed (30 days)', score: '100%',
        detail: 'All staff-to-staff patient communications flow through VOXTEN governance engine. PHI detected, classified, and logged per policy.' },
      { label: 'Patient identification', reference: 'NPG.02',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Two-identifier rule enforcement check',
        evidence: '12,847 patient-context messages verified', score: '100%',
        detail: 'VOXTEN enforces two-identifier matching (MRN + name) on all patient-context communications. FHIR R4 integration provides real-time EHR verification.' },
      { label: 'Handoff communication', reference: 'CMS CoP',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Handoff template compliance check',
        evidence: '891 handoff communications — 100% structured', score: '100%',
        detail: 'Clinical handoff communications use structured SBAR templates. AI assists with completeness checking. All handoffs logged with governance metadata.' },
      { label: 'Critical test result communication', reference: 'CMS CoP',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Critical result escalation workflow verification',
        evidence: '47 critical results escalated (30 days) — 100% within SLA', score: '100%',
        detail: 'Critical lab results trigger automated escalation workflows with countdown timers. Read-back confirmation required. Full chain-of-custody audit trail.' },
      { label: 'Culture of safety leadership metrics', reference: 'NPG Leadership',
        lastVerified: 'Feb 20, 2026 — Manual attestation', method: 'Governance dashboard review by CCO',
        evidence: 'Monthly leadership report generated — Feb 2026', score: '100%',
        detail: 'VOXTEN provides real-time dashboards for leadership visibility into communication compliance. Monthly reports auto-generated for board review.' },
    ],
  },
  {
    title: '42 CFR Part 2 (Substance Use Disorder)',
    items: [
      { label: 'Sensitivity flags for SUD records', reference: 'Part 2',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Sensitivity label sync from Microsoft Purview',
        evidence: '891 SUD-flagged communications (30 days)', score: '100%',
        detail: 'SUD-related communications automatically tagged with Purview sensitivity labels. Additional consent checks applied before any disclosure.' },
      { label: 'Consent-driven access controls', reference: 'Part 2',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Consent verification against FHIR Consent resources',
        evidence: '142 consent verifications (30 days) — 0 violations', score: '100%',
        detail: 'Patient consent status checked in real-time via FHIR Consent resources before SUD data is included in any communication.' },
      { label: 'Segmented audit trails', reference: 'Part 2',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'Audit trail segmentation verification',
        evidence: 'Segmented trails active for all Part 2 patients', score: '100%',
        detail: 'Part 2 audit trails are logically segmented from general audit logs. Access restricted to authorized compliance personnel only.' },
      { label: 'Redaction capability', reference: 'Part 2',
        lastVerified: 'Feb 23, 2026 — Automated', method: 'Redaction engine accuracy test',
        evidence: '24 redactions applied (30 days) — 100% accurate', score: '100%',
        detail: 'AI-powered redaction engine identifies and removes SUD-related content when consent is not present. Human review available for edge cases.' },
    ],
  },
  {
    title: '21st Century Cures Act',
    items: [
      { label: 'No information blocking — all records exportable', reference: 'Cures Act',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'FHIR export capability test',
        evidence: 'All communication records exportable via FHIR R4', score: '100%',
        detail: 'VOXTEN supports full data export via FHIR R4 APIs. No information blocking conditions met. Patient access requests fulfilled within 24 hours.' },
      { label: 'FHIR R4 integration capability', reference: 'HTI-1',
        lastVerified: 'Feb 24, 2026 — Automated', method: 'FHIR endpoint health check + conformance statement',
        evidence: 'FHIR R4 server operational — 15ms avg response', score: '100%',
        detail: 'Full FHIR R4 server with Patient, Encounter, Communication, and Consent resources. Connected to Epic FHIR sandbox for bidirectional data flow.' },
      { label: 'USCDI v3 alignment readiness', reference: 'ONC',
        lastVerified: 'Feb 20, 2026 — Manual attestation', method: 'USCDI data element mapping review',
        evidence: 'Mapping document reviewed — 94% coverage', score: '94%',
        detail: 'VOXTEN communication data mapped to USCDI v3 data elements. Clinical notes, patient demographics, and care team information fully aligned.' },
    ],
  },
];

const hitrustCategories = [
  { name: '01. Access Control', status: 'Implemented' },
  { name: '02. Human Resources Security', status: 'Implemented' },
  { name: '03. Risk Management', status: 'Implemented' },
  { name: '04. Security Policy', status: 'Implemented' },
  { name: '05. Organization of Info Security', status: 'Implemented' },
  { name: '06. Compliance', status: 'Implemented' },
  { name: '07. Asset Management', status: 'Implemented' },
  { name: '08. Physical & Environmental', status: 'Partial' },
  { name: '09. Communications & Operations', status: 'Implemented' },
  { name: '10. Info Systems Acquisition', status: 'Implemented' },
  { name: '11. Incident Management', status: 'Implemented' },
  { name: '12. Business Continuity', status: 'Partial' },
  { name: '13. Privacy Practices', status: 'Implemented' },
  { name: '14. Information Exchange', status: 'Implemented' },
];

export default function RegulatoryCompliance() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItem = (key: string) => setExpandedItem(expandedItem === key ? null : key);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Regulatory Posture</h1>
        <p className="text-sm text-muted-foreground mt-1">VOXTEN regulatory coverage across HIPAA, HITRUST, Joint Commission, 42 CFR Part 2, and 21st Century Cures Act</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1.5 text-[10px]">
          <ShieldCheck className="w-3 h-3" />
          VOXTEN Communication Controls Active
        </Badge>
      </div>

      {sections.map((section) => (
        <Card key={section.title} className="clinical-shadow border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">{section.title}</h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const key = `${section.title}-${item.label}`;
                const isOpen = expandedItem === key;
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleItem(key)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors hover:bg-muted/40',
                        isOpen && 'bg-primary/5'
                      )}
                    >
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-xs text-foreground flex-1">{item.label}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 h-4 font-mono bg-muted shrink-0">{item.reference}</Badge>
                      <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="ml-9 mr-3 mb-2 mt-1 p-3 rounded-lg bg-muted/30 border border-border space-y-2 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Last Verified:</span>
                            <span className="text-foreground font-medium">{item.lastVerified}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Score:</span>
                            <span className={cn('font-bold', item.score === '100%' ? 'text-success' : 'text-primary')}>{item.score}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Method: </span>
                          <span className="text-foreground">{item.method}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Evidence: </span>
                          <span className="text-foreground">{item.evidence}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{item.detail}</p>
                        <button className="text-primary text-[11px] font-medium hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> View audit log entries →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* HITRUST */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">HITRUST CSF v11 Readiness Tracker</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">12/14 Fully Implemented</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {hitrustCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 border border-border text-xs">
                <span className="text-foreground">{cat.name}</span>
                <Badge variant="outline" className={cn('text-[9px]',
                  cat.status === 'Implemented' ? 'bg-success/10 text-success border-success/20' : 'bg-urgent/10 text-urgent border-urgent/20'
                )}>{cat.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
