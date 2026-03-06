# Voxten.PortalApi

ASP.NET Core Web API backend for Voxten Portal, with Azure Key Vault-backed configuration.

## Features

- .NET 10 Web API (`services/Voxten.PortalApi`)
- Key Vault configuration provider (managed identity or client secret)
- Health endpoints:
  - `GET /healthz`
  - `GET /api/system/health`
  - `GET /api/system/config`

## Key Vault setup

Set these values via environment variables or `appsettings.*.json`:

- `KeyVault__Uri=https://<vault-name>.vault.azure.net/`
- `KeyVault__TenantId=<tenant-id>` (optional for local service principal)
- `KeyVault__ClientId=<client-id>` (optional for local service principal)
- `KeyVault__ClientSecret=<client-secret>` (optional for local service principal)

If `TenantId/ClientId/ClientSecret` are not provided, the API uses `DefaultAzureCredential` (managed identity in Azure).

## Secret naming

The provider maps `--` to `:` in keys. For example:

- Key Vault secret name: `PortalApi--DemoSecret`
- Configuration key: `PortalApi:DemoSecret`

You can verify load state at `GET /api/system/config`.

## Run locally

```bash
cd services/Voxten.PortalApi
DOTNET_CLI_HOME=/tmp dotnet restore
DOTNET_CLI_HOME=/tmp dotnet run
```

## Notes

This environment may block outbound package restore to NuGet. If so, run restore/build on a machine with internet access.
