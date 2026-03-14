-- =============================================================================
-- Voxten Compliance — Regulatory Seed Data
-- Covers: HIPAA, HITECH, Joint Commission, 42 CFR Part 2,
--         21st Century Cures Act, CMS Conditions of Participation
-- Idempotent: safe to run multiple times (MERGE / IF NOT EXISTS guards)
-- =============================================================================
-- Enum reference (stored as int):
--   EvalType:      0=Deterministic  1=Ai  2=Hybrid
--   Severity:      1=Critical  2=High  3=Medium  4=Low
--   RuleStatus:    0=Draft  1=Active  2=Deprecated
--   RuleCategory:  0=PhiDataPrivacy  1=ConsentAuthorization  2=IntegrityAudit
--                  3=ClinicalCommunication  4=RetentionAccess  5=MarketingPhiSale
--                  6=PatientRights  7=SecurityBaGovernance
--   ActionType (in JSON strings):
--      Block | Redact | QuarantineForReview | Alert | Log |
--      RequireAttestation | NotifyPrivacyOfficer
-- =============================================================================

BEGIN TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PATTERN LIBRARIES
-- ─────────────────────────────────────────────────────────────────────────────

MERGE PatternLibraries AS tgt
USING (VALUES
  (
    N'HIPAA-PHI-v1',
    N'HIPAA PHI Core Patterns v1',
    N'Detects the 18 HIPAA Safe Harbor PHI identifiers commonly found in clinical communications: SSN, MRN, phone, DOB, insurance ID, email address.',
    N'[
      {"regex":"(?<!\d)\d{3}(?:[\-\s]?\d{2}[\-\s]?\d{4})(?!\d)", "entityType":"SSN",        "description":"Social Security Number (formatted or 9 digits)",          "confidence":0.97},
      {"regex":"\bMRN[\-:\s#]*\d{4,10}\b",                                  "entityType":"MRN",        "description":"Medical Record Number",                                    "confidence":0.95, "flags":"i"},
      {"regex":"\b(?:patient|pt)[\s\-#:]*(?:ID|number)[\s:]*\d{4,10}\b", "entityType":"PatientID",  "description":"Patient ID (labelled)",                                    "confidence":0.90, "flags":"i"},
      {"regex":"\b(?:DOB|date of birth|born)[:\s]+\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b", "entityType":"DOB", "description":"Date of Birth",                             "confidence":0.93, "flags":"i"},
      {"regex":"(?<!\d)(?:\+?1[\s.\-]?)?(?:\(\d{3}\)|\d{3})[\s.\-]?\d{3}[\s.\-]?\d{4}(?!\d)", "entityType":"PhoneNumber", "description":"US Phone Number",           "confidence":0.85},
      {"regex":"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",     "entityType":"Email",      "description":"Email Address",                                            "confidence":0.88},
      {"regex":"\b(?:member\s*(?:ID|#)|policy\s*(?:number|#)|ins(?:urance)?\s*ID)[:\s]*[A-Z0-9][A-Z0-9\-]{5,19}\b", "entityType":"InsuranceID", "description":"Health Insurance Member / Policy ID", "confidence":0.88, "flags":"i"},
      {"regex":"\b(?:NPI)[:\s]*\d{10}\b",                                       "entityType":"NPI",        "description":"National Provider Identifier",                             "confidence":0.96, "flags":"i"},
      {"regex":"\b(?:DEA)[:\s#]*[A-Z]{2}\d{7}\b",                               "entityType":"DEA",        "description":"DEA Registration Number",                                  "confidence":0.96, "flags":"i"}
    ]',
    GETUTCDATE()
  ),
  (
    N'HIPAA-PHI-BULK-v1',
    N'HIPAA PHI Bulk / Multi-Patient Patterns v1',
    N'Detects messages containing multiple distinct SSNs or MRNs, indicating bulk PHI — a high-risk breach vector.',
    N'[
      {"regex":"(?:(?:(?<!\d)\d{3}(?:[\-\s]?\d{2}[\-\s]?\d{4})(?!\d)).*?){2,}", "entityType":"BulkSSN",   "description":"Two or more SSN patterns in a single message",             "confidence":0.98},
      {"regex":"(?:(?:\bMRN[\-:\s#]*\d{4,10}\b).*?){2,}",                    "entityType":"BulkMRN",   "description":"Two or more MRN references in a single message",           "confidence":0.95, "flags":"i"}
    ]',
    GETUTCDATE()
  ),
  (
    N'CFR2-SUD-v1',
    N'42 CFR Part 2 — Substance Use Disorder Terminology v1',
    N'Detects substance use disorder terminology requiring consent verification under 42 CFR Part 2, stricter than HIPAA.',
    N'[
      {"regex":"\b(?:alcohol use disorder|AUD|substance use disorder|SUD|opioid use disorder|OUD)\b", "entityType":"SUDDiagnosis",  "description":"SUD diagnosis terminology",                  "confidence":0.94, "flags":"i"},
      {"regex":"\b(?:MAT|medication.assisted treatment|methadone|suboxone|buprenorphine|naltrexone|vivitrol|sublocade)\b", "entityType":"SUDMedication", "description":"SUD treatment medication", "confidence":0.92, "flags":"i"},
      {"regex":"\b(?:detox(?:ification)?|withdrawal|rehab(?:ilitation)?|recovery program|12[\s-]?step)\b", "entityType":"SUDTreatment", "description":"SUD treatment context",           "confidence":0.82, "flags":"i"}
    ]',
    GETUTCDATE()
  ),
  (
    N'CLINICAL-CRIT-v1',
    N'Critical Clinical Values & Safety Patterns v1',
    N'Detects critical lab values and patient safety terminology requiring timely communication per Joint Commission standards.',
    N'[
      {"regex":"\b(?:critical|panic|alert value|life.threatening)\s+(?:result|value|lab|finding)\b",  "entityType":"CriticalResult",  "description":"Critical result language",    "confidence":0.91, "flags":"i"},
      {"regex":"\b(?:K\+|potassium)\s*(?:of\s*|=\s*|:)?\s*[6-9]\d*(?:\.\d+)?(?:\s*(?:mEq|mmol)(?:/L)?)?\b",   "entityType":"HyperkalemiaLab", "description":"Critically high potassium",   "confidence":0.95, "flags":"i"},
      {"regex":"\b(?:troponin|trop)\s*(?:I|T)?\s*(?:of\s*|=\s*|:)?\s*(?:0\.(?:0[4-9]|\d{2,})|[1-9]\d*(?:\.\d+)?|elevated|positive|high)\b", "entityType":"TroponinElevated", "description":"Elevated troponin",       "confidence":0.89, "flags":"i"},
      {"regex":"\b(?:glucose|BG|blood sugar)\s*(?:of\s*|=\s*|:)?\s*(?:[4-9]\d{2,}|[1-9]\d{3,})\s*(?:mg/dL)?\b", "entityType":"HyperglycemiaCrit", "description":"Critically high glucose",  "confidence":0.88, "flags":"i"},
      {"regex":"\bSTAT\b|\bcode\s+(?:blue|red|stroke|STEMI)\b",               "entityType":"EmergencyKeyword", "description":"Emergency / STAT keyword",     "confidence":0.90, "flags":"i"}
    ]',
    GETUTCDATE()
  )
) AS src (Id, Name, Description, PatternsJson, CreatedAt)
ON tgt.Id = src.Id
WHEN NOT MATCHED THEN
  INSERT (Id, Name, Description, PatternsJson, CreatedAt)
  VALUES (src.Id, src.Name, src.Description, src.PatternsJson, src.CreatedAt)
