using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Models.Rules;
using Voxten.PortalApi.Dtos;
using Voxten.PortalApi.Services;

namespace Voxten.PortalApi.Controllers;

[ApiController]
[Route("api/compliance/pattern-libraries")]
[Authorize]
public class PatternLibrariesController(
    ComplianceDbContext db,
    ComplianceCacheInvalidator cacheInvalidator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var libraries = await db.PatternLibraries
            .OrderBy(p => p.Id)
            .ToListAsync(ct);

        return Ok(libraries.Select(ToResponse));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var library = await db.PatternLibraries.FirstOrDefaultAsync(p => p.Id == id, ct);
        return library is null ? NotFound() : Ok(ToResponse(library));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePatternLibraryRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var normalizedId = request.Id.Trim();
        if (await db.PatternLibraries.AnyAsync(p => p.Id == normalizedId, ct))
            return BadRequest(new { error = $"Pattern library '{normalizedId}' already exists." });

        if (!TryNormalizePatternsJson(request.PatternsJson, out var normalizedPatternsJson, out var error))
            return BadRequest(new { error });

        var library = new PatternLibrary
        {
            Id = normalizedId,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            PatternsJson = normalizedPatternsJson,
            CreatedAt = DateTime.UtcNow
        };

        db.PatternLibraries.Add(library);
        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = library.Id }, ToResponse(library));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePatternLibraryRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var library = await db.PatternLibraries.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (library is null) return NotFound();

        if (!TryNormalizePatternsJson(request.PatternsJson, out var normalizedPatternsJson, out var error))
            return BadRequest(new { error });

        library.Name = request.Name.Trim();
        library.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        library.PatternsJson = normalizedPatternsJson;
        library.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);
        return Ok(ToResponse(library));
    }

    private static PatternLibraryResponse ToResponse(PatternLibrary library) => new()
    {
        Id = library.Id,
        Name = library.Name,
        Description = library.Description,
        PatternsJson = library.PatternsJson,
        PatternCount = CountPatterns(library.PatternsJson),
        CreatedAt = library.CreatedAt,
        UpdatedAt = library.UpdatedAt
    };

    private static bool TryNormalizePatternsJson(string input, out string normalized, out string? error)
    {
        normalized = "[]";
        error = null;

        try
        {
            using var doc = JsonDocument.Parse(input);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
            {
                error = "patternsJson must be a JSON array.";
                return false;
            }

            normalized = JsonSerializer.Serialize(doc.RootElement, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            return true;
        }
        catch (JsonException ex)
        {
            error = $"patternsJson is not valid JSON: {ex.Message}";
            return false;
        }
    }

    private static int CountPatterns(string patternsJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(patternsJson);
            return doc.RootElement.ValueKind == JsonValueKind.Array ? doc.RootElement.GetArrayLength() : 0;
        }
        catch (JsonException)
        {
            return 0;
        }
    }
}
