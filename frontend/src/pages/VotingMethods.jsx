import React, { useState } from 'react';
import './VotingMethods.css';

const methods = [
  {
    id: 'plurality',
    icon: '🥇',
    name: 'Метод простого большинства (Plurality)',
    shortDesc: 'Побеждает вариант с наибольшим числом первых мест',
    color: '#48bb78',
    sections: [
      {
        title: 'Как работает',
        content: 'Каждый участник называет один любимый вариант. Побеждает тот, кто получил больше всего первых мест — независимо от того, насколько другие варианты нравятся участникам.'
      },
      {
        title: 'Преимущества',
        content: '✅ Максимально прост и понятен\n✅ Быстро подводится итог\n✅ Работает при большом числе участников'
      },
      {
        title: 'Недостатки',
        content: '❌ Игнорирует порядок предпочтений (второе место ничего не значит)\n❌ Может выбрать вариант, который большинство считает плохим\n❌ Уязвим к «спойлер-эффекту» — похожие варианты делят голоса'
      }
    ]
  },
  {
    id: 'borda',
    icon: '🔢',
    name: 'Метод Борда (Borda Count)',
    shortDesc: 'Каждое место даёт очки, побеждает сумма',
    color: '#4299e1',
    sections: [
      {
        title: 'Как работает',
        content: 'Участники ранжируют все варианты. За каждое место начисляются очки: первое место — N−1 очков, второе — N−2, ..., последнее — 0 (где N — число вариантов). Побеждает вариант с наибольшей суммой очков по всем участникам.'
      },
      {
        title: 'Преимущества',
        content: '✅ Учитывает полный порядок предпочтений\n✅ Обычно выбирает компромиссный вариант, устраивающий большинство\n✅ Прост в понимании'
      },
      {
        title: 'Недостатки',
        content: '❌ Добавление «заведомо слабого» варианта может изменить результат\n❌ Не всегда выбирает «честного победителя» при явном большинстве'
      }
    ]
  },
  {
    id: 'condorcet',
    icon: '⚔️',
    name: 'Метод Кондорсе (Condorcet)',
    shortDesc: 'Победитель, обыгрывающий всех остальных в парных сравнениях',
    color: '#9f7aea',
    sections: [
      {
        title: 'Как работает',
        content: 'На основе ранжирования каждый вариант сравнивается с каждым другим в «парных дуэлях». Побеждает тот, кто выигрывает у всех остальных попарно. Если такого нет — возникает «парадокс Кондорсе», и победитель не определяется.'
      },
      {
        title: 'Преимущества',
        content: '✅ Математически строгий и «справедливый»\n✅ Победитель — реально предпочтительнейший выбор большинства\n✅ Не зависит от «нерелевантных альтернатив»'
      },
      {
        title: 'Недостатки',
        content: '❌ Победитель может не существовать (цикл A > B > C > A)\n❌ Сложнее объяснить непосвящённым\n❌ Требует полного ранжирования'
      }
    ]
  },
  {
    id: 'kemeny',
    icon: '📐',
    name: 'Метод Кемени–Янга (Kemeny–Young)',
    shortDesc: 'Лучший итоговый рейтинг, минимизирующий несогласие',
    color: '#ed8936',
    sections: [
      {
        title: 'Как работает',
        content: 'Алгоритм перебирает все возможные итоговые рейтинги (порядки вариантов) и выбирает тот, который наиболее согласован с предпочтениями всех участников. «Согласованность» считается через число парных сравнений, в которых итоговый рейтинг совпадает с предпочтениями избирателей.'
      },
      {
        title: 'Преимущества',
        content: '✅ Самый теоретически обоснованный метод\n✅ Всегда даёт полный рейтинг, не только победителя\n✅ Максимально учитывает все голоса'
      },
      {
        title: 'Недостатки',
        content: '❌ Вычислительно сложный при большом числе вариантов\n❌ Сложно объяснить без математики\n❌ Практически применим при ≤ 8–10 вариантах'
      }
    ]
  }
];

