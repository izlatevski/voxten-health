namespace Voxten.CommunicationsApi.Realtime;

public sealed class ThreadMessageRealtimeEvent
{
    public string ThreadId { get; set; } = string.Empty;
    public string MessageId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string? SenderEntraUserId { get; set; }
    public DateTimeOffset SentAtUtc { get; set; }
    public string ComplianceState { get; set; } = "unknown";
}

