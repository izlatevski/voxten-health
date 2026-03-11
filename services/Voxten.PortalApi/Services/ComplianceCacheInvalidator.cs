namespace Voxten.PortalApi.Services;

// Notifies ComplianceApi to reload its rule cache whenever rules/packs/policies change.
// Fire-and-forget with error logging — a stale cache is acceptable; the next rule change will re-sync.
public class ComplianceCacheInvalidator(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<ComplianceCacheInvalidator> logger)
{
    public async Task InvalidateAsync(CancellationToken ct = default)
    {
        var baseUrl = config["ComplianceApi:BaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            logger.LogWarning("ComplianceApi:BaseUrl not configured — skipping cache invalidation");
            return;
        }

        try
        {
            var client = httpClientFactory.CreateClient("ComplianceApi");
            var response = await client.PostAsync($"{baseUrl}/api/compliance/cache/invalidate", null, ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Cache invalidation returned {StatusCode}", response.StatusCode);
            }
            else
            {
                logger.LogInformation("Compliance rule cache invalidated successfully");
            }
        }
        catch (Exception ex)
        {
            // Non-fatal — ComplianceApi will use its current cache until the next invalidation
            logger.LogError(ex, "Failed to invalidate compliance rule cache");
        }
    }
}
