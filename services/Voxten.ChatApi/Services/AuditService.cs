using System.Security.Cryptography;
using System.Text;
using Voxten.ChatApi.Models;

namespace Voxten.ChatApi.Services;

public sealed class AuditService
{
    public AuditRecord Build(ProcessCommunicationRequest request, ComplianceResult compliance)
    {
        var mode = ResolveMode();

        var audit = new AuditRecord
        {
            AuditId = $"audit-{Guid.NewGuid()}",
            Timestamp = DateTimeOffset.UtcNow.ToString("O"),
            ConversationId = request.ConversationId,
            ThreadId = request.ThreadId,
            SenderId = request.SenderId,
            Channel = request.Channel,
            Verdict = compliance.Verdict,
            Findings = compliance.Findings,
            PolicyPackVersion = compliance.PolicyPackVersion,
            MessageHash = Sha256(request.Message),
            ProcessedMessageHash = Sha256(compliance.ProcessedMessage),
            ContentMode = mode
        };

        if (mode == "store_redacted")
        {
            audit.StoredContent = new StoredContent { ProcessedMessage = compliance.ProcessedMessage };
        }
        else if (mode == "store_full")
        {
            audit.StoredContent = new StoredContent
            {
                OriginalMessage = request.Message,
                ProcessedMessage = compliance.ProcessedMessage
            };
        }

        return audit;
    }

    private static string ResolveMode()
    {
        var raw = Environment.GetEnvironmentVariable("AUDIT_CONTENT_MODE")?.ToLowerInvariant();
        return raw is "store_redacted" or "store_full" ? raw : "metadata_only";
    }

    private static string Sha256(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
