using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Enums;
using Voxten.ComplianceApi.Dtos;
using Voxten.ComplianceApi.Storage;

namespace Voxten.ComplianceApi.Controllers;

[ApiController]
[Route("api/compliance/audit")]
[Authorize]
public class AuditController(
    IDbContextFactory<ComplianceDbContext> dbFactory,
    IMessageContentStore contentStore,
    ILogger<AuditController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? threadId,
        [FromQuery] string? senderId,
        [FromQuery] string? complianceState,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (pageSize is <= 0 or > 200)
            return BadRequest(new { error = "pageSize must be between 1 and 200." });

        await using var db = await dbFactory.CreateDbContextAsync(ct);

        var query = db.AuditRecords
            .Include(ar => ar.Message)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(threadId))
            query = query.Where(ar => ar.Message.ThreadId == threadId);

        if (!string.IsNullOrWhiteSpace(senderId))
            query = query.Where(ar => ar.Message.SenderId == senderId);

        if (!string.IsNullOrWhiteSpace(complianceState))
            query = query.Where(ar => ar.ComplianceState == complianceState);

        if (from.HasValue)
            query = query.Where(ar => ar.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(ar => ar.CreatedAt <= to.Value);

        var totalCount = await query.CountAsync(ct);

        var records = await query
            .OrderByDescending(ar => ar.CreatedAt)
            .Skip(page * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new AuditPageDto
        {
            Items = records.Select(ToSummary).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{auditId:guid}")]
    public async Task<IActionResult> Get(Guid auditId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);

        var record = await db.AuditRecords
            .Include(ar => ar.Message)
                .ThenInclude(m => m.EvaluationResults)
            .FirstOrDefaultAsync(ar => ar.Id == auditId, ct);

        if (record is null)
            return NotFound();

        var dto = new AuditDetailDto
        {
            AuditId = record.Id.ToString(),
            MessageId = record.MessageId.ToString(),
            ComplianceState = record.ComplianceState,
            OverallVerdict = record.OverallVerdict.ToString(),
            MaxViolationSeverity = record.MaxViolationSeverity?.ToString(),
            TotalRulesEvaluated = record.TotalRulesEvaluated,
            ViolationCount = record.ViolationCount,
            SenderId = record.Message.SenderId,
            SenderRole = record.Message.SenderRole,
            ThreadId = record.Message.ThreadId,
            SourceChannel = record.Message.SourceChannel.ToString(),
            Direction = record.Message.Direction.ToString(),
            EngineVersion = record.EngineVersion,
            IsDisclosure = record.IsDisclosure,
            MessageTimestamp = record.Message.MessageTimestamp,
            CreatedAt = record.CreatedAt,
            RetainUntil = record.RetainUntil,
            IngestHash = record.IngestHash,
            EvaluationHash = record.EvaluationHash,
            SigningKeyId = record.SigningKeyId,
            RuleVersionsSnapshotJson = record.RuleVersionsSnapshotJson,
            ContentBlobRef = record.Message.ContentBlobRef,
            MessageContent = string.IsNullOrWhiteSpace(record.Message.ContentBlobRef)
                ? null
                : await contentStore.ReadAsync(record.Message.ContentBlobRef, ct),
            EvaluationResults = record.Message.EvaluationResults.Select(er => new EvaluationResultDto
            {
                RuleLogicalId = er.RuleLogicalId,
                RuleVersion = er.RuleVersion,
                EvalLane = er.EvalLane.ToString(),
                Verdict = er.Verdict.ToString(),
                ViolationSeverity = er.ViolationSeverity?.ToString(),
                Confidence = er.Confidence,
                EvidenceJson = er.EvidenceJson,
                EvaluationLatencyMs = er.EvaluationLatencyMs,
                IsDegradedMode = er.IsDegradedMode,
                DegradedReason = er.DegradedReason
            }).ToList()
        };

        return Ok(dto);
    }

    [HttpGet("/api/compliance/stats")]
    public async Task<IActionResult> Stats(
        [FromQuery] int windowDays = 30,
        CancellationToken ct = default)
    {
        if (windowDays is <= 0 or > 365)
            return BadRequest(new { error = "windowDays must be between 1 and 365." });

        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var from = DateTime.UtcNow.AddDays(-windowDays);

        var stateCounts = await db.AuditRecords
            .Where(ar => ar.CreatedAt >= from)
            .GroupBy(ar => ar.ComplianceState)
            .Select(g => new { State = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var topRules = await db.EvaluationResults
            .Where(er => er.EvaluatedAt >= from && er.Verdict == Verdict.Violation)
            .GroupBy(er => new { er.RuleLogicalId, er.RuleVersion })
            .Select(g => new { g.Key.RuleLogicalId, g.Key.RuleVersion, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync(ct);

        var total = stateCounts.Sum(s => s.Count);

        return Ok(new ComplianceStatsDto
        {
            WindowDays = windowDays,
            Total = total,
            Passed = stateCounts.FirstOrDefault(s => s.State == "passed")?.Count ?? 0,
            Flagged = stateCounts.FirstOrDefault(s => s.State == "flagged")?.Count ?? 0,
            Redacted = stateCounts.FirstOrDefault(s => s.State == "redacted")?.Count ?? 0,
            Blocked = stateCounts.FirstOrDefault(s => s.State == "blocked")?.Count ?? 0,
            TopRulesFired = topRules.Select(r => new TopRuleDto
            {
                RuleLogicalId = r.RuleLogicalId,
                RuleVersion = r.RuleVersion,
                FireCount = r.Count
            }).ToList()
        });
    }

    private static AuditSummaryDto ToSummary(Voxten.Compliance.Data.Models.Pipeline.MessageAuditRecord ar) => new()
    {
        AuditId = ar.Id.ToString(),
        MessageId = ar.MessageId.ToString(),
        ComplianceState = ar.ComplianceState,
        OverallVerdict = ar.OverallVerdict.ToString(),
        MaxViolationSeverity = ar.MaxViolationSeverity?.ToString(),
        TotalRulesEvaluated = ar.TotalRulesEvaluated,
        ViolationCount = ar.ViolationCount,
        SenderId = ar.Message?.SenderId,
        SenderRole = ar.Message?.SenderRole,
        ThreadId = ar.Message?.ThreadId,
        SourceChannel = ar.Message?.SourceChannel.ToString(),
        Direction = ar.Message?.Direction.ToString(),
        EngineVersion = ar.EngineVersion,
        IsDisclosure = ar.IsDisclosure,
        MessageTimestamp = ar.Message?.MessageTimestamp ?? ar.CreatedAt,
        CreatedAt = ar.CreatedAt,
        RetainUntil = ar.RetainUntil
    };
}
