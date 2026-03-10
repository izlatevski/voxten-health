namespace Voxten.CommunicationsApi.Compliance;

public sealed class ComplianceEvaluationResult
{
    public string AuditId { get; set; } = string.Empty;

    /// <summary>Compliant | Violation | Uncertain</summary>
    public string Verdict { get; set; } = string.Empty;

    /// <summary>Frontend-facing state: passed | flagged | blocked</summary>
    public string ComplianceState { get; set; } = "passed";

    /// <summary>Content with detected entities replaced by [REDACTED:Type] tokens. Null when no redaction applied.</summary>
    public string? RedactedContent { get; set; }

    public string[] EntitiesDetected { get; set; } = [];
    public string[] RulesFired { get; set; } = [];
    public int EvalMs { get; set; }
}
