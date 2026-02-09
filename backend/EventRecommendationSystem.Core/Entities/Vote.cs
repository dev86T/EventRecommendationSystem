namespace EventRecommendationSystem.Core.Entities;

public class Vote
{
    public Guid Id { get; set; }
    public Guid DecisionId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Decision Decision { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<VoteRanking> Rankings { get; set; } = new List<VoteRanking>();
}
