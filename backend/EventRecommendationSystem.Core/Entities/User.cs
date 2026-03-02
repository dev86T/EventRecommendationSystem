namespace EventRecommendationSystem.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    // Уникальный код для поиска пользователя (формат: ABC12345)
    public string UserCode { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}
