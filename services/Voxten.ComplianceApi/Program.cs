using Azure.Core;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Voxten.Compliance.Data;
using Voxten.ComplianceApi.Services;
using Voxten.ComplianceApi.Storage;

var builder = WebApplication.CreateBuilder(args);

AddAzureKeyVaultIfConfigured(builder);
AddAuthentication(builder);
AddDatabase(builder);
AddBlobStorage(builder);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Rule cache is a singleton — shared across all requests
builder.Services.AddSingleton<RuleCache>();
builder.Services.AddSingleton<PatternDetectionService>();
builder.Services.AddSingleton<VerdictAggregator>();
builder.Services.AddScoped<ComplianceRuleEngine>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ComplianceCors", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Startup initialisation
await using (var scope = app.Services.CreateAsyncScope())
{
    var cache = scope.ServiceProvider.GetRequiredService<RuleCache>();
    await cache.LoadAsync();

    var blobStore = scope.ServiceProvider.GetRequiredService<BlobMessageContentStore>();
    await blobStore.EnsureContainerAsync();
}

app.UseHttpsRedirection();
app.UseCors("ComplianceCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/healthz", () => Results.Ok(new
{
    status = "ok",
    service = "Voxten.ComplianceApi",
    utc = DateTimeOffset.UtcNow
}));

app.Run();

static void AddDatabase(WebApplicationBuilder builder)
{
    var connectionString = builder.Configuration.GetConnectionString("ComplianceDb");
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("ComplianceDb connection string is required.");

    builder.Services.AddDbContextFactory<ComplianceDbContext>(options =>
        options.UseSqlServer(connectionString));
}

static void AddAuthentication(WebApplicationBuilder builder)
{
    var tenantId = builder.Configuration["Authentication:TenantId"];
    var clientId = builder.Configuration["Authentication:ClientId"];
    var configuredAuthority = builder.Configuration["Authentication:Authority"];
    var configuredAudience = builder.Configuration["Authentication:Audience"];
    var extraAudiences = builder.Configuration.GetSection("Authentication:ExtraAudiences").Get<string[]>() ?? [];

    if (string.IsNullOrWhiteSpace(tenantId))
        throw new InvalidOperationException("Authentication:TenantId is required.");

    if (string.IsNullOrWhiteSpace(clientId))
        throw new InvalidOperationException("Authentication:ClientId is required.");

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

static void AddBlobStorage(WebApplicationBuilder builder)
{
    var connectionString = builder.Configuration.GetConnectionString("BlobStorage");
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("BlobStorage connection string is required.");

    builder.Services.AddSingleton(new BlobServiceClient(connectionString));
    builder.Services.AddSingleton<BlobMessageContentStore>();
    builder.Services.AddSingleton<IMessageContentStore>(sp =>
        sp.GetRequiredService<BlobMessageContentStore>());
}

static void AddAzureKeyVaultIfConfigured(WebApplicationBuilder builder)
{
    var keyVaultUri = builder.Configuration["KeyVault:Uri"];
    if (string.IsNullOrWhiteSpace(keyVaultUri))
        return;

    var tenantId = builder.Configuration["Authentication:TenantId"];
    var clientId = builder.Configuration["Authentication:ClientId"];
    var clientSecret = builder.Configuration["Authentication:Secret"];

    TokenCredential credential = (!string.IsNullOrWhiteSpace(tenantId)
                                  && !string.IsNullOrWhiteSpace(clientId)
                                  && !string.IsNullOrWhiteSpace(clientSecret))
        ? new ClientSecretCredential(tenantId, clientId, clientSecret)
        : new DefaultAzureCredential();

    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), credential);
}
