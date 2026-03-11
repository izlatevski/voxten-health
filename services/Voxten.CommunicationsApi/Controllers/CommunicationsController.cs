using Azure;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Diagnostics;
using Voxten.CommunicationsApi.Compliance;
using Voxten.CommunicationsApi.Hubs;
using Voxten.CommunicationsApi.Models;
using Voxten.CommunicationsApi.Realtime;
using Voxten.CommunicationsApi.Repositories;
using Voxten.CommunicationsApi.Services;

namespace Voxten.CommunicationsApi.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public sealed class CommunicationsController(
    AcsChatService chatService,
    CommunicationIndexRepository indexRepository,
    IAcsUserTokenCache tokenCache,
    ComplianceClient complianceClient,
    ILogger<CommunicationsController> logger,
    IHubContext<ThreadsHub> threadsHub) : ControllerBase
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

    [HttpGet("threads/{threadId}/metadata")]
    public async Task<IActionResult> GetThreadMetadata([FromRoute] string threadId, [FromQuery] string tenantId, CancellationToken ct = default)
    {
        if (!HasTenantAccess(tenantId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        var callerOid = GetCallerOid();
        if (string.IsNullOrWhiteSpace(callerOid))
        {
            return Forbid();
        }

        var participants = await indexRepository.GetThreadParticipantsAsync(tenantId, threadId, ct);
        var isParticipant = participants.Any(participant =>
            string.Equals(participant.EntraUserId, callerOid, StringComparison.OrdinalIgnoreCase));
        if (!isParticipant && !IsPrivilegedCaller())
        {
            return Forbid();
        }

        var metadata = await indexRepository.GetThreadMetadataAsync(tenantId, threadId, ct);
        if (metadata is null)
        {
            return NotFound(new { error = "Thread metadata not found." });
        }

        return Ok(metadata);
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
        var tenantId = request.TenantId ?? GetCallerTenant();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        if (!HasTenantAccess(tenantId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Topic))
        {
            return BadRequest(new { error = "topic is required." });
        }

        var creatorEntraUserId = GetCallerOid();
        if (string.IsNullOrWhiteSpace(creatorEntraUserId))
        {
            return Forbid();
        }

        try
        {
            var requestedParticipants = request.Participants
                .Where(participant => !string.IsNullOrWhiteSpace(participant.EntraUserId))
                .GroupBy(participant => participant.EntraUserId!, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .ToList();

            if (!requestedParticipants.Any(participant =>
                string.Equals(participant.EntraUserId, creatorEntraUserId, StringComparison.OrdinalIgnoreCase)))
            {
                requestedParticipants.Insert(0, new ThreadParticipantInput
                {
                    EntraUserId = creatorEntraUserId,
                    DisplayName = User.FindFirstValue("name"),
                    Role = "Creator"
                });
            }

            var resolvedParticipants = new List<ThreadParticipantInput>(requestedParticipants.Count);
            foreach (var participant in requestedParticipants)
            {
                if (string.IsNullOrWhiteSpace(participant.EntraUserId))
                {
                    continue;
                }

                var communicationUserId = participant.CommunicationUserId;
                if (string.IsNullOrWhiteSpace(communicationUserId))
                {
                    communicationUserId = await ResolveOrCreateAcsUserIdForEntraAsync(
                        tenantId,
                        participant.EntraUserId,
                        ct);
                }

                if (string.IsNullOrWhiteSpace(communicationUserId))
                {
                    return BadRequest(new { error = $"Could not resolve ACS identity for participant {participant.EntraUserId}." });
                }

                resolvedParticipants.Add(new ThreadParticipantInput
                {
                    CommunicationUserId = communicationUserId,
                    EntraUserId = participant.EntraUserId,
                    DisplayName = participant.DisplayName,
                    Role = participant.Role
                });
            }

            var creatorParticipant = resolvedParticipants.FirstOrDefault(participant =>
                string.Equals(participant.EntraUserId, creatorEntraUserId, StringComparison.OrdinalIgnoreCase));

            var creatorAcsUserId = creatorParticipant?.CommunicationUserId;
            if (string.IsNullOrWhiteSpace(creatorAcsUserId))
            {
                creatorAcsUserId = await ResolveOrCreateAcsUserIdForEntraAsync(tenantId, creatorEntraUserId, ct);
            }

            if (string.IsNullOrWhiteSpace(creatorAcsUserId))
            {
                return Forbid();
            }

            var creatorToken = request.CreatorToken;
            if (string.IsNullOrWhiteSpace(creatorToken))
            {
                creatorToken = await ResolveTokenForEntraUserAsync(tenantId, creatorEntraUserId, creatorAcsUserId, ct);
            }

            if (string.IsNullOrWhiteSpace(creatorToken))
            {
                return Forbid();
            }

            request.TenantId = tenantId;
            request.CreatorToken = creatorToken;
            request.Participants = resolvedParticipants;

            var created = await chatService.CreateThreadAsync(request, ct);
            await indexRepository.UpsertThreadMetadataAsync(
                tenantId,
                created.ThreadId,
                request.Topic,
                creatorEntraUserId,
                ct);
            await indexRepository.UpsertThreadParticipantsAsync(tenantId, created.ThreadId, resolvedParticipants, ct);
            await indexRepository.UpsertUserThreadIndexEntriesAsync(
                tenantId,
                created.ThreadId,
                request.Topic,
                lastMessagePreview: "Thread created",
                lastMessageAtUtc: DateTimeOffset.UtcNow,
                senderEntraUserId: null,
                complianceState: "unknown",
                ct);

            var createdEvent = new ThreadCreatedRealtimeEvent
            {
                ThreadId = created.ThreadId,
                Topic = request.Topic,
                CreatedByEntraUserId = creatorEntraUserId,
                CreatedAtUtc = DateTimeOffset.UtcNow,
            };

            var participantUserGroups = resolvedParticipants
                .Select(participant => participant.EntraUserId)
                .Where(entraUserId => !string.IsNullOrWhiteSpace(entraUserId))
                .Select(entraUserId => ThreadsHub.GroupForUser(entraUserId!))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (participantUserGroups.Length > 0)
            {
                await threadsHub.Clients.Groups(participantUserGroups)
                    .SendAsync("threadCreated", createdEvent, ct);
            }

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
        var totalSw = Stopwatch.StartNew();
        var tenantId = request.TenantId ?? GetCallerTenant();
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        if (!HasTenantAccess(tenantId))
        {
            return Forbid();
        }

        var senderEntraUserId = request.SenderEntraUserId ?? GetCallerOid();
        if (string.IsNullOrWhiteSpace(senderEntraUserId))
        {
            return BadRequest(new { error = "senderEntraUserId is required." });
        }

        if (!HasUserAccess(senderEntraUserId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.ThreadId))
        {
            return BadRequest(new { error = "threadId is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { error = "content is required." });
        }

        try
        {
            var tokenResolveMs = 0L;
            var complianceMs = 0L;
            var acsSendMs = 0L;
            var signalrPublishMs = 0L;

            var senderToken = request.SenderToken;
            if (string.IsNullOrWhiteSpace(senderToken))
            {
                var tokenSw = Stopwatch.StartNew();
                senderToken = await ResolveTokenForThreadActorAsync(tenantId, request.ThreadId, senderEntraUserId, ct);
                tokenSw.Stop();
                tokenResolveMs = tokenSw.ElapsedMilliseconds;
                if (string.IsNullOrWhiteSpace(senderToken))
                {
                    return Forbid();
                }
            }

            request.SenderToken = senderToken;
            request.TenantId = tenantId;
            request.SenderEntraUserId = senderEntraUserId;

            // --- Compliance evaluation (before ACS send) ---
            var messageId = Guid.CreateVersion7().ToString();
            var senderParticipant = await indexRepository.GetThreadParticipantAsync(tenantId, request.ThreadId, senderEntraUserId, ct);

            var complianceSw = Stopwatch.StartNew();
            var complianceResult = await complianceClient.EvaluateAsync(new ComplianceEvaluationRequest
            {
                MessageId = messageId,
                Content = request.Content,
                SenderId = senderEntraUserId,
                SenderRole = senderParticipant?.Role,
                ThreadId = request.ThreadId,
                Channel = "SecureChat",
                Direction = "Internal"
            }, ct);
            complianceSw.Stop();
            complianceMs = complianceSw.ElapsedMilliseconds;

            var complianceState = complianceResult?.ComplianceState ?? "unknown";

            if (complianceState == "blocked")
            {
                totalSw.Stop();
                logger.LogWarning(
                    "chat.send blocked by compliance tenantId={TenantId} threadId={ThreadId} sender={SenderEntraUserId} auditId={AuditId} rules={Rules} totalMs={TotalMs}",
                    tenantId,
                    request.ThreadId,
                    senderEntraUserId,
                    complianceResult!.AuditId,
                    string.Join(", ", complianceResult.RulesFired.Select(r => r.RuleId)),
                    totalSw.ElapsedMilliseconds);

                return StatusCode(StatusCodes.Status422UnprocessableEntity, new
                {
                    error = "Message blocked by compliance policy.",
                    complianceState,
                    auditId = complianceResult.AuditId,
                    rulesFired = complianceResult.RulesFired
                });
            }

            // Apply redacted content if compliance engine produced one
            if (complianceResult?.RedactedContent is not null)
                request.Content = complianceResult.RedactedContent;

            var acsSw = Stopwatch.StartNew();
            var sent = await chatService.SendChatMessageAsync(request, ct);
            acsSw.Stop();
            acsSendMs = acsSw.ElapsedMilliseconds;

            await indexRepository.UpsertUserThreadIndexEntriesAsync(
                tenantId,
                request.ThreadId,
                topic: string.Empty,
                lastMessagePreview: BuildMessagePreview(request.Content),
                lastMessageAtUtc: sent.SentAt,
                senderEntraUserId: senderEntraUserId,
                complianceState: complianceState,
                ct);

            var signalrSw = Stopwatch.StartNew();
            await threadsHub.Clients
                .Group(ThreadsHub.GroupForThread(request.ThreadId))
                .SendAsync(
                    "messageReceived",
                    new ThreadMessageRealtimeEvent
                    {
                        ThreadId = request.ThreadId,
                        MessageId = sent.MessageId,
                        Content = request.Content,
                        SenderDisplayName = request.SenderDisplayName,
                        SenderEntraUserId = senderEntraUserId,
                        SentAtUtc = sent.SentAt,
                        ComplianceState = complianceState
                    },
                    ct);
            signalrSw.Stop();
            signalrPublishMs = signalrSw.ElapsedMilliseconds;

            totalSw.Stop();
            logger.LogInformation(
                "chat.send timing tenantId={TenantId} threadId={ThreadId} sender={SenderEntraUserId} complianceState={ComplianceState} tokenResolveMs={TokenResolveMs} complianceMs={ComplianceMs} acsSendMs={AcsSendMs} signalrPublishMs={SignalRPublishMs} totalMs={TotalMs}",
                tenantId,
                request.ThreadId,
                senderEntraUserId,
                complianceState,
                tokenResolveMs,
                complianceMs,
                acsSendMs,
                signalrPublishMs,
                totalSw.ElapsedMilliseconds);

            sent.ComplianceState = complianceState;
            return Ok(sent);
        }
        catch (Exception ex)
        {
            totalSw.Stop();
            logger.LogWarning(
                ex,
                "chat.send failed tenantId={TenantId} threadId={ThreadId} sender={SenderEntraUserId} totalMs={TotalMs}",
                tenantId,
                request.ThreadId,
                senderEntraUserId,
                totalSw.ElapsedMilliseconds);
            return ToErrorResult(ex);
        }
    }

    [HttpPost("chat/threads/{threadId}/leave")]
    public async Task<IActionResult> LeaveThread([FromRoute] string threadId, [FromQuery] string? tenantId = null, CancellationToken ct = default)
    {
        var resolvedTenantId = tenantId ?? GetCallerTenant();
        if (string.IsNullOrWhiteSpace(resolvedTenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        if (!HasTenantAccess(resolvedTenantId))
        {
            return Forbid();
        }

        var callerOid = GetCallerOid();
        if (string.IsNullOrWhiteSpace(callerOid))
        {
            return Forbid();
        }

        var participant = await indexRepository.GetThreadParticipantAsync(resolvedTenantId, threadId, callerOid, ct);
        if (participant is null)
        {
            return NotFound(new { error = "Current user is not a participant in this thread." });
        }

        var metadata = await indexRepository.GetThreadMetadataAsync(resolvedTenantId, threadId, ct);
        var isCreator = !string.IsNullOrWhiteSpace(metadata?.CreatedByEntraUserId)
            && string.Equals(metadata.CreatedByEntraUserId, callerOid, StringComparison.OrdinalIgnoreCase);

        // Backward-compatible fallback for threads created before metadata ownership existed.
        if (!isCreator && metadata is null)
        {
            isCreator = string.Equals(participant.Role, "Creator", StringComparison.OrdinalIgnoreCase);
        }

        if (isCreator)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { error = "Thread creator cannot leave the thread. Delete the thread instead." });
        }

        await indexRepository.DeleteThreadParticipantAsync(resolvedTenantId, threadId, callerOid, ct);
        await indexRepository.DeleteUserThreadIndexEntryAsync(resolvedTenantId, callerOid, threadId, ct);

        var remainingParticipants = await indexRepository.GetThreadParticipantsAsync(resolvedTenantId, threadId, ct);
        if (remainingParticipants.Count == 0)
        {
            var token = await ResolveTokenForEntraUserAsync(
                resolvedTenantId,
                callerOid,
                participant.AcsUserId,
                ct);

            if (!string.IsNullOrWhiteSpace(token))
            {
                try
                {
                    await chatService.DeleteChatThreadAsync(token, threadId, ct);
                }
                catch
                {
                    // Keep table/index cleanup as source of truth for current user.
                }
            }

            await indexRepository.DeleteThreadMetadataAsync(resolvedTenantId, threadId, ct);
        }

        await threadsHub.Clients
            .Group(ThreadsHub.GroupForThread(threadId))
            .SendAsync("threadLeft", new { threadId, entraUserId = callerOid }, ct);

        return NoContent();
    }

    [HttpDelete("chat/threads/{threadId}")]
    public async Task<IActionResult> DeleteThread([FromRoute] string threadId, [FromQuery] string? tenantId = null, CancellationToken ct = default)
    {
        var resolvedTenantId = tenantId ?? GetCallerTenant();
        if (string.IsNullOrWhiteSpace(resolvedTenantId))
        {
            return BadRequest(new { error = "tenantId is required." });
        }

        if (!HasTenantAccess(resolvedTenantId))
        {
            return Forbid();
        }

        var callerOid = GetCallerOid();
        if (string.IsNullOrWhiteSpace(callerOid))
        {
            return Forbid();
        }

        var participants = await indexRepository.GetThreadParticipantsAsync(resolvedTenantId, threadId, ct);
        var callerParticipant = participants.FirstOrDefault(participant =>
            string.Equals(participant.EntraUserId, callerOid, StringComparison.OrdinalIgnoreCase));
        if (callerParticipant is null)
        {
            return Forbid();
        }

        var metadata = await indexRepository.GetThreadMetadataAsync(resolvedTenantId, threadId, ct);
        var isCreator = !string.IsNullOrWhiteSpace(metadata?.CreatedByEntraUserId)
            && string.Equals(metadata.CreatedByEntraUserId, callerOid, StringComparison.OrdinalIgnoreCase);

        // Backward-compatible fallback for threads created before metadata ownership existed.
        if (!isCreator && metadata is null)
        {
            isCreator = string.Equals(callerParticipant.Role, "Creator", StringComparison.OrdinalIgnoreCase);
        }

        if (!isCreator)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only the thread creator can delete this thread. Participants can leave the thread." });
        }

        var token = await ResolveTokenForThreadActorAsync(resolvedTenantId, threadId, callerOid, ct);
        if (string.IsNullOrWhiteSpace(token))
        {
            var fallback = participants.FirstOrDefault(participant =>
                !string.IsNullOrWhiteSpace(participant.AcsUserId));
            if (fallback is null)
            {
                return NotFound(new { error = "Thread participants were not found." });
            }

            token = await ResolveTokenForEntraUserAsync(
                resolvedTenantId,
                fallback.EntraUserId,
                fallback.AcsUserId,
                ct);
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return Forbid();
        }

        await chatService.DeleteChatThreadAsync(token, threadId, ct);

        foreach (var participant in participants)
        {
            await indexRepository.DeleteUserThreadIndexEntryAsync(
                resolvedTenantId,
                participant.EntraUserId,
                threadId,
                ct);
            await indexRepository.DeleteThreadParticipantAsync(
                resolvedTenantId,
                threadId,
                participant.EntraUserId,
                ct);
        }
        await indexRepository.DeleteThreadMetadataAsync(resolvedTenantId, threadId, ct);

        await threadsHub.Clients
            .Group(ThreadsHub.GroupForThread(threadId))
            .SendAsync("threadDeleted", new { threadId, deletedBy = callerOid }, ct);

        return NoContent();
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
            var tenantId = GetCallerTenant();
            var callerOid = GetCallerOid();
            if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(callerOid))
            {
                return Forbid();
            }

            token = await ResolveTokenForThreadActorAsync(tenantId, threadId, callerOid, ct);
            if (string.IsNullOrWhiteSpace(token))
            {
                return Forbid();
            }
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

    private string? GetCallerTenant()
    {
        return User.FindFirstValue("tid")
            ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/tenantid");
    }

    private string? GetCallerOid()
    {
        return User.FindFirstValue("oid")
            ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
            ?? User.FindFirstValue("sub");
    }

    private async Task<string?> ResolveTokenForThreadActorAsync(string tenantId, string threadId, string entraUserId, CancellationToken ct)
    {
        string? acsUserId = null;

        var participant = await indexRepository.GetThreadParticipantAsync(tenantId, threadId, entraUserId, ct);
        if (!string.IsNullOrWhiteSpace(participant?.AcsUserId))
        {
            acsUserId = participant.AcsUserId;
            await indexRepository.UpsertUserIdentityMapAsync(tenantId, entraUserId, acsUserId, ct);
        }
        else
        {
            var mapped = await indexRepository.GetUserIdentityMapAsync(tenantId, entraUserId, ct);
            acsUserId = mapped?.AcsUserId;
        }

        if (string.IsNullOrWhiteSpace(acsUserId))
        {
            return null;
        }

        return await ResolveTokenForEntraUserAsync(tenantId, entraUserId, acsUserId, ct);
    }

    private async Task<string?> ResolveOrCreateAcsUserIdForEntraAsync(string tenantId, string entraUserId, CancellationToken ct)
    {
        var mapped = await indexRepository.GetUserIdentityMapAsync(tenantId, entraUserId, ct);
        if (!string.IsNullOrWhiteSpace(mapped?.AcsUserId))
        {
            return mapped.AcsUserId;
        }

        var created = await chatService.IssueTokenAsync(new IssueTokenRequest
        {
            UserId = null,
            IncludeVoip = false,
            TenantId = tenantId,
            EntraUserId = entraUserId
        }, ct);

        if (string.IsNullOrWhiteSpace(created.UserId))
        {
            return null;
        }

        await indexRepository.UpsertUserIdentityMapAsync(tenantId, entraUserId, created.UserId, ct);
        return created.UserId;
    }

    private async Task<string?> ResolveTokenForEntraUserAsync(string tenantId, string entraUserId, string acsUserId, CancellationToken ct)
    {
        return await tokenCache.GetTokenAsync(
            tenantId,
            entraUserId,
            acsUserId,
            async tokenCt => await chatService.IssueTokenAsync(new IssueTokenRequest
            {
                UserId = acsUserId,
                IncludeVoip = false,
                TenantId = tenantId,
                EntraUserId = entraUserId
            }, tokenCt),
            ct);
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

        if (IsPrivilegedCaller())
        {
            return true;
        }

        var callerTenant = GetCallerTenant();
        return !string.IsNullOrWhiteSpace(callerTenant)
            && string.Equals(callerTenant, tenantId, StringComparison.OrdinalIgnoreCase);
    }

    private bool HasUserAccess(string? entraUserId)
    {
        if (string.IsNullOrWhiteSpace(entraUserId))
        {
            return true;
        }

        if (IsPrivilegedCaller())
        {
            return true;
        }

        var callerOid = GetCallerOid();
        return !string.IsNullOrWhiteSpace(callerOid)
            && string.Equals(callerOid, entraUserId, StringComparison.OrdinalIgnoreCase);
    }

    private bool IsAdmin()
    {
        var roleClaims = User.FindAll("roles").Select(c => c.Value)
            .Concat(User.FindAll(ClaimTypes.Role).Select(c => c.Value));
        return roleClaims.Any(role => string.Equals(role, "Voxten.Admin", StringComparison.OrdinalIgnoreCase));
    }

    private bool IsPrivilegedCaller()
    {
        if (IsAdmin())
        {
            return true;
        }

        var roles = User.FindAll("roles").Select(c => c.Value)
            .Concat(User.FindAll(ClaimTypes.Role).Select(c => c.Value));
        if (roles.Any(role =>
            string.Equals(role, "Voxten.Security", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Voxten.Compliance", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        var scopeClaim = User.FindFirstValue("scp") ?? string.Empty;
        var scopes = scopeClaim
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return scopes.Contains("Governance.Write", StringComparer.OrdinalIgnoreCase)
            || scopes.Contains("ACS.Access", StringComparer.OrdinalIgnoreCase);
    }
}
