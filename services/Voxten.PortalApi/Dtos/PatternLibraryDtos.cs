using System.ComponentModel.DataAnnotations;

namespace Voxten.PortalApi.Dtos;

public class PatternLibraryResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string PatternsJson { get; set; } = "[]";
    public int PatternCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePatternLibraryRequest
{
    [Required, MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public string PatternsJson { get; set; } = "[]";
}

public class UpdatePatternLibraryRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public string PatternsJson { get; set; } = "[]";
}
