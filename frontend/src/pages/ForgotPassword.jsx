import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      console.log('[FORGOT PASSWORD] Ответ:', response.data);
      setSuccess(t('forgotPassword.codeSent'));
      setStep(2);
    } catch (err) {
      console.error('[FORGOT PASSWORD ERROR]', err);
      setError(err.response?.data?.message || t('forgotPassword.sendCodeError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.passwordsMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('forgotPassword.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        resetCode,
        newPassword
      });

      setSuccess(t('forgotPassword.passwordChanged'));
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch (err) {
      console.error('[RESET PASSWORD ERROR]', err);
      setError(err.response?.data?.message || t('forgotPassword.resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('forgotPassword.title')}</h1>
        <p className="auth-subtitle">
          {step === 1 ? t('forgotPassword.step1Subtitle') : t('forgotPassword.step2Subtitle')}
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
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              📧 {t('forgotPassword.checkEmailHint')} <strong>{email}</strong>
              <br />
              <small>{t('forgotPassword.spamHint')}</small>
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
              <label>{t('forgotPassword.resetCode')}</label>
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
              <label>{t('forgotPassword.newPassword')}</label>
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
              <label>{t('forgotPassword.confirmPassword')}</label>
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
              {loading ? t('forgotPassword.saving') : t('forgotPassword.changePassword')}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setStep(1)}
              style={{ marginTop: '10px' }}
            >
              {t('forgotPassword.back')}
            </button>
          </form>
        )}

        <p className="auth-footer">
          {t('forgotPassword.rememberPassword')} <Link to="/login">{t('forgotPassword.signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
