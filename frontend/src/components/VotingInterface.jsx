import React, { useState, useEffect } from 'react';
import './VotingInterface.css';

const VotingInterface = ({ alternatives, userVote, onSubmit }) => {
  const [rankedAlternatives, setRankedAlternatives] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (userVote && userVote.rankings.length > 0) {
      // Восстановить сохраненный порядок
      const sorted = [...alternatives].sort((a, b) => {
        const rankA = userVote.rankings.find(r => r.alternativeId === a.id)?.rank || 999;
        const rankB = userVote.rankings.find(r => r.alternativeId === b.id)?.rank || 999;
        return rankA - rankB;
      });
      setRankedAlternatives(sorted);
    } else {
      // Начальный порядок
      setRankedAlternatives([...alternatives]);
    }
  }, [alternatives, userVote]);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...rankedAlternatives];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setRankedAlternatives(items);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = () => {
    const rankings = rankedAlternatives.map((alt, index) => ({
      alternativeId: alt.id,
      rank: index + 1
    }));
    onSubmit(rankings);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const items = [...rankedAlternatives];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setRankedAlternatives(items);
  };

  const moveDown = (index) => {
    if (index === rankedAlternatives.length - 1) return;
    const items = [...rankedAlternatives];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setRankedAlternatives(items);
  };

  return (
    <div className="voting-interface">
      <div className="voting-instructions">
        <h3>Проголосуйте, упорядочив варианты</h3>
        <p>
          Расположите варианты в порядке предпочтения: сверху - самый предпочтительный, снизу - наименее предпочтительный.
          Вы можете перетаскивать карточки или использовать стрелки.
        </p>
      </div>

      <div className="ranked-list">
        {rankedAlternatives.map((alt, index) => (
          <div
            key={alt.id}
            className={`ranked-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="rank-number">{index + 1}</div>
            <div className="alternative-content">
              <h4>{alt.name}</h4>
              {alt.description && <p>{alt.description}</p>}
            </div>
            <div className="rank-controls">
              <button
                type="button"
                className="rank-btn"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                title="Переместить выше"
              >
                ▲
              </button>
              <button
                type="button"
                className="rank-btn"
                onClick={() => moveDown(index)}
                disabled={index === rankedAlternatives.length - 1}
                title="Переместить ниже"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="voting-actions">
        <button className="btn btn-primary btn-large" onClick={handleSubmit}>
          {userVote ? 'Обновить голос' : 'Отправить голос'}
        </button>
      </div>

      <div className="voting-info">
        <h4>Как работает голосование:</h4>
        <ul>
          <li><strong>Ранжирование:</strong> Вы располагаете все варианты в порядке предпочтения</li>
          <li><strong>Методы подсчета:</strong> Ваш голос будет учтен при расчете результатов по разным методам</li>
          <li><strong>Condorcet:</strong> Определяет победителя через попарные сравнения</li>
          <li><strong>Kemeny-Young:</strong> Находит оптимальное ранжирование для группы</li>
        </ul>
      </div>
    </div>
  );
};

export default VotingInterface;
