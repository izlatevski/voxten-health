using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Enums;
using Voxten.Compliance.Data.Models.Pipeline;
using Voxten.ComplianceApi.Models;
using Voxten.ComplianceApi.Storage;

namespace Voxten.ComplianceApi.Services;

public class ComplianceRuleEngine(
    IDbContextFactory<ComplianceDbContext> dbFactory,
    RuleCache ruleCache,
    PatternDetectionService patternDetection,
    VerdictAggregator aggregator,
    IMessageContentStore contentStore,
    ILogger<ComplianceRuleEngine> logger)
{
    private const string EngineVersion = "1.0.0";

    public async Task<EvaluationResponse> EvaluateAsync(EvaluationRequest request, CancellationToken ct = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var cache = ruleCache.Current;
        var applicableRules = cache.GetApplicableRules(request.Channel, request.Direction, request.SenderRole).ToList();
        var retentionDays = cache.GetMaxRetentionDays(applicableRules);

        if (applicableRules.Count == 0)
            return PassedResponse(sw);

        var outcomes = applicableRules.Select(rule => EvaluateRule(rule, request, cache)).ToList();
        var aggregated = aggregator.Aggregate(outcomes);
        var complianceState = VerdictAggregator.ToComplianceState(aggregated);

        logger.LogInformation(
            "Evaluated msg={MessageId} content={Content} → {State} | rules={RuleCount} fired={FiredCount} firedIds={FiredIds}",
            request.MessageId,
            request.Content.Length > 80 ? request.Content[..80] + "…" : request.Content,
            complianceState,
            applicableRules.Count,
            aggregated.FiredRules.Count,
            string.Join(", ", aggregated.FiredRules.Select(r => $"{r.RuleId}({r.Verdict}/{r.DerivedAction})")));

        string? redactedContent = null;
        if (complianceState is "redacted")
        {
            var allMatches = aggregated.FiredRules
                .SelectMany(r => ExtractMatchesFromEvidence(r.EvidenceJson))
                .ToList();
            if (allMatches.Count > 0)
                redactedContent = patternDetection.Redact(request.Content, allMatches);
        }

        sw.Stop();
        var auditId = Guid.CreateVersion7();

        _ = PersistAsync(request, aggregated, auditId, complianceState, retentionDays, cache, ct);

        return new EvaluationResponse
        {
            AuditId = auditId.ToString(),
            Verdict = aggregated.OverallVerdict,
            ComplianceState = complianceState,
            RedactedContent = redactedContent,
            EntitiesDetected = aggregated.FiredRules
                .SelectMany(r => ExtractMatchesFromEvidence(r.EvidenceJson)
                    .Select(m => new DetectedEntity
                    {
                        EntityType = m.EntityType,
                        Confidence = m.Confidence,
                        RuleId = r.RuleId,
                        DetectionMethod = r.EvalLane.ToString()
                    }))
                .ToList(),
            RulesFired = aggregated.FiredRules
                .Select(r => new FiredRule
                {
                    RuleId = r.RuleId,
                    RuleName = r.RuleName,
                    Action = r.DerivedAction,
                    Severity = r.Severity ?? Severity.Low
                })
                .ToList(),
            EvalMs = (int)sw.ElapsedMilliseconds
        };
    }

    private RuleEvaluationOutcome EvaluateRule(
        Voxten.Compliance.Data.Models.Rules.Rule rule,
        EvaluationRequest request,
        CacheSnapshot cache)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var logic = JsonSerializer.Deserialize<JsonElement>(rule.LogicJson);
            var verdict = Verdict.Compliant;
            Severity? severity = null;
            var evidenceJson = "{}";

            if (rule.EvalType is EvalType.Deterministic or EvalType.Hybrid)
            {
                if (logic.TryGetProperty("patternLibraryId", out var libIdEl)
                    && cache.PatternLibraries.TryGetValue(libIdEl.GetString() ?? "", out var library))
                {
                    logger.LogDebug("Evaluating rule={RuleId} against library={LibraryId}", rule.LogicalId, library.Id);
                    var result = patternDetection.Evaluate(request.Content, library);
                    if (result.HasMatches)
                    {
                        verdict = Verdict.Violation;
                        severity = rule.DefaultSeverity;
                        evidenceJson = JsonSerializer.Serialize(result.Matches);
                        logger.LogWarning(
                            "Pattern match: rule={RuleId} library={LibraryId} entities={Entities} content={Content}",
                            rule.LogicalId,
                            library.Id,
                            string.Join(", ", result.Matches.Select(m => $"{m.EntityType}@{m.Position}")),
                            request.Content.Length > 80 ? request.Content[..80] + "…" : request.Content);
                    }
                }
            }

            // AI lane — wired up in Phase 4
            // if (rule.EvalType is EvalType.Ai or EvalType.Hybrid && verdict == Verdict.Compliant)
            //     outcome = await _aiDetection.EvaluateAsync(rule, request, ct);

            var actions = JsonSerializer.Deserialize<List<JsonElement>>(rule.DefaultActionsJson) ?? [];
            var derivedAction = actions.Count > 0
                && Enum.TryParse<ActionType>(actions[0].GetProperty("actionType").GetString(), out var a)
                ? a : ActionType.Log;

            sw.Stop();
            return new RuleEvaluationOutcome
            {
                RuleId = rule.LogicalId,
                RuleGuid = rule.Id,
                RuleName = rule.Name,
                RuleVersion = rule.Version,
                Verdict = verdict,
                Severity = severity,
                DerivedAction = derivedAction,
                EvidenceJson = evidenceJson,
                EvalLane = rule.EvalType,
                LatencyMs = (int)sw.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Rule evaluation failed for {RuleLogicalId}", rule.LogicalId);
            sw.Stop();
            return new RuleEvaluationOutcome
            {
                RuleId = rule.LogicalId,
                RuleGuid = rule.Id,
                RuleName = rule.Name,
                RuleVersion = rule.Version,
                Verdict = Verdict.Uncertain,
                DerivedAction = ActionType.Log,
                IsDegradedMode = true,
                DegradedReason = ex.Message,
                EvidenceJson = "{}",
                EvalLane = rule.EvalType,
                LatencyMs = (int)sw.ElapsedMilliseconds
            };
        }
    }

    private async Task PersistAsync(
        EvaluationRequest request,
        AggregatedVerdict aggregated,
        Guid auditId,
        string complianceState,
        int retentionDays,
        CacheSnapshot cache,
        CancellationToken ct)
    {
        try
        {
            await using var db = await dbFactory.CreateDbContextAsync(ct);

            var ingestHash = ComputeSha256(request.Content);
            var messageId = Guid.CreateVersion7();

            var contentBlobRef = await contentStore.WriteAsync(messageId, request.Content, ct);

            db.Messages.Add(new CanonicalMessage
            {
                Id = messageId,
                SourceChannel = request.Channel,
                Direction = request.Direction,
                Status = MessageStatus.Actioned,
                SenderId = request.SenderId,
                SenderDisplayName = request.SenderDisplayName,
                SenderRawAddress = request.SenderId ?? "unknown",
                SenderRole = request.SenderRole,
                RecipientsJson = "[]",
                ContentBlobRef = contentBlobRef,
                AttachmentsMetaJson = request.AttachmentsMetaJson,
                ThreadId = request.ThreadId,
                IngestHash = ingestHash,
                MessageTimestamp = DateTime.UtcNow,
                IngestedAt = DateTime.UtcNow,
                RetainUntil = DateTime.UtcNow.AddDays(retentionDays)
            });

            foreach (var outcome in aggregated.FiredRules)
            {
                db.EvaluationResults.Add(new MessageEvaluationResult
                {
                    Id = Guid.CreateVersion7(),
                    MessageId = messageId,
                    RuleId = outcome.RuleGuid,
                    RuleLogicalId = outcome.RuleId,
                    RuleVersion = outcome.RuleVersion,
                    EvalLane = outcome.EvalLane,
                    Verdict = outcome.Verdict,
                    ViolationSeverity = outcome.Severity,
                    Confidence = outcome.Confidence,
                    IsDegradedMode = outcome.IsDegradedMode,
                    DegradedReason = outcome.DegradedReason,
                    EvidenceJson = outcome.EvidenceJson,
                    EngineVersion = EngineVersion,
                    EvaluationLatencyMs = outcome.LatencyMs
                });
            }

            var evaluationHash = ComputeSha256(
                ingestHash + string.Join(",", aggregated.FiredRules.Select(r => r.RuleId).OrderBy(x => x)));

            db.AuditRecords.Add(new MessageAuditRecord
            {
                Id = auditId,
                MessageId = messageId,
                ComplianceState = complianceState,
                OverallVerdict = aggregated.OverallVerdict,
                MaxViolationSeverity = aggregated.MaxSeverity,
                TotalRulesEvaluated = aggregated.FiredRules.Count,
                ViolationCount = aggregated.FiredRules.Count(r => r.Verdict == Verdict.Violation),
                UncertainCount = aggregated.FiredRules.Count(r => r.Verdict == Verdict.Uncertain),
                CompliantCount = aggregated.FiredRules.Count(r => r.Verdict == Verdict.Compliant),
                IngestHash = ingestHash,
                EvaluationHash = evaluationHash,
                EvaluationSignature = "pending",
                SigningKeyId = "default",
                EngineVersion = EngineVersion,
                RuleVersionsSnapshotJson = JsonSerializer.Serialize(
                    aggregated.FiredRules.ToDictionary(r => r.RuleId, r => r.RuleVersion)),
                RetainUntil = DateTime.UtcNow.AddDays(retentionDays)
            });

            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to persist evaluation for message {MessageId}", request.MessageId);
        }
    }

    private static EvaluationResponse PassedResponse(System.Diagnostics.Stopwatch sw)
    {
        sw.Stop();
        return new EvaluationResponse
        {
            AuditId = Guid.CreateVersion7().ToString(),
            Verdict = Verdict.Compliant,
            ComplianceState = "passed",
            EvalMs = (int)sw.ElapsedMilliseconds
        };
    }

    private static string ComputeSha256(string input)
        => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(input)));

    private static IEnumerable<PatternMatch> ExtractMatchesFromEvidence(string evidenceJson)
    {
        try { return JsonSerializer.Deserialize<List<PatternMatch>>(evidenceJson) ?? []; }
        catch { return []; }
    }
}
