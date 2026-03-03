using EventRecommendationSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace EventRecommendationSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    // УДАЛЁН GetAllUsers - нарушение приватности!
    // Теперь только поиск по коду

    [HttpGet("find-by-code/{code}")]
    public async Task<IActionResult> FindUserByCode(string code)
    {
        Console.WriteLine($"[FIND USER] Searching for code: {code}");
        
        var allUsers = await _userRepository.GetAllAsync();
        var user = allUsers.FirstOrDefault(u => 
            u.UserCode != null && 
            u.UserCode.ToUpper() == code.ToUpper());
        
        if (user == null)
        {
            Console.WriteLine($"[FIND USER] User not found");
            return NotFound(new { message = "Пользователь с таким кодом не найден" });
        }
        
        Console.WriteLine($"[FIND USER] Found: {user.Username}");
        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.UserCode
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
            user.UserCode,
            user.CreatedAt
        });
    }
}
