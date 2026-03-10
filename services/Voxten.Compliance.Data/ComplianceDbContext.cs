using Microsoft.EntityFrameworkCore;
using Voxten.Compliance.Data.Models.Pipeline;
using Voxten.Compliance.Data.Models.Rules;

namespace Voxten.Compliance.Data;

public class ComplianceDbContext(DbContextOptions<ComplianceDbContext> options) : DbContext(options)
{
    // Rules domain — owned by PortalApi (migration authority), read-only in ComplianceApi
    public DbSet<RulePack> RulePacks => Set<RulePack>();
    public DbSet<Rule> Rules => Set<Rule>();
    public DbSet<PatternLibrary> PatternLibraries => Set<PatternLibrary>();

    // Compliance pipeline — owned by ComplianceApi
    public DbSet<CanonicalMessage> Messages => Set<CanonicalMessage>();
    public DbSet<MessageEvaluationResult> EvaluationResults => Set<MessageEvaluationResult>();
    public DbSet<MessageAction> MessageActions => Set<MessageAction>();
    public DbSet<MessageAuditRecord> AuditRecords => Set<MessageAuditRecord>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<Rule>(e =>
        {
            e.HasIndex(r => r.Status);
            e.HasIndex(r => r.Category);
            e.HasIndex(r => r.PackId);
            e.HasIndex(r => r.LogicalId)
                .HasFilter("[IsActive] = 1")
                .IsUnique()
                .HasDatabaseName("UX_Rules_LogicalId_Active");
            e.HasOne(r => r.Pack)
                .WithMany(p => p.Rules)
                .HasForeignKey(r => r.PackId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<CanonicalMessage>(e =>
        {
            e.HasIndex(msg => msg.Status);
            e.HasIndex(msg => msg.SourceChannel);
            e.HasIndex(msg => msg.IngestedAt);
            e.HasIndex(msg => msg.RetainUntil);
            e.HasIndex(msg => msg.IngestHash).IsUnique();
            e.HasMany(msg => msg.EvaluationResults)
                .WithOne(er => er.Message)
                .HasForeignKey(er => er.MessageId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasMany(msg => msg.Actions)
                .WithOne(a => a.Message)
                .HasForeignKey(a => a.MessageId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(msg => msg.AuditRecord)
                .WithOne(ar => ar.Message)
                .HasForeignKey<MessageAuditRecord>(ar => ar.MessageId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<MessageEvaluationResult>(e =>
        {
            e.HasIndex(er => er.MessageId);
            e.HasIndex(er => er.RuleLogicalId);
            e.HasIndex(er => er.Verdict);
            e.HasIndex(er => er.EvaluatedAt);
        });

        m.Entity<MessageAction>(e =>
        {
            e.HasIndex(a => a.MessageId);
            e.HasIndex(a => a.ActionType);
        });

        m.Entity<MessageAuditRecord>(e =>
        {
            e.HasIndex(ar => ar.OverallVerdict);
            e.HasIndex(ar => ar.CreatedAt);
            e.HasIndex(ar => ar.RetainUntil);
            e.HasIndex(ar => ar.IsDisclosure);
            e.HasIndex(ar => ar.IngestHash);
        });
    }

    public override int SaveChanges()
    {
        EnforceImmutability();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        EnforceImmutability();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void EnforceImmutability()
    {
        var immutableTypes = new[]
        {
            typeof(CanonicalMessage),
            typeof(MessageEvaluationResult),
            typeof(MessageAction),
            typeof(MessageAuditRecord)
        };

        var violations = ChangeTracker.Entries()
            .Where(e => immutableTypes.Contains(e.Entity.GetType())
                        && e.State is EntityState.Modified or EntityState.Deleted)
            .Select(e => e.Entity.GetType().Name)
            .ToList();

        if (violations.Count > 0)
            throw new InvalidOperationException(
                $"Immutability violation: {string.Join(", ", violations)} records cannot be modified or deleted.");
    }
}
