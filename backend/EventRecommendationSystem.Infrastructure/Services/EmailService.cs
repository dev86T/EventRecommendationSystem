using EventRecommendationSystem.Core.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace EventRecommendationSystem.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetCode, string username)
    {
        try
        {
            Console.WriteLine($"[EMAIL] Отправка письма на {toEmail}...");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
            message.To.Add(new MailboxAddress(username, toEmail));
            message.Subject = "Восстановление пароля - Event Recommendation System";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                            .code-box {{ background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
                            .code {{ font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }}
                            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
                            .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>🔐 Восстановление пароля</h1>
                            </div>
                            <div class='content'>
                                <p>Здравствуйте, <strong>{username}</strong>!</p>
                                
                                <p>Вы запросили восстановление пароля для вашего аккаунта в Event Recommendation System.</p>
                                
                                <div class='code-box'>
                                    <p style='margin: 0; font-size: 14px; color: #666;'>Ваш код восстановления:</p>
                                    <div class='code'>{resetCode}</div>
                                </div>
                                
                                <p>Введите этот код на странице восстановления пароля. Код действителен в течение <strong>15 минут</strong>.</p>
                                
                                <div class='warning'>
                                    <strong>⚠️ Внимание!</strong> Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо. Ваш пароль останется без изменений.
                                </div>
                                
                                <p>Если у вас есть вопросы, свяжитесь с нашей службой поддержки.</p>
                                
                                <p>С уважением,<br>Команда Event Recommendation System</p>
                            </div>
                            <div class='footer'>
                                <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                ",
                TextBody = $@"
Восстановление пароля

Здравствуйте, {username}!

Вы запросили восстановление пароля для вашего аккаунта в Event Recommendation System.

Ваш код восстановления: {resetCode}

Введите этот код на странице восстановления пароля. Код действителен в течение 15 минут.

ВНИМАНИЕ! Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.

С уважением,
Команда Event Recommendation System
                "
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            // Подключение к SMTP серверу
            await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, 
                _emailSettings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);

            // Аутентификация
            await client.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.SenderPassword);

            // Отправка письма
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            Console.WriteLine($"[EMAIL] Письмо успешно отправлено на {toEmail}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EMAIL ERROR] Ошибка отправки письма: {ex.Message}");
            Console.WriteLine($"[EMAIL ERROR] StackTrace: {ex.StackTrace}");
            return false;
        }
    }

    public async Task<bool> SendWelcomeEmailAsync(string toEmail, string username)
    {
        try
        {
            Console.WriteLine($"[EMAIL] Отправка приветственного письма на {toEmail}...");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
            message.To.Add(new MailboxAddress(username, toEmail));
            message.Subject = "Добро пожаловать в Event Recommendation System!";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                            .feature {{ margin: 15px 0; padding-left: 25px; }}
                            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>🎉 Добро пожаловать!</h1>
                            </div>
                            <div class='content'>
                                <p>Здравствуйте, <strong>{username}</strong>!</p>
                                
                                <p>Спасибо за регистрацию в Event Recommendation System! Вы теперь можете использовать все возможности нашей системы для коллективного принятия решений.</p>
                                
                                <h3>Что вы можете делать:</h3>
                                <div class='feature'>👥 Создавать группы для совместных решений</div>
                                <div class='feature'>📊 Использовать методы Condorcet и Kemeny-Young</div>
                                <div class='feature'>🗳️ Голосовать с помощью интуитивного интерфейса</div>
                                <div class='feature'>📈 Сравнивать результаты разных методов голосования</div>
                                
                                <p style='margin-top: 30px;'>Начните прямо сейчас - создайте свою первую группу и приступайте к принятию решений!</p>
                                
                                <p>Если у вас есть вопросы, обращайтесь в нашу службу поддержки.</p>
                                
                                <p>С уважением,<br>Команда Event Recommendation System</p>
                            </div>
                            <div class='footer'>
                                <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                ",
                TextBody = $@"
Добро пожаловать!

Здравствуйте, {username}!

Спасибо за регистрацию в Event Recommendation System!

Что вы можете делать:
- Создавать группы для совместных решений
- Использовать методы Condorcet и Kemeny-Young
- Голосовать с помощью интуитивного интерфейса
- Сравнивать результаты разных методов голосования

С уважением,
Команда Event Recommendation System
                "
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, 
                _emailSettings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
            await client.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.SenderPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            Console.WriteLine($"[EMAIL] Приветственное письмо успешно отправлено на {toEmail}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EMAIL ERROR] Ошибка отправки приветственного письма: {ex.Message}");
            return false;
        }
    }
}
