using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Enums;
using Voxten.Compliance.Data.Models.Rules;
using Voxten.PortalApi.Dtos;
using Voxten.PortalApi.Services;

namespace Voxten.PortalApi.Controllers;

[ApiController]
[Route("api/compliance/rules")]
[Authorize]
public class RulesController(ComplianceDbContext db, ComplianceCacheInvalidator cacheInvalidator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? packId,
        [FromQuery] RuleStatus? status,
        [FromQuery] RuleCategory? category,
        [FromQuery] bool? activeOnly,
        CancellationToken ct)
    {
        var query = db.Rules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(packId))
            query = query.Where(r => r.PackId == packId);

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (category.HasValue)
            query = query.Where(r => r.Category == category.Value);

        if (activeOnly == true)
            query = query.Where(r => r.IsActive);

        var rules = await query.ToListAsync(ct);
        return Ok(rules.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var rule = await db.Rules.FirstOrDefaultAsync(r => r.Id == id, ct);
        return rule is null ? NotFound() : Ok(ToResponse(rule));
    }

    [HttpGet("by-logical-id/{logicalId}")]
    public async Task<IActionResult> GetByLogicalId(string logicalId, CancellationToken ct)
    {
        var rules = await db.Rules
            .Where(r => r.LogicalId == logicalId)
            .OrderByDescending(r => r.IsActive)
            .ThenByDescending(r => r.EffectiveDate)
            .ToListAsync(ct);

        return rules.Count == 0 ? NotFound() : Ok(rules.Select(ToResponse));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRuleRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var packExists = await db.RulePacks.AnyAsync(p => p.Id == request.PackId, ct);
        if (!packExists) return BadRequest(new { error = $"Pack '{request.PackId}' not found." });

        var rule = new Rule
        {
            Id = Guid.CreateVersion7(),
            LogicalId = request.LogicalId,
            Version = request.Version,
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            EvalType = request.EvalType,
            DefaultSeverity = request.DefaultSeverity,
            PackId = request.PackId,
            EffectiveDate = request.EffectiveDate,
            ScopeJson = request.ScopeJson,
            LogicJson = request.LogicJson,
            DefaultActionsJson = request.DefaultActionsJson,
            ExemptionsJson = request.ExemptionsJson,
            Status = RuleStatus.Draft,
            IsActive = false
        };

        db.Rules.Add(rule);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = rule.Id }, ToResponse(rule));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRuleRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var rule = await db.Rules.FindAsync([id], ct);
        if (rule is null) return NotFound();

        if (rule.IsActive)
            return BadRequest(new { error = "Active rules cannot be edited. Create a new version instead." });

        rule.Version = request.Version;
        rule.Name = request.Name;
        rule.Description = request.Description;
        rule.Category = request.Category;
        rule.EvalType = request.EvalType;
        rule.DefaultSeverity = request.DefaultSeverity;
        rule.EffectiveDate = request.EffectiveDate;
        rule.ScopeJson = request.ScopeJson;
        rule.LogicJson = request.LogicJson;
        rule.DefaultActionsJson = request.DefaultActionsJson;
        rule.ExemptionsJson = request.ExemptionsJson;
        rule.ChangelogJson = request.ChangelogJson;

        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(rule));
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        var rule = await db.Rules.FindAsync([id], ct);
        if (rule is null) return NotFound();

        var currentActive = await db.Rules
            .Where(r => r.LogicalId == rule.LogicalId && r.IsActive && r.Id != id)
            .ToListAsync(ct);

        foreach (var old in currentActive)
        {
            old.IsActive = false;
            old.Status = RuleStatus.Deprecated;
            old.DeprecatedDate = DateTime.UtcNow;
        }

        rule.IsActive = true;
        rule.Status = RuleStatus.Active;

        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);
        return Ok(new { id, logicalId = rule.LogicalId, version = rule.Version, isActive = true });
    }

    [HttpPost("{id:guid}/deprecate")]
    public async Task<IActionResult> Deprecate(Guid id, CancellationToken ct)
    {
        var rule = await db.Rules.FindAsync([id], ct);
        if (rule is null) return NotFound();

        rule.IsActive = false;
        rule.Status = RuleStatus.Deprecated;
        rule.DeprecatedDate = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        await cacheInvalidator.InvalidateAsync(ct);
        return Ok(new { id, status = RuleStatus.Deprecated });
    }

    private static RuleResponse ToResponse(Rule rule) => new()
    {
        Id = rule.Id,
        LogicalId = rule.LogicalId,
        Version = rule.Version,
        Name = rule.Name,
        Description = rule.Description,
        Category = rule.Category,
        EvalType = rule.EvalType,
        DefaultSeverity = rule.DefaultSeverity,
        Status = rule.Status,
        IsActive = rule.IsActive,
        PackId = rule.PackId,
        EffectiveDate = rule.EffectiveDate,
        DeprecatedDate = rule.DeprecatedDate,
        ScopeJson = rule.ScopeJson,
        LogicJson = rule.LogicJson,
        DefaultActionsJson = rule.DefaultActionsJson,
        ExemptionsJson = rule.ExemptionsJson,
        ChangelogJson = rule.ChangelogJson
    };
}
