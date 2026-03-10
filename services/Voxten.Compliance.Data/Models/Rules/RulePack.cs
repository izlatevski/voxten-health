using System.ComponentModel.DataAnnotations;

namespace Voxten.Compliance.Data.Models.Rules;

public class RulePack
{
    [Key, MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required, MaxLength(50)]
    public string Sector { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // Minimum retention period in days for messages evaluated under this pack.
    // Set per pack to match the regulatory requirement of the industry/framework.
    public int RetentionDays { get; set; } = 365;

    public ICollection<Rule> Rules { get; set; } = [];
}
