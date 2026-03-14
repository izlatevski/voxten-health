using Azure;
using Azure.Data.Tables;

namespace Voxten.CommunicationsApi.Data;

public sealed class UserIdentityMapEntity : ITableEntity
{
    public string PartitionKey { get; set; } = string.Empty; // tenantId
    public string RowKey { get; set; } = string.Empty; // entraUserId
    public string AcsUserId { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}

public sealed class UserThreadIndexEntity : ITableEntity
{
    public string PartitionKey { get; set; } = string.Empty; // tenantId|entraUserId
    public string RowKey { get; set; } = string.Empty; // threadId
    public string ThreadId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string LastMessagePreview { get; set; } = string.Empty;
    public DateTimeOffset LastMessageAtUtc { get; set; }
    public int UnreadCount { get; set; }
    public string Status { get; set; } = "active";
    public string ComplianceState { get; set; } = "unknown";
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}

public sealed class ThreadParticipantEntity : ITableEntity
{
    public string PartitionKey { get; set; } = string.Empty; // tenantId|threadId
    public string RowKey { get; set; } = string.Empty; // entraUserId
    public string EntraUserId { get; set; } = string.Empty;
    public string AcsUserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTimeOffset JoinedUtc { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}

public sealed class ThreadMetadataEntity : ITableEntity
{
    public string PartitionKey { get; set; } = string.Empty; // tenantId
    public string RowKey { get; set; } = string.Empty; // threadId
    public string ThreadId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string CreatedByEntraUserId { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}

public sealed class ThreadMessageMetadataEntity : ITableEntity
{
    public string PartitionKey { get; set; } = string.Empty; // tenantId|threadId
    public string RowKey { get; set; } = string.Empty; // messageId
    public string ThreadId { get; set; } = string.Empty;
    public string MessageId { get; set; } = string.Empty;
    public string MessageType { get; set; } = "message";
    public string Content { get; set; } = string.Empty;
    public string ComplianceState { get; set; } = "unknown";
    public string AuditId { get; set; } = string.Empty;
    public string SenderEntraUserId { get; set; } = string.Empty;
    public string SenderDisplayName { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}
