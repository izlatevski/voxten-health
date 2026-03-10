namespace Voxten.ComplianceApi.Storage;

public interface IMessageContentStore
{
    /// <summary>
    /// Writes message content to durable storage and returns the blob reference
    /// to be persisted in <see cref="Voxten.Compliance.Data.Models.Pipeline.CanonicalMessage.ContentBlobRef"/>.
    /// </summary>
    Task<string> WriteAsync(Guid messageId, string content, CancellationToken ct);
}
