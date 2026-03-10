import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import './Groups.css';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const { t, language } = useLanguage();
  const dateLocale = { en: 'en-US', de: 'de-DE', ru: 'ru-RU' }[language] || 'en-US';

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
      alert(t('groups.errorCreating'));
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="container groups-page">
      <div className="page-header">
        <h1>{t('groups.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          {t('groups.createGroup')}
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h2>{t('groups.noGroupsTitle')}</h2>
          <p>{t('groups.noGroupsDesc')}</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            {t('groups.createFirstGroup')}
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {groups.map(group => (
            <Link to={`/groups/${group.id}`} key={group.id} className="card group-card">
              <div className="group-card-header">
                <h3>{group.name}</h3>
              </div>
              <p className="group-description">{group.description}</p>
              <div className="group-footer">
                <div className="group-info">
                  <span>👥 {group.memberCount} {t('common.participants')}</span>
                  <span>👤 {group.creator.username}</span>
                </div>
                <span className="group-date">
                  {new Date(group.createdAt).toLocaleDateString(dateLocale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('groups.modal.title')}</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>{t('groups.modal.nameLabel')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                  placeholder={t('groups.modal.namePlaceholder')}
                />
              </div>
              <div className="form-group">
                <label>{t('groups.modal.descLabel')}</label>
                <textarea
                  className="form-control"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder={t('groups.modal.descPlaceholder')}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('groups.modal.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('groups.modal.create')}
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
