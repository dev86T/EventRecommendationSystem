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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [deletingDecision, setDeletingDecision] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [groupRes, decisionsRes, usersRes] = await Promise.all([
        groupsAPI.getById(id),
        decisionsAPI.getGroupDecisions(id),
        usersAPI.getAll()
      ]);
      
      setGroup(groupRes.data);
      setDecisions(decisionsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await groupsAPI.addMember(id, selectedUserId);
      setShowAddMemberModal(false);
      setSelectedUserId('');
      loadData();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Ошибка добавления участника');
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
      await decisionsAPI.delete(decisionId);
      alert('Решение успешно удалено');
      loadData();
    } catch (error) {
      console.error('Error deleting decision:', error);
      alert(error.response?.data?.message || 'Ошибка удаления решения');
    } finally {
      setDeletingDecision(null);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!group) {
    return <div className="container">Группа не найдена</div>;
  }

  const availableUsers = users.filter(
    user => !group.members.some(member => member.userId === user.id)
  );

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
          <h1>{group.name}</h1>
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
        </div>
      </div>

      {showAddMemberModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Добавить участника</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Выберите пользователя</label>
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="form-control"
                >
                  <option value="">Выберите пользователя...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Добавить</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedUserId('');
                  }}
                >
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
            {group.members.map(member => (
              <div key={member.userId} className="member-item">
                <div className="member-avatar" style={{ fontSize: '32px' }}>
                  {getAnimalAvatar(member.user.email)}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.user.username}</div>
                </div>
                {member.isAdmin && <span className="badge badge-primary">Админ</span>}
              </div>
            ))}
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
