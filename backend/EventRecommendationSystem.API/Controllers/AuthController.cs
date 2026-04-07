using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EventRecommendationSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    // Хранит данные о незавершённых регистрациях до подтверждения email
    private static readonly Dictionary<string, (RegisterRequest Data, string Code, DateTime Expiry)> _pendingRegistrations = new();

    public AuthController(IUserRepository userRepository, IConfiguration configuration, IEmailService emailService)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _emailService = emailService;
    }

    // ========================= REGISTER =========================
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            Console.WriteLine($"[REGISTER] Попытка регистрации: {request.Email}");

            // Проверка существования пользователя
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                Console.WriteLine($"[REGISTER] Email уже используется: {request.Email}");
                return BadRequest(new { message = "Пользователь с таким email уже существует" });
            }

            var existingUsername = await _userRepository.GetByUsernameAsync(request.Username);
            if (existingUsername != null)
            {
                Console.WriteLine($"[REGISTER] Username уже используется: {request.Username}");
                return BadRequest(new { message = "Пользователь с таким именем уже существует" });
            }

            var requireVerification = _configuration.GetValue<bool>("Features:RequireEmailVerificationOnRegister");

            if (!requireVerification)
            {
                // Dev-режим: создаём пользователя сразу без подтверждения email
                Console.WriteLine($"[REGISTER] Email-верификация отключена, создаём пользователя напрямую");
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = request.Email,
                    Username = request.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    UserCode = await GenerateUniqueUserCodeAsync(),
                    CreatedAt = DateTime.UtcNow
                };
                await _userRepository.CreateAsync(user);
                Console.WriteLine($"[REGISTER] Пользователь создан: {user.Username}, код: {user.UserCode}");
                var token = GenerateJwtToken(user);
                return Ok(new
                {
                    token,
                    user = new { user.Id, user.Email, user.Username, user.UserCode }
                });
            }

            // Prod-режим: отправляем код подтверждения на email
            var verificationCode = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(15);
            _pendingRegistrations[request.Email] = (request, verificationCode, expiry);

            Console.WriteLine($"[REGISTER] Код подтверждения для {request.Email}: {verificationCode}");

            var emailSent = await _emailService.SendRegistrationVerificationAsync(request.Email, verificationCode, request.Username);
            if (!emailSent)
            {
                Console.WriteLine($"[REGISTER] Не удалось отправить письмо на {request.Email}");
                return StatusCode(500, new { message = "Не удалось отправить письмо с кодом подтверждения" });
            }

            Console.WriteLine($"[REGISTER] Письмо с кодом отправлено на {request.Email}");
            return Ok(new { pending = true, message = "Код подтверждения отправлен на ваш email" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[REGISTER ERROR] {ex.Message}");
            return StatusCode(500, new { message = "Ошибка регистрации" });
        }
    }

    // ========================= VERIFY EMAIL (REGISTRATION) =========================
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            Console.WriteLine($"[VERIFY EMAIL] Подтверждение email: {request.Email}");

            if (!_pendingRegistrations.TryGetValue(request.Email, out var pending))
            {
                return BadRequest(new { message = "Регистрация не найдена или истёк срок действия. Начните регистрацию заново." });
            }

            if (DateTime.UtcNow > pending.Expiry)
            {
                _pendingRegistrations.Remove(request.Email);
                return BadRequest(new { message = "Срок действия кода истёк. Начните регистрацию заново." });
            }

            if (pending.Code != request.Code)
            {
                Console.WriteLine($"[VERIFY EMAIL] Неверный код для {request.Email}");
                return BadRequest(new { message = "Неверный код подтверждения" });
            }

            _pendingRegistrations.Remove(request.Email);

            // Создаём пользователя только после успешного подтверждения
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = pending.Data.Email,
                Username = pending.Data.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(pending.Data.Password),
                UserCode = await GenerateUniqueUserCodeAsync(),
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);
            Console.WriteLine($"[VERIFY EMAIL] Пользователь создан: {user.Username}, код: {user.UserCode}");

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.Email,
                    user.Username,
                    user.UserCode
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VERIFY EMAIL ERROR] {ex.Message}");
            return StatusCode(500, new { message = "Ошибка подтверждения email" });
        }
    }

    // ========================= LOGIN =========================
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            Console.WriteLine($"[LOGIN] Попытка входа: {request.Email}");

            var user = await _userRepository.GetByEmailAsync(request.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                Console.WriteLine($"[LOGIN] Неверные учетные данные для: {request.Email}");
                return Unauthorized(new { message = "Неверный email или пароль" });
            }

            user.LastLoginAt = DateTime.UtcNow;

            // Генерируем код если он пустой (для существующих пользователей)
            if (string.IsNullOrEmpty(user.UserCode))
            {
                user.UserCode = await GenerateUniqueUserCodeAsync();
                Console.WriteLine($"[LOGIN] Сгенерирован код для существующего пользователя: {user.UserCode}");
            }

            await _userRepository.UpdateAsync(user);

            Console.WriteLine($"[LOGIN] Успешный вход: {user.Username}, код: {user.UserCode}");

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.Email,
                    user.Username,
                    user.UserCode
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LOGIN ERROR] {ex.Message}");
            return StatusCode(500, new { message = "Ошибка входа" });
        }
    }

    // ========================= FORGOT PASSWORD =========================
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            Console.WriteLine($"[FORGOT PASSWORD] Запрос на восстановление: {request.Email}");
            
            var user = await _userRepository.GetByEmailAsync(request.Email);
            
            if (user == null)
            {
                Console.WriteLine($"[FORGOT PASSWORD] Пользователь не найден: {request.Email}");
                // Не раскрываем, существует ли пользователь (безопасность)
                return Ok(new { message = "Если email существует, код восстановления будет отправлен" });
            }

            // Генерируем временный код (6 цифр)
            var resetCode = new Random().Next(100000, 999999).ToString();
            var resetCodeExpiry = DateTime.UtcNow.AddMinutes(15); // Код действует 15 минут

            Console.WriteLine("========================================");
            Console.WriteLine($"[FORGOT PASSWORD] КОД ВОССТАНОВЛЕНИЯ для {user.Email}:");
            Console.WriteLine($"[FORGOT PASSWORD] КОД: {resetCode}");
            Console.WriteLine($"[FORGOT PASSWORD] Действителен до: {resetCodeExpiry.ToLocalTime()}");
            Console.WriteLine("========================================");

            // Отправляем email
            Console.WriteLine($"[FORGOT PASSWORD] Отправка email на {user.Email}...");
            var emailSent = await _emailService.SendPasswordResetEmailAsync(user.Email, resetCode, user.Username);

            if (emailSent)
            {
                Console.WriteLine($"[FORGOT PASSWORD] Email успешно отправлен");
                return Ok(new { 
                    message = "Код восстановления отправлен на ваш email",
                    success = true
                });
            }
            else
            {
                Console.WriteLine($"[FORGOT PASSWORD] Ошибка отправки email");
                return Ok(new { 
                    message = "Если email существует, код восстановления будет отправлен",
                    // На случай ошибки email, показываем код в консоли
                    debug = "Проверьте консоль бэкенда для кода восстановления"
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[FORGOT PASSWORD ERROR] {ex.Message}");
            return StatusCode(500, new { message = "Ошибка сервера" });
        }
    }

    // ========================= RESET PASSWORD =========================
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            Console.WriteLine($"[RESET PASSWORD] Попытка сброса для: {request.Email}");
            
            var user = await _userRepository.GetByEmailAsync(request.Email);
            
            if (user == null)
            {
                Console.WriteLine($"[RESET PASSWORD] Пользователь не найден: {request.Email}");
                return BadRequest(new { message = "Неверный email или код" });
            }

            // TODO: Проверить код и срок действия из БД
            // Пока что принимаем любой 6-значный код для разработки
            if (request.ResetCode.Length != 6 || !int.TryParse(request.ResetCode, out _))
            {
                Console.WriteLine($"[RESET PASSWORD] Неверный формат кода");
                return BadRequest(new { message = "Неверный код восстановления" });
            }

            Console.WriteLine($"[RESET PASSWORD] Обновление пароля...");
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _userRepository.UpdateAsync(user);

            Console.WriteLine($"[RESET PASSWORD] Пароль успешно обновлен для: {user.Username}");

            return Ok(new { message = "Пароль успешно изменен" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RESET PASSWORD ERROR] {ex.Message}");
            return StatusCode(500, new { message = "Ошибка сервера" });
        }
    }

    // ========================= USER CODE GENERATION =========================
    private async Task<string> GenerateUniqueUserCodeAsync()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string code;
        do
        {
            code = new string(Enumerable.Repeat(chars, 5)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        } while (await _userRepository.GetByUserCodeAsync(code) != null);
        return code;
    }

    // ========================= JWT TOKEN GENERATION =========================
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyForJWTTokenGeneration12345678901234567890";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("username", user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationMinutes"] ?? "1440")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ========================= REQUEST MODELS =========================
// Все классы запросов ВНЕ класса контроллера

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string ResetCode { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class VerifyEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
