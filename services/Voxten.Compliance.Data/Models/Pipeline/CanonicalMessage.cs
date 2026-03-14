using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.Compliance.Data.Models.Pipeline;

// Normalised representation of any inbound message from any channel.
// Immutable once created — enforced in DbContext.
public class CanonicalMessage
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Channel SourceChannel { get; set; }
    public Direction Direction { get; set; }
    public MessageStatus Status { get; set; } = MessageStatus.Received;

    [MaxLength(200)]
    public string? SenderId { get; set; }

    [MaxLength(200)]
    public string? SenderDisplayName { get; set; }

    [Required, MaxLength(500)]
    public string SenderRawAddress { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? SenderRole { get; set; }

    // JSON: [{ "id": null, "rawAddress": "...", "type": "External" }]
    [Required]
    public string RecipientsJson { get; set; } = "[]";

    // Blob path to the full message content — written at ingestion, never stored in SQL
    [Required, MaxLength(500)]
    public string ContentBlobRef { get; set; } = string.Empty;

    // JSON: [{ "filename": "...", "mimeType": "...", "blobRef": "..." }]
    public string? AttachmentsMetaJson { get; set; }

    // SHA-256 of the raw payload — baseline for tamper detection
    [Required, MaxLength(64)]
    public string IngestHash { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ThreadId { get; set; }

    public DateTime MessageTimestamp { get; set; }
    public DateTime IngestedAt { get; set; } = DateTime.UtcNow;

    // HIPAA minimum 6-year retention
    public DateTime RetainUntil { get; set; }

    public ICollection<MessageEvaluationResult> EvaluationResults { get; set; } = [];
    public ICollection<MessageAction> Actions { get; set; } = [];
    public MessageAuditRecord? AuditRecord { get; set; }
}
