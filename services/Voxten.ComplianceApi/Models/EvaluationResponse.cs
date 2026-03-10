using Voxten.Compliance.Data.Enums;

namespace Voxten.ComplianceApi.Models;

public class EvaluationResponse
{
    public string AuditId { get; set; } = string.Empty;

    // Maps to frontend compliance state: Compliant→passed, Violation→blocked/redacted/flagged, Uncertain→flagged
    public Verdict Verdict { get; set; }

    // Derived display state for the frontend GovernedMessage component
    public string ComplianceState { get; set; } = string.Empty;

    // Populated when Verdict is Violation and action is Redact
    public string? RedactedContent { get; set; }

    public List<DetectedEntity> EntitiesDetected { get; set; } = [];
    public List<FiredRule> RulesFired { get; set; } = [];

    public int EvalMs { get; set; }
    public int? AiMs { get; set; }
}

public class DetectedEntity
{
    public string EntityType { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string RuleId { get; set; } = string.Empty;
    public string DetectionMethod { get; set; } = string.Empty;
}

public class FiredRule
{
    public string RuleId { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public ActionType Action { get; set; }
    public Severity Severity { get; set; }
}
