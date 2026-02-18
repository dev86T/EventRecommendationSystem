namespace EventRecommendationSystem.Core.Interfaces;

public interface IEmailService
{
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetCode, string username);
    Task<bool> SendWelcomeEmailAsync(string toEmail, string username);
}
