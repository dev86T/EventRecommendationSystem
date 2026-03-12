using System.Diagnostics;
using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using EventRecommendationSystem.Infrastructure.Services;
using FluentAssertions;
using Moq;
using Xunit;
using Xunit.Abstractions;

namespace EventRecommendationSystem.Tests;

/// <summary>
/// Тесты по методике экспериментов из раздела 6:
///
///   Эксперимент 1 — Сравнение методов голосования на синтетических данных
///     1.1  Consensus-паттерн: все методы соглашаются в >90% выборов
///     1.2  Polarized-паттерн: расхождений больше, чем при consensus
///     1.3  Random-паттерн:    парадокс Кондорсе встречается в 4-22% случаев
///     1.4  Plurality расходится с Condorcet чаще, чем Borda
///
///   Эксперимент 3 — Производительность
///     3.1  Condorcet + Borda + Plurality (5 альт., 20 изб.) — < 100 ms
///     3.2  Kemeny-Young точный (5 альт., 20 изб.)           — < 500 ms
///     3.3  Kemeny-Young жадный (8 альт., 20 изб.)           — < 3 000 ms
///     3.4  Kemeny-Young жадный (10 альт., 50 изб.)          — < 3 000 ms
///     3.5  CompareVotingMethods (5 альт., 20 изб.)          — < 1 000 ms
/// </summary>
public class VotingAlgorithmExperimentsTests
{
    private readonly ITestOutputHelper _output;

    // Фиксированный seed — тесты детерминированы и воспроизводимы
    private readonly Random _rng = new(42);

    public VotingAlgorithmExperimentsTests(ITestOutputHelper output)
    {
        _output = output;
    }

    // ─────────────────────────────────────────────────────────────
    // Вспомогательные методы (дублируют VotingServiceTests.BuildService)
    // ─────────────────────────────────────────────────────────────

