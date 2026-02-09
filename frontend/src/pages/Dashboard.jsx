import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Добро пожаловать, {user?.username}! 👋</h1>
          <p className="dashboard-subtitle">
            Система рекомендаций мероприятий на основе методов Condorcet и Kemeny-Young
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon">👥</div>
          <h3>Мои группы</h3>
          <p className="dashboard-card-value">{groups.length}</p>
          <Link to="/groups" className="btn btn-primary">
            Перейти к группам
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">📊</div>
          <h3>О системе</h3>
          <p className="dashboard-card-text">
            Используйте методы коллективного выбора для принятия групповых решений
          </p>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">🎯</div>
          <h3>Методы голосования</h3>
          <ul className="methods-list">
            <li><strong>Condorcet</strong> - попарное сравнение</li>
            <li><strong>Kemeny-Young</strong> - оптимальное ранжирование</li>
            <li><strong>Borda</strong> - балльная система</li>
            <li><strong>Plurality</strong> - простое большинство</li>
          </ul>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="recent-groups">
          <h2>Последние группы</h2>
          <div className="grid grid-3">
            {groups.slice(0, 3).map(group => (
              <Link 
                to={`/groups/${group.id}`} 
                key={group.id}
                className="card group-card-link"
              >
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <div className="group-meta">
                  <span>👥 {group.memberCount} участников</span>
                  <span className={`badge ${group.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {group.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
