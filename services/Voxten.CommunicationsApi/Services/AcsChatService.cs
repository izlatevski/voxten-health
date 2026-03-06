using Azure.Communication;
using Azure.Communication.Chat;
using Azure.Communication.Identity;
using Azure.Communication.Sms;
using Voxten.CommunicationsApi.Models;

namespace Voxten.CommunicationsApi.Services;

public sealed class AcsChatService(IConfiguration configuration)
{
    private readonly IConfiguration _configuration = configuration;

    public async Task<IssueTokenResponse> IssueTokenAsync(IssueTokenRequest request, CancellationToken ct)
    {
        var identityClient = BuildIdentityClient(_configuration);
        var scopes = BuildTokenScopes(request.IncludeVoip);

        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            var created = await identityClient.CreateUserAndTokenAsync(scopes, cancellationToken: ct);
            return new IssueTokenResponse
            {
                UserId = created.Value.User.Id,
                Token = created.Value.AccessToken.Token,
                ExpiresOn = created.Value.AccessToken.ExpiresOn
            };
        }

        var user = new CommunicationUserIdentifier(request.UserId);
        var token = await identityClient.GetTokenAsync(user, scopes, cancellationToken: ct);

        return new IssueTokenResponse
        {
            UserId = user.Id,
            Token = token.Value.Token,
            ExpiresOn = token.Value.ExpiresOn
        };
    }

    public async Task<IReadOnlyList<ChatThreadSummary>> ListThreadsAsync(string userToken, int pageSize, CancellationToken ct)
    {
        var chatClient = BuildUserChatClient(_configuration, userToken);
        var threads = new List<ChatThreadSummary>();

        await foreach (var thread in chatClient.GetChatThreadsAsync(cancellationToken: ct))
        {
            threads.Add(new ChatThreadSummary
            {
                Id = thread.Id,
                Topic = thread.Topic
            });

            if (threads.Count >= pageSize)
            {
                break;
            }
        }

        return threads;
    }

    public async Task<CreateThreadResponse> CreateThreadAsync(CreateThreadRequest request, CancellationToken ct)
    {
        var chatClient = BuildUserChatClient(_configuration, request.CreatorToken);
        var participants = request.Participants.Select(p => new ChatParticipant(new CommunicationUserIdentifier(p.CommunicationUserId))
        {
            DisplayName = p.DisplayName
        });

        var created = await chatClient.CreateChatThreadAsync(request.Topic, participants, cancellationToken: ct);

        return new CreateThreadResponse
        {
            ThreadId = created.Value.ChatThread.Id
        };
    }

    public async Task<SendChatMessageResponse> SendChatMessageAsync(SendChatMessageRequest request, CancellationToken ct)
    {
        var chatClient = BuildUserChatClient(_configuration, request.SenderToken);
        var threadClient = chatClient.GetChatThreadClient(request.ThreadId);

        var options = new SendChatMessageOptions
        {
            Content = request.Content,
            SenderDisplayName = request.SenderDisplayName
        };

        var result = await threadClient.SendMessageAsync(options, ct);

        return new SendChatMessageResponse
        {
            MessageId = result.Value.Id,
            SentAt = DateTimeOffset.UtcNow
        };
    }

    public async Task<IReadOnlyList<ChatThreadMessageItem>> GetChatMessagesAsync(string userToken, string threadId, int pageSize, CancellationToken ct)
    {
        var chatClient = BuildUserChatClient(_configuration, userToken);
        var threadClient = chatClient.GetChatThreadClient(threadId);
        var items = new List<ChatThreadMessageItem>();

        await foreach (var message in threadClient.GetMessagesAsync(cancellationToken: ct))
        {
            items.Add(new ChatThreadMessageItem
            {
                Id = message.Id ?? string.Empty,
                Content = message.Content?.Message ?? string.Empty,
                SenderDisplayName = message.SenderDisplayName,
                SenderId = ResolveSenderId(message.Sender),
                CreatedOnUtc = message.CreatedOn
            });

            if (items.Count >= pageSize)
            {
                break;
            }
        }

        return items
            .OrderBy(m => m.CreatedOnUtc ?? DateTimeOffset.MinValue)
            .ToList();
    }

    public async Task<SendSmsResponse> SendSmsAsync(SendSmsRequest request, CancellationToken ct)
    {
        var smsClient = BuildSmsClient(_configuration);
        var sendOptions = new SmsSendOptions(enableDeliveryReport: request.EnableDeliveryReport);

        var result = await smsClient.SendAsync(
            from: request.FromPhoneNumber,
            to: request.ToPhoneNumber,
            message: request.Message,
            options: sendOptions,
            cancellationToken: ct);

        return new SendSmsResponse
        {
            MessageId = result.Value.MessageId ?? string.Empty,
            Successful = result.Value.Successful
        };
    }

    private static CommunicationIdentityClient BuildIdentityClient(IConfiguration configuration)
    {
        var connectionString = ResolveAcsConnectionString(configuration);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ACS connection string is not configured.");
        }

        return new CommunicationIdentityClient(connectionString);
    }

    private static SmsClient BuildSmsClient(IConfiguration configuration)
    {
        var connectionString = ResolveAcsConnectionString(configuration);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ACS connection string is not configured.");
        }

        return new SmsClient(connectionString);
    }

    private static ChatClient BuildUserChatClient(IConfiguration configuration, string userToken)
    {
        if (string.IsNullOrWhiteSpace(userToken))
        {
            throw new ArgumentException("User token is required.", nameof(userToken));
        }

        var endpoint = ResolveAcsEndpoint(configuration);
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            throw new InvalidOperationException("ACS endpoint is not configured.");
        }

        return new ChatClient(new Uri(endpoint), new CommunicationTokenCredential(userToken));
    }

    private static string? ResolveAcsConnectionString(IConfiguration configuration)
    {
        return configuration["Acs:ConnectionString"]
               ?? configuration["ACS_CONNECTION_STRING"]
               ?? Environment.GetEnvironmentVariable("ACS_CONNECTION_STRING");
    }

    private static string? ResolveAcsEndpoint(IConfiguration configuration)
    {
        return configuration["Acs:Uri"]
               ?? configuration["ACS_ENDPOINT"]
               ?? Environment.GetEnvironmentVariable("ACS_ENDPOINT");
    }

    private static string? ResolveSenderId(CommunicationIdentifier? identifier)
    {
        return identifier switch
        {
            CommunicationUserIdentifier user => user.Id,
            PhoneNumberIdentifier phone => phone.PhoneNumber,
            MicrosoftTeamsUserIdentifier teamsUser => teamsUser.UserId,
            _ => identifier?.RawId
        };
    }

    private static CommunicationTokenScope[] BuildTokenScopes(bool includeVoip)
    {
        if (!includeVoip)
        {
            return [CommunicationTokenScope.Chat];
        }

        return [CommunicationTokenScope.Chat, CommunicationTokenScope.VoIP];
    }
}
