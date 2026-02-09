namespace EventRecommendationSystem.Core.Entities;

public class VoteRanking
{
    public Guid Id { get; set; }
    public Guid VoteId { get; set; }
    public Guid AlternativeId { get; set; }
    public int Rank { get; set; } // 1 = most preferred, higher numbers = less preferred

    // Navigation properties
    public Vote Vote { get; set; } = null!;
    public Alternative Alternative { get; set; } = null!;
}
