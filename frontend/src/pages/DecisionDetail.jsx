import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { decisionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VotingInterface from '../components/VotingInterface';
import ResultsDisplay from '../components/ResultsDisplay';
import './DecisionDetail.css';

const DecisionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vote');
  const [results, setResults] = useState(null);
  const [calculatingResults, setCalculatingResults] = useState(false);

  useEffect(() => {
    loadDecision();
  }, [id]);

  const loadDecision = async () => {
    try {
      const response = await decisionsAPI.getById(id);
      setDecision(response.data);
    } catch (error) {
      console.error('Error loading decision:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (rankings) => {
    try {
      await decisionsAPI.submitVote(id, rankings);
      await loadDecision();
      alert('Голос успешно принят!');
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Ошибка при отправке голоса');
    }
  };

  const calculateResults = async (method = 'all') => {
    setCalculatingResults(true);
    try {
      const response = await decisionsAPI.calculateResults(id, method);
      setResults(response.data);
      setActiveTab('results');
    } catch (error) {
      console.error('Error calculating results:', error);
      alert('Ошибка при расчете результатов');
    } finally {
      setCalculatingResults(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!decision) {
    return <div className="container">Решение не найдено</div>;
  }

  const userVote = decision.userVote;
  const hasVoted = !!userVote;

  return (
    <div className="container decision-detail">
      <div className="decision-header-card">
        <div>
          <h1>{decision.title}</h1>
          <p className="decision-subtitle">{decision.description}</p>
          <div className="decision-meta">
            <span className={`badge ${
              decision.status === 'Active' ? 'badge-success' : 
              decision.status === 'Completed' ? 'badge-primary' : 'badge-danger'
            }`}>
              {decision.status === 'Active' ? 'Активно' : 
               decision.status === 'Completed' ? 'Завершено' : 'Отменено'}
            </span>
            <span>📋 {decision.alternatives.length} вариантов</span>
            <span>🗳️ {decision.votes.length} голосов</span>
            <span>{new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'vote' ? 'active' : ''}`}
          onClick={() => setActiveTab('vote')}
        >
          Голосование
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Результаты
        </button>
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Информация
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'vote' && (
          <div className="voting-tab">
            {decision.status !== 'Active' ? (
              <div className="alert alert-info">
                Голосование завершено. Перейдите на вкладку "Результаты" для просмотра итогов.
              </div>
            ) : (
              <>
                {hasVoted && (
                  <div className="alert alert-success">
                    ✓ Вы уже проголосовали. Вы можете изменить свой выбор, переупорядочив варианты.
                  </div>
                )}
                <VotingInterface
                  alternatives={decision.alternatives}
                  userVote={userVote}
                  onSubmit={handleVoteSubmit}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-tab">
            <div className="results-actions">
              <button 
                className="btn btn-primary"
                onClick={() => calculateResults('all')}
                disabled={calculatingResults || decision.votes.length === 0}
              >
                {calculatingResults ? 'Расчет...' : 'Рассчитать результаты'}
              </button>
              {decision.votes.length === 0 && (
                <p className="help-text">Необходимо минимум 1 голос для расчета результатов</p>
              )}
            </div>

            {results && <ResultsDisplay results={results} alternatives={decision.alternatives} />}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-card">
              <h3>Варианты для выбора</h3>
              <div className="alternatives-list">
                {decision.alternatives.map((alt, index) => (
                  <div key={alt.id} className="alternative-info-item">
                    <div className="alternative-number">{index + 1}</div>
                    <div>
                      <h4>{alt.name}</h4>
                      {alt.description && <p>{alt.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-card">
              <h3>Голоса участников ({decision.votes.length})</h3>
              <div className="votes-list">
                {decision.votes.map(vote => (
                  <div key={vote.id} className="vote-item">
                    <div className="vote-user">
                      <strong>{vote.username}</strong>
                      <span>{new Date(vote.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="vote-rankings">
                      {vote.rankings
                        .sort((a, b) => a.rank - b.rank)
                        .map((ranking, idx) => (
                          <span key={ranking.alternativeId} className="ranking-badge">
                            {idx + 1}. {decision.alternatives.find(a => a.id === ranking.alternativeId)?.name}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionDetail;
