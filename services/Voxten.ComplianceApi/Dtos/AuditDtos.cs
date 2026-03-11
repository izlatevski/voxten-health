namespace Voxten.ComplianceApi.Dtos;

public class EvaluationResultDto
{
    public string RuleLogicalId { get; set; } = string.Empty;
    public string RuleVersion { get; set; } = string.Empty;
    public string EvalLane { get; set; } = string.Empty;
    public string Verdict { get; set; } = string.Empty;
    public string? ViolationSeverity { get; set; }
    public double? Confidence { get; set; }
    public string EvidenceJson { get; set; } = "{}";
    public int EvaluationLatencyMs { get; set; }
    public bool IsDegradedMode { get; set; }
    public string? DegradedReason { get; set; }
}

public class AuditSummaryDto
{
    public string AuditId { get; set; } = string.Empty;
    public string MessageId { get; set; } = string.Empty;
    public string ComplianceState { get; set; } = string.Empty;
    public string OverallVerdict { get; set; } = string.Empty;
    public string? MaxViolationSeverity { get; set; }
    public int TotalRulesEvaluated { get; set; }
    public int ViolationCount { get; set; }
    public string? SenderId { get; set; }
    public string? SenderRole { get; set; }
    public string? ThreadId { get; set; }
    public string? SourceChannel { get; set; }
    public string? Direction { get; set; }
    public string EngineVersion { get; set; } = string.Empty;
    public bool IsDisclosure { get; set; }
    public DateTime MessageTimestamp { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime RetainUntil { get; set; }
}

public class AuditDetailDto : AuditSummaryDto
{
    public string IngestHash { get; set; } = string.Empty;
    public string EvaluationHash { get; set; } = string.Empty;
    public string SigningKeyId { get; set; } = string.Empty;
    public string RuleVersionsSnapshotJson { get; set; } = "{}";
    public string ContentBlobRef { get; set; } = string.Empty;
    public string? MessageContent { get; set; }
    public List<EvaluationResultDto> EvaluationResults { get; set; } = [];
}

public class AuditPageDto
{
    public List<AuditSummaryDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class TopRuleDto
{
    public string RuleLogicalId { get; set; } = string.Empty;
    public string RuleVersion { get; set; } = string.Empty;
    public int FireCount { get; set; }
}

public class ComplianceStatsDto
{
    public int WindowDays { get; set; }
    public int Total { get; set; }
    public int Passed { get; set; }
    public int Flagged { get; set; }
    public int Redacted { get; set; }
    public int Blocked { get; set; }
    public List<TopRuleDto> TopRulesFired { get; set; } = [];
}
