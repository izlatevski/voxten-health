namespace Voxten.ChatApi.Models;

public enum ComplianceVerdict
{
    Allowed,
    Redacted,
    Blocked
}

public enum ComplianceSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public sealed class ProcessCommunicationRequest
{
    public string? ConversationId { get; set; }
    public string? ThreadId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string? SenderToken { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object?>? Metadata { get; set; }
    public PatientContext? PatientContext { get; set; }
}

public sealed class PatientContext
{
    public string? Mrn { get; set; }
    public string? EncounterId { get; set; }
    public string? FacilityId { get; set; }
}

public sealed class ComplianceFinding
{
    public string RuleId { get; set; } = string.Empty;
    public string Framework { get; set; } = string.Empty;
    public ComplianceSeverity Severity { get; set; }
    public string Action { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string? MatchedText { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public sealed class ComplianceResult
{
    public ComplianceVerdict Verdict { get; set; }
    public string ProcessedMessage { get; set; } = string.Empty;
    public List<ComplianceFinding> Findings { get; set; } = [];
    public string PolicyPackVersion { get; set; } = "hipaa-hitrust-poc-v1";
    public EvaluatorInfo Evaluator { get; set; } = new();
}

public sealed class EvaluatorInfo
{
    public bool DeterministicRules { get; set; }
    public string? AiProvider { get; set; }
    public string? AiModel { get; set; }
}

public sealed class DispatchResult
{
    public bool Sent { get; set; }
    public bool Skipped { get; set; }
    public string? Reason { get; set; }
    public string? MessageId { get; set; }
    public string? SentAt { get; set; }
}

public sealed class StoredContent
{
    public string? OriginalMessage { get; set; }
    public string? ProcessedMessage { get; set; }
}

public sealed class AuditRecord
{
    public string AuditId { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
    public string? ThreadId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public ComplianceVerdict Verdict { get; set; }
    public List<ComplianceFinding> Findings { get; set; } = [];
    public string PolicyPackVersion { get; set; } = string.Empty;
    public string MessageHash { get; set; } = string.Empty;
    public string ProcessedMessageHash { get; set; } = string.Empty;
    public string ContentMode { get; set; } = "metadata_only";
    public StoredContent? StoredContent { get; set; }
}

public sealed class ProcessCommunicationResponse
{
    public ComplianceVerdict Verdict { get; set; }
    public MessagePayload Message { get; set; } = new();
    public List<ComplianceFinding> Findings { get; set; } = [];
    public DispatchResult Dispatch { get; set; } = new();
    public AuditRecord Audit { get; set; } = new();
}

public sealed class MessagePayload
{
    public string Original { get; set; } = string.Empty;
    public string Processed { get; set; } = string.Empty;
}
