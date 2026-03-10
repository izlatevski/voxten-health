namespace Voxten.Compliance.Data.Enums;

public enum EvalType
{
    Deterministic,
    Ai,
    Hybrid
}

public enum Severity
{
    Critical = 1,
    High = 2,
    Medium = 3,
    Low = 4
}

public enum RuleStatus
{
    Draft,
    Active,
    Deprecated
}

public enum RuleCategory
{
    PhiDataPrivacy,
    ConsentAuthorization,
    IntegrityAudit,
    ClinicalCommunication,
    RetentionAccess,
    MarketingPhiSale,
    PatientRights,
    SecurityBaGovernance
}

public enum RegulatoryFramework
{
    Hipaa,
    Hitech,
    FdaPart11
}

public enum Channel
{
    Email,
    Sms,
    Ehr,
    SecureChat,
    Voice
}

public enum Direction
{
    Inbound,
    Outbound,
    Internal
}

public enum EnforcementMode
{
    Preventive,
    Detective,
    Advisory,
    MonitorOnly
}

public enum PolicyStatus
{
    Draft,
    Active,
    Suspended,
    Archived
}

public enum MessageStatus
{
    Received,
    Enriching,
    Evaluating,
    Actioned,
    Archived
}

public enum Verdict
{
    Compliant,
    Violation,
    Uncertain,
    Partial
}

public enum ActionType
{
    Block,
    Alert,
    Log,
    QuarantineForReview,
    RequireAttestation,
    Redact,
    RedirectToSecureChannel,
    NotifyPrivacyOfficer,
    NotifyRealTime
}

public enum ReviewStatus
{
    Pending,
    UnderReview,
    Resolved,
    Escalated,
    Closed
}

public enum ExemptionType
{
    Tpo,
    Emergency,
    LegalHold,
    PublicHealth,
    Research,
    DeIdentified,
    IndividualRequest
}

public enum ExemptionEffect
{
    SkipRule,
    Downgrade,
    AllowWithLog,
    RequireAttestation
}

public enum DegradedMode
{
    Block,
    AllowWithLog,
    Attestation,
    Skip
}

public enum SubjectScopeType
{
    All,
    RoleList,
    UserList,
    GroupList
}