WHEN MATCHED THEN
  UPDATE SET
    tgt.Name = src.Name,
    tgt.Description = src.Description,
    tgt.PatternsJson = src.PatternsJson,
    tgt.UpdatedAt = GETUTCDATE();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RULE PACKS
-- ─────────────────────────────────────────────────────────────────────────────

MERGE RulePacks AS tgt
USING (VALUES
  ( N'hipaa',
    N'HIPAA Privacy & Security Rule',
    N'Health Insurance Portability and Accountability Act. Governs all PHI in electronic, oral, and written communications. 45 CFR §§ 160 and 164. Retention: 6 years from creation or last effective date.',
    N'Healthcare', 1, 2190 ),

  ( N'hitech',
    N'HITECH Act',
    N'Health Information Technology for Economic and Clinical Health Act. Strengthens HIPAA enforcement, introduces mandatory breach notification, and extends obligations to Business Associates. Retention: 6 years.',
    N'Healthcare', 1, 2190 ),

  ( N'joint-commission',
    N'Joint Commission National Patient Safety Goals',
    N'NPSG 2026 requirements covering patient identification, effective communication, medication safety, and critical test result reporting. Applies to accredited hospitals and ambulatory care.',
    N'Healthcare', 1, 365 ),

  ( N'cfr-part2',
    N'42 CFR Part 2 — Behavioral Health',
    N'Federal regulations governing the confidentiality of Substance Use Disorder patient records. Stricter than HIPAA — requires explicit written patient consent for most disclosures. Retention: 7 years.',
    N'Healthcare', 1, 2555 ),

  ( N'cures-act',
    N'21st Century Cures Act — Information Blocking',
    N'Prohibits information blocking of electronic health information (EHI). Mandates FHIR R4 / USCDI v3 access APIs and patient data portability. ONC Final Rule implementation.',
    N'Healthcare', 1, 365 ),

  ( N'cms-cop',
    N'CMS Conditions of Participation',
    N'Centers for Medicare & Medicaid Services conditions hospitals must meet to participate in Medicare and Medicaid programs. Covers discharge planning, patient rights notification, and care coordination communications.',
    N'Healthcare', 1, 365 )
) AS src (Id, Name, Description, Sector, IsActive, RetentionDays)
ON tgt.Id = src.Id
WHEN NOT MATCHED THEN
  INSERT (Id, Name, Description, Sector, IsActive, RetentionDays)
  VALUES (src.Id, src.Name, src.Description, src.Sector, src.IsActive, src.RetentionDays)
