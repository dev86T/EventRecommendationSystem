using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventRecommendationSystem.Infrastructure.Data.Repositories;

public class DecisionRepository : IDecisionRepository
{
    private readonly ApplicationDbContext _context;

    public DecisionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Decision?> GetByIdAsync(Guid id)
    {
        return await _context.Decisions
            .Include(d => d.Group)
            .Include(d => d.Alternatives)
            .Include(d => d.Votes)
                .ThenInclude(v => v.Rankings)
                    .ThenInclude(r => r.Alternative)
            .Include(d => d.Votes)
                .ThenInclude(v => v.User)
            .Include(d => d.Results)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Decision> CreateAsync(Decision decision)
    {
        _context.Decisions.Add(decision);
        await _context.SaveChangesAsync();
        return decision;
    }

    public async Task UpdateAsync(Decision decision)
    {
        _context.Decisions.Update(decision);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Decision decision)
    {
        _context.Decisions.Remove(decision);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Decision>> GetGroupDecisionsAsync(Guid groupId)
    {
        return await _context.Decisions
            .Where(d => d.GroupId == groupId)
            .Include(d => d.Alternatives)
            .Include(d => d.Votes)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Alternative> AddAlternativeAsync(Alternative alternative)
    {
        _context.Alternatives.Add(alternative);
        await _context.SaveChangesAsync();
        return alternative;
    }

    public async Task<Vote> AddVoteAsync(Vote vote)
    {
        _context.Votes.Add(vote);
        await _context.SaveChangesAsync();
        return vote;
    }

    public async Task<Vote?> GetUserVoteAsync(Guid decisionId, Guid userId)
    {
        return await _context.Votes
            .Include(v => v.Rankings)
                .ThenInclude(r => r.Alternative)
            .FirstOrDefaultAsync(v => v.DecisionId == decisionId && v.UserId == userId);
    }

    public async Task UpdateVoteAsync(Vote vote)
    {
        _context.Votes.Update(vote);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Vote>> GetDecisionVotesAsync(Guid decisionId)
    {
        return await _context.Votes
            .Where(v => v.DecisionId == decisionId)
            .Include(v => v.Rankings)
                .ThenInclude(r => r.Alternative)
            .Include(v => v.User)
            .ToListAsync();
    }

    public async Task<DecisionResult> SaveResultAsync(DecisionResult result)
    {
        _context.DecisionResults.Add(result);
        await _context.SaveChangesAsync();
        return result;
    }

    public async Task<IEnumerable<DecisionResult>> GetDecisionResultsAsync(Guid decisionId)
    {
        return await _context.DecisionResults
            .Where(r => r.DecisionId == decisionId)
            .Include(r => r.WinnerAlternative)
            .OrderByDescending(r => r.CalculatedAt)
            .ToListAsync();
    }
}
