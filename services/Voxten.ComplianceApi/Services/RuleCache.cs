using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Voxten.Compliance.Data;
using Voxten.Compliance.Data.Enums;
using Voxten.Compliance.Data.Models.Rules;

namespace Voxten.ComplianceApi.Services;

// In-memory cache of active rules and pattern libraries.
// Loaded at startup from the read-only SQL connection.
// Invalidated by POST /api/compliance/cache/invalidate from PortalApi on rule changes.
public class RuleCache(IDbContextFactory<ComplianceDbContext> dbFactory, ILogger<RuleCache> logger)
{
    private volatile CacheSnapshot _snapshot = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    public CacheSnapshot Current => _snapshot;

    public async Task LoadAsync(CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            await using var db = await dbFactory.CreateDbContextAsync(ct);

            var rules = await db.Rules
                .Where(r => r.IsActive)
                .ToListAsync(ct);

            var patterns = await db.PatternLibraries.ToListAsync(ct);

            var packs = await db.RulePacks
                .Where(p => p.IsActive)
                .ToListAsync(ct);

            _snapshot = new CacheSnapshot
            {
                Rules = rules,
                PatternLibraries = patterns.ToDictionary(p => p.Id),
                PackRetentionDays = packs.ToDictionary(p => p.Id, p => p.RetentionDays),
                LoadedAt = DateTime.UtcNow
            };

            logger.LogInformation("Rule cache loaded: {RuleCount} active rules, {PatternCount} pattern libraries",
                rules.Count, patterns.Count);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task InvalidateAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Rule cache invalidation requested — reloading");
        await LoadAsync(ct);
    }
}

public class CacheSnapshot
{
    public List<Rule> Rules { get; init; } = [];
    public Dictionary<string, PatternLibrary> PatternLibraries { get; init; } = [];
    public DateTime LoadedAt { get; init; }

    public IEnumerable<Rule> GetApplicableRules(Channel channel, Direction direction, string? senderRole)
    {
        return Rules.Where(rule => ScopeMatches(rule.ScopeJson, channel, direction, senderRole));
    }

    // Returns the highest retention requirement across all packs that own the fired rules.
    // Ensures the most conservative retention period is always applied.
    public int GetMaxRetentionDays(IEnumerable<Rule> rules)
    {
        var packIds = rules.Select(r => r.PackId).Distinct().ToHashSet();
        var max = PackRetentionDays
            .Where(kv => packIds.Contains(kv.Key))
            .Select(kv => kv.Value)
            .DefaultIfEmpty(365)
            .Max();
        return max;
    }

    public Dictionary<string, int> PackRetentionDays { get; init; } = [];

    private static bool ScopeMatches(string scopeJson, Channel channel, Direction direction, string? senderRole)
    {
        if (string.IsNullOrWhiteSpace(scopeJson) || scopeJson == "{}")
            return true;

        try
        {
            var scope = JsonSerializer.Deserialize<RuleScope>(
                scopeJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (scope is null)
                return true;

            return MatchesEnum(scope.Channels, channel)
                && MatchesEnum(scope.Directions, direction)
                && MatchesSenderRole(scope.SenderRoles, senderRole);
        }
        catch (JsonException)
        {
            // Fail open for malformed scope JSON so compliance rules are not silently bypassed.
            return true;
        }
    }

    private static bool MatchesEnum<TEnum>(IReadOnlyList<string>? values, TEnum actual)
        where TEnum : struct, Enum
    {
        if (values is null || values.Count == 0)
            return true;

        return values.Any(value =>
            Enum.TryParse<TEnum>(value, ignoreCase: true, out var parsed)
            && EqualityComparer<TEnum>.Default.Equals(parsed, actual));
    }

    private static bool MatchesSenderRole(IReadOnlyList<string>? senderRoles, string? senderRole)
    {
        if (senderRoles is null || senderRoles.Count == 0)
            return true;

        if (string.IsNullOrWhiteSpace(senderRole))
            return false;

        return senderRoles.Any(role => string.Equals(role, senderRole, StringComparison.OrdinalIgnoreCase));
    }

    private sealed class RuleScope
    {
        public List<string>? Channels { get; set; }
        public List<string>? Directions { get; set; }
        public List<string>? SenderRoles { get; set; }
    }
}
