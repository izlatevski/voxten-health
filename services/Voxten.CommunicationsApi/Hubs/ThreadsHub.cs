using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Voxten.CommunicationsApi.Hubs;

[Authorize]
public sealed class ThreadsHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var oid = Context.User?.FindFirstValue("oid")
            ?? Context.User?.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
            ?? Context.User?.FindFirstValue("sub");

        if (!string.IsNullOrWhiteSpace(oid))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GroupForUser(oid));
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinThread(string threadId)
    {
        if (string.IsNullOrWhiteSpace(threadId))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupForThread(threadId));
    }

    public async Task LeaveThread(string threadId)
    {
        if (string.IsNullOrWhiteSpace(threadId))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupForThread(threadId));
    }

    public static string GroupForThread(string threadId) => $"thread:{threadId}";
    public static string GroupForUser(string entraUserId) => $"user:{entraUserId}";
}
