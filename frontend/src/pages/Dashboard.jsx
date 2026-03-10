import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Dashboard.css';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

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
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{t('dashboard.welcome', { username: user?.username })}</h1>
          <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon">👥</div>
          <h3>{t('dashboard.myGroups')}</h3>
          <p className="dashboard-card-value">{groups.length}</p>
          <Link to="/groups" className="btn btn-primary">
            {t('dashboard.goToGroups')}
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">📊</div>
          <h3>{t('dashboard.about')}</h3>
          <p className="dashboard-card-text">{t('dashboard.aboutDesc')}</p>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">🎯</div>
          <h3>{t('dashboard.votingMethods')}</h3>
          <ul className="methods-list">
            <li><strong>Condorcet</strong> - {t('dashboard.condorcetDesc')}</li>
            <li><strong>Kemeny-Young</strong> - {t('dashboard.kemenyDesc')}</li>
            <li><strong>Borda</strong> - {t('dashboard.bordaDesc')}</li>
            <li><strong>Plurality</strong> - {t('dashboard.pluralityDesc')}</li>
          </ul>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="recent-groups">
          <h2>{t('dashboard.recentGroups')}</h2>
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
                  <span>👥 {group.memberCount} {t('common.participants')}</span>
                  <span className={`badge ${group.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {group.isActive ? t('common.active') : t('common.inactive')}
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
