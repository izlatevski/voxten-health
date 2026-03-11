namespace Voxten.CommunicationsApi.Compliance;

public sealed class ComplianceEvaluationResult
{
    public string AuditId { get; set; } = string.Empty;

    /// <summary>Compliant | Violation | Uncertain</summary>
    public string Verdict { get; set; } = string.Empty;

    /// <summary>Frontend-facing state: passed | flagged | blocked | redacted</summary>
    public string ComplianceState { get; set; } = "passed";

    /// <summary>Content with detected entities replaced by [REDACTED:Type] tokens. Null when no redaction applied.</summary>
    public string? RedactedContent { get; set; }

    public List<DetectedEntityResult> EntitiesDetected { get; set; } = [];
    public List<FiredRuleResult> RulesFired { get; set; } = [];
    public int EvalMs { get; set; }
    public int? AiMs { get; set; }
}

public sealed class DetectedEntityResult
{
    public string EntityType { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string RuleId { get; set; } = string.Empty;
    public string DetectionMethod { get; set; } = string.Empty;
}

public sealed class FiredRuleResult
{
    public string RuleId { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
}
