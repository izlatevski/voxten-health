using System.Net.Http.Headers;
using System.Text.Json;
using Azure.Core;
using Azure.Identity;
using Voxten.PortalApi.Models;

namespace Voxten.PortalApi.Services;

public sealed class EntraGraphService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
{

    public async Task<IReadOnlyList<EntraUserSummary>> SearchUsersAsync(string query, int top, CancellationToken ct)
    {
        var tenantId = Required("Authentication:TenantId");
        var clientId = Required("Authentication:ClientId");
        var clientSecret = Required("Authentication:Secret");
        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

        var token = await credential.GetTokenAsync(
            new TokenRequestContext(["https://graph.microsoft.com/.default"]),
            ct);

        var escaped = EscapeODataLiteral(query.Trim());
        var filter = $"startswith(displayName,'{escaped}') or startswith(userPrincipalName,'{escaped}') or startswith(mail,'{escaped}')";
        var graphBase = configuration["Graph:BaseUrl"] ?? "https://graph.microsoft.com/v1.0";
        var requestUri = $"{graphBase.TrimEnd('/')}/users?$select=id,displayName,mail,userPrincipalName,jobTitle&$top={Math.Clamp(top, 1, 50)}&$filter={Uri.EscapeDataString(filter)}";

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.Token);

        var client = httpClientFactory.CreateClient();
        using var response = await client.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Graph user search failed: {(int)response.StatusCode} {body}");
        }

        var parsed = JsonSerializer.Deserialize<GraphUsersResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return parsed?.Value
            ?.Where(u => !string.IsNullOrWhiteSpace(u.Id))
            .Select(u => new EntraUserSummary
            {
                Id = u.Id!,
                DisplayName = u.DisplayName ?? u.UserPrincipalName ?? u.Mail ?? "Unknown User",
                Mail = u.Mail,
                UserPrincipalName = u.UserPrincipalName,
                JobTitle = u.JobTitle
            })
            .ToList() ?? [];
    }

    private string Required(string key)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value) ? 
            throw new InvalidOperationException($"Missing required configuration: {key}") : value;
    }

    private static string EscapeODataLiteral(string value) => value.Replace("'", "''", StringComparison.Ordinal);

    private sealed class GraphUsersResponse
    {
        public List<GraphUser>? Value { get; set; }
    }

    private sealed class GraphUser
    {
        public string? Id { get; set; }
        public string? DisplayName { get; set; }
        public string? Mail { get; set; }
        public string? UserPrincipalName { get; set; }
        public string? JobTitle { get; set; }
    }
}
