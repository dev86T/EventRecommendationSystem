import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import './Groups.css';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupsAPI.create(newGroup);
      setShowModal(false);
      setNewGroup({ name: '', description: '' });
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Ошибка создания группы');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="container groups-page">
      <div className="page-header">
        <h1>Мои группы</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Создать группу
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h2>У вас пока нет групп</h2>
          <p>Создайте группу для начала совместного принятия решений</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Создать первую группу
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {groups.map(group => (
            <Link to={`/groups/${group.id}`} key={group.id} className="card group-card">
              <div className="group-card-header">
                <h3>{group.name}</h3>
                <span className={`badge ${group.isActive ? 'badge-success' : 'badge-warning'}`}>
                  {group.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </div>
              <p className="group-description">{group.description}</p>
              <div className="group-footer">
                <div className="group-info">
                  <span>👥 {group.memberCount} участников</span>
                  <span>👤 {group.creator.username}</span>
                </div>
                <span className="group-date">
                  {new Date(group.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Создать новую группу</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Название группы</label>
                <input
                  type="text"
                  className="form-control"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                  placeholder="Например: Выбор места для отдыха"
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  className="form-control"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Краткое описание группы и её целей"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
