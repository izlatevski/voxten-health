using System.Text.Json;
using System.Text.RegularExpressions;
using Voxten.Compliance.Data.Models.Rules;

namespace Voxten.ComplianceApi.Services;

public class PatternMatch
{
    public string PatternId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int Position { get; set; }
    public int Length { get; set; }
    public double Confidence { get; set; }
}

public class PatternDetectionResult
{
    public bool HasMatches => Matches.Count > 0;
    public List<PatternMatch> Matches { get; set; } = [];
    public int LatencyMs { get; set; }
}

public class PatternDetectionService(ILogger<PatternDetectionService> logger)
{
    // Compiled regex cache — patterns are compiled once and reused across requests
    private readonly Dictionary<string, Regex> _compiledPatterns = [];
    private readonly Lock _compileLock = new();

    public void ClearCompiledPatterns()
    {
        lock (_compileLock)
        {
            _compiledPatterns.Clear();
        }
    }

    public PatternDetectionResult Evaluate(string content, PatternLibrary library)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var matches = new List<PatternMatch>();

        try
        {
            var patternDefs = JsonSerializer.Deserialize<List<PatternDefinition>>(
                                 library.PatternsJson,
                                 new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                              ?? [];

            foreach (var def in patternDefs)
            {
                var regex = GetOrCompile(library.Id, def);
                foreach (Match m in regex.Matches(content))
                {
                    matches.Add(new PatternMatch
                    {
                        PatternId = def.EntityType,
                        EntityType = def.EntityType,
                        Position = m.Index,
                        Length = m.Length,
                        Confidence = def.Confidence
                    });
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Pattern evaluation failed for library {LibraryId}", library.Id);
        }

        sw.Stop();
        return new PatternDetectionResult
        {
            Matches = matches,
            LatencyMs = (int)sw.ElapsedMilliseconds
        };
    }

    public string Redact(string content, IEnumerable<PatternMatch> matches)
    {
        // Replace matched positions with [REDACTED:EntityType]
        // Process in reverse order so positions stay valid
        var result = content;
        foreach (var m in matches.OrderByDescending(x => x.Position))
        {
            if (m.Position + m.Length <= result.Length)
            {
                result = result[..m.Position]
                         + $"[REDACTED:{m.EntityType}]"
                         + result[(m.Position + m.Length)..];
            }
        }
        return result;
    }

    private Regex GetOrCompile(string libraryId, PatternDefinition def)
    {
        var key = $"{libraryId}:{def.EntityType}:{def.Flags}:{def.Regex}";
        if (_compiledPatterns.TryGetValue(key, out var existing))
            return existing;

        lock (_compileLock)
        {
            if (_compiledPatterns.TryGetValue(key, out existing))
                return existing;

            var options = RegexOptions.Compiled | RegexOptions.CultureInvariant;
            if (def.Flags?.Contains('i', StringComparison.Ordinal) == true)
                options |= RegexOptions.IgnoreCase;

            var regex = new Regex(def.Regex, options, TimeSpan.FromMilliseconds(500));
            _compiledPatterns[key] = regex;
            return regex;
        }
    }

    private sealed class PatternDefinition
    {
        public string Regex { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Flags { get; set; }
        public double Confidence { get; set; } = 1.0;
    }
}
