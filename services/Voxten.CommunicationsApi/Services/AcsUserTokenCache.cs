using Microsoft.Extensions.Caching.Memory;
using Voxten.CommunicationsApi.Models;

namespace Voxten.CommunicationsApi.Services;

public interface IAcsUserTokenCache
{
    Task<string?> GetTokenAsync(
        string tenantId,
        string entraUserId,
        string acsUserId,
        Func<CancellationToken, Task<IssueTokenResponse>> tokenFactory,
        CancellationToken ct);
}

public sealed class AcsUserTokenCache(IMemoryCache cache) : IAcsUserTokenCache
{
    private readonly IMemoryCache _cache = cache;
    private static readonly TimeSpan ExpirySkew = TimeSpan.FromMinutes(2);

    public async Task<string?> GetTokenAsync(
        string tenantId,
        string entraUserId,
        string acsUserId,
        Func<CancellationToken, Task<IssueTokenResponse>> tokenFactory,
        CancellationToken ct)
    {
        var key = BuildCacheKey(tenantId, entraUserId, acsUserId);
        if (_cache.TryGetValue<CachedToken>(key, out var cached)
            && cached is not null
            && cached.ExpiresOnUtc > DateTimeOffset.UtcNow.Add(ExpirySkew)
            && !string.IsNullOrWhiteSpace(cached.Token))
        {
            return cached.Token;
        }

        var issued = await tokenFactory(ct);
        if (string.IsNullOrWhiteSpace(issued.Token))
        {
            return null;
        }

        var absoluteExpiration = issued.ExpiresOn - ExpirySkew;
        if (absoluteExpiration <= DateTimeOffset.UtcNow)
        {
            absoluteExpiration = DateTimeOffset.UtcNow.AddMinutes(5);
        }

        _cache.Set(
            key,
            new CachedToken(issued.Token, issued.ExpiresOn),
            new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = absoluteExpiration
            });

        return issued.Token;
    }

    private static string BuildCacheKey(string tenantId, string entraUserId, string acsUserId)
        => $"acs-token:{tenantId}:{entraUserId}:{acsUserId}";

    private sealed record CachedToken(string Token, DateTimeOffset ExpiresOnUtc);
}
