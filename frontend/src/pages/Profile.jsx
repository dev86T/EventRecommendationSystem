import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const ANIMAL_EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉',
  '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🦋', '🐌', '🐢', '🦔',
];

const Profile = () => {
  const { user, updateUser } = useAuth();

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
      setProfileMsg({ type: 'success', text: 'Профиль обновлён!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await profileAPI.changePassword({ oldPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Пароль успешно изменён!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Ошибка смены пароля' });
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
      setEmailMsg({ type: 'success', text: 'Код отправлен на новую почту. Проверьте входящие.' });
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || 'Ошибка запроса' });
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
      setEmailMsg({ type: 'success', text: 'Почта успешно изменена!' });
      setEmailStep('input');
      setNewEmail('');
      setEmailCode('');
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.response?.data?.message || 'Ошибка подтверждения' });
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
              <span>Мой код:</span>
              <strong>{user.userCode}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Section: Username + Avatar */}
      <div className="profile-section-card">
        <h2>Основные данные</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label>Имя пользователя</label>
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
            <label>Выбор аватара</label>
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
            {profileLoading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Section: Change Password */}
      <div className="profile-section-card">
        <h2>Смена пароля</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Текущий пароль</label>
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
            <label>Новый пароль</label>
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
            <label>Подтверждение нового пароля</label>
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
            {passwordLoading ? 'Меняем...' : 'Изменить пароль'}
          </button>
        </form>
      </div>

      {/* Section: Change Email */}
      <div className="profile-section-card">
        <h2>Смена почты</h2>
        <p className="profile-section-desc">Текущая почта: <strong>{user?.email}</strong></p>

        {emailStep === 'input' ? (
          <form onSubmit={handleRequestEmailChange}>
            <div className="form-group">
              <label>Новая почта</label>
              <input
                type="email"
                className="form-control"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="новый@email.com"
              />
            </div>

            {emailMsg && (
              <div className={`alert ${emailMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                {emailMsg.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={emailLoading}>
              {emailLoading ? 'Отправляем...' : 'Отправить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmEmailChange}>
            <p className="profile-section-desc">Введите код, отправленный на <strong>{newEmail}</strong>.</p>
            <div className="form-group">
              <label>Код подтверждения</label>
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
                {emailLoading ? 'Подтверждаем...' : 'Подтвердить'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setEmailStep('input'); setEmailMsg(null); setEmailCode(''); }}
              >
                Назад
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
