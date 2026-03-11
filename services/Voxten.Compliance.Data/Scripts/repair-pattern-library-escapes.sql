-- =============================================================================
-- Repair over-escaped regex patterns in existing PatternLibraries rows.
--
-- Symptom:
--   Seeded regex JSON was stored with four backslashes (e.g. "\\\\b")
--   instead of two (e.g. "\\b"), so .NET regex saw literal backslashes and
--   deterministic pattern rules never matched.
--
-- Safe to run once against an already-seeded database.
-- After running this script, invalidate the ComplianceApi rule cache or restart
-- the service so it reloads the repaired pattern libraries.
-- =============================================================================

BEGIN TRANSACTION;

SELECT
  Id,
  LEFT(PatternsJson, 200) AS PatternsPreviewBefore
FROM PatternLibraries
WHERE PatternsJson LIKE '%\\\\%';

UPDATE PatternLibraries
SET PatternsJson = REPLACE(PatternsJson, '\\\\', '\\')
WHERE PatternsJson LIKE '%\\\\%';

SELECT
  Id,
  LEFT(PatternsJson, 200) AS PatternsPreviewAfter
FROM PatternLibraries
WHERE Id IN (
  N'HIPAA-PHI-v1',
  N'HIPAA-PHI-BULK-v1',
  N'CFR2-SUD-v1',
  N'CLINICAL-CRIT-v1'
);

COMMIT TRANSACTION;
