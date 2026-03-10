using System.Net.Http.Json;

namespace Voxten.CommunicationsApi.Compliance;

/// <summary>
/// Typed HTTP client for the ComplianceApi evaluation endpoint.
/// Fails open — if ComplianceApi is unavailable the message is allowed through
/// and the failure is logged so ops can alert on it.
/// </summary>
public sealed class ComplianceClient(HttpClient httpClient, ILogger<ComplianceClient> logger)
{
    /// <returns>
    /// Evaluation result, or <c>null</c> when ComplianceApi is unreachable (fail-open).
    /// </returns>
    public async Task<ComplianceEvaluationResult?> EvaluateAsync(
        ComplianceEvaluationRequest request,
        CancellationToken ct)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync("/api/compliance/evaluate", request, ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "ComplianceApi returned {Status} for message {MessageId} — failing open",
                    response.StatusCode,
                    request.MessageId);
                return null;
            }

            return await response.Content.ReadFromJsonAsync<ComplianceEvaluationResult>(
                cancellationToken: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "ComplianceApi evaluation failed for message {MessageId} — failing open",
                request.MessageId);
            return null;
        }
    }
}
