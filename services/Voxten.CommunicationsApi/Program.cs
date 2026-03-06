using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Voxten.CommunicationsApi.Repositories;
using Voxten.CommunicationsApi.Services;

var builder = WebApplication.CreateBuilder(args);

AddAzureKeyVaultIfConfigured(builder);
AddAuthentication(builder);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("PortalCors", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];

        if (allowedOrigins.Length == 0)
        {
            allowedOrigins = ["http://localhost:8080"];
        }

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSingleton<AcsChatService>();
builder.Services.AddSingleton<CommunicationIndexRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var repo = scope.ServiceProvider.GetRequiredService<CommunicationIndexRepository>();
    await repo.EnsureTablesAsync(CancellationToken.None);
}

app.UseHttpsRedirection();
app.UseCors("PortalCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/healthz", () => Results.Ok(new
{
    status = "ok",
    service = "Voxten.CommunicationsApi",
    utc = DateTimeOffset.UtcNow
}));

app.Run();

static void AddAuthentication(WebApplicationBuilder builder)
{
    var tenantId = builder.Configuration["Authentication:TenantId"];
    var clientId = builder.Configuration["Authentication:ClientId"];
    var configuredAuthority = builder.Configuration["Authentication:Authority"];
    var configuredAudience = builder.Configuration["Authentication:Audience"];
    
    var extraAudiences = builder.Configuration.GetSection("Authentication:ExtraAudiences").Get<string[]>() ?? [];

    if (string.IsNullOrWhiteSpace(tenantId))
    {
        throw new InvalidOperationException("Authentication tenant is required. Configure Authentication:TenantId (or Identity:TenantId).");
    }

    if (string.IsNullOrWhiteSpace(clientId))
    {
        throw new InvalidOperationException("Authentication client id is required. Configure Authentication:ClientId (or Identity:ClientId).");
    }

    var authority = string.IsNullOrWhiteSpace(configuredAuthority)
        ? $"https://login.microsoftonline.com/{tenantId}/v2.0"
        : configuredAuthority;
    var audience = string.IsNullOrWhiteSpace(configuredAudience)
        ? $"api://{clientId}"
        : configuredAudience;
    var validAudiences = extraAudiences
        .Concat([audience, clientId, $"api://{clientId}"])
        .Where(v => !string.IsNullOrWhiteSpace(v))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = authority;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://login.microsoftonline.com/{tenantId}/v2.0",
                ValidateAudience = true,
                ValidAudiences = validAudiences,
                NameClaimType = "name",
                RoleClaimType = "roles"
            };
        });

    builder.Services.AddAuthorization();
}

static void AddAzureKeyVaultIfConfigured(WebApplicationBuilder builder)
{
    var keyVaultUri = builder.Configuration["KeyVault:Uri"];
    if (string.IsNullOrWhiteSpace(keyVaultUri))
    {
        return;
    }

    var tenantId = builder.Configuration["Authority:TenantId"];
    var clientId = builder.Configuration["Authority:ClientId"];
    var clientSecret = builder.Configuration["Authority:Secret"];

    TokenCredential credential;
    if (!string.IsNullOrWhiteSpace(tenantId)
        && !string.IsNullOrWhiteSpace(clientId)
        && !string.IsNullOrWhiteSpace(clientSecret))
    {
        credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    }
    else
    {
        credential = new DefaultAzureCredential();
    }

    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), credential);
}
