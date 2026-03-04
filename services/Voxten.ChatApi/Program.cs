using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Voxten.ChatApi.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddHttpClient();
        services.AddSingleton<ComplianceService>();
        services.AddSingleton<AiFoundryService>();
        services.AddSingleton<AcsDispatchService>();
        services.AddSingleton<AuditService>();
    })
    .Build();

await host.RunAsync();
