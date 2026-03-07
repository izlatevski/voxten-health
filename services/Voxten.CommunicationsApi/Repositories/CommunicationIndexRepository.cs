using Azure;
using Azure.Core;
using Azure.Data.Tables;
using Azure.Identity;
using Voxten.CommunicationsApi.Data;
using Voxten.CommunicationsApi.Models;

namespace Voxten.CommunicationsApi.Repositories;

public sealed class CommunicationIndexRepository(IConfiguration configuration)
{
    private readonly TableClient _userIdentityMapTable = BuildTableClient(configuration, "Storage:UserIdentityTableName", "UserIdentityMap");
    private readonly TableClient _userThreadIndexTable = BuildTableClient(configuration, "Storage:UserThreadIndexTableName", "UserThreadIndex");
    private readonly TableClient _threadParticipantsTable = BuildTableClient(configuration, "Storage:ThreadParticipantsTableName", "ThreadParticipants");
    private readonly TableClient _threadMetadataTable = BuildTableClient(configuration, "Storage:ThreadMetadataTableName", "ThreadMetadata");

    public async Task EnsureTablesAsync(CancellationToken ct)
    {
        await _userIdentityMapTable.CreateIfNotExistsAsync(ct);
        await _userThreadIndexTable.CreateIfNotExistsAsync(ct);
        await _threadParticipantsTable.CreateIfNotExistsAsync(ct);
        await _threadMetadataTable.CreateIfNotExistsAsync(ct);
    }

    public async Task UpsertUserIdentityMapAsync(string tenantId, string entraUserId, string acsUserId, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        UserIdentityMapEntity entity;

        try
        {
            var existing = await _userIdentityMapTable.GetEntityAsync<UserIdentityMapEntity>(tenantId, entraUserId, cancellationToken: ct);
            entity = existing.Value;
            entity.AcsUserId = acsUserId;
            entity.UpdatedUtc = now;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            entity = new UserIdentityMapEntity
            {
                PartitionKey = tenantId,
                RowKey = entraUserId,
                AcsUserId = acsUserId,
                CreatedUtc = now,
                UpdatedUtc = now
            };
        }

        await _userIdentityMapTable.UpsertEntityAsync(entity, TableUpdateMode.Replace, ct);
    }

