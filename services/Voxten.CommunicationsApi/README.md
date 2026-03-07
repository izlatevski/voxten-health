# Voxten Communications API (.NET Web API)

ASP.NET Core Web API for Azure Communication Services (ACS) messaging operations plus Table Storage indexes for portal queries.

## Endpoints

- `POST /api/chat/tokens` issue token for a new or existing ACS user
- `GET /api/chat/threads` list threads from ACS for bearer token user
- `POST /api/chat/threads` create thread in ACS and index participants/threads in Table Storage
- `POST /api/chat/messages` send chat message in ACS and update user-thread index metadata
- `POST /api/sms/messages` send SMS message

- `POST /api/mappings/users` upsert Entra -> ACS user mapping
- `GET /api/mappings/users/{entraUserId}?tenantId=...` get Entra -> ACS user mapping
- `GET /api/users/{entraUserId}/threads?tenantId=...&pageSize=...` get indexed thread list for left navigation
- `GET /api/threads/{threadId}/participants?tenantId=...` get thread participants from index

- `GET /healthz` health check

## Table Storage model

- `UserIdentityMap`: `PartitionKey = tenantId`, `RowKey = entraUserId`
- `UserThreadIndex`: `PartitionKey = tenantId|entraUserId`, `RowKey = threadId`
- `ThreadParticipants`: `PartitionKey = tenantId|threadId`, `RowKey = entraUserId`

## Configuration

Set the following values via environment variables, user-secrets, appsettings, or Key Vault-backed configuration:

- `ACS_ENDPOINT`
- `ACS_CONNECTION_STRING`
- `Storage:TableServiceUri` (preferred in Azure with Managed Identity), for example `https://<account>.table.core.windows.net`
- `Storage:ManagedIdentityClientId` (optional; only for user-assigned managed identity)
- `Storage:ConnectionString` (fallback for local/dev; or `AZURE_TABLES_CONNECTION_STRING` / `AzureWebJobsStorage`)
- `Storage:UserIdentityTableName` (optional, default `UserIdentityMap`)
- `Storage:UserThreadIndexTableName` (optional, default `UserThreadIndex`)
- `Storage:ThreadParticipantsTableName` (optional, default `ThreadParticipants`)
- `Storage:ThreadMetadataTableName` (optional, default `ThreadMetadata`)
- `KeyVault:Uri` (optional)
- `Authentication:TenantId` (optional)
- `Authentication:ClientId` (optional)
- `Authentication:Secret` (optional)

## Local run

```bash
dotnet restore
dotnet run --project /Users/ivanz/Workspace/RnD/voxten-health/services/Voxten.CommunicationsApi/Voxten.CommunicationsApi.csproj
```