WHEN MATCHED THEN
  UPDATE SET
    tgt.Name          = src.Name,
    tgt.Description   = src.Description,
    tgt.IsActive      = src.IsActive,
    tgt.RetentionDays = src.RetentionDays;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RULES
-- Helper: insert only if LogicalId not already present with IsActive = 1
-- ─────────────────────────────────────────────────────────────────────────────

-- We use a temp staging table to drive idempotent inserts.
-- A rule is skipped entirely if an Active row with the same LogicalId already exists.

IF OBJECT_ID('tempdb..#SeedRules') IS NOT NULL DROP TABLE #SeedRules;

CREATE TABLE #SeedRules (
  LogicalId          NVARCHAR(50),
  Version            NVARCHAR(20),
  Name               NVARCHAR(300),
  Description        NVARCHAR(2000),
  Category           INT,       -- RuleCategory enum
  EvalType           INT,       -- EvalType enum
  DefaultSeverity    INT,       -- Severity enum
  PackId             NVARCHAR(50),
  ScopeJson          NVARCHAR(MAX),
  LogicJson          NVARCHAR(MAX),
  DefaultActionsJson NVARCHAR(MAX),
  ExemptionsJson     NVARCHAR(MAX)
);

-- ── HIPAA Rules ───────────────────────────────────────────────────────────────

INSERT INTO #SeedRules VALUES
( N'HIPAA-PHI-001', N'1.0.0',
  N'PHI Detection in Outbound Communications',
  N'Detects Protected Health Information (SSN, MRN, DOB, phone, insurance ID) in outbound clinical communications. Blocks transmission to prevent unauthorized disclosure per 45 CFR §164.502.',
  0,  -- PhiDataPrivacy
  0,  -- Deterministic
  1,  -- Critical
  N'hipaa',
  N'{"channels":["SecureChat","Sms","Email","Voice"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-v1","matchMode":"any"}',
  N'[{"actionType":"Block"},{"actionType":"NotifyPrivacyOfficer"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Treatment, Payment, or Operations disclosure to authorized care team member"}]'
),

