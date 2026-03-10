using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Voxten.ComplianceApi.Services;

namespace Voxten.ComplianceApi.Controllers;

[ApiController]
[Route("api/compliance/cache")]
[Authorize]
public class CacheController(RuleCache cache, ILogger<CacheController> logger) : ControllerBase
{
    // Called by PortalApi after a rule, pack, or policy is created/updated/toggled.
    // Triggers a rule cache reload from the shared database.
    [HttpPost("invalidate")]
    public async Task<IActionResult> Invalidate(CancellationToken ct)
    {
        logger.LogInformation("Cache invalidation requested by {Caller}", User.Identity?.Name);
        await cache.InvalidateAsync(ct);
        return Ok(new { reloadedAt = DateTime.UtcNow, ruleCount = cache.Current.Rules.Count });
    }

    [HttpGet("status")]
    public IActionResult Status()
    {
        var snapshot = cache.Current;
        return Ok(new
        {
            loadedAt = snapshot.LoadedAt,
            ruleCount = snapshot.Rules.Count,
            patternLibraryCount = snapshot.PatternLibraries.Count
        });
    }
}
