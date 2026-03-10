using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.ComplianceApi.Models;

public class EvaluationRequest
{
    [Required]
    public string MessageId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string? SenderId { get; set; }
    public string? SenderRole { get; set; }

    [Required]
    public string ThreadId { get; set; } = string.Empty;


    public Channel Channel { get; set; } = Channel.SecureChat;
    public Direction Direction { get; set; } = Direction.Internal;

    // Attachment metadata (filenames, MIME types — not the content itself)
    public string? AttachmentsMetaJson { get; set; }
}