( N'HIPAA-PHI-002', N'1.0.0',
  N'Bulk PHI — Multi-Patient Data Exfiltration Risk',
  N'Detects messages containing multiple patient identifiers (2+ SSNs or MRNs), indicating potential bulk PHI exfiltration. Common breach vector for insider threats and misaddressed emails. 45 CFR §164.402.',
  0,  -- PhiDataPrivacy
  0,  -- Deterministic
  1,  -- Critical
  N'hipaa',
  N'{"channels":["SecureChat","Sms","Email"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-BULK-v1","matchMode":"any"}',
  N'[{"actionType":"Block"},{"actionType":"NotifyPrivacyOfficer"}]',
  NULL
),

( N'HIPAA-PHI-003', N'1.0.0',
  N'PHI Redaction — Minimum Necessary Standard',
  N'Redacts incidental PHI from communications where the clinical purpose can be met without exposing identifiers. Enforces the minimum necessary standard per 45 CFR §164.502(b).',
  0,  -- PhiDataPrivacy
  2,  -- Hybrid
  2,  -- High
  N'hipaa',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-v1","matchMode":"any","confidenceFloor":0.90,"systemPrompt":"You are a HIPAA compliance officer. Evaluate whether this message contains PHI that exceeds the minimum necessary for its stated clinical purpose. If PHI is present but minimum necessary is violated, respond VIOLATION. If PHI is appropriate for the care context, respond COMPLIANT."}',
  N'[{"actionType":"Redact"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Authorized TPO context confirmed"}]'
),

( N'HIPAA-CONSENT-001', N'1.0.0',
  N'PHI Disclosure Without Patient Authorization',
  N'Detects PHI being shared for non-TPO purposes (marketing, research, sale) without verifiable patient authorization. Blocks disclosure and flags for Privacy Officer review. 45 CFR §164.508.',
  1,  -- ConsentAuthorization
  2,  -- Hybrid
  1,  -- Critical
  N'hipaa',
  N'{"channels":["SecureChat","Email","Sms"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-v1","matchMode":"any","systemPrompt":"Determine if this message discloses PHI for a purpose outside of Treatment, Payment, or Operations (TPO). Non-TPO purposes include: marketing, fundraising, research without consent, sale of PHI. Respond VIOLATION if non-TPO PHI disclosure is detected, COMPLIANT if it is clearly within TPO."}',
  N'[{"actionType":"Block"},{"actionType":"QuarantineForReview"}]',
  N'[{"type":"IndividualRequest","effect":"AllowWithLog","description":"Signed patient authorization on file"},{"type":"Research","effect":"RequireAttestation","description":"IRB-approved research with waiver"}]'
),

( N'HIPAA-BREACH-001', N'1.0.0',
  N'Breach Risk Assessment Trigger',
  N'Triggered when PHI exposure events occur that meet the probability-of-compromise threshold requiring breach notification assessment under the HITECH Breach Notification Rule, 45 CFR §§164.400–414.',
  2,  -- IntegrityAudit
  1,  -- Ai
  1,  -- Critical
  N'hipaa',
  N'{"channels":["SecureChat","Email","Sms","Voice"],"directions":["Outbound","Inbound"]}',
  N'{"systemPrompt":"Assess whether this communication event constitutes a reportable breach under HIPAA. A breach requires: (1) PHI was present, (2) disclosure was not permitted, (3) one of the four safe harbor exceptions does not apply (encryption, good faith, inadvertent). If all three are met, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.80}',
  N'[{"actionType":"Alert"},{"actionType":"NotifyPrivacyOfficer"}]',
  NULL
),

( N'HIPAA-ACCESS-001', N'1.0.0',
  N'PHI Access Outside Treating Relationship',
  N'Flags PHI access by staff with no documented treating relationship to the patient. Supports HIPAA minimum necessary and access control requirements. 45 CFR §164.312(a).',
  4,  -- RetentionAccess
  1,  -- Ai
  2,  -- High
  N'hipaa',
  N'{"channels":["SecureChat","Ehr"],"directions":["Inbound","Outbound"]}',
  N'{"systemPrompt":"Evaluate whether the sender has a plausible treating relationship with the patient referenced. Look for clinical role indicators and patient-specific context. If the message appears to be PHI access without clinical justification, respond VIOLATION. If there is a clear care context, respond COMPLIANT.","confidenceFloor":0.78}',
  N'[{"actionType":"QuarantineForReview"},{"actionType":"NotifyPrivacyOfficer"}]',
  N'[{"type":"Emergency","effect":"AllowWithLog","description":"Break-the-glass emergency access"}]'
);