const EXAMPLE = {
  scenario: 'Группа из 7 человек выбирает место для корпоратива. Варианты: 🍕 Пицца, 🍣 Суши, 🥩 Стейкхаус.',
  voters: [
    { count: 3, ranking: ['Пицца 🍕', 'Суши 🍣', 'Стейкхаус 🥩'], label: '3 голоса' },
    { count: 2, ranking: ['Суши 🍣', 'Стейкхаус 🥩', 'Пицца 🍕'], label: '2 голоса' },
    { count: 2, ranking: ['Стейкхаус 🥩', 'Суши 🍣', 'Пицца 🍕'], label: '2 голоса' },
  ],
  results: {
    plurality: {
      winner: 'Пицца 🍕',
      explanation: 'Первые места: Пицца — 3, Суши — 2, Стейкхаус — 2. Пицца побеждает, хотя 4 из 7 поставили её на последнее место.'
    },
    borda: {
      winner: 'Суши 🍣',
      explanation: '3 варианта → очки: 1 место = 2, 2 место = 1, 3 место = 0.\nПицца: 3×2 + 0×1 + 2×0 = 6\nСуши: 3×1 + 2×2 + 2×1 = 3+4+2 = 9\nСтейкхаус: 3×0 + 2×1 + 2×2 = 0+2+4 = 6\nПобеждают Суши — компромиссный вариант.'
    },
    condorcet: {
      winner: 'Суши 🍣',
      explanation: 'Суши vs Пицца: 4 против 3 → Суши побеждают.\nСуши vs Стейкхаус: 5 против 2 → Суши побеждают.\nСуши выигрывают у всех в парных дуэлях — победитель Кондорсе.'
    },
    kemeny: {
      winner: 'Суши 🍣 > Стейкхаус 🥩 > Пицца 🍕',
      explanation: 'Метод Кемени–Янга найдёт итоговый рейтинг, наиболее согласованный со всеми голосами. В данном примере — тот же победитель что и у Кондорсе, но дополнительно упорядочены 2-е и 3-е места.'
    }
  }
};

const VotingMethods = () => {
  const [activeMethod, setActiveMethod] = useState(null);

  return (
    <div className="container voting-methods-page">
      <div className="page-card">
        <h1>📊 Методы голосования</h1>
        <p className="page-subtitle">
          В системе используются четыре научных метода агрегации предпочтений. Каждый подходит для разных ситуаций.
        </p>

        <div className="methods-grid">
          {methods.map(method => (
            <div
              key={method.id}
              className={`method-card ${activeMethod === method.id ? 'expanded' : ''}`}
              style={{ borderTop: `4px solid ${method.color}` }}
            >
              <div
                className="method-card-header"
                onClick={() => setActiveMethod(activeMethod === method.id ? null : method.id)}
              >
                <div className="method-icon">{method.icon}</div>
                <div className="method-title-block">
                  <h2 className="method-name">{method.name}</h2>
                  <p className="method-short">{method.shortDesc}</p>
                </div>
                <div className="method-toggle">{activeMethod === method.id ? '▲' : '▼'}</div>
              </div>

              {activeMethod === method.id && (
                <div className="method-body">
                  {method.sections.map(section => (
                    <div key={section.title} className="method-section">
                      <h3>{section.title}</h3>
                      <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="example-section">
          <h2>🧪 Сравнение методов на одном примере</h2>
          <div className="example-scenario">
            <p>{EXAMPLE.scenario}</p>
          </div>

          <div className="example-votes">
            <h3>Как проголосовали участники:</h3>
            <div className="votes-table">
              {EXAMPLE.voters.map((v, i) => (
                <div key={i} className="votes-row">
                  <span className="votes-count">{v.label}</span>
                  <span className="votes-ranking">
                    {v.ranking.map((r, idx) => (
                      <span key={idx} className="rank-item">
                        <span className="rank-num">{idx + 1}</span>{r}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="example-results">
            <h3>Результаты по каждому методу:</h3>
            <div className="results-grid">
              {methods.map(method => {
                const result = EXAMPLE.results[method.id];
                return (
                  <div key={method.id} className="result-card" style={{ borderLeft: `4px solid ${method.color}` }}>
                    <div className="result-header">
                      <span>{method.icon}</span>
                      <strong>{method.name.split('(')[0].trim()}</strong>
                    </div>
                    <div className="result-winner">
                      🏆 <strong>{result.winner}</strong>
                    </div>
                    <p className="result-explanation" style={{ whiteSpace: 'pre-line' }}>
                      {result.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="example-takeaway">
            <h3>💡 Вывод</h3>
            <p>
              Метод простого большинства выбрал <strong>Пиццу</strong> — хотя 4 из 7 поставили её последней.
              Три других метода сошлись на <strong>Суши</strong> как на лучшем компромиссе.
              Это классический пример того, как разные методы дают разные ответы на одни и те же данные.
            </p>
            <p style={{ marginTop: '10px' }}>
              Для большинства групповых решений рекомендуется смотреть на <strong>Кондорсе</strong> или <strong>Борда</strong>
              — они лучше отражают коллективные предпочтения, чем простое большинство.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingMethods;
