using System.ComponentModel.DataAnnotations;
using Voxten.Compliance.Data.Enums;

namespace Voxten.Compliance.Data.Models.Pipeline;

// Records every action taken on a message as a result of evaluation.
// Immutable — append only.
public class MessageAction
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid MessageId { get; set; }

    // Null for actions triggered by the pipeline orchestrator rather than a specific rule result
    public Guid? TriggeredByEvaluationId { get; set; }

    public ActionType ActionType { get; set; }
    public Channel Channel { get; set; }

    // JSON: structure varies by ActionType
    // Block:           { "reason": "...", "ruleLogicalId": "..." }
    // Alert:           { "recipients": [...], "severity": "..." }
    // NotifyRealTime:  { "signalREvent": "complianceAlert", "threadId": "..." }
    public string? ActionDetailJson { get; set; }

    public bool Succeeded { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

    public CanonicalMessage Message { get; set; } = null!;
}
