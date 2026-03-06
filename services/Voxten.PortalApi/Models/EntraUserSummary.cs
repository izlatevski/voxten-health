namespace Voxten.PortalApi.Models;

public sealed class EntraUserSummary
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Mail { get; set; }
    public string? UserPrincipalName { get; set; }
    public string? JobTitle { get; set; }
}
