using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Voxten.ChatApi.Models;

namespace Voxten.ChatApi.Services;

public sealed class AiFoundryService(IHttpClientFactory httpClientFactory)
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;

    public async Task<ComplianceResult?> RefineAsync(ProcessCommunicationRequest request, ComplianceResult current, CancellationToken ct)
    {
        var endpoint = Environment.GetEnvironmentVariable("AI_FOUNDRY_ENDPOINT");
        var deployment = Environment.GetEnvironmentVariable("AI_FOUNDRY_DEPLOYMENT");
        var apiKey = Environment.GetEnvironmentVariable("AI_FOUNDRY_API_KEY");
        var apiVersion = Environment.GetEnvironmentVariable("AI_FOUNDRY_API_VERSION") ?? "2024-10-21";

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(deployment) || string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        var url = $"{endpoint.TrimEnd('/')}/openai/deployments/{deployment}/chat/completions?api-version={apiVersion}";
        var client = _httpClientFactory.CreateClient();

        var payload = new
        {
            messages = new object[]
            {
                new { role = "system", content = "You are a healthcare compliance engine. Return strict JSON with keys: verdict, processedMessage, findings." },
                new { role = "user", content = JsonSerializer.Serialize(new { request = request.Message, current }) }
            },
            temperature = 0,
            max_tokens = 700,
            response_format = new { type = "json_object" }
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Headers.Add("api-key", apiKey);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        using var response = await client.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var raw = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(raw);

        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        var refined = JsonSerializer.Deserialize<ComplianceResult>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (refined is null)
        {
            return null;
        }

        refined.Evaluator ??= new EvaluatorInfo();
        refined.Evaluator.DeterministicRules = true;
        refined.Evaluator.AiProvider = "azure-ai-foundry";
        refined.Evaluator.AiModel ??= deployment;
        refined.PolicyPackVersion = string.IsNullOrWhiteSpace(refined.PolicyPackVersion)
            ? current.PolicyPackVersion
            : refined.PolicyPackVersion;

        return refined;
    }
}