-- ── HITECH Rules ──────────────────────────────────────────────────────────────

INSERT INTO #SeedRules VALUES
( N'HITECH-BREACH-001', N'1.0.0',
  N'HITECH Breach Notification Assessment',
  N'Assesses unsecured PHI exposure events to determine whether a breach notification is required within 60 days to affected individuals, HHS, and (for 500+ records) media outlets. 45 CFR §§164.404–414.',
  2,  -- IntegrityAudit
  1,  -- Ai
  1,  -- Critical
  N'hitech',
  N'{"channels":["SecureChat","Email","Sms"],"directions":["Outbound","Inbound"]}',
  N'{"systemPrompt":"Evaluate this communication event for HITECH breach notification requirements. Criteria: PHI is unsecured (not encrypted per NIST standards), impermissible use or disclosure occurred, and none of the three exceptions apply (workforce member, inadvertent, good faith recipient). Respond VIOLATION if all criteria met, COMPLIANT if not.","confidenceFloor":0.82}',
  N'[{"actionType":"Alert"},{"actionType":"NotifyPrivacyOfficer"}]',
  NULL
),

( N'HITECH-BA-001', N'1.0.0',
  N'Business Associate PHI Transmission Governance',
  N'Monitors PHI transmitted to external parties to ensure a valid Business Associate Agreement (BAA) exists. HITECH extended HIPAA obligations directly to BAs and their subcontractors. 45 CFR §164.314.',
  7,  -- SecurityBaGovernance
  2,  -- Hybrid
  1,  -- Critical
  N'hitech',
  N'{"channels":["Email","SecureChat"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-v1","matchMode":"any","systemPrompt":"Determine if PHI is being transmitted to an external organization (non-covered entity domain). If PHI is detected and the recipient appears to be external, respond VIOLATION requiring BAA verification. If recipient is clearly within the covered entity, respond COMPLIANT.","confidenceFloor":0.80}',
  N'[{"actionType":"Block"},{"actionType":"QuarantineForReview"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Confirmed BAA in force with recipient organization"}]'
),

( N'HITECH-AUDIT-001', N'1.0.0',
  N'Audit Control — PHI Access Logging',
  N'Logs all communications involving PHI to maintain the accounting of disclosures required by 45 CFR §164.528. Ensures six-year audit trail for all PHI access events.',
  2,  -- IntegrityAudit
  0,  -- Deterministic
  4,  -- Low
  N'hitech',
  N'{"channels":["SecureChat","Email","Sms","Ehr","Voice"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-v1","matchMode":"any"}',
  N'[{"actionType":"Log"}]',
  NULL
);

-- ── Joint Commission Rules ─────────────────────────────────────────────────────

INSERT INTO #SeedRules VALUES
( N'JC-HANDOFF-001', N'1.0.0',
  N'Handoff Communication Completeness (NPSG 02.02.01)',
  N'Flags shift handoff and patient transfer communications that are missing required SBAR elements (Situation, Background, Assessment, Recommendation). Joint Commission NPSG 02.02.01 requires standardized hand-off communication with opportunity to ask and respond to questions.',
  3,  -- ClinicalCommunication
  1,  -- Ai
  2,  -- High
  N'joint-commission',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound","Inbound"]}',
  N'{"systemPrompt":"Evaluate whether this clinical handoff or transfer-of-care message contains the minimum required SBAR elements: (S) Situation — current patient condition, (B) Background — diagnosis and relevant history, (A) Assessment — clinical status, (R) Recommendation — pending tasks and follow-up. If two or more elements are missing, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.76}',
  N'[{"actionType":"Alert"}]',
  NULL
),

( N'JC-CRIT-001', N'1.0.0',
  N'Critical Test Result Reporting (NPSG 02.03.01)',
  N'Detects critical laboratory and diagnostic values in communications and verifies timely reporting to the responsible licensed caregiver. Joint Commission NPSG 02.03.01 requires a complete read-back process for verbal critical results.',
  3,  -- ClinicalCommunication
  0,  -- Deterministic
  1,  -- Critical
  N'joint-commission',
  N'{"channels":["SecureChat","Sms","Voice"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"CLINICAL-CRIT-v1","matchMode":"any"}',
  N'[{"actionType":"Alert"}]',
  N'[{"type":"Emergency","effect":"AllowWithLog","description":"Critical result already acknowledged by treating provider"}]'
),

