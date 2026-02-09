namespace EventRecommendationSystem.Core.Entities;

public class DecisionResult
{
    public Guid Id { get; set; }
    public Guid DecisionId { get; set; }
    public VotingMethod Method { get; set; }
    public Guid? WinnerAlternativeId { get; set; }
    public string ResultData { get; set; } = string.Empty; // JSON с полными результатами
    public DateTime CalculatedAt { get; set; }

    // Navigation properties
    public Decision Decision { get; set; } = null!;
    public Alternative? WinnerAlternative { get; set; }
}

public enum VotingMethod
{
    Condorcet,
    KemenyYoung,
    Borda,
    Plurality,
    Approval
}
