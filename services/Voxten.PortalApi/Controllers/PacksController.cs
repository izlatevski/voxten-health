using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Models.Rules;
using Voxten.PortalApi.Dtos;
using Voxten.PortalApi.Services;

namespace Voxten.PortalApi.Controllers;

[ApiController]
[Route("api/compliance/packs")]
[Authorize]
public class PacksController(ComplianceDbContext db, ComplianceCacheInvalidator cacheInvalidator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var packs = await db.RulePacks
            .Include(p => p.Rules.Where(r => r.IsActive))
            .ToListAsync(ct);

        var response = packs.Select(ToResponse);
        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var pack = await db.RulePacks
            .Include(p => p.Rules)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return pack is null ? NotFound() : Ok(ToResponse(pack));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRulePackRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var duplicate = await db.RulePacks.AnyAsync(p => p.Id == request.Id, ct);
        if (duplicate) return Conflict(new { error = $"Pack '{request.Id}' already exists." });

        var pack = new RulePack
        {
            Id = request.Id,
            Name = request.Name,
            Description = request.Description,
            Sector = request.Sector,
            RetentionDays = request.RetentionDays,
            IsActive = true
        };

        db.RulePacks.Add(pack);
        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = pack.Id }, ToResponse(pack));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateRulePackRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var pack = await db.RulePacks.FindAsync([id], ct);
        if (pack is null) return NotFound();

        pack.Name = request.Name;
        pack.Description = request.Description;
        pack.RetentionDays = request.RetentionDays;

        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);
        return Ok(ToResponse(pack));
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(string id, CancellationToken ct)
    {
        var pack = await db.RulePacks.FindAsync([id], ct);
        if (pack is null) return NotFound();

        pack.IsActive = !pack.IsActive;
        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);
        return Ok(new { id, isActive = pack.IsActive });
    }

    private static RulePackResponse ToResponse(RulePack pack) => new()
    {
        Id = pack.Id,
        Name = pack.Name,
        Description = pack.Description,
        Sector = pack.Sector,
        IsActive = pack.IsActive,
        RetentionDays = pack.RetentionDays,
        RuleCount = pack.Rules?.Count ?? 0
    };
}