( N'JC-PATIENTID-001', N'1.0.0',
  N'Two-Patient-Identifier Verification (NPSG 01.01.01)',
  N'Flags clinical communications referencing a patient by only one identifier. Joint Commission NPSG 01.01.01 requires at least two patient identifiers (name + DOB, name + MRN, etc.) to prevent wrong-patient errors.',
  3,  -- ClinicalCommunication
  1,  -- Ai
  3,  -- Medium
  N'joint-commission',
  N'{"channels":["SecureChat","Sms"],"directions":["Outbound"]}',
  N'{"systemPrompt":"Analyze this clinical message. If it references a specific patient, determine whether at least two distinct patient identifiers are present (acceptable pairs: full name + DOB, full name + MRN, full name + room number). If only one identifier is present, respond VIOLATION. If two or more are present, or if no specific patient is referenced, respond COMPLIANT.","confidenceFloor":0.74}',
  N'[{"actionType":"Alert"}]',
  NULL
),

( N'JC-MEDICATION-001', N'1.0.0',
  N'High-Alert Medication Communication (NPSG 03.06.01)',
  N'Monitors communications involving high-alert medications (anticoagulants, concentrated electrolytes, insulin, opioids, chemotherapy) to ensure required safety checks are documented. NPSG 03.06.01.',
  3,  -- ClinicalCommunication
  1,  -- Ai
  2,  -- High
  N'joint-commission',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound","Inbound"]}',
  N'{"systemPrompt":"This message involves a clinical medication order or discussion. Determine if a high-alert medication is referenced: anticoagulants (warfarin, heparin, enoxaparin), concentrated electrolytes (KCl, hypertonic saline), insulin, opioids (morphine, fentanyl, hydromorphone), or chemotherapy. If a high-alert medication is mentioned without documentation of a second clinician verification or weight-based dosing check, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.79}',
  N'[{"actionType":"Alert"}]',
  NULL
);

-- ── 42 CFR Part 2 Rules ───────────────────────────────────────────────────────

INSERT INTO #SeedRules VALUES
( N'CFR2-SUD-001', N'1.0.0',
  N'SUD Data Disclosure Without Explicit Consent',
  N'Blocks communication of Substance Use Disorder records without documented explicit patient consent. 42 CFR Part 2 imposes stricter controls than HIPAA — even TPO disclosures require patient consent for SUD records. Violations carry both civil and criminal penalties.',
  1,  -- ConsentAuthorization
  2,  -- Hybrid
  1,  -- Critical
  N'cfr-part2',
  N'{"channels":["SecureChat","Email","Sms","Voice"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"CFR2-SUD-v1","matchMode":"any","systemPrompt":"Evaluate whether this communication contains or implies disclosure of Substance Use Disorder (SUD) treatment information. Under 42 CFR Part 2, such information requires explicit written patient consent for virtually all disclosures. If SUD-related content is detected in an outbound communication, respond VIOLATION unless the context clearly establishes the recipient is the patient themselves. Otherwise COMPLIANT.","confidenceFloor":0.85}',
  N'[{"actionType":"Block"},{"actionType":"NotifyPrivacyOfficer"}]',
  N'[{"type":"Emergency","effect":"AllowWithLog","description":"Medical emergency threatening life — Part 2 §2.51 exception"},{"type":"IndividualRequest","effect":"AllowWithLog","description":"Patient-directed disclosure with signed consent form on file"}]'
),

( N'CFR2-SEGMENT-001', N'1.0.0',
  N'SUD Segmented Audit Trail Enforcement',
  N'Logs all communications involving SUD terminology to maintain the segmented audit trail required by 42 CFR Part 2. SUD access events must be stored separately from general medical record access logs.',
  2,  -- IntegrityAudit
  0,  -- Deterministic
  3,  -- Medium
  N'cfr-part2',
  N'{"channels":["SecureChat","Email","Sms","Ehr","Voice"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"CFR2-SUD-v1","matchMode":"any"}',
  N'[{"actionType":"Log"}]',
  NULL
),