    public async Task<UserIdentityMap?> GetUserIdentityMapAsync(string tenantId, string entraUserId, CancellationToken ct)
    {
        try
        {
            var response = await _userIdentityMapTable.GetEntityAsync<UserIdentityMapEntity>(tenantId, entraUserId, cancellationToken: ct);
            return new UserIdentityMap
            {
                TenantId = response.Value.PartitionKey,
                EntraUserId = response.Value.RowKey,
                AcsUserId = response.Value.AcsUserId,
                CreatedUtc = response.Value.CreatedUtc,
                UpdatedUtc = response.Value.UpdatedUtc
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task UpsertThreadParticipantsAsync(string tenantId, string threadId, IEnumerable<ThreadParticipantInput> participants, CancellationToken ct)
    {
        var partitionKey = BuildThreadParticipantsPartitionKey(tenantId, threadId);
        var now = DateTimeOffset.UtcNow;

        foreach (var participant in participants.Where(p => !string.IsNullOrWhiteSpace(p.EntraUserId)))
        {
            var entity = new ThreadParticipantEntity
            {
                PartitionKey = partitionKey,
                RowKey = participant.EntraUserId!,
                EntraUserId = participant.EntraUserId!,
                AcsUserId = participant.CommunicationUserId ?? string.Empty,
                DisplayName = participant.DisplayName ?? string.Empty,
                Role = participant.Role ?? string.Empty,
                JoinedUtc = now
            };

            await _threadParticipantsTable.UpsertEntityAsync(entity, TableUpdateMode.Merge, ct);
        }
    }

    public async Task<IReadOnlyList<ThreadParticipantModel>> GetThreadParticipantsAsync(string tenantId, string threadId, CancellationToken ct)
    {
        var partitionKey = BuildThreadParticipantsPartitionKey(tenantId, threadId);
        var filter = $"PartitionKey eq '{EscapeTableFilterValue(partitionKey)}'";

        var items = new List<ThreadParticipantModel>();
        await foreach (var entity in _threadParticipantsTable.QueryAsync<ThreadParticipantEntity>(filter: filter, cancellationToken: ct))
        {
            items.Add(new ThreadParticipantModel
            {
                EntraUserId = entity.EntraUserId,
                AcsUserId = entity.AcsUserId,
                DisplayName = entity.DisplayName,
                Role = entity.Role,
                JoinedUtc = entity.JoinedUtc
            });
        }

        return items;
    }

    public async Task<ThreadParticipantModel?> GetThreadParticipantAsync(string tenantId, string threadId, string entraUserId, CancellationToken ct)
    {
        var partitionKey = BuildThreadParticipantsPartitionKey(tenantId, threadId);

        try
        {
            var response = await _threadParticipantsTable.GetEntityAsync<ThreadParticipantEntity>(
                partitionKey,
                entraUserId,
                cancellationToken: ct);

            var entity = response.Value;
            return new ThreadParticipantModel
            {
                EntraUserId = entity.EntraUserId,
                AcsUserId = entity.AcsUserId,
                DisplayName = entity.DisplayName,
                Role = entity.Role,
                JoinedUtc = entity.JoinedUtc
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task UpsertUserThreadIndexEntriesAsync(string tenantId, string threadId, string topic, string lastMessagePreview, DateTimeOffset lastMessageAtUtc, string? senderEntraUserId, string complianceState, CancellationToken ct)
    {
        var participants = await GetThreadParticipantsAsync(tenantId, threadId, ct);
        foreach (var participant in participants)
        {
            var partitionKey = BuildUserThreadsPartitionKey(tenantId, participant.EntraUserId);
            UserThreadIndexEntity entity;

            try
            {
                var existing = await _userThreadIndexTable.GetEntityAsync<UserThreadIndexEntity>(partitionKey, threadId, cancellationToken: ct);
                entity = existing.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                entity = new UserThreadIndexEntity
                {
                    PartitionKey = partitionKey,
                    RowKey = threadId,
                    ThreadId = threadId,
                    Topic = topic,
                    Status = "active"
                };
            }

            if (!string.IsNullOrWhiteSpace(topic))
            {
                entity.Topic = topic;
            }
            entity.LastMessagePreview = lastMessagePreview;
            entity.LastMessageAtUtc = lastMessageAtUtc;
            entity.ComplianceState = complianceState;

            if (!string.IsNullOrWhiteSpace(senderEntraUserId) && !string.Equals(senderEntraUserId, participant.EntraUserId, StringComparison.Ordinal))
            {
                entity.UnreadCount += 1;
            }

            await _userThreadIndexTable.UpsertEntityAsync(entity, TableUpdateMode.Replace, ct);
        }
    }

    public async Task DeleteThreadParticipantAsync(string tenantId, string threadId, string entraUserId, CancellationToken ct)
    {
        var partitionKey = BuildThreadParticipantsPartitionKey(tenantId, threadId);
        try
        {
            await _threadParticipantsTable.DeleteEntityAsync(partitionKey, entraUserId, ETag.All, ct);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            // No-op for idempotency.
        }
    }

    public async Task DeleteUserThreadIndexEntryAsync(string tenantId, string entraUserId, string threadId, CancellationToken ct)
    {
        var partitionKey = BuildUserThreadsPartitionKey(tenantId, entraUserId);
        try
        {
            await _userThreadIndexTable.DeleteEntityAsync(partitionKey, threadId, ETag.All, ct);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            // No-op for idempotency.
        }
    }

    public async Task UpsertThreadMetadataAsync(string tenantId, string threadId, string topic, string createdByEntraUserId, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        ThreadMetadataEntity entity;
        try
        {
            var existing = await _threadMetadataTable.GetEntityAsync<ThreadMetadataEntity>(tenantId, threadId, cancellationToken: ct);
            entity = existing.Value;
            if (!string.IsNullOrWhiteSpace(topic))
            {
                entity.Topic = topic;
            }
            if (!string.IsNullOrWhiteSpace(createdByEntraUserId))
            {
                entity.CreatedByEntraUserId = createdByEntraUserId;
            }
            entity.UpdatedUtc = now;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            entity = new ThreadMetadataEntity
            {
                PartitionKey = tenantId,
                RowKey = threadId,
                ThreadId = threadId,
                Topic = topic,
                CreatedByEntraUserId = createdByEntraUserId,
                CreatedUtc = now,
                UpdatedUtc = now
            };
        }

        await _threadMetadataTable.UpsertEntityAsync(entity, TableUpdateMode.Replace, ct);
    }

    public async Task<ThreadMetadataModel?> GetThreadMetadataAsync(string tenantId, string threadId, CancellationToken ct)
    {
        try
        {
            var response = await _threadMetadataTable.GetEntityAsync<ThreadMetadataEntity>(tenantId, threadId, cancellationToken: ct);
            var entity = response.Value;
            return new ThreadMetadataModel
            {
                TenantId = entity.PartitionKey,
                ThreadId = entity.ThreadId,
                Topic = entity.Topic,
                CreatedByEntraUserId = entity.CreatedByEntraUserId,
                CreatedUtc = entity.CreatedUtc,
                UpdatedUtc = entity.UpdatedUtc
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task DeleteThreadMetadataAsync(string tenantId, string threadId, CancellationToken ct)
    {
        try
        {
            await _threadMetadataTable.DeleteEntityAsync(tenantId, threadId, ETag.All, ct);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            // No-op for idempotency.
        }
    }

    public async Task<IReadOnlyList<UserThreadIndexItem>> GetUserThreadIndexAsync(string tenantId, string entraUserId, int pageSize, CancellationToken ct)
    {
        var partitionKey = BuildUserThreadsPartitionKey(tenantId, entraUserId);
        var filter = $"PartitionKey eq '{EscapeTableFilterValue(partitionKey)}'";

        var items = new List<UserThreadIndexItem>();
        await foreach (var entity in _userThreadIndexTable.QueryAsync<UserThreadIndexEntity>(filter: filter, maxPerPage: pageSize, cancellationToken: ct))
        {
            items.Add(new UserThreadIndexItem
            {
                ThreadId = entity.ThreadId,
                Topic = entity.Topic,
                LastMessagePreview = entity.LastMessagePreview,
                LastMessageAtUtc = entity.LastMessageAtUtc,
                UnreadCount = entity.UnreadCount,
                Status = entity.Status,
                ComplianceState = entity.ComplianceState
            });

            if (items.Count >= pageSize)
            {
                break;
            }
        }

        return items
            .OrderByDescending(i => i.LastMessageAtUtc)
            .ToList();
    }

    public static string BuildUserThreadsPartitionKey(string tenantId, string entraUserId) => $"{tenantId}|{entraUserId}";
    public static string BuildThreadParticipantsPartitionKey(string tenantId, string threadId) => $"{tenantId}|{threadId}";

    private static string EscapeTableFilterValue(string value) => value.Replace("'", "''", StringComparison.Ordinal);

    private static TableClient BuildTableClient(IConfiguration configuration, string tableNameConfigKey, string defaultTableName)
    {
        var configuredTableName = configuration[tableNameConfigKey];
        var tableName = string.IsNullOrWhiteSpace(configuredTableName)
            ? defaultTableName
            : configuredTableName;
        var tableServiceUri = configuration["Storage:TableServiceUri"]
                              ?? configuration["AZURE_TABLES_SERVICE_URI"];

        if (!string.IsNullOrWhiteSpace(tableServiceUri))
        {
            if (!Uri.TryCreate(tableServiceUri, UriKind.Absolute, out var serviceUri))
            {
                throw new InvalidOperationException("Storage:TableServiceUri is not a valid absolute URI.");
            }

            return new TableClient(serviceUri, tableName, BuildStorageCredential(configuration));
        }

        var connectionString = configuration["Storage:ConnectionString"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Table storage is not configured. Set Storage:TableServiceUri for Managed Identity " +
                "(preferred in Azure), or Storage:ConnectionString for local fallback.");
        }

        return new TableClient(connectionString, tableName);
    }

    private static TokenCredential BuildStorageCredential(IConfiguration configuration)
    {
        var managedIdentityClientId = configuration["Storage:ManagedIdentityClientId"];
        return string.IsNullOrWhiteSpace(managedIdentityClientId)
            ? new DefaultAzureCredential()
            : new DefaultAzureCredential(new DefaultAzureCredentialOptions
            {
                ManagedIdentityClientId = managedIdentityClientId
            });
    }
}
