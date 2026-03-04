import React, { useEffect, useRef, useState } from 'react';
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
  const pdfRef = useRef(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vote');
  const [results, setResults] = useState(null);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [completingVoting, setCompletingVoting] = useState(false);
  const [deletingDecision, setDeletingDecision] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', isBlindVoting: false, isAnonymous: false, alternatives: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDecision();
  }, [id]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        if (decision?.groupId) {
          const response = await groupsAPI.getById(decision.groupId);
          const currentUserId = user?.id;
          const creatorCheck = response.data.creatorId === currentUserId ||
            String(response.data.creatorId) === String(currentUserId);
          const currentMember = response.data.members?.find(m =>
            m.userId === currentUserId || String(m.userId) === String(currentUserId));
          const adminCheck = currentMember?.isAdmin || false;
          setIsCreator(creatorCheck);
          setCanManage(creatorCheck || adminCheck);
        }
      } catch (err) {
        console.error('Error fetching group:', err);
      }
    };
    fetchGroup();
  }, [decision?.groupId, user?.id]);

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
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) setTimeLeft(`${days}д ${hours}ч ${minutes}м`);
      else if (hours > 0) setTimeLeft(`${hours}ч ${minutes}м ${seconds}с`);
      else if (minutes > 0) setTimeLeft(`${minutes}м ${seconds}с`);
      else setTimeLeft(`${seconds}с`);
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
    if (!window.confirm('Вы уверены, что хотите завершить голосование? Это действие необратимо.')) return;
    try {
      setCompletingVoting(true);
      setError('');
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
    if (!window.confirm('Вы уверены, что хотите удалить это решение? Все голоса будут потеряны. Это действие НЕОБРАТИМО!')) return;
    if (!window.confirm('Последнее предупреждение! Удалить решение?')) return;
    try {
      setDeletingDecision(true);
      setError('');
      const api = (await import('../services/api')).default;
      await api.delete(`/decisions/${id}`);
      setSuccess('Решение удалено!');
      setTimeout(() => navigate(`/groups/${decision.groupId}`), 1500);
    } catch (err) {
      console.error('Error deleting decision:', err);
      setError(err.response?.data?.message || 'Ошибка при удалении решения');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingDecision(false);
    }
  };

  const handleOpenEdit = () => {
    setEditData({
      title: decision.title,
      description: decision.description,
      isBlindVoting: decision.isBlindVoting,
      isAnonymous: decision.isAnonymous,
      alternatives: (decision.alternatives || []).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        isNew: false
      }))
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) return;
    setEditSaving(true);
    try {
      await decisionsAPI.updateDecision(id, {
        title: editData.title,
        description: editData.description,
        isBlindVoting: editData.isBlindVoting,
        isAnonymous: editData.isAnonymous
      });
      for (const alt of editData.alternatives) {
        if (alt.isNew) {
          if (alt.name.trim()) await decisionsAPI.addAlternative(id, { name: alt.name, description: alt.description });
        } else {
          await decisionsAPI.updateAlternative(id, alt.id, { name: alt.name, description: alt.description });
        }
      }
      setShowEditModal(false);
      await loadDecision();
      setSuccess('Решение успешно обновлено!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка обновления');
      setTimeout(() => setError(''), 3000);
    } finally {
      setEditSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

      // Load results if not yet calculated
      let currentResults = results;
      const canShowResults = decision.isCompleted || (!decision.isBlindVoting && (decision.votes?.length || 0) > 0);
      if (!currentResults && canShowResults) {
        try {
          const res = await decisionsAPI.calculateResults(id, 'all');
          currentResults = res.data;
          setResults(res.data);
        } catch (e) { /* skip if fails */ }
      }
      const altRows = (decision.alternatives || []).map((alt, i) => `
        <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f0f4f8;align-items:flex-start;">
          <span style="min-width:26px;height:26px;background:#667eea;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;flex-shrink:0;">${i+1}</span>
          <div><strong style="font-size:15px;">${esc(alt.name)}</strong>${alt.description ? `<p style="color:#718096;font-size:13px;margin:4px 0 0 0;">${esc(alt.description)}</p>` : ''}</div>
        </div>`).join('');

      const showVotes = (!decision.isBlindVoting || decision.isCompleted) && decision.votes?.length > 0;
      const voteRows = showVotes ? (decision.votes || []).map(vote => {
        const ranks = (vote.rankings || []).sort((a,b)=>a.rank-b.rank).map((r,idx)=>{
          const name = esc((decision.alternatives||[]).find(a=>a.id===r.alternativeId)?.name||'');
          return `<span style="background:#edf2f7;border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;font-size:12px;margin:2px;">${idx+1}. ${name}</span>`;
        }).join('');
        return `<div style="padding:10px 0;border-bottom:1px solid #f0f4f8;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <strong style="color:#2d3748;">${esc(decision.isAnonymous ? '🎭 Аноним' : vote.username)}</strong>
            <span style="font-size:12px;color:#a0aec0;">${new Date(vote.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${ranks}</div>
        </div>`;
      }).join('') : '';

      const metaParts = [
        `Статус: <strong>${decision.status==='Active'?'Активно':decision.status==='Completed'?'Завершено':'Отменено'}</strong>`,
        decision.deadline ? `Дедлайн: ${new Date(decision.deadline).toLocaleString('ru-RU')}` : null,
        decision.isBlindVoting ? '🙈 Слепое' : null,
        decision.isAnonymous ? '🎭 Анонимное' : null,
        `Голосов: ${decision.votes?.length||0}`,
        `Создано: ${new Date(decision.createdAt).toLocaleDateString('ru-RU')}`,
      ].filter(Boolean).join(' &nbsp;•&nbsp; ');

      const resultsHtml = currentResults ? (() => {
        const methodKeys = ['Condorcet', 'KemenyYoung', 'Borda', 'Plurality'];
        const methodNames = {
          'Condorcet': 'Метод Кондорсе',
          'KemenyYoung': 'Метод Кемени-Янга',
          'Borda': 'Метод Борда',
          'Plurality': 'Простое большинство',
        };
        const getResult = (key) => currentResults.results?.[key] || currentResults[key.toLowerCase()];
        const methodRows = methodKeys.map(key => {
          const r = getResult(key);
          if (!r?.winnerName) return '';
          const rankingRows = (r.rankings || []).slice(0, 3).map((item, idx) =>
            `<span style="background:#edf2f7;border:1px solid #e2e8f0;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px;">${['🥇','🥈','🥉'][idx]} ${esc(item.name)}</span>`
          ).join('');
          return `<div style="padding:8px 0;border-bottom:1px solid #f0f4f8;">
            <div style="font-size:13px;margin-bottom:4px;"><strong style="color:#4a5568;">${methodNames[key]}:</strong> <strong style="color:#2d3748;">${esc(r.winnerName)}</strong></div>
            ${rankingRows ? `<div style="display:flex;flex-wrap:wrap;gap:2px;">${rankingRows}</div>` : ''}
          </div>`;
        }).filter(Boolean).join('');
        if (!methodRows) return '';
        return `<div style="margin-bottom:28px;">
          <h2 style="font-size:17px;color:#2d3748;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px;">Результаты голосования</h2>
          ${methodRows}
          ${currentResults.analysis ? `<div style="margin-top:12px;padding:10px 14px;background:#ebf8ff;border:1px solid #90cdf4;border-radius:8px;font-size:13px;color:#2c5282;">${esc(currentResults.analysis)}</div>` : ''}
        </div>`;
      })() : '';

      const html = `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#333;padding:0;font-size:14px;">
        <div style="border-bottom:3px solid #667eea;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="font-size:26px;margin:0 0 10px 0;color:#1a202c;">${esc(decision.title)}</h1>
          ${decision.description ? `<p style="color:#4a5568;font-size:15px;margin:0 0 12px 0;">${esc(decision.description)}</p>` : ''}
          <div style="font-size:13px;color:#718096;">${metaParts}</div>
        </div>
        <div style="margin-bottom:28px;">
          <h2 style="font-size:17px;color:#2d3748;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px;">Варианты для выбора (${(decision.alternatives||[]).length})</h2>
          ${altRows}
        </div>
        ${showVotes ? `<div style="margin-bottom:28px;"><h2 style="font-size:17px;color:#2d3748;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px;">Голоса участников (${decision.votes.length})</h2>${voteRows}</div>` : ''}
        ${resultsHtml}
        <div style="margin-top:32px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#a0aec0;text-align:right;">Экспортировано: ${new Date().toLocaleString('ru-RU')}</div>
      </div>`;

      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set({
        margin: [15, 15, 15, 15],
        filename: `${decision.title || 'решение'}.pdf`,
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(html, 'string').save();
    } catch (err) {
      console.error('PDF error:', err);
      setError('Ошибка при создании PDF');
      setTimeout(() => setError(''), 3000);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleRepeat = () => {
    navigate(`/groups/${decision.groupId}/decisions/new`, {
      state: {
        prefill: {
          title: decision.title,
          description: decision.description,
          isBlindVoting: decision.isBlindVoting,
          isAnonymous: decision.isAnonymous,
          alternatives: (decision.alternatives || []).map(a => ({ name: a.name, description: a.description || '' }))
        }
      }
    });
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
    <>
      <div className="container decision-detail">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>
        )}

        <div className="decision-header-card">
          <div>
            <h1>{decision.title}</h1>
            <p className="decision-subtitle">{decision.description}</p>

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
              {decision.isBlindVoting && (
                <span className="badge" style={{ background: '#4a5568', color: 'white' }} title="Участники не видят чужие голоса во время голосования">
                  🙈 Слепое
                </span>
              )}
              {decision.isAnonymous && (
                <span className="badge" style={{ background: '#6b46c1', color: 'white' }} title="Имена участников скрыты">
                  🎭 Анонимное
                </span>
              )}
              <span>📋 {decision.alternatives?.length || 0} вариантов</span>
              <span>🗳️ {decision.votes?.length || 0} голосов</span>
              <span>📅 {new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>

            <div className="decision-actions">
              {canManage && !decision.isCompleted && (
                <button
                  className="btn btn-danger btn-complete"
                  onClick={handleCompleteVoting}
                  disabled={completingVoting}
                >
                  {completingVoting ? 'Завершение...' : '🏁 Завершить голосование'}
                </button>
              )}
              <div className="decision-icon-btns">
                {canManage && (
                  <>
                    <button className="action-btn" onClick={handleOpenEdit} title="Редактировать">✏️</button>
                    <button className="action-btn action-btn-repeat" onClick={handleRepeat} title="Повторить решение">🔄</button>
                    <button className="action-btn action-btn-danger" onClick={handleDeleteDecision} disabled={deletingDecision} title="Удалить решение">
                      {deletingDecision ? '⏳' : '🗑️'}
                    </button>
                  </>
                )}
                <button className="action-btn action-btn-pdf" onClick={handleExportPDF} disabled={exportingPdf} title="Скачать PDF">
                  {exportingPdf ? '⏳' : '📄'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'vote' ? 'active' : ''}`} onClick={() => setActiveTab('vote')}>
            Голосование
          </button>
          <button className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            Результаты
          </button>
          <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            Информация
          </button>
        </div>

        <div className="tab-content" key={activeTab}>
          {activeTab === 'vote' && (
            <div className="voting-tab" style={{ position: 'relative' }}>
              {decision.isCompleted && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10, borderRadius: '12px', minHeight: '400px'
                }}>
                  <div style={{
                    background: 'white', padding: '40px 60px', borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', textAlign: 'center', maxWidth: '500px'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏁</div>
                    <h2 style={{ color: '#764ba2', marginBottom: '15px', fontSize: '28px' }}>Голосование завершено</h2>
                    <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>Спасибо всем за участие!</p>
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
                  disabled={calculatingResults || (decision.votes?.length || 0) === 0}
                >
                  {calculatingResults ? 'Расчет...' : 'Рассчитать результаты'}
                </button>
                {(decision.votes?.length || 0) === 0 && (
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
                {decision.isBlindVoting && !decision.isCompleted && (
                  <div style={{
                    background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '8px',
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#4a5568'
                  }}>
                    <span style={{ fontSize: '24px' }}>🙈</span>
                    <div>
                      <strong>Слепое голосование активно</strong>
                      <div style={{ fontSize: '13px', marginTop: '2px' }}>
                        Голоса других участников скрыты до завершения голосования
                      </div>
                    </div>
                  </div>
                )}
                {(!decision.isBlindVoting || decision.isCompleted) && (
                  <div className="votes-list">
                    {decision.votes?.length === 0 && (
                      <p style={{ color: '#666' }}>Пока никто не проголосовал</p>
                    )}
                    {decision.votes?.map(vote => (
                      <div key={vote.id} className="vote-item">
                        <div className="vote-user">
                          <strong>{decision.isAnonymous ? '🎭 Аноним' : vote.username}</strong>
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print-only report — shown only via Ctrl+P / @media print */}
      <div className="print-only">
        <div className="print-header">
          <h1>{decision.title}</h1>
          {decision.description && <p className="print-description">{decision.description}</p>}
          <div className="print-meta">
            <span>Статус: {decision.status === 'Active' ? 'Активно' : decision.status === 'Completed' ? 'Завершено' : 'Отменено'}</span>
            {decision.deadline && <span>Дедлайн: {new Date(decision.deadline).toLocaleString('ru-RU')}</span>}
            {decision.isBlindVoting && <span>🙈 Слепое голосование</span>}
            {decision.isAnonymous && <span>🎭 Анонимное</span>}
            <span>Голосов: {decision.votes?.length || 0}</span>
            <span>Создано: {new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        <div className="print-section">
          <h2>Варианты для выбора ({decision.alternatives?.length || 0})</h2>
          {decision.alternatives?.map((alt, i) => (
            <div key={alt.id} className="print-alternative">
              <span className="print-alt-num">{i + 1}</span>
              <div>
                <strong>{alt.name}</strong>
                {alt.description && <p>{alt.description}</p>}
              </div>
            </div>
          ))}
        </div>

        {(!decision.isBlindVoting || decision.isCompleted) && decision.votes?.length > 0 && (
          <div className="print-section">
            <h2>Голоса участников ({decision.votes.length})</h2>
            {decision.votes.map(vote => (
              <div key={vote.id} className="print-vote">
                <strong>{decision.isAnonymous ? '🎭 Аноним' : vote.username}</strong>
                <span>{new Date(vote.createdAt).toLocaleDateString('ru-RU')}</span>
                <div className="print-rankings">
                  {vote.rankings
                    ?.sort((a, b) => a.rank - b.rank)
                    .map((r, idx) => (
                      <span key={r.alternativeId} className="print-rank-badge">
                        {idx + 1}. {decision.alternatives?.find(a => a.id === r.alternativeId)?.name}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {results && (
          <div className="print-section">
            <h2>Результаты голосования</h2>
            {results.winner && (
              <div className="print-winner">
                🏆 Победитель: <strong>{decision.alternatives?.find(a => a.id === results.winner)?.name || results.winner}</strong>
              </div>
            )}
            {results.methods && results.methods.map(m => (
              <div key={m.method} className="print-method-result">
                <strong>{m.methodName || m.method}</strong>: {decision.alternatives?.find(a => a.id === m.winnerId)?.name}
              </div>
            ))}
          </div>
        )}

        <div className="print-footer">
          Экспортировано: {new Date().toLocaleString('ru-RU')}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setShowEditModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Редактировать решение</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                className="form-control"
                value={editData.title}
                onChange={(e) => setEditData(d => ({ ...d, title: e.target.value }))}
                placeholder="Название решения"
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                className="form-control"
                value={editData.description}
                onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))}
                placeholder="Описание"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>⚙️ Режим голосования</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editData.isBlindVoting}
                    onChange={(e) => setEditData(d => ({ ...d, isBlindVoting: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span><strong>🙈 Слепое голосование</strong> — участники не видят чужие голоса</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editData.isAnonymous}
                    onChange={(e) => setEditData(d => ({ ...d, isAnonymous: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span><strong>🎭 Анонимное голосование</strong> — имена участников скрыты</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Варианты для выбора</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {editData.alternatives.map((alt, idx) => (
                  <div key={idx} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#667eea', marginBottom: '8px' }}>
                      {alt.isNew ? '🆕 Новый вариант' : `Вариант ${idx + 1}`}
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      value={alt.name}
                      onChange={(e) => {
                        const alts = [...editData.alternatives];
                        alts[idx] = { ...alts[idx], name: e.target.value };
                        setEditData(d => ({ ...d, alternatives: alts }));
                      }}
                      placeholder="Название варианта"
                      style={{ marginBottom: '8px' }}
                    />
                    <textarea
                      className="form-control"
                      value={alt.description}
                      onChange={(e) => {
                        const alts = [...editData.alternatives];
                        alts[idx] = { ...alts[idx], description: e.target.value };
                        setEditData(d => ({ ...d, alternatives: alts }));
                      }}
                      placeholder="Описание (опционально)"
                      rows="2"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditData(d => ({ ...d, alternatives: [...d.alternatives, { name: '', description: '', isNew: true }] }))}
                  style={{ width: '100%' }}
                >
                  + Добавить вариант
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={editSaving || !editData.title.trim()}>
                {editSaving ? 'Сохранение...' : '💾 Сохранить'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={editSaving}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DecisionDetail;
