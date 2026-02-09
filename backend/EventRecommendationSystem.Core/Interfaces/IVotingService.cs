using EventRecommendationSystem.Core.Entities;

namespace EventRecommendationSystem.Core.Interfaces;

public interface IVotingService
{
    Task<VotingResult> CalculateCondorcetWinner(Guid decisionId);
    Task<VotingResult> CalculateKemenyYoungRanking(Guid decisionId);
    Task<VotingResult> CalculateBordaCount(Guid decisionId);
    Task<VotingResult> CalculatePluralityVoting(Guid decisionId);
    Task<ComparisonResult> CompareVotingMethods(Guid decisionId);
}

public class VotingResult
{
    public Guid? WinnerId { get; set; }
    public string WinnerName { get; set; } = string.Empty;
    public List<RankedAlternative> Rankings { get; set; } = new();
    public Dictionary<string, object> Metrics { get; set; } = new();
    public string? Explanation { get; set; }
}

public class RankedAlternative
{
    public Guid AlternativeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Rank { get; set; }
    public double Score { get; set; }
}

public class ComparisonResult
{
    public Dictionary<VotingMethod, VotingResult> Results { get; set; } = new();
    public string Analysis { get; set; } = string.Empty;
}
