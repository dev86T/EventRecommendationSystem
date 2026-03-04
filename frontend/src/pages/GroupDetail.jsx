import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupsAPI, decisionsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './GroupDetail.css';

const getAnimalAvatar = (email) => {
  const animals = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
                   '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
                   '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌'];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash;
  }
  return animals[Math.abs(hash) % animals.length];
};

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [userCodeInput, setUserCodeInput] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [deletingDecision, setDeletingDecision] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const formatTime = (diff) => {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
      if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
      if (minutes > 0) return `${minutes}м ${seconds}с`;
      return `${seconds}с`;
    };

    const updateTimers = () => {
      const now = new Date();
      const updated = {};
      decisions.forEach(d => {
        const realStatus = typeof d.status === 'string' ? d.status :
          d.status === 0 ? 'Active' : d.status === 1 ? 'Completed' : 'Cancelled';
        if (realStatus !== 'Active' || !d.deadline) return;
        const diff = new Date(d.deadline) - now;
        updated[d.id] = diff > 0 ? formatTime(diff) : null;
      });
      setTimers(updated);
    };

    if (decisions.length === 0) return;
    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [decisions]);

  const loadData = async () => {
    try {
      const [groupRes, decisionsRes] = await Promise.all([
        groupsAPI.getById(id),
        decisionsAPI.getGroupDecisions(id),
      ]);

      setGroup(groupRes.data);
      setDecisions(decisionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    const code = userCodeInput.trim().toUpperCase();
    if (code.length !== 5) {
      setSearchError('Код должен содержать 5 символов');
      setFoundUser(null);
      return;
    }
    setSearching(true);
    setSearchError('');
    setFoundUser(null);
    try {
      const res = await usersAPI.findByCode(code);
      setFoundUser(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setSearchError('Пользователь с таким кодом не найден');
      } else {
        setSearchError('Ошибка поиска');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!foundUser) return;
    try {
      await groupsAPI.addMember(id, userCodeInput.trim().toUpperCase());
      setShowAddMemberModal(false);
      setUserCodeInput('');
      setFoundUser(null);
      setSearchError('');
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Ошибка добавления участника';
      setSearchError(msg);
    }
  };

  const handleRemoveMember = async (memberId, memberUsername) => {
    if (!window.confirm(`Удалить участника "${memberUsername}" из группы?`)) return;
    try {
      setRemovingMember(memberId);
      await groupsAPI.removeMember(id, memberId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления участника');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleDeleteDecision = async (decisionId, decisionTitle, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Вы уверены, что хотите удалить решение "${decisionTitle}"?`)) {
      return;
    }

    try {
      setDeletingDecision(decisionId);
      await decisionsAPI.deleteDecision(decisionId);
      alert('Решение успешно удалено');
      loadData();
    } catch (error) {
      console.error('Error deleting decision:', error);
      alert(error.response?.data?.message || 'Ошибка удаления решения');
    } finally {
      setDeletingDecision(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Вы уверены, что хотите удалить группу "${group.name}"? Это действие необратимо.`)) return;
    try {
      await groupsAPI.deleteGroup(id);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления группы');
    }
  };

  const handleOpenEditGroup = () => {
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || '');
    setShowEditGroupModal(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    setSavingGroup(true);
    try {
      await groupsAPI.update(id, { name: editGroupName, description: editGroupDescription });
      setShowEditGroupModal(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSavingGroup(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!group) {
    return <div className="container">Группа не найдена</div>;
  }

  // Проверяем, является ли пользователь создателем или админом
  const isCreator = group.creatorId === user?.id || String(group.creatorId) === String(user?.id);
  
  // Проверяем, является ли пользователь админом группы
  const currentMember = group.members.find(m => m.userId === user?.id || String(m.userId) === String(user?.id));
  const isAdmin = currentMember?.isAdmin || false;
  
  // Может удалять: создатель ИЛИ админ
  const canDelete = isCreator || isAdmin;

  console.log('[GROUP DETAIL] Permissions check:', {
    creatorId: group.creatorId,
    userId: user?.id,
    isCreator,
    isAdmin,
    canDelete,
    currentMember
  });

  return (
    <div className="container group-detail">
      <div className="group-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0 }}>{group.name}</h1>
            {isCreator && (
              <button
                className="btn-icon-subtle"
                onClick={handleOpenEditGroup}
                title="Редактировать группу"
              >
                ✏️
              </button>
            )}
          </div>
          <p className="group-subtitle">{group.description}</p>
          <div className="group-meta-info">
            <span>Создатель: {group.creator.username}</span>
            <span>Участников: {group.members.length}</span>
            <span>Создано: {new Date(group.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        <div className="group-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddMemberModal(true)}>
            + Добавить участника
          </button>
          <Link to={`/groups/${id}/decisions/new`} className="btn btn-primary">
            + Создать решение
          </Link>
          {isCreator && (
            <button className="btn btn-danger" onClick={handleDeleteGroup} title="Удалить группу">
              🗑️ Удалить группу
            </button>
          )}
        </div>
      </div>

      {showAddMemberModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Добавить участника</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Уникальный код пользователя</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={userCodeInput}
                    onChange={(e) => {
                      setUserCodeInput(e.target.value.toUpperCase());
                      setFoundUser(null);
                      setSearchError('');
                    }}
                    placeholder="Например: AB3X7"
                    maxLength={5}
                    className="form-control"
                    style={{ fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSearchUser}
                    disabled={searching}
                  >
                    {searching ? '...' : 'Найти'}
                  </button>
                </div>
              </div>

              {searchError && (
                <div style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>
                  {searchError}
                </div>
              )}

              {foundUser && (
                <div style={{
                  background: '#f0fff4',
                  border: '1px solid #68d391',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{foundUser.username}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>код: {foundUser.userCode}</div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!foundUser}
                >
                  Добавить
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setUserCodeInput('');
                    setFoundUser(null);
                    setSearchError('');
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditGroupModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Редактировать группу</h2>
              <button className="modal-close" onClick={() => setShowEditGroupModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveGroup}>
              <div className="form-group">
                <label>Название группы *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  className="form-control"
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={savingGroup}>
                  {savingGroup ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditGroupModal(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="group-content">
        <div className="members-section">
          <h2>Участники</h2>
          <div className="members-list">
            {group.members.map(member => {
              const isThisCreator = String(member.userId) === String(group.creatorId);
              const canRemove = canDelete && !isThisCreator;
              return (
                <div key={member.userId} className="member-item">
                  <div className="member-avatar" style={{ fontSize: '32px' }}>
                    {member.user.avatarEmoji || getAnimalAvatar(member.user.email)}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.user.username}</div>
                  </div>
                  {isThisCreator && <span className="badge badge-warning">Создатель</span>}
                  {!isThisCreator && member.isAdmin && <span className="badge badge-primary">Админ</span>}
                  {canRemove && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.userId, member.user.username)}
                      disabled={removingMember === member.userId}
                      title="Удалить из группы"
                      style={{ marginLeft: 'auto' }}
                    >
                      {removingMember === member.userId ? '⏳' : '✕'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="decisions-section">
          <h2>Решения группы</h2>
          {decisions.length === 0 ? (
            <div className="empty-decisions">
              <p>Решений пока нет</p>
              <Link to={`/groups/${id}/decisions/new`} className="btn btn-primary">
                Создать первое решение
              </Link>
            </div>
          ) : (
            <div className="decisions-list">
              {decisions.map(decision => {
                const realStatus = typeof decision.status === 'string' ? decision.status : 
                  decision.status === 0 ? 'Active' :
                  decision.status === 1 ? 'Completed' : 'Cancelled';

                return (
                  <div key={decision.id} className="card decision-card" style={{ position: 'relative' }}>
                    <Link 
                      to={`/decisions/${decision.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <div className="decision-header">
                        <h3>{decision.title}</h3>
                        <span className={`badge ${
                          realStatus === 'Active' ? 'badge-success' : 
                          realStatus === 'Completed' ? 'badge-primary' : 'badge-danger'
                        }`}>
                          {realStatus === 'Active' ? '✅ Активно' : 
                           realStatus === 'Completed' ? '🏁 Завершено' : '❌ Отменено'}
                        </span>
                      </div>
                      <p>{decision.description}</p>
                      <div className="decision-stats">
                        <span>📋 {decision.alternativesCount} вариантов</span>
                        <span>🗳️ {decision.votesCount} голосов</span>
                        <span>📅 {new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                      {realStatus === 'Active' && timers[decision.id] && (
                        <div className="decision-deadline-timer">
                          ⏱ {timers[decision.id]}
                        </div>
                      )}
                      {group && group.members && (
                        <div className="vote-progress-wrapper">
                          <div className="vote-progress-label">
                            {decision.votesCount}/{group.members.length} проголосовали
                          </div>
                          <div className="vote-progress-bar">
                            <div
                              className="vote-progress-fill"
                              style={{
                                width: `${group.members.length > 0
                                  ? Math.min(100, (decision.votesCount / group.members.length) * 100)
                                  : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                    
                    {canDelete && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDeleteDecision(decision.id, decision.title, e)}
                        disabled={deletingDecision === decision.id}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '150px',  // Сдвинули влево от бейджа статуса
                          padding: '8px 12px',
                          fontSize: '16px',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        title="Удалить решение"
                      >
                        {deletingDecision === decision.id ? '⏳' : '🗑️'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
