namespace EventRecommendationSystem.Core.Interfaces;

public interface IEmailService
{
    Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetCode, string username);
    Task<bool> SendWelcomeEmailAsync(string toEmail, string username);
    Task<bool> SendEmailConfirmationAsync(string toEmail, string code, string username);
}
