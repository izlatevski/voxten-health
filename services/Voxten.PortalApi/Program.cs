using Azure.Core;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Voxten.Compliance.Data;
using Voxten.PortalApi.Services;

var builder = WebApplication.CreateBuilder(args);

AddAzureKeyVaultIfConfigured(builder);
AddAuthentication(builder);
AddDatabase(builder);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<EntraGraphService>();
builder.Services.AddScoped<ComplianceCacheInvalidator>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("PortalUiCors", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("PortalUiCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/healthz", () => Results.Ok(new
{
    status = "ok",
    service = "Voxten.PortalApi",
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

static void AddDatabase(WebApplicationBuilder builder)
{
    var connectionString = builder.Configuration.GetConnectionString("ComplianceDb");
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("ComplianceDb connection string is required.");

    builder.Services.AddDbContext<ComplianceDbContext>(options =>
        options.UseSqlServer(connectionString));
}

static void AddAzureKeyVaultIfConfigured(WebApplicationBuilder builder)
{
    var keyVaultUri = builder.Configuration["KeyVault:Uri"];
    if (string.IsNullOrWhiteSpace(keyVaultUri))
    {
        return;
    }

    var tenantId = builder.Configuration["Authentication:TenantId"];
    var clientId = builder.Configuration["Authentication:ClientId"];
    var clientSecret = builder.Configuration["Authentication:Secret"];

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
