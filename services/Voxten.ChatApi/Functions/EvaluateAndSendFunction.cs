using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Voxten.ChatApi.Models;
using Voxten.ChatApi.Services;

namespace Voxten.ChatApi.Functions;

public sealed class EvaluateAndSendFunction(
    ComplianceService complianceService,
    AiFoundryService aiFoundryService,
    AcsDispatchService acsDispatchService,
    AuditService auditService,
    ILogger<EvaluateAndSendFunction> logger)
{

    [Function("evaluate-and-send")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "messages/evaluate-and-send")]
        HttpRequestData req,
        FunctionContext executionContext)
    {
        ProcessCommunicationRequest? body;

        try
        {
            body = await JsonSerializer.DeserializeAsync<ProcessCommunicationRequest>(req.Body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }, executionContext.CancellationToken);
        }
        catch
        {
            return await WriteError(req, HttpStatusCode.BadRequest, "Invalid JSON payload.");
        }

        var validationError = Validate(body);
        if (validationError is not null)
        {
            return await WriteError(req, HttpStatusCode.BadRequest, validationError);
        }

        var input = body!;

        var compliance = complianceService.Evaluate(input);

        try
        {
            var refined = await aiFoundryService.RefineAsync(input, compliance, executionContext.CancellationToken);
            if (refined is not null)
            {
                compliance = refined;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "AI Foundry refinement failed. Falling back to deterministic result.");
        }

        DispatchResult dispatch;
        if (compliance.Verdict == ComplianceVerdict.Blocked)
        {
            dispatch = new DispatchResult
            {
                Sent = false,
                Skipped = true,
                Reason = "Blocked by compliance policy."
            };
        }
        else
        {
            try
            {
                dispatch = await acsDispatchService.SendAsync(input, compliance.ProcessedMessage, executionContext.CancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ACS dispatch failed.");
                dispatch = new DispatchResult
                {
                    Sent = false,
                    Skipped = false,
                    Reason = "ACS dispatch failed."
                };
            }
        }

        var audit = auditService.Build(input, compliance);

        var responsePayload = new ProcessCommunicationResponse
        {
            Verdict = compliance.Verdict,
            Message = new MessagePayload
            {
                Original = input.Message,
                Processed = compliance.ProcessedMessage
            },
            Findings = compliance.Findings,
            Dispatch = dispatch,
            Audit = audit
        };

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(responsePayload, executionContext.CancellationToken);
        return response;
    }

    private static string? Validate(ProcessCommunicationRequest? request)
    {
        if (request is null)
        {
            return "Body is required.";
        }

        if (string.IsNullOrWhiteSpace(request.SenderId))
        {
            return "senderId is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return "message is required.";
        }

        if (!string.Equals(request.Channel, "chat", StringComparison.OrdinalIgnoreCase))
        {
            return "channel must be 'chat'.";
        }

        return null;
    }

    private static async Task<HttpResponseData> WriteError(HttpRequestData req, HttpStatusCode status, string message)
    {
        var response = req.CreateResponse(status);
        await response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
