using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.Compliance.Data.Models.Pipeline;

// Tamper-evident compliance record — HIPAA §164.528, FDA 21 CFR Part 11.
// Created once after all evaluations complete. Never updated.
public class MessageAuditRecord
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid MessageId { get; set; }

    public Verdict OverallVerdict { get; set; }
    public Severity? MaxViolationSeverity { get; set; }

    public int TotalRulesEvaluated { get; set; }
    public int ViolationCount { get; set; }
    public int UncertainCount { get; set; }
    public int CompliantCount { get; set; }

    // Copied from CanonicalMessage at seal time
    [Required, MaxLength(64)]
    public string IngestHash { get; set; } = string.Empty;

    // SHA-256 of (IngestHash + sorted EvaluationResult IDs)
    [Required, MaxLength(64)]
    public string EvaluationHash { get; set; } = string.Empty;

    // RSA/ECDSA signature over EvaluationHash
    [Required]
    public string EvaluationSignature { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string SigningKeyId { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string EngineVersion { get; set; } = string.Empty;

    // JSON: Dictionary<string, string> — { "PHI-001": "1.2.0", ... }
    [Required]
    public string RuleVersionsSnapshotJson { get; set; } = "{}";

    // Flags messages that constitute a regulated disclosure (meaning varies by industry/framework)
    public bool IsDisclosure { get; set; } = false;

    // HIPAA 6-year minimum retention
    public DateTime RetainUntil { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CanonicalMessage Message { get; set; } = null!;
}
