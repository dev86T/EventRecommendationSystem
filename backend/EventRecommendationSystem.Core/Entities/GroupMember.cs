namespace EventRecommendationSystem.Core.Entities;

public class GroupMember
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsAdmin { get; set; } = false;

    // Navigation properties
    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;
}
