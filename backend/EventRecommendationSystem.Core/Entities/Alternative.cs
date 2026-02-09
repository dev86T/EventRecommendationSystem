namespace EventRecommendationSystem.Core.Entities;

public class Alternative
{
    public Guid Id { get; set; }
    public Guid DecisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? MetaData { get; set; } // JSON для хранения дополнительной информации (место, время и т.д.)
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Decision Decision { get; set; } = null!;
    public ICollection<VoteRanking> VoteRankings { get; set; } = new List<VoteRanking>();
}
