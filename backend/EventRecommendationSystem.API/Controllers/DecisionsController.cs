using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventRecommendationSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DecisionsController : ControllerBase
{
    private readonly IDecisionRepository _decisionRepository;
    private readonly IGroupRepository _groupRepository;
    private readonly IVotingService _votingService;

    public DecisionsController(
        IDecisionRepository decisionRepository,
        IGroupRepository groupRepository,
        IVotingService votingService)
    {
        _decisionRepository = decisionRepository;
        _groupRepository = groupRepository;
        _votingService = votingService;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    private async Task CheckAndCompleteExpiredDecisions(Guid decisionId)
    {
        try
        {
            var decision = await _decisionRepository.GetByIdAsync(decisionId);
            
            if (decision != null && 
                !decision.IsCompleted && 
                decision.Deadline.HasValue && 
                decision.Deadline.Value <= DateTime.UtcNow)
            {
                Console.WriteLine($"[AUTO COMPLETE] Дедлайн истёк, завершаем решение: {decisionId}");
                decision.IsCompleted = true;
                decision.Status = DecisionStatus.Completed;
                await _decisionRepository.UpdateAsync(decision);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AUTO COMPLETE ERROR] {ex.Message}");
        }
    }

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetGroupDecisions(Guid groupId)
    {
        var userId = GetUserId();
        var isMember = await _groupRepository.IsUserMemberAsync(groupId, userId);

        if (!isMember)
        {
            return Forbid();
        }

        var decisions = await _decisionRepository.GetGroupDecisionsAsync(groupId);

        return Ok(decisions.Select(d => new
        {
            d.Id,
            d.Title,
            d.Description,
            d.CreatedAt,
            d.Deadline,
            d.IsCompleted,
            d.Status,
            AlternativesCount = d.Alternatives.Count,
            VotesCount = d.Votes.Count
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDecision(Guid id)
    {
        try
        {
            Console.WriteLine($"[GET DECISION] Запрос решения: {id}");
            
            // Проверяем и автоматически завершаем, если дедлайн истёк
            await CheckAndCompleteExpiredDecisions(id);
            
            var userId = GetUserId();
            var decision = await _decisionRepository.GetByIdAsync(id);

            if (decision == null)
            {
                Console.WriteLine($"[GET DECISION] Решение не найдено: {id}");
                return NotFound(new { message = "Решение не найдено" });
            }

            Console.WriteLine($"[GET DECISION] Найдено решение: {decision.Title}");
            Console.WriteLine($"[GET DECISION] Статус: {decision.Status}");
            Console.WriteLine($"[GET DECISION] IsCompleted: {decision.IsCompleted}");

            var isMember = await _groupRepository.IsUserMemberAsync(decision.GroupId, userId);
            if (!isMember)
            {
                return Forbid();
            }

            var userVote = decision.Votes.FirstOrDefault(v => v.UserId == userId);

            return Ok(new
            {
                decision.Id,
                decision.GroupId,
                decision.Title,
                decision.Description,
                decision.CreatedAt,
                decision.Deadline,
                decision.IsCompleted,
                decision.Status,
                Alternatives = decision.Alternatives.Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Description,
                    a.ImageUrl,
                    a.MetaData
                }),
                Votes = decision.Votes.Select(v => new
                {
                    v.Id,
                    v.UserId,
                    v.User.Username,
                    v.CreatedAt,
                    Rankings = v.Rankings.Select(r => new
                    {
                        r.AlternativeId,
                        r.Rank
                    })
                }),
                UserVote = userVote != null ? new
                {
                    userVote.Id,
                    Rankings = userVote.Rankings.Select(r => new
                    {
                        r.AlternativeId,
                        r.Rank
                    })
                } : null,
                Results = decision.Results.Select(r => new
                {
                    r.Id,
                    r.Method,
                    r.WinnerAlternativeId,
                    r.ResultData,
                    r.CalculatedAt
                })
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GET DECISION ERROR] {ex.Message}");
            Console.WriteLine($"[GET DECISION ERROR] StackTrace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Ошибка получения решения" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateDecision([FromBody] CreateDecisionRequest request)
    {
        try
        {
            Console.WriteLine($"[CREATE DECISION] Создание решения: {request.Title}");
            
            var userId = GetUserId();
            var isMember = await _groupRepository.IsUserMemberAsync(request.GroupId, userId);

            if (!isMember)
            {
                Console.WriteLine($"[CREATE DECISION] Пользователь не является членом группы");
                return Forbid();
            }

            var decision = new Decision
            {
                Id = Guid.NewGuid(),
                GroupId = request.GroupId,
                Title = request.Title,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow,
                Deadline = request.Deadline,
                IsCompleted = false,
                Status = DecisionStatus.Active  // ЯВНО устанавливаем Active!
            };

            Console.WriteLine($"[CREATE DECISION] Статус решения: {decision.Status}");
            Console.WriteLine($"[CREATE DECISION] IsCompleted: {decision.IsCompleted}");

            await _decisionRepository.CreateAsync(decision);

            Console.WriteLine($"[CREATE DECISION] Решение создано успешно: {decision.Id}");

            return CreatedAtAction(nameof(GetDecision), new { id = decision.Id }, new
            {
                decision.Id,
                decision.Title,
                decision.Description,
                decision.Status  // Вернем статус для проверки
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CREATE DECISION ERROR] {ex.Message}");
            Console.WriteLine($"[CREATE DECISION ERROR] StackTrace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Ошибка создания решения" });
        }
    }

    [HttpPost("{id}/alternatives")]
    public async Task<IActionResult> AddAlternative(Guid id, [FromBody] AddAlternativeRequest request)
    {
        var userId = GetUserId();
        var decision = await _decisionRepository.GetByIdAsync(id);

        if (decision == null)
        {
            return NotFound(new { message = "Решение не найдено" });
        }

        var isMember = await _groupRepository.IsUserMemberAsync(decision.GroupId, userId);
        if (!isMember)
        {
            return Forbid();
        }

        var alternative = new Alternative
        {
            Id = Guid.NewGuid(),
            DecisionId = id,
            Name = request.Name,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            MetaData = request.MetaData,
            CreatedAt = DateTime.UtcNow
        };

        await _decisionRepository.AddAlternativeAsync(alternative);

        return Ok(new
        {
            alternative.Id,
            alternative.Name,
            alternative.Description,
            alternative.ImageUrl
        });
    }

    [HttpPost("{id}/vote")]
    public async Task<IActionResult> SubmitVote(Guid id, [FromBody] SubmitVoteRequest request)
    {
        var userId = GetUserId();
        var decision = await _decisionRepository.GetByIdAsync(id);

        if (decision == null)
        {
            return NotFound(new { message = "Решение не найдено" });
        }

        var isMember = await _groupRepository.IsUserMemberAsync(decision.GroupId, userId);
        if (!isMember)
        {
            return Forbid();
        }

        if (decision.Status != DecisionStatus.Active)
        {
            return BadRequest(new { message = "Голосование завершено" });
        }

        // Проверка существующего голоса
        var existingVote = await _decisionRepository.GetUserVoteAsync(id, userId);

        if (existingVote != null)
        {
            // Обновление существующего голоса
            existingVote.UpdatedAt = DateTime.UtcNow;
            
            // Удаление старых рангов
            existingVote.Rankings.Clear();
            
            // Добавление новых рангов
            foreach (var ranking in request.Rankings)
            {
                existingVote.Rankings.Add(new VoteRanking
                {
                    Id = Guid.NewGuid(),
                    VoteId = existingVote.Id,
                    AlternativeId = ranking.AlternativeId,
                    Rank = ranking.Rank
                });
            }

            await _decisionRepository.UpdateVoteAsync(existingVote);

            return Ok(new { message = "Голос обновлен" });
        }
        else
        {
            // Создание нового голоса
            var vote = new Vote
            {
                Id = Guid.NewGuid(),
                DecisionId = id,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var ranking in request.Rankings)
            {
                vote.Rankings.Add(new VoteRanking
                {
                    Id = Guid.NewGuid(),
                    VoteId = vote.Id,
                    AlternativeId = ranking.AlternativeId,
                    Rank = ranking.Rank
                });
            }

            await _decisionRepository.AddVoteAsync(vote);

            return Ok(new { message = "Голос принят" });
        }
    }

    [HttpPost("{id}/calculate")]
    public async Task<IActionResult> CalculateResults(Guid id, [FromQuery] string method = "all")
    {
        var userId = GetUserId();
        var decision = await _decisionRepository.GetByIdAsync(id);

        if (decision == null)
        {
            return NotFound(new { message = "Решение не найдено" });
        }

        var isMember = await _groupRepository.IsUserMemberAsync(decision.GroupId, userId);
        if (!isMember)
        {
            return Forbid();
        }

        if (method.ToLower() == "all")
        {
            var comparison = await _votingService.CompareVotingMethods(id);
            return Ok(comparison);
        }
        else
        {
            VotingResult result = method.ToLower() switch
            {
                "condorcet" => await _votingService.CalculateCondorcetWinner(id),
                "kemenyyoung" => await _votingService.CalculateKemenyYoungRanking(id),
                "borda" => await _votingService.CalculateBordaCount(id),
                "plurality" => await _votingService.CalculatePluralityVoting(id),
                _ => throw new ArgumentException("Unknown method")
            };

            return Ok(result);
        }
    }

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteDecision(Guid id)
    {
        var userId = GetUserId();
        var decision = await _decisionRepository.GetByIdAsync(id);

        if (decision == null)
        {
            return NotFound(new { message = "Решение не найдено" });
        }

        var group = await _groupRepository.GetByIdAsync(decision.GroupId);
        var userMembership = group?.Members.FirstOrDefault(m => m.UserId == userId);
        
        if (userMembership == null || (!userMembership.IsAdmin && group.CreatorId != userId))
        {
            return Forbid();
        }

        decision.Status = DecisionStatus.Completed;
        decision.IsCompleted = true;
        await _decisionRepository.UpdateAsync(decision);

        return Ok(new { message = "Решение завершено" });
    }
}

public class CreateDecisionRequest
{
    public Guid GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? Deadline { get; set; }
}

public class AddAlternativeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? MetaData { get; set; }
}

public class SubmitVoteRequest
{
    public List<VoteRankingRequest> Rankings { get; set; } = new();
}

public class VoteRankingRequest
{
    public Guid AlternativeId { get; set; }
    public int Rank { get; set; }
}
