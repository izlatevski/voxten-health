-- =============================================================================
-- Voxten Compliance — HIPAA Messaging Baseline
-- Purpose:
--   Seed a messaging-focused baseline using the engine's existing primitives:
--   RulePacks, PatternLibraries, and Rules.
--
-- Notes:
--   - This is intentionally narrower than the broad regulatory seed.
--   - Several rules use custom deterministic validators in LogicJson
--     (for example "validator":"AuditContinuity"). Those fit the data model,
--     even if the current runtime does not yet execute them.
--   - Where a rule is informed by more than one regulation, the PackId reflects
--     the primary framework and the secondary citations remain in Description.
-- =============================================================================

BEGIN TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM Rules
WHERE LogicalId IN (
  N'PHI-001',
  N'PHI-001-OUT',
  N'PHI-001-INT',
  N'PHI-002',
  N'PHI-002-OUT',
  N'PHI-002-INT',
  N'CON-002',
  N'INT-003',
  N'CLI-002',
  N'CLI-003',
  N'RET-002',
  N'RGT-002',
  N'SEC-001',
  N'PIA-001',
  N'BUS-001'
);

DELETE FROM PatternLibraries
WHERE Id IN (
  N'HIPAA-COMMS-PHI-v1',
  N'HIPAA-COMMS-PHI-BULK-v1',
  N'HIPAA-COMMS-PRESCRIBING-v1',
  N'HIPAA-INDIVIDUAL-DIRECTION-v1'
);

