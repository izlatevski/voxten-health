using System.Text;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Voxten.ComplianceApi.Storage;

public sealed class BlobMessageContentStore : IMessageContentStore
{
    private const string ContainerName = "compliance-messages";

    private readonly BlobContainerClient _container;
    private readonly ILogger<BlobMessageContentStore> _logger;

    public BlobMessageContentStore(
        BlobServiceClient blobServiceClient,
        ILogger<BlobMessageContentStore> logger)
    {
        _container = blobServiceClient.GetBlobContainerClient(ContainerName);
        _logger = logger;
    }

    /// <summary>Called once at startup to ensure the container exists.</summary>
    public async Task EnsureContainerAsync(CancellationToken ct = default)
    {
        await _container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: ct);
        _logger.LogInformation("Blob container '{Container}' ready", ContainerName);
    }

    /// <inheritdoc />
    public async Task<string> WriteAsync(Guid messageId, string content, CancellationToken ct)
    {
        var blobName = $"messages/{messageId:N}";
        var blob = _container.GetBlobClient(blobName);

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        await blob.UploadAsync(stream, overwrite: false, ct);

        _logger.LogDebug("Wrote content blob {BlobName} ({Bytes} bytes)", blobName, stream.Length);
        return blobName;
    }

    /// <inheritdoc />
    public async Task<string?> ReadAsync(string blobRef, CancellationToken ct)
    {
        try
        {
            var blob = _container.GetBlobClient(blobRef);
            var response = await blob.DownloadContentAsync(ct);
            return response.Value.Content.ToString();
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }
}