( N'CFR2-REDISCLOSURE-001', N'1.0.0',
  N'Prohibition on SUD Re-disclosure',
  N'Flags forwarding or re-sharing of SUD records received under a Part 2 consent. Recipients of SUD records may not re-disclose to third parties without a new patient consent or court order. 42 CFR §2.32.',
  1,  -- ConsentAuthorization
  1,  -- Ai
  1,  -- Critical
  N'cfr-part2',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound"]}',
  N'{"systemPrompt":"Determine if this message appears to forward or re-share previously received behavioral health or substance use disorder information to a third party. Signs include: forwarded message threads, attached prior clinical notes with SUD content, or references to SUD records from another provider. If re-disclosure of SUD records is detected without clear patient consent context, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.82}',
  N'[{"actionType":"Block"},{"actionType":"QuarantineForReview"}]',
  NULL
);

-- ── 21st Century Cures Act Rules ─────────────────────────────────────────────

INSERT INTO #SeedRules VALUES
( N'CURES-BLOCK-001', N'1.0.0',
  N'Information Blocking Detection',
  N'Detects communication patterns that may constitute information blocking under the 21st Century Cures Act — including unreasonable delays, denials, or conditions on access to Electronic Health Information (EHI). ONC rule 45 CFR §171.',
  6,  -- PatientRights
  1,  -- Ai
  2,  -- High
  N'cures-act',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound","Inbound"]}',
  N'{"systemPrompt":"Evaluate whether this communication represents a practice that unreasonably restricts access to electronic health information. Information blocking indicators include: refusing or delaying patient data access requests beyond 15 business days, imposing excessive fees, claiming data is unavailable when it is accessible, or discouraging FHIR API access. If blocking practice is detected, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.76}',
  N'[{"actionType":"Alert"},{"actionType":"QuarantineForReview"}]',
  N'[{"type":"LegalHold","effect":"AllowWithLog","description":"ONC recognized exception: safety, security, privacy, or infeasibility"}]'
),

( N'CURES-PATIENT-001', N'1.0.0',
  N'Patient EHI Access Request Acknowledgment',
  N'Monitors for patient requests to access their Electronic Health Information and ensures timely acknowledgment. Failure to respond to EHI access requests within required timeframes constitutes information blocking under the Cures Act.',
  6,  -- PatientRights
  1,  -- Ai
  3,  -- Medium
  N'cures-act',
  N'{"channels":["SecureChat","Email"],"directions":["Inbound"]}',
  N'{"systemPrompt":"Determine if this message contains a patient request for access to their medical records, health information, or EHI (Electronic Health Information). If a request is detected, respond VIOLATION to trigger workflow tracking. If not a records request, respond COMPLIANT.","confidenceFloor":0.78}',
  N'[{"actionType":"Alert"}]',
  NULL
),

( N'CURES-USCDI-001', N'1.0.0',
  N'USCDI Data Element Completeness in Exports',
  N'Detects FHIR R4 export communications missing mandatory USCDI v3 data classes. Covered entities must provide access to all USCDI data elements without exclusion. 45 CFR §171.301.',
  4,  -- RetentionAccess
  0,  -- Deterministic
  3,  -- Medium
  N'cures-act',
  N'{"channels":["Email","SecureChat"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-PHI-v1","matchMode":"any"}',
  N'[{"actionType":"Log"}]',
  NULL
);

-- ── CMS Conditions of Participation Rules ─────────────────────────────────────

INSERT INTO #SeedRules VALUES
( N'CMS-DISCHARGE-001', N'1.0.0',
  N'Discharge Planning Communication Completeness',
  N'Flags discharge planning communications missing required elements per CMS CoP 42 CFR §482.43. Required elements: patient education, medication reconciliation, follow-up appointments, and referral documentation.',
  3,  -- ClinicalCommunication
  1,  -- Ai
  2,  -- High
  N'cms-cop',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound"]}',
  N'{"systemPrompt":"Evaluate whether this discharge planning or transition-of-care communication contains the four CMS-required elements: (1) patient/caregiver education on diagnosis and self-care, (2) medication reconciliation list, (3) follow-up appointment or primary care referral, (4) instructions for whom to contact with questions. If two or more required elements are absent, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.77}',
  N'[{"actionType":"Alert"}]',
  NULL
),

