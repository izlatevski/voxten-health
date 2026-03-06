using Azure;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Voxten.CommunicationsApi.Models;
using Voxten.CommunicationsApi.Repositories;
using Voxten.CommunicationsApi.Services;

namespace Voxten.CommunicationsApi.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public sealed class CommunicationsController(
    AcsChatService chatService,
    CommunicationIndexRepository indexRepository) : ControllerBase
{
    [HttpPost("chat/tokens")]
    public async Task<IActionResult> IssueToken([FromBody] IssueTokenRequest request, CancellationToken ct)
    {
        if (!HasTenantAccess(request.TenantId) || !HasUserAccess(request.EntraUserId))
        {
            return Forbid();
        }

        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId)
                && !string.IsNullOrWhiteSpace(request.TenantId)
                && !string.IsNullOrWhiteSpace(request.EntraUserId))
            {
                var existing = await indexRepository.GetUserIdentityMapAsync(request.TenantId, request.EntraUserId, ct);
                if (!string.IsNullOrWhiteSpace(existing?.AcsUserId))
                {
                    request.UserId = existing.AcsUserId;
                }
            }

            var token = await chatService.IssueTokenAsync(request, ct);

            if (!string.IsNullOrWhiteSpace(request.TenantId) && !string.IsNullOrWhiteSpace(request.EntraUserId))
            {
                await indexRepository.UpsertUserIdentityMapAsync(request.TenantId, request.EntraUserId, token.UserId, ct);
            }

            return Ok(token);
        }
        catch (Exception ex)
        {
            return ToErrorResult(ex);
        }
    }

    [HttpPost("mappings/users")]
    public async Task<IActionResult> UpsertUserMapping([FromBody] UpsertUserIdentityMapRequest request, CancellationToken ct)
    {
        if (!HasTenantAccess(request.TenantId) || !HasUserAccess(request.EntraUserId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        if (string.IsNullOrWhiteSpace(request.EntraUserId))
        {
            return BadRequest(new { error = "entraUserId is required." });
        }

        if (string.IsNullOrWhiteSpace(request.AcsUserId))
        {
            return BadRequest(new { error = "acsUserId is required." });
        }

        await indexRepository.UpsertUserIdentityMapAsync(request.TenantId, request.EntraUserId, request.AcsUserId, ct);
        return NoContent();
    }

    [HttpGet("mappings/users/{entraUserId}")]
    public async Task<IActionResult> GetUserMapping([FromRoute] string entraUserId, [FromQuery] string tenantId, CancellationToken ct)
    {
        if (!HasTenantAccess(tenantId) || !HasUserAccess(entraUserId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        var map = await indexRepository.GetUserIdentityMapAsync(tenantId, entraUserId, ct);
        if (map is null)
        {
            return NotFound(new { error = "Mapping not found." });
        }

        return Ok(map);
    }

    [HttpGet("users/{entraUserId}/threads")]
    public async Task<IActionResult> GetUserThreads([FromRoute] string entraUserId, [FromQuery] string tenantId, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        if (!HasTenantAccess(tenantId) || !HasUserAccess(entraUserId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        if (pageSize <= 0 || pageSize > 200)
        {
            return BadRequest(new { error = "pageSize must be between 1 and 200." });
        }

        var items = await indexRepository.GetUserThreadIndexAsync(tenantId, entraUserId, pageSize, ct);
        return Ok(new { items });
    }

    [HttpGet("threads/{threadId}/participants")]
    public async Task<IActionResult> GetThreadParticipants([FromRoute] string threadId, [FromQuery] string tenantId, CancellationToken ct = default)
    {
        if (!HasTenantAccess(tenantId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        var items = await indexRepository.GetThreadParticipantsAsync(tenantId, threadId, ct);
        return Ok(new { items });
    }

    [HttpGet("chat/threads")]
    public async Task<IActionResult> ListThreads([FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var token = ResolveAcsUserToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { error = "ACS user token is required in X-Acs-User-Token header." });
        }

        if (pageSize <= 0 || pageSize > 200)
        {
            return BadRequest(new { error = "pageSize must be between 1 and 200." });
        }

        try
        {
            var threads = await chatService.ListThreadsAsync(token, pageSize, ct);
            return Ok(new { items = threads });
        }
        catch (Exception ex)
        {
            return ToErrorResult(ex);
        }
    }

    [HttpPost("chat/threads")]
    public async Task<IActionResult> CreateThread([FromBody] CreateThreadRequest request, CancellationToken ct)
    {
        if (!HasTenantAccess(request.TenantId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.CreatorToken))
        {
            return BadRequest(new { error = "creatorToken is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Topic))
        {
            return BadRequest(new { error = "topic is required." });
        }

        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        try
        {
            var created = await chatService.CreateThreadAsync(request, ct);
            await indexRepository.UpsertThreadParticipantsAsync(request.TenantId, created.ThreadId, request.Participants, ct);
            await indexRepository.UpsertUserThreadIndexEntriesAsync(
                request.TenantId,
                created.ThreadId,
                request.Topic,
                lastMessagePreview: "Thread created",
                lastMessageAtUtc: DateTimeOffset.UtcNow,
                senderEntraUserId: null,
                complianceState: "unknown",
                ct);

            return Ok(created);
        }
        catch (Exception ex)
        {
            return ToErrorResult(ex);
        }
    }

    [HttpPost("chat/messages")]
    public async Task<IActionResult> SendChatMessage([FromBody] SendChatMessageRequest request, CancellationToken ct)
    {
        if (!HasTenantAccess(request.TenantId))
        {
            return Forbid();
        }

        if (!HasUserAccess(request.SenderEntraUserId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.ThreadId))
        {
            return BadRequest(new { error = "threadId is required." });
        }

        if (string.IsNullOrWhiteSpace(request.SenderToken))
        {
            return BadRequest(new { error = "senderToken is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { error = "content is required." });
        }

        try
        {
            var sent = await chatService.SendChatMessageAsync(request, ct);

            if (!string.IsNullOrWhiteSpace(request.TenantId))
            {
                await indexRepository.UpsertUserThreadIndexEntriesAsync(
                    request.TenantId,
                    request.ThreadId,
                    topic: string.Empty,
                    lastMessagePreview: BuildMessagePreview(request.Content),
                    lastMessageAtUtc: sent.SentAt,
                    senderEntraUserId: request.SenderEntraUserId,
                    complianceState: request.ComplianceState,
                    ct);
            }

            return Ok(sent);
        }
        catch (Exception ex)
        {
            return ToErrorResult(ex);
        }
    }

    [HttpGet("chat/threads/{threadId}/messages")]
    public async Task<IActionResult> GetChatMessages([FromRoute] string threadId, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        if (pageSize <= 0 || pageSize > 200)
        {
            return BadRequest(new { error = "pageSize must be between 1 and 200." });
        }

        var token = ResolveAcsUserToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { error = "ACS user token is required in X-Acs-User-Token header." });
        }

        try
        {
            var items = await chatService.GetChatMessagesAsync(token, threadId, pageSize, ct);
            return Ok(new { items });
        }
        catch (Exception ex)
        {
            return ToErrorResult(ex);
        }
    }

    [HttpPost("sms/messages")]
    public async Task<IActionResult> SendSms([FromBody] SendSmsRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.FromPhoneNumber))
        {
            return BadRequest(new { error = "fromPhoneNumber is required." });
        }

        if (string.IsNullOrWhiteSpace(request.ToPhoneNumber))
        {
            return BadRequest(new { error = "toPhoneNumber is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "message is required." });
        }

        try
        {
            var sent = await chatService.SendSmsAsync(request, ct);
            return Ok(sent);
        }
        catch (Exception ex)
        {
            return ToErrorResult(ex);
        }
    }

    private static string BuildMessagePreview(string content)
    {
        var normalized = content.Trim();
        return normalized.Length <= 180 ? normalized : normalized[..180];
    }

    private string? ResolveAcsUserToken()
    {
        if (!Request.Headers.TryGetValue("X-Acs-User-Token", out var values))
        {
            return null;
        }

        var raw = values.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw.Trim();
    }

    private IActionResult ToErrorResult(Exception ex)
    {
        return ex switch
        {
            ArgumentException => BadRequest(new { error = ex.Message }),
            InvalidOperationException => StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message }),
            RequestFailedException => StatusCode(StatusCodes.Status502BadGateway, new { error = ex.Message }),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new { error = "Unexpected error." })
        };
    }

    private bool HasTenantAccess(string? tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return true;
        }

        if (IsAdmin())
        {
            return true;
        }

        var callerTenant = User.FindFirstValue("tid");
        return !string.IsNullOrWhiteSpace(callerTenant)
            && string.Equals(callerTenant, tenantId, StringComparison.OrdinalIgnoreCase);
    }

    private bool HasUserAccess(string? entraUserId)
    {
        if (string.IsNullOrWhiteSpace(entraUserId))
        {
            return true;
        }

        if (IsAdmin())
        {
            return true;
        }

        var callerOid = User.FindFirstValue("oid") ?? User.FindFirstValue("sub");
        return !string.IsNullOrWhiteSpace(callerOid)
            && string.Equals(callerOid, entraUserId, StringComparison.OrdinalIgnoreCase);
    }

    private bool IsAdmin()
    {
        var roleClaims = User.FindAll("roles").Select(c => c.Value)
            .Concat(User.FindAll(ClaimTypes.Role).Select(c => c.Value));
        return roleClaims.Any(role => string.Equals(role, "Voxten.Admin", StringComparison.OrdinalIgnoreCase));
    }
}
