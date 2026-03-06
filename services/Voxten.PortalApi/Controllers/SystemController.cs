using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Voxten.PortalApi.Controllers;

[ApiController]
[Route("api/system")]
[Authorize]
public sealed class SystemController(IConfiguration configuration) : ControllerBase
{
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "ok",
            service = "Voxten.PortalApi",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            utc = DateTimeOffset.UtcNow
        });
    }

    [HttpGet("config")]
    [Authorize(Roles = "Voxten.Admin")]
    public IActionResult Config()
    {
        var hasVaultUri = !string.IsNullOrWhiteSpace(configuration["KeyVault:Uri"]);
        var hasSecret = !string.IsNullOrWhiteSpace(configuration["PortalApi:DemoSecret"]);

        return Ok(new
        {
            keyVaultConfigured = hasVaultUri,
            demoSecretLoaded = hasSecret,
            loadedFrom = hasSecret ? "KeyVaultOrEnv" : "NotSet"
        });
    }
}
