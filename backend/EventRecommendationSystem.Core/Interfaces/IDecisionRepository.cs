using EventRecommendationSystem.Core.Entities;

namespace EventRecommendationSystem.Core.Interfaces;

public interface IDecisionRepository
{
    Task<Decision?> GetByIdAsync(Guid id);
    Task<Decision> CreateAsync(Decision decision);
    Task UpdateAsync(Decision decision);
    Task<IEnumerable<Decision>> GetGroupDecisionsAsync(Guid groupId);
    Task<Alternative> AddAlternativeAsync(Alternative alternative);
    Task<Vote> AddVoteAsync(Vote vote);
    Task<Vote?> GetUserVoteAsync(Guid decisionId, Guid userId);
    Task UpdateVoteAsync(Vote vote);
    Task<IEnumerable<Vote>> GetDecisionVotesAsync(Guid decisionId);
    Task<DecisionResult> SaveResultAsync(DecisionResult result);
    Task<IEnumerable<DecisionResult>> GetDecisionResultsAsync(Guid decisionId);
    Task<IEnumerable<Decision>> DeleteAsync(Decision decision);

}
