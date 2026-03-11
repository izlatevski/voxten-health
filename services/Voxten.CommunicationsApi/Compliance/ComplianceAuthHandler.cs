using Azure.Core;
using System.Net.Http.Headers;

namespace Voxten.CommunicationsApi.Compliance;

/// <summary>
/// Attaches a service-to-service bearer token to outbound ComplianceApi calls.
/// Uses the injected <see cref="TokenCredential"/> (ClientSecretCredential in dev,
/// DefaultAzureCredential / Managed Identity in production).
/// Token acquisition is delegated to the Azure.Identity SDK which caches tokens
/// in-process and refreshes them before expiry.
/// </summary>
public sealed class ComplianceAuthHandler(
    TokenCredential credential,
    IConfiguration configuration,
    ILogger<ComplianceAuthHandler> logger) : DelegatingHandler
{
    private readonly string[] _scopes = [
        configuration["ComplianceApi:Scope"]
        ?? $"api://{configuration["Authentication:ClientId"]}/.default"
    ];

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        try
        {
            var token = await credential.GetTokenAsync(
                new TokenRequestContext(_scopes),
                cancellationToken);

            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", token.Token);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Failed to acquire ComplianceApi token — request will be sent unauthenticated (expect 401)");
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
