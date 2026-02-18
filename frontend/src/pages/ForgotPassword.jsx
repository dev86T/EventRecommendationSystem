import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = email, 2 = код и новый пароль
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email
      });

      console.log('[FORGOT PASSWORD] Ответ:', response.data);

      setSuccess('Код восстановления отправлен на ваш email! Проверьте почту (включая спам).');
      setStep(2);
    } catch (err) {
      console.error('[FORGOT PASSWORD ERROR]', err);
      setError(err.response?.data?.message || 'Ошибка при отправке кода');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        resetCode,
        newPassword
      });

      setSuccess('Пароль успешно изменен! Теперь вы можете войти.');
      
      // Через 2 секунды редирект на логин
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error('[RESET PASSWORD ERROR]', err);
      setError(err.response?.data?.message || 'Ошибка при сбросе пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Восстановление пароля</h1>
        <p className="auth-subtitle">
          {step === 1 
            ? 'Введите email для получения кода восстановления' 
            : 'Введите код и новый пароль'}
        </p>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              📧 Проверьте свою почту! Мы отправили 6-значный код на <strong>{email}</strong>
              <br />
              <small>Не забудьте проверить папку "Спам"</small>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Код восстановления (6 цифр)</label>
              <input
                type="text"
                className="form-control"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                placeholder="123456"
                maxLength="6"
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
                placeholder="••••••••"
              />
            </div>
            
            <div className="form-group">
              <label>Подтвердите пароль</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Изменить пароль'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary btn-block"
              onClick={() => setStep(1)}
              style={{ marginTop: '10px' }}
            >
              Назад
            </button>
          </form>
        )}
        
        <p className="auth-footer">
          Вспомнили пароль? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
