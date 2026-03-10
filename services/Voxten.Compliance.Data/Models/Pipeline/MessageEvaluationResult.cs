using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.Compliance.Data.Models.Pipeline;

// One row per rule evaluated per message. Immutable once created.
public class MessageEvaluationResult
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid MessageId { get; set; }

    // FK to the exact Rule row used — Guid uniquely identifies the version
    public Guid RuleId { get; set; }

    // Denormalised for reporting without joining back to Rules
    [Required, MaxLength(50)]
    public string RuleLogicalId { get; set; } = string.Empty;   // "PHI-001"

    [Required, MaxLength(20)]
    public string RuleVersion { get; set; } = string.Empty;     // "1.2.0"

    public EvalType EvalLane { get; set; }
    public Verdict Verdict { get; set; }
    public Severity? ViolationSeverity { get; set; }

    // 0.0–1.0; null for pure Deterministic rules
    public double? Confidence { get; set; }

    public bool IsDegradedMode { get; set; } = false;

    [MaxLength(300)]
    public string? DegradedReason { get; set; }

    // JSON evidence varies by eval type:
    // Deterministic: [{ "entityType": "Ssn", "position": 42, "confidence": 1.0 }]
    // Ai:            { "entities": [...], "reasoning": "...", "citations": [...] }
    [Required]
    public string EvidenceJson { get; set; } = "{}";

    // Blob paths to AI prompt/response — large, audit-only, never queried
    public string? AiPromptBlobRef { get; set; }
    public string? AiResponseBlobRef { get; set; }

    [Required, MaxLength(20)]
    public string EngineVersion { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ModelVersion { get; set; }

    public int EvaluationLatencyMs { get; set; }
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;

    public CanonicalMessage Message { get; set; } = null!;
}
