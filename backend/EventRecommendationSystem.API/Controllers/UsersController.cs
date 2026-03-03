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

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
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
