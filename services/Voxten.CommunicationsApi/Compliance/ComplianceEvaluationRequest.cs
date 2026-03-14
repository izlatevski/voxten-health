namespace Voxten.CommunicationsApi.Compliance;

public sealed class ComplianceEvaluationRequest
{
    public string MessageId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string? SenderRole { get; set; }
    public string ThreadId { get; set; } = string.Empty;
    public string Channel { get; set; } = "SecureChat";
    public string Direction { get; set; } = "Inbound";
    public string? AttachmentsMetaJson { get; set; }
}
