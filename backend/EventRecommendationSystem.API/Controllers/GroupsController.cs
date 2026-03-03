using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventRecommendationSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly IGroupRepository _groupRepository;

    public GroupsController(IGroupRepository groupRepository)
    {
        _groupRepository = groupRepository;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetUserGroups()
    {
        var userId = GetUserId();
        var groups = await _groupRepository.GetUserGroupsAsync(userId);
        
        return Ok(groups.Select(g => new
        {
            g.Id,
            g.Name,
            g.Description,
            g.CreatedAt,
            g.IsActive,
            Creator = new
            {
                g.Creator.Id,
                g.Creator.Username,
                g.Creator.Email
            },
            MemberCount = g.Members.Count
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroup(Guid id)
    {
        var userId = GetUserId();
        var group = await _groupRepository.GetByIdAsync(id);

        if (group == null)
        {
            return NotFound(new { message = "Группа не найдена" });
        }

        // Проверка, что пользователь является членом группы
        var isMember = await _groupRepository.IsUserMemberAsync(id, userId);
        if (!isMember)
        {
            return Forbid();
        }

        return Ok(new
        {
            group.Id,
            group.Name,
            group.Description,
            group.CreatedAt,
            group.IsActive,
            CreatorId = group.CreatorId,  // ДОБАВЛЕНО!
            Creator = new
            {
                group.Creator.Id,
                group.Creator.Username,
                group.Creator.Email
            },
            Members = group.Members.Select(m => new
            {
                m.Id,
                m.UserId,
                m.IsAdmin,
                m.JoinedAt,
                User = new
                {
                    m.User.Id,
                    m.User.Username,
                    m.User.Email
                }
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var userId = GetUserId();

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CreatorId = userId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _groupRepository.CreateAsync(group);

        // Добавить создателя как админа группы
        var member = new GroupMember
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            UserId = userId,
            JoinedAt = DateTime.UtcNow,
            IsAdmin = true
        };

        await _groupRepository.AddMemberAsync(member);

        return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, new
        {
            group.Id,
            group.Name,
            group.Description,
            group.CreatedAt
        });
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        var userId = GetUserId();
        var group = await _groupRepository.GetByIdAsync(id);

        if (group == null)
        {
            return NotFound(new { message = "Группа не найдена" });
        }

        // Проверка прав (только создатель или админ)
        var userMembership = group.Members.FirstOrDefault(m => m.UserId == userId);
        if (userMembership == null || (!userMembership.IsAdmin && group.CreatorId != userId))
        {
            return Forbid();
        }

        // Проверка, что пользователь еще не в группе
        var isMember = await _groupRepository.IsUserMemberAsync(id, request.UserId);
        if (isMember)
        {
            return BadRequest(new { message = "Пользователь уже является членом группы" });
        }

        var member = new GroupMember
        {
            Id = Guid.NewGuid(),
            GroupId = id,
            UserId = request.UserId,
            JoinedAt = DateTime.UtcNow,
            IsAdmin = false
        };

        await _groupRepository.AddMemberAsync(member);

        return Ok(new { message = "Участник успешно добавлен" });
    }

    [HttpDelete("{groupId}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid groupId, Guid userId)
    {
        try
        {
            Console.WriteLine($"[REMOVE MEMBER] GroupId: {groupId}, UserId: {userId}");
            
            var currentUserId = GetUserId();
            var group = await _groupRepository.GetByIdAsync(groupId);

            if (group == null)
            {
                Console.WriteLine("[REMOVE MEMBER] Group not found");
                return NotFound(new { message = "Группа не найдена" });
            }

            // Проверка прав: создатель ИЛИ админ
            var isCreator = group.CreatorId == currentUserId;
            var currentMember = group.Members.FirstOrDefault(m => m.UserId == currentUserId);
            var isAdmin = currentMember?.IsAdmin ?? false;
            
            Console.WriteLine($"[REMOVE MEMBER] isCreator: {isCreator}, isAdmin: {isAdmin}");

            // Админ ИЛИ создатель могут удалять
            if (!isCreator && !isAdmin)
            {
                Console.WriteLine("[REMOVE MEMBER] Forbidden - not admin or creator");
                return StatusCode(403, new { message = "У вас нет прав на удаление участников" });
            }

            // Создатель не может быть удален
            if (group.CreatorId == userId)
            {
                return BadRequest(new { message = "Создатель группы не может быть удален" });
            }

            await _groupRepository.RemoveMemberAsync(groupId, userId);
            
            Console.WriteLine("[REMOVE MEMBER] Success!");
            return Ok(new { message = "Участник успешно удален" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[REMOVE MEMBER ERROR] {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при удалении участника" });
        }
    }
}

public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class AddMemberRequest
{
    public Guid UserId { get; set; }
}
