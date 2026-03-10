using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Voxten.ComplianceApi.Models;
using Voxten.ComplianceApi.Services;

namespace Voxten.ComplianceApi.Controllers;

[ApiController]
[Route("api/compliance")]
[Authorize]
public class EvaluationController(ComplianceRuleEngine engine, ILogger<EvaluationController> logger) : ControllerBase
{
    // Called by CommunicationsApi before sending a message to ACS.
    // Returns a compliance verdict synchronously so the caller can block/redact/pass.
    [HttpPost("evaluate")]
    public async Task<ActionResult<EvaluationResponse>> Evaluate(
        [FromBody] EvaluationRequest request,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        logger.LogInformation("Evaluating message {MessageId} on channel {Channel}", request.MessageId, request.Channel);

        var result = await engine.EvaluateAsync(request, ct);
        return Ok(result);
    }
}
