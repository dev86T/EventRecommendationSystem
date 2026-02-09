using EventRecommendationSystem.Core.Entities;
using EventRecommendationSystem.Core.Interfaces;
using System.Text.Json;

namespace EventRecommendationSystem.Infrastructure.Services;

public class VotingService : IVotingService
{
    private readonly IDecisionRepository _decisionRepository;

    public VotingService(IDecisionRepository decisionRepository)
    {
        _decisionRepository = decisionRepository;
    }

    public async Task<VotingResult> CalculateCondorcetWinner(Guid decisionId)
    {
        var decision = await _decisionRepository.GetByIdAsync(decisionId);
        if (decision == null)
            throw new ArgumentException("Decision not found");

        var alternatives = decision.Alternatives.ToList();
        var votes = decision.Votes.ToList();

        if (alternatives.Count == 0 || votes.Count == 0)
        {
            return new VotingResult
            {
                Explanation = "Недостаточно данных для расчета"
            };
        }

        // Построение матрицы попарных сравнений
        var pairwiseMatrix = BuildPairwiseMatrix(alternatives, votes);
        
        // Поиск победителя Кондорсе
        var condorcetWinner = FindCondorcetWinner(alternatives, pairwiseMatrix);
        
        var rankings = RankAlternativesByPairwiseWins(alternatives, pairwiseMatrix);

        return new VotingResult
        {
            WinnerId = condorcetWinner?.Id,
            WinnerName = condorcetWinner?.Name ?? "Победитель Кондорсе не найден (парадокс Кондорсе)",
            Rankings = rankings,
            Metrics = new Dictionary<string, object>
            {
                { "pairwiseMatrix", pairwiseMatrix },
                { "hasCondorcetWinner", condorcetWinner != null }
            },
            Explanation = condorcetWinner != null
                ? $"Метод Кондорсе: победитель {condorcetWinner.Name} побеждает все альтернативы в парных сравнениях"
                : "Парадокс Кондорсе: не существует альтернативы, которая побеждает все остальные в парных сравнениях"
        };
    }

    public async Task<VotingResult> CalculateKemenyYoungRanking(Guid decisionId)
    {
        var decision = await _decisionRepository.GetByIdAsync(decisionId);
        if (decision == null)
            throw new ArgumentException("Decision not found");

        var alternatives = decision.Alternatives.ToList();
        var votes = decision.Votes.ToList();

        if (alternatives.Count == 0 || votes.Count == 0)
        {
            return new VotingResult
            {
                Explanation = "Недостаточно данных для расчета"
            };
        }

        // Построение матрицы попарных сравнений
        var pairwiseMatrix = BuildPairwiseMatrix(alternatives, votes);
        
        // Поиск оптимального ранжирования Kemeny-Young
        var optimalRanking = FindKemenyYoungRanking(alternatives, pairwiseMatrix);
        
        var rankings = optimalRanking.Select((alt, index) => new RankedAlternative
        {
            AlternativeId = alt.Id,
            Name = alt.Name,
            Rank = index + 1,
            Score = optimalRanking.Count - index
        }).ToList();

        return new VotingResult
        {
            WinnerId = optimalRanking.FirstOrDefault()?.Id,
            WinnerName = optimalRanking.FirstOrDefault()?.Name ?? "",
            Rankings = rankings,
            Metrics = new Dictionary<string, object>
            {
                { "pairwiseMatrix", pairwiseMatrix }
            },
            Explanation = $"Метод Kemeny-Young: найдено оптимальное ранжирование, максимизирующее согласованность с парными предпочтениями избирателей. Победитель: {optimalRanking.FirstOrDefault()?.Name}"
        };
    }

    public async Task<VotingResult> CalculateBordaCount(Guid decisionId)
    {
        var decision = await _decisionRepository.GetByIdAsync(decisionId);
        if (decision == null)
            throw new ArgumentException("Decision not found");

        var alternatives = decision.Alternatives.ToList();
        var votes = decision.Votes.ToList();

        if (alternatives.Count == 0 || votes.Count == 0)
        {
            return new VotingResult
            {
                Explanation = "Недостаточно данных для расчета"
            };
        }

        // Подсчет баллов Борда
        var bordaScores = new Dictionary<Guid, int>();
        foreach (var alt in alternatives)
        {
            bordaScores[alt.Id] = 0;
        }

        int maxRank = alternatives.Count;
        foreach (var vote in votes)
        {
            foreach (var ranking in vote.Rankings)
            {
                // Борда: первое место = n-1 баллов, второе = n-2, и т.д.
                bordaScores[ranking.AlternativeId] += maxRank - ranking.Rank;
            }
        }

        var rankings = bordaScores
            .OrderByDescending(kvp => kvp.Value)
            .Select((kvp, index) => new RankedAlternative
            {
                AlternativeId = kvp.Key,
                Name = alternatives.First(a => a.Id == kvp.Key).Name,
                Rank = index + 1,
                Score = kvp.Value
            })
            .ToList();

        var winner = rankings.FirstOrDefault();

        return new VotingResult
        {
            WinnerId = winner?.AlternativeId,
            WinnerName = winner?.Name ?? "",
            Rankings = rankings,
            Metrics = new Dictionary<string, object>
            {
                { "bordaScores", bordaScores }
            },
            Explanation = $"Метод Борда: каждый избиратель присваивает баллы альтернативам в зависимости от их позиции в ранжировании. Победитель: {winner?.Name} с {winner?.Score} баллами"
        };
    }

