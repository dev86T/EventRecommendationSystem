namespace EventRecommendationSystem.Core.Entities;

public class Decision
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DecisionStatus Status { get; set; } = DecisionStatus.Active;

    // Navigation properties
    public Group Group { get; set; } = null!;
    public ICollection<Alternative> Alternatives { get; set; } = new List<Alternative>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
    public ICollection<DecisionResult> Results { get; set; } = new List<DecisionResult>();
}

public enum DecisionStatus
{
    Active,
    Completed,
    Cancelled
}