DELETE FROM RulePacks
WHERE Id IN (
  N'hipaa-msg-baseline',
  N'hitech-msg-baseline'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RULE PACKS
-- ─────────────────────────────────────────────────────────────────────────────

MERGE RulePacks AS tgt
USING (VALUES
  (
    N'hipaa-msg-baseline',
    N'HIPAA Messaging Baseline',
    N'Messaging-focused HIPAA controls for PHI detection, disclosure governance, secure transmission, retention, and patient privacy operations.',
    N'Healthcare',
    1,
    2190
  ),
  (
    N'hitech-msg-baseline',
    N'HITECH Messaging Baseline',
    N'Messaging-focused HITECH controls for audit continuity, disclosure accounting support, and business associate governance.',
    N'Healthcare',
    1,
    2190
  )
) AS src (Id, Name, Description, Sector, IsActive, RetentionDays)
ON tgt.Id = src.Id
WHEN NOT MATCHED THEN
  INSERT (Id, Name, Description, Sector, IsActive, RetentionDays)
  VALUES (src.Id, src.Name, src.Description, src.Sector, src.IsActive, src.RetentionDays)
WHEN MATCHED THEN
  UPDATE SET
    tgt.Name = src.Name,
    tgt.Description = src.Description,
    tgt.Sector = src.Sector,
    tgt.IsActive = src.IsActive,
    tgt.RetentionDays = src.RetentionDays;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PATTERN LIBRARIES
-- ─────────────────────────────────────────────────────────────────────────────

MERGE PatternLibraries AS tgt
USING (VALUES
  (
    N'HIPAA-COMMS-PHI-v1',
    N'HIPAA Messaging PHI Patterns v1',
    N'Detects common PHI and patient-linked identifiers typically found in clinical messaging payloads.',
    N'[
      {"regex":"\\b\\d{3}[\\-\\s]\\d{2}[\\-\\s]\\d{4}\\b", "entityType":"SSN", "description":"Social Security Number", "confidence":0.97},
      {"regex":"\\bMRN[\\-:\\s#]*\\d{4,12}\\b", "entityType":"MRN", "description":"Medical record number", "confidence":0.95, "flags":"i"},
      {"regex":"\\b(?:DOB|date of birth|born)[:\\s]+\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}\\b", "entityType":"DOB", "description":"Date of birth", "confidence":0.93, "flags":"i"},
      {"regex":"\\b(?:patient|pt)[\\s\\-#:]*(?:ID|number)[\\s:]*\\d{4,12}\\b", "entityType":"PatientID", "description":"Labelled patient identifier", "confidence":0.91, "flags":"i"},
      {"regex":"\\b(?:member\\s*(?:ID|#)|policy\\s*(?:number|#)|ins(?:urance)?\\s*ID)[:\\s]*[A-Z0-9]{6,15}\\b", "entityType":"InsuranceID", "description":"Insurance member or policy id", "confidence":0.89, "flags":"i"},
      {"regex":"\\b(?:\\+?1[\\s.\\-]?)?\\(?\\d{3}\\)?[\\s.\\-]\\d{3}[\\s.\\-]\\d{4}\\b", "entityType":"PhoneNumber", "description":"US phone number", "confidence":0.85},
      {"regex":"\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}\\b", "entityType":"Email", "description":"Email address", "confidence":0.88},
      {"regex":"\\broom[\\s#:-]*\\d{1,4}[A-Z]?\\b", "entityType":"RoomNumber", "description":"Patient room reference", "confidence":0.78, "flags":"i"}
    ]',
    GETUTCDATE()
  ),
  (
    N'HIPAA-COMMS-PHI-BULK-v1',
    N'HIPAA Messaging Bulk PHI Patterns v1',
    N'Detects likely multi-patient or bulk PHI disclosures in a single communication payload.',
    N'[
      {"regex":"(?:(?:\\b\\d{3}[\\-\\s]\\d{2}[\\-\\s]\\d{4}\\b).*?){2,}", "entityType":"BulkSSN", "description":"Two or more SSN patterns in one message", "confidence":0.98},
      {"regex":"(?:(?:\\bMRN[\\-:\\s#]*\\d{4,12}\\b).*?){2,}", "entityType":"BulkMRN", "description":"Two or more MRN patterns in one message", "confidence":0.96, "flags":"i"},
      {"regex":"(?:(?:\\b(?:patient|pt)[\\s\\-#:]*(?:ID|number)[\\s:]*\\d{4,12}\\b).*?){2,}", "entityType":"BulkPatientID", "description":"Two or more patient id references in one message", "confidence":0.93, "flags":"i"}
    ]',
    GETUTCDATE()
  ),
  (
    N'HIPAA-COMMS-PRESCRIBING-v1',
    N'Clinical Prescribing Communication Patterns v1',
    N'Detects prescribing and medication-order language used to pre-filter prescription-related communications.',
    N'[
      {"regex":"\\b(?:prescribe|prescribing|prescription|rx|script)\\b", "entityType":"PrescribingIntent", "description":"Prescribing intent language", "confidence":0.85, "flags":"i"},
      {"regex":"\\b(?:refill|renew(?:al)?|dispense|take\\s+\\d+\\s+(?:tab|tabs|tablet|capsule|capsules))\\b", "entityType":"MedicationInstruction", "description":"Medication instruction language", "confidence":0.82, "flags":"i"},
      {"regex":"\\b(?:DEA|NPI)[:\\s#]*[A-Z0-9]{7,12}\\b", "entityType":"CredentialToken", "description":"Credential token in prescribing context", "confidence":0.88, "flags":"i"},
      {"regex":"\\b(?:controlled substance|schedule ii|schedule iii|opioid|benzodiazepine)\\b", "entityType":"ControlledSubstance", "description":"Controlled substance marker", "confidence":0.90, "flags":"i"}
    ]',
    GETUTCDATE()
  ),
  (
    N'HIPAA-INDIVIDUAL-DIRECTION-v1',
    N'Individual Request and Direction Patterns v1',
    N'Detects language indicating a communication was initiated or explicitly directed by the individual.',
    N'[
      {"regex":"\\b(?:patient|member|individual)\\s+(?:requested|asked|directed|authorized)\\b", "entityType":"IndividualDirection", "description":"Patient-directed disclosure phrase", "confidence":0.83, "flags":"i"},
      {"regex":"\\b(?:send|email|text|forward)\\s+(?:this|my|the)\\s+(?:to|over to)\\s+(?:me|my|them)\\b", "entityType":"DeliveryInstruction", "description":"Explicit delivery instruction", "confidence":0.78, "flags":"i"},
      {"regex":"\\bon\\s+(?:the\\s+)?patient''?s\\s+request\\b", "entityType":"PatientRequestPhrase", "description":"On the patient''s request", "confidence":0.88, "flags":"i"}
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
-- 3. RULES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE #SeedRules (
  LogicalId           NVARCHAR(50),
  Version             NVARCHAR(20),
  Name                NVARCHAR(300),
  Description         NVARCHAR(2000),
  Category            INT,
  EvalType            INT,
  DefaultSeverity     INT,
  PackId              NVARCHAR(50),
  ScopeJson           NVARCHAR(MAX),
  LogicJson           NVARCHAR(MAX),
  DefaultActionsJson  NVARCHAR(MAX),
  ExemptionsJson      NVARCHAR(MAX)
);