    public async Task<VotingResult> CalculatePluralityVoting(Guid decisionId)
    {
        var decision = await _decisionRepository.GetByIdAsync(decisionId);
        if (decision == null)
            throw new ArgumentException("Decision not found");

        var alternatives = decision.Alternatives.ToList();
        var votes = decision.Votes.ToList();

        if (alternatives.Count == 0 || votes.Count == 0)
        {
            return new VotingResult
            {
                Explanation = "Недостаточно данных для расчета"
            };
        }

        // Подсчет голосов только за первые места
        var firstPlaceVotes = new Dictionary<Guid, int>();
        foreach (var alt in alternatives)
        {
            firstPlaceVotes[alt.Id] = 0;
        }

        foreach (var vote in votes)
        {
            var firstChoice = vote.Rankings.OrderBy(r => r.Rank).FirstOrDefault();
            if (firstChoice != null)
            {
                firstPlaceVotes[firstChoice.AlternativeId]++;
            }
        }

        var rankings = firstPlaceVotes
            .OrderByDescending(kvp => kvp.Value)
            .Select((kvp, index) => new RankedAlternative
            {
                AlternativeId = kvp.Key,
                Name = alternatives.First(a => a.Id == kvp.Key).Name,
                Rank = index + 1,
                Score = kvp.Value
            })
            .ToList();

        var winner = rankings.FirstOrDefault();

        return new VotingResult
        {
            WinnerId = winner?.AlternativeId,
            WinnerName = winner?.Name ?? "",
            Rankings = rankings,
            Metrics = new Dictionary<string, object>
            {
                { "firstPlaceVotes", firstPlaceVotes }
            },
            Explanation = $"Простое большинство (Plurality): учитываются только первые места. Победитель: {winner?.Name} с {winner?.Score} голосами"
        };
    }

    public async Task<ComparisonResult> CompareVotingMethods(Guid decisionId)
    {
        var condorcet = await CalculateCondorcetWinner(decisionId);
        var kemenyYoung = await CalculateKemenyYoungRanking(decisionId);
        var borda = await CalculateBordaCount(decisionId);
        var plurality = await CalculatePluralityVoting(decisionId);

        var results = new Dictionary<VotingMethod, VotingResult>
        {
            { VotingMethod.Condorcet, condorcet },
            { VotingMethod.KemenyYoung, kemenyYoung },
            { VotingMethod.Borda, borda },
            { VotingMethod.Plurality, plurality }
        };

        var analysis = AnalyzeMethodDifferences(results);

        return new ComparisonResult
        {
            Results = results,
            Analysis = analysis
        };
    }

    // Вспомогательные методы

    private Dictionary<string, int> BuildPairwiseMatrix(List<Alternative> alternatives, List<Vote> votes)
    {
        var matrix = new Dictionary<string, int>();

        // Инициализация матрицы
        foreach (var alt1 in alternatives)
        {
            foreach (var alt2 in alternatives)
            {
                if (alt1.Id != alt2.Id)
                {
                    matrix[$"{alt1.Id}>{alt2.Id}"] = 0;
                }
            }
        }

        // Заполнение матрицы на основе голосов
        foreach (var vote in votes)
        {
            var rankings = vote.Rankings.OrderBy(r => r.Rank).ToList();
            
            for (int i = 0; i < rankings.Count; i++)
            {
                for (int j = i + 1; j < rankings.Count; j++)
                {
                    var preferred = rankings[i].AlternativeId;
                    var lessPreferred = rankings[j].AlternativeId;
                    matrix[$"{preferred}>{lessPreferred}"]++;
                }
            }
        }

        return matrix;
    }

    private Alternative? FindCondorcetWinner(List<Alternative> alternatives, Dictionary<string, int> pairwiseMatrix)
    {
        foreach (var candidate in alternatives)
        {
            bool isCondorcetWinner = true;
            
            foreach (var opponent in alternatives)
            {
                if (candidate.Id == opponent.Id)
                    continue;

                var candidateWins = pairwiseMatrix.GetValueOrDefault($"{candidate.Id}>{opponent.Id}", 0);
                var opponentWins = pairwiseMatrix.GetValueOrDefault($"{opponent.Id}>{candidate.Id}", 0);

                if (candidateWins <= opponentWins)
                {
                    isCondorcetWinner = false;
                    break;
                }
            }

            if (isCondorcetWinner)
                return candidate;
        }

        return null;
    }