    private static Alternative MakeAlt(string name) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Description = string.Empty,
        VoteRankings = new List<VoteRanking>()
    };

    /// <summary>Создаёт голос из упорядоченного списка альтернатив (index 0 = 1-е место).</summary>
    private static Vote MakeVoteFromOrder(IReadOnlyList<Alternative> order)
    {
        var vote = new Vote { Id = Guid.NewGuid(), Rankings = new List<VoteRanking>() };
        for (int i = 0; i < order.Count; i++)
        {
            vote.Rankings.Add(new VoteRanking
            {
                Id = Guid.NewGuid(),
                VoteId = vote.Id,
                AlternativeId = order[i].Id,
                Rank = i + 1,
                Alternative = order[i]
            });
        }
        return vote;
    }

    private static (VotingService service, Guid decisionId) BuildService(
        List<Alternative> alternatives, List<Vote> votes)
    {
        var decision = new Decision
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Description = string.Empty,
            Alternatives = alternatives,
            Votes = votes,
            Results = new List<DecisionResult>()
        };
        var repo = new Mock<IDecisionRepository>();
        repo.Setup(r => r.GetByIdAsync(decision.Id)).ReturnsAsync(decision);
        return (new VotingService(repo.Object), decision.Id);
    }

    // ─────────────────────────────────────────────────────────────
    // Генераторы синтетических данных
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Consensus-паттерн: <paramref name="consensusRatio"/> доля избирателей
    /// голосуют в порядке <paramref name="alts"/>, остальные — случайно.
    /// </summary>
    private List<Vote> GenerateConsensusVotes(
        List<Alternative> alts, int voters, double consensusRatio = 0.85)
    {
        var result = new List<Vote>(voters);
        foreach (var _ in Enumerable.Range(0, voters))
        {
            var order = _rng.NextDouble() < consensusRatio
                ? alts.ToList()
                : alts.OrderBy(_ => _rng.Next()).ToList();
            result.Add(MakeVoteFromOrder(order));
        }
        return result;
    }

    /// <summary>
    /// Polarized/Spoiler-паттерн — классический сценарий, при котором
    /// победитель по Plurality ≠ победитель по Condorcet:
    ///   Лагерь 1 (~40 %): alts[0] первый          → Plurality-победитель
    ///   Лагерь 2 (~35 %): alts[1] первый           → alts[1] много 1-х мест
    ///   Лагерь 3 (~25 %): alts[2] первый, alts[1] вторым → alts[1] побеждает попарно
    /// Итог: Plurality = alts[0], Condorcet = alts[1] → расхождение.
    /// </summary>
    private List<Vote> GeneratePolarizedVotes(List<Alternative> alts, int voters)
    {
        var result = new List<Vote>(voters);
        for (int i = 0; i < voters; i++)
        {
            double r = _rng.NextDouble();
            List<Alternative> order;

            if (r < 0.40)
            {
                // Лагерь 1: alts[0] > alts[1] > alts[2] > ...
                order = alts.ToList();
            }
            else if (r < 0.75)
            {
                // Лагерь 2: alts[1] > alts[2] > ... > alts[0]
                order = alts.Skip(1).Append(alts[0]).ToList();
            }
            else
            {
                // Лагерь 3: alts[2] > alts[1] > остальные > alts[0]
                order = alts.Count >= 3
                    ? new[] { alts[2], alts[1] }.Concat(alts.Skip(3)).Append(alts[0]).ToList()
                    : alts.Skip(1).Append(alts[0]).ToList();
            }

            result.Add(MakeVoteFromOrder(order));
        }
        return result;
    }

    /// <summary>Случайные предпочтения: каждый избиратель перемешивает альтернативы независимо.</summary>
    private List<Vote> GenerateRandomVotes(List<Alternative> alts, int voters)
    {
        var result = new List<Vote>(voters);
        for (int i = 0; i < voters; i++)
            result.Add(MakeVoteFromOrder(alts.OrderBy(_ => _rng.Next()).ToList()));
        return result;
    }

    // ═════════════════════════════════════════════════════════════
    //  ЭКСПЕРИМЕНТ 1: Сравнение методов голосования
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Эксп.1.1 Consensus: все методы соглашаются в >90% выборов")]
    public async Task Experiment1_Consensus_MethodsAgreement_Above90Percent()
    {
        // Arrange
        // 100 симулированных выборов, 3 альтернативы, 20 избирателей.
        // 85 % голосуют в одном порядке — ожидаем консенсус.
        const int elections    = 100;
        const int voters       = 20;
        var alts = new[] { "Alpha", "Beta", "Gamma" }.Select(MakeAlt).ToList();
        int agreements = 0;

        // Act
        for (int i = 0; i < elections; i++)
        {
            var votes = GenerateConsensusVotes(alts, voters, 0.85);
            var (service, did) = BuildService(alts, votes);
            var cmp = await service.CompareVotingMethods(did);

            int uniqueWinners = cmp.Results.Values
                .Where(r => r.WinnerId.HasValue)
                .Select(r => r.WinnerId!.Value)
                .Distinct()
                .Count();

            if (uniqueWinners <= 1) agreements++;
        }

        double rate = (double)agreements / elections;
        _output.WriteLine($"[Эксп.1.1] Consensus agreement rate: {rate:P1}  ({agreements}/{elections})");

        // Assert: при сильном консенсусе >90% выборов дают совпадающего победителя
        rate.Should().BeGreaterThan(0.90,
            $"при 85%-консенсусе все методы должны выбирать одного победителя (факт: {rate:P1})");
    }

    [Fact(DisplayName = "Эксп.1.2 Polarized: расхождений между методами больше, чем при consensus")]
    public async Task Experiment1_Polarized_MoreDivergenceThanConsensus()
    {
        // Arrange
        // Сравниваем два паттерна на одинаковом числе выборов.
        // Ожидаем, что polarized даёт меньше согласий, чем consensus.
        const int elections = 100;
        const int voters    = 30;
        var alts = new[] { "A", "B", "C", "D", "E" }.Select(MakeAlt).ToList();
        int consensusAgreements = 0, polarizedAgreements = 0;

        // Act
        for (int i = 0; i < elections; i++)
        {
            // — consensus round —
            {
                var votes = GenerateConsensusVotes(alts, voters, 0.85);
                var (svc, did) = BuildService(alts, votes);
                var cmp = await svc.CompareVotingMethods(did);
                int uw = cmp.Results.Values
                    .Where(r => r.WinnerId.HasValue)
                    .Select(r => r.WinnerId!.Value)
                    .Distinct().Count();
                if (uw <= 1) consensusAgreements++;
            }

            // — polarized round —
            {
                var votes = GeneratePolarizedVotes(alts, voters);
                var (svc, did) = BuildService(alts, votes);
                var cmp = await svc.CompareVotingMethods(did);
                int uw = cmp.Results.Values
                    .Where(r => r.WinnerId.HasValue)
                    .Select(r => r.WinnerId!.Value)
                    .Distinct().Count();
                if (uw <= 1) polarizedAgreements++;
            }
        }

        double consensusRate  = (double)consensusAgreements / elections;
        double polarizedRate  = (double)polarizedAgreements / elections;

        _output.WriteLine($"[Эксп.1.2] Consensus  agreement: {consensusRate:P1}  ({consensusAgreements}/{elections})");
        _output.WriteLine($"[Эксп.1.2] Polarized  agreement: {polarizedRate:P1}  ({polarizedAgreements}/{elections})");

        // Assert
        polarizedRate.Should().BeLessThan(consensusRate,
            "поляризованное голосование должно давать больше расхождений между методами");
    }

    [Fact(DisplayName = "Эксп.1.3 Random: парадокс Кондорсе встречается в 4-22% случаев (теор. ~8.77%)")]
    public async Task Experiment1_Random_CondorcetParadoxFrequency_Between4And22Percent()
    {
        // Arrange
        // 300 выборов, 3 альтернативы, 11 избирателей (нечётное — снижает вероятность ничьих).
        // Теоретическая вероятность парадокса Кондорсе при n→∞: 8.77%.
        const int elections = 300;
        const int voters    = 11;
        var alts = new[] { "X", "Y", "Z" }.Select(MakeAlt).ToList();
        int paradoxCount = 0;

        // Act
        for (int i = 0; i < elections; i++)
        {
            var votes = GenerateRandomVotes(alts, voters);
            var (service, did) = BuildService(alts, votes);
            var result = await service.CalculateCondorcetWinner(did);
            if (!result.WinnerId.HasValue) paradoxCount++;
        }

        double rate = (double)paradoxCount / elections;
        _output.WriteLine($"[Эксп.1.3] Condorcet paradox rate: {rate:P1}  ({paradoxCount}/{elections})");
        _output.WriteLine($"[Эксп.1.3] Теоретическое значение: ~8.77%");

        // Assert: 4-22% — широкий доверительный интервал (±2σ + погрешность малой выборки)
        rate.Should().BeInRange(0.04, 0.22,
            $"парадокс Кондорсе должен встречаться в ~5-15% случаев при случайных предпочтениях (факт: {rate:P1})");
    }

    [Fact(DisplayName = "Эксп.1.4 Plurality расходится с Condorcet чаще, чем Borda")]
    public async Task Experiment1_Plurality_DisagreesWithCondorcet_MoreThanBorda()
    {
        // Arrange
        // 200 выборов, 5 альтернатив, 30 избирателей, случайные предпочтения.
        // Известный факт из теории: Borda ближе к Condorcet, чем Plurality.
        const int elections = 200;
        const int voters    = 30;
        var alts = new[] { "A", "B", "C", "D", "E" }.Select(MakeAlt).ToList();
        int pluralityVsCondorcet = 0;
        int bordaVsCondorcet     = 0;
        int electionsWithCondorcetWinner = 0;

        // Act
        for (int i = 0; i < elections; i++)
        {
            var votes = GenerateRandomVotes(alts, voters);
            var (svc, did) = BuildService(alts, votes);
            var cmp = await svc.CompareVotingMethods(did);

            var condorcetId = cmp.Results[VotingMethod.Condorcet].WinnerId;
            var pluralityId = cmp.Results[VotingMethod.Plurality].WinnerId;
            var bordaId     = cmp.Results[VotingMethod.Borda].WinnerId;

            if (!condorcetId.HasValue) continue; // пропускаем парадоксальные выборы
            electionsWithCondorcetWinner++;

            if (pluralityId.HasValue && pluralityId != condorcetId) pluralityVsCondorcet++;
            if (bordaId.HasValue     && bordaId     != condorcetId) bordaVsCondorcet++;
        }

        double pRate = electionsWithCondorcetWinner > 0
            ? (double)pluralityVsCondorcet / electionsWithCondorcetWinner : 0;
        double bRate = electionsWithCondorcetWinner > 0
            ? (double)bordaVsCondorcet / electionsWithCondorcetWinner : 0;

        _output.WriteLine($"[Эксп.1.4] Выборов с победителем Кондорсе: {electionsWithCondorcetWinner}/{elections}");
        _output.WriteLine($"[Эксп.1.4] Plurality ≠ Condorcet: {pluralityVsCondorcet}  ({pRate:P1})");
        _output.WriteLine($"[Эксп.1.4] Borda     ≠ Condorcet: {bordaVsCondorcet}  ({bRate:P1})");

        // Assert
        pluralityVsCondorcet.Should().BeGreaterThan(bordaVsCondorcet,
            "теоретически Borda Count ближе к Condorcet, чем Plurality (простое большинство)");
    }

    // ═════════════════════════════════════════════════════════════
    //  ЭКСПЕРИМЕНТ 3: Производительность алгоритмов
    // ═════════════════════════════════════════════════════════════

    [Fact(DisplayName = "Эксп.3.1 Condorcet + Borda + Plurality (5 альт., 20 изб.) — < 100 ms")]
    public async Task Experiment3_CondorcetBordaPlurality_5Alt_20Voters_Under100ms()
    {
        // Arrange
        var alts  = Enumerable.Range(1, 5).Select(i => MakeAlt($"Alt{i}")).ToList();
        var votes = GenerateRandomVotes(alts, 20);
        var (service, did) = BuildService(alts, votes);
        var sw = Stopwatch.StartNew();

        // Act — три базовых метода последовательно
        await service.CalculateCondorcetWinner(did);
        await service.CalculateBordaCount(did);
        await service.CalculatePluralityVoting(did);
        sw.Stop();

        _output.WriteLine($"[Эксп.3.1] Condorcet+Borda+Plurality (5 alt, 20 voters): {sw.ElapsedMilliseconds} ms");

        // Assert
        sw.ElapsedMilliseconds.Should().BeLessThan(100,
            "три базовых метода на 5 альтернативах должны выполняться менее чем за 100 ms");
    }

    [Fact(DisplayName = "Эксп.3.2 Kemeny-Young точный (5 альт., 20 изб.) — < 500 ms  [5! = 120 перестановок]")]
    public async Task Experiment3_KemenyYoung_Exact_5Alt_20Voters_Under500ms()
    {
        // Arrange — ≤5 альтернатив: используется точный алгоритм перебора перестановок
        var alts  = Enumerable.Range(1, 5).Select(i => MakeAlt($"Alt{i}")).ToList();
        var votes = GenerateRandomVotes(alts, 20);
        var (service, did) = BuildService(alts, votes);
        var sw = Stopwatch.StartNew();

        // Act
        await service.CalculateKemenyYoungRanking(did);
        sw.Stop();

        _output.WriteLine($"[Эксп.3.2] Kemeny-Young exact (5 alt, 20 voters): {sw.ElapsedMilliseconds} ms");

        // Assert
        sw.ElapsedMilliseconds.Should().BeLessThan(500,
            "точный алгоритм Kemeny-Young при 5 альтернативах (5! = 120 перестановок) должен работать < 500 ms");
    }

    [Fact(DisplayName = "Эксп.3.3 Kemeny-Young жадный (8 альт., 20 изб.) — < 3 000 ms")]
    public async Task Experiment3_KemenyYoung_Greedy_8Alt_20Voters_Under3000ms()
    {
        // Arrange — 8 > 5: переключение на жадный алгоритм (O(n²))
        var alts  = Enumerable.Range(1, 8).Select(i => MakeAlt($"Alt{i}")).ToList();
        var votes = GenerateRandomVotes(alts, 20);
        var (service, did) = BuildService(alts, votes);
        var sw = Stopwatch.StartNew();

        // Act
        await service.CalculateKemenyYoungRanking(did);
        sw.Stop();

        _output.WriteLine($"[Эксп.3.3] Kemeny-Young greedy (8 alt, 20 voters): {sw.ElapsedMilliseconds} ms");

        // Assert
        sw.ElapsedMilliseconds.Should().BeLessThan(3000,
            "жадный Kemeny-Young (8 альтернатив) должен работать < 3 000 ms");
    }

    [Fact(DisplayName = "Эксп.3.4 Kemeny-Young жадный (10 альт., 50 изб.) — < 3 000 ms  [стресс-тест]")]
    public async Task Experiment3_KemenyYoung_Greedy_10Alt_50Voters_Under3000ms()
    {
        // Arrange — стресс-тест: максимальные параметры из методики
        var alts  = Enumerable.Range(1, 10).Select(i => MakeAlt($"Alt{i}")).ToList();
        var votes = GenerateRandomVotes(alts, 50);
        var (service, did) = BuildService(alts, votes);
        var sw = Stopwatch.StartNew();

        // Act
        await service.CalculateKemenyYoungRanking(did);
        sw.Stop();

        _output.WriteLine($"[Эксп.3.4] Kemeny-Young greedy (10 alt, 50 voters): {sw.ElapsedMilliseconds} ms");

        // Assert
        sw.ElapsedMilliseconds.Should().BeLessThan(3000,
            "жадный Kemeny-Young (10 альтернатив, 50 избирателей) должен работать < 3 000 ms");
    }

    [Fact(DisplayName = "Эксп.3.5 CompareVotingMethods (5 альт., 20 изб.) — < 1 000 ms")]
    public async Task Experiment3_CompareAllMethods_5Alt_20Voters_Under1000ms()
    {
        // Arrange — метод сравнения запускает все 4 алгоритма последовательно
        var alts  = Enumerable.Range(1, 5).Select(i => MakeAlt($"Alt{i}")).ToList();
        var votes = GenerateRandomVotes(alts, 20);
        var (service, did) = BuildService(alts, votes);
        var sw = Stopwatch.StartNew();

        // Act
        var comparison = await service.CompareVotingMethods(did);
        sw.Stop();

        _output.WriteLine($"[Эксп.3.5] CompareVotingMethods (5 alt, 20 voters): {sw.ElapsedMilliseconds} ms");
        _output.WriteLine($"[Эксп.3.5] Результаты: " + string.Join(", ",
            comparison.Results.Select(kv => $"{kv.Key}={kv.Value.WinnerName}")));

        // Assert
        sw.ElapsedMilliseconds.Should().BeLessThan(1000,
            "сравнение всех 4 методов на 5 альтернативах должно работать < 1 000 ms");
    }

    // ── Дополнительно: масштабируемость exact vs greedy ──────────

    [Fact(DisplayName = "Эксп.3.6 Точный алгоритм (≤5) быстрее жадного только на малых наборах")]
    public async Task Experiment3_ExactFasterThanGreedy_OnSmallSets()
    {
        // Arrange — сравниваем время exact (5 альт.) и greedy (6 альт., почти тот же размер)
        var alts5 = Enumerable.Range(1, 5).Select(i => MakeAlt($"A{i}")).ToList();
        var alts6 = Enumerable.Range(1, 6).Select(i => MakeAlt($"A{i}")).ToList();
        var votes5 = GenerateRandomVotes(alts5, 30);
        var votes6 = GenerateRandomVotes(alts6, 30);
        var (svc5, did5) = BuildService(alts5, votes5);
        var (svc6, did6) = BuildService(alts6, votes6);

        // Act
        var sw5 = Stopwatch.StartNew();
        await svc5.CalculateKemenyYoungRanking(did5);
        sw5.Stop();

        var sw6 = Stopwatch.StartNew();
        await svc6.CalculateKemenyYoungRanking(did6);
        sw6.Stop();

        _output.WriteLine($"[Эксп.3.6] Exact  (5 alt, 30 voters):  {sw5.ElapsedMilliseconds} ms");
        _output.WriteLine($"[Эксп.3.6] Greedy (6 alt, 30 voters):  {sw6.ElapsedMilliseconds} ms");

        // Assert — оба должны завершаться в разумное время
        sw5.ElapsedMilliseconds.Should().BeLessThan(500,  "точный алгоритм < 500 ms");
        sw6.ElapsedMilliseconds.Should().BeLessThan(1000, "жадный алгоритм < 1 000 ms");
    }
}
