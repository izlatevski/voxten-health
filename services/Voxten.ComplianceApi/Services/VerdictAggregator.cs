using Voxten.Compliance.Data.Enums;

namespace Voxten.ComplianceApi.Services;

public class RuleEvaluationOutcome
{
    public string RuleId { get; set; } = string.Empty;       // LogicalId e.g. "PHI-001"
    public Guid RuleGuid { get; set; }                        // FK to Rules.Id
    public string RuleName { get; set; } = string.Empty;
    public string RuleVersion { get; set; } = string.Empty;
    public Verdict Verdict { get; set; }
    public Severity? Severity { get; set; }
    public ActionType DerivedAction { get; set; }
    public double? Confidence { get; set; }
    public string EvidenceJson { get; set; } = "{}";
    public EvalType EvalLane { get; set; }
    public int LatencyMs { get; set; }
    public bool IsDegradedMode { get; set; }
    public string? DegradedReason { get; set; }
}

public class AggregatedVerdict
{
    public Verdict OverallVerdict { get; set; }

    // The single highest-priority action across all fired rules
    public ActionType FinalAction { get; set; }

    public Severity? MaxSeverity { get; set; }
    public List<RuleEvaluationOutcome> FiredRules { get; set; } = [];
}

public class VerdictAggregator
{
    // Action priority — higher index = higher priority
    private static readonly ActionType[] ActionPriority =
    [
        ActionType.Log,
        ActionType.Alert,
        ActionType.RequireAttestation,
        ActionType.Redact,
        ActionType.RedirectToSecureChannel,
        ActionType.NotifyPrivacyOfficer,
        ActionType.NotifyRealTime,
        ActionType.QuarantineForReview,
        ActionType.Block
    ];

    public AggregatedVerdict Aggregate(IEnumerable<RuleEvaluationOutcome> outcomes)
    {
        var fired = outcomes
            .Where(o => o.Verdict is Verdict.Violation or Verdict.Uncertain or Verdict.Partial)
            .ToList();

        if (fired.Count == 0)
        {
            return new AggregatedVerdict
            {
                OverallVerdict = Verdict.Compliant,
                FinalAction = ActionType.Log,
                FiredRules = []
            };
        }

        // Overall verdict: Violation > Uncertain > Partial
        var overallVerdict = fired.Any(o => o.Verdict == Verdict.Violation)
            ? Verdict.Violation
            : fired.Any(o => o.Verdict == Verdict.Uncertain)
                ? Verdict.Uncertain
                : Verdict.Partial;

        // Highest severity across all violations
        var maxSeverity = fired
            .Where(o => o.Severity.HasValue)
            .Select(o => o.Severity!.Value)
            .OrderBy(s => (int)s)
            .FirstOrDefault();

        // Highest priority action
        var finalAction = fired
            .Select(o => o.DerivedAction)
            .OrderByDescending(a => Array.IndexOf(ActionPriority, a))
            .First();

        return new AggregatedVerdict
        {
            OverallVerdict = overallVerdict,
            FinalAction = finalAction,
            MaxSeverity = maxSeverity,
            FiredRules = fired
        };
    }

    // Maps aggregated verdict+action to the frontend compliance state string
    public static string ToComplianceState(AggregatedVerdict verdict)
    {
        if (verdict.OverallVerdict == Verdict.Compliant)
            return "passed";

        return verdict.FinalAction switch
        {
            ActionType.Block => "blocked",
            ActionType.QuarantineForReview => "blocked",
            ActionType.Redact => "redacted",
            ActionType.Alert or ActionType.NotifyPrivacyOfficer or ActionType.NotifyRealTime => "flagged",
            _ when verdict.OverallVerdict == Verdict.Uncertain => "flagged",
            _ => "flagged"
        };
    }
}
