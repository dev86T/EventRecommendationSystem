import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Profile.css';

const ANIMAL_EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉',
  '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🦋', '🐌', '🐢', '🦔',
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();

  // Profile data
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatarEmoji || '🐱');
  const [username, setUsername] = useState(user?.username || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailStep, setEmailStep] = useState('input'); // 'input' | 'confirm'
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  // Load fresh profile data on mount
  useEffect(() => {
    profileAPI.getMe().then(res => {
      setAvatarEmoji(res.data.avatarEmoji || '🐱');
      setUsername(res.data.username || '');
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await profileAPI.updateProfile({ username, avatarEmoji });
      updateUser({ username: res.data.username, avatarEmoji: res.data.avatarEmoji });
      setProfileMsg({ type: 'success', text: t('profile.profileUpdated') });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || t('profile.errorSaving') });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: t('profile.passwordsMismatch') });
      return;
    }
    if (newPassword === oldPassword) {
      setPasswordMsg({ type: 'error', text: t('profile.newPasswordSameAsOld') });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await profileAPI.changePassword({ oldPassword, newPassword });
      setPasswordMsg({ type: 'success', text: t('profile.passwordChanged') });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || t('profile.errorChangingPassword') });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      await profileAPI.requestEmailChange({ newEmail });
      setEmailStep('confirm');
      setEmailMsg({ type: 'success', text: t('profile.codeSent') });
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || t('profile.errorRequestingEmailChange') });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const res = await profileAPI.confirmEmailChange({ code: emailCode });
      updateUser({ email: res.data.email });
      setEmailMsg({ type: 'success', text: t('profile.emailChanged') });
      setEmailStep('input');
      setNewEmail('');
      setEmailCode('');
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || t('profile.errorConfirmingEmail') });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="container profile-page">
      {/* Header */}
      <div className="profile-header-card">
        <div className="profile-avatar-big">{avatarEmoji}</div>
        <div className="profile-header-info">
          <h1>{user?.username}</h1>
          <div className="profile-email">{user?.email}</div>
          {user?.userCode && (
            <div className="profile-code-badge">
              <span>{t('profile.myCode')}:</span>
              <strong>{user.userCode}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Section: Username + Avatar */}
      <div className="profile-section-card">
        <h2>{t('profile.basicInfo')}</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label>{t('profile.username')}</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>{t('profile.chooseAvatar')}</label>
            <div className="avatar-grid">
              {ANIMAL_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-btn ${avatarEmoji === emoji ? 'avatar-btn-selected' : ''}`}
                  onClick={() => setAvatarEmoji(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {profileMsg && (
            <div className={`alert ${profileMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {profileMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={profileLoading}>
            {profileLoading ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </div>

      {/* Section: Change Password */}
      <div className="profile-section-card">
        <h2>{t('profile.changePassword')}</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>{t('profile.currentPassword')}</label>
            <input
              type="password"
              className="form-control"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label>{t('profile.newPassword')}</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>{t('profile.confirmNewPassword')}</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {passwordMsg && (
            <div className={`alert ${passwordMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {passwordMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
            {passwordLoading ? t('profile.changing') : t('profile.changePasswordBtn')}
          </button>
        </form>
      </div>

      {/* Section: Change Email */}
      <div className="profile-section-card">
        <h2>{t('profile.changeEmail')}</h2>
        <p className="profile-section-desc">{t('profile.currentEmail')}: <strong>{user?.email}</strong></p>

        {emailStep === 'input' ? (
          <form onSubmit={handleRequestEmailChange}>
            <div className="form-group">
              <label>{t('profile.newEmail')}</label>
              <input
                type="email"
                className="form-control"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder={t('profile.newEmailPlaceholder')}
              />
            </div>

            {emailMsg && (
              <div className={`alert ${emailMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                {emailMsg.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={emailLoading}>
              {emailLoading ? t('profile.sending') : t('profile.sendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmEmailChange}>
            <p className="profile-section-desc">{t('profile.enterCode')} <strong>{newEmail}</strong>.</p>
            <div className="form-group">
              <label>{t('profile.confirmationCode')}</label>
              <input
                type="text"
                className="form-control"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                required
                maxLength={6}
                placeholder="123456"
                style={{ letterSpacing: '4px', fontSize: '20px', textAlign: 'center' }}
              />
            </div>

            {emailMsg && (
              <div className={`alert ${emailMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                {emailMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" disabled={emailLoading}>
                {emailLoading ? t('profile.confirming') : t('profile.confirmEmail')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setEmailStep('input'); setEmailMsg(null); setEmailCode(''); }}
              >
                {t('profile.back')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
