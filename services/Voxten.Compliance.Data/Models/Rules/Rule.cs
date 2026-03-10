using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.Compliance.Data.Models.Rules;

public class Rule
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    // Human-readable semantic identifier — "PHI-001", "JC-HANDOFF-001"
    // Unique among active rules (enforced by filtered index)
    [Required, MaxLength(50)]
    public string LogicalId { get; set; } = string.Empty;

    // Informational semver — stored here and snapshotted in EvaluationResult
    [Required, MaxLength(20)]
    public string Version { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public RuleCategory Category { get; set; }
    public EvalType EvalType { get; set; }
    public Severity DefaultSeverity { get; set; }
    public RuleStatus Status { get; set; } = RuleStatus.Draft;

    // Only one row per LogicalId may have IsActive = true (enforced by filtered unique index)
    public bool IsActive { get; set; } = false;

    [Required, MaxLength(50)]
    public string PackId { get; set; } = string.Empty;

    public DateTime EffectiveDate { get; set; }
    public DateTime? DeprecatedDate { get; set; }

    // JSON: { "channels": [...], "directions": [...], "senderRoles": [...] }
    [Required]
    public string ScopeJson { get; set; } = "{}";

    // JSON structure varies by EvalType:
    // Deterministic: { "patternLibraryId": "...", "matchMode": "any", "confidenceFloor": 0.85 }
    // Ai:            { "systemPrompt": "...", "userPromptTemplate": "...", "confidenceFloor": 0.80, "model": "gpt-4o" }
    // Hybrid:        { "patternLibraryId": "...", "systemPrompt": "...", "confidenceFloor": 0.80 }
    [Required]
    public string LogicJson { get; set; } = "{}";

    // JSON: [{ "actionType": "Block", "channels": [...] }]
    [Required]
    public string DefaultActionsJson { get; set; } = "[]";

    // JSON: [{ "type": "Emergency", "effect": "AllowWithLog", "condition": {} }]
    public string? ExemptionsJson { get; set; }

    // JSON: [{ "version": "1.0.0", "date": "...", "summary": "..." }]
    public string? ChangelogJson { get; set; }

    public RulePack Pack { get; set; } = null!;
}
