import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decisionsAPI, groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VotingInterface from '../components/VotingInterface';
import ResultsDisplay from '../components/ResultsDisplay';
import './DecisionDetail.css';

const DecisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vote');
  const [results, setResults] = useState(null);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [completingVoting, setCompletingVoting] = useState(false);
  const [deletingDecision, setDeletingDecision] = useState(false);
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
          const response = await groupsAPI.getById(decision.groupId);
          const currentUserId = user?.id;
          setIsCreator(response.data.creatorId === currentUserId);
          console.log('[CREATOR CHECK]', {
            currentUserId,
            creatorId: response.data.creatorId,
            isCreator: response.data.creatorId === currentUserId
          });
        }
      } catch (err) {
        console.error('Error fetching group:', err);
      }
    };

    fetchGroup();
  }, [decision?.groupId, user?.id]);

  // Таймер обратного отсчёта
  useEffect(() => {
    console.log('[TIMER] Decision:', {
      hasDeadline: !!decision?.deadline,
      deadline: decision?.deadline,
      isCompleted: decision?.isCompleted
    });

    if (!decision?.deadline || decision?.isCompleted) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const deadline = new Date(decision.deadline);
      const now = new Date();
      const diff = deadline - now;

      console.log('[TIMER] Diff:', diff, 'ms');

      if (diff <= 0) {
        setTimeLeft('Время истекло');
        setTimeout(() => {
          console.log('[TIMER] Reloading page due to expired deadline');
          window.location.reload();
        }, 2000);
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
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}м ${seconds}с`);
      } else {
        setTimeLeft(`${seconds}с`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [decision?.deadline, decision?.isCompleted]);

  const loadDecision = async () => {
    try {
      console.log('[LOAD] Loading decision:', id);
      const response = await decisionsAPI.getById(id);
      console.log('[LOAD] Decision loaded:', response.data);
      setDecision(response.data);
    } catch (error) {
      console.error('Error loading decision:', error);
      setError('Ошибка загрузки решения');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (rankings) => {
    try {
      await decisionsAPI.submitVote(id, rankings);
      await loadDecision();
      setSuccess('Голос успешно принят!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Ошибка при отправке голоса');
      setTimeout(() => setError(''), 3000);
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
      setError('Ошибка при расчете результатов');
      setTimeout(() => setError(''), 3000);
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
      console.log('[COMPLETE] Completing voting for decision:', id);
      await decisionsAPI.complete(id);
      setSuccess('Голосование завершено!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Error completing voting:', err);
      setError(err.response?.data?.message || 'Ошибка при завершении голосования');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCompletingVoting(false);
    }
  };

  const handleDeleteDecision = async () => {
    const confirmText = 'Вы уверены, что хотите удалить это решение? Все голоса будут потеряны. Это действие НЕОБРАТИМО!';
    if (!window.confirm(confirmText)) {
      return;
    }

    // Двойное подтверждение для безопасности
    if (!window.confirm('Последнее предупреждение! Удалить решение?')) {
      return;
    }

    try {
      setDeletingDecision(true);
      setError('');
      console.log('[DELETE] Deleting decision:', id);
      
      // Используем прямой axios для DELETE запроса
      const api = (await import('../services/api')).default;
      await api.delete(`/decisions/${id}`);
      
      setSuccess('Решение удалено!');
      setTimeout(() => {
        navigate(`/groups/${decision.groupId}`);
      }, 1500);
    } catch (err) {
      console.error('Error deleting decision:', err);
      setError(err.response?.data?.message || 'Ошибка при удалении решения');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="container">
        <div className="alert alert-danger">Решение не найдено</div>
      </div>
    );
  }

  const userVote = decision.userVote;
  const hasVoted = !!userVote;

  return (
    <div className="container decision-detail">
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          {success}
        </div>
      )}

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

          {/* Прогресс бар голосования */}
          {!decision.isCompleted && decision.group && (
            <div style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              marginTop: '20px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>
                  📊 Прогресс голосования
                </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {decision.votes?.length || 0} / {decision.group.members?.length || 0}
                </span>
              </div>
              
              <div style={{
                height: '12px',
                background: 'var(--border-color)',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(((decision.votes?.length || 0) / (decision.group.members?.length || 1)) * 100)}%`,
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                }} />
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px' 
              }}>
                {decision.group.members?.map(member => {
                  const hasVoted = decision.votes?.some(v => v.userId === member.userId);
                  return (
                    <div key={member.userId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: hasVoted 
                        ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' 
                        : 'var(--border-color)',
                      color: hasVoted ? 'white' : 'var(--text-secondary)',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      boxShadow: hasVoted ? '0 2px 4px rgba(72, 187, 120, 0.3)' : 'none'
                    }}>
                      <span style={{ fontSize: '14px' }}>
                        {hasVoted ? '✓' : '○'}
                      </span>
                      {member.user?.username || 'Участник'}
                    </div>
                  );
                })}
              </div>
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
            <span>📋 {decision.alternatives?.length || 0} вариантов</span>
            <span>🗳️ {decision.votes?.length || 0} голосов</span>
            <span>📅 {new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>

          {/* Кнопки для создателя */}
          {isCreator && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!decision.isCompleted && (
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
                  {completingVoting ? 'Завершение...' : '🏁 Завершить голосование'}
                </button>
              )}
              
              <button 
                className="btn"
                onClick={handleDeleteDecision}
                disabled={deletingDecision}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none'
                }}
              >
                {deletingDecision ? 'Удаление...' : '🗑️ Удалить решение'}
              </button>
              
              <p style={{ 
                fontSize: '13px', 
                color: '#666', 
                marginTop: '8px',
                fontStyle: 'italic',
                flexBasis: '100%'
              }}>
                Только вы как создатель группы можете завершить или удалить голосование
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
            {decision.isBlindVoting && !decision.isCompleted ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '2px dashed #cbd5e0'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>👁️</div>
                <h3 style={{ marginBottom: '16px' }}>Слепое голосование</h3>
                <p style={{ fontSize: '16px', color: '#718096', maxWidth: '500px', margin: '0 auto' }}>
                  Результаты будут доступны после завершения голосования. 
                  Это помогает избежать влияния промежуточных результатов на выбор участников.
                </p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('vote')}
                  style={{ marginTop: '24px' }}
                >
                  ← Вернуться к голосованию
                </button>
              </div>
            ) : (
              <>
                <div className="results-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => calculateResults('all')}
                    disabled={calculatingResults || (decision.votes?.length || 0) === 0}
                  >
                    {calculatingResults ? 'Расчет...' : 'Рассчитать результаты'}
                  </button>
                  {(decision.votes?.length || 0) === 0 && (
                    <p className="help-text">Необходимо минимум 1 голос для расчета результатов</p>
                  )}
                </div>

                {results && <ResultsDisplay results={results} alternatives={decision.alternatives} />}
              </>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-card">
              <h3>Варианты для выбора</h3>
              <div className="alternatives-list">
                {decision.alternatives?.map((alt, index) => (
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
              <h3>Голоса участников ({decision.votes?.length || 0})</h3>
              {decision.isAnonymous && (
                <p style={{ 
                  padding: '12px', 
                  background: '#fef3c7', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  color: '#92400e'
                }}>
                  🕵️ Анонимное голосование: имена участников скрыты
                </p>
              )}
              <div className="votes-list">
                {decision.votes?.map((vote, index) => (
                  <div key={vote.id} className="vote-item">
                    <div className="vote-user">
                      <strong>
                        {decision.isAnonymous 
                          ? `🕵️ Участник #${index + 1}` 
                          : vote.username}
                      </strong>
                      <span>{new Date(vote.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="vote-rankings">
                      {vote.rankings
                        ?.sort((a, b) => a.rank - b.rank)
                        .map((ranking, idx) => (
                          <span key={ranking.alternativeId} className="ranking-badge">
                            {idx + 1}. {decision.alternatives?.find(a => a.id === ranking.alternativeId)?.name}
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
