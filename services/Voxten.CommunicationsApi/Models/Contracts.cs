namespace Voxten.CommunicationsApi.Models;

public sealed class IssueTokenRequest
{
    public string? UserId { get; set; }
    public bool IncludeVoip { get; set; }
    public string? TenantId { get; set; }
    public string? EntraUserId { get; set; }
}

public sealed class IssueTokenResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresOn { get; set; }
}

public sealed class CreateThreadRequest
{
    public string? CreatorToken { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string? TenantId { get; set; }
    public List<ThreadParticipantInput> Participants { get; set; } = [];
}

public sealed class ThreadParticipantInput
{
    public string? CommunicationUserId { get; set; }
    public string? EntraUserId { get; set; }
    public string? DisplayName { get; set; }
    public string? Role { get; set; }
}

public sealed class CreateThreadResponse
{
    public string ThreadId { get; set; } = string.Empty;
}

public sealed class ChatThreadSummary
{
    public string Id { get; set; } = string.Empty;
    public string? Topic { get; set; }
}

public sealed class SendChatMessageRequest
{
    public string? SenderToken { get; set; }
    public string ThreadId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string? TenantId { get; set; }
    public string? SenderEntraUserId { get; set; }
    public string ComplianceState { get; set; } = "unknown";
}

public sealed class SendChatMessageResponse
{
    public string MessageId { get; set; } = string.Empty;
    public DateTimeOffset SentAt { get; set; }
    public string ComplianceState { get; set; } = "unknown";
}

public sealed class ChatThreadMessageItem
{
    public string Id { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string? SenderId { get; set; }
    public DateTimeOffset? CreatedOnUtc { get; set; }
}

public sealed class SendSmsRequest
{
    public string FromPhoneNumber { get; set; } = string.Empty;
    public string ToPhoneNumber { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool EnableDeliveryReport { get; set; } = true;
}

public sealed class SendSmsResponse
{
    public string MessageId { get; set; } = string.Empty;
    public bool Successful { get; set; }
}

public sealed class UserIdentityMap
{
    public string TenantId { get; set; } = string.Empty;
    public string EntraUserId { get; set; } = string.Empty;
    public string AcsUserId { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}

public sealed class UpsertUserIdentityMapRequest
{
    public string TenantId { get; set; } = string.Empty;
    public string EntraUserId { get; set; } = string.Empty;
    public string AcsUserId { get; set; } = string.Empty;
}

public sealed class UserThreadIndexItem
{
    public string ThreadId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string LastMessagePreview { get; set; } = string.Empty;
    public DateTimeOffset LastMessageAtUtc { get; set; }
    public int UnreadCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ComplianceState { get; set; } = string.Empty;
}

public sealed class ThreadParticipantModel
{
    public string EntraUserId { get; set; } = string.Empty;
    public string AcsUserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTimeOffset JoinedUtc { get; set; }
}

public sealed class ThreadMetadataModel
{
    public string TenantId { get; set; } = string.Empty;
    public string ThreadId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string CreatedByEntraUserId { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
