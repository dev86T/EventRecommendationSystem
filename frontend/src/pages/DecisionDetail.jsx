import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
  const [timeLeft, setTimeLeft] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [completingVoting, setCompletingVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDecision();
  }, [id]);

  // Проверка, является ли пользователь создателем группы
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        if (decision?.groupId) {
          const response = await axios.get(`http://localhost:5000/api/groups/${decision.groupId}`);
          const currentUserId = user?.id;
          setIsCreator(response.data.creatorId === currentUserId);
        }
      } catch (err) {
        console.error('Error fetching group:', err);
      }
    };

    fetchGroup();
  }, [decision?.groupId, user?.id]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!decision?.deadline || decision?.isCompleted) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const deadline = new Date(decision.deadline);
      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('Время истекло');
        // Автоматически обновляем страницу через 2 секунды
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}д ${hours}ч ${minutes}м`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}ч ${minutes}м ${seconds}с`);
      } else {
        setTimeLeft(`${minutes}м ${seconds}с`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [decision?.deadline, decision?.isCompleted]);

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

  const handleCompleteVoting = async () => {
    if (!window.confirm('Вы уверены, что хотите завершить голосование? Это действие необратимо.')) {
      return;
    }

    try {
      setCompletingVoting(true);
      setError('');
      await axios.put(`http://localhost:5000/api/decisions/${id}/complete`);
      setSuccess('Голосование завершено!');
      // Обновляем страницу для получения свежих данных
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Error completing voting:', err);
      setError(err.response?.data?.message || 'Ошибка при завершении голосования');
    } finally {
      setCompletingVoting(false);
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
          
          {/* Информация о дедлайне и таймер */}
          {decision.deadline && (
            <div style={{ marginTop: '15px', marginBottom: '10px' }}>
              <p style={{ margin: '5px 0', color: '#555' }}>
                <strong>📅 Дедлайн:</strong> {new Date(decision.deadline).toLocaleString('ru-RU')}
              </p>
              {!decision.isCompleted && timeLeft && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  display: 'inline-block',
                  marginTop: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)'
                }}>
                  ⏱️ Осталось: {timeLeft}
                </div>
              )}
            </div>
          )}

          <div className="decision-meta">
            <span className={`badge ${
              decision.status === 'Active' ? 'badge-success' : 
              decision.status === 'Completed' ? 'badge-primary' : 'badge-danger'
            }`}>
              {decision.status === 'Active' ? '✅ Активно' : 
               decision.status === 'Completed' ? '🏁 Завершено' : '❌ Отменено'}
            </span>
            <span>📋 {decision.alternatives.length} вариантов</span>
            <span>🗳️ {decision.votes.length} голосов</span>
            <span>📅 {new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>

          {/* Кнопка завершения для создателя */}
          {!decision.isCompleted && isCreator && (
            <div style={{ marginTop: '15px' }}>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <button 
                className="btn btn-danger" 
                onClick={handleCompleteVoting}
                disabled={completingVoting}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {completingVoting ? 'Завершение...' : '🏁 Завершить голосование досрочно'}
              </button>
              <p style={{ 
                fontSize: '13px', 
                color: '#666', 
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                Только вы как создатель группы можете завершить голосование досрочно
              </p>
            </div>
          )}
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
          <div className="voting-tab" style={{ position: 'relative' }}>
            {decision.isCompleted && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '12px',
                minHeight: '400px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '40px 60px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  textAlign: 'center',
                  maxWidth: '500px'
                }}>
                  <div style={{ 
                    fontSize: '64px', 
                    marginBottom: '20px'
                  }}>
                    🏁
                  </div>
                  <h2 style={{ 
                    color: '#764ba2', 
                    marginBottom: '15px',
                    fontSize: '28px'
                  }}>
                    Голосование завершено
                  </h2>
                  <p style={{ 
                    color: '#666', 
                    fontSize: '16px',
                    marginBottom: '20px'
                  }}>
                    Спасибо всем за участие!
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('results')}
                    style={{ padding: '12px 32px', fontSize: '16px' }}
                  >
                    📊 Посмотреть результаты
                  </button>
                </div>
              </div>
            )}
            
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
