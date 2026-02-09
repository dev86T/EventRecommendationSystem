using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventRecommendationSystem.Infrastructure.Data.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly ApplicationDbContext _context;

    public GroupRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Group?> GetByIdAsync(Guid id)
    {
        return await _context.Groups
            .Include(g => g.Creator)
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<Group> CreateAsync(Group group)
    {
        _context.Groups.Add(group);
        await _context.SaveChangesAsync();
        return group;
    }

    public async Task UpdateAsync(Group group)
    {
        _context.Groups.Update(group);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Group>> GetUserGroupsAsync(Guid userId)
    {
        return await _context.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Creator)
            .Select(gm => gm.Group)
            .ToListAsync();
    }

    public async Task<IEnumerable<GroupMember>> GetGroupMembersAsync(Guid groupId)
    {
        return await _context.GroupMembers
            .Where(gm => gm.GroupId == groupId)
            .Include(gm => gm.User)
            .ToListAsync();
    }

    public async Task<GroupMember> AddMemberAsync(GroupMember member)
    {
        _context.GroupMembers.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    public async Task RemoveMemberAsync(Guid groupId, Guid userId)
    {
        var member = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId);
        
        if (member != null)
        {
            _context.GroupMembers.Remove(member);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsUserMemberAsync(Guid groupId, Guid userId)
    {
        return await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId);
    }
}
