using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Models.Rules;
using Voxten.PortalApi.Dtos;

namespace Voxten.PortalApi.Controllers;

[ApiController]
[Route("api/compliance/pattern-libraries")]
[Authorize]
public class PatternLibrariesController(ComplianceDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var libraries = await db.PatternLibraries
            .OrderBy(p => p.Id)
            .ToListAsync(ct);

        return Ok(libraries.Select(ToResponse));
    }

    private static PatternLibraryResponse ToResponse(PatternLibrary library) => new()
    {
        Id = library.Id,
        Name = library.Name,
        Description = library.Description,
        CreatedAt = library.CreatedAt,
        UpdatedAt = library.UpdatedAt
    };
}
