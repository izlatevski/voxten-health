using System.ComponentModel.DataAnnotations;

namespace Voxten.PortalApi.Dtos;

public class CreateRulePackRequest
{
    // Semantic string ID — e.g. "hipaa-core", "finra-comms"
    [Required, MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required, MaxLength(50)]
    public string Sector { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int RetentionDays { get; set; } = 365;
}

public class UpdateRulePackRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(1, int.MaxValue)]
    public int RetentionDays { get; set; }
}

public class RulePackResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Sector { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int RetentionDays { get; set; }
    public int RuleCount { get; set; }
}
