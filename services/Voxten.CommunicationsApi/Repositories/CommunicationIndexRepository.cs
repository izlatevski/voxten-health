using Azure;
using Azure.Data.Tables;
using Voxten.CommunicationsApi.Data;
using Voxten.CommunicationsApi.Models;

namespace Voxten.CommunicationsApi.Repositories;

public sealed class CommunicationIndexRepository(IConfiguration configuration)
{
    private readonly TableClient _userIdentityMapTable = BuildTableClient(configuration, "Storage:UserIdentityTableName", "UserIdentityMap");
    private readonly TableClient _userThreadIndexTable = BuildTableClient(configuration, "Storage:UserThreadIndexTableName", "UserThreadIndex");
    private readonly TableClient _threadParticipantsTable = BuildTableClient(configuration, "Storage:ThreadParticipantsTableName", "ThreadParticipants");

    public async Task EnsureTablesAsync(CancellationToken ct)
    {
        await _userIdentityMapTable.CreateIfNotExistsAsync(ct);
        await _userThreadIndexTable.CreateIfNotExistsAsync(ct);
        await _threadParticipantsTable.CreateIfNotExistsAsync(ct);
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
                AcsUserId = participant.CommunicationUserId,
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
        var connectionString = configuration["Storage:ConnectionString"]
                               ?? configuration["AZURE_TABLES_CONNECTION_STRING"]
                               ?? configuration["AzureWebJobsStorage"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Storage connection string is not configured. Use Storage:ConnectionString, AZURE_TABLES_CONNECTION_STRING, or AzureWebJobsStorage.");
        }

        var tableName = configuration[tableNameConfigKey] ?? defaultTableName;
        return new TableClient(connectionString, tableName);
    }
}
