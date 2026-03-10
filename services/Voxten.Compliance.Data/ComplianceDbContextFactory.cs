using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Voxten.Compliance.Data;

// Used by EF Core tooling (dotnet ef migrations add) at design time.
// Not used at runtime — each service registers its own DbContext with its connection string.
public class ComplianceDbContextFactory : IDesignTimeDbContextFactory<ComplianceDbContext>
{
    public ComplianceDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ComplianceDbContext>()
            .UseSqlServer("Server=localhost;Database=VoxtenCompliance;Trusted_Connection=True;TrustServerCertificate=True;")
            .Options;

        return new ComplianceDbContext(options);
    }
}