( N'CMS-RIGHTS-001', N'1.0.0',
  N'Patient Rights Notification',
  N'Monitors for patient admission and care transition communications to verify that patient rights have been communicated. CMS CoP 42 CFR §482.13 requires written notification of rights at admission.',
  6,  -- PatientRights
  1,  -- Ai
  3,  -- Medium
  N'cms-cop',
  N'{"channels":["SecureChat","Email"],"directions":["Outbound"]}',
  N'{"systemPrompt":"Determine if this is an admission communication, care transition, or transfer message. If so, evaluate whether patient rights notification is documented or referenced (right to receive care, right to refuse treatment, right to privacy, right to file grievances). If an admission/transfer message lacks rights notification reference, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.74}',
  N'[{"actionType":"Alert"}]',
  NULL
),

( N'CMS-RESTRAINT-001', N'1.0.0',
  N'Restraint and Seclusion Order Governance',
  N'Monitors clinical communications involving restraint or seclusion orders to ensure required physician order documentation and time-limited order compliance. CMS CoP 42 CFR §482.13(e).',
  3,  -- ClinicalCommunication
  1,  -- Ai
  2,  -- High
  N'cms-cop',
  N'{"channels":["SecureChat","Sms"],"directions":["Outbound","Inbound"]}',
  N'{"systemPrompt":"Determine if this clinical communication involves a restraint or seclusion order or intervention. If so, evaluate whether: (1) a physician or licensed practitioner order is referenced, (2) the order is time-limited (not PRN for behavioral restraints), (3) monitoring requirements are mentioned. If restraint/seclusion is referenced without proper order documentation, respond VIOLATION. Otherwise COMPLIANT.","confidenceFloor":0.80}',
  N'[{"actionType":"Alert"},{"actionType":"QuarantineForReview"}]',
  NULL
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INSERT RULES (skip any LogicalId already present as Active)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO Rules (
  Id, LogicalId, Version, Name, Description,
  Category, EvalType, DefaultSeverity, Status, IsActive,
  PackId, EffectiveDate,
  ScopeJson, LogicJson, DefaultActionsJson, ExemptionsJson,
  ChangelogJson
)
SELECT
  -- Use UuidCreateSequential equivalent: generate a deterministic-ish new GUID per row
  NEWID(),
  s.LogicalId,
  s.Version,
  s.Name,
  s.Description,
  s.Category,
  s.EvalType,
  s.DefaultSeverity,
  1,        -- RuleStatus.Active
  1,        -- IsActive = true
  s.PackId,
  GETUTCDATE(),
  s.ScopeJson,
  s.LogicJson,
  s.DefaultActionsJson,
  s.ExemptionsJson,
  N'[{"version":"1.0.0","date":"' + CONVERT(NVARCHAR(10), GETUTCDATE(), 23) + N'","summary":"Initial regulatory seed"}]'
FROM #SeedRules s
WHERE NOT EXISTS (
  SELECT 1 FROM Rules r
  WHERE r.LogicalId = s.LogicalId
    AND r.IsActive = 1
);

DROP TABLE #SeedRules;

COMMIT TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  rp.Id          AS PackId,
  rp.Name        AS Pack,
  COUNT(r.Id)    AS ActiveRules
FROM RulePacks rp
LEFT JOIN Rules r ON r.PackId = rp.Id AND r.IsActive = 1
GROUP BY rp.Id, rp.Name
ORDER BY rp.Id;

SELECT
  r.LogicalId,
  r.Name,
  r.PackId,
  CASE r.EvalType    WHEN 0 THEN 'Deterministic' WHEN 1 THEN 'AI' WHEN 2 THEN 'Hybrid' END AS EvalType,
  CASE r.DefaultSeverity WHEN 1 THEN 'Critical' WHEN 2 THEN 'High' WHEN 3 THEN 'Medium' WHEN 4 THEN 'Low' END AS Severity,
  r.Status,
  r.IsActive
FROM Rules r
ORDER BY r.PackId, r.LogicalId;
