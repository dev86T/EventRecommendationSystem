using System.Security.Claims;
using BCrypt.Net;
using EventRecommendationSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventRecommendationSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    // In-memory store for pending email changes: userId → (pendingEmail, code, expiry)
    private static readonly Dictionary<Guid, (string PendingEmail, string Code, DateTime Expiry)> _pendingEmailChanges = new();

    public UsersController(IUserRepository userRepository, IEmailService emailService)
    {
        _userRepository = userRepository;
        _emailService = emailService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userRepository.GetAllAsync();

        return Ok(users.Select(u => new
        {
            u.Id,
            u.Username,
            u.Email
        }));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.UserCode,
            user.AvatarEmoji,
            user.CreatedAt
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        if (!string.IsNullOrWhiteSpace(request.Username) && request.Username != user.Username)
        {
            var existing = await _userRepository.GetByUsernameAsync(request.Username);
            if (existing != null)
                return BadRequest(new { message = "Имя пользователя уже занято" });

            user.Username = request.Username.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.AvatarEmoji))
            user.AvatarEmoji = request.AvatarEmoji;

        await _userRepository.UpdateAsync(user);

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.UserCode,
            user.AvatarEmoji
        });
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            return BadRequest(new { message = "Неверный текущий пароль" });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "Новый пароль должен содержать минимум 6 символов" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _userRepository.UpdateAsync(user);

        return Ok(new { message = "Пароль успешно изменён" });
    }

    [HttpPost("me/email/request")]
    public async Task<IActionResult> RequestEmailChange([FromBody] RequestEmailChangeRequest request)
    {
        var userId = GetUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        var newEmail = request.NewEmail?.Trim().ToLower();
        if (string.IsNullOrWhiteSpace(newEmail))
            return BadRequest(new { message = "Укажите новую почту" });

        if (newEmail == user.Email.ToLower())
            return BadRequest(new { message = "Это уже ваша текущая почта" });

        var existing = await _userRepository.GetByEmailAsync(newEmail);
        if (existing != null)
            return BadRequest(new { message = "Эта почта уже используется другим аккаунтом" });

        var code = new Random().Next(100000, 999999).ToString();
        _pendingEmailChanges[userId] = (newEmail, code, DateTime.UtcNow.AddMinutes(15));

        await _emailService.SendEmailConfirmationAsync(newEmail, code, user.Username);

        return Ok(new { message = "Код подтверждения отправлен на новую почту" });
    }

    [HttpPost("me/email/confirm")]
    public async Task<IActionResult> ConfirmEmailChange([FromBody] ConfirmEmailChangeRequest request)
    {
        var userId = GetUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        if (!_pendingEmailChanges.TryGetValue(userId, out var pending))
            return BadRequest(new { message = "Запрос на смену почты не найден. Запросите код заново." });

        if (DateTime.UtcNow > pending.Expiry)
        {
            _pendingEmailChanges.Remove(userId);
            return BadRequest(new { message = "Код истёк. Запросите новый." });
        }

        if (pending.Code != request.Code?.Trim())
            return BadRequest(new { message = "Неверный код подтверждения" });

        user.Email = pending.PendingEmail;
        await _userRepository.UpdateAsync(user);
        _pendingEmailChanges.Remove(userId);

        return Ok(new
        {
            message = "Почта успешно изменена",
            user.Id,
            user.Username,
            user.Email,
            user.UserCode,
            user.AvatarEmoji
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Пользователь не найден" });
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.CreatedAt
        });
    }

    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetUserByCode(string code)
    {
        var user = await _userRepository.GetByUserCodeAsync(code.ToUpper());

        if (user == null)
        {
            return NotFound(new { message = "Пользователь с таким кодом не найден" });
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.UserCode
        });
    }
}

public record UpdateProfileRequest(string? Username, string? AvatarEmoji);
public record ChangePasswordRequest(string OldPassword, string NewPassword);
public record RequestEmailChangeRequest(string NewEmail);
public record ConfirmEmailChangeRequest(string Code);
