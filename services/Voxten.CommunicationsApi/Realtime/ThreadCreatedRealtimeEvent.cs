namespace Voxten.CommunicationsApi.Realtime;

public sealed class ThreadCreatedRealtimeEvent
{
    public string ThreadId { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string CreatedByEntraUserId { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
}

