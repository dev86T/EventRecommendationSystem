import React, { useState } from 'react';
import './ResultsDisplay.css';

const ResultsDisplay = ({ results, alternatives }) => {
  const [selectedMethod, setSelectedMethod] = useState('Condorcet');

  if (!results) {
    return (
      <div className="no-results">
        <p>Нажмите кнопку "Рассчитать результаты" для получения итогов голосования</p>
      </div>
    );
  }

  const methods = {
    'Condorcet': 'Метод Кондорсе',
    'KemenyYoung': 'Метод Кемени-Янга',
    'Borda': 'Метод Борда',
    'Plurality': 'Простое большинство'
  };

  const getMethodResult = (methodKey) => {
    return results.results?.[methodKey] || results[methodKey.toLowerCase()];
  };

  const currentResult = getMethodResult(selectedMethod);

  const getAlternativeName = (id) => {
    return alternatives.find(a => a.id === id)?.name || 'Неизвестно';
  };

  return (
    <div className="results-display">
      <div className="method-selector">
        <h3>Выберите метод подсчета:</h3>
        <div className="method-buttons">
          {Object.entries(methods).map(([key, label]) => (
            <button
              key={key}
              className={`method-btn ${selectedMethod === key ? 'active' : ''}`}
              onClick={() => setSelectedMethod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {currentResult && (
        <div className="result-content">
          <div className="winner-card">
            <div className="winner-icon">🏆</div>
            <div className="winner-info">
              <h2>Победитель</h2>
              <h3>{currentResult.winnerName || 'Не определен'}</h3>
              <p className="winner-explanation">{currentResult.explanation}</p>
            </div>
          </div>

          <div className="rankings-section">
            <h3>Полное ранжирование</h3>
            <div className="rankings-list">
              {currentResult.rankings && currentResult.rankings.map((item) => (
                <div key={item.alternativeId} className="ranking-item">
                  <div className="ranking-position">
                    {item.rank === 1 && '🥇'}
                    {item.rank === 2 && '🥈'}
                    {item.rank === 3 && '🥉'}
                    {item.rank > 3 && `#${item.rank}`}
                  </div>
                  <div className="ranking-details">
                    <h4>{item.name}</h4>
                    <div className="ranking-score">
                      Баллы: <strong>{item.score.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="ranking-bar">
                    <div 
                      className="ranking-bar-fill"
                      style={{ 
                        width: `${(item.score / (currentResult.rankings[0]?.score || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedMethod === 'Condorcet' && currentResult.metrics?.pairwiseMatrix && (
            <div className="metrics-section">
              <h3>Матрица попарных сравнений</h3>
              <p className="metrics-help">
                Показывает, сколько раз каждая альтернатива была предпочтена другой в парных сравнениях.
              </p>
              <div className="pairwise-info">
                <p><strong>Победитель Кондорсе:</strong> альтернатива, которая побеждает все остальные в парных сравнениях.</p>
                {!currentResult.metrics.hasCondorcetWinner && (
                  <div className="alert alert-warning">
                    ⚠️ Обнаружен парадокс Кондорсе: не существует альтернативы, побеждающей все остальные.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {results.analysis && (
        <div className="analysis-section">
          <h3>Сравнительный анализ методов</h3>
          <div className="analysis-content">
            <p>{results.analysis}</p>
          </div>
          
          <div className="methods-comparison">
            <h4>Результаты по всем методам:</h4>
            <div className="comparison-grid">
              {Object.entries(methods).map(([key, label]) => {
                const result = getMethodResult(key);
                return (
                  <div key={key} className="comparison-item">
                    <h5>{label}</h5>
                    <p className="comparison-winner">
                      {result?.winnerName || 'Не определен'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="theory-section">
            <h4>О методах голосования:</h4>
            <div className="theory-grid">
              <div className="theory-item">
                <h5>Метод Кондорсе</h5>
                <p>
                  Основан на попарном сравнении альтернатив. Победитель Кондорсе - это альтернатива,
                  которая побеждает все остальные в парных сравнениях. Может не существовать (парадокс Кондорсе).
                </p>
              </div>
              <div className="theory-item">
                <h5>Метод Кемени-Янга</h5>
                <p>
                  Находит оптимальное ранжирование, максимизирующее согласованность с парными предпочтениями избирателей.
                  Всегда дает однозначный результат, но вычислительно сложен.
                </p>
              </div>
              <div className="theory-item">
                <h5>Метод Борда</h5>
                <p>
                  Каждому месту в ранжировании присваивается балл. Первое место = n-1 баллов, второе = n-2, и т.д.
                  Побеждает альтернатива с наибольшей суммой баллов.
                </p>
              </div>
              <div className="theory-item">
                <h5>Простое большинство</h5>
                <p>
                  Учитывает только первые места в ранжировании избирателей. Самый простой метод,
                  но может игнорировать важную информацию о предпочтениях.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
