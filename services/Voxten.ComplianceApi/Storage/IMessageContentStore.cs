namespace Voxten.ComplianceApi.Storage;

public interface IMessageContentStore
{
    /// <summary>
    /// Writes message content to durable storage and returns the blob reference
    /// to be persisted in <see cref="Voxten.Compliance.Data.Models.Pipeline.CanonicalMessage.ContentBlobRef"/>.
    /// </summary>
    Task<string> WriteAsync(Guid messageId, string content, CancellationToken ct);

    /// <summary>
    /// Reads message content from the given blob reference.
    /// Returns <c>null</c> if the blob does not exist.
    /// </summary>
    Task<string?> ReadAsync(string blobRef, CancellationToken ct);
}
