using Azure.Communication;
using Azure.Communication.Chat;
using Voxten.ChatApi.Models;

namespace Voxten.ChatApi.Services;

public sealed class AcsDispatchService
{
    public async Task<DispatchResult> SendAsync(ProcessCommunicationRequest request, string processedMessage, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ThreadId))
        {
            return new DispatchResult { Sent = false, Skipped = true, Reason = "threadId was not provided." };
        }

        if (string.IsNullOrWhiteSpace(request.SenderToken))
        {
            return new DispatchResult { Sent = false, Skipped = true, Reason = "senderToken was not provided for ACS dispatch." };
        }

        var endpoint = Environment.GetEnvironmentVariable("ACS_ENDPOINT");
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return new DispatchResult { Sent = false, Skipped = true, Reason = "ACS_ENDPOINT is not configured." };
        }
 
        var chatClient = new ChatClient(new Uri(endpoint), new CommunicationTokenCredential(request.SenderToken));
        var threadClient = chatClient.GetChatThreadClient(request.ThreadId);

        var options = new SendChatMessageOptions
        {
            Content = processedMessage,
            SenderDisplayName = request.SenderDisplayName
        };

        var result = await threadClient.SendMessageAsync(options, ct);

        return new DispatchResult
        {
            Sent = true,
            Skipped = false,
            MessageId = result.Value.Id,
            SentAt = DateTimeOffset.UtcNow.ToString("O")
        };
    }
}
