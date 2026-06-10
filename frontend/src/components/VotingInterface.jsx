import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './VotingInterface.css';

const VotingInterface = ({ alternatives, userVote, onSubmit }) => {
  const [rankedAlternatives, setRankedAlternatives] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (userVote && userVote.rankings.length > 0) {
      const sorted = [...alternatives].sort((a, b) => {
        const rankA = userVote.rankings.find(r => r.alternativeId === a.id)?.rank || 999;
        const rankB = userVote.rankings.find(r => r.alternativeId === b.id)?.rank || 999;
        return rankA - rankB;
      });
      setRankedAlternatives(sorted);
    } else {
      setRankedAlternatives([...alternatives]);
    }
  }, [alternatives, userVote]);

  const handleDragStart = (index) => { setDraggedIndex(index); };

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

  const handleDragEnd = () => { setDraggedIndex(null); };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const rankings = rankedAlternatives.map((alt, index) => ({
        alternativeId: alt.id,
        rank: index + 1
      }));
      await onSubmit(rankings);
    } finally {
      setSubmitting(false);
    }
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
        <h3>{t('votingInterface.title')}</h3>
        <p>{t('votingInterface.description')}</p>
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
                title={t('votingInterface.moveUp')}
              >
                ▲
              </button>
              <button
                type="button"
                className="rank-btn"
                onClick={() => moveDown(index)}
                disabled={index === rankedAlternatives.length - 1}
                title={t('votingInterface.moveDown')}
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="voting-actions">
        <button className="btn btn-primary btn-large" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? t('common.saving')
            : userVote ? t('votingInterface.updateVote') : t('votingInterface.submitVote')}
        </button>
      </div>

      <div className="voting-info">
        <h4>{t('votingInterface.howItWorks')}</h4>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('votingInterface.rankingDesc') }} />
          <li dangerouslySetInnerHTML={{ __html: t('votingInterface.methodsDesc') }} />
          <li dangerouslySetInnerHTML={{ __html: t('votingInterface.condorcetDesc') }} />
          <li dangerouslySetInnerHTML={{ __html: t('votingInterface.kemenyDesc') }} />
        </ul>
      </div>
    </div>
  );
};

export default VotingInterface;