INSERT INTO #SeedRules VALUES
(
  N'PHI-001-OUT', N'1.0.0',
  N'PHI Pattern Detection in Outbound Message',
  N'Detects PHI in outbound clinical communications and redacts identifiers before transmission when the message can be safely minimized. Supports HIPAA minimum necessary and outbound disclosure safeguards under 45 CFR §164.502 and §164.530(c).',
  0,
  0,
  1,
  N'hipaa-msg-baseline',
  N'{"channels":["Email"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-COMMS-PHI-v1","matchMode":"any","confidenceFloor":0.85}',
  N'[{"actionType":"Redact"},{"actionType":"NotifyPrivacyOfficer"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Authorized treatment, payment, or operations disclosure where the included identifiers are appropriate"}]'
),
(
  N'PHI-001-INT', N'1.0.0',
  N'PHI Pattern Detection in Internal Communication',
  N'Detects PHI in internal communications and raises an alert rather than automatically redacting, preserving internal clinical context while still surfacing potential over-sharing. Supports HIPAA minimum necessary safeguards under 45 CFR §164.502(b).',
  0,
  0,
  2,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat"],"directions":["Internal"]}',
  N'{"patternLibraryId":"HIPAA-COMMS-PHI-v1","matchMode":"any","confidenceFloor":0.85}',
  N'[{"actionType":"Alert"},{"actionType":"Log"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Internal care-team communication with appropriate treatment, payment, or operations purpose"}]'
),
(
  N'PHI-002-OUT', N'1.0.0',
  N'Bulk PHI Detection in Outbound Message',
  N'Detects outbound messages containing multiple patient identifiers, suggesting bulk PHI exposure or multi-patient disclosure in a single communication. Supports HIPAA disclosure safeguards and breach risk detection under 45 CFR §164.402 and §164.530(c).',
  0,
  0,
  1,
  N'hipaa-msg-baseline',
  N'{"channels":["Email"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-COMMS-PHI-BULK-v1","matchMode":"any","confidenceFloor":0.90}',
  N'[{"actionType":"Block"},{"actionType":"NotifyPrivacyOfficer"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Approved operational disclosure where multi-patient content is explicitly authorized and necessary"}]'
),
(
  N'PHI-002-INT', N'1.0.0',
  N'Bulk PHI Detection in Internal Communication',
  N'Detects internal communications containing multiple patient identifiers, suggesting unnecessary multi-patient exposure inside the organization. Supports HIPAA minimum necessary safeguards under 45 CFR §164.502(b).',
  0,
  0,
  2,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat"],"directions":["Internal"]}',
  N'{"patternLibraryId":"HIPAA-COMMS-PHI-BULK-v1","matchMode":"any","confidenceFloor":0.90}',
  N'[{"actionType":"Alert"},{"actionType":"Log"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Approved internal workflow where multi-patient content is necessary and authorized"}]'
),
(
  N'CON-002', N'1.0.0',
  N'Consent Obtained Under User Controls or Direction',
  N'Assesses whether a disclosure occurred under the individual''s request, direction, or documented authorization context before release of PHI. Primary authority: HIPAA 45 CFR §164.508 and §164.510(b)(4).',
  1,
  1,
  1,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat","Sms","Email","Voice"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"HIPAA-INDIVIDUAL-DIRECTION-v1","matchMode":"any","confidenceFloor":0.80,"systemPrompt":"Determine whether this disclosure is being made under the individual''s own request, direction, or other valid consent or authorization context. If disclosure requires authorization and none is established, respond VIOLATION. Otherwise COMPLIANT."}',
  N'[{"actionType":"QuarantineForReview"},{"actionType":"RequireAttestation"}]',
  N'[{"type":"IndividualRequest","effect":"AllowWithLog","description":"The patient explicitly requested or directed the disclosure"}]'
),
(
  N'INT-003', N'1.0.0',
  N'Audit Trail Gap and Continuity Detection',
  N'Detects breaks in the communication audit chain so that governed messages always have a complete lifecycle record from creation through evaluation, action, and storage. Primary authority: HIPAA 45 CFR §164.312(b), §164.316(b); reinforced by HITECH §13401.',
  2,
  0,
  1,
  N'hitech-msg-baseline',
  N'{"channels":["SecureChat","Sms","Email","Voice","Ehr"],"directions":["Outbound","Inbound","Internal"]}',
  N'{"validator":"AuditContinuity","matchMode":"all","requiredEvents":["Created","Evaluated","Actioned","Stored"]}',
  N'[{"actionType":"Alert"},{"actionType":"Log"}]',
  NULL
),
(
  N'CLI-002', N'1.0.0',
  N'Unauthorized Prescribing Suggestion',
  N'Flags communications that appear to contain prescription instructions, refill directives, or medication-order advice without sufficient prescribing authority or compliant workflow context. Primary authority: HIPAA minimum necessary and clinical safety obligations; informed by FDA 21 CFR Part 11 controls.',
  3,
  1,
  2,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat","Email","Sms"],"directions":["Outbound","Inbound"]}',
  N'{"patternLibraryId":"HIPAA-COMMS-PRESCRIBING-v1","matchMode":"any","confidenceFloor":0.82,"systemPrompt":"Determine whether this communication contains a prescription, refill, medication-order suggestion, or medication instruction that requires licensed prescribing authority. If prescribing intent is present but the workflow or sender authority is not appropriate, respond VIOLATION. Otherwise COMPLIANT."}',
  N'[{"actionType":"QuarantineForReview"},{"actionType":"Alert"}]',
  NULL
),
(
  N'CLI-003', N'1.0.0',
  N'Unencrypted ePHI on Non-Secure Channel',
  N'Detects ePHI sent over channels that are classified as non-secure or missing required transport protections. Primary authority: HIPAA 45 CFR §164.312(e)(1) and HITECH §13401.',
  0,
  2,
  1,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat","Sms","Email","Voice"],"directions":["Outbound"]}',
  N'{"patternLibraryId":"HIPAA-COMMS-PHI-v1","matchMode":"any","confidenceFloor":0.85,"systemPrompt":"If PHI is present, determine whether the channel or transport context is non-secure for ePHI transmission. Treat consumer SMS, unencrypted email, or unknown transport posture as non-secure unless metadata states otherwise. Respond VIOLATION if PHI is present on a non-secure channel. Otherwise COMPLIANT."}',
  N'[{"actionType":"Block"},{"actionType":"RedirectToSecureChannel"}]',
  N'[{"type":"Emergency","effect":"AllowWithLog","description":"Documented emergency communication where secure transport was not reasonably available"}]'
),
(
  N'RET-002', N'1.0.0',
  N'Record Retention Period Violation',
  N'Flags message records, audit artifacts, or disclosure logs that are deleted, purged, or scheduled for expiration earlier than policy allows. Primary authority: HIPAA 45 CFR §164.316(b)(2)(i); informed by HITECH §13405 and applicable electronic record governance policies.',
  4,
  0,
  1,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat","Sms","Email","Voice","Ehr"],"directions":["Outbound","Inbound","Internal"]}',
  N'{"validator":"RetentionWindow","matchMode":"all"}',
  N'[{"actionType":"Alert"},{"actionType":"Log"}]',
  N'[{"type":"LegalHold","effect":"AllowWithLog","description":"Retention exception controlled by active legal hold policy"}]'
),
(
  N'RGT-002', N'1.0.0',
  N'Accounting of Disclosures Completeness and Accuracy',
  N'Checks whether required disclosures are represented in the disclosure ledger with complete metadata for later accounting and reporting. Primary authority: HIPAA 45 CFR §164.528 and HITECH §13405(c).',
  2,
  0,
  2,
  N'hitech-msg-baseline',
  N'{"channels":["SecureChat","Sms","Email","Voice","Ehr"],"directions":["Outbound"]}',
  N'{"validator":"DisclosureAccounting","matchMode":"all"}',
  N'[{"actionType":"Alert"},{"actionType":"Log"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Disclosure category excluded from accounting requirements under policy"}]'
),
(
  N'SEC-001', N'1.0.0',
  N'ePHI Transmission Integrity Controls',
  N'Validates that communication events carrying ePHI include integrity controls such as checksums, hashes, HMACs, or equivalent verification markers across send and receipt. Primary authority: HIPAA 45 CFR §164.312(c)(2) and §164.312(e)(2)(i).',
  2,
  0,
  2,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat","Sms","Email","Voice","Ehr"],"directions":["Outbound","Inbound"]}',
  N'{"validator":"TransmissionIntegrity","matchMode":"all"}',
  N'[{"actionType":"Alert"},{"actionType":"Log"}]',
  NULL
),
(
  N'PIA-001', N'1.0.0',
  N'Inactive Session ePHI Send',
  N'Flags or blocks ePHI sends initiated after session inactivity exceeded configured timeout thresholds, supporting workstation and session security controls. Primary authority: HIPAA 45 CFR §164.312(a)(2)(iii).',
  2,
  0,
  3,
  N'hipaa-msg-baseline',
  N'{"channels":["SecureChat","Email","Sms","Ehr"],"directions":["Outbound"]}',
  N'{"validator":"InactiveSessionSend","matchMode":"all"}',
  N'[{"actionType":"Block"},{"actionType":"NotifyRealTime"}]',
  NULL
),
(
  N'BUS-001', N'1.0.0',
  N'Business Associate Direct Liability',
  N'Detects routing of PHI through a vendor, tenant, or delegated processing path that lacks required business associate governance records. Primary authority: HITECH §13404 and HIPAA 45 CFR §164.308(b), §164.314(a).',
  7,
  0,
  1,
  N'hitech-msg-baseline',
  N'{"channels":["SecureChat","Email","Sms","Voice","Ehr"],"directions":["Outbound","Inbound","Internal"]}',
  N'{"validator":"BusinessAssociateGovernance","matchMode":"all"}',
  N'[{"actionType":"Block"},{"actionType":"NotifyPrivacyOfficer"}]',
  N'[{"type":"Tpo","effect":"AllowWithLog","description":"Verified customer-specific BAA or equivalent governance artifact exists"}]'
);

