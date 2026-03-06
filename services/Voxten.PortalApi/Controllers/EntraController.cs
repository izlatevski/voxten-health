using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Voxten.PortalApi.Services;

namespace Voxten.PortalApi.Controllers;

[ApiController]
[Route("api/entra")]
[Authorize]
public sealed class EntraController(EntraGraphService graphService) : ControllerBase
{
    [HttpGet("users")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q, [FromQuery] int top = 20, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
        {
            return BadRequest(new { error = "q must be at least 2 characters." });
        }

        try
        {
            var users = await graphService.SearchUsersAsync(q, top, ct);
            return Ok(new { items = users });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = ex.Message });
        }
    }
}
