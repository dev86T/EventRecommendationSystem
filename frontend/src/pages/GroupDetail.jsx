import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupsAPI, decisionsAPI, usersAPI } from '../services/api';
import './GroupDetail.css';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

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

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!group) {
    return <div className="container">Группа не найдена</div>;
  }

  const availableUsers = users.filter(
    user => !group.members.some(member => member.userId === user.id)
  );

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

      <div className="group-content">
        <div className="members-section">
          <h2>Участники группы</h2>
          <div className="members-list">
            {group.members.map(member => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <div className="member-avatar">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="member-name">
                      {member.user.username}
                      {member.isAdmin && <span className="badge badge-primary">Админ</span>}
                    </div>
                    <div className="member-email">{member.user.email}</div>
                  </div>
                </div>
                <div className="member-date">
                  {new Date(member.joinedAt).toLocaleDateString('ru-RU')}
                </div>
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
              {decisions.map(decision => (
                <Link 
                  to={`/decisions/${decision.id}`} 
                  key={decision.id}
                  className="card decision-card"
                >
                  <div className="decision-header">
                    <h3>{decision.title}</h3>
                    <span className={`badge ${
                      decision.status === 'Active' ? 'badge-success' : 
                      decision.status === 'Completed' ? 'badge-primary' : 'badge-danger'
                    }`}>
                      {decision.status === 'Active' ? 'Активно' : 
                       decision.status === 'Completed' ? 'Завершено' : 'Отменено'}
                    </span>
                  </div>
                  <p>{decision.description}</p>
                  <div className="decision-stats">
                    <span>📋 {decision.alternativesCount} вариантов</span>
                    <span>🗳️ {decision.votesCount} голосов</span>
                    <span>{new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить участника</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Выберите пользователя</label>
                <select 
                  className="form-control"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">-- Выберите пользователя --</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
