using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using EventRecommendationSystem.Infrastructure.Services;
using FluentAssertions;
using Moq;
using Xunit;

namespace EventRecommendationSystem.Tests;

/// <summary>
/// Юнит-тесты для VotingService.
/// Покрывают все четыре алгоритма голосования:
///   - Метод Кондорсе
///   - Метод Кемени-Янга (точный и жадный)
///   - Метод Борда
///   - Простое большинство (Plurality)
/// </summary>
public class VotingServiceTests
{
    // ─────────────────────────────────────────────────────────────
    // Вспомогательные методы для создания тестовых данных
    // ─────────────────────────────────────────────────────────────

    /// <summary>Создаёт альтернативу с уникальным Id и заданным именем.</summary>
    private static Alternative MakeAlt(string name) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Description = string.Empty,
        VoteRankings = new List<VoteRanking>()
    };

    /// <summary>
    /// Создаёт голос с заданным ранжированием.
    /// Параметры: пары (альтернатива, место) — 1 = первое предпочтение.
    /// </summary>
    private static Vote MakeVote(params (Alternative alt, int rank)[] rankings)
    {
        var vote = new Vote
        {
            Id = Guid.NewGuid(),
            Rankings = new List<VoteRanking>()
        };

        foreach (var (alt, rank) in rankings)
        {
            vote.Rankings.Add(new VoteRanking
            {
                Id = Guid.NewGuid(),
                VoteId = vote.Id,
                AlternativeId = alt.Id,
                Rank = rank,
                Alternative = alt
            });
        }

        return vote;
    }

    /// <summary>
    /// Создаёт Decision и настраивает мок репозитория так,
    /// чтобы GetByIdAsync возвращал это решение.
    /// Возвращает (service, decisionId).
    /// </summary>
    private static (VotingService service, Guid decisionId) BuildService(
        List<Alternative> alternatives,
        List<Vote> votes)
    {
        var decision = new Decision
        {
            Id = Guid.NewGuid(),
            Title = "Test Decision",
            Description = string.Empty,
            Alternatives = alternatives,
            Votes = votes,
            Results = new List<DecisionResult>()
        };

        var repoMock = new Mock<IDecisionRepository>();
        repoMock
            .Setup(r => r.GetByIdAsync(decision.Id))
            .ReturnsAsync(decision);

        var service = new VotingService(repoMock.Object);
        return (service, decision.Id);
    }

    // ═════════════════════════════════════════════════════════════
    //  МЕТОД КОНДОРСЕ
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Кондорсе: явный победитель, который побеждает всех попарно")]
    public async Task Condorcet_ClearWinner_ReturnsCorrectWinner()
    {
        // Arrange
        // 3 альтернативы: Alpha, Beta, Gamma
        // Все три избирателя ставят Alpha первой → Alpha бьёт всех
        var alpha = MakeAlt("Alpha");
        var beta  = MakeAlt("Beta");
        var gamma = MakeAlt("Gamma");

        // Voter1: Alpha > Beta > Gamma
        // Voter2: Alpha > Beta > Gamma
        // Voter3: Alpha > Gamma > Beta
        var votes = new List<Vote>
        {
            MakeVote((alpha, 1), (beta, 2),  (gamma, 3)),
            MakeVote((alpha, 1), (beta, 2),  (gamma, 3)),
            MakeVote((alpha, 1), (gamma, 2), (beta, 3))
        };

        var (service, decisionId) = BuildService([alpha, beta, gamma], votes);

        // Act
        var result = await service.CalculateCondorcetWinner(decisionId);

        // Assert
        result.WinnerId.Should().Be(alpha.Id, "Alpha всегда на первом месте и побеждает попарно");
        result.WinnerName.Should().Be("Alpha");
        result.Rankings.Should().HaveCount(3);
        result.Rankings.First().AlternativeId.Should().Be(alpha.Id);
    }

    [Fact(DisplayName = "Кондорсе: парадокс Кондорсе — победителя нет (цикл A>B>C>A)")]
    public async Task Condorcet_Paradox_ReturnsNullWinner()
    {
        // Arrange
        // Классический парадокс Кондорсе:
        //   Voter1: A > B > C
        //   Voter2: B > C > A
        //   Voter3: C > A > B
        // Попарно: A>B (2:1), B>C (2:1), C>A (2:1) → цикл, победителя нет
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),  // A > B > C
            MakeVote((b, 1), (c, 2), (a, 3)),  // B > C > A
            MakeVote((c, 1), (a, 2), (b, 3))   // C > A > B
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var result = await service.CalculateCondorcetWinner(decisionId);

        // Assert
        result.WinnerId.Should().BeNull("при парадоксе Кондорсе победитель отсутствует");
        result.WinnerName.Should().ContainEquivalentOf("парадокс");
        result.Rankings.Should().HaveCount(3, "ранжирование по победам строится всегда");
    }

    [Fact(DisplayName = "Кондорсе: нет голосов — возвращает объяснение без winner")]
    public async Task Condorcet_NoVotes_ReturnsEmptyResult()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");

        var (service, decisionId) = BuildService([a, b], []);

        // Act
        var result = await service.CalculateCondorcetWinner(decisionId);

        // Assert
        result.WinnerId.Should().BeNull();
        result.Explanation.Should().NotBeNullOrEmpty();
    }

    [Fact(DisplayName = "Кондорсе: Decision не найден — выбрасывает ArgumentException")]
    public async Task Condorcet_DecisionNotFound_ThrowsArgumentException()
    {
        // Arrange
        var repoMock = new Mock<IDecisionRepository>();
        repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Decision?)null);
        var service = new VotingService(repoMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CalculateCondorcetWinner(Guid.NewGuid()));
    }

    [Fact(DisplayName = "Кондорсе: две альтернативы — всегда есть победитель")]
    public async Task Condorcet_TwoAlternatives_AlwaysHasWinner()
    {
        // Arrange
        var x = MakeAlt("X");
        var y = MakeAlt("Y");

        // 3 голоса за X > Y
        var votes = new List<Vote>
        {
            MakeVote((x, 1), (y, 2)),
            MakeVote((x, 1), (y, 2)),
            MakeVote((x, 1), (y, 2))
        };

        var (service, decisionId) = BuildService([x, y], votes);

        // Act
        var result = await service.CalculateCondorcetWinner(decisionId);

        // Assert
        result.WinnerId.Should().Be(x.Id);
    }

    // ═════════════════════════════════════════════════════════════
    //  МЕТОД БОРДА
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Борда: правильный подсчёт баллов (n-1, n-2, ..., 0)")]
    public async Task Borda_CorrectScoreCalculation()
    {
        // Arrange
        // 3 альтернативы → баллы: 1-е место=2, 2-е=1, 3-е=0
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        // Voter1: A(1)=2, B(2)=1, C(3)=0
        // Voter2: A(1)=2, B(2)=1, C(3)=0
        // Voter3: B(1)=2, A(2)=1, C(3)=0
        // Итог: A=2+2+1=5, B=1+1+2=4, C=0
        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((b, 1), (a, 2), (c, 3))
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var result = await service.CalculateBordaCount(decisionId);

        // Assert
        result.WinnerId.Should().Be(a.Id, "A суммарно набирает 5 баллов — больше всех");
        result.WinnerName.Should().Be("A");
        result.Rankings.Should().HaveCount(3);

        var aRank = result.Rankings.First(r => r.AlternativeId == a.Id);
        var bRank = result.Rankings.First(r => r.AlternativeId == b.Id);
        var cRank = result.Rankings.First(r => r.AlternativeId == c.Id);

        aRank.Score.Should().Be(5);
        bRank.Score.Should().Be(4);
        cRank.Score.Should().Be(0);
        aRank.Rank.Should().Be(1);
        bRank.Rank.Should().Be(2);
        cRank.Rank.Should().Be(3);
    }

    [Fact(DisplayName = "Борда: последнее место всегда получает 0 баллов")]
    public async Task Borda_LastPlaceAlwaysGetsZeroPoints()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        // Все ставят C последним
        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((b, 1), (a, 2), (c, 3))
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var result = await service.CalculateBordaCount(decisionId);

        // Assert
        var cRank = result.Rankings.First(r => r.AlternativeId == c.Id);
        cRank.Score.Should().Be(0, "C всегда на последнем месте, баллов 0");
    }

    [Fact(DisplayName = "Борда: порядок ранков соответствует убыванию баллов")]
    public async Task Borda_RankingsOrderedByScoreDescending()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");
        var d = MakeAlt("D");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3), (d, 4)),
            MakeVote((a, 1), (b, 2), (c, 3), (d, 4))
        };

        var (service, decisionId) = BuildService([a, b, c, d], votes);

        // Act
        var result = await service.CalculateBordaCount(decisionId);

        // Assert
        var scores = result.Rankings.Select(r => r.Score).ToList();
        scores.Should().BeInDescendingOrder("ранги должны идти от большего балла к меньшему");
    }

    [Fact(DisplayName = "Борда: нет голосов — возвращает пустой результат")]
    public async Task Borda_NoVotes_ReturnsEmptyResult()
    {
        // Arrange
        var a = MakeAlt("A");
        var (service, decisionId) = BuildService([a], []);

        // Act
        var result = await service.CalculateBordaCount(decisionId);

        // Assert
        result.WinnerId.Should().BeNull();
    }

    // ═════════════════════════════════════════════════════════════
    //  МЕТОД ПРОСТОГО БОЛЬШИНСТВА (PLURALITY)
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Plurality: учитываются только голоса за первое место")]
    public async Task Plurality_OnlyFirstPlaceVotesCounted()
    {
        // Arrange
        // A получает 2 первых места, B — 1. Остальные места игнорируются.
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),  // 1-е место: A
            MakeVote((a, 1), (c, 2), (b, 3)),  // 1-е место: A
            MakeVote((b, 1), (a, 2), (c, 3))   // 1-е место: B
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var result = await service.CalculatePluralityVoting(decisionId);

        // Assert
        result.WinnerId.Should().Be(a.Id, "A получила больше первых мест");
        result.WinnerName.Should().Be("A");

        var aRank = result.Rankings.First(r => r.AlternativeId == a.Id);
        var bRank = result.Rankings.First(r => r.AlternativeId == b.Id);
        var cRank = result.Rankings.First(r => r.AlternativeId == c.Id);

        aRank.Score.Should().Be(2, "A получила 2 первых места");
        bRank.Score.Should().Be(1, "B получила 1 первое место");
        cRank.Score.Should().Be(0, "C ни разу не была на первом месте");
    }

    [Fact(DisplayName = "Plurality: кандидат без первых мест получает 0 голосов")]
    public async Task Plurality_ZeroFirstPlaceVotes_HasZeroScore()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var loser = MakeAlt("Loser");

        // Loser никогда не на первом месте
        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (loser, 3)),
            MakeVote((b, 1), (a, 2), (loser, 3))
        };

        var (service, decisionId) = BuildService([a, b, loser], votes);

        // Act
        var result = await service.CalculatePluralityVoting(decisionId);

        // Assert
        var loserRank = result.Rankings.First(r => r.AlternativeId == loser.Id);
        loserRank.Score.Should().Be(0);
        loserRank.Rank.Should().Be(3);
    }

    [Fact(DisplayName = "Plurality: нет голосов — возвращает пустой результат")]
    public async Task Plurality_NoVotes_ReturnsEmptyResult()
    {
        // Arrange
        var a = MakeAlt("A");
        var (service, decisionId) = BuildService([a], []);

        // Act
        var result = await service.CalculatePluralityVoting(decisionId);

        // Assert
        result.WinnerId.Should().BeNull();
    }

    // ═════════════════════════════════════════════════════════════
    //  МЕТОД КЕМЕНИ-ЯНГА
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Kemeny-Young: при единодушном голосовании первый в ранжировании — победитель")]
    public async Task KemenyYoung_UnanimousVoting_WinnerIsFirst()
    {
        // Arrange
        // Все 3 избирателя: A > B > C → оптимальное ранжирование [A, B, C]
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3))
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var result = await service.CalculateKemenyYoungRanking(decisionId);

        // Assert
        result.WinnerId.Should().Be(a.Id, "при единодушном голосовании победитель очевиден");
        result.Rankings.Should().HaveCount(3);
        result.Rankings.First().Rank.Should().Be(1);
    }

    [Fact(DisplayName = "Kemeny-Young: ранжирование покрывает все альтернативы")]
    public async Task KemenyYoung_AllAlternativesRanked()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");
        var d = MakeAlt("D");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3), (d, 4)),
            MakeVote((b, 1), (a, 2), (d, 3), (c, 4)),
            MakeVote((a, 1), (d, 2), (b, 3), (c, 4))
        };

        var (service, decisionId) = BuildService([a, b, c, d], votes);

        // Act
        var result = await service.CalculateKemenyYoungRanking(decisionId);

        // Assert
        result.Rankings.Should().HaveCount(4, "все 4 альтернативы должны быть в ранжировании");

        var ranks = result.Rankings.Select(r => r.Rank).OrderBy(r => r).ToList();
        ranks.Should().Equal(new[] { 1, 2, 3, 4 }, "места должны идти последовательно");
    }

    [Fact(DisplayName = "Kemeny-Young: score убывает по мере снижения ранга")]
    public async Task KemenyYoung_ScoresDecreaseWithRank()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3))
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var result = await service.CalculateKemenyYoungRanking(decisionId);

        // Assert
        // Score задаётся как (count - index), значит должен убывать
        var scores = result.Rankings.OrderBy(r => r.Rank).Select(r => r.Score).ToList();
        scores.Should().BeInDescendingOrder("score должен убывать с ростом ранга");
    }

    [Fact(DisplayName = "Kemeny-Young (жадный): 6 альтернатив — работает без ошибок")]
    public async Task KemenyYoung_Greedy_SixAlternatives_ReturnsResult()
    {
        // Arrange — более 5 альтернатив → должен использоваться жадный алгоритм
        var alts = Enumerable.Range(1, 6).Select(i => MakeAlt($"Alt{i}")).ToList();

        // Каждый голос ранжирует по порядку 1..6
        var votes = new List<Vote>
        {
            MakeVote(alts.Select((a, i) => (a, i + 1)).ToArray()),
            MakeVote(alts.Select((a, i) => (a, i + 1)).ToArray()),
            MakeVote(alts.Select((a, i) => (a, i + 1)).ToArray())
        };

        var (service, decisionId) = BuildService(alts, votes);

        // Act
        var result = await service.CalculateKemenyYoungRanking(decisionId);

        // Assert
        result.Should().NotBeNull();
        result.WinnerId.Should().NotBeNull("жадный алгоритм должен найти победителя");
        result.Rankings.Should().HaveCount(6);
    }

    [Fact(DisplayName = "Kemeny-Young: нет голосов — возвращает пустой результат")]
    public async Task KemenyYoung_NoVotes_ReturnsEmptyResult()
    {
        // Arrange
        var a = MakeAlt("A");
        var (service, decisionId) = BuildService([a], []);

        // Act
        var result = await service.CalculateKemenyYoungRanking(decisionId);

        // Assert
        result.WinnerId.Should().BeNull();
    }

    // ═════════════════════════════════════════════════════════════
    //  СРАВНЕНИЕ МЕТОДОВ (CompareVotingMethods)
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "CompareVotingMethods: возвращает результаты для всех четырёх методов")]
    public async Task CompareVotingMethods_ReturnsFourResults()
    {
        // Arrange
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3))
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var comparison = await service.CompareVotingMethods(decisionId);

        // Assert
        comparison.Results.Should().HaveCount(4, "должны быть результаты всех четырёх методов");
        comparison.Results.Should().ContainKey(VotingMethod.Condorcet);
        comparison.Results.Should().ContainKey(VotingMethod.KemenyYoung);
        comparison.Results.Should().ContainKey(VotingMethod.Borda);
        comparison.Results.Should().ContainKey(VotingMethod.Plurality);
        comparison.Analysis.Should().NotBeNullOrEmpty("анализ должен быть заполнен");
    }

    [Fact(DisplayName = "CompareVotingMethods: при единодушном голосовании все методы дают одного победителя")]
    public async Task CompareVotingMethods_UnanimousVoting_AllMethodsAgree()
    {
        // Arrange — все избиратели ставят A первым
        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3)),
            MakeVote((a, 1), (b, 2), (c, 3))
        };

        var (service, decisionId) = BuildService([a, b, c], votes);

        // Act
        var comparison = await service.CompareVotingMethods(decisionId);

        // Assert
        var allWinners = comparison.Results.Values
            .Where(r => r.WinnerId.HasValue)
            .Select(r => r.WinnerId!.Value)
            .Distinct()
            .ToList();

        allWinners.Should().HaveCount(1, "при единодушном голосовании все методы должны выбрать одного победителя");
        allWinners.Single().Should().Be(a.Id);
        comparison.Analysis.Should().ContainEquivalentOf("согласны");
    }

    // ═════════════════════════════════════════════════════════════
    //  СКВОЗНОЙ ТЕСТ (End-to-End сценарий)
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Сквозной: разные победители при разных методах (реальный пример)")]
    public async Task EndToEnd_DifferentMethodsMayProduceDifferentWinners()
    {
        // Arrange
        // Классический пример расхождения Борда vs Кондорсе:
        //
        //   Voter1 (x3): A > B > C > D
        //   Voter2 (x2): D > B > C > A
        //   Voter3 (x2): C > B > D > A
        //
        // Борда может выбрать B (много вторых мест),
        // Plurality выберет A (3 первых места).
        // Это нормально — просто проверяем, что оба возвращают корректный результат.

        var a = MakeAlt("A");
        var b = MakeAlt("B");
        var c = MakeAlt("C");
        var d = MakeAlt("D");

        var votes = new List<Vote>
        {
            MakeVote((a, 1), (b, 2), (c, 3), (d, 4)), // Voter1
            MakeVote((a, 1), (b, 2), (c, 3), (d, 4)), // Voter1 dup
            MakeVote((a, 1), (b, 2), (c, 3), (d, 4)), // Voter1 dup
            MakeVote((d, 1), (b, 2), (c, 3), (a, 4)), // Voter2
            MakeVote((d, 1), (b, 2), (c, 3), (a, 4)), // Voter2 dup
            MakeVote((c, 1), (b, 2), (d, 3), (a, 4)), // Voter3
            MakeVote((c, 1), (b, 2), (d, 3), (a, 4)), // Voter3 dup
        };

        var (service, decisionId) = BuildService([a, b, c, d], votes);

        // Act
        var plurality = await service.CalculatePluralityVoting(decisionId);
        var borda     = await service.CalculateBordaCount(decisionId);
        var condorcet = await service.CalculateCondorcetWinner(decisionId);

        // Assert — каждый метод должен вернуть корректного победителя (не null)
        plurality.WinnerId.Should().Be(a.Id, "Plurality: A получает 3 первых голоса");
        borda.WinnerId.Should().Be(b.Id,     "Borda: B выигрывает за счёт стабильных вторых мест");
        condorcet.WinnerId.Should().Be(b.Id, "Condorcet: B побеждает всех в попарных сравнениях");
    }
}
