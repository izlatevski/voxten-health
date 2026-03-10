using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.PortalApi.Dtos;

public class CreateRuleRequest
{
    // Human-readable semantic identifier — "PHI-001"
    [Required, MaxLength(50)]
    public string LogicalId { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Version { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public RuleCategory Category { get; set; }
    public EvalType EvalType { get; set; }
    public Severity DefaultSeverity { get; set; }

    [Required, MaxLength(50)]
    public string PackId { get; set; } = string.Empty;

    public DateTime EffectiveDate { get; set; }

    [Required]
    public string ScopeJson { get; set; } = "{}";

    [Required]
    public string LogicJson { get; set; } = "{}";

    [Required]
    public string DefaultActionsJson { get; set; } = "[]";

    public string? ExemptionsJson { get; set; }
}

public class UpdateRuleRequest
{
    [Required, MaxLength(20)]
    public string Version { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public RuleCategory Category { get; set; }
    public EvalType EvalType { get; set; }
    public Severity DefaultSeverity { get; set; }

    public DateTime EffectiveDate { get; set; }

    [Required]
    public string ScopeJson { get; set; } = "{}";

    [Required]
    public string LogicJson { get; set; } = "{}";

    [Required]
    public string DefaultActionsJson { get; set; } = "[]";

    public string? ExemptionsJson { get; set; }
    public string? ChangelogJson { get; set; }
}

public class RuleResponse
{
    public Guid Id { get; set; }
    public string LogicalId { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RuleCategory Category { get; set; }
    public EvalType EvalType { get; set; }
    public Severity DefaultSeverity { get; set; }
    public RuleStatus Status { get; set; }
    public bool IsActive { get; set; }
    public string PackId { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; }
    public DateTime? DeprecatedDate { get; set; }
    public string ScopeJson { get; set; } = "{}";
    public string LogicJson { get; set; } = "{}";
    public string DefaultActionsJson { get; set; } = "[]";
    public string? ExemptionsJson { get; set; }
    public string? ChangelogJson { get; set; }
}