INSERT INTO Rules (
  Id, LogicalId, Version, Name, Description,
  Category, EvalType, DefaultSeverity, Status, IsActive,
  PackId, EffectiveDate,
  ScopeJson, LogicJson, DefaultActionsJson, ExemptionsJson,
  ChangelogJson
)
SELECT
  NEWID(),
  s.LogicalId,
  s.Version,
  s.Name,
  s.Description,
  s.Category,
  s.EvalType,
  s.DefaultSeverity,
  1,
  1,
  s.PackId,
  GETUTCDATE(),
  s.ScopeJson,
  s.LogicJson,
  s.DefaultActionsJson,
  s.ExemptionsJson,
  N'[{"version":"1.0.0","date":"' + CONVERT(NVARCHAR(10), GETUTCDATE(), 23) + N'","summary":"Initial HIPAA messaging baseline"}]'
FROM #SeedRules s
WHERE NOT EXISTS (
  SELECT 1
  FROM Rules r
  WHERE r.LogicalId = s.LogicalId
    AND r.IsActive = 1
);

DROP TABLE #SeedRules;

COMMIT TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

SELECT rp.Id, rp.Name, rp.RetentionDays
FROM RulePacks rp
WHERE rp.Id IN (N'hipaa-msg-baseline', N'hitech-msg-baseline')
ORDER BY rp.Id;

SELECT pl.Id, pl.Name
FROM PatternLibraries pl
WHERE pl.Id IN (
  N'HIPAA-COMMS-PHI-v1',
  N'HIPAA-COMMS-PHI-BULK-v1',
  N'HIPAA-COMMS-PRESCRIBING-v1',
  N'HIPAA-INDIVIDUAL-DIRECTION-v1'
)
ORDER BY pl.Id;

SELECT r.LogicalId, r.Name, r.PackId, r.EvalType, r.DefaultSeverity, r.IsActive
FROM Rules r
WHERE r.LogicalId IN (
  N'PHI-001-OUT', N'PHI-001-INT', N'PHI-002-OUT', N'PHI-002-INT', N'CON-002', N'INT-003', N'CLI-002', N'CLI-003',
  N'RET-002', N'RGT-002', N'SEC-001', N'PIA-001', N'BUS-001'
)
ORDER BY r.LogicalId;
