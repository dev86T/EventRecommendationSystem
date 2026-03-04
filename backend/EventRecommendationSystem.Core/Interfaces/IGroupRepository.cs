using EventRecommendationSystem.Core.Entities;

namespace EventRecommendationSystem.Core.Interfaces;

public interface IGroupRepository
{
    Task<Group?> GetByIdAsync(Guid id);
    Task<Group> CreateAsync(Group group);
    Task UpdateAsync(Group group);
    Task<IEnumerable<Group>> GetUserGroupsAsync(Guid userId);
    Task<IEnumerable<GroupMember>> GetGroupMembersAsync(Guid groupId);
    Task<GroupMember> AddMemberAsync(GroupMember member);
    Task RemoveMemberAsync(Guid groupId, Guid userId);
    Task<bool> IsUserMemberAsync(Guid groupId, Guid userId);
    Task DeleteAsync(Guid id);
}