    private List<RankedAlternative> RankAlternativesByPairwiseWins(List<Alternative> alternatives, Dictionary<string, int> pairwiseMatrix)
    {
        var scores = new Dictionary<Guid, int>();
        
        foreach (var alt in alternatives)
        {
            int wins = 0;
            foreach (var opponent in alternatives)
            {
                if (alt.Id != opponent.Id)
                {
                    var altWins = pairwiseMatrix.GetValueOrDefault($"{alt.Id}>{opponent.Id}", 0);
                    var oppWins = pairwiseMatrix.GetValueOrDefault($"{opponent.Id}>{alt.Id}", 0);
                    if (altWins > oppWins)
                        wins++;
                }
            }
            scores[alt.Id] = wins;
        }

        return scores
            .OrderByDescending(kvp => kvp.Value)
            .Select((kvp, index) => new RankedAlternative
            {
                AlternativeId = kvp.Key,
                Name = alternatives.First(a => a.Id == kvp.Key).Name,
                Rank = index + 1,
                Score = kvp.Value
            })
            .ToList();
    }

    private List<Alternative> FindKemenyYoungRanking(List<Alternative> alternatives, Dictionary<string, int> pairwiseMatrix)
    {
        // Упрощенная эвристическая версия Kemeny-Young
        // Полный алгоритм требует перебора всех перестановок (NP-hard)
        
        if (alternatives.Count <= 5)
        {
            // Для малого числа альтернатив используем точный алгоритм
            return FindOptimalRankingExact(alternatives, pairwiseMatrix);
        }
        else
        {
            // Для большого числа используем жадную эвристику
            return FindOptimalRankingGreedy(alternatives, pairwiseMatrix);
        }
    }

    private List<Alternative> FindOptimalRankingExact(List<Alternative> alternatives, Dictionary<string, int> pairwiseMatrix)
    {
        var bestRanking = alternatives.ToList();
        var bestScore = CalculateKemenyScore(bestRanking, pairwiseMatrix);

        foreach (var permutation in GetPermutations(alternatives))
        {
            var score = CalculateKemenyScore(permutation, pairwiseMatrix);
            if (score > bestScore)
            {
                bestScore = score;
                bestRanking = permutation;
            }
        }

        return bestRanking;
    }

    private List<Alternative> FindOptimalRankingGreedy(List<Alternative> alternatives, Dictionary<string, int> pairwiseMatrix)
    {
        var ranking = new List<Alternative>();
        var remaining = new List<Alternative>(alternatives);

        while (remaining.Any())
        {
            var best = remaining[0];
            int bestScore = int.MinValue;

            foreach (var candidate in remaining)
            {
                int score = 0;
                foreach (var other in remaining)
                {
                    if (candidate.Id != other.Id)
                    {
                        score += pairwiseMatrix.GetValueOrDefault($"{candidate.Id}>{other.Id}", 0);
                    }
                }

                if (score > bestScore)
                {
                    bestScore = score;
                    best = candidate;
                }
            }

            ranking.Add(best);
            remaining.Remove(best);
        }

        return ranking;
    }

    private int CalculateKemenyScore(List<Alternative> ranking, Dictionary<string, int> pairwiseMatrix)
    {
        int score = 0;
        for (int i = 0; i < ranking.Count; i++)
        {
            for (int j = i + 1; j < ranking.Count; j++)
            {
                score += pairwiseMatrix.GetValueOrDefault($"{ranking[i].Id}>{ranking[j].Id}", 0);
            }
        }
        return score;
    }

    private IEnumerable<List<Alternative>> GetPermutations(List<Alternative> list)
    {
        if (list.Count == 1)
        {
            yield return list;
            yield break;
        }

        foreach (var item in list)
        {
            var remaining = list.Where(x => x.Id != item.Id).ToList();
            foreach (var permutation in GetPermutations(remaining))
            {
                yield return new List<Alternative> { item }.Concat(permutation).ToList();
            }
        }
    }

    private string AnalyzeMethodDifferences(Dictionary<VotingMethod, VotingResult> results)
    {
        var winners = results
            .Where(r => r.Value.WinnerId.HasValue)
            .Select(r => new { Method = r.Key, WinnerId = r.Value.WinnerId!.Value, WinnerName = r.Value.WinnerName })
            .ToList();

        if (!winners.Any())
        {
            return "Недостаточно данных для анализа";
        }

        var uniqueWinners = winners.Select(w => w.WinnerId).Distinct().Count();

        if (uniqueWinners == 1)
        {
            return $"Все методы согласны: победитель - {winners.First().WinnerName}. Это указывает на сильное консенсусное предпочтение в группе.";
        }
        else
        {
            var analysis = "Методы дают разные результаты:\n";
            foreach (var winner in winners)
            {
                analysis += $"- {winner.Method}: {winner.WinnerName}\n";
            }
            analysis += "\nРазличия могут быть вызваны:\n";
            analysis += "- Парадоксом Кондорсе (циклические предпочтения)\n";
            analysis += "- Различной чувствительностью методов к интенсивности предпочтений\n";
            analysis += "- Стратегическим голосованием\n";
            analysis += "\nРекомендуется использовать Kemeny-Young для наиболее сбалансированного результата.";
            
            return analysis;
        }
    }
}
