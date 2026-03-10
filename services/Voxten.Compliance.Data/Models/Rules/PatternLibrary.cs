using System.ComponentModel.DataAnnotations;

namespace Voxten.Compliance.Data.Models.Rules;

// Shared regex/NLP pattern sets referenced by rules via LogicJson.patternLibraryId.
// Extracting patterns here avoids duplicating them across rules that detect the same entities.
public class PatternLibrary
{
    [Key, MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    // JSON: [{ "regex": "...", "entityType": "Ssn", "description": "...", "flags": "i" }]
    [Required]
    public string PatternsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
