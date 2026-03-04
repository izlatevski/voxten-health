# Voxten Chat API (.NET Azure Function)

Azure Function (C# .NET isolated worker) that evaluates outbound communication for HIPAA/HITRUST policy checks before optional dispatch to Azure Communication Services (ACS).

## Endpoint

- `POST /api/messages/evaluate-and-send`

## Processing flow

1. Validate request payload.
2. Run deterministic compliance checks.
3. Optionally refine with Azure AI Foundry (if env vars are set).
4. If verdict is not blocked, attempt ACS dispatch.
5. Return verdict, findings, dispatch result, and audit record.

## Request body

```json
{
  "senderId": "user-123",
  "senderDisplayName": "Dr. Rivera",
  "senderToken": "<acs-user-token>",
  "conversationId": "conv-001",
  "threadId": "19:abc...",
  "channel": "chat",
  "message": "Patient MRN 38291 needs follow-up. Call me at 555-222-1234"
}
```

## Local setup

1. Copy `local.settings.sample.json` to `local.settings.json`.
2. Populate `ACS_ENDPOINT` and optional AI Foundry values.
3. Restore/build/run:

```bash
dotnet restore
dotnet build
```

If Azure Functions Core Tools is installed, run with:

```bash
func start
```

## Notes

- `AUDIT_CONTENT_MODE` supports:
  - `metadata_only` (default)
  - `store_redacted`
  - `store_full`
- For production, persist audits to durable storage and add APIM + Entra auth.
