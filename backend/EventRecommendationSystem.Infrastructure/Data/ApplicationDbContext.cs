using EventRecommendationSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventRecommendationSystem.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<Decision> Decisions { get; set; }
    public DbSet<Alternative> Alternatives { get; set; }
    public DbSet<Vote> Votes { get; set; }
    public DbSet<VoteRanking> VoteRankings { get; set; }
    public DbSet<DecisionResult> DecisionResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PasswordHash).IsRequired();
        });

        // Group configuration
        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(e => e.Creator)
                .WithMany()
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GroupMember configuration
        modelBuilder.Entity<GroupMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                .WithMany(u => u.GroupMemberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Decision configuration
        modelBuilder.Entity<Decision>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.HasOne(e => e.Group)
                .WithMany(g => g.Decisions)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Alternative configuration
        modelBuilder.Entity<Alternative>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(e => e.Decision)
                .WithMany(d => d.Alternatives)
                .HasForeignKey(e => e.DecisionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Vote configuration
        modelBuilder.Entity<Vote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.DecisionId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Decision)
                .WithMany(d => d.Votes)
                .HasForeignKey(e => e.DecisionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Votes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // VoteRanking configuration
        modelBuilder.Entity<VoteRanking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.VoteId, e.AlternativeId }).IsUnique();
            entity.HasOne(e => e.Vote)
                .WithMany(v => v.Rankings)
                .HasForeignKey(e => e.VoteId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Alternative)
                .WithMany(a => a.VoteRankings)
                .HasForeignKey(e => e.AlternativeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DecisionResult configuration
        modelBuilder.Entity<DecisionResult>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Decision)
                .WithMany(d => d.Results)
                .HasForeignKey(e => e.DecisionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.WinnerAlternative)
                .WithMany()
                .HasForeignKey(e => e.WinnerAlternativeId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
