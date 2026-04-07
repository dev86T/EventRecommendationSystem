import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, verifyRegistration } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('register.passwordsMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);
    const result = await register(email, username, password);

    if (result.success && result.pending) {
      setStep(2);
    } else if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.serverMessage || t('login.registerError'));
    }

    setLoading(false);
  };

  const handleVerify = async (e, codeOverride) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verifyRegistration(email, codeOverride ?? verificationCode);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.serverMessage || t('register.verifyError'));
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {loading && step === 1 && (
          <div className="auth-loading-overlay">
            <div className="auth-spinner" />
            <span className="auth-loading-text">{t('register.sendingCode')}</span>
          </div>
        )}

        <h1 className="auth-title">{t('register.title')}</h1>
        <p className="auth-subtitle">
          {step === 1 ? t('register.subtitle') : t('register.verifySubtitle')}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSubmit}>
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

            <div className="form-group">
              <label>{t('register.username')}</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="username"
              />
            </div>

            <div className="form-group">
              <label>{t('register.password')}</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label>{t('register.confirmPassword')}</label>
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
              {loading ? t('register.registering') : t('register.createAccount')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              📧 {t('register.checkEmailHint')} <strong>{email}</strong>
              <br />
              <small>{t('register.spamHint')}</small>
            </div>

            <div className="form-group">
              <label>{t('register.verificationCode')}</label>
              <input
                type="text"
                className="form-control"
                value={verificationCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(val);
                  if (val.length === 6) {
                    handleVerify(null, val);
                  }
                }}
                required
                placeholder="123456"
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? t('register.verifying') : t('register.confirmRegistration')}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => { setStep(1); setError(''); setVerificationCode(''); }}
              style={{ marginTop: '10px' }}
            >
              {t('register.back')}
            </button>
          </form>
        )}

        <p className="auth-footer">
          {t('register.alreadyHaveAccount')} <Link to="/login">{t('register.signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
