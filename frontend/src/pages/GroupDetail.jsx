import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupsAPI, decisionsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t, language } = useLanguage();

  const dateLocale = { en: 'en-US', de: 'de-DE', ru: 'ru-RU' }[language] || 'en-US';

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
  const [togglingAdmin, setTogglingAdmin] = useState(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const formatTime = (diff) => {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const d = t('groupDetail.timeSuffixes.days');
    const h = t('groupDetail.timeSuffixes.hours');
    const m = t('groupDetail.timeSuffixes.minutes');
    const s = t('groupDetail.timeSuffixes.seconds');
    if (days > 0) return `${days}${d} ${hours}${h} ${minutes}${m}`;
    if (hours > 0) return `${hours}${h} ${minutes}${m} ${seconds}${s}`;
    if (minutes > 0) return `${minutes}${m} ${seconds}${s}`;
    return `${seconds}${s}`;
  };

  useEffect(() => {
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
  }, [decisions, language]);

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
      setSearchError(t('groupDetail.addMemberModal.codeTooShort'));
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
        setSearchError(t('groupDetail.addMemberModal.userNotFound'));
      } else {
        setSearchError(t('groupDetail.addMemberModal.searchError'));
      }
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!foundUser) {
      await handleSearchUser();
      return;
    }
    try {
      await groupsAPI.addMember(id, userCodeInput.trim().toUpperCase());
      setShowAddMemberModal(false);
      setUserCodeInput('');
      setFoundUser(null);
      setSearchError('');
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || t('groupDetail.errorAddingMember');
      setSearchError(msg);
    }
  };

  const handleToggleAdmin = async (memberId, memberUsername, currentIsAdmin) => {
    const confirmKey = currentIsAdmin
      ? t('groupDetail.confirmRemoveAdmin', { username: memberUsername })
      : t('groupDetail.confirmMakeAdmin', { username: memberUsername });
    if (!window.confirm(confirmKey)) return;
    try {
      setTogglingAdmin(memberId);
      await groupsAPI.toggleAdmin(id, memberId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || t('groupDetail.errorTogglingAdmin'));
    } finally {
      setTogglingAdmin(null);
    }
  };

  const handleRemoveMember = async (memberId, memberUsername) => {
    if (!window.confirm(t('groupDetail.confirmRemoveMember', { username: memberUsername }))) return;
    try {
      setRemovingMember(memberId);
      await groupsAPI.removeMember(id, memberId);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || t('groupDetail.errorRemovingMember'));
    } finally {
      setRemovingMember(null);
    }
  };

  const handleDeleteDecision = async (decisionId, decisionTitle, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(t('groupDetail.confirmDeleteDecision', { title: decisionTitle }))) {
      return;
    }

    try {
      setDeletingDecision(decisionId);
      await decisionsAPI.deleteDecision(decisionId);
      alert(t('groupDetail.decisionDeleted'));
      loadData();
    } catch (error) {
      console.error('Error deleting decision:', error);
      alert(error.response?.data?.message || t('groupDetail.errorDeletingDecision'));
    } finally {
      setDeletingDecision(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(t('groupDetail.confirmDeleteGroup', { name: group.name }))) return;
    try {
      await groupsAPI.deleteGroup(id);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.message || t('groupDetail.errorDeletingGroup'));
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
      alert(error.response?.data?.message || t('common.error'));
    } finally {
      setSavingGroup(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!group) {
    return <div className="container">{t('groupDetail.groupNotFound')}</div>;
  }

  // Check if the user is creator or admin
  const isCreator = group.creatorId === user?.id || String(group.creatorId) === String(user?.id);

  // Check if the user is a group admin
  const currentMember = group.members.find(m => m.userId === user?.id || String(m.userId) === String(user?.id));
  const isAdmin = currentMember?.isAdmin || false;

  // Can delete: creator OR admin
  const canDelete = isCreator || isAdmin;

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
                title={t('groupDetail.editGroup')}
              >
                ✏️
              </button>
            )}
          </div>
          <p className="group-subtitle">{group.description}</p>
          <div className="group-meta-info">
            <span>{t('groupDetail.creatorLabel')}: {group.creator.username}</span>
            <span>{t('groupDetail.membersLabel')}: {group.members.length}</span>
            <span>{t('groupDetail.createdLabel')}: {new Date(group.createdAt).toLocaleDateString(dateLocale)}</span>
          </div>
        </div>
        <div className="group-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddMemberModal(true)}>
            {t('groupDetail.addMember')}
          </button>
          <Link to={`/groups/${id}/decisions/new`} className="btn btn-primary">
            {t('groupDetail.createDecision')}
          </Link>
          {isCreator && (
            <button className="btn-icon-subtle btn-icon-danger" onClick={handleDeleteGroup} title={t('groupDetail.deleteGroup')}>
              🗑️
            </button>
          )}
        </div>
      </div>

      {showAddMemberModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{t('groupDetail.addMemberModal.title')}</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>{t('groupDetail.addMemberModal.codeLabel')}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={userCodeInput}
                    onChange={(e) => {
                      setUserCodeInput(e.target.value.toUpperCase());
                      setFoundUser(null);
                      setSearchError('');
                    }}
                    placeholder={t('groupDetail.addMemberModal.codePlaceholder')}
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
                    {searching ? '...' : t('groupDetail.addMemberModal.find')}
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
                    <div style={{ fontWeight: 600, color: '#1a202c' }}>{foundUser.username}</div>
                    <div style={{ fontSize: '12px', color: '#4a5568' }}>{t('common.code')}: {foundUser.userCode}</div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!foundUser}
                >
                  {t('groupDetail.addMemberModal.add')}
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
                  {t('groupDetail.addMemberModal.cancel')}
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
              <h2>{t('groupDetail.editGroupModal.title')}</h2>
              <button className="modal-close" onClick={() => setShowEditGroupModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveGroup}>
              <div className="form-group">
                <label>{t('groupDetail.editGroupModal.nameLabel')}</label>
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
                <label>{t('groupDetail.editGroupModal.descLabel')}</label>
                <textarea
                  className="form-control"
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  rows="3"
                  style={{ resize: 'none' }}
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={savingGroup}>
                  {savingGroup ? t('groupDetail.editGroupModal.saving') : t('groupDetail.editGroupModal.save')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditGroupModal(false)}>
                  {t('groupDetail.editGroupModal.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="group-content">
        <div className="members-section">
          <h2>{t('groupDetail.membersSection')}</h2>
          <div className="members-list">
            {group.members.map(member => {
              const isThisCreator = String(member.userId) === String(group.creatorId);
              const canRemove = canDelete && !isThisCreator;
              const displayName = member.user.username || member.user.email;
              return (
                <div key={member.userId} className="member-item">
                  <div className="member-avatar" style={{ fontSize: '32px' }}>
                    {member.user.avatarEmoji || getAnimalAvatar(member.user.email)}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{displayName}</div>
                  </div>
                  {isThisCreator && <span className="badge badge-warning">{t('common.creator')}</span>}
                  {!isThisCreator && member.isAdmin && <span className="badge badge-primary">{t('common.admin')}</span>}
                  {isCreator && !isThisCreator && (
                    <button
                      className={`btn-icon-subtle${member.isAdmin ? ' btn-icon-danger' : ''}`}
                      onClick={() => handleToggleAdmin(member.userId, displayName, member.isAdmin)}
                      disabled={togglingAdmin === member.userId}
                      title={member.isAdmin ? t('groupDetail.removeAdmin') : t('groupDetail.makeAdmin')}
                      style={{ marginLeft: canRemove ? '0' : 'auto' }}
                    >
                      {togglingAdmin === member.userId ? '⏳' : member.isAdmin ? '👑✕' : '👑'}
                    </button>
                  )}
                  {canRemove && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.userId, displayName)}
                      disabled={removingMember === member.userId}
                      title={t('common.delete')}
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
          <h2>{t('groupDetail.decisionsSection')}</h2>
          {decisions.length === 0 ? (
            <div className="empty-decisions">
              <p>{t('groupDetail.noDecisions')}</p>
              <Link to={`/groups/${id}/decisions/new`} className="btn btn-primary">
                {t('groupDetail.createFirst')}
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
                          {realStatus === 'Active' ? t('groupDetail.statusActive') :
                           realStatus === 'Completed' ? t('groupDetail.statusCompleted') : t('groupDetail.statusCancelled')}
                        </span>
                      </div>
                      <p>{decision.description}</p>
                      <div className="decision-stats">
                        <span>📋 {decision.alternativesCount} {t('groupDetail.alternatives')}</span>
                        <span>🗳️ {decision.votesCount} {t('groupDetail.voted')}</span>
                        <span>📅 {new Date(decision.createdAt).toLocaleDateString(dateLocale)}</span>
                      </div>
                      {realStatus === 'Active' && timers[decision.id] && (
                        <div className="decision-deadline-timer">
                          ⏱ {timers[decision.id]}
                        </div>
                      )}
                      {group && group.members && (
                        <div className="vote-progress-wrapper">
                          <div className="vote-progress-label" aria-hidden="true">
                            {decision.votesCount}/{group.members.length} {t('groupDetail.voted')}
                          </div>
                          <div
                            className="vote-progress-bar"
                            role="progressbar"
                            aria-valuenow={decision.votesCount}
                            aria-valuemin={0}
                            aria-valuemax={group.members.length}
                            aria-label={`${decision.votesCount} ${t('groupDetail.voted')} ${group.members.length}`}
                          >
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
                          right: '150px',
                          padding: '8px 12px',
                          fontSize: '16px',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        title={t('common.delete')}
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
